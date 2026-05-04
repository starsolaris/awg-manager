<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';
	import type { SingboxRouterPreset } from '$lib/types';
	import { singboxWizard } from '$lib/stores/singboxWizard';

	interface Props {
		presets: SingboxRouterPreset[];
	}
	let { presets }: Props = $props();

	const wizardState = singboxWizard.state;

	const selectedPresets = $derived(
		$wizardState.presetIds
			.map((id) => presets.find((p) => p.id === id))
			.filter((p): p is SingboxRouterPreset => !!p),
	);
	const ruleSetCount = $derived(
		selectedPresets.reduce((acc, p) => acc + p.ruleSets.length, 0),
	);

	// Autodetect DNS from tunnel.interface.dns once we land on the summary.
	// tunnelTag is used directly as the tunnel ID (AWGTagInfo.tag === tunnel.id).
	// If detection fails or the field is empty, leave dnsServer as null so the
	// orchestrator falls back to 1.1.1.1.
	onMount(async () => {
		if (!$wizardState.tunnelTag) return;
		try {
			const tunnel = await api.getTunnel($wizardState.tunnelTag);
			const dns = tunnel.interface?.dns?.trim();
			if (dns) singboxWizard.setDnsServer(dns);
		} catch {
			// silent; orchestrator will use the Cloudflare fallback
		}
	});
</script>

<div class="title">Что будет сделано</div>

<div class="row"><div class="lbl">Policy</div><div class="val">создаётся <b>{$wizardState.policyName}</b></div></div>
<div class="row"><div class="lbl">Устройства</div><div class="val">привязка {$wizardState.deviceMacs.length} устройств</div></div>
<div class="row"><div class="lbl">Туннель</div><div class="val">{$wizardState.tunnelTag}</div></div>
<div class="row">
	<div class="lbl">Пресеты</div>
	<div class="val">{selectedPresets.map((p) => p.name).join(', ')} — итого {selectedPresets.length} правил, {ruleSetCount} rule_set</div>
</div>
<div class="row">
	<div class="lbl">DNS</div>
	<div class="val">сервер {$wizardState.dnsServer ?? '1.1.1.1'} через {$wizardState.tunnelTag}; rule только для доменов из выбранных пресетов</div>
</div>
<div class="row"><div class="lbl">Движок</div><div class="val">включается автоматически</div></div>

<style>
	.title { font-size: 1.05rem; color: var(--color-text-primary); font-weight: 600; margin-bottom: 0.6rem; }
	.row { display: flex; padding: 0.45rem 0; border-bottom: 1px solid var(--color-border); }
	.row:last-child { border: 0; }
	.lbl { width: 130px; color: var(--color-text-muted); font-size: 0.82rem; }
	.val { color: var(--color-text-primary); font-size: 0.82rem; flex: 1; }
</style>
