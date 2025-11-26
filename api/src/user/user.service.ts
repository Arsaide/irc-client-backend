import {
	ConflictException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as argon2 from 'argon2'
import { Request } from 'express'

import { SessionService } from '@/auth/session/session.service'
import { PrismaService } from '@/prisma/prisma.service'
import { UpdateOwnProfileDto, UpdateUserProfileDto } from '@/user/dto'

@Injectable()
export class UserService {
	public constructor(
		private readonly prisma: PrismaService,
		@Inject(forwardRef(() => SessionService))
		private readonly sessionService: SessionService
	) {}

	public async findById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id }
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		return user
	}

	public async findByEmail(email: string) {
		const user = await this.prisma.user.findUnique({
			where: { email }
		})

		if (!user) {
			throw new NotFoundException(
				'User is not found. Please, check email and try again.'
			)
		}

		return user
	}

	public async create(
		email: string,
		password: string,
		name: string,
		isVerified: boolean
	) {
		const exist = await this.prisma.user.findUnique({
			where: { name }
		})

		if (exist) {
			throw new ConflictException(
				'This name is already taken. Please choose another name and try again!'
			)
		}

		return this.prisma.user.create({
			data: {
				email,
				password: password ? await argon2.hash(password) : null,
				name,
				isVerified
			}
		})
	}

	public async updateOwnProfile(userId: string, dto: UpdateOwnProfileDto) {
		const user = await this.findById(userId)

		return this.prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				name: dto.name,
				isTwoFactorEnabled: dto.isTwoFactorEnabled
			}
		})
	}

	public async updateUserProfile(
		userId: string,
		currentUserId: string,
		dto: UpdateUserProfileDto,
		req: Request
	) {
		const user = await this.findById(userId)

		const data: Prisma.UserUpdateInput = {
			name: dto.name,
			email: dto.email,
			role: dto.role,
			isVerified: dto.isVerified,
			isTwoFactorEnabled: dto.isTwoFactorEnabled
		}

		if (dto.password && dto.password.trim().length > 0) {
			data.password = await argon2.hash(dto.password)
		}

		const updated = await this.prisma.user.update({
			where: { id: user.id },
			data
		})

		await this.sessionService.refreshUserSession(userId, currentUserId, req)

		return updated
	}
}
