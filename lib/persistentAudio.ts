let persistentAudio: HTMLAudioElement | null = null;

export function getPersistentAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  if (!persistentAudio) {
    persistentAudio = new Audio();
    persistentAudio.preload = 'metadata';
  }

  return persistentAudio;
}
