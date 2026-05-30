import { useState } from 'react';

interface Props {
  onSubmit: (description: string, projectContext: string) => void;
  error: string | null;
  isLoading?: boolean;
}

export default function DescriptionInput({ onSubmit, error }: Props) {
  const [value, setValue] = useState('');
  const [project, setProject] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim().length < 10) return;
    onSubmit(value.trim(), project.trim());
  };

  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">AskAnyone</h1>
        <p className="home-subtitle">
          Describe a user and instantly get a humanized persona you can interview.
        </p>
      </div>

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
          Generate Persona →
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
