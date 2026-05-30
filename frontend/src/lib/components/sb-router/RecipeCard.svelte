<!--
  Источник дизайна: singbox-router/project/screens/EmptyState.jsx (RecipeCard)
-->

<script lang="ts" module>
  export type RecipeTint = 'accent' | 'success' | 'info';
</script>

<script lang="ts">
  import { ArrowRight } from 'lucide-svelte';

  interface Props {
    tag: string;
    title: string;
    desc: string;
    count: string;
    tint: RecipeTint;
    onclick: () => void;
  }

  let { tag, title, desc, count, tint, onclick }: Props = $props();
</script>

<button type="button" class="card tint-{tint}" {onclick}>
  <div class="tag-row">
    <span class="tag">{tag}</span>
  </div>
  <h4 class="title">{title}</h4>
  <p class="desc">{desc}</p>
  <div class="foot">
    <span class="count">{count}</span>
    <span class="apply">
      Применить
      <ArrowRight size={12} />
    </span>
  </div>
</button>

<style>
  .card {
    padding: 14px;
    border-radius: var(--radius);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    min-height: 170px;
    text-align: left;
    font-family: inherit;
    color: inherit;
  }
  .card:hover {
    border-color: var(--accent);
  }
  .tag-row {
    display: flex;
  }
  .tag {
    display: inline-flex;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid;
  }
  .tint-accent .tag {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: var(--accent-line);
  }
  .tint-success .tag {
    background: rgba(115, 156, 122, 0.14);
    color: var(--color-success, #22c55e);
    border-color: rgba(115, 156, 122, 0.3);
  }
  .tint-info .tag {
    background: rgba(107, 148, 168, 0.14);
    color: var(--color-info, #3b82f6);
    border-color: rgba(107, 148, 168, 0.3);
  }
  .title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .desc {
    margin: 0;
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.5;
    flex: 1;
  }
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px solid var(--border);
  }
  .count {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
  .apply {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--accent);
    font-weight: 500;
  }
</style>
