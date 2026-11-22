# People of Anywhere

**Walk your city. Meet the designers and builders who live in it.**

People of Anywhere is a stylised 3D city you can walk through, where every character is a real person. Instead of
scrolling through profiles, you explore streets, walk up to people, see what they're building, and connect.
It runs in the browser on desktop and phones.

This repo is a clean starting point. **Anyone can copy it, make it their own city, and host it themselves**, on
their own domain, with their own Supabase, Resend, Cloudflare and (optionally) Dodo Payments. A copy only ever
talks to the services you configure: nothing in here points at anyone else's deployment, so people who sign up on
your city end up in your database.

The city it ships with is **Anywhere**: three built districts (The Shore, Design Quarter, Makers Row), more "coming
soon", fictional shops and a cast of fictional sample people. Rename all of it.

## What's inside

- **The world**: a third-person game (React Three Fiber) with hand-built districts connected by portals, day and
  night on your city's real clock, generative music and city sound, touch controls.
- **People**: nameplates, profiles, status notes, search that walks you to a person.
- **Getting in**: everyone can walk around as an invisible ghost. To be seen, you get in with an invite code from a
  member, or apply and get reviewed on the admin page (free by default; optional paid applications).
- **Connect + chat**: ask to meet someone, they accept, you chat inside the city. Blocking and reports included.
- **Live city**: members see each other move in real time (Cloudflare Durable Objects).
- **Emails**: requests, matches, unread messages, welcome, application updates (Resend).

Stack: Next.js · React Three Fiber · Supabase (Postgres, Auth, Realtime) · Cloudflare Workers · Resend ·
Dodo Payments (optional) · Netlify or Vercel.

## Quick start (local, about 10 minutes)

You need Node 22+ and a free Supabase project.

```bash
git clone <your-fork-url> my-city
cd my-city
npm install
cp .env.example .env.local   # then fill in SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY
npm run dev                  # http://localhost:3000
```

Without Supabase keys the city still runs: you can walk around and meet the sample people. Sign-up, profiles and
everything social need the database (step 1 below).

## Setting up your own city

### 1. Supabase (database + sign-in)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the schema. It's one file: [`supabase/migrations/20261114000000_setup.sql`](supabase/migrations/20261114000000_setup.sql).
   Either paste it into the SQL editor and run it, or with the CLI:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. Copy the keys (Project Settings → API keys) into `.env.local`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY` (server only, never shipped to the browser).
4. Make yourself an admin. Sign up once in your city, then in the SQL editor:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@yourdomain.com';
   ```
5. Make founder invite codes, so the first people can get in: on `/admin` → INVITES, or
   `select public.issue_invites(null, 5);`
6. Auth settings (Authentication):
   - Sign-in is by **emailed 6-digit code**. In Email Templates, put the code in both *Confirm signup* and
     *Magic Link*, for example: `<h2>Your code</h2><p style="font-size:28px"><b>{{ .Token }}</b></p>`.
   - Set up custom SMTP with Resend (step 2) so the codes come from your domain.
   - URL Configuration: set the Site URL to `https://yourdomain.com` and add `https://admin.yourdomain.com/**` to
     Redirect URLs (and `http://localhost:3000/**`, `http://admin.localhost:3000/**` for local).
7. Scheduled job (the unread-message email): the setup file schedules it with pg_cron. Give it your site's address
   and a secret, in the SQL editor (never commit these):
   ```sql
   select vault.create_secret('https://yourdomain.com', 'site_url');
   select vault.create_secret('<a long random string>', 'cron_secret');
   ```
   Put the same random string in `CRON_SECRET` on your host.

Use a second Supabase project (or branch) for staging, and never point local dev or previews at production.

### 2. Resend (emails)

1. Verify your sending domain at [resend.com](https://resend.com) and create an API key → `RESEND_API_KEY`.
2. Create these templates (resend.com/templates), each with the alias and variables below, a From address on your
   domain and a Subject. Every variable listed must exist in the template's content:

   | Alias | Sent when | Variables |
   |---|---|---|
   | `connect-request` | someone asks to meet you | `EMOJI` `SENDER` `SENDER_FIRST` `VERB` `NOTE` `LINK` |
   | `connect-match` | they said yes | `EMOJI` `SENDER` `VERB` `LINK` |
   | `chat-message` | unread messages (never the text) | `SENDER` `SENDER_FIRST` `COUNT` `LINK` |
   | `invite-welcome` | you joined with an invite | `NAME` `INVITER` `INVITES` `LINK` |
   | `invite-joined` | someone used your invite | `NAME` `INVITEE` `ROLE` `LINK` |
   | `application-received` | an application was sent for review | `NAME` `LINK` |
   | `application-approved` | an admin accepted it | `NAME` `INVITES` `LINK` |

   The list lives in [`src/server/email/templates.ts`](src/server/email/templates.ts).
3. In Supabase → Authentication → SMTP, use Resend's SMTP settings so sign-in codes come from your domain too.

Without `RESEND_API_KEY` nothing is emailed and everything else still works.

### 3. Cloudflare (live multiplayer, optional)

The room server in [`realtime/`](realtime) lets members see each other move. Skip it and everyone simply wanders.

1. In [`realtime/wrangler.toml`](realtime/wrangler.toml), set for each environment: `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY` (the matching database) and `ALLOWED_ORIGINS` (your site's addresses). Rename the
   workers (`poa-presence…`) if you like.
2. Deploy:
   ```bash
   cd realtime && npm install && npx wrangler login && cd ..
   npm run rt:deploy:production     # and rt:deploy:staging for staging
   ```
3. Set `NEXT_PUBLIC_REALTIME_URL` on your host to the worker's URL (`https://poa-presence.<you>.workers.dev`).
4. Optional auto-deploy from GitHub: add the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, then set
   the repository variable `REALTIME_DEPLOY` to `true` ([`.github/workflows/realtime.yml`](.github/workflows/realtime.yml)).

Local: `npm run rt:dev` (port 8787) and `NEXT_PUBLIC_REALTIME_URL=http://localhost:8787`.

### 4. Hosting (Netlify or Vercel)

1. Import the repo. Build command `npm run build`.
2. Add the environment variables from [`.env.example`](.env.example): production values on Production, staging
   values on previews.
3. Connect your domain, plus `admin.yourdomain.com` (the review page) to the same production site.
4. Set `DOMAIN` in [`src/config/site.ts`](src/config/site.ts) to your domain. Only production is indexed by search
   engines; every other deployment answers `noindex`.

### 5. Dodo Payments (optional: paid applications)

Applications are free by default. To charge for them:

1. Create a product in [Dodo Payments](https://dodopayments.com) (test and live).
2. Set `APPLICATIONS_FREE = false` in [`src/membership/applyFlags.ts`](src/membership/applyFlags.ts).
3. Add `DODO_API_KEY` and `DODO_WEBHOOK_SECRET` on your host (test keys on previews, live on production), and a
   webhook pointing at `https://yourdomain.com/api/dodo/webhook`.
4. In the `app_settings` table, set `application_fee` (`{"amount": 1000, "currency": "USD"}` is 10.00 USD) and
   `dodo_product_id` (`{"test": "pdt_…", "live": "pdt_…"}`).

Rejecting a paid application refunds it automatically from the admin page.

## Making it your city

| What | Where |
|---|---|
| City name, domain, time zone, locale, phone country code, site name | [`src/config/site.ts`](src/config/site.ts) |
| District names, identity lines, colours, which are built | [`src/city/districts/registry.ts`](src/city/districts/registry.ts) |
| Live rooms (one per built district) | [`shared/net/config.ts`](shared/net/config.ts) |
| Each district's streets, shops and signs | `src/city/districts/<id>/` (`layout.ts`, `World.tsx`, props) and the shared kit in `src/city/kit/` |
| Sample people, and real people shown before they join (with consent) | [`src/city/people/profiles.ts`](src/city/people/profiles.ts) |
| Invite codes per member, connect limits, fees | the `app_settings` table |
| Palette | [`src/config/palette.ts`](src/config/palette.ts) |
| Styles (one CSS file per screen) | `src/styles/` |
| Art direction and sound | [`design.md`](design.md), [`sounddesign.md`](sounddesign.md) |

Start with the names, signs and time zone. Then rebuild one district at a time until it feels like your city.
Using Claude Code or another agent? [`claude.md`](claude.md) is written for it.

## Pausing the city (waitlist)

Set `CITY_PAUSED = true` in [`src/membership/waitlist.ts`](src/membership/waitlist.ts) and deploy to close the city
(it is `false` by default). The title screen becomes a notice with an email field; the addresses go to
`public.waitlist` through `/api/waitlist`, and you read them on `/admin` → WAITLIST (copy or export CSV, then send
founder codes). Run the migration `supabase/migrations/20261114120000_waitlist.sql` first. Off production, `?unpause`
bypasses the pause.

While paused, a small panel shows member and waiting counts from `public.city_pulse`
(`supabase/migrations/20261115120000_city_pulse.sql`). It shows exactly what is in that table. Write real numbers
to it. [`scripts/pulse/`](scripts/pulse) has an optional runner that *simulates* growing numbers; only use it if
you are comfortable showing invented figures to visitors.

## Commands

```bash
npm run dev          # the game, http://localhost:3000 (admin: http://admin.localhost:3000)
npm test             # tests
npm run build        # production build
npm run rt:dev       # the room server, locally
```

Handy flags: `?time=19:30` freezes the clock, `?gatepreview` shows every sign-up screen on mock data,
`?statuspreview`, `?missionspreview`.

## Credits

3D characters by Quaternius and the three.js robot (CC0), sound effects by Kenney (CC0): see
[`public/models/CREDITS.md`](public/models/CREDITS.md) and [`public/audio/CREDITS.md`](public/audio/CREDITS.md).
Music and UI sounds are synthesized in code.

## License

[MIT](LICENSE). Use it, change it, host it, make it yours.
