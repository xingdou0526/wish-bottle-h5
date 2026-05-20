import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { authApi } from './api/auth';
import { WelcomeRoute } from './routes/WelcomeRoute';
import { LoginRoute } from './routes/LoginRoute';
import { RegisterRoute } from './routes/RegisterRoute';
import { AppRoute } from './routes/AppRoute';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/welcome" replace />;
  return children;
}

export default function App() {
  const { token, setUser, logout } = useAuthStore();

  // 启动时验证 token，刷新用户信息
  useEffect(() => {
    if (!token) return;
    authApi.me().then(setUser).catch(() => logout());
  }, [token, setUser, logout]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? '/app/bottle' : '/welcome'} replace />} />
      <Route path="/welcome" element={<WelcomeRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterRoute />} />
      <Route path="/app/*" element={<RequireAuth><AppRoute /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
