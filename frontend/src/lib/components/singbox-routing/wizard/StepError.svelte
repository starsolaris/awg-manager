<script lang="ts">
	import { singboxWizard } from '$lib/stores/singboxWizard';

	interface Props {
		onRetry: () => void;
	}
	let { onRetry }: Props = $props();

	const wizardState = singboxWizard.state;

	function close(): void { singboxWizard.close(); }
	function openLogs(): void {
		window.open('/logs?bucket=singbox', '_blank');
	}
</script>

<div class="title">Не удалось применить</div>
<div class="sub">Конфигурация осталась на диске. Откройте журнал или попробуйте повторить.</div>

<div class="err">
	{$wizardState.error?.phase ?? '?'}: {$wizardState.error?.message ?? 'unknown'}
</div>

<div class="actions">
	<button type="button" class="btn ghost" onclick={openLogs}>Открыть Журнал</button>
	<button type="button" class="btn ghost" onclick={close}>Закрыть</button>
	<button type="button" class="btn primary" onclick={onRetry}>Повторить</button>
</div>

<style>
	.title { color: var(--color-text-primary); font-weight: 600; margin-bottom: 0.4rem; }
	.sub { color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1rem; }
	.err {
		background: rgba(248,81,73,0.08);
		border-left: 3px solid #f85149;
		padding: 0.7rem 1rem;
		border-radius: 4px;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.78rem;
		color: var(--color-text-primary);
		line-height: 1.5;
	}
	.actions { margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center; }
	.btn { padding: 0.4rem 1rem; border-radius: 6px; font: inherit; font-size: 0.85rem; cursor: pointer; border: 1px solid transparent; }
	.ghost { color: var(--color-text-muted); background: transparent; }
	.primary { color: white; background: #238636; border-color: #2ea043; }
</style>
