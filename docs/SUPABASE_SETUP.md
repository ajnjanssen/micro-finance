# Supabase setup

The app's hosted authentication uses Supabase Auth with Google and Microsoft
(the Supabase provider key for Microsoft is `azure`). Financial data must be
migrated to the user-scoped PostgreSQL tables before hosting is enabled.

## 1. Find the provider settings in Supabase

In the current Supabase dashboard, open **Authentication → Sign In / Providers**.
Choose **Google** or **Azure (Microsoft)** there. The older menu label
**Authentication → Providers** is no longer accurate.

## 2. Configure Google OAuth

1. In Google Cloud Console, create an OAuth client with application type **Web
   application**.
2. Set **Authorized JavaScript origins** to `http://localhost:3000`; later add
   the deployed site's origin (for example `https://your-site.netlify.app`).
3. In **Authorized redirect URIs**, add the Supabase callback URL displayed on
   the Google provider settings page. It has this form:
   `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy the Google client ID and client secret into the Google provider settings
   in Supabase and enable the provider.

## 3. Configure Microsoft OAuth

1. In Microsoft Entra ID, create an **App registration** and select the
   supported account types you want to allow.
2. Add a **Web** redirect URI using the Supabase callback URL displayed on the
   Azure provider settings page:
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Copy the **Application (client) ID** and create a client secret. Enter both
   in the Azure provider settings in Supabase and enable the provider.

These are OAuth-provider callback URLs; they point to Supabase, not to this
Next.js app. Supabase completes the provider exchange and then redirects back
to the application.

## 4. Configure application redirects

In Supabase, open **Authentication → URL Configuration**:

- Set **Site URL** to `http://localhost:3000` for local development.
- Add `http://localhost:3000/auth/callback` to the allowed redirect URLs.
- Before production use, add the deployed app callback URL, for example
  `https://your-site.netlify.app/auth/callback`, to the allowed redirect URLs.
- Update **Site URL** to the deployed app's canonical HTTPS origin when
  deploying.

For Google, also add the deployed origin (without `/auth/callback`) to
**Authorized JavaScript origins** in Google Cloud.

## 5. Configure local environment

Copy `.env.example` to `.env.local` and set the project URL and publishable
(or legacy anon) key from **Project Settings → API**. Never put a Supabase
secret/service-role key in a `NEXT_PUBLIC_*` variable or browser code.

## 6. Create database tables

Apply every SQL migration in `supabase/migrations` in timestamp order using the
Supabase SQL Editor or Supabase CLI. They enable Row Level Security and policies
that restrict each table row to the authenticated owner. New users start with
empty financial tables; this app does not copy local JSON files to Supabase.

Official guides: [Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
and [Microsoft/Azure sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-azure).

## Hosting readiness

Runtime financial API and service reads/writes now use the authenticated user's
Supabase records. Each new user starts with an empty administration; existing
local JSON data is not imported. Keep `SUPABASE_DATA_BACKEND_ENABLED` unset or
set to `false` until all SQL migrations have been applied and the production
build and two-user isolation checks have passed. In production this fails
closed: authenticated users cannot open the app or call its APIs while the
setting is disabled. Set it to `true` only after those checks.
