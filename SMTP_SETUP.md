# Supabase SMTP setup — produkční email flow

Default Supabase Auth SMTP je rate-limited (~10 emails/hour, primárně pro dev). Pro produkci je třeba **vlastní SMTP** — jinak `signup` confirmation a `password recovery` emaily nedoputují uživatelům spolehlivě.

Tato příručka pokrývá konfiguraci kompletní email flow pro produkci.

---

## 1) Vyber SMTP provider

Doporučené možnosti (free/low-cost tier dostatečný pro MVP):

| Provider | Free tier | Setup difficulty | Doména |
|---|---|---|---|
| **[Resend](https://resend.com)** | 3 000 emails/měsíc | ⭐ nejjednodušší | nutná verifikace domény (SPF, DKIM, DMARC) |
| **[Postmark](https://postmarkapp.com)** | 100 emails/měsíc free, pak ~$10/mo | ⭐ jednoduché | transactional jen, vysoká deliverability |
| **[AWS SES](https://aws.amazon.com/ses)** | $0.10 / 1 000 emails | ⭐⭐⭐ AWS knowledge | sandbox mode na začátku |
| **[Brevo (Sendinblue)](https://brevo.com)** | 300 emails/den free | ⭐⭐ | univerzální |
| **[Mailgun](https://mailgun.com)** | $0.80 / 1 000 emails | ⭐⭐ | široce používáno |

Pro Gogrou MVP doporučuju **Resend** — clean API, super deliverability, dev-friendly dashboard.

---

## 2) Verifikuj doménu

Aby emaily neletěly do spamu, **vždy** posílej z vlastní domény (`noreply@gogrou.app` ne `noreply@resend.dev`). Nastavení DNS:

1. V SMTP provideru: **Add Domain** → `gogrou.app`
2. Provider vygeneruje DNS záznamy:
   - **SPF** — TXT `v=spf1 include:_spf.resend.com -all`
   - **DKIM** — TXT s public key (`resend._domainkey.gogrou.app`)
   - **DMARC** — TXT `v=DMARC1; p=quarantine; rua=mailto:dmarc@gogrou.app`
3. Přidej je do DNS (Cloudflare, Vercel DNS, Route 53, ...) a počkej na propagaci (5–60 min)
4. V SMTP provideru klikni **Verify** → status `Verified ✓`

---

## 3) Konfigurace Supabase

Supabase Dashboard → **Project Settings → Auth → SMTP Settings**

```
✓ Enable Custom SMTP

Sender:
  Email:  noreply@gogrou.app
  Name:   Gogrou

SMTP Provider Settings:
  Host:    smtp.resend.com         (pro Resend; jiné providery mají vlastní host)
  Port:    465                      (SSL) nebo 587 (STARTTLS)
  User:    resend                   (provider-specific; Resend = "resend")
  Pass:    re_••••••••              (API key z provideru)
  Min interval: 60 s                (rate limit per user)
```

Po **Save** Supabase pošle test email — pokud dojde do schránky, je hotovo.

---

## 4) Uprav email templates

Supabase Dashboard → **Authentication → Email Templates**

Pro Gogrou je relevantní:

### Confirm signup
```html
<h2>Vítej v Gogrou</h2>
<p>Klikni níže pro potvrzení svého emailu a aktivaci účtu:</p>
<p><a href="{{ .ConfirmationURL }}">Potvrdit email</a></p>
<p>Pokud jsi se neregistroval/a, ignoruj tuto zprávu.</p>
<hr>
<small>Gogrou — B2B platforma pro výrobní firmy. <a href="https://gogrou.app">gogrou.app</a></small>
```

### Magic Link (volitelně — pokud aktivuješ passwordless)
```html
<h2>Přihlášení do Gogrou</h2>
<p>Klikni pro přihlášení:</p>
<p><a href="{{ .ConfirmationURL }}">Přihlásit se</a></p>
<p>Tento link vyprší za 1 hodinu. Pokud jsi přihlášení nevyžádal/a, ignoruj zprávu.</p>
```

### Reset Password
```html
<h2>Reset hesla — Gogrou</h2>
<p>Někdo (snad ty) vyžádal reset hesla pro tento účet. Pokud to byls/a ty, klikni:</p>
<p><a href="{{ .ConfirmationURL }}">Nastavit nové heslo</a></p>
<p>Pokud ne, ignoruj zprávu — nic se nestalo.</p>
```

### Change Email
```html
<h2>Potvrzení změny emailu</h2>
<p>Potvrď změnu emailu kliknutím:</p>
<p><a href="{{ .ConfirmationURL }}">Potvrdit nový email</a></p>
```

> **Tip:** Supabase email templates podporují `{{ .Email }}`, `{{ .Token }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .ConfirmationURL }}`. Detaily v [Supabase docs](https://supabase.com/docs/guides/auth/auth-email-templates).

---

## 5) Test

```bash
# Sign up s reálným emailem (tvým, ne demo@gogrou.test)
curl -X POST https://wmvpcpkphhpyiiqsqvmh.supabase.co/auth/v1/signup \
  -H "apikey: <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"ty@example.com","password":"TestPass123!"}'
```

Měl bys obdržet **confirmation email z `noreply@gogrou.app`** do několika sekund. Klikni na link → přesměruje na `/auth/callback?code=…` → session se vytvoří, redirect na `/`.

---

## 6) Production checklist

- [ ] SMTP doména verified (SPF + DKIM + DMARC zelené)
- [ ] Custom SMTP enabled v Supabase Auth
- [ ] Site URL = `https://gogrou.app` (Auth → URL Configuration)
- [ ] Redirect URLs whitelist obsahuje produkční doménu + Vercel preview wildcard
- [ ] Email templates v CS lokalizaci uložené
- [ ] Min interval = 60 s (anti-spam)
- [ ] Rate limit hourly nastaven podle plánu providera
- [ ] Test signup + reset password reálně dojde + neletí do spamu (Gmail/Outlook test)
- [ ] DMARC report `dmarc@gogrou.app` mailbox aktivní (sleduj první týden)

---

## 7) Troubleshooting

**Email nedojde / spam:**
- Zkontroluj `Mail Tester` (mail-tester.com) — odešli test email a podívej se na skóre. Cíl: 9+/10.
- Většinou chybí **DMARC** nebo `noreply@` user neexistuje (některé providery to vyžadují).

**Confirmation link 404:**
- Site URL ≠ produkční doména. Oprav v Auth → URL Configuration.

**Rate limit dosažen:**
- Default Supabase = 10 emails/hour. Custom SMTP odstraňuje tento limit. Zkontroluj v Auth → Logs že emaily jdou přes tvůj provider, ne default.

**"Email not authorized" error:**
- Provider vyžaduje verifikaci sender adresy. V Resend dashboardu zkontroluj že `noreply@gogrou.app` je v "Verified senders".
