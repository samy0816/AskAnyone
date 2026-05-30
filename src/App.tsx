import { useState, useRef } from 'react';
import type { ChatSession } from '@google/generative-ai';
import type { AppView, Message, Persona } from './types';
import { createPersonaChat, generatePersona, generateInterviewSummary, sendChatMessage } from './services/gemini';
import DescriptionInput from './components/DescriptionInput';
import LoadingSpinner from './components/LoadingSpinner';
import PersonaCard from './components/PersonaCard';
import ChatInterface from './components/ChatInterface';
import InterviewSummary from './components/InterviewSummary';
import './App.css';

function App() {
  const [view, setView] = useState<AppView>('home');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [projectContext, setProjectContext] = useState<string>('');
  const chatRef = useRef<ChatSession | null>(null);

  const handleGeneratePersona = async (description: string, project: string) => {
    setError(null);
    setProjectContext(project);
    setView('loading');
    try {
      const p = await generatePersona(description, project);
      setPersona(p);
      setView('persona');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setView('home');
    }
  };

  const handleStartChat = () => {
    if (!persona) return;
    chatRef.current = createPersonaChat(persona, projectContext);
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
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'persona',
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
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

  const handleEndInterview = async () => {
    if (!persona || messages.length < 2) return;
    setIsTyping(true);
    try {
      const text = await generateInterviewSummary(persona, messages);
      setSummary(text);
      setView('summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewInterview = () => {
    setPersona(null);
    setMessages([]);
    setSummary('');
    setProjectContext('');
    chatRef.current = null;
    setError(null);
    setView('home');
  };

  return (
    <div className="app">
      {view === 'home' && (
        <DescriptionInput onSubmit={handleGeneratePersona} error={error} />
      )}
      {view === 'loading' && <LoadingSpinner />}
      {view === 'persona' && persona && (
        <PersonaCard
          persona={persona}
          onStartChat={handleStartChat}
          onBack={() => setView('home')}
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
        />
      )}
      {view === 'summary' && persona && (
        <InterviewSummary
          persona={persona}
          summary={summary}
          onNewInterview={handleNewInterview}
          onBack={() => setView('chat')}
        />
      )}
    </div>
  );
}

export default App;
