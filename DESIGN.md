# Design

Visual system for the AI Mock Interview client. Register: **product** (see PRODUCT.md). Single dark theme — "blurple space": Discord-inspired deep-navy surfaces, blurple accent, starfield + gradient marketing panels, motion as a first-class material. Client reference: **discord.com**.

## Color

Defined as Tailwind tokens in `client/tailwind.config.js`.

| Token | Value | Use |
|---|---|---|
| `stage` | `#0d0e23` | Interview/call screens, full-screen editor backdrops |
| `bg` | `#11132c` | Page background (Intake, Report); Landing uses the hero gradient instead |
| `surface` | `#1a1c3f` | Cards, panels, headers, modals |
| `raised` | `#23265a` | Inputs, secondary buttons, bubbles |
| `overlay` | `#2c2f6b` | Hover state of raised elements, scrollbars, ring tracks |
| `ink` | `#f4f5ff` | Primary text |
| `ink-secondary` | `#b9bdde` | Body/secondary text |
| `ink-muted` | `#8187b8` | Metadata only (never body copy) |
| `accent` | `#5865f2` | Primary actions, selection, live state (blurple) |
| `accent-bright` | `#7983f5` | Accent hover, accent-tinted text on dark |
| `accent-deep` | `#4752c4` | Accent pressed |
| `accent-ink` | `#ffffff` | Text on accent surfaces |
| `danger` / `danger-bright` | `#e5484d` / `#f06a6f` | Destructive actions, mic-live, errors |

Marketing gradients (Landing panels, Report banner): blurple→violet→pink (`#5865f2 → #8b5cf6 → #d84fd8`), blurple→green (`#5865f2 → #23a55a`), blurple→coral (`#0f101b → #f47b67`). The Landing page background is one tall gradient `#0f101b → #2b32c8 → #15173e → #0e1030` under a `.starfield` layer.

Semantic guests: emerald (success / free tier), blue-400 + amber-400 only inside the score data-viz scale on Report.

Borders: `border-white/[0.06]` (hairline) to `border-white/[0.1]` (controls); hover `border-white/20–25`. Marketing panels: `bg-white/[0.04–0.06]` glass over the gradient with `border-white/10`, radius `rounded-[2rem]`–`rounded-[2.5rem]`.

Glow is part of the accent vocabulary: `.glow-accent` / `.glow-accent-lg` on primary CTAs, blurple box-shadows on live/selected states. White pill buttons (dark text) are the hero/footer CTA shape, echoing the reference.

## Typography

- **Inter** — all UI. Fixed rem scale, weights 400–700.
- **Archivo Black** (`font-display`) — chunky uppercase display headlines (Landing hero, section heads, step titles, footer statement), wordmark, Report overall score, AI avatar monogram. Never in labels, buttons, or data.

## Components

- Primary button: `bg-accent text-accent-ink font-semibold rounded-xl glow-accent`, hover `accent-bright` + lift (`-translate-y-0.5`), active `accent-deep`.
- Secondary button: bordered `border-white/[0.1] text-ink-secondary`, hover `border-white/25 text-ink`.
- Destructive: `bg-danger` → hover `danger-bright`.
- Inputs: `bg-surface` (pages) or `bg-raised` (call screen), focus `border-accent/50–60`.
- Selected card/radio: `border-accent/60 bg-accent/[0.06–0.08]` + soft cyan shadow (emerald variant for the free tier); radio dot pops in (`animate-pop-in`).
- Modals: `bg-surface rounded-2xl animate-scale-in` over `bg-stage/85 backdrop-blur-sm animate-fade-in`.

## Motion

Motion is structural, not decorative. The system (tokens in `tailwind.config.js`, utilities in `index.css`):

- **Entrances** — `animate-fade-up` with `.anim-delay-1..5` stagger on page sections (Landing, Report, DeviceCheck) and step changes (Intake). Fill mode `both` so delayed items don't flash.
- **Live state** — `.speaking-ring` (rotating conic-gradient ring) around the AI avatar while speaking/thinking; `animate-glow-pulse` breathing cyan shadow on the speaking tile; `animate-wave` scaleY waveform bars.
- **Feedback** — `animate-pop-in` for confirmations (check marks, radio dots, score number); `animate-slide-in` for new transcript messages and inline errors; hover lift on cards/CTAs; `scale-105/95` press states on call controls.
- **Loading** — `.skeleton-shimmer` sweep instead of flat pulse; spinners only inline next to status text.
- **Ambient (Landing)** — `.starfield` (layered repeating radial dots) + `.aurora-field` drifting blurple/pink blobs; floating decor glyphs and sparkles (`animate-bob` / `animate-twinkle`) with smoothed cursor parallax; continuously scrolling topic marquee (`animate-marquee`, pauses on hover, edge-faded via `.marquee-mask`); `.spotlight` cursor-following glow on the primary card (hover-capable pointers only).
- **Ambient (task screens)** — Intake/DeviceCheck/Interview get a *static* backdrop only: dimmed `.starfield` (70% → 30% opacity as focus increases toward the call) plus one fixed radial blurple glow. No drifting blobs, no marquee, no parallax — motion there stays state-driven. Intake adds an `aria-hidden` decorative art rail (gradient panel mirroring the current step, reactive to the user's selections); DeviceCheck washes the empty camera preview with a radial blurple so it doesn't read as a dead void.
- **Scroll reveals (Landing)** — the three "How it works" step panels use `useInViewOnce` (IntersectionObserver): content is visible by default and entering the viewport only adds `animate-fade-up`, so nothing ships blank in headless/JS-off contexts.
- **Presence (Interview)** — idle AI avatar breathes (`animate-breathe`); Discord-style bouncing typing dots (`animate-dot-bounce`) while the AI is thinking/processing. The interviewer should never look frozen.
- **Press feedback** — every primary button scales to 0.97 on `:active` (client reference: Discord's "alive" feel — the UI visibly responds to touch).
- **Data** — Report score rings draw from zero on mount (1.2 s ease-out-quint stroke transition).
- `prefers-reduced-motion` globally collapses all animation and hides aurora blobs (see `index.css`).

## Voice

Calm, professional, second person ("Check your audio and video"). No exclamation marks outside genuine milestones.
