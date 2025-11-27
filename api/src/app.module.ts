import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from '@/auth/auth.module'
import { IrcModule } from '@/irc/irc.module'
import { IS_DEV_ENV } from '@/libs/common/utils'
import { CacheModule } from '@/libs/redis/cache/cache.module'
import { RedisModule } from '@/libs/redis/redis.module'
import { PrismaModule } from '@/prisma/prisma.module'
import { UserModule } from '@/user/user.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: !IS_DEV_ENV }),
		RedisModule,
		CacheModule,
		PrismaModule,
		AuthModule,
		UserModule,
		IrcModule
	],
	controllers: [],
	providers: []
})
export class AppModule {}
