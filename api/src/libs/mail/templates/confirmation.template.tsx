import { Html } from '@react-email/html'
import { Body, Container, Heading, Link, Section, Tailwind, Text } from '@react-email/components'
import * as React from 'react'

interface ConfirmationTemplateProps {
	domain: string
	token: string
}

export function ConfirmationTemplate({
	domain,
	token,
}: ConfirmationTemplateProps) {
	const confirmationLink = `${domain}/auth/email-confirmation?token=${token}`

	return(
		<Tailwind>
			<Html>
				<Body className="bg-[#f5f5f5] font-sans text-[#111] py-10">
					<Container className="bg-white mx-auto p-8 rounded-xl shadow-lg max-w-md border border-[#eee]">
						<Heading className="text-2xl font-semibold text-center mb-3">
							Confirm your email
						</Heading>

						<Text className="text-base text-center mb-6 text-[#555]">
							To access your account, please confirm your email by clicking the
							button below.
						</Text>

						<Section className="text-center mb-6">
							<Link
								href={confirmationLink}
								className="inline-block bg-black text-white text-sm px-5 py-3 rounded-md font-medium"
							>
								Confirm email
							</Link>
						</Section>

						<Text className="text-xs text-[#777] text-center">
							This link is valid for 1 hour. If you didn't request this, simply ignore the email.
						</Text>
					</Container>
				</Body>
			</Html>
		</Tailwind>
    )
}
