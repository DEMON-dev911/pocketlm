import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      {/* Label for visual hierarchy */}
      <span className={`text-[10px] font-mono tracking-wider uppercase hidden md:inline-block ${
        isDark ? 'text-purple-400' : 'text-purple-600'
      }`}>
        {isDark ? 'Deep Space Mode' : 'Light Study Mode'}
      </span>

      <button
        type="button"
        id="theme-toggle-button"
        onClick={onToggle}
        className={`relative flex items-center justify-between h-8 w-16 p-1 rounded-full cursor-pointer border select-none transition-colors ${
          isDark 
            ? 'bg-[#0F0F16] border-purple-500/20' 
            : 'bg-gray-100 border-gray-300'
        }`}
        title={isDark ? "Switch to Light Study" : "Switch to Deep Space"}
      >
        {/* Animated slide background */}
        <motion.div
          layout
          className={`absolute h-6 w-6 rounded-full shadow-md ${
            isDark 
              ? 'bg-purple-600' 
              : 'bg-white border border-gray-300'
          }`}
          style={{
            left: isDark ? 'calc(100% - 28px)' : '4px'
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />

        {/* Sun Icon */}
        <div className={`z-10 pl-1 ${isDark ? 'text-gray-600' : 'text-amber-500'}`}>
          <Sun className="h-3.5 w-3.5" />
        </div>

        {/* Moon Icon */}
        <div className={`z-10 pr-1 ${isDark ? 'text-purple-300' : 'text-gray-400'}`}>
          <Moon className="h-3.5 w-3.5" />
        </div>
      </button>
    </div>
  );
}
