import type { Request } from 'express'

export type WithSession<T> = Omit<Request, 'session'> & {
	session: T
}
