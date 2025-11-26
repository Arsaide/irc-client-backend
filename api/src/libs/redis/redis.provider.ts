import { Logger, type Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { createClient } from 'redis'

import { isDev } from '@/libs/common/utils'

export const REDIS = Symbol('REDIS')
export const REDIS_SESSION = Symbol('REDIS_SESSION')

export const redisProviders: Provider[] = [
	{
		provide: REDIS,
		inject: [ConfigService],
		useFactory: (configService: ConfigService) => {
			const logger = new Logger('IOREDIS')

			const client = new Redis({
				host: configService.getOrThrow('REDIS_HOST'),
				port: configService.getOrThrow<number>('REDIS_PORT') || 6379,
				password:
					configService.getOrThrow('REDIS_PASSWORD') || undefined,
				enableReadyCheck: true,
				enableAutoPipelining: !isDev(configService),
				maxRetriesPerRequest: null,
				retryStrategy: times => {
					logger.warn(`ioredis reconnect attempt #${times}`)
					return Math.min(times * 100, 2000)
				}
			})

			client.on('error', err => {
				logger.error('ioredis connection error', err)
			})

			client.on('connect', () => {
				logger.log('ioredis successfully connected')
			})

			return client
		}
	},
	{
		provide: REDIS_SESSION,
		inject: [ConfigService],
		useFactory: async (configService: ConfigService) => {
			const logger = new Logger('IOREDIS SESSION')

			const redisClient = createClient({
				socket: {
					host: configService.getOrThrow('REDIS_HOST'),
					port: configService.getOrThrow('REDIS_PORT')
				},
				password: configService.getOrThrow('REDIS_PASSWORD')
			})

			redisClient.on('error', err =>
				logger.error('ioredis session error', err)
			)
			redisClient.on('connect', () =>
				logger.log('ioredis session connected')
			)

			await redisClient.connect()
			return redisClient
		}
	}
]
