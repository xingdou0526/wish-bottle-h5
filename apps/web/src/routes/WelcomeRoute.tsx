import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { PhoneShell } from '../components/PhoneShell';

export function WelcomeRoute() {
  const nav = useNavigate();
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/app/bottle" replace />;

  return (
    <PhoneShell locked>
      <div className="auth-stage">
        <div className="auth-screen active">
          <div className="welcome-brand">
            <div className="wb-mark">愿望瓶</div>
            <div className="wb-en">wish bottle</div>
            <div className="wb-sub">把愿望折成纸星星 · 等它发光</div>
          </div>
          <div className="welcome-bottle" aria-hidden="true">
            <svg viewBox="0 0 220 240">
              <defs>
                <linearGradient id="wb-glass" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                  <stop offset="40%" stopColor="rgba(255,255,255,0.55)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.20)" />
                </linearGradient>
              </defs>
              <path
                d="M 78 36 L 78 28 Q 78 22 86 22 L 134 22 Q 142 22 142 28 L 142 36 L 168 78 L 168 196 Q 168 222 138 222 L 82 222 Q 52 222 52 196 L 52 78 Z"
                fill="url(#wb-glass)"
                stroke="#c8b8a8"
                strokeWidth="2"
              />
              <ellipse cx="110" cy="22" rx="34" ry="4" fill="#ffe9a8" stroke="#c8b8a8" strokeWidth="1.2" />
              <polygon points="100,140 104,150 115,150 106,156 110,166 100,160 90,166 94,156 85,150 96,150" fill="#ffd3dd" stroke="#e89aac" strokeWidth="1" />
              <polygon points="130,160 134,168 144,168 136,173 139,182 130,177 121,182 124,173 116,168 126,168" fill="#ffe9a8" stroke="#e0bf5c" strokeWidth="1" />
              <polygon points="92,180 96,188 106,188 98,193 101,202 92,197 83,202 86,193 78,188 88,188" fill="#bfe6c8" stroke="#7fb892" strokeWidth="1" />
            </svg>
          </div>
          <div className="welcome-quote">
            把愿望小心地折好 · 投进瓶子里 ✿
            <span className="wq-en">tiny wishes, soft as paper stars</span>
          </div>
          <div className="welcome-actions">
            <button className="btn btn-primary" onClick={() => nav('/login')}>
              <span className="btn-ico">✉</span>
              <span>登 录</span>
            </button>
            <button className="btn btn-ghost" onClick={() => nav('/register')}>
              <span className="btn-ico">✿</span>
              <span>新 朋 友 · 来 注 册</span>
            </button>
          </div>
          <div className="welcome-foot">— 一个温柔的小角落 ♡</div>
        </div>
      </div>
    </PhoneShell>
  );
}
