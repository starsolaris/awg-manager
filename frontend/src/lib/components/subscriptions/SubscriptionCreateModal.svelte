<script lang="ts">
	import { goto } from '$app/navigation';
	import { Modal, Button, Dropdown } from '$lib/components/ui';
	import { api } from '$lib/api/client';
	import HeadersTextarea from './HeadersTextarea.svelte';
	import { DEFAULT_PRESET, parseHeadersText } from './headersParser';
	import {
		DEFAULT_SUBSCRIPTION_URLTEST,
		type SubscriptionMode,
	} from '$lib/types';

	interface Props {
		open: boolean;
	}
	let { open = $bindable(false) }: Props = $props();

	let label = $state('');
	let url = $state('');
	let headersText = $state(DEFAULT_PRESET);
	let refreshHoursStr = $state('24');
	let refreshHours = $state(24);
	let enabled = $state(true);
	let mode = $state<SubscriptionMode>('selector');
	let utUrl = $state(DEFAULT_SUBSCRIPTION_URLTEST.url);
	let utIntervalSec = $state(DEFAULT_SUBSCRIPTION_URLTEST.intervalSec);
	let utToleranceMs = $state(DEFAULT_SUBSCRIPTION_URLTEST.toleranceMs);
	let submitting = $state(false);
	let error = $state('');

	$effect(() => {
		refreshHours = parseInt(refreshHoursStr, 10) || 0;
	});

	const refreshOptions = [
		{ value: '0', label: 'Только вручную' },
		{ value: '1', label: 'Каждый час' },
		{ value: '6', label: 'Каждые 6 часов' },
		{ value: '12', label: 'Каждые 12 часов' },
		{ value: '24', label: 'Раз в сутки' },
		{ value: '168', label: 'Раз в неделю' },
	];

	function reset(): void {
		label = '';
		url = '';
		headersText = DEFAULT_PRESET;
		refreshHoursStr = '24';
		refreshHours = 24;
		enabled = true;
		mode = 'selector';
		utUrl = DEFAULT_SUBSCRIPTION_URLTEST.url;
		utIntervalSec = DEFAULT_SUBSCRIPTION_URLTEST.intervalSec;
		utToleranceMs = DEFAULT_SUBSCRIPTION_URLTEST.toleranceMs;
		error = '';
	}

	function close(): void {
		if (submitting) return;
		open = false;
		reset();
	}

	async function submit(): Promise<void> {
		error = '';
		submitting = true;
		try {
			const sub = await api.createSubscription({
				label,
				url,
				headers: parseHeadersText(headersText),
				refreshHours,
				enabled,
				mode,
				urlTest:
					mode === 'urltest'
						? { url: utUrl, intervalSec: utIntervalSec, toleranceMs: utToleranceMs }
						: undefined,
			});
			open = false;
			reset();
			goto(`/subscriptions/${sub.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Не удалось создать';
		} finally {
			submitting = false;
		}
	}
</script>

<Modal {open} title="Добавить подписку" size="lg" onclose={close}>
	<form
		class="form"
		onsubmit={(e) => {
			e.preventDefault();
			submit();
		}}
		id="sub-create-form"
	>
		<label class="row">
			<span class="lbl">Название</span>
			<input class="inp" type="text" bind:value={label} placeholder="Provider X" required />
		</label>
		<label class="row">
			<span class="lbl">URL подписки</span>
			<input
				class="inp"
				type="url"
				bind:value={url}
				placeholder="https://provider.example/sub/abc"
				required
			/>
		</label>
		<div class="row">
			<HeadersTextarea bind:value={headersText} />
		</div>
		<div class="row">
			<Dropdown
				label="Авто-обновление"
				bind:value={refreshHoursStr}
				options={refreshOptions}
				fullWidth
			/>
		</div>

		<div class="row">
			<span class="lbl">Режим выбора сервера</span>
			<div class="mode-grid" role="radiogroup" aria-label="Режим выбора сервера">
				<button
					type="button"
					role="radio"
					aria-checked={mode === 'selector'}
					class="mode-card"
					class:selected={mode === 'selector'}
					onclick={() => (mode = 'selector')}
				>
					<div class="mode-title">Ручной выбор</div>
					<div class="mode-desc">
						Сервер переключается вручную из списка. Подходит когда сам знаешь, какой нужен.
					</div>
					{#if mode === 'selector'}
						<span class="mode-check" aria-hidden="true">
							<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
						</span>
					{/if}
				</button>
				<button
					type="button"
					role="radio"
					aria-checked={mode === 'urltest'}
					class="mode-card"
					class:selected={mode === 'urltest'}
					onclick={() => (mode = 'urltest')}
				>
					<div class="mode-title">Автовыбор по скорости</div>
					<div class="mode-desc">
						Sing-box сам пингует серверы и держит самый быстрый. Возможен ручной override.
					</div>
					{#if mode === 'urltest'}
						<span class="mode-check" aria-hidden="true">
							<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
						</span>
					{/if}
				</button>
			</div>
		</div>

		{#if mode === 'urltest'}
			<div class="urltest-block">
				<label class="row">
					<span class="lbl">URL для проверки</span>
					<input
						class="inp"
						type="url"
						bind:value={utUrl}
						placeholder={DEFAULT_SUBSCRIPTION_URLTEST.url}
					/>
				</label>
				<div class="row two-col">
					<label class="col">
						<span class="lbl">Интервал, сек</span>
						<input class="inp" type="number" min="10" max="3600" bind:value={utIntervalSec} />
					</label>
					<label class="col">
						<span class="lbl">Допуск, мс</span>
						<input class="inp" type="number" min="0" max="2000" bind:value={utToleranceMs} />
					</label>
				</div>
			</div>
		{/if}

		<label class="row chk">
			<input type="checkbox" bind:checked={enabled} />
			<span>Включить сразу</span>
		</label>
		{#if error}<div class="err">{error}</div>{/if}
	</form>

	{#snippet actions()}
		<Button variant="ghost" onclick={close} disabled={submitting}>Отмена</Button>
		<Button
			variant="primary"
			onclick={submit}
			disabled={submitting}
			loading={submitting}
		>
			{submitting ? 'Создаём...' : 'Создать'}
		</Button>
	{/snippet}
</Modal>

<style>
	.form { display: flex; flex-direction: column; gap: 1rem; }
	.row { display: flex; flex-direction: column; gap: 0.3rem; }
	.row.chk { flex-direction: row; align-items: center; gap: 0.5rem; }
	.row.two-col { flex-direction: row; gap: 0.75rem; }
	.col { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }
	.lbl { font-size: 0.85rem; color: var(--color-text-muted); }
	.inp {
		padding: 0.5rem 0.7rem;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		color: var(--color-text-primary);
	}
	.err { color: #f85149; font-size: 0.85rem; }

	.mode-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}
	.mode-card {
		position: relative;
		text-align: left;
		padding: 0.7rem 0.85rem;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text-primary);
		cursor: pointer;
		font: inherit;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		transition: border-color 120ms, background 120ms;
	}
	.mode-card:hover { border-color: var(--color-text-muted); }
	.mode-card.selected {
		border-color: var(--color-primary, #3b82f6);
		background: rgba(59, 130, 246, 0.06);
	}
	.mode-card:focus-visible {
		outline: 2px solid var(--color-primary, #3b82f6);
		outline-offset: 2px;
	}
	.mode-title { font-weight: 500; font-size: 0.9rem; }
	.mode-desc { font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.35; }
	.mode-check {
		position: absolute;
		top: 0.55rem;
		right: 0.55rem;
		width: 16px;
		height: 16px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--color-primary, #3b82f6);
	}
	.mode-check svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 3; }

	.urltest-block {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding: 0.7rem 0.85rem;
		background: var(--color-bg-secondary, var(--color-bg-primary));
		border: 1px dashed var(--color-border);
		border-radius: 4px;
	}
	@media (max-width: 480px) {
		.mode-grid { grid-template-columns: 1fr; }
		.row.two-col { flex-direction: column; }
	}
</style>
