import type { LeadershipStyleId, PracticeModeId } from "./practiceModes";

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface SegmentTimestamp {
  id: number;
  start: number;
  end: number;
  text: string;
  avg_logprob?: number;
  no_speech_prob?: number;
}

export interface MumbledWord {
  word: string;
  start: number;
  end: number;
  reason: "rushed" | "low-confidence" | "both";
}

export interface EnunciationMetrics {
  enunciationPct: number;         // 0–100
  mumbledWords: MumbledWord[];
  totalWords: number;
  clearWords: number;
}

export interface TransitionAnalysis {
  smoothnessScore: number;        // 1–10
  weakestTransition: string;      // the sentence boundary that was worst
  observation: string;            // one-sentence overall comment
  transitions: {
    from: string;
    to: string;
    quality: "smooth" | "abrupt" | "filler-bridged";
  }[];
}

export interface TranscribeResult {
  transcript: string;
  words: WordTimestamp[];
  segments: SegmentTimestamp[];
  durationSeconds: number;
}

export interface SpeechMetrics {
  wpm: number;
  wpmStatus: "slow" | "ok" | "fast";
  fillerWords: { word: string; count: number }[];
  fillerTotal: number;
  longestRunSeconds: number;
  pauseCount: number;
  medianPauseSeconds: number;
  pauses: { start: number; end: number; duration: number }[];
}

export interface RubricItem {
  label: string;
  present: boolean;
  evidence: string;
}

export interface LeadershipSignal {
  label: string;
  score: number; // 1–10
  observation: string;
}

export interface RecommendedMove {
  name: string;
  whenToUse: string;
  weakVersion: string;
  strongerVersion: string;
}

export interface CritiqueResult {
  strengths: string[];
  issues: string[];
  clarityBreakdown: string;
  pauseSuggestion: string;
  readinessScore: number;
  cartAnalysis?: {
    context: boolean;
    action: boolean;
    role: boolean;
    tradeoff: boolean;
    metric: boolean;
    result: boolean;
  };
  rubricAnalysis: RubricItem[];
  leadershipSignals: LeadershipSignal[];
  recommendedMoves: RecommendedMove[];
  deliveryCoaching: {
    primaryFix: string;
    pauseScript: string;
    nextAttemptInstruction: string;
  };
  transitionAnalysis: TransitionAnalysis;
}

export interface AppState {
  phase: "input" | "recording" | "processing" | "results";
  modeId: PracticeModeId;
  styleId: LeadershipStyleId;
  question: string;
  transcript: string;
  metrics: SpeechMetrics | null;
  enunciation: EnunciationMetrics | null;
  critique: CritiqueResult | null;
  rewrite: string | null;
  rewriting: boolean;
  error: string | null;
}
