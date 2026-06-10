<script lang="ts">
	import type { Snippet } from 'svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import './singboxSettingsForm.css';

	interface Props {
		title: string;
		onClose: () => void;
		/** По умолчанию true — для {#if}-монтирования; для bindable open передайте явно. */
		open?: boolean;
		size?: 'sm' | 'md' | 'lg' | 'xl' | 'wide';
		bodyLayout?: 'default' | 'fill';
		hasUnsavedChanges?: () => boolean;
		closeOnBackdrop?: boolean;
		children: Snippet;
		actions?: Snippet;
	}

	let {
		title,
		onClose,
		open = true,
		size = 'md',
		bodyLayout = 'default',
		hasUnsavedChanges,
		closeOnBackdrop,
		children,
		actions,
	}: Props = $props();
</script>

<Modal
	{open}
	onclose={onClose}
	{title}
	{size}
	{bodyLayout}
	{hasUnsavedChanges}
	{closeOnBackdrop}
	{actions}
>
	<div class="sbr-settings-form">
		{@render children()}
	</div>
</Modal>
