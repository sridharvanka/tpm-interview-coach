"use client";

import { useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import Scorecard from "@/components/Scorecard";
import type { AppState, CritiqueResult, EnunciationMetrics } from "@/lib/types";

const SAMPLE_QUESTIONS = [
  "Tell me about a time you had to make a significant technical tradeoff under time pressure.",
  "Describe a project where you had to influence without authority.",
  "Walk me through how you handle competing priorities across multiple teams.",
  "Tell me about a time a project you led failed. What happened and what did you learn?",
];

export default function Home() {
  const [state, setState] = useState<AppState>({
    phase: "input",
    question: "",
    transcript: "",
    metrics: null,
    enunciation: null,
    critique: null,
    rewrite: null,
    rewriting: false,
    error: null,
  });

  function reset() {
    setState({
      phase: "input",
      question: "",
      transcript: "",
      metrics: null,
      enunciation: null,
      critique: null,
      rewrite: null,
      rewriting: false,
      error: null,
    });
  }

  async function handleRecordingDone(blob: Blob, durationSeconds: number) {
    setState((s) => ({ ...s, phase: "processing", error: null }));

    try {
      // 1. Transcribe
      const form = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      form.append("audio", blob, `recording.${ext}`);

      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!transcribeRes.ok) throw new Error((await transcribeRes.json()).error);
      const { transcript, metrics, enunciation } = await transcribeRes.json();

      // 2. Critique (parallel-safe but runs after transcribe)
      const critiqueRes = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: state.question, transcript }),
      });
      if (!critiqueRes.ok) throw new Error((await critiqueRes.json()).error);
      const critique: CritiqueResult = await critiqueRes.json();

      setState((s) => ({
        ...s,
        phase: "results",
        transcript,
        metrics,
        enunciation,
        critique,
      }));
    } catch (err: any) {
      setState((s) => ({ ...s, phase: "input", error: err.message ?? "Something went wrong" }));
    }
  }

  async function handleRewrite() {
    if (!state.critique) return;
    setState((s) => ({ ...s, rewriting: true }));

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: state.question,
          transcript: state.transcript,
          issues: state.critique.issues,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { rewrite } = await res.json();
      setState((s) => ({ ...s, rewrite, rewriting: false }));
    } catch (err: any) {
      setState((s) => ({ ...s, rewriting: false, error: err.message }));
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-2xl font-bold text-white">TPM Interview Coach</h1>
        <p className="text-sm text-gray-500 mt-1">Tell me when my answer stops sounding senior.</p>
      </header>

      {state.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950 border border-red-800 text-red-300 text-sm">
          {state.error}
        </div>
      )}

      {state.phase === "input" && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
              Interview Question
            </label>
            <textarea
              value={state.question}
              onChange={(e) => setState((s) => ({ ...s, question: e.target.value }))}
              placeholder="Type or paste the interview question here…"
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none text-sm"
            />
          </div>

          <div>
            <p className="text-xs text-gray-600 mb-2">Or pick a sample question:</p>
            <div className="space-y-2">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setState((s) => ({ ...s, question: q }))}
                  className="w-full text-left text-xs text-gray-400 hover:text-gray-200 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg px-3 py-2 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <AudioRecorder
            onResult={handleRecordingDone}
            disabled={!state.question.trim()}
          />
          {!state.question.trim() && (
            <p className="text-xs text-center text-gray-600">Enter a question before recording</p>
          )}
        </div>
      )}

      {state.phase === "processing" && (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Transcribing and analyzing…</p>
          <p className="text-xs text-gray-600">Usually takes 5–15 seconds</p>
        </div>
      )}

      {state.phase === "results" && state.metrics && state.critique && (
        <Scorecard
          metrics={state.metrics}
          enunciation={state.enunciation}
          critique={state.critique}
          transcript={state.transcript}
          onRewrite={handleRewrite}
          rewriting={state.rewriting}
          rewrite={state.rewrite}
          onReset={reset}
        />
      )}
    </main>
  );
}
