import type { SealOpt } from '@wishbottle/shared';

interface Opts {
  customDays?: number;
  birthday?: string | null; // MM-DD
}

const DAY = 86400_000;

export function computeSealUntil(opt: SealOpt, opts: Opts = {}): Date | null {
  const now = new Date();
  switch (opt) {
    case 'now':
      return null;
    case '1m':
      return new Date(now.getTime() + 30 * DAY);
    case '3m':
      return new Date(now.getTime() + 90 * DAY);
    case '6m':
      return new Date(now.getTime() + 180 * DAY);
    case '1y':
      return new Date(now.getTime() + 365 * DAY);
    case 'newyear': {
      const nextYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      return nextYear;
    }
    case 'birthday': {
      if (!opts.birthday) return null;
      const m = /^(\d{2})-(\d{2})$/.exec(opts.birthday);
      if (!m) return null;
      const mm = Number(m[1]) - 1;
      const dd = Number(m[2]);
      let target = new Date(now.getFullYear(), mm, dd, 0, 0, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target = new Date(now.getFullYear() + 1, mm, dd, 0, 0, 0, 0);
      }
      return target;
    }
    case 'custom': {
      const d = Math.max(1, Math.min(3650, opts.customDays ?? 1));
      return new Date(now.getTime() + d * DAY);
    }
  }
}

export function describeSeal(opt: SealOpt, opts: Opts = {}): string {
  const until = computeSealUntil(opt, opts);
  if (!until) return '立即可见';
  const y = until.getFullYear();
  const m = String(until.getMonth() + 1).padStart(2, '0');
  const d = String(until.getDate()).padStart(2, '0');
  return `将于 ${y}.${m}.${d} 打开`;
}
