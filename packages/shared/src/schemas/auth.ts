import { z } from 'zod';
import { AVATARS } from '../constants';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4).max(64),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4).max(64),
  nickname: z.string().min(1).max(14),
  birthday: z
    .string()
    .regex(/^\d{2}-\d{2}$/, 'birthday must be MM-DD')
    .optional()
    .or(z.literal('')),
  signature: z.string().max(40).optional().or(z.literal('')),
  avatar: z.string().min(1).max(8),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const PublicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nickname: z.string(),
  birthday: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
  avatar: z.string(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: PublicUserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const UpdateProfileSchema = z.object({
  nickname: z.string().min(1).max(14).optional(),
  birthday: z.string().regex(/^\d{2}-\d{2}$/).optional().or(z.literal('')),
  signature: z.string().max(40).optional().or(z.literal('')),
  avatar: z.string().min(1).max(8).optional(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export { AVATARS };
