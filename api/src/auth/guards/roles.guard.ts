import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@prisma/client'

import { ROLES_KEY } from '@/auth/decorators'

@Injectable()
export class RolesGuard implements CanActivate {
	public constructor(private readonly reflector: Reflector) {}

	public canActivate(context: ExecutionContext): boolean {
		const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass()
		])
		const request = context.switchToHttp().getRequest()

		if (!roles) {
			return true
		}

		if (!roles.includes(request.user.role)) {
			throw new ForbiddenException(
				"You don't have permission to access this resource"
			)
		}

		return true
	}
}
