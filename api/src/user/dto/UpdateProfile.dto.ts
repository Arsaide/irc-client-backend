import { UserRole } from '@prisma/__generated__'
import {
	IsBoolean,
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength
} from 'class-validator'

export class UpdateOwnProfileDto {
	@IsString({ message: 'Name must be a string' })
	@IsNotEmpty({ message: 'Name must be not empty' })
	name: string

	@IsBoolean({ message: '"Two Factor Auth" must be a boolean value' })
	isTwoFactorEnabled: boolean
}

export class UpdateUserProfileDto {
	@IsString({ message: 'Name must be a string' })
	@IsNotEmpty({ message: 'Name must be not empty' })
	name: string

	@IsString({ message: 'Email must be a string' })
	@IsNotEmpty({ message: 'Email must be not empty' })
	@IsEmail({}, { message: 'Email is invalid' })
	email: string

	@IsOptional()
	@IsString({ message: 'Password must be a string' })
	@IsNotEmpty({ message: 'Password is required' })
	@MinLength(8, { message: 'Password must be at least 8 characters' })
	password: string

	@IsString({ message: 'Role must be a string' })
	@IsNotEmpty({ message: 'Role is required' })
	@IsEnum(UserRole, { message: 'Invalid role' })
	role: UserRole

	@IsBoolean({ message: '"Verified email" must be a boolean value' })
	isVerified: boolean

	@IsBoolean({ message: '"Two Factor Auth" must be a boolean value' })
	isTwoFactorEnabled: boolean
}
