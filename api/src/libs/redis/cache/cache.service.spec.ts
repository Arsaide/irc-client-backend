import { Test, TestingModule } from '@nestjs/testing'
import Redis from 'ioredis'

import { REDIS } from '@/libs/redis/redis.provider'

import { CacheService } from './cache.service'

describe('CacheService', () => {
	let cacheService: CacheService
	let redisMock: Redis

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CacheService,
				{
					provide: REDIS,
					useValue: {
						get: jest.fn(),
						set: jest.fn()
					}
				}
			]
		}).compile()

		cacheService = module.get<CacheService>(CacheService)
		redisMock = module.get<Redis>(REDIS)
	})

	it('should be defined', () => {
		expect(cacheService).toBeDefined()
	})

	it('should set and get from cache', async () => {
		const key = 'test-key'
		const value = { test: 'value' }

		jest.spyOn(redisMock, 'set').mockResolvedValue('OK')
		jest.spyOn(redisMock, 'get').mockResolvedValue(JSON.stringify(value))

		await cacheService.set(key, value)
		const result = await cacheService.get(key)

		expect(redisMock.set).toHaveBeenCalledWith(
			key,
			JSON.stringify(value),
			'EX',
			undefined
		)
		expect(result).toEqual(value)
	})
})
