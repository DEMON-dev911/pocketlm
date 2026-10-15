import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, HelpCircle, FileText, ArrowLeft, ArrowRight, 
  RotateCw, Play, Pause, RefreshCw, Volume2, 
  BookOpen, Compass, ChevronDown, CheckCircle, Headphones 
} from 'lucide-react';
import { Flashcard, PodcastTurn, Source } from '../types';

interface StudyKitProps {
  sources: Source[];
  activeSources: Source[];
  flashcards: Flashcard[];
  podcastTurns?: PodcastTurn[];
  onGenerateStudyGuide: () => Promise<{ tldr: string; takeaways: string[] }>;
  onGenerateQuiz: () => Promise<Flashcard[]>;
  onGeneratePodcast: () => Promise<PodcastTurn[]>;
  onUpdateFlashcards?: (cards: Flashcard[]) => void;
  theme?: 'dark' | 'light';
}

export default function StudyKit({
  sources,
  activeSources,
  flashcards,
  podcastTurns,
  onGenerateStudyGuide,
  onGenerateQuiz,
  onGeneratePodcast,
  onUpdateFlashcards,
  theme = 'dark'
}: StudyKitProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'podcast'>('summary');
  
  // Summary states
  const [tldr, setTldr] = useState<string>("Click generate below to synthesize an overview Study Guide based on your active readings.");
  const [takeaways, setTakeaways] = useState<string[]>([
    "Connect multiple files to unlock interactive synthesis.",
    "Click the toggle buttons inside the left Sources bar to specify active folders.",
    "Generate practice cards, dynamic summaries, and virtual podcasts."
  ]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Flashcards states
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardsList, setCardsList] = useState<Flashcard[]>(flashcards);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Podcast states
  const [podcastList, setPodcastList] = useState<PodcastTurn[]>(podcastTurns || []);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const podcastIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal states with initial props
  useEffect(() => {
    if (flashcards.length > 0) {
      const questionSignature = flashcards.map(c => c.id).join(',');
      const currentSignature = cardsList.map(c => c.id).join(',');
      
      setCardsList(flashcards);
      
      if (questionSignature !== currentSignature) {
        setCurrentCardIdx(0);
        setIsFlipped(false);
      }
    }
  }, [flashcards]);

  useEffect(() => {
    if (podcastTurns && podcastTurns.length > 0) {
      setPodcastList(podcastTurns);
      setCurrentTurnIdx(0);
    }
  }, [podcastTurns]);

  // Handle podcast playback simulation
  useEffect(() => {
    if (isPlayingPodcast && podcastList.length > 0) {
      const currentTurn = podcastList[currentTurnIdx];
      // Simulate reading speed (approx 150 words per minute, modified by audio speed)
      const wordCount = currentTurn?.text.split(' ').length || 10;
      const durationMs = Math.max(2500, (wordCount * 400) / audioSpeed);

      podcastIntervalRef.current = setTimeout(() => {
        if (currentTurnIdx < podcastList.length - 1) {
          setCurrentTurnIdx(prev => prev + 1);
        } else {
          setIsPlayingPodcast(false);
          setCurrentTurnIdx(0);
        }
      }, durationMs);
    } else {
      if (podcastIntervalRef.current) {
        clearTimeout(podcastIntervalRef.current);
      }
    }

    return () => {
      if (podcastIntervalRef.current) {
        clearTimeout(podcastIntervalRef.current);
      }
    };
  }, [isPlayingPodcast, currentTurnIdx, podcastList, audioSpeed]);

  const handleGenerateSummary = async () => {
    if (activeSources.length === 0) return;
    setIsSummarizing(true);
    try {
      const guide = await onGenerateStudyGuide();
      setTldr(guide.tldr);
      setTakeaways(guide.takeaways);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (activeSources.length === 0) return;
    setIsGeneratingQuiz(true);
    try {
      const newCards = await onGenerateQuiz();
      setCardsList(newCards);
      setCurrentCardIdx(0);
      setIsFlipped(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleGeneratePodcast = async () => {
    if (activeSources.length === 0) return;
    setIsGeneratingPodcast(true);
    setIsPlayingPodcast(false);
    setCurrentTurnIdx(0);
    try {
      const turns = await onGeneratePodcast();
      setPodcastList(turns);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const toggleFlip = () => setIsFlipped(!isFlipped);

  const handleToggleReviewed = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent flipping the card
    const updatedCards = cardsList.map((card, i) => {
      if (i === idx) {
        return { ...card, reviewed: !card.reviewed };
      }
      return card;
    });
    setCardsList(updatedCards);
    if (onUpdateFlashcards) {
      onUpdateFlashcards(updatedCards);
    }
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx(prev => (prev > 0 ? prev - 1 : cardsList.length - 1));
    }, 150);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx(prev => (prev < cardsList.length - 1 ? prev + 1 : 0));
    }, 150);
  };

  const isLight = theme === 'light';

  return (
    <div id="study_kit" className="h-full flex flex-col justify-between">
      
      {/* Selector Tabs */}
      <div className="space-y-4">
        <div className={`flex border p-1.5 rounded-lg gap-1 transition-colors ${
          isLight ? 'border-gray-200 bg-gray-100' : 'border-purple-500/10 bg-[#0C0C12]/40'
        }`}>
          {[
            { id: 'summary', label: 'Summary', icon: FileText },
            { id: 'flashcards', label: 'Flashcards', icon: HelpCircle },
            { id: 'podcast', label: 'Audio Overview', icon: Headphones }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/10'
                  : isLight
                    ? 'text-gray-500 hover:text-gray-950 hover:bg-gray-200/50'
                    : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Content Panel */}
        <div className="flex-1 min-h-[360px]">
          
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-purple-500 uppercase tracking-widest block font-bold">TL;DR Overview</span>
                <p className={`text-xs leading-relaxed border p-3.5 rounded-lg transition-colors duration-500 font-semibold ${
                  isLight 
                    ? 'bg-purple-50/50 border-purple-200 text-gray-800' 
                    : 'bg-purple-500/5 border-purple-500/10 text-gray-300'
                }`}>
                  {isSummarizing ? "Synthesizing full text guide, please hold..." : tldr}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono text-purple-500 uppercase tracking-widest block font-bold">Key Core Takeaways</span>
                <motion.div 
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
                  }}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {takeaways.map((takeaway, idx) => (
                    <motion.div 
                      key={`${idx}-${takeaway.substring(0, 8)}`} 
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        show: { opacity: 1, x: 0 }
                      }}
                      className={`flex gap-2.5 items-start text-xs leading-normal font-semibold ${
                        isLight ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="pt-3">
                <button
                  id="generate_study_guide"
                  onClick={handleGenerateSummary}
                  disabled={activeSources.length === 0 || isSummarizing}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border ${
                    isLight
                      ? 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700 hover:text-purple-800 shadow-sm'
                      : 'bg-purple-600/10 hover:bg-purple-600/25 border-purple-500/25 text-purple-300 hover:text-white'
                  }`}
                >
                  {isSummarizing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin animate-duration-1000" />
                      <span>Generating study guide...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate Study Guide ({activeSources.length} files)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6">
              {cardsList.length > 0 ? (
                <div className="space-y-4">
                  {/* Flipcard view */}
                  <div 
                    onClick={toggleFlip}
                    className="w-full h-48 perspective-1000 cursor-pointer relative"
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full preserve-3d absolute inset-0"
                    >
                      {/* Front Side */}
                      <div className={`w-full h-full backface-hidden absolute inset-0 p-5 rounded-xl border shadow-sm flex flex-col justify-between ${
                        isLight 
                          ? 'border-purple-200 bg-white text-gray-800' 
                          : 'border-purple-500/20 bg-[#0E0E14] shadow-md text-white'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest font-bold">Question</span>
                          <button
                            onClick={(e) => handleToggleReviewed(currentCardIdx, e)}
                            className={`absolute top-4 right-4 flex items-center gap-1 py-1 px-2 rounded-full border text-[8px] font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${
                              cardsList[currentCardIdx]?.reviewed
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-400 shadow-sm shadow-emerald-500/10'
                                : isLight
                                  ? 'bg-gray-100 hover:bg-purple-50 border-gray-200 hover:border-purple-300 text-gray-400 hover:text-purple-600'
                                  : 'bg-[#161622] hover:bg-[#1f1f33] border-white/5 hover:border-purple-500/20 text-gray-400 hover:text-purple-400'
                            }`}
                          >
                            <CheckCircle className={`h-3 w-3 mr-1 ${cardsList[currentCardIdx]?.reviewed ? 'text-emerald-400' : 'text-gray-400'}`} />
                            <span>{cardsList[currentCardIdx]?.reviewed ? 'Reviewed' : 'Mark Reviewed'}</span>
                          </button>
                        </div>
                        <p className={`text-xs font-bold leading-normal text-center my-auto ${isLight ? 'text-gray-950' : 'text-white'}`}>
                          {cardsList[currentCardIdx]?.question}
                        </p>
                        <div className="text-[10px] text-purple-500 font-mono text-center flex items-center justify-center gap-1 font-bold animate-pulse">
                          <RotateCw className="h-3 w-3" /> Click to flip & reveal answer
                        </div>
                      </div>

                      {/* Back Side */}
                      <div className={`w-full h-full backface-hidden rotate-y-180 absolute inset-0 p-5 rounded-xl border shadow-sm flex flex-col justify-between ${
                        isLight
                          ? 'border-purple-300 bg-purple-50/50 text-purple-950'
                          : 'border-purple-500/30 bg-purple-950/10 shadow-md text-gray-300'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-purple-500 uppercase tracking-widest font-bold">Answer</span>
                          <button
                            onClick={(e) => handleToggleReviewed(currentCardIdx, e)}
                            className={`absolute top-4 right-4 flex items-center gap-1 py-1 px-2 rounded-full border text-[8px] font-mono font-bold uppercase transition-all duration-300 cursor-pointer ${
                              cardsList[currentCardIdx]?.reviewed
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-400 shadow-sm shadow-emerald-500/10'
                                : isLight
                                  ? 'bg-purple-100 hover:bg-purple-200 border-purple-200 hover:border-purple-300 text-purple-600 hover:text-purple-700'
                                  : 'bg-[#161622] hover:bg-[#1f1f33] border-white/5 hover:border-purple-500/20 text-gray-300 hover:text-purple-300'
                            }`}
                          >
                            <CheckCircle className={`h-3 w-3 mr-1 ${cardsList[currentCardIdx]?.reviewed ? 'text-emerald-400' : 'text-gray-400'}`} />
                            <span>{cardsList[currentCardIdx]?.reviewed ? 'Reviewed' : 'Mark Reviewed'}</span>
                          </button>
                        </div>
                        <p className={`text-xs leading-normal text-center my-auto px-1.5 font-bold ${isLight ? 'text-purple-950' : 'text-gray-200'}`}>
                          {cardsList[currentCardIdx]?.answer}
                        </p>
                        <span className="text-[10px] text-gray-400 font-mono text-center font-bold">Click to see question</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={prevCard}
                      className={`p-2 rounded cursor-pointer transition-all border ${
                        isLight 
                          ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-950 shadow-sm' 
                          : 'bg-[#0D0D14] hover:bg-[#161622] border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    
                    <span className={`text-[11px] font-mono font-bold ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                      Card {currentCardIdx + 1} of {cardsList.length}
                    </span>

                    <button 
                      onClick={nextCard}
                      className={`p-2 rounded cursor-pointer transition-all border ${
                        isLight 
                          ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-950 shadow-sm' 
                          : 'bg-[#0D0D14] hover:bg-[#161622] border-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`text-center p-8 rounded-lg border border-dashed text-gray-500 space-y-2 ${
                  isLight ? 'border-gray-200 bg-gray-50/50' : 'border-white/5 bg-[#09090D]'
                }`}>
                  <HelpCircle className="h-8 w-8 mx-auto text-gray-400 animate-pulse" />
                  <p className="text-xs">No active study flashcards yet.</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  id="generate_quiz"
                  onClick={handleGenerateQuiz}
                  disabled={activeSources.length === 0 || isGeneratingQuiz}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border ${
                    isLight
                      ? 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700 hover:text-purple-800 shadow-sm'
                      : 'bg-purple-600/10 hover:bg-purple-600/25 border-purple-500/25 text-purple-300 hover:text-white'
                  }`}
                >
                  {isGeneratingQuiz ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin animate-duration-1000" />
                      <span>Generating quiz...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate Quiz ({activeSources.length} files)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PODCAST OVERVIEW */}
          {activeTab === 'podcast' && (
            <div className="space-y-6">
              {podcastList.length > 0 ? (
                <div className={`p-4 rounded-xl border transition-colors duration-500 space-y-4 ${
                  isLight ? 'border-purple-200 bg-purple-50/35' : 'border-purple-500/20 bg-[#0E0E14]'
                }`}>
                  {/* Virtual hosts avatar display */}
                  <div className={`flex items-center justify-between border-b pb-3 ${
                    isLight ? 'border-gray-200' : 'border-white/5'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                        isLight 
                          ? 'bg-purple-100 border border-purple-200 text-purple-700' 
                          : 'bg-purple-600/20 border border-purple-500/30 text-purple-300'
                      }`}>
                        🎙️
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold ${isLight ? 'text-gray-950' : 'text-white'}`}>Audio Study Overviews</h4>
                        <p className={`text-[9px] font-mono ${isLight ? 'text-purple-900' : 'text-gray-500'}`}>2 virtual hosts • Aidan & Maya</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 1.25, 1.5].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setAudioSpeed(speed)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer font-bold ${
                            audioSpeed === speed
                              ? 'bg-purple-600 text-white'
                              : isLight
                                ? 'bg-white hover:bg-gray-100 border border-gray-200 text-gray-600'
                                : 'bg-[#151522] text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dialogue script reading bubble */}
                  <div className="h-28 overflow-y-auto pr-1 flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentTurnIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2 text-center"
                      >
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                          podcastList[currentTurnIdx]?.speaker === 'Aidan'
                            ? isLight
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : isLight
                              ? 'bg-pink-50 text-pink-700 border-pink-200'
                              : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                        }`}>
                          {podcastList[currentTurnIdx]?.speaker}
                        </span>
                        <p className={`text-xs italic leading-relaxed px-2 font-semibold ${
                          isLight ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          "{podcastList[currentTurnIdx]?.text}"
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Playback wave visualizer */}
                  <div className={`h-8 flex items-center justify-center gap-1 rounded-lg p-2 overflow-hidden border ${
                    isLight ? 'bg-purple-100/30 border-purple-200' : 'bg-black/40 border-white/5'
                  }`}>
                    {Array.from({ length: 18 }).map((_, idx) => {
                      const idleHeight = 4 + (idx % 3) * 2;
                      return (
                        <motion.div
                          key={idx}
                          className="w-1 bg-purple-600 rounded-full"
                          animate={isPlayingPodcast ? {
                            height: [idleHeight, 22, idleHeight]
                          } : {
                            height: idleHeight
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: idx * 0.04
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Controls play / pause / next */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        if (currentTurnIdx > 0) {
                          setCurrentTurnIdx(prev => prev - 1);
                        }
                      }}
                      disabled={currentTurnIdx === 0}
                      className={`p-1.5 rounded-lg border disabled:opacity-30 cursor-pointer ${
                        isLight 
                          ? 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200 shadow-sm' 
                          : 'bg-[#141420] text-gray-400 hover:text-white border-white/5'
                      }`}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>

                    <button
                      id="play_podcast_btn"
                      onClick={() => setIsPlayingPodcast(!isPlayingPodcast)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full cursor-pointer shadow-lg active:scale-95 transition-all ${
                        isLight 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-white hover:bg-purple-300 text-black'
                      }`}
                    >
                      {isPlayingPodcast ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </button>

                    <button
                      onClick={() => {
                        if (currentTurnIdx < podcastList.length - 1) {
                          setCurrentTurnIdx(prev => prev + 1);
                        } else {
                          setIsPlayingPodcast(false);
                          setCurrentTurnIdx(0);
                        }
                      }}
                      className={`p-1.5 rounded-lg border cursor-pointer ${
                        isLight 
                          ? 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200 shadow-sm' 
                          : 'bg-[#141420] text-gray-400 hover:text-white border-white/5'
                      }`}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`text-center p-8 rounded-lg border border-dashed text-gray-500 space-y-2 ${
                  isLight ? 'border-gray-200 bg-gray-50/50' : 'border-white/5 bg-[#09090D]'
                }`}>
                  <Headphones className="h-8 w-8 mx-auto text-gray-400 animate-pulse" />
                  <p className="text-xs">No active audio summaries yet.</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  id="generate_podcast"
                  onClick={handleGeneratePodcast}
                  disabled={activeSources.length === 0 || isGeneratingPodcast}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 border ${
                    isLight
                      ? 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700 hover:text-purple-800 shadow-sm'
                      : 'bg-purple-600/10 hover:bg-purple-600/25 border-purple-500/25 text-purple-300 hover:text-white'
                  }`}
                >
                  {isGeneratingPodcast ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin animate-duration-1000" />
                      <span>Simulating hosts synthesis...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate Audio Discussion ({activeSources.length} files)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer statistics branding */}
      <div className={`pt-4 border-t text-[10px] font-mono text-center flex items-center justify-center gap-1.5 p-2.5 rounded mt-4 ${
        isLight ? 'border-gray-100 bg-gray-50/50 text-gray-500 font-bold' : 'border-purple-500/10 text-gray-500 bg-[#0C0C12]/40'
      }`}>
        <Sparkles className="h-3.5 w-3.5 text-purple-500 animate-pulse" />
        <span>Grounded Student Study Kit Active</span>
      </div>

    </div>
  );
}
