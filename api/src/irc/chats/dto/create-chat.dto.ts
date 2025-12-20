import { IsNotEmpty, IsString } from 'class-validator'
import { User } from '@prisma/__generated__'

export class CreateChatDto {
	@IsString()
	@IsNotEmpty()
	title: string

	@IsOptional()
  	@ValidateNested({ each: true })
  	@Type(() => User)
  	members: User[];
}
