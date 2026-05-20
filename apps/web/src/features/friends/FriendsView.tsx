import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '../../api/friends';
import { errMsg } from '../../api/client';
import { useToast } from '../../components/Toast';
import { UserStrip } from './UserStrip';
import { FriendRow, InviteRow } from './FriendRow';
import { AddFriendModal } from './AddFriendModal';

export function FriendsView() {
  const qc = useQueryClient();
  const { show } = useToast();
  const [addOpen, setAddOpen] = useState(false);

  const friends = useQuery({ queryKey: ['friends'], queryFn: friendsApi.list });
  const incoming = useQuery({
    queryKey: ['invites', 'incoming'],
    queryFn: () => friendsApi.listInvites('incoming'),
  });
  const outgoing = useQuery({
    queryKey: ['invites', 'outgoing'],
    queryFn: () => friendsApi.listInvites('outgoing'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => friendsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      show('已分开 · 但愿仍然安好');
    },
    onError: (e) => show(errMsg(e, '操作失败')),
  });
  const accept = useMutation({
    mutationFn: (id: string) => friendsApi.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['invites'] });
      show('成为好友啦 ♡');
    },
  });
  const decline = useMutation({
    mutationFn: (id: string) => friendsApi.decline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invites'] }),
  });

  const list = friends.data ?? [];
  const inList = (incoming.data ?? []).filter((i) => i.status === 'pending');
  const outList = (outgoing.data ?? []).filter((i) => i.status === 'pending');

  return (
    <section id="friends-view" className="view active">
      <UserStrip />
      <div className="mine-head">
        <span className="mine-tape friends-tape" />
        <h2>我的好友</h2>
        <p className="mine-sub">friends · 一起许愿吧 ♡</p>
      </div>

      <div className="friends-add-card" onClick={() => setAddOpen(true)}>
        <span className="fac-tape" />
        <div className="fac-ico">✉</div>
        <div className="fac-text">
          <div className="fac-title">添加好友</div>
          <div className="fac-sub">输入对方邮箱 · 寄出邀请</div>
        </div>
        <div className="fac-arrow">›</div>
      </div>

      {inList.length > 0 && (
        <div className="friends-block">
          <div className="friends-block-title">
            <span>♡</span><span>新邀请</span>
            <span className="fbt-count">{inList.length}</span>
          </div>
          <div className="friends-list">
            {inList.map((i) => (
              <InviteRow
                key={i.id}
                invite={i}
                direction="incoming"
                onAccept={(x) => accept.mutate(x.id)}
                onDecline={(x) => decline.mutate(x.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="friends-block">
        <div className="friends-block-title">
          <span>✿</span><span>朋友们</span>
          <span className="fbt-count">{list.length}</span>
        </div>
        {list.length === 0 ? (
          <div className="friends-empty">
            <div className="friends-empty-ico">✿</div>
            <p>还没有朋友哦</p>
            <p className="empty-sub">从上面的卡片寄一张邀请吧</p>
          </div>
        ) : (
          <div className="friends-list">
            {list.map((f) => (
              <FriendRow key={f.id} friend={f} onRemove={(x) => remove.mutate(x.id)} />
            ))}
          </div>
        )}
      </div>

      {outList.length > 0 && (
        <div className="friends-block">
          <div className="friends-block-title">
            <span>✉</span><span>寄出去的邀请</span>
            <span className="fbt-count">{outList.length}</span>
          </div>
          <div className="friends-list">
            {outList.map((i) => (
              <InviteRow key={i.id} invite={i} direction="outgoing" />
            ))}
          </div>
        </div>
      )}

      <AddFriendModal open={addOpen} onClose={() => setAddOpen(false)} />
    </section>
  );
}
