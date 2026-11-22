# CLAUDE.md

# PEOPLE OF ANYWHERE — A LIVING GAME WORLD FOR YOUR CITY

You are working on a beautiful, game-quality 3D social world set in a city.

The shipped city is **Anywhere**: fictional districts, fictional shops, fictional sample people. Whoever cloned
this repo is turning it into *their* city. Help them do that, and keep it feeling like a real, polished game.

This is NOT a 3D directory.
This is NOT a LinkedIn clone with 3D avatars.
This is NOT an AI-generated-looking city.
This is NOT a generic Three.js demo.

> "LinkedIn, but instead of scrolling through people, you walk through your city and discover them."

---

# 1. CORE IDEA

People enter a stylised 3D version of the city. Designers and builders live in it as characters.

Each person has: an avatar and look, name, role, company, portfolio, X, LinkedIn, what they're building,
open-to-work, a status note, and the district where they hang out.

Visitors can walk around, discover people, search for them, walk up, open profiles, and connect.

The city is the interface. The people are the network.

North star — the first reactions should be:

1. "Wait, what is this?"
2. "I want to explore."
3. "These are real people?"

---

# 2. ART DIRECTION (MANDATORY)

**design.md is the single source of truth for how the game looks.** Read the relevant sections before writing or
changing any visual code: 3D world, characters, props, lighting, UI, HUD, menus, nameplates, effects.
**sounddesign.md** is the same for anything you hear.

Target: Overwatch-quality stylised art (proportions, stylised PBR materials, colour discipline, lighting, render
quality), set in the city. Mobile hero-game lobbies are a secondary reference for HUD structure only, never their
purple/neon palette. Take the craft, never the IP: no characters, logos, UI, assets or settings from any game.

The world should feel: beautiful, playful, cinematic, colourful, polished, handcrafted, character-driven.
It should NOT feel: photorealistic, corporate, low-poly, procedural, neon/cyberpunk, like a SaaS dashboard,
like a Three.js experiment, or AI-generated.

Before a large visual change, say "design.md reviewed." and name the principles you are applying.
If a technically convenient implementation conflicts with design.md, the design wins.

## Stylised city language

REAL CITY + GAME ART DIRECTION = STYLISED CITY. Recognisable, not a Google Maps copy. Use the city's real
signifiers (buses, street food, signage, trees, kerbs, transit, building types) exaggerated and simplified.
design.md §6.2 holds the list; when making your own city, write your own list first.

## Non-AI-slop principle

No random procedural buildings, mixed architectural styles, unexplained floating objects, random neon, inconsistent
character styles, AI-looking textures or decorations without purpose. Every object has a reason to exist.
A smaller beautifully designed world beats a large generic one.

## Asset pipeline

- Environment (buildings, roads, trees, street furniture): built in code from a hand-arranged kit of bevelled pieces (src/city/kit/). No raw boxes.
- Characters: image-to-3D → Mixamo rig and animation → GLB. Never built from primitives.
- Hero props (vehicles): image-to-3D → GLB, re-tuned to the palette.
- Every asset file must be CC0 or owned, and listed in public/models/CREDITS.md or public/audio/CREDITS.md.

---

# 3. MAKING IT YOUR CITY

Everything city-specific lives in a few places:

| What | Where |
|---|---|
| City name, domain, time zone, locale, phone country code, site name and description | src/config/site.ts |
| Districts: names, identity lines, accents, which are built, onboarding order, typed areas | src/city/districts/registry.ts |
| Rooms on the live server (one per built district; the first is the default district) | shared/net/config.ts `ROOM_DISTRICTS` |
| A district's scene | src/city/districts/<id>/ (layout.ts, World.tsx, props) and src/city/kit/ |
| Shop signs, landmarks, hangout spots | each district's layout.ts / index.ts (src/city/districts/<id>/), src/city/people/spots.ts |
| Sample people (bots) and real residents shown before they join | src/city/people/profiles.ts |
| Palette | src/config/palette.ts (keep in step with design.md §2) |
| Styles | src/styles/*.css, one file per screen or feature |
| Settings without a release (invites per member, fees, connect limits) | the `app_settings` table |

Rules:

- A district going live: `built: true` in the registry, its World in src/city/districts/DistrictWorld.tsx, and its id in
  `ROOM_DISTRICTS`. registry.test.ts enforces this. The room server (realtime/) must deploy with it.
- District ids are lowercase letters only (they name live rooms: `shore#1`).
- `profiles.location` stores a district's display name (or an area typed by hand, or "@City" for elsewhere). If you
  rename a district after people joined, update their rows too.
- RESIDENTS are real people shown with their consent before they have an account: no CONNECT, no status written on
  their behalf, real links only. A resident disappears once the real person joins (src/city/people/residents.ts, tested).
- Sample PEOPLE are fictional bots and retire once enough real members are approved (src/city/people/directory.ts).

---

# 4. WHAT'S BUILT

## The world

- Third-person controller, camera, walk/run, collision, touch controls.
- Districts connected by portals (src/city/districts/, src/city/portal/Portal.tsx). Only the active district is loaded.
  Walking into a portal opens WHERE TO?; travel plays a full-screen title-card transition.
- Layout: src/city (world, kit, districts, people, audio, atmosphere, live, portal, wayfinding), src/hud (screens),
  src/membership (gate, invites, sign-in), src/profile, src/social (connect, chat), src/missions, src/admin,
  src/server (server-only code), src/config (site, palette), src/styles.
- Built districts: The Shore (default; beach, lighthouse, the HELLO letters), Design Quarter (startup street, the
  canteen, café, park), Makers Row (avenue, co-working, mural wall). The rest are "coming soon" in the portal.
- Day and night on the city's real clock (TIME_ZONE): src/city/atmosphere/daylight.ts, clock.ts. `?time=19:30` freezes it.
  At night only real light sources emit. Tested in daylight.test.ts.
- Sound: generative music in code (src/city/audio/music.ts), synthesized UI sounds and city ambience. One key
  (D major) and one motif (D–F#–A–D) for every UI sound and stinger. No sound without a visible source or a clear
  purpose. Sound starts after the first click; M mutes.

## People

- Nameplates, proximity, [E] VIEW PROFILE, the profile panel, search (FIND SOMEONE) that walks you to a person,
  city-wide (it routes you through the portal).
- Status notes (≤ 100 characters + one emoji, optional expiry) on the nameplate. Stored as `note_*` on profiles
  ("status" in the table is approval).

## Getting in (the gate)

Everyone can walk around and look. To be seen, you get in:

- **Ghost** by default: walks, looks, searches, but nobody sees them.
- **BECOME VISIBLE** (V) opens the gate first, then a character-creation flow over the live street.
- **Invite code** (`ANY-` + 6 characters): instant, no review. Every member gets codes (`invites_per_member`).
  Founder codes are made on /admin → INVITES.
- **Apply to join**: profile + one question (WHY HERE?), then a human reviews on /admin (ACCEPT / REJECT).
  `APPLICATIONS_FREE` in src/membership/applyFlags.ts: free by default; set it to false to charge through Dodo Payments.
- Sign-in is by emailed code only (src/membership/otp.ts, src/hud/membership/CodeEntry.tsx).
- `?gatepreview` runs every gate screen on local mocks.

## Connect and chat

- CONNECT from a profile: pick why (coffee, work, ideas, build, hang out) + an optional note. They accept → match →
  a 1:1 chat. A decline is never shown to the sender.
- Only matched members chat. Block, unmatch, report in the chat's ••• menu. Admins never read chats, only reports.
- src/social/connect.ts is the store, src/social/connections.ts holds the rules (tested), src/social/chat.ts the threads and live channel. The UI is in src/hud/social/.
- Emails: request, match, unread-message digest (cron), welcome, invitee joined, application received/approved.

## Live city (multiplayer presence)

- Approved members see each other move live. Positions go through Cloudflare Workers + Durable Objects (realtime/):
  one Room per district shard (≤ 150), one City object for counts and shard choice. Binary wire format
  (shared/net/protocol.ts). Nothing positional is stored.
- Login: the Supabase token in the first WebSocket message, verified against the project's public keys.
  Approved members only.
- Without NEXT_PUBLIC_REALTIME_URL (or with the server down) everyone simply wanders; the game works the same.

## Day Zero missions

Four first missions for a new member (set a status, connect, take the portal, share an invite):
src/missions/rules.ts (tested), src/missions/store.ts, src/hud/play/Missions.tsx. `?missionspreview` shows them.

---

## The pause (waitlist) and the city pulse

- `CITY_PAUSED` in src/membership/waitlist.ts (default false). When true the title screen (src/hud/play/Intro.tsx) is a
  notice modal with an email field and no ENTER. Emails go to `public.waitlist` through /api/waitlist (service role;
  clients have no write access, only admins read it) and are listed on /admin → WAITLIST (COPY EMAILS, EXPORT CSV).
  Joining twice changes nothing. Off production `?unpause` bypasses it. To let people in, send founder codes.
- The notice also shows a pulse panel (members and recruiters online, people waiting) read from `public.city_pulse`
  every 30 s, only while paused. It shows whatever the operator's script writes: scripts/pulse is an optional
  *simulator* of growing numbers. Prefer real counts; if you use the simulator, you are showing invented figures.
- No rate limiting on /api/waitlist; revisit if it gets spammed.

---

# 5. DATA (SUPABASE)

- The whole schema is one file: supabase/migrations/20261114000000_setup.sql (tables, RLS, functions, grants, the
  scheduled job). Its header lists what to set by hand. Later changes are new migration files after it.
- Row-level security everywhere: anyone reads approved profiles; people write only their own rows; nobody approves
  themselves. connections, messages, blocks have no client access at all: everything goes through
  security-definer functions.
- Grants are explicit: newer Supabase projects don't open tables to the API by default. A new table needs its
  grants in its migration.
- Later migrations: 20261114120000_waitlist.sql (public.waitlist) and 20261115120000_city_pulse.sql (public.city_pulse), both after the setup file.
- Admins live in public.admins (added by hand); is_admin() gates admin functions.
- Keep staging and production in separate databases. Never point local dev or a preview at production.

# 6. EMAILS (RESEND)

- App emails are Resend templates, sent by alias with variables: src/server/email/send.ts. Every template's
  alias and variables are listed in src/server/email/templates.ts. Every variable a template uses must be sent.
- Values are inserted as-is, so the server strips < and > from every value. Never put a member-supplied variable
  inside an HTML attribute.
- Never include contact details, message text, application answers or anything private to someone else.
- Sign-in codes are sent by Supabase Auth (Confirm signup + Magic Link templates carrying {{ .Token }}), routed
  through Resend SMTP.

# 7. SEO

Only production (https://DOMAIN) is indexed. Every other deployment answers `X-Robots-Tag: noindex`
(next.config.ts). The admin page lives on admin.DOMAIN (src/proxy.ts). Analytics loads only on production
(GA_ID in src/config/site.ts).

---

# 8. RULES FOR EVERY FEATURE

- Works on touch as well as keyboard + mouse, including with the on-screen keyboard. Typing never moves the player.
- Game UI, not SaaS UI: no glassmorphism, no dashboard cards, no web nav bars (design.md §10).
- Tests exercise real behaviour (vitest: `npm test`). Rules live in plain, tested functions; components stay thin.
- The website and the room server deploy separately: change the wire format compatibly.

# 9. QUALITY BAR

Before calling anything done:

1. Does this feel like a real game?
2. Is the art direction consistent?
3. Does the world feel intentionally designed?
4. Are the characters visually interesting?
5. Is the lighting beautiful?
6. Is the UI game-like?
7. Is there unnecessary visual noise?
8. Does anything look like a generic AI-generated asset?
9. Would someone screenshot this?
10. Would someone explore this world for 10 minutes without being asked to?

If not, improve the design before adding more functionality.

# 10. ABSOLUTE PRIORITY

Better game feel over more features. Better art direction over a bigger world. Better characters over more
characters. Better UI over more UI.

The goal is the first version that makes someone say: **"I want to live here."**

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
