# Industry design system

A wireframe system: steel-blue on a light technical ground, Barlow Condensed
headings over Barlow, a modular grid, and cards, figures and buttons framed as
blueprint objects — square-cornered, hairline-bordered, with "+" registration
marks at the corners. Cards and figures stay transparent line drawings; the
primary button is the one solid object on the board. Photography is duotoned
into the steel accent; icons are thin-stroke Lucide.

Drop this whole folder into a project and point your app at `styles.css`.

## Contents

```
industry-design-system/
├── CLAUDE.md              # the rules — read by Claude Code automatically if kept at repo root
├── README.md              # this file
├── styles.css             # single entry point (imports the two below)
├── tokens.css             # :root variables + font loading — the only file you retune
├── components.css         # base element defaults + component classes
├── tokens/
│   ├── theme.json         # the parameters the system was derived from
│   ├── tokens.json        # flat token export for tooling
│   └── tailwind.css       # Tailwind v4 @theme mapping
├── react/                 # thin React bindings over the same classes
│   ├── index.js           # barrel export
│   ├── Blueprint.jsx      # Blueprint, Corners, Duotone
│   ├── Button.jsx         # Button, Tag
│   ├── Card.jsx  Form.jsx  Dialog.jsx  Nav.jsx  Table.jsx
├── docs/
│   ├── index.html         # start here — links every page below
│   ├── foundations/       # color, type, layout, icons, imagery
│   └── components/        # buttons, forms, cards, navigation, table, dialog
└── assets/photo.jpg       # the reference photograph the imagery page treats
```

## Install

**Plain HTML / any framework**

```html
<link rel="stylesheet" href="/industry-design-system/styles.css">
```

**Bundled app (Vite, Next, etc.)** — import once at the app entry:

```js
import './industry-design-system/styles.css';
```

**React**

```jsx
import { Button, Card, Blueprint, Duotone, Tag } from './industry-design-system/react';

<Card kicker="Section 04" title="Load-bearing" meta={<Tag variant="accent">Draft</Tag>}>
  Cards are transparent line drawings with registration marks.
</Card>
<Button variant="primary">Continue</Button>
```

The React files are unbuilt `.jsx` — they assume your project already
transpiles JSX (Vite, Next, CRA, esbuild). They are optional sugar; the CSS
classes work on any markup.

**Tailwind v4**

```css
@import "tailwindcss";
@import "./industry-design-system/tokens.css";
@import "./industry-design-system/tokens/tailwind.css";
```

## Retuning

Everything reads from `tokens.css`. Change the accent, the ground, the type
pairing or the spacing scale there and every page, component and React binding
follows. Keep `tokens/theme.json` and `CLAUDE.md` in step so the written
guidance never drifts from what the CSS actually does.

## Notes

- Fonts come from Google Fonts via an `@import` in `tokens.css`. Self-host for
  offline or CSP-restricted apps; keep the family names.
- Icons are not bundled — install `lucide` / `lucide-react` and set
  `stroke-width: 1.5`.
- `assets/photo.jpg` is a reference image for the imagery page, not a product
  asset. Replace it with real photography.
- The CSS uses `color-mix()` and `:has()` — Chrome/Edge 111+, Safari 16.4+,
  Firefox 113+.
