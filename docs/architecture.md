# Architecture

Studio Two is one Next.js App Router application with public, customer, and administrative route groups backed by Supabase. PostgreSQL is the source of truth. Critical availability, pricing, holds, payment finalization, and reservation operations belong in transactional database functions, never browser code.

## Boundaries

- Browser: rendering, forms, optimistic interaction; never authoritative business decisions.
- Next.js server: authenticated orchestration, provider integrations, invoices, notifications.
- PostgreSQL: constraints, RLS, concurrency control, pricing snapshots, inventory and booking integrity.
- Supabase Auth/Storage: identity and managed assets.

Delivery follows the phases in the product brief. Phase 1 intentionally contains shells and security foundations, not pretend booking functionality.
