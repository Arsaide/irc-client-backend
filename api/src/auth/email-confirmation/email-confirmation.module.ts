import { forwardRef, Module } from '@nestjs/common'

import { AuthModule } from '@/auth/auth.module'
import { MailModule } from '@/libs/mail/mail.module'
import { UserModule } from '@/user/user.module'

import { EmailConfirmationController } from './email-confirmation.controller'
import { EmailConfirmationService } from './email-confirmation.service'

@Module({
	imports: [forwardRef(() => AuthModule), MailModule, UserModule],
	controllers: [EmailConfirmationController],
	providers: [EmailConfirmationService],
	exports: [EmailConfirmationService]
})
export class EmailConfirmationModule {}
