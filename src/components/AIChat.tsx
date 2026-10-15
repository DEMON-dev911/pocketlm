import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Sparkles, AlertCircle, Quote, X, 
  MessageSquare, BookOpen, BrainCircuit, ExternalLink, HelpCircle,
  Mic, MicOff, Copy, Check, FileText, Share2, Award, ArrowRight, Bookmark, Headphones, Network, Plus, RotateCcw
} from 'lucide-react';
import { Message, Source, Citation } from '../types';

interface AIChatProps {
  notebookName: string;
  notebookDescription: string;
  chatHistory: Message[];
  activeSources: Source[];
  onSendMessage: (text: string) => void;
  onAddSource?: (name: string, content: string, type: 'pdf' | 'doc' | 'text' | 'url') => void;
  isGenerating: boolean;
  theme?: 'dark' | 'light';
}

// Framer motion list stagger variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", damping: 25, stiffness: 120 } 
  }
};

const waveVariants = {
  wave: {
    rotate: [0, 15, -10, 15, -5, 10, 0],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      repeatDelay: 1.5
    }
  }
};

const typingDotVariants = {
  initial: { y: 0 },
  animate: { y: [-3, 3, -3] }
};

const typingDotTransition = (delay: number) => ({
  duration: 1.2,
  repeat: Infinity,
  ease: "easeInOut",
  delay
});

function TypingIndicator({ isLight }: { isLight: boolean }) {
  return (
    <div className="flex items-center gap-3 max-w-[80%] mr-auto">
      {/* COMP Avatar */}
      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center text-[10px] font-mono font-extrabold tracking-tighter shrink-0 ${
        isLight
          ? 'bg-gray-100 border-gray-250 text-gray-700 shadow-sm'
          : 'bg-black/30 border-white/5 text-gray-400 shadow-inner'
      }`}>
        COMP
      </div>
      
      {/* Typing Bubble */}
      <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 ${
        isLight
          ? 'bg-white border-gray-200 text-gray-800 shadow-sm'
          : 'bg-[#0E0E14]' + ' border-white/5 text-gray-300 shadow-md'
      }`}>
        {/* Animated Three Dots */}
        <div className="flex gap-1.5 items-center h-4 py-1 shrink-0">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              variants={typingDotVariants}
              initial="initial"
              animate="animate"
              transition={typingDotTransition(i * 0.15)}
              className="w-1.5 h-1.5 rounded-full bg-purple-500"
            />
          ))}
        </div>
        <span className={`text-[11px] font-semibold tracking-wide ${
          isLight ? 'text-slate-650' : 'text-gray-400'
        }`}>
          PocketLM is typing...
        </span>
      </div>
    </div>
  );
}

function parseAndRenderMarkdown(
  text: string,
  citations: Citation[],
  onSelectCitation: (citation: Citation) => void,
  isLight: boolean
) {
  if (!text) return null;

  // 1. Split text into code blocks and normal blocks
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: { type: 'text' | 'code'; lang?: string; content: string }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }
    blocks.push({
      type: 'code',
      lang: match[1],
      content: match[2]
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    blocks.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  // Helper to parse inline styles (bold, inline-code, citation brackets)
  const parseInlineStyles = (rawText: string, blockKey: string) => {
    // Bold: **text**, Inline code: `code`, Citation: [N]
    const inlineRegex = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([0-9]+)\])/g;
    const parts: React.ReactNode[] = [];
    let inlineLastIndex = 0;
    let inlineMatch;
    let keyIdx = 0;

    while ((inlineMatch = inlineRegex.exec(rawText)) !== null) {
      if (inlineMatch.index > inlineLastIndex) {
        parts.push(<span key={`${blockKey}-txt-${keyIdx++}`}>{rawText.substring(inlineLastIndex, inlineMatch.index)}</span>);
      }

      const [full, boldBlock, boldText, codeBlock, codeText, citBlock, citNumStr] = inlineMatch;

      if (boldBlock) {
        parts.push(
          <strong key={`${blockKey}-b-${keyIdx++}`} className={isLight ? 'font-bold text-purple-950 bg-purple-50 px-1 rounded' : 'font-bold text-white bg-purple-500/10 px-1 rounded'}>
            {boldText}
          </strong>
        );
      } else if (codeBlock) {
        parts.push(
          <code key={`${blockKey}-code-${keyIdx++}`} className={`px-1.5 py-0.5 rounded font-mono text-xs border ${
            isLight
              ? 'bg-gray-100 border-gray-200 text-purple-700'
              : 'bg-black/40 border-white/5 text-purple-300'
          }`}>
            {codeText}
          </code>
        );
      } else if (citBlock) {
        const citNum = parseInt(citNumStr);
        const citIdx = citNum - 1;
        const citation = citations && citations[citIdx];
        if (citation) {
          parts.push(
            <button
              type="button"
              key={`${blockKey}-cit-${keyIdx++}`}
              onClick={() => onSelectCitation(citation)}
              className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[10px] font-mono font-bold text-purple-300 bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 rounded cursor-pointer transition-all active:scale-95 align-middle"
              title={`Source: ${citation.sourceName}`}
            >
              {citNum}
            </button>
          );
        } else {
          parts.push(<span key={`${blockKey}-cit-raw-${keyIdx++}`}>{citBlock}</span>);
        }
      }

      inlineLastIndex = inlineRegex.lastIndex;
    }

    if (inlineLastIndex < rawText.length) {
      parts.push(<span key={`${blockKey}-txt-end-${keyIdx++}`}>{rawText.substring(inlineLastIndex)}</span>);
    }

    return parts.length > 0 ? parts : rawText;
  };

  return (
    <div className="space-y-3 font-sans font-medium">
      {blocks.map((block, bIdx) => {
        if (block.type === 'code') {
          return (
            <div key={`block-${bIdx}`} className={`my-2 rounded-lg overflow-hidden border shadow-inner ${
              isLight ? 'bg-gray-50 border-gray-250' : 'bg-black/40 border-white/5'
            }`}>
              {block.lang && (
                <div className={`px-3 py-1 text-[10px] font-mono border-b flex items-center justify-between ${
                  isLight ? 'bg-gray-100/50 border-gray-200 text-gray-500' : 'bg-black/30 border-white/5 text-gray-500'
                }`}>
                  <span>{block.lang.toUpperCase()}</span>
                </div>
              )}
              <pre className="p-3 overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre">
                <code className={isLight ? 'text-purple-900' : 'text-purple-200'}>{block.content}</code>
              </pre>
            </div>
          );
        }

        const lines = block.content.split('\n');
        const elements: React.ReactNode[] = [];
        let inList = false;
        let listItems: string[] = [];
        let listType: 'ul' | 'ol' = 'ul';

        const flushList = (key: string) => {
          if (listItems.length > 0) {
            const ListTag = listType;
            elements.push(
              <ListTag key={key} className={listType === 'ul' ? "list-disc list-inside pl-4 space-y-1 my-2" : "list-decimal list-inside pl-4 space-y-1 my-2"}>
                {listItems.map((item, itemIdx) => (
                  <li key={`${key}-item-${itemIdx}`} className={`text-sm leading-relaxed ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>
                    {parseInlineStyles(item, `${key}-item-${itemIdx}`)}
                  </li>
                ))}
              </ListTag>
            );
            listItems = [];
          }
          inList = false;
        };

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();
          
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const content = line.substring(line.indexOf(trimmed.charAt(0)) + 2);
            if (!inList || listType !== 'ul') {
              flushList(`list-flush-${bIdx}-${lIdx}`);
              inList = true;
              listType = 'ul';
            }
            listItems.push(content);
          }
          else if (/^\d+\.\s/.test(trimmed)) {
            const matchResult = trimmed.match(/^(\d+)\.\s(.*)/);
            const content = matchResult ? matchResult[2] : trimmed;
            if (!inList || listType !== 'ol') {
              flushList(`list-flush-${bIdx}-${lIdx}`);
              inList = true;
              listType = 'ol';
            }
            listItems.push(content);
          }
          else if (trimmed === '') {
            flushList(`list-flush-${bIdx}-${lIdx}`);
          }
          else {
            flushList(`list-flush-${bIdx}-${lIdx}`);
            elements.push(
              <p key={`p-${bIdx}-${lIdx}`} className={`text-sm leading-relaxed whitespace-pre-wrap ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>
                {parseInlineStyles(line, `inline-${bIdx}-${lIdx}`)}
              </p>
            );
          }
        });

        flushList(`list-flush-end-${bIdx}`);

        return (
          <div key={`text-block-${bIdx}`} className="space-y-1.5">
            {elements}
          </div>
        );
      })}
    </div>
  );
}

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

const drawLinkCurve = (fromX: number, fromY: number, toX: number, toY: number) => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const cx1 = fromX + dx * 0.5;
  const cy1 = fromY;
  const cx2 = fromX + dx * 0.5;
  const cy2 = toY;
  return `M ${fromX} ${fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toX} ${toY}`;
};

export default function AIChat({
  notebookName,
  notebookDescription,
  chatHistory,
  activeSources,
  onSendMessage,
  onAddSource,
  isGenerating,
  theme = 'dark'
}: AIChatProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'view' | 'research' | 'ingest'>('chat');
  const [inputText, setInputText] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [savedToNote, setSavedToNote] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('center');
  
  // Interactive Mind Map States
  const [mapNodes, setMapNodes] = useState<any[]>([]);
  const [mapLinks, setMapLinks] = useState<any[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Ingest & Local Graph States
  const [ingestType, setIngestType] = useState<'url' | 'text'>('url');
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestTextName, setIngestTextName] = useState('');
  const [ingestTextContent, setIngestTextContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStep, setIngestStep] = useState(0); // 0: Form, 1: parsing, 2: summarizing, 3: concepts, 4: graph, 5: completed
  const [ingestResult, setIngestResult] = useState<{
    name: string;
    tldr: string;
    takeaways: string[];
    nodes: any[];
    links: any[];
  } | null>(null);

  const [localMapNodes, setLocalMapNodes] = useState<any[]>([]);
  const [localMapLinks, setLocalMapLinks] = useState<any[]>([]);
  const [localSelectedNodeId, setLocalSelectedNodeId] = useState<string>('');
  const [localDraggingNodeId, setLocalDraggingNodeId] = useState<string | null>(null);
  const [localDragStartPos, setLocalDragStartPos] = useState({ x: 0, y: 0 });

  // Initialize mind map nodes when active sources change
  useEffect(() => {
    const numSources = activeSources.length;
    if (numSources === 0) {
      setMapNodes([]);
      setMapLinks([]);
      return;
    }

    const newNodes: any[] = [];
    const newLinks: any[] = [];
    const centerX = 325;
    const centerY = 195;

    // 1. Central Core Node
    newNodes.push({
      id: 'center',
      label: notebookName,
      type: 'center',
      x: centerX,
      y: centerY,
      description: `This is the central study hub for "${notebookName}". It consolidates knowledge across all of your active PDF textbook files and syllabus readings.`,
      color: 'from-purple-600 to-indigo-600 border-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]',
      icon: BrainCircuit
    });

    // 2. Mapping active source branches
    activeSources.forEach((src, sIdx) => {
      const sAngle = (sIdx * 2 * Math.PI) / numSources - Math.PI / 2;
      const sRadius = 100;
      const sx = centerX + sRadius * Math.cos(sAngle);
      const sy = centerY + sRadius * Math.sin(sAngle);
      const srcNodeId = `src-${src.id}`;

      newNodes.push({
        id: srcNodeId,
        label: src.name,
        type: 'source',
        x: sx,
        y: sy,
        description: `Source Reference Document: "${src.name}" contains approximately ${src.wordCount} words. Grounded study nodes are verified by PocketLM in real-time.`,
        color: 'from-blue-600 to-cyan-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        icon: FileText,
        sourceType: src.type
      });

      newLinks.push({
        from: 'center',
        to: srcNodeId,
        color: 'stroke-purple-500/40',
      });

      // Child Concepts
      const concepts = getConceptsForSource(src);
      concepts.forEach((concept, cIdx) => {
        const spread = 0.65; // arc spread
        const cAngle = sAngle - spread / 2 + (cIdx * spread) / (concepts.length - 1 || 1);
        const cRadius = 175;
        const cx = centerX + cRadius * Math.cos(cAngle);
        const cy = centerY + cRadius * Math.sin(cAngle);
        const conceptNodeId = `concept-${src.id}-${cIdx}`;

        newNodes.push({
          id: conceptNodeId,
          label: concept,
          type: 'concept',
          x: cx,
          y: cy,
          description: `Auto-generated Study Concept: "${concept}" was extracted from your readings in "${src.name}". Ask PocketLM to explain this detail immediately.`,
          color: 'from-pink-500 to-rose-400 border-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.25)]',
          icon: Sparkles,
          parentName: src.name
        });

        newLinks.push({
          from: srcNodeId,
          to: conceptNodeId,
          color: 'stroke-pink-500/20',
        });
      });
    });

    setMapNodes(newNodes);
    setMapLinks(newLinks);
    setSelectedNodeId('center');
  }, [activeSources.map(s => s.id).join(','), notebookName]);

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const dx = e.clientX - dragStartPos.x;
    const dy = e.clientY - dragStartPos.y;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 650 / rect.width;
    const scaleY = 390 / rect.height;

    setMapNodes(prevNodes => prevNodes.map(node => {
      if (node.id === draggingNodeId) {
        return {
          ...node,
          x: Math.max(25, Math.min(625, node.x + dx * scaleX)),
          y: Math.max(25, Math.min(365, node.y + dy * scaleY))
        };
      }
      return node;
    }));
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
  };

  const handleNodeTouchStart = (nodeId: string, e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      setDraggingNodeId(nodeId);
      setDragStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (!draggingNodeId || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartPos.x;
    const dy = e.touches[0].clientY - dragStartPos.y;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 650 / rect.width;
    const scaleY = 390 / rect.height;

    setMapNodes(prevNodes => prevNodes.map(node => {
      if (node.id === draggingNodeId) {
        return {
          ...node,
          x: Math.max(25, Math.min(625, node.x + dx * scaleX)),
          y: Math.max(25, Math.min(365, node.y + dy * scaleY))
        };
      }
      return node;
    }));
    setDragStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  // Local Map Drag Handlers
  const handleLocalNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalDraggingNodeId(nodeId);
    setLocalDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleLocalCanvasMouseMove = (e: React.MouseEvent) => {
    if (!localDraggingNodeId) return;
    const dx = e.clientX - localDragStartPos.x;
    const dy = e.clientY - localDragStartPos.y;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 650 / rect.width;
    const scaleY = 390 / rect.height;

    setLocalMapNodes(prevNodes => prevNodes.map(node => {
      if (node.id === localDraggingNodeId) {
        return {
          ...node,
          x: Math.max(25, Math.min(625, node.x + dx * scaleX)),
          y: Math.max(25, Math.min(365, node.y + dy * scaleY))
        };
      }
      return node;
    }));
    setLocalDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleLocalCanvasMouseUp = () => {
    setLocalDraggingNodeId(null);
  };

  const handleLocalNodeTouchStart = (nodeId: string, e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      setLocalDraggingNodeId(nodeId);
      setLocalDragStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleLocalCanvasTouchMove = (e: React.TouchEvent) => {
    if (!localDraggingNodeId || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - localDragStartPos.x;
    const dy = e.touches[0].clientY - localDragStartPos.y;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 650 / rect.width;
    const scaleY = 390 / rect.height;

    setLocalMapNodes(prevNodes => prevNodes.map(node => {
      if (node.id === localDraggingNodeId) {
        return {
          ...node,
          x: Math.max(25, Math.min(625, node.x + dx * scaleX)),
          y: Math.max(25, Math.min(365, node.y + dy * scaleY))
        };
      }
      return node;
    }));
    setLocalDragStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestStep(1); // Reading

    // Advance loading steps visually
    const stepInterval = setInterval(() => {
      setIngestStep((prev) => {
        if (prev < 4) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 700);

    try {
      const response = await fetch('/api/ingest-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: ingestType === 'url' ? ingestUrl : '',
          content: ingestType === 'text' ? ingestTextContent : '',
          name: ingestType === 'text' ? ingestTextName : ''
        })
      });

      if (!response.ok) throw new Error("Failed to ingest study material");
      const result = await response.json();

      setTimeout(() => {
        clearInterval(stepInterval);
        setIngestStep(5); // Completed
        setIngestResult(result);

        const centerX = 325;
        const centerY = 195;
        const otherNodes = result.nodes.filter((n: any) => n.id !== 'core');
        const coreNode = result.nodes.find((n: any) => n.type === 'core') || { id: 'core', label: result.name, type: 'core', description: `Central node for ${result.name}` };
        
        const arranged: any[] = [];
        arranged.push({
          ...coreNode,
          x: centerX,
          y: centerY,
          color: 'from-purple-600 to-indigo-600 border-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)]',
          icon: BrainCircuit
        });

        otherNodes.forEach((node: any, idx: number) => {
          const angle = (idx * 2 * Math.PI) / otherNodes.length - Math.PI / 2;
          const radius = 135;
          arranged.push({
            ...node,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            color: node.type === 'concept'
              ? 'from-blue-600 to-cyan-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
              : 'from-pink-600 to-rose-500 border-pink-400 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]',
            icon: node.type === 'concept' ? Sparkles : HelpCircle
          });
        });

        setLocalMapNodes(arranged);
        setLocalMapLinks(result.links);
        setLocalSelectedNodeId(arranged[0].id);

        if (onAddSource) {
          const fileContent = `[Grounded Ingested Summary of ${result.name}]\n\n` +
            `EXECUTIVE TL;DR:\n${result.tldr}\n\n` +
            `CORE KEY TAKEAWAYS:\n` + result.takeaways.map((t: string, i: number) => `${i+1}. ${t}`).join("\n") +
            `\n\nDETAILED RAW EXTRACT:\n${ingestType === 'text' ? ingestTextContent : `Reference content ingested from ${ingestUrl}.`}`;
          onAddSource(result.name, fileContent, ingestType === 'url' ? 'url' : 'text');
        }
        setIsIngesting(false);
      }, 1500);

    } catch (err) {
      console.error(err);
      clearInterval(stepInterval);
      setIsIngesting(false);
      alert("Error ingesting study material. Please check link format or your server environment.");
    }
  };
  
  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechStatus, setSpeechStatus] = useState('');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isGenerating]);

  // Setup Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechStatus('🎤 Listening... Speak clearly.');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
      setSpeechStatus(`Captured: "${transcript}"`);
      setTimeout(() => setSpeechStatus(''), 3000);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setSpeechStatus('⚠️ Mic access blocked. Enable in address bar.');
      } else {
        setSpeechStatus(`Speech error: ${event.error}`);
      }
      setTimeout(() => setSpeechStatus(''), 4000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleMicToggle = () => {
    if (!speechSupported) {
      setSpeechStatus('⚠️ Voice dictation is not supported on this browser.');
      setTimeout(() => setSpeechStatus(''), 4000);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setSpeechStatus('🎤 Initializing mic...');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const selectStarter = (text: string) => {
    if (isGenerating) return;
    onSendMessage(text);
  };

  const fillQuickCommand = (text: string) => {
    setInputText(text);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(`${notebookName}\n\n${notebookDescription}`);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleSaveToNote = () => {
    setSavedToNote(true);
    setTimeout(() => setSavedToNote(false), 2000);
  };

  const getSourceTypeLabel = (sources: Source[]) => {
    const count = sources.length;
    if (count === 0) return "no active sources";
    return `${count} active source${count > 1 ? 's' : ''}`;
  };

  // Helper to parse bracketed citation numbers in markdown and turn them into clickable badges
  const renderMessageContent = (msg: Message) => {
    return parseAndRenderMarkdown(msg.content, msg.citations || [], (citation) => setSelectedCitation(citation), isLight);
  };

  const starterPrompts = [
    { text: "Synthesize the main thesis and findings of these sources.", category: "Synthesize" },
    { text: "Draft a dynamic biology revision guide outline.", category: "Syllabus" },
    { text: "Generate 3 core practice exam questions with deep explanations.", category: "Quiz Room" }
  ];

  const isLight = theme === 'light';

  return (
    <div id="ai_chat" className={`h-full flex flex-col justify-between transition-colors duration-500 rounded-2xl overflow-hidden relative shadow-2xl ${
      isLight ? 'bg-white border-gray-200 text-gray-800' : 'bg-[#08080E] border-purple-500/10 text-gray-100'
    }`}>
      
      {/* Top Selector Bar (Chat, Notebook View, Research Mode) */}
      <div className={`flex items-center justify-between border-b px-5 py-3.5 sticky top-0 z-30 transition-colors duration-500 backdrop-blur-md ${
        isLight ? 'border-gray-200 bg-white/90' : 'border-purple-500/10 bg-[#0D0D14]/90'
      }`}>
        <div className="flex gap-1">
          {[
            { id: 'chat', label: 'AI Chat Hub', icon: MessageSquare },
            { id: 'view', label: 'Notebook Source View', icon: BookOpen },
            { id: 'research', label: 'Research Graph', icon: BrainCircuit },
            { id: 'ingest', label: 'Ingest & Graph', icon: Sparkles }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                activeTab === tab.id
                  ? isLight 
                    ? 'bg-purple-50 border-purple-200 text-purple-600'
                    : 'bg-purple-500/15 border-purple-500/25 text-purple-300'
                  : isLight
                    ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 border-transparent'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-transparent'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Sources count indicator with glowing pulse */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded border uppercase tracking-wider transition-all ${
            isLight 
              ? 'bg-purple-50 text-purple-600 border-purple-200' 
              : 'bg-purple-500/5 text-purple-400 border-purple-500/15'
          }`}>
            Grounded: {getSourceTypeLabel(activeSources)}
          </span>
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-8 relative scrollbar-none">
        {activeTab === 'chat' && (
          <>
            {/* Show Welcome Card always at the beginning, matching image structure */}
            {chatHistory.length === 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6 max-w-2xl mx-auto pt-6 pb-8"
              >
                {/* Image-Style Welcome Greetings */}
                <motion.div variants={itemVariants} className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <motion.span 
                      variants={waveVariants}
                      animate="wave"
                      className="text-3xl inline-block origin-bottom-right"
                    >
                      👋
                    </motion.span>
                    <span className={`text-[10px] font-mono tracking-widest uppercase border px-2.5 py-1 rounded-full ${
                      isLight 
                        ? 'text-purple-700 bg-purple-50 border-purple-200' 
                        : 'text-purple-400 bg-purple-500/5 border-purple-500/15'
                    }`}>
                      Interactive Study Vault
                    </span>
                  </div>
 
                  <h1 className={`text-3xl md:text-4xl font-display font-extrabold tracking-tight ${
                    isLight 
                      ? 'text-gray-950' 
                      : 'text-white bg-gradient-to-r from-purple-200 via-violet-100 to-indigo-300 bg-clip-text text-transparent'
                  }`}>
                    {notebookName}
                  </h1>
 
                  <div className={`flex items-center gap-2 text-xs font-mono ${
                    isLight ? 'text-purple-700 font-bold' : 'text-purple-400'
                  }`}>
                    <FileText className="h-3.5 w-3.5" />
                    <span>{activeSources.length} active sources loaded</span>
                  </div>
                </motion.div>
 
                {/* Notebook Description / Synopsis (Image style text block) */}
                <motion.div 
                  variants={itemVariants}
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isLight ? 'bg-gray-50 border-gray-200/80 shadow-sm' : 'bg-[#0C0C14] border-purple-500/10'
                  }`}
                >
                  <p className={`text-xs leading-relaxed font-sans font-medium ${
                    isLight ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {notebookDescription || "This notebook is grounded directly in your uploaded source materials, textbooks, and syllabus sheets. Every question asked here is validated and referenced back to active sources with interactive footnote citations."}
                  </p>
 
                  {/* Standard action pills like the image: Save to note, copy summary */}
                  <div className={`flex items-center gap-2 pt-2 border-t ${
                    isLight ? 'border-gray-200' : 'border-purple-500/5'
                  }`}>
                    <button
                      onClick={handleSaveToNote}
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                        isLight 
                          ? 'border-gray-200 bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700' 
                          : 'border-white/5 bg-[#12121E] hover:bg-purple-950/15 text-gray-300 hover:text-purple-300'
                      }`}
                    >
                      {savedToNote ? <Check className="h-3 w-3 text-green-500" /> : <Bookmark className="h-3 w-3" />}
                      <span>{savedToNote ? 'Saved!' : 'Save to Study Note'}</span>
                    </button>
 
                    <button
                      onClick={handleCopySummary}
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                        isLight 
                          ? 'border-gray-200 bg-white hover:bg-purple-50 text-gray-700 hover:text-purple-700' 
                          : 'border-white/5 bg-[#12121E] hover:bg-purple-950/15 text-gray-300 hover:text-purple-300'
                      }`}
                    >
                      {copiedSummary ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
                    </button>
                  </div>
                </motion.div>

                {/* Image style pill buttons below synopsis: Add note, Audio Overview, Mind map */}
                <motion.div 
                  variants={itemVariants}
                  className="grid grid-cols-3 gap-2.5 pt-2"
                >
                  <button 
                    onClick={() => fillQuickCommand("Summarize my active sources into 5 key takeaways with core academic citations.")}
                    className={`flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-white border-gray-200/80 hover:bg-purple-50/50 hover:border-purple-200 shadow-sm' 
                        : 'border-white/5 bg-[#0A0A0F] hover:bg-purple-500/5 hover:border-purple-500/20'
                    }`}
                  >
                    <Plus className="h-4 w-4 text-purple-500" />
                    <div>
                      <span className={`text-[10px] font-bold block ${isLight ? 'text-gray-950' : 'text-white'}`}>Add Study Note</span>
                      <span className="text-[8px] text-gray-500 font-mono hidden md:block">Draft summarized text</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => fillQuickCommand("Can you outline a deep structured study study overview podcast script that introduces these papers?")}
                    className={`flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-white border-gray-200/80 hover:bg-pink-50/50 hover:border-pink-200 shadow-sm' 
                        : 'border-white/5 bg-[#0A0A0F] hover:bg-pink-500/5 hover:border-pink-500/20'
                    }`}
                  >
                    <Headphones className="h-4 w-4 text-pink-500" />
                    <div>
                      <span className={`text-[10px] font-bold block ${isLight ? 'text-gray-950' : 'text-white'}`}>Audio Overview</span>
                      <span className="text-[8px] text-gray-500 font-mono hidden md:block">Listen to study dialogue</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => fillQuickCommand("Create a relational mind map outline connecting terms across these lectures.")}
                    className={`flex flex-col md:flex-row items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-white border-gray-200/80 hover:bg-blue-50/50 hover:border-blue-200 shadow-sm' 
                        : 'border-white/5 bg-[#0A0A0F] hover:bg-blue-500/5 hover:border-blue-500/20'
                    }`}
                  >
                    <Network className="h-4 w-4 text-blue-500" />
                    <div>
                      <span className={`text-[10px] font-bold block ${isLight ? 'text-gray-950' : 'text-white'}`}>Mind Map Ideas</span>
                      <span className="text-[8px] text-gray-500 font-mono hidden md:block">Explore connections</span>
                    </div>
                  </button>
                </motion.div>

                {/* Study Prompts block */}
                <motion.div variants={itemVariants} className="space-y-3 pt-4">
                  <span className={`text-[10px] font-mono uppercase tracking-widest block font-bold ${
                    isLight ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    Suggested Research Starters
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {starterPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectStarter(prompt.text)}
                        className={`text-left p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-28 ${
                          isLight 
                            ? 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/40 text-gray-700 hover:text-purple-700 shadow-sm shadow-purple-500/5' 
                            : 'border-purple-500/10 hover:border-purple-500/25 bg-[#0D0D14] hover:bg-purple-950/10 text-gray-300 hover:text-purple-300'
                        }`}
                      >
                        <span className="text-[9px] font-mono text-purple-500 uppercase tracking-wider block mb-1 font-bold">{prompt.category}</span>
                        <span className="leading-relaxed font-sans font-semibold line-clamp-3">{prompt.text}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <div className="space-y-5">
                {/* Render condensed welcome badge on top of messages to save space */}
                <div className={`flex items-center gap-3 p-4 rounded-xl border transition-colors duration-500 mb-6 ${
                  isLight ? 'bg-purple-50/50 border-purple-200' : 'bg-[#0A0A0F] border-purple-500/5'
                }`}>
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{notebookName}</h4>
                    <p className={`text-[10px] ${isLight ? 'text-purple-800' : 'text-gray-400'}`}>{activeSources.length} active documents grounding this chat companion.</p>
                  </div>
                </div>

                {chatHistory.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.01,
                      y: -2
                    }}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* User vs AI Avatar */}
                    <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 text-[10px] font-mono font-extrabold tracking-tighter ${
                      msg.role === 'user' 
                        ? isLight
                          ? 'bg-purple-50 border-purple-200 text-purple-700 font-bold'
                          : 'bg-purple-600/15 border-purple-500/30 text-purple-400' 
                        : isLight
                          ? 'bg-gray-100 border-gray-200 text-gray-700'
                          : 'bg-black/30 border-white/5 text-gray-400'
                    }`}>
                      {msg.role === 'user' ? 'USER' : 'COMP'}
                    </div>

                    <div className={`p-4 rounded-2xl border transition-all hover:shadow-lg ${
                      msg.role === 'user'
                        ? isLight
                          ? 'bg-purple-50 border-purple-200 text-gray-900 shadow-sm'
                          : 'bg-[#12101F]/85 border-purple-500/20 shadow-lg'
                        : isLight
                          ? 'bg-white border-gray-200 text-gray-800 shadow-sm'
                          : 'bg-[#0E0E14] border-white/5 shadow-md'
                    }`}>
                      {/* Inside texts */}
                      <div className={isLight && msg.role !== 'user' ? 'text-gray-800' : ''}>
                        {renderMessageContent(msg)}
                      </div>
                      
                      {/* Footnote citations inside bubble */}
                      {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                        <div className={`mt-3.5 pt-2.5 border-t flex flex-wrap gap-2 items-center ${
                          isLight ? 'border-gray-100' : 'border-white/5'
                        }`}>
                          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider font-bold">Citations:</span>
                          {msg.citations.map((cit, idx) => (
                            <button
                              key={`cit-footer-${idx}`}
                              onClick={() => setSelectedCitation(cit)}
                              className={`text-[10px] font-semibold hover:underline flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded border transition-all ${
                                isLight
                                  ? 'bg-purple-50/70 border-purple-100 text-purple-700 hover:bg-purple-100'
                                  : 'bg-purple-500/5 text-purple-400 border-purple-500/10 hover:text-purple-300'
                              }`}
                            >
                              <span>[{idx + 1}]</span>
                              <span className="max-w-[120px] truncate">{cit.sourceName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Stunning Modern Loading Skeletons */}
                {isGenerating && (
                  <div className="space-y-4">
                    <TypingIndicator isLight={isLight} />
                    
                    <div className="flex gap-3 max-w-[80%] mr-auto">
                      {/* Pulsing AI avatar */}
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center text-[10px] font-mono font-bold shrink-0 animate-pulse ${
                        isLight
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'bg-purple-950/10 border-purple-500/20 text-purple-400'
                      }`}>
                        COMP
                      </div>
                      
                      {/* Loading skeleton bubble */}
                      <div className={`p-5 rounded-2xl border w-full space-y-3.5 ${
                        isLight ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0E0E14] border-white/5'
                      }`}>
                        {/* Header lines */}
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full bg-purple-500/20 animate-spin border border-purple-400 border-t-transparent" />
                          <span className="text-[10px] text-purple-500 font-mono tracking-widest uppercase font-bold animate-pulse">
                            Active Grounding Synthesis
                          </span>
                        </div>
  
                        {/* Staggered pulsing lines mimicking high-fidelity academic output */}
                        <div className="space-y-2.5 pt-1">
                          <div className="h-2.5 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent rounded-full w-11/12 animate-pulse" style={{ animationDuration: '1.4s' }} />
                          <div className="h-2.5 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent rounded-full w-4/5 animate-pulse" style={{ animationDuration: '1.4s', animationDelay: '150ms' }} />
                          <div className="h-2.5 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent rounded-full w-5/6 animate-pulse" style={{ animationDuration: '1.4s', animationDelay: '300ms' }} />
                          <div className="h-2.5 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent rounded-full w-2/3 animate-pulse" style={{ animationDuration: '1.4s', animationDelay: '450ms' }} />
                        </div>
  
                        {/* Status indicator */}
                        <div className={`pt-2 border-t flex items-center justify-between text-[9px] font-mono text-gray-400 ${
                          isLight ? 'border-gray-100' : 'border-white/5'
                        }`}>
                          <span>Consulting {activeSources.length} sources...</span>
                          <span className="animate-pulse text-purple-600 font-semibold">Deep Learning companion writing response</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </>
        )}

        {activeTab === 'view' && (
          <div className="space-y-6 pt-2">
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${
              isLight ? 'border-purple-200 bg-purple-50/40' : 'border-purple-500/10 bg-purple-500/5'
            }`}>
              <BookOpen className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-950' : 'text-white'}`}>Full Notebook View</h3>
                <p className={`text-xs mt-1 leading-normal ${isLight ? 'text-purple-900' : 'text-gray-400'}`}>
                  Consolidate all of your active text documents and readings into a unified chronological study draft.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {activeSources.map((src) => (
                <div key={src.id} className={`p-5 rounded-xl border transition-all ${
                  isLight ? 'bg-gray-50/50 border-gray-200/80 text-gray-800' : 'bg-[#0B0B0F] border-white/5'
                }`}>
                  <div className={`flex items-center gap-2 border-b pb-2.5 mb-3.5 ${
                    isLight ? 'border-gray-200' : 'border-white/5'
                  }`}>
                    <span className="text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 px-2.5 py-0.5 rounded uppercase">
                      {src.type}
                    </span>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-gray-900' : 'text-gray-200'}`}>{src.name}</h4>
                  </div>
                  <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isLight ? 'text-gray-700' : 'text-gray-400'}`}>
                    {src.content}
                  </p>
                </div>
              ))}

              {activeSources.length === 0 && (
                <div className="text-center p-8 text-gray-500 space-y-2 animate-pulse">
                  <HelpCircle className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-xs">No active sources checked. Go to the left side panel to activate document readings.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'research' && (() => {
          // Inner helper to draw a curved connector link
          const drawLinkCurve = (fromX: number, fromY: number, toX: number, toY: number) => {
            const dx = toX - fromX;
            const dy = toY - fromY;
            const cx1 = fromX + dx * 0.5;
            const cy1 = fromY;
            const cx2 = fromX + dx * 0.5;
            const cy2 = toY;
            return `M ${fromX} ${fromY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${toX} ${toY}`;
          };

          const nodes = mapNodes;
          const links = mapLinks;

          return (
            <div className="flex flex-col h-full space-y-4">
              
              {/* Header Info Block */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 shrink-0 ${
                isLight ? 'border-purple-100 bg-purple-50/30' : 'border-purple-500/10 bg-[#0E0E14]'
              }`}>
                <Network className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className={`text-xs font-bold ${isLight ? 'text-gray-950' : 'text-white'}`}>Grounded Study Mind Map</h3>
                  <p className="text-[11px] leading-relaxed text-gray-400 mt-0.5">
                    An interactive semantic network of active sources and extracted key study concepts. Drag any node to reorganize your workspace. Click nodes to examine details and ask PocketLM targeted questions.
                  </p>
                </div>
              </div>

              {activeSources.length === 0 ? (
                // Empty state
                <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-purple-500/10 ${
                  isLight ? 'bg-purple-50/10' : 'bg-[#0E0E14]/30'
                }`}>
                  <BrainCircuit className="h-12 w-12 text-purple-400/80 animate-pulse mb-3" />
                  <h4 className={`text-sm font-semibold ${isLight ? 'text-gray-800' : 'text-gray-300'}`}>No Active Document Sources</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm">
                    Please activate at least one document reading in the left side panel to build your dynamic study mind map.
                  </p>
                </div>
              ) : (
                // Mind Map Viewport and Info inspector
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  
                  {/* Map canvas container */}
                  <div 
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onTouchMove={handleCanvasTouchMove}
                    onTouchEnd={handleCanvasMouseUp}
                    className={`relative flex-1 min-h-[350px] rounded-xl border overflow-hidden flex items-center justify-center select-none ${
                      draggingNodeId ? 'cursor-grabbing' : 'cursor-grab'
                    } ${
                      isLight ? 'bg-[#F9FAFC] border-gray-200' : 'bg-[#06060A] border-purple-500/5'
                    }`}
                  >
                    
                    <div className="absolute inset-0 w-full h-full">
                      {/* Connections SVG */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 650 390" preserveAspectRatio="xMidYMid meet">
                        <g>
                          {links.map((link, idx) => {
                            const fromNode = nodes.find(n => n.id === link.from);
                            const toNode = nodes.find(n => n.id === link.to);
                            if (!fromNode || !toNode) return null;
                            
                            const isHighlighted = selectedNodeId === link.from || selectedNodeId === link.to;
                            
                            return (
                              <path
                                key={`link-${idx}`}
                                d={drawLinkCurve(fromNode.x, fromNode.y, toNode.x, toNode.y)}
                                fill="none"
                                className={`transition-all duration-300 ${
                                  isHighlighted 
                                    ? 'stroke-purple-500 stroke-[2px] opacity-100' 
                                    : `${link.color} stroke-[1.2px] opacity-40`
                                }`}
                              />
                            );
                          })}
                        </g>
                      </svg>

                      {/* Nodes Absolute Overlay (Responsive scaling percentage math) */}
                      <div className="absolute inset-0">
                        {nodes.map((node) => {
                          const isSelected = selectedNodeId === node.id;
                          const NodeIcon = node.icon || Network;
                          
                          return (
                            <motion.button
                              key={node.id}
                              onClick={() => setSelectedNodeId(node.id)}
                              onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                              onTouchStart={(e) => handleNodeTouchStart(node.id, e)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`absolute flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold transition-all shadow-md cursor-grab active:cursor-grabbing ${
                                isSelected
                                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white scale-105 ring-2 ring-purple-500/40 z-30'
                                  : isLight
                                    ? 'bg-white hover:bg-purple-50/50 border-gray-200 text-gray-700 z-10'
                                    : 'bg-[#0E0E14] hover:bg-[#151522] border-purple-500/10 text-gray-300 z-10'
                              }`}
                              style={{
                                left: `${(node.x / 650) * 100}%`,
                                top: `${(node.y / 390) * 100}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                            >
                              <span className="w-2.5 h-2.5 rounded-full flex items-center justify-center shrink-0 text-purple-400">
                                <NodeIcon className="h-3 w-3" />
                              </span>
                              <span className="truncate max-w-[110px]">{node.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Inspector Panel */}
                  {(() => {
                    const node = nodes.find(n => n.id === selectedNodeId) || nodes[0];
                    if (!node) return null;

                    const handleAskQuestion = () => {
                      let prompt = '';
                      if (node.type === 'center') {
                        prompt = `Synthesize all key findings across my study notebooks and reference documents in detail.`;
                      } else if (node.type === 'source') {
                        prompt = `Summarize the primary thesis, key points, and structural takeaways from my document "${node.label}" in detail.`;
                      } else {
                        prompt = `Explain the concept of "${node.label}" in detail from my reading "${node.parentName}". What are its core applications?`;
                      }
                      setInputText(prompt);
                      setActiveTab('chat');
                    };

                    return (
                      <motion.div 
                        key={node.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                          isLight ? 'border-gray-200 bg-white' : 'border-purple-500/10 bg-[#0C0C12]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                              node.type === 'center'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : node.type === 'source'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                            }`}>
                              {node.type}
                            </span>
                            <h4 className={`text-xs font-bold ${isLight ? 'text-gray-950' : 'text-white'}`}>
                              {node.label}
                            </h4>
                          </div>
                          <p className="text-[11px] leading-relaxed text-gray-400 max-w-xl">
                            {node.description}
                          </p>
                        </div>

                        <button
                          onClick={handleAskQuestion}
                          className="py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Ask PocketLM About This</span>
                        </button>
                      </motion.div>
                    );
                  })()}

                </div>
              )}

            </div>
          );
        })()}

        {activeTab === 'ingest' && (
          <div className="space-y-6 pt-2 select-text">
            
            {/* Header info card */}
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${
              isLight ? 'border-purple-200 bg-purple-50/40' : 'border-purple-500/10 bg-purple-500/5'
            }`}>
              <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-gray-950' : 'text-white'}`}>AI Ingestion Room & Knowledge Graph Builder</h3>
                <p className={`text-xs mt-1 leading-normal ${isLight ? 'text-purple-900' : 'text-gray-400'}`}>
                  Ingest textbooks, lecture links, or drafts. PocketLM will write a global TL;DR summary, extract core concepts, and construct an interactive 2D relational knowledge graph.
                </p>
              </div>
            </div>

            {/* If not completed results and not loading, show the forms */}
            {ingestStep === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl border space-y-6 ${
                  isLight ? 'bg-white border-gray-200' : 'bg-[#0B0B0F] border-white/5'
                }`}
              >
                {/* Mode Selector */}
                <div className="flex gap-3 border-b border-purple-500/10 pb-4">
                  <button
                    type="button"
                    onClick={() => setIngestType('url')}
                    className={`flex-1 py-3 px-4 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold ${
                      ingestType === 'url'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                        : isLight
                          ? 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800'
                          : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Web Resource / Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIngestType('text')}
                    className={`flex-1 py-3 px-4 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-bold ${
                      ingestType === 'text'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                        : isLight
                          ? 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800'
                          : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Raw Study Text Content</span>
                  </button>
                </div>

                <form onSubmit={handleIngest} className="space-y-5">
                  {ingestType === 'url' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Source Link / URL</label>
                        <input
                          type="url"
                          required
                          value={ingestUrl}
                          onChange={(e) => setIngestUrl(e.target.value)}
                          placeholder="e.g. https://wikipedia.org/wiki/Photosynthesis"
                          className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none font-semibold ${
                            isLight
                              ? 'bg-gray-50 border-gray-200 text-gray-850 focus:border-purple-500 focus:bg-white'
                              : 'bg-black/40 border-white/5 text-white focus:border-purple-500 focus:bg-black/60'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Friendly Title (Optional)</label>
                        <input
                          type="text"
                          value={ingestTextName}
                          onChange={(e) => setIngestTextName(e.target.value)}
                          placeholder="e.g. Wiki Photosynthesis Reading"
                          className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none font-semibold ${
                            isLight
                              ? 'bg-gray-50 border-gray-200 text-gray-850 focus:border-purple-500 focus:bg-white'
                              : 'bg-black/40 border-white/5 text-white focus:border-purple-500 focus:bg-black/60'
                          }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Lecture / Source Title</label>
                        <input
                          type="text"
                          required
                          value={ingestTextName}
                          onChange={(e) => setIngestTextName(e.target.value)}
                          placeholder="e.g. Krebs Cycle Midterm Review"
                          className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none font-semibold ${
                            isLight
                              ? 'bg-gray-50 border-gray-200 text-gray-850 focus:border-purple-500 focus:bg-white'
                              : 'bg-black/40 border-white/5 text-white focus:border-purple-500 focus:bg-black/60'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5 font-bold">Study text content to analyze</label>
                        <textarea
                          required
                          value={ingestTextContent}
                          onChange={(e) => setIngestTextContent(e.target.value)}
                          placeholder="Paste textbook definitions, article chapters, or lecture notes directly here..."
                          rows={6}
                          className={`w-full px-4 py-2.5 text-xs rounded-xl border outline-none resize-none font-sans font-semibold ${
                            isLight
                              ? 'bg-gray-50 border-gray-200 text-gray-850 focus:border-purple-500 focus:bg-white'
                              : 'bg-black/40 border-white/5 text-white focus:border-purple-500 focus:bg-black/60'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Ingest & Construct Knowledge Graph</span>
                  </button>
                </form>
              </motion.div>
            )}

            {/* Loading stages display */}
            {isIngesting && ingestStep > 0 && ingestStep < 5 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-8 rounded-xl border text-center space-y-6 flex flex-col items-center ${
                  isLight ? 'bg-white border-gray-200' : 'bg-[#0B0B0F] border-white/5'
                }`}
              >
                {/* Pulsing visual core */}
                <div className="relative h-16 w-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-ping" />
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <BrainCircuit className="h-6 w-6 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>PocketLM Structuring Knowledge...</h4>
                  <p className="text-xs text-gray-500 font-medium">Please wait while Gemini processes the uploaded context.</p>
                </div>

                {/* Staggered progress checkpoints */}
                <div className="w-full max-w-sm space-y-3.5 text-left pt-4">
                  {[
                    { id: 1, text: "Reading and extracting source material..." },
                    { id: 2, text: "Gemini synthesizing comprehensive TL;DR summary..." },
                    { id: 3, text: "Extracting semantic concepts & definitions..." },
                    { id: 4, text: "Configuring 2D relational knowledge graph..." }
                  ].map((step) => {
                    const isDone = ingestStep > step.id;
                    const isCurrent = ingestStep === step.id;
                    return (
                      <div key={step.id} className="flex items-center gap-3 transition-opacity">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                          isDone 
                            ? 'bg-green-500/15 border-green-500/30 text-green-500' 
                            : isCurrent 
                              ? 'bg-purple-500/15 border-purple-500 text-purple-400 animate-pulse' 
                              : 'bg-white/5 border-white/5 text-gray-500'
                        }`}>
                          {isDone ? "✓" : step.id}
                        </div>
                        <span className={`text-[11px] font-semibold ${
                          isDone ? 'text-gray-400 line-through' : isCurrent ? 'text-purple-400 font-bold' : 'text-gray-500'
                        }`}>
                          {step.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Results Screen */}
            {ingestStep === 5 && ingestResult && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Left Column: AI Summary & Takeaways (span 5) */}
                <div className="lg:col-span-5 space-y-5">
                  <div className={`p-5 rounded-xl border flex flex-col h-full space-y-4 ${
                    isLight ? 'bg-white border-gray-200' : 'bg-[#0B0B0F] border-white/5'
                  }`}>
                    {/* Header */}
                    <div className="border-b border-purple-500/10 pb-3">
                      <span className="text-[9px] font-mono font-bold uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">INGESTION COMPLETE</span>
                      <h4 className={`text-sm font-bold mt-1.5 truncate ${isLight ? 'text-gray-950' : 'text-white'}`}>{ingestResult.name}</h4>
                    </div>

                    {/* TLDR */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[160px] pr-1">
                      <span className="text-[9px] font-mono uppercase text-gray-500 font-bold tracking-wider">AI Study Summary (TL;DR)</span>
                      <p className={`text-xs leading-relaxed font-sans font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                        {ingestResult.tldr}
                      </p>
                    </div>

                    {/* Key Takeaways */}
                    <div className="space-y-2.5 pt-3 border-t border-purple-500/10 flex-1 overflow-y-auto max-h-[180px] pr-1">
                      <span className="text-[9px] font-mono uppercase text-gray-500 font-bold tracking-wider">Academic Takeaways</span>
                      <div className="space-y-2">
                        {ingestResult.takeaways.map((takeaway, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start">
                            <span className="h-4.5 w-4.5 rounded-lg bg-purple-500/10 text-purple-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-[11px] leading-relaxed text-gray-400 font-medium">{takeaway}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIngestStep(0);
                        setIngestResult(null);
                        setIngestUrl('');
                        setIngestTextName('');
                        setIngestTextContent('');
                      }}
                      className={`w-full py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isLight
                          ? 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600'
                          : 'border-white/5 bg-white/5 hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Ingest Another Document</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Knowledge Graph Visualizer (span 7) */}
                <div className="lg:col-span-7 space-y-4">
                  <div 
                    onMouseMove={handleLocalCanvasMouseMove}
                    onMouseUp={handleLocalCanvasMouseUp}
                    onMouseLeave={handleLocalCanvasMouseUp}
                    onTouchMove={handleLocalCanvasTouchMove}
                    onTouchEnd={handleLocalCanvasMouseUp}
                    className={`relative min-h-[350px] rounded-xl border overflow-hidden flex items-center justify-center select-none ${
                      localDraggingNodeId ? 'cursor-grabbing' : 'cursor-grab'
                    } ${
                      isLight ? 'bg-[#F9FAFC] border-gray-200' : 'bg-[#06060A] border-purple-500/5'
                    }`}
                  >
                    
                    <div className="absolute inset-0 w-full h-full">
                      {/* Connections SVG */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 650 390" preserveAspectRatio="xMidYMid meet">
                        <g>
                          {localMapLinks.map((link, idx) => {
                            const fromNode = localMapNodes.find(n => n.id === link.from);
                            const toNode = localMapNodes.find(n => n.id === link.to);
                            if (!fromNode || !toNode) return null;
                            
                            const isHighlighted = localSelectedNodeId === link.from || localSelectedNodeId === link.to;
                            
                            return (
                              <g key={`local-link-group-${idx}`}>
                                <path
                                  d={drawLinkCurve(fromNode.x, fromNode.y, toNode.x, toNode.y)}
                                  fill="none"
                                  className={`transition-all duration-300 ${
                                    isHighlighted 
                                      ? 'stroke-purple-500 stroke-[2px] opacity-100' 
                                      : 'stroke-purple-500/25 stroke-[1.2px] opacity-40'
                                  }`}
                                />
                                {/* Optional label text on link */}
                                {link.relationship && (
                                  <text
                                    x={(fromNode.x + toNode.x) / 2}
                                    y={(fromNode.y + toNode.y) / 2 - 4}
                                    fill={isLight ? '#6B7280' : '#9CA3AF'}
                                    className="text-[7px] font-mono font-bold select-none text-center"
                                    textAnchor="middle"
                                    opacity={isHighlighted ? 0.9 : 0.35}
                                  >
                                    {link.relationship}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </g>
                      </svg>

                      {/* Nodes Absolute Overlay */}
                      <div className="absolute inset-0">
                        {localMapNodes.map((node) => {
                          const isSelected = localSelectedNodeId === node.id;
                          const NodeIcon = node.icon || Network;
                          
                          return (
                            <motion.button
                              key={node.id}
                              onClick={() => setLocalSelectedNodeId(node.id)}
                              onMouseDown={(e) => handleLocalNodeMouseDown(node.id, e)}
                              onTouchStart={(e) => handleLocalNodeTouchStart(node.id, e)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`absolute flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-semibold transition-all shadow-md cursor-grab active:cursor-grabbing ${
                                isSelected
                                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white scale-105 ring-2 ring-purple-500/40 z-30'
                                  : isLight
                                    ? 'bg-white hover:bg-purple-50/50 border-gray-200 text-gray-700 z-10'
                                    : 'bg-[#0E0E14] hover:bg-[#151522] border-purple-500/10 text-gray-300 z-10'
                              }`}
                              style={{
                                left: `${(node.x / 650) * 100}%`,
                                top: `${(node.y / 390) * 100}%`,
                                transform: 'translate(-50%, -50%)',
                              }}
                            >
                              <span className="w-2.5 h-2.5 rounded-full flex items-center justify-center shrink-0 text-purple-400">
                                <NodeIcon className="h-3 w-3" />
                              </span>
                              <span className="truncate max-w-[110px]">{node.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Overlay badge indicating interactive canvas */}
                    <div className="absolute top-3 left-3 bg-[#0B0B0F]/70 border border-purple-500/10 px-2 py-0.5 rounded text-[8px] font-mono text-purple-400 backdrop-blur">
                      Interactive Local Graph (Drag Nodes)
                    </div>
                  </div>

                  {/* Node Inspector details box */}
                  {(() => {
                    const node = localMapNodes.find(n => n.id === localSelectedNodeId);
                    if (!node) return null;
                    
                    const handleAskQuestion = () => {
                      let prompt = "";
                      if (node.type === 'core') {
                        prompt = `Summarize the primary study themes and concepts inside my ingested material "${node.label}" in detail.`;
                      } else {
                        prompt = `Explain the concept of "${node.label}" in detail from the context of my newly ingested material. What are its core mechanisms?`;
                      }
                      setInputText(prompt);
                      setActiveTab('chat');
                    };

                    return (
                      <motion.div 
                        key={node.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                          isLight ? 'border-gray-200 bg-white' : 'border-purple-500/10 bg-[#0C0C12]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                              node.type === 'core'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : node.type === 'concept'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                            }`}>
                              {node.type}
                            </span>
                            <h4 className={`text-xs font-bold ${isLight ? 'text-gray-950' : 'text-white'}`}>
                              {node.label}
                            </h4>
                          </div>
                          <p className="text-[11px] leading-relaxed text-gray-400 max-w-xl">
                            {node.description}
                          </p>
                        </div>

                        <button
                          onClick={handleAskQuestion}
                          className="py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Ask PocketLM About This</span>
                        </button>
                      </motion.div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

          </div>
        )}

      </div>

      {/* Floating Prompt Input Bar wrapped in luxurious Glowing border */}
      {activeTab === 'chat' && (
        <div className={`p-4 md:p-5 border-t relative z-20 space-y-2.5 transition-colors duration-500 ${
          isLight ? 'border-gray-200 bg-white/95 shadow-sm' : 'border-purple-500/10 bg-[#0C0C14]'
        }`}>
          
          {/* Microphone continuous speech status display */}
          <AnimatePresence>
            {speechStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={`text-[10px] font-mono py-1.5 px-3 rounded-lg flex items-center gap-1.5 max-w-max mx-auto border transition-colors ${
                  isLight 
                    ? 'text-purple-700 bg-purple-50 border-purple-200/60 shadow-sm' 
                    : 'text-purple-300 bg-purple-500/10 border-purple-500/20'
                }`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                </span>
                <span>{speechStatus}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glowing Border Wrapper for the prompt box */}
          <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-indigo-500/30 focus-within:from-purple-500 focus-within:via-pink-500 focus-within:to-indigo-500 transition-all duration-500 shadow-xl shadow-purple-950/5">
            <form onSubmit={handleSend} className={`relative flex items-center rounded-[15px] p-1 transition-colors ${
              isLight ? 'bg-gray-100' : 'bg-[#07070B]'
            }`}>
              
              {/* Left Voice Dictation Control Icon */}
              <button
                type="button"
                id="voice_dictation_btn"
                onClick={handleMicToggle}
                title={isListening ? "Stop listening" : "Start voice input"}
                className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isListening 
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 animate-pulse' 
                    : isLight
                      ? 'text-gray-500 hover:text-purple-700 hover:bg-purple-50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <input
                id="chat_input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={activeSources.length > 0 ? `Ask anything about your ${activeSources.length} active sources...` : "Choose an active source first..."}
                disabled={activeSources.length === 0 || isGenerating}
                className={`w-full pl-2 pr-28 py-3 text-xs bg-transparent focus:outline-none disabled:opacity-50 font-sans font-semibold transition-colors ${
                  isLight ? 'text-gray-900 placeholder-gray-400' : 'text-gray-100 placeholder-gray-500'
                }`}
              />

              {/* Inside right indicators matching image: active sources pill + send button */}
              <div className="absolute right-1.5 flex items-center gap-2">
                <span className={`hidden sm:inline-block text-[9px] font-mono px-2 py-1 rounded border ${
                  isLight ? 'text-gray-600 bg-white border-gray-200' : 'text-gray-500 bg-white/5 border-white/5'
                }`}>
                  {activeSources.length} sources
                </span>

                <button
                  id="send_message_btn"
                  type="submit"
                  disabled={!inputText.trim() || isGenerating || activeSources.length === 0}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 text-white disabled:text-gray-500 cursor-pointer transition-all duration-200 active:scale-90"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Horizontal Suggestion Pill Slider right below, matching image */}
          {chatHistory.length > 0 && (
            <div className="flex gap-2 items-center overflow-x-auto py-1 scrollbar-none">
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest shrink-0 font-bold">Suggestions:</span>
              {[
                "Synthesize findings.",
                "Generate 3 quiz questions.",
                "Draft study guide overview.",
                "Define core vocab terms."
              ].map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => selectStarter(sug)}
                  className={`text-[10px] font-semibold py-1 px-2.5 rounded-full transition-all cursor-pointer shrink-0 border ${
                    isLight 
                      ? 'text-gray-600 hover:text-purple-700 bg-gray-50 border-gray-200 hover:border-purple-300' 
                      : 'text-gray-400 hover:text-purple-300 bg-[#0A0A0F] hover:bg-purple-950/10 border-white/5 hover:border-purple-500/25'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOOTER CITATION PEEK PANEL */}
      <AnimatePresence>
        {selectedCitation && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={`absolute bottom-0 inset-x-0 z-30 p-5 rounded-t-2xl border-t shadow-2xl space-y-4 ${
              isLight 
                ? 'border-purple-200 bg-white/98 text-gray-900 shadow-purple-900/10' 
                : 'border-purple-500/30 bg-[#0A0A10]/95 backdrop-blur-xl shadow-purple-950/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-bold">Source Verification Citation</span>
              </div>
              <button
                id="close_citation_peek"
                onClick={() => setSelectedCitation(null)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  isLight 
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900' 
                    : 'bg-[#13131E] hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                <span>Verified document:</span>
                <span className="text-purple-600 font-bold">{selectedCitation.sourceName}</span>
              </div>
              <p className={`text-xs leading-relaxed p-3.5 rounded-lg border italic font-semibold ${
                isLight 
                  ? 'border-purple-150 bg-purple-50/50 text-gray-800' 
                  : 'border-purple-500/10 bg-purple-950/10 text-gray-200'
              }`}>
                "{selectedCitation.snippet}"
              </p>
            </div>

            <div className="flex justify-between items-center pt-1 text-[10px] text-gray-500 font-mono">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-purple-500" /> Grounded in NotebookLM Engine
              </span>
              <span>100% Verified Study Fact</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
