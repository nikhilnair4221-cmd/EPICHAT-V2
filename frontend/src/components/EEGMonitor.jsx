import React, { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_CHANNELS = Array.from({ length: 18 }, (_, i) => `Ch ${String(i + 1).padStart(2, '0')}`);

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export default function EEGMonitor({
  riskSeries = [],
  seizureChannels = [],
  isLive = false,
  height = 340,
  channels = DEFAULT_CHANNELS,
}) {
  const canvasRef = useRef(null);
  const [t, setT] = useState(0);

  const colors = useMemo(() => {
    const palette = ['#00F5FF', '#22c55e', '#a855f7', '#f97316', '#eab308', '#38bdf8', '#fb7185', '#34d399'];
    return channels.map((_, i) => palette[i % palette.length]);
  }, [channels]);

  useEffect(() => {
    if (!isLive) return;
    let raf = 0;
    const tick = () => {
      setT((v) => v + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isLive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const nCh = channels.length;
    const padX = 18;
    const padY = 12;
    const gridColor = 'rgba(0,255,255,0.08)';
    const textColor = 'rgba(200,255,255,0.7)';
    const bg = 'rgba(3,7,18,0.85)';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = padX; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = padY; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const rowH = (h - padY * 2) / nCh;
    const centerY = (i) => padY + rowH * i + rowH / 2;

    const N = 420; // points per channel
    const x0 = padX + 70;
    const x1 = w - 12;
    const span = x1 - x0;

    const rand = mulberry32(1337 + (isLive ? t : 0));

    const latestRisk = riskSeries.length ? riskSeries[Math.min(riskSeries.length - 1, Math.floor((t / 3) % riskSeries.length))] : 0;
    const riskAmp = 0.35 + Math.min(1, latestRisk / 100) * 0.9;
    const phaseShift = (isLive ? t * 0.03 : 0);

    // Labels
    ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI';
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';
    for (let i = 0; i < nCh; i += 1) {
      ctx.fillText(channels[i], 10, centerY(i));
    }

    // Traces
    for (let ch = 0; ch < nCh; ch += 1) {
      const yMid = centerY(ch);
      const baseAmp = (rowH * 0.36) * riskAmp;

      const isHot = seizureChannels.includes(ch);
      const stroke = isHot ? '#ff2a2a' : colors[ch];

      ctx.save();
      ctx.lineWidth = isHot ? 2.2 : 1.4;
      ctx.strokeStyle = stroke;
      if (isHot) {
        ctx.shadowColor = 'rgba(255,42,42,0.9)';
        ctx.shadowBlur = 14;
      } else {
        ctx.shadowColor = 'rgba(0,245,255,0.55)';
        ctx.shadowBlur = 6;
      }

      ctx.beginPath();
      for (let i = 0; i < N; i += 1) {
        const x = x0 + (i / (N - 1)) * span;
        const tt = (i / N) * 8 + phaseShift + ch * 0.15;
        const noise = (rand() - 0.5) * 0.55;
        const spike = isHot ? Math.sin(tt * 6.2) * 0.7 : 0;
        const y = yMid + (Math.sin(tt * 1.7) + 0.6 * Math.sin(tt * 3.1) + noise + spike) * baseAmp * (isHot ? 1.25 : 1);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Playhead
    const playX = x0 + ((isLive ? (t % 120) / 120 : 0.6) * span);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, h);
    ctx.stroke();
  }, [channels, colors, height, isLive, riskSeries, seizureChannels, t]);

  return (
    <div className="glass-panel" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div className="neon-text" style={{ fontWeight: 700 }}>〰️ Live EEG Monitor</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {isLive ? 'Streaming preview' : 'Snapshot preview'}
        </div>
      </div>
      <div style={{ marginTop: 10, width: '100%' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height }} />
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 14, flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 18, height: 3, background: '#22c55e', borderRadius: 2, display: 'inline-block' }} />
          <span>Normal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 18, height: 3, background: '#eab308', borderRadius: 2, display: 'inline-block' }} />
          <span>Irregular</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 18, height: 3, background: '#ff2a2a', borderRadius: 2, display: 'inline-block', boxShadow: '0 0 6px rgba(255,42,42,0.6)' }} />
          <span>High Risk (seizure zone)</span>
        </div>
        <span style={{ opacity: 0.5 }}>|</span>
        <div><span style={{ color: '#00F5FF', fontWeight: 700 }}>Cyan grid</span> = time scale</div>
      </div>
    </div>
  );
}

