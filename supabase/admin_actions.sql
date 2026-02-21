-- Admin RPC actions for Gospel Lyrics
-- Execute this script in Supabase SQL editor

-- Delete an artist profile + all songs + all linked lrc_files in one transaction-like function
-- Only users with profiles.role = 'admin' can execute this function successfully.
create or replace function public.admin_delete_artist_with_songs(
  p_artist_id uuid default null,
  p_artist_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_target_name text;
  v_deleted_songs integer := 0;
  v_deleted_artists integer := 0;
begin
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'forbidden: admin role required';
  end if;

  if p_artist_id is not null then
    select name into v_target_name
    from public.artists
    where id = p_artist_id;
  end if;

  if v_target_name is null then
    v_target_name := p_artist_name;
  end if;

  if v_target_name is null or btrim(v_target_name) = '' then
    raise exception 'artist name required';
  end if;

  delete from public.songs
  where lower(artist_name) = lower(v_target_name);
  get diagnostics v_deleted_songs = row_count;

  delete from public.artists
  where (p_artist_id is not null and id = p_artist_id)
     or lower(name) = lower(v_target_name);
  get diagnostics v_deleted_artists = row_count;

  return jsonb_build_object(
    'artist_name', v_target_name,
    'deleted_songs', v_deleted_songs,
    'deleted_artists', v_deleted_artists
  );
end;
$$;

grant execute on function public.admin_delete_artist_with_songs(uuid, text) to authenticated;
