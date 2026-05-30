import { useState, useEffect } from 'react';

const TEXTS = [
  'Analyzing your user...',
  'Building personality traits...',
  'Crafting their backstory...',
  'Shaping goals and frustrations...',
  'Finalizing your persona...',
];

export default function LoadingSpinner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % TEXTS.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="loading">
      <div className="loading-logo">UX Buddy</div>
      <div className="loading-ring" />
      <p className="loading-text">{TEXTS[index]}</p>
    </div>
  );
}
