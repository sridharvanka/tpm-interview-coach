# Product Spec

## What we're building

A private, browser-based interview practice tool for a single user. The user types an
interview question, records their spoken answer, and receives an objective scorecard:
words per minute, filler word count, longest uninterrupted speaking stretch, and pause
analysis. An LLM then evaluates the answer's seniority signal, structure, and clarity,
returning three strengths, three issues, the exact moment the answer became unclear, and
a tighter rewritten version. No accounts. No persistent storage. Audio is processed and
discarded.

## Job this solves

When preparing for senior TPM interviews, get immediate, honest feedback on whether a
spoken answer sounds senior — not just whether it's fast or slow, but whether it conveys
role, action, tradeoff, metric, and result in a way that signals executive-level thinking.

## Users

One user: the builder, preparing for senior Technical Program Manager interviews. Used
alone, in a browser, during private practice sessions. No collaboration, no sharing, no
admin.

## MVP scope

### In scope

1. **Question input** — a text field where the user types or pastes the interview question before recording.
2. **Audio recorder** — a Record / Stop button using the browser `MediaRecorder` API; records in `webm` or `mp4` format.
3. **Transcription** — on stop, send audio to OpenAI Whisper (`whisper-1`) with `timestamp_granularities: ["word", "segment"]` to get the full transcript plus word-level timing.
4. **Speech metrics** — computed from the timestamp data:
   - Words per minute (WPM), with a target range of 130–155 flagged
   - Filler word count and list (um, uh, like, you know, sort of, basically, right, kind of)
   - Longest uninterrupted run in seconds (time between pauses > 1.5 s)
   - Number of pauses and median pause length
5. **LLM critique** — send the question + transcript to Claude claude-sonnet-4-6 with a structured prompt that evaluates: speaking clarity, seniority signal, whether the question was directly answered, STAR/CART structure (context, action, role, tradeoff, metric, result), and whether the answer sounded rushed or rambling. Return: 3 strengths, 3 issues, the sentence where clarity broke down, where to insert a pause, a readiness score 1–10.
6. **Rewrite** — a "Rewrite in 90 seconds" button that calls the LLM to produce a tighter version of the answer at ~150 WPM.
7. **Scorecard display** — a clean results panel with Delivery section (WPM, fillers, longest run, pauses) and Clarity section (LLM output), rendered after processing completes.
8. **Reset** — a "Try again" button that clears everything and returns to the question input.

### Out of scope (explicitly)

- User accounts or login of any kind
- Saving recordings, transcripts, or scores to a database
- Video recording or body-language / eye-contact analysis
- Mobile app (iOS / Android)
- Session history or progress tracking over time
- Shareable results or export
- Multi-question flows or mock full interviews
- Company-name redaction (nice to have, post-MVP)
- Waveform visualization

## Technical requirements

- **Platform**: Web (browser-only, desktop Chrome/Firefox/Safari)
- **Stack**: Next.js 14 (App Router), React, Tailwind CSS
- **Integrations**:
  - OpenAI API — Whisper for transcription (`/v1/audio/transcriptions`)
  - Anthropic API — Claude claude-sonnet-4-6 for LLM critique and rewrite
- **Auth**: None
- **Data**: No persistent storage. Audio blob lives in browser memory during recording; sent to a Next.js API route for processing; transcript and metrics are held in React state for the session only. API keys stored in `.env.local`, never exposed to the browser.
- **API routes** (server-side, to keep keys secret):
  - `POST /api/transcribe` — receives audio, calls Whisper, returns transcript + word timestamps
  - `POST /api/critique` — receives question + transcript, calls Claude, returns structured critique JSON
  - `POST /api/rewrite` — receives question + transcript, calls Claude, returns the tighter version

## Constraints

- Solo project, built by one person
- API keys available (OpenAI + Anthropic)
- No backend database — keep it stateless
- Must run locally via `npm run dev`; deployment is optional (Vercel if desired)
- Whisper costs ~$0.006/min of audio — budget is not a constraint at practice-session volume

## Success criteria

- User can record a 2-minute answer and receive a full scorecard within 15 seconds of stopping the recording
- WPM and longest-run metrics are accurate enough to notice a difference between a fast and a measured answer
- LLM critique reliably flags when an answer has no measurable outcome or no clear role statement
- The rewritten version is noticeably tighter and slower-paced than the original
- The whole thing runs in a browser tab with no sign-in or setup required beyond `npm run dev`

## Open questions

- **LLM model choice**: Spec defaults to Claude claude-sonnet-4-6 for critique quality. Could swap to GPT-4o if the user prefers a single OpenAI bill. Architect should confirm which to wire up first.
- **Pause threshold**: 1.5 seconds is assumed as the minimum pause that "counts." May need tuning after first use — consider making it a configurable constant.
- **Filler word list**: The eight fillers listed are a starting set. User may want to add domain-specific ones ("basically," "technically," "honestly") — consider a simple editable list post-MVP.
- **Deployment**: Spec assumes local dev only. If the user wants this on Vercel, the API routes work as-is but the `.env.local` keys need to become Vercel environment variables.
- **Audio format**: `MediaRecorder` defaults differ by browser (`webm` on Chrome, `mp4` on Safari). The transcription route should detect and handle both; Whisper accepts both.
