import {
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from '@nestjs/common'
import { ChatRole } from '@prisma/__generated__'
import { v4 as uuidv4 } from 'uuid'

import { EventsGateway } from '@/events/events.gateway'
import { SendChatMessageDto } from '@/irc/chats/dto'
import { IrcService } from '@/irc/irc.service'
import { generateIrcNames } from '@/libs/common/utils'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class ChatsService {
	private readonly logger = new Logger(ChatsService.name)
	constructor(
		private readonly prisma: PrismaService,
		private readonly ircService: IrcService,
		private readonly eventsGateway: EventsGateway
	) {}

	public async createChat(userId: string, title: string) {
		const chatId = uuidv4()

		const ircChannelName = generateIrcNames(title, chatId)

		try {
			const chat = await this.prisma.chat.create({
				data: {
					id: chatId,
					title: title,
					ircChannelName: ircChannelName,
					ownerId: userId,
					members: {
						create: {
							userId: userId,
							role: ChatRole.OWNER
						}
					}
				}
			})

			this.ircService.joinChannel(ircChannelName)

			this.ircService.setTopic(ircChannelName, title)

			return chat
		} catch (error) {
			this.logger.error(error)
			throw new InternalServerErrorException('Could not create chat')
		}
	}

	public async getUserChats(userId: string) {
		return this.prisma.chat.findMany({
			where: {
				members: {
					some: {
						userId: userId
					}
				}
			},
			include: {
				_count: {
					select: { members: true }
				}
			}
		})
	}

	public async addMembers(chatId: string, userIds: string[]) {
		const chat = await this.prisma.chat.findUnique({
			where: { id: chatId }
		})

		if (!chat) {
			throw new NotFoundException('Chat not found')
		}

		const foundUsers = await this.prisma.user.findMany({
			where: {
				id: {
					in: userIds
				}
			}
		})

		const validUserIds = foundUsers.map(user => user.id)

		if (validUserIds.length === 0) {
			throw new NotFoundException('No valid users found to add')
		}

		if (validUserIds.length !== userIds.length) {
			this.logger.warn(
				`Some user IDs is invalid and skipped: ${userIds.length - validUserIds.length} skipped`
			)
		}

		try {
			const data = validUserIds.map(userId => ({
				chatId: chatId,
				userId: userId,
				role: ChatRole.MEMBER
			}))

			const result = await this.prisma.chatMember.createMany({
				data,
				skipDuplicates: true
			})

			return {
				success: true,
				addedCount: result.count,
				chatId: chatId,
				warnings:
					validUserIds.length !== userIds.length
						? 'Some users were not found'
						: null
			}
		} catch (error) {
			this.logger.error(error)
			throw new InternalServerErrorException('Could not add members')
		}
	}

	public async getChatMessages(chatId: string) {
		return this.prisma.message.findMany({
			where: { chatId: chatId },
			orderBy: { createdAt: 'asc' },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						ircNickname: true
					}
				}
			}
		})
	}

	public async sendChatMessage(
		chatId: string,
		userId: string,
		dto: SendChatMessageDto
	) {
		const chat = await this.prisma.chat.findUnique({
			where: { id: chatId }
		})

		if (!chat) {
			throw new NotFoundException('Chat not found')
		}

		const member = await this.prisma.chatMember.findUnique({
			where: {
				userId_chatId: {
					chatId: chatId,
					userId: userId
				}
			}
		})

		if (!member) {
			throw new NotFoundException('You are not a member of this chat')
		}

		const user = await this.prisma.user.findUnique({
			where: { id: userId }
		})

		if (!user || !user.ircNickname) {
			throw new NotFoundException('User IRC nickname not set')
		}

		this.ircService.sendMessage(chat.ircChannelName, dto.text)

		const message = await this.prisma.message.create({
			data: {
				text: dto.text,
				chatId: chatId,
				userId: userId
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						ircNickname: true
					}
				}
			}
		})

		this.eventsGateway.sendToRoom(chatId, message)

		return message
	}
}
