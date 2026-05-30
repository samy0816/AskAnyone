import { useState, useEffect, useRef } from 'react';
import type { Persona, Message } from '../types';

interface Props {
  persona: Persona;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  onBack: () => void;
  onEndInterview: () => void;
}

export default function ChatInterface({ persona, messages, onSendMessage, isTyping, onBack, onEndInterview }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="chat">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn-sm" onClick={onBack} title="Back to persona">
          ←
        </button>
        <div className="chat-persona-info">
          <div className="chat-avatar-sm">{persona.avatar}</div>
          <div>
            <div className="chat-persona-name">{persona.name}</div>
            <div className="chat-persona-role">{persona.occupation}</div>
          </div>
        </div>
        <button className="end-interview-btn" onClick={onEndInterview} disabled={isTyping || messages.length < 2}>
          End Interview
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        <div className="chat-day-label">Today</div>

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`message-row ${msg.role === 'user' ? 'message-row-user' : 'message-row-persona'}`}
          >
            {msg.role === 'persona' && (
              <div className="msg-avatar">{persona.avatar}</div>
            )}
            <div className="message-group">
              <div className={`bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-persona'}`}>
                {msg.content}
              </div>
              <div className={`msg-time ${msg.role === 'user' ? 'msg-time-right' : ''}`}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-row message-row-persona">
            <div className="msg-avatar">{persona.avatar}</div>
            <div className="bubble bubble-persona typing-bubble">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${persona.name} something...`}
          rows={1}
          disabled={isTyping}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={!input.trim() || isTyping}
          aria-label="Send"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
