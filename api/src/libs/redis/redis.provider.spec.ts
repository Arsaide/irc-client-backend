import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import Redis from 'ioredis'

import { REDIS, REDIS_SESSION, redisProviders } from './redis.provider'

jest.mock('ioredis', () => {
	class RedisMock {
		status = 'ready'

		constructor() {}

		on(event: string, cb: () => void) {
			if (event === 'connect' || event === 'ready') {
				cb()
			}
		}

		connect = jest.fn().mockResolvedValue(undefined)
		disconnect = jest.fn().mockResolvedValue(undefined)
		quit = jest.fn().mockResolvedValue(undefined)

		set = jest.fn().mockResolvedValue('OK')
		get = jest.fn().mockResolvedValue('some-value')
		del = jest.fn().mockResolvedValue(1)
	}

	return {
		default: RedisMock
	}
})

describe('RedisProvider', () => {
	let redisService: Redis
	let redisSessionService: Redis

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				...redisProviders,
				{
					provide: ConfigService,
					useValue: {
						getOrThrow: jest.fn((key: string) => {
							switch (key) {
								case 'REDIS_HOST':
									return 'localhost'
								case 'REDIS_PORT':
									return 6379
								case 'REDIS_PASSWORD':
									return 'password'
								default:
									return null
							}
						}),
						get: jest.fn(() => false)
					}
				}
			]
		}).compile()

		redisService = module.get<Redis>(REDIS)
		redisSessionService = module.get<Redis>(REDIS_SESSION)
	})

	it('should be defined', () => {
		expect(redisService).toBeDefined()
		expect(redisSessionService).toBeDefined()
	})

	it('should connect to redis', async () => {
		await redisService.connect()
		expect(redisService.connect).toHaveBeenCalled()
	})

	it('should handle redis connection errors', async () => {
		const error = new Error('Redis connection error')

		;(redisService.connect as jest.Mock).mockRejectedValueOnce(error)

		await expect(redisService.connect()).rejects.toThrow(error)

		expect(redisService.connect).toHaveBeenCalled()
	})

	it('should set and get values from Redis', async () => {
		const key = 'test-key'
		const value = 'test-value'

		;(redisService.set as jest.Mock).mockResolvedValue('OK')
		;(redisService.get as jest.Mock).mockResolvedValue(value)

		await redisService.set(key, value)
		const result = await redisService.get(key)

		expect(redisService.set).toHaveBeenCalledWith(key, value)
		expect(result).toBe(value)
	})
})
