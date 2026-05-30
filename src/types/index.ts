export interface Persona {
  name: string;
  age: number;
  occupation: string;
  location: string;
  background: string;
  personality: string[];
  goals: string[];
  frustrations: string[];
  techSavviness: 'Low' | 'Medium' | 'High';
  quote: string;
  speakingStyle: string;
  avatar: string;
}

export type MessageTag = 'pain-point' | 'goal' | 'delight' | 'confusion' | 'opportunity';

export interface Message {
  id: string;
  role: 'user' | 'persona';
  content: string;
  timestamp: Date;
  tag?: MessageTag;
}

export type EmotionalState = 'Normal' | 'Rushed' | 'Frustrated' | 'Curious' | 'Skeptical';

export interface SavedPersona {
  id: string;
  persona: Persona;
  projectContext: string;
  createdAt: string;
  messages?: Message[];
}

export interface DebateEntry {
  personaName: string;
  avatar: string;
  argument: string;
  side: 'A' | 'B';
}

export type AppView =
  | 'home'
  | 'loading'
  | 'persona'
  | 'chat'
  | 'summary'
  | 'library'
  | 'room'
  | 'room-loading'
  | 'debate'
  | 'debate-loading'
  | 'scenario';
