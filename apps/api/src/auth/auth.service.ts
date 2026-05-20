import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto, PublicUser } from '@wishbottle/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private toPublic(u: {
    id: string;
    email: string;
    nickname: string;
    birthday: string | null;
    signature: string | null;
    avatar: string;
  }): PublicUser {
    return {
      id: u.id,
      email: u.email,
      nickname: u.nickname,
      birthday: u.birthday,
      signature: u.signature,
      avatar: u.avatar,
    };
  }

  private sign(user: { id: string; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) throw new ConflictException('该邮箱已被注册');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        nickname: dto.nickname,
        birthday: dto.birthday || null,
        signature: dto.signature || null,
        avatar: dto.avatar,
      },
    });

    // 自动接受所有发到该邮箱的 pending 邀请
    await this.prisma.invite.updateMany({
      where: { toEmail: user.email, status: 'pending' },
      data: { toUserId: user.id },
    });

    return {
      accessToken: this.sign(user),
      user: this.toPublic(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('邮箱或密码错误');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('邮箱或密码错误');

    return {
      accessToken: this.sign(user),
      user: this.toPublic(user),
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }
}
