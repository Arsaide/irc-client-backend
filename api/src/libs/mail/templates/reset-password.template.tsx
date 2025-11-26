import { Html } from '@react-email/html'
import { Body, Container, Heading, Link, Section, Tailwind, Text } from '@react-email/components'
import * as React from 'react'

interface ResetPasswordTemplateProps {
    domain: string;
    token: string;
}

export function ResetPasswordTemplate({ domain, token }: ResetPasswordTemplateProps) {
    const resetLink = `${domain}/auth/new-password?token=${token}`;

    return (
		<Tailwind>
			<Html>
				<Body className="bg-[#f5f5f5] text-[#111] font-sans py-10">
					<Container className="bg-white mx-auto p-8 rounded-xl shadow-lg max-w-md border border-[#eee]">
						<Heading className="text-2xl font-semibold text-center mb-3">
							Reset your password
						</Heading>

						<Text className="text-base text-center mb-6 text-[#555]">
							Click the button below to set a new password for your account.
						</Text>

						<Section className="text-center mb-6">
							<Link
								href={resetLink}
								className="inline-block bg-black text-white text-sm px-5 py-3 rounded-md font-medium"
							>
								Reset Password
							</Link>
						</Section>

						<Text className="text-xs text-[#777] text-center">
							This link is valid for 1 hour. If you didn’t request this, just ignore this email.
						</Text>
					</Container>
				</Body>
			</Html>
		</Tailwind>
    );
}
