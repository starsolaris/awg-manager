<!--
  Источник дизайна: singbox-router/project/parts/FlowGraph.jsx (FlowGraph)
  Hero-баннер сверху Beginner view. 3 station'а + 2 arrow'а в grid layout.
  Отклонение от дизайна: убран Internet station (избыточный шум);
  Outbounds → «ВЫХОДЫ», группированы по kind (direct / туннели).
-->

<script lang="ts" module>
  import type { FlowOutboundTone } from './flowData';
  import type { StatusDotVariant } from '$lib/components/ui';

  /**
   * Map FlowOutboundTone → StatusDotVariant.
   * 'accent' не существует в StatusDotVariant → fallback на 'info'.
   */
  export function mapTone(t: FlowOutboundTone): StatusDotVariant {
    if (t === 'success') return 'success';
    if (t === 'error')   return 'error';
    if (t === 'warning') return 'warning';
    if (t === 'muted')   return 'muted';
    return 'info'; // 'accent' → 'info' (closest available in StatusDotVariant)
  }
</script>

<script lang="ts">
  import { singboxRouter as singboxRouterStore } from '$lib/stores/singboxRouter';
  import { singboxStatus } from '$lib/stores/singbox';
  import { systemInfo } from '$lib/stores/system';
  import { StatusDot } from '$lib/components/ui';
  import FlowStation from './FlowStation.svelte';
  import FlowArrow from './FlowArrow.svelte';
  import { deriveOutboundList } from './flowData';
  import { openDrawer } from './drawerStore';

  const status = singboxRouterStore.status;
  const outboundsStore = singboxRouterStore.outbounds;

  let s = $derived($status);
  let ob = $derived($outboundsStore);
  let singboxInstallState = $derived($singboxStatus);
  let singboxInstallStatus = $derived(singboxInstallState.data);

  let engineOn = $derived(s?.enabled ?? false);
  let devicesCount = $derived(s?.deviceCount ?? 0);
  let rulesCount = $derived(s?.ruleCount ?? 0);
  let policyName = $derived(s?.policyName || '—');
  let deviceMode = $derived(s?.deviceMode);

  function cleanVersion(value?: string | null): string {
    return (value ?? '').trim();
  }

  let singboxVersion = $derived(cleanVersion(
    singboxInstallStatus?.version ?? singboxInstallStatus?.currentVersion ?? $systemInfo.data?.singbox?.version,
  ));

  let outboundList = $derived(deriveOutboundList(ob ?? []));
  let totalOutbounds = $derived((ob ?? []).length);
  let directItems = $derived(outboundList.items.filter((i) => i.kind === 'direct'));
  let tunnelItems = $derived(outboundList.items.filter((i) => i.kind === 'tunnel'));

  let modeLabel = $derived(deviceMode === 'all' ? 'весь роутер' : 'policy');

  let rulesSub = $derived.by(() => {
    if (!engineOn) return 'выключен';
    const parts = ['first-match', modeLabel];
    if (singboxVersion) parts.push(`v${singboxVersion}`);
    return parts.join(' · ');
  });
  let devicesSub = $derived(`policy: ${policyName}`);
</script>

<div class="flow">
  <!-- Faint grid pattern overlay -->
  <svg class="bg-grid" aria-hidden="true">
    <defs>
      <pattern id="flowgrid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#flowgrid)" />
  </svg>

  <div class="row">
    <!-- Devices -->
    <FlowStation
      tone="accent"
      title="Устройства"
      metric={devicesCount}
      sub={devicesSub}
    >
      {#snippet icon()}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="14" height="10" rx="2" />
          <rect x="16" y="8" width="6" height="13" rx="1" />
          <line x1="9" y1="17" x2="9" y2="21" />
          <line x1="5" y1="21" x2="13" y2="21" />
        </svg>
      {/snippet}
    </FlowStation>

    <FlowArrow active={engineOn} />

    <!-- sing-box (engine) -->
    <FlowStation
      tone={engineOn ? 'success' : 'muted'}
      title="sing-box"
      metric={rulesCount}
      sub={rulesSub}
      glow={engineOn}
      onclick={openDrawer}
    />

    <FlowArrow active={engineOn} />

    <!-- Выходы (inline tile, не FlowStation) — без Internet station -->
    <div class="outbounds">
      <div class="outbounds-label">ВЫХОДЫ · {totalOutbounds}</div>
      {#if totalOutbounds === 0}
        <div class="outbounds-empty">нет выходов</div>
      {:else}
        {#if directItems.length > 0}
          <div class="ob-group">
            <div class="ob-group-cap">прямой</div>
            <div class="outbounds-grid">
              {#each directItems as item (item.tag)}
                <div class="ob-row">
                  <StatusDot variant={mapTone(item.tone)} size="sm" />
                  <span class="ob-label">{item.label}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        {#if tunnelItems.length > 0}
          <div class="ob-group">
            <div class="ob-group-cap">туннели</div>
            <div class="outbounds-grid">
              {#each tunnelItems as item (item.tag)}
                <div class="ob-row">
                  <StatusDot variant={mapTone(item.tone)} size="sm" />
                  <span class="ob-label">{item.label}</span>
                </div>
              {/each}
              {#if outboundList.hiddenCount > 0}
                <div class="ob-row ob-more">
                  <span>+{outboundList.hiddenCount} ещё</span>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .flow {
    position: relative;
    padding: 20px 24px;
    background: linear-gradient(180deg,
      color-mix(in srgb, var(--accent) 5%, var(--bg-secondary)) 0%,
      var(--bg-secondary) 100%);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .bg-grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.04;
    pointer-events: none;
    color: var(--text-primary);
  }

  .row {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1.6fr;
    align-items: center;
    gap: 12px;
  }

  .outbounds {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    min-height: 72px;
  }
  .outbounds-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 2px;
  }
  .outbounds-empty {
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
  }
  .ob-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ob-group + .ob-group {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px dashed var(--border);
  }
  .ob-group-cap {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    opacity: 0.7;
  }
  .outbounds-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }
  .ob-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }
  .ob-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ob-more {
    color: var(--text-muted);
    font-style: italic;
    grid-column: span 2;
    text-align: right;
  }

  /* ── Mobile: vertical orientation (<768px) ── */
  @media (max-width: 768px) {
    .flow {
      padding: 14px 16px;
    }

    .row {
      display: flex !important;
      flex-direction: column !important;
      grid-template-columns: none !important;
      align-items: stretch;
      gap: 6px;
    }

    /* Rotate horizontal arrows 90° to point downward */
    .row :global(.arrow) {
      align-self: center;
      transform: rotate(90deg);
      flex-shrink: 0;
    }

    /* Outbounds tile: full width, reset min-height */
    .outbounds {
      width: 100%;
      min-height: unset;
      box-sizing: border-box;
    }

    /* Outbounds grid: single column on very narrow viewports */
    @media (max-width: 400px) {
      .outbounds-grid {
        grid-template-columns: 1fr;
      }
      .ob-more {
        grid-column: span 1;
      }
    }
  }
</style>
