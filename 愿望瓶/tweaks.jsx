/* ============================================================
   愿望瓶 — Tweaks panel · 登录/好友相关
============================================================ */
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "firstScreen": "welcome",
  "sampleFriends": 2
}/*EDITMODE-END*/;

function App() {
  const { TweaksPanel, useTweaks, TweakSection, TweakSlider, TweakRadio, TweakButton } = window;
  const [t, setT] = useTweaks(TWEAK_DEFAULTS);

  // 首屏默认（仅未登录时生效）
  useEffect(() => {
    if (!window.WishAuth) return;
    if (window.WishAuth.isLoggedIn()) return;
    window.WishAuth.showAuthScreen(t.firstScreen);
  }, [t.firstScreen]);

  // 示例好友数量
  useEffect(() => {
    localStorage.setItem('wishbottle.tweak.sampleFriends', String(t.sampleFriends));
    if (window.WishAuth?.isLoggedIn()) {
      window.WishAuth.setSampleFriendsCount(t.sampleFriends);
    }
  }, [t.sampleFriends]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="账号 · 登录" />
      <TweakRadio
        label="首屏默认"
        value={t.firstScreen}
        options={[
          { value: 'welcome',  label: '欢迎' },
          { value: 'login',    label: '登录' },
          { value: 'register', label: '注册' },
        ]}
        onChange={v => setT('firstScreen', v)}
      />
      <TweakButton
        label="✨ 演示登录（小愿）"
        onClick={() => window.WishAuth?.quickLoginAsDemo()}
      />
      <TweakButton
        label="✉ 退出登录"
        onClick={() => window.WishAuth?.logoutAndShowWelcome()}
        secondary
      />
      <TweakButton
        label="🧹 清空数据 · 重置 demo"
        onClick={() => {
          if (!confirm('确定要清除所有账号 / 好友 / 愿望数据吗？')) return;
          Object.keys(localStorage)
            .filter(k => k.startsWith('wishbottle'))
            .forEach(k => localStorage.removeItem(k));
          location.reload();
        }}
        secondary
      />

      <TweakSection label="好友" />
      <TweakSlider
        label="示例好友数量"
        value={t.sampleFriends}
        min={0} max={4} step={1}
        onChange={v => setT('sampleFriends', v)}
      />
    </TweaksPanel>
  );
}

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.createRoot(root).render(<App />);
