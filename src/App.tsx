import React, { useState, useEffect } from 'react';
import { Notebook } from './types';
import { INITIAL_NOTEBOOKS } from './mockData';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import WorkspaceView from './components/WorkspaceView';

interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

export default function App() {
  // App authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Persistent theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('pocketlm_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  // Notebook orchestration states
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);

  const activeNotebook = notebooks.find(nb => nb.id === selectedNotebookId);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        await loadNotebooks();
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadNotebooks = async () => {
    try {
      const res = await fetch('/api/notebooks');
      const data = await res.json();
      if (data.notebooks && data.notebooks.length > 0) {
        setNotebooks(data.notebooks);
      } else {
        // If no notebooks in DB, use initial ones
        for (const nb of INITIAL_NOTEBOOKS) {
          await createNotebook(nb.name, nb.description, nb.tags || []);
        }
        const res2 = await fetch('/api/notebooks');
        const data2 = await res2.json();
        setNotebooks(data2.notebooks);
      }
    } catch (err) {
      console.error('Load notebooks failed:', err);
      setNotebooks(INITIAL_NOTEBOOKS);
    }
  };

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pocketlm_theme', next);
      return next;
    });
  };

  // Authentication callbacks
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    loadNotebooks();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setNotebooks([]);
    setSelectedNotebookId(null);
  };

  // Notebook management callbacks
  const handleSelectNotebook = (id: string) => {
    setSelectedNotebookId(id);
  };

  const createNotebook = async (name: string, description: string, tags: string[] = []) => {
    try {
      const res = await fetch('/api/notebooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, tags }),
      });
      const data = await res.json();
      return data.notebook;
    } catch (err) {
      console.error('Create notebook failed:', err);
      return null;
    }
  };

  const handleCreateNotebook = async (name: string, description: string, tags: string[] = []) => {
    const newNotebook = await createNotebook(name, description, tags);
    if (newNotebook) {
      setNotebooks(prev => [newNotebook, ...prev]);
      setSelectedNotebookId(newNotebook.id); // auto open after creating
    }
  };

  const handleDeleteNotebook = async (id: string) => {
    try {
      await fetch(`/api/notebooks/${id}`, { method: 'DELETE' });
      setNotebooks(prev => prev.filter(nb => nb.id !== id));
      if (selectedNotebookId === id) {
        setSelectedNotebookId(null);
      }
    } catch (err) {
      console.error('Delete notebook failed:', err);
    }
  };

  const handleDeleteMultipleNotebooks = async (ids: string[]) => {
    for (const id of ids) {
      await handleDeleteNotebook(id);
    }
  };

  const handleUpdateNotebook = async (updatedNotebook: Notebook) => {
    try {
      await fetch(`/api/notebooks/${updatedNotebook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNotebook),
      });
      setNotebooks(prev => prev.map(nb => nb.id === updatedNotebook.id ? updatedNotebook : nb));
    } catch (err) {
      console.error('Update notebook failed:', err);
    }
  };

  const handleReorderNotebooks = (orderedNotebooks: Notebook[]) => {
    setNotebooks(orderedNotebooks);
  };

  if (loadingAuth) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-[#F4F5FA]' : 'bg-[#07080A]'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500" />
      </div>
    );
  }

  // VIEW ROUTER
  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} theme={theme} />;
  }

  if (activeNotebook) {
    return (
      <WorkspaceView 
        notebook={activeNotebook}
        onBackToDashboard={() => setSelectedNotebookId(null)}
        onUpdateNotebook={handleUpdateNotebook}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <DashboardView 
      notebooks={notebooks}
      onSelectNotebook={handleSelectNotebook}
      onCreateNotebook={handleCreateNotebook}
      onDeleteNotebook={handleDeleteNotebook}
      onDeleteMultipleNotebooks={handleDeleteMultipleNotebooks}
      onReorderNotebooks={handleReorderNotebooks}
      onUpdateNotebook={handleUpdateNotebook}
      onLogout={handleLogout}
      userEmail={currentUser?.email || ''}
      userName={currentUser?.fullName}
      theme={theme}
      onToggleTheme={handleToggleTheme}
    />
  );
}
