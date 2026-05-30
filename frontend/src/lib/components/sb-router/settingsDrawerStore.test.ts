import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  settingsDrawerOpen,
  openSettingsDrawer,
  closeSettingsDrawer,
  toggleSettingsDrawer,
} from './settingsDrawerStore';

describe('settingsDrawerStore', () => {
  beforeEach(() => {
    closeSettingsDrawer();
  });

  it('default state: closed', () => {
    expect(get(settingsDrawerOpen)).toBe(false);
  });

  it('openSettingsDrawer → open=true', () => {
    openSettingsDrawer();
    expect(get(settingsDrawerOpen)).toBe(true);
  });

  it('closeSettingsDrawer → open=false', () => {
    openSettingsDrawer();
    closeSettingsDrawer();
    expect(get(settingsDrawerOpen)).toBe(false);
  });

  it('toggleSettingsDrawer toggles state', () => {
    toggleSettingsDrawer();
    expect(get(settingsDrawerOpen)).toBe(true);
    toggleSettingsDrawer();
    expect(get(settingsDrawerOpen)).toBe(false);
  });

  it('multiple opens stay open', () => {
    openSettingsDrawer();
    openSettingsDrawer();
    expect(get(settingsDrawerOpen)).toBe(true);
  });
});
