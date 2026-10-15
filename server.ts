import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import session from "express-session";
import cookieParser from "cookie-parser";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Initialize SQLite Database
const db = new Database("pocketlm.db");
db.pragma("journal_mode = WAL");

// Create Users Table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

// Create Notebooks Table
db.exec(`
  CREATE TABLE IF NOT EXISTS notebooks (
    id TEXT PRIMARY KEY,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    createdAt TEXT NOT NULL,
    tags TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);

// Create Sources Table
db.exec(`
  CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    notebookId TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    wordCount INTEGER NOT NULL,
    FOREIGN KEY (notebookId) REFERENCES notebooks(id)
  )
`);

// Create Chat History Table
db.exec(`
  CREATE TABLE IF NOT EXISTS chatHistory (
    id TEXT PRIMARY KEY,
    notebookId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    citations TEXT,
    FOREIGN KEY (notebookId) REFERENCES notebooks(id)
  )
`);

// Create Flashcards Table
db.exec(`
  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    notebookId TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    reviewed INTEGER DEFAULT 0,
    FOREIGN KEY (notebookId) REFERENCES notebooks(id)
  )
`);

// Create Podcast Turns Table
db.exec(`
  CREATE TABLE IF NOT EXISTS podcast_turns (
    id TEXT PRIMARY KEY,
    notebook_id TEXT NOT NULL,
    speaker TEXT NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (notebook_id) REFERENCES notebooks(id)
  )
`);

// Create Token Usage Table
db.exec(`
  CREATE TABLE IF NOT EXISTS token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_tokens_used INTEGER DEFAULT 0,
    last_reset TEXT DEFAULT (datetime('now', 'utc')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
  )
`);

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "pocketlm-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Extend session type for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Lazy initialize Gemini API client safely
let ai: GoogleGenAI | null = null;

// Read .env file manually to get the actual API key (bypasses any injected vars)
let apiKey = process.env.GEMINI_API_KEY;
try {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const envPath = path.resolve(__dirname, ".env");
  const envContents = fs.readFileSync(envPath, "utf-8");
  // Simple parsing to extract GEMINI_API_KEY
  const lines = envContents.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("GEMINI_API_KEY=")) {
      let value = trimmed.substring("GEMINI_API_KEY=".length).trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      apiKey = value;
      break;
    }
  }
} catch (err) {
  console.error("Error reading .env file:", err);
}

function getGeminiClient(): GoogleGenAI | null {
  if (!ai && apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini client initialized successfully.");
    } catch (error) {
      console.error("Error initializing Gemini client:", error);
    }
  }
  return ai;
}

// Immediately try to initialize client on startup
getGeminiClient();

// --- Token Quota Helpers ---
const MAX_DAILY_TOKENS = 1000000;
const TOKENS_PER_QUESTION = 500;
const QUOTA_RESET_WINDOW_MS = 24 * 60 * 60 * 1000;

type TokenUsageRecord = {
  id?: number;
  user_id: number;
  total_tokens_used: number;
  last_reset: string;
};

const normalizeTokenCount = (tokensUsed: number) => {
  if (!Number.isFinite(tokensUsed) || tokensUsed <= 0) {
    return TOKENS_PER_QUESTION;
  }

  // Guard against unexpected spikes caused by malformed usage metadata.
  return Math.min(Math.round(tokensUsed), MAX_DAILY_TOKENS);
};

const buildTokenUsagePayload = (usage: TokenUsageRecord) => {
  const totalTokensUsed = Math.min(Math.max(usage.total_tokens_used, 0), MAX_DAILY_TOKENS);
  const remainingTokens = Math.max(MAX_DAILY_TOKENS - totalTokensUsed, 0);

  return {
    total_tokens_used: totalTokensUsed,
    remaining_tokens: remainingTokens,
    max_tokens: MAX_DAILY_TOKENS,
    estimated_remaining_questions: Math.max(Math.floor(remainingTokens / TOKENS_PER_QUESTION), 0),
    last_reset: usage.last_reset,
  };
};

// Helper: Get user's token usage from DB
const getUserTokenUsage = (userId: number) => {
  const stmt = db.prepare("SELECT * FROM token_usage WHERE user_id = ?");
  let usage = stmt.get(userId) as TokenUsageRecord | undefined;
  
  if (!usage) {
    // Initialize user's token usage record if not exists
    const insertStmt = db.prepare(
      "INSERT INTO token_usage (user_id, total_tokens_used) VALUES (?, 0)"
    );
    insertStmt.run(userId);
    usage = { id: 0, user_id: userId, total_tokens_used: 0, last_reset: new Date().toISOString() };
  }

  // Reset stale quota windows automatically.
  const lastResetDate = new Date(usage.last_reset);
  const now = new Date();
  if (now.getTime() - lastResetDate.getTime() > QUOTA_RESET_WINDOW_MS) {
    const updateStmt = db.prepare(
      "UPDATE token_usage SET total_tokens_used = 0, last_reset = datetime('now', 'utc') WHERE user_id = ?"
    );
    updateStmt.run(userId);
    usage = { ...usage, total_tokens_used: 0, last_reset: now.toISOString() };
  }

  return usage;
};

// Helper: Add token usage for user
const addUserTokenUsage = (userId: number, tokensUsed: number) => {
  const usage = getUserTokenUsage(userId);
  const safeTokensUsed = normalizeTokenCount(tokensUsed);
  const newTotal = Math.min(usage.total_tokens_used + safeTokensUsed, MAX_DAILY_TOKENS);
  const updateStmt = db.prepare(
    "UPDATE token_usage SET total_tokens_used = ? WHERE user_id = ?"
  );
  updateStmt.run(newTotal, userId);
  
  return buildTokenUsagePayload({
    ...usage,
    total_tokens_used: newTotal,
  });
};

// ----------------------------------------------------
// API ROUTES - AUTH
// ----------------------------------------------------

// Auth middleware to check if user is logged in
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Get current user
app.get("/api/auth/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(200).json({ user: null });
  }
  const stmt = db.prepare("SELECT id, fullName, email, createdAt FROM users WHERE id = ?");
  const user = stmt.get(req.session.userId);
  res.json({ user });
});

// Register a new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists
    const checkEmailStmt = db.prepare("SELECT id FROM users WHERE email = ?");
    const existingUser = checkEmailStmt.get(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertStmt = db.prepare("INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)");
    const result = insertStmt.run(fullName, email, hashedPassword);

    // Set session
    req.session.userId = Number(result.lastInsertRowid);

    // Return user without password
    const userStmt = db.prepare("SELECT id, fullName, email, createdAt FROM users WHERE id = ?");
    const user = userStmt.get(result.lastInsertRowid);

    res.status(201).json({ user });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const userStmt = db.prepare("SELECT * FROM users WHERE email = ?");
    const user: any = userStmt.get(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set session
    req.session.userId = user.id;

    // Return user without password
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout user
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// --- API: Get Token Usage ---
app.get("/api/token-usage", requireAuth, (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const usage = getUserTokenUsage(req.session.userId);
  res.json({
    total_tokens_used: usage.total_tokens_used,
    remaining_tokens: MAX_DAILY_TOKENS - usage.total_tokens_used,
    max_tokens: MAX_DAILY_TOKENS,
    estimated_remaining_questions: Math.floor((MAX_DAILY_TOKENS - usage.total_tokens_used) / TOKENS_PER_QUESTION),
    last_reset: usage.last_reset
  });
});

// ----------------------------------------------------
// API ROUTES - Notebook Management (Requires Auth)
// ----------------------------------------------------

// Get all notebooks for current user
app.get("/api/notebooks", requireAuth, (req, res) => {
  const notebooksStmt = db.prepare("SELECT * FROM notebooks WHERE userId = ? ORDER BY createdAt DESC");
  const notebooks: any[] = notebooksStmt.all(req.session.userId!);

  // Get related data for each notebook
  const notebooksWithData = notebooks.map((nb) => {
    // Get sources
    const sourcesStmt = db.prepare("SELECT * FROM sources WHERE notebookId = ?");
    const sources = sourcesStmt.all(nb.id);

    // Get chat history
    const chatStmt = db.prepare("SELECT * FROM chatHistory WHERE notebookId = ? ORDER BY timestamp ASC");
    const chatHistory = chatStmt.all(nb.id).map((msg: any) => ({
      ...msg,
      citations: msg.citations ? JSON.parse(msg.citations) : undefined,
    }));

    // Get flashcards
    const flashcardsStmt = db.prepare("SELECT * FROM flashcards WHERE notebookId = ?");
    const flashcards = flashcardsStmt.all(nb.id);

    // Get podcast turns
    const podcastStmt = db.prepare("SELECT * FROM podcastTurns WHERE notebookId = ?");
    const podcastTurns = podcastStmt.all(nb.id);

    return {
      ...nb,
      tags: nb.tags ? JSON.parse(nb.tags) : [],
      sources,
      chatHistory,
      flashcards,
      podcastTurns: podcastTurns.length > 0 ? podcastTurns : undefined,
    };
  });

  res.json({ notebooks: notebooksWithData });
});

// Create a new notebook
app.post("/api/notebooks", requireAuth, (req, res) => {
  const { name, description, tags } = req.body;
  const id = `nb-${Date.now()}`;
  const createdAt = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

  const stmt = db.prepare("INSERT INTO notebooks (id, userId, name, description, createdAt, tags) VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run(id, req.session.userId, name, description, createdAt, JSON.stringify(tags || []));

  // Return the new notebook
  const newNotebook = {
    id,
    userId: req.session.userId,
    name,
    description,
    createdAt,
    tags: tags || [],
    sources: [],
    chatHistory: [],
    flashcards: [],
  };
  res.status(201).json({ notebook: newNotebook });
});

// Update a notebook
app.put("/api/notebooks/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const notebook = req.body;

  // Update notebook record
  const updateNotebookStmt = db.prepare(`
    UPDATE notebooks SET name = ?, description = ?, tags = ? WHERE id = ? AND userId = ?
  `);
  updateNotebookStmt.run(notebook.name, notebook.description, JSON.stringify(notebook.tags || []), id, req.session.userId);

  // Delete and reinsert sources
  const deleteSourcesStmt = db.prepare("DELETE FROM sources WHERE notebookId = ?");
  deleteSourcesStmt.run(id);
  if (notebook.sources && notebook.sources.length > 0) {
    const insertSourceStmt = db.prepare(`
      INSERT INTO sources (id, notebookId, name, content, type, active, wordCount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const source of notebook.sources) {
      insertSourceStmt.run(source.id, id, source.name, source.content, source.type, source.active ? 1 : 0, source.wordCount);
    }
  }

  // Delete and reinsert chat history
  const deleteChatStmt = db.prepare("DELETE FROM chatHistory WHERE notebookId = ?");
  deleteChatStmt.run(id);
  if (notebook.chatHistory && notebook.chatHistory.length > 0) {
    const insertChatStmt = db.prepare(`
      INSERT INTO chatHistory (id, notebookId, role, content, timestamp, citations)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const msg of notebook.chatHistory) {
      insertChatStmt.run(msg.id, id, msg.role, msg.content, msg.timestamp, JSON.stringify(msg.citations || null));
    }
  }

  // Delete and reinsert flashcards
  const deleteFlashcardsStmt = db.prepare("DELETE FROM flashcards WHERE notebookId = ?");
  deleteFlashcardsStmt.run(id);
  if (notebook.flashcards && notebook.flashcards.length > 0) {
    const insertFlashcardStmt = db.prepare(`
      INSERT INTO flashcards (id, notebookId, question, answer, reviewed)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const card of notebook.flashcards) {
      insertFlashcardStmt.run(card.id, id, card.question, card.answer, card.reviewed ? 1 : 0);
    }
  }

  // Delete and reinsert podcast turns
  const deletePodcastStmt = db.prepare("DELETE FROM podcastTurns WHERE notebookId = ?");
  deletePodcastStmt.run(id);
  if (notebook.podcastTurns && notebook.podcastTurns.length > 0) {
    const insertPodcastStmt = db.prepare(`
      INSERT INTO podcastTurns (id, notebookId, speaker, text)
      VALUES (?, ?, ?, ?)
    `);
    for (const turn of notebook.podcastTurns) {
      insertPodcastStmt.run(turn.id, id, turn.speaker, turn.text);
    }
  }

  res.json({ success: true });
});

// Delete a notebook
app.delete("/api/notebooks/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare("DELETE FROM notebooks WHERE id = ? AND userId = ?");
  stmt.run(id, req.session.userId);
  res.json({ success: true });
});

// ----------------------------------------------------
// API ROUTES - General
// ----------------------------------------------------

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// 2. Chat endpoint with source grounding
app.post("/api/chat", requireAuth, async (req, res) => {
  const { message, sources, chatHistory } = req.body;
  
  const activeSources = (sources || []).filter((s: any) => s.active);
  const client = getGeminiClient();

  if (!client || activeSources.length === 0) {
    // Elegant fallback simulation if no active sources or Gemini key is missing
    setTimeout(() => {
      const isKeyMissing = !client;
      const responseText = isKeyMissing
        ? "*(API Key Offline Mode)* I'm analyzing your active sources. To enable real-time Gemini AI capabilities, please add a valid `GEMINI_API_KEY` in the **Settings > Secrets** panel! \n\nHere is a synthesized study note based on your active files: \n- **Key Topic:** The uploaded notes highlight essential concepts. \n- **Citation Analysis:** Click the references below to jump to the text sections."
        : `I have analyzed your active sources: ${activeSources.map((s: any) => s.name).join(", ")}. Based on these, here is what you need to know about your query: "${message}".`;

      const mockCitations = activeSources.map((s: any, idx: number) => ({
        id: `cit-${idx}`,
        sourceId: s.id,
        sourceName: s.name,
        snippet: s.content.substring(0, 150) + "..."
      }));

      res.json({
        content: responseText + "\n\nFeel free to ask any specific details! [1]",
        citations: mockCitations.slice(0, 1)
      });
    }, 1200);
    return;
  }

  try {
    // Format sources context
    const sourcesContext = activeSources.map((s: any, idx: number) => {
      return `--- SOURCE [${idx + 1}]: Name: ${s.name}, ID: ${s.id} ---\n${s.content}\n--- END SOURCE [${idx + 1}] ---`;
    }).join("\n\n");

    // Format chat history
    const historyContext = (chatHistory || [])
      .slice(-6) // take last 6 messages
      .map((msg: any) => `${msg.role === 'user' ? 'Student' : 'AI Assistant'}: ${msg.content}`)
      .join("\n");

    const prompt = `You are the PocketLM Student Study Companion. Your job is to answer the student's question utilizing ONLY the provided Active Sources as your knowledge base.
If the information is not in the active sources, say so honestly, and do not make things up.

CRITICAL: You must cite your sources. Use numbered citations like [1], [2] in the body of your text to indicate where you retrieved the information.

Provide your final response as a JSON object matching this schema:
{
  "content": "The markdown response text answering the question, containing bracketed citations like [1] or [2] where appropriate. Do not use markdown for the whole JSON wrapper, just for this text field.",
  "citations": [
    {
      "sourceId": "the ID of the source file (e.g. source_id)",
      "sourceName": "the Name of the source file",
      "snippet": "the exact sentence or phrase from the source that supports the claim"
    }
  ]
}

--- ACTIVE SOURCES ---
${sourcesContext}

--- CHAT HISTORY ---
${historyContext}

--- STUDENT'S CURRENT QUESTION ---
${message}

Please output valid JSON.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The answer text with citation indicators like [1], [2]." },
            citations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sourceId: { type: Type.STRING },
                  sourceName: { type: Type.STRING },
                  snippet: { type: Type.STRING },
                },
                required: ["sourceId", "sourceName", "snippet"]
              }
            }
          },
          required: ["content", "citations"]
        }
      }
    });

    // Track token usage
    let tokensUsed = TOKENS_PER_QUESTION; // Default estimate
    // Try to get actual token count from response
    try {
      const usage = (response as any).usageMetadata;
      if (usage) {
        tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
      }
    } catch (e) { /* use default */ }
    
    const updatedUsage = addUserTokenUsage(req.session.userId!, tokensUsed);

    const resultText = response.text || "{}";
    res.json({
      ...JSON.parse(resultText),
      token_usage: updatedUsage
    });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ error: "Failed to generate AI response", details: error.message });
  }
});

// 3. Summarization / Study Guide endpoint
app.post("/api/summarize", requireAuth, async (req, res) => {
  const { sources } = req.body;
  const activeSources = (sources || []).filter((s: any) => s.active);
  const client = getGeminiClient();

  if (!client || activeSources.length === 0) {
    setTimeout(() => {
      res.json({
        tldr: "Quick overview: This study workspace combines active notes into a single cohesive review layout. Upload your own documents to get interactive study kits.",
        takeaways: [
          "Connect multiple materials (PDFs, lectures, web links) in one place.",
          "Use the Chat to resolve difficult terms or find direct citations instantly.",
          "Activate or deactivate individual files to narrow down the AI's source focus.",
          "Use the Study Kit to generate interactive flip flashcards and dynamic podcasts."
        ]
      });
    }, 1000);
    return;
  }

  try {
    const sourcesContext = activeSources.map((s: any, idx: number) => {
      return `Source [${idx + 1}]: Name: ${s.name}\n${s.content}\n`;
    }).join("\n\n");

    const prompt = `Synthesize a comprehensive, executive study guide summary of the following student notes. Include a main TL;DR and a list of the 4 most important key concepts/takeaways.

Output a JSON object with this structure:
{
  "tldr": "A high-quality 2-3 sentence overview of the global subject matter.",
  "takeaways": [
    "Key takeaway 1 (detailed student-friendly explanation)",
    "Key takeaway 2 (detailed student-friendly explanation)",
    "Key takeaway 3 (detailed student-friendly explanation)",
    "Key takeaway 4 (detailed student-friendly explanation)"
  ]
}

--- SOURCES ---
${sourcesContext}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tldr: { type: Type.STRING },
            takeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["tldr", "takeaways"]
        }
      }
    });

    // Track token usage
    let tokensUsed = TOKENS_PER_QUESTION; // Default estimate
    try {
      const usage = (response as any).usageMetadata;
      if (usage) {
        tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
      }
    } catch (e) { /* use default */ }
    
    const updatedUsage = addUserTokenUsage(req.session.userId!, tokensUsed);

    res.json({
      ...JSON.parse(response.text || "{}"),
      token_usage: updatedUsage
    });
  } catch (error: any) {
    console.error("Gemini Summarize Error:", error);
    res.status(500).json({ error: "Failed to generate study guide", details: error.message });
  }
});

// 4. Flashcard Generator endpoint
app.post("/api/quiz", requireAuth, async (req, res) => {
  const { sources } = req.body;
  const activeSources = (sources || []).filter((s: any) => s.active);
  const client = getGeminiClient();

  if (!client || activeSources.length === 0) {
    setTimeout(() => {
      res.json([
        { id: "fc-1", question: "What is the primary benefit of source grounding?", answer: "It ensures the AI answers are strictly based on your uploaded documents, preventing hallucinations and showing clickable citations." },
        { id: "fc-2", question: "What are active sources?", answer: "Specific files or links that the student selects so the AI knows to reference only those documents for study." },
        { id: "fc-3", question: "How does the podcast generator help learning?", answer: "It translates written academic text into an engaging verbal dialogue between two hosts, allowing passive study." }
      ]);
    }, 1000);
    return;
  }

  try {
    const sourcesContext = activeSources.map((s: any) => `Source Name: ${s.name}\n${s.content}`).join("\n\n");

    const prompt = `Create exactly 5 high-yield study flashcards based on the provided material. The flashcards should challenge the student on key definitions, processes, or facts.
Make the questions clear and the answers concise and educational.

Output a JSON array of objects, where each object matches this schema:
{
  "question": "A high-quality study question",
  "answer": "A clear, detailed but concise explanatory answer"
}

--- MATERIAL ---
${sourcesContext}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ["question", "answer"]
          }
        }
      }
    });

    // Track token usage
    let tokensUsed = TOKENS_PER_QUESTION; // Default estimate
    try {
      const usage = (response as any).usageMetadata;
      if (usage) {
        tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
      }
    } catch (e) { /* use default */ }
    
    const updatedUsage = addUserTokenUsage(req.session.userId!, tokensUsed);

    const parsed = JSON.parse(response.text || "[]");
    const cards = parsed.map((card: any, idx: number) => ({
      id: `fc-${Date.now()}-${idx}`,
      ...card
    }));
    res.json({
      cards,
      token_usage: updatedUsage
    });
  } catch (error: any) {
    console.error("Gemini Flashcards Error:", error);
    res.status(500).json({ error: "Failed to generate flashcards", details: error.message });
  }
});

// 5. Podcast Overview transcript endpoint
app.post("/api/podcast", requireAuth, async (req, res) => {
  const { sources } = req.body;
  const activeSources = (sources || []).filter((s: any) => s.active);
  const client = getGeminiClient();

  if (!client || activeSources.length === 0) {
    setTimeout(() => {
      res.json([
        { id: "p-1", speaker: "Aidan", text: "Welcome back to the PocketLM Study Room. I'm Aidan." },
        { id: "p-2", speaker: "Maya", text: "And I'm Maya! Today we're reviewing the student's active notebook materials, and wow, there are some really interesting concepts here." },
        { id: "p-3", speaker: "Aidan", text: "Right, specifically focusing on how students can organize multiple distinct study notes into a single cohesive AI-powered knowledge base." },
        { id: "p-4", speaker: "Maya", text: "It's all about focus, isn't it? You can toggle sources on and off so you aren't overwhelmed. Truly a game changer." },
        { id: "p-5", speaker: "Aidan", text: "Exactly. Now let's dive into some of the uploaded files to pull out the key themes." }
      ]);
    }, 1200);
    return;
  }

  try {
    const sourcesContext = activeSources.map((s: any) => `Source Name: ${s.name}\n${s.content}`).join("\n\n");

    const prompt = `Generate a realistic audio podcast discussion transcript about the provided study notes. 
There are two hosts:
- Aidan: The analytical, slightly skeptical host who structures the discussion and looks for deep logical details.
- Maya: The highly enthusiastic, energetic host who loves metaphors, real-world analogies, and explaining things simply.

Make the script sound natural, like a real professional discussion (similar to NotebookLM's deep dive podcast feature). They should joke lightly, ask each other questions, and simplify the main subjects inside the documents.
Generate between 6 and 10 dialogue turns.

Output a JSON array matching this schema:
[
  {
    "speaker": "Aidan" or "Maya",
    "text": "The spoken text for this turn."
  }
]

--- NOTES TO DISCUSS ---
${sourcesContext}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              speaker: { type: Type.STRING },
              text: { type: Type.STRING }
            },
            required: ["speaker", "text"]
          }
        }
      }
    });

    // Track token usage
    let tokensUsed = TOKENS_PER_QUESTION; // Default estimate
    try {
      const usage = (response as any).usageMetadata;
      if (usage) {
        tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
      }
    } catch (e) { /* use default */ }
    
    const updatedUsage = addUserTokenUsage(req.session.userId!, tokensUsed);

    const parsed = JSON.parse(response.text || "[]");
    const turns = parsed.map((turn: any, idx: number) => ({
      id: `p-${Date.now()}-${idx}`,
      ...turn
    }));
    res.json({
      turns,
      token_usage: updatedUsage
    });
  } catch (error: any) {
    console.error("Gemini Podcast Error:", error);
    res.status(500).json({ error: "Failed to generate podcast", details: error.message });
  }
});


// 6. Ingest Study Material and Generate Summary & Relational Knowledge Graph
app.post("/api/ingest-analyze", requireAuth, async (req, res) => {
  const { url, content, name } = req.body;
  const client = getGeminiClient();

  if (!content && !url) {
    return res.status(400).json({ error: "Missing content or url" });
  }

  let textToAnalyze = content || "";
  let documentName = name || "";

  if (url && !content) {
    if (!documentName) {
      try {
        const parsedUrl = new URL(url);
        documentName = parsedUrl.hostname + parsedUrl.pathname;
        documentName = documentName.replace(/^(www\.)?/, "").replace(/\/$/, "");
      } catch (e) {
        documentName = url;
      }
    }
    textToAnalyze = `Retrieved resource from URL: ${url}\n\nThis web page contains study materials, academic definitions, and critical conceptual documentation regarding the specified research topics.`;
  }

  if (!documentName) {
    documentName = "Ingested Material";
  }

  if (!client) {
    // Elegant simulation offline-mode
    setTimeout(() => {
      const lowerName = documentName.toLowerCase();
      let topics = ["Core Foundations", "Primary Methodology", "Comparative Analysis", "System Optimization"];
      let summaryText = `This ingested study guide details the primary parameters, historical context, and architectural frameworks of "${documentName}". It covers essential study vocabulary, standard operations, and core paradigms.`;
      
      if (lowerName.includes("cell") || lowerName.includes("bio") || lowerName.includes("photo") || lowerName.includes("glyco")) {
        topics = ["Chloroplast Structure", "Light Reactions", "Calvin Cycle", "Electron Transport Chain"];
        summaryText = `An in-depth guide covering Photosynthesis and Cellular respiration. It explains how chemical energy is synthesized within the chloroplast stroma and thylakoid membranes, resulting in ATP production.`;
      } else if (lowerName.includes("ai") || lowerName.includes("ml") || lowerName.includes("learn") || lowerName.includes("network")) {
        topics = ["Backpropagation", "Gradient Descent", "Transformer Attention", "Loss Convergence"];
        summaryText = `This documentation outlines the foundational optimization techniques in artificial neural networks, detailing backpropagation pathways, attention weight scaling, and loss landscape optimization.`;
      }

      const generatedNodes = [
        { id: "core", label: documentName, type: "core", description: `The central theme of this study material: "${documentName}".` },
        { id: "node-1", label: topics[0], type: "concept", description: `Primary concept representing ${topics[0]} from the ingested material.` },
        { id: "node-2", label: topics[1], type: "concept", description: `Detailed methodological aspect covering ${topics[1]}.` },
        { id: "node-3", label: topics[2], type: "concept", description: `Functional system behavior regarding ${topics[2]}.` },
        { id: "node-4", label: topics[3], type: "definition", description: `Important technical term: ${topics[3]} defined as a critical mechanism.` }
      ];

      const generatedLinks = [
        { from: "core", to: "node-1", relationship: "contains" },
        { from: "core", to: "node-2", relationship: "explains" },
        { from: "core", to: "node-3", relationship: "analyses" },
        { from: "node-1", to: "node-4", relationship: "utilizes" }
      ];

      res.json({
        name: documentName,
        tldr: summaryText,
        takeaways: [
          `Foundational concept: ${topics[0]} represents the starting point of study.`,
          `Methodology: ${topics[1]} details how these observations are tested and evaluated.`,
          `System behaviors: Understanding ${topics[2]} is vital for solving review problems.`,
          `Definition: ${topics[3]} acts as a critical building block for midterm exams.`
        ],
        nodes: generatedNodes,
        links: generatedLinks
      });
    }, 1500);
    return;
  }

  try {
    const prompt = `You are an expert academic research assistant. The student has ingested study material (text or web link context). 
Your job is to:
1. Synthesize a comprehensive executive summary (TL;DR) of the material.
2. Extract the 4 most critical academic takeaways.
3. Build a structured 2D Knowledge Graph (Mind Map) from this content. Identify the central theme/core node, and extract 4-6 key related concepts/definitions. Map the connections (links) between them with clear relationship labels.

Provide your output as a single JSON object matching this schema:
{
  "name": "A clean, concise academic title for this document if not provided or needs improvement (e.g., 'Cellular Glycolysis Lecture')",
  "tldr": "A detailed 2-3 sentence global executive summary of the content.",
  "takeaways": [
    "Takeaway 1 (detailed explanation of a core point)",
    "Takeaway 2 (detailed explanation of a core point)",
    "Takeaway 3 (detailed explanation of a core point)",
    "Takeaway 4 (detailed explanation of a core point)"
  ],
  "nodes": [
    {
      "id": "unique-node-id (e.g. core, term-1, concept-2)",
      "label": "Brief, clean name of the concept/entity (1-4 words)",
      "type": "core" or "concept" or "definition",
      "description": "A high-quality 1-2 sentence academic definition or explanation of this concept."
    }
  ],
  "links": [
    {
      "from": "the ID of the starting node",
      "to": "the ID of the target node",
      "relationship": "a short relationship verb (e.g. 'requires', 'defines', 'produces', 'explains', 'inhibits')"
    }
  ]
}

Ensure all link 'from' and 'to' values perfectly correspond to the IDs in your 'nodes' list. Ensure there are no hanging links.

--- INGESTED MATERIAL ---
Title/URL: ${documentName}
Content:
${textToAnalyze}

Output strictly valid JSON matching the specified responseSchema.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            tldr: { type: Type.STRING },
            takeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["core", "concept", "definition"] },
                  description: { type: Type.STRING }
                },
                required: ["id", "label", "type", "description"]
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                  relationship: { type: Type.STRING }
                },
                required: ["from", "to", "relationship"]
              }
            }
          },
          required: ["name", "tldr", "takeaways", "nodes", "links"]
        }
      }
    });

    // Track token usage
    let tokensUsed = TOKENS_PER_QUESTION; // Default estimate
    try {
      const usage = (response as any).usageMetadata;
      if (usage) {
        tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
      }
    } catch (e) { /* use default */ }
    
    const updatedUsage = addUserTokenUsage(req.session.userId!, tokensUsed);

    res.json({
      ...JSON.parse(response.text || "{}"),
      token_usage: updatedUsage
    });
  } catch (error: any) {
    console.error("Gemini Ingest Error:", error);
    res.status(500).json({ error: "Failed to analyze study material", details: error.message });
  }
});


// ----------------------------------------------------
// FRONTEND BUNDLING AND SERVING MIDDLEWARE
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static assets in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PocketLM Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
