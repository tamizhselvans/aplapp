import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock } from 'lucide-react';

interface Prediction {
  id: string;
  q: string;
  options: string[];
  expiresAt: number;
}

interface PredictionCardProps {
  prediction: Prediction | null;
  onAnswer: (predictionId: string, answer: string) => void;
}

export const PredictionCard = ({ prediction, onAnswer }: PredictionCardProps) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!prediction) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((prediction.expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [prediction]);

  if (!prediction || timeLeft === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-50"
      >
        <div className="bg-[#151619] border-2 border-[#00FF00] rounded-2xl p-6 shadow-[0_0_30px_rgba(0,255,0,0.2)]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#00FF00]" />
              <span className="text-xs font-bold text-[#00FF00] uppercase tracking-tighter">Pulse Check</span>
            </div>
            <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3 text-white/60" />
              <span className="text-[10px] font-mono text-white/80">{timeLeft}s</span>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-6 leading-tight">
            {prediction.q}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {prediction.options.map((opt) => (
              <button
                key={opt}
                onClick={() => onAnswer(prediction.id, opt)}
                className="py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-[#00FF00] hover:text-black transition-all active:scale-95"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
