import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Friend, Invite } from '@wishbottle/shared';
import { Sheet } from '../../components/Sheet';
import { friendsApi } from '../../api/friends';
import { errMsg } from '../../api/client';
import { useToast } from '../../components/Toast';
import { isEmail } from '../../utils/validators';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddFriendModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [result, setResult] = useState<{ kind: 'friend' | 'invite'; data: Friend | Invite } | null>(null);

  const m = useMutation({
    mutationFn: (toEmail: string) => friendsApi.invite({ toEmail }),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['invites'] });
      show(res.kind === 'friend' ? '加为好友啦 ♡' : '邀请已寄出 ✉');
    },
    onError: (e) => setErr(errMsg(e, '邀请失败')),
  });

  function submit() {
    setErr(''); setResult(null);
    if (!isEmail(email)) { setErr('邮箱格式不对呀~'); return; }
    m.mutate(email);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      modalId="friend-modal"
      footer={
        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={() => { setEmail(''); setErr(''); setResult(null); onClose(); }}>放下</button>
          <button className="btn btn-primary" onClick={submit} disabled={m.isPending}>
            {m.isPending ? '稍等…' : '邀请他 / 她 ✉'}
          </button>
        </div>
      }
    >
      <div className="letter add-friend-letter" role="dialog" aria-modal="true">
        <span className="letter-tape letter-tape-l" />
        <span className="letter-tape letter-tape-r" />
        <div className="letter-sticker letter-sticker-mint"><span>✉</span></div>
        <div className="letter-header">
          <span className="letter-date">邀请</span>
          <span className="letter-title">加一个朋友 ♦</span>
        </div>
        <div className={`auth-field${err ? ' invalid' : ''}`} style={{ marginBottom: 4 }}>
          <label>朋友的邮箱</label>
          <input
            type="email"
            autoComplete="off"
            placeholder="他/她的邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="auth-field-error">{err}</div>
        </div>
        {result && (
          <div className="add-friend-result show">
            <div className="afr-avatar">
              {result.kind === 'friend' ? (result.data as Friend).avatar : '✉'}
            </div>
            <div className="afr-info">
              <div className="afr-name">
                {result.kind === 'friend'
                  ? `${(result.data as Friend).nickname} 已经是好友啦`
                  : '已寄出邀请'}
              </div>
              <div className="afr-mail">
                {result.kind === 'friend'
                  ? (result.data as Friend).email
                  : (result.data as Invite).toEmail}
              </div>
            </div>
          </div>
        )}
        <div className="letter-footer" style={{ marginTop: 10 }}>
          <span className="signature">— with love ♡</span>
        </div>
      </div>
    </Sheet>
  );
}
