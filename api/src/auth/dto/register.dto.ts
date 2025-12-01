import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MinLength,
	Validate
} from 'class-validator'

import { IsPasswordMatchingConstraint } from '@/libs/common/decorators'

export class RegisterDto {
	@IsString({ message: 'Name must be a string' })
	@IsNotEmpty({ message: 'Name is required' })
	name: string

	@IsString({ message: 'Email must be a string' })
	@IsEmail({}, { message: 'Email is invalid' })
	@IsNotEmpty({ message: 'Email is required' })
	email: string

	@IsString({ message: 'Password must be a string' })
	@IsNotEmpty({ message: 'Password is required' })
	@MinLength(8, { message: 'Password must be at least 8 characters' })
	password: string

	@IsString({ message: 'Access password must be a string' })
	@IsNotEmpty({ message: 'Access password is required' })
	@MinLength(8, { message: 'Access password must be at least 8 characters' })
	@Validate(IsPasswordMatchingConstraint, {
		message: 'Passwords must match'
	})
	passwordRepeat: string
}
