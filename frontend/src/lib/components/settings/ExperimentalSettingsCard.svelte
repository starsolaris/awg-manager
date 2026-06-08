<script lang="ts">
	import SettingsSectionLabel from './SettingsSectionLabel.svelte';
	import { FlaskConical } from 'lucide-svelte';
</script>

<div class="settings-block" id="experimental-settings">
	<div class="card">
		<SettingsSectionLabel label="Экспериментальное" icon={FlaskConical} tone="info" header cycleInVivid />
		<p class="experimental-hint">Скрытые и нестабильные функции интерфейса.</p>
	</div>
</div>

<style>
	.experimental-hint {
		margin: 0;
		padding: 0.75rem 1rem 1rem;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}
</style>
