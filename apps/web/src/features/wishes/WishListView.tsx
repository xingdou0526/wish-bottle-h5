import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Wish, StatusFilter } from '@wishbottle/shared';
import { wishesApi } from '../../api/wishes';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/Toast';
import { isLocked, isPending } from '../../utils/validators';
import { WishCard } from './WishCard';
import { WishEnvelope } from './WishEnvelope';
import { DoneWishModal } from './DoneWishModal';
import { DrawnWishModal } from './DrawnWishModal';
import { EnvelopeOpenModal } from './EnvelopeOpenModal';

export function WishListView() {
  const me = useAuthStore((s) => s.user);
  const { show } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<StatusFilter>('pending');
  const [doneTarget, setDoneTarget] = useState<Wish | null>(null);
  const [showId, setShowId] = useState<string | null>(null);
  const [envelopeWish, setEnvelopeWish] = useState<Wish | null>(null);

  const mine = useQuery({ queryKey: ['wishes', 'mine'], queryFn: () => wishesApi.list({ scope: 'mine' }) });
  const friend = useQuery({ queryKey: ['wishes', 'friend'], queryFn: () => wishesApi.list({ scope: 'friend' }) });

  const grouped = useMemo(() => {
    const pending = (mine.data ?? []).filter(isPending);
    const sealed = (mine.data ?? []).filter(isLocked);
    const done = (mine.data ?? []).filter((w) => w.completed);
    const friendList = friend.data ?? [];
    return { pending, sealed, done, friend: friendList };
  }, [mine.data, friend.data]);

  const remove = useMutation({
    mutationFn: (id: string) => wishesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishes'] });
      show('丢掉了 · 还有别的小心愿 ♡');
    },
  });

  const list = grouped[tab];

  return (
    <section id="mine-view" className="view active">
      <div className="mine-head">
        <span className="mine-tape" />
        <h2>许过的愿</h2>
        <p className="mine-sub">My Little Wishes · 每一颗都是一个未来</p>
      </div>
      <div className="sub-tabs" role="tablist">
        {(['pending', 'sealed', 'done', 'friend'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            className={`sub-tab${tab === s ? ' active' : ''}`}
            onClick={() => setTab(s)}
            role="tab"
          >
            {labelOf(s)} <span className="count">{grouped[s].length}</span>
          </button>
        ))}
      </div>

      <div className="wish-list">
        {list.length === 0 && (
          <div className="empty">
            <div className="empty-ico">✿</div>
            <p>这里还空空的</p>
            <p className="empty-sub">{tab === 'pending' ? '回到瓶子页 · 把心愿投进去吧' : '回头再来看看'}</p>
          </div>
        )}
        {list.map((w) => {
          if (tab === 'sealed') {
            return (
              <WishEnvelope
                key={w.id}
                wish={w}
                meId={me?.id ?? ''}
                onOpen={(x) => setEnvelopeWish(x)}
                onDelete={(x) => remove.mutate(x.id)}
              />
            );
          }
          return (
            <WishCard
              key={w.id}
              wish={w}
              meId={me?.id ?? ''}
              onClick={(x) => setShowId(x.id)}
              onMarkDone={(x) => setDoneTarget(x)}
              onDelete={(x) => remove.mutate(x.id)}
            />
          );
        })}
      </div>

      <DoneWishModal wish={doneTarget} onClose={() => setDoneTarget(null)} />
      <DrawnWishModal wishId={showId} onClose={() => setShowId(null)} />
      <EnvelopeOpenModal
        wish={envelopeWish}
        onClose={() => setEnvelopeWish(null)}
        onOpened={(w) => {
          setEnvelopeWish(null);
          setShowId(w.id);
        }}
      />
    </section>
  );
}

function labelOf(s: StatusFilter): string {
  return s === 'pending' ? '未实现' : s === 'sealed' ? '未拆封' : s === 'done' ? '已成真' : '好友';
}
