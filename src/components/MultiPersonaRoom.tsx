import { useState, useRef, useEffect } from 'react';
import type { ChatSession } from '@google/generative-ai';
import type { Persona } from '../types';
import { createPersonaChatWithState, sendChatMessage } from '../services/gemini';

interface Props {
  personas: Persona[];
  projectContext: string;
  onBack: () => void;
  onPickPersona: (persona: Persona) => void;
}

interface RoomMessage {
  id: string;
  personaName: string;
  personaAvatar: string;
  content: string;
  timestamp: Date;
}

const TECH_COLORS: Record<string, string> = {
  Low: '#F59E0B',
  Medium: '#3B82F6',
  High: '#10B981',
};

export default function MultiPersonaRoom({ personas, projectContext, onBack, onPickPersona }: Props) {
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTyping, setActiveTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatsRef = useRef<Record<string, ChatSession>>({});

  useEffect(() => {
    // Initialize chat sessions for each persona
    personas.forEach(p => {
      chatsRef.current[p.name] = createPersonaChatWithState(p, projectContext);
    });

    // Welcome messages
    const welcomes: RoomMessage[] = personas.map(p => ({
      id: `welcome-${p.name}`,
      personaName: p.name,
      personaAvatar: p.avatar,
      content: `Hey, I'm ${p.name} — ${p.occupation.toLowerCase()}. Happy to be here.`,
      timestamp: new Date(),
    }));
    setRoomMessages(welcomes);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages, activeTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    setInput('');
    setIsTyping(true);

    // Add user message
    const userMsg: RoomMessage = {
      id: Date.now().toString(),
      personaName: 'You',
      personaAvatar: '🙋',
      content: trimmed,
      timestamp: new Date(),
    };
    setRoomMessages(prev => [...prev, userMsg]);

    // Ask each persona sequentially to simulate natural turn-taking
    for (const persona of personas) {
      setActiveTyping(prev => [...prev, persona.name]);
      try {
        const response = await sendChatMessage(chatsRef.current[persona.name], trimmed);
        setActiveTyping(prev => prev.filter(n => n !== persona.name));
        setRoomMessages(prev => [
          ...prev,
          {
            id: `${Date.now()}-${persona.name}`,
            personaName: persona.name,
            personaAvatar: persona.avatar,
            content: response,
            timestamp: new Date(),
          },
        ]);
      } catch {
        setActiveTyping(prev => prev.filter(n => n !== persona.name));
      }
    }
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="room-page">
      {/* Header */}
      <div className="room-header">
        <button className="back-btn-sm" onClick={onBack}>←</button>
        <div className="room-header-title">
          <span className="room-icon">The Room</span>
          <span>The Room</span>
          <span className="room-count-badge">{personas.length} participants</span>
        </div>
      </div>

      {/* Persona pills */}
      <div className="room-personas-bar">
        {personas.map(p => (
          <div key={p.name} className="room-persona-pill">
            <span className="room-pill-avatar">{p.avatar}</span>
            <div className="room-pill-info">
              <span className="room-pill-name">{p.name}</span>
              <span className="room-pill-role">{p.occupation}</span>
            </div>
            <span
              className="tech-badge-xs"
              style={{ background: TECH_COLORS[p.techSavviness] + '20', color: TECH_COLORS[p.techSavviness] }}
            >
              {p.techSavviness}
            </span>
            <button
              className="room-1on1-btn"
              onClick={() => onPickPersona(p)}
              title={`1:1 with ${p.name}`}
            >
              1:1 →
            </button>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="room-messages">
        {roomMessages.map(msg => (
          <div
            key={msg.id}
            className={`room-message-row ${msg.personaName === 'You' ? 'room-message-row-user' : ''}`}
          >
            {msg.personaName !== 'You' && (
              <div className="room-msg-avatar">{msg.personaAvatar}</div>
            )}
            <div className="room-message-group">
              {msg.personaName !== 'You' && (
                <div className="room-speaker-name">{msg.personaName}</div>
              )}
              <div className={`bubble ${msg.personaName === 'You' ? 'bubble-user' : 'bubble-persona'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {activeTyping.map(name => {
          const p = personas.find(x => x.name === name);
          return (
            <div key={`typing-${name}`} className="room-message-row">
              <div className="room-msg-avatar">{p?.avatar ?? '💬'}</div>
              <div className="room-message-group">
                <div className="room-speaker-name">{name}</div>
                <div className="bubble bubble-persona typing-bubble">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="room-input-bar">
        <textarea
          className="chat-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the room a question..."
          rows={1}
          disabled={isTyping}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          aria-label="Send"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
