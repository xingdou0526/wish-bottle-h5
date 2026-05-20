/* ============================================================
   愿望瓶 — 夜空版 · UI logic (H5)
   功能: 时间封印 / 三段列表 / 升空成永恒之星
============================================================ */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const LS_KEY = 'wishbottle.wishes.v3.sky';
  const LS_BIRTHDAY = 'wishbottle.birthday';

  // ---------- Status bar clock ----------
  const sbTime = $('#sb-time');
  function updateClock() {
    const d = new Date();
    sbTime.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  updateClock(); setInterval(updateClock, 30000);

  // ---------- Helpers ----------
  function id() { return 'w_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function fmtDate(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  }
  function dayDiff(future, now=Date.now()) {
    return Math.ceil((future - now) / 86400000);
  }
  function fmtRemain(future) {
    const ms = future - Date.now();
    if (ms <= 0) return '可以拆开了 ✨';
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
  // Stable hash for wish.id → sky position
  function hashId(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }
  function skyPosFromId(wid) {
    const h = hashId(wid);
    const x = 8 + (h % 84);                  // 8% .. 92%
    const y = 8 + ((h >> 8) % 28);            // 8% .. 36% (above the bottle)
    const size = 1.2 + ((h >> 16) % 100) / 50; // 1.2 .. 3.2
    const tw = 1 + ((h >> 18) % 100) / 50;    // twinkle speed multiplier
    return { x, y, size, tw, hash: h };
  }

  // ---------- Storage ----------
  function loadWishes() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return seedWishes();
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.map(normalize) : seedWishes();
    } catch { return seedWishes(); }
  }
  function normalize(w) {
    return {
      id: w.id || id(),
      text: w.text || '',
      date: w.date || Date.now(),
      color: w.color ?? 0,
      completed: !!w.completed,
      sealUntil: w.sealUntil || 0,      // 0 = visible now
      sealOpt: w.sealOpt || 'now',
      completedDate: w.completedDate || null,
      note: w.note || '',
      skyPos: w.skyPos || null,
    };
  }
  function saveWishes(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
  function seedWishes() {
    const now = Date.now(), day = 86400000;
    const seed = [
      { id: id(), text: '希望今年能去一趟京都，看一次樱花飘落。', date: now - day*6, completed: false, color: 0, sealUntil: 0, sealOpt: 'now' },
      { id: id(), text: '希望妈妈的腰能慢慢好起来。', date: now - day*4, completed: false, color: 5, sealUntil: 0, sealOpt: 'now' },
      { id: id(), text: '希望小猫健康长大。', date: now - day*12, completed: true, color: 3,
        sealUntil: 0, sealOpt: 'now',
        note: '上周带去复查，医生说一切正常，毛色也亮了好多。窝在我膝盖上呼噜呼噜的样子，太治愈了。',
        completedDate: now - day*2 },
      { id: id(), text: '希望明天考试顺利通过。', date: now - day*1, completed: false, color: 1, sealUntil: 0, sealOpt: 'now' },
      { id: id(), text: '一年后再看看这个愿望，希望我已经搬到喜欢的城市了。', date: now - day*2, completed: false, color: 4, sealUntil: now + day*340, sealOpt: '1y' },
    ].map(normalize);
    // give existing completed seed a stable skyPos
    seed.forEach(w => { if (w.completed && !w.skyPos) w.skyPos = skyPosFromId(w.id); });
    saveWishes(seed);
    return seed;
  }

  function isLocked(w) { return w.sealUntil && w.sealUntil > Date.now(); }
  function isPending(w) { return !w.completed && !isLocked(w); }

  // ---------- State ----------
  let wishes = loadWishes();
  let currentSubStatus = 'pending';

  // ---------- Init physics ----------
  const stage = $('#stage');
  const canvas = $('#stars-canvas');
  const P = window.WishPhysics;
  P.setupCanvas(canvas);
  P.buildBottleWalls();
  P.spawnBgDust();
  P.startPhysics();

  function refillStars() {
    P.clearStars();
    // Stars in bottle = pending + sealed wishes
    const inBottle = wishes.filter(w => !w.completed);
    inBottle.forEach((w, i) => {
      setTimeout(() => {
        P.addStar({
          x: P.BOTTLE.cx + (Math.random() - 0.5) * 200,
          y: P.BOTTLE.shoulderTop - 60 - Math.random() * 30,
          size: 14 + Math.random() * 5,
          color: P.STAR_COLORS[w.color % P.STAR_COLORS.length],
          glow: false,
          sealed: isLocked(w),
          wishId: w.id,
        });
      }, i * 90);
    });
  }
  refillStars();

  // ---------- Mouse / touch interaction ----------
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

  // Tap a star in bottle to peek the wish
  stage.addEventListener('click', (e) => {
    const w = P.clientToWorld(e.clientX, e.clientY, stage);
    const star = P.getStars().find(s => {
      const dx = s.body.position.x - w.x;
      const dy = s.body.position.y - w.y;
      return dx*dx + dy*dy < (s.size * 1.6) ** 2;
    });
    if (!star || !star.wishId) return;
    const wish = wishes.find(x => x.id === star.wishId);
    if (wish) showDrawnWish(wish);
  });

  // ---------- Permanent sky stars (achievements) ----------
  const skyCanvas = $('#sky-stars-canvas');
  const skyCtx = skyCanvas.getContext('2d');
  let skyDpr = Math.min(window.devicePixelRatio || 1, 2);
  function resizeSkyCanvas() {
    const rect = skyCanvas.getBoundingClientRect();
    skyCanvas.width = rect.width * skyDpr;
    skyCanvas.height = rect.height * skyDpr;
    skyCtx.setTransform(skyDpr, 0, 0, skyDpr, 0, 0);
  }
  resizeSkyCanvas();
  window.addEventListener('resize', resizeSkyCanvas);
  function drawSky(now) {
    const w = skyCanvas.clientWidth, h = skyCanvas.clientHeight;
    skyCtx.clearRect(0, 0, w, h);
    wishes.filter(x => x.completed && x.skyPos).forEach(x => {
      const p = x.skyPos;
      const cx = (p.x / 100) * w;
      const cy = (p.y / 100) * h;
      const tw = 0.6 + 0.4 * Math.sin(now / 600 * p.tw + p.hash * 0.001);
      const r = p.size;
      // outer glow
      const g = skyCtx.createRadialGradient(cx, cy, 0, cx, cy, r * 8);
      g.addColorStop(0, `rgba(255, 230, 150, ${0.55 * tw})`);
      g.addColorStop(0.4, `rgba(255, 200, 110, ${0.15 * tw})`);
      g.addColorStop(1, 'rgba(255, 200, 110, 0)');
      skyCtx.fillStyle = g;
      skyCtx.beginPath();
      skyCtx.arc(cx, cy, r * 8, 0, Math.PI * 2);
      skyCtx.fill();
      // core
      skyCtx.fillStyle = `rgba(255, 245, 200, ${0.85 + 0.15 * tw})`;
      skyCtx.beginPath();
      skyCtx.arc(cx, cy, r, 0, Math.PI * 2);
      skyCtx.fill();
      // cross sparkle
      skyCtx.strokeStyle = `rgba(255, 230, 150, ${0.5 * tw})`;
      skyCtx.lineWidth = 0.6;
      skyCtx.beginPath();
      skyCtx.moveTo(cx - r*3, cy); skyCtx.lineTo(cx + r*3, cy);
      skyCtx.moveTo(cx, cy - r*3); skyCtx.lineTo(cx, cy + r*3);
      skyCtx.stroke();
    });
    requestAnimationFrame(drawSky);
  }
  requestAnimationFrame(drawSky);

  // ---------- Tabs ----------
  $$('.tab').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  function switchView(view) {
    $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === view + '-view'));
    if (view === 'mine') renderWishList();
  }
  $$('.sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSubStatus = btn.dataset.status;
      $$('.sub-tab').forEach(b => b.classList.toggle('active', b === btn));
      renderWishList();
    });
  });

  // ---------- Wish list ----------
  function updateCounts() {
    $('#count-pending').textContent = wishes.filter(isPending).length;
    $('#count-sealed').textContent  = wishes.filter(isLocked).length;
    $('#count-done').textContent    = wishes.filter(w => w.completed).length;
  }
  function renderWishList() {
    updateCounts();
    const list = $('#wish-list');
    list.innerHTML = '';
    const filterFn =
      currentSubStatus === 'sealed' ? isLocked :
      currentSubStatus === 'done'   ? (w => w.completed) :
      isPending;
    const filtered = wishes.filter(filterFn).sort((a, b) =>
      (b.completedDate || b.sealUntil || b.date) - (a.completedDate || a.sealUntil || a.date)
    );
    if (filtered.length === 0) { $('#wish-empty').hidden = false; return; }
    $('#wish-empty').hidden = true;
    filtered.forEach(w => list.appendChild(buildCard(w)));
  }
  function buildCard(w) {
    const c = P.STAR_COLORS[w.color % P.STAR_COLORS.length];
    const locked = isLocked(w);
    const card = document.createElement('article');
    card.className = 'wish-card' + (w.completed ? ' done' : '') + (locked ? ' sealed' : '');
    const noteHtml = w.note && !locked
      ? `<div class="wc-note"><span class="wc-note-label">实现的故事 · ${w.completedDate ? fmtDate(w.completedDate) : ''}</span><span class="wc-note-text"></span></div>` : '';
    card.innerHTML = `
      <div class="wc-date">${fmtDate(w.date)}</div>
      <div class="wc-text"></div>
      ${noteHtml}
      <div class="wc-foot">
        <svg class="wc-star" viewBox="-12 -12 24 24"><polygon points="0,-10 2.4,-3.1 9.5,-3.1 3.7,1.2 5.9,8 0,3.9 -5.9,8 -3.7,1.2 -9.5,-3.1 -2.4,-3.1" fill="${c.fill}" stroke="${c.shade}" stroke-width="0.6"/></svg>
        <div class="wc-actions">
          ${w.completed
            ? `<button class="wc-btn" data-act="view">查看</button>`
            : locked
              ? `<button class="wc-btn" data-act="peek">查看</button>`
              : `<button class="wc-btn" data-act="done">已实现 ✓</button>`}
          <button class="wc-btn danger" data-act="del">删除</button>
        </div>
      </div>
      ${locked ? `
        <div class="seal-overlay" data-act="peek">
          <div class="so-icon">✦</div>
          <div class="so-label">未拆封</div>
          <div class="so-cd">${fmtRemain(w.sealUntil)}<span class="so-when">于 ${fmtDate(w.sealUntil)} 开启</span></div>
        </div>` : ''}
    `;
    card.querySelector('.wc-text').textContent = w.text;
    if (w.note && !locked) card.querySelector('.wc-note-text').textContent = w.note;

    card.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      if (act === 'done') {
        openDoneModal(w, 'list');
      } else if (act === 'view') {
        showDrawnWish(w);
      } else if (act === 'peek') {
        if (locked) {
          toast(`要等到 ${fmtDate(w.sealUntil)} 才能拆开哦`);
        } else {
          showDrawnWish(w);
        }
      } else if (act === 'del') {
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

  // ---------- Seal picker (in wish modal) ----------
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
      // Preset birthday input if saved
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
    const now = Date.now();
    const day = 86400000;
    switch (currentSealOpt) {
      case 'now': return 0;
      case '1m': return now + 30 * day;
      case '3m': return now + 90 * day;
      case '6m': return now + 180 * day;
      case '1y': return now + 365 * day;
      case 'newyear': {
        const d = new Date();
        return new Date(d.getFullYear() + 1, 0, 1, 0, 0, 0).getTime();
      }
      case 'birthday': {
        const v = (sealBirthdayInput.value || '').trim();
        const m = /^(\d{1,2})-(\d{1,2})$/.exec(v);
        if (!m) return 0; // invalid → treat as now
        localStorage.setItem(LS_BIRTHDAY, v);
        const mm = +m[1], dd = +m[2];
        const today = new Date();
        let next = new Date(today.getFullYear(), mm - 1, dd, 0, 0, 0);
        if (next.getTime() <= now) next = new Date(today.getFullYear() + 1, mm - 1, dd, 0, 0, 0);
        return next.getTime();
      }
      case 'custom': {
        const n = parseInt(sealCustomInput.value, 10);
        if (!n || n <= 0) return 0;
        return now + n * day;
      }
    }
    return 0;
  }
  function updateSealHint() {
    const until = computeSealUntil();
    if (!until) { sealHint.textContent = '立即可见'; return; }
    sealHint.textContent = `${fmtRemain(until)} · 于 ${fmtDate(until)} 拆封`;
  }

  // ---------- Add wish modal ----------
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
    // Reset seal picker
    currentSealOpt = 'now';
    $$('.seal-chip').forEach(c => c.classList.toggle('active', c.dataset.seal === 'now'));
    sealCustomRow.hidden = true; sealBirthdayRow.hidden = true; sealExtras.hidden = true;
    sealCustomInput.value = '';
    updateSealHint();
    wishModal.hidden = false;
    setTimeout(() => input.focus(), 280);
  }
  function dismissSheet(el, cb) {
    if (el.hidden) return;
    el.classList.add('closing');
    setTimeout(() => {
      el.hidden = true;
      el.classList.remove('closing');
      if (cb) cb();
    }, 340);
  }
  function closeWishModal() { dismissSheet(wishModal); }

  function confirmWish() {
    const text = input.value.trim();
    if (!text) { toast('写下一个愿望吧 ✎'); return; }
    const colorIdx = Math.floor(Math.random() * P.STAR_COLORS.length);
    const sealUntil = computeSealUntil();
    const w = normalize({ id: id(), text, date: Date.now(), completed: false, color: colorIdx, sealUntil, sealOpt: currentSealOpt });
    wishes.push(w); saveWishes(wishes);
    closeWishModal();
    flyLetterIntoBottle(w, colorIdx);
    if (sealUntil) toast(`封印至 ${fmtDate(sealUntil)} ✦`);
    else toast('愿望已投入瓶中 ✦');
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
      background: repeating-linear-gradient(180deg, transparent 0 14px, rgba(120,90,40,0.18) 14px 15px), linear-gradient(135deg, #fbf4dd, #f0e1b8);
      box-shadow: 0 18px 40px rgba(0,0,0,0.45);
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

  // ---------- Shake (random pick from unlocked, uncompleted) ----------
  let shaking = false;
  $('#btn-shake').addEventListener('click', () => {
    if (shaking) return;
    const pickable = wishes.filter(isPending);
    if (pickable.length === 0) {
      const hasSealed = wishes.some(isLocked);
      if (hasSealed) toast('瓶里只有封印中的愿望哦～');
      else toast('瓶子是空的呢～');
      return;
    }
    shaking = true; stage.classList.add('shaking');
    P.shakeAllStars(0.05);
    setTimeout(() => P.shakeAllStars(0.04), 250);
    setTimeout(() => { stage.classList.remove('shaking'); shaking = false; drawWish(pickable); }, 700);
  });

  // ---------- Draw / show wish modal ----------
  const showModal = $('#show-modal');
  const showLetter = showModal.querySelector('.letter');
  $('#btn-show-close').addEventListener('click', () => closeShowModal());
  $('#show-modal .sheet-mask').addEventListener('click', () => closeShowModal());
  $('#btn-show-done').addEventListener('click', () => {
    const w = wishes.find(x => x.id === showModal.dataset.wishId);
    if (w) {
      closeShowModal({ keepStar: true });
      setTimeout(() => openDoneModal(w, 'show'), 300);
    }
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
    el.innerHTML = `<svg viewBox="-12 -12 24 24" width="100%" height="100%" style="filter: drop-shadow(0 6px 16px rgba(255,200,90,0.6));"><polygon points="0,-10 2.4,-3.1 9.5,-3.1 3.7,1.2 5.9,8 0,3.9 -5.9,8 -3.7,1.2 -9.5,-3.1 -2.4,-3.1" fill="${color.fill}" stroke="${color.shade}" stroke-width="0.8"/></svg>`;
    document.body.appendChild(el);

    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight / 2 - 80;

    gsap.timeline()
      .to(el, { duration: 0.55, left: targetX, top: stageRect.top + 60, rotation: 540, ease: 'power2.out' })
      .to(el, { duration: 0.45, left: targetX, top: targetY, rotation: '+=180', scale: 2.4, ease: 'power1.inOut' })
      .to(el, { duration: 0.25, opacity: 0, ease: 'power2.in',
        onComplete: () => { el.remove(); showDrawnWish(w); }
      });
  }

  function showDrawnWish(w) {
    const locked = isLocked(w);
    $('#show-date').textContent = fmtDate(w.date);
    $('#show-text').textContent = w.text;
    $('#show-status').textContent = w.completed ? '— 这个愿已成真 ✓' : (locked ? '— 时间封印中' : '— 还在等待中');
    const btnDone = $('#btn-show-done');
    btnDone.style.display = (w.completed || locked) ? 'none' : '';
    const noteSection = $('#show-note-section');
    if (w.completed && w.note) {
      noteSection.hidden = false;
      $('#show-note').textContent = w.note;
      $('#show-note-date').textContent = w.completedDate ? fmtDate(w.completedDate) : '';
    } else {
      noteSection.hidden = true;
    }
    const banner = $('#show-sealed-banner');
    if (locked) {
      banner.hidden = false;
      $('#show-countdown').textContent = `${fmtRemain(w.sealUntil)} · 于 ${fmtDate(w.sealUntil)} 开启`;
      showLetter.classList.add('is-sealed');
    } else {
      banner.hidden = true;
      showLetter.classList.remove('is-sealed');
    }
    showModal.dataset.wishId = w.id;
    showModal.hidden = false;
  }

  // ---------- Done modal ----------
  const doneModal = $('#done-modal');
  const doneInput = $('#done-note-input');
  let pendingDoneWish = null;
  let pendingDoneOrigin = null;

  $('#done-modal .sheet-mask').addEventListener('click', () => closeDoneModal());
  $('#btn-done-skip').addEventListener('click', () => finalizeDone(false));
  $('#btn-done-save').addEventListener('click', () => finalizeDone(true));
  doneInput.addEventListener('input', () => { $('#done-char-count').textContent = doneInput.value.length; });

  function openDoneModal(w, origin) {
    pendingDoneWish = w;
    pendingDoneOrigin = origin;
    doneInput.value = '';
    $('#done-char-count').textContent = '0';
    $('#done-date').textContent = fmtDate(Date.now());
    $('#done-original').textContent = w.text;
    doneModal.hidden = false;
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
    // Assign permanent sky position
    if (!w.skyPos) w.skyPos = skyPosFromId(w.id);
    saveWishes(wishes);
    dismissSheet(doneModal, () => {
      // Fly the star up and out of the bottle into the night sky
      flyStarToSky(w);
    });
    if (pendingDoneOrigin === 'list') setTimeout(renderWishList, 400);
    pendingDoneWish = null;
  }

  // ---------- Rise to sky animation ----------
  function flyStarToSky(w) {
    const color = P.STAR_COLORS[w.color % P.STAR_COLORS.length];
    const star = P.getStars().find(s => s.wishId === w.id);
    const stageRect = stage.getBoundingClientRect();
    const startInWorld = star ? star.body.position : { x: P.BOTTLE.cx, y: P.BOTTLE.shoulderTop };
    const startX = stageRect.left + (startInWorld.x / P.STAGE_W) * stageRect.width;
    const startY = stageRect.top + (startInWorld.y / P.STAGE_H) * stageRect.height;
    if (star) P.removeStar(star);

    // Target = permanent sky position
    const shellEl = $('#phone-shell');
    const shellRect = shellEl.getBoundingClientRect();
    const tx = shellRect.left + (w.skyPos.x / 100) * shellRect.width;
    const ty = shellRect.top  + (w.skyPos.y / 100) * shellRect.height;

    // Star sprite
    const el = document.createElement('div');
    el.className = 'rising-star';
    el.style.left = startX + 'px'; el.style.top = startY + 'px';
    el.style.transform = 'translate(-50%,-50%)';
    el.innerHTML = `<svg viewBox="-12 -12 24 24" width="100%" height="100%" style="filter: drop-shadow(0 0 14px ${color.fill});"><polygon points="0,-10 2.4,-3.1 9.5,-3.1 3.7,1.2 5.9,8 0,3.9 -5.9,8 -3.7,1.2 -9.5,-3.1 -2.4,-3.1" fill="${color.fill}" stroke="${color.shade}" stroke-width="0.6"/></svg>`;
    document.body.appendChild(el);

    // Trail canvas
    const trail = document.createElement('canvas');
    trail.className = 'rising-trail';
    trail.width = window.innerWidth * skyDpr;
    trail.height = window.innerHeight * skyDpr;
    trail.style.width = window.innerWidth + 'px';
    trail.style.height = window.innerHeight + 'px';
    document.body.appendChild(trail);
    const tctx = trail.getContext('2d');
    tctx.scale(skyDpr, skyDpr);

    // Curve via mid-point
    const cx1 = (startX + tx) / 2 + (Math.random() - 0.5) * 60;
    const cy1 = Math.min(startY, ty) - 80 - Math.random() * 40;

    const pts = [];
    const obj = { t: 0 };
    gsap.to(obj, {
      t: 1,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => {
        const t = obj.t;
        // Quadratic Bezier
        const x = (1-t)*(1-t)*startX + 2*(1-t)*t*cx1 + t*t*tx;
        const y = (1-t)*(1-t)*startY + 2*(1-t)*t*cy1 + t*t*ty;
        el.style.left = x + 'px'; el.style.top = y + 'px';
        pts.push({ x, y, t });
        // Fade old points by clearing & redrawing
        tctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let i = Math.max(0, pts.length - 30); i < pts.length; i++) {
          const p = pts[i];
          const age = (pts.length - i) / 30;
          const alpha = (1 - age) * 0.6;
          tctx.fillStyle = `rgba(255, 230, 150, ${alpha})`;
          tctx.beginPath();
          tctx.arc(p.x, p.y, (1 - age) * 4 + 1, 0, Math.PI * 2);
          tctx.fill();
        }
      },
      onComplete: () => {
        // Burst on landing
        gsap.to(el, {
          scale: 1.8, opacity: 0, duration: 0.5, ease: 'power2.out',
          onComplete: () => {
            el.remove();
            // Fade out trail
            gsap.to(trail, { opacity: 0, duration: 0.6, onComplete: () => trail.remove() });
            toast('✦ 这颗星永远地点亮了夜空');
          }
        });
      }
    });
  }

  // ---------- Periodic unlock check ----------
  setInterval(() => {
    let changed = false;
    for (const w of wishes) {
      if (w.sealUntil && w.sealUntil <= Date.now()) {
        // unlock — make the star no longer sealed
        const sealedWas = w.sealUntil;
        w.sealUntil = 0;
        const star = P.getStars().find(s => s.wishId === w.id);
        if (star) star.sealed = false;
        changed = true;
        toast('一封封印已到期 ✦');
      }
    }
    if (changed) {
      saveWishes(wishes);
      if (!$('#mine-view').classList.contains('active')) {} else renderWishList();
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

  // ---------- Esc closes modals ----------
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!wishModal.hidden) closeWishModal();
      else if (!doneModal.hidden) closeDoneModal();
      else if (!showModal.hidden) closeShowModal();
    }
  });

  window.WishApp = {
    refillStars, getWishes: () => wishes, saveWishes: () => saveWishes(wishes), P,
  };
})();
