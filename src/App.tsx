import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Trophy, 
  Zap, 
  Users, 
  LayoutDashboard, 
  Camera, 
  ShieldAlert,
  User as UserIcon,
  Search
} from 'lucide-react';
import { MomentumGraph } from './components/MomentumGraph';
import { PredictionCard } from './components/PredictionCard';
import { StadiumHeartbeat } from './components/StadiumHeartbeat';
import { ARView } from './components/ARView';
import { useSocket } from './hooks/useSocket';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export default function App() {
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [momentumData, setMomentumData] = useState<number[]>(Array(50).fill(0));
  const [cricketMatches, setCricketMatches] = useState<any[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<any>(null);
  const [heartbeat, setHeartbeat] = useState<{ intensity: 'low' | 'medium' | 'high'; ts: number }>({ intensity: 'medium', ts: 0 });
  const [tab, setTab] = useState<'pulse' | 'ar' | 'fans'>('pulse');

  // Auth Handling
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(false);
      if (u) {
        setUser(u);
        const userRef = doc(db, 'users', u.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const initialData = {
              uid: u.uid,
              displayName: u.displayName || 'Fan #'+u.uid.slice(0, 4),
              photoURL: u.photoURL || '',
              fanPower: 100,
              rank: 'Rookie',
              joinedAt: new Date().toISOString()
            };
            await setDoc(userRef, initialData);
            setUserData(initialData);
          } else {
            setUserData(snap.data());
          }
        } catch (err) {
          // If we fail here, it might be rules or connection
          console.error("User data fetch failed", err);
          // Don't crash the whole app, just set basic data
          setUserData({ uid: u.uid, displayName: u.displayName || 'Fan', fanPower: 0 });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    });
    return unsub;
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign in failed", err);
    }
  };

  // Socket Events
  useEffect(() => {
    if (!socket) return;

    socket.on('match_update', (data) => {
      setMomentumData(prev => [...prev.slice(1), data.momentum]);
    });

    socket.on('prediction_event', (data) => {
      setCurrentPrediction(data);
    });

    socket.on('heartbeat', (data) => {
      setHeartbeat({ intensity: data.intensity, ts: data.timestamp });
    });

    socket.on('cricket_matches', (data) => {
      setCricketMatches(data);
    });

    return () => {
      socket.off('match_update');
      socket.off('prediction_event');
      socket.off('heartbeat');
    };
  }, [socket]);

  const handlePredictionAnswer = async (pid: string, answer: string) => {
    setCurrentPrediction(null);
    if (!user) return;

    // In a real app, this would be validated on the server or via functions
    // Here we'll just mock the win for UX/TX
    const won = Math.random() > 0.4;
    if (won) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          fanPower: increment(25)
        });
        setUserData((prev: any) => ({ ...prev, fanPower: prev.fanPower + 25 }));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'users');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white font-sans selection:bg-[#00FF00]/30 overflow-x-hidden pb-20">
      {/* Auth Overlay */}
      {!loading && !user && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-xs"
          >
            <div className="w-20 h-20 bg-[#00FF00] rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(0,255,0,0.4)]">
              <Zap className="text-black w-10 h-10 fill-black" />
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">FieldPulse</h1>
            <p className="text-white/60 text-sm mb-8">Join thousands of fans in the next generation sports experience.</p>
            <button 
              onClick={handleSignIn}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#00FF00] transition-colors active:scale-95"
            >
              <Users className="w-5 h-5" />
              Connect with Google
            </button>
          </motion.div>
        </div>
      )}

      <StadiumHeartbeat intensity={heartbeat.intensity} lastHeartbeat={heartbeat.ts} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0B0E]/80 backdrop-blur-xl border-bottom border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00FF00] rounded-lg flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(0,255,0,0.3)]">
            <Zap className="text-black w-full h-full fill-black" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase italic text-white">FieldPulse</span>
        </div>
        
        {userData && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest leading-none mb-1">Fan Power</span>
              <span className="text-sm font-mono text-[#00FF00] font-bold">{userData.fanPower}P</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-[#00FF00] p-0.5 cursor-pointer" onClick={() => signOut(auth)}>
              <div className="w-full h-full bg-[#1A1C1E] rounded-full flex items-center justify-center overflow-hidden">
                {userData.photoURL ? (
                  <img src={userData.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-white/60" />
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-md mx-auto px-6 py-6 transition-all duration-300">
        
        {/* Match Header */}
        <section className="mb-8">
          <div className="bg-[#151619] rounded-3xl p-6 border border-white/5 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold text-[#00FF00] bg-[#00FF00]/10 px-2 py-0.5 rounded tracking-widest uppercase">Live • Final Turn</span>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-white/40" />
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-tight">142k Online</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full mb-3 flex items-center justify-center border border-blue-500/20 group-scale-110 transition-transform">
                  <span className="text-2xl font-bold">LIV</span>
                </div>
                <h4 className="text-sm font-bold uppercase">Liverpool</h4>
              </div>
              
              <div className="text-center">
                <p className="text-4xl font-black italic tracking-tighter font-mono text-white">2 - 1</p>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">78:42</span>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 bg-red-600/20 rounded-full mb-3 flex items-center justify-center border border-red-500/20 group-scale-110 transition-transform">
                  <span className="text-2xl font-bold">ARS</span>
                </div>
                <h4 className="text-sm font-bold uppercase">Arsenal</h4>
              </div>
            </div>
            
            <MomentumGraph data={momentumData} />
          </div>
        </section>

        {/* View Selection */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'pulse', icon: Activity, label: 'Pulse' },
            { id: 'ar', icon: Camera, label: 'AR Vis' },
            { id: 'fans', icon: Users, label: 'Fan Wall' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border transition-all duration-300 ${
                tab === t.id 
                ? 'bg-[#00FF00]/10 border-[#00FF00] text-[#00FF00]' 
                : 'bg-[#151619] border-white/5 text-white/40 grayscale hover:grayscale-0'
              }`}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          {tab === 'pulse' && (
            <motion.div
              key="pulse"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-[#151619] rounded-2xl p-5 border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Live Highlights</h3>
                  <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="space-y-4">
                  {cricketMatches.length > 0 && (
                    <div className="mb-6 p-4 bg-[#00FF00]/5 border border-[#00FF00]/20 rounded-xl">
                       <h4 className="text-[10px] font-black uppercase text-[#00FF00] tracking-widest mb-3">Cricket Sync Active</h4>
                       <div className="space-y-3">
                         {cricketMatches.slice(0, 3).map((match, idx) => (
                           <div key={idx} className="flex justify-between items-start border-b border-white/5 pb-2 last:border-0">
                             <div className="flex-1">
                               <p className="text-[11px] font-bold text-white leading-tight">{match.name}</p>
                               <p className="text-[9px] text-white/40 uppercase font-mono mt-1">{match.status}</p>
                             </div>
                             <div className="bg-black/50 px-2 py-1 rounded text-[10px] font-mono text-[#00FF00]">
                               LIVE
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                  {[
                    { time: '76\'', event: 'Salah chance missed', impact: 'low' },
                    { time: '74\'', event: 'Yellow Card: Ben White', impact: 'medium' },
                    { time: '72\'', event: 'Goal! Núñez strikes for LIV', impact: 'high' }
                  ].map((e, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <span className="text-[10px] font-mono text-[#00FF00] bg-[#00FF00]/10 px-2 rounded">{e.time}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{e.event}</p>
                        <div className="w-full h-1 bg-white/5 mt-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: e.impact === 'high' ? '100%' : e.impact === 'medium' ? '50%' : '20%' }}
                            className={`h-full ${e.impact === 'high' ? 'bg-[#ff3e3e]' : 'bg-[#00FF00]'}`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'ar' && (
            <motion.div
              key="ar"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <ARView />
              <div className="bg-[#151619] rounded-2xl p-5 border border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#00FF00] mb-4">AR Control Panel</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-2 bg-white/5 rounded-lg text-[10px] font-bold uppercase border border-white/10 opacity-50">Sprint Speeds</button>
                  <button className="py-2 bg-[#00FF00]/20 rounded-lg text-[10px] font-bold uppercase border border-[#00FF00]/30 text-[#00FF00]">Heat Maps [ON]</button>
                  <button className="py-2 bg-white/5 rounded-lg text-[10px] font-bold uppercase border border-white/10 opacity-50">Shot Velocity</button>
                  <button className="py-2 bg-white/5 rounded-lg text-[10px] font-bold uppercase border border-white/10 opacity-50">Passing Lanes</button>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'fans' && (
            <motion.div
              key="fans"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 bg-[#151619] border border-white/5 rounded-2xl p-4">
                <div className="flex-1 bg-black/40 rounded-xl px-4 py-2 text-sm text-white/40">Say something...</div>
                <button className="p-2 bg-[#00FF00] rounded-xl"><Zap className="w-5 h-5 text-black" /></button>
              </div>
              <div className="space-y-4">
                {[
                  { user: 'SaneFan', msg: 'That Nunez goal was clinical! 🎯', power: '2.4k' },
                  { user: 'Kloppite99', msg: 'Momentum is shifting back to ARS...', power: '1.2k' },
                  { user: 'GunnerGirl', msg: 'Need a sub NOW! Arteta please! 🙏', power: '800' }
                ].map((f, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-[#151619] border border-white/5 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-white">{f.user}</span>
                        <span className="text-[10px] text-[#00FF00] font-mono">{f.power}P</span>
                      </div>
                      <p className="text-sm text-white/70">{f.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <PredictionCard 
          prediction={currentPrediction} 
          onAnswer={handlePredictionAnswer} 
        />

      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0B0E]/90 backdrop-blur-2xl border-t border-white/5 px-8 pt-4 pb-8 flex justify-between items-center">
        <LayoutDashboard className="w-6 h-6 text-[#00FF00]" />
        <div className="relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#00FF00] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,0,0.5)] border-4 border-[#0A0B0E]">
            <Trophy className="w-8 h-8 text-black" />
          </div>
        </div>
        <Search className="w-6 h-6 text-white/40" />
      </nav>

      {/* Connectivity Status */}
      {!isConnected && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full animate-pulse flex items-center gap-2 shadow-lg">
          <ShieldAlert className="w-3 h-3" />
          Connecting to Live Sync...
        </div>
      )}
    </div>
  );
}
