export interface PlayerTrackMeta {
  songId: string;
  title: string;
  artistName: string;
  coverImageUrl?: string | null;
}

type Listener = (track: PlayerTrackMeta | null) => void;

let currentTrack: PlayerTrackMeta | null = null;
const listeners = new Set<Listener>();

export function setPlayerTrack(track: PlayerTrackMeta | null) {
  currentTrack = track;
  for (const listener of listeners) listener(currentTrack);
}

export function getPlayerTrack() {
  return currentTrack;
}

export function subscribePlayerTrack(listener: Listener) {
  listeners.add(listener);
  listener(currentTrack);
  return () => {
    listeners.delete(listener);
  };
}
