# ZipPrep Design System — Lumen Reference, Matte Edition
**Version:** 1.1  
**Reference:** User-provided Lumen workspace screenshot  
**Status:** Visual direction refined to remove neon/glow effects.

## Design intent
Recreate the reference's actual workspace composition: compact left navigation, large central hero and content canvas, and a right-hand stack of summary and utility panels. Adapt the content to exam preparation. The target is premium, calm, tactile and information-rich—not a generic education template.

## Visual principles
- Deep charcoal page background and matte dark-grey surfaces.
- Restrained muted violet/lavender for selected navigation and primary actions.
- Cyan is not a decorative accent; reserve subdued teal only for meaningful success/progress states.
- No neon, glow, luminous orb, glowing text, bright cyan lighting, glassmorphism, or heavy gradient effects.
- Use subtle borders and natural shadows to separate panels.
- Keep the reference's visual hierarchy, proportions, density and card-based information architecture.

## Palette
| Role | Value |
|---|---|
| Page canvas | #09090C |
| Sidebar | #111115 |
| Main surface | #15151B |
| Raised surface | #1B1B23 |
| Hover surface | #22222C |
| Primary text | #F5F4FA |
| Secondary text | #B8B6C4 |
| Muted text | #858392 |
| Muted violet | #89769F |
| Selected violet surface | #292333 |
| Success | #63B9B0 |
| Warning | #D6B66D |
| Danger | #D98291 |
| Border | rgba(255,255,255,.075) |
| Strong border | rgba(255,255,255,.13) |

## Typography
- Headings: Manrope 600–800.
- Body and UI: DM Sans 400–700.
- Dashboard hero: 42–58px desktop; 32–36px mobile.
- Section headings: 20–26px.
- Body: 14–16px; supporting labels 12–13px.
- Sentence case; small uppercase eyebrow labels only.

## Layout
### Desktop >= 1200px
- Left navigation: approximately 220–224px.
- Flexible central workspace.
- Right information rail: approximately 300–320px.
- 12–16px gaps; page padding 18–24px.
- Reference-inspired panel radii 18–24px.
### Tablet 768–1199px
- Compact/collapsible left navigation.
- Hide or relocate right rail beneath main content.
- Preserve central hero and readable card grids.
### Mobile < 768px
- Compact navigation at top or accessible slide-out navigation.
- Single-column content; no horizontal overflow.
- Right rail cards stack below main content.
- Minimum 44px interactive targets.

## Component rules
- Sidebar: matte near-black panel; active link uses muted violet surface and subtle edge marker.
- Hero: large rounded charcoal panel, bold headline, supporting copy and clear primary action. If decorative artwork is used, use a softly shaded matte illustration—not a luminous orb.
- Cards: matte surfaces, subtle border, 18–22px radius, 16–24px padding.
- Primary button: muted violet fill or restrained violet gradient, no glow.
- Secondary button: raised charcoal fill and subtle border.
- Inputs: raised dark fill, visible border, accessible focus ring.
- Progress: neutral track with muted violet fill; show numeric progress.
- Question options: full-width rows, clear selected/correct/incorrect states, keyboard focus.
- Right rail: summary, recent practice/activity, study tip, next recommended action. Use only real user data; label empty states honestly.

## ZipPrep information architecture
- Left: Overview, Practice, Mock Tests, PYQs, Notes, Explore India, Current Affairs, Progress, Settings.
- Center: hero, continue learning, quick actions, recent activity/projects.
- Right: today's learning summary, recent tests/activity, study tip and next step.
- Keep all existing features and data; reorganize rather than remove.

## Interaction and accessibility
- WCAG AA contrast for normal text and controls.
- Keyboard navigation and visible focus.
- Respect prefers-reduced-motion; transitions should be subtle.
- Do not communicate state by colour alone.
- All icon-only controls need accessible labels.
- Provide explicit loading, empty and recoverable error states.

## Migration guardrails
- Preserve question bank, mock-test logic, attempt rotation, progress persistence, India data and routes.
- Migrate incrementally and validate desktop, tablet and mobile.
- All progress metrics must be sourced from real app data.
- No fabricated stats, recent activity or test history.
