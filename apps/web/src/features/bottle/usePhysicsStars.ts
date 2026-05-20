import { useEffect, useRef } from 'react';
import { WishPhysics } from './physics';
import type { Wish } from '@wishbottle/shared';
import { isLocked } from '../../utils/validators';

interface Params {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stageRef: React.RefObject<HTMLDivElement>;
  wishes: Wish[];
}

export function usePhysicsStars({ canvasRef, stageRef, wishes }: Params) {
  const physicsRef = useRef<WishPhysics | null>(null);

  // 创建/销毁引擎
  useEffect(() => {
    if (!canvasRef.current) return;
    const p = new WishPhysics();
    p.attachCanvas(canvasRef.current);
    p.start();
    physicsRef.current = p;
    return () => {
      p.destroy();
      physicsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 同步 wishes → stars（按 wishId 增量）
  useEffect(() => {
    const p = physicsRef.current;
    if (!p) return;
    const pendingWishes = wishes.filter((w) => !w.completed);
    const wantIds = new Set(pendingWishes.map((w) => w.id));
    // 移除已不存在或已完成的
    for (const s of [...p.stars]) {
      if (!s.wishId || !wantIds.has(s.wishId)) {
        if (s.wishId) p.removeStarByWishId(s.wishId);
      }
    }
    // 添加新出现的
    const haveIds = new Set(p.stars.map((s) => s.wishId).filter(Boolean));
    pendingWishes.forEach((w, i) => {
      if (haveIds.has(w.id)) {
        // 更新 sealed 状态
        const s = p.stars.find((x) => x.wishId === w.id);
        if (s) s.sealed = isLocked(w);
        return;
      }
      setTimeout(() => {
        physicsRef.current?.addStar({
          colorIdx: w.color,
          sealed: isLocked(w),
          wishId: w.id,
        });
      }, i * 90);
    });
  }, [wishes]);

  // 鼠标互动
  useEffect(() => {
    const stage = stageRef.current;
    const p = physicsRef.current;
    if (!stage) return;
    const onMove = (e: PointerEvent) => {
      if (!physicsRef.current) return;
      const pt = physicsRef.current.clientToWorld(e.clientX, e.clientY, stage);
      physicsRef.current.setMousePoint(pt);
    };
    const onLeave = () => physicsRef.current?.setMousePoint(null);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, [stageRef]);

  return {
    shake: () => physicsRef.current?.shake(),
    pickRandomWishId: (): string | null => {
      const ids = (physicsRef.current?.stars ?? [])
        .filter((s) => !s.sealed)
        .map((s) => s.wishId)
        .filter((x): x is string => !!x);
      if (!ids.length) return null;
      return ids[Math.floor(Math.random() * ids.length)];
    },
  };
}
