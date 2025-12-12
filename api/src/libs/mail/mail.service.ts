import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { render } from '@react-email/components'

import { ConfirmationTemplate } from '@/libs/mail/templates/confirmation.template'
import { ResetPasswordTemplate } from '@/libs/mail/templates/reset-password.template'
import { TwoFactorAuthTemplate } from '@/libs/mail/templates/two-factor-auth.template'

@Injectable()
export class MailService {
	public constructor(
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService
	) {}

	public async sendConfirmationEmail(email: string, token: string) {
		const domain = this.configService.getOrThrow<string>('APP_URL_TYPE')
		const html = await render(ConfirmationTemplate({ domain, token }))

		return this.sendMail(email, 'Confirm your email', html)
	}

	public async sendResetPassword(email: string, token: string) {
		const domain = this.configService.getOrThrow<string>('APP_URL_TYPE')
		const html = await render(ResetPasswordTemplate({ domain, token }))

		return this.sendMail(email, 'Reset password', html)
	}

	public async sendTwoFactorToken(email: string, token: string) {
		const html = await render(TwoFactorAuthTemplate({ token }))

		return this.sendMail(email, 'Two-factor authentication', html)
	}

	private sendMail(email: string, subject: string, html: string) {
		return this.mailerService.sendMail({
			to: email,
			subject,
			html
		})
	}
}
