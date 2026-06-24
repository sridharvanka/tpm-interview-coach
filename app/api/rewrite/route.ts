import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { question, transcript, issues } = await req.json();

    if (!question || !transcript) {
      return NextResponse.json({ error: "Missing question or transcript" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are rewriting a TPM interview answer to be tighter, more senior-sounding, and deliverable in ~90 seconds at 150 WPM (~225 words).

Interview question: ${question}

Original answer:
${transcript}

Known issues to fix:
${issues ? issues.join("\n") : "See original answer"}

Write a rewritten version that:
- Opens with the direct answer or the key outcome
- Includes clear role ownership ("I drove...", "I decided...", "I recommended...")
- Names at least one concrete tradeoff made
- Ends with a measurable result or clear impact
- Sounds natural when spoken aloud — use contractions, avoid bullet-list cadence
- Is approximately 200–230 words

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
