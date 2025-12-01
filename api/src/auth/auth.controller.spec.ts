import { Test, TestingModule } from '@nestjs/testing'
import type { Request, Response } from 'express'

import { LoginDto, RegisterDto } from '@/auth/dto'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

describe('AuthController', () => {
	let controller: AuthController
	let authService: AuthService

	const mockAuthService = {
		register: jest.fn(),
		login: jest.fn(),
		logout: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [{ provide: AuthService, useValue: mockAuthService }]
		}).compile()

		controller = module.get<AuthController>(AuthController)
		authService = module.get<AuthService>(AuthService)

		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})

	describe('register', () => {
		it('should call authService.register', async () => {
			const dto: RegisterDto = {
				email: 'test@test.com',
				password: 'password',
				name: 'Test Name',
				passwordRepeat: 'password'
			}

			const expectedResult = { message: 'Success' }
			mockAuthService.register.mockResolvedValue(expectedResult)

			const result = await controller.register(dto)

			expect(authService.register).toHaveBeenCalledWith(dto)
			expect(result).toEqual(expectedResult)
		})
	})

	describe('login', () => {
		it('should call authService.login', async () => {
			const dto: LoginDto = {
				email: 'test@test.com',
				password: 'password',
				code: ''
			}

			const expectedResult = { message: 'Success' }
			mockAuthService.login.mockResolvedValue(expectedResult)

			const req = {
				session: {
					user: {},
					save: jest.fn(cb => cb(null))
				}
			} as unknown as Request

			const result = await controller.login(req, dto)

			expect(authService.login).toHaveBeenCalledWith(req, dto)
			expect(result).toEqual(expectedResult)
		})
	})

	describe('logout', () => {
		it('should call authService.logout', async () => {
			const req = {} as unknown as Request
			const res = {} as unknown as Response

			await controller.logout(req, res)

			expect(authService.logout).toHaveBeenCalledWith(req, res)
		})
	})
})
