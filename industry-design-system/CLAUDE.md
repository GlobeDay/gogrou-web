# Industry design system — rules for this codebase

Every UI in this project follows the Industry design system. It lives in
`industry-design-system/` and is the binding visual reference: do not invent
colors, fonts, spacing, radii or component patterns that are not defined here.

## Setup (once)

Link or import the one stylesheet, then build with its classes:

```html
<link rel="stylesheet" href="/industry-design-system/styles.css">
```
```css
/* or from the app's root CSS */
@import "./industry-design-system/styles.css";
```

`styles.css` pulls in `tokens.css` (variables) and `components.css`
(base element defaults + component classes). React bindings that wrap the same
classes are in `industry-design-system/react/` — import from
`industry-design-system/react/index.js`. Tailwind users: map the tokens with
`tokens/tailwind.css` and still prefer the component classes over re-deriving
them in utilities.

Fonts load from Google Fonts inside `tokens.css` (Barlow + Barlow Condensed).
Self-host them if the app must work offline, and keep the family names.

## Non-negotiables

1. **Take every value from a token.** `var(--color-*)`, `var(--font-*)`,
   `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`. Never hard-code a
   hex, a font name, or a px value the tokens already carry.
2. **Everything is square.** Cards, buttons, inputs, tags, images, dialogs:
   `border-radius: 0`. The radius tokens exist for edge cases only.
3. **Cards and figures are line drawings, not filled surfaces.** Transparent
   background, 1px `--color-divider` border. The solid accent primary button
   is the single deliberate exception.
4. **Framed objects wear registration marks.** `.blueprint` plus four
   `<i class="corner tl|tr|bl|br">` children (React: `<Blueprint>` or
   `<Corners/>`). Never drop the marks from a framed element.
5. **One accent.** Steel `#5980a6`. This is a mono scheme — the
   `--color-accent-2-*` ramp is a stand-in that reads the same; treat both as
   one role. No decorative color beyond it. No gradients.
6. **Type**: Barlow Condensed (`--font-heading`, weight 600) for headings and
   for button/card/nav labels; Barlow (`--font-body`) for everything else.
   Uppercase micro-labels use `h6` or `.card-kicker`.
7. **Photographs go through `.duotone`** (React `<Duotone>`) — desaturated
   and washed in the accent, then framed square with corner marks.
8. **Icons: Lucide at `stroke-width="1.5"`.** Never a heavier stroke, never a
   different icon set, never emoji.
9. **Grid first.** Equal-width cells, strong horizontal and vertical rhythm,
   visible structure. Prefer whitespace over `.hr`.
10. **States are already themed** — hover/active from the accent ramp,
    `:focus-visible` is a 2px accent ring, disabled drops to 45% opacity.
    Do not restyle them per component or per page.
11. **Accent contrast is ~3:1** against the ground: fine for icons, large text
    and chrome, not for body copy. For paragraph-size accent text use
    `--color-accent-700`.

## Class reference

| Class | What it is |
| --- | --- |
| `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-ghost` / `.btn-icon` / `.btn-block` | Actions; primary is the solid accent fill |
| `.tag` + `.tag-accent` / `.tag-accent-2` / `.tag-neutral` / `.tag-outline` | Small labels tinted from the ramps |
| `.field` + `label`, `.input`, `.radio` + `.dot`, `.seg` + `.seg-opt` | Form fields and choices, on native elements — no script |
| `.card` + `.card-kicker` / `.card-title` / `.card-body` / `.card-meta` | Framed content card |
| `.elev-sm` / `.elev-md` / `.elev-lg` | Elevation steps (use sparingly) |
| `.nav` + `.nav-brand` | Header bar |
| `.table` | Data table with themed header and row rules |
| `.dialog-backdrop` + `.dialog` (+ `.dialog-title` / `-body` / `-actions`) | Modal at the top elevation |
| `.blueprint` + `<i class="corner …">`×4 | The wireframe frame |
| `.duotone` | Image wrapper — every content photograph |
| `.text-muted` | 55% ink secondary text |
| `.hr` | Rule — exists, but prefer whitespace |

## When something isn't in the system

Compose it from existing classes and tokens first. If a genuinely new pattern
is needed, build it from the tokens, keep it square, hairline-bordered and
marked, and add it to `components.css` + this file rather than styling it
locally. Retuning the look means editing `tokens.css` — nothing else.

## Reference pages

Open `industry-design-system/docs/index.html` in a browser: every component
and foundation rendered at real size. The markup on those pages is plain HTML
and is meant to be copied.
