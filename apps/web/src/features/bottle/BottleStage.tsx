import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BottleSVG } from './BottleSVG';
import { usePhysicsStars } from './usePhysicsStars';
import { wishesApi } from '../../api/wishes';
import { fmtDate } from '../../utils/formatters';
import { DrawnWishModal } from '../wishes/DrawnWishModal';
import { WriteWishModal } from '../wishes/WriteWishModal';

export function BottleStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: wishes = [] } = useQuery({
    queryKey: ['wishes', 'mine'],
    queryFn: () => wishesApi.list({ scope: 'mine' }),
  });

  const [shaking, setShaking] = useState(false);
  const [drawnId, setDrawnId] = useState<string | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);

  const { shake, pickRandomWishId } = usePhysicsStars({ canvasRef, stageRef, wishes });

  function onShake() {
    if (shaking) return;
    setShaking(true);
    shake();
    window.setTimeout(() => {
      setShaking(false);
      const id = pickRandomWishId();
      if (id) setDrawnId(id);
    }, 700);
  }

  return (
    <section id="bottle-view" className="view active">
      <div className="stage-wrap">
        <div className="page-title">
          <span className="pt-tape" />
          <span className="pt-main">My Wishes ✦</span>
          <span className="pt-date">{fmtDate(Date.now())}</span>
        </div>

        <div className={`stage${shaking ? ' shaking' : ''}`} id="stage" ref={stageRef}>
          <BottleSVG />
          <canvas className="stars-canvas" ref={canvasRef} width={800} height={760} />
          <div className="bottle-glow" aria-hidden="true" />
        </div>

        <p className="hint">用手指划过瓶子 · 星星会跟着晃 ✿</p>

        <div className="actions">
          <button className="btn btn-ghost" onClick={onShake}>
            <span className="btn-ico">✿</span>
            <span>摇一摇</span>
          </button>
          <button className="btn btn-primary" onClick={() => setWriteOpen(true)}>
            <span className="btn-ico">✎</span>
            <span>许个愿</span>
          </button>
        </div>
      </div>

      <WriteWishModal open={writeOpen} onClose={() => setWriteOpen(false)} />
      <DrawnWishModal wishId={drawnId} onClose={() => setDrawnId(null)} />
    </section>
  );
}
