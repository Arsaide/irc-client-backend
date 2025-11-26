import type { Config } from 'jest'

const config: Config = {
	moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
	modulePathIgnorePatterns: ['<rootDir>/dist/'],

	rootDir: '.',
	testRegex: '.*\\.spec\\.ts$',

	transform: {
		'^.+\\.(t|j)sx?$': 'ts-jest'
	},

	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^uuid$': '<rootDir>/test/__mocks__/uuid.js',
		'^argon2$': '<rootDir>/test/__mocks__/argon2.js'
	},

	modulePaths: ['<rootDir>'],
	testEnvironment: 'node',

	transformIgnorePatterns: ['node_modules/(?!(uuid)/)']
}

export default config
