import { Module } from '@nestjs/common'

import { IrcController } from '@/irc/irc.controller'

import { IrcService } from './irc.service'

@Module({
	controllers: [IrcController],
	providers: [IrcService],
	exports: [IrcService]
})
export class IrcModule {}
