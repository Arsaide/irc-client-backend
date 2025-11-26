import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength
} from 'class-validator'

export class LoginDto {
	@IsString({ message: 'Email must be a string' })
	@IsEmail({}, { message: 'Email is invalid' })
	@IsNotEmpty({ message: 'Email is required' })
	email: string

	@IsString({ message: 'Password must be a string' })
	@IsNotEmpty({ message: 'Password is required' })
	@MinLength(8, { message: 'Password must be at least 8 characters' })
	password: string

	@IsOptional()
	@IsString()
	code: string
}
