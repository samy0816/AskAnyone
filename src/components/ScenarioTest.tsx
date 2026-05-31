import { useState, useRef } from 'react';
import type { Persona, ScenarioAnalysis, ScenarioHotspot } from '../types';
import { generateMultiScenarioAnalysis } from '../services/gemini';

interface Props {
  persona: Persona;
  extraPersonas: Persona[];
  onBack: () => void;
}

const HOTSPOT_COLORS: Record<ScenarioHotspot['type'], string> = {
  pain: '#F87171',
  interest: '#60A5FA',
  confusion: '#FBBF24',
};

const HOTSPOT_LABELS: Record<ScenarioHotspot['type'], string> = {
  pain: 'Pain',
  interest: 'Interest',
  confusion: 'Confusion',
};

// Map named regions → stable percentage positions on the image
const REGION_COORDS: Record<string, { x: number; y: number }> = {
  'top-left':      { x: 22, y: 14 },
  'top-center':    { x: 50, y: 14 },
  'top-right':     { x: 78, y: 14 },
  'middle-left':   { x: 22, y: 50 },
  'middle-center': { x: 50, y: 50 },
  'middle-right':  { x: 78, y: 50 },
  'bottom-left':   { x: 22, y: 86 },
  'bottom-center': { x: 50, y: 86 },
  'bottom-right':  { x: 78, y: 86 },
};

function regionToCoords(region: string): { x: number; y: number } {
  return REGION_COORDS[region?.toLowerCase()] ?? REGION_COORDS['middle-center'];
}

export default function ScenarioTest({ persona, extraPersonas, onBack }: Props) {
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Persona[]>([]);
  const [analysis, setAnalysis] = useState<ScenarioAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredHotspot, setHoveredHotspot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allPersonas = [persona, ...selectedExtras];

  const toggleExtra = (p: Persona) => {
    setSelectedExtras(prev =>
      prev.some(x => x.name === p.name)
        ? prev.filter(x => x.name !== p.name)
        : prev.length < 2 ? [...prev, p] : prev
    );
  };

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
      setImageBase64(result.split(',')[1]);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleTest = async () => {
    if (!description.trim() && !imageBase64) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setActiveTab(0);
    try {
      const result = await generateMultiScenarioAnalysis(
        allPersonas,
        description.trim(),
        imageBase64 ?? undefined,
        imageMimeType ?? undefined
      );
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const scenarios = [
    'A sign-up page that asks for email, password, and phone number all at once',
    'A dashboard with 12 charts and no clear primary action',
    'An onboarding flow where the first screen is just a blank canvas',
    'A checkout where the price only appears at the very last step',
  ];

  const activeReaction = analysis?.reactions[activeTab];
  const activeHotspots = imageBase64 && activeReaction
    ? activeReaction.hotspots.filter(h => h.region && h.region.trim() !== '')
    : [];

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
          Show up to 3 personas a screen and get in-depth reactions, flow analysis, and annotated pain points.
        </p>
      </div>

      <div className="scenario-body">

        {/* Extra persona picker — always visible */}
        <div className="scenario-panel">
          <div className="scenario-panel-header">
            <span className="scenario-panel-title">Who's reviewing this screen?</span>
            <span className="scenario-panel-hint">
              {allPersonas.length === 1 ? '+ Add up to 2 more voices' : `${allPersonas.length} personas analyzing`}
            </span>
          </div>

          {/* Always show current persona chip */}
          <div className="scenario-active-voices">
            {allPersonas.map(p => (
              <span key={p.name} className="scenario-voice-chip scenario-voice-chip-active">
                {p.avatar} {p.name}
              </span>
            ))}
          </div>

          {extraPersonas.length > 0 ? (
            <>
              <p className="scenario-panel-add-label">Add from your library:</p>
              <div className="scenario-extra-grid">
                {extraPersonas.map(p => {
                  const selected = selectedExtras.some(x => x.name === p.name);
                  const disabled = !selected && selectedExtras.length >= 2;
                  return (
                    <button
                      key={p.name}
                      className={`scenario-extra-btn ${selected ? 'scenario-extra-selected' : ''} ${disabled ? 'scenario-extra-disabled' : ''}`}
                      onClick={() => !disabled && toggleExtra(p)}
                      disabled={disabled}
                      type="button"
                    >
                      <span className="scenario-extra-avatar">{p.avatar}</span>
                      <span className="scenario-extra-name">{p.name}</span>
                      {selected && <span className="scenario-extra-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="scenario-empty-library">
              <span className="scenario-empty-icon">👥</span>
              <span className="scenario-empty-msg">
                Save more personas to your library to test this screen with multiple people at once.
                <br />Go back → generate a persona → tap <strong>Save to Library</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Image upload */}
        <div
          className="scenario-upload-zone"
          onClick={() => !imagePreview && fileInputRef.current?.click()}
          style={{ cursor: imagePreview ? 'default' : 'pointer' }}
        >
          {imagePreview ? (
            <div className="scenario-preview">
              <div className="scenario-image-wrap">
                <img src={imagePreview} alt="Uploaded screen" className="scenario-image" />
                {activeHotspots.map((h, i) => {
                  const coords = regionToCoords(h.region);
                  return (
                  <div
                    key={i}
                    className="hotspot-pin"
                    style={{ left: `${coords.x}%`, top: `${coords.y}%`, background: HOTSPOT_COLORS[h.type] }}
                    onMouseEnter={() => setHoveredHotspot(i)}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    {i + 1}
                    {hoveredHotspot === i && (
                      <div className="hotspot-tooltip">
                        <span className="hotspot-tooltip-type" style={{ color: HOTSPOT_COLORS[h.type] }}>
                          {HOTSPOT_LABELS[h.type]}
                        </span>
                        <span className="hotspot-tooltip-label">{h.label}</span>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              <div className="scenario-preview-actions">
                <button className="btn-ghost btn-sm" onClick={handleClear}>✕ Remove image</button>
                {activeHotspots.length > 0 && (
                  <span className="hotspot-legend">
                    <span style={{ color: HOTSPOT_COLORS.pain }}>● Pain</span>
                    <span style={{ color: HOTSPOT_COLORS.interest }}>● Interest</span>
                    <span style={{ color: HOTSPOT_COLORS.confusion }}>● Confusion</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="scenario-upload-placeholder">
              <span className="scenario-upload-icon">📸</span>
              <span className="scenario-upload-text">Upload a screenshot</span>
              <span className="scenario-upload-hint">PNG, JPG, or WebP · Pain points will be pinned on the image</span>
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

        <div className="scenario-divider"><span>or describe the screen</span></div>

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

        <div className="home-examples">
          <p className="examples-label">Quick scenarios</p>
          <div className="examples-list">
            {scenarios.map(s => (
              <button key={s} className="example-chip" onClick={() => setDescription(s)} type="button">{s}</button>
            ))}
          </div>
        </div>

        {error && <div className="error-banner"><span>⚠️</span> {error}</div>}

        <button
          className="btn-primary btn-full"
          onClick={handleTest}
          disabled={(!description.trim() && !imageBase64) || isLoading}
        >
          {isLoading
            ? `Analyzing with ${allPersonas.length} persona${allPersonas.length > 1 ? 's' : ''}...`
            : `Analyze with ${allPersonas.length} Persona${allPersonas.length > 1 ? 's' : ''} →`}
        </button>

        {/* Results */}
        {analysis && (
          <div className="scenario-results">
            {/* Persona tabs */}
            <div className="scenario-tabs">
              {analysis.reactions.map((r, i) => (
                <button
                  key={r.personaName}
                  className={`scenario-tab ${activeTab === i ? 'scenario-tab-active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {r.avatar} {r.personaName}
                </button>
              ))}
            </div>

            {/* Active persona reaction */}
            {activeReaction && (
              <div className="scenario-reaction-card">
                <div className="scenario-reaction-header">
                  <span className="scenario-reaction-avatar">{activeReaction.avatar}</span>
                  <div>
                    <div className="scenario-reaction-name">{activeReaction.personaName}</div>
                    <div className="scenario-reaction-role">First impression</div>
                  </div>
                </div>
                <blockquote className="scenario-reaction-text">"{activeReaction.firstImpression}"</blockquote>

                <div className="scenario-reaction-section">
                  <div className="scenario-reaction-section-title">How they'd navigate this</div>
                  <p className="scenario-reaction-body">{activeReaction.flowThoughts}</p>
                </div>

                <div className="scenario-reaction-cols">
                  <div className="scenario-reaction-col">
                    <div className="scenario-reaction-section-title" style={{ color: '#F87171' }}>Pain points</div>
                    <ul className="scenario-reaction-list scenario-list-pain">
                      {activeReaction.painPoints.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div className="scenario-reaction-col">
                    <div className="scenario-reaction-section-title" style={{ color: '#60A5FA' }}>What draws attention</div>
                    <ul className="scenario-reaction-list scenario-list-interest">
                      {activeReaction.highInterestAreas.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Shared across personas */}
            {analysis.reactions.length > 1 && (
              <div className="scenario-shared">
                <div className="scenario-shared-block">
                  <div className="scenario-shared-title">Shared insights across all personas</div>
                  <ul className="scenario-shared-list">
                    {analysis.sharedInsights.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="scenario-shared-block">
                  <div className="scenario-shared-title">Design opportunities</div>
                  <ul className="scenario-shared-list scenario-shared-opps">
                    {analysis.designOpportunities.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              </div>
            )}

            <button className="btn-ghost btn-sm" onClick={handleTest} disabled={isLoading}>
              ↺ Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
