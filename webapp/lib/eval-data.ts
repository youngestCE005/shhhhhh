import type { SparseInput } from "./types";

/**
 * Test recipients for the evaluation harness.
 * Covers: famous investors, tech founders, academics, media figures,
 * aviation professionals, obscure professionals, ambiguous names.
 */

export interface EvalRecipient {
  input: SparseInput;
  category: string;
  expected: {
    minIdentityConfidence: number;
    maxIdentityConfidence: number;
    minResearchConfidence: number;
    expectedAngle: string;
    shouldFlag: boolean;
  };
}

export const EVAL_RECIPIENTS: EvalRecipient[] = [
  // --- Famous investors ---
  {
    input: { name: "Kevin O'Leary", notes: "Shark Tank" },
    category: "famous_investor",
    expected: {
      minIdentityConfidence: 0.8,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.6,
      expectedAngle: "investing_economic_development",
      shouldFlag: false,
    },
  },
  {
    input: { name: "Marc Andreessen", company: "a16z" },
    category: "famous_investor",
    expected: {
      minIdentityConfidence: 0.8,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.6,
      expectedAngle: "investing_economic_development",
      shouldFlag: false,
    },
  },
  {
    input: { name: "Chamath Palihapitiya", notes: "Social Capital" },
    category: "famous_investor",
    expected: {
      minIdentityConfidence: 0.7,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.5,
      expectedAngle: "investing_economic_development",
      shouldFlag: false,
    },
  },

  // --- Tech founders ---
  {
    input: { name: "Tobi Lütke", company: "Shopify" },
    category: "tech_founder",
    expected: {
      minIdentityConfidence: 0.8,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.6,
      expectedAngle: "ai_tools_technical_initiative",
      shouldFlag: false,
    },
  },
  {
    input: { name: "Patrick Collison", company: "Stripe" },
    category: "tech_founder",
    expected: {
      minIdentityConfidence: 0.8,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.6,
      expectedAngle: "builder_ambition_intellectual",
      shouldFlag: false,
    },
  },

  // --- Aviation / aerospace ---
  {
    input: { name: "Gwynne Shotwell", company: "SpaceX" },
    category: "aerospace",
    expected: {
      minIdentityConfidence: 0.7,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.5,
      expectedAngle: "aviation_engineering",
      shouldFlag: false,
    },
  },
  {
    input: {
      name: "Dennis Muilenburg",
      notes: "former Boeing CEO",
    },
    category: "aerospace",
    expected: {
      minIdentityConfidence: 0.7,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.5,
      expectedAngle: "aviation_engineering",
      shouldFlag: false,
    },
  },

  // --- Academics / intellectuals ---
  {
    input: { name: "Tyler Cowen", notes: "economist, Marginal Revolution" },
    category: "academic",
    expected: {
      minIdentityConfidence: 0.7,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.5,
      expectedAngle: "builder_ambition_intellectual",
      shouldFlag: false,
    },
  },
  {
    input: { name: "Daron Acemoglu", notes: "MIT economist" },
    category: "academic",
    expected: {
      minIdentityConfidence: 0.7,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.5,
      expectedAngle: "investing_economic_development",
      shouldFlag: false,
    },
  },

  // --- China / infrastructure ---
  {
    input: { name: "Keyu Jin", notes: "LSE, China expert" },
    category: "china_infrastructure",
    expected: {
      minIdentityConfidence: 0.5,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.4,
      expectedAngle: "global_infrastructure_china",
      shouldFlag: false,
    },
  },

  // --- Moderately known ---
  {
    input: { name: "Balaji Srinivasan", notes: "The Network State" },
    category: "moderately_known",
    expected: {
      minIdentityConfidence: 0.6,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.4,
      expectedAngle: "ai_tools_technical_initiative",
      shouldFlag: false,
    },
  },

  // --- Obscure / unknown ---
  {
    input: { name: "John Randomname", company: "FakeCorp Industries" },
    category: "unknown",
    expected: {
      minIdentityConfidence: 0.0,
      maxIdentityConfidence: 0.4,
      minResearchConfidence: 0.0,
      expectedAngle: "builder_ambition_intellectual",
      shouldFlag: true,
    },
  },
  {
    input: { name: "Sarah Chen", company: "Acme Solutions" },
    category: "ambiguous",
    expected: {
      minIdentityConfidence: 0.0,
      maxIdentityConfidence: 0.5,
      minResearchConfidence: 0.0,
      expectedAngle: "builder_ambition_intellectual",
      shouldFlag: true,
    },
  },

  // --- Media / public figure ---
  {
    input: { name: "Lex Fridman", notes: "podcast host" },
    category: "media",
    expected: {
      minIdentityConfidence: 0.8,
      maxIdentityConfidence: 1.0,
      minResearchConfidence: 0.6,
      expectedAngle: "ai_tools_technical_initiative",
      shouldFlag: false,
    },
  },
];
