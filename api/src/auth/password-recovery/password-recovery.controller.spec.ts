import { Test, TestingModule } from '@nestjs/testing'

import { NewPasswordDto, ResetPasswordDto } from './dto'
import { PasswordRecoveryController } from './password-recovery.controller'
import { PasswordRecoveryService } from './password-recovery.service'

describe('PasswordRecoveryController', () => {
	let controller: PasswordRecoveryController
	let service: PasswordRecoveryService

	const mockService = {
		resetPassword: jest.fn(),
		newPassword: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PasswordRecoveryController],
			providers: [
				{
					provide: PasswordRecoveryService,
					useValue: mockService
				}
			]
		}).compile()

		controller = module.get<PasswordRecoveryController>(
			PasswordRecoveryController
		)
		service = module.get<PasswordRecoveryService>(PasswordRecoveryService)

		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})

	describe('resetPassword', () => {
		it('should call service.resetPassword', async () => {
			const dto: ResetPasswordDto = { email: 'test@test.com' }
			await controller.resetPassword(dto)
			expect(service.resetPassword).toHaveBeenCalledWith(dto)
		})
	})

	describe('newPassword', () => {
		it('should call service.newPassword', async () => {
			const dto: NewPasswordDto = {
				password: '12345678',
				passwordRepeat: '12345678'
			}

			const token = 'test-token'

			await controller.newPassword(dto, token)

			expect(service.newPassword).toHaveBeenCalledWith(dto, token)
		})
	})
})
