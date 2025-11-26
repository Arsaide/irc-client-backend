import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { TokenType } from '@prisma/client'
import { hash } from 'argon2'
import { v4 as uuidv4 } from 'uuid'

import { NewPasswordDto, ResetPasswordDto } from '@/auth/password-recovery/dto'
import { MailService } from '@/libs/mail/mail.service'
import { PrismaService } from '@/prisma/prisma.service'
import { UserService } from '@/user/user.service'

@Injectable()
export class PasswordRecoveryService {
	private readonly tokenTTL: number = 3600 * 1000

	public constructor(
		private readonly prisma: PrismaService,
		private readonly userService: UserService,
		private readonly mailService: MailService
	) {}

	public async resetPassword(dto: ResetPasswordDto) {
		const existingUser = await this.userService.findByEmail(dto.email)

		if (!existingUser) {
			throw new NotFoundException(
				'User not found. Please check your email and try again.'
			)
		}

		const passwordResetToken = await this.generateResetPasswordToken(
			existingUser.email
		)

		await this.mailService.sendResetPassword(
			passwordResetToken.email,
			passwordResetToken.token
		)
	}

	public async newPassword(dto: NewPasswordDto, token: string) {
		const existingToken = await this.prisma.token.findFirst({
			where: {
				token,
				type: TokenType.PASSWORD_RESET
			}
		})

		if (!existingToken) {
			throw new NotFoundException(
				'Token not found. Please check your token and request new one.'
			)
		}

		const hasExpired = new Date(existingToken.expiresIn) < new Date()

		if (hasExpired) {
			throw new BadRequestException(
				'Token has expired. Please, request new token for reset password.'
			)
		}

		const existingUser = await this.userService.findByEmail(
			existingToken.email
		)

		if (!existingUser) {
			throw new NotFoundException(
				'User with this email not found. Please check that you entered correct email.'
			)
		}

		await this.prisma.user.update({
			where: {
				id: existingUser.id
			},
			data: {
				password: await hash(dto.password)
			}
		})

		await this.prisma.token.delete({
			where: {
				id: existingToken.id,
				type: TokenType.PASSWORD_RESET
			}
		})

		return true
	}

	private async generateResetPasswordToken(email: string) {
		const token = uuidv4()
		const expiresIn = new Date(new Date().getTime() + this.tokenTTL)

		const existingToken = await this.prisma.token.findFirst({
			where: {
				email,
				type: TokenType.PASSWORD_RESET
			}
		})

		if (existingToken) {
			await this.prisma.token.delete({
				where: {
					id: existingToken.id,
					type: TokenType.PASSWORD_RESET
				}
			})
		}

		return this.prisma.token.create({
			data: {
				email,
				token,
				expiresIn,
				type: TokenType.PASSWORD_RESET
			}
		})
	}
}
