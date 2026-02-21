-- Song metrics (visits / plays) + admin stats RPC
-- Run this script in Supabase SQL editor

CREATE TABLE IF NOT EXISTS song_metrics (
  song_id UUID PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
  visit_count BIGINT NOT NULL DEFAULT 0,
  play_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.track_song_metric(
  p_song_id UUID,
  p_metric TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_song_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.song_metrics(song_id, visit_count, play_count, updated_at)
  VALUES (
    p_song_id,
    CASE WHEN p_metric = 'visit' THEN 1 ELSE 0 END,
    CASE WHEN p_metric = 'play' THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (song_id)
  DO UPDATE SET
    visit_count = public.song_metrics.visit_count + CASE WHEN p_metric = 'visit' THEN 1 ELSE 0 END,
    play_count = public.song_metrics.play_count + CASE WHEN p_metric = 'play' THEN 1 ELSE 0 END,
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_song_metric(UUID, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_song_stats(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  song_id UUID,
  title TEXT,
  artist_name TEXT,
  visit_count BIGINT,
  play_count BIGINT,
  last_activity TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'forbidden: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.title,
    s.artist_name,
    COALESCE(m.visit_count, 0),
    COALESCE(m.play_count, 0),
    COALESCE(m.updated_at, s.updated_at, s.created_at)
  FROM public.songs s
  LEFT JOIN public.song_metrics m ON m.song_id = s.id
  ORDER BY COALESCE(m.play_count, 0) DESC, COALESCE(m.visit_count, 0) DESC
  LIMIT GREATEST(COALESCE(p_limit, 100), 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_song_stats(INTEGER) TO authenticated;
