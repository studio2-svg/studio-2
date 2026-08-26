# Database

Migrations in `supabase/migrations` are the only schema source. Apply locally with `supabase db reset` and remotely through the Supabase migration workflow. Every exposed table must enable RLS and use explicit policies. The service role is server-only and bypasses RLS, so its use must be narrow and audited.

The first migration creates application roles, one-to-one auth profiles, safe profile RLS, and an append-only audit table. Promote the first owner explicitly in SQL after verifying their user id:

```sql
update public.profiles set role = 'owner' where id = '<verified-auth-user-uuid>';
```
