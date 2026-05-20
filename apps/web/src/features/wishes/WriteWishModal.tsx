import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SealOpt } from '@wishbottle/shared';
import { Sheet } from '../../components/Sheet';
import { useAuthStore } from '../../stores/authStore';
import { wishesApi } from '../../api/wishes';
import { friendsApi } from '../../api/friends';
import { errMsg } from '../../api/client';
import { fmtDate } from '../../utils/formatters';
import { useToast } from '../../components/Toast';
import { SealPicker } from './modals/SealPicker';
import { StickerPicker } from './modals/StickerPicker';
import { FriendPicker } from './modals/FriendPicker';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WriteWishModal({ open, onClose }: Props) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { show } = useToast();

  const [text, setText] = useState('');
  const [sticker, setSticker] = useState('');
  const [sealOpt, setSealOpt] = useState<SealOpt>('now');
  const [sealUntil, setSealUntil] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('self');
  const [assignee, setAssignee] = useState('self');

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.list,
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () => {
      const color = Math.floor(Math.random() * 5);
      return wishesApi.create({
        text: text.trim(),
        color,
        sticker: sticker || null,
        sealOpt,
        sealUntil,
        recipientId: recipient === 'self' ? null : recipient,
        assigneeId: assignee === 'self' ? null : assignee,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishes'] });
      show('愿望已投进瓶子 ✿');
      reset();
      onClose();
    },
    onError: (e) => show(errMsg(e, '写愿望失败了…')),
  });

  function reset() {
    setText(''); setSticker(''); setSealOpt('now'); setSealUntil(null);
    setRecipient('self'); setAssignee('self');
  }

  const onSealChange = useCallback((opt: SealOpt, until: string | null) => {
    setSealOpt(opt); setSealUntil(until);
  }, []);

  function submit() {
    if (!text.trim()) { show('写点什么吧 ♡'); return; }
    create.mutate();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      modalId="wish-modal"
      footer={
        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={onClose}>放下</button>
          <button className="btn btn-primary" onClick={submit} disabled={create.isPending}>
            {create.isPending ? '稍等…' : '投进瓶子 ✿'}
          </button>
        </div>
      }
    >
      <div className="letter letter-write" role="dialog" aria-modal="true">
        <span className="letter-tape letter-tape-l" />
        <span className="letter-tape letter-tape-r" />
        <div className="letter-sticker letter-sticker-pink"><span>♡</span></div>
        <div className="letter-header">
          <span className="letter-date">{fmtDate(Date.now())}</span>
          <span className="letter-title">Dear me ✦</span>
        </div>
        <div className="letter-lined">
          <textarea
            className="letter-input"
            maxLength={140}
            placeholder="今天想许什么愿……"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="char-count"><span>{text.length}</span> / 140</div>
        </div>

        <SealPicker birthday={me?.birthday ?? ''} onChange={onSealChange} />
        <StickerPicker value={sticker} onChange={setSticker} />

        <FriendPicker
          iconClass="recipient"
          label="寄给"
          selfLabel={me?.nickname ?? '自己'}
          selfAvatar={me?.avatar ?? '✿'}
          friends={friends}
          value={recipient}
          onChange={setRecipient}
        />
        <FriendPicker
          iconClass="assignee"
          label="希望谁实现"
          selfLabel={me?.nickname ?? '自己'}
          selfAvatar={me?.avatar ?? '✿'}
          friends={friends}
          value={assignee}
          onChange={setAssignee}
        />

        <div className="letter-footer">
          <span className="signature">— love, me ♡</span>
        </div>
      </div>
    </Sheet>
  );
}
