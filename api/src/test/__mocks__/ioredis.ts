import { EventEmitter } from 'events'

class RedisMock extends EventEmitter {
	status = 'ready'

	constructor() {
		super()
	}

	public override on(
		event: string | symbol,
		listener: (...args: unknown[]) => void
	): this {
		if (event === 'connect' || event === 'ready') {
			listener()
		}
		return super.on(event, listener as () => void)
	}

	connect = jest.fn().mockResolvedValue(undefined)
	disconnect = jest.fn().mockResolvedValue(undefined)
	quit = jest.fn().mockResolvedValue(undefined)

	set = jest.fn().mockResolvedValue('OK')
	get = jest.fn().mockResolvedValue('some-value')
	del = jest.fn().mockResolvedValue(1)
}

export default RedisMock
