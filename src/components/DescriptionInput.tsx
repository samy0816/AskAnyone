import { useState } from 'react';
import { getSavedPersonas } from '../utils/storage';

interface Props {
  onSubmit: (description: string, projectContext: string, count: number) => void;
  onOpenLibrary: () => void;
  onOpenDebate: () => void;
  error: string | null;
  initialDescription?: string;
  initialProject?: string;
}

export default function DescriptionInput({ onSubmit, onOpenLibrary, onOpenDebate, error, initialDescription = '', initialProject = '' }: Props) {
  const [value, setValue] = useState(initialDescription);
  const [project, setProject] = useState(initialProject);
  const [mode, setMode] = useState<'single' | 'room'>('single');
  const savedCount = getSavedPersonas().length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().length < 10) return;
    onSubmit(value.trim(), project.trim(), mode === 'room' ? 3 : 1);
  };

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">AskAnyone</h1>
        <p className="home-subtitle">
          Describe a user and instantly get a humanized persona you can interview.
        </p>
      </div>

      {/* Nav row */}
      <div className="home-nav-row">
        <button className="home-nav-btn" onClick={onOpenLibrary}>
          Library {savedCount > 0 && <span className="home-nav-badge">{savedCount}</span>}
        </button>
        <button className="home-nav-btn" onClick={onOpenDebate}>
          Debate
        </button>
      </div>

      {/* Mode toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'single' ? 'mode-btn-active' : ''}`}
          onClick={() => setMode('single')}
        >
          Single Persona
        </button>
        <button
          className={`mode-btn ${mode === 'room' ? 'mode-btn-active' : ''}`}
          onClick={() => setMode('room')}
        >
          The Room
          <span className="mode-btn-badge">3 personas</span>
        </button>
      </div>

      {mode === 'room' && (
        <div className="room-mode-hint">
          Generate 3 distinct personas from your description and interview them all at once.
          You can also switch to 1:1 with any one of them.
        </div>
      )}

      <form className="home-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <label className="input-label">Who are you interviewing?</label>
          <textarea
            className="home-textarea"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="e.g. A 30-year-old nurse who struggles with hospital scheduling apps and wants better tools for shift management..."
            rows={4}
          />
          <div className="char-hint">
            {value.trim().length < 10 && value.length > 0
              ? 'Add a bit more detail...'
              : value.trim().length >= 10
              ? '✓ Ready to generate'
              : 'Describe who you want to interview'}
          </div>
        </div>

        <div className="input-wrapper">
          <label className="input-label">What are you building? <span className="input-label-optional">(optional)</span></label>
          <input
            className="home-input"
            type="text"
            value={project}
            onChange={e => setProject(e.target.value)}
            placeholder="e.g. A mobile app for tracking medication reminders for elderly users"
          />
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={value.trim().length < 10}
        >
          {mode === 'room' ? 'Generate The Room →' : 'Generate Persona →'}
        </button>
      </form>

      <div className="home-examples">
        <p className="examples-label">Try these examples</p>
        <div className="examples-list">
          {[
            'A freelance graphic designer in their late 20s who juggles multiple clients and needs better project management',
            'A retired teacher learning to use smartphones for the first time to stay connected with grandchildren',
            'A college student balancing part-time work and studies who uses food delivery apps daily',
          ].map(ex => (
            <button
              key={ex}
              className="example-chip"
              onClick={() => setValue(ex)}
              type="button"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
