import { supabase } from '@/lib/supabaseClient';

const AUDIO_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BUCKET || 'song-audio';

export function isSupabaseAudioStorageEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUDIO_STORAGE === 'true';
}

function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 120);
}

function getFileExtension(name: string) {
  const parts = name.split('.');
  if (parts.length <= 1) return '';
  const ext = parts[parts.length - 1]?.toLowerCase();
  if (!ext) return '';
  return `.${ext}`;
}

function normalizeForCompare(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function stripTrailingTimestampFromSlug(slug: string) {
  return slug.replace(/-\d{10,}$/g, '');
}

function buildSearchTokens(params: { title?: string | null; artist?: string | null; slug?: string | null }) {
  const raw = [params.slug, params.artist, params.title]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!raw) return [] as string[];
  const words = raw.split(/[\s-]+/).filter((part) => part.length >= 3);
  return [...new Set(words)].slice(0, 6);
}

function splitMeaningfulTokens(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .split(/[\s-]+/)
    .filter((part) => part.length >= 3);
}

function isAudioFileName(name: string) {
  return /\.(mp3|wav|m4a|ogg|flac|aac|webm)$/i.test(name);
}

function getFileStem(name: string) {
  return name.replace(/\.[^.]+$/g, '');
}

function buildExactNameCandidates(params: {
  title?: string | null;
  artist?: string | null;
  slug?: string | null;
}) {
  const normalizedTitle = normalizeForCompare(params.title || '');
  const normalizedArtist = normalizeForCompare(params.artist || '');
  const normalizedSlug = normalizeForCompare(stripTrailingTimestampFromSlug(params.slug || ''));

  const candidates = [
    normalizedArtist && normalizedTitle ? `${normalizedArtist}-${normalizedTitle}` : '',
    normalizedTitle && normalizedArtist ? `${normalizedTitle}-${normalizedArtist}` : '',
    normalizedSlug,
    normalizedTitle,
  ].filter(Boolean);

  return [...new Set(candidates)];
}

function pickBestAudioByTokenScore(
  audioFiles: Array<{ base: string; name: string }>,
  params: { title?: string | null; artist?: string | null; slug?: string | null }
) {
  const songTokens = new Set(
    splitMeaningfulTokens([params.artist, params.title, params.slug].filter(Boolean).join(' '))
  );
  if (!songTokens.size) return null;

  let best: { base: string; name: string; score: number } | null = null;

  for (const file of audioFiles) {
    const fileTokens = splitMeaningfulTokens(getFileStem(file.name));
    if (!fileTokens.length) continue;

    const common = fileTokens.filter((token) => songTokens.has(token)).length;
    if (!common) continue;

    const score = common * 10 - Math.abs(fileTokens.length - songTokens.size);
    if (!best || score > best.score) {
      best = { ...file, score };
    }
  }

  if (!best || best.score < 10) return null;
  return best;
}

export async function uploadSongAudioToStorage(params: {
  file: File;
  userId?: string | null;
  title?: string | null;
  artist?: string | null;
  songId?: string | null;
}) {
  const ext = getFileExtension(params.file.name);
  const preferredBase = sanitizeFileName(`${params.artist || 'artist'}-${params.title || 'song'}`);
  const fallbackName = sanitizeFileName(params.file.name) || `audio-${Date.now()}`;
  const safeName = `${preferredBase || fallbackName}${ext || ''}`;
  const path = `songs/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, params.file, {
      contentType: params.file.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data: publicData } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path);
  return {
    data: {
      bucket: AUDIO_BUCKET,
      path,
      publicUrl: publicData.publicUrl,
    },
    error: null,
  };
}

export async function tryFindSongAudioUrlInStorage(params: {
  title?: string | null;
  artist?: string | null;
  slug?: string | null;
}) {
  const exactCandidates = buildExactNameCandidates(params);
  const exactListBases = ['songs', ''];

  for (const base of exactListBases) {
    const { data: files } = await supabase.storage.from(AUDIO_BUCKET).list(base, { limit: 1000 });
    const audioFiles = (files || []).filter((file: { name: string }) => isAudioFileName(file.name));

    const exactHit = audioFiles.find((file: { name: string }) => {
      const stem = normalizeForCompare(getFileStem(file.name));
      return exactCandidates.includes(stem);
    });

    if (exactHit?.name) {
      const fullPath = base ? `${base}/${exactHit.name}` : exactHit.name;
      const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(fullPath);
      return data.publicUrl;
    }
  }

  const [songsDir, rootDir] = await Promise.all([
    supabase.storage.from(AUDIO_BUCKET).list('songs', { limit: 1000 }),
    supabase.storage.from(AUDIO_BUCKET).list('', { limit: 1000 }),
  ]);

  const allAudioFiles = [
    ...(songsDir.data || []).map((file: { name: string }) => ({ base: 'songs', name: file.name })),
    ...(rootDir.data || []).map((file: { name: string }) => ({ base: '', name: file.name })),
  ].filter((file) => isAudioFileName(file.name));

  const bestMatch = pickBestAudioByTokenScore(allAudioFiles, params);
  if (bestMatch) {
    const fullPath = bestMatch.base ? `${bestMatch.base}/${bestMatch.name}` : bestMatch.name;
    const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(fullPath);
    return data.publicUrl;
  }

  return null;
}
