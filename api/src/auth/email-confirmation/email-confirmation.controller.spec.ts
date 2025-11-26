import { Test, TestingModule } from '@nestjs/testing'
import { Request } from 'express'

import { ConfirmationDto } from '@/auth/email-confirmation/dto'

import { EmailConfirmationController } from './email-confirmation.controller'
import { EmailConfirmationService } from './email-confirmation.service'

describe('EmailConfirmationController', () => {
	let controller: EmailConfirmationController
	let service: EmailConfirmationService

	const mockService = {
		newVerification: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [EmailConfirmationController],
			providers: [
				{
					provide: EmailConfirmationService,
					useValue: mockService
				}
			]
		}).compile()

		controller = module.get<EmailConfirmationController>(
			EmailConfirmationController
		)
		service = module.get<EmailConfirmationService>(EmailConfirmationService)

		jest.clearAllMocks()
	})

	it('should be defined', () => {
		expect(controller).toBeDefined()
	})

	describe('newVerification', () => {
		it('should call service.newVerification', async () => {
			const dto: ConfirmationDto = { token: 'token' }
			const req = {} as Request

			const expectedResult = { id: 'user-id', isVerified: true }
			mockService.newVerification.mockResolvedValue(expectedResult)

			const result = await controller.newVerification(req, dto)

			expect(service.newVerification).toHaveBeenCalledWith(req, dto)
			expect(result).toEqual(expectedResult)
		})
	})
})
