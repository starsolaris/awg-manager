<!--
  Источник дизайна: singbox-router/project/parts/FlowGraph.jsx (FlowStation)
  Primitive: icon + uppercase title + metric + sub. Опциональный glow ring
  (используется на engine station когда engineOn=true). Опциональный onclick
  оборачивает в <button>.
-->

<script lang="ts" module>
  import type { Snippet } from 'svelte';
  export type FlowStationTone = 'accent' | 'success' | 'info' | 'muted' | 'warning' | 'error';
</script>

<script lang="ts">
  interface Props {
    icon?: Snippet;
    tone: FlowStationTone;
    title: string;
    metric?: number | null;
    sub: string;
    glow?: boolean;
    onclick?: () => void;
    compact?: boolean;
  }
  let {
    icon,
    tone,
    title,
    metric = null,
    sub,
    glow = false,
    onclick,
    compact = false,
  }: Props = $props();

  let clickable = $derived(typeof onclick === 'function');
</script>

{#snippet inner()}
  <div class="icon-row tone-{tone}">
    {#if icon}{@render icon()}{/if}
    <span class="title">{title}</span>
  </div>
  <div class="metric-row">
    {#if metric != null}
      <span class="metric" class:is-compact={compact}>{metric}</span>
    {/if}
    <span class="sub">{sub}</span>
  </div>
{/snippet}

{#if clickable}
  <button
    type="button"
    class="station tone-{tone}"
    class:is-glow={glow}
    class:is-compact={compact}
    onclick={onclick}
  >
    {@render inner()}
  </button>
{:else}
  <div
    class="station tone-{tone}"
    class:is-glow={glow}
    class:is-compact={compact}
  >
    {@render inner()}
  </div>
{/if}

<style>
  .station {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 10px 14px;
    gap: 2px;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: default;
    transition: border-color var(--t-fast), box-shadow var(--t-fast);
  }
  button.station {
    cursor: pointer;
  }
  button.station:hover { opacity: 0.92; }
  button.station:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .station.is-compact { padding: 8px 12px; }

  /* Glow рамка (для engine station): окрашивается по tone */
  .station.is-glow.tone-accent  { border-color: var(--accent);  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent)  10%, transparent); }
  .station.is-glow.tone-success { border-color: var(--success); box-shadow: 0 0 0 4px color-mix(in srgb, var(--success) 10%, transparent); }
  .station.is-glow.tone-info    { border-color: var(--info);    box-shadow: 0 0 0 4px color-mix(in srgb, var(--info)    10%, transparent); }
  .station.is-glow.tone-warning { border-color: var(--warning); box-shadow: 0 0 0 4px color-mix(in srgb, var(--warning) 10%, transparent); }
  .station.is-glow.tone-error   { border-color: var(--error);   box-shadow: 0 0 0 4px color-mix(in srgb, var(--error)   10%, transparent); }
  .station.is-glow.tone-muted   { border-color: var(--text-muted); }

  .icon-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 22px;
  }
  .icon-row.tone-accent  { color: var(--accent); }
  .icon-row.tone-success { color: var(--success); }
  .icon-row.tone-info    { color: var(--info); }
  .icon-row.tone-warning { color: var(--warning); }
  .icon-row.tone-error   { color: var(--error); }
  .icon-row.tone-muted   { color: var(--text-muted); }

  .title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .metric-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .metric {
    font-size: 22px;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--text-primary);
  }
  .metric.is-compact { font-size: 18px; }
  .sub {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-sans);
  }
</style>
