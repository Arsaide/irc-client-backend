import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { TokenType } from '@prisma/__generated__'

import { MailService } from '@/libs/mail/mail.service'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class TwoFactorAuthService {
	private readonly tokenTTL: number = 5 * 60 * 1000

	public constructor(
		private readonly prisma: PrismaService,
		private readonly mailService: MailService
	) {}

	public async validateTwoFactorToken(email: string, token: string) {
		const existingToken = await this.prisma.token.findFirst({
			where: {
				email,
				type: TokenType.TWO_FACTOR
			}
		})

		if (!existingToken) {
			throw new NotFoundException(
				'Two-Factor token not found. Please check your two-factor token.'
			)
		}

		if (existingToken.token !== token) {
			throw new BadRequestException(
				'Two-Factor token is invalid. Please, check your two-factor token.'
			)
		}

		const hasExpired = new Date(existingToken.expiresIn) < new Date()

		if (hasExpired) {
			await this.sendTwoFactorToken(existingToken.email)

			throw new BadRequestException(
				'Two-Factor token has expired. Please check your mail, we send a new token for authentication.'
			)
		}

		await this.prisma.token.delete({
			where: {
				id: existingToken.id,
				type: TokenType.TWO_FACTOR
			}
		})

		return true
	}

	public async sendTwoFactorToken(email: string) {
		const verificationToken = await this.generateTwoFactorToken(email)

		await this.mailService.sendTwoFactorToken(
			verificationToken.email,
			verificationToken.token
		)

		return true
	}

	private async generateTwoFactorToken(email: string) {
		const token = Math.floor(
			Math.random() * (1000000 - 100000) + 100000
		).toString()

		const expiresIn = new Date(new Date().getTime() + this.tokenTTL)

		const existingToken = await this.prisma.token.findFirst({
			where: {
				email,
				type: TokenType.TWO_FACTOR
			}
		})

		if (existingToken) {
			await this.prisma.token.delete({
				where: {
					id: existingToken.id,
					type: TokenType.TWO_FACTOR
				}
			})
		}

		return this.prisma.token.create({
			data: {
				email,
				token,
				expiresIn,
				type: TokenType.TWO_FACTOR
			}
		})
	}
}
