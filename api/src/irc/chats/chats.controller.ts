import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Post
} from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { Authorization, Authorized } from '@/auth/decorators'
import { AddMemberDto, CreateChatDto } from '@/irc/chats/dto'

import { ChatsService } from './chats.service'

@Controller('chats')
export class ChatsController {
	constructor(private readonly chatsService: ChatsService) {}

	@Authorization(UserRole.REGULAR, UserRole.ADMIN)
	@Post()
	@HttpCode(HttpStatus.CREATED)
	public async create(
		@Authorized('id') userId: string,
		@Body() dto: CreateChatDto
	) {
		return this.chatsService.createChat(userId, dto.title)
	}

	@Authorization(UserRole.REGULAR, UserRole.ADMIN)
	@Get()
	@HttpCode(HttpStatus.OK)
	public async getMyChats(@Authorized('id') userId: string) {
		return this.chatsService.getUserChats(userId)
	}

	@Authorization(UserRole.REGULAR, UserRole.ADMIN)
	@Post(':id/members')
	@HttpCode(HttpStatus.OK)
	public async addMembers(
		@Param('id', ParseUUIDPipe) chatId: string,
		@Body() dto: AddMemberDto
	) {
		return this.chatsService.addMembers(chatId, dto.userIds)
	}
}
