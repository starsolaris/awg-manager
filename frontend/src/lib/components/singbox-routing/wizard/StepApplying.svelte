<script lang="ts">
	import { singboxWizard } from '$lib/stores/singboxWizard';

	const wizardState = singboxWizard.state;

	function symbol(status: string): string {
		if (status === 'ok') return '[ok]';
		if (status === 'running') return '[..]';
		if (status === 'err') return '[err]';
		return '[  ]';
	}
	function color(status: string): string {
		if (status === 'ok') return '#3fb950';
		if (status === 'running') return 'var(--color-accent)';
		if (status === 'err') return '#f85149';
		return 'var(--color-text-muted)';
	}
</script>

<div class="title">Применяем</div>

<div class="log">
	{#each $wizardState.applyLog as entry, i (i)}
		<div class="line" style="color: {color(entry.status)}">
			{symbol(entry.status)} {entry.label}
		</div>
	{/each}
</div>

<style>
	.title { font-size: 1.05rem; color: var(--color-text-primary); font-weight: 600; margin-bottom: 0.6rem; }
	.log {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.85rem;
		line-height: 2;
	}
</style>
