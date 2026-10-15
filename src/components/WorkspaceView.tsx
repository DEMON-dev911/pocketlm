import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, GraduationCap, Layout, Sparkles, 
  EyeOff, Eye, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  FileDown, Printer, Download, Check, FileText, Flame, BookOpen, Headphones, BrainCircuit
} from 'lucide-react';
import { Notebook, Source, Message, Flashcard, PodcastTurn } from '../types';
import SourceManager from './SourceManager';
import AIChat from './AIChat';
import StudyKit from './StudyKit';
import ThemeToggle from './ThemeToggle';
import StudyTimer from './StudyTimer';

// Helper to extract dynamic study concepts based on source name and content
const getConceptsForSource = (src: Source) => {
  const cleanName = src.name.replace(/\.[^/.]+$/, "");
  const lowerName = cleanName.toLowerCase();
  if (lowerName.includes('bio') || lowerName.includes('cell') || lowerName.includes('midterm')) {
    return ['ATP Synthesis', 'Krebs Cycle', 'Mitochondrial DNA'];
  } else if (lowerName.includes('course') || lowerName.includes('syll') || lowerName.includes('guide')) {
    return ['Grading Policy', 'Weekly Readings', 'Exam Rubric'];
  } else if (lowerName.includes('thesis') || lowerName.includes('research') || lowerName.includes('cite')) {
    return ['Literature Review', 'APA Bibliography', 'Abstract Drafting'];
  } else if (lowerName.includes('write') || lowerName.includes('creative') || lowerName.includes('idea')) {
    return ['Narrative Arc', 'Character Design', 'Theme Development'];
  }
  
  const words = cleanName.split(/\s+/).filter(w => w.length > 3 && !['prep', 'room', 'note', 'document', 'file', 'text', 'study'].includes(w.toLowerCase()));
  if (words.length >= 2) {
    return [`${words[0]} Theory`, `${words[1]} Analysis`, 'Core Applications'];
  } else if (words.length === 1) {
    return [`${words[0]} Theory`, `Advanced ${words[0]}`, 'Case Studies'];
  }
  return ['Primary Thesis', 'Key Argument', 'Historical Impact'];
};


interface WorkspaceViewProps {
  notebook: Notebook;
  onBackToDashboard: () => void;
  onUpdateNotebook: (updated: Notebook) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export default function WorkspaceView({
  notebook,
  onBackToDashboard,
  onUpdateNotebook,
  theme = 'dark',
  onToggleTheme = () => {}
}: WorkspaceViewProps) {
  // Focus states
  const [focusMode, setFocusMode] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // API Call states
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);

  // PDF Study Guide Exporter states
  const [showExportModal, setShowExportModal] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<{ tldr: string; takeaways: string[] } | null>(null);
  const [pdfTheme, setPdfTheme] = useState<'academic' | 'tech' | 'classic'>('academic');
  const [exportOptions, setExportOptions] = useState({
    includeCover: true,
    includeSummary: true,
    includeGraph: true,
    includeNotes: true,
    includeFlashcards: true,
    includePodcast: true
  });


  // Auto-collapse sidebars on smaller screens on mount
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsLeftCollapsed(true);
      setIsRightCollapsed(true);
    }
  }, []);

  const activeSources = notebook.sources.filter(s => s.active);

  // Toggle single source active/inactive
  const handleToggleSource = (sourceId: string) => {
    const updatedSources = notebook.sources.map(src => {
      if (src.id === sourceId) {
        return { ...src, active: !src.active };
      }
      return src;
    });

    onUpdateNotebook({
      ...notebook,
      sources: updatedSources
    });
  };

  // Add new source to notebook
  const handleAddSource = (name: string, content: string, type: 'pdf' | 'doc' | 'text' | 'url') => {
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const newSource: Source = {
      id: `src-${Date.now()}`,
      name,
      content,
      type,
      active: true,
      wordCount
    };

    onUpdateNotebook({
      ...notebook,
      sources: [...notebook.sources, newSource]
    });
  };

  // Trigger server API chat call
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGeneratingChat) return;

    // 1. Add user message to history
    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentHistory = [...notebook.chatHistory, userMessage];
    
    onUpdateNotebook({
      ...notebook,
      chatHistory: currentHistory
    });

    setIsGeneratingChat(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sources: notebook.sources,
          chatHistory: notebook.chatHistory
        })
      });

      if (!response.ok) {
        throw new Error('Chat API returned error state');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations
      };

      onUpdateNotebook({
        ...notebook,
        chatHistory: [...currentHistory, aiMessage]
      });

    } catch (error) {
      console.error("Workspace Chat Error:", error);
      
      const errorMessage: Message = {
        id: `msg-error-${Date.now()}`,
        role: 'assistant',
        content: "⚠️ **PocketLM system note:** We encountered an error while synthesizing your response. Please verify your connection or try again shortly.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      onUpdateNotebook({
        ...notebook,
        chatHistory: [...currentHistory, errorMessage]
      });
    } finally {
      setIsGeneratingChat(false);
    }
  };

  // API summarizes active sources
  const handleGenerateStudyGuide = async () => {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources: notebook.sources })
    });
    if (!response.ok) throw new Error('Summarization failed');
    const data = await response.json();
    setGeneratedSummary(data);
    return data;
  };


  // API generates 5 flashcards from active sources
  const handleGenerateQuiz = async () => {
    const response = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources: notebook.sources })
    });
    if (!response.ok) throw new Error('Quiz generation failed');
    
    const cards = await response.json();
    onUpdateNotebook({
      ...notebook,
      flashcards: cards
    });
    return cards;
  };

  // API generates dual-host audio podcast transcript
  const handleGeneratePodcast = async () => {
    const response = await fetch('/api/podcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources: notebook.sources })
    });
    if (!response.ok) throw new Error('Podcast generation failed');

    const turns = await response.json();
    onUpdateNotebook({
      ...notebook,
      podcastTurns: turns
    });
    return turns;
  };

  const toggleFocusMode = () => {
    const nextVal = !focusMode;
    setFocusMode(nextVal);
    setIsLeftCollapsed(nextVal);
    setIsRightCollapsed(nextVal);
  };

  const handleUpdateFlashcards = (updatedCards: Flashcard[]) => {
    onUpdateNotebook({
      ...notebook,
      flashcards: updatedCards
    });
  };

  const isLight = theme === 'light';

  return (
    <div id="workspace_container" className={`min-h-screen flex flex-col overflow-hidden transition-colors duration-500 ${
      isLight ? 'bg-white text-gray-800' : 'bg-[#070709] text-gray-100'
    }`}>
      
      {/* Workspace Header Panel with Edge-to-Edge Liquid Glass styling */}
      <header className={`sticky top-0 z-40 transition-all duration-500 backdrop-blur-[24px] px-6 py-3.5 border-b relative overflow-hidden shadow-lg ${
        isLight 
          ? 'border-white/50 bg-white/60 shadow-purple-950/[0.01] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),_inset_0_-1px_1px_rgba(255,255,255,0.3)]' 
          : 'border-white/[0.07] bg-[#09090E]/60 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15),_inset_0_-1px_1px_rgba(255,255,255,0.05)]'
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

        <div className="max-w-full mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              id="back_to_dashboard"
              onClick={onBackToDashboard}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border transition-all cursor-pointer ${
                isLight 
                  ? 'border-gray-200 hover:border-purple-300 hover:bg-gray-50 text-gray-500 hover:text-gray-900 text-xs font-semibold' 
                  : 'border-purple-500/10 hover:border-purple-500/30 hover:bg-purple-500/5 text-gray-400 hover:text-white text-xs font-semibold'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <div className={`border-l h-6 hidden sm:block ${isLight ? 'border-gray-200' : 'border-purple-500/10'}`} />
            
            <div className="min-w-0">
              <h1 className={`text-sm font-semibold truncate ${isLight ? 'text-gray-900' : 'text-white'}`}>{notebook.name}</h1>
              <p className={`text-[10px] truncate hidden sm:block max-w-lg mt-0.5 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>{notebook.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Smooth Theme Switcher */}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            <div className={`border-l h-6 hidden md:block ${isLight ? 'border-gray-200' : 'border-purple-500/10'}`} />

            {/* Export formatted PDF Guide Button */}
            <button
              id="open_export_pdf_guide"
              onClick={() => setShowExportModal(true)}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                isLight 
                  ? 'border-purple-200 hover:border-purple-500 hover:bg-purple-50 text-purple-600 bg-white shadow-[0_2px_8px_rgba(168,85,247,0.05)]'
                  : 'border-purple-500/15 hover:border-purple-500/35 hover:bg-purple-500/5 text-purple-300 bg-transparent'
              }`}
              title="Export structured notes & knowledge graph as a printed study guide!"
            >
              <FileDown className="h-3.5 w-3.5 text-purple-500" />
              <span>Export PDF Guide</span>
            </button>

            {/* Focus Mode button */}
            <button
              id="toggle_focus_mode"
              onClick={toggleFocusMode}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                focusMode
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : isLight 
                    ? 'border-purple-200 hover:border-purple-500 hover:bg-purple-50 text-purple-600'
                    : 'border-purple-500/15 hover:border-purple-500/35 hover:bg-purple-500/5 text-purple-300'
              }`}
            >
              {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{focusMode ? 'Normal Mode' : 'Focus Study Mode'}</span>
            </button>

          </div>
        </div>
      </header>

      {/* THREE-COLUMN DYNAMIC GRID WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* COLUMN 1: LEFT SIDEBAR (KNOWLEDGE BASE SOURCES) */}
        <motion.aside
          initial={false}
          animate={{ 
            width: isLeftCollapsed ? 0 : 280, 
            opacity: isLeftCollapsed ? 0 : 1,
            padding: isLeftCollapsed ? "0px" : "20px"
          }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className={`shrink-0 border-r h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden z-10 relative transition-colors duration-500 ${
            isLight 
              ? 'border-gray-200 bg-white' 
              : 'border-purple-500/10 bg-[#09090D]'
          } ${
            isLeftCollapsed ? 'pointer-events-none border-r-0' : ''
          }`}
        >
          <SourceManager 
            sources={notebook.sources}
            onToggleSource={handleToggleSource}
            onAddSource={handleAddSource}
            theme={theme}
          />
        </motion.aside>

        {/* Small sliding latch to toggle Left sidebar manually */}
        <button
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 h-20 w-3 border border-l-0 rounded-r-md flex items-center justify-center cursor-pointer transition-all ${
            isLight 
              ? 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50' 
              : 'bg-[#11111B] border-purple-500/20 text-purple-400 hover:text-white hover:bg-purple-950/10'
          }`}
        >
          {isLeftCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* COLUMN 2: CENTER INTERACTIVE CHAT HUB */}
        <main className={`flex-1 p-5 h-[calc(100vh-65px)] overflow-hidden transition-colors duration-500 ${
          isLight ? 'bg-gray-50/50' : 'bg-[#060608]'
        }`}>
          <AIChat 
            notebookName={notebook.name}
            notebookDescription={notebook.description || "Grounded learning environment. Synthesize sources, test yourself, and search terms."}
            chatHistory={notebook.chatHistory}
            activeSources={activeSources}
            onSendMessage={handleSendMessage}
            onAddSource={handleAddSource}
            isGenerating={isGeneratingChat}
            theme={theme}
          />
        </main>

        {/* Small sliding latch to toggle Right sidebar manually */}
        <button
          onClick={() => setIsRightCollapsed(!isRightCollapsed)}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 h-20 w-3 border border-r-0 rounded-l-md flex items-center justify-center cursor-pointer transition-all ${
            isLight 
              ? 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50' 
              : 'bg-[#11111B] border-purple-500/20 text-purple-400 hover:text-white hover:bg-purple-950/10'
          }`}
        >
          {isRightCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        {/* COLUMN 3: RIGHT SIDEBAR (STUDY KIT CARD / PODCASTS) */}
        <motion.aside
          initial={false}
          animate={{ 
            width: isRightCollapsed ? 0 : 340, 
            opacity: isRightCollapsed ? 0 : 1,
            padding: isRightCollapsed ? "0px" : "20px"
          }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          className={`shrink-0 border-l h-[calc(100vh-65px)] overflow-y-auto overflow-x-hidden z-10 relative transition-colors duration-500 ${
            isLight 
              ? 'border-gray-200 bg-white' 
              : 'border-purple-500/10 bg-[#09090D]'
          } ${
            isRightCollapsed ? 'pointer-events-none border-l-0' : ''
          }`}
        >
          <StudyKit 
            sources={notebook.sources}
            activeSources={activeSources}
            flashcards={notebook.flashcards}
            podcastTurns={notebook.podcastTurns}
            onGenerateStudyGuide={handleGenerateStudyGuide}
            onGenerateQuiz={handleGenerateQuiz}
            onGeneratePodcast={handleGeneratePodcast}
            onUpdateFlashcards={handleUpdateFlashcards}
            theme={theme}
          />
        </motion.aside>

      </div>

      {/* EXPORT FORMATTED PDF STUDY GUIDE MODAL */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: isLight ? 0.45 : 0.85 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black backdrop-blur-sm animate-[fade-in_0.2s]" 
              onClick={() => setShowExportModal(false)} 
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className={`relative w-full max-w-5xl h-[85vh] rounded-2xl border shadow-2xl flex flex-col z-10 transition-colors duration-500 overflow-hidden ${
                isLight 
                  ? 'border-purple-100 bg-white text-gray-900 shadow-purple-900/10' 
                  : 'border-purple-500/20 bg-[#0C0C14] text-white shadow-black/90'
              }`}
            >
              {/* Modal Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                isLight ? 'border-gray-150 bg-gray-50' : 'border-white/5 bg-white/2'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    isLight ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  }`}>
                    <GraduationCap className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold tracking-tight">Structured Study Guide Exporter</h3>
                    <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                      Select options and click print to save your dynamic notes & knowledge graph as a formatted academic PDF.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className={`text-xs font-mono font-bold hover:underline transition-all cursor-pointer ${
                    isLight ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Close Setup
                </button>
              </div>

              {/* Modal Body (Two-Column Layout) */}
              <div className="flex-1 flex overflow-hidden">
                {/* Column A: Customization Panel (left, span 4/12 or fixed width) */}
                <div className={`w-80 border-r p-5 overflow-y-auto space-y-6 shrink-0 text-left ${
                  isLight ? 'border-gray-150 bg-gray-50/50' : 'border-white/5 bg-[#08080C]'
                }`}>
                  {/* Style Presets */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">Typography Theme</span>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'academic', name: '📖 Elegant Academic', desc: 'Serif fonts, double borders, formal look' },
                        { id: 'tech', name: '💻 Modern Technology', desc: 'Clean sans-serif fonts with subtle tags' },
                        { id: 'classic', name: '📐 Classic Scholar', desc: 'Minimalist typewriter look' }
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setPdfTheme(preset.id as any)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            pdfTheme === preset.id
                              ? 'bg-purple-500/15 border-purple-500 text-purple-400 font-bold'
                              : isLight
                                ? 'bg-white hover:bg-gray-100 border-gray-250 text-gray-700'
                                : 'bg-black/40 hover:bg-white/5 border-white/5 text-gray-400'
                          }`}
                        >
                          <p className="text-xs">{preset.name}</p>
                          <p className="text-[9px] text-gray-500 font-normal mt-0.5">{preset.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Components selection */}
                  <div className="space-y-3 pt-2 border-t border-purple-500/10">
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">Include Sections</span>
                    <div className="space-y-2.5">
                      {[
                        { key: 'includeCover', label: 'Cover Page & Index' },
                        { key: 'includeSummary', label: 'Executive Summary & TL;DR' },
                        { key: 'includeGraph', label: 'Extracted Knowledge Graph' },
                        { key: 'includeNotes', label: 'Grounded QA Notes & History' },
                        { key: 'includeFlashcards', label: 'Practice Flashcard Sets' },
                        { key: 'includePodcast', label: 'Podcast Discussion Script' }
                      ].map((item) => (
                        <label 
                          key={item.key} 
                          className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold"
                        >
                          <input
                            type="checkbox"
                            checked={(exportOptions as any)[item.key]}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Actions summary */}
                  <div className="space-y-3 pt-4 border-t border-purple-500/10">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print Study Guide / Save PDF</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const htmlContent = document.getElementById('study_guide_printout')?.innerHTML || '';
                        const fullHtml = `
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>${notebook.name} - Study Guide</title>
                              <style>
                                body { font-family: 'Georgia', serif; padding: 3rem; max-width: 800px; margin: 0 auto; color: #111; line-height: 1.6; }
                                h1 { border-bottom: 3px double #333; padding-bottom: 10px; font-size: 2.2rem; margin-bottom: 5px; }
                                h2 { border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 1.5rem; margin-top: 2rem; color: #333; }
                                h3 { font-size: 1.1rem; color: #555; }
                                .section { margin-bottom: 2.5rem; }
                                .takeaway-item { margin-bottom: 10px; }
                                .concept-card { background: #f9f9f9; border-left: 4px solid #8b5cf6; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
                                .qa-card { border-bottom: 1px dashed #eee; padding: 15px 0; }
                                .qa-q { font-weight: bold; color: #8b5cf6; }
                                .flashcard { border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 10px; background: #fff; }
                                .podcast-turn { margin-bottom: 12px; }
                                .speaker { font-weight: bold; color: #d97706; }
                              </style>
                            </head>
                            <body>
                              ${htmlContent}
                              <script>window.print();</script>
                            </body>
                          </html>
                        `;
                        const blob = new Blob([fullHtml], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${notebook.name.toLowerCase().replace(/\s+/g, '_')}_study_guide.html`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isLight
                          ? 'border-gray-200 bg-white hover:bg-gray-150 text-gray-700'
                          : 'border-white/5 bg-white/5 hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <Download className="h-4 w-4 text-gray-400" />
                      <span>Download HTML Package</span>
                    </button>
                  </div>
                </div>

                {/* Column B: Paper Preview Pane (right) */}
                <div className={`flex-1 p-6 overflow-y-auto ${
                  isLight ? 'bg-gray-100/60' : 'bg-[#06060A]'
                }`}>
                  <div className="text-center mb-3">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">DIGITAL STUDY GUIDE PREVIEW (A4 PAPER OUTLINE)</span>
                  </div>

                  {/* Tactile Paper Sheet */}
                  <div 
                    className={`mx-auto max-w-2xl p-8 rounded-lg shadow-xl text-left border overflow-hidden transition-all duration-300 ${
                      pdfTheme === 'academic' 
                        ? 'font-serif' 
                        : pdfTheme === 'tech' 
                          ? 'font-sans' 
                          : 'font-mono'
                    } ${
                      isLight 
                        ? 'bg-white border-gray-200 text-gray-900 shadow-slate-900/5' 
                        : 'bg-[#101016] border-purple-500/10 text-gray-100 shadow-black/60'
                    }`}
                  >
                    {/* COVER / TITLE BLOCK */}
                    {exportOptions.includeCover && (
                      <div className={`space-y-4 pb-6 mb-8 border-b-4 ${
                        pdfTheme === 'academic' ? 'border-double border-gray-400' : 'border-dashed border-purple-500/30'
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono font-bold tracking-widest text-purple-400 uppercase">POCKETLM ACADEMIC COMPANION</span>
                          <span className="text-[9px] font-mono text-gray-500">{new Date().toISOString().split('T')[0]}</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">{notebook.name}</h1>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium italic">{notebook.description}</p>
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-bold">
                            📂 {notebook.sources.length} Total Sources
                          </span>
                          <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">
                            📖 {activeSources.length} Active Documents
                          </span>
                        </div>
                      </div>
                    )}

                    {/* SECTION 1: EXECUTIVE SUMMARY */}
                    {exportOptions.includeSummary && (
                      <div className="space-y-4 mb-8">
                        <h2 className="text-sm font-bold tracking-wider text-purple-400 font-mono uppercase pb-1 border-b border-purple-500/15">
                          I. Executive synthesis & overview
                        </h2>
                        {generatedSummary ? (
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-mono text-gray-500 uppercase font-bold">Global Summary (TL;DR)</p>
                              <p className="text-xs leading-relaxed text-gray-400 mt-1 font-medium">{generatedSummary.tldr}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-mono text-gray-500 uppercase font-bold">Academic Takeaways</p>
                              <ul className="list-disc pl-5 mt-1 space-y-1.5">
                                {generatedSummary.takeaways.map((takeaway, idx) => (
                                  <li key={idx} className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                    {takeaway}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className={`p-4 rounded-xl border border-dashed text-center text-xs text-gray-500 ${
                            isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/20 border-white/5'
                          }`}>
                            ⚡ No overview synthesized yet. PocketLM can generate an offline Study Guide summary inside the right side "Study Kit" panel.
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 2: KNOWLEDGE GRAPH */}
                    {exportOptions.includeGraph && (
                      <div className="space-y-4 mb-8">
                        <h2 className="text-sm font-bold tracking-wider text-purple-400 font-mono uppercase pb-1 border-b border-purple-500/15">
                          II. Extracted Knowledge Graph glossary
                        </h2>
                        
                        {activeSources.length === 0 ? (
                          <p className="text-xs text-gray-500">No active sources linked to map the knowledge graph.</p>
                        ) : (
                          <div className="space-y-4">
                            {activeSources.map((src) => {
                              const concepts = getConceptsForSource(src);
                              return (
                                <div key={src.id} className="space-y-2 text-left">
                                  <div className="flex justify-between items-center bg-purple-500/5 px-2 py-1 rounded">
                                    <h3 className="text-xs font-bold text-gray-300 font-sans truncate">{src.name}</h3>
                                    <span className="text-[9px] font-mono text-gray-500 shrink-0">{src.wordCount} words</span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 pl-2">
                                    {concepts.map((concept, idx) => (
                                      <div key={idx} className="p-2.5 rounded-lg border border-purple-500/10 bg-[#14141E]/40">
                                        <p className="text-xs font-bold text-purple-400 flex items-center gap-1">
                                          <Sparkles className="h-3 w-3 shrink-0" />
                                          <span>{concept}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                                          "{concept}" represents an automated conceptual branch mapped specifically from source documents in your active study collection. Discuss relationships with PocketLM to expand.
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 3: NOTES & CHAT HISTORY */}
                    {exportOptions.includeNotes && (
                      <div className="space-y-4 mb-8">
                        <h2 className="text-sm font-bold tracking-wider text-purple-400 font-mono uppercase pb-1 border-b border-purple-500/15">
                          III. Grounded Notes & AI Dialogues
                        </h2>
                        {notebook.chatHistory.length === 0 ? (
                          <p className="text-xs text-gray-500">No chat questions or notes logged yet. Use the Chat tab to start exploring.</p>
                        ) : (
                          <div className="space-y-3 pl-1">
                            {notebook.chatHistory.filter(m => m.role === 'user' || !m.content.includes('⚠️')).map((msg) => (
                              <div key={msg.id} className="text-left space-y-1">
                                <span className={`text-[9px] font-mono font-bold uppercase ${
                                  msg.role === 'user' ? 'text-blue-400' : 'text-purple-400'
                                }`}>
                                  {msg.role === 'user' ? 'STUDENT QUESTION' : 'POCKETLM SYNTHESIS'}
                                </span>
                                <div className={`text-xs leading-relaxed p-2.5 rounded-lg border ${
                                  msg.role === 'user'
                                    ? 'bg-blue-500/5 border-blue-500/10 text-gray-300'
                                    : 'bg-purple-500/5 border-purple-500/10 text-gray-300'
                                }`}>
                                  {msg.content.replace(/\*\*|#/g, '')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 4: PRACTICE FLASHCARDS */}
                    {exportOptions.includeFlashcards && (
                      <div className="space-y-4 mb-8">
                        <h2 className="text-sm font-bold tracking-wider text-purple-400 font-mono uppercase pb-1 border-b border-purple-500/15">
                          IV. Flashcard Review Sets
                        </h2>
                        {notebook.flashcards.length === 0 ? (
                          <p className="text-xs text-gray-500">No practice quiz cards generated yet. Click generate in the flashcard review tab.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2">
                            {notebook.flashcards.map((card, idx) => (
                              <div key={card.id || idx} className="p-3 rounded-xl border border-white/5 bg-white/2 text-left space-y-1">
                                <div className="flex items-center gap-2">
                                  <input type="checkbox" readOnly checked={!!card.reviewed} className="rounded border-gray-300 text-purple-600 font-bold" />
                                  <p className="text-[10px] font-mono text-gray-500 font-bold uppercase">Card #{idx + 1}</p>
                                </div>
                                <p className="text-xs font-bold text-gray-300 pl-6">Q: {card.question}</p>
                                <p className="text-[11px] text-gray-400 pl-6 italic">A: {card.answer}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 5: PODCAST DISCUSSION */}
                    {exportOptions.includePodcast && (
                      <div className="space-y-4 mb-8">
                        <h2 className="text-sm font-bold tracking-wider text-purple-400 font-mono uppercase pb-1 border-b border-purple-500/15">
                          V. Synthesized Audio Podcast Script
                        </h2>
                        {!notebook.podcastTurns || notebook.podcastTurns.length === 0 ? (
                          <p className="text-xs text-gray-500">No audio transcript generated yet. Generate a synthesis inside the virtual podcast room.</p>
                        ) : (
                          <div className="space-y-3.5 pl-1">
                            {notebook.podcastTurns.map((turn) => (
                              <div key={turn.id} className="text-left leading-relaxed">
                                <p className="text-xs">
                                  <span className={`font-bold mr-1.5 ${
                                    turn.speaker === 'Maya' ? 'text-amber-500' : 'text-blue-400'
                                  }`}>
                                    {turn.speaker}:
                                  </span>
                                  <span className="text-gray-300 text-[11px] font-medium">{turn.text}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINT-ONLY MASTER CONTAINER WITH STYLED HIDDEN ELEMENTS */}
      <div id="study_guide_printout" className="hidden print:block text-left p-8 bg-white text-black font-serif">
        {/* Cover Page */}
        {exportOptions.includeCover && (
          <div className="border-b-4 border-double border-black pb-6 mb-8">
            <div className="flex justify-between items-center text-xs font-mono text-gray-700">
              <span>POCKETLM INTELLECTUAL COMPANION</span>
              <span>DATE: {new Date().toLocaleDateString()}</span>
            </div>
            <h1 className="text-3xl font-bold font-serif tracking-tight mt-4 text-black">{notebook.name}</h1>
            <p className="text-sm font-medium italic text-gray-700 mt-2">{notebook.description}</p>
            
            <div className="mt-4 text-xs font-mono text-gray-600">
              <p>• Total Document Corpus: {notebook.sources.length} readings</p>
              <p>• Active Synthesis Core: {activeSources.length} files</p>
            </div>
          </div>
        )}

        {/* Executive Summary */}
        {exportOptions.includeSummary && (
          <div className="section mb-8 page-break">
            <h2 className="text-xl font-bold font-serif border-b border-black pb-1 mb-3 text-black uppercase">I. Executive Synthesis & AI Overview</h2>
            {generatedSummary ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-mono text-gray-700 uppercase font-bold">Global Summary (TL;DR)</h3>
                  <p className="text-sm leading-relaxed text-black font-medium mt-1">{generatedSummary.tldr}</p>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-mono text-gray-700 uppercase font-bold">Academic Takeaways</h3>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-black">
                    {generatedSummary.takeaways.map((takeaway, idx) => (
                      <li key={idx} className="leading-relaxed font-medium">{takeaway}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm italic text-gray-500">No overview synthesized for this study guide yet.</p>
            )}
          </div>
        )}

        {/* Knowledge Graph concepts dictionary */}
        {exportOptions.includeGraph && (
          <div className="section mb-8 page-break">
            <h2 className="text-xl font-bold font-serif border-b border-black pb-1 mb-3 text-black uppercase">II. Extracted Knowledge Graph Glossary</h2>
            {activeSources.length === 0 ? (
              <p className="text-sm italic text-gray-500">No active sources linked to map the knowledge graph.</p>
            ) : (
              <div className="space-y-4">
                {activeSources.map((src) => {
                  const concepts = getConceptsForSource(src);
                  return (
                    <div key={src.id} className="space-y-2 mt-4">
                      <h3 className="text-sm font-bold bg-gray-100 p-2 border-l-4 border-black text-black font-sans">{src.name}</h3>
                      <div className="grid grid-cols-1 gap-3 pl-3">
                        {concepts.map((concept, idx) => (
                          <div key={idx} className="p-3 border border-gray-200 bg-gray-50 rounded">
                            <p className="text-sm font-bold text-black font-serif">• {concept}</p>
                            <p className="text-xs text-gray-800 mt-1 leading-relaxed">
                              "{concept}" is a core relational knowledge concept extracted automatically from active study readings in "{src.name}". Use the PocketLM interactive platform for active question-answering.
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Notes & Chat History */}
        {exportOptions.includeNotes && (
          <div className="section mb-8 page-break">
            <h2 className="text-xl font-bold font-serif border-b border-black pb-1 mb-3 text-black uppercase">III. Grounded Notes & AI Dialogues</h2>
            {notebook.chatHistory.length === 0 ? (
              <p className="text-sm italic text-gray-500">No chat questions or notes logged yet.</p>
            ) : (
              <div className="space-y-4 mt-2">
                {notebook.chatHistory.filter(m => m.role === 'user' || !m.content.includes('⚠️')).map((msg, idx) => (
                  <div key={msg.id || idx} className="text-sm leading-relaxed border-b border-gray-100 pb-3">
                    <p className="font-mono text-[10px] text-gray-600 font-bold uppercase">
                      [{msg.role === 'user' ? 'STUDENT QUESTION' : 'POCKETLM SYNTHESIS'}]
                    </p>
                    <p className="text-black font-medium mt-1 whitespace-pre-wrap">{msg.content.replace(/\*\*|#/g, '')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Flashcards */}
        {exportOptions.includeFlashcards && (
          <div className="section mb-8 page-break">
            <h2 className="text-xl font-bold font-serif border-b border-black pb-1 mb-3 text-black uppercase">IV. Practice Flashcard Review Sets</h2>
            {notebook.flashcards.length === 0 ? (
              <p className="text-sm italic text-gray-500">No practice quiz cards generated yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 mt-4">
                {notebook.flashcards.map((card, idx) => (
                  <div key={card.id || idx} className="p-3 border border-gray-200 bg-gray-50 rounded-lg mb-2">
                    <p className="text-xs font-mono text-gray-700 font-bold uppercase">[ ] Quiz Card #{idx + 1}</p>
                    <p className="text-sm font-bold text-black mt-1">Question: {card.question}</p>
                    <p className="text-sm text-gray-800 mt-1 italic">Answer: {card.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Podcast Discussion transcript */}
        {exportOptions.includePodcast && (
          <div className="section mb-8 page-break">
            <h2 className="text-xl font-bold font-serif border-b border-black pb-1 mb-3 text-black uppercase">V. Synthesized Audio Podcast Script</h2>
            {!notebook.podcastTurns || notebook.podcastTurns.length === 0 ? (
              <p className="text-sm italic text-gray-500">No virtual podcast transcript generated yet.</p>
            ) : (
              <div className="space-y-3 mt-4 text-sm leading-relaxed">
                {notebook.podcastTurns.map((turn, idx) => (
                  <div key={turn.id || idx} className="mb-2">
                    <p className="text-sm">
                      <span className="font-bold mr-1.5 text-black">{turn.speaker}:</span>
                      <span className="text-black font-serif font-medium">{turn.text}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating study timer widget */}
      <StudyTimer theme={theme} />


    </div>
  );
}
