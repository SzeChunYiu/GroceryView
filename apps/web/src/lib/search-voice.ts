const voiceFallbackStorageKey = 'groceryview:voice-search:fallback-transcript';

export type VoiceCaptureState = 'denied' | 'granted' | 'unsupported';

export function transcribeVoiceFallback(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 160);
}

export function loadPersistedVoiceFallback() {
  if (typeof window === 'undefined') return '';

  try {
    return transcribeVoiceFallback(window.localStorage.getItem(voiceFallbackStorageKey) ?? '');
  } catch {
    return '';
  }
}

export function persistVoiceFallback(value: string) {
  const transcript = transcribeVoiceFallback(value);
  if (typeof window === 'undefined') return transcript;

  try {
    window.localStorage.setItem(voiceFallbackStorageKey, transcript);
  } catch {
    // Keep voice fallback usable even if storage is blocked.
  }

  return transcript;
}

export async function requestVoiceSearchCapture(): Promise<VoiceCaptureState> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unsupported';
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return 'granted';
  } catch {
    return 'denied';
  }
}
