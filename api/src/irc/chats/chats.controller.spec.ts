import { Test, TestingModule } from '@nestjs/testing'

import { AuthGuard, RolesGuard } from '@/auth/guards'
import { AddMemberDto, CreateChatDto } from '@/irc/chats/dto'

import { ChatsController } from './chats.controller'
import { ChatsService } from './chats.service'

describe('ChatsController', () => {
	let controller: ChatsController
	let service: ChatsService

	const mockChatsService = {
		createChat: jest.fn(),
		getUserChats: jest.fn(),
		addMembers: jest.fn(),
		getChatMessages: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ChatsController],
			providers: [{ provide: ChatsService, useValue: mockChatsService }]
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })

			.overrideGuard(RolesGuard)
			.useValue({ canActivate: jest.fn(() => true) })

			.compile()

		controller = module.get<ChatsController>(ChatsController)
		service = module.get<ChatsService>(ChatsService)
	})

	it('should create a chat', async () => {
		const dto: CreateChatDto = { title: 'New Chat' }
		const userId = 'user-id'
		const result = { id: 'chat-id', ...dto }

		;(service.createChat as jest.Mock).mockResolvedValue(result)

		expect(await controller.create(userId, dto)).toBe(result)
		expect(service.createChat).toHaveBeenCalledWith(userId, dto.title)
	})

	it('should add members', async () => {
		const dto: AddMemberDto = { userIds: ['u1'] }
		;(service.addMembers as jest.Mock).mockResolvedValue({ success: true })

		await controller.addMembers('chat-id', dto)
		expect(service.addMembers).toHaveBeenCalledWith('chat-id', dto.userIds)
	})
})
