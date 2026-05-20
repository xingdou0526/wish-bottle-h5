import type { Wish } from '@wishbottle/shared';

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function isLocked(w: Wish): boolean {
  if (!w.sealUntil) return false;
  return new Date(w.sealUntil).getTime() > Date.now();
}

export function isPending(w: Wish): boolean {
  return !w.completed && !isLocked(w);
}
