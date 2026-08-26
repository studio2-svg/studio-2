# Security

- Supabase SSR refreshes cookies at the request boundary; server components revalidate identity with `getUser()`.
- Route guards improve UX. PostgreSQL RLS remains the authorization boundary.
- Role elevation is never accepted from registration or profile input.
- Secrets have no `NEXT_PUBLIC_` prefix. `.env.example` contains placeholders only.
- Future payment webhooks must verify signatures, amounts, currency, booking identity, and idempotency before changing state.
- Audit records are append-only to normal authenticated clients.
