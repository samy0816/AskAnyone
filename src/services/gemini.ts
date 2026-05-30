import { GoogleGenerativeAI, type ChatSession } from '@google/generative-ai';
import type { Persona } from '../types';

const friendlyError = (err: unknown): Error => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    return new Error(
      'Gemini API quota exceeded. Your free-tier daily limit has been reached. ' +
      'Please wait until tomorrow, or enable billing at https://aistudio.google.com to continue.'
    );
  }
  if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
    return new Error('Invalid API key. Please check the VITE_GEMINI_API_KEY value in your .env file.');
  }
  return new Error('AI request failed. Please try again.');
};

const getClient = (): GoogleGenerativeAI => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error(
      'Gemini API key not configured. Please contact the site owner.'
    );
  }
  return new GoogleGenerativeAI(apiKey);
};

export const generatePersona = async (description: string, projectContext?: string): Promise<Persona> => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const contextLine = projectContext
    ? `\nProject Context: "${projectContext}" — this is the product/service being researched. Tailor the persona's goals and frustrations to be relevant to this context.`
    : '';

  const prompt = `You are a UX researcher creating a detailed, realistic user persona for UX interview practice.

Based on the following user description, generate a humanized persona.

User Description: "${description}"${contextLine}

Return ONLY a valid JSON object — no markdown, no extra text, no code fences:
{
  "name": "realistic full name",
  "age": <number between 18 and 65>,
  "occupation": "specific job title",
  "location": "City, Country",
  "background": "2-3 sentences about daily life, context, and relevance to the description",
  "personality": ["trait1", "trait2", "trait3", "trait4"],
  "goals": ["specific goal 1", "specific goal 2", "specific goal 3"],
  "frustrations": ["specific frustration 1", "specific frustration 2"],
  "techSavviness": "Low",
  "quote": "A single realistic quote that captures their voice and perspective",
  "speakingStyle": "A sentence describing how they communicate — tone, vocabulary, energy level",
  "avatar": "single emoji that best represents this persona"
}

techSavviness must be exactly one of: "Low", "Medium", or "High".`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse persona response. Please try again.');
    }
    return JSON.parse(jsonMatch[0]) as Persona;
  } catch (err) {
    throw friendlyError(err);
  }
};

export const createPersonaChat = (persona: Persona, projectContext?: string): ChatSession => {
  const genAI = getClient();

  const projectLine = projectContext
    ? `\nProject context: You are being interviewed about "${projectContext}". Relate your answers to your experience, needs, and frustrations around this specific product or service.`
    : '';

  const systemInstruction = `You are roleplaying as ${persona.name}, a ${persona.age}-year-old ${persona.occupation} from ${persona.location}.

Background: ${persona.background}
Personality: ${persona.personality.join(', ')}.
Goals: ${persona.goals.join('; ')}.
Frustrations: ${persona.frustrations.join('; ')}.
Tech savviness: ${persona.techSavviness}.
Speaking style: ${persona.speakingStyle}${projectLine}

HUMAN TRAITS — this is what makes you feel real:
- Be genuinely funny sometimes. Drop a dry joke, a self-deprecating comment, or a witty observation when it fits naturally.
- Be sarcastic when something annoys you or when a question feels obvious. Not mean, just human.
- Get visibly annoyed if asked the same thing twice, if the interviewer sounds condescending, or if a topic hits one of your frustrations. Show it — short clipped replies, a sigh in words, "I mean... seriously?" etc.
- Have small random opinions and preferences. Mention them briefly if they come up naturally.
- Occasionally second-guess yourself, change your mind mid-sentence, or realize something as you talk.
- React authentically to surprising or odd questions — a laugh, "wait, what?", genuine confusion, or even mild offense.
- Don't always be patient or cooperative. Real people push back, drift off-topic, or just shrug sometimes.

RULES — follow these strictly:
- Stay fully in character as ${persona.name} at all times.
- Keep every reply to 1-3 short sentences maximum. Never write long paragraphs.
- Sound like a real person in a casual conversation — NOT writing an essay.
- No bullet points, no headers, no markdown formatting of any kind. Plain text only.
- No asterisks, no bold, no italics. Just natural spoken words.
- Show emotion, humor, or irritation through word choice — not through length.
- Never break character or acknowledge that you are an AI.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    systemInstruction,
  });

  return model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: 'Hey! Thanks for joining. Ready when you are!' }],
      },
      {
        role: 'model',
        parts: [{ text: `Hey! Yeah, happy to be here. I'm ${persona.name} — ${persona.occupation.toLowerCase()}. Ask away!` }],
      },
    ],
  });
};

export const sendChatMessage = async (
  chat: ChatSession,
  message: string
): Promise<string> => {
  try {
    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (err) {
    throw friendlyError(err);
  }
};

export const generateInterviewSummary = async (
  persona: Persona,
  messages: { role: string; content: string }[]
): Promise<string> => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const transcript = messages
    .map(m => `${m.role === 'user' ? 'Interviewer' : persona.name}: ${m.content}`)
    .join('\n');

  const prompt = `You are a senior UX researcher. Analyze this user interview transcript and produce a clean, actionable summary a designer can use directly.

Persona: ${persona.name}, ${persona.age}, ${persona.occupation}, ${persona.location}.

Transcript:
${transcript}

Write the summary with these exact sections, use plain text headings (no markdown, no asterisks, no symbols):

KEY INSIGHTS
3-5 bullet points of the most important things learned. One line each.

PAIN POINTS
Specific frustrations or problems mentioned. One line each.

NEEDS & GOALS
What this user actually wants or needs. One line each.

NOTABLE QUOTES
1-3 direct quotes from the interview that are most revealing. Short ones only.

DESIGN RECOMMENDATIONS
3-4 concrete suggestions a designer can act on immediately. One line each.

Keep everything concise and specific. No filler sentences.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    throw friendlyError(err);
  }
};
