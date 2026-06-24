import type { WordTimestamp, SegmentTimestamp, SpeechMetrics, EnunciationMetrics, MumbledWord } from "./types";

const FILLER_WORDS = [
  "um", "uh", "like", "you know", "sort of",
  "basically", "right", "kind of", "literally",
];

const PAUSE_THRESHOLD = 1.5; // seconds
const WPM_LOW = 130;
const WPM_HIGH = 155;

export function computeMetrics(
  words: WordTimestamp[],
  durationSeconds: number
): SpeechMetrics {
  if (!words.length || durationSeconds === 0) {
    return {
      wpm: 0,
      wpmStatus: "slow",
      fillerWords: [],
      fillerTotal: 0,
      longestRunSeconds: 0,
      pauseCount: 0,
      medianPauseSeconds: 0,
      pauses: [],
    };
  }

  // WPM
  const wpm = Math.round((words.length / durationSeconds) * 60);
  const wpmStatus = wpm < WPM_LOW ? "slow" : wpm > WPM_HIGH ? "fast" : "ok";

  // Filler words — case-insensitive, whole-word match
  const fillerCounts: Record<string, number> = {};
  for (const { word } of words) {
    const lower = word.toLowerCase().replace(/[^a-z ]/g, "");
    for (const filler of FILLER_WORDS) {
      if (lower === filler) {
        fillerCounts[filler] = (fillerCounts[filler] ?? 0) + 1;
      }
    }
  }
  const fillerWords = Object.entries(fillerCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  const fillerTotal = fillerWords.reduce((s, f) => s + f.count, 0);

  // Pauses between consecutive words
  const pauses: { start: number; end: number; duration: number }[] = [];
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].start - words[i - 1].end;
    if (gap >= PAUSE_THRESHOLD) {
      pauses.push({ start: words[i - 1].end, end: words[i].start, duration: gap });
    }
  }

  const pauseCount = pauses.length;
  const medianPauseSeconds =
    pauses.length === 0
      ? 0
      : median(pauses.map((p) => p.duration));

  // Longest uninterrupted run (between pauses)
  const boundaries = [
    { end: words[0].start },
    ...pauses.map((p) => ({ end: p.start, nextStart: p.end })),
    { end: words[words.length - 1].end },
  ];

  // Build runs as intervals between pauses
  const runs: number[] = [];
  const splitPoints = [
    words[0].start,
    ...pauses.flatMap((p) => [p.start, p.end]),
    words[words.length - 1].end,
  ];

  // Runs are the gaps between pauses on the speaking side
  const speakingStarts = [words[0].start, ...pauses.map((p) => p.end)];
  const speakingEnds = [...pauses.map((p) => p.start), words[words.length - 1].end];
  for (let i = 0; i < speakingStarts.length; i++) {
    runs.push(speakingEnds[i] - speakingStarts[i]);
  }

  const longestRunSeconds = runs.length ? Math.max(...runs) : durationSeconds;

  return {
    wpm,
    wpmStatus,
    fillerWords,
    fillerTotal,
    longestRunSeconds,
    pauseCount,
    medianPauseSeconds,
    pauses,
  };
}

// ---------------------------------------------------------------------------
// Enunciation analysis
// ---------------------------------------------------------------------------
// Two signals from Whisper verbose_json:
//   1. Speaking rate per word: duration / estimated syllables. Very short
//      durations relative to syllable count → word was likely rushed/mumbled.
//   2. Segment avg_logprob: Whisper's internal acoustic confidence. Values
//      below -0.8 indicate the model wasn't sure what it heard — a proxy for
//      unclear speech. Words inside such segments are flagged.
//
// Thresholds are conservative to avoid false positives.
// ---------------------------------------------------------------------------

const RUSHED_SEC_PER_SYLLABLE = 0.06; // below this → "rushed"
const LOW_LOGPROB_THRESHOLD = -0.8;   // below this → "low-confidence" segment

function estimateSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 1;
  const matches = cleaned.match(/[aeiouy]+/g);
  return Math.max(1, matches ? matches.length : 1);
}

export function computeEnunciation(
  words: WordTimestamp[],
  segments: SegmentTimestamp[]
): EnunciationMetrics {
  if (!words.length) {
    return { enunciationPct: 100, mumbledWords: [], totalWords: 0, clearWords: 0 };
  }

  // Build a lookup: for each word timestamp range, find its segment's avg_logprob
  const lowConfidenceRanges: { start: number; end: number }[] = segments
    .filter((s) => typeof s.avg_logprob === "number" && s.avg_logprob < LOW_LOGPROB_THRESHOLD)
    .map((s) => ({ start: s.start, end: s.end }));

  function isLowConfidence(wordStart: number, wordEnd: number): boolean {
    return lowConfidenceRanges.some(
      (r) => wordStart >= r.start - 0.05 && wordEnd <= r.end + 0.05
    );
  }

  const mumbledWords: MumbledWord[] = [];

  for (const w of words) {
    const clean = w.word.replace(/[^a-zA-Z']/g, "");
    if (clean.length < 2) continue; // skip punctuation / very short tokens

    const duration = w.end - w.start;
    const syllables = estimateSyllables(clean);
    const secPerSyllable = duration / syllables;

    const rushed = secPerSyllable < RUSHED_SEC_PER_SYLLABLE && duration < 0.25;
    const lowConf = isLowConfidence(w.start, w.end);

    if (rushed || lowConf) {
      mumbledWords.push({
        word: w.word.trim(),
        start: w.start,
        end: w.end,
        reason: rushed && lowConf ? "both" : rushed ? "rushed" : "low-confidence",
      });
    }
  }

  const totalWords = words.filter((w) => w.word.replace(/[^a-zA-Z]/g, "").length >= 2).length;
  const clearWords = totalWords - mumbledWords.length;
  const enunciationPct = totalWords > 0 ? Math.round((clearWords / totalWords) * 100) : 100;

  return { enunciationPct, mumbledWords, totalWords, clearWords };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
