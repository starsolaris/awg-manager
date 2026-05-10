<script lang="ts">
	import { singboxRouter } from '$lib/stores/singboxRouter';
	import { PresetsGallery } from '$lib/components/routing/singboxRouter';

	const presetsStore = singboxRouter.presets;
	const optionsStore = singboxRouter.options;

	const presets = $derived($presetsStore);
	const outboundOptions = $derived($optionsStore);
</script>

<PresetsGallery
	{presets}
	{outboundOptions}
	onApplied={() => singboxRouter.loadAll()}
/>
