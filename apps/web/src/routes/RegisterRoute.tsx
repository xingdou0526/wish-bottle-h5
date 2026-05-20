import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { PhoneShell } from '../components/PhoneShell';
import { authApi } from '../api/auth';
import { errMsg } from '../api/client';
import { isEmail } from '../utils/validators';
import { AvatarPicker } from '../features/auth/AvatarPicker';
import { AVATARS } from '@wishbottle/shared';

export function RegisterRoute() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [signature, setSignature] = useState('');
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (token) return <Navigate to="/app/bottle" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!isEmail(email)) next.email = '邮箱格式不对呀~';
    if (password.length < 4) next.password = '至少 4 位';
    if (!nickname.trim()) next.nickname = '总得有个昵称吧';
    if (birthday && !/^\d{2}-\d{2}$/.test(birthday)) next.birthday = '格式 MM-DD';
    setErrs(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const res = await authApi.register({
        email,
        password,
        nickname: nickname.trim(),
        birthday: birthday || '',
        signature: signature || '',
        avatar,
      });
      setAuth(res.accessToken, res.user);
      nav('/app/bottle');
    } catch (err) {
      setErrs({ email: errMsg(err, '注册失败') });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PhoneShell locked>
      <div className="auth-stage">
        <div className="auth-screen active">
          <div className="auth-envelope-wrap">
            <Link to="/welcome" className="auth-back">← 回到欢迎页</Link>
            <div className="auth-title">
              <h2>新 朋 友</h2>
              <span className="at-en">say hello ✿</span>
            </div>
            <form className="auth-envelope" onSubmit={onSubmit}>
              <div className="auth-wax">封</div>
              <div className="auth-letter register-letter">
                <span className="letter-tape letter-tape-l" />
                <span className="letter-tape letter-tape-r" />
                <div className="auth-greet">Hello there ♡</div>

                <div className={`auth-field${errs.email ? ' invalid' : ''}`}>
                  <label>你的邮箱</label>
                  <input type="email" autoComplete="email" placeholder="someone@wishbottle.app" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <div className="auth-field-error">{errs.email ?? ''}</div>
                </div>

                <div className={`auth-field${errs.password ? ' invalid' : ''}`}>
                  <label>口令 (≥ 4 位)</label>
                  <input type="password" autoComplete="new-password" placeholder="只有你自己知道" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <div className="auth-field-error">{errs.password ?? ''}</div>
                </div>

                <div className={`auth-field${errs.nickname ? ' invalid' : ''}`}>
                  <label>昵称</label>
                  <input type="text" maxLength={14} placeholder="想被怎么叫呢" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                  <div className="auth-field-error">{errs.nickname ?? ''}</div>
                </div>

                <div className={`auth-field${errs.birthday ? ' invalid' : ''}`}>
                  <label>生日 (MM-DD，可不填)</label>
                  <input type="text" maxLength={5} placeholder="例如 06-15" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                  <div className="auth-field-error">{errs.birthday ?? ''}</div>
                </div>

                <div className="auth-field">
                  <label>签名</label>
                  <input type="text" maxLength={40} placeholder="一行字 · 关于你" value={signature} onChange={(e) => setSignature(e.target.value)} />
                  <div className="auth-field-error" />
                </div>

                <AvatarPicker value={avatar} onChange={setAvatar} />

                <div className="auth-submit">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <span className="btn-ico">✿</span>
                    <span>{submitting ? '稍等…' : '把 自 己 放 进 来'}</span>
                  </button>
                </div>

                <div className="auth-switch">
                  已经有账号了？
                  <Link to="/login">回去登录吧</Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
