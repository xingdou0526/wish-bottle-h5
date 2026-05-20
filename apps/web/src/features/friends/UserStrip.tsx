import { useAuthStore } from '../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export function UserStrip() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  const nav = useNavigate();
  if (!user) return null;
  return (
    <div className="user-strip">
      <div className="us-avatar">{user.avatar}</div>
      <div className="us-info">
        <div className="us-name">{user.nickname}</div>
        <div className="us-sig">{user.signature ?? user.email}</div>
      </div>
      <button
        className="us-logout"
        onClick={() => {
          logout();
          qc.clear();
          nav('/welcome', { replace: true });
        }}
      >
        退出
      </button>
    </div>
  );
}
