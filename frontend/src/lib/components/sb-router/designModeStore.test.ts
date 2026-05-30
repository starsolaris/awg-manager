import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

const STORAGE_KEY = 'awg.sb-router.design';

function resetEnv(url: string) {
  window.history.replaceState({}, '', url);
  localStorage.clear();
  vi.resetModules();
}

describe('designModeStore', () => {
  beforeEach(() => {
    resetEnv('/');
  });

  it('defaults to classic when no URL and no storage', async () => {
    const { sbDesignMode } = await import('./designModeStore');
    expect(get(sbDesignMode)).toBe('classic');
  });

  it('reads new from sbDesign URL', async () => {
    resetEnv('/?sbDesign=new');
    const { sbDesignMode } = await import('./designModeStore');
    expect(get(sbDesignMode)).toBe('new');
  });

  it('reads classic from sbDesign URL', async () => {
    resetEnv('/?sbDesign=classic');
    const { sbDesignMode } = await import('./designModeStore');
    expect(get(sbDesignMode)).toBe('classic');
  });

  it('maps advanced alias to classic', async () => {
    resetEnv('/?sbDesign=advanced');
    const { sbDesignMode } = await import('./designModeStore');
    expect(get(sbDesignMode)).toBe('classic');
  });

  it('maps redesign alias to new', async () => {
    resetEnv('/?sbDesign=redesign');
    const { sbDesignMode } = await import('./designModeStore');
    expect(get(sbDesignMode)).toBe('new');
  });

  it('ignores invalid URL and falls back to classic', async () => {
    resetEnv('/?sbDesign=foo');
    const { sbDesignMode } = await import('./designModeStore');
    expect(get(sbDesignMode)).toBe('classic');
  });

  it('reads from localStorage when no URL override', async () => {
    localStorage.setItem(STORAGE_KEY, 'new');
    const { sbDesignMode } = await import('./designModeStore');
    expect(get(sbDesignMode)).toBe('new');
  });

  it('URL override wins over localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, 'classic');
    resetEnv('/?sbDesign=new');
    localStorage.setItem(STORAGE_KEY, 'classic');
    const { sbDesignMode } = await import('./designModeStore');
    expect(get(sbDesignMode)).toBe('new');
  });

  it('setSbDesignMode updates store/localStorage/url and preserves params', async () => {
    resetEnv('/?tab=singbox&sub=rules&x=1');
    const { sbDesignMode, setSbDesignMode } = await import('./designModeStore');
    setSbDesignMode('new');

    expect(get(sbDesignMode)).toBe('new');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('new');

    const sp = new URL(window.location.href).searchParams;
    expect(sp.get('tab')).toBe('singbox');
    expect(sp.get('sub')).toBe('rules');
    expect(sp.get('x')).toBe('1');
    expect(sp.get('sbDesign')).toBe('new');
  });
});
