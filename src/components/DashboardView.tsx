import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, BookOpen, GraduationCap, UploadCloud, 
  HelpCircle, FileText, Compass, Plus, 
  Trash2, Clock, Calendar, ArrowRight, LogOut, Check,
  GripVertical, LayoutGrid, List, RefreshCw, Flame, Award,
  Tag, Filter, X, Edit3
} from 'lucide-react';
import { Notebook } from '../types';
import ThemeToggle from './ThemeToggle';
import { InteractiveDotGrid } from './InteractiveDotGrid';
import { TokenQuotaProgressBar } from './TokenQuotaProgressBar';

// Hash function to generate deterministic values based on strings
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const THUMBNAIL_GRADIENTS = [
  { from: 'from-purple-600', to: 'to-indigo-950', accent: '#EC4899', colors: ['#8B5CF6', '#6366F1', '#EC4899'] },
  { from: 'from-blue-600', to: 'to-cyan-950', accent: '#10B981', colors: ['#3B82F6', '#06B6D4', '#10B981'] },
  { from: 'from-amber-500', to: 'to-red-950', accent: '#EC4899', colors: ['#F59E0B', '#EF4444', '#EC4899'] },
  { from: 'from-pink-600', to: 'to-purple-950', accent: '#6366F1', colors: ['#D946EF', '#8B5CF6', '#6366F1'] },
  { from: 'from-emerald-600', to: 'to-teal-950', accent: '#F59E0B', colors: ['#10B981', '#14B8A6', '#F59E0B'] },
  { from: 'from-rose-500', to: 'to-violet-950', accent: '#F43F5E', colors: ['#F43F5E', '#E11D48', '#4F46E5'] }
];

export function NotebookThumbnail({ seed, name, isLight }: { seed: string; name: string; isLight: boolean }) {
  const h = hashString(seed + name);
  const grad = THUMBNAIL_GRADIENTS[h % THUMBNAIL_GRADIENTS.length];
  const shapesCount = 4 + (h % 3); // 4 to 6 shapes
  const patternType = h % 3; // 0: concentric, 1: polygons, 2: curves

  // Generate deterministic shapes based on seed
  const shapes = Array.from({ length: shapesCount }).map((_, i) => {
    const sh = hashString(seed + name + i.toString());
    return {
      cx: 15 + (sh % 70), // percentage coordinates (15 to 85)
      cy: 20 + (sh % 60),
      r: 8 + (sh % 20),
      rot: sh % 360,
      opacity: 0.12 + ((sh % 10) / 100), // 0.12 to 0.22
      points: `${20 + (sh % 40)},${10 + (sh % 30)} ${50 + (sh % 40)},${50 + (sh % 30)} ${10 + (sh % 30)},${60 + (sh % 30)}`
    };
  });

  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${grad.from} ${grad.to} transition-all duration-500`}>
      {/* Grid overlay for structural architectural aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Dynamic Shapes based on Pattern Type */}
      <svg className="absolute inset-0 w-full h-full opacity-60" preserveAspectRatio="none">
        {patternType === 0 && (
          // Concentric Circular Rings
          shapes.map((sh, idx) => (
            <circle
              key={idx}
              cx={`${sh.cx}%`}
              cy={`${sh.cy}%`}
              r={sh.r * 1.5}
              fill="none"
              stroke="white"
              strokeWidth={(idx % 2 === 0) ? "1.5" : "0.5"}
              strokeDasharray={(idx % 3 === 0) ? "4 4" : undefined}
              opacity={sh.opacity}
              style={{ transformOrigin: `${sh.cx}% ${sh.cy}%`, transform: `rotate(${sh.rot}deg)` }}
            />
          ))
        )}

        {patternType === 1 && (
          // Overlapping Polygons / Triangles
          shapes.map((sh, idx) => (
            <polygon
              key={idx}
              points={sh.points}
              fill={idx % 2 === 0 ? "white" : grad.accent}
              opacity={sh.opacity * 0.9}
              style={{ transform: `translate(${sh.cx - 50}px, ${sh.cy - 30}px) rotate(${sh.rot}deg)` }}
            />
          ))
        )}

        {patternType === 2 && (
          // Flowing ribbon curves
          shapes.slice(0, 3).map((sh, idx) => {
            const yOffset = 25 + idx * 20;
            return (
              <path
                key={idx}
                d={`M -20 ${yOffset} Q 150 ${yOffset + (idx % 2 === 0 ? 30 : -35)} 320 ${yOffset} T 600 ${yOffset}`}
                fill="none"
                stroke="white"
                strokeWidth={2 + (idx % 2)}
                opacity={0.15 - idx * 0.03}
              />
            );
          })
        )}

        {/* Highlight overlapping glow */}
        <circle cx="80%" cy="30%" r="50" fill={grad.accent} opacity="0.25" filter="blur(20px)" />
        <circle cx="20%" cy="70%" r="40" fill="white" opacity="0.1" filter="blur(15px)" />
      </svg>
    </div>
  );
}

export function CircularProgress({ reviewed, total }: { reviewed: number; total: number }) {
  const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const radius = 9;
  const circumference = 2 * Math.PI * radius; // ~56.54
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isCompleted = percentage === 100;

  return (
    <div 
      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg select-none backdrop-blur-xl border transition-all duration-500 ${
        isCompleted
          ? 'bg-emerald-500/15 border-emerald-400/40 shadow-[0_0_15px_rgba(52,211,153,0.45)] text-white animate-[pulse_2.5s_infinite]'
          : 'bg-white/10 dark:bg-black/35 border-white/20 dark:border-white/10 shadow-md text-white'
      }`}
      title={`${reviewed} of ${total} cards reviewed (${percentage}%)`}
    >
      {/* Gloss Specular Reflection Sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] pointer-events-none rounded-lg" />
      
      <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 -rotate-90">
          <circle
            cx="10"
            cy="10"
            r={radius}
            className={isCompleted ? "stroke-emerald-500/10" : "stroke-white/10"}
            strokeWidth="2"
            fill="transparent"
          />
          {/* Subtle Glow underlay circle to give real neon glass feel */}
          <circle
            cx="10"
            cy="10"
            r={radius}
            className="stroke-emerald-400 transition-all duration-500 ease-out"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            opacity={isCompleted ? "0.6" : "0.3"}
            filter="blur(1px)"
          />
          <circle
            cx="10"
            cy="10"
            r={radius}
            className={`${isCompleted ? "stroke-emerald-300" : "stroke-emerald-400"} transition-all duration-500 ease-out`}
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute text-[7px] font-mono font-bold text-emerald-300">
          {percentage}%
        </span>
      </div>
      <div className="flex flex-col leading-none text-left relative z-10">
        <span className="text-[7px] font-mono font-black tracking-wider text-emerald-400 uppercase">CARDS</span>
        <span className="text-[9px] font-mono font-bold text-white/95 mt-0.5">{reviewed}/{total}</span>
      </div>
    </div>
  );
}

export function LiquidGlassBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2rem] z-0">
      {/* Liquid fluid blob 1 */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-gradient-to-br from-purple-500/10 to-indigo-500/5 blur-3xl opacity-40"
      />
      
      {/* Liquid fluid blob 2 */}
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.85, 1.15, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/5 to-pink-500/10 blur-3xl opacity-40"
      />

      {/* Liquid fluid blob 3 */}
      <motion.div
        animate={{
          scale: [0.9, 1.1, 0.95, 0.9],
          opacity: [0.15, 0.25, 0.18, 0.15]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-gradient-to-tr from-violet-500/5 to-purple-500/2 blur-3xl"
      />
    </div>
  );
}

interface DashboardViewProps {
  notebooks: Notebook[];
  onSelectNotebook: (id: string) => void;
  onCreateNotebook: (name: string, description: string, tags?: string[]) => void;
  onDeleteNotebook: (id: string) => void;
  onDeleteMultipleNotebooks?: (ids: string[]) => void;
  onReorderNotebooks?: (orderedNotebooks: Notebook[]) => void;
  onUpdateNotebook?: (updatedNotebook: Notebook) => void;
  onLogout: () => void;
  userEmail: string;
  userName?: string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

// Framer motion list stagger variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", damping: 25, stiffness: 120 } 
  }
};

export default function DashboardView({
  notebooks,
  onSelectNotebook,
  onCreateNotebook,
  onDeleteNotebook,
  onDeleteMultipleNotebooks,
  onReorderNotebooks,
  onUpdateNotebook,
  onLogout,
  userEmail,
  userName,
  theme = 'dark',
  onToggleTheme = () => {}
}: DashboardViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Tags Filter & Sort State
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'sources-desc' | 'cards-desc'>('date-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Tag Editing State
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [editingTagsInput, setEditingTagsInput] = useState<string>('');

  // Study Streak States & Persistence
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('pocketlm_study_streak');
    return saved ? parseInt(saved, 10) : 5; // Default to 5-day streak for nice initial feel
  });
  
  const [lastStudyDate, setLastStudyDate] = useState<string>(() => {
    const saved = localStorage.getItem('pocketlm_last_study_date');
    if (!saved) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    return saved;
  });

  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakNotification, setStreakNotification] = useState<string | null>(null);

  // Check on mount if streak is broken
  React.useEffect(() => {
    if (lastStudyDate) {
      const today = new Date().toISOString().split('T')[0];
      const todayObj = new Date(today);
      const lastObj = new Date(lastStudyDate);
      const diffTime = todayObj.getTime() - lastObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        setStreak(0);
        localStorage.setItem('pocketlm_study_streak', '0');
        setStreakNotification("Your previous streak expired! Let's start a brand new study streak today. ⚡");
        setTimeout(() => setStreakNotification(null), 6000);
      }
    }
  }, [lastStudyDate]);

  const handleLogStudy = (customDate?: string) => {
    const todayStr = customDate || new Date().toISOString().split('T')[0];
    
    if (lastStudyDate === todayStr) {
      setStreakNotification("Already logged your study session today! Come back tomorrow to keep the streak hot. 🌟");
      setTimeout(() => setStreakNotification(null), 4000);
      return;
    }

    const lastDateObj = new Date(lastStudyDate);
    const todayDateObj = new Date(todayStr);
    
    const diffTime = todayDateObj.getTime() - lastDateObj.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let newStreak = streak;
    if (diffDays === 1 || streak === 0) {
      newStreak = streak + 1;
      setStreakNotification(`Perfect! Daily session logged. Streak increased to ${newStreak} days! 🔥`);
    } else if (diffDays > 1) {
      newStreak = 1;
      setStreakNotification("Started a brand new study streak! Build the habit. 🚀");
    } else {
      newStreak = streak;
    }

    setStreak(newStreak);
    setLastStudyDate(todayStr);
    localStorage.setItem('pocketlm_study_streak', newStreak.toString());
    localStorage.setItem('pocketlm_last_study_date', todayStr);
    setTimeout(() => setStreakNotification(null), 4000);
  };

  const handleSimulateNextDay = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    setLastStudyDate(yesterdayStr);
    localStorage.setItem('pocketlm_last_study_date', yesterdayStr);
    setStreakNotification("Simulated next day! You can now log another daily check-in to increase the streak. 🚀");
    setTimeout(() => setStreakNotification(null), 4000);
  };

  React.useEffect(() => {
    setIsSyncing(true);
    const timer = setTimeout(() => {
      setLastSynced(new Date());
      setIsSyncing(false);
    }, 850);
    return () => clearTimeout(timer);
  }, [notebooks]);

  // Drag and Drop ordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...notebooks];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    if (onReorderNotebooks) {
      onReorderNotebooks(reordered);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(notebooks.map(n => n.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteMultipleNotebooks) {
      onDeleteMultipleNotebooks(selectedIds);
    } else {
      selectedIds.forEach(id => onDeleteNotebook(id));
    }
    setSelectedIds([]);
    setShowConfirmDelete(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const parsedTags = newTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    onCreateNotebook(newName, newDesc, parsedTags);
    setNewName('');
    setNewDesc('');
    setNewTags('');
    setShowCreateModal(false);
    handleLogStudy(); // Increment study streak upon creating a notebook
  };

  const handleTileClick = (title: string) => {
    const templates: Record<string, { name: string; desc: string; tags?: string[] }> = {
      "Upload & Analyze": { name: "New Course Study Guide", desc: "Drop notes, textbooks, and syllabus files to begin.", tags: ["Uploads"] },
      "Exam Prep": { name: "Biology Midterm Prep Room", desc: "Interactive quizzes and detailed key takeaways generated from Biology notes.", tags: ["Biology", "Prep"] },
      "Paper Assistant": { name: "Thesis Research & Citations", desc: "Analyze research papers, generate citations, and structure drafts.", tags: ["Research", "Writing"] },
      "Brainstorm": { name: "Creative Writing Ideas", desc: "Brainstorming and mapping connections between different documents.", tags: ["Brainstorm", "Creative"] },
    };

    const template = templates[title];
    if (template) {
      onCreateNotebook(template.name, template.desc, template.tags);
      handleLogStudy(); // Increment study streak upon selecting a template tile
    }
  };

  // Compile all unique tags dynamically
  const allUniqueTags = Array.from(
    new Set(notebooks.flatMap(nb => nb.tags || []))
  ).filter(Boolean);

  // Filter and sort the notebooks list
  const filteredNotebooks = notebooks
    .filter(nb => {
      // Filter by tag selection
      if (selectedTagFilter && !(nb.tags || []).includes(selectedTagFilter)) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = nb.name.toLowerCase().includes(query);
        const matchesDesc = (nb.description || "").toLowerCase().includes(query);
        const matchesTags = (nb.tags || []).some(t => t.toLowerCase().includes(query));
        return matchesName || matchesDesc || matchesTags;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'sources-desc':
          return (b.sources || []).length - (a.sources || []).length;
        case 'cards-desc':
          return (b.flashcards || []).length - (a.flashcards || []).length;
        default:
          return 0;
      }
    });

  const isLight = theme === 'light';

  return (
    <div id="dashboard_container" className={`relative min-h-screen flex flex-col font-sans select-none overflow-x-hidden transition-colors duration-500 ${
      isLight ? 'bg-[#F8F9FC] text-slate-800' : 'bg-[#030305] text-[#ECECED]'
    }`}>
      {/* Immersive Interactive Dot Grid canvas covering the entire viewport background */}
      <InteractiveDotGrid isLight={isLight} />
      
      {/* Top Navigation Bar with Ambient Blur & Liquid Glass styling */}
      <header className={`sticky top-3 z-40 mx-4 lg:mx-auto max-w-7xl transition-all duration-500 backdrop-blur-[24px] px-6 py-3.5 border rounded-2xl overflow-hidden shadow-2xl relative ${
        isLight 
          ? 'border-white/50 bg-white/60 shadow-purple-950/[0.03] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),_inset_0_-1px_1px_rgba(255,255,255,0.3)]' 
          : 'border-white/[0.07] bg-[#09090E]/60 shadow-[0_12px_40px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15),_inset_0_-1px_1px_rgba(255,255,255,0.05)]'
      }`}>
        {/* Real-time Dynamic Liquid Glass flows inside the navigation header bar */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{
              x: [-30, 40, -10, -30],
              y: [-15, 15, -5, -15],
              scale: [1, 1.2, 0.9, 1]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute top-0 left-1/4 w-60 h-24 rounded-full blur-2xl opacity-25 bg-gradient-to-r ${
              isLight ? 'from-purple-300/30 to-indigo-300/20' : 'from-purple-500/12 to-indigo-500/5'
            }`}
          />
          <motion.div
            animate={{
              x: [40, -30, 20, 40],
              y: [15, -15, 5, 15],
              scale: [1, 0.85, 1.15, 1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute -bottom-6 right-1/4 w-72 h-24 rounded-full blur-2xl opacity-30 bg-gradient-to-r ${
              isLight ? 'from-indigo-300/20 to-pink-300/20' : 'from-indigo-500/5 to-pink-500/10'
            }`}
          />
          {/* Subtle diagonal specular high-gloss shimmer overlay */}
          <motion.div 
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "linear"
            }}
            className={`absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/${isLight ? '0.12' : '0.04'} to-transparent skew-x-12 pointer-events-none`}
          />
        </div>

        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
              isLight 
                ? 'bg-purple-50 border-purple-200 text-purple-600' 
                : 'bg-purple-600/20 border-purple-500/30 text-purple-400'
            }`}>
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className={`text-lg font-display font-extrabold tracking-tight transition-colors duration-500 ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}>
              Pocket<span className="text-purple-500">LM</span>
            </span>
            <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded uppercase transition-all ${
              isLight 
                ? 'border-purple-200 text-purple-600 bg-purple-50' 
                : 'border-purple-500/25 text-purple-400 bg-purple-500/5'
            }`}>
              STUDENT BETA
            </span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {/* Subtle Last Synced Status Indicator */}
            <div 
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[10px] font-mono transition-all duration-500 backdrop-blur-xl ${
                isLight 
                  ? 'bg-slate-100/40 border-slate-200/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] text-slate-500' 
                  : 'bg-black/30 border-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] text-gray-400'
              }`}
              title="Automatic cloud sync status"
            >
              <div className="relative flex h-1.5 w-1.5 shrink-0">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isSyncing 
                    ? 'animate-ping bg-purple-400' 
                    : 'animate-pulse bg-emerald-400/50'
                }`} />
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  isSyncing ? 'bg-purple-500' : 'bg-emerald-500'
                }`} />
              </div>
              
              <div className="flex items-center gap-1.5">
                <motion.div
                  animate={isSyncing ? { rotate: -360 } : { rotate: 0 }}
                  transition={isSyncing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.5 }}
                  className="flex items-center justify-center shrink-0"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'text-purple-400' : 'text-emerald-500'}`} />
                </motion.div>
                
                <span className="font-semibold select-none leading-none tracking-wide">
                  {isSyncing ? 'SYNCING' : `SYNCED ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                </span>
              </div>
            </div>

            {/* Study Streak Badge with Flame Glow */}
            <motion.div 
              id="study_streak_badge"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowStreakModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all duration-300 cursor-pointer select-none backdrop-blur-xl relative group ${
                isLight 
                  ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/15 text-amber-700 font-bold shadow-[0_2px_8px_rgba(245,158,11,0.08)]' 
                  : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/10 text-amber-400 font-bold shadow-[0_4px_12px_rgba(245,158,11,0.05)]'
              }`}
              title="Click to view Study Streak details!"
            >
              <div className="relative">
                <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-[pulse_1.5s_infinite] drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
              </div>
              <span className="font-mono tracking-tight text-[11px] md:text-xs">
                {streak} Day Streak
              </span>
            </motion.div>

            {/* Smooth Theme Switcher */}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            <div className="hidden sm:flex flex-col items-end">
              <span className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>{userName || userEmail}</span>
              <span className={`text-[10px] font-mono ${isLight ? 'text-purple-600/80' : 'text-gray-500'}`}>{userName ? userEmail : 'Verified Scholar'}</span>
            </div>
            
            <button 
              id="logout_btn"
              onClick={onLogout}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                isLight 
                  ? 'border-gray-200 hover:border-red-500 hover:bg-red-50 text-gray-500 hover:text-red-500' 
                  : 'border-purple-500/10 hover:border-red-500/30 hover:bg-red-500/5 text-gray-400 hover:text-red-400'
              }`}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-12 space-y-16 relative z-10">
        
        {/* Massive Glassmorphic Hero Container with Premium Contrast, Spacing, and Inner Neon Glows */}
        <section 
          id="dashboard_hero_section"
          className={`relative rounded-[2rem] p-8 md:p-16 border transition-all duration-500 flex flex-col items-center justify-center gap-12 text-center min-h-[480px] md:min-h-[550px] overflow-hidden ${
            isLight 
              ? 'bg-white/[0.02] border-slate-200/30 backdrop-blur-[2px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]' 
              : 'bg-white/[0.01] border-white/[0.04] backdrop-blur-[2px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] shadow-[0_10px_30px_rgba(0,0,0,0.15)]'
          }`}
        >
          {/* Real-time floating Liquid Glass orbital shapes */}
          <LiquidGlassBackground />

          <div className="space-y-5 max-w-3xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="inline-block"
            >
              <span className={`text-[10px] font-mono tracking-widest uppercase border px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-all ${
                isLight 
                  ? 'text-purple-700 bg-purple-50 border-purple-200/70 font-bold' 
                  : 'text-purple-400 bg-purple-500/5 border-purple-500/15'
              }`}>
                <Sparkles className="h-3.5 w-3.5 text-purple-500 animate-pulse" /> Study Room Command Center
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.08 }}
              className={`text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[1.08] transition-colors duration-500 ${
                isLight 
                  ? 'text-slate-950' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-purple-200 drop-shadow-sm'
              }`}
            >
              What are we studying today?
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              className={`text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed transition-colors duration-500 ${
                isLight ? 'text-slate-800 font-semibold' : 'text-slate-400 font-medium'
              }`}
            >
              Select a study template tile below to build a dedicated course notebook instantly, or scroll to organize your current active repositories.
            </motion.p>
          </div>

          {/* Action Tiles Grid - Beautiful, wide cockpit grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full relative z-10"
          >
            {[
              {
                title: "Upload & Analyze",
                desc: "Drop your syllabus or lecture recordings.",
                icon: UploadCloud,
                color: "from-purple-600/10 to-indigo-600/5 border-purple-500/20 text-purple-500",
                buttonText: "Create Notebook"
              },
              {
                title: "Exam Prep",
                desc: "Generate a practice quiz from my notes.",
                icon: HelpCircle,
                color: "from-pink-600/10 to-purple-600/5 border-pink-500/15 text-pink-500",
                buttonText: "Start Prep"
              },
              {
                title: "Paper Assistant",
                desc: "Help me cite and structure my research paper.",
                icon: FileText,
                color: "from-blue-600/10 to-indigo-600/5 border-blue-500/15 text-blue-500",
                buttonText: "Structure Draft"
              },
              {
                title: "Brainstorm",
                desc: "Generate a mind map for this topic.",
                icon: Compass,
                color: "from-violet-600/10 to-purple-600/5 border-violet-500/15 text-violet-500",
                buttonText: "Explore Ideas"
              }
            ].map((tile) => (
              <motion.div
                key={tile.title}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.025,
                  y: -4,
                  borderColor: "rgba(168, 85, 247, 0.45)",
                  boxShadow: isLight 
                    ? "0 10px 25px rgba(124, 58, 237, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.8)" 
                    : "0 10px 30px rgba(168, 85, 247, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.08)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTileClick(tile.title)}
                className={`group flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 backdrop-blur-md cursor-pointer h-48 text-left ${
                  isLight 
                    ? 'bg-white/45 hover:bg-white/60 border-slate-200/40 shadow-sm shadow-purple-950/[0.01] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]' 
                    : 'bg-[#030305]/45 hover:bg-[#0c0c14]/65 border-white/5 text-purple-400 shadow-xl shadow-purple-950/[0.01] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]'
                }`}
              >
                <div>
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                    isLight 
                      ? 'bg-purple-50 border-purple-100 text-purple-600 group-hover:bg-purple-100/80 group-hover:text-purple-700 shadow-sm' 
                      : 'bg-black/60 border-white/5 text-purple-400 group-hover:border-purple-500/30 group-hover:text-purple-300 shadow-inner'
                  }`}>
                    <tile.icon className="h-5 w-5" />
                  </div>
                  <h3 className={`text-sm md:text-base font-bold mb-1 group-hover:text-purple-500 transition-colors ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>{tile.title}</h3>
                  <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{tile.desc}</p>
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-mono group-hover:underline mt-4 font-bold ${
                  isLight ? 'text-purple-700' : 'text-purple-400'
                }`}>
                  <span>{tile.buttonText}</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Notebooks Library Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-purple-500" />
              <h2 className={`text-xl font-display font-bold transition-colors duration-500 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>Your Notebooks</h2>
              <span className={`text-xs font-mono border px-2.5 py-0.5 rounded-full transition-all ${
                isLight 
                  ? 'bg-gray-100 text-slate-700 border-gray-200 font-semibold' 
                  : 'bg-[#141420] text-gray-400 border-white/5'
              }`}>
                {selectedTagFilter || searchQuery.trim() ? `${filteredNotebooks.length} shown` : `${notebooks.length} total`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Segmented control for Grid vs List View */}
              <div className={`flex items-center p-1 rounded-xl border backdrop-blur-xl ${
                isLight 
                  ? 'bg-slate-100/60 border-slate-200/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]' 
                  : 'bg-black/40 border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]'
              }`}>
                <button
                  id="view_mode_grid"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? isLight
                        ? 'bg-white text-purple-600 shadow-sm border border-slate-200/40'
                        : 'bg-white/10 text-purple-300 shadow-inner border border-white/[0.08]'
                      : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  id="view_mode_list"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? isLight
                        ? 'bg-white text-purple-600 shadow-sm border border-slate-200/40'
                        : 'bg-white/10 text-purple-300 shadow-inner border border-white/[0.08]'
                      : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>

              <motion.button 
                id="new_notebook_btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 py-2 px-4 rounded-xl border border-purple-500/30 hover:border-purple-500 bg-purple-500/10 hover:bg-purple-600 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm shadow-purple-500/10 h-[38px]"
              >
                <Plus className="h-4 w-4" />
                <span>New Notebook</span>
              </motion.button>
            </div>
          </div>

          {/* Tag Filter and Sort Bar */}
          <div className={`p-4 rounded-xl border backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-500 ${
            isLight 
              ? 'border-slate-200/40 bg-white/45 shadow-sm' 
              : 'border-white/[0.05] bg-[#0c0c14]/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]'
          }`}>
            {/* Filter by Tag Section */}
            <div className="flex flex-col gap-2 text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                <Filter className="h-3.5 w-3.5 text-purple-500" />
                <span>Filter by Tag</span>
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                {/* "All" filter button */}
                <button
                  type="button"
                  onClick={() => setSelectedTagFilter('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    selectedTagFilter === ''
                      ? 'bg-purple-600 border-purple-500 text-white font-bold shadow-md animate-pulse'
                      : isLight
                        ? 'bg-white hover:bg-gray-150 border-gray-300 text-gray-700'
                        : 'bg-black/35 hover:bg-white/5 border-white/10 text-gray-400'
                  }`}
                >
                  All ({notebooks.length})
                </button>
                {/* Dynamically compiled tags from notebooks list */}
                {allUniqueTags.map((tag) => {
                  const count = notebooks.filter(n => (n.tags || []).includes(tag)).length;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTagFilter(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        selectedTagFilter === tag
                          ? 'bg-purple-600 border-purple-500 text-white font-bold shadow-md'
                          : isLight
                            ? 'bg-white hover:bg-gray-150 border-gray-300 text-gray-700 hover:border-purple-300'
                            : 'bg-black/35 hover:bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/20'
                      }`}
                    >
                      <Tag className="h-3 w-3 opacity-60 text-purple-400" />
                      <span>{tag}</span>
                      <span className="text-[10px] font-bold opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort & Search Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Sort selector dropdown */}
              <div className="flex flex-col gap-1 text-left w-full sm:w-auto">
                <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500">Sort By</span>
                <select
                  id="notebook_sort_select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all cursor-pointer ${
                    isLight
                      ? 'border-gray-300 bg-white text-gray-700'
                      : 'border-white/10 bg-black/40 text-gray-300'
                  }`}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Alphabetical (A-Z)</option>
                  <option value="name-desc">Alphabetical (Z-A)</option>
                  <option value="sources-desc">Most Sources</option>
                  <option value="cards-desc">Most Flashcards</option>
                </select>
              </div>

              {/* Tag text search/filter (for quick custom queries) */}
              <div className="flex flex-col gap-1 text-left w-full sm:w-44">
                <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500">Search Library</span>
                <input
                  id="notebook_search_input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, tags..."
                  className={`px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-purple-500/20 transition-all ${
                    isLight
                      ? 'border-gray-300 bg-white text-gray-700 placeholder-gray-400 focus:border-purple-500'
                      : 'border-white/10 bg-black/40 text-gray-300 placeholder-gray-600 focus:border-purple-500/40'
                  }`}
                />
              </div>
            </div>
          </div>

          <motion.div 
            id="notebooks_grid" 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
              : "flex flex-col gap-3"
            }
          >
            {filteredNotebooks.map((nb, index) => {
              const isSelected = selectedIds.includes(nb.id);
              const isDragged = draggedIndex === index;
              const isOver = dragOverIndex === index;

              return (
                <motion.div
                  key={nb.id}
                  variants={itemVariants}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  whileHover={{ 
                    y: -6,
                    scale: 1.018,
                    borderColor: isSelected ? "rgba(168, 85, 247, 0.7)" : "rgba(168, 85, 247, 0.45)",
                    boxShadow: isLight
                      ? "0 20px 25px -5px rgba(109, 40, 217, 0.08), 0 10px 10px -5px rgba(109, 40, 217, 0.04)"
                      : "0 25px 35px -10px rgba(168, 85, 247, 0.22), 0 12px 15px -5px rgba(168, 85, 247, 0.1)"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  onClick={() => onSelectNotebook(nb.id)}
                  className={`group relative flex ${
                    viewMode === 'list' ? 'flex-row items-stretch h-28 md:h-32' : 'flex-col justify-between'
                  } rounded-xl border backdrop-blur-md transition-all overflow-hidden ${
                    isDragged ? 'opacity-30 scale-95 border-dashed border-purple-500/50' : ''
                  } ${
                    isOver ? 'ring-2 ring-purple-500 border-purple-500 scale-[1.01] shadow-xl z-20' : ''
                  } ${
                    isSelected
                      ? isLight
                        ? 'border-purple-400 bg-purple-50/20 shadow-md ring-1 ring-purple-400/30'
                        : 'border-purple-500 bg-purple-950/20 shadow-md ring-1 ring-purple-500/30'
                      : isLight 
                        ? 'border-slate-200/40 bg-white/45 hover:border-purple-300 shadow-sm shadow-purple-900/[0.01] hover:bg-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]' 
                        : 'border-white/5 hover:border-purple-500/25 bg-[#030305]/45 hover:bg-[#0c0c14]/65 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]'
                  } cursor-grab active:cursor-grabbing`}
                >
                  {/* Visual Cover Thumbnail Banner */}
                  <div className={`${
                    viewMode === 'list' ? 'h-full w-28 md:w-36 border-r shrink-0' : 'h-28 w-full border-b'
                  } relative overflow-hidden border-purple-500/10`}>
                    <NotebookThumbnail seed={nb.id} name={nb.name} isLight={isLight} />
                    
                    {/* Checkbox Overlay */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(nb.id);
                      }}
                      className={`absolute top-2.5 left-2.5 flex h-5 w-5 items-center justify-center rounded-md border transition-all cursor-pointer z-20 ${
                        isSelected
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md scale-105'
                          : isLight
                            ? 'bg-white/80 backdrop-blur-sm border-gray-300 text-transparent hover:border-purple-400 hover:bg-white'
                            : 'bg-black/40 backdrop-blur-sm border-white/20 text-transparent hover:border-purple-400 hover:bg-black/60'
                      }`}
                      title={isSelected ? "Deselect Notebook" : "Select Notebook"}
                    >
                      <Check className={`h-3 w-3 stroke-[3.5] transition-transform duration-150 ${
                        isSelected ? 'scale-110 opacity-100' : 'scale-75 opacity-0'
                      }`} />
                    </div>

                    {/* Floating book icon indicator on cover */}
                    <div className="absolute bottom-2.5 left-3 flex h-6 w-6 items-center justify-center rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-md">
                      <BookOpen className="h-3.5 w-3.5 text-purple-300" />
                    </div>

                    {/* Circular Progress overlay if there are flashcards */}
                    {nb.flashcards && nb.flashcards.length > 0 && (
                      <div className="absolute bottom-2.5 right-3 z-10 scale-[0.8] md:scale-[0.85] origin-bottom-right">
                        <CircularProgress 
                          reviewed={nb.flashcards.filter(fc => fc.reviewed).length} 
                          total={nb.flashcards.length} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Notebook details inside padding */}
                  <div className={`p-4 md:p-5 flex-1 flex flex-col justify-between overflow-hidden ${
                    viewMode === 'list' ? 'space-y-1.5' : 'space-y-4'
                  }`}>
                    <div className="space-y-1 flex-1 overflow-hidden">
                      <h3 className={`text-sm md:text-base font-bold group-hover:text-purple-600 transition-colors line-clamp-1 ${
                        isLight ? 'text-slate-900' : 'text-gray-100'
                      }`}>
                        {nb.name}
                      </h3>
                      <p className={`text-xs ${
                        viewMode === 'list' ? 'line-clamp-1 md:line-clamp-2' : 'line-clamp-2'
                      } leading-relaxed ${
                        isLight ? 'text-slate-700 font-medium' : 'text-gray-400'
                      }`}>
                        {nb.description || "No description provided."}
                      </p>
                    </div>
                    
                    {/* Completion Progress Indicator */}
                    {nb.flashcards && nb.flashcards.length > 0 ? (() => {
                      const totalCards = nb.flashcards.length;
                      const masteredCards = nb.flashcards.filter(fc => fc.reviewed).length;
                      const percentage = Math.round((masteredCards / totalCards) * 100);
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] md:text-[10px]">
                            <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                              Mastered Progress
                            </span>
                            <span className={`font-bold font-mono ${percentage === 100 ? 'text-emerald-500 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
                              {masteredCards}/{totalCards} ({percentage}%)
                            </span>
                          </div>
                          <div className={`h-1.5 w-full rounded-full overflow-hidden relative ${
                            isLight ? 'bg-slate-100 border border-slate-200/40' : 'bg-black/40 border border-white/5'
                          }`}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full relative transition-all duration-500 ${
                                percentage === 100 
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                                  : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] md:text-[10px]">
                          <span className={`font-medium ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                            No flashcards yet
                          </span>
                          <span className={`font-bold font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                            0%
                          </span>
                        </div>
                        <div className={`h-1.5 w-full rounded-full overflow-hidden relative ${
                          isLight ? 'bg-slate-100 border border-slate-200/40' : 'bg-black/40 border border-white/5'
                        }`}>
                          <div className="h-full w-0 bg-gray-400 rounded-full" />
                        </div>
                      </div>
                    )}
                    
                    {/* Tags List */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(nb.tags || []).map((tag) => (
                        <span 
                          key={tag}
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-md transition-all ${
                            isLight
                              ? 'bg-purple-50 text-purple-600 border border-purple-100 font-semibold shadow-xs'
                              : 'bg-purple-500/10 text-purple-300 border border-purple-500/15 shadow-xs'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                      {(nb.tags || []).length === 0 && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNotebook(nb);
                            setEditingTagsInput('');
                          }}
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-md border border-dashed transition-all cursor-pointer opacity-40 hover:opacity-100 hover:border-purple-400 hover:text-purple-400 ${
                            isLight ? 'border-gray-300 text-gray-500 bg-transparent' : 'border-white/10 text-gray-400 bg-transparent'
                          }`}
                        >
                          + tag
                        </button>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-4 text-[9px] md:text-[10px] font-mono pt-2.5 border-t ${
                      isLight ? 'border-gray-100 text-slate-600 font-semibold' : 'border-white/5 text-gray-500'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-purple-500/80" />
                        {nb.sources.length} sources
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-purple-500/80" />
                        {nb.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Absolute Floating actions overlaying card on hover */}
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-10">
                    <div 
                      className={`p-1.5 rounded border shadow-md cursor-grab active:cursor-grabbing transition-all ${
                        isLight 
                          ? 'bg-white border-gray-200 text-slate-500 hover:text-purple-600 hover:border-purple-300' 
                          : 'bg-[#161622]/90 border-white/10 text-gray-400 hover:text-purple-400 hover:border-purple-500/30'
                      }`}
                      title="Drag Card to Reorder"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </div>

                    <button 
                      id={`edit_tags_notebook_${nb.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNotebook(nb);
                        setEditingTagsInput((nb.tags || []).join(', '));
                      }}
                      className={`p-1.5 rounded border shadow-md transition-all cursor-pointer ${
                        isLight 
                          ? 'bg-white hover:bg-purple-50 border-gray-200 text-slate-700 hover:text-purple-500' 
                          : 'bg-[#161622]/90 hover:bg-purple-500/20 border-white/10 text-gray-400 hover:text-purple-400'
                      }`}
                      title="Edit Tags"
                    >
                      <Tag className="h-3.5 w-3.5" />
                    </button>

                    <button 
                      id={`delete_notebook_${nb.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotebook(nb.id);
                      }}
                      className={`p-1.5 rounded border shadow-md transition-all cursor-pointer ${
                        isLight 
                          ? 'bg-white hover:bg-red-50 border-gray-200 text-slate-700 hover:text-red-500' 
                          : 'bg-[#161622]/90 hover:bg-red-500/20 border-white/10 text-gray-400 hover:text-red-400'
                      }`}
                      title="Delete Notebook"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {notebooks.length > 0 && filteredNotebooks.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`col-span-full w-full flex flex-col items-center justify-center p-12 rounded-xl border border-dashed text-center space-y-4 ${
                  isLight 
                    ? 'border-purple-200 bg-purple-50/20' 
                    : 'border-purple-500/10 bg-purple-500/5'
                }`}
              >
                <Filter className="h-10 w-10 text-purple-400/80 animate-bounce" />
                <div>
                  <h4 className={`text-sm font-semibold ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>No notebooks match your filters</h4>
                  <p className="text-xs text-gray-500 mt-1">Try clearing your search query or selecting a different tag filter.</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedTagFilter('');
                    setSearchQuery('');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all cursor-pointer shadow-md"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}

            {notebooks.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`w-full flex flex-col items-center justify-center p-12 rounded-xl border border-dashed text-center space-y-4 ${
                  isLight 
                    ? 'border-purple-200 bg-purple-50/20' 
                    : 'border-purple-500/10 bg-purple-500/5'
                }`}
              >
                <BookOpen className="h-10 w-10 text-purple-400/80 animate-pulse" />
                <div>
                  <h4 className={`text-sm font-semibold ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>No active notebooks</h4>
                  <p className="text-xs text-gray-500 mt-1">Get started by creating a notebook or clicking a quick tile.</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Create Your First Notebook
                </button>
              </motion.div>
            )}
          </motion.div>
        </section>
      </main>

      {/* CREATE NOTEBOOK MODAL with smooth backdrop fade and scale transition */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: isLight ? 0.4 : 0.8 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black" 
              onClick={() => setShowCreateModal(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 22, stiffness: 150 }}
              className={`relative w-full max-w-md p-6 rounded-xl border shadow-2xl space-y-6 z-10 transition-colors duration-500 ${
                isLight 
                  ? 'border-purple-100 bg-white text-gray-900' 
                  : 'border-purple-500/20 bg-[#0C0C14] text-white'
              }`}
            >
              <div>
                <h3 className={`text-lg font-display font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Create Study Notebook</h3>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Give your notebook a clear subject name to organize sources.</p>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className={`block text-[10px] font-mono uppercase tracking-widest mb-1.5 ${
                    isLight ? 'text-gray-500' : 'text-gray-400'
                  }`}>Notebook Name</label>
                  <input 
                    id="create_nb_name"
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Biology Midterm, Art History Research"
                    required
                    className={`w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                      isLight 
                        ? 'border-gray-200 focus:border-purple-500 bg-gray-50 text-gray-900 placeholder-gray-400' 
                        : 'border-purple-500/15 focus:border-purple-500 bg-[#07070B] text-gray-100 placeholder-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-mono uppercase tracking-widest mb-1.5 ${
                    isLight ? 'text-gray-500' : 'text-gray-400'
                  }`}>Description (Optional)</label>
                  <textarea 
                    id="create_nb_desc"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Briefly describe what lectures or exams this covers..."
                    rows={3}
                    className={`w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none ${
                      isLight 
                        ? 'border-gray-200 focus:border-purple-500 bg-gray-50 text-gray-900 placeholder-gray-400' 
                        : 'border-purple-500/15 focus:border-purple-500 bg-[#07070B] text-gray-100 placeholder-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-mono uppercase tracking-widest mb-1.5 ${
                    isLight ? 'text-gray-500' : 'text-gray-400'
                  }`}>Tags (Optional, comma-separated)</label>
                  <input 
                    id="create_nb_tags"
                    type="text" 
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="e.g., Biology, Midterm, Science"
                    className={`w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                      isLight 
                        ? 'border-gray-200 focus:border-purple-500 bg-gray-50 text-gray-900 placeholder-gray-400' 
                        : 'border-purple-500/15 focus:border-purple-500 bg-[#07070B] text-gray-100 placeholder-gray-600'
                    }`}
                  />
                  <p className="text-[9px] text-gray-500 mt-1">Separate multiple tags with commas.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isLight 
                        ? 'border-gray-200 hover:bg-gray-50 text-gray-500' 
                        : 'border-white/5 hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    id="submit_create_nb"
                    type="submit" 
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm shadow-purple-500/15"
                  >
                    Create Notebook
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT TAGS MODAL with same high-quality motion effects */}
      <AnimatePresence>
        {editingNotebook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: isLight ? 0.4 : 0.8 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black" 
              onClick={() => setEditingNotebook(null)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 22, stiffness: 150 }}
              className={`relative w-full max-w-md p-6 rounded-xl border shadow-2xl space-y-6 z-10 transition-colors duration-500 ${
                isLight 
                  ? 'border-purple-100 bg-white text-gray-900' 
                  : 'border-purple-500/20 bg-[#0C0C14] text-white'
              }`}
            >
              <div>
                <h3 className={`text-lg font-display font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Manage Notebook Tags</h3>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  Update subject tags for <span className="font-bold text-purple-500">{editingNotebook.name}</span>.
                </p>
              </div>

              <div className="space-y-4">
                {/* Current tags display pill list */}
                <div className="space-y-1.5 text-left">
                  <span className={`block text-[10px] font-mono uppercase tracking-widest ${
                    isLight ? 'text-slate-500' : 'text-gray-400'
                  }`}>Current Tags</span>
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border min-h-[44px] items-center bg-black/10 dark:bg-white/5 border-purple-500/10">
                    {(editingNotebook.tags || []).length > 0 ? (
                      (editingNotebook.tags || []).map(tag => (
                        <span 
                          key={tag}
                          className="text-[10px] font-mono bg-purple-500/15 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold"
                        >
                          <span>#{tag}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              const updatedTags = (editingNotebook.tags || []).filter(t => t !== tag);
                              const updated = { ...editingNotebook, tags: updatedTags };
                              setEditingNotebook(updated);
                              setEditingTagsInput(updatedTags.join(', '));
                              if (onUpdateNotebook) {
                                onUpdateNotebook(updated);
                              }
                            }}
                            className="text-purple-400 hover:text-red-400 font-black ml-1 text-xs leading-none"
                            title="Remove tag"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-mono text-gray-500 italic pl-1">No tags set yet</span>
                    )}
                  </div>
                </div>

                <div className="text-left">
                  <label className={`block text-[10px] font-mono uppercase tracking-widest mb-1.5 ${
                    isLight ? 'text-gray-500' : 'text-gray-400'
                  }`}>Enter Tags (comma-separated)</label>
                  <input 
                    id="edit_nb_tags_input"
                    type="text" 
                    value={editingTagsInput}
                    onChange={(e) => setEditingTagsInput(e.target.value)}
                    placeholder="e.g., Biology, Midterm, Science"
                    className={`w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${
                      isLight 
                        ? 'border-gray-200 focus:border-purple-500 bg-gray-50 text-gray-900 placeholder-gray-400' 
                        : 'border-purple-500/15 focus:border-purple-500 bg-[#07070B] text-gray-100 placeholder-gray-600'
                    }`}
                  />
                  <p className="text-[9px] text-gray-500 mt-1">Type tags separated by commas. Changes will apply immediately on Save.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingNotebook(null)}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isLight 
                        ? 'border-gray-200 hover:bg-gray-50 text-gray-500' 
                        : 'border-white/5 hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    id="submit_edit_tags"
                    type="button"
                    onClick={() => {
                      const parsedTags = editingTagsInput
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t.length > 0);
                      const updated = { ...editingNotebook, tags: parsedTags };
                      if (onUpdateNotebook) {
                        onUpdateNotebook(updated);
                      }
                      setEditingNotebook(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all cursor-pointer shadow-md"
                  >
                    Save Tags
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Study Streak Notification Toast */}
      <AnimatePresence>
        {streakNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none"
          >
            <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl pointer-events-auto ${
              isLight 
                ? 'bg-amber-50 border-amber-200 text-amber-950 shadow-amber-950/10' 
                : 'bg-amber-950/90 border-amber-500/30 text-amber-200 shadow-black/80'
            }`}>
              <Flame className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1 text-left">
                <p className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-500">Streak Reward System</p>
                <p className="text-xs font-semibold leading-relaxed mt-1">{streakNotification}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STUDY STREAK GAMIFIED MODAL */}
      <AnimatePresence>
        {showStreakModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: isLight ? 0.45 : 0.85 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black backdrop-blur-sm" 
              onClick={() => setShowStreakModal(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 140 }}
              className={`relative w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-6 z-10 transition-colors duration-500 overflow-hidden ${
                isLight 
                  ? 'border-amber-100 bg-white text-gray-900 shadow-amber-900/10' 
                  : 'border-amber-500/20 bg-[#0C0C14] text-white shadow-black/90'
              }`}
            >
              {/* Glowing Ambient light background inside modal */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Header */}
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isLight ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    <Flame className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-display font-extrabold tracking-tight">Study Streak Room</h3>
                    <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Gamify and build your daily study habit!</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowStreakModal(false)}
                  className={`text-xs font-mono font-bold hover:underline transition-all cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Close
                </button>
              </div>

              {/* Big Streak Counter View */}
              <div className={`p-5 rounded-xl border text-center relative overflow-hidden flex flex-col items-center justify-center space-y-2.5 ${
                isLight ? 'bg-amber-50/50 border-amber-100' : 'bg-amber-500/5 border-amber-500/10'
              }`}>
                <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase font-bold">CURRENT LEARNING STREAK</span>
                <div className="flex items-baseline justify-center gap-1">
                  <motion.span 
                    key={streak}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 filter drop-shadow-[0_2px_15px_rgba(245,158,11,0.25)]"
                  >
                    {streak}
                  </motion.span>
                  <span className="text-base font-bold text-amber-500">Days</span>
                </div>
                <p className={`text-[11px] leading-relaxed max-w-xs ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  Last session: <span className="font-mono font-bold text-amber-500">{lastStudyDate || "Never"}</span>. Keep learning to expand your streak!
                </p>
              </div>

              {/* Weekly Tracker Calendar Grid */}
              <div className="space-y-2.5 text-left">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">Weekly Check-in Calendar</span>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { id: 'M', label: 'Mon', active: streak >= 1 },
                    { id: 'T', label: 'Tue', active: streak >= 2 },
                    { id: 'W', label: 'Wed', active: streak >= 3 },
                    { id: 'T', label: 'Thu', active: streak >= 4 },
                    { id: 'F', label: 'Fri', active: streak >= 5 },
                    { id: 'S', label: 'Sat', active: streak >= 6 },
                    { id: 'S', label: 'Sun', active: streak >= 7 },
                  ].map((day, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                        day.active
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-500 font-bold shadow-[0_2px_8px_rgba(245,158,11,0.1)]'
                          : isLight 
                            ? 'border-slate-100 bg-slate-50 text-slate-400' 
                            : 'border-white/5 bg-white/2 text-gray-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{day.label}</span>
                      <div className="mt-1 flex items-center justify-center">
                        <Flame className={`h-4 w-4 ${
                          day.active 
                            ? 'text-amber-500 fill-amber-500 animate-[pulse_1.5s_infinite]' 
                            : 'text-slate-500 opacity-20'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button to log study */}
              <div className="space-y-3 text-left">
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const alreadyStudied = lastStudyDate === todayStr;
                  
                  return (
                    <motion.button
                      whileHover={alreadyStudied ? {} : { scale: 1.02 }}
                      whileTap={alreadyStudied ? {} : { scale: 0.98 }}
                      onClick={() => handleLogStudy()}
                      disabled={alreadyStudied}
                      className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                        alreadyStudied
                          ? isLight
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-none cursor-default'
                            : 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 shadow-none cursor-default'
                          : 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white hover:from-amber-400 hover:to-yellow-400 cursor-pointer hover:shadow-amber-500/20'
                      }`}
                    >
                      {alreadyStudied ? (
                        <>
                          <Check className="h-4.5 w-4.5 stroke-[3]" />
                          <span>Today's Session Logged Successfully</span>
                        </>
                      ) : (
                        <>
                          <Flame className="h-4.5 w-4.5 animate-bounce" />
                          <span>Log Today's Study Session</span>
                        </>
                      )}
                    </motion.button>
                  );
                })()}
              </div>

              {/* Achievement badges */}
              <div className="space-y-3.5 text-left pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">Scholar Achievements</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { threshold: 3, label: 'Apprentice Scholar', icon: '📖', desc: 'Study 3 days' },
                    { threshold: 5, label: 'Consistent Mind', icon: '🧠', desc: 'Study 5 days' },
                    { threshold: 10, label: 'Academic Overlord', icon: '👑', desc: 'Study 10 days' },
                    { threshold: 30, label: 'PocketLM Immortal', icon: '🌌', desc: 'Study 30 days' },
                  ].map((ach) => {
                    const unlocked = streak >= ach.threshold;
                    return (
                      <div 
                        key={ach.threshold}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border transition-all ${
                          unlocked
                            ? isLight 
                              ? 'bg-purple-50 border-purple-100 text-purple-950' 
                              : 'bg-purple-950/20 border-purple-500/20 text-purple-200'
                            : isLight 
                              ? 'bg-gray-50 border-gray-100 opacity-60 text-gray-450' 
                              : 'bg-white/2 border-white/2 opacity-50 text-gray-500'
                        }`}
                      >
                        <span className="text-base">{unlocked ? ach.icon : '🔒'}</span>
                        <div className="text-left leading-tight">
                          <p className="text-[11px] font-bold truncate">{ach.label}</p>
                          <p className={`text-[9px] mt-0.5 ${unlocked ? 'text-purple-400 font-semibold' : ''}`}>{ach.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Developer Testing / Simulation sandbox */}
              <div className={`p-4 rounded-xl border text-left space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200/60' : 'bg-white/2 border-white/5'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-purple-400 tracking-wider">DEV SPEEDRUN SANDBOX</span>
                  <span className="text-[9px] font-mono text-gray-500 uppercase">Test Progression</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Normally streaks increment once every 24h. Click "Fast-Forward" to simulate a new day so you can test multi-day increment mechanics instantly!
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSimulateNextDay}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/40 text-[10px] font-mono text-purple-400 font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    ⏩ Fast-Forward 1 Day
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStreak(0);
                      setLastStudyDate('');
                      localStorage.removeItem('pocketlm_study_streak');
                      localStorage.removeItem('pocketlm_last_study_date');
                      setStreakNotification("Streak reset to 0! Start a new streak now.");
                      setTimeout(() => setStreakNotification(null), 3000);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-[10px] font-mono text-red-400 font-bold tracking-wider transition-all cursor-pointer"
                  >
                    Reset Run
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
          >
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-colors ${
              isLight 
                ? 'bg-white/95 border-purple-200 text-slate-900 shadow-purple-900/10' 
                : 'bg-[#0E0E16]/95 border-purple-500/20 text-white shadow-black/80'
            }`}>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/35">
                  <span className="text-xs font-mono font-bold text-purple-400">{selectedIds.length}</span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold font-display tracking-tight">
                    {selectedIds.length === 1 ? '1 notebook selected' : `${selectedIds.length} notebooks selected`}
                  </p>
                  <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Bulk actions available</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={selectedIds.length === notebooks.length ? handleDeselectAll : handleSelectAll}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isLight 
                      ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 text-slate-700' 
                      : 'border-white/5 hover:border-purple-500/20 hover:bg-[#161622] text-gray-300'
                  }`}
                >
                  {selectedIds.length === notebooks.length ? 'Deselect All' : 'Select All'}
                </button>

                {showConfirmDelete ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Confirm</span>
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isLight ? 'border-gray-200 text-slate-700' : 'border-white/5 text-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete Selected</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
