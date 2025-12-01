import {
	ConflictException,
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { User } from '@prisma/__generated__'
import { verify } from 'argon2'
import type { Request, Response } from 'express'

import { LoginDto, RegisterDto } from '@/auth/dto'
import { EmailConfirmationService } from '@/auth/email-confirmation/email-confirmation.service'
import { TwoFactorAuthService } from '@/auth/two-factor-auth/two-factor-auth.service'
import { parseBoolean } from '@/libs/common/utils'
import { PrismaService } from '@/prisma/prisma.service'
import { UserService } from '@/user/user.service'

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService,
		private readonly config: ConfigService,
		@Inject(forwardRef(() => EmailConfirmationService))
		private readonly emailConfirmationService: EmailConfirmationService,
		private readonly twoFactorAuthService: TwoFactorAuthService
	) {}

	public async register(dto: RegisterDto) {
		const isExist = await this.prisma.user.findUnique({
			where: { email: dto.email }
		})

		if (isExist) {
			if (!isExist.isVerified) {
				await this.emailConfirmationService.sendVerificationToken(
					isExist.email
				)
				throw new UnauthorizedException(
					'Email is not verified. Please check your email and verify your account.'
				)
			}

			throw new ConflictException(
				'User already exists. Please use another email'
			)
		}

		const newUser = await this.userService.create(
			dto.email,
			dto.password,
			dto.name,
			false
		)

		await this.emailConfirmationService.sendVerificationToken(newUser.email)

		return {
			message: `You are successfully registered. Please you need to verify your email "${dto.email}". Message with verification link has been sent to your email.`
		}
	}

	public async login(req: Request, dto: LoginDto) {
		const user = await this.userService.findByEmail(dto.email)

		if (!user) {
			throw new NotFoundException(
				'User not found. Please check your credentials or register.'
			)
		}

		if (user.password == null) {
			throw new UnauthorizedException(
				'This account uses OAuth login. Please login using OAuth and set a password first in your profile.'
			)
		}

		const isValidPassword = await verify(user.password, dto.password)

		if (!isValidPassword) {
			throw new UnauthorizedException(
				'Invalid password. Please try again or you can restore your password.'
			)
		}

		if (!user.isVerified) {
			await this.emailConfirmationService.sendVerificationToken(
				user.email
			)

			throw new UnauthorizedException(
				'Your account is not verified. Please check your email and verify your account.'
			)
		}

		if (user.isTwoFactorEnabled) {
			if (!dto.code) {
				await this.twoFactorAuthService.sendTwoFactorToken(user.email)

				return {
					message:
						'We send on your email letter with two-factor authentication code. Check your email and enter code.'
				}
			}

			await this.twoFactorAuthService.validateTwoFactorToken(
				user.email,
				dto.code
			)
		}

		return this.saveSession(req, user)
	}

	public async logout(req: Request, res: Response): Promise<void> {
		return new Promise((resolve, reject) => {
			req.session.destroy(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Session termination error. Something went wrong on the server, or your session has already expired.'
						)
					)
				}

				res.clearCookie(
					this.config.getOrThrow<string>('SESSION_NAME'),
					{
						domain: this.config.getOrThrow<string>(
							'SESSION_DOMAIN'
						),
						path: '/',
						httpOnly: parseBoolean(
							this.config.getOrThrow<string>('SESSION_HTTP_ONLY')
						),
						secure: parseBoolean(
							this.config.getOrThrow<string>('SESSION_SECURE')
						),
						sameSite: 'lax'
					}
				)
				resolve()
			})
		})
	}

	public async saveSession(req: Request, user: User) {
		const fullUser = await this.userService.findById(user.id)

		if (fullUser) {
			req.session.user = {
				id: fullUser.id,
				role: fullUser.role
			}
		}

		return new Promise((resolve, reject) => {
			req.session.save(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							`Failed to save session. Please check your session params. ${err}`
						)
					)
				}

				resolve(user)
			})
		})
	}
}
