import { Html } from '@react-email/html'
import { Body, Container, Heading, Section, Tailwind, Text } from '@react-email/components'
import * as React from 'react'

interface TwoFactorAuthTemplateProps {
    token: string;
}

export function TwoFactorAuthTemplate({token }: TwoFactorAuthTemplateProps) {
    return (
		<Tailwind>
			<Html>
				<Body className="bg-[#f5f5f5] text-[#111] font-sans py-10">
					<Container className="bg-white mx-auto p-8 rounded-xl shadow-lg max-w-md border border-[#eee]">
						<Heading className="text-2xl font-semibold text-center mb-3">
							Two-Factor Code
						</Heading>

						<Text className="text-base text-center mb-6 text-[#555]">
							Use the code below to complete your login.
						</Text>

						<Section className="text-center mb-6">
							<div className="inline-block bg-[#f0f0f0] text-black px-6 py-4 rounded-md font-semibold text-xl tracking-widest">
								{token}
							</div>
						</Section>

						<Text className="text-xs text-[#777] text-center">
							This code is valid for 5 minutes. If you didn’t request it, just ignore this email.
						</Text>
					</Container>
				</Body>
			</Html>
		</Tailwind>
    );
}
