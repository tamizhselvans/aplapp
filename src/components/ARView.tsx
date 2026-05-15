import { useEffect, useRef, useState } from 'react';
import { Camera, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export const ARView = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
    setupCamera();
  }, []);

  return (
    <div className="relative w-full h-[60vh] bg-black rounded-3xl overflow-hidden mb-6 group border border-white/10">
      {!hasPermission && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
          <Camera className="w-12 h-12 mb-2" />
          <p className="text-sm">Camera access required for Stat-Vision</p>
        </div>
      )}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover opacity-50 contrast-125 grayscale"
      />
      
      {/* AR Overlays */}
      <AnimatePresence>
        {hasPermission && (
          <div className="absolute inset-0">
            {/* Player Overlay Mock */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/4 left-1/4 border border-[#00FF00] p-4 bg-black/40 backdrop-blur-sm rounded-lg"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-[#00FF00]" />
                <span className="text-[10px] text-[#00FF00] font-bold uppercase">Live Stats</span>
              </div>
              <h4 className="text-white text-xs font-bold uppercase">Mbappé #10</h4>
              <p className="text-[10px] text-white/60">Speed: <span className="text-[#00FF00]">34.2 km/h</span></p>
              <p className="text-[10px] text-white/60">Heat Map: <span className="text-blue-400">Attacking 1/3</span></p>
            </motion.div>

            {/* Momentum Pulse */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/80 rounded-full border border-white/20">
              <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-mono text-white/80">STADIUM SYNC ACTIVE</span>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { AnimatePresence } from 'motion/react';
