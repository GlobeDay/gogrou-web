# Gogrou Web — Deploy guide

Po Sprint D je celá aplikace (auth, GPC, GSS, GINA, audit, import, scan, move, purchase-proposal export) v **jednom Next.js projektu**. `gogrou-api` Fastify service už není potřeba pro produkční deploy.

## Vercel (doporučeno)

### Varianta A — Vercel CLI

```bash
cd gogrou-web
npm install -g vercel        # nebo: npx vercel ...
vercel login                 # interaktivně přes prohlížeč
vercel link                  # navázat na nový/existující projekt
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_KEY production
vercel env add NEXT_PUBLIC_DEFAULT_TENANT production
vercel --prod                # první production deploy
```

### Varianta B — Vercel UI + GitHub

1. Push `gogrou-web/` do GitHub repa (může být monorepo; v Vercel pak nastav `Root Directory`).
2. Vercel Dashboard → **Add New… → Project** → importuj repo.
3. **Framework Preset:** Next.js (auto-detected).
4. **Root Directory:** `gogrou-web` (pokud je v monorepu).
5. **Environment Variables** (Production):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://wmvpcpkphhpyiiqsqvmh.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_KEY` = `sb_publishable_t-zM40PkSG7eGb0qiQi1VA_z23-jDTl`
   - `NEXT_PUBLIC_DEFAULT_TENANT` = `DEV01`
6. **Deploy**. Po prvním buildu dostaneš URL `https://<project>.vercel.app`.

### Po deploy: konfigurace Supabase Auth

Auth callback (`/auth/callback`) potřebuje, aby Supabase znal production doménu.

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://<project>.vercel.app`
- **Redirect URLs** (přidej):
  - `https://<project>.vercel.app/auth/callback`
  - `https://<project>-*.vercel.app/auth/callback` (pro preview deploys)

Pokud používáš custom doménu, přidej i tu.

### Po deploy: SMTP pro email confirmations

Default Supabase SMTP je rate-limited (~10 emailů/hod) — OK pro test, ne pro produkci.

Supabase Dashboard → **Project Settings → Auth → SMTP Settings** → enable custom SMTP (Resend, Postmark, AWS SES, …).

Email templates v **Authentication → Email Templates** zkontroluj a uprav (Confirm signup, Magic link, Recovery — všechny by měly použít `{{ .ConfirmationURL }}`).

## Alternativy

### Railway / Render / Fly.io

Stejný princip jako Vercel — push repo, nastav env vars, framework auto-detect:
- **Railway**: `railway init` → `railway up`. Env vars přes UI nebo `railway variables set KEY=value`.
- **Render**: Vytvoř Web Service z repa. Build command: `npm run build`. Start: `npm start`.
- **Fly.io**: `fly launch` (Next.js detect). `fly secrets set NEXT_PUBLIC_SUPABASE_URL=...`.

### Self-hosted Docker

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

Env vars přidat přes `docker run -e ...` nebo docker-compose `environment:`.

## Co Sprint D změnil oproti starší struktuře

| Před | Po |
|---|---|
| `gogrou-web` + samostatný `gogrou-api` Fastify | Vše v jednom Next.js projektu |
| Scan/move přes `http://localhost:8080/api/gss/*` | `/api/gss/*` route handlers, same-origin |
| JWT manuálně přes `Authorization: Bearer` | Cookies, auto přes `@supabase/ssr` middleware |
| Low-stock fetch z gogrou-api | Server Component → Supabase přímo |
| `NEXT_PUBLIC_API_URL=http://localhost:8080` | nepotřebné (default same-origin) |

`gogrou-api` zůstává v repu jako reference / pro případ samostatného nasazení (např. mobile app, která chce REST místo Next.js routes). Pro web produkci se nepoužívá.

## Smoke test po deploy

```
1. Otevři https://<project>.vercel.app/
2. Login: admin@gogrou.test / GogrouDemo1!
3. GPC search → vyzkoušej filtr → otevři produkt
4. GSS scan → vyzkoušej DM z low-stock listu
5. GINA → ověř že GINA dashboard renderuje insights
6. Low stock → klikni CSV download
7. Logout → /gss/scan musí redirectnout na /login
```

## Troubleshooting

- **Login OK ale `/gss/scan` 401** → middleware nestihne refreshnout cookie. Zkontroluj že `middleware.ts` matcher zahrnuje `/gss/*`.
- **`/auth/callback` 4xx** → Supabase Redirect URLs nezná production doménu (viz výše).
- **CSV stáhne se s krakatici** → Excel špatně čte UTF-8 bez BOM. Implementace BOM už přidává; pokud problém, zkontroluj že CSV začíná `﻿` byte sekvencí.
- **Build fail kvůli RLS view types** → regeneruj `src/lib/database.types.ts` přes Supabase CLI/MCP, commitni.
