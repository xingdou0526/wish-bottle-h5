import { z } from 'zod';

export const FriendSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  avatar: z.string(),
  signature: z.string().nullable().optional(),
  email: z.string().email(),
});
export type Friend = z.infer<typeof FriendSchema>;

export const InviteSchema = z.object({
  id: z.string(),
  fromUserId: z.string(),
  fromNickname: z.string(),
  fromAvatar: z.string(),
  toEmail: z.string().email(),
  toUserId: z.string().nullable(),
  status: z.enum(['pending', 'accepted', 'declined']),
  createdAt: z.string(),
});
export type Invite = z.infer<typeof InviteSchema>;

export const CreateInviteSchema = z.object({
  toEmail: z.string().email(),
});
export type CreateInviteDto = z.infer<typeof CreateInviteSchema>;
