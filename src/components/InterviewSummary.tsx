import { useState } from 'react';
import type { Persona, Message, MessageTag } from '../types';
import { generateHMWStatements } from '../services/gemini';

interface Props {
  persona: Persona;
  summary: string;
  messages: Message[];
  onNewInterview: () => void;
  onBack: () => void;
}

const SECTION_ICONS: Record<string, string> = {
  'KEY INSIGHTS': '',
  'PAIN POINTS': '',
  'NEEDS & GOALS': '',
  'NOTABLE QUOTES': '',
  'DESIGN RECOMMENDATIONS': '',
};

const TAG_META: Record<MessageTag, { label: string; color: string; bg: string }> = {
  'pain-point': { label: 'Pain Points', color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  'goal': { label: 'Goals', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  'delight': { label: 'Delights', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  'confusion': { label: 'Confusions', color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  'opportunity': { label: 'Opportunities', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
};

function parseSummary(text: string) {
  const sections: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;

    const isHeading = Object.keys(SECTION_ICONS).some(h => line.toUpperCase().startsWith(h));
    if (isHeading) {
      if (current) sections.push(current);
      current = { heading: line.toUpperCase().replace(/[:\-]/g, '').trim(), lines: [] };
    } else if (current) {
      const clean = line.replace(/^[-•*]\s*/, '').trim();
      if (clean) current.lines.push(clean);
    }
  }
  if (current) sections.push(current);
  return sections;
}

export default function InterviewSummary({ persona, summary, messages, onNewInterview, onBack }: Props) {
  const sections = parseSummary(summary);
  const [hmwStatements, setHmwStatements] = useState<string[]>([]);
  const [isGeneratingHMW, setIsGeneratingHMW] = useState(false);
  const [hmwError, setHmwError] = useState<string | null>(null);
  const [showAffinity, setShowAffinity] = useState(false);

  // Group tagged messages
  const taggedMessages = messages.filter(m => m.tag && m.role === 'persona');
  const affinityGroups = (Object.keys(TAG_META) as MessageTag[]).map(tag => ({
    tag,
    messages: taggedMessages.filter(m => m.tag === tag),
  })).filter(g => g.messages.length > 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
  };

  const handleExportMarkdown = () => {
    const md = `# Interview Summary — ${persona.name}\n\n**${persona.occupation}** · ${persona.location} · ${persona.age} yrs\n\n---\n\n${summary}\n\n${hmwStatements.length > 0 ? `\n## How Might We...\n\n${hmwStatements.map(s => `- ${s}`).join('\n')}\n` : ''}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${persona.name.replace(/\s+/g, '-').toLowerCase()}-interview.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      persona: { name: persona.name, age: persona.age, occupation: persona.occupation, location: persona.location },
      summary,
      taggedInsights: affinityGroups.map(g => ({
        type: TAG_META[g.tag].label,
        quotes: g.messages.map(m => m.content),
      })),
      hmwStatements,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${persona.name.replace(/\s+/g, '-').toLowerCase()}-research.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateHMW = async () => {
    setIsGeneratingHMW(true);
    setHmwError(null);
    try {
      const statements = await generateHMWStatements(persona, summary);
      setHmwStatements(statements);
    } catch (err) {
      setHmwError(err instanceof Error ? err.message : 'Failed to generate HMW statements.');
    } finally {
      setIsGeneratingHMW(false);
    }
  };

  return (
    <div className="summary-page">
      <div className="summary-container">
        {/* Header */}
        <div className="summary-header">
          <button className="back-btn" onClick={onBack}>← Back to chat</button>
          <div className="summary-export-row">
            <button className="btn-ghost btn-sm" onClick={handleCopy}>Copy ↗</button>
            <button className="btn-ghost btn-sm" onClick={handleExportMarkdown}>↓ .md</button>
            <button className="btn-ghost btn-sm" onClick={handleExportJSON}>↓ .json</button>
          </div>
        </div>

        <div className="summary-title-row">
          <div className="summary-avatar">{persona.avatar}</div>
          <div>
            <h2 className="summary-title">Interview Summary</h2>
            <p className="summary-sub">{persona.name} · {persona.occupation}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="summary-sections">
          {sections.map(section => {
            const matchKey = Object.keys(SECTION_ICONS).find(k => section.heading.includes(k));
            const icon = matchKey ? SECTION_ICONS[matchKey] : '•';
            const isQuotes = section.heading.includes('QUOTES');

            return (
              <div key={section.heading} className="summary-section">
                <h3 className="summary-section-heading">
                  <span className="section-icon">{icon}</span>
                  {section.heading}
                </h3>
                <ul className={`summary-list ${isQuotes ? 'quotes-list' : ''}`}>
                  {section.lines.map((line, i) => (
                    <li key={i} className={isQuotes ? 'quote-item' : ''}>
                      {isQuotes ? `"${line.replace(/^["']|["']$/g, '')}"` : line}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Affinity Map */}
        {affinityGroups.length > 0 && (
          <div className="affinity-section">
            <button
              className="affinity-toggle"
              onClick={() => setShowAffinity(v => !v)}
            >
              <span>Tagged Insights Affinity Map</span>
              <span className="affinity-count">{taggedMessages.length} quotes</span>
              <span className="affinity-arrow">{showAffinity ? '▲' : '▼'}</span>
            </button>
            {showAffinity && (
              <div className="affinity-groups">
                {affinityGroups.map(g => (
                  <div key={g.tag} className="affinity-group">
                    <div
                      className="affinity-group-header"
                      style={{ borderColor: TAG_META[g.tag].color, background: TAG_META[g.tag].bg }}
                    >
                      <span style={{ color: TAG_META[g.tag].color }}>{TAG_META[g.tag].label}</span>
                      <span className="affinity-group-count" style={{ color: TAG_META[g.tag].color }}>
                        {g.messages.length}
                      </span>
                    </div>
                    <ul className="affinity-quotes">
                      {g.messages.map(m => (
                        <li key={m.id} className="affinity-quote">"{m.content}"</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HMW Generator */}
        <div className="hmw-section">
          {hmwStatements.length === 0 ? (
            <button
              className="btn-ghost btn-full hmw-generate-btn"
              onClick={handleGenerateHMW}
              disabled={isGeneratingHMW}
            >
              {isGeneratingHMW ? 'Generating...' : 'Generate How Might We Statements'}
            </button>
          ) : (
            <div className="hmw-statements">
              <h3 className="summary-section-heading">
                HOW MIGHT WE...
              </h3>
              <div className="hmw-list">
                {hmwStatements.map((s, i) => (
                  <div key={i} className="hmw-item">{s}</div>
                ))}
              </div>
              <button className="btn-ghost btn-sm" onClick={handleGenerateHMW} disabled={isGeneratingHMW}>
                ↺ Regenerate
              </button>
            </div>
          )}
          {hmwError && <div className="error-banner" style={{ marginTop: 8 }}><span>⚠️</span> {hmwError}</div>}
        </div>

        <button className="btn-primary btn-full" onClick={onNewInterview}>
          Start New Interview →
        </button>
      </div>
    </div>
  );
}
