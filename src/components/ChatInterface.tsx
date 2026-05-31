import { useState, useEffect, useRef } from 'react';
import type { Persona, Message, MessageTag } from '../types';

interface Props {
  persona: Persona;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onSendImage: (imageBase64: string, imageMimeType: string, caption: string) => void;
  isTyping: boolean;
  onBack: () => void;
  onEndInterview: () => void;
  devilsAdvocate: boolean;
  onToggleDevilsAdvocate: () => void;
  onTagMessage: (id: string, tag: MessageTag | undefined) => void;
}

const TEMPLATES: Record<string, string[]> = {
  'Usability': [
    "Can you walk me through how you'd typically use something like this?",
    "What's the first thing you'd do when you open this for the first time?",
    "Is there anything on here that confuses you or feels unclear?",
    "What would make you close this and never come back?",
  ],
  'Feature Validation': [
    "If this feature disappeared tomorrow, would you miss it?",
    "Have you tried anything else that does something similar?",
    "What would make this feature 10x more useful to you?",
    "Who else in your life or work would benefit from this?",
  ],
  'Onboarding': [
    "When you tried a new app recently, what made you stick with it?",
    "What's the most frustrating part of getting started with new tools?",
    "Would you prefer a guided tutorial or just exploring on your own?",
    "What would convince you to create an account vs. just browsing?",
  ],
  'Pricing': [
    "Would you pay for this? What price point would feel fair?",
    "Would you prefer a one-time purchase or a monthly subscription?",
    "What would make you feel like it's worth the money?",
    "What free alternative would you use if this cost money?",
  ],
  'Emotions': [
    "How does using this make you feel in the moment?",
    "Was there a moment that surprised you — good or bad?",
    "What would you tell a friend about this?",
    "Does this feel like something made for someone like you?",
  ],
};

const TAG_STYLES: Record<MessageTag, { label: string; color: string; bg: string }> = {
  'pain-point': { label: 'Pain', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  'goal': { label: 'Goal', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  'delight': { label: 'Delight', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  'confusion': { label: 'Confusion', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  'opportunity': { label: 'Opportunity', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
};

export default function ChatInterface({
  persona,
  messages,
  onSendMessage,
  onSendImage,
  isTyping,
  onBack,
  onEndInterview,
  devilsAdvocate,
  onToggleDevilsAdvocate,
  onTagMessage,
}: Props) {
  const [input, setInput] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Usability');
  const [tagMenuId, setTagMenuId] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const close = () => setTagMenuId(null);
    if (tagMenuId) window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [tagMenuId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTyping) return;
    if (pendingImage) {
      onSendImage(pendingImage.base64, pendingImage.mimeType, input.trim());
      setPendingImage(null);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

  const handleUseTemplate = (q: string) => {
    setInput(q);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      setPendingImage({ base64, mimeType: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
    // reset so same file can be picked again
    e.target.value = '';
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const taggedCount = messages.filter(m => m.tag).length;

  return (
    <div className="chat">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn-sm" onClick={onBack} title="Back to persona">←</button>
        <div className="chat-persona-info">
          <div className="chat-avatar-sm">{persona.avatar}</div>
          <div>
            <div className="chat-persona-name">{persona.name}</div>
            <div className="chat-persona-role">{persona.occupation}</div>
          </div>
        </div>
        <div className="chat-header-actions">
          <div className="da-btn-wrapper">
            <button
              className={`chat-tool-btn ${devilsAdvocate ? 'chat-tool-btn-active' : ''}`}
              onClick={onToggleDevilsAdvocate}
            >
              😈 {devilsAdvocate ? 'DA On' : 'DA'}
            </button>
            <div className="da-tooltip">
              <strong>Devil's Advocate</strong>
              <span>Makes the persona push back, challenge assumptions, and voice objections — great for stress-testing ideas.</span>
            </div>
          </div>
          <button
            className={`chat-tool-btn ${showTemplates ? 'chat-tool-btn-active' : ''}`}
            onClick={() => setShowTemplates(v => !v)}
            title="Question templates"
          >
            Templates
          </button>
          <button
            className="end-interview-btn"
            onClick={onEndInterview}
            disabled={isTyping || messages.length < 2}
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Template panel */}
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
              <button key={q} className="template-question" onClick={() => handleUseTemplate(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

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
              <div
                className={`bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-persona'}`}
                style={msg.tag ? { borderColor: TAG_STYLES[msg.tag].color, borderWidth: '1.5px', borderStyle: 'solid' } : undefined}
              >
                {msg.imageBase64 && (
                  <img
                    src={`data:${msg.imageMimeType};base64,${msg.imageBase64}`}
                    alt="shared screen"
                    className="chat-image-preview"
                  />
                )}
                {msg.content}
                {msg.role === 'persona' && (
                  <button
                    className="tag-btn"
                    onClick={e => { e.stopPropagation(); setTagMenuId(tagMenuId === msg.id ? null : msg.id); }}
                    title="Tag this insight"
                  >
                    {msg.tag ? (
                      <span style={{ color: TAG_STYLES[msg.tag].color, fontSize: '11px' }}>{TAG_STYLES[msg.tag].label}</span>
                    ) : 'Tag'}
                  </button>
                )}
              </div>

              {/* Tag dropdown */}
              {tagMenuId === msg.id && (
                <div className="tag-menu" onClick={e => e.stopPropagation()}>
                  {(Object.entries(TAG_STYLES) as [MessageTag, typeof TAG_STYLES[MessageTag]][]).map(([key, style]) => (
                    <button
                      key={key}
                      className="tag-menu-item"
                      style={{ color: style.color }}
                      onClick={() => { onTagMessage(msg.id, key); setTagMenuId(null); }}
                    >
                      {style.label}
                    </button>
                  ))}
                  {msg.tag && (
                    <button
                      className="tag-menu-item tag-menu-clear"
                      onClick={() => { onTagMessage(msg.id, undefined); setTagMenuId(null); }}
                    >
                      ✕ Remove tag
                    </button>
                  )}
                </div>
              )}

              <div className={`msg-time ${msg.role === 'user' ? 'msg-time-right' : ''}`}>
                {formatTime(msg.timestamp)}
                {msg.tag && (
                  <span
                    className="msg-tag-badge"
                    style={{ background: TAG_STYLES[msg.tag].bg, color: TAG_STYLES[msg.tag].color }}
                  >
                    {TAG_STYLES[msg.tag].label}
                  </span>
                )}
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

      {/* Tag summary bar */}
      {taggedCount > 0 && (
        <div className="tag-summary-bar">
          <span className="tag-summary-label">{taggedCount} tagged insight{taggedCount !== 1 ? 's' : ''}</span>
          <span className="tag-summary-hint">Will appear in your summary</span>
        </div>
      )}

      {/* Input */}
      <form className="chat-input-bar" onSubmit={handleSubmit}>
        {pendingImage && (
          <div className="chat-image-attach">
            <img src={pendingImage.preview} alt="pending" className="chat-image-thumb" />
            <button type="button" className="chat-image-remove" onClick={() => setPendingImage(null)}>✕</button>
          </div>
        )}
        <div className="chat-input-row">
          <button
            type="button"
            className="chat-attach-btn"
            onClick={handleImageClick}
            title="Share a screen"
            disabled={isTyping}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="14" rx="2"/><polyline points="3 17 7.5 11 11 15 14.5 10 21 17"/>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageFile}
          />
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={pendingImage ? 'Add a caption (optional)...' : `Ask ${persona.name} something...`}
            rows={1}
            disabled={isTyping}
            maxLength={800}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={(!input.trim() && !pendingImage) || isTyping}
            aria-label="Send"
          >
            ↑
          </button>
        </div>
      </form>
    </div>
  );
}
