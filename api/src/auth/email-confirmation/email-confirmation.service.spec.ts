import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TokenType } from '@prisma/__generated__'
import type { Request } from 'express'

import { AuthService } from '@/auth/auth.service'
import { ConfirmationDto } from '@/auth/email-confirmation/dto'
import { MailService } from '@/libs/mail/mail.service'
import { PrismaService } from '@/prisma/prisma.service'
import { UserService } from '@/user/user.service'

import { EmailConfirmationService } from './email-confirmation.service'

describe('EmailConfirmationService', () => {
	let service: EmailConfirmationService

	const mockPrismaService = {
		token: {
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			delete: jest.fn(),
			create: jest.fn()
		},
		user: {
			update: jest.fn()
		}
	}

	const mockMailService = {
		sendConfirmationEmail: jest.fn()
	}

	const mockUserService = {
		findByEmail: jest.fn()
	}

	const mockAuthService = {
		saveSession: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EmailConfirmationService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: MailService, useValue: mockMailService },
				{ provide: UserService, useValue: mockUserService },
				{ provide: AuthService, useValue: mockAuthService }
			]
		}).compile()

		service = module.get<EmailConfirmationService>(EmailConfirmationService)

		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('newVerification', () => {
		const dto: ConfirmationDto = { token: 'some-token' }
		const req = {} as Request

		it('should throw NotFoundException if token not found', async () => {
			mockPrismaService.token.findUnique.mockResolvedValue(null)

			await expect(service.newVerification(req, dto)).rejects.toThrow(
				NotFoundException
			)
		})

		it('should throw BadRequestException if token expired', async () => {
			mockPrismaService.token.findUnique.mockResolvedValue({
				token: dto.token,
				expiresIn: new Date(Date.now() - 1000)
			})

			await expect(service.newVerification(req, dto)).rejects.toThrow(
				BadRequestException
			)
		})

		it('should throw NotFoundException if user not found', async () => {
			mockPrismaService.token.findUnique.mockResolvedValue({
				token: dto.token,
				email: 'test@test.com',
				expiresIn: new Date(Date.now() + 1000)
			})

			mockUserService.findByEmail.mockResolvedValue(null)

			await expect(service.newVerification(req, dto)).rejects.toThrow(
				NotFoundException
			)
		})

		it('should verify user, delete token and save session', async () => {
			const user = { id: 'user-1', email: 'test@test.com' }
			const tokenData = {
				id: 'token-id',
				token: dto.token,
				email: user.email,
				expiresIn: new Date(Date.now() + 1000)
			}

			mockPrismaService.token.findUnique.mockResolvedValue(tokenData)
			mockUserService.findByEmail.mockResolvedValue(user)
			mockAuthService.saveSession.mockResolvedValue(user)

			const result = await service.newVerification(req, dto)

			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: user.id },
				data: { isVerified: true }
			})

			expect(mockPrismaService.token.delete).toHaveBeenCalledWith({
				where: { id: tokenData.id, type: TokenType.VERIFICATION }
			})

			expect(mockAuthService.saveSession).toHaveBeenCalledWith(req, user)

			expect(result).toEqual(user)
		})
	})

	describe('sendVerificationToken', () => {
		const email = 'test@test.com'

		it('should generate token and send email', async () => {
			const oldTokenId = 'old-token-id'
			const newToken = 'test-uuid-value'

			mockPrismaService.token.findFirst.mockResolvedValue({
				id: oldTokenId,
				type: TokenType.VERIFICATION
			})

			mockPrismaService.token.create.mockResolvedValue({
				email,
				token: newToken
			})

			await service.sendVerificationToken(email)

			expect(mockPrismaService.token.delete).toHaveBeenCalledWith({
				where: { id: oldTokenId, type: TokenType.VERIFICATION }
			})

			expect(mockPrismaService.token.create).toHaveBeenCalledWith({
				data: {
					email,
					token: newToken,
					expiresIn: expect.any(Date),
					type: TokenType.VERIFICATION
				}
			})

			expect(mockMailService.sendConfirmationEmail).toHaveBeenCalledWith(
				email,
				newToken
			)
		})
	})
})
