import type { Wish } from '@wishbottle/shared';
import { fmtDate } from '../../utils/formatters';

interface Props {
  wish: Wish;
  meId: string;
  onMarkDone?: (w: Wish) => void;
  onDelete?: (w: Wish) => void;
  onClick?: (w: Wish) => void;
}

export function WishCard({ wish, meId, onMarkDone, onDelete, onClick }: Props) {
  const fromFriend = wish.ownerId !== meId;
  const showRecipient = wish.recipientId && wish.recipientId !== wish.ownerId;
  const showAssignee = wish.assigneeId && wish.assigneeId !== wish.ownerId;

  return (
    <div
      className={`wish-card${wish.completed ? ' done' : ''}`}
      onClick={onClick ? () => onClick(wish) : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {wish.sticker && <div className="wish-sticker">{wish.sticker}</div>}
      <div className="wc-date">{fmtDate(wish.createdAt)}</div>
      <div className="wc-text">{wish.text ?? '（封存中）'}</div>

      {(fromFriend || showRecipient || showAssignee) && (
        <div className="wc-friend-row">
          {fromFriend && wish.ownerNickname && (
            <span className="wc-friend-tag from">
              <span className="wft-avatar">{wish.ownerAvatar ?? '✿'}</span>
              <span className="wft-role">from</span>
              {wish.ownerNickname}
            </span>
          )}
          {showRecipient && wish.recipientNickname && (
            <span className="wc-friend-tag">
              <span className="wft-avatar">{wish.recipientAvatar ?? '✿'}</span>
              <span className="wft-role">to</span>
              {wish.recipientNickname}
            </span>
          )}
          {showAssignee && wish.assigneeNickname && (
            <span className="wc-friend-tag assignee">
              <span className="wft-avatar">{wish.assigneeAvatar ?? '✿'}</span>
              <span className="wft-role">by</span>
              {wish.assigneeNickname}
            </span>
          )}
        </div>
      )}

      {wish.completed && wish.note && (
        <div className="wc-note">
          <span className="wc-note-label">how it came true</span>
          {wish.note}
        </div>
      )}

      <div className="wc-foot">
        <span>{wish.completed && wish.completedAt ? `成真于 ${fmtDate(wish.completedAt)}` : ''}</span>
        <div className="wc-actions" onClick={(e) => e.stopPropagation()}>
          {!wish.completed && onMarkDone && (
            <button className="wc-btn" onClick={() => onMarkDone(wish)}>已成真</button>
          )}
          {onDelete && wish.ownerId === meId && (
            <button className="wc-btn danger" onClick={() => onDelete(wish)}>丢掉</button>
          )}
        </div>
      </div>
    </div>
  );
}
