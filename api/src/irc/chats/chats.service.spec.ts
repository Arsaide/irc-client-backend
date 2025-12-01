import {
	InternalServerErrorException,
	Logger,
	NotFoundException
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ChatRole } from '@prisma/__generated__'

import { IrcService } from '@/irc/irc.service'
import { PrismaService } from '@/prisma/prisma.service'

import { ChatsService } from './chats.service'

describe('ChatsService', () => {
	let service: ChatsService
	let prisma: PrismaService
	let ircService: IrcService

	const mockPrismaService = {
		chat: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn()
		},
		user: {
			findMany: jest.fn()
		},
		chatMember: {
			createMany: jest.fn()
		},
		message: {
			findMany: jest.fn()
		}
	}

	const mockIrcService = {
		joinChannel: jest.fn(),
		setTopic: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ChatsService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: IrcService, useValue: mockIrcService }
			]
		}).compile()

		service = module.get<ChatsService>(ChatsService)
		prisma = module.get<PrismaService>(PrismaService)
		ircService = module.get<IrcService>(IrcService)

		jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	describe('createChat', () => {
		it('should create a chat, join channel, set topic', async () => {
			const userId = 'user-uuid'
			const title = 'Test Chat'
			const createdChat = {
				id: 'chat-uuid',
				title,
				ircChannelName: '#test-chat'
			}

			;(prisma.chat.create as jest.Mock).mockResolvedValue(createdChat)

			const result = await service.createChat(userId, title)

			expect(prisma.chat.create).toHaveBeenCalled()
			expect(ircService.joinChannel).toHaveBeenCalledWith(
				expect.stringMatching(/^#test-chat/)
			)
			expect(ircService.setTopic).toHaveBeenCalled()
			expect(result).toEqual(createdChat)
		})

		it('should throw InternalServerErrorException on error', async () => {
			;(prisma.chat.create as jest.Mock).mockRejectedValue(
				new Error('DB Error')
			)

			await expect(service.createChat('uid', 'title')).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe('addMembers', () => {
		it('should throw NotFoundException if chat does not exist', async () => {
			;(prisma.chat.findUnique as jest.Mock).mockResolvedValue(null)

			await expect(
				service.addMembers('chat-id', ['user-id'])
			).rejects.toThrow(NotFoundException)
		})

		it('should throw NotFoundException if no valid users found', async () => {
			;(prisma.chat.findUnique as jest.Mock).mockResolvedValue({
				id: 'chat-id'
			})
			;(prisma.user.findMany as jest.Mock).mockResolvedValue([])

			await expect(
				service.addMembers('chat-id', ['user-id'])
			).rejects.toThrow(NotFoundException)
		})

		it('should add members successfully', async () => {
			const chatId = 'chat-id'
			const userIds = ['u1', 'u2']

			;(prisma.chat.findUnique as jest.Mock).mockResolvedValue({
				id: chatId
			})
			;(prisma.user.findMany as jest.Mock).mockResolvedValue([
				{ id: 'u1' },
				{ id: 'u2' }
			])
			;(prisma.chatMember.createMany as jest.Mock).mockResolvedValue({
				count: 2
			})

			const result = await service.addMembers(chatId, userIds)

			expect(prisma.chatMember.createMany).toHaveBeenCalledWith({
				data: [
					{ chatId, userId: 'u1', role: ChatRole.MEMBER },
					{ chatId, userId: 'u2', role: ChatRole.MEMBER }
				],
				skipDuplicates: true
			})
			expect(result.success).toBe(true)
			expect(result.addedCount).toBe(2)
		})
	})

	describe('getChatMessages', () => {
		it('should return messages', async () => {
			const messages = [{ id: 'm1', text: 'hello' }]
			;(prisma.message.findMany as jest.Mock).mockResolvedValue(messages)

			const result = await service.getChatMessages('chat-id')
			expect(result).toEqual(messages)
			expect(prisma.message.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { chatId: 'chat-id' },
					orderBy: { createdAt: 'asc' }
				})
			)
		})
	})
})
