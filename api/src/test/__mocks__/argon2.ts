export const hash = jest.fn().mockResolvedValue('hashed-password-global')
export const verify = jest.fn().mockResolvedValue(true)

const argon2 = {
	hash,
	verify
}

export default argon2
