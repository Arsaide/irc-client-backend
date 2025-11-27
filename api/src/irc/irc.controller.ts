import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { IsNotEmpty, IsString } from 'class-validator'

import { IrcService } from './irc.service'

export class SendMessageDto {
	@IsString()
	@IsNotEmpty()
	target: string

	@IsString()
	@IsNotEmpty()
	message: string
}

@Controller('irc')
export class IrcController {
	constructor(private readonly ircService: IrcService) {}

	@Post('send')
	@HttpCode(HttpStatus.OK)
	sendMessage(@Body() dto: SendMessageDto): { success: boolean } {
		this.ircService.sendMessage(dto.target, dto.message)
		return { success: true }
	}
}
