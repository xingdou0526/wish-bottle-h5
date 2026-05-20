import { NavLink } from 'react-router-dom';

export function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">✿</span>
        <span className="brand-name">愿望瓶</span>
        <span className="brand-sub">wishes</span>
      </div>
      <nav className="tabs" role="tablist">
        <NavLink to="/app/bottle" className={({ isActive }) => 'tab' + (isActive ? ' active' : '')} role="tab">
          瓶子
        </NavLink>
        <NavLink to="/app/me" className={({ isActive }) => 'tab' + (isActive ? ' active' : '')} role="tab">
          我的
        </NavLink>
        <NavLink to="/app/friends" className={({ isActive }) => 'tab' + (isActive ? ' active' : '')} role="tab">
          好友
        </NavLink>
      </nav>
    </header>
  );
}
