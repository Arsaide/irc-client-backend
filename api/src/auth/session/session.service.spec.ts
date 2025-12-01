import { Test, TestingModule } from '@nestjs/testing'
import { UserRole } from '@prisma/__generated__'
import type { Request } from 'express'

import { REDIS } from '@/libs/redis/redis.provider'
import { UserService } from '@/user/user.service'

import type { TestRequest } from '../../../test/types/session-user.type'

import { SessionService } from './session.service'

describe('SessionService', () => {
	let service: SessionService

	const mockRedis = {
		set: jest.fn(),
		get: jest.fn(),
		del: jest.fn()
	}

	const mockUserService = {
		findById: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SessionService,
				{ provide: REDIS, useValue: mockRedis },
				{ provide: UserService, useValue: mockUserService }
			]
		}).compile()

		service = module.get<SessionService>(SessionService)

		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(service).toBeDefined()
	})

	describe('markUserForRefresh', () => {
		it('should update session directly if target user is current user', async () => {
			const userId = 'user-1'
			const freshUser = { id: userId, role: UserRole.ADMIN }

			const req = {
				session: {
					user: { id: userId, role: UserRole.REGULAR },
					save: jest.fn((cb: (err?: unknown) => void) => cb())
				}
			} as unknown as TestRequest

			mockUserService.findById.mockResolvedValue(freshUser)

			await service.markUserForRefresh(userId, req)

			expect(mockUserService.findById).toHaveBeenCalledWith(userId)
			expect(req.session.user.role).toBe(UserRole.ADMIN)
			expect(req.session.save).toHaveBeenCalled()
			expect(mockRedis.set).not.toHaveBeenCalled()
		})

		it('should set flag in Redis if target user is NOT current user', async () => {
			const currentUserId = 'user-1'
			const targetUserId = 'user-2'

			const req = {
				session: {
					user: { id: currentUserId }
				}
			} as unknown as Request

			await service.markUserForRefresh(targetUserId, req)

			expect(mockUserService.findById).not.toHaveBeenCalled()
			expect(mockRedis.set).toHaveBeenCalledWith(
				`needs_refresh:${targetUserId}`,
				'1',
				'EX',
				3600
			)
		})
	})

	describe('shouldRefresh', () => {
		it('should return true if key exists in Redis', async () => {
			mockRedis.get.mockResolvedValue('1') // Redis вернул значение
			const result = await service.shouldRefresh('user-id')
			expect(result).toBe(true)
			expect(mockRedis.get).toHaveBeenCalledWith('needs_refresh:user-id')
		})

		it('should return false if key does not exist', async () => {
			mockRedis.get.mockResolvedValue(null) // Redis вернул пустоту
			const result = await service.shouldRefresh('user-id')
			expect(result).toBe(false)
		})
	})

	describe('clear', () => {
		it('should delete key from Redis', async () => {
			await service.clear('user-id')
			expect(mockRedis.del).toHaveBeenCalledWith('needs_refresh:user-id')
		})
	})

	describe('refreshUserSession', () => {
		it('should update session directly if ids match', async () => {
			const userId = 'my-id'
			const req = {
				session: {
					user: { id: userId, role: 'OLD' },
					save: jest.fn(cb => cb(null))
				}
			} as unknown as TestRequest

			mockUserService.findById.mockResolvedValue({
				id: userId,
				role: 'NEW'
			})

			await service.refreshUserSession(userId, userId, req)

			expect(req.session.user.role).toBe('NEW')
			expect(req.session.save).toHaveBeenCalled()
		})

		it('should call markUserForRefresh if ids do not match', async () => {
			const targetId = 'other-id'
			const currentId = 'my-id'
			const req = {} as Request

			const markSpy = jest.spyOn(service, 'markUserForRefresh')
			markSpy.mockResolvedValue(undefined)

			await service.refreshUserSession(targetId, currentId, req)

			expect(markSpy).toHaveBeenCalledWith(targetId, req)
		})
	})
})
