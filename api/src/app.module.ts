import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { IS_DEV_ENV } from '@/libs/common/utils'
import { CacheModule } from '@/libs/redis/cache/cache.module'
import { RedisModule } from '@/libs/redis/redis.module'
import { PrismaModule } from '@/prisma/prisma.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: !IS_DEV_ENV }),
		RedisModule,
		CacheModule,
		PrismaModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
