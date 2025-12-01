import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { Request } from 'express'
import Redis from 'ioredis'

import { REDIS } from '@/libs/redis/redis.provider'
import { UserService } from '@/user/user.service'

@Injectable()
export class SessionService {
	constructor(
		@Inject(REDIS)
		private readonly redis: Redis,
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService
	) {}

	public async markUserForRefresh(userId: string, req: Request) {
		if (userId === req.session.user?.id) {
			const freshUser = await this.userService.findById(userId)

			req.session.user = {
				...req.session.user,
				role: freshUser.role
			}

			await new Promise<void>((resolve, reject) => {
				req.session.save((error: Error | null) =>
					error ? reject(error) : resolve()
				)
			})
		} else {
			await this.redis.set(`needs_refresh:${userId}`, '1', 'EX', 3600)
		}
	}

	public async shouldRefresh(userId: string) {
		return !!(await this.redis.get(`needs_refresh:${userId}`))
	}

	public async clear(userId: string) {
		await this.redis.del(`needs_refresh:${userId}`)
	}

	public async refreshUserSession(
		userId: string,
		currentUserId: string,
		req: Request
	) {
		if (userId === currentUserId) {
			const freshUser = await this.userService.findById(userId)
			req.session.user = {
				...req.session.user,
				id: freshUser.id,
				role: freshUser.role
			}

			await new Promise<void>((resolve, reject) => {
				req.session.save((error: Error | null) =>
					error ? reject(error) : resolve()
				)
			})
		} else {
			await this.markUserForRefresh(userId, req)
		}
	}
}
