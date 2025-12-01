import { UserRole } from '@prisma/client'
import type { Request } from 'express'
import type { Session, SessionData } from 'express-session'

export type SessionUser = {
	id: string
	role: UserRole | string
}

export type TestRequest = Request & {
	session: Session &
		Partial<SessionData> & {
			user: SessionUser
		}
}
