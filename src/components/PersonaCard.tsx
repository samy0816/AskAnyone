import type { Persona } from '../types';

interface Props {
  persona: Persona;
  onStartChat: () => void;
  onBack: () => void;
}

const TECH_COLORS: Record<string, string> = {
  Low: '#F59E0B',
  Medium: '#3B82F6',
  High: '#10B981',
};

export default function PersonaCard({ persona, onStartChat, onBack }: Props) {
  return (
    <div className="persona-page">
      <button className="back-btn" onClick={onBack}>
        ← Try another
      </button>

      <div className="persona-card">
        {/* Header */}
        <div className="persona-header">
          <div className="persona-avatar">{persona.avatar}</div>
          <div className="persona-headline">
            <h2 className="persona-name">{persona.name}</h2>
            <p className="persona-role">{persona.occupation}</p>
            <p className="persona-location">📍 {persona.location} · {persona.age} yrs</p>
          </div>
          <span
            className="tech-badge"
            style={{ background: TECH_COLORS[persona.techSavviness] + '20', color: TECH_COLORS[persona.techSavviness] }}
          >
            {persona.techSavviness} Tech
          </span>
        </div>

        {/* Quote */}
        <blockquote className="persona-quote">"{persona.quote}"</blockquote>

        {/* Background */}
        <section className="persona-section">
          <h3 className="section-label">Background</h3>
          <p className="section-text">{persona.background}</p>
        </section>

        {/* Personality */}
        <section className="persona-section">
          <h3 className="section-label">Personality</h3>
          <div className="tag-list">
            {persona.personality.map(trait => (
              <span key={trait} className="tag">{trait}</span>
            ))}
          </div>
        </section>

        {/* Goals & Frustrations */}
        <div className="persona-two-col">
          <section className="persona-section">
            <h3 className="section-label goals">Goals</h3>
            <ul className="bullet-list">
              {persona.goals.map(g => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
          <section className="persona-section">
            <h3 className="section-label frustrations">Frustrations</h3>
            <ul className="bullet-list">
              {persona.frustrations.map(f => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* CTA */}
        <button className="btn-primary btn-full" onClick={onStartChat}>
          Start Interview →
        </button>
      </div>
    </div>
  );
}
