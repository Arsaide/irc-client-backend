import { Test, TestingModule } from '@nestjs/testing'
import type { Request } from 'express'

import { AuthGuard, RolesGuard } from '@/auth/guards'
import { UpdateUserProfileDto } from '@/user/dto'

import { UserController } from './user.controller'
import { UserService } from './user.service'

describe('UserController', () => {
	let controller: UserController
	let userService: UserService

	const mockUser = { id: '1', email: 'test@test.com', name: 'Test' }

	const mockUserService = {
		findById: jest.fn().mockResolvedValue(mockUser),
		updateOwnProfile: jest
			.fn()
			.mockResolvedValue({ ...mockUser, name: 'Updated' }),
		updateUserProfile: jest.fn().mockResolvedValue(mockUser)
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [
				{
					provide: UserService,
					useValue: mockUserService
				}
			]
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })

			.overrideGuard(RolesGuard)
			.useValue({ canActivate: jest.fn(() => true) })

			.compile()

		controller = module.get<UserController>(UserController)
		userService = module.get<UserService>(UserService)

		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})

	describe('findProfile', () => {
		it('should return user profile', async () => {
			const result = await controller.findProfile('1')
			expect(userService.findById).toHaveBeenCalledWith('1')
			expect(result).toEqual(mockUser)
		})
	})

	describe('getById', () => {
		it('should return user by id', async () => {
			const result = await controller.getById('1')

			expect(userService.findById).toHaveBeenCalledWith('1')
			expect(result).toEqual(mockUser)
		})
	})

	describe('updateUserProfile (Admin/Regular)', () => {
		it('should call updateUserProfile in service', async () => {
			const dto = { name: 'AdminUpdate' }
			const req = {} as Request

			await controller.updateUserProfile(
				'current-user-id',
				'target-user-id',
				dto as UpdateUserProfileDto,
				req
			)

			expect(userService.updateUserProfile).toHaveBeenCalledWith(
				'target-user-id',
				'current-user-id',
				dto,
				req
			)
		})
	})
})
