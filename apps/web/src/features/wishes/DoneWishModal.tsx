import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Wish } from '@wishbottle/shared';
import { Sheet } from '../../components/Sheet';
import { wishesApi } from '../../api/wishes';
import { errMsg } from '../../api/client';
import { fmtDate } from '../../utils/formatters';
import { useToast } from '../../components/Toast';

interface Props {
  wish: Wish | null;
  onClose: () => void;
  onCompleted?: () => void;
}

export function DoneWishModal({ wish, onClose, onCompleted }: Props) {
  const qc = useQueryClient();
  const { show } = useToast();
  const [note, setNote] = useState('');

  useEffect(() => {
    if (wish) setNote(wish.note ?? '');
  }, [wish]);

  const m = useMutation({
    mutationFn: ({ withNote }: { withNote: boolean }) => {
      if (!wish) throw new Error('no wish');
      return wishesApi.update(wish.id, {
        completed: true,
        note: withNote ? note.trim() : null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishes'] });
      qc.invalidateQueries({ queryKey: ['wish'] });
      show('愿望成真了 · 留下了印记 ✨');
      onCompleted?.();
      onClose();
    },
    onError: (e) => show(errMsg(e, '保存失败')),
  });

  return (
    <Sheet
      open={!!wish}
      onClose={onClose}
      modalId="done-modal"
      footer={
        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={() => m.mutate({ withNote: false })} disabled={m.isPending}>
            先跳过
          </button>
          <button className="btn btn-primary" onClick={() => m.mutate({ withNote: true })} disabled={m.isPending}>
            {m.isPending ? '稍等…' : '把这一刻收好 ✨'}
          </button>
        </div>
      }
    >
      <div className="letter letter-note-write" role="dialog" aria-modal="true">
        <span className="letter-tape letter-tape-l" />
        <span className="letter-tape letter-tape-r" />
        <div className="letter-sticker letter-sticker-yellow"><span>★</span></div>
        <div className="letter-header">
          <span className="letter-date">{fmtDate(Date.now())}</span>
          <span className="letter-title">愿望成真了 ♡</span>
        </div>
        <div className="note-original">
          <span className="note-original-label">当时的愿望：</span>
          <span className="note-original-text">{wish?.text ?? '—'}</span>
        </div>
        <div className="letter-lined">
          <textarea
            className="letter-input letter-input-sm"
            maxLength={200}
            placeholder="它是怎么实现的呢？留点什么给未来的自己看……"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="char-count"><span>{note.length}</span> / 200</div>
        </div>
        <div className="letter-footer">
          <span className="signature">— this moment ♡</span>
        </div>
      </div>
    </Sheet>
  );
}
