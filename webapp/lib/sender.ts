import type { AngleCategory } from "./types";

export const SENDER = {
  name: "Kuzey Yasasan",
  current_role: "Engineer",
  company: "Elisen and Associates",
  education: "Materials Engineering, McGill University (B.Eng., 2023–2027)",
  background_facets: {
    aviation_engineering:
      "Building an internal AI tool for aviation airworthiness — applying new tech to real safety problems in aviation.",
    investing_economic_development:
      "Interested in investing, economic development, and how capital and technology interact to build real prosperity.",
    global_infrastructure_china:
      "Heading to China soon with a team to study infrastructure and technology on the ground — what's working at scale and why.",
    ai_tools_technical_initiative:
      "Building internal AI tools that solve real operational problems. Hands-on with a bias toward shipping.",
    builder_ambition_intellectual:
      "Ambitious builder with interests in aviation, engineering, investing, and technology. Intellectually serious.",
  } as Record<AngleCategory, string>,
  tone_guidelines: [
    "Sound like a sharp 21-year-old, not a consultant.",
    "Concise. Warm. Credible. Understated.",
    "Respectful but never needy or over-eager.",
    "The reader should think: this person is paying attention.",
  ],
  anti_patterns: [
    "No vague praise. No 'impressive background' or 'inspiring work'.",
    "No AI-sounding language: remarkable, strategic foresight, leverage, ecosystem, landscape, trajectory, pivot, intersection.",
    "No stacking abstract concepts in one sentence.",
    "No exclamation marks. No corporate jargon. No filler.",
    "No more than 5 sentences.",
  ],
};
