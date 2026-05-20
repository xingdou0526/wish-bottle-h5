import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileDto } from '@wishbottle/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: dto.nickname,
        birthday: dto.birthday === '' ? null : dto.birthday,
        signature: dto.signature === '' ? null : dto.signature,
        avatar: dto.avatar,
      },
    });
    if (!user) throw new NotFoundException();
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      birthday: user.birthday,
      signature: user.signature,
      avatar: user.avatar,
    };
  }
}
