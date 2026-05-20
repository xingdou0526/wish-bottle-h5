import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateWishDto, UpdateWishDto, Wish } from '@wishbottle/shared';

type WishWithRelations = {
  id: string;
  ownerId: string;
  recipientId: string | null;
  assigneeId: string | null;
  text: string;
  color: number;
  sticker: string | null;
  sealOpt: string;
  sealUntil: Date | null;
  completed: boolean;
  completedAt: Date | null;
  note: string | null;
  createdAt: Date;
  owner: { nickname: string; avatar: string };
  recipient: { nickname: string; avatar: string } | null;
  assignee: { nickname: string; avatar: string } | null;
};

@Injectable()
export class WishesService {
  constructor(private readonly prisma: PrismaService) {}

  private include = {
    owner: { select: { nickname: true, avatar: true } },
    recipient: { select: { nickname: true, avatar: true } },
    assignee: { select: { nickname: true, avatar: true } },
  } as const;

  private toDto(w: WishWithRelations, viewerId: string): Wish {
    const isSealed = !!(w.sealUntil && w.sealUntil.getTime() > Date.now());
    // sealed 时仅 owner 可读 text；其他人看不到内容
    const canReadText = !isSealed || w.ownerId === viewerId;
    return {
      id: w.id,
      ownerId: w.ownerId,
      recipientId: w.recipientId,
      assigneeId: w.assigneeId,
      text: canReadText ? w.text : null,
      color: w.color,
      sticker: w.sticker,
      sealOpt: w.sealOpt,
      sealUntil: w.sealUntil ? w.sealUntil.toISOString() : null,
      completed: w.completed,
      completedAt: w.completedAt ? w.completedAt.toISOString() : null,
      note: w.note,
      createdAt: w.createdAt.toISOString(),
      ownerNickname: w.owner.nickname,
      ownerAvatar: w.owner.avatar,
      recipientNickname: w.recipient?.nickname ?? null,
      recipientAvatar: w.recipient?.avatar ?? null,
      assigneeNickname: w.assignee?.nickname ?? null,
      assigneeAvatar: w.assignee?.avatar ?? null,
    };
  }

  async create(userId: string, dto: CreateWishDto): Promise<Wish> {
    const sealUntil = dto.sealOpt === 'now' || !dto.sealUntil ? null : new Date(dto.sealUntil);
    // 校验 recipient / assignee 必须是自己或好友
    const friendIds = await this.friendIdsOf(userId);
    const allowedIds = new Set([userId, ...friendIds]);
    if (dto.recipientId && dto.recipientId !== userId && !allowedIds.has(dto.recipientId)) {
      throw new ForbiddenException('收件人必须是自己或好友');
    }
    if (dto.assigneeId && dto.assigneeId !== userId && !allowedIds.has(dto.assigneeId)) {
      throw new ForbiddenException('实现者必须是自己或好友');
    }

    const created = await this.prisma.wish.create({
      data: {
        ownerId: userId,
        recipientId: dto.recipientId || null,
        assigneeId: dto.assigneeId || null,
        text: dto.text,
        color: dto.color,
        sticker: dto.sticker || null,
        sealOpt: dto.sealOpt,
        sealUntil,
      },
      include: this.include,
    });
    return this.toDto(created as WishWithRelations, userId);
  }

  async list(
    userId: string,
    scope: 'mine' | 'friend' = 'mine',
    status?: 'pending' | 'sealed' | 'done',
  ): Promise<Wish[]> {
    const baseWhere =
      scope === 'mine'
        ? { ownerId: userId }
        : {
            OR: [
              { recipientId: userId, NOT: { ownerId: userId } },
              { assigneeId: userId, NOT: { ownerId: userId } },
            ],
          };

    const now = new Date();
    let where: any = baseWhere;
    if (status === 'pending') {
      where = {
        AND: [
          baseWhere,
          { completed: false },
          { OR: [{ sealUntil: null }, { sealUntil: { lte: now } }] },
        ],
      };
    } else if (status === 'sealed') {
      where = { AND: [baseWhere, { completed: false }, { sealUntil: { gt: now } }] };
    } else if (status === 'done') {
      where = { AND: [baseWhere, { completed: true }] };
    }

    const rows = await this.prisma.wish.findMany({
      where,
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((w) => this.toDto(w as WishWithRelations, userId));
  }

  async getOne(userId: string, id: string): Promise<Wish> {
    const w = await this.prisma.wish.findUnique({
      where: { id },
      include: this.include,
    });
    if (!w) throw new NotFoundException();
    if (
      w.ownerId !== userId &&
      w.recipientId !== userId &&
      w.assigneeId !== userId
    ) {
      throw new ForbiddenException();
    }
    return this.toDto(w as WishWithRelations, userId);
  }

  async update(userId: string, id: string, dto: UpdateWishDto): Promise<Wish> {
    const w = await this.prisma.wish.findUnique({ where: { id } });
    if (!w) throw new NotFoundException();
    if (w.ownerId !== userId && w.assigneeId !== userId) {
      throw new ForbiddenException('仅许愿者本人或被指派的实现者可以更新');
    }
    const data: any = {};
    if (typeof dto.completed === 'boolean') {
      data.completed = dto.completed;
      data.completedAt = dto.completed ? new Date() : null;
    }
    if (dto.note !== undefined) {
      data.note = dto.note === '' ? null : dto.note;
    }
    const updated = await this.prisma.wish.update({
      where: { id },
      data,
      include: this.include,
    });
    return this.toDto(updated as WishWithRelations, userId);
  }

  async remove(userId: string, id: string) {
    const w = await this.prisma.wish.findUnique({ where: { id } });
    if (!w) throw new NotFoundException();
    if (w.ownerId !== userId) throw new ForbiddenException();
    await this.prisma.wish.delete({ where: { id } });
    return { ok: true };
  }

  private async friendIdsOf(userId: string): Promise<string[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    });
    return rows.map((r) => (r.userAId === userId ? r.userBId : r.userAId));
  }
}
