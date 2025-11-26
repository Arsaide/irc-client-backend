import { forwardRef, Module } from '@nestjs/common'

import { EmailConfirmationModule } from '@/auth/email-confirmation/email-confirmation.module'
import { SessionModule } from '@/auth/session/session.module'
import { TwoFactorAuthService } from '@/auth/two-factor-auth/two-factor-auth.service'
import { MailService } from '@/libs/mail/mail.service'
import { UserModule } from '@/user/user.module'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
	imports: [
		forwardRef(() => EmailConfirmationModule),
		UserModule,
		SessionModule
	],
	controllers: [AuthController],
	providers: [AuthService, MailService, TwoFactorAuthService],
	exports: [AuthService]
})
export class AuthModule {}
