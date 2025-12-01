import { ArrayNotEmpty, IsArray, IsString, IsUUID } from 'class-validator'

export class AddMemberDto {
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	@IsUUID('4', { each: true })
	userIds: string[]
}
