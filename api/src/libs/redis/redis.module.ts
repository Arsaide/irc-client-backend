import { Global, Module } from '@nestjs/common'

import { redisProviders } from '@/libs/redis/redis.provider'

@Global()
@Module({
	providers: [...redisProviders],
	exports: [...redisProviders]
})
export class RedisModule {}
