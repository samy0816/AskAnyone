import { useState, useRef, useEffect } from 'react';
import type { ChatSession } from '@google/generative-ai';
import type { Persona } from '../types';
import { createPersonaChatWithState, sendChatMessage } from '../services/gemini';

interface Props {
  personas: Persona[];
  projectContext: string;
  roomMessages: RoomMessage[];
  onRoomMessagesChange: (msgs: RoomMessage[]) => void;
  onBack: () => void;
  onPickPersona: (persona: Persona) => void;
  onEndRoom: (messages: RoomMessage[]) => void;
}

export interface RoomMessage {
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

const TEMPLATES: Record<string, string[]> = {
  'Usability': [
    "Can you walk me through how you'd typically use something like this?",
    "What's the first thing you'd do when you open this for the first time?",
    "Is there anything on here that confuses you or feels unclear?",
    "What would make you close this and never come back?",
  ],
  'Feature': [
    "If this feature disappeared tomorrow, would you miss it?",
    "What would make this feature 10x more useful to you?",
    "Have you tried anything else that does something similar?",
    "Who else in your life or work would benefit from this?",
  ],
  'Onboarding': [
    "When you tried a new app recently, what made you stick with it?",
    "What's the most frustrating part of getting started with new tools?",
    "Would you prefer a guided tutorial or just exploring on your own?",
    "What would convince you to create an account vs. just browsing?",
  ],
  'Emotions': [
    "How does using this make you feel in the moment?",
    "Was there a moment that surprised you — good or bad?",
    "What would you tell a friend about this?",
    "Does this feel like something made for someone like you?",
  ],
};

export default function MultiPersonaRoom({ personas, projectContext, roomMessages, onRoomMessagesChange, onBack, onPickPersona, onEndRoom }: Props) {
  const setRoomMessages = (msgs: RoomMessage[]) => { msgsRef.current = msgs; onRoomMessagesChange(msgs); };
  const msgsRef = useRef<RoomMessage[]>(roomMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTyping, setActiveTyping] = useState<string[]>([]);
  const [devilsAdvocate, setDevilsAdvocate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Usability');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatsRef = useRef<Record<string, ChatSession>>({});

  const initChats = (da: boolean) => {
    personas.forEach(p => {
      const roommates = personas.filter(r => r.name !== p.name);
      chatsRef.current[p.name] = createPersonaChatWithState(p, projectContext, 'Normal', da, roommates);
    });
  };

  useEffect(() => {
    initChats(false);
    // Only populate welcome messages the first time (empty room)
    if (roomMessages.length === 0) {
      const welcomes: RoomMessage[] = personas.map(p => ({
        id: `welcome-${p.name}`,
        personaName: p.name,
        personaAvatar: p.avatar,
        content: `Hey, I'm ${p.name} — ${p.occupation.toLowerCase()}. Happy to be here.`,
        timestamp: new Date(),
      }));
      setRoomMessages(welcomes);
    }
  }, []);

  const handleToggleDA = () => {
    const next = !devilsAdvocate;
    setDevilsAdvocate(next);
    initChats(next);
  };

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
    setRoomMessages([...msgsRef.current, userMsg]);

    // Ask each persona sequentially — each one sees what the others before them said
    const roundResponses: { name: string; text: string }[] = [];

    for (const persona of personas) {
      setActiveTyping(prev => [...prev, persona.name]);
      try {
        // Build context message: what others already said this round
        const priorContext = roundResponses.length > 0
          ? `[Before you answer, here's what the others just said to the same question:\n${roundResponses.map(r => `${r.name}: "${r.text}"`).join('\n')}\nNow respond naturally as yourself. You can agree, disagree, or just answer independently — don't feel obligated to reference them every time.]`
          : trimmed;

        const messageToSend = roundResponses.length > 0
          ? `${trimmed}\n\n${priorContext}`
          : trimmed;

        const response = await sendChatMessage(chatsRef.current[persona.name], messageToSend);
        roundResponses.push({ name: persona.name, text: response });
        setActiveTyping(prev => prev.filter(n => n !== persona.name));
        setRoomMessages([
          ...msgsRef.current,
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
      {/* Header — same layout as single chat */}
      <div className="room-header">
        <button className="back-btn-sm" onClick={onBack}>←</button>
        <div className="room-header-title">
          <span className="room-icon">🗣️</span>
          <span>The Room</span>
          <span className="room-count-badge">{personas.length} participants</span>
        </div>
        <div className="chat-header-actions">
          <div className="da-btn-wrapper">
            <button
              className={`chat-tool-btn ${devilsAdvocate ? 'chat-tool-btn-active' : ''}`}
              onClick={handleToggleDA}
            >
              😈 {devilsAdvocate ? 'DA On' : 'DA'}
            </button>
            <div className="da-tooltip">
              <strong>Devil's Advocate</strong>
              <span>Makes all personas push back, challenge assumptions, and voice objections.</span>
            </div>
          </div>
          <button
            className={`chat-tool-btn ${showTemplates ? 'chat-tool-btn-active' : ''}`}
            onClick={() => setShowTemplates(s => !s)}
          >
            Templates
          </button>
          <button
            className="end-interview-btn"
            onClick={() => onEndRoom(roomMessages)}
            disabled={roomMessages.filter(m => m.personaName === 'You').length < 1}
          >
            End &amp; Summarise
          </button>
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

      {/* Template panel — same as single chat */}
      {showTemplates && (
        <div className="template-panel">
          <div className="template-tabs">
            {Object.keys(TEMPLATES).map(cat => (
              <button
                key={cat}
                className={`template-tab ${activeCategory === cat ? 'template-tab-active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="template-questions">
            {TEMPLATES[activeCategory].map(q => (
              <button
                key={q}
                className="template-question"
                onClick={() => { setInput(q); setShowTemplates(false); }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

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
