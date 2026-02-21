# Supabase Audio Storage — Setup, test et rollback

## Objectif
Tester un mode où l’audio n’est plus uniquement local :
- upload audio vers Supabase Storage au moment de la sauvegarde dans `/sync`,
- lecture automatique de `songs.audio_url` dans `/songs/[id]`.

Le mode est **réversible sans casser le projet** via un flag d’environnement.

## 1) Préparer Supabase
Dans Supabase SQL Editor, exécute :

1. `supabase/schema.sql` (si pas déjà fait)
2. `supabase/rls.sql` (ou `supabase/rls_public.sql` en test)
3. `supabase/storage_audio.sql` (nouveau)

Le script `supabase/storage_audio.sql` crée :
- bucket `song-audio` (public read),
- policies upload/update/delete pour utilisateurs authentifiés.

## 2) Variables d’environnement
Dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ENABLE_SUPABASE_AUDIO_STORAGE=true
NEXT_PUBLIC_SUPABASE_AUDIO_BUCKET=song-audio
```

Puis redémarrer :

```bash
npm run dev
```

## 3) Ce qui change dans l’UX
- `/sync` : l’édition reste fluide (audio local pendant la synchro).
- `Sauvegarder` : upload du fichier audio vers Supabase Storage.
- `songs.audio_url` reçoit l’URL publique Supabase.
- `/songs/[id]` : le player utilise automatiquement cette URL (plus besoin de re-upload local).

## 4) Procédure de test recommandée
1. Aller sur `/sync`.
2. Charger un audio + synchroniser quelques lignes.
3. Sauvegarder dans Supabase.
4. Vérifier en DB (`songs.audio_url`) que l’URL est renseignée.
5. Ouvrir `/songs/[id]` et vérifier la lecture sans upload manuel.

## 5) Rollback immédiat (safe)
Si l’expérience n’est pas concluante :

1. Mettre dans `.env.local` :

```env
NEXT_PUBLIC_ENABLE_SUPABASE_AUDIO_STORAGE=false
```

2. Redémarrer l’app (`npm run dev`).

Résultat :
- le projet repasse en mode audio local,
- aucun changement destructif de schéma nécessaire,
- les données existantes restent intactes.

## 6) Dépannage rapide
- Erreur upload Storage : vérifier que `supabase/storage_audio.sql` a bien été exécuté.
- Erreur permissions : vérifier session auth active et policies du bucket.
- Audio non lisible côté page chanson : vérifier que `songs.audio_url` est une URL `https://...` valide.
