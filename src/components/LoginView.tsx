import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Chrome, Github, Eye, EyeOff, Sparkles, ArrowRight, Headphones, FileText, HelpCircle, GraduationCap, Sparkle } from 'lucide-react';

const STARS_COUNT = 30;

const ANIMATION_STARS = Array.from({ length: STARS_COUNT }).map((_, i) => ({
  id: i,
  left: `${2 + (i * 73) % 96}%`,
  size: 1 + (i % 3), // 1px to 3px
  duration: 6 + (i % 5), // 6s to 10s
  delay: i * 0.25,
  opacity: 0.15 + (i % 7) / 10
}));

const ANIMATION_BALLS = [
  { id: 1, left: '8%', size: 24, color: 'from-[#0F172A] via-[#1E1B4B] to-[#4F46E5]', shadow: 'inset -6px -6px 12px rgba(0,0,0,0.95), inset 3px 3px 6px rgba(255,255,255,0.45), 0 0 12px rgba(99,102,241,0.4)', duration: 7, delay: 0 },
  { id: 2, left: '26%', size: 32, color: 'from-[#1E1B4B] via-[#701A75] to-[#F472B6]', shadow: 'inset -8px -8px 16px rgba(0,0,0,0.95), inset 4px 4px 8px rgba(255,255,255,0.5), 0 0 16px rgba(244,114,182,0.4)', duration: 9, delay: 1.5 },
  { id: 3, left: '48%', size: 28, color: 'from-[#022C22] via-[#0D9488] to-[#34D399]', shadow: 'inset -7px -7px 14px rgba(0,0,0,0.95), inset 3.5px 3.5px 7px rgba(255,255,255,0.4), 0 0 14px rgba(52,211,153,0.3)', duration: 6, delay: 0.8 },
  { id: 4, left: '72%', size: 20, color: 'from-[#082F49] via-[#0284C7] to-[#38BDF8]', shadow: 'inset -5px -5px 10px rgba(0,0,0,0.95), inset 2.5px 2.5px 5px rgba(255,255,255,0.5), 0 0 10px rgba(56,189,248,0.4)', duration: 8.5, delay: 2.2 },
  { id: 5, left: '90%', size: 30, color: 'from-[#451A03] via-[#D97706] to-[#FBBF24]', shadow: 'inset -8px -8px 16px rgba(0,0,0,0.95), inset 4px 4px 8px rgba(255,255,255,0.45), 0 0 14px rgba(251,191,36,0.3)', duration: 7.8, delay: 3 }
];

export function CosmicLoopAnimation({ isLight, isBackground = false }: { isLight: boolean; isBackground?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Background ambient neon space bubbles */}
      <div className="absolute top-[15%] left-[20%] w-[280px] h-[280px] rounded-full bg-purple-600/10 blur-[100px]" />
      <div className="absolute bottom-[15%] right-[20%] w-[280px] h-[280px] rounded-full bg-indigo-600/10 blur-[100px]" />

      {/* Raining Stars */}
      {ANIMATION_STARS.map((star) => (
        <motion.div
          key={`f-star-${star.id}`}
          initial={{ y: -50, opacity: 0 }}
          animate={{ 
            y: [-50, 800], 
            opacity: [0, star.opacity, star.opacity, 0] 
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "linear"
          }}
          className={`absolute rounded-full ${isLight ? 'bg-purple-400' : 'bg-white'}`}
          style={{
            left: star.left,
            width: star.size,
            height: star.size,
          }}
        />
      ))}

      {/* Raining Balls */}
      {ANIMATION_BALLS.map((ball) => (
        <motion.div
          key={`f-ball-${ball.id}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ 
            y: [-100, 850], 
            opacity: [0, 0.7, 0.7, 0] 
          }}
          transition={{
            duration: ball.duration,
            repeat: Infinity,
            delay: ball.delay,
            ease: "linear"
          }}
          className={`absolute rounded-full bg-gradient-to-br ${ball.color}`}
          style={{
            left: ball.left,
            width: ball.size,
            height: ball.size,
            boxShadow: ball.shadow,
          }}
        />
      ))}

      {/* Central Rotating Celestial Solar System (Only show when not a full screen bg to avoid clutter) */}
      {!isBackground && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Main Central Glowing Sun: PoketLM */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Spinning Neon Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-44 h-44 rounded-full border border-dashed border-purple-500/30"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute w-60 h-60 rounded-full border border-dashed border-indigo-500/15"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="absolute w-80 h-80 rounded-full border border-dashed border-pink-500/10"
            />

            {/* Central Planet Logo */}
            <motion.div
              animate={{
                scale: [0.96, 1.04, 0.96],
                boxShadow: [
                  "0 0 30px rgba(168,85,247,0.2)",
                  "0 0 50px rgba(168,85,247,0.45)",
                  "0 0 30px rgba(168,85,247,0.2)"
                ]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="z-20 flex flex-col items-center justify-center text-center px-7 py-5 rounded-full w-36 h-36 bg-black/70 backdrop-blur-lg border border-white/10"
            >
              <h2 className="text-2xl font-display font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-indigo-200 drop-shadow">
                Poket<span className="text-white">LM</span>
              </h2>
              <span className="text-[7.5px] font-mono tracking-widest text-purple-300/80 uppercase mt-1">
                STUDY CORE
              </span>
              <Sparkle className="h-3 w-3 text-purple-400 mt-2 animate-spin-slow" />
            </motion.div>

            {/* Satellite 1: Audio Pods */}
            <motion.div
              animate={{ y: [-6, 6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", yoyo: true }}
              className="absolute -top-24 -left-12 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/65 backdrop-blur-md border border-purple-500/20 shadow-lg hover:border-purple-500/60 transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                <Headphones className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold text-white uppercase tracking-tight font-mono">Audio Pods</p>
                <p className="text-[7.5px] text-purple-300 font-mono">Grounded Voices</p>
              </div>
            </motion.div>

            {/* Satellite 2: Key TL;DR */}
            <motion.div
              animate={{ y: [6, -6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", yoyo: true }}
              className="absolute -bottom-24 -right-12 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/65 backdrop-blur-md border border-pink-500/20 shadow-lg hover:border-pink-500/60 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold text-white uppercase tracking-tight font-mono">TL;DR Guides</p>
                <p className="text-[7.5px] text-pink-300 font-mono">Key Takeaways</p>
              </div>
            </motion.div>

            {/* Satellite 3: Smart Quizzes */}
            <motion.div
              animate={{ y: [-5, 5] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", yoyo: true, delay: 0.5 }}
              className="absolute -right-24 -top-8 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/65 backdrop-blur-md border border-emerald-500/20 shadow-lg hover:border-emerald-500/60 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold text-white uppercase tracking-tight font-mono">AI Quizzes</p>
                <p className="text-[7.5px] text-emerald-300 font-mono">Grounded Check</p>
              </div>
            </motion.div>

            {/* Satellite 4: Flashcards */}
            <motion.div
              animate={{ y: [5, -5] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", yoyo: true, delay: 0.8 }}
              className="absolute -left-24 -bottom-6 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/65 backdrop-blur-md border border-amber-500/20 shadow-lg hover:border-amber-500/60 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white">
                <HelpCircle className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold text-white uppercase tracking-tight font-mono">Flashcards</p>
                <p className="text-[7.5px] text-amber-300 font-mono">Active Recall</p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

interface LoginViewProps {
  onLogin: (user: User) => void;
  theme?: 'dark' | 'light';
}

// Framer motion list stagger variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 140 }
  }
};

export default function LoginView({ onLogin, theme = 'dark' }: LoginViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parallax mouse movement states for interactive celestial background
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normal offset from center (-0.5 to 0.5)
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' 
        ? { email, password } 
        : { fullName, email, password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLight = theme === 'light';

  return (
    <div id="login_container" className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden px-4 py-8 md:py-16 font-sans select-none transition-colors duration-500 ${
      isLight ? 'bg-[#F4F5FA]' : 'bg-[#07080A]'
    }`}>
      
      {/* 1. Deep Space Cosmic Background with interactive parallax */}
      <motion.div 
        animate={{ 
          x: mousePos.x * -40,
          y: mousePos.y * -40
        }}
        transition={{ type: "spring", damping: 30, stiffness: 60 }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Ambient Nebula Radial Highlights with rich purples */}
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </motion.div>

      {/* Subtle Starry background using multiple small dots */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {[
          { top: '12%', left: '15%', delay: 0 },
          { top: '25%', left: '45%', delay: 1.5 },
          { top: '18%', left: '78%', delay: 0.8 },
          { top: '65%', left: '12%', delay: 2.2 },
          { top: '82%', left: '42%', delay: 0.4 },
          { top: '55%', left: '88%', delay: 1.1 },
          { top: '40%', left: '22%', delay: 1.9 },
          { top: '72%', left: '74%', delay: 0.6 }
        ].map((star, idx) => (
          <motion.div
            key={idx}
            style={{ top: star.top, left: star.left }}
            animate={{ opacity: [0.1, 1, 0.1] }}
            transition={{ duration: 3, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
            className={`absolute w-[2px] h-[2px] rounded-full ${isLight ? 'bg-purple-400' : 'bg-white'}`}
          />
        ))}
      </div>

      {/* Render CosmicLoopAnimation as Background on Mobile/Tablet so they still get the starry universe experience behind the login card! */}
      <div className="absolute inset-0 md:hidden pointer-events-none">
        <CosmicLoopAnimation isLight={isLight} isBackground={true} />
      </div>

      {/* Main Glass Window Container with Spring Scale Entrance */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.85, type: "spring", bounce: 0.18 }}
        className={`relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-[24px] border shadow-2xl overflow-hidden transition-colors duration-500 ${
          isLight 
            ? 'border-slate-200 bg-white/95 shadow-purple-900/10' 
            : 'border-[#202125] bg-[#121316]/90 shadow-black/90'
        } backdrop-blur-xl`}
      >
        
        {/* LEFT PANEL - Minimal Entry Form */}
        <motion.div 
          id="form_panel" 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="col-span-1 md:col-span-6 p-6 sm:p-10 md:p-14 flex flex-col justify-between min-h-[500px] relative"
        >
          
          {/* Mac Window Control Dots */}
          <div className="flex gap-1.5 mb-6">
            <span className={`w-2.5 h-2.5 rounded-full border ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#25262B] border-white/[0.02]'}`} />
            <span className={`w-2.5 h-2.5 rounded-full border ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#25262B] border-white/[0.02]'}`} />
            <span className={`w-2.5 h-2.5 rounded-full border ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#25262B] border-white/[0.02]'}`} />
          </div>

          {/* Form Content */}
          <div className="my-auto max-w-sm w-full mx-auto">
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-md flex items-center gap-1.5 border ${
                  isLight 
                    ? 'text-purple-700 bg-purple-50/50 border-purple-200' 
                    : 'text-purple-400 bg-purple-500/5 border-purple-500/10'
                }`}>
                  <Sparkles className="h-2.5 w-2.5 text-purple-500" /> Grounded Learning
                </span>
              </div>
              <h1 className={`text-3xl font-display font-black tracking-tight mb-8 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                {mode === 'login' ? 'Sign in' : 'Create your account'}
              </h1>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <motion.div variants={itemVariants}>
                  <label className={`block text-[10px] font-mono uppercase tracking-widest mb-2 font-black ${
                    isLight ? 'text-slate-700' : 'text-[#60626A]'
                  }`}>
                    Full name
                  </label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all font-sans font-semibold ${
                      isLight 
                        ? 'border-slate-300 focus:border-purple-600 focus:ring-purple-600/15 bg-white text-slate-950 placeholder-slate-400 shadow-sm' 
                        : 'border-purple-500/10 focus:border-purple-500 focus:ring-purple-500/20 bg-[#0A0B0D] text-[#E3E4E6] placeholder-[#38393F]'
                    }`}
                  />
                </motion.div>
              )}
              
              <motion.div variants={itemVariants}>
                <label className={`block text-[10px] font-mono uppercase tracking-widest mb-2 font-black ${
                  isLight ? 'text-slate-700' : 'text-[#60626A]'
                }`}>
                  Your email
                </label>
                <input 
                  id="login_email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@domain.com"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all font-sans font-semibold ${
                    isLight 
                      ? 'border-slate-300 focus:border-purple-600 focus:ring-purple-600/15 bg-white text-slate-950 placeholder-slate-400 shadow-sm' 
                      : 'border-purple-500/10 focus:border-purple-500 focus:ring-purple-500/20 bg-[#0A0B0D] text-[#E3E4E6] placeholder-[#38393F]'
                  }`}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className={`text-[10px] font-mono uppercase tracking-widest font-black mb-2 ${
                  isLight ? 'text-slate-700' : 'text-[#60626A]'
                }`}>
                  Password
                </label>
                
                <div className="relative">
                  <input 
                    id="login_password"
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full pr-10 pl-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all font-sans font-semibold ${
                      isLight 
                        ? 'border-slate-300 focus:border-purple-600 focus:ring-purple-600/15 bg-white text-slate-950 placeholder-slate-400 shadow-sm' 
                        : 'border-purple-500/10 focus:border-purple-500 focus:ring-purple-500/20 bg-[#0A0B0D] text-[#E3E4E6] placeholder-[#38393F]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 hover:text-purple-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>

              {error && (
                <motion.div variants={itemVariants} className="text-red-500 text-sm font-semibold text-center">
                  {error}
                </motion.div>
              )}

              {/* Spectacular Purple Satin Metallic Button with spring scaling */}
              <motion.button 
                id="signin_submit"
                type="submit" 
                disabled={isSubmitting}
                variants={itemVariants}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="relative w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 border border-purple-500/30 transition-all duration-200 mt-6 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-80 animate-pulse" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Social Logins and Sign up */}
          <motion.div 
            variants={itemVariants}
            className={`mt-6 pt-6 border-t flex flex-col items-center gap-4 ${
              isLight ? 'border-slate-200' : 'border-[#1D1E22]'
            }`}
          >
            <p className={`text-[11px] tracking-wide ${isLight ? 'text-slate-700 font-semibold' : 'text-[#5A5C63]'}`}>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button 
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} 
                className={`font-black hover:underline cursor-pointer ${
                  isLight ? 'text-purple-700 hover:text-purple-850' : 'text-[#ECECED]'
                }`}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </motion.div>

        </motion.div>

        {/* RIGHT PANEL - Cosmic Illustration Container with floating interactive planetary objects (Hidden on mobile for excellent responsiveness) */}
        <div className={`hidden md:flex md:col-span-6 p-3 flex-col ${isLight ? 'bg-purple-50/20' : 'bg-[#121316]'}`}>
          <div className={`flex-1 rounded-2xl relative overflow-hidden flex flex-col justify-between p-10 min-h-[440px] border ${
            isLight 
              ? 'bg-gradient-to-br from-purple-950 to-indigo-950 border-purple-200/50' 
              : 'bg-[#090A0C] border-[#202125]'
          }`}>
            <CosmicLoopAnimation isLight={isLight} />
          </div>
        </div>

      </motion.div>
    </div>
  );
}
