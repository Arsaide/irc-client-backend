import { Module } from '@nestjs/common'

import { SessionModule } from '@/auth/session/session.module'
import { IrcController } from '@/irc/irc.controller'
import { UserModule } from '@/user/user.module'

import { IrcService } from './irc.service'

@Module({
	imports: [SessionModule, UserModule],
	controllers: [IrcController],
	providers: [IrcService],
	exports: [IrcService]
})
export class IrcModule {}
