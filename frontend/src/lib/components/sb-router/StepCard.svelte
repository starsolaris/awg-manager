<!--
  Источник дизайна: singbox-router/project/screens/EmptyState.jsx (StepCard)
-->

<script lang="ts" module>
  export type StepState = 'active' | 'upcoming' | 'done';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Check } from 'lucide-svelte';

  interface Props {
    n: number;
    title: string;
    body: string;
    state: StepState;
    disabled?: boolean;
    cta: Snippet;
    tags?: Snippet;
    extra?: Snippet;
  }

  let {
    n, title, body, state, disabled = false,
    cta, tags, extra,
  }: Props = $props();
</script>

<div class="card state-{state}" class:disabled>
  <header class="head">
    <div class="bullet">
      {#if state === 'done'}
        <Check size={14} color="#fff" />
      {:else}
        {n}
      {/if}
    </div>
    <h3 class="title">{title}</h3>
  </header>
  <p class="body">{body}</p>
  {#if tags}
    <div class="tags">
      {@render tags()}
    </div>
  {/if}
  {#if extra}
    <div class="extra">
      {@render extra()}
    </div>
  {/if}
  <div class="cta">
    {@render cta()}
  </div>
</div>

<style>
  .card {
    position: relative;
    padding: 16px;
    border-radius: var(--radius);
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 220px;
  }
  .card.state-active {
    border-color: var(--accent-line);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .card.state-done {
    border-color: var(--color-success, #22c55e);
  }
  .card.disabled {
    opacity: 0.6;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .bullet {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    font-family: var(--font-mono);
  }
  .card.state-active .bullet {
    background: var(--accent);
    color: #fff;
  }
  .card.state-done .bullet {
    background: var(--color-success, #22c55e);
    color: #fff;
  }
  .title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  .body {
    margin: 0;
    font-size: 12.5px;
    color: var(--text-secondary);
    line-height: 1.5;
    flex: 1;
  }
  .tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .extra {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cta {
    display: flex;
  }
  .cta :global(button), .cta :global(a.btn) {
    flex: 1;
  }
</style>
