Gospel Lyrics is a Next.js 16 App Router project for synchronized lyrics (LRC). It uses Supabase for auth + database, and keeps audio upload client-side only (temporary, no storage).

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`.

## Environment Variables

Create `.env.local` from `.env.example` and set your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase SQL Scripts

Run these in Supabase SQL Editor:

- `supabase/schema.sql`
- `supabase/rls.sql`

For beta/testing without auth, you can optionally run:

- `supabase/rls_public.sql`

To restore strict policies in production, run:

- `supabase/rls_restrict.sql`

If you hit schema mismatch errors, run the repair script:

- `supabase/repair.sql`

## Audio Upload (Temporary)

Audio is handled client-side for preview/synchronization only. No storage bucket is required.

## Supabase Auth

Saving to Supabase requires an authenticated user unless you run `supabase/rls_public.sql` for beta.

### Auth Setup
1) In Supabase → Authentication → Providers: enable Email.
2) In Supabase → Authentication → URL Configuration:
	- Site URL: http://localhost:3000 (local)
	- Add redirect URLs if needed for production.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Routes

- `/` landing page
- `/upload` import LRC + preview
- `/sync` tap-to-sync editor
- `/songs` songs list + search + pagination
- `/songs/[id]` song detail with Apple Music-like lyrics view
- `/auth/login` / `/auth/signup`

## Vérification rapide (fonctionnalités)

1) Auth
	- Ouvrir `/auth/signup` → créer un compte
	- Se connecter via `/auth/login`
	- Vérifier que l’email apparaît dans le header

2) Import LRC
	- Aller sur `/upload`
	- Charger un `.lrc`, cliquer "Sauvegarder dans Supabase"
	- Vérifier dans Supabase → `songs` et `lrc_files`

3) Tap‑to‑sync
	- Aller sur `/sync`
	- Charger un audio local, synchroniser
	- Sauvegarder et vérifier dans Supabase

4) Lecture
	- Aller sur `/songs` puis `/songs/[id]`
	- Vérifier le lecteur Apple‑Music‑like et la synchro

## Deploy

Deploy to Vercel and set the Supabase environment variables in the project settings.

## Tests

Run unit tests for the LRC parser:

```bash
npm run test
```

## Dépannage (correction en une fois)

Si des erreurs de schéma apparaissent (colonnes manquantes, politiques publiques), exécuter :

- `supabase/repair.sql`

Puis relancer l’app.
