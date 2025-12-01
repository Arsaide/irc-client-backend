import { UserRole } from '@prisma/__generated__'
import 'express-session'

declare module 'express-session' {
	interface SessionData {
		user: {
			id: string
			role: UserRole
		}
	}
}
