import { MailerOptions } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'

export const getMailerConfig = (
	configService: ConfigService
): MailerOptions => {
	const host = configService.getOrThrow<string>('MAIL_HOST')
	const port = Number(configService.getOrThrow<string>('MAIL_PORT'))
	const secure = configService.get<string>('MAIL_SECURE', 'false') === 'true'
	const user = configService.getOrThrow<string>('MAIL_LOGIN')
	const pass = configService.getOrThrow<string>('MAIL_PASSWORD')
	const from = configService.getOrThrow<string>('MAIL_FROM')

	return {
		transport: {
			host,
			port,
			secure,
			auth: { user, pass },
			pool: true,
			maxConnections: 5,
			maxMessages: 100,
			connectionTimeout: 20_000,
			greetingTimeout: 10_000,
			socketTimeout: 30_000
		},
		defaults: {
			from: `"IRC Client Project" <${from}>`
		}
	}
}
