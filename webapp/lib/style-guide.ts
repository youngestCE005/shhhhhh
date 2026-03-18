/**
 * Internal style guide for email generation quality control.
 * Used by both the generation prompts and the scoring/self-critique layer.
 */

// Words that immediately signal AI-generated text
export const BANNED_WORDS = [
  "remarkable",
  "strategic",
  "foresight",
  "leverage",
  "ecosystem",
  "landscape",
  "trajectory",
  "pivot",
  "intersection",
  "impressive",
  "inspiring",
  "innovative",
  "transformative",
  "synergy",
  "paradigm",
  "disruptive",
  "holistic",
  "stakeholder",
  "robust",
  "scalable",
  "cutting-edge",
  "game-changing",
  "thought leader",
  "passionate",
  "dynamic",
  "seamless",
  "empower",
  "spearhead",
  "endeavor",
  "delve",
  "realm",
  "tapestry",
  "multifaceted",
  "unparalleled",
  "navigating",
  "fostering",
  "harnessing",
  "underscores",
];

// Phrases that no real 21-year-old would write
export const BANNED_PHRASES = [
  "from both X and Y perspective",
  "at the intersection of",
  "where the real X will emerge",
  "application layer",
  "I would greatly value",
  "I'd be honored",
  "your impressive",
  "your inspiring",
  "deeply resonated",
  "truly resonated",
  "really resonated",
  "I was struck by",
  "what struck me",
  "I couldn't help but notice",
  "it's clear that",
  "needless to say",
  "it goes without saying",
  "I believe there could be",
  "meaningful synergies",
  "I'd love to explore potential",
  "if you'd ever be open to",
  "a brief conversation",
  "I would welcome the opportunity",
  "I would be grateful",
  "from an X standpoint",
  "in the space of",
  "in the realm of",
];

// Good vs bad examples for the prompt
export const STYLE_EXAMPLES = {
  bad: [
    {
      text: `Hi Kevin, Your remarkable journey from engineering to becoming one of the most recognized investors on Shark Tank is truly inspiring. The way you've built O'Leary Ventures at the intersection of media and venture capital demonstrates a unique strategic foresight. As someone passionate about where technology and investing converge, I'd love to explore how your perspective on capital allocation might inform approaches to infrastructure development. If you'd ever be open to a brief conversation, I'd really value it. Best regards, Kuzey`,
      why: "Every sentence is abstract praise. 'Remarkable journey,' 'truly inspiring,' 'strategic foresight,' 'at the intersection of' — all banned. Too long, too formal, sounds like ChatGPT.",
    },
    {
      text: `Hi Sarah, I've been following your groundbreaking work in sustainable aviation. Your innovative approach to reducing carbon emissions in the aerospace sector is truly transformative. I'm currently building an AI tool for aviation airworthiness and would love to discuss potential synergies between our endeavors. Would you be open to connecting? Best, Kuzey`,
      why: "'Groundbreaking,' 'innovative,' 'truly transformative,' 'potential synergies,' 'endeavors' — all AI tells. No specific reference to anything she actually did.",
    },
  ],
  good: [
    {
      text: `Hi Kevin, I watched your CNBC segment on why you won't invest in crypto mining companies — the math you laid out on energy costs vs. returns was sharper than most VC analyses I've read. I'm a materials engineering student at McGill working on an AI tool for aviation airworthiness. Completely different world, but your framework for evaluating capital-intensive tech stuck with me. Would you be up for a 15-minute call sometime? Kuzey`,
      why: "References a specific segment. One concrete compliment. Clear who the sender is. Easy ask. Sounds like a real person wrote it.",
    },
    {
      text: `Hi Sarah, I saw your talk at the IATA conference on predictive maintenance for narrow-body fleets — the failure-mode data you shared was really useful. I'm building an AI tool at Elisen that does airworthiness assessments, and your point about false positive rates in sensor data is exactly the problem we're working on. Would love to hear how you think about balancing safety margins with operational cost. Kuzey`,
      why: "References a specific talk and specific content. Makes a clear connection to the sender's work. The ask is natural and specific.",
    },
  ],
};

// Scoring rubric for self-critique
export const QUALITY_RUBRIC = {
  specificity: {
    weight: 0.3,
    description:
      "Does the email reference at least one specific, concrete thing the recipient did? (A project, talk, quote, company, decision — not abstract qualities.)",
    fail_signals: [
      "No concrete reference to recipient's work",
      "Only abstract praise ('impressive background', 'inspiring journey')",
      "References are too vague to verify",
    ],
  },
  voice: {
    weight: 0.25,
    description:
      "Does it sound like a real 21-year-old wrote it? Short sentences, direct, no consultant-speak.",
    fail_signals: [
      "Contains banned AI words",
      "Sentences longer than 25 words",
      "Multiple abstract concepts stacked in one sentence",
      "Formal sign-off (Best regards, Sincerely)",
    ],
  },
  connection: {
    weight: 0.2,
    description:
      "Is there a clear, logical reason why THIS sender is reaching out to THIS recipient?",
    fail_signals: [
      "No clear connection between sender and recipient",
      "Connection feels forced or generic",
      "Could send this email to anyone in the same industry",
    ],
  },
  brevity: {
    weight: 0.15,
    description: "Is it 3-5 sentences? No filler?",
    fail_signals: [
      "More than 5 sentences",
      "Contains filler phrases",
      "Redundant sentences that say the same thing differently",
    ],
  },
  ask: {
    weight: 0.1,
    description: "Does it end with something easy and natural to say yes to?",
    fail_signals: [
      "No clear ask",
      "Ask is too formal or stiff",
      "Ask is too vague ('let's connect sometime')",
    ],
  },
};

// Angle-to-recipient mapping intelligence
export const ANGLE_MATCHING: Record<
  string,
  { keywords: string[]; roles: string[]; industries: string[] }
> = {
  aviation_engineering: {
    keywords: [
      "aviation",
      "aerospace",
      "aircraft",
      "airline",
      "pilot",
      "airworthiness",
      "FAA",
      "EASA",
      "maintenance",
      "MRO",
      "flight",
      "defense",
      "drone",
      "UAV",
      "satellite",
      "space",
    ],
    roles: [
      "engineer",
      "CTO",
      "VP Engineering",
      "technical",
      "chief engineer",
      "program manager",
    ],
    industries: [
      "aviation",
      "aerospace",
      "defense",
      "manufacturing",
      "engineering",
    ],
  },
  investing_economic_development: {
    keywords: [
      "invest",
      "fund",
      "capital",
      "portfolio",
      "venture",
      "angel",
      "PE",
      "private equity",
      "returns",
      "allocation",
      "economic",
      "development",
      "growth",
      "GDP",
      "emerging market",
    ],
    roles: [
      "investor",
      "partner",
      "managing director",
      "CEO",
      "founder",
      "principal",
      "analyst",
    ],
    industries: [
      "finance",
      "venture capital",
      "private equity",
      "banking",
      "economic development",
      "government",
    ],
  },
  global_infrastructure_china: {
    keywords: [
      "China",
      "infrastructure",
      "Belt and Road",
      "BRI",
      "global",
      "developing",
      "construction",
      "rail",
      "energy",
      "power",
      "grid",
      "transport",
      "geopolitics",
      "trade",
      "supply chain",
    ],
    roles: [
      "director",
      "VP",
      "head of",
      "chief",
      "country manager",
      "regional",
    ],
    industries: [
      "infrastructure",
      "energy",
      "construction",
      "logistics",
      "government",
      "policy",
      "consulting",
    ],
  },
  ai_tools_technical_initiative: {
    keywords: [
      "AI",
      "machine learning",
      "ML",
      "LLM",
      "GPT",
      "automation",
      "software",
      "data",
      "algorithm",
      "model",
      "API",
      "platform",
      "tool",
      "product",
      "SaaS",
    ],
    roles: [
      "engineer",
      "developer",
      "CTO",
      "founder",
      "product manager",
      "tech lead",
      "architect",
    ],
    industries: [
      "technology",
      "software",
      "AI",
      "startups",
      "SaaS",
      "data",
    ],
  },
  builder_ambition_intellectual: {
    keywords: [
      "founder",
      "build",
      "start",
      "launch",
      "create",
      "write",
      "book",
      "essay",
      "research",
      "professor",
      "academic",
      "philosophy",
      "think",
      "ideas",
    ],
    roles: [
      "founder",
      "CEO",
      "author",
      "professor",
      "researcher",
      "writer",
      "director",
    ],
    industries: [
      "media",
      "education",
      "publishing",
      "research",
      "nonprofits",
      "arts",
    ],
  },
};

/**
 * Score an angle match based on recipient data.
 * Returns 0-1 score for how well the angle fits.
 */
export function scoreAngleMatch(
  angle: string,
  recipientData: {
    role?: string;
    company?: string;
    facts?: string[];
    bio?: string;
  }
): number {
  const config = ANGLE_MATCHING[angle];
  if (!config) return 0.2; // default low score for unknown angle

  const searchText = [
    recipientData.role || "",
    recipientData.company || "",
    ...(recipientData.facts || []),
    recipientData.bio || "",
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  let matches = 0;

  for (const kw of config.keywords) {
    if (searchText.includes(kw.toLowerCase())) {
      matches++;
    }
  }
  score += Math.min(matches / 3, 1) * 0.5; // keyword matches: up to 0.5

  for (const role of config.roles) {
    if (searchText.includes(role.toLowerCase())) {
      score += 0.25;
      break;
    }
  }

  for (const ind of config.industries) {
    if (searchText.includes(ind.toLowerCase())) {
      score += 0.25;
      break;
    }
  }

  return Math.min(score, 1);
}

/**
 * Pick the best angle for a recipient based on their data.
 * Returns sorted angles by match score.
 */
export function rankAngles(recipientData: {
  role?: string;
  company?: string;
  facts?: string[];
  bio?: string;
}): { angle: string; score: number }[] {
  const angles = Object.keys(ANGLE_MATCHING);
  const scored = angles.map((angle) => ({
    angle,
    score: scoreAngleMatch(angle, recipientData),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored;
}
