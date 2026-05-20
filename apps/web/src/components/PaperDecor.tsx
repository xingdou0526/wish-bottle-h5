export function PaperDecor() {
  return (
    <>
      <div className="paper-grid" aria-hidden="true" />
      <div className="paper-decor" aria-hidden="true">
        <span className="tape tape-1" />
        <span className="tape tape-2" />
        <span className="tape tape-3" />
        <svg className="doodle doodle-cloud" viewBox="0 0 60 30">
          <path
            d="M10 22 Q4 22 4 16 Q4 10 12 11 Q14 4 22 5 Q30 3 33 10 Q42 8 44 16 Q50 16 50 22 Z"
            fill="none"
            stroke="#f5c8d3"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <svg className="doodle doodle-heart" viewBox="0 0 30 28">
          <path
            d="M15 24 C 5 18, 2 12, 6 7 C 10 3, 14 6, 15 10 C 16 6, 20 3, 24 7 C 28 12, 25 18, 15 24 Z"
            fill="#ffd3dd"
            stroke="#e89aac"
            strokeWidth="1.2"
          />
        </svg>
        <svg className="doodle doodle-flower" viewBox="0 0 40 40">
          <g fill="#ffe9a8" stroke="#e0bf5c" strokeWidth="1.2">
            <ellipse cx="20" cy="9" rx="5" ry="7" />
            <ellipse cx="31" cy="20" rx="7" ry="5" />
            <ellipse cx="20" cy="31" rx="5" ry="7" />
            <ellipse cx="9" cy="20" rx="7" ry="5" />
          </g>
          <circle cx="20" cy="20" r="4.5" fill="#ff9eb1" />
        </svg>
        <svg className="doodle doodle-star" viewBox="0 0 24 24">
          <polygon points="12,2 14.5,9 22,9 16,13.5 18.5,21 12,16.5 5.5,21 8,13.5 2,9 9.5,9" fill="#bfe6c8" stroke="#7fb892" strokeWidth="1" />
        </svg>
        <svg className="doodle doodle-sparkle" viewBox="0 0 20 20">
          <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z" fill="#c8e4ec" stroke="#7fa9b8" strokeWidth="0.8" />
        </svg>
        <svg className="doodle doodle-arrow" viewBox="0 0 60 40">
          <path d="M5 32 Q 20 8 38 16 Q 50 22 54 14" fill="none" stroke="#b8a8d8" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 3" />
          <path d="M48 8 L 56 14 L 52 22" fill="none" stroke="#b8a8d8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="dot dot-1" />
        <span className="dot dot-2" />
        <span className="dot dot-3" />
        <span className="dot dot-4" />
        <span className="dot dot-5" />
      </div>
    </>
  );
}
