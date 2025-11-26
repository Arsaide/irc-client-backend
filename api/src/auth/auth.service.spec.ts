import {
	ConflictException,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { User, UserRole } from '@prisma/client'
import * as argon2 from 'argon2'
import { Request, Response } from 'express'

import { LoginDto } from '@/auth/dto'
import { EmailConfirmationService } from '@/auth/email-confirmation/email-confirmation.service'
import { TwoFactorAuthService } from '@/auth/two-factor-auth/two-factor-auth.service'
import { PrismaService } from '@/prisma/prisma.service'
import { UserService } from '@/user/user.service'

import { AuthService } from './auth.service'

jest.mock('argon2')

describe('AuthService', () => {
	let service: AuthService

	const mockPrismaService = {
		user: {
			findUnique: jest.fn()
		}
	}

	const mockUserService = {
		create: jest.fn(),
		findByEmail: jest.fn(),
		findById: jest.fn()
	}

	const mockConfigService = {
		getOrThrow: jest.fn()
	}

	const mockEmailConfirmationService = {
		sendVerificationToken: jest.fn()
	}

	const mockTwoFactorAuthService = {
		sendTwoFactorToken: jest.fn(),
		validateTwoFactorToken: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: UserService, useValue: mockUserService },
				{ provide: ConfigService, useValue: mockConfigService },
				{
					provide: EmailConfirmationService,
					useValue: mockEmailConfirmationService
				},
				{
					provide: TwoFactorAuthService,
					useValue: mockTwoFactorAuthService
				}
			]
		}).compile()

		service = module.get<AuthService>(AuthService)
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('register', () => {
		const dto = {
			name: 'New Name',
			email: 'new@email.com',
			password: 'new-password',
			passwordRepeat: 'new-password'
		}

		it('should throw ConflictException if user already exists', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue({
				id: '1',
				email: dto.email,
				isVerified: true
			})

			await expect(service.register(dto)).rejects.toThrow(
				ConflictException
			)
		})

		it('should register new user', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null)

			mockUserService.create.mockResolvedValue({
				id: 'new-id',
				name: dto.name,
				email: dto.email,
				isVerified: false
			})

			const result = await service.register(dto)

			expect(mockUserService.create).toHaveBeenCalledWith(
				dto.email,
				dto.password,
				dto.name,
				false
			)

			expect(
				mockEmailConfirmationService.sendVerificationToken
			).toHaveBeenCalledWith(dto.email)

			expect(result.message).toBeDefined()
		})
	})

	describe('login', () => {
		const dto: LoginDto = {
			email: 'test@email.com',
			password: 'password',
			code: ''
		}

		const reqMock = {
			session: {
				user: {},
				save: jest.fn(cb => cb(null))
			}
		} as unknown as Request

		it('should throw NotFoundException if user not found', async () => {
			mockUserService.findByEmail.mockResolvedValue(null)

			await expect(service.login(reqMock, dto)).rejects.toThrow(
				NotFoundException
			)
		})

		it('should throw UnauthorizedException if password is invalid', async () => {
			mockUserService.findByEmail.mockResolvedValue({
				id: '1',
				email: dto.email,
				password: 'hashed_password',
				isVerified: true
			})
			;(argon2.verify as jest.Mock).mockResolvedValue(false)

			await expect(service.login(reqMock, dto)).rejects.toThrow(
				UnauthorizedException
			)
		})

		it('should login successfully and save session', async () => {
			const user: User = {
				id: 'user-id',
				name: 'Test User',
				email: dto.email,
				createdAt: new Date(Date.now() - 5000),
				updatedAt: new Date(Date.now() - 1000),
				password: 'hashed_password',
				isVerified: true,
				isTwoFactorEnabled: false,
				role: UserRole.REGULAR
			}

			mockUserService.findByEmail.mockResolvedValue(user)
			;(argon2.verify as jest.Mock).mockResolvedValue(true)
			mockUserService.findById.mockResolvedValue(user)

			const result = await service.login(reqMock, dto)

			expect(result).toEqual(user)
			expect(reqMock.session.save).toHaveBeenCalled()
			expect(reqMock.session.user).toEqual({
				id: user.id,
				role: user.role
			})
		})
	})

	describe('logout', () => {
		it('should clear session and cookies', async () => {
			mockConfigService.getOrThrow.mockReturnValue('true')

			const req = {
				session: {
					destroy: jest.fn(cb => cb(null))
				}
			} as unknown as Request

			const res = {
				clearCookie: jest.fn()
			} as unknown as Response

			await service.logout(req, res)

			expect(req.session.destroy).toHaveBeenCalled()
			expect(res.clearCookie).toHaveBeenCalledWith(
				'true',
				expect.any(Object)
			)
		})

		it('should throw InternalServerErrorException if session destroy fails', async () => {
			const req = {
				session: {
					destroy: jest.fn(cb => cb(new Error('Session error')))
				}
			} as unknown as Request

			const res = {
				clearCookie: jest.fn()
			} as unknown as Response

			await expect(service.logout(req, res)).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
