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
  imageBase64?: string;
  imageMimeType?: string;
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

// region is one of: top-left, top-center, top-right,
//   middle-left, middle-center, middle-right,
//   bottom-left, bottom-center, bottom-right
export interface ScenarioHotspot {
  region: string;
  label: string;
  type: 'pain' | 'interest' | 'confusion';
  personaName: string;
}

export interface ScenarioPersonaResult {
  personaName: string;
  avatar: string;
  firstImpression: string;
  flowThoughts: string;
  painPoints: string[];
  highInterestAreas: string[];
  hotspots: ScenarioHotspot[];
}

export interface ScenarioAnalysis {
  reactions: ScenarioPersonaResult[];
  sharedInsights: string[];
  designOpportunities: string[];
}

export type LoadingMode = 'persona' | 'room' | 'debate' | 'summary' | 'scenario';

export type AppView =
  | 'home'
  | 'loading'
  | 'persona'
  | 'chat'
  | 'summary'
  | 'library'
  | 'room'
  | 'room-1on1'
  | 'room-loading'
  | 'debate'
  | 'debate-loading'
  | 'scenario';
