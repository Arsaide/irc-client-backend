import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { RedisStore } from 'connect-redis'
import * as cookieParser from 'cookie-parser'
import * as express from 'express'
import * as session from 'express-session'
import Redis from 'ioredis'

import { REDIS, REDIS_SESSION } from '@/libs/redis/redis.provider'

import { AppModule } from './app.module'
import { ms, parseBoolean, StringValue } from './libs/common/utils'

async function bootstrap() {
	const logger = new Logger('BOOTSTRAP')

	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		logger:
			process.env.NODE_ENV === 'development'
				? ['log', 'error', 'warn', 'debug', 'verbose']
				: ['error', 'warn']
	})

	app.set('trust proxy', 1)

	const config = app.get(ConfigService)

	const redis = app.select(AppModule).get<Redis>(REDIS)
	try {
		await redis.set('healthcheck', 'ok')
	} catch (e) {
		logger.error('Redis healthcheck failed', e)
	}

	const redisSessionClient = app.get(REDIS_SESSION)

	app.enableCors({
		origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
		credentials: true,
		methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'Cookie',
			'recaptcha',
			'x-api-key'
		],
		exposedHeaders: ['Set-Cookie']
	})

	app.use(cookieParser(config.getOrThrow('COOKIES_SECRET')))

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	)

	app.use(
		session({
			secret: config.getOrThrow<string>('SESSION_SECRET'),
			name: config.getOrThrow<string>('SESSION_NAME'),
			resave: true,
			saveUninitialized: false,
			cookie: {
				domain: config.getOrThrow<string>('SESSION_DOMAIN'),
				maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
				httpOnly: parseBoolean(
					config.getOrThrow<string>('SESSION_HTTP_ONLY')
				),
				secure: parseBoolean(
					config.getOrThrow<string>('SESSION_SECURE')
				),
				sameSite: 'lax'
			},
			proxy: true,
			store: new RedisStore({
				client: redisSessionClient,
				prefix: config.getOrThrow('SESSION_FOLDER')
			})
		})
	)

	app.use(express.json({ limit: '10mb' }))
	app.use(express.urlencoded({ limit: '10mb', extended: true }))

	await app.listen(config.getOrThrow<number>('APPLICATION_PORT'), '0.0.0.0')
}
bootstrap()
