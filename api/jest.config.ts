import type { Config } from 'jest'

const config: Config = {
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: '.',
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.ts$': 'ts-jest'
	},

	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@prisma/__generated__$': '<rootDir>/prisma/__generated__',
		'^@prisma/__generated__/(.*)$': '<rootDir>/prisma/__generated__/$1'
	},

	modulePaths: ['<rootDir>'],
	testEnvironment: 'node'
}

export default config
