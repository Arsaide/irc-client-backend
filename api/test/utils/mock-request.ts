import type { Request } from 'express'

import type { TestSession } from '../types/session-user.type'

export function createRequest<T>(
	sessionData: T
): Request & { session: TestSession<T> } {
	const session = {
		id: 'test-session-id',
		cookie: {} as unknown,
		regenerate: jest.fn(),
		destroy: jest.fn(),
		reload: jest.fn(),
		resetMaxAge: jest.fn(),
		save: jest.fn(),

		...sessionData
	}

	return {
		session
	} as Request & { session: TestSession<T> }
}
