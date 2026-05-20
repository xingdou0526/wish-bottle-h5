import { useEffect, useState } from 'react';
import type { Wish } from '@wishbottle/shared';
import { fmtDate, fmtRemain } from '../../utils/formatters';

interface Props {
  wish: Wish | null;
  onClose: () => void;
  onOpened?: (wish: Wish) => void;
}

/** 拆信仪式：到期信封点击撕开封蜡 → 信飞起 → 跳到 DrawnWish 显示。 */
export function EnvelopeOpenModal({ wish, onClose, onOpened }: Props) {
  const [opened, setOpened] = useState(false);
  useEffect(() => { if (!wish) setOpened(false); }, [wish]);

  if (!wish || !wish.sealUntil) return null;

  const unlocked = new Date(wish.sealUntil).getTime() <= Date.now();

  function openIt() {
    if (!unlocked) return;
    setOpened(true);
    window.setTimeout(() => {
      if (wish) onOpened?.(wish);
    }, 700);
  }

  return (
    <div className="envelope-open-modal">
      <div className="envelope-open-mask" onClick={onClose} />
      <div className="envelope-open-stage">
        <div className="big-envelope" onClick={openIt}>
          <div
            className="be-flap"
            style={opened ? { transform: 'rotateX(160deg)', opacity: 0, transition: 'all 0.55s ease' } : undefined}
          />
          <div className="be-body" />
          <div className="be-info">
            <div className="be-label">寄给未来的自己</div>
            <div className="be-date">{fmtDate(wish.sealUntil)}</div>
            <div className="be-cd">{unlocked ? '已到达' : fmtRemain(wish.sealUntil)}</div>
          </div>
          <div
            className="be-wax"
            style={opened ? { transform: 'translate(-50%,-50%) rotate(40deg) scale(0)', opacity: 0, transition: 'all 0.45s ease' } : undefined}
          >
            <span>封</span>
          </div>
        </div>
        <p className="envelope-hint">
          {unlocked ? '点击信封 · 撕开封蜡' : '还没到拆封的时候…'}
        </p>
        <button className="envelope-close" onClick={onClose}>放回去</button>
      </div>
    </div>
  );
}
