# TPM Interview Coach — combined UX and accessibility audit

## Audit scope

The question-entry and recording start flow at `https://tpm-interview-coach.vercel.app/`, compared with the cream visual system at `https://sridharvanka.me/`. The local implementation was then checked at desktop and mobile widths.

## User goal and accessibility target

The user should be able to choose or enter an interview question, understand what happens to their audio, start recording confidently, and move through analysis to coaching. Target: a clear keyboard-operable experience with readable text, visible focus, descriptive labels, and responsive reflow.

## Steps

1. **Live start screen — needs work** (`01-start-viewport.png`)
   - The single-purpose flow is easy to understand and all core controls are visible.
   - The dark screen does not match the parent website and reads as a separate prototype.
   - Four full-width sample buttons create a dense block with little visual distinction.
   - Helper text and disabled-state text are very low contrast.
   - The page says microphone permission is required but does not explain privacy or what happens when permission is denied.
   - There is no visible sense of progress from question to analysis to feedback.

2. **Redesigned desktop start screen — healthy** (`02-redesigned-start.png`)
   - Uses the parent site's exact cream, ink, emerald, grid, radius, and typography tokens.
   - Strong heading and concise value proposition explain the benefit before the form.
   - A three-step indicator makes the flow legible without adding navigation overhead.
   - Sample questions become a two-column choice set with a visible selected state.
   - Privacy copy sits next to the recording action.
   - The site wordmark reconnects the tool to `sridharvanka.me`.

3. **Redesigned mobile start screen — healthy** (`03-redesigned-mobile.png`)
   - Content reflows to one column without horizontal overflow.
   - The headline, progress indicator, question field, and samples remain readable.
   - Tap targets are comfortably sized and the primary action stays visually distinct.

## Strengths

- The product has a sharp job-to-be-done and a short entry flow.
- Sample prompts reduce blank-page friction.
- Recording is gated until a question exists.
- The app does not require accounts or setup.

## UX risks

- The current live deployment visually disconnects from the main site.
- Results previously returned to a dense dark dashboard with many equally weighted sections; the redesign groups them into editorial cards and puts the overall coaching readout first.
- Permission failures previously surfaced only as an unhandled browser error; the updated recorder gives a plain-language recovery message.
- Long scorecards can still be cognitively heavy. A future pass could prioritize a single “do this next” recommendation above secondary diagnostics.

## Accessibility risks

- The live helper copy appears low contrast against the near-black background.
- The original textarea label was not programmatically attached to its field.
- The original app did not provide a consistent visible focus treatment.
- Tooltips for enunciation details were hover-only; the redesign keeps timing details visible in the badges.
- Recording and processing status need a real screen-reader test; `aria-live` is now present, but screenshots cannot confirm announcement timing.

## Evidence limits and verification gaps

Screenshots can establish hierarchy, contrast risk, target size, and responsive layout, but not full WCAG compliance. Microphone permission, keyboard order, screen-reader announcements, API errors, reduced-motion behavior, and the complete results flow require interactive testing with a real recording and configured external API credentials.

## Recommendations

1. Ship the cream-theme transition and consistent scorecard treatment.
2. Keep the three-step framing and selected sample state.
3. Preserve the privacy reassurance and permission-recovery copy.
4. Next, add a short practice timer or recommended answer length before recording.
5. Later, make the first results card explicitly name the single highest-leverage change for the next attempt.
