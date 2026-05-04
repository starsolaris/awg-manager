<script lang="ts">
	import { singboxWizard } from '$lib/stores/singboxWizard';
	import { goto } from '$app/navigation';

	const wizardState = singboxWizard.state;

	function close(): void { singboxWizard.close(); }
	function openConnections(): void {
		singboxWizard.close();
		goto('/connections');
	}
</script>

<div class="wrap">
	<div class="mark">OK</div>
	<div class="head">sing-box router запущен</div>
	<div class="sub">Трафик {$wizardState.deviceMacs.length} устройств для выбранных сервисов идёт через {$wizardState.tunnelTag}.</div>
	<div class="actions">
		<button type="button" class="btn ghost" onclick={openConnections}>Открыть Соединения</button>
		<button type="button" class="btn primary" onclick={close}>Закрыть</button>
	</div>
</div>

<style>
	.wrap { text-align: center; padding: 2rem 1rem; }
	.mark {
		width: 56px; height: 56px;
		border-radius: 50%;
		background: #238636;
		margin: 0 auto 1rem;
		display: flex; align-items: center; justify-content: center;
		font-size: 18px;
		color: white;
		font-weight: 600;
	}
	.head { color: var(--color-text-primary); font-size: 1.05rem; font-weight: 600; margin-bottom: 0.4rem; }
	.sub { color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1.2rem; }
	.actions { display: flex; gap: 0.5rem; justify-content: center; }
	.btn { padding: 0.4rem 1rem; border-radius: 6px; font: inherit; font-size: 0.85rem; cursor: pointer; border: 1px solid transparent; }
	.ghost { color: var(--color-text-muted); background: transparent; }
	.primary { color: white; background: #238636; border-color: #2ea043; }
</style>
