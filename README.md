# WhisperKL

WhisperKL is an anonymous-to-students communication platform for KL University. The platform retains authenticated ownership records for moderation and abuse prevention; anonymous does not mean untraceable to the platform.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Supabase Auth/Postgres/Realtime, and Zod.

## Local setup

1. Install Node.js 20 LTS or newer from https://nodejs.org/.
2. Run `npm install`.
3. Create a Supabase project at https://supabase.com/.
4. In Supabase Auth, enable email OTP or magic links and configure `http://localhost:3000/auth/callback` as a redirect URL.
5. Copy `.env.example` to `.env.local` and enter the project URL and publishable key. Keep `SUPABASE_SECRET_KEY` server-only; never prefix it with `NEXT_PUBLIC_`.
6. Run `supabase/migrations/0001_initial.sql` in the Supabase SQL editor or with the Supabase CLI.
7. Run `npm run dev` and open `http://localhost:3000`.

`src/config/site.ts` is the single source for the site name, college name, email domain, admin email, theme color, and metadata description. The email domain check is centralized in `isCollegeEmail`.

## Commands

- `npm run dev` starts development.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs strict TypeScript checking.
- `npm run build` creates a production build.
- `npm run start` serves the production build.

## Product checks

Test college-email rejection and OTP login, onboarding department/year, anonymous post creation (maximum 500 characters), paginated replies, reactions, reports, and realtime room updates with two authorized test accounts. Confirm that public responses contain only anonymous labels and approved fields. Run the defensive checks in `SECURITY.md`.

The initial admin email is configured in `src/config/site.ts`, but production admin authorization must be implemented with a server-side allowlist/role claim or protected database table; never trust an email or role from browser input.

## Cloudflare deployment

Deploy the Next.js app to a supported host, point a Cloudflare DNS record at the deployment, use Full (strict) TLS, enable WAF managed rules, configure rate limits for authentication and write endpoints, and keep the origin protected where the hosting provider supports it. Cloudflare improves resilience but does not make a site impossible to attack. Configure Supabase Auth redirect URLs for the production domain.

## Secrets and incident response

`.env.local` and production secret stores must not be committed. If a Supabase secret is exposed, rotate it immediately in Supabase, update the deployment secret, review logs and policies, and invalidate affected sessions. Do not use a service-role key in browser code.
