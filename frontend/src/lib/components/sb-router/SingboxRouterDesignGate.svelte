<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui';
  import { SingboxRoutingPage } from '$lib/components/singbox-routing';
  import {
    SettingsDrawer,
    SingboxRouterRedesignPage,
    sbDesignMode,
    readSbDesignModeOverride,
    openSettingsDrawer,
    type SbDesignMode,
  } from '$lib/components/sb-router';

  let effectiveDesignMode = $derived.by<SbDesignMode>(() => {
    const override = readSbDesignModeOverride($page.url.searchParams);
    return override ?? $sbDesignMode;
  });
</script>

{#if effectiveDesignMode === 'classic'}
  <div class="classic-toolbar">
    <span class="classic-badge">Рабочий интерфейс</span>
    <Button variant="secondary" size="sm" onclick={openSettingsDrawer}>Настройки SBR</Button>
  </div>
  <SingboxRoutingPage />
{:else}
  <SingboxRouterRedesignPage />
{/if}

<SettingsDrawer />

<style>
  .classic-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .classic-badge {
    font-size: 11px;
    color: var(--text-muted);
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    border-radius: 999px;
    padding: 0.15rem 0.5rem;
  }

  @media (max-width: 640px) {
    .classic-toolbar {
      justify-content: space-between;
      flex-wrap: wrap;
    }
  }
</style>
