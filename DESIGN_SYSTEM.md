# GOGROU — Design System

> **Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/base-ui · IBM Plex Sans/Mono · lucide-react
> **Zdroj tokenů:** [`src/app/globals.css`](src/app/globals.css) · **Primitiva:** [`src/components/ui/`](src/components/ui)
> **Barevný model:** oklch · **Režimy:** light / dark / shopfloor

Industrial B2B systém — teple-neutrální plocha, oranžový akcent (Walter-inspired), vysoký kontrast pro dílenské osvětlení. Konzistence > kreativita; pokud to není token nebo komponenta, nepoužívej to.

---

## 1. Design tokens

Všechny tokeny žijí v [`globals.css`](src/app/globals.css) jako CSS custom properties, mapované do Tailwind přes `@theme inline`. **Nikdy** nehardcoduj hex/px — vždy token nebo Tailwind škála.

### 1.1 Barvy (oklch)

| Token | Light | Dark | Použití |
|---|---|---|---|
| `background` / `foreground` | teple bílá / slate ink | modro-černá / warm text | plocha stránky |
| `card` / `popover` | čistá bílá | `oklch(0.17…)` | povrchy nad plochou |
| `primary` | `oklch(0.62 0.17 48)` 🟠 | `oklch(0.7 0.17 50)` | akce, aktivní stav, brand |
| `secondary` / `muted` | warm gray | slate | tlumené povrchy, meta text |
| `accent` | light orange tint | dim orange | hover pozadí |
| `destructive` | `oklch(0.58 0.22 27)` | `oklch(0.7 0.19 25)` | mazání, chyby, scrap |
| `success` | `oklch(0.55 0.16 155)` | `oklch(0.65…)` | in_stock, receive, active |
| `warning` | `oklch(0.7 0.16 80)` | `oklch(0.78…)` | servis, výběh, reorder |
| `info` | `oklch(0.55 0.15 240)` | `oklch(0.65…)` | stroj, transfer, GINA |
| `border` / `input` / `ring` | slate-tone | white/12–15 % | linky, focus |
| `chart-1..5` | orange/steel/green/amber/slate | zesvětlené | grafy (zatím nevyužito) |
| `sidebar-*` | vlastní sada | vlastní sada | nav shell |

**Sémantická trojice `success` / `warning` / `info`** je GOGROU rozšíření nad shadcn základem — pohání status badge a GINA insights. Každá má i `-foreground` variantu.

### 1.2 Typografie

| Token | Hodnota | Utility | Použití |
|---|---|---|---|
| `--font-sans` | **IBM Plex Sans** (300–700) | `font-sans` | vše |
| `--font-mono` | **IBM Plex Mono** (400–600) | `font-mono` | GID, DM kódy, part numbers, param kódy |
| `--font-heading` | = sans | `font-heading` | nadpisy (alias) |

**Type škála** = Tailwind default (`text-xs`…`text-4xl`) **+ jeden vlastní krok:**

| Krok | px | Kdy |
|---|---|---|
| `text-2xs` | **11px** (0.6875rem) | eyebrow labely, badge text, dense meta, param kódy |
| `text-xs` | 12px | sekundární text, tabulkové buňky |
| `text-sm` | 14px | body default v UI |
| … | | |

> `text-2xs` byl zaveden, aby zmizelo ~22 hardcoded `text-[10px]`/`text-[11px]`. 10px bylo sjednoceno na 11px (a11y — 10px je pod komfortní hranicí).

**Letter-spacing:** `tracking-label` (0.12em) = jednotné tracking pro uppercase caption labely. Nahradilo ad-hoc `tracking-[0.06em/0.12em/0.2em]`.

**Font features:** mono má `font-feature-settings: "zero"` → **slashed zero** pro odlišení `0`/`O` v part numbers a DM kódech. (`.dm-input` dtto.)

### 1.3 Radius

Vše odvozené z jedné proměnné `--radius: 0.5rem`:

```
--radius-sm  = radius × 0.6   (~4.8px)    --radius-xl  = radius × 1.4
--radius-md  = radius × 0.8   (~6.4px)    --radius-2xl = radius × 1.8
--radius-lg  = radius         (8px)       --radius-3xl = radius × 2.2
                                          --radius-4xl = radius × 2.6  ← badge pill
```

### 1.4 Spacing, motion, elevation

- **Spacing:** Tailwind škála (`gap-2`, `px-4`, `space-y-6`…). Fixní šířky sloupců (`w-[100px]`) jsou strukturální, tolerované.
- **Motion:** `tw-animate-css` — `animate-in fade-in slide-in-from-*`, `duration-500`, stagger přes `animationDelay`.
- **Elevation:** `shadow-sm`/`shadow-md` + vlastní `.brand-glow` (orange ring) a `.etched-line` (hero divider).

### 1.5 Režimy (theming)

| Režim | Trigger | Popis |
|---|---|---|
| **light** | `:root` | teple-neutrální, default |
| **dark** | `.dark` na `<html>` | modro-černá, `ThemeToggle` (next-themes) |
| **shopfloor** | `[data-mode="shopfloor"]` | force hi-contrast dark + jasnější orange, pro dílenské osvětlení. Aplikováno v `/gss/scan`. |

---

## 2. Komponenty

**Inventář:** 11 UI primitiv · 16 doménových · 4 GPC sub-komponenty.

### 2.1 UI primitiva ([`components/ui/`](src/components/ui))

| Komponenta | Varianty | Stavy | Pozn. |
|---|---|---|---|
| **Button** | default · outline · secondary · ghost · destructive · link | focus-visible · active · disabled · aria-invalid | + 8 velikostí (`xs`→`icon-lg`); base-ui |
| **Badge** | default · secondary · outline · ghost · link · destructive · **success · info · warning · neutral** | focus-visible · hover (u `[a]`) | pill (`rounded-4xl`); sémantické varianty sdílené se StatusBadge |
| **Input** | — | focus · disabled · aria-invalid | jedna velikost (h-8) |
| **Card** / CardHeader/Content/Title/Description | — | — | povrch |
| **Dialog · Select · Table · Tabs · Label · Separator · Sonner** | shadcn/base-ui default | — | |

### 2.2 Doménové komponenty ([`components/`](src/components))

| Komponenta | Účel | API |
|---|---|---|
| **StatusBadge** | Sémantický status pill s CS labelem + tečkou | `status`, `showDot?`, `showLabel?: "cs"\|"raw"\|"both"`, `className?` |
| **Eyebrow** | Jednotný uppercase caption/section label | `size?: "xs"\|"sm"`, `as?`, `className?` |
| **DataSection** | Sekce: Eyebrow titul + akce + Card obal | `title`, `description?`, `action?`, `noPadding?` |
| **EmptyState** | Prázdný stav: ikona + titul + popis + akce | `icon?`, `title`, `description?`, `action?` |
| **Skeleton** / SkeletonRow / SkeletonCard | Loading placeholdery | `cols?` (row) |
| **BrandMark** / BrandLockup | Logo (G + gear, gradient) | `size` / `markSize` |
| **Sidebar** + MobileBar / MobileNav / ScanTopBar | 3 nav shelly (sidebar / scan / bare) | `currentPath` |
| **ThemeToggle · TenantSwitcher · UserMenu · PWAInstallPrompt** | ovládací prvky shellu | |

### 2.3 StatusBadge — sémantická mapa

`status → variant` je centralizované v [`status-badge.tsx`](src/components/status-badge.tsx); komponenta **skládá `<Badge>`** (nehardcoduje třídy):

| Status (piece / entity / movement) | Variant |
|---|---|
| in_stock · active · receive · service_in | `success` 🟢 |
| in_machine · in_production · transfer · issue | `info` 🔵 |
| in_service · phasing_out · service_out | `warning` 🟡 |
| scrapped · discontinued · scrap | `destructive` 🔴 |
| new · in_preset · adjust | `neutral` ⚪ |

CS labely (`Sklad`, `Stroj`, `Servis`…) jsou taktéž v mapě.

### 2.4 Eyebrow — jednotný label pattern

Nahradil **7 ručně kopírovaných spec variant**. Dvě velikosti:

```tsx
<Eyebrow>Operations</Eyebrow>                        // xs: text-2xs, tracking-label — micro caption
<Eyebrow as="h2" size="sm">Rychlý přístup</Eyebrow>  // sm: text-sm, tracking-wide — section title
<Eyebrow className="font-mono text-muted-foreground/70">…</Eyebrow>  // override přes className
```

Sdílený základ: `font-semibold uppercase text-muted-foreground`.

---

## 3. Konvence (Do's & Don'ts)

| ✅ Do | ❌ Don't |
|---|---|
| `bg-primary`, `text-success` (tokeny) | `bg-[#e8722a]`, `style={{color:'orange'}}` |
| `text-2xs`, `text-xs` (škála) | `text-[10px]`, `text-[13px]` |
| `tracking-label` pro uppercase captiony | `tracking-[0.2em]` |
| `<StatusBadge status={…}/>` | ručně stavěný barevný `<span>` pro status |
| `<Eyebrow>` pro sekce/eyebrow labely | kopírovat `text-… uppercase tracking-…` |
| Nová badge barva → varianta v `badgeVariants` | inline tint třídy na jednotlivém badge |
| `<Badge variant="info">` | `<Badge className="bg-info/12 text-info …">` |
| Tint opacity: `/12` fill + `/30` border (warning `/15`+`/40`) | náhodné `/10`, `/15`, `/20` mixy |
| Mono na identifikátory (GID, DM, part no.) | mono na běžný text |

---

## 4. Přístupnost

- **Kontrast:** `primary` L-hodnoty laděné na AA proti bílému foreground; dark mode používá jasnější orange pro perceived contrast; shopfloor = extra hi-contrast.
- **Focus:** globální `:focus-visible { outline-2 outline-offset-2 outline-ring }` + per-komponenta `focus-visible:ring-3`.
- **Klávesnice:** scan input `autoFocus`, `Esc` = vyčistit; nav používá `aria-current="page"`.
- **Semantika:** dekorativní ikony `aria-hidden`; StatusBadge má `title={status}` (raw kód pro screen reader / hover).
- **Touch:** shopfloor zvětšuje touch targety (h-14/h-16 tlačítka a input).

---

## 5. Struktura

```
src/
├─ app/
│  ├─ globals.css          ← VŠECHNY tokeny + @theme + base/component vrstvy
│  └─ layout.tsx           ← fonty (IBM Plex), 3 shelly, PWA meta
├─ components/
│  ├─ ui/                  ← shadcn/base-ui primitiva (11)
│  ├─ eyebrow.tsx          ← label pattern
│  ├─ status-badge.tsx     ← skládá <Badge>
│  ├─ data-section.tsx · empty-state.tsx · skeleton.tsx
│  ├─ sidebar.tsx · scan-topbar.tsx · mobile-nav.tsx   ← shelly
│  └─ brand-mark.tsx · theme-toggle.tsx · tenant-switcher.tsx …
└─ lib/utils.ts            ← cn() (clsx + tailwind-merge)
```

---

## 6. Changelog — audit refactor (2026-07)

Provedeno na základě `/design-system audit` (skóre 72 → cíl 90+):

- ➕ **Tokeny:** `text-2xs` (11px) + `tracking-label` (0.12em).
- ➕ **Badge:** sémantické varianty `success` / `info` / `warning` / `neutral` (sjednocené tinty).
- ♻️ **StatusBadge:** přestal hardcodovat třídy → **skládá `<Badge>`** (jeden tvar, jeden zdroj pravdy).
- ➕ **Eyebrow:** nová komponenta, nahradila 7 duplicit; migrováno v `sidebar`, `data-section`, dashboardu.
- 🧹 **Codemod:** 22× `text-[10/11px]` → `text-2xs`; 7× `tracking-[…]` → `tracking-label` (0 zbývá).
- 🧹 **Geist cleanup:** `--font-geist-mono` → `--font-mono`; smazané mrtvé `font-feature-settings` (`cv11/ss01/ss03`); mono nyní `"zero"` (slashed zero).
- 🎯 **PWA:** `themeColor` hex sladěn s `--background` tokeny.

### Zbývající / backlog
- Scan terminál (`scan-client.tsx`) používá tokenizované inline labely — může adoptovat `<Eyebrow>` (přidat `mono`/`weight` prop).
- `Button` nemá `loading` stav (spinner se řeší per-call přes `<Loader2 className="animate-spin"/>`).
- `Input` nemá size varianty ani error-message slot.
- `chart-1..5` tokeny definované, zatím 0× využité (čeká na GINA grafy).
- Chybí Storybook / vizuální regrese.

---

**Repo:** [GlobeDay/gogrou-web](https://github.com/GlobeDay/gogrou-web) · **Web:** [gogrou-web.vercel.app](https://gogrou-web.vercel.app) · viz i [`DATABASE.md`](DATABASE.md)
