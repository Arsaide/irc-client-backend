import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Req
} from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { Request } from 'express'

import { Authorization } from '@/auth/decorators/auth.decorator'
import { Authorized } from '@/auth/decorators/autorized.decorator'
import { UpdateOwnProfileDto, UpdateUserProfileDto } from '@/user/dto'

import { UserService } from './user.service'

@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Authorization()
	@Get('profile')
	@HttpCode(HttpStatus.OK)
	public async findProfile(@Authorized('id') userId: string) {
		const user = await this.userService.findById(userId)

		return {
			...user
		}
	}

	@Authorization(UserRole.REGULAR, UserRole.ADMIN)
	@Get('by-id/:id')
	@HttpCode(HttpStatus.OK)
	public async getById(@Param('id') id: string) {
		return this.userService.findById(id)
	}

	@Authorization(UserRole.ADMIN)
	@Patch('by-id/:id')
	@HttpCode(HttpStatus.OK)
	public async updateUserProfile(
		@Authorized('id') id: string,
		@Param('id') userId: string,
		@Body() dto: UpdateUserProfileDto,
		@Req() req: Request
	) {
		return this.userService.updateUserProfile(userId, id, dto, req)
	}

	@Authorization()
	@Patch('profile')
	@HttpCode(HttpStatus.OK)
	public async updateOwnProfile(
		@Authorized('id') userId: string,
		@Body() dto: UpdateOwnProfileDto
	) {
		return this.userService.updateOwnProfile(userId, dto)
	}
}
