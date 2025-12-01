import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TokenType } from '@prisma/__generated__'

import { MailService } from '@/libs/mail/mail.service'
import { PrismaService } from '@/prisma/prisma.service'

import { TwoFactorAuthService } from './two-factor-auth.service'

describe('TwoFactorAuthService', () => {
	let service: TwoFactorAuthService

	const mockPrismaService = {
		token: {
			findFirst: jest.fn(),
			delete: jest.fn(),
			create: jest.fn()
		}
	}

	const mockMailService = {
		sendTwoFactorToken: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TwoFactorAuthService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: MailService, useValue: mockMailService }
			]
		}).compile()

		service = module.get<TwoFactorAuthService>(TwoFactorAuthService)

		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('validateTwoFactorToken', () => {
		const email = 'test@test.com'
		const token = '123456'

		it('should throw NotFoundException if token does not exist', async () => {
			mockPrismaService.token.findFirst.mockResolvedValue(null)

			await expect(
				service.validateTwoFactorToken(email, token)
			).rejects.toThrow(NotFoundException)
		})

		it('should throw BadRequestException if token is invalid (mismatch)', async () => {
			mockPrismaService.token.findFirst.mockResolvedValue({
				token: '654321',
				expiresIn: new Date(Date.now() + 1000)
			})

			await expect(
				service.validateTwoFactorToken(email, token)
			).rejects.toThrow(BadRequestException)
		})

		it('should throw BadRequestException AND resend token if expired', async () => {
			mockPrismaService.token.findFirst
				.mockResolvedValueOnce({ email, token, expiresIn: new Date(0) })
				.mockResolvedValueOnce(null)

			mockPrismaService.token.create.mockResolvedValue({
				token: '567890',
				email
			})

			await expect(
				service.validateTwoFactorToken(email, token)
			).rejects.toThrow(BadRequestException)

			expect(mockMailService.sendTwoFactorToken).toHaveBeenCalled()
		})

		it('should return true and delete token if valid', async () => {
			const tokenId = 'id-1'

			mockPrismaService.token.findFirst.mockResolvedValue({
				id: tokenId,
				email,
				token: token,
				expiresIn: new Date(Date.now() + 1000)
			})

			const result = await service.validateTwoFactorToken(email, token)

			expect(result).toBe(true)

			expect(mockPrismaService.token.delete).toHaveBeenCalledWith({
				where: {
					id: tokenId,
					type: TokenType.TWO_FACTOR
				}
			})
		})
	})

	describe('sendTwoFactorToken', () => {
		it('should generate token, delete old one if exists, and send email', async () => {
			const email = 'test@test.com'
			const oldTokenId = 'old-id'

			mockPrismaService.token.findFirst.mockResolvedValue({
				id: oldTokenId,
				type: TokenType.TWO_FACTOR
			})

			const newToken = '12345'
			mockPrismaService.token.create.mockResolvedValue({
				email,
				token: newToken
			})

			await service.sendTwoFactorToken(email)

			expect(mockPrismaService.token.delete).toHaveBeenCalledWith({
				where: { id: oldTokenId, type: TokenType.TWO_FACTOR }
			})

			expect(mockPrismaService.token.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					email,
					type: TokenType.TWO_FACTOR,
					token: expect.any(String)
				})
			})

			expect(mockMailService.sendTwoFactorToken).toHaveBeenCalledWith(
				email,
				newToken
			)
		})
	})
})
