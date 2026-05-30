import { get } from 'svelte/store';
import type { SingboxRouterSettings } from '$lib/types';
import { api } from '$lib/api/client';
import { singboxRouter } from '$lib/stores/singboxRouter';
import { clearSelection, toggleTemplate } from './templatesStore';
import { openAddWizard } from './addWizardStore';
import { getRecipeTemplateIds } from './recipes';
import type { CustomMatcherFields } from './addWizardStore';
import type { TemplateGroup } from './templatesData';
import type { SubmitResult } from './templatesActions';
import { submitWizard } from './addWizardActions';
import { mergeAndSaveSettings } from './settingsActions';

export async function applyRecipe(id: string): Promise<void> {
  const ids = getRecipeTemplateIds(id);
  clearSelection();
  for (const tid of ids) {
    toggleTemplate(tid);
  }
  openAddWizard();
}

export async function createDefaultPolicy(): Promise<void> {
  await api.singboxRouterCreatePolicy('awgm-router');
  await singboxRouter.loadAll();
}

function readSettings(): SingboxRouterSettings {
  const s = get(singboxRouter.settings);
  return s ?? ({} as SingboxRouterSettings);
}

export async function setAutoDetectWan(): Promise<void> {
  const merged: SingboxRouterSettings = {
    ...readSettings(),
    wanAutoDetect: true,
  };
  await api.singboxRouterPutSettings(merged);
  await singboxRouter.loadAll();
}

export async function setManualWan(iface: string): Promise<void> {
  const merged: SingboxRouterSettings = {
    ...readSettings(),
    wanAutoDetect: false,
    wanInterface: iface,
  };
  await api.singboxRouterPutSettings(merged);
  await singboxRouter.loadAll();
}

export async function enableEngine(): Promise<void> {
  await api.singboxRouterEnable();
  await singboxRouter.loadAll();
}

export interface FinishSetupArgs {
  tunnelTag: string;
  selectedTemplates: string[];
  customFields: CustomMatcherFields;
  groups: TemplateGroup[];
}

export async function finishSetup(args: FinishSetupArgs): Promise<SubmitResult> {
  const result = await submitWizard({
    selectedTemplates: args.selectedTemplates,
    customFields: args.customFields,
    outboundCategory: 'tunnel',
    tunnelTag: args.tunnelTag,
    groups: args.groups,
  });
  await api.singboxRouterPutRouteFinal('direct');
  await mergeAndSaveSettings({
    deviceMode: 'all',
    wanAutoDetect: true,
    wanInterface: '',
    snifferEnabled: true,
  });
  await api.singboxRouterEnable();
  await singboxRouter.loadAll();
  return result;
}
