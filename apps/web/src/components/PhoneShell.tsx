import { useEffect, type ReactNode } from 'react';
import { PaperDecor } from './PaperDecor';

/**
 * 移动端全屏外壳：去掉了 iOS phone-shell 的视觉装饰（状态栏 / 圆角 / Home indicator），
 * 只保留纸纹背景 + auth-locked 状态机。
 */
export function PhoneShell({ children, locked = false }: { children: ReactNode; locked?: boolean }) {
  useEffect(() => {
    document.body.classList.toggle('auth-locked', locked);
    return () => {
      document.body.classList.remove('auth-locked');
    };
  }, [locked]);

  return (
    <div className="phone-shell" id="phone-shell">
      <PaperDecor />
      {children}
    </div>
  );
}
