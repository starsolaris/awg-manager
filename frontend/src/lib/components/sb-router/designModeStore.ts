import { writable, type Readable } from 'svelte/store';

export type SbDesignMode = 'classic' | 'new';

const STORAGE_KEY = 'awg.sb-router.design';
const VALID: ReadonlyArray<SbDesignMode> = ['classic', 'new'];

function isValid(v: unknown): v is SbDesignMode {
  return typeof v === 'string' && (VALID as readonly string[]).includes(v);
}

export function readSbDesignModeOverride(searchParams: URLSearchParams): SbDesignMode | null {
  const raw = (searchParams.get('sbDesign') || '').toLowerCase();
  if (raw === 'advanced') return 'classic';
  if (raw === 'redesign') return 'new';
  return isValid(raw) ? raw : null;
}

function readFromURL(): SbDesignMode | null {
  if (typeof window === 'undefined') return null;
  return readSbDesignModeOverride(new URL(window.location.href).searchParams);
}

function readFromStorage(): SbDesignMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isValid(v) ? v : null;
  } catch {
    return null;
  }
}

function readInitialMode(): SbDesignMode {
  return readFromURL() ?? readFromStorage() ?? 'classic';
}

const store = writable<SbDesignMode>(readInitialMode());

export const sbDesignMode: Readable<SbDesignMode> = { subscribe: store.subscribe };

export function setSbDesignMode(next: SbDesignMode): void {
  if (!isValid(next)) return;
  store.set(next);
  if (typeof window === 'undefined') return;

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('sbDesign', next);
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
}
