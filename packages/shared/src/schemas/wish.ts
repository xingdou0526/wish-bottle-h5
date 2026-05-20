import { z } from 'zod';
import { SEAL_OPTS } from '../constants';

export const CreateWishSchema = z.object({
  text: z.string().min(1).max(140),
  color: z.number().int().min(0).max(4),
  sticker: z.string().max(8).optional().nullable(),
  sealOpt: z.enum(SEAL_OPTS),
  sealUntil: z.string().datetime().optional().nullable(), // ISO 字符串；'now' 时为 null
  recipientId: z.string().optional().nullable(), // null/undefined => self
  assigneeId: z.string().optional().nullable(),
});
export type CreateWishDto = z.infer<typeof CreateWishSchema>;

export const UpdateWishSchema = z.object({
  completed: z.boolean().optional(),
  note: z.string().max(200).optional().nullable(),
});
export type UpdateWishDto = z.infer<typeof UpdateWishSchema>;

export const WishSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  recipientId: z.string().nullable(),
  assigneeId: z.string().nullable(),
  text: z.string().nullable(), // sealed 时后端返回 null
  color: z.number().int(),
  sticker: z.string().nullable(),
  sealOpt: z.string(),
  sealUntil: z.string().nullable(), // ISO
  completed: z.boolean(),
  completedAt: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.string(),
  // 便利展开字段（后端 join 后拍平）
  ownerNickname: z.string().optional(),
  ownerAvatar: z.string().optional(),
  recipientNickname: z.string().optional().nullable(),
  recipientAvatar: z.string().optional().nullable(),
  assigneeNickname: z.string().optional().nullable(),
  assigneeAvatar: z.string().optional().nullable(),
});
export type Wish = z.infer<typeof WishSchema>;
