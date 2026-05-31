# AskAnyone

A UX research tool that lets you generate realistic user personas and actually talk to them — so you can pressure-test designs, surface pain points, and get conflicting perspectives without scheduling a single user interview.

Built with React, TypeScript, Vite, and Google Gemini.

---

## What it does

### Persona Generation
Describe your target user — their background, goals, frustrations, and tech comfort level. AskAnyone generates a fully fleshed-out persona with a realistic speaking style, then lets you have a live conversation with them in character.

### Live Interview Chat
Chat directly with your persona. They respond in character, flag things that would confuse them, and give you honest reactions to your ideas. Every message can be tagged (pain point, goal, delight, confusion, opportunity) so patterns are easy to spot later.

**Devil's Advocate mode** — one toggle and the persona starts challenging your assumptions, pushing back on design decisions, and voicing objections. Good for stress-testing ideas when you've been too close to them.

### The Room
Generate 3 different personas at once. Useful when you need conflicting perspectives on the same problem — you'll get a tech-savvy power user, a casual first-timer, and someone who represents your most skeptical user, all in one go. Each is auto-saved to your library.

### Persona Library
All generated personas are saved locally. Browse past personas, revisit their interview transcripts, and pick them for Debate or Scenario Test sessions.

### Debate Mode
Pick two saved personas and give them a design question to argue. They respond from opposite sides based on their backgrounds and frustrations. Useful for thinking through tradeoffs before making a call.

### Interview Summary
At the end of a chat session, generate a structured summary of key insights, pain points, goals, and opportunities pulled from the conversation. Exportable as text.

### Scenario Test
Upload a screenshot of your screen or flow, select up to 3 personas from your library, and run a multi-persona analysis. Each persona gives:

- A first impression in their own voice
- How they'd navigate the screen
- Specific pain points they'd hit
- Areas of high interest or attention

Results include region-pinned markers on the image showing where each persona's pain, interest, and confusion landed — and a shared insights panel when multiple personas are tested together.

---

## Tech stack

- **React + TypeScript** — component architecture and type safety
- **Vite** — build tooling and dev server
- **Google Gemini** (`gemini-3.1-flash-lite`) — persona generation, chat, analysis, and vision for image-based scenario testing
- **localStorage** — persona persistence, no backend required

---

## Getting started

### Prerequisites
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Setup

```bash
git clone https://github.com/samy0816/AskAnyone.git
cd AskAnyone
npm install
```

Create a `.env` file in the root:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

Start the dev server:

```bash
npm run dev
```

---

## How to use it

1. **Generate a persona** — describe your target user on the home screen. Use "The Room" to generate 3 at once.
2. **Interview them** — chat freely, or toggle Devil's Advocate for pushback. Tag messages as they come in.
3. **Save to Library** — personas and their transcripts are saved locally for reuse.
4. **Run a Scenario Test** — go to Scenario Test from a persona card, upload a screen, add more personas from your library, and analyze.
5. **Start a Debate** — open Debate mode from the nav, pick two saved personas, and give them a topic.

---

## Project structure

```
src/
  components/
    ChatInterface.tsx       — Live persona interview chat
    DebateView.tsx          — Two-persona debate
    DescriptionInput.tsx    — Home screen / persona creation
    InterviewSummary.tsx    — Post-interview insights
    LoadingSpinner.tsx      — Context-aware loading states
    PersonaCard.tsx         — Persona detail + actions
    ScenarioTest.tsx        — Multi-persona screen analysis
  services/
    gemini.ts               — All Gemini API calls
  types/
    index.ts                — Shared TypeScript types
  utils/
    storage.ts              — localStorage helpers
  App.tsx                   — Root state and routing
```

---

## License

MIT
