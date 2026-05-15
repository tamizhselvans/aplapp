import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface MomentumGraphProps {
  data: number[];
}

export const MomentumGraph = ({ data }: MomentumGraphProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.strokeStyle = '#00FF00'; // Stadium Green
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FF00';

    const step = width / (data.length - 1);
    data.forEach((val, i) => {
      const x = i * step;
      const y = (height / 2) - (val * (height / 200));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Draw baseline
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [data]);

  return (
    <div className="relative w-full h-32 bg-black/40 rounded-xl border border-white/10 overflow-hidden">
      <div className="absolute top-2 left-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse" />
        <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono">Live Momentum</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={128} 
        className="w-full h-full"
      />
    </div>
  );
};
