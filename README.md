# WhisperKL

WhisperKL is an anonymous-to-students communication platform for KL University. Students authenticate with a verified `@kluniversity.in` address, but other students see only a generated anonymous label. The platform still retains the authenticated owner internally for moderation, bans, rate limiting, and abuse prevention.

> Anonymous to students does not mean untraceable to the platform.

## Maintainer Handoff

This document is written for a developer or coding agent continuing the project. Read it before changing authentication, Supabase policies, posts, rooms, or messaging.

### Source of truth

- The application lives in `D:\Brave Downloads\SEM 2-1\FED\New folder\lms\klwishper`.
- The old Moodle browser extension is in the parent `lms` directory and is unrelated.
- The GitHub repository is `https://github.com/rittik48/klwishper.git`.
- The production host is Vercel. The current public domain is configured outside the source code.
- Never use the Desktop starter copy at `C:\Users\Lenovo\Desktop\klwishper` as the application source.
- `.env.local` is ignored and must never be committed or pasted into chat.

## Technology

- Next.js App Router 16
- React 19
- TypeScript with strict checking
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, RLS, and server-side RPCs
- `@supabase/ssr` for cookie-aware browser/server clients
- Zod for request validation
- Lucide React icons

Commands:

```powershell
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

Use a different port when needed:

```powershell
npm run dev -- --port 3001
```

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Only the first two Supabase variables are used by browser/server client creation. `SUPABASE_SECRET_KEY` is reserved for future server-only administrative work and must never appear in client code or receive a `NEXT_PUBLIC_` prefix.

Production variables belong in Vercel Project Settings → Environment Variables for Production, Preview, and Development as appropriate. Redeploy after changing them.

## Central Configuration

Edit `src/config/site.ts` to change branding in one place:

- `name`
- `version`
- `collegeName`
- `emailDomain`
- `adminEmail`
- `primaryColor`
- `description`

`isCollegeEmail()` is the single email-domain validation function. Do not duplicate the domain string in components or API routes.

## Application Flow

### First-time signup

1. User opens `/login` and selects **Sign up**.
2. The browser validates that the email ends with `@kluniversity.in`.
3. Supabase sends one verification email using `signInWithOtp()`.
4. The user releases the email from quarantine and clicks the newest link once.
5. `/auth/callback` exchanges the code/token for a cookie session.
6. The callback checks whether a `profiles` row exists.
7. A new user is sent to `/onboarding`.
8. Onboarding calls `supabase.auth.updateUser({ password })` and `PUT /api/profile`.
9. The server derives year and branch from the verified email student ID, creates/updates the profile, and redirects to `/home`.

Passwords are handled and hashed by Supabase Auth. WhisperKL never stores plaintext passwords.

### Returning login

1. User selects **Log in**.
2. User enters college email and password.
3. Supabase `signInWithPassword()` creates the session.
4. The client navigates to `/home`.
5. There is no automatic logout in the application.

### Session handling

- `src/lib/supabase/browser.ts` creates the browser client.
- `src/lib/supabase/server.ts` creates the cookie-aware server client.
- `src/middleware.ts` refreshes sessions when Supabase environment variables exist.
- Protected server pages call `supabase.auth.getUser()` and redirect to `/login` when unauthenticated.
- The callback must remain an allowed Supabase redirect URL.

Required local callback:

```text
http://localhost:3000/auth/callback
```

Required production callback:

```text
https://YOUR-DOMAIN/auth/callback
```

## Anonymous Identity

`src/lib/student-id.ts` detects profile data from the verified email local part.

- The first two student-ID digits are treated as the batch year.
- Academic year is calculated as `current calendar year - batch year + 1`, with a minimum of first year.
- Branch detection currently maps the first matching code after the first two digits:
  - `8` → `AI & DS`
  - `3` → `CSE`
  - `6` → `ECE`
  - `9` → `CSIT`
- Unknown values become `Undeclared`.

The generated label is stored in `profiles.anonymous_label` and is shown in posts, profile UI, feed results, and messaging UI. `/api/profile` supports refreshing the label. No email, student ID, or auth UUID should be sent to normal-user UI responses.

If the college ID format changes, update `src/lib/student-id.ts` and add tests before changing the database model.

## Route Map

### Public pages

- `/` futuristic landing page with sample feed
- `/preview` public sample preview for signed-out users; signed-in users see their own public posts
- `/login` sign-up and password login
- `/verify` verification placeholder
- `/not-found`, `/error`, `/loading` shared states

### Authenticated pages

- `/home` private signed-in dashboard with public feed, composer, rooms, search, and messaging
- `/onboarding` verified-user profile/password setup
- `/profile` anonymous label, detected year, and branch
- `/rooms`, `/rooms/[id]` room surfaces
- `/post/[id]` post surface
- `/settings` settings placeholder

### Admin surfaces

- `/admin`
- `/admin/reports`
- `/admin/users`
- `/admin/posts`

These pages currently describe the moderation surface but require a complete server-side admin role implementation before production use. Never authorize admin access from a browser-provided email, flag, or query parameter.

## API Map

All write APIs use the cookie-authenticated Supabase server client. They must validate the actual session with `auth.getUser()` before touching data.

- `POST /api/posts`: creates a post after Zod validation and rate limiting.
- `GET /api/feed`: calls the public-feed RPC and returns anonymous labels only.
- `POST /api/replies`: creates a reply.
- `POST /api/reports`: creates a moderation report.
- `GET /api/rooms?q=...`: searches discoverable rooms.
- `POST /api/rooms`: creates a public/private room owned by the user.
- `POST /api/rooms/join`: joins an allowed public room.
- `DELETE /api/rooms?id=...`: deletes only a room owned by the authenticated user.
- `GET/PATCH/PUT /api/profile`: reads/refreshes/completes the authenticated profile.
- `POST /api/conversations`: starts a private conversation by anonymous label.
- `GET/POST /api/messages`: reads or writes participant-protected messages.

Do not return raw Supabase rows when they contain `user_id`, email, auth metadata, or moderation fields. Prefer explicit `.select()` lists and anonymous-label RPCs.

## Database and Migration Order

Migrations are in `supabase/migrations` and must be run in order in Supabase SQL Editor or through the Supabase CLI:

1. `0001_initial.sql`
   - Creates profiles, rooms, posts, replies, reports, bans, reactions.
   - Adds indexes and initial RLS policies.
   - Seeds General, College, Departments, Subjects, Hostel, and Events rooms.
2. `0002_user_rooms.sql`
   - Adds authenticated room insert policy.
3. `0003_anonymous_labels.sql`
   - Adds and backfills `profiles.anonymous_label`.
4. `0004_owned_groups.sql`
   - Adds `rooms.owner_id`.
   - Adds owner-only room deletion policy.
   - Adds defaults for profile fields used by automatic bootstrap.
5. `0005_feed_rooms_messages.sql`
   - Adds room visibility/discoverability/join controls.
   - Adds room memberships.
   - Adds conversations, conversation members, and messages.
   - Replaces permissive room/post policies with public-or-member checks.
   - Adds `public_feed`, `search_public_rooms`, `start_conversation`, and `conversation_messages` RPCs.

Paste SQL contents, not filenames. If an earlier migration was already applied, do not rerun the original migration blindly. Run the next migration only.

### Important RLS invariants

- Public posts are readable through the authenticated public-feed RPC.
- Private-room posts require owner/member access.
- Public room metadata is searchable when discoverable.
- Private room metadata can be discoverable, but private content requires membership.
- Private messages require conversation membership.
- Post creation requires ownership and room access.
- Group deletion requires ownership.
- Anonymous-label RPCs deliberately hide raw user identity from normal clients.

## Main Feed Root Cause and Fix

The earlier `/home` implementation only rendered the composer and never queried posts. Also, the original profiles policy allowed users to read only their own profile, so directly joining posts to profiles from a client query would either fail or expose the wrong data.

The fix is `public_feed(page_size)`, a restricted `security definer` RPC that joins posts, public rooms, and profiles server-side and returns only:

- post ID
- content
- timestamp
- room ID/name
- anonymous label

`/home` calls this RPC and renders `PublicFeed`. Private-room posts are excluded by the RPC and protected separately by RLS.

## UI Components

- `components/home-actions.tsx`: authenticated post and room creation/delete controls.
- `components/public-feed.tsx`: global public feed cards.
- `components/room-search.tsx`: search and join UI with loading/empty states.
- `components/messaging-panel.tsx`: anonymous-name conversation starter and message composer.
- `components/anonymous-identity.tsx`: refreshable anonymous name.
- `components/account-access.tsx`: sign-up/login modes.
- `components/account-setup.tsx`: password setup after verification.
- `components/theme-toggle.tsx`: persistent light/dark mode.

## Local and Production Setup

1. Open the D: project folder, not the Desktop copy.
2. Install Node.js 20+.
3. Run `npm install`.
4. Configure `.env.local`.
5. Run all five migrations in order.
6. In Supabase Auth, enable Email provider and email confirmation.
7. Configure SMTP if default Supabase email delivery rate limits are reached.
8. Add local and production callback URLs.
9. Run `npm run lint`, `npm run typecheck`, and `npm run build`.
10. Push `main` to GitHub.
11. Vercel deploys automatically.
12. Configure the same environment variables in Vercel.
13. Set Supabase Site URL to the production domain.
14. Add the production `/auth/callback` redirect URL.
15. Redeploy after environment-variable changes.

## Multi-user Acceptance Tests

Use two real, authorized college accounts.

### Public post

1. User A signs in and posts to a public room.
2. Confirm the API returns success.
3. User B signs in or refreshes `/home`.
4. User B sees the post with an anonymous label, not A’s email/student ID.

### Public room

1. A creates a public discoverable room.
2. B searches by name or description.
3. B joins the result.
4. B can read/create room posts after membership.

### Private room

1. A creates a private room.
2. B cannot read its posts.
3. B cannot join it through public join.
4. A must be given a future approval/invitation management flow before B can access it.

### Private messages

1. A starts a conversation using B’s anonymous label.
2. A and B can read messages.
3. A third user cannot read the conversation ID or messages through the APIs.
4. No response contains email, student ID, or raw auth identity.

### Student-ID profile

1. Verify a student email such as `2500080048@kluniversity.in`.
2. Complete password setup.
3. Confirm profile stores a calculated year and detected branch.
4. Confirm profile UI shows only anonymous label, year, and branch.

## Known Limitations / Next Work

- Supabase Realtime subscriptions are not yet wired into the UI; current feed/search updates happen through request/refresh.
- Private-room invitation/approval management is not yet implemented. The database supports membership states, but only public joins and owner creation are currently exposed.
- Admin authorization and moderation actions need a dedicated server-side role table or protected claims implementation.
- Reactions/replies exist in the schema and APIs, but the public feed currently displays zero placeholders until those interactions are wired into the feed query.
- The in-memory rate limiter is per server instance. Production should add a durable limiter using Supabase/Redis/Cloudflare.
- The student-ID branch rule currently uses the first matching branch digit after the batch prefix. Confirm the official ID format before relying on it for academic records.
- `0005_feed_rooms_messages.sql` should be reviewed in a staging Supabase project before production because it changes RLS policies.

## Security Rules for Future Agents

- Never add an unauthenticated admin/backdoor login.
- Never trust browser-provided `user_id`, role, admin flag, email, or ownership.
- Never expose `SUPABASE_SECRET_KEY` to client code.
- Never select `*` from private tables for public responses.
- Never return email, student ID, auth UUID, IP, or moderation fields to ordinary users.
- Render user content as text; do not allow arbitrary HTML.
- Preserve RLS when adding tables or RPCs.
- Add a migration for schema changes; do not silently rely on a local database.
- Run lint, typecheck, and build after changes.
- Test with two authenticated users before claiming cross-user visibility works.

## Incident and Secret Rotation

If a Supabase secret, SMTP credential, or production token is exposed:

1. Rotate it immediately in the provider dashboard.
2. Update Vercel and local secret stores.
3. Redeploy.
4. Review Supabase Auth/API logs.
5. Invalidate affected sessions if necessary.
6. Never commit `.env.local` or provider credentials.
