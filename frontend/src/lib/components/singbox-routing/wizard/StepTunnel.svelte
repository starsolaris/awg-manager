<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { singboxWizard } from '$lib/stores/singboxWizard';
	import { singboxRouter } from '$lib/stores/singboxRouter';
	import { Button } from '$lib/components/ui';

	interface Props {
		onAdvance: () => void;
	}
	let { onAdvance }: Props = $props();

	const wizardState = singboxWizard.state;
	const optionsStore = singboxRouter.options;
	const optionsReady = singboxRouter.optionsReady;

	// Filter out "Специальные" group: 'direct' makes no sense for "through
	// which tunnel?". The wizard only offers actual outbounds.
	const groups = $derived(
		$optionsStore.filter((g) => g.group !== 'Специальные'),
	);

	const totalCount = $derived(
		groups.reduce((sum, g) => sum + g.items.length, 0),
	);

	const selected = $derived($wizardState.tunnelTag);

	// Auto-pick when exactly 1 outbound exists across all groups.
	// Gated on $optionsReady to avoid firing during cold-load (when only
	// `outbounds` has settled but awgTags/sing-box tunnels/subscriptions
	// stores are still pending — leaving us with a transient totalCount=1
	// that disappears once the other sources arrive).
	// Guards on selected via untrack so this effect doesn't re-fire after
	// it sets the tag (which would loop with onAdvance call).
	$effect(() => {
		if (!$optionsReady) return;
		if (totalCount !== 1) return;
		if (untrack(() => selected)) return;
		const only = groups.flatMap((g) => g.items)[0];
		if (!only) return;
		singboxWizard.setTunnelTag(only.value);
		setTimeout(onAdvance, 500);
	});

	function pick(value: string): void {
		singboxWizard.setTunnelTag(value);
	}

	function primaryLabel(label: string): string {
		// Strip ` · <tag>` and ` (<tag>)` to extract human-friendly part.
		const subBreak = label.indexOf(' · ');
		if (subBreak > 0) return label.slice(0, subBreak);
		const parenBreak = label.indexOf(' (');
		if (parenBreak > 0) return label.slice(0, parenBreak);
		return label;
	}

</script>

<div class="title">Через какой туннель пускать трафик?</div>

{#if totalCount === 1}
	{@const only = groups.flatMap((g) => g.items)[0]}
	<div class="toast">Используем <b>{primaryLabel(only.label)}</b>. Шаг проскакивается автоматически.</div>
{:else if totalCount > 1}
	<div class="hint">Выберите outbound, через который пойдут выбранные пресеты.</div>
	<div class="groups">
		{#each groups as g (g.group)}
			<div class="group-head">{g.group}</div>
			<div class="radio-list">
				{#each g.items as item (item.value)}
					{@const checked = selected === item.value}
					{@const human = primaryLabel(item.label)}
					<label class="option" class:checked>
						<input
							type="radio"
							name="wizard-tunnel-tag"
							value={item.value}
							{checked}
							onchange={() => pick(item.value)}
						/>
						<span class="option-content">
							<span class="option-name">{human}</span>
							{#if item.value !== human}
								<span class="option-meta">{item.value}</span>
							{/if}
						</span>
						<span class="option-check" aria-hidden="true">
							{#if checked}
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="20 6 9 17 4 12"/>
								</svg>
							{/if}
						</span>
					</label>
				{/each}
			</div>
		{/each}
	</div>
{:else}
	<div class="hint">Туннелей нет. Создайте AWG туннель в разделе Туннели и вернитесь.</div>
	<div style="margin-top: 0.75rem;">
		<Button variant="secondary" onclick={() => { singboxWizard.close(); goto('/tunnels/new'); }}>
			Перейти к созданию туннеля
		</Button>
	</div>
{/if}

<style>
	.title { font-size: 1.05rem; color: var(--color-text-primary); font-weight: 600; margin-bottom: 0.6rem; }
	.hint { color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1rem; }
	.toast {
		background: rgba(63,185,80,0.1);
		border-left: 3px solid #3fb950;
		padding: 0.7rem 1rem;
		border-radius: 4px;
		color: var(--color-text-primary);
		font-size: 0.85rem;
	}

	.radio-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.875rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease;
		min-width: 0;
	}
	.option:hover:not(.checked) {
		border-color: var(--color-border-hover);
		background: var(--color-bg-hover);
	}
	.option.checked {
		border-color: var(--color-accent);
		background: rgba(122, 162, 247, 0.08);
	}
	.option input[type='radio'] {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		width: 0;
		height: 0;
	}
	.option-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}
	.option-name {
		font-size: 0.875rem;
		color: var(--color-text-primary);
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.option-meta {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.option-check {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		color: var(--color-accent);
	}

	.groups {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.group-head {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color-text-muted);
		padding: 0.25rem 0;
	}
</style>
