// 与原型 styles.css / app.js 中的常量保持一致
export const STAR_COLORS = [
  { fill: '#ffd56b', stroke: '#caa24a', glow: '#ffe7a4' },
  { fill: '#ffb3c1', stroke: '#d18496', glow: '#ffd6e1' },
  { fill: '#a8dadc', stroke: '#7eb5b7', glow: '#cfeff0' },
  { fill: '#bce0a0', stroke: '#8eaf7a', glow: '#dff2cc' },
  { fill: '#c6b8f0', stroke: '#9a8fc4', glow: '#e1d8f9' },
] as const;

export const SEAL_OPTS = ['now', '1m', '3m', '6m', '1y', 'newyear', 'birthday', 'custom'] as const;
export type SealOpt = (typeof SEAL_OPTS)[number];

export const STICKERS = ['♡', '✿', '★', '☾', '✦', '✧', '❀', '☀'] as const;

export const AVATARS = ['🌸', '🌙', '☁️', '🌿', '✨', '🍀', '🐰', '🦊'] as const;

export const STATUS_FILTERS = ['pending', 'sealed', 'done', 'friend'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];
