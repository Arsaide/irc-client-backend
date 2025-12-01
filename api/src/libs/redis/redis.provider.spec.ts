import { Test, TestingModule } from '@nestjs/testing'
import Redis from 'ioredis'

import RedisMock from '@/test/__mocks__/ioredis'

import { REDIS, REDIS_SESSION, redisProviders } from './redis.provider'

describe('RedisProvider', () => {
	let redisService: Redis
	let redisSessionService: Redis

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				...redisProviders,
				{
					provide: REDIS,
					useValue: new RedisMock()
				},
				{
					provide: REDIS_SESSION,
					useValue: new RedisMock()
				}
			]
		}).compile()

		redisService = module.get<Redis>(REDIS)
		redisSessionService = module.get<Redis>(REDIS_SESSION)
	})

	afterAll(async () => {
		if (redisService) await redisService.quit().catch(() => {})
		if (redisSessionService)
			await redisSessionService.quit().catch(() => {})
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
