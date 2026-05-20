/* ============================================================
   愿望瓶 — 可爱风流星背景
   - 柔和圆头 + 渐变拖尾
   - 粉/金/薄荷/紫等暖糖色
   - 偶尔出现一颗特别的"心形/星形"头部
============================================================ */
(function () {
  const canvas = document.getElementById('meteor-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  // Cute pastel palette
  const COLORS = [
    { core: '#fff4d0', tail: 'rgba(255, 220, 140, 0.85)' }, // gold
    { core: '#ffd6e0', tail: 'rgba(255, 170, 195, 0.85)' }, // pink
    { core: '#d8e9ff', tail: 'rgba(160, 200, 255, 0.85)' }, // sky
    { core: '#d4f0d8', tail: 'rgba(160, 220, 180, 0.85)' }, // mint
    { core: '#ead8ff', tail: 'rgba(195, 165, 245, 0.85)' }, // lilac
    { core: '#ffe1c2', tail: 'rgba(255, 190, 130, 0.85)' }, // peach
  ];

  // Head shapes — mostly soft dot, sometimes star/heart for whimsy
  const HEADS = ['dot', 'dot', 'dot', 'dot', 'star', 'heart'];

  const meteors = [];
  const sparkles = []; // tiny dots that pop along the path

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function spawnMeteor() {
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft
      ? Math.random() * W * 0.4 - 40
      : W - Math.random() * W * 0.4 + 40;
    const startY = -40 - Math.random() * 80;

    // Direction: gentle diagonal downward
    const angle = fromLeft
      ? (Math.PI / 4) + (Math.random() - 0.5) * 0.3    // ~45° down-right
      : (3 * Math.PI / 4) + (Math.random() - 0.5) * 0.3; // ~135° down-left

    const speed = 1.6 + Math.random() * 1.4;           // slow & whimsical
    const color = COLORS[(Math.random() * COLORS.length) | 0];
    const head  = HEADS[(Math.random() * HEADS.length) | 0];
    const tailLen = 90 + Math.random() * 80;
    const life = 0;
    const maxLife = 280 + Math.random() * 120;

    meteors.push({
      x: startX, y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color, head,
      tailLen,
      headSize: 3 + Math.random() * 3,
      life, maxLife,
      twinkle: Math.random() * Math.PI * 2,
    });
  }

  function spawnSparkle(x, y, color) {
    sparkles.push({
      x, y,
      r: 0.6 + Math.random() * 1.2,
      alpha: 0.7 + Math.random() * 0.3,
      decay: 0.012 + Math.random() * 0.012,
      color,
    });
  }

  function drawDotHead(x, y, r, color) {
    // Soft glow halo
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
    g.addColorStop(0, color.core);
    g.addColorStop(0.35, color.tail.replace('0.85', '0.45'));
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 5, 0, Math.PI * 2); ctx.fill();
    // Core
    ctx.fillStyle = color.core;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function drawStarHead(x, y, r, color, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    // halo
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 6);
    g.addColorStop(0, color.tail.replace('0.85', '0.55'));
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r * 6, 0, Math.PI * 2); ctx.fill();
    // 5-point star
    ctx.fillStyle = color.core;
    ctx.beginPath();
    const inner = r * 0.45;
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r * 1.6 : inner * 1.6;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHeartHead(x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    // halo
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 6);
    g.addColorStop(0, color.tail.replace('0.85', '0.55'));
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r * 6, 0, Math.PI * 2); ctx.fill();
    // heart
    ctx.fillStyle = color.core;
    ctx.beginPath();
    const s = r * 1.4;
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(s, -s * 0.5, s * 1.2, s * 0.4, 0, s * 1.1);
    ctx.bezierCurveTo(-s * 1.2, s * 0.4, -s, -s * 0.5, 0, s * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawMeteor(m) {
    const t = m.life / m.maxLife;
    // fade in then fade out
    const fade = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;

    // Tail — gradient line from behind the head
    const tx = m.x - m.vx * (m.tailLen / Math.hypot(m.vx, m.vy));
    const ty = m.y - m.vy * (m.tailLen / Math.hypot(m.vx, m.vy));
    const grad = ctx.createLinearGradient(tx, ty, m.x, m.y);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.6, m.color.tail.replace('0.85', String(0.35 * fade)));
    grad.addColorStop(1, m.color.tail.replace('0.85', String(0.85 * fade)));

    ctx.strokeStyle = grad;
    ctx.lineWidth = m.headSize * 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();

    // Inner bright line
    const grad2 = ctx.createLinearGradient(tx, ty, m.x, m.y);
    grad2.addColorStop(0, 'rgba(255,255,255,0)');
    grad2.addColorStop(1, `rgba(255,255,255,${0.55 * fade})`);
    ctx.strokeStyle = grad2;
    ctx.lineWidth = m.headSize * 0.45;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();

    // Head
    ctx.globalAlpha = fade;
    if (m.head === 'star') {
      drawStarHead(m.x, m.y, m.headSize, m.color, m.life * 0.05);
    } else if (m.head === 'heart') {
      drawHeartHead(m.x, m.y, m.headSize, m.color);
    } else {
      drawDotHead(m.x, m.y, m.headSize, m.color);
    }
    ctx.globalAlpha = 1;
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life++;

      // occasional tail sparkle
      if (Math.random() < 0.12) spawnSparkle(
        m.x - m.vx * (Math.random() * 4),
        m.y - m.vy * (Math.random() * 4),
        m.color
      );

      drawMeteor(m);

      if (m.life > m.maxLife || m.x < -200 || m.x > W + 200 || m.y > H + 200) {
        meteors.splice(i, 1);
      }
    }

    // Sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.alpha -= s.decay;
      if (s.alpha <= 0) { sparkles.splice(i, 1); continue; }
      ctx.fillStyle = s.color.core;
      ctx.globalAlpha = s.alpha;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(step);
  }
  step();

  // Spawn loop — random intervals, 1-2 simultaneous
  function spawnLoop() {
    if (meteors.length < 2 && document.visibilityState === 'visible') {
      spawnMeteor();
    }
    const next = 1800 + Math.random() * 3200; // 1.8s ~ 5s between attempts
    setTimeout(spawnLoop, next);
  }
  setTimeout(spawnLoop, 600);

  // Expose
  window.WishMeteors = {
    spawn: spawnMeteor,
    clear: () => meteors.length = 0,
  };
})();
