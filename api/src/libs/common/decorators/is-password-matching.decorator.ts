import {
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface
} from 'class-validator'

import { RegisterDto } from '@/auth/dto/register.dto'

@ValidatorConstraint({ name: 'isPasswordMatching', async: false })
export class IsPasswordMatchingConstraint
	implements ValidatorConstraintInterface
{
	public validate(
		passwordRepeat: string,
		args: ValidationArguments
	): boolean {
		const obj = args.object as RegisterDto
		return obj.password === passwordRepeat
	}

	public defaultMessage(validationArguments?: ValidationArguments): string {
		return "Passwords doesn't must match"
	}
}
