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
    "Sound like a sharp 21-year-old who reads a lot and builds things.",
    "Concise. Warm. Direct. Never needy.",
    "One specific compliment, one clear connection, one easy ask.",
    "The reader should think: this person is paying attention.",
  ],
  anti_patterns: [
    // Abstract praise
    "Never say: impressive, inspiring, remarkable, incredible, amazing, outstanding.",
    "Never say: 'your journey', 'your vision', 'your leadership'.",
    // AI tells
    "Never say: leverage, ecosystem, landscape, trajectory, pivot, intersection, innovative, transformative, synergy, paradigm, disruptive, holistic, robust, scalable, cutting-edge, spearhead, endeavor, delve, realm, tapestry, multifaceted, unparalleled, navigating, fostering, harnessing, underscores.",
    // Consultant phrases
    "Never say: 'at the intersection of', 'from both X and Y perspective', 'where the real X will emerge', 'I would greatly value', 'I'd be honored', 'meaningful synergies', 'I'd love to explore potential'.",
    // Structural
    "No exclamation marks. No 'I hope this finds you well.' No 'Best regards.'",
    "No stacking 2+ abstract concepts in one sentence.",
    "3-5 sentences max. Shorter is always better.",
    "Sign off with just 'Kuzey'.",
  ],
};
