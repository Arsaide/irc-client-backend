export const mockIrcClient = {
	connect: jest.fn(),
	on: jest.fn(),
	join: jest.fn(),
	part: jest.fn(),
	say: jest.fn(),
	raw: jest.fn(),
	quit: jest.fn()
}

export class Client {
	constructor() {
		return mockIrcClient
	}
}
