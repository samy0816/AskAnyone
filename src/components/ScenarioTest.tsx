import { useState, useRef } from 'react';
import type { Persona } from '../types';
import { generateScenarioReaction } from '../services/gemini';

interface Props {
  persona: Persona;
  onBack: () => void;
}

export default function ScenarioTest({ persona, onBack }: Props) {
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a PNG, JPG, or WebP image.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      // Extract base64 portion (strip data:image/...;base64,)
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleTest = async () => {
    if (!description.trim() && !imageBase64) return;
    setIsLoading(true);
    setError(null);
    setReaction(null);
    try {
      const result = await generateScenarioReaction(
        persona,
        description.trim(),
        imageBase64 ?? undefined,
        imageMimeType ?? undefined
      );
      setReaction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get reaction.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    setReaction(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const scenarios = [
    'A sign-up page that asks for email, password, and phone number all at once',
    'A dashboard with 12 charts and no clear primary action button',
    'An onboarding flow where the first screen is just a blank canvas with no instructions',
    'A checkout page where the price only appears at the very last step',
  ];

  return (
    <div className="scenario-page">
      <div className="scenario-header">
        <button className="back-btn" onClick={onBack}>← Back to persona</button>
        <div className="scenario-persona-info">
          <span className="scenario-avatar">{persona.avatar}</span>
          <div>
            <span className="scenario-persona-name">{persona.name}</span>
            <span className="scenario-persona-role">{persona.occupation}</span>
          </div>
        </div>
      </div>

      <div className="scenario-title-block">
        <h2 className="scenario-title">Scenario Test</h2>
        <p className="scenario-sub">
          Show {persona.name} a screen or describe a design decision — get an immediate, in-character reaction.
        </p>
      </div>

      <div className="scenario-body">
        {/* Image upload */}
        <div className="scenario-upload-zone" onClick={() => fileInputRef.current?.click()}>
          {imagePreview ? (
            <div className="scenario-preview">
              <img src={imagePreview} alt="Uploaded screen" className="scenario-image" />
              <button className="scenario-clear-btn" onClick={e => { e.stopPropagation(); handleClear(); }}>
                ✕ Remove
              </button>
            </div>
          ) : (
            <div className="scenario-upload-placeholder">
              <span className="scenario-upload-icon">📸</span>
              <span className="scenario-upload-text">Upload a screenshot</span>
              <span className="scenario-upload-hint">PNG, JPG, or WebP · Click to browse</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div className="scenario-divider">
          <span>or describe the screen</span>
        </div>

        <div className="input-wrapper">
          <label className="input-label">Screen / Scenario Description</label>
          <textarea
            className="home-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. A sign-up form with 8 required fields before you can try the product..."
            rows={3}
          />
        </div>

        {/* Quick scenarios */}
        <div className="home-examples">
          <p className="examples-label">Quick scenarios</p>
          <div className="examples-list">
            {scenarios.map(s => (
              <button key={s} className="example-chip" onClick={() => setDescription(s)} type="button">
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-banner"><span>⚠️</span> {error}</div>}

        <button
          className="btn-primary btn-full"
          onClick={handleTest}
          disabled={(!description.trim() && !imageBase64) || isLoading}
        >
          {isLoading ? `${persona.name} is reacting...` : `Get ${persona.name}'s Reaction →`}
        </button>

        {/* Reaction */}
        {reaction && (
          <div className="scenario-reaction">
            <div className="scenario-reaction-header">
              <span className="scenario-reaction-avatar">{persona.avatar}</span>
              <span className="scenario-reaction-name">{persona.name}'s first reaction</span>
            </div>
            <blockquote className="scenario-reaction-text">"{reaction}"</blockquote>
            <button
              className="btn-ghost btn-sm"
              onClick={handleTest}
              disabled={isLoading}
            >
              ↺ Get another reaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
