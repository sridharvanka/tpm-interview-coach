# Leadership Coach V1 patch

I could not commit this directly to GitHub because the GitHub integration returned:
`Resource not accessible by integration`.

Copy these files into the existing `sridharvanka/tpm-interview-coach` repo, replacing existing files where paths match.

## New file
- `lib/practiceModes.ts`

## Replaced files
- `lib/types.ts`
- `app/page.tsx`
- `app/api/critique/route.ts`
- `app/api/rewrite/route.ts`
- `components/Scorecard.tsx`

## What this adds
- Practice modes: Interview Answer, Executive Update, Pushback
- Target styles: Crisp Executive, Calm Operator, Strategic Framer
- Mode-specific prompts and rubrics
- Seniority signal scoring
- Communication move recommendations
- Better delivery coaching with pause scripts
- Mode/style-aware rewrite
