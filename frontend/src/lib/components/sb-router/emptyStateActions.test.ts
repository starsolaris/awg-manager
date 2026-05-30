import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/api/client', () => ({
  api: {
    singboxRouterCreatePolicy: vi.fn(),
    singboxRouterEnable: vi.fn(),
    singboxRouterPutSettings: vi.fn(),
    singboxRouterPutRouteFinal: vi.fn(),
  },
}));

vi.mock('./addWizardActions', () => ({
  submitWizard: vi.fn(async () => ({ successes: ['svc:netflix'], failures: [] })),
}));

vi.mock('./settingsActions', () => ({
  mergeAndSaveSettings: vi.fn(async () => {}),
}));

vi.mock('$lib/stores/singboxRouter', () => {
  const settings = { subscribe: vi.fn(() => () => {}) };
  return {
    singboxRouter: {
      settings,
      loadAll: vi.fn(async () => {}),
    },
  };
});

vi.mock('svelte/store', async () => {
  const actual = await vi.importActual<typeof import('svelte/store')>('svelte/store');
  return {
    ...actual,
    get: vi.fn(() => null),
  };
});

vi.mock('./templatesStore', () => ({
  clearSelection: vi.fn(),
  toggleTemplate: vi.fn(),
}));

vi.mock('./addWizardStore', () => ({
  openAddWizard: vi.fn(),
}));

import { get } from 'svelte/store';
import { api } from '$lib/api/client';
import { singboxRouter } from '$lib/stores/singboxRouter';
import { clearSelection, toggleTemplate } from './templatesStore';
import { openAddWizard } from './addWizardStore';
import { submitWizard } from './addWizardActions';
import { mergeAndSaveSettings } from './settingsActions';
import {
  applyRecipe, createDefaultPolicy, setAutoDetectWan, setManualWan, enableEngine, finishSetup,
} from './emptyStateActions';

describe('emptyStateActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applyRecipe streaming: clear + 3 toggles + openAddWizard', async () => {
    await applyRecipe('streaming');
    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(toggleTemplate).toHaveBeenCalledTimes(3);
    expect(toggleTemplate).toHaveBeenNthCalledWith(1, 'svc:netflix');
    expect(toggleTemplate).toHaveBeenNthCalledWith(2, 'svc:youtube');
    expect(toggleTemplate).toHaveBeenNthCalledWith(3, 'svc:twitch');
    expect(openAddWizard).toHaveBeenCalledTimes(1);
  });

  it('applyRecipe unknown throws', async () => {
    await expect(applyRecipe('zzz')).rejects.toThrow();
    expect(openAddWizard).not.toHaveBeenCalled();
  });

  it('createDefaultPolicy calls API + loadAll', async () => {
    (api.singboxRouterCreatePolicy as ReturnType<typeof vi.fn>).mockResolvedValue({ name: 'awgm-router' });
    await createDefaultPolicy();
    expect(api.singboxRouterCreatePolicy).toHaveBeenCalledWith('awgm-router');
    expect(singboxRouter.loadAll).toHaveBeenCalled();
  });

  it('setAutoDetectWan with null settings → merges {wanAutoDetect:true}', async () => {
    (get as ReturnType<typeof vi.fn>).mockReturnValue(null);
    await setAutoDetectWan();
    expect(api.singboxRouterPutSettings).toHaveBeenCalledWith(
      expect.objectContaining({ wanAutoDetect: true }),
    );
    expect(singboxRouter.loadAll).toHaveBeenCalled();
  });

  it('setManualWan preserves other settings + sets wanInterface + clears auto', async () => {
    (get as ReturnType<typeof vi.fn>).mockReturnValue({
      wanAutoDetect: true,
      wanInterface: '',
      bypassExtraPorts: '53',
    });
    await setManualWan('ppp0');
    expect(api.singboxRouterPutSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        wanAutoDetect: false,
        wanInterface: 'ppp0',
        bypassExtraPorts: '53',
      }),
    );
  });

  it('enableEngine calls API + loadAll', async () => {
    (api.singboxRouterEnable as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    await enableEngine();
    expect(api.singboxRouterEnable).toHaveBeenCalled();
    expect(singboxRouter.loadAll).toHaveBeenCalled();
  });

  it('finishSetup: правила(tunnel) → final=direct → bake defaults(all) → enable → loadAll', async () => {
    const empty = {
      domainSuffix: '', ipCidr: '', sourceIpCidr: '', port: '', ruleSetTags: new Set<string>(),
    };
    const res = await finishSetup({
      tunnelTag: 'wg-nl',
      selectedTemplates: ['svc:netflix'],
      customFields: empty,
      groups: [],
    });
    expect(submitWizard).toHaveBeenCalledWith(
      expect.objectContaining({ outboundCategory: 'tunnel', tunnelTag: 'wg-nl', selectedTemplates: ['svc:netflix'] }),
    );
    expect(api.singboxRouterPutRouteFinal).toHaveBeenCalledWith('direct');
    expect(mergeAndSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ deviceMode: 'all', wanAutoDetect: true, wanInterface: '', snifferEnabled: true }),
    );
    expect(api.singboxRouterEnable).toHaveBeenCalled();
    expect(singboxRouter.loadAll).toHaveBeenCalled();
    expect(res.successes).toContain('svc:netflix');
  });
});
