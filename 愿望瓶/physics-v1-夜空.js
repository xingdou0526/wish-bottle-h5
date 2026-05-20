/* ============================================================
   愿望瓶 — Matter.js physics + 星星渲染
============================================================ */

const { Engine, World, Bodies, Body, Composite, Events, Vector } = Matter;

// SVG viewBox is 800x760 — physics world uses the same coordinate space
const STAGE_W = 800;
const STAGE_H = 760;

// Bottle interior geometry (matches the SVG path in 愿望瓶.html)
const BOTTLE = {
  cx: 400,
  rimTop: 116,
  shoulderTop: 142,   // mouth opening level (rim bottom)
  shoulderBottom: 210,// body begins here
  bodyBottom: 600,    // body ends, bottom curve begins
  bottomY: 686,       // very bottom
  openingHalfW: 144,  // half width of mouth opening
  bodyHalfW: 190,     // half width of body
  bottomR: 86,        // bottom corner radius
};

// Folded-paper star palette (warm + cool mix)
const STAR_COLORS = [
  { fill: '#ffb18a', shade: '#e88a5c', name: 'apricot' },
  { fill: '#ffd789', shade: '#e8b357', name: 'sun' },
  { fill: '#ffe2a0', shade: '#e8c463', name: 'cream' },
  { fill: '#a8d8b9', shade: '#6fb289', name: 'mint' },
  { fill: '#9ec9f5', shade: '#6a9ed4', name: 'sky' },
  { fill: '#c2b2e8', shade: '#8e7ec4', name: 'lilac' },
  { fill: '#f4a5c1', shade: '#cf7595', name: 'rose' },
  { fill: '#f7e1b5', shade: '#d6b878', name: 'wheat' },
];

const TWO_PI = Math.PI * 2;

// ------------------------------------------------------------
// Engine
// ------------------------------------------------------------
const engine = Engine.create({
  gravity: { x: 0, y: 1.0, scale: 0.001 },
  enableSleeping: false,
});
const world = engine.world;

let stars = [];          // {body, color, size, rotOffset, kind}
let mousePoint = null;   // current mouse position in SVG coords (or null)
let mouseRadius = 70;    // influence radius
let mouseStrength = 0.0008;
let bgPaperParticles = [];

// ------------------------------------------------------------
// Build bottle walls (static bodies)
// ------------------------------------------------------------
function buildBottleWalls() {
  const B = BOTTLE;
  const t = 24; // wall thickness
  const walls = [];

  // Left body wall
  walls.push(Bodies.rectangle(
    B.cx - B.bodyHalfW - t / 2,
    (B.shoulderBottom + B.bodyBottom) / 2,
    t,
    B.bodyBottom - B.shoulderBottom,
    { isStatic: true, label: 'wall-body-l' }
  ));

  // Right body wall
  walls.push(Bodies.rectangle(
    B.cx + B.bodyHalfW + t / 2,
    (B.shoulderBottom + B.bodyBottom) / 2,
    t,
    B.bodyBottom - B.shoulderBottom,
    { isStatic: true, label: 'wall-body-r' }
  ));

  // Shoulder left (diagonal from (cx-openingHalfW, shoulderTop) to (cx-bodyHalfW, shoulderBottom))
  const dx = B.bodyHalfW - B.openingHalfW;      // positive
  const dy = B.shoulderBottom - B.shoulderTop;  // positive
  const slen = Math.sqrt(dx * dx + dy * dy);
  const sa = Math.atan2(dy, dx);

  walls.push(Bodies.rectangle(
    B.cx - (B.openingHalfW + B.bodyHalfW) / 2,
    (B.shoulderTop + B.shoulderBottom) / 2,
    slen + t,
    t,
    { isStatic: true, angle: Math.PI - sa, label: 'wall-shoulder-l' }
  ));

  // Shoulder right
  walls.push(Bodies.rectangle(
    B.cx + (B.openingHalfW + B.bodyHalfW) / 2,
    (B.shoulderTop + B.shoulderBottom) / 2,
    slen + t,
    t,
    { isStatic: true, angle: sa, label: 'wall-shoulder-r' }
  ));

  // Bottom — flat center
  walls.push(Bodies.rectangle(
    B.cx,
    B.bottomY + t / 2,
    (B.bodyHalfW * 2) - B.bottomR * 2,
    t,
    { isStatic: true, label: 'wall-bottom' }
  ));

  // Bottom-left corner (diagonal)
  const cdx = B.bottomR;
  const cdy = B.bottomR;
  const clen = Math.sqrt(cdx * cdx + cdy * cdy);
  walls.push(Bodies.rectangle(
    B.cx - B.bodyHalfW + B.bottomR / 2 - t / 4,
    B.bodyBottom + B.bottomR / 2 + t / 4,
    clen + t,
    t,
    { isStatic: true, angle: Math.atan2(cdy, cdx), label: 'wall-corner-l' }
  ));

  // Bottom-right corner
  walls.push(Bodies.rectangle(
    B.cx + B.bodyHalfW - B.bottomR / 2 + t / 4,
    B.bodyBottom + B.bottomR / 2 + t / 4,
    clen + t,
    t,
    { isStatic: true, angle: -Math.atan2(cdy, cdx), label: 'wall-corner-r' }
  ));

  walls.forEach(w => { w.restitution = 0.32; w.friction = 0.06; });
  World.add(world, walls);
  return walls;
}

// ------------------------------------------------------------
// Stars
// ------------------------------------------------------------
function randStarColor() {
  return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
}

function makeStarBody(x, y, size, opts = {}) {
  // 5-sided polygon approximating a small folded star
  const body = Bodies.polygon(x, y, 5, size * 0.85, {
    restitution: 0.35,
    friction: 0.08,
    frictionAir: 0.012,
    density: 0.0018,
    angle: Math.random() * TWO_PI,
    ...opts,
  });
  return body;
}

function addStar(opts = {}) {
  const size = opts.size ?? (12 + Math.random() * 6);
  const color = opts.color ?? randStarColor();
  const x = opts.x ?? (BOTTLE.cx + (Math.random() - 0.5) * 200);
  const y = opts.y ?? (BOTTLE.shoulderTop - 80 - Math.random() * 40);
  const body = makeStarBody(x, y, size);
  Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.5, y: 1 + Math.random() });
  Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);
  World.add(world, body);
  const star = {
    body,
    color,
    size,
    rotOffset: Math.random() * TWO_PI,
    sparkle: Math.random(),
    glow: opts.glow ?? false,
    sealed: opts.sealed ?? false,
    wishId: opts.wishId ?? null,
  };
  stars.push(star);
  return star;
}

function clearStars() {
  stars.forEach(s => Composite.remove(world, s.body));
  stars = [];
}

function removeStar(star) {
  Composite.remove(world, star.body);
  stars = stars.filter(s => s !== star);
}

// ------------------------------------------------------------
// Mouse interaction — push stars away on hover ("stirring")
// ------------------------------------------------------------
function setMousePoint(p) { mousePoint = p; }

function applyMouseForces() {
  if (!mousePoint) return;
  for (const s of stars) {
    const dx = s.body.position.x - mousePoint.x;
    const dy = s.body.position.y - mousePoint.y;
    const d2 = dx * dx + dy * dy;
    const r2 = mouseRadius * mouseRadius;
    if (d2 < r2 && d2 > 1) {
      const d = Math.sqrt(d2);
      const falloff = 1 - d / mouseRadius;
      const fx = (dx / d) * mouseStrength * falloff;
      const fy = (dy / d) * mouseStrength * falloff;
      Body.applyForce(s.body, s.body.position, { x: fx, y: fy });
      // a tiny spin too
      Body.setAngularVelocity(s.body, s.body.angularVelocity + (Math.random() - 0.5) * 0.05 * falloff);
    }
  }
}

// Shake all stars (摇一摇)
function shakeAllStars(strength = 0.04) {
  for (const s of stars) {
    Body.applyForce(s.body, s.body.position, {
      x: (Math.random() - 0.5) * strength,
      y: -Math.random() * strength * 1.2,
    });
    Body.setAngularVelocity(s.body, (Math.random() - 0.5) * 0.4);
  }
}

// ------------------------------------------------------------
// Canvas renderer — draw folded-paper stars
// ------------------------------------------------------------
let canvas, ctx, dpr = 1;

function setupCanvas(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = STAGE_W * dpr;
  canvas.height = STAGE_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Convert client coords to SVG/world coords
function clientToWorld(clientX, clientY, el) {
  const rect = el.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * STAGE_W;
  const y = ((clientY - rect.top) / rect.height) * STAGE_H;
  return { x, y };
}

// Build 5-point star path centered at (0,0)
function starPath(c, r) {
  const inner = r * 0.42;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = (i % 2 === 0) ? r : inner;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
}

// Color helpers for 3D facet shading
function hexToRgb(h) {
  return { r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) };
}
function rgbStr(r,g,b,a=1){ return `rgba(${r|0},${g|0},${b|0},${a})`; }
function mixRgb(a, b, t) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}
const _WHITE = { r: 255, g: 255, b: 255 };
const _DARK = { r: 30, g: 18, b: 50 };

function drawStar(c, s, now) {
  const { x, y } = s.body.position;
  const a = s.body.angle + s.rotOffset;
  const r = s.size;
  const innerR = r * 0.42;

  // Sealed stars draw at reduced opacity with a dashed ring
  if (s.sealed) {
    c.save();
    c.globalAlpha = 0.55;
  }

  c.save();
  c.translate(x, y);
  c.rotate(a);

  // ---- Drop shadow underneath (3D depth) ----
  c.save();
  c.translate(1.5, 2.6);
  c.fillStyle = 'rgba(15,6,30,0.40)';
  c.filter = 'blur(1.6px)';
  starPath(c, r * 1.04);
  c.fill();
  c.restore();

  // ---- Back face (slight offset, darker — gives thickness) ----
  c.save();
  c.translate(0.6, 1.0);
  const backRgb = hexToRgb(s.color.shade);
  const backDark = mixRgb(backRgb, _DARK, 0.45);
  c.fillStyle = rgbStr(backDark.r, backDark.g, backDark.b);
  starPath(c, r);
  c.fill();
  c.restore();

  // ---- Front 3D faceted star ----
  // Light direction (in world frame, light from upper-left)
  const worldLightAngle = -Math.PI / 2 - 0.45;
  const localLight = worldLightAngle - a;
  const lx = Math.cos(localLight);
  const ly = Math.sin(localLight);

  const baseRgb = hexToRgb(s.color.fill);
  const midRgb  = hexToRgb(s.color.shade);

  // 10 triangular facets (5 arms × 2 each), meeting at center
  for (let i = 0; i < 10; i++) {
    const a1 = -Math.PI / 2 + i * Math.PI / 5;
    const a2 = -Math.PI / 2 + (i + 1) * Math.PI / 5;
    const r1 = (i % 2 === 0) ? r : innerR;
    const r2 = (i % 2 === 0) ? innerR : r;
    const x1 = Math.cos(a1) * r1, y1 = Math.sin(a1) * r1;
    const x2 = Math.cos(a2) * r2, y2 = Math.sin(a2) * r2;

    // Facet midpoint (used as approx normal direction from center)
    const mx = (x1 + x2) * 0.5, my = (y1 + y2) * 0.5;
    const mlen = Math.hypot(mx, my) || 1;
    const nx = mx / mlen, ny = my / mlen;

    // Dot product with light gives brightness 0..1
    const dot = nx * lx + ny * ly;
    const lit = (dot + 1) * 0.5; // 0..1

    // Build fill color: bright facets mix toward white, dark facets toward shade/dark
    let fillRgb;
    if (lit > 0.55) {
      // bright: blend base -> white
      const t = (lit - 0.55) / 0.45 * 0.55;
      fillRgb = mixRgb(baseRgb, _WHITE, t);
    } else {
      // dim: blend base -> shade -> dark
      const t = (0.55 - lit) / 0.55;
      const toShade = mixRgb(baseRgb, midRgb, Math.min(t * 1.4, 1));
      fillRgb = mixRgb(toShade, _DARK, t * 0.35);
    }

    c.fillStyle = rgbStr(fillRgb.r, fillRgb.g, fillRgb.b);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(x1, y1);
    c.lineTo(x2, y2);
    c.closePath();
    c.fill();
  }

  // ---- Fold crease lines from center to each outer point ----
  c.strokeStyle = 'rgba(40,20,5,0.20)';
  c.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI / 2 + i * (TWO_PI / 5);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    c.stroke();
  }
  // Inner pentagon edges (subtle, dashed-like)
  c.strokeStyle = 'rgba(255,255,255,0.18)';
  c.lineWidth = 0.4;
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const ang = -Math.PI / 2 + i * (TWO_PI / 5) + Math.PI / 5;
    const px = Math.cos(ang) * innerR, py = Math.sin(ang) * innerR;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.stroke();

  // ---- Outline ----
  c.strokeStyle = 'rgba(60,30,10,0.30)';
  c.lineWidth = 0.7;
  starPath(c, r);
  c.stroke();

  // ---- Center highlight dot (paper peak) ----
  const hlAng = localLight + Math.PI; // opposite light direction
  const hx = Math.cos(hlAng) * r * 0.12;
  const hy = Math.sin(hlAng) * r * 0.12;
  const hl = c.createRadialGradient(hx, hy, 0, hx, hy, r * 0.55);
  hl.addColorStop(0, 'rgba(255,255,255,0.65)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hl;
  c.beginPath();
  c.arc(hx, hy, r * 0.55, 0, TWO_PI);
  c.fill();

  // ---- Twinkle sparkle ----
  const sparkleT = (now / 1000 + s.sparkle * 6) % 4;
  if (sparkleT < 0.55) {
    const alpha = Math.sin((sparkleT / 0.55) * Math.PI);
    c.fillStyle = `rgba(255,255,255,${alpha * 0.85})`;
    c.beginPath();
    c.arc(-r * 0.35, -r * 0.35, 1.2 + alpha, 0, TWO_PI);
    c.fill();
  }

  // ---- Soft glow if marked completed ----
  if (s.glow) {
    c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.4);
    gg.addColorStop(0, 'rgba(255,220,140,0.55)');
    gg.addColorStop(1, 'rgba(255,220,140,0)');
    c.fillStyle = gg;
    c.beginPath(); c.arc(0, 0, r * 2.4, 0, TWO_PI); c.fill();
    c.globalCompositeOperation = 'source-over';
  }

  c.restore();

  // ---- Sealed: dashed ring + lock glyph ----
  if (s.sealed) {
    c.restore(); // close the alpha save

    c.save();
    c.translate(x, y);
    const ringR = r * 1.8;
    const dashPhase = (now / 80) % 12;
    c.setLineDash([4, 4]);
    c.lineDashOffset = -dashPhase;
    c.strokeStyle = 'rgba(255, 220, 130, 0.55)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(0, 0, ringR, 0, TWO_PI);
    c.stroke();
    c.setLineDash([]);

    // Soft glow ring
    c.strokeStyle = 'rgba(255, 220, 130, 0.18)';
    c.lineWidth = 4;
    c.beginPath();
    c.arc(0, 0, ringR, 0, TWO_PI);
    c.stroke();

    c.restore();
  } else {
    /* no extra */
  }
}

// Background paper-dust particles inside the bottle
function spawnBgDust() {
  bgPaperParticles = [];
  for (let i = 0; i < 16; i++) {
    bgPaperParticles.push({
      x: BOTTLE.cx + (Math.random() - 0.5) * (BOTTLE.bodyHalfW * 1.6),
      y: BOTTLE.shoulderTop + Math.random() * (BOTTLE.bodyBottom - BOTTLE.shoulderTop),
      r: 0.6 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.1,
      vy: -0.05 - Math.random() * 0.08,
      alpha: 0.15 + Math.random() * 0.35,
    });
  }
}
function drawBgDust(c) {
  for (const p of bgPaperParticles) {
    p.x += p.vx; p.y += p.vy;
    if (p.y < BOTTLE.shoulderTop + 20 || p.x < BOTTLE.cx - BOTTLE.bodyHalfW + 10 || p.x > BOTTLE.cx + BOTTLE.bodyHalfW - 10) {
      // reset
      p.x = BOTTLE.cx + (Math.random() - 0.5) * (BOTTLE.bodyHalfW * 1.6);
      p.y = BOTTLE.bodyBottom - Math.random() * 60;
      p.vy = -0.05 - Math.random() * 0.08;
    }
    c.fillStyle = `rgba(255, 235, 180, ${p.alpha})`;
    c.beginPath(); c.arc(p.x, p.y, p.r, 0, TWO_PI); c.fill();
  }
}

// ------------------------------------------------------------
// Main loop
// ------------------------------------------------------------
let rafId = null;
let lastT = 0;

function tick(now) {
  rafId = requestAnimationFrame(tick);
  const dt = Math.min(now - lastT, 32);
  lastT = now;

  applyMouseForces();
  Engine.update(engine, dt);

  ctx.clearRect(0, 0, STAGE_W, STAGE_H);

  // background dust (inside bottle)
  drawBgDust(ctx);

  for (const s of stars) drawStar(ctx, s, now);
}

function startPhysics() {
  if (rafId) return;
  lastT = performance.now();
  rafId = requestAnimationFrame(tick);
}
function stopPhysics() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------
window.WishPhysics = {
  STAGE_W, STAGE_H, BOTTLE, STAR_COLORS,
  setupCanvas,
  buildBottleWalls,
  addStar, clearStars, removeStar,
  setMousePoint,
  setMouseStrength: (v) => { mouseStrength = 0.0008 * v; },
  shakeAllStars,
  clientToWorld,
  spawnBgDust,
  startPhysics, stopPhysics,
  getStars: () => stars,
};
