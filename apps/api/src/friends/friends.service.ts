import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Friend, Invite } from '@wishbottle/shared';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Friend[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, nickname: true, avatar: true, signature: true, email: true } },
        userB: { select: { id: true, nickname: true, avatar: true, signature: true, email: true } },
      },
    });
    return rows.map((r) => (r.userAId === userId ? r.userB : r.userA));
  }

  async remove(userId: string, friendUserId: string) {
    const [a, b] = [userId, friendUserId].sort();
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userAId: a, userBId: b },
          { userAId: b, userBId: a },
        ],
      },
    });
    return { ok: true };
  }

  async createInvite(userId: string, toEmail: string): Promise<{ kind: 'friend' | 'invite'; data: Friend | Invite }> {
    toEmail = toEmail.toLowerCase();
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!me) throw new NotFoundException();
    if (me.email === toEmail) throw new BadRequestException('不能添加自己');

    const target = await this.prisma.user.findUnique({ where: { email: toEmail } });
    if (target) {
      // 已注册 => 直接建立双向友谊（mock 行为，无需对方确认）
      const exists = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { userAId: userId, userBId: target.id },
            { userAId: target.id, userBId: userId },
          ],
        },
      });
      if (exists) throw new ConflictException('你们已经是好友啦');
      const [a, b] = [userId, target.id].sort();
      await this.prisma.friendship.create({ data: { userAId: a, userBId: b } });
      return {
        kind: 'friend',
        data: {
          id: target.id,
          nickname: target.nickname,
          avatar: target.avatar,
          signature: target.signature,
          email: target.email,
        },
      };
    }

    // 未注册 => 建邀请
    const dup = await this.prisma.invite.findFirst({
      where: { fromUserId: userId, toEmail, status: 'pending' },
    });
    if (dup) throw new ConflictException('已发过邀请，等待对方注册');

    const invite = await this.prisma.invite.create({
      data: { fromUserId: userId, toEmail, status: 'pending' },
      include: { from: { select: { nickname: true, avatar: true } } },
    });
    return {
      kind: 'invite',
      data: {
        id: invite.id,
        fromUserId: invite.fromUserId,
        fromNickname: invite.from.nickname,
        fromAvatar: invite.from.avatar,
        toEmail: invite.toEmail,
        toUserId: invite.toUserId,
        status: invite.status as 'pending' | 'accepted' | 'declined',
        createdAt: invite.createdAt.toISOString(),
      },
    };
  }

  async listInvites(userId: string, direction: 'incoming' | 'outgoing'): Promise<Invite[]> {
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!me) throw new NotFoundException();

    const where =
      direction === 'incoming'
        ? { OR: [{ toUserId: userId }, { toEmail: me.email }], status: 'pending' }
        : { fromUserId: userId };

    const rows = await this.prisma.invite.findMany({
      where,
      include: { from: { select: { nickname: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((i) => ({
      id: i.id,
      fromUserId: i.fromUserId,
      fromNickname: i.from.nickname,
      fromAvatar: i.from.avatar,
      toEmail: i.toEmail,
      toUserId: i.toUserId,
      status: i.status as 'pending' | 'accepted' | 'declined',
      createdAt: i.createdAt.toISOString(),
    }));
  }

  async accept(userId: string, inviteId: string) {
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!me) throw new NotFoundException();
    const invite = await this.prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new NotFoundException();
    if (invite.toUserId !== userId && invite.toEmail !== me.email) {
      throw new ForbiddenException();
    }
    if (invite.status !== 'pending') throw new BadRequestException('邀请已处理');

    const [a, b] = [invite.fromUserId, userId].sort();
    await this.prisma.$transaction([
      this.prisma.invite.update({ where: { id: inviteId }, data: { status: 'accepted', toUserId: userId } }),
      this.prisma.friendship.upsert({
        where: { userAId_userBId: { userAId: a, userBId: b } },
        create: { userAId: a, userBId: b },
        update: {},
      }),
    ]);
    return { ok: true };
  }

  async decline(userId: string, inviteId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite) throw new NotFoundException();
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!me || (invite.toUserId !== userId && invite.toEmail !== me.email)) {
      throw new ForbiddenException();
    }
    await this.prisma.invite.update({ where: { id: inviteId }, data: { status: 'declined' } });
    return { ok: true };
  }
}
