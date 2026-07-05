import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getLeadershipStyle, getPracticeMode } from "@/lib/practiceModes";
import type { LeadershipStyleId, PracticeModeId } from "@/lib/practiceModes";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const {
      modeId = "interview",
      styleId = "crisp-executive",
      question,
      transcript,
      issues,
      recommendedMoves,
    } = await req.json();

    if (!question || !transcript) {
      return NextResponse.json({ error: "Missing question or transcript" }, { status: 400 });
    }

    const mode = getPracticeMode(modeId as PracticeModeId);
    const style = getLeadershipStyle(styleId as LeadershipStyleId);
    const moveText = Array.isArray(recommendedMoves)
      ? recommendedMoves.map((move: any) => `- ${move.name}: ${move.strongerVersion}`).join("\n")
      : "Use the best communication moves for this scenario.";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are rewriting a spoken answer for a technical leader.

Practice mode: ${mode.title}
Target style: ${style.title}
Mode ideal shape:
${mode.idealShape.map((item) => `- ${item}`).join("\n")}

Scenario or question:
${question}

Original answer:
${transcript}

Known issues to fix:
${issues ? issues.join("\n") : "See original answer"}

Recommended communication moves:
${moveText}

Write a rewritten version that:
- Opens with the direct answer, recommendation, or key outcome
- Uses the ${style.title} style
- Fits the ${mode.title} scenario
- Makes ownership, judgment, risk, and next step visible
- Sounds natural when spoken aloud — use contractions, avoid bullet-list cadence
- Is approximately 170–230 words

Return only the rewritten answer text, no preamble.`,
        },
      ],
    });

    const rewrite = message.content.find((b) => b.type === "text")?.text ?? "";
    return NextResponse.json({ rewrite });
  } catch (err: any) {
    console.error("Rewrite error:", err);
    return NextResponse.json({ error: err.message ?? "Rewrite failed" }, { status: 500 });
  }
}
