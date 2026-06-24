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

function Pill({ label, value, status, sub }: { label: string; value: string; status?: "ok" | "warn" | "bad"; sub?: string }) {
  const color =
    status === "ok" ? "bg-green-900/50 border-green-700 text-green-300" :
    status === "warn" ? "bg-yellow-900/50 border-yellow-700 text-yellow-300" :
    status === "bad" ? "bg-red-900/50 border-red-700 text-red-300" :
    "bg-gray-800 border-gray-700 text-gray-300";

  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-xs uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

function CartBadge({ label, present }: { label: string; present: boolean }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${
      present ? "bg-green-800 text-green-200" : "bg-gray-800 text-gray-500 line-through"
    }`}>
      {label}
    </span>
  );
}

function TransitionBadge({ quality }: { quality: "smooth" | "abrupt" | "filler-bridged" }) {
  const styles = {
    smooth: "bg-green-900/40 text-green-300 border-green-800",
    abrupt: "bg-red-900/40 text-red-300 border-red-800",
    "filler-bridged": "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  };
  const labels = { smooth: "Smooth", abrupt: "Abrupt", "filler-bridged": "Filler bridge" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${styles[quality]}`}>
      {labels[quality]}
    </span>
  );
}

export default function Scorecard({ metrics, enunciation, critique, transcript, onRewrite, rewriting, rewrite, onReset }: Props) {
  const scoreColor =
    critique.readinessScore >= 8 ? "text-green-400" :
    critique.readinessScore >= 6 ? "text-yellow-400" : "text-red-400";

  const ta = critique.transitionAnalysis;

  return (
    <div className="space-y-8">
      {/* Header score */}
      <div className="text-center">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Readiness Score</p>
        <p className={`text-7xl font-black ${scoreColor}`}>{critique.readinessScore}<span className="text-3xl text-gray-600">/10</span></p>
      </div>

      {/* Delivery metrics */}
      <section>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Delivery</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Pill
            label="WPM"
            value={`${metrics.wpm}`}
            status={metrics.wpmStatus === "ok" ? "ok" : "warn"}
            sub={metrics.wpmStatus === "ok" ? "on target" : metrics.wpmStatus === "fast" ? "too fast" : "too slow"}
          />
          <Pill
            label="Filler Words"
            value={`${metrics.fillerTotal}`}
            status={metrics.fillerTotal === 0 ? "ok" : metrics.fillerTotal <= 3 ? "warn" : "bad"}
          />
          <Pill
            label="Longest Run"
            value={`${metrics.longestRunSeconds.toFixed(1)}s`}
            status={metrics.longestRunSeconds < 45 ? "ok" : "warn"}
          />
          <Pill
            label="Pauses"
            value={`${metrics.pauseCount}`}
            status={metrics.pauseCount >= 2 ? "ok" : "warn"}
          />
        </div>

        {metrics.fillerWords.length > 0 && (
          <p className="mt-3 text-sm text-gray-400">
            Fillers: {metrics.fillerWords.map((f) => `"${f.word}" ×${f.count}`).join(", ")}
          </p>
        )}
        {metrics.pauseCount > 0 && (
          <p className="text-sm text-gray-400">
            Median pause: {metrics.medianPauseSeconds.toFixed(1)}s
          </p>
        )}
      </section>

      {/* Enunciation */}
      {enunciation && (
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Enunciation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Pill
              label="Clearly Spoken"
              value={`${enunciation.enunciationPct}%`}
              status={enunciation.enunciationPct >= 90 ? "ok" : enunciation.enunciationPct >= 75 ? "warn" : "bad"}
              sub={`${enunciation.clearWords} of ${enunciation.totalWords} words`}
            />
            <Pill
              label="Mumbled / Rushed"
              value={`${enunciation.mumbledWords.length}`}
              status={enunciation.mumbledWords.length === 0 ? "ok" : enunciation.mumbledWords.length <= 4 ? "warn" : "bad"}
            />
          </div>

          {enunciation.mumbledWords.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Words to watch</p>
              <div className="flex flex-wrap gap-2">
                {enunciation.mumbledWords.map((w, i) => (
                  <span key={i} className="group relative">
                    <span className={`px-2 py-1 rounded text-xs font-mono font-semibold border ${
                      w.reason === "both"
                        ? "bg-red-900/50 border-red-700 text-red-200"
                        : w.reason === "rushed"
                        ? "bg-orange-900/50 border-orange-700 text-orange-200"
                        : "bg-yellow-900/50 border-yellow-700 text-yellow-200"
                    }`}>
                      {w.word}
                    </span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {w.reason === "rushed" ? "spoken too fast" : w.reason === "low-confidence" ? "acoustically unclear" : "fast + unclear"}
                      {" · "}{w.start.toFixed(1)}s
                    </span>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-3">
                <span className="inline-block w-2 h-2 rounded bg-orange-700 mr-1" />rushed &nbsp;
                <span className="inline-block w-2 h-2 rounded bg-yellow-700 mr-1" />acoustically unclear &nbsp;
                <span className="inline-block w-2 h-2 rounded bg-red-700 mr-1" />both
              </p>
            </div>
          )}

          {enunciation.mumbledWords.length === 0 && (
            <p className="text-sm text-green-400">All words were clearly spoken — no mumbling detected.</p>
          )}
        </section>
      )}

      {/* Transition smoothness */}
      {ta && (
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Sentence Transitions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <Pill
              label="Flow Score"
              value={`${ta.smoothnessScore}/10`}
              status={ta.smoothnessScore >= 7 ? "ok" : ta.smoothnessScore >= 5 ? "warn" : "bad"}
            />
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Overall</p>
              <p className="text-sm text-gray-300">{ta.observation}</p>
            </div>

            {ta.weakestTransition && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Weakest handoff</p>
                <p className="text-sm text-orange-200 italic">"{ta.weakestTransition}"</p>
              </div>
            )}

            {ta.transitions && ta.transitions.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">All transitions</p>
                <div className="space-y-2">
                  {ta.transitions.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs text-gray-400">
                      <TransitionBadge quality={t.quality} />
                      <span className="leading-relaxed">
                        <span className="text-gray-500">…{t.from}</span>
                        <span className="text-gray-600 mx-1">→</span>
                        <span className="text-gray-400">{t.to}…</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CART analysis */}
      <section>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">CART Structure</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(critique.cartAnalysis).map(([key, present]) => (
            <CartBadge key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} present={present} />
          ))}
        </div>
      </section>

      {/* Strengths & Issues */}
      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Strengths</h2>
          <ul className="space-y-2">
            {critique.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-green-500 mt-0.5">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Issues</h2>
          <ul className="space-y-2">
            {critique.issues.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-red-500 mt-0.5">✗</span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Clarity breakdown */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Where clarity broke down</p>
          <p className="text-sm text-yellow-200 italic">"{critique.clarityBreakdown}"</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Where to pause</p>
          <p className="text-sm text-blue-200 italic">"{critique.pauseSuggestion}"</p>
        </div>
      </section>

      {/* Transcript */}
      <section>
        <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Your Transcript</h2>
        <p className="text-sm text-gray-400 leading-relaxed bg-gray-900 rounded-xl p-4">{transcript}</p>
      </section>

      {/* Rewrite */}
      <section>
        <button
          onClick={onRewrite}
          disabled={rewriting}
          className="px-6 py-3 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 rounded-xl text-sm font-semibold transition-all"
        >
          {rewriting ? "Rewriting…" : "Rewrite in 90 Seconds"}
        </button>

        {rewrite && (
          <div className="mt-4 bg-violet-950 border border-violet-800 rounded-xl p-4">
            <p className="text-xs text-violet-400 uppercase tracking-widest mb-2">Rewritten Version (~150 WPM)</p>
            <p className="text-sm text-gray-200 leading-relaxed">{rewrite}</p>
          </div>
        )}
      </section>

      {/* Reset */}
      <div className="pt-4 border-t border-gray-800">
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Try another question
        </button>
      </div>
    </div>
  );
}
