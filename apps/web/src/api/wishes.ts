import { api } from './client';
import type { CreateWishDto, UpdateWishDto, Wish } from '@wishbottle/shared';

export const wishesApi = {
  list: (params: { scope?: 'mine' | 'friend'; status?: 'pending' | 'sealed' | 'done' } = {}) =>
    api.get<Wish[]>('/wishes', { params }).then((r) => r.data),
  create: (dto: CreateWishDto) => api.post<Wish>('/wishes', dto).then((r) => r.data),
  get: (id: string) => api.get<Wish>(`/wishes/${id}`).then((r) => r.data),
  update: (id: string, dto: UpdateWishDto) =>
    api.patch<Wish>(`/wishes/${id}`, dto).then((r) => r.data),
  remove: (id: string) => api.delete<{ ok: true }>(`/wishes/${id}`).then((r) => r.data),
};
