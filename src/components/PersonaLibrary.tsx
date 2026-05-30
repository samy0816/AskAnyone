import { useState } from 'react';
import type { SavedPersona } from '../types';
import { getSavedPersonas, deletePersonaFromLibrary } from '../utils/storage';

interface Props {
  onResumeInterview: (saved: SavedPersona) => void;
  onStartNewInterview: (saved: SavedPersona) => void;
  onBack: () => void;
}

const TECH_COLORS: Record<string, string> = {
  Low: '#F59E0B',
  Medium: '#3B82F6',
  High: '#10B981',
};

export default function PersonaLibrary({ onResumeInterview, onStartNewInterview, onBack }: Props) {
  const [personas, setPersonas] = useState<SavedPersona[]>(() => getSavedPersonas());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deletePersonaFromLibrary(id);
      setPersonas(getSavedPersonas());
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const handleExportJSON = (saved: SavedPersona) => {
    const data = JSON.stringify(
      { persona: saved.persona, projectContext: saved.projectContext, createdAt: saved.createdAt },
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${saved.persona.name.replace(/\s+/g, '-').toLowerCase()}-persona.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="library-page">
      <div className="library-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="library-title-group">
          <h2 className="library-title">Persona Library</h2>
          <p className="library-sub">{personas.length} saved persona{personas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {personas.length === 0 ? (
        <div className="library-empty">
          <div className="library-empty-icon"></div>
          <h3>No saved personas yet</h3>
          <p>Generate a persona and save it to your library to access it here.</p>
          <button className="btn-primary" onClick={onBack}>Generate a Persona</button>
        </div>
      ) : (
        <div className="library-grid">
          {personas.map(saved => (
            <div key={saved.id} className="library-card">
              <div className="library-card-header">
                <div className="library-avatar">{saved.persona.avatar}</div>
                <div className="library-card-info">
                  <div className="library-card-name">{saved.persona.name}</div>
                  <div className="library-card-role">{saved.persona.occupation}</div>
                  <div className="library-card-meta">
                    {saved.persona.location} · {saved.persona.age} yrs
                  </div>
                </div>
                <span
                  className="tech-badge-sm"
                  style={{
                    background: TECH_COLORS[saved.persona.techSavviness] + '20',
                    color: TECH_COLORS[saved.persona.techSavviness],
                  }}
                >
                  {saved.persona.techSavviness}
                </span>
              </div>

              {saved.projectContext && (
                <div className="library-project-tag">
                  {saved.projectContext}
                </div>
              )}

              <div className="library-traits">
                {saved.persona.personality.slice(0, 3).map(t => (
                  <span key={t} className="tag tag-sm">{t}</span>
                ))}
              </div>

              <div className="library-meta-row">
                <span className="library-date">{formatDate(saved.createdAt)}</span>
                {saved.messages && saved.messages.length > 1 && (
                  <span className="library-convo-badge">
                    {saved.messages.length - 1} messages
                  </span>
                )}
              </div>

              <div className="library-actions">
                <button className="btn-primary btn-sm" onClick={() => onStartNewInterview(saved)}>
                  New Interview
                </button>
                {saved.messages && saved.messages.length > 1 && (
                  <button className="btn-ghost btn-sm" onClick={() => onResumeInterview(saved)}>
                    Resume
                  </button>
                )}
                <button className="btn-ghost btn-sm" onClick={() => handleExportJSON(saved)} title="Export as JSON">
                  ↓ JSON
                </button>
                <button
                  className={`btn-danger btn-sm ${deleteConfirm === saved.id ? 'btn-danger-confirm' : ''}`}
                  onClick={() => handleDelete(saved.id)}
                >
                  {deleteConfirm === saved.id ? 'Confirm?' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
