import type { Friend, Invite } from '@wishbottle/shared';
import { fmtRelative } from '../../utils/formatters';

interface FriendRowProps {
  friend: Friend;
  onRemove?: (f: Friend) => void;
}

export function FriendRow({ friend, onRemove }: FriendRowProps) {
  return (
    <div className="friend-row">
      <div className="fr-avatar">{friend.avatar}</div>
      <div className="fr-info">
        <div className="fr-name">{friend.nickname}</div>
        <div className="fr-meta">{friend.email}</div>
        {friend.signature && <div className="fr-sig">{friend.signature}</div>}
      </div>
      {onRemove && (
        <div className="fr-actions">
          <button className="fr-btn ghost" onClick={() => onRemove(friend)}>移除</button>
        </div>
      )}
    </div>
  );
}

interface InviteRowProps {
  invite: Invite;
  direction: 'incoming' | 'outgoing';
  onAccept?: (i: Invite) => void;
  onDecline?: (i: Invite) => void;
}

export function InviteRow({ invite, direction, onAccept, onDecline }: InviteRowProps) {
  return (
    <div className={`friend-row${direction === 'incoming' ? ' invite' : ' pending'}`}>
      <div className={`fr-avatar${direction === 'outgoing' ? ' pending-avatar' : ''}`}>
        {direction === 'incoming' ? invite.fromAvatar : '?'}
      </div>
      <div className="fr-info">
        <div className="fr-name">{direction === 'incoming' ? invite.fromNickname : invite.toEmail}</div>
        <div className="fr-meta">
          {direction === 'incoming' ? '想成为好友 ♡' : `等待 · ${fmtRelative(invite.createdAt)}`}
        </div>
      </div>
      {direction === 'incoming' ? (
        <div className="fr-actions">
          <button className="fr-btn accept" onClick={() => onAccept?.(invite)}>接受</button>
          <button className="fr-btn ghost" onClick={() => onDecline?.(invite)}>谢绝</button>
        </div>
      ) : (
        <div className="fr-actions"><div className="fr-status">待对方注册</div></div>
      )}
    </div>
  );
}
