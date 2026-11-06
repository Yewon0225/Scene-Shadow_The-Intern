import { DEFAULT_SENTENCES, Sentence, SentenceProgress } from '../types';

const SENTENCES_STORAGE_KEY = 'scene_shadow_the_intern_sentences_v1';
const PROGRESS_STORAGE_KEY = 'scene_shadow_the_intern_progress_v1';

// In-memory fallback if localStorage fails or is disabled
let inMemorySentences: Sentence[] = [...DEFAULT_SENTENCES];
let inMemoryProgress: Record<number, SentenceProgress> = {};

export function loadSentences(): Sentence[] {
  try {
    const raw = localStorage.getItem(SENTENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load sentences from localStorage, using memory/defaults', e);
  }
  return inMemorySentences;
}

export function saveSentences(sentences: Sentence[]): boolean {
  inMemorySentences = sentences;
  try {
    localStorage.setItem(SENTENCES_STORAGE_KEY, JSON.stringify(sentences));
    return true;
  } catch (e) {
    console.warn('Failed to save sentences to localStorage, saved in memory only', e);
    return false;
  }
}

export function resetSentencesToDefault(): Sentence[] {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_SENTENCES));
  saveSentences(defaults);
  return defaults;
}

export function loadProgress(): Record<number, SentenceProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load progress from localStorage', e);
  }
  return inMemoryProgress;
}

export function saveProgress(progress: Record<number, SentenceProgress>): boolean {
  inMemoryProgress = progress;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch (e) {
    console.warn('Failed to save progress to localStorage', e);
    return false;
  }
}

export function getOrCreateSentenceProgress(id: number, currentProgress?: Record<number, SentenceProgress>): SentenceProgress {
  const p = currentProgress || loadProgress();
  if (p[id]) {
    return p[id];
  }
  return {
    id,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };
}

export function updateSentenceProgress(
  id: number,
  updater: (prev: SentenceProgress) => SentenceProgress
): Record<number, SentenceProgress> {
  const all = { ...loadProgress() };
  const prev = all[id] || {
    id,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };
  const updated = updater(prev);
  all[id] = updated;
  saveProgress(all);
  return all;
}

// In-memory audio recordings cache for current session
const sessionAudioBlobs = new Map<number, Blob>();

export function storeAudioRecording(sentenceId: number, blob: Blob) {
  sessionAudioBlobs.set(sentenceId, blob);
}

export function getAudioRecording(sentenceId: number): Blob | undefined {
  return sessionAudioBlobs.get(sentenceId);
}

export function clearAudioRecordings() {
  sessionAudioBlobs.clear();
}
