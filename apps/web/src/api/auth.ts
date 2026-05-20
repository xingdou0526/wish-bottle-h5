import { api } from './client';
import type { AuthResponse, LoginDto, PublicUser, RegisterDto, UpdateProfileDto } from '@wishbottle/shared';

export const authApi = {
  login: (dto: LoginDto) => api.post<AuthResponse>('/auth/login', dto).then((r) => r.data),
  register: (dto: RegisterDto) => api.post<AuthResponse>('/auth/register', dto).then((r) => r.data),
  me: () => api.get<PublicUser>('/auth/me').then((r) => r.data),
  updateProfile: (dto: UpdateProfileDto) => api.patch<PublicUser>('/users/me', dto).then((r) => r.data),
};
