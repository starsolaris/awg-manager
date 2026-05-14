<script lang="ts">
	import { escapeAndHighlightShareProtocols } from '$lib/utils/shareLinkListInput';
	import { tick } from 'svelte';

	interface Props {
		value?: string;
		rows?: number;
		disabled?: boolean;
		placeholder?: string;
		onpaste?: (e: ClipboardEvent & { currentTarget: HTMLTextAreaElement }) => void;
	}

	let {
		value = $bindable(''),
		rows = 6,
		disabled = false,
		placeholder = '',
		onpaste,
	}: Props = $props();

	let ta = $state<HTMLTextAreaElement | null>(null);
	let back = $state<HTMLPreElement | null>(null);

	let highlightHtml = $derived(escapeAndHighlightShareProtocols(value));

	$effect(() => {
		value;
		void tick().then(syncScroll);
	});

	function syncScroll(): void {
		if (!ta || !back) return;
		back.scrollTop = ta.scrollTop;
		back.scrollLeft = ta.scrollLeft;
	}
</script>

<!-- Underlay shows highlighted protocols; textarea text is transparent (IDE-style). -->
<div class="share-links-editor" class:disabled>
	<pre
		class="share-links-back"
		aria-hidden="true"
		bind:this={back}
	>{@html highlightHtml}</pre>
	<textarea
		class="share-links-ta"
		bind:this={ta}
		bind:value={value}
		{rows}
		{disabled}
		{placeholder}
		spellcheck="false"
		autocomplete="off"
		autocapitalize="off"
		onscroll={syncScroll}
		onpaste={onpaste}
	></textarea>
</div>

<style>
	.share-links-editor {
		position: relative;
		display: grid;
		grid-template: 1fr / 1fr;
		align-items: stretch;
		width: 100%;
		min-width: 0;
		min-height: 140px;
		padding: 0.5rem 0.7rem;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.78rem;
		color: var(--color-text-primary);
		transition: border-color 120ms;
	}
	.share-links-editor > * {
		grid-area: 1 / 1;
		min-height: 0;
		width: 100%;
		box-sizing: border-box;
	}
	.share-links-editor.disabled {
		opacity: 0.65;
		pointer-events: none;
	}
	.share-links-back {
		margin: 0;
		padding: 0;
		border: none;
		border-radius: inherit;
		font: inherit;
		line-height: 1.45;
		letter-spacing: inherit;
		white-space: pre-wrap;
		word-break: break-word;
		overflow: auto;
		pointer-events: none;
		color: var(--color-text-primary);
		background: transparent;
		scrollbar-width: none;
	}
	.share-links-back::-webkit-scrollbar {
		display: none;
	}
	.share-links-back :global(.share-link-proto) {
		font-weight: 600;
		color: var(--color-primary, #2563eb);
	}
	.share-links-ta {
		margin: 0;
		padding: 0;
		resize: vertical;
		overflow: auto;
		font: inherit;
		line-height: 1.45;
		letter-spacing: inherit;
		border: none;
		border-radius: inherit;
		outline: none;
		background: transparent;
		color: transparent;
		-webkit-text-fill-color: transparent;
		caret-color: var(--color-text-primary);
	}
	.share-links-ta::placeholder {
		opacity: 1;
		color: var(--color-text-muted);
		-webkit-text-fill-color: var(--color-text-muted);
	}
	.share-links-ta:focus-visible {
		outline: none;
	}
	.share-links-ta::selection {
		background: color-mix(in srgb, var(--color-primary, #2563eb) 38%, transparent);
	}
	.share-links-editor:focus-within {
		border-color: var(--color-primary, #3b82f6);
	}
</style>
