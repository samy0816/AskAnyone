import { useState, useRef } from 'react';
import type { ChatSession } from '@google/generative-ai';
import type { AppView, EmotionalState, Message, MessageTag, Persona, SavedPersona } from './types';
import {
  createPersonaChatWithState,
  generateMultiplePersonas,
  generatePersona,
  generateInterviewSummary,
  sendChatMessage,
} from './services/gemini';
import { getSavedPersonas, savePersonaToLibrary, updatePersonaMessages } from './utils/storage';
import DescriptionInput from './components/DescriptionInput';
import LoadingSpinner from './components/LoadingSpinner';
import PersonaCard from './components/PersonaCard';
import ChatInterface from './components/ChatInterface';
import InterviewSummary from './components/InterviewSummary';
import PersonaLibrary from './components/PersonaLibrary';
import MultiPersonaRoom from './components/MultiPersonaRoom';
import DebateView from './components/DebateView';
import ScenarioTest from './components/ScenarioTest';
import './App.css';

function App() {
  const [view, setView] = useState<AppView>('home');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [roomPersonas, setRoomPersonas] = useState<Persona[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [projectContext, setProjectContext] = useState<string>('');
  const [devilsAdvocate, setDevilsAdvocate] = useState(false);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('Normal');
  const [savedPersonaId, setSavedPersonaId] = useState<string | null>(null);
  const chatRef = useRef<ChatSession | null>(null);

  // ── GENERATE ─────────────────────────────────────────────
  const handleGeneratePersona = async (description: string, project: string, count: number) => {
    setError(null);
    setProjectContext(project);
    setDevilsAdvocate(false);
    setSavedPersonaId(null);
    setView('loading');
    try {
      if (count > 1) {
        const personas = await generateMultiplePersonas(description, count, project);
        setRoomPersonas(personas);
        setView('room');
      } else {
        const p = await generatePersona(description, project);
        setPersona(p);
        setView('persona');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setView('home');
    }
  };

  // ── SAVE PERSONA ─────────────────────────────────────────
  const handleSavePersona = () => {
    if (!persona) return;
    const id = savedPersonaId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const saved: SavedPersona = {
      id,
      persona,
      projectContext,
      createdAt: new Date().toISOString(),
      messages: messages.length > 0 ? messages : undefined,
    };
    savePersonaToLibrary(saved);
    setSavedPersonaId(id);
  };

  // ── START CHAT ───────────────────────────────────────────
  const handleStartChat = (state: EmotionalState) => {
    if (!persona) return;
    setEmotionalState(state);
    chatRef.current = createPersonaChatWithState(persona, projectContext, state, devilsAdvocate);
    setMessages([
      {
        id: '1',
        role: 'persona',
        content: `Hey! Yeah, happy to be here. I'm ${persona.name} — ${persona.occupation.toLowerCase()}. Ask away!`,
        timestamp: new Date(),
      },
    ]);
    setView('chat');
  };

  const handleToggleDevilsAdvocate = () => {
    if (!persona) return;
    const next = !devilsAdvocate;
    setDevilsAdvocate(next);
    // Restart chat session with new mode
    chatRef.current = createPersonaChatWithState(persona, projectContext, emotionalState, next);
    // Keep message history but reset the AI session
  };

  // ── SEND MESSAGE ─────────────────────────────────────────
  const handleSendMessage = async (message: string) => {
    if (!chatRef.current) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await sendChatMessage(chatRef.current, message);
      const newMessages = (prev: Message[]) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'persona' as const,
          content: response,
          timestamp: new Date(),
        },
      ];
      setMessages(newMessages);
      // Persist conversation if saved
      if (savedPersonaId) {
        setMessages(prev => {
          updatePersonaMessages(savedPersonaId, prev);
          return prev;
        });
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'persona',
          content: "Sorry, I didn't catch that. Could you say that again?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── TAG MESSAGE ──────────────────────────────────────────
  const handleTagMessage = (id: string, tag: MessageTag | undefined) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, tag } : m));
  };

  // ── END INTERVIEW ────────────────────────────────────────
  const handleEndInterview = async () => {
    if (!persona || messages.length < 2) return;
    setIsTyping(true);
    try {
      const text = await generateInterviewSummary(persona, messages);
      setSummary(text);
      // Auto-save conversation to library
      if (savedPersonaId) updatePersonaMessages(savedPersonaId, messages);
      setView('summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary.');
    } finally {
      setIsTyping(false);
    }
  };

  // ── LIBRARY ──────────────────────────────────────────────
  const handleResumeInterview = (saved: SavedPersona) => {
    setPersona(saved.persona);
    setProjectContext(saved.projectContext);
    setSavedPersonaId(saved.id);
    const msgs = saved.messages ?? [];
    setMessages(msgs);
    chatRef.current = createPersonaChatWithState(saved.persona, saved.projectContext, 'Normal', false);
    setView('chat');
  };

  const handleStartNewFromLibrary = (saved: SavedPersona) => {
    setPersona(saved.persona);
    setProjectContext(saved.projectContext);
    setSavedPersonaId(saved.id);
    setMessages([]);
    setDevilsAdvocate(false);
    setView('persona');
  };

  // ── PICK PERSONA FROM ROOM ───────────────────────────────
  const handlePickFromRoom = (p: Persona) => {
    setPersona(p);
    setMessages([]);
    setView('persona');
  };

  // ── NEW INTERVIEW ────────────────────────────────────────
  const handleNewInterview = () => {
    setPersona(null);
    setRoomPersonas([]);
    setMessages([]);
    setSummary('');
    setProjectContext('');
    setSavedPersonaId(null);
    setDevilsAdvocate(false);
    chatRef.current = null;
    setError(null);
    setView('home');
  };

  const isSaved = savedPersonaId !== null && getSavedPersonas().some(p => p.id === savedPersonaId);

  return (
    <div className="app">
      {view === 'home' && (
        <DescriptionInput
          onSubmit={handleGeneratePersona}
          onOpenLibrary={() => setView('library')}
          onOpenDebate={() => setView('debate')}
          error={error}
        />
      )}
      {view === 'loading' && <LoadingSpinner />}
      {view === 'persona' && persona && (
        <PersonaCard
          persona={persona}
          onStartChat={handleStartChat}
          onBack={() => setView('home')}
          onSave={handleSavePersona}
          onScenarioTest={() => setView('scenario')}
          isSaved={isSaved}
        />
      )}
      {view === 'chat' && persona && (
        <ChatInterface
          persona={persona}
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          onBack={() => setView('persona')}
          onEndInterview={handleEndInterview}
          devilsAdvocate={devilsAdvocate}
          onToggleDevilsAdvocate={handleToggleDevilsAdvocate}
          onTagMessage={handleTagMessage}
        />
      )}
      {view === 'summary' && persona && (
        <InterviewSummary
          persona={persona}
          summary={summary}
          messages={messages}
          onNewInterview={handleNewInterview}
          onBack={() => setView('chat')}
        />
      )}
      {view === 'library' && (
        <PersonaLibrary
          onResumeInterview={handleResumeInterview}
          onStartNewInterview={handleStartNewFromLibrary}
          onBack={() => setView('home')}
        />
      )}
      {view === 'room' && (
        <MultiPersonaRoom
          personas={roomPersonas}
          projectContext={projectContext}
          onBack={() => setView('home')}
          onPickPersona={handlePickFromRoom}
        />
      )}
      {view === 'debate' && (
        <DebateView onBack={() => setView('home')} />
      )}
      {view === 'scenario' && persona && (
        <ScenarioTest
          persona={persona}
          onBack={() => setView('persona')}
        />
      )}
    </div>
  );
}

export default App;
