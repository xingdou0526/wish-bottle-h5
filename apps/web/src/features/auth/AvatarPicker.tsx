import { AVATARS } from '@wishbottle/shared';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function AvatarPicker({ value, onChange }: Props) {
  return (
    <div className="auth-field avatar-picker">
      <div className="ap-label">挑一个贴纸代表你</div>
      <div className="avatar-grid">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            className={`avatar-chip${value === a ? ' active' : ''}`}
            onClick={() => onChange(a)}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
