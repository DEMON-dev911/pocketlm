import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Play, Pause, RotateCcw, X, Bell, CheckCircle } from 'lucide-react';

interface StudyTimerProps {
  theme?: 'dark' | 'light';
}

export default function StudyTimer({ theme = 'dark' }: StudyTimerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [showNotification, setShowNotification] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');

  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      setShowNotification(true);
      
      // Play clean notification sound safely
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
        audio.volume = 0.35;
        audio.play().catch(() => {});
      } catch (err) {
        console.warn("Audio playback blocked", err);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, secondsLeft]);

  const handleStart = () => setIsActive(true);
  const handlePause = () => setIsActive(false);
  const handleReset = () => {
    setIsActive(false);
    setSecondsLeft(totalDuration);
  };

  const handleSelectPreset = (mins: number) => {
    setIsActive(false);
    const duration = mins * 60;
    setTotalDuration(duration);
    setSecondsLeft(duration);
    setCustomMinutes(mins.toString());
  };

  const handleSetCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0 && mins <= 240) {
      setIsActive(false);
      const duration = mins * 60;
      setTotalDuration(duration);
      setSecondsLeft(duration);
    }
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLight = theme === 'light';
  const progressPercent = ((totalDuration - secondsLeft) / totalDuration) * 100;

  return (
    <>
      {/* Floating circular bubble showing active timer state */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Expanded Timer Card */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-80 rounded-2xl border p-5 shadow-2xl pointer-events-auto backdrop-blur-xl ${
                isLight 
                  ? 'bg-white/95 border-gray-200 text-gray-800' 
                  : 'bg-[#0B0B11]/95 border-purple-500/20 text-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.6)]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Timer className="h-4.5 w-4.5 text-purple-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Study Session Timer</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className={`p-1 rounded-md transition-colors ${
                    isLight ? 'hover:bg-gray-100 text-gray-400 hover:text-gray-700' : 'hover:bg-white/5 text-gray-500 hover:text-white'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Ring and Display */}
              <div className="flex flex-col items-center justify-center py-4 relative">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  {/* Background track circle */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="64"
                      className={isLight ? 'stroke-gray-150' : 'stroke-white/5'}
                      strokeWidth="6"
                      fill="transparent"
                    />
                    {/* Active progress track */}
                    <motion.circle
                      cx="72"
                      cy="72"
                      r="64"
                      stroke="url(#timerGradient)"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 64}
                      strokeDashoffset={2 * Math.PI * 64 * (1 - progressPercent / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                    <defs>
                      <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Time digits */}
                  <div className="text-center z-10 select-all">
                    <span className="font-mono text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                      {formatTime(secondsLeft)}
                    </span>
                    <p className={`text-[10px] mt-0.5 uppercase tracking-widest ${isActive ? 'text-green-400 font-semibold animate-pulse' : 'text-gray-500'}`}>
                      {isActive ? 'focusing' : 'paused'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Primary Controls */}
              <div className="flex items-center justify-center gap-4 mb-5">
                <button
                  onClick={handleReset}
                  title="Reset session"
                  className={`p-2.5 rounded-full border transition-all active:scale-95 cursor-pointer ${
                    isLight 
                      ? 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600' 
                      : 'border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {isActive ? (
                  <button
                    onClick={handlePause}
                    className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Pause className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg hover:shadow-purple-500/35 transition-all active:scale-95 cursor-pointer"
                  >
                    <Play className="h-5 w-5 ml-0.5" />
                  </button>
                )}
              </div>

              {/* Quick Presets */}
              <div className="space-y-3.5 pt-3.5 border-t border-purple-500/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Intervals</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[15, 25, 45, 60].map((mins) => {
                    const isPresetSelected = totalDuration === mins * 60;
                    return (
                      <button
                        key={mins}
                        onClick={() => handleSelectPreset(mins)}
                        className={`py-1 text-center font-mono text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                          isPresetSelected
                            ? 'bg-purple-600/20 border-purple-500/40 text-purple-400 font-bold'
                            : isLight
                              ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-950'
                              : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    );
                  })}
                </div>

                {/* Custom Minutes form */}
                <form onSubmit={handleSetCustom} className="flex gap-1.5 items-center mt-2.5">
                  <input
                    type="number"
                    min="1"
                    max="240"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className={`flex-1 px-3 py-1 text-xs font-mono rounded-lg border outline-none text-center transition-colors ${
                      isLight 
                        ? 'bg-gray-50 focus:bg-white border-gray-200 focus:border-purple-500 text-gray-800' 
                        : 'bg-black/40 focus:bg-black/60 border-white/5 focus:border-purple-500 text-white'
                    }`}
                    placeholder="Custom mins"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Set
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble Activator */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl border pointer-events-auto cursor-pointer relative ${
            isOpen 
              ? 'bg-purple-600 border-purple-500 text-white' 
              : isLight
                ? 'bg-white hover:bg-purple-50/50 border-purple-200 text-purple-600 shadow-[0_4px_20px_rgba(168,85,247,0.15)]'
                : 'bg-[#0E0E14] hover:bg-[#151522] border-purple-500/20 text-purple-400 shadow-[0_4px_25px_rgba(0,0,0,0.5)]'
          }`}
        >
          {isActive ? (
            <div className="absolute inset-1 rounded-full border border-purple-500/35 border-dashed animate-spin duration-10000" />
          ) : null}
          
          <div className="flex flex-col items-center justify-center">
            <Timer className="h-5 w-5" />
            {isActive && (
              <span className="text-[9px] font-mono font-bold mt-0.5 tracking-tight">
                {Math.ceil(secondsLeft / 60)}m
              </span>
            )}
          </div>
        </motion.button>
      </div>

      {/* Persistent Full-screen / Center Notification Alert Overlay when time is up */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`max-w-md w-full p-6 rounded-2xl border text-center shadow-2xl ${
                isLight 
                  ? 'bg-white border-gray-200 text-gray-800' 
                  : 'bg-[#0C0C12] border-purple-500/30 text-white'
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Bell className="h-8 w-8 text-purple-500 animate-swing" />
              </div>

              <h2 className="text-xl font-extrabold tracking-tight mb-2">Focus Session Complete!</h2>
              
              <div className={`flex items-center justify-center gap-1.5 text-sm mb-4 font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>You completed a full {Math.floor(totalDuration / 60)} minute deep focus sprint!</span>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                PocketLM suggests taking a quick 5-minute break to walk around, rest your eyes, and stretch before your next session. Consistent micro-breaks improve recall and synthesis.
              </p>

              <button
                onClick={() => setShowNotification(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95 cursor-pointer"
              >
                Let's Take a Break
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
