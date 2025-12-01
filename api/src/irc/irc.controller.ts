import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { UserRole } from '@prisma/__generated__'

import { Authorization } from '@/auth/decorators'
import { SendMessageDto } from '@/irc/dto'

import { IrcService } from './irc.service'

@Controller('irc')
export class IrcController {
	constructor(private readonly ircService: IrcService) {}

	@Authorization(UserRole.ADMIN)
	@Post('send')
	@HttpCode(HttpStatus.OK)
	sendMessage(@Body() dto: SendMessageDto): { success: boolean } {
		this.ircService.sendMessage(dto.target, dto.message)
		return { success: true }
	}
}
