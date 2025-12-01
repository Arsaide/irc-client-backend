import { MailerModule } from '@nestjs-modules/mailer'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { getMailerConfig } from '@/libs/mail/config'
import { MailService } from '@/libs/mail/mail.service'

@Module({
	providers: [MailService],
	imports: [
		MailerModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: getMailerConfig,
			inject: [ConfigService]
		})
	],
	exports: [MailService]
})
export class MailModule {}
