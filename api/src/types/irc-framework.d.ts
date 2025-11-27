declare module 'irc-framework' {
	import { EventEmitter } from 'events'

	export interface IrcOptions {
		host: string
		port: number
		nick: string
		username: string
		gecos?: string
		encoding?: string
		ssl?: boolean
		password?: string
		auto_reconnect?: boolean
		auto_reconnect_max_retries?: number
		auto_reconnect_wait?: number
	}

	export interface IrcMessageEvent {
		nick: string
		ident: string
		hostname: string
		target: string
		group: string
		message: string
		time: number
		tags: Record<string, string>
	}

	export interface IrcErrorEvent {
		message: string
		reason?: string
	}

	export class Client extends EventEmitter {
		constructor()

		connect(options: IrcOptions): void
		quit(message?: string): void
		join(channel: string, key?: string): void
		part(channel: string, message?: string): void
		say(target: string, message: string): void
		raw(command: string, ...args: unknown[]): void

		on(event: 'registered', listener: (event: never) => void): this
		on(event: 'message', listener: (event: IrcMessageEvent) => void): this
		on(event: 'join', listener: (event: IrcMessageEvent) => void): this
		on(event: 'error', listener: (error: IrcErrorEvent) => void): this
		on(event: 'close', listener: () => void): this
	}
}
