import { IsNotEmpty, IsString, MinLength, Validate } from 'class-validator'

import { IsPasswordMatchingConstraint } from '@/libs/common/decorators'

export class NewPasswordDto {
	@IsString({ message: 'Password must be a string' })
	@MinLength(8, {
		message: 'Password must be at least 8 characters long'
	})
	@IsNotEmpty({ message: 'Password must be not empty' })
	password: string

	@IsString({ message: 'Access password must be a string' })
	@IsNotEmpty({ message: 'Access password is required' })
	@MinLength(8, { message: 'Access password must be at least 8 characters' })
	@Validate(IsPasswordMatchingConstraint, {
		message: 'Passwords must match'
	})
	passwordRepeat: string
}
