import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { UserRole } from '@prisma/__generated__'
import * as argon2 from 'argon2'
import type { Request } from 'express'

import { SessionService } from '@/auth/session/session.service'
import { PrismaService } from '@/prisma/prisma.service'
import { UpdateUserProfileDto } from '@/user/dto'

import { UserService } from './user.service'

jest.mock('argon2')

describe('UserService', () => {
	let service: UserService
	let prisma: PrismaService
	let sessionService: SessionService

	const mockUser = {
		id: 'user-id',
		email: 'test@test.com',
		name: 'TestUser',
		password: 'hashed-password',
		isVerified: true,
		role: UserRole.REGULAR,
		isTwoFactorEnabled: false,
		createdAt: new Date(),
		updatedAt: new Date()
	}

	const mockPrismaService = {
		user: {
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn()
		}
	}

	const mockSessionService = {
		refreshUserSession: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: SessionService, useValue: mockSessionService }
			]
		}).compile()

		service = module.get<UserService>(UserService)
		prisma = module.get<PrismaService>(PrismaService)
		sessionService = module.get<SessionService>(SessionService)

		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('findById', () => {
		it('should return a user if found by id', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

			const result = await service.findById('user-id')
			expect(result).toEqual(mockUser)
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user-id' }
			})
		})

		it('should throw NotFoundException if user not found by id', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

			await expect(service.findById('user-id')).rejects.toThrow(
				NotFoundException
			)
		})
	})

	describe('findByEmail', () => {
		it('should return a user if found by email', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

			const result = await service.findByEmail('test@test.com')
			expect(result).toEqual(mockUser)
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'test@test.com' }
			})
		})

		it('should throw NotFoundException if user not found by email', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

			await expect(service.findByEmail('test@test.com')).rejects.toThrow(
				NotFoundException
			)
		})
	})

	describe('create', () => {
		it('should create a user successfully', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
			;(argon2.hash as jest.Mock).mockResolvedValue('new-hashed-pass')
			;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

			const result = await service.create(
				'test@test.com',
				'123456',
				'TestUser',
				true
			)

			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { name: 'TestUser' }
			})
			expect(argon2.hash).toHaveBeenCalledWith('123456')
			expect(prisma.user.create).toHaveBeenCalled()
			expect(result).toEqual(mockUser)
		})

		it('should throw ConflictException if name already taken', async () => {
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

			await expect(
				service.create('email', 'pass', 'TestUser', true)
			).rejects.toThrow(ConflictException)

			expect(prisma.user.create).not.toHaveBeenCalled()
		})
	})

	describe('updateOwnProfile', () => {
		it('should update own profile and refresh session', async () => {
			const dto = {
				name: 'New Name',
				isTwoFactorEnabled: true
			}
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
			;(prisma.user.update as jest.Mock).mockResolvedValue({
				...mockUser,
				name: 'New Name',
				isTwoFactorEnabled: true
			})

			const result = await service.updateOwnProfile('user-id', dto)

			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: {
					name: dto.name,
					isTwoFactorEnabled: dto.isTwoFactorEnabled
				}
			})

			expect(result.name).toBe('New Name')
		})
	})

	describe('updateUserProfile', () => {
		it('should update user and refresh session', async () => {
			const dto = {
				name: 'New Name',
				password: 'new-password',
				email: 'new@email.com'
			}

			;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
			;(argon2.hash as jest.Mock).mockResolvedValue('hashed-new-pass')
			;(prisma.user.update as jest.Mock).mockResolvedValue({
				...mockUser,
				name: 'New Name'
			})

			const req = {} as Request

			const result = await service.updateUserProfile(
				'target-id',
				'current-id',
				dto as UpdateUserProfileDto,
				req
			)

			expect(argon2.hash).toHaveBeenCalledWith('new-password')

			expect(prisma.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: expect.objectContaining({
					name: 'New Name',
					password: 'hashed-new-pass'
				})
			})

			expect(sessionService.refreshUserSession).toHaveBeenCalledWith(
				'target-id',
				'current-id',
				req
			)
			expect(result.name).toBe('New Name')
		})
	})
})
