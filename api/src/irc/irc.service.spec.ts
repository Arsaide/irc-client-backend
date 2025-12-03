import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import type { IrcMessageEvent } from 'irc-framework'

import { EventsGateway } from '@/events/events.gateway'
import { PrismaService } from '@/prisma/prisma.service'
import { mockIrcClient } from '@/test/__mocks__/irc-framework'

import { IrcService } from './irc.service'

describe('IrcService', () => {
	let service: IrcService
	let prisma: PrismaService

	const mockConfigService = {
		getOrThrow: jest.fn(key => {
			const config = {
				IRC_HOST: 'localhost',
				IRC_PORT: '6667',
				IRC_NICK: 'NestBot',
				IRC_USERNAME: 'nest',
				IRC_CHANNEL: '#general'
			}
			return config[key]
		}),
		get: jest.fn(key => (key === 'IRC_NICK' ? 'NestBot' : null))
	}

	const mockPrismaService = {
		chat: { findUnique: jest.fn(), findMany: jest.fn() },
		user: { findUnique: jest.fn() },
		message: { create: jest.fn() }
	}

	const mockEventsGateway = {
		sendToRoom: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				IrcService,
				{ provide: ConfigService, useValue: mockConfigService },
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: EventsGateway, useValue: mockEventsGateway }
			]
		}).compile()

		service = module.get<IrcService>(IrcService)
		prisma = module.get<PrismaService>(PrismaService)
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('onModuleInit', () => {
		it('should connect to IRC', () => {
			service.onModuleInit()

			expect(mockIrcClient.connect).toHaveBeenCalled()

			expect(mockIrcClient.on).toHaveBeenCalledWith(
				'registered',
				expect.any(Function)
			)

			expect(mockIrcClient.on).toHaveBeenCalledWith(
				'message',
				expect.any(Function)
			)
		})
	})

	describe('handleMessage', () => {
		beforeEach(() => {
			service.onModuleInit()
		})

		const triggerMessageEvent = async (event: Partial<IrcMessageEvent>) => {
			const calls = mockIrcClient.on.mock.calls as [
				string,
				(e: IrcMessageEvent) => Promise<void>
			][]
			const messageHandler = calls.find(
				call => call[0] === 'message'
			)?.[1]

			if (messageHandler) {
				await messageHandler(event as IrcMessageEvent)
			} else {
				throw new Error(
					"Handler for 'message' event was not registered via .on()"
				)
			}
		}

		it('should ignore own messages', async () => {
			await triggerMessageEvent({
				nick: 'NestBot',
				target: '#chat',
				message: 'hi'
			})
			expect(prisma.message.create).not.toHaveBeenCalled()
		})

		it('should ignore private messages (not starting with #)', async () => {
			await triggerMessageEvent({
				nick: 'User',
				target: 'NestBot',
				message: 'hi'
			})
			expect(prisma.message.create).not.toHaveBeenCalled()
		})

		it('should save message if chat and user exist', async () => {
			;(prisma.chat.findUnique as jest.Mock).mockResolvedValue({
				id: 'chat-id',
				title: 'Chat'
			})
			;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				id: 'user-id'
			})
			;(prisma.message.create as jest.Mock).mockResolvedValue({
				id: 'msg-id',
				text: 'Hello',
				chatId: 'chat-id',
				userId: 'user-id',
				createdAt: new Date(),
				user: {
					id: 'user-id',
					ircNickname: 'UserNick'
				}
			})

			await triggerMessageEvent({
				nick: 'UserNick',
				target: '#valid-chat',
				message: 'Hello'
			})

			expect(prisma.chat.findUnique).toHaveBeenCalledWith({
				where: { ircChannelName: '#valid-chat' }
			})
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { ircNickname: 'UserNick' }
			})
			expect(prisma.message.create).toHaveBeenCalledWith({
				data: { text: 'Hello', chatId: 'chat-id', userId: 'user-id' },
				include: expect.any(Object)
			})

			expect(mockEventsGateway.sendToRoom).toHaveBeenCalled()
		})
	})

	describe('restoreChannels', () => {
		const triggerRegisteredEvent = async () => {
			const calls = mockIrcClient.on.mock.calls
			const regHandler = calls.find(call => call[0] === 'registered')[1]
			await regHandler()
		}

		it('should rejoin channels from DB upon registration', async () => {
			;(prisma.chat.findMany as jest.Mock).mockResolvedValue([
				{ ircChannelName: '#chat1' },
				{ ircChannelName: '#chat2' }
			])

			service.onModuleInit()
			await triggerRegisteredEvent()

			expect(mockIrcClient.join).toHaveBeenCalledWith('#general')
			expect(mockIrcClient.join).toHaveBeenCalledWith('#chat1')
			expect(mockIrcClient.join).toHaveBeenCalledWith('#chat2')
		})
	})
})
