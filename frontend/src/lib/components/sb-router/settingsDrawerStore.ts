import { writable, type Readable, type Writable } from 'svelte/store';

const openW: Writable<boolean> = writable(false);

export const settingsDrawerOpen: Readable<boolean> = { subscribe: openW.subscribe };

export function openSettingsDrawer(): void {
  openW.set(true);
}

export function closeSettingsDrawer(): void {
  openW.set(false);
}

export function toggleSettingsDrawer(): void {
  openW.update((v) => !v);
}
