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

export interface Message {
  id: string;
  role: 'user' | 'persona';
  content: string;
  timestamp: Date;
}

export type AppView = 'home' | 'loading' | 'persona' | 'chat' | 'summary';
