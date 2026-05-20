import { useEffect, useState } from 'react';
import { SEAL_OPTS, type SealOpt } from '@wishbottle/shared';
import { computeSealUntil, describeSeal } from '../../../utils/sealTime';

const LABELS: Record<SealOpt, string> = {
  now: '现在',
  '1m': '一个月后',
  '3m': '三个月后',
  '6m': '半年后',
  '1y': '一年后',
  newyear: '下一个新年',
  birthday: '下一个生日',
  custom: '自定义',
};

interface Props {
  birthday: string | null | undefined;
  onChange: (sealOpt: SealOpt, sealUntilISO: string | null) => void;
}

export function SealPicker({ birthday: defaultBirthday, onChange }: Props) {
  const [opt, setOpt] = useState<SealOpt>('now');
  const [customDays, setCustomDays] = useState<number>(7);
  const [birthday, setBirthday] = useState<string>(defaultBirthday ?? '');

  useEffect(() => {
    const until = computeSealUntil(opt, { customDays, birthday });
    onChange(opt, until ? until.toISOString() : null);
  }, [opt, customDays, birthday, onChange]);

  return (
    <div className="seal-picker">
      <div className="seal-picker-label"><span>✉</span><span>寄到何时</span></div>
      <div className="seal-chips" role="radiogroup">
        {SEAL_OPTS.map((s) => (
          <button
            type="button"
            key={s}
            className={`seal-chip${opt === s ? ' active' : ''}`}
            onClick={() => setOpt(s)}
          >
            {LABELS[s]}
          </button>
        ))}
      </div>
      {(opt === 'custom' || opt === 'birthday') && (
        <div className="seal-extras">
          {opt === 'custom' && (
            <div className="seal-extra-row">
              <label>多少天后开启？</label>
              <input
                type="number"
                min={1}
                max={3650}
                placeholder="天数"
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, Math.min(3650, Number(e.target.value) || 1)))}
              />
            </div>
          )}
          {opt === 'birthday' && (
            <div className="seal-extra-row">
              <label>生日 (MM-DD)</label>
              <input
                type="text"
                placeholder="例如 06-15"
                maxLength={5}
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
      <div className="seal-hint">{describeSeal(opt, { customDays, birthday })}</div>
    </div>
  );
}
