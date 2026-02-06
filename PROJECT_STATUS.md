# Gospel Lyrics — Suivi du Projet

## Résumé rapide
- **Objectif**: plateforme de paroles synchronisées (LRC) avec import LRC, éditeur tap‑to‑sync et lecteur synchronisé.
- **Stack**: Next.js 16 (App Router), TypeScript, Tailwind, Supabase (DB + RLS).
- **Audio**: **temporaire côté client** (aucun stockage).

## État actuel (fonctionnel ✅)
- Import LRC + preview audio local.
- Tap‑to‑sync (édition des timestamps) + génération LRC.
- Sauvegarde Supabase pour `songs` et `lrc_files`.
- RLS public optionnel pour tests locaux.
- Auth pages (login/signup) + header status.
- Liste des chansons + détail avec lecteur style Apple Music.
- Recherche + pagination basiques.
- Tests unitaires LRC parser.

## Architecture (fichiers clés)
- UI
  - `app/page.tsx` (landing)
  - `app/upload/page.tsx` (import LRC)
  - `app/sync/page.tsx` (tap‑to‑sync)
  - `app/songs/page.tsx` (liste)
  - `app/songs/[id]/page.tsx` (détail)
  - `app/auth/login/page.tsx`
  - `app/auth/signup/page.tsx`
  - `components/LrcUploadForm.tsx`
  - `components/LyricEditor.tsx`
  - `components/LyricPlayer.tsx`
  - `components/AppleLyricPlayer.tsx`
  - `components/AuthStatus.tsx`
  - `components/Header.tsx`
- Data
  - `lib/supabaseClient.ts`
  - `lib/supabaseData.ts`
  - `utils/lrcParser.ts`
  - `types/index.ts`
- Supabase
  - `supabase/schema.sql`
  - `supabase/rls.sql`
  - `supabase/rls_public.sql` (beta)
  - `supabase/rls_restrict.sql` (prod)
  - `supabase/repair.sql` (fix rapide)
  - `supabase/patch_audio_url.sql`
  - `supabase/patch_submitted_by.sql`

## Phases restantes (proposition)
### Phase 3 — Auth & profils
- ✅ Intégrer auth Supabase (login/signup).
- ⏳ Gérer profils utilisateurs (table `profiles`).
- ✅ Remplacer `rls_public.sql` par RLS stricte en prod (via `rls_restrict.sql`).

### Phase 4 — Gestion complète des chansons
- ✅ List + detail `songs`.
- ✅ Pagination & recherche.
- ⏳ Édition/suppression.

### Phase 5 — Validation & workflow
- Rôles (admin/validator).
- Workflow de validation des LRC (pending → approved).
- Historique (versions LRC) si utile.

### Phase 6 — UI/UX avancée
- ✅ Design moderne et responsive (Apple Music‑like pour lecteur).
- ⏳ Dark mode global.
- ⏳ Accessibilité complète.

### Phase 7 — Tests & CI
- ✅ Tests unitaires (parser LRC).
- ⏳ Tests intégration (Supabase inserts).
- ⏳ CI GitHub Actions.

### Phase 8 — Production
- Hardening RLS.
- Monitoring (Sentry).
- Documentation d’exploitation.

## Potentielles améliorations futures
- Export multi‑formats (SRT, WebVTT).
- Suggestion automatique de timestamps (IA).
- Collaboration temps réel.
- Favoris & collections.
- Statistiques d’usage.

## Notes techniques
- `songs` en DB peut exiger `slug` et `audio_url` (suivant le schéma).
- Le code crée un `slug` côté client et un `audio_url` placeholder (`local://temp-audio`).
- Si `audio_url` doit être facultatif, exécuter `supabase/patch_audio_url.sql`.
- Pour tests sans login, exécuter `supabase/rls_public.sql`.

## Checklist pour un nouveau dev
1) Installer deps: `npm install`
2) Ajouter `.env.local` (Supabase URL + anon key)
3) Exécuter SQL: `supabase/schema.sql`, `supabase/rls.sql`
4) (Optionnel) `supabase/rls_public.sql` pour tests locaux
5) Lancer: `npm run dev`

## Prochaines actions recommandées (court terme)
- Ajouter gestion profils.
- Ajouter édition/suppression chansons.
- Ajouter CI GitHub Actions.
