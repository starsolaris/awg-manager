<!--
  Источник дизайна: singbox-router/project/parts/FlowGraph.jsx (FlowArrow)
  Static dashed gradient line + chevron arrowhead. Two states: active (accent
  colors, looser dash 4/3) vs inactive (muted colors, tighter dash 2/3).
-->

<script lang="ts">
  interface Props {
    active?: boolean;
  }
  let { active = true }: Props = $props();
  let gradId = $derived(active ? 'fa-on' : 'fa-off');
</script>

<svg width="32" height="14" viewBox="0 0 32 14" class="arrow" aria-hidden="true">
  <defs>
    <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
      {#if active}
        <stop offset="0%" stop-color="var(--accent-line)" />
        <stop offset="100%" stop-color="var(--accent)" />
      {:else}
        <stop offset="0%" stop-color="var(--border)" />
        <stop offset="100%" stop-color="var(--text-muted)" />
      {/if}
    </linearGradient>
  </defs>
  <line
    x1="0" y1="7" x2="22" y2="7"
    stroke="url(#{gradId})"
    stroke-width="2"
    stroke-dasharray={active ? '4 3' : '2 3'}
  />
  <polyline
    points="20,3 26,7 20,11"
    fill="none"
    stroke={active ? 'var(--accent)' : 'var(--text-muted)'}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>

<style>
  .arrow {
    flex-shrink: 0;
  }
</style>
