import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client, IrcErrorEvent, IrcMessageEvent } from 'irc-framework'

@Injectable()
export class IrcService implements OnModuleInit {
	private readonly client: Client
	private readonly logger = new Logger(IrcService.name)

	constructor(private readonly configService: ConfigService) {
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

	private registerEvents(channel: string): void {
		this.client.on('registered', () => {
			this.logger.log('Connected to IRC server successfully!')
			this.client.join(channel)
			this.logger.log(`Joined channel: ${channel}`)
		})

		this.client.on('message', (event: IrcMessageEvent) => {
			this.handleMessage(event)
		})

		this.client.on('error', (err: IrcErrorEvent) => {
			this.logger.error(`IRC Error: ${err.message}`)
		})

		this.client.on('close', () => {
			this.logger.warn('IRC Connection closed')
		})
	}

	private handleMessage(event: IrcMessageEvent): void {
		const myNick = this.configService.get<string>('IRC_NICK')
		if (event.nick === myNick) return

		this.logger.log(`[${event.target}] <${event.nick}>: ${event.message}`)
	}

	public sendMessage(target: string, message: string): void {
		this.logger.debug(`Sending message to ${target}: ${message}`)
		this.client.say(target, message)
	}
}
