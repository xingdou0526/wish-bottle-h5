import { STICKERS } from '@wishbottle/shared';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function StickerPicker({ value, onChange }: Props) {
  return (
    <div className="sticker-picker">
      <div className="seal-picker-label"><span>♡</span><span>贴一张贴纸</span></div>
      <div className="sticker-chips" role="radiogroup">
        <button
          type="button"
          className={`sticker-chip${!value ? ' active' : ''}`}
          onClick={() => onChange('')}
          title="无"
        >
          <span className="sk-empty">无</span>
        </button>
        {STICKERS.map((s) => (
          <button
            key={s}
            type="button"
            className={`sticker-chip${value === s ? ' active' : ''}`}
            onClick={() => onChange(s)}
          >
            <span>{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
