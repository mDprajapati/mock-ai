# Product

## Register

product

## Users

Job candidates (mostly software engineers, junior through staff level) practicing for upcoming technical interviews. They arrive focused and slightly nervous, usually at a desk in the evening with the camera on. The job to be done: rehearse a realistic, timed, voice-driven interview and leave with a scored report of strengths and gaps.

## Product Purpose

An AI-powered mock interview platform. A candidate uploads a CV, optionally a job description, picks an experience level, and runs a 3-phase voice interview (intro/career → JS theory with live coding → open-ended practical coding) against an adaptive AI interviewer. Success = the candidate finishes a full session, trusts the experience enough to repeat it, and acts on the report.

## Brand Personality

Calm, confident, professional — "a rehearsal studio, not an exam hall." The interface should lower anxiety, keep the candidate's attention on the conversation and the code, and feel like a polished hiring product rather than a demo.

## Design Reference (client mandate, June 2026)

**discord.com** is the client's explicit visual reference: blurple-on-deep-navy space palette, starfield backgrounds, chunky uppercase display headlines, big rounded glassy gradient panels with illustration + copy scroll sections, playful presence cues, and a statement footer. This supersedes the earlier "no indigo/violet" anti-reference.

## Anti-references

- Microsoft Teams chrome clones (an early interview screen imitated Teams' #6264A7 palette).
- Warm charcoal + amber/copper "studio" palettes with serif display type — rejected by the client as old-school and static.
- The cyan-on-black "midnight signal" iteration — better, but the client wanted Discord's warmth and playfulness instead.
- Gamified/quiz-app energy — no confetti, no badges. Playfulness lives in ambient decoration, not rewards.
- Cluttered video-call UIs with a dozen equal-weight buttons.

## Design Principles

1. **The stage is the interview** — on call screens, chrome recedes; the AI tile, the candidate video, and the transcript carry the hierarchy.
2. **One vocabulary everywhere** — same surfaces, accent, radii, and control shapes on every screen; no per-page palettes.
3. **Calm under the timer** — state changes (speaking, listening, time low) are conveyed with quiet color/motion shifts, never alarm.
4. **Accent = action or live state** — blurple marks the primary action and "live" indicators; vivid gradient fields live in marketing panels and decorative side art, while task chrome itself stays token-flat over a quiet starfield + radial-glow backdrop.
5. **Earned familiarity** — standard controls (radios, steppers, modals) styled well beat invented affordances.

## Accessibility & Inclusion

- WCAG AA: body text ≥ 4.5:1 on its surface; large/bold text ≥ 3:1.
- Visible focus rings on all interactive elements (bright blurple, 2px, offset).
- All animation honors `prefers-reduced-motion` (crossfade or instant).
- Voice features always have a typed fallback (already in the product); never voice-only.
- Touch targets ≥ 44px on primary call controls.

## Visual Tokens (summary)

- Theme: single dark theme — "blurple space" (Discord-inspired). Stage `#0d0e23`, page bg `#11132c`, surface `#1a1c3f`, raised `#23265a`. Landing runs a tall blurple→navy gradient (`#0f101b` → `#0e1030`) with a starfield.
- Ink: `#f4f5ff` primary, `#b9bdde` secondary, `#8187b8` muted (metadata only).
- Accent: blurple `#5865f2` (hover `#7983f5`, pressed `#4752c4`), white text on accent; blurple glow shadows on primary CTAs and live states. Marketing gradients: blurple→pink (`#d84fd8`), blurple→green (`#23a55a`), blurple→coral (`#f47b67`).
- Semantic: success emerald, danger `#e5484d` family; free-tier indicator emerald, Claude/premium indicator blurple.
- Type: Inter (UI, fixed rem scale ~1.125 ratio); Archivo Black (chunky uppercase display headlines on Landing/Report, wordmark, AI monogram).
- Motion: 150–250ms ease-out state transitions; staggered fade-up entrances + scroll-revealed step panels; rotating conic ring + waveform for AI speaking; typing dots and breathing avatar for presence; shimmer skeletons; starfield + aurora + parallax floaters on Landing only; everything collapses under `prefers-reduced-motion`.
