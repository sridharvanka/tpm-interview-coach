import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getLeadershipStyle, getPracticeMode } from "@/lib/practiceModes";
import type { LeadershipStyleId, PracticeModeId } from "@/lib/practiceModes";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a leadership communication coach for technical leaders.
You evaluate spoken answers with brutal honesty and practical coaching.
You assess clarity, executive presence, seniority signal, delivery choices, and whether the speaker used the right communication pattern for the situation.
Return ONLY valid JSON — no markdown fences, no preamble.`;

const USER_PROMPT = (
  modeId: PracticeModeId,
  styleId: LeadershipStyleId,
  question: string,
  transcript: string
) => {
  const mode = getPracticeMode(modeId);
  const style = getLeadershipStyle(styleId);

  return `
Practice mode: ${mode.title}
Mode evaluation frame: ${mode.coachFrame}
Target style: ${style.title}
Style coaching bias: ${style.coachingBias}

Scenario or question:
${question}

Speaker's answer, transcribed:
${transcript}

Evaluate this answer and return JSON with exactly this shape:
{
  "strengths": ["string", "string", "string"],
  "issues": ["string", "string", "string"],
  "clarityBreakdown": "The exact sentence or moment where the answer lost clarity, authority, or executive usefulness",
  "pauseSuggestion": "One specific sentence where a pause would improve delivery",
  "readinessScore": 7,
  "cartAnalysis": {
    "context": true,
    "action": true,
    "role": false,
    "tradeoff": false,
    "metric": false,
    "result": false
  },
  "rubricAnalysis": [
    {
      "label": "${mode.rubric[0]}",
      "present": true,
      "evidence": "Short evidence from the transcript or what was missing"
    }
  ],
  "leadershipSignals": [
    {
      "label": "Decision clarity",
      "score": 6,
      "observation": "Specific observation about whether the answer states the decision, recommendation, or point early"
    },
    {
      "label": "Ownership",
      "score": 6,
      "observation": "Specific observation about whether the speaker sounds like the driver"
    },
    {
      "label": "Executive compression",
      "score": 6,
      "observation": "Specific observation about brevity, structure, and signal-to-noise ratio"
    },
    {
      "label": "Tradeoff judgment",
      "score": 6,
      "observation": "Specific observation about whether the speaker makes judgment visible"
    }
  ],
  "recommendedMoves": [
    {
      "name": "Decision-first opener",
      "whenToUse": "When the answer starts with too much setup",
      "weakVersion": "Quote or paraphrase the weaker version from this answer",
      "strongerVersion": "A stronger spoken version tailored to this scenario"
    },
    {
      "name": "Strategic contrast",
      "whenToUse": "When the speaker needs to clarify what really matters",
      "weakVersion": "Quote or paraphrase the weaker version from this answer",
      "strongerVersion": "A stronger spoken version tailored to this scenario"
    }
  ],
  "deliveryCoaching": {
    "primaryFix": "The single highest-leverage delivery fix for the next attempt",
    "pauseScript": "Rewrite one important sentence with [PAUSE] inserted where the speaker should pause",
    "nextAttemptInstruction": "A concrete instruction the user can follow in the next recording"
  },
  "transitionAnalysis": {
    "smoothnessScore": 7,
    "weakestTransition": "Exact quote of the sentence ending + start of next sentence where the handoff was most abrupt or jarring",
    "observation": "One-sentence overall comment on how well sentences flowed into each other",
    "transitions": [
      {
        "from": "last ~8 words of a sentence",
        "to": "first ~8 words of the next sentence",
        "quality": "smooth"
      }
    ]
  }
}

Rules:
- readinessScore is 1–10 for readiness in this practice mode and target style. Be strict: 7+ means genuinely credible.
- Each strength and issue must be specific to this answer, not generic advice.
- rubricAnalysis must include exactly these labels, in this order: ${mode.rubric.join(", ")}.
- cartAnalysis is required for compatibility. For non-interview modes, map the closest equivalent concepts and mark true only if clearly present.
- leadershipSignals scores are 1–10.
- recommendedMoves must be practical spoken communication moves, not generic advice.
- Stronger versions should sound natural aloud.
- For transitionAnalysis, evaluate transitions between consecutive sentences. Include at most 8 transitions if the answer is long.
`;
};

export async function POST(req: NextRequest) {
  try {
    const { modeId = "interview", styleId = "crisp-executive", question, transcript } = await req.json();

    if (!question || !transcript) {
      return NextResponse.json({ error: "Missing question or transcript" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3072,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: USER_PROMPT(modeId, styleId, question, transcript) }],
    });

    const raw = message.content.find((b) => b.type === "text")?.text ?? "";
    // Strip markdown fences if Claude wraps the JSON anyway
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const critique = JSON.parse(text);

    return NextResponse.json(critique);
  } catch (err: any) {
    console.error("Critique error:", err);
    return NextResponse.json({ error: err.message ?? "Critique failed" }, { status: 500 });
  }
}
