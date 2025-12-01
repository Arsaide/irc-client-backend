import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TokenType } from '@prisma/__generated__'
import * as argon2 from 'argon2'

import { ResetPasswordDto } from '@/auth/password-recovery/dto'
import { MailService } from '@/libs/mail/mail.service'
import { PrismaService } from '@/prisma/prisma.service'
import { UserService } from '@/user/user.service'

import { PasswordRecoveryService } from './password-recovery.service'

describe('PasswordRecoveryService', () => {
	let service: PasswordRecoveryService

	const mockPrismaService = {
		token: {
			findFirst: jest.fn(),
			delete: jest.fn(),
			create: jest.fn()
		},
		user: {
			update: jest.fn()
		}
	}

	const mockUserService = {
		findByEmail: jest.fn()
	}

	const mockMailService = {
		sendResetPassword: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PasswordRecoveryService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: UserService, useValue: mockUserService },
				{ provide: MailService, useValue: mockMailService }
			]
		}).compile()

		service = module.get<PasswordRecoveryService>(PasswordRecoveryService)

		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('resetPassword', () => {
		const dto: ResetPasswordDto = { email: 'test@test.com' }

		it('should throw NotFoundException if user not found', async () => {
			mockUserService.findByEmail.mockResolvedValue(null)

			await expect(service.resetPassword(dto)).rejects.toThrow(
				NotFoundException
			)
		})

		it('should generate token and send email', async () => {
			mockUserService.findByEmail.mockResolvedValue({ email: dto.email })

			const oldTokenId = 'old-id'
			mockPrismaService.token.findFirst.mockResolvedValue({
				id: oldTokenId,
				type: TokenType.PASSWORD_RESET
			})

			const newToken = 'test-uuid-value'
			mockPrismaService.token.create.mockResolvedValue({
				email: dto.email,
				token: newToken
			})

			await service.resetPassword(dto)

			expect(mockPrismaService.token.delete).toHaveBeenCalledWith({
				where: { id: oldTokenId, type: TokenType.PASSWORD_RESET }
			})

			expect(mockPrismaService.token.create).toHaveBeenCalledWith({
				data: {
					email: dto.email,
					token: newToken,
					expiresIn: expect.any(Date),
					type: TokenType.PASSWORD_RESET
				}
			})

			expect(mockMailService.sendResetPassword).toHaveBeenCalledWith(
				dto.email,
				newToken
			)
		})
	})

	describe('newPassword', () => {
		const dto = { password: 'new-pass', passwordRepeat: 'new-pass' }
		const token = 'valid-token'
		const email = 'test@test.com'

		it('should throw NotFoundException if token not found', async () => {
			mockPrismaService.token.findFirst.mockResolvedValue(null)

			await expect(service.newPassword(dto, token)).rejects.toThrow(
				NotFoundException
			)
		})

		it('should throw BadRequestException if token expired', async () => {
			mockPrismaService.token.findFirst.mockResolvedValue({
				expiresIn: new Date(Date.now() - 1000)
			})

			await expect(service.newPassword(dto, token)).rejects.toThrow(
				BadRequestException
			)
		})

		it('should throw NotFoundException if user for token not found', async () => {
			mockPrismaService.token.findFirst.mockResolvedValue({
				email,
				expiresIn: new Date(Date.now() + 1000)
			})

			mockUserService.findByEmail.mockResolvedValue(null)

			await expect(service.newPassword(dto, token)).rejects.toThrow(
				NotFoundException
			)
		})

		it('should update password and delete token on success', async () => {
			const tokenId = 'token-id'
			const userId = 'user-id'

			mockPrismaService.token.findFirst.mockResolvedValue({
				id: tokenId,
				email,
				expiresIn: new Date(Date.now() + 1000)
			})

			mockUserService.findByEmail.mockResolvedValue({ id: userId })
			const hashedPass = 'hashed-pass'
			;(argon2.hash as jest.Mock).mockResolvedValue(hashedPass)

			const result = await service.newPassword(dto, token)

			expect(result).toBe(true)

			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: userId },
				data: { password: hashedPass }
			})

			expect(mockPrismaService.token.delete).toHaveBeenCalledWith({
				where: { id: tokenId, type: TokenType.PASSWORD_RESET }
			})
		})
	})
})
