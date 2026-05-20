import type { Wish } from '@wishbottle/shared';
import { fmtDate, fmtRemain } from '../../utils/formatters';

interface Props {
  wish: Wish;
  meId: string;
  onOpen: (w: Wish) => void;
  onDelete?: (w: Wish) => void;
}

export function WishEnvelope({ wish, meId, onOpen, onDelete }: Props) {
  if (!wish.sealUntil) return null;
  const fromFriend = wish.ownerId !== meId;
  return (
    <div className="wish-envelope" onClick={() => onOpen(wish)}>
      {fromFriend && wish.ownerNickname && (
        <span className="we-friend-tag">
          <span className="wft-avatar">{wish.ownerAvatar ?? '✿'}</span>
          <span className="wft-role">from</span>
          {wish.ownerNickname}
        </span>
      )}
      <div className="we-wax">封</div>
      <div className="we-stamp">願</div>
      <div className="we-info">
        <div className="we-label">寄到</div>
        <div className="we-date">{fmtDate(wish.sealUntil)}</div>
        <div className="we-cd">{fmtRemain(wish.sealUntil)}</div>
      </div>
      {onDelete && wish.ownerId === meId && (
        <button
          className="we-delete"
          onClick={(e) => { e.stopPropagation(); onDelete(wish); }}
        >
          丢掉
        </button>
      )}
    </div>
  );
}
