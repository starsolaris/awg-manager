<script lang="ts">
    import { Modal, Button, Dropdown } from '$lib/components/ui';
    import { ServiceIcon } from '$lib/components/dnsroutes';
    import { dnsPresets, presetCatalogLoaded, loadPresetCatalog } from '$lib/stores/presets';
    import { buildRoutingTunnelDropdownOptions } from '$lib/utils/routingTunnelOptions';
    import { pluralize, SERVICE_WORDS } from '$lib/utils/pluralize';
    import type { RoutingTunnel, CatalogPreset } from '$lib/types';
    import DownloadRouteNote from '$lib/components/downloads/DownloadRouteNote.svelte';
    import { Search } from 'lucide-svelte';

    interface Props {
        open: boolean;
        existingNames: string[];
        tunnels: RoutingTunnel[];
        isOS5?: boolean;
        hydrarouteInstalled?: boolean;
        onclose: () => void;
        oncreate: (presets: CatalogPreset[], tunnelId: string, backend: 'ndms' | 'hydraroute') => void;
    }

    let {
        open = $bindable(false),
        existingNames,
        tunnels,
        isOS5 = false,
        hydrarouteInstalled = false,
        onclose,
        oncreate,
    }: Props = $props();

    let selected = $state<Set<string>>(new Set());
    let defaultTunnelId = $state('');
    let backend = $state<'ndms' | 'hydraroute'>('ndms');
    let creating = $state(false);
    let wasOpen = $state(false);
    let query = $state('');
    let categoryFilter = $state<string>('all');

    const CATEGORY_LABELS: Record<string, string> = {
        social: 'Соцсети',
        media: 'Медиа',
        ai: 'AI',
        developer: 'Разработка',
        cloud: 'Облако',
        gaming: 'Игры',
        block: 'Блок',
    };
    const CATEGORY_ORDER = ['social', 'media', 'ai', 'developer', 'cloud', 'gaming', 'block'];

    let showBackendSelector = $derived(isOS5 && hydrarouteInstalled);
    let noTunnels = $derived(tunnels.filter((t) => t.available).length === 0);

    const tunnelOpts = $derived(
        buildRoutingTunnelDropdownOptions(tunnels, { requireSelectable: true }),
    );
    let existingLower = $derived(existingNames.map((n) => n.toLowerCase()));

    const sortedPresets = $derived(
        [...$dnsPresets].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    );

    function matchesQuery(p: CatalogPreset, q: string): boolean {
        if (!q) return true;
        const hay = `${p.name} ${p.id} ${p.category}`.toLowerCase();
        return hay.includes(q.toLowerCase());
    }

    const queryTrimmed = $derived(query.trim());

    const queryFiltered = $derived(
        sortedPresets.filter((p) => matchesQuery(p, queryTrimmed)),
    );

    /** Categories from the full catalog — chip row stays mounted while searching. */
    const catalogCategories = $derived.by(() => {
        const present = new Set(sortedPresets.map((p) => p.category));
        const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
        for (const c of present) {
            if (!CATEGORY_ORDER.includes(c)) ordered.push(c);
        }
        return ordered;
    });

    const showCategoryChips = $derived(catalogCategories.length > 1);

    const categoryCounts = $derived.by(() => {
        const counts = new Map<string, number>();
        for (const p of queryFiltered) {
            counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
        }
        return counts;
    });

    const filteredPresets = $derived(
        queryFiltered.filter(
            (p) => categoryFilter === 'all' || p.category === categoryFilter,
        ),
    );

    const selectedWithNotices = $derived(
        sortedPresets.filter((p) => selected.has(p.id) && p.notice),
    );

    $effect(() => {
        if (open && !wasOpen) {
            selected = new Set();
            defaultTunnelId = tunnels.find((t) => t.available)?.id ?? '';
            backend = isOS5 ? 'ndms' : hydrarouteInstalled ? 'hydraroute' : 'ndms';
            creating = false;
            query = '';
            categoryFilter = 'all';
        }
        wasOpen = open;
    });

    $effect(() => {
        if (open) void loadPresetCatalog();
    });

    function categoryLabel(cat: string): string {
        return CATEGORY_LABELS[cat] ?? cat;
    }

    function isAdded(preset: CatalogPreset): boolean {
        return existingLower.includes(preset.name.toLowerCase());
    }

    function toggle(presetId: string) {
        const next = new Set(selected);
        if (next.has(presetId)) {
            next.delete(presetId);
        } else {
            next.add(presetId);
        }
        selected = next;
    }

    function handleCreate() {
        if (selected.size === 0 || !defaultTunnelId) return;
        creating = true;
        const presets = sortedPresets.filter((p) => selected.has(p.id));
        oncreate(presets, defaultTunnelId, backend);
    }
</script>

<Modal {open} title="Каталог сервисов" size="wide" bodyLayout="fill" {onclose}>
    <div class="catalog-root">
        {#if $presetCatalogLoaded && $dnsPresets.length > 0}
            <div class="search-row">
                <div class="search">
                    <Search size={14} color="var(--text-muted)" />
                    <input
                        type="search"
                        placeholder="netflix, telegram, ai..."
                        bind:value={query}
                    />
                    <span class="search-count">{pluralize(filteredPresets.length, SERVICE_WORDS)}</span>
                </div>
                <div class="chips-slot" class:has-chips={showCategoryChips}>
                    {#if showCategoryChips}
                        <div class="chips">
                            <button
                                type="button"
                                class="chip"
                                class:active={categoryFilter === 'all'}
                                aria-pressed={categoryFilter === 'all'}
                                onclick={() => (categoryFilter = 'all')}
                            >
                                <span class="chip-label">Все</span>
                                <span class="chip-count">{queryFiltered.length}</span>
                            </button>
                            {#each catalogCategories as cat (cat)}
                                <button
                                    type="button"
                                    class="chip"
                                    class:active={categoryFilter === cat}
                                    aria-pressed={categoryFilter === cat}
                                    onclick={() => (categoryFilter = cat)}
                                >
                                    <span class="chip-label">{categoryLabel(cat)}</span>
                                    <span class="chip-count">{categoryCounts.get(cat) ?? 0}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <div class="catalog-scroll">
            {#if !$presetCatalogLoaded}
                <p class="catalog-loading">Загрузка каталога…</p>
            {:else if $dnsPresets.length === 0}
                <p class="catalog-loading">Каталог пуст</p>
            {:else if filteredPresets.length === 0}
                <p class="catalog-loading">По запросу ничего не нашлось.</p>
            {:else}
                <div class="preset-grid">
                    {#each filteredPresets as preset (preset.id)}
                        {@const added = isAdded(preset)}
                        {@const isSelected = selected.has(preset.id)}
                        <button
                            type="button"
                            class="preset-card"
                            class:selected={isSelected}
                            class:added
                            title={preset.notice || undefined}
                            onclick={() => {
                                if (!added) toggle(preset.id);
                            }}
                            disabled={added || creating}
                        >
                            {#if isSelected}
                                <span class="preset-check">&#10003;</span>
                            {:else if added}
                                <span class="preset-badge">добавлено</span>
                            {/if}
                            {#if preset.notice}
                                <span class="preset-notice-mark" aria-label="warning">⚠</span>
                            {/if}
                            <ServiceIcon name={preset.name} iconSlug={preset.iconSlug} size={40} />
                            <span class="preset-name">{preset.name}</span>
                        </button>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="catalog-pin">
            {#if selectedWithNotices.length > 0}
                <div class="notices-panel">
                    {#each selectedWithNotices as p (p.id)}
                        <div class="notice-entry">
                            <span class="notice-icon">⚠</span>
                            <div class="notice-body">
                                <strong class="notice-title">{p.name}</strong>
                                <span class="notice-text">{p.notice}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}

            <div class="tunnel-row">
                {#if showBackendSelector}
                    <span class="tunnel-label">Движок</span>
                    <div class="tunnel-control tunnel-control-engine">
                        <Dropdown
                            bind:value={backend}
                            options={[
                                { value: 'ndms' as const, label: 'NDMS' },
                                { value: 'hydraroute' as const, label: 'HydraRoute Neo' },
                            ]}
                            disabled={creating}
                            fullWidth
                        />
                    </div>
                {/if}
                <span class="tunnel-label">Туннель</span>
                <div class="tunnel-control tunnel-control-main">
                    <Dropdown
                        bind:value={defaultTunnelId}
                        options={tunnelOpts}
                        disabled={creating}
                        fullWidth
                    />
                </div>
            </div>
            <DownloadRouteNote text="Если сервис использует URL-лист, он будет получен через" />
            {#if noTunnels}
                <p class="no-tunnels">Создайте хотя бы один туннель</p>
            {/if}
        </div>
    </div>

    {#snippet actions()}
        <Button variant="ghost" onclick={onclose} disabled={creating}>Отмена</Button>
        <Button
            variant="primary"
            onclick={handleCreate}
            disabled={selected.size === 0 || noTunnels}
            loading={creating}
        >
            {`Создать (${selected.size})`}
        </Button>
    {/snippet}
</Modal>

<style>
    .catalog-root {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: min(560px, calc(100dvh - 12rem));
        max-height: min(72vh, calc(100dvh - 11rem));
    }

    .search-row {
        flex: 0 0 auto;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }

    .chips-slot {
        min-height: 0;
        flex-shrink: 0;
    }

    .chips-slot.has-chips {
        /* Reserve one chip row so the scroll area height stays stable while typing. */
        min-height: 1.875rem;
    }

    .search {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
    }

    .search input {
        flex: 1;
        min-width: 0;
        background: transparent;
        border: 0;
        outline: none;
        color: var(--color-text-primary);
        font-size: 13px;
        font-family: inherit;
    }

    .search-count {
        font-size: 11px;
        color: var(--color-text-muted);
        font-family: var(--font-mono);
        white-space: nowrap;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        background: transparent;
        border: 1px solid var(--color-border);
        color: var(--color-text-secondary);
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
    }

    .chip.active {
        background: var(--accent-soft, rgba(59, 130, 246, 0.12));
        border-color: var(--accent-line, var(--color-accent));
        color: var(--color-accent);
        font-weight: 600;
    }

    .chip-count {
        color: var(--color-text-muted);
        font-family: var(--font-mono);
        font-size: 10px;
    }

    .chip.active .chip-count {
        color: var(--color-accent);
    }

    .catalog-scroll {
        flex: 1 1 auto;
        min-height: 22rem;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 0.75rem 1rem;
    }

    .catalog-pin {
        flex: 0 0 auto;
        padding: 0.5rem 1rem 0.75rem;
        border-top: 1px solid var(--border);
        background: var(--bg-secondary);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    /* Up to 7 tiles per row at max modal width (1060px); wraps on narrower viewports. */
    .preset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
        gap: 10px;
        align-items: stretch;
    }

    .preset-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 0.375rem;
        height: 100%;
        min-height: 96px;
        padding: 0.875rem 0.5rem;
        background: var(--color-bg-primary);
        border: 2px solid var(--color-border);
        border-radius: 10px;
        cursor: pointer;
        transition: border-color 0.15s;
        position: relative;
    }

    .preset-card:hover:not(.added) {
        border-color: var(--color-text-muted);
    }

    .preset-card.selected {
        border-color: var(--color-accent);
    }

    .preset-card.added {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .catalog-loading {
        color: var(--color-text-muted);
        font-size: 0.8125rem;
        text-align: center;
        padding: 1.5rem 0;
    }

    .preset-check {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: var(--color-accent);
        color: var(--color-accent-contrast, #fff);
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .preset-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        font-size: 0.5625rem;
        color: var(--color-text-muted);
    }

    .preset-notice-mark {
        position: absolute;
        top: 6px;
        left: 6px;
        font-size: 0.875rem;
        color: var(--warning, #f59e0b);
        cursor: help;
        line-height: 1;
    }

    .preset-name {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--color-text-primary);
        text-align: center;
        line-height: 1.25;
        word-break: break-word;
    }

    .tunnel-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.375rem 0.625rem;
    }

    .tunnel-label {
        color: var(--color-text-muted);
        font-size: 0.75rem;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .tunnel-control {
        min-width: 0;
    }

    .tunnel-control-engine {
        width: min(180px, 100%);
    }

    .tunnel-control-main {
        flex: 1 1 12rem;
        min-width: 10rem;
    }

    .no-tunnels {
        color: var(--color-error);
        font-size: 0.8125rem;
        margin: 0;
    }

    .notices-panel {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.625rem 0.75rem;
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.25);
        border-radius: 6px;
    }

    .notice-entry {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .notice-icon {
        color: var(--warning, #f59e0b);
        font-size: 0.875rem;
        line-height: 1.4;
        flex-shrink: 0;
    }

    .notice-body {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        font-size: 0.75rem;
        line-height: 1.4;
        color: var(--color-text-secondary);
    }

    .notice-title {
        color: var(--color-text-primary);
        font-weight: 500;
        font-size: 0.75rem;
    }

    .notice-text {
        color: var(--color-text-secondary);
    }

    @media (max-width: 640px) {
        .search-row {
            padding: 0.625rem 0.75rem;
        }

        .catalog-scroll {
            padding: 0.625rem 0.75rem;
        }

        .catalog-pin {
            padding: 0.625rem 0.75rem 0.75rem;
        }

        .chips {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
        }

        .preset-grid {
            grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
        }
    }
</style>
