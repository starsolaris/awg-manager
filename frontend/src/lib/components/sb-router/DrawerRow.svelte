<!--
  Источник дизайна: singbox-router/project/screens/StatusDrawerView.jsx (DrawerRow)
  При правках сверять с JSX напрямую.
-->

<script lang="ts">
  interface Props {
    label: string;
    value: string;
    /** Mono font для value (для tech-данных типа mark/cidr). */
    mono?: boolean;
    /** Меньший padding и font (для collapsed-секций). */
    small?: boolean;
    /** Опциональный inline-link справа от value (серый/акцентный текст; не кликабелен в F3). */
    linkLabel?: string;
  }
  let { label, value, mono = false, small = false, linkLabel }: Props = $props();
</script>

<div class="row" class:is-small={small}>
  <span class="label">{label}</span>
  <div class="value-group">
    <span class="value" class:is-mono={mono} class:is-small={small}>{value}</span>
    {#if linkLabel}
      <span class="link">{linkLabel}</span>
    {/if}
  </div>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 2px;
  }
  .row.is-small { padding: 4px 2px; }

  .label {
    font-size: 11.5px;
    color: var(--text-muted);
    font-family: var(--font-sans);
  }

  .value-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .value {
    font-size: 12px;
    color: var(--text-primary);
    font-family: var(--font-sans);
    white-space: nowrap;
  }
  .value.is-small { font-size: 11px; }
  .value.is-mono { font-family: var(--font-mono); }

  .link {
    color: var(--accent);
    font-size: 11px;
    font-family: var(--font-sans);
  }
</style>
