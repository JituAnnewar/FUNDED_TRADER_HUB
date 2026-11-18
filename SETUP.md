# SETUP

Step-by-step, with exact clicks. You do this once. It takes about 20 minutes.

The site already runs on Vercel at **https://funded-trader-hub.vercel.app**. Until Supabase is connected it shows sample data with a yellow "Demo data" banner. These steps connect your real database and admin login.

---

## 1. Create a free Supabase project

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub.
2. Click **New project**.
   - Name: `funded-trader-hub`
   - Database password: click **Generate a password**, then save it in your password manager.
   - Region: **South Asia (Mumbai)** (closest to India).
   - Plan: **Free**.
3. Click **Create new project** and wait about 2 minutes.

## 2. Create the tables (run the migrations)

1. In your Supabase project, open **SQL Editor** (left sidebar) → **New query**.
2. Open each file below from this repository on GitHub, click **Raw**, copy everything, paste it into the SQL editor and click **Run**. Do them **in this order**:
   1. `supabase/migrations/20261118000001_schema.sql`
   2. `supabase/migrations/20261118000002_security.sql`
   3. `supabase/migrations/20261118000003_import_presets.sql`
3. Each one should finish with "Success. No rows returned".

> Using the Supabase CLI instead? `supabase link --project-ref <ref>` then `supabase db push`.

The second file also creates the four storage buckets (`certificates`, `trade-screenshots`, `firm-logos`, `site-media`) and turns on Realtime for live P&L. You can check them under **Storage** and **Database → Publications**.

## 3. Turn off public sign-ups

**Authentication → Sign In / Providers** (or **Providers → Email**):
- Keep **Email** enabled.
- Turn **Allow new users to sign up** **off**.
- Save.

## 4. Create your admin user

1. **Authentication → Users → Add user → Create new user**.
2. Enter your email and a strong password. Tick **Auto Confirm User**. Click **Create user**.
3. Copy the new user's **UID** (click the user to see it).
4. **SQL Editor → New query**, paste this with your UID, and **Run**:

```sql
insert into public.admins (user_id) values ('PASTE-YOUR-UID-HERE');
```

## 5. Copy your keys

**Project Settings → API** (or **API Keys**):
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / publishable** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role / secret** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this one secret; never paste it into the browser or share it)

## 6. Add the keys to Vercel

1. Go to **https://vercel.com** → project **funded-trader-hub** → **Settings → Environment Variables**.
2. Add each of these (Environment: **Production**, **Preview** and **Development**):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from step 5 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 5 |
| `SUPABASE_SERVICE_ROLE_KEY` | from step 5 |
| `NEXT_PUBLIC_SITE_URL` | `https://funded-trader-hub.vercel.app` (or your own domain later) |
| `IP_HASH_SALT` | any long random text (e.g. from a password generator) |
| `CONTACT_EMAIL` | the address that should receive contact-form messages |
| `ADMIN_IDLE_TIMEOUT_MINUTES` | `30` |

3. **Deployments** → the latest one → **⋯ → Redeploy**.

## 7. Sign in and add data

1. Open **https://funded-trader-hub.vercel.app/admin** and sign in.
2. Optional: **Data & backups → Load demo data** to see the site full, then **Remove all demo data** before going live.
3. Follow **ADMIN_GUIDE.md** to add your firms, accounts and trades.

## 8. Turn on two-factor sign-in (recommended)

**Admin → Settings → Two-factor sign-in → Set up authenticator**, scan the QR code with Google Authenticator / 1Password / Authy and enter the code. From then on you'll be asked for a 6-digit code after your password.

(If Supabase asks, enable **Authentication → Multi-Factor → TOTP**. It is on by default.)

## 9. Run it on your computer (optional)

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Seed demo data from the command line instead of the admin button:

```bash
npm run seed            # add demo data
npm run seed -- --reset # remove old demo rows first
```

## 10. Custom domain (optional)

Vercel → project → **Settings → Domains → Add** → type your domain → follow the DNS instructions shown (usually one `A` record or a `CNAME`). Then update `NEXT_PUBLIC_SITE_URL` to the new address and redeploy.

## 11. Contact-form email with Resend (optional)

Without this, messages are still saved and appear in **Admin → Messages**.

1. **https://resend.com** → sign up (free) → **API Keys → Create**.
2. Add `RESEND_API_KEY` in Vercel. To send from your own domain, verify it in Resend and set `RESEND_FROM_EMAIL` (e.g. `Website <hello@yourdomain.com>`).
3. Redeploy.

## 12. Cloudflare Turnstile spam check (optional)

Honeypot and rate limiting (3 messages per 10 minutes per visitor) are always on. For extra protection:

1. **https://dash.cloudflare.com** → **Turnstile → Add site** → your domain.
2. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in Vercel and redeploy.

---

## Trade ingest endpoint (automation)

Push closed trades automatically from an MT4/MT5 Expert Advisor, a TradingView webhook relay or a sync service.

1. Set `INGEST_SECRET` in Vercel to a long random string and redeploy.
2. Find the account's ID: open the account in **Admin → Accounts**; the ID is the last part of the page address.

**Request**

```
POST https://funded-trader-hub.vercel.app/api/ingest/trade
Content-Type: application/json
X-Timestamp: <current Unix time in seconds>
X-Signature: sha256=<hex HMAC-SHA256 of "<X-Timestamp>.<raw body>" using INGEST_SECRET>
```

**Body**: one trade, or up to 500 in `trades`:

```json
{
  "account_id": "6f1c…",
  "external_ticket_id": "123456789",
  "symbol": "XAUUSD",
  "direction": "long",
  "opened_at": "2026-11-18T08:15:00Z",
  "closed_at": "2026-11-18T10:40:00Z",
  "entry_price": 2650.1,
  "exit_price": 2662.3,
  "size": 0.5,
  "stop_loss": 2640,
  "take_profit": 2680,
  "pnl": 610.0,
  "fees": 3.5,
  "risk_amount": 250
}
```

- `pnl` is gross profit; `fees` (commission + negative swap) is a positive number.
- Times must include a time zone (`Z` or `+05:30`).
- Re-sending the same `external_ticket_id` for the same account is ignored, so retries are safe.
- Requests older than 5 minutes are rejected (replay protection).

**Responses**: `200 {"ok":true,"inserted":1,"duplicates":0}` · `401` bad signature · `404` unknown account · `422` invalid payload · `503` ingest disabled.

**Test from a terminal**

```bash
BODY='{"account_id":"<id>","external_ticket_id":"t1","symbol":"EURUSD","direction":"short","opened_at":"2026-11-18T09:00:00Z","pnl":120,"fees":7}'
TS=$(date +%s)
SIG=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$INGEST_SECRET" -hex | sed 's/^.* //')
curl -X POST https://funded-trader-hub.vercel.app/api/ingest/trade -H "Content-Type: application/json" -H "X-Timestamp: $TS" -H "X-Signature: sha256=$SIG" -d "$BODY"
```

---

## Checking security (anon key cannot write)

In the Supabase **SQL Editor**:

```sql
set role anon;
insert into public.trades (account_id, symbol, direction, opened_at, pnl) values (gen_random_uuid(), 'X', 'long', now(), 1); -- must fail: permission denied
select ip_hash from public.contact_messages;                                                                        -- must fail: permission denied
select private_notes from public.trades;                                                                            -- must fail: permission denied
select public.submit_contact_message('Test', 'a@b.co', 'general', 'Hello', 'Testing the form', repeat('a', 64), 'sql'); -- returns ok
reset role;
```
