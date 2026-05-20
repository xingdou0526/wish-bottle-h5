import { useEffect, useState } from 'react';

export function StatusBar() {
  const [time, setTime] = useState(formatTime(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setTime(formatTime(new Date())), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="status-bar" aria-hidden="true">
      <span className="sb-time">{time}</span>
      <span className="sb-notch" />
      <span className="sb-right">
        <svg viewBox="0 0 18 12" width="17" height="11">
          <g fill="currentColor">
            <rect x="0" y="8" width="3" height="4" rx="0.6" />
            <rect x="5" y="6" width="3" height="6" rx="0.6" />
            <rect x="10" y="3" width="3" height="9" rx="0.6" />
            <rect x="15" y="0" width="3" height="12" rx="0.6" />
          </g>
        </svg>
        <svg viewBox="0 0 16 12" width="15" height="11">
          <path
            d="M8 11 Q4 7 1.5 5 A9 9 0 0 1 14.5 5 Q12 7 8 11 Z M8 3.5 A2.4 2.4 0 0 1 10.4 5.9 Q9.2 7 8 8.2 Q6.8 7 5.6 5.9 A2.4 2.4 0 0 1 8 3.5 Z"
            fill="currentColor"
          />
        </svg>
        <span className="sb-batt">
          <span className="sb-batt-fill" />
        </span>
      </span>
    </div>
  );
}

function formatTime(d: Date) {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
