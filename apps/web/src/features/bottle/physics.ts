/*
 * Matter.js + canvas 物理与渲染。从原 physics.js 移植，封装为可创建实例的类。
 * 坐标系与 SVG viewBox(800x760) 一致；渲染时按 canvas 缩放。
 */
import Matter from 'matter-js';

const { Engine, World, Bodies, Body, Composite } = Matter;

export const STAGE_W = 800;
export const STAGE_H = 760;

export const BOTTLE = {
  cx: 400,
  rimTop: 116,
  shoulderTop: 142,
  shoulderBottom: 210,
  bodyBottom: 600,
  bottomY: 686,
  openingHalfW: 144,
  bodyHalfW: 190,
  bottomR: 86,
};

export const STAR_COLORS = [
  { fill: '#ffd3dd', shade: '#f0a8b8' },
  { fill: '#ffe9a8', shade: '#f0c870' },
  { fill: '#bfe6c8', shade: '#85c498' },
  { fill: '#c8e4ec', shade: '#90c0d0' },
  { fill: '#d8d5ee', shade: '#a8a3d0' },
];

const TWO_PI = Math.PI * 2;

export interface StarMeta {
  body: Matter.Body;
  colorIdx: number;
  size: number;
  rotOffset: number;
  sparkle: number;
  glow: boolean;
  sealed: boolean;
  wishId: string | null;
}

function hexToRgb(h: string) {
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}
function mix(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}
function rgb(c: { r: number; g: number; b: number }) {
  return `rgba(${c.r | 0},${c.g | 0},${c.b | 0},1)`;
}
const WHITE = { r: 255, g: 255, b: 255 };
const DARK = { r: 30, g: 18, b: 50 };

function starPath(c: CanvasRenderingContext2D, r: number) {
  const inner = r * 0.42;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.closePath();
}

interface BgDust { x: number; y: number; r: number; vx: number; vy: number; alpha: number }

export class WishPhysics {
  engine = Engine.create({ gravity: { x: 0, y: 1.0, scale: 0.001 }, enableSleeping: false });
  stars: StarMeta[] = [];
  bgDust: BgDust[] = [];
  mousePoint: { x: number; y: number } | null = null;
  mouseRadius = 70;
  mouseStrength = 0.0008;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private rafId: number | null = null;
  private lastT = 0;
  private walls: Matter.Body[] = [];

  constructor() {
    this.buildWalls();
    this.spawnBgDust();
  }

  attachCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = STAGE_W * this.dpr;
    canvas.height = STAGE_H * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  start() {
    if (this.rafId != null) return;
    this.lastT = performance.now();
    const tick = (now: number) => {
      this.rafId = requestAnimationFrame(tick);
      const dt = Math.min(now - this.lastT, 32);
      this.lastT = now;
      this.applyMouseForces();
      Engine.update(this.engine, dt);
      this.render(now);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  destroy() {
    this.stop();
    this.clearStars();
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
  }

  private buildWalls() {
    const B = BOTTLE;
    const t = 24;
    const walls: Matter.Body[] = [];

    walls.push(Bodies.rectangle(
      B.cx - B.bodyHalfW - t / 2,
      (B.shoulderBottom + B.bodyBottom) / 2,
      t, B.bodyBottom - B.shoulderBottom,
      { isStatic: true, label: 'wall-body-l' },
    ));
    walls.push(Bodies.rectangle(
      B.cx + B.bodyHalfW + t / 2,
      (B.shoulderBottom + B.bodyBottom) / 2,
      t, B.bodyBottom - B.shoulderBottom,
      { isStatic: true, label: 'wall-body-r' },
    ));

    const dx = B.bodyHalfW - B.openingHalfW;
    const dy = B.shoulderBottom - B.shoulderTop;
    const slen = Math.sqrt(dx * dx + dy * dy);
    const sa = Math.atan2(dy, dx);
    walls.push(Bodies.rectangle(
      B.cx - (B.openingHalfW + B.bodyHalfW) / 2,
      (B.shoulderTop + B.shoulderBottom) / 2,
      slen + t, t,
      { isStatic: true, angle: Math.PI - sa, label: 'wall-shoulder-l' },
    ));
    walls.push(Bodies.rectangle(
      B.cx + (B.openingHalfW + B.bodyHalfW) / 2,
      (B.shoulderTop + B.shoulderBottom) / 2,
      slen + t, t,
      { isStatic: true, angle: sa, label: 'wall-shoulder-r' },
    ));

    walls.push(Bodies.rectangle(
      B.cx, B.bottomY + t / 2,
      B.bodyHalfW * 2 - B.bottomR * 2, t,
      { isStatic: true, label: 'wall-bottom' },
    ));

    const cdx = B.bottomR, cdy = B.bottomR;
    const clen = Math.sqrt(cdx * cdx + cdy * cdy);
    walls.push(Bodies.rectangle(
      B.cx - B.bodyHalfW + B.bottomR / 2 - t / 4,
      B.bodyBottom + B.bottomR / 2 + t / 4,
      clen + t, t,
      { isStatic: true, angle: Math.atan2(cdy, cdx), label: 'wall-corner-l' },
    ));
    walls.push(Bodies.rectangle(
      B.cx + B.bodyHalfW - B.bottomR / 2 + t / 4,
      B.bodyBottom + B.bottomR / 2 + t / 4,
      clen + t, t,
      { isStatic: true, angle: -Math.atan2(cdy, cdx), label: 'wall-corner-r' },
    ));

    walls.forEach((w) => { w.restitution = 0.32; w.friction = 0.06; });
    World.add(this.engine.world, walls);
    this.walls = walls;
  }

  spawnBgDust() {
    this.bgDust = [];
    for (let i = 0; i < 16; i++) {
      this.bgDust.push({
        x: BOTTLE.cx + (Math.random() - 0.5) * (BOTTLE.bodyHalfW * 1.6),
        y: BOTTLE.shoulderTop + Math.random() * (BOTTLE.bodyBottom - BOTTLE.shoulderTop),
        r: 0.6 + Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 0.1,
        vy: -0.05 - Math.random() * 0.08,
        alpha: 0.15 + Math.random() * 0.35,
      });
    }
  }

  addStar(opts: { colorIdx?: number; sealed?: boolean; glow?: boolean; wishId?: string | null; size?: number } = {}): StarMeta {
    const size = opts.size ?? 12 + Math.random() * 6;
    const colorIdx = opts.colorIdx ?? Math.floor(Math.random() * STAR_COLORS.length);
    const x = BOTTLE.cx + (Math.random() - 0.5) * 200;
    const y = BOTTLE.shoulderTop - 80 - Math.random() * 40;
    const body = Bodies.polygon(x, y, 5, size * 0.85, {
      restitution: 0.35,
      friction: 0.08,
      frictionAir: 0.012,
      density: 0.0018,
      angle: Math.random() * TWO_PI,
    });
    Body.setVelocity(body, { x: (Math.random() - 0.5) * 1.5, y: 1 + Math.random() });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);
    World.add(this.engine.world, body);
    const meta: StarMeta = {
      body,
      colorIdx,
      size,
      rotOffset: Math.random() * TWO_PI,
      sparkle: Math.random(),
      glow: opts.glow ?? false,
      sealed: opts.sealed ?? false,
      wishId: opts.wishId ?? null,
    };
    this.stars.push(meta);
    return meta;
  }

  removeStarByWishId(wishId: string) {
    const idx = this.stars.findIndex((s) => s.wishId === wishId);
    if (idx < 0) return;
    Composite.remove(this.engine.world, this.stars[idx].body);
    this.stars.splice(idx, 1);
  }

  clearStars() {
    this.stars.forEach((s) => Composite.remove(this.engine.world, s.body));
    this.stars = [];
  }

  setMousePoint(p: { x: number; y: number } | null) {
    this.mousePoint = p;
  }

  shake(strength = 0.04) {
    for (const s of this.stars) {
      Body.applyForce(s.body, s.body.position, {
        x: (Math.random() - 0.5) * strength,
        y: -Math.random() * strength * 1.2,
      });
      Body.setAngularVelocity(s.body, (Math.random() - 0.5) * 0.4);
    }
  }

  clientToWorld(clientX: number, clientY: number, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * STAGE_W;
    const y = ((clientY - rect.top) / rect.height) * STAGE_H;
    return { x, y };
  }

  private applyMouseForces() {
    const mp = this.mousePoint;
    if (!mp) return;
    for (const s of this.stars) {
      const dx = s.body.position.x - mp.x;
      const dy = s.body.position.y - mp.y;
      const d2 = dx * dx + dy * dy;
      const r2 = this.mouseRadius * this.mouseRadius;
      if (d2 < r2 && d2 > 1) {
        const d = Math.sqrt(d2);
        const fall = 1 - d / this.mouseRadius;
        Body.applyForce(s.body, s.body.position, {
          x: (dx / d) * this.mouseStrength * fall,
          y: (dy / d) * this.mouseStrength * fall,
        });
        Body.setAngularVelocity(s.body, s.body.angularVelocity + (Math.random() - 0.5) * 0.05 * fall);
      }
    }
  }

  private render(now: number) {
    const c = this.ctx;
    if (!c) return;
    c.clearRect(0, 0, STAGE_W, STAGE_H);
    this.renderBgDust(c);
    for (const s of this.stars) this.renderStar(c, s, now);
  }

  private renderBgDust(c: CanvasRenderingContext2D) {
    for (const p of this.bgDust) {
      p.x += p.vx;
      p.y += p.vy;
      if (
        p.y < BOTTLE.shoulderTop + 20 ||
        p.x < BOTTLE.cx - BOTTLE.bodyHalfW + 10 ||
        p.x > BOTTLE.cx + BOTTLE.bodyHalfW - 10
      ) {
        p.x = BOTTLE.cx + (Math.random() - 0.5) * (BOTTLE.bodyHalfW * 1.6);
        p.y = BOTTLE.bodyBottom - Math.random() * 60;
        p.vy = -0.05 - Math.random() * 0.08;
      }
      c.fillStyle = `rgba(255, 235, 180, ${p.alpha})`;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, TWO_PI);
      c.fill();
    }
  }

  private renderStar(c: CanvasRenderingContext2D, s: StarMeta, now: number) {
    const { x, y } = s.body.position;
    const a = s.body.angle + s.rotOffset;
    const r = s.size;
    const innerR = r * 0.42;
    const color = STAR_COLORS[s.colorIdx % STAR_COLORS.length];

    if (s.sealed) {
      c.save();
      c.globalAlpha = 0.5;
    }

    c.save();
    c.translate(x, y);
    c.rotate(a);

    // shadow
    c.save();
    c.translate(1.5, 2.6);
    c.fillStyle = 'rgba(15,6,30,0.40)';
    c.filter = 'blur(1.6px)';
    starPath(c, r * 1.04);
    c.fill();
    c.restore();

    // back face
    c.save();
    c.translate(0.6, 1.0);
    const backRgb = hexToRgb(color.shade);
    const backDark = mix(backRgb, DARK, 0.45);
    c.fillStyle = rgb(backDark);
    starPath(c, r);
    c.fill();
    c.restore();

    const worldLightAngle = -Math.PI / 2 - 0.45;
    const localLight = worldLightAngle - a;
    const lx = Math.cos(localLight);
    const ly = Math.sin(localLight);
    const baseRgb = hexToRgb(color.fill);
    const midRgb = hexToRgb(color.shade);

    for (let i = 0; i < 10; i++) {
      const a1 = -Math.PI / 2 + (i * Math.PI) / 5;
      const a2 = -Math.PI / 2 + ((i + 1) * Math.PI) / 5;
      const r1 = i % 2 === 0 ? r : innerR;
      const r2 = i % 2 === 0 ? innerR : r;
      const x1 = Math.cos(a1) * r1, y1 = Math.sin(a1) * r1;
      const x2 = Math.cos(a2) * r2, y2 = Math.sin(a2) * r2;
      const mx = (x1 + x2) * 0.5, my = (y1 + y2) * 0.5;
      const mlen = Math.hypot(mx, my) || 1;
      const nx = mx / mlen, ny = my / mlen;
      const dot = nx * lx + ny * ly;
      const lit = (dot + 1) * 0.5;
      let fillRgb;
      if (lit > 0.55) {
        const t = ((lit - 0.55) / 0.45) * 0.55;
        fillRgb = mix(baseRgb, WHITE, t);
      } else {
        const t = (0.55 - lit) / 0.55;
        const toShade = mix(baseRgb, midRgb, Math.min(t * 1.4, 1));
        fillRgb = mix(toShade, DARK, t * 0.35);
      }
      c.fillStyle = rgb(fillRgb);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(x1, y1);
      c.lineTo(x2, y2);
      c.closePath();
      c.fill();
    }

    c.strokeStyle = 'rgba(40,20,5,0.20)';
    c.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + (i * TWO_PI) / 5;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 0.4;
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI / 2 + (i * TWO_PI) / 5 + Math.PI / 5;
      const px = Math.cos(ang) * innerR, py = Math.sin(ang) * innerR;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();

    c.strokeStyle = 'rgba(60,30,10,0.30)';
    c.lineWidth = 0.7;
    starPath(c, r);
    c.stroke();

    const hlAng = localLight + Math.PI;
    const hx = Math.cos(hlAng) * r * 0.12;
    const hy = Math.sin(hlAng) * r * 0.12;
    const hl = c.createRadialGradient(hx, hy, 0, hx, hy, r * 0.55);
    hl.addColorStop(0, 'rgba(255,255,255,0.65)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hl;
    c.beginPath();
    c.arc(hx, hy, r * 0.55, 0, TWO_PI);
    c.fill();

    const sparkleT = (now / 1000 + s.sparkle * 6) % 4;
    if (sparkleT < 0.55) {
      const alpha = Math.sin((sparkleT / 0.55) * Math.PI);
      c.fillStyle = `rgba(255,255,255,${alpha * 0.85})`;
      c.beginPath();
      c.arc(-r * 0.35, -r * 0.35, 1.2 + alpha, 0, TWO_PI);
      c.fill();
    }

    if (s.glow) {
      c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.4);
      gg.addColorStop(0, 'rgba(255,220,140,0.55)');
      gg.addColorStop(1, 'rgba(255,220,140,0)');
      c.fillStyle = gg;
      c.beginPath();
      c.arc(0, 0, r * 2.4, 0, TWO_PI);
      c.fill();
      c.globalCompositeOperation = 'source-over';
    }

    c.restore();

    if (s.sealed) {
      c.restore();
      c.save();
      c.translate(x, y);
      const ringR = r * 1.8;
      const dashPhase = (now / 90) % 12;
      c.setLineDash([4, 4]);
      c.lineDashOffset = -dashPhase;
      c.strokeStyle = 'rgba(217, 122, 142, 0.65)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(0, 0, ringR, 0, TWO_PI);
      c.stroke();
      c.setLineDash([]);
      c.strokeStyle = 'rgba(217, 122, 142, 0.18)';
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 0, ringR, 0, TWO_PI);
      c.stroke();
      c.restore();
    }
  }
}
