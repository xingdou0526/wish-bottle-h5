/* ============================================================
   愿望瓶 — 账号 · 好友 · 信封登录 (mock 数据，纯前端)
============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ============ Storage keys ============
  const LS_USERS = 'wishbottle.auth.users';
  const LS_CURRENT = 'wishbottle.auth.currentUserId';
  const LS_FRIENDS = 'wishbottle.auth.friends';
  const LS_INVITES = 'wishbottle.auth.invites';
  const LS_SETUP = 'wishbottle.auth.seeded';

  // ============ Mock users ============
  // Default "presence" demo users — they always exist in the address book.
  const MOCK_USERS = [
    { id: 'u_yuzu',  nickname: '小柚',   email: 'yuzu@wish.bottle', password: 'bottle', avatar: '✿', birthday: '03-21', signature: 'in full bloom ✿' },
    { id: 'u_abao',  nickname: '阿宝',   email: 'abao@wish.bottle', password: 'bottle', avatar: '★', birthday: '07-08', signature: 'shine on ✦' },
    { id: 'u_mimi',  nickname: '米米',   email: 'mimi@wish.bottle', password: 'bottle', avatar: '☁', birthday: '11-30', signature: 'a soft cloud ☁' },
    { id: 'u_yueya', nickname: '月牙',   email: 'yueya@wish.bottle', password: 'bottle', avatar: '☾', birthday: '09-15', signature: 'moonlit nights ☾' },
  ];

  function uid(prefix='u') { return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }

  // ============ Bootstrap data ============
  function readJSON(k, fallback) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function writeJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

  function seedOnce() {
    if (localStorage.getItem(LS_SETUP) === '1') return;
    const users = readJSON(LS_USERS, []);
    // ensure mock users present
    MOCK_USERS.forEach(m => {
      if (!users.find(u => u.id === m.id)) users.push({ ...m });
    });
    writeJSON(LS_USERS, users);
    if (!readJSON(LS_FRIENDS, null)) writeJSON(LS_FRIENDS, {});
    if (!readJSON(LS_INVITES, null)) writeJSON(LS_INVITES, {});
    localStorage.setItem(LS_SETUP, '1');
  }
  seedOnce();

  // ============ State accessors ============
  function getUsers() { return readJSON(LS_USERS, []); }
  function setUsers(arr) { writeJSON(LS_USERS, arr); }
  function getCurrentId() { return localStorage.getItem(LS_CURRENT); }
  function setCurrentId(id) {
    if (id) localStorage.setItem(LS_CURRENT, id);
    else localStorage.removeItem(LS_CURRENT);
  }
  function getFriendsMap() { return readJSON(LS_FRIENDS, {}); }
  function setFriendsMap(m) { writeJSON(LS_FRIENDS, m); }
  function getInvitesMap() { return readJSON(LS_INVITES, {}); }
  function setInvitesMap(m) { writeJSON(LS_INVITES, m); }

  function findUserById(id) { return getUsers().find(u => u.id === id); }
  function findUserByEmail(email) { return getUsers().find(u => u.email.toLowerCase() === (email||'').trim().toLowerCase()); }

  function currentUser() {
    const id = getCurrentId();
    return id ? findUserById(id) : null;
  }

  function friendIds(userId) {
    const map = getFriendsMap();
    return map[userId] || [];
  }
  function friendsOf(userId) {
    const ids = friendIds(userId);
    return ids.map(findUserById).filter(Boolean);
  }
  function isFriend(myId, otherId) { return friendIds(myId).includes(otherId); }

  function addFriendBidirectional(a, b) {
    const map = getFriendsMap();
    if (!map[a]) map[a] = [];
    if (!map[b]) map[b] = [];
    if (!map[a].includes(b)) map[a].push(b);
    if (!map[b].includes(a)) map[b].push(a);
    setFriendsMap(map);
  }
  function removeFriendBidirectional(a, b) {
    const map = getFriendsMap();
    if (map[a]) map[a] = map[a].filter(x => x !== b);
    if (map[b]) map[b] = map[b].filter(x => x !== a);
    setFriendsMap(map);
  }

  function getIncoming(userId) {
    const m = getInvitesMap();
    return (m[userId] && m[userId].incoming) || [];
  }
  function getOutgoing(userId) {
    const m = getInvitesMap();
    return (m[userId] && m[userId].outgoing) || [];
  }
  function setIncoming(userId, arr) {
    const m = getInvitesMap();
    if (!m[userId]) m[userId] = { incoming: [], outgoing: [] };
    m[userId].incoming = arr;
    setInvitesMap(m);
  }
  function setOutgoing(userId, arr) {
    const m = getInvitesMap();
    if (!m[userId]) m[userId] = { incoming: [], outgoing: [] };
    m[userId].outgoing = arr;
    setInvitesMap(m);
  }
  function addIncoming(userId, invite) {
    const arr = getIncoming(userId);
    if (arr.find(x => x.fromEmail === invite.fromEmail)) return;
    arr.push(invite);
    setIncoming(userId, arr);
  }
  function addOutgoing(userId, invite) {
    const arr = getOutgoing(userId);
    if (arr.find(x => x.toEmail === invite.toEmail)) return;
    arr.push(invite);
    setOutgoing(userId, arr);
  }

  // ============ Friend seeding for newly registered user ============
  // Default: pre-friend 2 mock users, 1 mock has sent us an invite (demo flow)
  function seedSocialForUser(userId, sampleFriendCount = 2) {
    sampleFriendCount = Math.max(0, Math.min(MOCK_USERS.length, sampleFriendCount));
    const mockIds = MOCK_USERS.map(m => m.id);
    // wipe existing
    const fm = getFriendsMap(); fm[userId] = [];
    setFriendsMap(fm);
    setIncoming(userId, []);
    setOutgoing(userId, []);
    // pre-friend first N
    for (let i = 0; i < sampleFriendCount; i++) {
      addFriendBidirectional(userId, mockIds[i]);
    }
    // demo: have the next mock user send an invite (if there is one left)
    const inviter = MOCK_USERS[sampleFriendCount];
    if (inviter) {
      addIncoming(userId, {
        id: uid('iv'),
        fromEmail: inviter.email,
        fromUserId: inviter.id,
        fromNickname: inviter.nickname,
        fromAvatar: inviter.avatar,
        at: Date.now(),
      });
    }
  }

  // ============ Login / Register / Logout ============
  function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

  function login(email, password) {
    const u = findUserByEmail(email);
    if (!u) return { ok: false, error: '邮箱还没注册过呢' };
    if (u.password !== password) return { ok: false, error: '密码不对哦' };
    setCurrentId(u.id);
    fireAuth();
    return { ok: true, user: u };
  }

  function register({ email, password, nickname, birthday, signature, avatar }) {
    if (!isEmail(email)) return { ok: false, error: '邮箱格式好像不太对' };
    if (!password || password.length < 4) return { ok: false, error: '密码至少 4 位呢' };
    if (!nickname || !nickname.trim()) return { ok: false, error: '给自己起个昵称吧' };
    if (findUserByEmail(email)) return { ok: false, error: '这个邮箱已经注册过啦' };
    const u = {
      id: uid('u'),
      email: email.trim(),
      password,
      nickname: nickname.trim(),
      birthday: (birthday || '').trim(),
      signature: (signature || '').trim(),
      avatar: avatar || '✿',
    };
    const users = getUsers();
    users.push(u);
    setUsers(users);
    setCurrentId(u.id);
    // sync birthday into shared key for seal picker
    if (u.birthday) localStorage.setItem('wishbottle.birthday', u.birthday);
    // seed social
    const rawCount = localStorage.getItem('wishbottle.tweak.sampleFriends');
    const count = rawCount == null ? 2 : Math.max(0, parseInt(rawCount, 10) || 0);
    seedSocialForUser(u.id, count);
    fireAuth();
    return { ok: true, user: u };
  }

  function logout() {
    setCurrentId(null);
    fireAuth();
  }

  // ============ Auth events ============
  const authListeners = [];
  function onAuth(cb) { authListeners.push(cb); }
  function fireAuth() {
    const u = currentUser();
    authListeners.forEach(cb => { try { cb(u); } catch(e){ console.error(e); } });
    // also update UI
    updateAppLockUI();
    if (u && window.WishApp && typeof window.WishApp.refresh === 'function') {
      window.WishApp.refresh();
    }
  }

  // ============ Page lock / navigation ============
  function updateAppLockUI() {
    const u = currentUser();
    if (u) { document.body.classList.remove('auth-locked'); }
    else   { document.body.classList.add('auth-locked'); showAuthScreen('welcome'); }
  }

  function showAuthScreen(name) {
    $$('.auth-screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
  }

  // ============ Welcome / login / register render ============
  function initAuthScreens() {
    const stage = $('#auth-stage');
    if (!stage) return;
    stage.innerHTML = `
      <!-- ============ 欢迎页 ============ -->
      <section class="auth-screen welcome active" data-screen="welcome">
        <div class="welcome-brand">
          <div class="wb-mark">愿 望 瓶</div>
          <div class="wb-en">wish · bottle</div>
          <div class="wb-sub">把心愿装进瓶子里 · 寄给未来的自己</div>
        </div>
        <div class="welcome-bottle">${welcomeBottleSvg()}</div>
        <div class="welcome-quote">
          每一颗写下来的愿望<br/>都会变成瓶子里的星星 ✿
          <span class="wq-en">— every wish becomes a tiny star</span>
        </div>
        <div class="welcome-actions">
          <button class="btn btn-primary" data-go="login">
            <span class="btn-ico">✉</span><span>登录</span>
          </button>
          <button class="btn btn-ghost" data-go="register">
            <span class="btn-ico">✎</span><span>新建一个愿望瓶</span>
          </button>
        </div>
        <div class="welcome-foot">— since today <span style="color:var(--pink-dd)">♡</span></div>
      </section>

      <!-- ============ 登录页 ============ -->
      <section class="auth-screen login" data-screen="login">
        <div class="auth-envelope-wrap">
          <button class="auth-back" data-go="welcome">← 返回</button>
          <div class="auth-title">
            <h2>登 录</h2>
            <div class="at-en">welcome back ✿</div>
          </div>
          <div class="auth-envelope">
            <div class="auth-wax">封</div>
            <div class="auth-letter">
              <span class="letter-tape letter-tape-l"></span>
              <span class="letter-tape letter-tape-r"></span>
              <div class="auth-greet">Dear friend ✦</div>

              <div class="auth-field" data-field="email">
                <label>Email · 邮箱</label>
                <input type="email" id="login-email" placeholder="hello@wish.bottle" autocomplete="email" />
                <div class="auth-field-error"></div>
              </div>

              <div class="auth-field" data-field="password">
                <label>Password · 密码</label>
                <input type="password" id="login-password" placeholder="••••••" autocomplete="current-password" />
                <div class="auth-field-error"></div>
              </div>

              <div class="auth-submit">
                <button class="btn btn-primary" id="btn-do-login">
                  <span class="btn-ico">✿</span><span>打开瓶子</span>
                </button>
              </div>
              <div class="auth-switch">
                还没有愿望瓶？
                <a data-go="register">去注册 ✎</a>
              </div>
              <div class="auth-switch" style="margin-top:6px; font-size:11px; opacity:0.7;">
                可试用：<code style="font-family:var(--font-en-hand); font-size:13px;">yuzu@wish.bottle</code> / <code style="font-family:var(--font-en-hand); font-size:13px;">bottle</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ 注册页 ============ -->
      <section class="auth-screen register" data-screen="register">
        <div class="auth-envelope-wrap">
          <button class="auth-back" data-go="welcome">← 返回</button>
          <div class="auth-title">
            <h2>注 册</h2>
            <div class="at-en">say hi ♡</div>
          </div>
          <div class="auth-envelope">
            <div class="auth-wax">愿</div>
            <div class="auth-letter register-letter">
              <span class="letter-tape letter-tape-l"></span>
              <span class="letter-tape letter-tape-r"></span>
              <div class="auth-greet">Hi, this is me ✦</div>

              <div class="auth-field" data-field="nickname">
                <label>Nickname · 昵称</label>
                <input type="text" id="reg-nickname" placeholder="想被怎么称呼？" maxlength="14" />
                <div class="auth-field-error"></div>
              </div>

              <div class="auth-field" data-field="email">
                <label>Email · 邮箱</label>
                <input type="email" id="reg-email" placeholder="me@wish.bottle" autocomplete="email" />
                <div class="auth-field-error"></div>
              </div>

              <div class="auth-field" data-field="password">
                <label>Password · 密码</label>
                <input type="password" id="reg-password" placeholder="至少 4 位" autocomplete="new-password" />
                <div class="auth-field-error"></div>
              </div>

              <div class="auth-field" data-field="birthday">
                <label>Birthday · 生日（MM-DD）</label>
                <input type="text" id="reg-birthday" placeholder="例如 06-15" maxlength="5" />
                <div class="auth-field-error"></div>
              </div>

              <div class="auth-field" data-field="signature">
                <label>One-liner · 签名一句话</label>
                <textarea id="reg-signature" placeholder="例如：在等一片雪花" maxlength="40"></textarea>
                <div class="auth-field-error"></div>
              </div>

              <div class="avatar-picker" data-field="avatar">
                <div class="ap-label">Avatar · 贴纸头像</div>
                <div class="avatar-grid" id="reg-avatar-grid">
                  ${['✿','♡','★','☁','✦','☀','☾','✎'].map((s,i) =>
                    `<button class="avatar-chip${i===0?' active':''}" type="button" data-avatar="${s}">${s}</button>`
                  ).join('')}
                </div>
              </div>

              <div class="auth-submit">
                <button class="btn btn-primary" id="btn-do-register">
                  <span class="btn-ico">✦</span><span>盖好封蜡 · 创建</span>
                </button>
              </div>
              <div class="auth-switch">
                已经有瓶子了？
                <a data-go="login">去登录 ✉</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    // bind navigation
    stage.addEventListener('click', (e) => {
      const goEl = e.target.closest('[data-go]');
      if (goEl) {
        const dest = goEl.dataset.go;
        if (dest === 'welcome' || dest === 'login' || dest === 'register') {
          showAuthScreen(dest);
        }
        return;
      }
    });

    // login submit
    $('#btn-do-login').addEventListener('click', () => {
      const email = $('#login-email').value.trim();
      const password = $('#login-password').value;
      clearFieldErrors('.login');
      if (!email) return setFieldError('.login', 'email', '请填写邮箱');
      if (!password) return setFieldError('.login', 'password', '请填写密码');
      const res = login(email, password);
      if (!res.ok) { setFieldError('.login', 'password', res.error); return; }
      toast(`欢迎回来 · ${res.user.nickname} ♡`);
    });
    // register submit
    let regAvatar = '✿';
    $('#reg-avatar-grid').addEventListener('click', (e) => {
      const c = e.target.closest('.avatar-chip');
      if (!c) return;
      regAvatar = c.dataset.avatar;
      $$('#reg-avatar-grid .avatar-chip').forEach(b => b.classList.toggle('active', b === c));
    });
    $('#btn-do-register').addEventListener('click', () => {
      clearFieldErrors('.register');
      const data = {
        nickname: $('#reg-nickname').value,
        email: $('#reg-email').value,
        password: $('#reg-password').value,
        birthday: $('#reg-birthday').value,
        signature: $('#reg-signature').value,
        avatar: regAvatar,
      };
      if (!data.nickname.trim()) return setFieldError('.register', 'nickname', '昵称不能空着');
      if (!data.email.trim()) return setFieldError('.register', 'email', '邮箱不能空着');
      if (!isEmail(data.email)) return setFieldError('.register', 'email', '邮箱格式不对');
      if (!data.password) return setFieldError('.register', 'password', '设个密码吧');
      if (data.password.length < 4) return setFieldError('.register', 'password', '至少 4 位呢');
      if (data.birthday && !/^\d{1,2}-\d{1,2}$/.test(data.birthday.trim()))
        return setFieldError('.register', 'birthday', '格式：MM-DD');
      const res = register(data);
      if (!res.ok) {
        if (res.error.includes('邮箱')) setFieldError('.register', 'email', res.error);
        else if (res.error.includes('密码')) setFieldError('.register', 'password', res.error);
        else if (res.error.includes('昵称')) setFieldError('.register', 'nickname', res.error);
        else setFieldError('.register', 'email', res.error);
        return;
      }
      toast(`✦ 欢迎你，${res.user.nickname}`);
    });
  }

  function clearFieldErrors(scope) {
    $$(`${scope} .auth-field`).forEach(f => {
      f.classList.remove('invalid');
      const er = f.querySelector('.auth-field-error');
      if (er) er.textContent = '';
    });
  }
  function setFieldError(scope, name, msg) {
    const f = $(`${scope} .auth-field[data-field="${name}"]`);
    if (!f) return;
    f.classList.add('invalid');
    const er = f.querySelector('.auth-field-error');
    if (er) er.textContent = msg;
  }

  function welcomeBottleSvg() {
    return `
      <svg viewBox="0 0 220 240" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="wb-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
            <stop offset="40%" stop-color="rgba(255,255,255,0.55)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.20)"/>
          </linearGradient>
          <radialGradient id="wb-glow" cx="50%" cy="55%" r="55%">
            <stop offset="0%" stop-color="rgba(255,220,130,0.45)"/>
            <stop offset="100%" stop-color="rgba(255,220,130,0)"/>
          </radialGradient>
        </defs>
        <ellipse cx="110" cy="225" rx="58" ry="6" fill="rgba(120,90,50,0.18)"/>
        <ellipse cx="110" cy="135" rx="60" ry="40" fill="url(#wb-glow)"/>
        <path d="M 84 50 L 84 42 Q 84 36, 90 36 L 130 36 Q 136 36, 136 42 L 136 50 L 152 78 L 152 188 Q 152 218, 122 218 L 98 218 Q 68 218, 68 188 L 68 78 Z"
          fill="url(#wb-body)" stroke="#c8b8a8" stroke-width="1.8"/>
        <ellipse cx="110" cy="36" rx="28" ry="3" fill="rgba(255,255,255,0.85)" stroke="#c8b8a8" stroke-width="1"/>
        <!-- stars inside -->
        <g>
          <polygon points="90,120 92,113 99,113 93,109 95,102 90,106 85,102 87,109 81,113 88,113" fill="#ffd3dd" stroke="#e89aac" stroke-width="0.6"/>
          <polygon points="118,144 121,135 130,135 122,130 125,121 118,126 111,121 114,130 106,135 115,135" fill="#bfe6c8" stroke="#7fb892" stroke-width="0.6"/>
          <polygon points="100,170 102,164 108,164 103,160 105,154 100,157 95,154 97,160 92,164 98,164" fill="#c8e4ec" stroke="#7fa9b8" stroke-width="0.6"/>
          <polygon points="130,180 131,176 135,176 132,173 133,168 130,170 127,168 128,173 125,176 129,176" fill="#ffe9a8" stroke="#e0bf5c" stroke-width="0.5"/>
          <polygon points="85,195 86,191 90,191 87,188 88,184 85,186 82,184 83,188 80,191 84,191" fill="#d8d5ee" stroke="#a8a3d0" stroke-width="0.5"/>
        </g>
        <!-- highlight -->
        <path d="M 76 80 Q 71 140, 78 200" stroke="rgba(255,255,255,0.85)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- tag -->
        <g transform="translate(150 70) rotate(8)">
          <rect x="-18" y="-2" width="36" height="20" rx="3" fill="#fff9e8" stroke="#c8b090" stroke-width="0.8"/>
          <line x1="-12" y1="6" x2="12" y2="6" stroke="#d8c0a0" stroke-width="0.5"/>
          <line x1="-12" y1="11" x2="6" y2="11" stroke="#d8c0a0" stroke-width="0.5"/>
          <text x="0" y="14" text-anchor="middle" font-family="Long Cang, serif" font-size="10" fill="#a06848">願</text>
        </g>
        <line x1="148" y1="60" x2="142" y2="36" stroke="#b89880" stroke-width="0.8"/>
      </svg>
    `;
  }

  // ============ 我的页 - 顶部用户条 + 好友区块 ============
  function renderUserStrip(target) {
    if (!target) return;
    const u = currentUser();
    if (!u) { target.innerHTML = ''; return; }
    target.innerHTML = `
      <div class="user-strip">
        <div class="us-avatar">${u.avatar || '✿'}</div>
        <div class="us-info">
          <div class="us-name">${escapeHtml(u.nickname)} <span style="font-family:var(--font-en-hand);color:var(--ink-light);font-size:13px;margin-left:4px;">${escapeHtml(u.email)}</span></div>
          ${u.signature ? `<div class="us-sig">"${escapeHtml(u.signature)}"</div>` : ''}
        </div>
        <button class="us-logout" data-act="logout">退出</button>
      </div>
    `;
    target.querySelector('[data-act="logout"]').addEventListener('click', () => {
      if (confirm('确定要退出登录吗？')) logout();
    });
  }

  function renderFriendsSection(target) {
    if (!target) return;
    const u = currentUser();
    if (!u) { target.innerHTML = ''; return; }
    const friends = friendsOf(u.id);
    const incoming = getIncoming(u.id);
    const outgoing = getOutgoing(u.id);

    target.innerHTML = `
      <!-- Add friend big button -->
      <div class="friends-add-card" data-act="add-friend">
        <span class="fac-tape"></span>
        <div class="fac-ico">✉</div>
        <div class="fac-text">
          <div class="fac-title">添加新好友</div>
          <div class="fac-sub">输入对方邮箱 · 发送一张邀请信</div>
        </div>
        <div class="fac-arrow">›</div>
      </div>

      ${incoming.length ? `
        <div class="friends-block">
          <div class="friends-block-title"><span>✉</span><span>收到的邀请</span><span class="fbt-count">${incoming.length}</span></div>
          <div class="friends-list">
            ${incoming.map(iv => `
              <div class="friend-row invite" data-iid="${iv.id}">
                <div class="fr-avatar" style="${avatarBg(0)}">${iv.fromAvatar || '✿'}</div>
                <div class="fr-info">
                  <div class="fr-name">${escapeHtml(iv.fromNickname || '一位朋友')}</div>
                  <div class="fr-meta">${escapeHtml(iv.fromEmail)}</div>
                </div>
                <div class="fr-actions">
                  <button class="fr-btn accept" data-act="accept">接受</button>
                  <button class="fr-btn" data-act="decline">忽略</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="friends-block">
        <div class="friends-block-title"><span>♡</span><span>我的好友</span><span class="fbt-count">${friends.length}</span></div>
        ${friends.length === 0 ? `
          <div class="friends-empty">
            <div class="friends-empty-ico">✿</div>
            <p>还没有添加好友哦</p>
            <p class="empty-sub">点击上面的"添加新好友"开始吧</p>
          </div>
        ` : `
          <div class="friends-list">
            ${friends.map((f, i) => `
              <div class="friend-row" data-fid="${f.id}">
                <div class="fr-avatar" style="${avatarBg(i + 1)}">${f.avatar || '✿'}</div>
                <div class="fr-info">
                  <div class="fr-name">${escapeHtml(f.nickname)}</div>
                  <div class="fr-meta">${escapeHtml(f.email)}</div>
                  ${f.signature ? `<div class="fr-sig">"${escapeHtml(f.signature)}"</div>` : ''}
                </div>
                <div class="fr-actions">
                  <button class="fr-btn ghost" data-act="remove">移除</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      ${outgoing.length ? `
        <div class="friends-block">
          <div class="friends-block-title"><span>···</span><span>等待回应</span><span class="fbt-count">${outgoing.length}</span></div>
          <div class="friends-list">
            ${outgoing.map(o => `
              <div class="friend-row pending" data-oid="${o.id}">
                <div class="fr-avatar pending-avatar">…</div>
                <div class="fr-info">
                  <div class="fr-name" style="color:var(--ink-soft)">${escapeHtml(o.toEmail.split('@')[0])}</div>
                  <div class="fr-meta">${escapeHtml(o.toEmail)}</div>
                </div>
                <div class="fr-actions">
                  <span class="fr-status">等待中 ✦</span>
                  <button class="fr-btn ghost" data-act="cancel-outgoing">撤回</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // bindings
    target.querySelector('[data-act="add-friend"]').addEventListener('click', openAddFriendModal);
    target.querySelectorAll('.friend-row.invite').forEach(el => {
      const iid = el.dataset.iid;
      el.querySelector('[data-act="accept"]').addEventListener('click', () => acceptIncoming(iid));
      el.querySelector('[data-act="decline"]').addEventListener('click', () => declineIncoming(iid));
    });
    target.querySelectorAll('.friend-row:not(.invite):not(.pending)').forEach(el => {
      const fid = el.dataset.fid;
      el.querySelector('[data-act="remove"]').addEventListener('click', () => {
        const friend = findUserById(fid);
        if (!friend) return;
        if (!confirm(`确定要从好友中移除 ${friend.nickname} 吗？`)) return;
        removeFriendBidirectional(u.id, fid);
        renderFriendsSection(target);
        refreshAppFriendChips();
        toast('已移除好友');
      });
    });
    target.querySelectorAll('.friend-row.pending').forEach(el => {
      const oid = el.dataset.oid;
      el.querySelector('[data-act="cancel-outgoing"]').addEventListener('click', () => {
        const arr = getOutgoing(u.id);
        setOutgoing(u.id, arr.filter(x => x.id !== oid));
        renderFriendsSection(target);
        toast('已撤回邀请');
      });
    });
  }
  function avatarBg(i) {
    const g = [
      'background: linear-gradient(135deg, var(--pink), var(--yellow));',
      'background: linear-gradient(135deg, var(--mint), var(--sky));',
      'background: linear-gradient(135deg, var(--lilac), var(--pink));',
      'background: linear-gradient(135deg, var(--yellow), var(--mint));',
      'background: linear-gradient(135deg, var(--sky), var(--lilac));',
    ];
    return g[i % g.length];
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[<>&"]/g, (c) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])
    );
  }

  // ============ 邀请处理 ============
  function acceptIncoming(inviteId) {
    const u = currentUser(); if (!u) return;
    const arr = getIncoming(u.id);
    const iv = arr.find(x => x.id === inviteId);
    if (!iv) return;
    setIncoming(u.id, arr.filter(x => x.id !== inviteId));
    // make sure the friend user exists (it's a mock user)
    let friend = findUserByEmail(iv.fromEmail);
    if (!friend) {
      friend = {
        id: iv.fromUserId || uid('u'),
        email: iv.fromEmail,
        password: 'bottle',
        nickname: iv.fromNickname || iv.fromEmail.split('@')[0],
        birthday: '', signature: '', avatar: iv.fromAvatar || '✿',
      };
      const users = getUsers(); users.push(friend); setUsers(users);
    }
    addFriendBidirectional(u.id, friend.id);
    toast(`和 ${friend.nickname} 成为好友了 ♡`);
    renderFriendsSection($('#friends-mount'));
    refreshAppFriendChips();
  }
  function declineIncoming(inviteId) {
    const u = currentUser(); if (!u) return;
    const arr = getIncoming(u.id);
    setIncoming(u.id, arr.filter(x => x.id !== inviteId));
    renderFriendsSection($('#friends-mount'));
  }

  // ============ 添加好友 弹窗 ============
  function openAddFriendModal() {
    const m = $('#friend-modal');
    if (!m) return;
    $('#friend-email').value = '';
    $('#friend-add-result').classList.remove('show');
    $('#friend-add-result').innerHTML = '';
    $('#friend-add-error').textContent = '';
    if (window.__sheetShow) window.__sheetShow(m);
    else m.hidden = false;
    setTimeout(() => $('#friend-email').focus(), 280);
  }
  function closeAddFriendModal() {
    const m = $('#friend-modal');
    if (!m || m.hidden) return;
    if (window.__sheetDismiss) window.__sheetDismiss(m);
    else { m.classList.add('closing'); setTimeout(() => { m.hidden = true; m.classList.remove('closing'); }, 340); }
  }

  function previewAddFriend() {
    const email = $('#friend-email').value.trim();
    const resultEl = $('#friend-add-result');
    const errEl = $('#friend-add-error');
    errEl.textContent = '';
    resultEl.classList.remove('show');
    resultEl.innerHTML = '';
    if (!email) return;
    if (!isEmail(email)) {
      errEl.textContent = '邮箱格式好像不太对';
      return;
    }
    const u = currentUser();
    if (email.toLowerCase() === u.email.toLowerCase()) {
      errEl.textContent = '不能加自己当好友哦 ✿';
      return;
    }
    const found = findUserByEmail(email);
    if (found) {
      if (isFriend(u.id, found.id)) {
        errEl.textContent = `${found.nickname} 已经是你的好友啦`;
        return;
      }
      resultEl.innerHTML = `
        <div class="afr-avatar">${found.avatar || '✿'}</div>
        <div class="afr-info">
          <div class="afr-name">${escapeHtml(found.nickname)}</div>
          <div class="afr-mail">${escapeHtml(found.email)}</div>
        </div>
        <span style="font-family:var(--font-en-hand);font-size:14px;color:var(--mint-d);">找到啦 ✦</span>
      `;
      resultEl.classList.add('show');
    } else {
      resultEl.innerHTML = `
        <div class="afr-avatar" style="background:linear-gradient(135deg,var(--cream-2),var(--cream-3));color:var(--ink-light);">?</div>
        <div class="afr-info">
          <div class="afr-name" style="color:var(--ink-soft)">陌生的邮箱</div>
          <div class="afr-mail">${escapeHtml(email)}</div>
        </div>
        <span style="font-family:var(--font-en-hand);font-size:13px;color:var(--ink-light);">将发送邀请 ✉</span>
      `;
      resultEl.classList.add('show');
    }
  }

  function submitAddFriend() {
    const email = $('#friend-email').value.trim();
    const errEl = $('#friend-add-error');
    if (!email) { errEl.textContent = '填一个邮箱吧'; return; }
    if (!isEmail(email)) { errEl.textContent = '邮箱格式不对'; return; }
    const u = currentUser();
    if (email.toLowerCase() === u.email.toLowerCase()) { errEl.textContent = '不能加自己 ✿'; return; }
    const found = findUserByEmail(email);
    if (found) {
      if (isFriend(u.id, found.id)) { errEl.textContent = '已经是好友啦'; return; }
      // mock: auto-accept (mock users do it instantly; real users would receive invite — but for demo, instant)
      addFriendBidirectional(u.id, found.id);
      toast(`和 ${found.nickname} 成为好友了 ♡`);
    } else {
      // unknown email - add to outgoing
      addOutgoing(u.id, { id: uid('iv'), toEmail: email, at: Date.now() });
      toast('邀请已发送 ✉ 等待对方接受');
    }
    closeAddFriendModal();
    renderFriendsSection($('#friends-mount'));
    refreshAppFriendChips();
  }

  function refreshAppFriendChips() {
    if (window.WishApp && typeof window.WishApp.refreshFriendChips === 'function') {
      window.WishApp.refreshFriendChips();
    }
  }

  // ============ Toast (reuse main app's toast if exposed) ============
  function toast(msg) {
    if (window.WishApp && typeof window.WishApp.toast === 'function') return window.WishApp.toast(msg);
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.hidden = true, 2200);
  }

  // ============ Initialize ============
  function init() {
    initAuthScreens();
    // Bind add-friend modal buttons
    const fm = $('#friend-modal');
    if (fm) {
      $('#friend-modal .sheet-mask').addEventListener('click', closeAddFriendModal);
      $('#btn-friend-cancel').addEventListener('click', closeAddFriendModal);
      $('#btn-friend-add').addEventListener('click', submitAddFriend);
      $('#friend-email').addEventListener('input', previewAddFriend);
    }
    // Bind escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const fm = $('#friend-modal');
        if (fm && !fm.hidden) closeAddFriendModal();
      }
    });
    updateAppLockUI();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // ============ Expose API ============
  window.WishAuth = {
    currentUser,
    isLoggedIn: () => !!currentUser(),
    friendsOf,
    friendById: findUserById,
    isFriend,
    incoming: () => currentUser() ? getIncoming(currentUser().id) : [],
    outgoing: () => currentUser() ? getOutgoing(currentUser().id) : [],
    login, register, logout,
    onAuth,
    renderUserStrip,
    renderFriendsSection,
    showAuthScreen,
    // For tweaks/demo
    setSampleFriendsCount(n) {
      const u = currentUser(); if (!u) return;
      seedSocialForUser(u.id, n);
      renderFriendsSection($('#friends-mount'));
      refreshAppFriendChips();
    },
    quickLoginAsDemo() {
      // login as the first non-mock registered user; if none, register one
      const users = getUsers().filter(u => !MOCK_USERS.find(m => m.id === u.id));
      if (users.length) {
        setCurrentId(users[0].id);
        fireAuth();
        toast(`欢迎回来 · ${users[0].nickname} ♡`);
      } else {
        const res = register({
          email: 'demo@wish.bottle', password: 'bottle',
          nickname: '小愿', birthday: '06-15',
          signature: 'collecting tiny wishes ✿', avatar: '✿',
        });
        if (res.ok) toast(`✦ 欢迎，${res.user.nickname}`);
      }
    },
    logoutAndShowWelcome() {
      logout();
    },
  };
})();
