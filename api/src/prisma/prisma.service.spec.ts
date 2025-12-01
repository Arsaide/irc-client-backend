import { Test, TestingModule } from '@nestjs/testing'

import { PrismaService } from './prisma.service'

describe('PrismaService', () => {
	let prismaService: PrismaService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [PrismaService]
		}).compile()

		prismaService = module.get<PrismaService>(PrismaService)
	})

	it('should be defined', () => {
		expect(prismaService).toBeDefined()
	})

	describe('onModuleInit', () => {
		it('should be call $connect when initializing the module', async () => {
			const connectSpy = jest
				.spyOn(prismaService, '$connect')
				.mockImplementation(async () => {})

			await prismaService.onModuleInit()

			expect(connectSpy).toHaveBeenCalled()
		})
	})

	describe('onModuleDestroy', () => {
		it('should be call $disconnect when the module is destroyed', async () => {
			const disconnectSpy = jest
				.spyOn(prismaService, '$disconnect')
				.mockImplementation(async () => {})

			await prismaService.onModuleDestroy()

			expect(disconnectSpy).toHaveBeenCalled()
		})
	})
})
