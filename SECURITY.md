# Security checklist

Defensive checks to run against a local or staging deployment:

1. Unauthenticated users receive a redirect or `401` on protected pages/API routes.
2. A normal user cannot access admin pages or moderation responses.
3. Changing `user_id` in a request cannot create content for another account.
4. Editing another user's post is rejected by RLS.
5. Private profile fields are never returned from public queries.
6. `<script>alert(1)</script>` renders as text, never HTML.
7. SQL-like input is treated as data through Supabase parameterization.
8. More than 5 posts/minute returns `429`.
9. More than 20 replies/minute returns `429`.
10. More than 10 reports/minute returns `429`.
11. Deleted posts are absent from public reads.
12. Banned users cannot create posts or replies.
13. Admin endpoints verify authorization server-side.
14. Invalid room UUIDs are rejected by Zod and foreign keys.
15. Oversized JSON/content requests are rejected.

Never run these checks against production without authorization. Rotate any credential that reaches source control or client bundles.
