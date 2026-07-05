"use client";

import { useMemo, useState } from "react";
import AudioRecorder from "@/components/AudioRecorder";
import Scorecard from "@/components/Scorecard";
import type { AppState, CritiqueResult } from "@/lib/types";
import { LEADERSHIP_STYLES, PRACTICE_MODES, getLeadershipStyle, getPracticeMode } from "@/lib/practiceModes";
import type { LeadershipStyleId, PracticeModeId } from "@/lib/practiceModes";

const initialState: AppState = {
  phase: "input",
  modeId: "interview",
  styleId: "crisp-executive",
  question: "",
  transcript: "",
  metrics: null,
  enunciation: null,
  critique: null,
  rewrite: null,
  rewriting: false,
  error: null,
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);
  const selectedMode = useMemo(() => getPracticeMode(state.modeId), [state.modeId]);
  const selectedStyle = useMemo(() => getLeadershipStyle(state.styleId), [state.styleId]);

  function selectMode(modeId: PracticeModeId) {
    setState((current) => ({
      ...current,
      modeId,
      question: "",
      rewrite: null,
      critique: null,
      error: null,
    }));
  }

  function selectStyle(styleId: LeadershipStyleId) {
    setState((current) => ({ ...current, styleId, rewrite: null, error: null }));
  }

  async function handleRecordingDone(blob: Blob, durationSeconds: number) {
    setState((current) => ({ ...current, phase: "processing", error: null }));
    try {
      const form = new FormData();
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      form.append("audio", blob, `recording.${ext}`);
      form.append("durationSeconds", String(durationSeconds));

      const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!transcribeRes.ok) throw new Error((await transcribeRes.json()).error);
      const { transcript, metrics, enunciation } = await transcribeRes.json();

      const critiqueRes = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modeId: state.modeId,
          styleId: state.styleId,
          question: state.question,
          transcript,
        }),
      });
      if (!critiqueRes.ok) throw new Error((await critiqueRes.json()).error);
      const critique: CritiqueResult = await critiqueRes.json();

      setState((current) => ({ ...current, phase: "results", transcript, metrics, enunciation, critique }));
    } catch (error) {
      setState((current) => ({
        ...current,
        phase: "input",
        error: error instanceof Error ? error.message : "Something went wrong",
      }));
    }
  }

  async function handleRewrite() {
    if (!state.critique) return;
    setState((current) => ({ ...current, rewriting: true }));
    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modeId: state.modeId,
          styleId: state.styleId,
          question: state.question,
          transcript: state.transcript,
          issues: state.critique.issues,
          recommendedMoves: state.critique.recommendedMoves,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      const { rewrite } = await response.json();
      setState((current) => ({ ...current, rewrite, rewriting: false }));
    } catch (error) {
      setState((current) => ({ ...current, rewriting: false, error: error instanceof Error ? error.message : "Rewrite failed" }));
    }
  }

  const currentStep = state.phase === "input" ? 0 : state.phase === "processing" ? 1 : 2;

  return (
    <>
      <div className="grid-background" />
      <header className="relative z-10 border-b border-[var(--line-soft)] bg-[rgba(244,241,232,0.78)] backdrop-blur-md">
        <nav className="max-w-5xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4">
          <a href="https://sridharvanka.me" className="text-sm font-extrabold tracking-[0.08em]">SRIDHAR VANKA</a>
          <span className="mono-label text-[var(--ink-muted)]">Leadership practice lab</span>
        </nav>
      </header>

      <main className="relative z-10 min-h-screen px-5 py-10 md:px-8 md:py-16 max-w-5xl mx-auto">
        <header className="mb-10 md:mb-14 max-w-3xl">
          <p className="mono-label text-[var(--accent-ink)] mb-4">PresenceLab · first version</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-[-0.035em] leading-[0.98]">Practice the moments<br />where leadership shows.</h1>
          <p className="text-base md:text-lg text-[var(--ink-muted)] mt-5 leading-relaxed max-w-2xl">Record a high-stakes answer and get a direct read on delivery, structure, seniority signal, and the communication moves that would make it sharper.</p>
        </header>

        <div className="flex items-center gap-3 mb-5" aria-label={`Step ${currentStep + 1} of 3`}>
          {["Scenario", "Analyze", "Coach"].map((label, index) => {
            const active = index <= currentStep;
            return (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full grid place-items-center text-xs font-bold border ${active ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "bg-[var(--surface)] border-[var(--line)] text-[var(--ink-faint)]"}`}>{index + 1}</span>
                <span className={`hidden sm:inline text-xs font-semibold ${active ? "text-[var(--ink)]" : "text-[var(--ink-faint)]"}`}>{label}</span>
                {index < 2 && <span className="w-5 md:w-10 h-px bg-[var(--line)] mx-1" />}
              </div>
            );
          })}
        </div>

        {state.error && <div role="alert" className="mb-6 p-4 rounded-xl border status-bad text-sm">{state.error}</div>}

        {state.phase === "input" && (
          <div className="surface-card p-5 md:p-8 space-y-8">
            <section>
              <p className="mono-label block text-[var(--accent-ink)] mb-3">Practice mode</p>
              <div className="grid md:grid-cols-3 gap-3">
                {PRACTICE_MODES.map((mode) => {
                  const active = state.modeId === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => selectMode(mode.id)}
                      aria-pressed={active}
                      className={`text-left rounded-xl border p-4 transition-all ${active ? "bg-[#e7f0ec] border-[rgba(14,138,110,0.3)] text-[var(--accent-ink)]" : "bg-[var(--inset)] border-[var(--line-soft)] text-[var(--ink-muted)] hover:border-[var(--line)] hover:text-[var(--ink)]"}`}
                    >
                      <p className="font-extrabold text-sm mb-1">{mode.title}</p>
                      <p className="text-xs leading-relaxed">{mode.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mono-label block text-[var(--accent-ink)] mb-3">Target style</p>
              <div className="grid md:grid-cols-3 gap-3">
                {LEADERSHIP_STYLES.map((style) => {
                  const active = state.styleId === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => selectStyle(style.id)}
                      aria-pressed={active}
                      className={`text-left rounded-xl border p-4 transition-all ${active ? "bg-[#f7efd9] border-[rgba(146,101,24,.24)] text-[#6f4d12]" : "bg-[var(--inset)] border-[var(--line-soft)] text-[var(--ink-muted)] hover:border-[var(--line)] hover:text-[var(--ink)]"}`}
                    >
                      <p className="font-extrabold text-sm mb-1">{style.title}</p>
                      <p className="text-xs leading-relaxed">{style.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid md:grid-cols-[1fr_260px] gap-5">
              <div>
                <label htmlFor="practice-scenario" className="mono-label block text-[var(--accent-ink)] mb-3">Scenario or question</label>
                <textarea
                  id="practice-scenario"
                  value={state.question}
                  onChange={(event) => setState((current) => ({ ...current, question: event.target.value, error: null }))}
                  placeholder="Type or paste the scenario here…"
                  rows={4}
                  className="w-full bg-[var(--inset)] border border-[var(--line)] rounded-xl p-4 text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] resize-none text-base leading-relaxed"
                />
              </div>
              <aside className="bg-[var(--inset)] border border-[var(--line-soft)] rounded-xl p-4">
                <p className="mono-label text-[var(--ink-faint)] mb-2">Ideal shape</p>
                <ul className="space-y-2">
                  {selectedMode.idealShape.map((item) => (
                    <li key={item} className="text-xs leading-relaxed text-[var(--ink-muted)]">• {item}</li>
                  ))}
                </ul>
              </aside>
            </section>

            <section>
              <p className="text-sm font-semibold text-[var(--ink-muted)] mb-3">Need a prompt? Start with one of these.</p>
              <div className="grid md:grid-cols-2 gap-2.5">
                {selectedMode.sampleQuestions.map((question) => (
                  <button
                    type="button"
                    key={question}
                    onClick={() => setState((current) => ({ ...current, question, error: null }))}
                    aria-pressed={state.question === question}
                    className={`w-full text-left text-sm leading-snug border rounded-xl px-4 py-3 transition-all ${state.question === question ? "bg-[#e7f0ec] text-[var(--accent-ink)] border-[rgba(14,138,110,0.3)]" : "bg-[var(--inset)] text-[var(--ink-muted)] border-[var(--line-soft)] hover:border-[var(--line)] hover:text-[var(--ink)]"}`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </section>

            <AudioRecorder
              onResult={handleRecordingDone}
              disabled={!state.question.trim()}
              onError={(message) => setState((current) => ({ ...current, error: message }))}
            />
            {!state.question.trim() && <p className="text-xs text-center text-[var(--ink-faint)]">Choose a scenario to enable recording.</p>}
          </div>
        )}

        {state.phase === "processing" && (
          <div className="surface-card flex flex-col items-center gap-4 py-20 px-6 text-center" aria-live="polite">
            <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-[var(--ink)]">Listening for the leadership signal…</p>
            <p className="text-sm text-[var(--ink-muted)]">Transcribing, measuring delivery, and coaching your {selectedMode.shortTitle.toLowerCase()} in a {selectedStyle.title.toLowerCase()} style.</p>
          </div>
        )}

        {state.phase === "results" && state.metrics && state.critique && (
          <Scorecard
            mode={selectedMode}
            style={selectedStyle}
            metrics={state.metrics}
            enunciation={state.enunciation}
            critique={state.critique}
            transcript={state.transcript}
            onRewrite={handleRewrite}
            rewriting={state.rewriting}
            rewrite={state.rewrite}
            onReset={() => setState(initialState)}
          />
        )}
      </main>
    </>
  );
}
