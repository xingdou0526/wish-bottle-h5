import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { PhoneShell } from '../components/PhoneShell';
import { authApi } from '../api/auth';
import { errMsg } from '../api/client';
import { isEmail } from '../utils/validators';

export function LoginRoute() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [email, setEmail] = useState('demo@wishbottle.app');
  const [password, setPassword] = useState('demo1234');
  const [emailErr, setEmailErr] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (token) return <Navigate to="/app/bottle" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailErr(''); setPwErr('');
    if (!isEmail(email)) { setEmailErr('邮箱格式不对呀~'); return; }
    if (password.length < 4) { setPwErr('密码至少 4 位'); return; }
    setSubmitting(true);
    try {
      const res = await authApi.login({ email, password });
      setAuth(res.accessToken, res.user);
      nav('/app/bottle');
    } catch (err) {
      setPwErr(errMsg(err, '登录失败'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PhoneShell locked>
      <div className="auth-stage">
        <div className="auth-screen active">
          <div className="auth-envelope-wrap">
            <Link to="/welcome" className="auth-back">← 返</Link>
            <div className="auth-title">
              <h2>登 　 录</h2>
              <span className="at-en">welcome back ✿</span>
            </div>
            <form className="auth-envelope" onSubmit={onSubmit}>
              <div className="auth-wax">封</div>
              <div className="auth-letter">
                <span className="letter-tape letter-tape-l" />
                <span className="letter-tape letter-tape-r" />
                <div className="auth-greet">Dear friend ✦</div>

                <div className={`auth-field${emailErr ? ' invalid' : ''}`}>
                  <label>Email · 邮箱</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="hello@wish.bottle"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="auth-field-error">{emailErr}</div>
                </div>

                <div className={`auth-field${pwErr ? ' invalid' : ''}`}>
                  <label>Password · 密码</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="• • • • • •"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="auth-field-error">{pwErr}</div>
                </div>

                <div className="auth-submit">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <span className="btn-ico">✿</span>
                    <span>{submitting ? '稍等…' : '打 开 瓶 子'}</span>
                  </button>
                </div>

                <div className="auth-switch">
                  还没有愿望瓶？
                  <Link to="/register">去注册 ✎</Link>
                </div>
                <div className="auth-switch" style={{ marginTop: 4 }}>
                  可试用：demo@wishbottle.app / demo1234
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
