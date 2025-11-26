import { forwardRef, Module } from '@nestjs/common'

import { SessionService } from '@/auth/session/session.service'
import { PrismaModule } from '@/prisma/prisma.module'
import { UserModule } from '@/user/user.module'

@Module({
	imports: [PrismaModule, forwardRef(() => UserModule)],
	providers: [SessionService],
	exports: [SessionService]
})
export class SessionModule {}
