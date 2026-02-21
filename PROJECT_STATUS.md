# Gospel Lyrics — Suivi du Projet

## Résumé rapide
- **Objectif** : plateforme de paroles gospel synchronisées (LRC) avec import, éditeur tap‑to‑sync style Musixmatch et lecteur synchronisé style Apple Music.
- **Stack** : Next.js 16.1.6 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Supabase (DB + Auth + RLS).
- **Audio** : mode local par défaut + mode test Supabase Storage activable via `NEXT_PUBLIC_ENABLE_SUPABASE_AUDIO_STORAGE`.
- **Repo** : `https://github.com/kennykah/lyrics-gospel.git`

---

## État actuel (fonctionnel ✅)

### Core
- ✅ Import LRC + preview audio local.
- ✅ Éditeur tap‑to‑sync Musixmatch‑style (flux 4 étapes : Audio → Paroles → Synchro → Aperçu).
- ✅ Contrôles de synchronisation avancés : annuler (undo), recommencer, modifier paroles, ajuster ±0.1s, re-sync ligne, effacer timing.
- ✅ Suppression rapide d'une ligne synchronisée via croix (✕) directement dans la liste des lignes.
- ✅ Raccourcis clavier (Espace = sync, ⌫/Ctrl+Z = annuler, ←→ = ±5s).
- ✅ Génération et sauvegarde LRC dans Supabase (`songs` + `lrc_files`).
- ✅ Actions paroles sur page chanson : téléchargement `.lrc`, copie des paroles sans timestamps, partage du texte via WhatsApp.
- ✅ Correction orthographique rapide des LRC synchronisés directement depuis la page chanson (sans réupload).
- ✅ Tests unitaires LRC parser (Vitest).

### Authentification
- ✅ Auth Supabase (login / signup par email).
- ✅ AuthGuard — protection des pages contributeur.
- ✅ Verrouillage édition en mode admin-only (`/sync`, `/upload`, correction/suppression).
- ✅ AuthStatus dans le header.
- ✅ RLS (public optionnel pour dev, restrictif pour prod).

### Pages & navigation
- ✅ **Homepage** dynamique — compteurs animés, verset du jour, sections chansons récentes / artistes / CTA.
- ✅ **Découvrir** (`/songs`) — liste, recherche Spotlight (⌘K), pagination.
- ✅ **Détail chanson** (`/songs/[id]`) — lecteur Apple Music, onglets paroles/LRC, chansons liées, partage.
- ✅ **Artistes** (`/artists`) — listing avec grille, spotlight artiste mis en avant, compteur de chansons.
- ✅ **Détail artiste** (`/artists/[id]`) — hero banner, bio, citation, dernière release, discographie, liens sociaux, CTA contribution.
- ✅ **Contribuer** (`/sync`) — éditeur LRC complet (voir ci-dessus).
- ✅ **Importer** (`/upload`) — import fichier LRC existant.
- ✅ **Auth** (`/auth/login`, `/auth/signup`).

### UI/UX
- ✅ Design system Apple HIG (tokens CSS, glass morphism, squircles, transitions spring).
- ✅ Header adaptatif (mode clair/sombre selon la page, effet glass au scroll).
- ✅ Branding visuel : logo intégré + bandeau d'images défilantes dans le Hero.
- ✅ Recherche Spotlight globale (⌘K / Ctrl+K).
- ✅ Lien actif dans la navigation.
- ✅ Accessibilité de base (ARIA labels, focus-visible, prefers-reduced-motion).
- ✅ Correction des fuites Object URL (revokeObjectURL dans cleanup).
- ✅ Optimisations mobile-first (espacements smartphone, cibles tactiles min 44px, safe-area iOS, actions paroles accessibles sur mobile).

### Admin
- ✅ Toggle artiste mis en avant (depuis la page artiste, rôle admin requis).
- ✅ Fonction `fetchUserRole()` pour détection admin.
- ✅ Édition d'une synchronisation existante (admin) via `/sync?songId=...`.
- ✅ Suppression d'une chanson (admin) depuis la page détail chanson.
- ✅ Suppression d'un artiste avec toutes ses chansons (admin) depuis la page artiste.

---

## Architecture (fichiers clés)

### UI — Pages
| Fichier | Rôle |
|---|---|
| `app/page.tsx` | Homepage dynamique |
| `app/songs/page.tsx` | Liste des chansons |
| `app/songs/[id]/page.tsx` | Détail chanson + lecteur |
| `app/artists/page.tsx` | Liste des artistes |
| `app/artists/[id]/page.tsx` | Détail artiste |
| `app/sync/page.tsx` | Éditeur tap‑to‑sync |
| `app/upload/page.tsx` | Import LRC |
| `app/auth/login/page.tsx` | Connexion |
| `app/auth/signup/page.tsx` | Inscription |

### UI — Composants
| Fichier | Rôle |
|---|---|
| `components/LyricEditor.tsx` | Éditeur LRC Musixmatch‑style (4 étapes) |
| `components/LyricPlayer.tsx` | Lecteur synchronisé |
| `components/AppleLyricPlayer.tsx` | Lecteur Apple Music style |
| `components/Header.tsx` | Navigation adaptative clair/sombre |
| `components/SearchBar.tsx` | Barre de recherche |
| `components/SpotlightSearch.tsx` | Recherche Spotlight (⌘K) |
| `components/AuthGuard.tsx` | Protection de route (auth requise) |
| `components/AuthStatus.tsx` | Indicateur connexion |
| `components/LrcUploadForm.tsx` | Formulaire import LRC |

### Data & Config
| Fichier | Rôle |
|---|---|
| `lib/supabaseClient.ts` | Client Supabase |
| `lib/supabaseData.ts` | Fonctions CRUD (songs, lrc, artists, profiles) |
| `utils/lrcParser.ts` | Parseur/générateur LRC |
| `types/index.ts` | Types TypeScript (Song, LrcFile, Artist) |
| `app/globals.css` | Design system (tokens, classes utilitaires) |

### Supabase — SQL
| Fichier | Rôle |
|---|---|
| `supabase/schema.sql` | Tables `songs`, `lrc_files`, `profiles` |
| `supabase/artists.sql` | Table `artists` (bio, featured, social links) |
| `supabase/rls.sql` | RLS de base |
| `supabase/rls_public.sql` | RLS ouvert (dev/beta) |
| `supabase/rls_restrict.sql` | RLS strict (prod) |
| `supabase/rls_admin_actions.sql` | Verrouillage édition admin-only (songs/lrc insert/update/delete) |
| `supabase/repair.sql` | Corrections rapides |
| `supabase/patch_audio_url.sql` | audio_url optionnel |
| `supabase/patch_submitted_by.sql` | submitted_by col |
| `supabase/admin_actions.sql` | Fonction RPC `admin_delete_artist_with_songs` |

---

## Phases & avancement

### Phase 1 — MVP ✅
- Import LRC, éditeur, lecteur, sauvegarde Supabase.

### Phase 2 — UI/UX Redesign ✅
- Design Apple HIG complet (15/15 tâches).
- Analyse approfondie + 10 améliorations (Spotlight, homepage dynamique, nav active, auth guard, accessibilité, etc.).

### Phase 3 — Auth & sécurité ✅
- ✅ Auth Supabase (login/signup).
- ✅ AuthGuard pour pages protégées.
- ✅ RLS strict disponible.
- ⏳ Gestion profils utilisateurs avancée.

### Phase 4 — Artistes ✅
- ✅ Table `artists` (bio, image, citation, social links JSONB, featured system).
- ✅ Page listing artistes avec spotlight.
- ✅ Page détail artiste complète.
- ✅ Admin : toggle artiste mis en avant.
- ⏳ CRUD artistes complet (formulaire création/édition).

### Phase 5 — Éditeur LRC avancé ✅
- ✅ Réécriture complète style Musixmatch (flux 4 étapes).
- ✅ Contrôles : undo, restart, edit lyrics, ±0.1s, re-sync, clear.
- ✅ Raccourcis clavier.
- ✅ Barre de progression sync.
- ✅ Mode aperçu avant sauvegarde.

### Phase 6 — Validation & workflow ⏳
- ⏳ Rôles (admin/validator/contributor).
- ⏳ Workflow de validation des LRC (pending → approved → published).
- ⏳ Historique des versions LRC.

### Phase 7 — Tests & CI ⏳
- ✅ Tests unitaires (parser LRC — Vitest).
- ⏳ Tests composants (React Testing Library).
- ⏳ Tests E2E (Playwright).
- ⏳ CI/CD GitHub Actions.

### Phase 8 — Production ⏳
- ⏳ Hardening RLS.
- ⏳ Monitoring (Sentry).
- ⏳ SEO (métadonnées dynamiques, sitemap).
- ⏳ PWA / offline support.

---

## Améliorations potentielles à venir

### Court terme (prioritaire)
- **Gestion profils** : avatar, bio, liste de contributions par utilisateur.
- **CRUD chansons** : édition et suppression par l'auteur ou un admin.
- **CRUD artistes** : formulaire de création/édition d'artiste depuis l'UI.
- **Notifications toast** : remplacer les messages inline par des toasts animés (succès/erreur).
- **Responsive mobile** : optimiser l'éditeur de sync pour écrans tactiles (bouton tap plus grand).

### Moyen terme
- **Export multi‑formats** : SRT, WebVTT, texte brut, .ass.
- **Playlist / collections** : permettre aux utilisateurs de créer des playlists de chansons.
- **Favoris** : système de favoris/bookmarks par utilisateur.
- **Historique des contributions** : voir ses propres contributions et leur statut.
- **Commentaires** : permettre les commentaires sur les chansons.
- **Dark mode global** : toggle clair/sombre sur toutes les pages (pas seulement les pages player).
- **Internationalisation (i18n)** : anglais + français.

### Long terme
- **Suggestion automatique de timestamps (IA)** : pré-remplir les timings via analyse audio.
- **Collaboration temps réel** : édition simultanée de LRC (type Google Docs).
- **API publique** : endpoint REST/GraphQL pour intégrations tierces.
- **App mobile** : React Native ou PWA complète.
- **Statistiques** : dashboard admin avec métriques (chansons, contributions, utilisateurs actifs).
- **Système de gamification** : badges, niveaux, classement des contributeurs.
- **Intégration streaming** : lien vers Spotify/YouTube/Apple Music depuis les pages chansons.
- **Recherche avancée** : filtres par artiste, genre, date, contributeur + recherche full-text Supabase.

---

## Notes techniques
- `songs` en DB peut exiger `slug` et `audio_url` (suivant le schéma).
- Le code crée un `slug` côté client et un `audio_url` placeholder (`local://temp-audio`).
- Si `audio_url` doit être facultatif, exécuter `supabase/patch_audio_url.sql`.
- Pour tests sans login, exécuter `supabase/rls_public.sql`.
- Tailwind CSS 4 : les variables CSS `--player-bg` etc. ne fonctionnent pas via `@theme inline` au runtime → utiliser `bg-[#0d0d12]` directement.
- Design tokens définis dans `app/globals.css` sous `:root` (couleurs, radius, ombres, transitions).

---

## Checklist pour un nouveau dev
1. Installer deps : `npm install`
2. Ajouter `.env.local` avec `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Exécuter SQL : `supabase/schema.sql`, `supabase/artists.sql`, `supabase/rls.sql`
4. (Optionnel) `supabase/rls_public.sql` pour tests locaux sans auth
5. Lancer : `npm run dev`
6. Tests : `npm test`

---

## Historique des mises à jour
| Date | Changements |
|---|---|
| Session 1 | MVP : import LRC, éditeur basic, lecteur, Supabase CRUD |
| Session 2 | Redesign Apple HIG complet (15 tâches) |
| Session 3 | 10 améliorations (Spotlight, homepage dynamique, auth guard, accessibilité) |
| Session 4 | Fix couleurs sync/header, pages artistes, éditeur Musixmatch, fix bg-player-bg |
