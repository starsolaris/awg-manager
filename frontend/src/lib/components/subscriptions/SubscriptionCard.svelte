<script lang="ts">
	import type { Subscription } from '$lib/types';
	import { goto } from '$app/navigation';

	interface Props {
		subscription: Subscription;
		ondelete?: (id: string) => void;
	}
	let { subscription, ondelete }: Props = $props();

	function open(): void {
		goto(`/subscriptions/${subscription.id}`);
	}

	function requestDelete(e: MouseEvent): void {
		e.stopPropagation();
		ondelete?.(subscription.id);
	}

	const status = $derived(
		subscription.lastError ? 'error' : subscription.lastFetched ? 'ok' : 'pending',
	);
	const lastFetchedHuman = $derived(
		subscription.lastFetched ? formatRelative(subscription.lastFetched) : '—',
	);

	function formatRelative(iso: string): string {
		const d = new Date(iso);
		const diff = Date.now() - d.getTime();
		const hours = Math.floor(diff / 3_600_000);
		if (hours < 1) return 'только что';
		if (hours < 24) return `${hours}ч назад`;
		return `${Math.floor(hours / 24)}д назад`;
	}
</script>

<div
	role="button"
	tabindex="0"
	class="card"
	class:err={status === 'error'}
	onclick={open}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open();
		}
	}}
>
	<div class="head">
		<div class="label">{subscription.label || subscription.url}</div>
		<div class="head-right">
			<div class="badge {status}">
				{#if status === 'ok'}OK{:else if status === 'error'}Ошибка{:else}—{/if}
			</div>
			{#if ondelete}
				<button
					type="button"
					class="card-remove"
					title="Удалить подписку"
					aria-label="Удалить подписку {subscription.label || subscription.url}"
					onclick={requestDelete}
				>
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
	<div class="meta mono">{subscription.inboundTag} · :{subscription.listenPort}</div>
	<div class="info">
		{subscription.memberTags.length} серверов
		{#if subscription.activeMember}· активен <span class="mono">{subscription.activeMember}</span>{/if}
		· обновлено {lastFetchedHuman}
		{#if subscription.refreshHours > 0}· auto {subscription.refreshHours}ч{/if}
	</div>
	{#if subscription.lastError}
		<div class="err-msg mono">{subscription.lastError}</div>
	{/if}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.85rem 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font: inherit;
		text-align: left;
		color: var(--color-text-primary);
		cursor: pointer;
	}
	.card:focus-visible {
		outline: 2px solid var(--color-primary, #3b82f6);
		outline-offset: 2px;
	}
	.card.err { border-color: #f85149; }
	.head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
	.head-right { display: flex; align-items: center; gap: 0.5rem; }
	.card-remove {
		width: 22px;
		height: 22px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 50%;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: color 120ms, border-color 120ms, background 120ms;
	}
	.card-remove:hover {
		color: var(--color-error, #f85149);
		border-color: var(--color-error, #f85149);
		background: rgba(248, 81, 73, 0.08);
	}
	.card-remove:focus-visible {
		outline: 2px solid var(--color-error, #f85149);
		outline-offset: 1px;
	}
	.label { font-weight: 600; font-size: 0.95rem; }
	.badge { font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 999px; }
	.badge.ok { background: rgba(63, 185, 80, 0.15); color: #3fb950; }
	.badge.error { background: rgba(248, 81, 73, 0.15); color: #f85149; }
	.badge.pending { background: var(--color-bg-tertiary); color: var(--color-text-muted); }
	.meta { font-size: 0.75rem; color: var(--color-text-muted); }
	.info { font-size: 0.82rem; color: var(--color-text-muted); }
	.err-msg { font-size: 0.78rem; color: #f85149; margin-top: 0.3rem; }
	.mono { font-family: var(--font-mono, ui-monospace, monospace); }
</style>
