import {
	type ValidationArguments,
	ValidatorConstraint,
	type ValidatorConstraintInterface
} from 'class-validator'

import { RegisterDto } from '@/auth/dto'

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

	public defaultMessage(): string {
		return `Passwords doesn't must match`
	}
}
