# Prompt technique — Reproduire Gospel Lyrics (état fonctionnel actuel)

Tu es un ingénieur full‑stack senior. Ta mission est de **reconstruire fidèlement** l’application ci‑dessous jusqu’aux fonctionnalités **déjà fonctionnelles**.  
Ne propose pas de refonte architecturelle, n’ajoute pas de fonctionnalités “nice to have”, et n’invente pas d’écrans non listés.

## 1) Objectif produit
Créer une plateforme web de paroles gospel synchronisées (format LRC) avec :
- import LRC,
- éditeur “tap‑to‑sync” style Musixmatch,
- lecteur synchronisé style Apple Music,
- persistance Supabase (DB + Auth + RLS),
- pages artistes + chansons,
- contrôle d’actions admin.

## 2) Stack technique obligatoire
- Next.js 16.1.6 (App Router)
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- Supabase JS v2 (`@supabase/supabase-js`)
- Vitest (tests unitaires du parser LRC)

Scripts npm attendus :
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test` (alias `vitest run`)
- `npm run test:watch` (alias `vitest`)

## 3) Contraintes de reproduction
- Reproduire **uniquement** l’état actuellement validé en production locale.
- Audio upload : **client-side temporaire uniquement** (pas de storage bucket serveur obligatoire).
- Garder un design Apple HIG-like (glassmorphism, transitions douces, layout moderne).
- Respecter une approche mobile-first (zones tactiles >= 44px, ergonomie smartphone).
- Conserver les routes et comportements listés.

## 4) Arborescence cible (minimum)
Créer les dossiers/fichiers suivants (noms exacts) :

- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/artists/page.tsx`
- `app/artists/[id]/page.tsx`
- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `app/songs/page.tsx`
- `app/songs/[id]/page.tsx`
- `app/sync/page.tsx`
- `app/upload/page.tsx`
- `components/AppleLyricPlayer.tsx`
- `components/AuthGuard.tsx`
- `components/AuthStatus.tsx`
- `components/Header.tsx`
- `components/LrcUploadForm.tsx`
- `components/LyricEditor.tsx`
- `components/LyricPlayer.tsx`
- `components/SearchBar.tsx`
- `components/SpotlightSearch.tsx`
- `lib/supabaseClient.ts`
- `lib/supabaseData.ts`
- `utils/lrcParser.ts`
- `utils/artistSlug.ts`
- `types/index.ts`
- `tests/lrcParser.test.ts`
- `supabase/schema.sql`
- `supabase/artists.sql`
- `supabase/rls.sql`
- `supabase/rls_public.sql`
- `supabase/rls_restrict.sql`
- `supabase/rls_admin_actions.sql`
- `supabase/patch_audio_url.sql`
- `supabase/patch_submitted_by.sql`
- `supabase/repair.sql`
- `supabase/admin_actions.sql`

## 5) Modèle de données Supabase (attendu)
Implémenter les tables/logique nécessaires pour supporter :

### `songs`
Champs utiles (minimum) :
- `id`
- `title`
- `artist`
- `slug`
- `audio_url` (placeholder autorisé: `local://temp-audio`)
- métadonnées de création
- `submitted_by` (si patch appliqué)

### `lrc_files`
Champs utiles (minimum) :
- `id`
- `song_id` (FK vers songs)
- `content` (texte LRC)
- métadonnées de création

### `artists`
Champs utiles (minimum) :
- `id`
- `name`
- `slug`
- `bio`
- `image_url`
- `featured` (bool)
- `social_links` (JSON/JSONB)
- `quote`, `latest_release` (ou équivalent)

### `profiles`
- liaison user auth → profil
- base pour gestion des rôles (admin/user)

## 6) Auth & sécurité attendues
- Auth Supabase email/password (`/auth/login`, `/auth/signup`).
- Header affiche l’état de connexion (`AuthStatus`).
- `AuthGuard` pour pages de contribution.
- Édition/suppression (sync/upload/corrections sensibles) en mode admin-only lorsque RLS admin est appliquée.
- Prévoir 2 modes RLS :
  - public/dev (`rls_public.sql`)
  - restrictif/prod (`rls_restrict.sql` + règles admin)

## 7) Fonctionnalités obligatoires (DoD)

### A. Upload LRC (`/upload`)
- Import d’un fichier `.lrc`.
- Preview et validation du contenu.
- Sauvegarde Supabase dans `songs` + `lrc_files`.

### B. Éditeur tap‑to‑sync (`/sync`)
Flux en 4 étapes :
1. Audio local
2. Paroles
3. Synchronisation (tap)
4. Aperçu avant sauvegarde

Fonctions obligatoires :
- tap space pour timestamp courant,
- undo,
- restart,
- éditer les paroles,
- ajuster timing ±0.1s,
- re-sync d’une ligne,
- clear timing d’une ligne,
- suppression rapide d’une ligne sync (croix),
- barre de progression de synchronisation,
- raccourcis :
  - `Espace` = sync,
  - `Backspace`/`Ctrl+Z` = undo,
  - `←` / `→` = seek ±5s,
- sauvegarde finale en LRC dans Supabase.

### C. Lecture et détail chanson (`/songs`, `/songs/[id]`)
- Listing chansons avec recherche + pagination.
- Spotlight search globale (Ctrl/Cmd + K).
- Détail chanson avec lecteur Apple Music-like.
- Affichage paroles synchronisées + onglets paroles/LRC.
- Actions sur page détail :
  - téléchargement `.lrc`,
  - copie des paroles sans timestamps,
  - partage du texte (WhatsApp).
- Correction orthographique rapide du LRC depuis la page chanson (sans réupload).
- Liens chansons liées.
- Actions admin :
  - suppression chanson,
  - édition d’une synchro existante via `/sync?songId=...`.

### D. Artistes (`/artists`, `/artists/[id]`)
- Listing artistes en grille + compteur de chansons.
- Spotlight artiste mis en avant.
- Détail artiste : hero, bio, citation, dernière release, discographie, liens sociaux, CTA contribution.
- Action admin : toggle `featured` depuis la page artiste.
- Action admin : suppression artiste + toutes ses chansons via RPC `admin_delete_artist_with_songs`.

### E. Homepage (`/`)
- Page d’accueil dynamique :
  - compteurs animés,
  - verset du jour,
  - sections chansons récentes / artistes,
  - CTA clairs,
  - branding (logo + bandeau visuel hero).

## 8) UX/UI minimum à respecter
- Système de tokens CSS dans `app/globals.css`.
- Header adaptatif (clair/sombre selon contexte) + effet glass au scroll.
- Lien actif dans navigation.
- Focus visible clavier + ARIA labels.
- Respect `prefers-reduced-motion`.
- Nettoyage des Object URL (revokeObjectURL dans cleanup des composants audio).

## 9) Fonctions/modules attendus
- `lib/supabaseClient.ts` : init client Supabase côté front.
- `lib/supabaseData.ts` : fonctions CRUD songs/lrc/artists/profiles + role fetch (`fetchUserRole`).
- `utils/lrcParser.ts` : parse, format, génération LRC.
- `utils/artistSlug.ts` : génération/normalisation slug artiste.
- `types/index.ts` : types TS (Song, LrcFile, Artist, etc.).

## 10) SQL à exécuter (ordre recommandé)
1. `supabase/schema.sql`
2. `supabase/artists.sql`
3. `supabase/rls.sql`
4. Optionnel dev : `supabase/rls_public.sql`
5. Si besoin admin lock : `supabase/rls_admin_actions.sql`
6. Si mismatch : `supabase/repair.sql`
7. Patches selon schéma :
   - `supabase/patch_audio_url.sql`
   - `supabase/patch_submitted_by.sql`
8. RPC admin : `supabase/admin_actions.sql`

## 11) Environnement et bootstrap
Créer `.env.local` :
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

Commandes :
1. `npm install`
2. `npm run dev`
3. `npm run test`
4. `npm run build`

## 12) Tests minimum obligatoires
Écrire des tests Vitest pour `utils/lrcParser.ts` couvrant au minimum :
- parsing d’un LRC simple,
- timestamps multiples,
- lignes sans timestamp,
- génération LRC propre,
- stabilité aller/retour parse→generate.

## 13) Critères d’acceptation finaux (checklist)
- Toutes les routes listées répondent sans erreur runtime.
- Auth signup/login fonctionne avec Supabase.
- Upload LRC persiste bien `songs` + `lrc_files`.
- Sync editor 4 étapes + raccourcis clavier opérationnels.
- Player synchronisé et actions paroles disponibles.
- Pages artistes + détail artiste fonctionnelles.
- Actions admin (featured, suppressions) fonctionnelles via RLS/RPC.
- `npm run test` passe.
- `npm run build` passe.

## 14) Non-objectifs (ne pas implémenter)
- Pas d’IA de suggestion auto de timings.
- Pas de collaboration temps réel.
- Pas de PWA offline complète.
- Pas d’E2E Playwright obligatoire.
- Pas de refonte design hors périmètre.

## 15) Format de livraison attendu
Fournis :
1. le code complet,
2. un résumé des choix techniques,
3. les scripts SQL réellement appliqués,
4. les limites connues,
5. les commandes exactes pour lancer et vérifier.

Important : si une ambiguïté apparaît, choisis l’implémentation la plus simple compatible avec les critères d’acceptation ci-dessus.