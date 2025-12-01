import { IsNotEmpty, IsString } from 'class-validator'

export class SendMessageDto {
	@IsString()
	@IsNotEmpty()
	target: string

	@IsString()
	@IsNotEmpty()
	message: string
}
