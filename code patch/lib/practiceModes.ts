export type PracticeModeId = "interview" | "executive-update" | "pushback";
export type LeadershipStyleId = "crisp-executive" | "calm-operator" | "strategic-framer";

export interface PracticeMode {
  id: PracticeModeId;
  title: string;
  shortTitle: string;
  description: string;
  coachFrame: string;
  sampleQuestions: string[];
  rubric: string[];
  idealShape: string[];
}

export interface LeadershipStyle {
  id: LeadershipStyleId;
  title: string;
  description: string;
  coachingBias: string;
}

export const PRACTICE_MODES: PracticeMode[] = [
  {
    id: "interview",
    title: "Interview Answer",
    shortTitle: "Interview",
    description: "Behavioral answers that need ownership, judgment, tradeoffs, metrics, and seniority signal.",
    coachFrame: "Evaluate this as a senior TPM interview answer. Reward clear ownership, decisive tradeoffs, measurable outcomes, stakeholder influence, and a crisp answer arc.",
    sampleQuestions: [
      "Tell me about a time you had to make a significant technical tradeoff under time pressure.",
      "Describe a project where you had to influence without authority.",
      "Walk me through how you handle competing priorities across multiple teams.",
      "Tell me about a time a project you led failed. What happened and what did you learn?",
    ],
    rubric: ["Context", "Action", "Role", "Tradeoff", "Metric", "Result"],
    idealShape: [
      "Open with the direct outcome or lesson.",
      "Give only enough context to understand stakes.",
      "Name your role and the hard tradeoff.",
      "Close with measurable impact and what it shows about your judgment.",
    ],
  },
  {
    id: "executive-update",
    title: "Executive Update",
    shortTitle: "Exec Update",
    description: "A concise VP/SVP-style update that states what changed, why it matters, and what decision or support is needed.",
    coachFrame: "Evaluate this as a high-stakes executive update. Reward recommendation-first framing, crisp risk articulation, business/customer impact, named owners, and a clear next checkpoint.",
    sampleQuestions: [
      "A launch is delayed because of a late security issue. Give a 90-second update to a VP.",
      "A dependency team missed a critical date. Update an executive without sounding defensive.",
      "A key adoption metric is below target two weeks after launch. Give the leadership readout.",
      "A privacy review found a blocker three days before launch. Explain what changed and what you recommend.",
    ],
    rubric: ["Decision or ask", "What changed", "Why it matters", "Risk", "Owner", "Next checkpoint"],
    idealShape: [
      "Start with the recommendation, decision, or ask.",
      "Say what changed in one sentence.",
      "Connect it to user, business, or execution risk.",
      "End with owner, next checkpoint, and what leadership should expect.",
    ],
  },
  {
    id: "pushback",
    title: "Pushback",
    shortTitle: "Pushback",
    description: "Challenge an unrealistic plan while preserving trust, showing judgment, and offering a better path.",
    coachFrame: "Evaluate this as senior-leader pushback. Reward clear disagreement without defensiveness, respect for the goal, risk-based reasoning, and a practical alternative.",
    sampleQuestions: [
      "A VP wants to skip a security review to hit a launch date. Push back clearly.",
      "Product asks engineering to absorb late scope without changing the date. Respond as the TPM.",
      "A partner team wants your team to reprioritize immediately. Push back while preserving the relationship.",
      "Leadership wants a commitment before engineering has validated the design. Explain your concern and path forward.",
    ],
    rubric: ["Shared goal", "Clear disagreement", "Reason", "Risk", "Alternative", "Relationship"],
    idealShape: [
      "Acknowledge the goal first.",
      "State the disagreement plainly, not passively.",
      "Explain the risk and offer a workable alternative.",
      "Close with the decision path or next validation step.",
    ],
  },
];

export const LEADERSHIP_STYLES: LeadershipStyle[] = [
  {
    id: "crisp-executive",
    title: "Crisp Executive",
    description: "Short, decisive, recommendation-first, no wandering setup.",
    coachingBias: "Prefer concise, decision-first language. Penalize burying the lede, long setup, and vague hedging.",
  },
  {
    id: "calm-operator",
    title: "Calm Operator",
    description: "Composed under pressure, separates facts from unknowns, gives a clear next checkpoint.",
    coachingBias: "Prefer calm, factual, incident-ready structure. Penalize speculation, anxious overexplaining, and unclear ownership.",
  },
  {
    id: "strategic-framer",
    title: "Strategic Framer",
    description: "Connects details to the larger mechanism, tradeoff, customer impact, or platform bet.",
    coachingBias: "Prefer thesis, mechanism, and tradeoff language. Penalize status-only narration that does not ladder up to strategic judgment.",
  },
];

export function getPracticeMode(id: PracticeModeId): PracticeMode {
  return PRACTICE_MODES.find((mode) => mode.id === id) ?? PRACTICE_MODES[0];
}

export function getLeadershipStyle(id: LeadershipStyleId): LeadershipStyle {
  return LEADERSHIP_STYLES.find((style) => style.id === id) ?? LEADERSHIP_STYLES[0];
}
