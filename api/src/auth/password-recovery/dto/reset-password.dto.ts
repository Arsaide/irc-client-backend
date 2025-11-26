import { IsEmail, IsNotEmpty } from 'class-validator'

export class ResetPasswordDto {
	@IsEmail({}, { message: 'Email must be valid.' })
	@IsNotEmpty({ message: 'Email must be not empty.' })
	email: string
}
