# ZipPrep Design System
**Status:** Foundation v1 — approved direction, not yet applied site-wide  
**Reference:** User-provided Lumen AI workspace screenshot (2026-11-03)

## 1. Design intent
Build ZipPrep as a premium, dark learning workspace. Use the reference's information architecture and visual language—not its Lumen branding or AI-product content. The product should feel calm, focused, confident and useful for serious exam preparation.

## 2. Core visual principles
- Dark charcoal canvas, layered near-black panels and subtle borders.
- Violet as the primary action/accent; cyan as a restrained secondary highlight.
- Soft violet-to-cyan gradients only for primary actions, key metrics and occasional hero art.
- Rounded cards (16–22px), consistent spacing and restrained shadows.
- Strong typographic hierarchy; no oversized condensed poster typography in app/dashboard screens.
- Dense information is grouped into clear panels with generous internal spacing.
- Avoid neon overload, excessive glassmorphism, decorative clutter and rainbow gradients.

## 3. Color tokens
| Role | Token | Value |
|---|---|---|
| App canvas | `--zp-bg` | `#09090c` |
| Sidebar | `--zp-sidebar` | `#111115` |
| Main panel | `--zp-surface` | `#15151b` |
| Raised panel | `--zp-surface-raised` | `#1b1b23` |
| Primary text | `--zp-text` | `#f5f4fa` |
| Secondary text | `--zp-text-secondary` | `#b8b6c4` |
| Muted text | `--zp-text-muted` | `#858392` |
| Primary accent | `--zp-violet` | `#9254ff` |
| Secondary accent | `--zp-cyan` | `#63dce8` |
| Success | `--zp-success` | `#63d9b0` |
| Warning | `--zp-warning` | `#f3c76b` |
| Danger | `--zp-danger` | `#ff7c91` |

## 4. Typography
- Display/headings: Manrope, weight 600–800; tight but readable tracking.
- Body/UI: DM Sans, weight 400–700.
- Dashboard title: 36–52px desktop, 30–36px mobile.
- Section headings: 20–26px.
- Body: 14–16px; helper/meta: 12–13px.
- Use sentence case. Reserve uppercase tracking for small eyebrow labels only.

## 5. Layout and responsive behaviour
### Desktop (>= 1200px)
- Three-zone workspace: left navigation (224px), flexible content, optional right rail (320px).
- Main content max width 1440px, 16–24px gutters, 16–20px panel gaps.
- Sidebar remains stable; content scrolls independently only where appropriate.
### Tablet (768–1199px)
- Compact/collapsible navigation; right rail moves below main content or becomes a drawer.
- Two-column cards where space allows.
### Mobile (< 768px)
- Single-column content, compact top bar and bottom navigation or slide-out menu.
- Right rail becomes stacked sections; no horizontal page overflow.
- Touch targets at least 44px; keep critical actions thumb-reachable.

## 6. Component rules
- **Navigation:** icon + concise label; selected item uses a low-contrast violet surface, not a bright pill.
- **Cards:** subtle border, 16–22px radius, consistent padding (16–24px); avoid thick outlines.
- **Primary button:** gradient fill, white text, 44–48px height; one primary action per panel.
- **Secondary button:** raised surface and quiet border.
- **Inputs/selects:** dark raised fill, visible border and clear focus ring; never rely on color alone.
- **Progress:** thin track with violet-to-cyan fill; pair with numeric progress.
- **Charts:** restrained violet/cyan/teal; labels and legends remain readable.
- **Question options:** full-width option rows, large click targets, clear selected/correct/incorrect states and keyboard focus.
- **Empty/loading/error states:** explain what happened and the next action; no blank panels or endless spinners.

## 7. ZipPrep dashboard information architecture
Adapt the reference layout to actual product needs:
- **Left navigation:** Overview, Practice, Mock Tests, PYQs, Notes, Explore India, Current Affairs, Progress, Settings.
- **Main hero:** “Your preparation, in focus” with a primary “Continue learning” action and secondary “Start mock test”.
- **Quick actions:** Practice questions, Full mock test, Previous-year questions, Study notes.
- **Progress summary:** attempted questions, accuracy, mock tests completed, current streak (only show real available data).
- **Recent activity:** recent tests/practice sessions, not fabricated chat history.
- **Right rail:** daily goal/progress, upcoming/recent tests, recommended next step. Hide modules that have no reliable data.
- Preserve existing content and features; reorganize them rather than removing them.

## 8. UX and accessibility
- Maintain WCAG AA contrast for normal text and controls.
- Keyboard navigation and visible focus for all interactive elements.
- Respect `prefers-reduced-motion`; animation is subtle and never conveys state alone.
- Provide labels for icon-only controls and meaningful alt text.
- Use clear confirmation for destructive actions and retain user progress.
- Loading and failure states must be explicit and recoverable.

## 9. Migration guardrails
- This token file is additive and intentionally not imported by existing pages yet.
- Do not replace question-bank data, exam logic, progress persistence, India datasets, or existing routes during visual migration.
- Migrate page-by-page, beginning with dashboard shell, then practice/mock tests, then secondary pages.
- Verify mobile, tablet and desktop at each step; run existing validation and Pages deployment workflows after implementation.
- Keep all dashboard metrics data-driven; do not hard-code example values from the reference screenshot.
