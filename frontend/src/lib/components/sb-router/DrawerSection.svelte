<!--
  Источник дизайна: singbox-router/project/screens/StatusDrawerView.jsx (DrawerSection)
  При правках сверять с JSX напрямую.
-->

<script lang="ts" module>
  import type { Snippet } from 'svelte';
</script>

<script lang="ts">
  import { SectionLabel } from '$lib/components/ui';

  interface Props {
    title: string;
    /** Опциональный badge справа от title (например <Badge variant="warning">2</Badge>). */
    badge?: Snippet;
    /** Серый текст-хинт справа от header'а (например "Изменить (в Эксперт)"). */
    actionHint?: string;
    /** Если true — body рендерится со сниженной opacity (визуальное "свернуто"). */
    collapsed?: boolean;
    children: Snippet;
  }
  let { title, badge, actionHint, collapsed = false, children }: Props = $props();
</script>

<div class="section">
  <header class="section-header">
    <div class="title-group">
      <SectionLabel>{title}</SectionLabel>
      {#if badge}{@render badge()}{/if}
    </div>
    {#if actionHint}
      <span class="action-hint">{actionHint}</span>
    {/if}
  </header>
  <div class="body" class:is-collapsed={collapsed}>
    {@render children()}
  </div>
</div>

<style>
  .section {
    display: flex;
    flex-direction: column;
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .action-hint {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-sans);
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .body.is-collapsed {
    opacity: 0.55;
  }
</style>
