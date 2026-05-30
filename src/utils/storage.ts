import type { SavedPersona, Message } from '../types';

const PERSONAS_KEY = 'ux-buddy-personas';

export const getSavedPersonas = (): SavedPersona[] => {
  try {
    const raw = localStorage.getItem(PERSONAS_KEY);
    if (!raw) return [];
    const parsed: SavedPersona[] = JSON.parse(raw);
    // Re-hydrate Date objects in messages
    return parsed.map(p => ({
      ...p,
      messages: p.messages?.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch {
    return [];
  }
};

export const savePersonaToLibrary = (saved: SavedPersona): void => {
  const existing = getSavedPersonas();
  const updated = [saved, ...existing.filter(p => p.id !== saved.id)];
  localStorage.setItem(PERSONAS_KEY, JSON.stringify(updated));
};

export const deletePersonaFromLibrary = (id: string): void => {
  const updated = getSavedPersonas().filter(p => p.id !== id);
  localStorage.setItem(PERSONAS_KEY, JSON.stringify(updated));
};

export const updatePersonaMessages = (id: string, messages: Message[]): void => {
  const personas = getSavedPersonas();
  const updated = personas.map(p => (p.id === id ? { ...p, messages } : p));
  localStorage.setItem(PERSONAS_KEY, JSON.stringify(updated));
};
