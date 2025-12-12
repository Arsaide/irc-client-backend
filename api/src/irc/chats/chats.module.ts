import { Module } from '@nestjs/common'

import { SessionModule } from '@/auth/session/session.module'
import { EventsModule } from '@/events/events.module'
import { IrcModule } from '@/irc/irc.module'
import { UserModule } from '@/user/user.module'

import { ChatsController } from './chats.controller'
import { ChatsService } from './chats.service'

@Module({
	imports: [IrcModule, UserModule, SessionModule, EventsModule],
	controllers: [ChatsController],
	providers: [ChatsService]
})
export class ChatsModule {}
