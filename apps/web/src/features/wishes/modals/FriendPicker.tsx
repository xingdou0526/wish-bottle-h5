import type { Friend } from '@wishbottle/shared';

interface Props {
  label: '寄给' | '希望谁实现';
  selfLabel: string;
  selfAvatar: string;
  friends: Friend[];
  value: string; // 'self' | friendId
  onChange: (v: string) => void;
  iconClass: 'recipient' | 'assignee';
}

export function FriendPicker({ label, selfLabel, selfAvatar, friends, value, onChange, iconClass }: Props) {
  const pickerCls = iconClass === 'recipient' ? 'recipient-picker' : 'assignee-picker';
  const labelCls = iconClass === 'recipient' ? 'recipient-picker-label' : 'assignee-picker-label';
  const chipsCls = iconClass === 'recipient' ? 'recipient-chips' : 'assignee-chips';
  const chipCls = iconClass === 'recipient' ? 'recipient-chip' : 'assignee-chip';
  const avatarCls = iconClass === 'recipient' ? 'rc-avatar' : 'ac-avatar';
  const langCls = iconClass === 'recipient' ? 'rpl-zh' : 'apl-zh';

  return (
    <div className={pickerCls}>
      <div className={labelCls}>
        <span>{iconClass === 'recipient' ? '✉' : '✨'}</span>
        <span className={langCls}>{label}</span>
      </div>
      <div className={chipsCls} role="radiogroup">
        <button
          type="button"
          data-id="self"
          className={`${chipCls}${value === 'self' ? ' active' : ''}`}
          onClick={() => onChange('self')}
        >
          <span className={avatarCls}>{selfAvatar}</span>
          {selfLabel}
        </button>
        {friends.map((f) => (
          <button
            type="button"
            key={f.id}
            data-id={f.id}
            className={`${chipCls}${value === f.id ? ' active' : ''}`}
            onClick={() => onChange(f.id)}
          >
            <span className={avatarCls}>{f.avatar}</span>
            {f.nickname}
          </button>
        ))}
      </div>
    </div>
  );
}
