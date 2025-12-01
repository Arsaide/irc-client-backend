import { Test, TestingModule } from '@nestjs/testing'

import { AuthGuard, RolesGuard } from '@/auth/guards'
import { SendMessageDto } from '@/irc/dto'

import { IrcController } from './irc.controller'
import { IrcService } from './irc.service'

describe('IrcController', () => {
	let controller: IrcController
	let service: IrcService

	const mockIrcService = {
		sendMessage: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [IrcController],
			providers: [{ provide: IrcService, useValue: mockIrcService }]
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })

			.overrideGuard(RolesGuard)
			.useValue({ canActivate: jest.fn(() => true) })

			.compile()

		controller = module.get<IrcController>(IrcController)
		service = module.get<IrcService>(IrcService)
	})

	it('should send a message', () => {
		const dto: SendMessageDto = { target: '#test', message: 'hello' }
		controller.sendMessage(dto)
		expect(service.sendMessage).toHaveBeenCalledWith(
			dto.target,
			dto.message
		)
	})
})
