import { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Heart } from 'lucide-react';

interface StadiumHeartbeatProps {
  intensity: 'low' | 'medium' | 'high';
  lastHeartbeat: number;
}

export const StadiumHeartbeat = ({ intensity, lastHeartbeat }: StadiumHeartbeatProps) => {
  const controls = useAnimation();

  useEffect(() => {
    if (lastHeartbeat === 0) return;

    // Trigger physical vibration
    if (navigator.vibrate) {
      if (intensity === 'high') {
        navigator.vibrate([200, 100, 200]);
      } else {
        navigator.vibrate(100);
      }
    }

    // Trigger visual heartbeat
    controls.start({
      scale: [1, 1.5, 1],
      opacity: [1, 0.4, 0],
      transition: { duration: 0.5, times: [0, 0.1, 1] }
    });
  }, [lastHeartbeat, intensity, controls]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <motion.div
        animate={controls}
        initial={{ opacity: 0, scale: 1 }}
        className="relative"
      >
        <div className={`w-32 h-32 rounded-full absolute -inset-16 blur-3xl opacity-20 ${
          intensity === 'high' ? 'bg-red-500' : 'bg-[#00FF00]'
        }`} />
        <Heart className={`w-16 h-16 ${
          intensity === 'high' ? 'text-red-500' : 'text-[#00FF00]'
        }`} />
      </motion.div>
    </div>
  );
};
