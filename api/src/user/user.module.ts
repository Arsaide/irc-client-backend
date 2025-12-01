import { forwardRef, Module } from '@nestjs/common'

import { SessionModule } from '@/auth/session/session.module'

import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
	imports: [forwardRef(() => SessionModule)],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService]
})
export class UserModule {}
