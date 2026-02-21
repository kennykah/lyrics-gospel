# Guide des images et logos

Ce projet charge maintenant des assets visuels depuis `public/`.

## 1) Logo principal

- Emplacement utilisé par le header et le hero:
  - `public/branding/logo-mark.svg`
- Recommandé:
  - `SVG` pour logo (meilleure netteté, poids léger)
  - Variante alternative possible: `PNG` (fond transparent)
- Taille suggérée:
  - 512x512 (ou plus) pour export PNG

## 2) Images qui défilent dans le Hero

- Emplacements actuellement branchés:
  - `public/hero/slide-1.svg`
  - `public/hero/slide-2.svg`
  - `public/hero/slide-3.svg`
- Formats recommandés:
  - `WEBP` (prioritaire) pour photos/visuels marketing
  - `JPG` si photos lourdes déjà existantes
  - `PNG` si besoin de transparence
  - `SVG` si visuels vectoriels/design plat
- Taille suggérée:
  - ratio 16:9 (ex: 1600x900, 1920x1080)
  - poids cible < 350 KB par image (si possible)

## 3) Photos de profil artistes

Option A (recommandée): stocker l'URL dans Supabase `artists.image_url`.
- Compatible URL publique distante ou chemin local `public`.
- Exemples:
  - `/artists/profiles/elevation-worship.webp`
  - `https://.../artist-photo.webp`

Option B (local dans le repo):
- Dossier conseillé:
  - `public/artists/profiles/`
- Convention de nommage:
  - slug artiste en minuscule (ex: `maverick-city-music.webp`)
- Formats recommandés:
  - `WEBP` (prioritaire)
  - `JPG` (acceptable)
  - `PNG` (si transparence)
- Taille suggérée:
  - 800x800 ou 1024x1024, carré
  - poids cible < 300 KB

## Conseils qualité

- Compresser les images avant import (Squoosh, TinyPNG, ImageOptim).
- Préférer `WEBP` pour vitesse mobile.
- Garder des noms cohérents (sans espace, sans accents, en kebab-case).
