# Supabase setup

The app's hosted authentication uses Supabase Auth with Google and Microsoft
(the Supabase provider key for Microsoft is `azure`). Financial data must be
migrated to the user-scoped PostgreSQL tables before hosting is enabled.

## 1. Configure OAuth providers

In Supabase, open **Authentication → Providers** and enable Google and Azure.
For each provider, enter the OAuth client ID and secret created in that
provider's developer console. Use the callback URL shown by Supabase:

`https://<project-ref>.supabase.co/auth/v1/callback`

In the Google and Microsoft OAuth applications, register Supabase's callback
URL above as the redirect URI. In Supabase's **Authentication → URL
Configuration**, set the local app URL as the Site URL and allow
`http://localhost:3000/auth/callback`. Add the deployed HTTPS callback URL to
that allowlist before production use.

## 2. Configure local environment

Copy `.env.example` to `.env.local` and set the project URL and publishable
(or legacy anon) key from **Project Settings → API**. Never put a Supabase
secret/service-role key in a `NEXT_PUBLIC_*` variable or browser code.

## 3. Create database tables

Apply `supabase/migrations/20261101000000_initial_schema.sql` using the
Supabase SQL Editor or Supabase CLI. The migration enables Row Level Security
and policies that restrict each table row and private CSV-import object to the
authenticated owner. The import bucket is private; uploaded object paths must
begin with the authenticated user's UUID.

## Hosting readiness

The sign-in flow and schema are foundations only. Existing financial services
still use local JSON files, so do not deploy this version for multiple users:
users would not yet have separate financial records. The next migration step
must move every API/service read and write to the authenticated user's
PostgreSQL rows and import local JSON data explicitly for the intended user.
Keep `SUPABASE_DATA_BACKEND_ENABLED` unset or set to `false` in Netlify for now.
In production this fails closed: authenticated users cannot open the app or
call its APIs until the storage migration is complete. Set it to `true` only
after the file-backed services are removed and the end-to-end migration has
been verified.
