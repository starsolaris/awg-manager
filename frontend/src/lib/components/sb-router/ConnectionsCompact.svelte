<!--
  Compact read-only live connections summary for the SBR redesign dashboard.
  Reuses the classic SBR connections WebSocket data path without exposing
  mutating actions such as killing connections.
-->
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type {
    ClashConnectionsRaw,
    ConnectionBucket,
    ConnectionsSnapshot,
  } from '$lib/types/singboxConnections';
  import { parseSnapshot, aggregateBy } from '$lib/utils/singboxConnections';
  import { createClashWS, type WSStatus } from '$lib/utils/clashWebSocket';
  import { api } from '$lib/api/client';
  import { formatBytes } from '$lib/utils/format';

  let snapshot = $state<ConnectionsSnapshot>({
    connections: [],
    downloadTotal: 0,
    uploadTotal: 0,
    connectionsTotal: 0,
  });
  let clientsByIP = $state<Map<string, string>>(new Map());
  let wsStatus = $state<WSStatus>('connecting');
  let lastMessageAt = $state(0);
  let tick = $state(0);

  let wsClose: (() => void) | null = null;
  let clientsTimer: ReturnType<typeof setInterval> | null = null;
  let staleTimer: ReturnType<typeof setInterval> | null = null;

  const totalUp = $derived(snapshot.connections.reduce((sum, c) => sum + c.upload, 0));
  const totalDown = $derived(snapshot.connections.reduce((sum, c) => sum + c.download, 0));
  const topOutbound = $derived(
    aggregateBy(snapshot.connections, (c) => c.outboundLabel).slice(0, 3),
  );
  const topClient = $derived(
    aggregateBy(snapshot.connections, (c) => c.clientName || c.metadata.sourceIP).slice(0, 2),
  );
  const topHost = $derived(
    aggregateBy(snapshot.connections, (c) => c.metadata.host || c.metadata.destinationIP).slice(0, 2),
  );

  const statusLabel = $derived.by(() => {
    void tick;
    const sinceMs = Date.now() - lastMessageAt;
    if (wsStatus === 'open' && lastMessageAt > 0 && sinceMs < 5000) {
      return { text: 'Live', tone: 'ok' };
    }
    if (wsStatus === 'open') return { text: 'Stale', tone: 'warn' };
    if (wsStatus === 'connecting') return { text: 'Подключение', tone: 'warn' };
    if (wsStatus === 'closed') return { text: 'Переподключение', tone: 'err' };
    return { text: 'Ошибка', tone: 'err' };
  });

  async function refetchClients(): Promise<void> {
    try {
      const data = await api.singboxGetClientsByIP();
      const next = new Map<string, string>();
      for (const [ip, name] of Object.entries(data.clientsByIP ?? {})) {
        next.set(ip.toLowerCase(), name);
      }
      clientsByIP = next;
    } catch {
      // Best-effort enrichment only.
    }
  }

  function bucketTitle(prefix: string, bucket: ConnectionBucket): string {
    return `${prefix}: ${bucket.key} · ${bucket.count} conn · ↑ ${formatBytes(bucket.upload)} · ↓ ${formatBytes(bucket.download)}`;
  }

  onMount(() => {
    void refetchClients();
    clientsTimer = setInterval(refetchClients, 30_000);
    wsClose = createClashWS<ClashConnectionsRaw>(
      '/api/singbox/clash/connections',
      (raw) => {
        snapshot = parseSnapshot(raw, clientsByIP);
        lastMessageAt = Date.now();
      },
      (status) => {
        wsStatus = status;
      },
    );
    staleTimer = setInterval(() => {
      tick += 1;
    }, 1000);
  });

  onDestroy(() => {
    wsClose?.();
    if (clientsTimer !== null) clearInterval(clientsTimer);
    if (staleTimer !== null) clearInterval(staleTimer);
  });
</script>

<div class="compact">
  <div class="summary">
    <span class="status" data-tone={statusLabel.tone}>
      <span class="status-dot"></span>
      {statusLabel.text}
    </span>
    <span class="count">{snapshot.connectionsTotal} conn</span>
    <span class="bytes">
      <span>↑ {formatBytes(totalUp)}</span>
      <span>↓ {formatBytes(totalDown)}</span>
    </span>
  </div>

  {#if snapshot.connectionsTotal > 0}
    <div class="group">
      <div class="label">Outbounds</div>
      {#each topOutbound as bucket (bucket.key)}
        <div class="row" title={bucketTitle('Outbound', bucket)}>
          <span class="key">{bucket.key}</span>
          <span class="meta">{bucket.count} · ↓ {formatBytes(bucket.download)}</span>
        </div>
      {/each}
    </div>

    <div class="group two-col">
      <div>
        <div class="label">Клиенты</div>
        {#each topClient as bucket (bucket.key)}
          <div class="mini-row" title={bucketTitle('Клиент', bucket)}>
            <span class="key">{bucket.key}</span>
            <span class="meta">{bucket.count}</span>
          </div>
        {/each}
      </div>
      <div>
        <div class="label">Хосты</div>
        {#each topHost as bucket (bucket.key)}
          <div class="mini-row" title={bucketTitle('Хост', bucket)}>
            <span class="key">{bucket.key}</span>
            <span class="meta">{bucket.count}</span>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="empty">
      {#if wsStatus === 'connecting'}
        Подключение к live-статистике…
      {:else}
        Активных соединений нет
      {/if}
    </div>
  {/if}
</div>

<style>
  .compact {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex-wrap: wrap;
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: currentColor;
  }
  .status[data-tone='ok'] {
    color: var(--color-success, #22c55e);
  }
  .status[data-tone='warn'] {
    color: var(--color-warning, #dab856);
  }
  .status[data-tone='err'] {
    color: var(--color-error, #ff6b6b);
  }
  .count,
  .bytes,
  .meta {
    font-family: var(--font-mono);
    color: var(--text-muted);
  }
  .bytes {
    display: inline-flex;
    gap: 8px;
    margin-left: auto;
    white-space: nowrap;
  }
  .group {
    padding-top: 8px;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .two-col {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
  }
  .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .row,
  .mini-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .key {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-primary);
    font-weight: 600;
  }
  .row .key {
    font-family: var(--font-mono);
  }
  .empty {
    padding-top: 2px;
    color: var(--text-muted);
    line-height: 1.45;
  }
  @media (max-width: 768px) {
    .bytes {
      margin-left: 0;
    }
    .two-col {
      grid-template-columns: 1fr;
    }
  }
</style>
