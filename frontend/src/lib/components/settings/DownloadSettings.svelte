<script lang="ts">
	import { Button, Dropdown, type DropdownOption } from '$lib/components/ui';
	import type { DownloadOutbound, Settings } from '$lib/types';
	import { displayOutboundName, maskSensitiveInText } from '$lib/utils/downloadRouteLabel';

	interface Props {
		settings: Settings;
		saving: boolean;
		outbounds: DownloadOutbound[];
		loading: boolean;
		error: string;
		/** Когда false — селектор маршрута скрыт, показывается статичный hint:
		 *  без sing-box все non-direct outbound'ы недоступны (internal/downloader/service.go),
		 *  и выбирать нечего. Передавать false ТОЛЬКО когда точно известно, что
		 *  sing-box не установлен (не на ранней стадии загрузки статуса). */
		routeSelectorEnabled?: boolean;
		onRefresh: () => void;
		onSelectRoute: (routeTag: string, routeKind?: DownloadOutbound['kind']) => void;
	}

	let {
		settings = $bindable(),
		saving,
		outbounds,
		loading,
		error,
		routeSelectorEnabled = true,
		onRefresh,
		onSelectRoute,
	}: Props = $props();

	function optionLabel(ob: DownloadOutbound): string {
		return `${displayOutboundName(ob)}${ob.available ? '' : ' (unavailable)'}`;
	}

	function routeKey(tag: string, kind?: DownloadOutbound['kind']): string {
		return JSON.stringify({ tag, kind: kind || '' });
	}

	function parseRouteKey(key: string): { tag: string; kind?: DownloadOutbound['kind'] } {
		try {
			const parsed = JSON.parse(key) as { tag?: string; kind?: string };
			const tag = parsed.tag?.trim() || 'direct';
			const kind = parsed.kind?.trim() as DownloadOutbound['kind'] | undefined;
			return { tag, kind: kind || undefined };
		} catch {
			return { tag: key.trim() || 'direct' };
		}
	}

	const selectedTag = $derived(settings.download?.routeTag?.trim() || 'direct');
	const selectedKind = $derived(
		settings.download?.routeKind?.trim() ||
		(selectedTag === 'direct' ? 'direct' : ''),
	);
	const selectedValue = $derived.by(() => {
		const exact = outbounds.find((ob) => ob.tag === selectedTag && (!selectedKind || ob.kind === selectedKind));
		if (exact) {
			return routeKey(exact.tag, exact.kind);
		}
		const tagOnly = outbounds.find((ob) => ob.tag === selectedTag);
		if (tagOnly) {
			return routeKey(tagOnly.tag, tagOnly.kind);
		}
		return routeKey(selectedTag, selectedKind as DownloadOutbound['kind']);
	});
	const hasSelected = $derived(outbounds.some((ob) => routeKey(ob.tag, ob.kind) === selectedValue));
	const options = $derived.by(() => {
		const built: DropdownOption<string>[] = outbounds.map((ob) => ({
			value: routeKey(ob.tag, ob.kind),
			label: optionLabel(ob),
			disabled: !ob.available,
		}));
		if (!hasSelected && selectedValue) {
			const extra = selectedKind ? `${maskSensitiveInText(selectedTag)} (${selectedKind})` : maskSensitiveInText(selectedTag);
			built.unshift({
				value: selectedValue,
				label: `Недоступный маршрут: ${extra}`,
				disabled: true,
			});
		}
		return built;
	});

	function handleChange(v: string) {
		const selected = parseRouteKey(v);
		if (selected.tag === 'direct') {
			onSelectRoute('direct', 'direct');
			return;
		}
		onSelectRoute(selected.tag, selected.kind);
	}
</script>

<div id="downloads" class="setting-row download-setting">
	<div class="flex flex-col gap-1">
		<span class="font-medium">Служебные загрузки AWGM</span>
		<span class="setting-description">
			Используется для обновлений AWGM, загрузки geo.dat, DNSRoute URL-списков: проверки, ручного и автообновления, установки и обновления managed sing-box binary, а также Amnezia Premium: входа, списка стран и получения конфигураций. Sing-box URL-подписки всегда выполняются напрямую через WAN.
		</span>
		{#if error}
			<span class="download-error">{error}</span>
		{/if}
	</div>
	{#if routeSelectorEnabled}
		<div class="download-controls">
			<div class="route-select">
				<Dropdown
					value={selectedValue}
					options={options}
					onchange={handleChange}
					disabled={saving || loading || options.length === 0}
					fullWidth
				/>
			</div>
			<div class="download-action">
				<Button
					variant="secondary"
					size="md"
					onclick={onRefresh}
					disabled={saving || loading}
				>
					Обновить список
				</Button>
			</div>
		</div>
	{:else}
		<div class="no-singbox-hint">
			<span class="no-singbox-title">Загрузки идут через WAN (Direct).</span>
			<span class="no-singbox-detail">
				Для маршрутизации служебных загрузок через туннель установите sing-box.
			</span>
		</div>
	{/if}
</div>

<style>
	#downloads {
		scroll-margin-top: 5.5rem;
	}

	.download-setting {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, min(50%, 34rem));
		gap: 1rem;
		align-items: center;
	}

	.download-setting > :first-child {
		min-width: 0;
	}

	.download-controls {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: stretch;
		gap: 0.5rem;
		width: 100%;
		min-width: 0;
	}

	.route-select {
		width: 100%;
		min-width: 0;
		max-width: 100%;
	}

	.download-action {
		display: flex;
		align-items: stretch;
		white-space: nowrap;
	}

	.download-action :global(.btn) {
		height: 32px;
		min-height: 32px;
		max-height: 32px;
		box-sizing: border-box;
		padding-block: 0;
	}

	.download-error {
		color: var(--color-danger);
		font-size: 0.75rem;
	}

	.no-singbox-hint {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.75rem;
		border: 1px dashed var(--border, var(--color-border));
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-settings-control-bg) 60%, transparent);
		font-size: 0.8125rem;
		width: 100%;
		min-width: 0;
	}

	.no-singbox-title {
		color: var(--text-primary, var(--color-text-primary));
		font-weight: 500;
	}

	.no-singbox-detail {
		color: var(--text-muted, var(--color-text-muted));
		font-size: 0.75rem;
	}

	@media (min-width: 641px) {
		.download-setting > :first-child {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.download-setting .setting-description {
			white-space: normal;
			overflow: visible;
			text-overflow: clip;
		}

		.download-controls {
			width: 100%;
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: stretch;
		}

		.download-action :global(.btn) {
			width: auto;
			min-width: 7.5rem;
		}
	}

	@media (max-width: 640px) {
		.download-setting {
			grid-template-columns: 1fr;
		}

		.download-controls {
			grid-template-columns: minmax(0, 1fr) auto;
		}
	}
</style>
