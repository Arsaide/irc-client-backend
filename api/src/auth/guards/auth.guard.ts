import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'

import { SessionService } from '@/auth/session/session.service'
import { UserService } from '@/user/user.service'

@Injectable()
export class AuthGuard implements CanActivate {
	public constructor(
		private readonly userService: UserService,
		private readonly sessionRefresh: SessionService
	) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const session = request.session

		if (!session || !session?.user?.id) {
			throw new UnauthorizedException(
				'User not authenticated. Please login in to gain access.'
			)
		}

		if (await this.sessionRefresh.shouldRefresh(session.user.id)) {
			const freshUser = await this.userService.findById(session.user.id)

			Object.assign(session.user, {
				role: freshUser.role
			})

			await new Promise<void>((resolve, reject) => {
				session.save((error: Error | null) =>
					error ? reject(error) : resolve()
				)
			})

			await this.sessionRefresh.clear(session.user.id)
		}

		request.user = await this.userService.findById(session.user.id)

		return true
	}
}
