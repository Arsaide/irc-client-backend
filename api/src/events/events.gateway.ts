import { Logger } from '@nestjs/common'
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets'
import type { Message } from '@prisma/__generated__'
import { Server, Socket } from 'socket.io'

interface JoinRoomPayload {
	chatId: string
}

@WebSocketGateway({
	cors: {
		origin: '*'
	}
})
export class EventsGateway {
	@WebSocketServer()
	server: Server

	private readonly logger = new Logger(EventsGateway.name)

	handleConnection(client: Socket) {
		this.logger.debug(`Socket connected: ${client.id}`)
	}

	handleDisconnect(client: Socket) {
		this.logger.debug(`Socket disconnected: ${client.id}`)
	}

	@SubscribeMessage('joinRoom')
	public handleJoinRoom(
		@MessageBody() data: string | JoinRoomPayload,
		@ConnectedSocket() client: Socket
	) {
		let payload: JoinRoomPayload

		if (typeof data === 'string') {
			try {
				payload = JSON.parse(data)
			} catch (error) {
				return { error: `Invalid JSON. Error: ${error}` }
			}
		} else {
			payload = data
		}

		if (!payload || !payload.chatId) {
			return { error: 'No chatId provided' }
		}

		client.join(payload.chatId)
		this.logger.log(`Client ${client.id} joined room: ${payload.chatId}`)

		return { event: 'joined', chatId: payload.chatId }
	}

	@SubscribeMessage('leaveRoom')
	public handleLeaveRoom(
		@MessageBody() data: string | JoinRoomPayload,
		@ConnectedSocket() client: Socket
	) {
		let payload: JoinRoomPayload

		if (typeof data === 'string') {
			try {
				payload = JSON.parse(data)
			} catch (error) {
				return { error: `Invalid JSON. Error: ${error}` }
			}
		} else {
			payload = data
		}

		if (!payload || !payload.chatId) {
			return { error: 'No chatId provided' }
		}

		client.leave(payload.chatId)
		this.logger.log(`Client ${client.id} left room: ${payload.chatId}`)
	}

	public sendToRoom(chatId: string, message: Message) {
		this.logger.warn(
			`🚀 Emitting 'newMessage' to room: ${chatId} | Payload: ${JSON.stringify(message)}`
		)

		this.server.to(chatId).emit('newMessage', message)
	}
}
