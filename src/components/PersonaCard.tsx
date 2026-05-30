import { useState } from 'react';
import type { Persona, EmotionalState } from '../types';

interface Props {
  persona: Persona;
  onStartChat: (emotionalState: EmotionalState) => void;
  onBack: () => void;
  onSave: () => void;
  onScenarioTest: () => void;
  isSaved: boolean;
}

const TECH_COLORS: Record<string, string> = {
  Low: '#F59E0B',
  Medium: '#3B82F6',
  High: '#10B981',
};

const EMOTIONAL_STATES: { value: EmotionalState; label: string; description: string }[] = [
  { value: 'Normal', label: 'Normal', description: 'Default character' },
  { value: 'Rushed', label: 'Rushed', description: 'Short on time' },
  { value: 'Frustrated', label: 'Frustrated', description: 'Had a bad day' },
  { value: 'Curious', label: 'Curious', description: 'Asks follow-ups' },
  { value: 'Skeptical', label: 'Skeptical', description: 'Doubts everything' },
];

export default function PersonaCard({ persona, onStartChat, onBack, onSave, onScenarioTest, isSaved }: Props) {
  const [selectedState, setSelectedState] = useState<EmotionalState>('Normal');

  return (
    <div className="persona-page">
      <div className="persona-top-bar">
        <button className="back-btn" onClick={onBack}>← Try another</button>
        <div className="persona-top-actions">
          <button
            className={`btn-ghost ${isSaved ? 'btn-saved' : ''}`}
            onClick={onSave}
            title={isSaved ? 'Saved to library' : 'Save to library'}
          >
            {isSaved ? '✓ Saved' : 'Save'}
          </button>
          <button className="btn-ghost" onClick={onScenarioTest} title="Test a screen">
            Test a Screen
          </button>
        </div>
      </div>

      <div className="persona-card">
        {/* Header */}
        <div className="persona-header">
          <div className="persona-avatar">{persona.avatar}</div>
          <div className="persona-headline">
            <h2 className="persona-name">{persona.name}</h2>
            <p className="persona-role">{persona.occupation}</p>
            <p className="persona-location">{persona.location} · {persona.age} yrs</p>
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

        {/* Persona Spectrum */}
        <section className="persona-section">
          <h3 className="section-label">Persona Spectrum</h3>
          <div className="spectrum-grid">
            <div className="spectrum-row">
              <span className="spectrum-label">Tech Savviness</span>
              <div className="spectrum-bar">
                <div
                  className="spectrum-fill"
                  style={{
                    width: persona.techSavviness === 'Low' ? '20%' : persona.techSavviness === 'Medium' ? '55%' : '90%',
                    background: TECH_COLORS[persona.techSavviness],
                  }}
                />
              </div>
              <span className="spectrum-value" style={{ color: TECH_COLORS[persona.techSavviness] }}>
                {persona.techSavviness}
              </span>
            </div>
            <div className="spectrum-row">
              <span className="spectrum-label">Goal Focus</span>
              <div className="spectrum-bar">
                <div
                  className="spectrum-fill"
                  style={{ width: `${Math.min(persona.goals.length * 28, 95)}%`, background: '#34D399' }}
                />
              </div>
              <span className="spectrum-value" style={{ color: '#34D399' }}>
                {persona.goals.length} goals
              </span>
            </div>
            <div className="spectrum-row">
              <span className="spectrum-label">Friction Level</span>
              <div className="spectrum-bar">
                <div
                  className="spectrum-fill"
                  style={{ width: `${Math.min(persona.frustrations.length * 35, 95)}%`, background: '#F87171' }}
                />
              </div>
              <span className="spectrum-value" style={{ color: '#F87171' }}>
                {persona.frustrations.length} pain points
              </span>
            </div>
          </div>
        </section>

        {/* Emotional State Selector */}
        <section className="persona-section">
          <h3 className="section-label">Interview Mood</h3>
          <p className="section-subtext">Set {persona.name}'s emotional state for this session</p>
          <div className="emotional-state-grid">
            {EMOTIONAL_STATES.map(state => (
              <button
                key={state.value}
                className={`emotional-state-btn ${selectedState === state.value ? 'emotional-state-btn-active' : ''}`}
                onClick={() => setSelectedState(state.value)}
              >
                <span className="emotional-state-label">{state.label}</span>
                <span className="emotional-state-desc">{state.description}</span>
              </button>
            ))}
          </div>
        </section>

        {/* CTA */}
        <button className="btn-primary btn-full" onClick={() => onStartChat(selectedState)}>
          Start Interview {selectedState !== 'Normal' ? `(${selectedState})` : '→'}
        </button>
      </div>
    </div>
  );
}
