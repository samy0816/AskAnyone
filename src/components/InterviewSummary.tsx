import type { Persona } from '../types';

interface Props {
  persona: Persona;
  summary: string;
  onNewInterview: () => void;
  onBack: () => void;
}

const SECTION_ICONS: Record<string, string> = {
  'KEY INSIGHTS': '💡',
  'PAIN POINTS': '😤',
  'NEEDS & GOALS': '🎯',
  'NOTABLE QUOTES': '💬',
  'DESIGN RECOMMENDATIONS': '✏️',
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

export default function InterviewSummary({ persona, summary, onNewInterview, onBack }: Props) {
  const sections = parseSummary(summary);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
  };

  return (
    <div className="summary-page">
      <div className="summary-container">
        {/* Header */}
        <div className="summary-header">
          <button className="back-btn" onClick={onBack}>← Back to chat</button>
          <button className="copy-btn" onClick={handleCopy}>Copy ↗</button>
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

        <button className="btn-primary btn-full" onClick={onNewInterview}>
          Start New Interview →
        </button>
      </div>
    </div>
  );
}
