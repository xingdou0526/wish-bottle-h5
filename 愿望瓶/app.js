/* ============================================================
   愿望瓶 — 手账版 · UI logic (H5)
   功能: 时间封印 / 贴纸 / 三段列表 / 信封 + 蜡封拆信 / 如愿盖章
============================================================ */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const LS_KEY = 'wishbottle.wishes.v4.journal';
  const LS_BIRTHDAY = 'wishbottle.birthday';

  // ---------- Auth bridge ----------
  function currentUserId() {
    return window.WishAuth?.currentUser()?.id || null;
  }

  // ---------- Sheet show / dismiss helpers ----------
  function showSheet(el) {
    if (!el) return;
    el.classList.remove('closing');
    el.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('shown')));
  }
  function dismissSheet(el, cb) {
    if (!el || el.hidden) return;
    el.classList.remove('shown');
    el.classList.add('closing');
    setTimeout(() => {
      el.hidden = true;
      el.classList.remove('closing');
      if (cb) cb();
    }, 340);
  }
  window.__sheetShow = showSheet;
  window.__sheetDismiss = dismissSheet;
  function myFriends() {
    const uid = currentUserId();
    if (!uid || !window.WishAuth) return [];
    return window.WishAuth.friendsOf(uid);
  }
  function userById(id) {
    return window.WishAuth ? window.WishAuth.friendById(id) : null;
  }
  function avatarBgStr(i) {
    const g = [
      'linear-gradient(135deg, var(--pink), var(--yellow))',
      'linear-gradient(135deg, var(--mint), var(--sky))',
      'linear-gradient(135deg, var(--lilac), var(--pink))',
      'linear-gradient(135deg, var(--yellow), var(--mint))',
      'linear-gradient(135deg, var(--sky), var(--lilac))',
    ];
    return g[i % g.length];
  }

  // ---------- Status bar clock ----------
  const sbTime = $('#sb-time');
  function updateClock() {
    const d = new Date();
    sbTime.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  updateClock(); setInterval(updateClock, 30000);

  // Page-today date (handwritten sticker)
  const pageToday = $('#page-today');
  if (pageToday) {
    const d = new Date();
    pageToday.textContent = `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  }

  // ---------- Helpers ----------
  function id() { return 'w_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function fmtDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  }
  function fmtRemain(future) {
    const ms = future - Date.now();
    if (ms <= 0) return '可以拆开了 ♡';
    const days = Math.floor(ms / 86400000);
    if (days >= 365) {
      const y = Math.floor(days / 365);
      const rd = days - y * 365;
      return rd > 0 ? `还有 ${y} 年 ${rd} 天` : `还有 ${y} 年`;
    }
    if (days >= 30) {
      const m = Math.floor(days / 30);
      const rd = days - m * 30;
      return rd > 0 ? `还有 ${m} 个月 ${rd} 天` : `还有 ${m} 个月`;
    }
    if (days >= 1) return `还有 ${days} 天`;
    const hours = Math.ceil(ms / 3600000);
    return `还有 ${hours} 小时`;
  }

  // ---------- Storage ----------
  function loadAllWishes() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.map(normalize) : [];
    } catch { return []; }
  }
  function loadWishes() {
    const uid = currentUserId();
    if (!uid) return [];
    let all = loadAllWishes();
    let mine = all.filter(w => w.ownerId === uid);
    const seedKey = 'wishbottle.seeded.' + uid;
    if (mine.length === 0 && !localStorage.getItem(seedKey)) {
      const seeded = seedWishesFor(uid, all);
      localStorage.setItem(seedKey, '1');
      mine = seeded.mine;
      all = seeded.all;
      localStorage.setItem(LS_KEY, JSON.stringify(all));
    }
    return mine;
  }
  function normalize(w) {
    return {
      id: w.id || id(),
      ownerId: w.ownerId || null,
      recipientId: w.recipientId || 'self',
      assigneeId: w.assigneeId || 'self',
      text: w.text || '',
      date: w.date || Date.now(),
      color: w.color ?? 0,
      completed: !!w.completed,
      sealUntil: w.sealUntil || 0,
      sealOpt: w.sealOpt || 'now',
      sticker: w.sticker || '',
      completedDate: w.completedDate || null,
      note: w.note || '',
    };
  }
  function saveWishes(myArr) {
    const uid = currentUserId();
    if (!uid) return;
    const all = loadAllWishes().filter(w => w.ownerId !== uid);
    localStorage.setItem(LS_KEY, JSON.stringify([...all, ...myArr]));
  }
  function seedWishesFor(uid, allExisting) {
    const now = Date.now(), day = 86400000;
    const friends = window.WishAuth ? window.WishAuth.friendsOf(uid) : [];
    const f0 = friends[0] || null;
    const f1 = friends[1] || null;
    const mine = [
      { id: id(), ownerId: uid, text: '希望今年能去一趟京都，看一次樱花飘落。', date: now - day*6, completed: false, color: 0, sticker: '☁' },
      { id: id(), ownerId: uid, text: '希望妈妈的腰能慢慢好起来。', date: now - day*4, completed: false, color: 4, sticker: '♡' },
      { id: id(), ownerId: uid, text: '希望小猫健康长大。', date: now - day*12, completed: true, color: 3, sticker: '✿',
        note: '上周带去复查，医生说一切正常，毛色也亮了好多。窝在我膝盖上呼噜呼噜的样子，太治愈了。',
        completedDate: now - day*2 },
      { id: id(), ownerId: uid, text: '一年后再看看这个愿望，希望我已经搬到喜欢的城市了。', date: now - day*2, completed: false, color: 2, sealUntil: now + day*340, sealOpt: '1y', sticker: '✦' },
    ].map(normalize);
    // friend-related: a wish I sent TO first friend
    if (f0) {
      mine.push(normalize({
        id: id(), ownerId: uid,
        text: `想跟你一起去看一场小粉色的日出 ♡  ——给 ${f0.nickname}`,
        recipientId: f0.id, assigneeId: 'self',
        date: now - day*3, completed: false, color: 1, sticker: '☀',
      }));
    }
    // friends → me incoming
    const incoming = [];
    if (f0) {
      incoming.push(normalize({
        id: id(), ownerId: f0.id,
        text: '希望你能多睡一点点，不要总是熬夜哦。',
        recipientId: uid, assigneeId: 'self',
        date: now - day*5, completed: false, color: 4, sticker: '♡',
      }));
    }
    if (f1) {
      incoming.push(normalize({
        id: id(), ownerId: f1.id,
        text: '愿你今年跟我一起去海边看一次烟火。',
        recipientId: 'self', assigneeId: uid,
        date: now - day*8, completed: false, color: 2, sticker: '✦',
      }));
    }
    return { mine, all: [...(allExisting || []), ...mine, ...incoming] };
  }
  function isLocked(w) { return w.sealUntil && w.sealUntil > Date.now(); }
  function isPending(w) { return !w.completed && !isLocked(w); }

  // ---------- State ----------
  let wishes = currentUserId() ? loadWishes() : [];
  let currentSubStatus = 'pending';
  let currentRecipientId = 'self';
  let currentAssigneeId = 'self';

  // ---------- Physics ----------
  const stage = $('#stage');
  const canvas = $('#stars-canvas');
  const P = window.WishPhysics;
  P.setupCanvas(canvas);
  P.buildBottleWalls();
  P.spawnBgDust();
  P.startPhysics();

  function refillStars() {
    P.clearStars();
    const inBottle = wishes.filter(w => !w.completed);
    inBottle.forEach((w, i) => {
      setTimeout(() => {
        P.addStar({
          x: P.BOTTLE.cx + (Math.random() - 0.5) * 200,
          y: P.BOTTLE.shoulderTop - 60 - Math.random() * 30,
          size: 14 + Math.random() * 5,
          color: P.STAR_COLORS[w.color % P.STAR_COLORS.length],
          sealed: isLocked(w),
          wishId: w.id,
        });
      }, i * 90);
    });
  }
  refillStars();

  // ---------- Mouse / touch ----------
  stage.addEventListener('mousemove', (e) => {
    P.setMousePoint(P.clientToWorld(e.clientX, e.clientY, stage));
  });
  stage.addEventListener('mouseleave', () => P.setMousePoint(null));
  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    P.setMousePoint(P.clientToWorld(t.clientX, t.clientY, stage));
  }, { passive: true });
  stage.addEventListener('touchend', () => P.setMousePoint(null));

  stage.addEventListener('click', (e) => {
    const w = P.clientToWorld(e.clientX, e.clientY, stage);
    const star = P.getStars().find(s => {
      const dx = s.body.position.x - w.x;
      const dy = s.body.position.y - w.y;
      return dx*dx + dy*dy < (s.size * 1.6) ** 2;
    });
    if (!star || !star.wishId) return;
    const wish = wishes.find(x => x.id === star.wishId);
    if (!wish) return;
    if (isLocked(wish)) {
      // Open envelope ceremony
      openEnvelopeModal(wish);
    } else {
      showDrawnWish(wish);
    }
  });

  // ---------- Tabs ----------
  $$('.tab').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  function switchView(view) {
    $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === view + '-view'));
    if (view === 'mine') renderWishList();
    if (view === 'friends' && window.WishAuth) {
      window.WishAuth.renderUserStrip($('#user-strip-mount'));
      window.WishAuth.renderFriendsSection($('#friends-mount'));
    }
  }
  $$('.sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSubStatus = btn.dataset.status;
      $$('.sub-tab').forEach(b => b.classList.toggle('active', b === btn));
      renderWishList();
    });
  });

  // ---------- Wish list ----------
  function loadFriendInbox() {
    const uid = currentUserId();
    if (!uid) return [];
    const fids = myFriends().map(f => f.id);
    if (fids.length === 0) return [];
    return loadAllWishes().filter(w =>
      fids.includes(w.ownerId) &&
      (w.recipientId === uid || w.assigneeId === uid)
    );
  }
  function friendRelated(w) {
    // wish that involves a friend (mine, sent to / assigned to friend)
    return (w.recipientId && w.recipientId !== 'self' && w.recipientId !== currentUserId())
        || (w.assigneeId && w.assigneeId !== 'self' && w.assigneeId !== currentUserId());
  }
  function updateCounts() {
    $('#count-pending').textContent = wishes.filter(isPending).length;
    $('#count-sealed').textContent  = wishes.filter(isLocked).length;
    $('#count-done').textContent    = wishes.filter(w => w.completed).length;
    const friendOutgoing = wishes.filter(friendRelated).length;
    const inbox = loadFriendInbox().length;
    $('#count-friend').textContent = friendOutgoing + inbox;
  }
  function renderWishList() {
    updateCounts();
    const list = $('#wish-list');
    list.innerHTML = '';
    let filtered;
    if (currentSubStatus === 'friend') {
      const inbox = loadFriendInbox().map(w => ({ ...w, _isIncoming: true }));
      const outgoing = wishes.filter(friendRelated);
      filtered = [...inbox, ...outgoing].sort((a, b) =>
        (b.completedDate || b.sealUntil || b.date) - (a.completedDate || a.sealUntil || a.date)
      );
    } else {
      const filterFn =
        currentSubStatus === 'sealed' ? isLocked :
        currentSubStatus === 'done'   ? (w => w.completed) :
        isPending;
      filtered = wishes.filter(filterFn).sort((a, b) =>
        (b.completedDate || b.sealUntil || b.date) - (a.completedDate || a.sealUntil || a.date)
      );
    }
    // re-render friends section only when on friends-view
    if (window.WishAuth && document.getElementById('friends-view')?.classList.contains('active')) {
      window.WishAuth.renderUserStrip($('#user-strip-mount'));
      window.WishAuth.renderFriendsSection($('#friends-mount'));
    }
    if (filtered.length === 0) { $('#wish-empty').hidden = false; return; }
    $('#wish-empty').hidden = true;
    filtered.forEach(w => list.appendChild(isLocked(w) ? buildEnvelope(w) : buildCard(w)));
  }

  function friendTagHtml(w, options = {}) {
    const me = currentUserId();
    const tags = [];
    if (w._isIncoming || (w.ownerId && w.ownerId !== me)) {
      const fromU = userById(w.ownerId);
      if (fromU) tags.push({ role: 'from', user: fromU });
    }
    if (w.ownerId === me) {
      if (w.recipientId && w.recipientId !== 'self' && w.recipientId !== me) {
        const to = userById(w.recipientId);
        if (to) tags.push({ role: 'to', user: to });
      }
      if (w.assigneeId && w.assigneeId !== 'self' && w.assigneeId !== me) {
        const as = userById(w.assigneeId);
        if (as) tags.push({ role: 'assignee', user: as });
      }
    }
    if (tags.length === 0) return '';
    return `<div class="${options.envelope ? '' : 'wc-friend-row'}">` + tags.map((t) => {
      const idx = (myFriends().findIndex(f => f.id === t.user.id) + 1) || 0;
      const cls = options.envelope
        ? 'we-friend-tag'
        : `wc-friend-tag ${t.role}`;
      const label = t.role === 'from' ? 'from' : (t.role === 'to' ? 'to' : 'wish for');
      return `<div class="${cls}">
        <div class="wft-avatar" style="background:${avatarBgStr(idx)};">${t.user.avatar || '✿'}</div>
        <span class="wft-role">${label}</span>
        <span>${escapeText(t.user.nickname)}</span>
      </div>`;
    }).join('') + '</div>';
  }
  function escapeText(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

  function buildCard(w) {
    const c = P.STAR_COLORS[w.color % P.STAR_COLORS.length];
    const card = document.createElement('article');
    card.className = 'wish-card' + (w.completed ? ' done' : '');
    const stamp = w.completed ? `<div class="wish-mini-stamp">${miniStampSvg()}</div>` :
                  (w.sticker ? `<div class="wish-sticker">${w.sticker}</div>` : '');
    const noteHtml = w.note
      ? `<div class="wc-note"><span class="wc-note-label">实现的故事 · ${w.completedDate ? fmtDate(w.completedDate) : ''}</span><span class="wc-note-text"></span></div>` : '';
    const fromIncoming = w._isIncoming;
    card.innerHTML = `
      ${stamp}
      <div class="wc-date">${fmtDate(w.date)}</div>
      ${friendTagHtml(w)}
      <div class="wc-text"></div>
      ${noteHtml}
      <div class="wc-foot">
        <svg class="wc-star" viewBox="-12 -12 24 24"><polygon points="0,-10 2.4,-3.1 9.5,-3.1 3.7,1.2 5.9,8 0,3.9 -5.9,8 -3.7,1.2 -9.5,-3.1 -2.4,-3.1" fill="${c.fill}" stroke="${c.shade}" stroke-width="0.6"/></svg>
        <div class="wc-actions">
          ${fromIncoming ? `<button class="wc-btn" data-act="view">查看</button>` :
            w.completed
              ? `<button class="wc-btn" data-act="view">查看</button>`
              : `<button class="wc-btn" data-act="done">已实现 ✓</button>`}
          ${fromIncoming ? '' : `<button class="wc-btn danger" data-act="del">删除</button>`}
        </div>
      </div>
    `;
    card.querySelector('.wc-text').textContent = w.text;
    if (w.note) card.querySelector('.wc-note-text').textContent = w.note;
    card.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'done') { openDoneModal(w, 'list'); }
      else if (act === 'view') { showDrawnWish(w); }
      else if (act === 'del') {
        if (confirm('确定要删除这个愿望吗？')) {
          wishes = wishes.filter(x => x.id !== w.id);
          saveWishes(wishes); renderWishList();
          const star = P.getStars().find(s => s.wishId === w.id);
          if (star) P.removeStar(star);
        }
      }
    });
    return card;
  }

  function buildEnvelope(w) {
    const card = document.createElement('article');
    card.className = 'wish-envelope';
    card.innerHTML = `
      <div class="we-stamp">願</div>
      <div class="we-wax">封</div>
      <div class="we-info">
        <div class="we-label">寄给未来的自己</div>
        <div class="we-date">${fmtDate(w.sealUntil)}</div>
        <div class="we-cd">${fmtRemain(w.sealUntil)}</div>
      </div>
      <button class="we-delete" data-act="del">删除</button>
      ${friendTagHtml(w, { envelope: true })}
    `;
    card.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'del') {
        e.stopPropagation();
        if (confirm('确定要删除这个愿望吗？')) {
          wishes = wishes.filter(x => x.id !== w.id);
          saveWishes(wishes); renderWishList();
          const star = P.getStars().find(s => s.wishId === w.id);
          if (star) P.removeStar(star);
        }
        return;
      }
      openEnvelopeModal(w);
    });
    return card;
  }

  function miniStampSvg() {
    return `<svg viewBox="-50 -50 100 100" width="100%" height="100%">
      <defs>
        <radialGradient id="ms-wash"><stop offset="0%" stop-color="rgba(217,122,142,0.85)"/><stop offset="60%" stop-color="rgba(217,122,142,0.55)"/><stop offset="100%" stop-color="rgba(217,122,142,0.10)"/></radialGradient>
      </defs>
      <circle cx="-3" cy="2" r="46" fill="url(#ms-wash)" opacity="0.65"/>
      <circle cx="4" cy="-2" r="42" fill="rgba(217,122,142,0.30)"/>
      <path d="M 40 -3 Q 42 22, 22 38 Q 0 44, -24 36 Q -42 20, -40 -4 Q -38 -28, -16 -40 Q 8 -42, 28 -28 Q 42 -16, 40 -3 Z" fill="none" stroke="#c4587a" stroke-width="3.2"/>
      <path d="M 35 -4 Q 37 18, 19 33 Q 0 38, -20 31 Q -36 17, -34 -5 Q -32 -23, -14 -34 Q 6 -36, 24 -24 Q 37 -14, 35 -4 Z" fill="none" stroke="#d97a8e" stroke-width="1.2"/>
      <g fill="#c4587a">
        <circle cx="28" cy="0" r="0.9"/><circle cx="20" cy="20" r="0.9"/>
        <circle cx="0" cy="28" r="0.9"/><circle cx="-20" cy="20" r="0.9"/>
        <circle cx="-28" cy="0" r="0.9"/><circle cx="-20" cy="-20" r="0.9"/>
        <circle cx="0" cy="-28" r="0.9"/><circle cx="20" cy="-20" r="0.9"/>
      </g>
      <text x="0" y="-2" text-anchor="middle" font-family="Long Cang, serif" font-size="22" fill="#a23a5a" font-weight="700">如</text>
      <text x="0" y="22" text-anchor="middle" font-family="Long Cang, serif" font-size="22" fill="#a23a5a" font-weight="700">願</text>
    </svg>`;
  }

  // ---------- Seal picker ----------
  let currentSealOpt = 'now';
  const sealHint = $('#seal-hint');
  const sealExtras = $('#seal-extras');
  const sealCustomRow = $('#seal-extra-custom');
  const sealBirthdayRow = $('#seal-extra-birthday');
  const sealCustomInput = $('#seal-custom-days');
  const sealBirthdayInput = $('#seal-birthday-input');

  $$('.seal-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentSealOpt = chip.dataset.seal;
      $$('.seal-chip').forEach(c => c.classList.toggle('active', c === chip));
      sealCustomRow.hidden = currentSealOpt !== 'custom';
      sealBirthdayRow.hidden = currentSealOpt !== 'birthday';
      sealExtras.hidden = sealCustomRow.hidden && sealBirthdayRow.hidden;
      if (currentSealOpt === 'birthday') {
        const bday = localStorage.getItem(LS_BIRTHDAY);
        if (bday) sealBirthdayInput.value = bday;
      }
      updateSealHint();
    });
  });
  sealCustomInput.addEventListener('input', updateSealHint);
  sealBirthdayInput.addEventListener('input', updateSealHint);

  function computeSealUntil() {
    const now = Date.now(), day = 86400000;
    switch (currentSealOpt) {
      case 'now': return 0;
      case '1m': return now + 30*day;
      case '3m': return now + 90*day;
      case '6m': return now + 180*day;
      case '1y': return now + 365*day;
      case 'newyear': return new Date(new Date().getFullYear() + 1, 0, 1).getTime();
      case 'birthday': {
        const v = (sealBirthdayInput.value || '').trim();
        const m = /^(\d{1,2})-(\d{1,2})$/.exec(v);
        if (!m) return 0;
        localStorage.setItem(LS_BIRTHDAY, v);
        const today = new Date();
        let next = new Date(today.getFullYear(), +m[1] - 1, +m[2]);
        if (next.getTime() <= now) next = new Date(today.getFullYear() + 1, +m[1] - 1, +m[2]);
        return next.getTime();
      }
      case 'custom': {
        const n = parseInt(sealCustomInput.value, 10);
        return (n && n > 0) ? now + n*day : 0;
      }
    }
    return 0;
  }
  function updateSealHint() {
    const until = computeSealUntil();
    if (!until) { sealHint.textContent = '立即可见'; return; }
    sealHint.textContent = `${fmtRemain(until)} · 于 ${fmtDate(until)} 拆封`;
  }

  // ---------- Sticker picker ----------
  let currentSticker = '';
  $$('.sticker-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentSticker = chip.dataset.sticker || '';
      $$('.sticker-chip').forEach(c => c.classList.toggle('active', c === chip));
    });
  });

  // ---------- Recipient / Assignee chips ----------
  function renderPeopleChips() {
    const me = window.WishAuth?.currentUser();
    const friends = myFriends();
    const rWrap = $('#recipient-chips');
    const aWrap = $('#assignee-chips');
    if (!rWrap || !aWrap) return;
    function chipHtml(klass, dataId, avatar, label, isActive, idx) {
      return `<button type="button" class="${klass}${isActive ? ' active' : ''}" data-id="${dataId}">
        <span class="${klass === 'recipient-chip' ? 'rc-avatar' : 'ac-avatar'}" style="background:${avatarBgStr(idx)};">${avatar}</span>
        <span>${escapeText(label)}</span>
      </button>`;
    }
    rWrap.innerHTML = chipHtml('recipient-chip', 'self', (me?.avatar || '✿'), '自己', currentRecipientId === 'self', 0) +
      friends.map((f, i) => chipHtml('recipient-chip', f.id, f.avatar || '✿', f.nickname, currentRecipientId === f.id, i + 1)).join('');
    aWrap.innerHTML = chipHtml('assignee-chip', 'self', (me?.avatar || '✿'), '自己', currentAssigneeId === 'self', 0) +
      friends.map((f, i) => chipHtml('assignee-chip', f.id, f.avatar || '✿', f.nickname, currentAssigneeId === f.id, i + 1)).join('');
    rWrap.querySelectorAll('.recipient-chip').forEach(b => b.addEventListener('click', () => {
      currentRecipientId = b.dataset.id;
      rWrap.querySelectorAll('.recipient-chip').forEach(x => x.classList.toggle('active', x === b));
    }));
    aWrap.querySelectorAll('.assignee-chip').forEach(b => b.addEventListener('click', () => {
      currentAssigneeId = b.dataset.id;
      aWrap.querySelectorAll('.assignee-chip').forEach(x => x.classList.toggle('active', x === b));
    }));
  }

  // ---------- Wish modal ----------
  const wishModal = $('#wish-modal');
  const input = $('#wish-input');
  $('#btn-wish').addEventListener('click', openWishModal);
  $('#btn-cancel').addEventListener('click', closeWishModal);
  $('#btn-confirm').addEventListener('click', confirmWish);
  input.addEventListener('input', () => { $('#char-count').textContent = input.value.length; });
  $('#wish-modal .sheet-mask').addEventListener('click', closeWishModal);

  function openWishModal() {
    input.value = '';
    $('#char-count').textContent = '0';
    $('#letter-date').textContent = fmtDate(Date.now());
    currentSealOpt = 'now';
    $$('.seal-chip').forEach(c => c.classList.toggle('active', c.dataset.seal === 'now'));
    sealCustomRow.hidden = true; sealBirthdayRow.hidden = true; sealExtras.hidden = true;
    sealCustomInput.value = '';
    updateSealHint();
    currentSticker = '';
    $$('.sticker-chip').forEach(c => c.classList.toggle('active', c.dataset.sticker === ''));
    currentRecipientId = 'self';
    currentAssigneeId = 'self';
    renderPeopleChips();
    showSheet(wishModal);
    setTimeout(() => input.focus(), 280);
  }
  function closeWishModal() { dismissSheet(wishModal); }
  function confirmWish() {
    const text = input.value.trim();
    if (!text) { toast('写下一个愿望吧 ✎'); return; }
    const colorIdx = Math.floor(Math.random() * P.STAR_COLORS.length);
    const sealUntil = computeSealUntil();
    const uid = currentUserId();
    const w = normalize({
      id: id(), ownerId: uid, text, date: Date.now(),
      completed: false, color: colorIdx, sealUntil, sealOpt: currentSealOpt, sticker: currentSticker,
      recipientId: currentRecipientId, assigneeId: currentAssigneeId,
    });
    wishes.push(w); saveWishes(wishes);
    closeWishModal();
    flyLetterIntoBottle(w, colorIdx);
    if (sealUntil) toast(`封印至 ${fmtDate(sealUntil)} ♡`);
    else toast('愿望已投入瓶中 ✿');
  }

  function flyLetterIntoBottle(wish, colorIdx) {
    const color = P.STAR_COLORS[colorIdx];
    const stageRect = stage.getBoundingClientRect();
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    const endX = stageRect.left + stageRect.width / 2;
    const endY = stageRect.top + stageRect.height * (P.BOTTLE.shoulderTop / P.STAGE_H);

    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed; left: ${startX}px; top: ${startY}px;
      width: 120px; height: 80px; transform: translate(-50%,-50%);
      background: repeating-linear-gradient(180deg, transparent 0 14px, rgba(180,140,90,0.18) 14px 15px), linear-gradient(135deg, #fffaf0, #f0e1b8);
      box-shadow: 0 18px 40px rgba(120, 90, 50, 0.45);
      border-radius: 4px; z-index: 200; pointer-events: none;
    `;
    document.body.appendChild(el);
    gsap.to(el, {
      duration: 0.6, width: 36, height: 36, borderRadius: '50%', rotation: 540, ease: 'power2.in',
      onComplete: () => {
        el.style.background = 'transparent'; el.style.boxShadow = 'none';
        el.innerHTML = `<svg viewBox="-12 -12 24 24" width="100%" height="100%"><polygon points="0,-10 2.4,-3.1 9.5,-3.1 3.7,1.2 5.9,8 0,3.9 -5.9,8 -3.7,1.2 -9.5,-3.1 -2.4,-3.1" fill="${color.fill}" stroke="${color.shade}" stroke-width="0.8"/></svg>`;
        gsap.to(el, {
          duration: 0.8, left: endX, top: endY, rotation: '+=360', ease: 'power2.inOut',
          onComplete: () => {
            el.remove();
            P.addStar({
              x: P.BOTTLE.cx + (Math.random() - 0.5) * 40,
              y: P.BOTTLE.shoulderTop - 40,
              size: 14 + Math.random() * 4,
              color, sealed: isLocked(wish), wishId: wish.id,
            });
            gsap.fromTo(stage, { y: 0 }, { y: -4, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.inOut' });
          }
        });
      }
    });
  }

  // ---------- Shake ----------
  let shaking = false;
  $('#btn-shake').addEventListener('click', () => {
    if (shaking) return;
    const pickable = wishes.filter(isPending);
    if (pickable.length === 0) {
      if (wishes.some(isLocked)) toast('瓶里只有未拆封的愿望哦～');
      else toast('瓶子是空的呢～');
      return;
    }
    shaking = true; stage.classList.add('shaking');
    P.shakeAllStars(0.05);
    setTimeout(() => P.shakeAllStars(0.04), 250);
    setTimeout(() => { stage.classList.remove('shaking'); shaking = false; drawWish(pickable); }, 700);
  });

  // ---------- Draw + show wish ----------
  const showModal = $('#show-modal');
  $('#btn-show-close').addEventListener('click', () => closeShowModal());
  $('#show-modal .sheet-mask').addEventListener('click', () => closeShowModal());
  $('#btn-show-done').addEventListener('click', () => {
    const w = wishes.find(x => x.id === showModal.dataset.wishId);
    if (w) { closeShowModal({ keepStar: true }); setTimeout(() => openDoneModal(w, 'show'), 300); }
  });

  function closeShowModal(opts = {}) {
    const wid = showModal.dataset.wishId;
    dismissSheet(showModal, () => {
      if (wid && !opts.keepStar) {
        const w = wishes.find(x => x.id === wid);
        if (w && !w.completed && !P.getStars().some(s => s.wishId === wid)) {
          P.addStar({
            x: P.BOTTLE.cx + (Math.random() - 0.5) * 60,
            y: P.BOTTLE.shoulderTop - 30,
            size: 14 + Math.random() * 4,
            color: P.STAR_COLORS[w.color % P.STAR_COLORS.length],
            sealed: isLocked(w), wishId: w.id,
          });
        }
      }
      showModal.dataset.wishId = '';
    });
  }

  function drawWish(pool) {
    const list = pool || wishes.filter(isPending);
    const w = list[Math.floor(Math.random() * list.length)];
    if (!w) return;
    const star = P.getStars().find(s => s.wishId === w.id);
    const stageRect = stage.getBoundingClientRect();
    const startInWorld = star ? star.body.position : { x: P.BOTTLE.cx, y: P.BOTTLE.shoulderTop };
    const startX = stageRect.left + (startInWorld.x / P.STAGE_W) * stageRect.width;
    const startY = stageRect.top + (startInWorld.y / P.STAGE_H) * stageRect.height;
    if (star) P.removeStar(star);

    const color = P.STAR_COLORS[w.color % P.STAR_COLORS.length];
    const el = document.createElement('div');
    el.className = 'flying-star';
    el.style.left = startX + 'px'; el.style.top = startY + 'px';
    el.style.transform = 'translate(-50%,-50%)';
    el.innerHTML = `<svg viewBox="-12 -12 24 24" width="100%" height="100%" style="filter: drop-shadow(0 6px 16px rgba(255,200,90,0.5));"><polygon points="0,-10 2.4,-3.1 9.5,-3.1 3.7,1.2 5.9,8 0,3.9 -5.9,8 -3.7,1.2 -9.5,-3.1 -2.4,-3.1" fill="${color.fill}" stroke="${color.shade}" stroke-width="0.8"/></svg>`;
    document.body.appendChild(el);

    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight / 2 - 80;
    gsap.timeline()
      .to(el, { duration: 0.55, left: targetX, top: stageRect.top + 60, rotation: 540, ease: 'power2.out' })
      .to(el, { duration: 0.45, left: targetX, top: targetY, rotation: '+=180', scale: 2.4, ease: 'power1.inOut' })
      .to(el, { duration: 0.25, opacity: 0, ease: 'power2.in', onComplete: () => { el.remove(); showDrawnWish(w); } });
  }

  function showDrawnWish(w) {
    $('#show-date').textContent = fmtDate(w.date);
    $('#show-text').textContent = w.text;
    $('#show-status').textContent = w.completed ? '— 这个愿已成真 ♡' : '— 还在等待中';
    const btnDone = $('#btn-show-done');
    const me = currentUserId();
    const isMine = w.ownerId === me;
    btnDone.style.display = (w.completed || !isMine) ? 'none' : '';
    // Friend pills row
    const friendRow = $('#show-friend-row');
    if (friendRow) {
      const pills = [];
      if (!isMine) {
        const from = userById(w.ownerId);
        if (from) pills.push(pillHtml('from', from));
      }
      if (w.recipientId && w.recipientId !== 'self' && w.recipientId !== me) {
        const to = userById(w.recipientId);
        if (to) pills.push(pillHtml('to', to));
      }
      if (w.recipientId === me && !isMine) {
        pills.push(`<span class="show-friend-pill"><span class="sfp-role">to</span><span>你 ✿</span></span>`);
      }
      if (w.assigneeId && w.assigneeId !== 'self' && w.assigneeId !== me) {
        const as = userById(w.assigneeId);
        if (as) pills.push(pillHtml('wish-for', as));
      }
      if (w.assigneeId === me && !isMine) {
        pills.push(`<span class="show-friend-pill"><span class="sfp-role">wish for</span><span>你 ♡</span></span>`);
      }
      friendRow.innerHTML = pills.join('');
      friendRow.hidden = pills.length === 0;
    }
    const noteSection = $('#show-note-section');
    if (w.completed && w.note) {
      noteSection.hidden = false;
      $('#show-note').textContent = w.note;
      $('#show-note-date').textContent = w.completedDate ? fmtDate(w.completedDate) : '';
    } else { noteSection.hidden = true; }
    showModal.dataset.wishId = w.id;
    showSheet(showModal);
  }
  function pillHtml(role, user) {
    const idx = (myFriends().findIndex(f => f.id === user.id) + 1) || 0;
    return `<span class="show-friend-pill">
      <span class="sfp-avatar" style="background:${avatarBgStr(idx)};">${user.avatar || '✿'}</span>
      <span class="sfp-role">${role}</span>
      <span>${escapeText(user.nickname)}</span>
    </span>`;
  }

  // ---------- Envelope (拆信) modal ----------
  const envelopeModal = $('#envelope-modal');
  const envelopeFlap = $('#be-flap');
  const envelopeWax  = $('#be-wax');
  const envelopeHintEl = $('#envelope-hint');
  let envelopeBound = false;
  let pendingEnvelopeWish = null;

  $('#envelope-close').addEventListener('click', () => closeEnvelopeModal());
  $('#envelope-modal .envelope-open-mask').addEventListener('click', () => closeEnvelopeModal());

  function openEnvelopeModal(w) {
    pendingEnvelopeWish = w;
    const locked = isLocked(w);
    // Reset flap + wax to initial position
    gsap.set(envelopeFlap, { rotationX: 0, y: 0, opacity: 1, transformOrigin: '50% 0%' });
    gsap.set(envelopeWax, { x: 0, y: 0, scale: 1, rotation: -6, opacity: 1 });
    $('#be-date').textContent = fmtDate(w.sealUntil || w.date);
    $('#be-cd').textContent = locked ? fmtRemain(w.sealUntil) : '可以拆开了 ♡';
    envelopeHintEl.textContent = locked ? `要等到 ${fmtDate(w.sealUntil)} 才能拆开哦 ♡` : '点击信封 · 撕开封蜡';
    envelopeModal.hidden = false;
  }
  function closeEnvelopeModal() {
    envelopeModal.hidden = true;
    pendingEnvelopeWish = null;
  }

  $('#big-envelope').addEventListener('click', () => {
    const w = pendingEnvelopeWish;
    if (!w) return;
    if (isLocked(w)) {
      toast(`要等到 ${fmtDate(w.sealUntil)} 才能拆开哦 ♡`);
      return;
    }
    // Play tear-open animation
    envelopeHintEl.textContent = '';
    const tl = gsap.timeline({
      onComplete: () => {
        envelopeModal.hidden = true;
        setTimeout(() => showDrawnWish(w), 200);
        pendingEnvelopeWish = null;
      }
    });
    tl.to(envelopeWax, {
      duration: 0.45, x: 80, y: -50, rotation: 60, scale: 1.3, opacity: 0, ease: 'power2.in',
    })
    .to(envelopeFlap, {
      duration: 0.55, rotationX: -180, y: -10, opacity: 0, ease: 'power2.inOut',
    }, '-=0.15');
  });

  // ---------- Done modal + Stamp animation ----------
  const doneModal = $('#done-modal');
  const doneInput = $('#done-note-input');
  let pendingDoneWish = null, pendingDoneOrigin = null;

  $('#done-modal .sheet-mask').addEventListener('click', () => closeDoneModal());
  $('#btn-done-skip').addEventListener('click', () => finalizeDone(false));
  $('#btn-done-save').addEventListener('click', () => finalizeDone(true));
  doneInput.addEventListener('input', () => { $('#done-char-count').textContent = doneInput.value.length; });

  function openDoneModal(w, origin) {
    pendingDoneWish = w; pendingDoneOrigin = origin;
    doneInput.value = '';
    $('#done-char-count').textContent = '0';
    $('#done-date').textContent = fmtDate(Date.now());
    $('#done-original').textContent = w.text;
    showSheet(doneModal);
    setTimeout(() => doneInput.focus(), 280);
  }
  function closeDoneModal() { dismissSheet(doneModal); pendingDoneWish = null; }

  function finalizeDone(saveNote) {
    const w = pendingDoneWish;
    if (!w) return closeDoneModal();
    w.completed = true;
    w.completedDate = Date.now();
    if (saveNote) {
      const note = doneInput.value.trim();
      if (note) w.note = note;
    }
    saveWishes(wishes);
    dismissSheet(doneModal, () => {
      playStampAnimation();
      // remove star from bottle
      const star = P.getStars().find(s => s.wishId === w.id);
      if (star) P.removeStar(star);
    });
    if (pendingDoneOrigin === 'list') setTimeout(renderWishList, 800);
    pendingDoneWish = null;
  }

  function playStampAnimation() {
    const overlay = $('#stamp-overlay');
    const stamp = $('#as-wish-stamp');
    overlay.hidden = false;
    overlay.classList.add('firing');
    gsap.set(stamp, { rotation: -10, scale: 2.6, opacity: 0, transformOrigin: '50% 50%' });
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(stamp, {
          duration: 0.4, scale: 1.1, opacity: 0, ease: 'power1.out',
          onComplete: () => {
            overlay.hidden = true;
            overlay.classList.remove('firing');
            toast('♡ 如愿印章已轻轻落下');
          }
        });
      }
    });
    tl.to(stamp, { duration: 0.20, opacity: 1, scale: 2.2, ease: 'power1.in' })
      .to(stamp, { duration: 0.35, scale: 0.95, ease: 'back.out(3)' })
      .to(stamp, { duration: 0.18, rotation: -10, scale: 1.0, ease: 'sine.out' })
      .to({}, { duration: 0.5 }); // hold
  }

  // ---------- Periodic unlock check ----------
  setInterval(() => {
    let changed = false;
    for (const w of wishes) {
      if (w.sealUntil && w.sealUntil <= Date.now()) {
        w.sealUntil = 0;
        const star = P.getStars().find(s => s.wishId === w.id);
        if (star) star.sealed = false;
        changed = true;
        toast('一封信件可以拆开了 ♡');
      }
    }
    if (changed) {
      saveWishes(wishes);
      if ($('#mine-view').classList.contains('active')) renderWishList();
    }
  }, 30000);

  // ---------- Toast ----------
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.hidden = true, 2200);
  }

  // ---------- Refresh (called by auth on login/logout) ----------
  function refresh() {
    wishes = currentUserId() ? loadWishes() : [];
    refillStars();
    if (window.WishAuth) {
      window.WishAuth.renderUserStrip($('#user-strip-mount'));
      window.WishAuth.renderFriendsSection($('#friends-mount'));
    }
    if ($('#mine-view') && $('#mine-view').classList.contains('active')) renderWishList();
  }
  // Listen for auth changes
  if (window.WishAuth) {
    window.WishAuth.onAuth(() => refresh());
  }

  // ---------- Esc closes modals ----------
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!wishModal.hidden) closeWishModal();
      else if (!doneModal.hidden) closeDoneModal();
      else if (!envelopeModal.hidden) closeEnvelopeModal();
      else if (!showModal.hidden) closeShowModal();
    }
  });

  window.WishApp = {
    refresh,
    refillStars,
    getWishes: () => wishes,
    saveWishes: () => saveWishes(wishes),
    refreshFriendChips: () => renderPeopleChips(),
    toast,
    P,
  };

  // Initial sync (in case user was already logged in from previous session)
  refresh();
})();
