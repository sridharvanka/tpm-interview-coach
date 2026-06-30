"use client";

import type { SpeechMetrics, CritiqueResult, EnunciationMetrics } from "@/lib/types";

interface Props {
  metrics: SpeechMetrics;
  enunciation: EnunciationMetrics | null;
  critique: CritiqueResult;
  transcript: string;
  onRewrite: () => void;
  rewriting: boolean;
  rewrite: string | null;
  onReset: () => void;
}

type Status = "ok" | "warn" | "bad";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mono-label text-[var(--accent-ink)] mb-3">{children}</h2>;
}

function Pill({ label, value, status, sub }: { label: string; value: string; status?: Status; sub?: string }) {
  const tone = status ? `status-${status}` : "status-neutral";
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <p className="mono-label opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

function Badge({ children, tone = "neutral", strike = false }: { children: React.ReactNode; tone?: Status | "neutral"; strike?: boolean }) {
  return <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold status-${tone} ${strike ? "line-through opacity-60" : ""}`}>{children}</span>;
}

export default function Scorecard({ metrics, enunciation, critique, transcript, onRewrite, rewriting, rewrite, onReset }: Props) {
  const scoreTone = critique.readinessScore >= 8 ? "text-[var(--accent-ink)]" : critique.readinessScore >= 6 ? "text-[#926518]" : "text-[#a43d2f]";
  const transitions = critique.transitionAnalysis;

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="surface-card p-6 md:p-8 grid md:grid-cols-[220px_1fr] gap-8 items-center">
        <div>
          <p className="mono-label text-[var(--ink-muted)] mb-2">Readiness score</p>
          <p className={`text-7xl font-black tracking-[-0.05em] ${scoreTone}`}>{critique.readinessScore}<span className="text-2xl text-[var(--ink-faint)]">/10</span></p>
        </div>
        <div>
          <p className="text-2xl md:text-3xl font-extrabold tracking-[-0.025em]">Your coaching readout</p>
          <p className="text-[var(--ink-muted)] mt-2 leading-relaxed">Start with the biggest issue, then use the delivery details to tighten the next attempt.</p>
        </div>
      </section>

      <section className="surface-card p-5 md:p-7">
        <SectionTitle>Delivery</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Pill label="WPM" value={`${metrics.wpm}`} status={metrics.wpmStatus === "ok" ? "ok" : "warn"} sub={metrics.wpmStatus === "ok" ? "On target" : metrics.wpmStatus === "fast" ? "Too fast" : "Too slow"} />
          <Pill label="Filler words" value={`${metrics.fillerTotal}`} status={metrics.fillerTotal === 0 ? "ok" : metrics.fillerTotal <= 3 ? "warn" : "bad"} />
          <Pill label="Longest run" value={`${metrics.longestRunSeconds.toFixed(1)}s`} status={metrics.longestRunSeconds < 45 ? "ok" : "warn"} />
          <Pill label="Pauses" value={`${metrics.pauseCount}`} status={metrics.pauseCount >= 2 ? "ok" : "warn"} />
        </div>
        {(metrics.fillerWords.length > 0 || metrics.pauseCount > 0) && (
          <div className="mt-4 text-sm text-[var(--ink-muted)] space-y-1">
            {metrics.fillerWords.length > 0 && <p>Fillers: {metrics.fillerWords.map((item) => `“${item.word}” ×${item.count}`).join(", ")}</p>}
            {metrics.pauseCount > 0 && <p>Median pause: {metrics.medianPauseSeconds.toFixed(1)}s</p>}
          </div>
        )}
      </section>

      {enunciation && (
        <section className="surface-card p-5 md:p-7">
          <SectionTitle>Enunciation</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Pill label="Clearly spoken" value={`${enunciation.enunciationPct}%`} status={enunciation.enunciationPct >= 90 ? "ok" : enunciation.enunciationPct >= 75 ? "warn" : "bad"} sub={`${enunciation.clearWords} of ${enunciation.totalWords} words`} />
            <Pill label="Mumbled / rushed" value={`${enunciation.mumbledWords.length}`} status={enunciation.mumbledWords.length === 0 ? "ok" : enunciation.mumbledWords.length <= 4 ? "warn" : "bad"} />
          </div>
          {enunciation.mumbledWords.length > 0 ? (
            <div className="bg-[var(--inset)] border border-[var(--line-soft)] rounded-xl p-4">
              <p className="mono-label text-[var(--ink-muted)] mb-3">Words to watch</p>
              <div className="flex flex-wrap gap-2">
                {enunciation.mumbledWords.map((word, index) => <Badge key={`${word.word}-${index}`} tone={word.reason === "both" ? "bad" : "warn"}>{word.word} · {word.start.toFixed(1)}s</Badge>)}
              </div>
            </div>
          ) : <p className="text-sm text-[var(--accent-ink)] font-semibold">All words were clearly spoken — no mumbling detected.</p>}
        </section>
      )}

      {transitions && (
        <section className="surface-card p-5 md:p-7">
          <SectionTitle>Sentence transitions</SectionTitle>
          <div className="grid md:grid-cols-[180px_1fr] gap-4">
            <Pill label="Flow score" value={`${transitions.smoothnessScore}/10`} status={transitions.smoothnessScore >= 7 ? "ok" : transitions.smoothnessScore >= 5 ? "warn" : "bad"} />
            <div className="bg-[var(--inset)] border border-[var(--line-soft)] rounded-xl p-4 space-y-4">
              <div><p className="mono-label text-[var(--ink-faint)] mb-1">Overall</p><p className="text-sm leading-relaxed">{transitions.observation}</p></div>
              {transitions.weakestTransition && <div><p className="mono-label text-[var(--ink-faint)] mb-1">Weakest handoff</p><p className="text-sm text-[#7e2d23] italic">“{transitions.weakestTransition}”</p></div>}
              {transitions.transitions?.length > 0 && (
                <div className="space-y-2">
                  <p className="mono-label text-[var(--ink-faint)]">All transitions</p>
                  {transitions.transitions.map((transition, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 text-xs text-[var(--ink-muted)]">
                      <Badge tone={transition.quality === "smooth" ? "ok" : transition.quality === "abrupt" ? "bad" : "warn"}>{transition.quality === "filler-bridged" ? "Filler bridge" : transition.quality}</Badge>
                      <span className="leading-relaxed">…{transition.from} <span className="text-[var(--ink-faint)]">→</span> {transition.to}…</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="surface-card p-5 md:p-7">
        <SectionTitle>CART structure</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {Object.entries(critique.cartAnalysis).map(([key, present]) => <Badge key={key} tone={present ? "ok" : "neutral"} strike={!present}>{key.charAt(0).toUpperCase() + key.slice(1)}</Badge>)}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="surface-card p-5 md:p-7">
          <SectionTitle>What worked</SectionTitle>
          <ul className="space-y-3">
            {critique.strengths.map((strength, index) => <li key={index} className="flex gap-3 text-sm leading-relaxed"><span className="text-[var(--accent)] font-bold">✓</span>{strength}</li>)}
          </ul>
        </section>
        <section className="surface-card p-5 md:p-7">
          <SectionTitle>Fix next</SectionTitle>
          <ul className="space-y-3">
            {critique.issues.map((issue, index) => <li key={index} className="flex gap-3 text-sm leading-relaxed"><span className="text-[#a43d2f] font-bold">×</span>{issue}</li>)}
          </ul>
        </section>
      </div>

      <section className="surface-card p-5 md:p-7 space-y-5">
        <div><SectionTitle>Where clarity broke down</SectionTitle><p className="text-base text-[#6f4d12] italic leading-relaxed">“{critique.clarityBreakdown}”</p></div>
        <div className="border-t border-[var(--line-soft)] pt-5"><SectionTitle>Where to pause</SectionTitle><p className="text-base text-[var(--accent-ink)] italic leading-relaxed">“{critique.pauseSuggestion}”</p></div>
      </section>

      <details className="surface-card p-5 md:p-7 group">
        <summary className="mono-label text-[var(--accent-ink)] cursor-pointer">Your transcript</summary>
        <p className="text-sm text-[var(--ink-muted)] leading-relaxed mt-4 bg-[var(--inset)] rounded-xl p-4 border border-[var(--line-soft)]">{transcript}</p>
      </details>

      <section className="surface-card p-5 md:p-7">
        <SectionTitle>Make it tighter</SectionTitle>
        <p className="text-sm text-[var(--ink-muted)] mb-4">Turn this feedback into a crisp answer designed for roughly 90 seconds.</p>
        <button type="button" onClick={onRewrite} disabled={rewriting} className="px-6 py-3 bg-[var(--ink)] text-[var(--paper)] hover:opacity-85 disabled:opacity-50 rounded-full text-sm font-bold transition-opacity">
          {rewriting ? "Rewriting…" : "Rewrite in 90 seconds"}
        </button>
        {rewrite && <div className="mt-5 bg-[#e7f0ec] border border-[rgba(14,138,110,.24)] rounded-xl p-5"><p className="mono-label text-[var(--accent-ink)] mb-2">Rewritten version · ~150 WPM</p><p className="text-sm leading-relaxed">{rewrite}</p></div>}
      </section>

      <div className="pt-2 pb-10">
        <button type="button" onClick={onReset} className="text-sm font-semibold text-[var(--accent-ink)] border-b-2 border-[var(--accent)] pb-0.5">← Practice another question</button>
      </div>
    </div>
  );
}
