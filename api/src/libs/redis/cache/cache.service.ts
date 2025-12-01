import { Inject, Injectable, Logger } from '@nestjs/common'
import { createHash } from 'crypto'
import Redis from 'ioredis'

import { REDIS } from '../redis.provider'

@Injectable()
export class CacheService {
	private readonly logger = new Logger(CacheService.name)

	constructor(@Inject(REDIS) private readonly redis: Redis) {}

	// Stable keys sorting
	private stableStringify(object: unknown): string {
		if (object === null || typeof object !== 'object') {
			return JSON.stringify(object)
		}

		const sorted = Object.keys(object as Record<string, unknown>)
			.sort()
			.reduce(
				(acc, k) => {
					acc[k] = this.stableStringify(
						(object as Record<string, unknown>)[k]
					)
					return acc
				},
				{} as Record<string, unknown>
			)

		return JSON.stringify(sorted)
	}

	public buildKey(ns: string, payload: unknown): string {
		const json = this.stableStringify(payload)
		const hash = createHash('sha256')
			.update(json)
			.digest('hex')
			.slice(0, 32)
		return `${ns}:${hash}`
	}

	public async get<T>(key: string): Promise<T | null> {
		try {
			const raw = await this.redis.get(key)
			if (!raw) return null
			return JSON.parse(raw) as T
		} catch (error) {
			this.logger.warn(
				`Redis get fallback for key=${key}: ${(error as Error).message}`
			)
			return null
		}
	}

	public async set<T>(key: string, value: T, ttlSec?: number): Promise<void> {
		try {
			await this.redis.set(
				key,
				JSON.stringify(value),
				'EX' as const,
				ttlSec as number
			)
		} catch (error) {
			this.logger.warn(
				`Redis set fallback for key=${key}: ${(error as Error).message}`
			)
		}
	}

	public async wrap<T>(
		key: string,
		ttlSec: number,
		producer: () => Promise<T>
	): Promise<T> {
		const cached = await this.get<T>(key)
		if (cached !== null) return cached

		const fresh = await producer()
		await this.set(key, fresh, ttlSec)

		return fresh
	}
}
