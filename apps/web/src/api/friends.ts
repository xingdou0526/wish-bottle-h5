import { api } from './client';
import type { CreateInviteDto, Friend, Invite } from '@wishbottle/shared';

export const friendsApi = {
  list: () => api.get<Friend[]>('/friends').then((r) => r.data),
  remove: (id: string) => api.delete<{ ok: true }>(`/friends/${id}`).then((r) => r.data),
  invite: (dto: CreateInviteDto) =>
    api
      .post<{ kind: 'friend' | 'invite'; data: Friend | Invite }>('/friends/invites', dto)
      .then((r) => r.data),
  listInvites: (direction: 'incoming' | 'outgoing') =>
    api.get<Invite[]>('/friends/invites', { params: { direction } }).then((r) => r.data),
  accept: (id: string) => api.post<{ ok: true }>(`/friends/invites/${id}/accept`).then((r) => r.data),
  decline: (id: string) => api.post<{ ok: true }>(`/friends/invites/${id}/decline`).then((r) => r.data),
};
