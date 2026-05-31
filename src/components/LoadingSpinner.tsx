import { useState, useEffect } from 'react';
import type { LoadingMode } from '../types';

const MESSAGES: Record<LoadingMode, string[]> = {
  persona: [
    'Analyzing your user...',
    'Crafting personality traits...',
    'Shaping goals and frustrations...',
    'Defining their speaking style...',
    'Finalizing your persona...',
  ],
  room: [
    'Building three distinct users...',
    'Crafting unique backgrounds...',
    'Giving each one a different voice...',
    'Shaping their perspectives...',
    'Almost ready for The Room...',
  ],
  debate: [
    'Reading both personas...',
    'Finding their points of tension...',
    'Building the argument...',
    'Adding personality to the debate...',
    'Finalizing the exchange...',
  ],
  summary: [
    'Reading the transcript...',
    'Identifying key insights...',
    'Pulling out pain points...',
    'Writing recommendations...',
    'Finishing your summary...',
  ],
  scenario: [
    'Reading the screen...',
    'Stepping into each persona...',
    'Mapping attention zones...',
    'Identifying friction points...',
    'Putting it all together...',
  ],
};

interface Props {
  mode?: LoadingMode;
}

export default function LoadingSpinner({ mode = 'persona' }: Props) {
  const [index, setIndex] = useState(0);
  const texts = MESSAGES[mode];

  useEffect(() => {
    setIndex(0);
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % texts.length);
    }, 1500);
    return () => clearInterval(id);
  }, [mode, texts.length]);

  return (
    <div className="loading">
      <div className="loading-logo">AskAnyone</div>
      <div className="loading-ring" />
      <p className="loading-text">{texts[index]}</p>
    </div>
  );
}
