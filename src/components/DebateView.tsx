import { useState } from 'react';
import type { Persona, DebateEntry } from '../types';
import { getSavedPersonas } from '../utils/storage';
import { generateDebate } from '../services/gemini';

interface Props {
  onBack: () => void;
}

export default function DebateView({ onBack }: Props) {
  const savedPersonas = getSavedPersonas();
  const [personaA, setPersonaA] = useState<Persona | null>(null);
  const [personaB, setPersonaB] = useState<Persona | null>(null);
  const [topic, setTopic] = useState('');
  const [debate, setDebate] = useState<DebateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!personaA || !personaB || topic.trim().length < 5) return;
    setIsLoading(true);
    setError(null);
    setDebate([]);
    try {
      const result = await generateDebate(personaA, personaB, topic.trim());
      setDebate(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate debate.');
    } finally {
      setIsLoading(false);
    }
  };

  const topics = [
    'Should this app require sign-up before letting me try it?',
    'Is a complex feature worth it if it takes time to learn?',
    'Would you pay a monthly subscription for this tool?',
    'Should the app send you daily notifications by default?',
    'Is a simpler design always better, or do you want more options?',
  ];

  return (
    <div className="debate-page">
      <div className="debate-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2 className="debate-title">Persona Debate</h2>
        <p className="debate-sub">See how two different users react to the same design question</p>
      </div>

      <div className="debate-setup">
        {/* Persona pickers */}
        <div className="debate-pickers">
          <div className="debate-picker">
            <label className="input-label">Persona A</label>
            <div className="debate-select-grid">
              {savedPersonas.map(s => (
                <button
                  key={s.id}
                  className={`debate-persona-option ${personaA?.name === s.persona.name ? 'debate-persona-selected' : ''}`}
                  onClick={() => setPersonaA(s.persona)}
                >
                  <span>{s.persona.avatar}</span>
                  <span>{s.persona.name}</span>
                </button>
              ))}
              {savedPersonas.length === 0 && (
                <p className="debate-empty-note">Save personas to your library first.</p>
              )}
            </div>
          </div>

          <div className="debate-vs">vs</div>

          <div className="debate-picker">
            <label className="input-label">Persona B</label>
            <div className="debate-select-grid">
              {savedPersonas.map(s => (
                <button
                  key={s.id}
                  className={`debate-persona-option ${personaB?.name === s.persona.name ? 'debate-persona-selected' : ''}`}
                  onClick={() => setPersonaB(s.persona)}
                >
                  <span>{s.persona.avatar}</span>
                  <span>{s.persona.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic */}
        <div className="input-wrapper">
          <label className="input-label">Design Question / Topic</label>
          <input
            className="home-input"
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Should we require sign-up before showing any content?"
          />
        </div>

        {/* Topic suggestions */}
        <div className="debate-topics">
          <p className="examples-label">Try these</p>
          <div className="debate-topic-chips">
            {topics.map(t => (
              <button key={t} className="example-chip" onClick={() => setTopic(t)} type="button">
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="error-banner"><span>⚠️</span> {error}</div>
        )}

        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={!personaA || !personaB || topic.trim().length < 5 || isLoading || personaA.name === personaB?.name}
        >
          {isLoading ? 'Generating debate...' : 'Start Debate →'}
        </button>
      </div>

      {/* Debate transcript */}
      {debate.length > 0 && (
        <div className="debate-transcript">
          <div className="debate-participants">
            <div className="debate-participant">
              <span className="debate-participant-avatar">{personaA?.avatar}</span>
              <span>{personaA?.name}</span>
            </div>
            <div className="debate-topic-pill">{topic}</div>
            <div className="debate-participant debate-participant-right">
              <span>{personaB?.name}</span>
              <span className="debate-participant-avatar">{personaB?.avatar}</span>
            </div>
          </div>

          <div className="debate-entries">
            {debate.map((entry, i) => (
              <div
                key={i}
                className={`debate-entry ${entry.side === 'A' ? 'debate-entry-a' : 'debate-entry-b'}`}
              >
                {entry.side === 'A' && (
                  <div className="debate-entry-avatar">{entry.avatar}</div>
                )}
                <div className="debate-entry-group">
                  <div className="debate-entry-name">{entry.personaName}</div>
                  <div className={`bubble ${entry.side === 'A' ? 'bubble-persona' : 'bubble-debate-b'}`}>
                    {entry.argument}
                  </div>
                </div>
                {entry.side === 'B' && (
                  <div className="debate-entry-avatar">{entry.avatar}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
