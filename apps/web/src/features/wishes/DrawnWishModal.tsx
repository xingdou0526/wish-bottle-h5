import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet } from '../../components/Sheet';
import { wishesApi } from '../../api/wishes';
import { fmtDate } from '../../utils/formatters';
import { DoneWishModal } from './DoneWishModal';

interface Props {
  wishId: string | null;
  onClose: () => void;
}

export function DrawnWishModal({ wishId, onClose }: Props) {
  const [doneOpen, setDoneOpen] = useState(false);
  const { data: wish } = useQuery({
    queryKey: ['wish', wishId],
    queryFn: () => wishesApi.get(wishId!),
    enabled: !!wishId,
  });

  const open = !!wishId;

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        modalId="show-modal"
        footer={
          <div className="sheet-actions">
            <button className="btn btn-ghost" onClick={onClose}>放回瓶中</button>
            {wish && !wish.completed && (
              <button className="btn btn-primary" onClick={() => setDoneOpen(true)}>已成真 ✓</button>
            )}
          </div>
        }
      >
        <div className="letter letter-show" role="dialog" aria-modal="true">
          <span className="letter-tape letter-tape-l" />
          <span className="letter-tape letter-tape-r" />
          <div className="letter-sticker letter-sticker-mint"><span>✿</span></div>
          <div className="letter-header">
            <span className="letter-date">{wish ? fmtDate(wish.createdAt) : '—'}</span>
            <span className="letter-title">来自瓶中的回信</span>
          </div>
          <div className="letter-lined">
            {wish && (wish.recipientId || wish.assigneeId) && (
              <div className="show-friend-row">
                {wish.recipientNickname && wish.recipientId !== wish.ownerId && (
                  <span className="show-friend-pill">
                    <span className="sfp-avatar">{wish.recipientAvatar ?? '✿'}</span>
                    <span className="sfp-role">to</span>
                    {wish.recipientNickname}
                  </span>
                )}
                {wish.assigneeNickname && wish.assigneeId !== wish.ownerId && (
                  <span className="show-friend-pill">
                    <span className="sfp-avatar">{wish.assigneeAvatar ?? '✿'}</span>
                    <span className="sfp-role">by</span>
                    {wish.assigneeNickname}
                  </span>
                )}
              </div>
            )}
            <div className="letter-show-text">{wish?.text ?? '…'}</div>
            {wish?.completed && wish.note && (
              <div className="letter-note-section">
                <div className="note-divider"><span>♡ 实现的故事 ♡</span></div>
                <div className="letter-note">{wish.note}</div>
                {wish.completedAt && (
                  <div className="letter-note-date">{fmtDate(wish.completedAt)}</div>
                )}
              </div>
            )}
          </div>
          <div className="letter-footer">
            <span className="signature">
              {wish?.completed ? '— 已成真 ♡' : '— 还在等待中'}
            </span>
          </div>
        </div>
      </Sheet>

      <DoneWishModal
        wish={doneOpen ? wish ?? null : null}
        onClose={() => setDoneOpen(false)}
        onCompleted={() => {
          setDoneOpen(false);
          onClose();
        }}
      />
    </>
  );
}
