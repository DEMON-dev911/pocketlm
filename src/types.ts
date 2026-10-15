export interface Source {
  id: string;
  name: string;
  content: string;
  type: 'pdf' | 'doc' | 'text' | 'url';
  active: boolean;
  wordCount: number;
}

export interface Citation {
  id: string;
  sourceId: string;
  sourceName: string;
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  reviewed?: boolean;
}

export interface PodcastTurn {
  id: string;
  speaker: 'Aidan' | 'Maya';
  text: string;
}

export interface Notebook {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  sources: Source[];
  chatHistory: Message[];
  flashcards: Flashcard[];
  podcastTurns?: PodcastTurn[];
  tags?: string[];
}
