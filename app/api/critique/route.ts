import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior TPM interview coach. You evaluate spoken interview answers with brutal honesty.
You assess whether an answer signals executive-level thinking: clear role ownership, decisive tradeoffs, measurable outcomes, and stakeholder impact.
Return ONLY valid JSON — no markdown fences, no preamble.`;

const USER_PROMPT = (question: string, transcript: string) => `
Interview question: ${question}

Candidate's spoken answer (transcribed):
${transcript}

Evaluate this answer and return JSON with exactly this shape:
{
  "strengths": ["string", "string", "string"],
  "issues": ["string", "string", "string"],
  "clarityBreakdown": "The exact sentence or moment where the answer lost clarity or became vague",
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

CART = Context, Action, Role, Tradeoff, Metric, Result. Mark true only if clearly present.
readinessScore is 1–10 for senior TPM readiness. Be strict: 7+ means genuinely ready.
Each strength/issue must be a specific observation about this answer, not generic advice.

For transitionAnalysis:
- smoothnessScore is 1–10. 10 = every sentence flows naturally from the previous; 1 = answer sounds like disconnected bullet points read aloud.
- Evaluate transitions between ALL consecutive sentences (split on . ? !).
- quality values: "smooth" (natural connective flow), "abrupt" (topic jump with no bridge), "filler-bridged" (connected only by "um", "so", "and then", etc.)
- List every transition, not just weak ones. Include at most 8 if the answer is long.
- weakestTransition: copy the ~8 words at end of one sentence + ~8 words at start of the next, verbatim.
`;

export async function POST(req: NextRequest) {
  try {
    const { question, transcript } = await req.json();

    if (!question || !transcript) {
      return NextResponse.json({ error: "Missing question or transcript" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: USER_PROMPT(question, transcript) }],
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
