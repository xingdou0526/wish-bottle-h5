export function fmtDate(ts: number | string | Date): string {
  const d = typeof ts === 'object' ? ts : new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function fmtRemain(future: number | string | Date): string {
  const t = typeof future === 'object' ? future.getTime() : new Date(future).getTime();
  const diff = t - Date.now();
  if (diff <= 0) return '已到达';
  const day = 86400_000;
  const days = Math.floor(diff / day);
  if (days >= 365) return `还剩 ${Math.floor(days / 365)} 年`;
  if (days >= 30) return `还剩 ${Math.floor(days / 30)} 个月`;
  if (days >= 1) return `还剩 ${days} 天`;
  const hours = Math.floor(diff / 3600_000);
  if (hours >= 1) return `还剩 ${hours} 小时`;
  const mins = Math.max(1, Math.floor(diff / 60_000));
  return `还剩 ${mins} 分钟`;
}

export function fmtRelative(ts: number | string | Date): string {
  const t = typeof ts === 'object' ? ts.getTime() : new Date(ts).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return fmtDate(t);
}
