import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { computeMetrics, computeEnunciation } from "@/lib/metrics";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;

    if (!audio) {
      return NextResponse.json({ error: "No audio file" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"],
    });

    const words = (transcription as any).words ?? [];
    const segments = (transcription as any).segments ?? [];
    const durationSeconds = (transcription as any).duration ?? 0;

    const metrics = computeMetrics(words, durationSeconds);
    const enunciation = computeEnunciation(words, segments);

    return NextResponse.json({
      transcript: transcription.text,
      words,
      segments,
      durationSeconds,
      metrics,
      enunciation,
    });
  } catch (err: any) {
    console.error("Transcribe error:", err);
    return NextResponse.json({ error: err.message ?? "Transcription failed" }, { status: 500 });
  }
}
