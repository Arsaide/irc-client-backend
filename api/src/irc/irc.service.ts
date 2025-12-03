import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client, IrcErrorEvent, IrcMessageEvent } from 'irc-framework'

import { EventsGateway } from '@/events/events.gateway'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class IrcService implements OnModuleInit {
	private readonly client: Client
	private readonly logger = new Logger(IrcService.name)

	constructor(
		private readonly configService: ConfigService,
		private readonly prisma: PrismaService,
		private readonly eventsGateway: EventsGateway
	) {
		this.client = new Client()
	}

	onModuleInit(): void {
		this.connect()
	}

	onModuleDestroy(): void {
		this.client.quit('NestJS Backend shutting down')
	}

	private connect(): void {
		const host = this.configService.getOrThrow<string>('IRC_HOST')
		const port = parseInt(
			this.configService.getOrThrow<string>('IRC_PORT'),
			10
		)
		const nick = this.configService.getOrThrow<string>('IRC_NICK')
		const username = this.configService.getOrThrow<string>('IRC_USERNAME')
		const channel = this.configService.getOrThrow<string>('IRC_CHANNEL')

		this.logger.log(`Connecting to IRC server at ${host}:${port}...`)

		this.client.connect({
			host,
			port,
			nick,
			username,
			gecos: 'NestJS Backend',
			encoding: 'utf8',
			auto_reconnect: true,
			auto_reconnect_max_retries: 10
		})

		this.registerEvents(channel)
	}

	private registerEvents(defaultChannel: string) {
		this.client.on('registered', async () => {
			this.logger.log('Connected to IRC server successfully!')
			this.client.join(defaultChannel)
			this.logger.log(`Joined default channel: ${defaultChannel}`)

			await this.restoreChannels()
		})

		this.client.on('message', (event: IrcMessageEvent) => {
			return this.handleMessage(event)
		})

		this.client.on('error', (err: IrcErrorEvent) => {
			this.logger.error(`IRC Error: ${err.message}`)
		})

		this.client.on('close', () => {
			this.logger.warn('IRC Connection closed')
		})
	}

	private async restoreChannels() {
		try {
			const chats = await this.prisma.chat.findMany({
				select: { ircChannelName: true }
			})

			if (chats.length === 0) return

			this.logger.log(
				`Found ${chats.length} active chats in DB. Restoring connections...`
			)

			for (const chat of chats) {
				this.client.join(chat.ircChannelName)
			}

			this.logger.log(`Successfully rejoined ${chats.length} channels.`)
		} catch (error) {
			this.logger.error('Failed to restore channels on startup', error)
		}
	}

	private async handleMessage(event: IrcMessageEvent) {
		const myNick = this.configService.get<string>('IRC_NICK')
		if (event.nick === myNick) return

		this.logger.log(`[${event.target}] <${event.nick}>: ${event.message}`)

		if (!event.target.startsWith('#')) return

		try {
			const chat = await this.prisma.chat.findUnique({
				where: { ircChannelName: event.target }
			})

			if (!chat) {
				return
			}

			const user = await this.prisma.user.findUnique({
				where: { ircNickname: event.nick }
			})

			if (!user) {
				this.logger.warn(
					`Message from unknown user (nick mismatch): ${event.nick}`
				)
				return
			}

			const message = await this.prisma.message.create({
				data: {
					text: event.message,
					chatId: chat.id,
					userId: user.id
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

			this.logger.verbose(`Saved message from ${event.nick}...`)

			this.eventsGateway.sendToRoom(chat.id, message)
		} catch (error) {
			this.logger.error('Failed to save message history', error)
		}
	}

	public sendMessage(target: string, message: string): void {
		this.logger.debug(`Sending message to ${target}: ${message}`)
		this.client.say(target, message)
	}

	public joinChannel(channel: string): void {
		if (!channel.startsWith('#')) {
			this.logger.warn(`Channel name must start with #: ${channel}`)
			return
		}

		this.logger.log(`Bot joining channel: ${channel}`)
		this.client.join(channel)
	}

	public leaveChannel(channel: string): void {
		this.logger.log(`Bot leaving channel: ${channel}`)
		this.client.part(channel)
	}

	public setTopic(channel: string, topic: string): void {
		this.client.raw('TOPIC', channel, topic)
	}
}
