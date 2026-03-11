import type { AngleCategory } from "./types";

export const SENDER = {
  name: "Kuzey Yasasan",
  current_role: "Engineer",
  company: "Elisen and Associates",
  education: "Materials Engineering, McGill University (B.Eng., 2023–2027)",
  background_facets: {
    aviation_engineering:
      "Currently building an internal AI tool for aviation airworthiness — applying new technology to serious operational safety problems in aviation.",
    investing_economic_development:
      "Strong interests in investing, economic development, and systems thinking. Drawn to how capital, policy, and technology interact to build real prosperity.",
    global_infrastructure_china:
      "Heading to China soon with a team to examine infrastructure and technology on the ground — studying what is working at scale and bringing useful lessons back.",
    ai_tools_technical_initiative:
      "Building internal AI tools that solve real operational problems. Technically hands-on with a bias toward shipping working systems.",
    builder_ambition_intellectual:
      "Ambitious, high-agency builder with deep interests in aviation, engineering, investing, and technology. Intellectually serious and commercially aware.",
  } as Record<AngleCategory, string>,
  tone_guidelines: [
    "Polished, technically credible, commercially aware, intellectually serious.",
    "Human, concise, high-signal.",
    "Respectful and thoughtful — never needy, generic, or over-eager.",
    "The reader should feel Kuzey is a smart, credible, high-potential person who is paying close attention to exceptional people.",
    "Warm but sharp. Not sycophantic.",
  ],
  anti_patterns: [
    "Do not use vague praise: 'I admire your impressive background', 'Your work is inspiring'.",
    "Do not sound mass-produced or AI-generated.",
    "Do not invent facts about the recipient. Only use verified public information.",
    "Do not use the same framing for every recipient.",
    "Do not be over-eager or needy. No exclamation marks in the body.",
    "Do not use filler words or corporate jargon.",
    "Do not write more than 5 sentences.",
  ],
};
