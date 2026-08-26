# Studio Two

Production-ready foundation for Studio Two's public site, customer portal, administrative operations, and transactional booking platform. Delivery is intentionally phased; the current milestone is Phase 1.

## Stack

Next.js 16 App Router, TypeScript, Tailwind CSS 4, React 19, Supabase Auth/PostgreSQL/Storage, React Hook Form, and Zod. Vercel hosts the application; Supabase owns persistence and authorization.

## Local setup

1. Install Node.js 20 or newer and the Supabase CLI.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in development credentials.
4. Run `supabase start`, then `supabase db reset`.
5. Run `npm run dev`.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, Paystack secrets, webhook secrets, or email provider keys in client code. Only explicitly public values use `NEXT_PUBLIC_`.

## Database and admin setup

All schema changes live in `supabase/migrations`. The auth trigger creates a customer profile for every registration. After registering the first owner, verify their UUID in Supabase and promote it using the statement documented in `docs/database.md`. Do not accept a role from registration metadata.

## Verification

Run `npm run lint` and `npm run build`. Before production, also run local migrations, RLS integration tests, auth acceptance tests, accessibility checks, and provider webhook tests as those phases are implemented.

## Deployment

Create separate Supabase projects or configuration for development, preview, and production. Configure matching Vercel environment variables and auth redirect URLs. Production payment webhooks must target the production application URL and be signature-verified before state changes.

See `docs/architecture.md`, `docs/database.md`, `docs/security.md`, and `docs/roadmap.md` for boundaries and phased implementation.
