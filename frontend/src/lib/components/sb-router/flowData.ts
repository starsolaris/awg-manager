/**
 * Pure helper: SingboxRouterOutbound[] → FlowOutbound[] с tone colors.
 *
 * Используется FlowGraph hero для рендера Outbounds 2×2 grid.
 * Tone маппится по типу outbound'а (см. JSX дизайна — success для tunnel/composite,
 * error для block/reject, muted для direct, warning для unknown).
 */

import type { SingboxRouterOutbound } from '$lib/types';

export type FlowOutboundTone = 'success' | 'error' | 'muted' | 'accent' | 'warning';

export type FlowOutboundKind = 'direct' | 'tunnel';

export interface FlowOutbound {
  /** Outbound tag (key, для дедупликации в #each). */
  tag: string;
  /** Отображаемая надпись справа от dot'а (truncated до ≤20 chars). */
  label: string;
  /** Цвет dot'а: см. tone mapping выше. */
  tone: FlowOutboundTone;
  /** Группа: direct (muted tone) vs. tunnel (всё остальное — composite/wireguard/etc). */
  kind: FlowOutboundKind;
}

const LABEL_MAX = 20;
const DEFAULT_MAX_ITEMS = 4;

const COMPOSITE_TYPES = new Set(['selector', 'urltest', 'loadbalance']);

function classifyTone(o: SingboxRouterOutbound): FlowOutboundTone {
  const type = (o as { type?: string }).type ?? '';
  const tag = (o as { tag?: string }).tag ?? '';
  if (type === 'direct' || tag === 'direct') return 'muted';
  if (type === 'block' || tag === 'block' || tag === 'reject') return 'error';
  if (COMPOSITE_TYPES.has(type)) return 'success';
  if (type === '') return 'warning';
  // Любой "содержательный" type (wireguard, http, socks, etc.) → tunnel
  if (type === 'wireguard' || type === 'http' || type === 'socks' || type === 'shadowsocks' ||
      type === 'vmess' || type === 'vless' || type === 'trojan' || type === 'tuic' ||
      type === 'hysteria' || type === 'hysteria2' || type === 'wireguard-server') {
    return 'success';
  }
  // Неизвестный type — warning, чтобы пользователь обратил внимание
  return 'warning';
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

export function deriveOutboundList(
  outbounds: SingboxRouterOutbound[],
  maxItems: number = DEFAULT_MAX_ITEMS,
): { items: FlowOutbound[]; hiddenCount: number } {
  const visible = outbounds.slice(0, maxItems);
  const items: FlowOutbound[] = visible.map((o) => {
    const tag = (o as { tag?: string }).tag ?? '?';
    const tone = classifyTone(o);
    return {
      tag,
      label: truncate(tag, LABEL_MAX),
      tone,
      kind: tone === 'muted' ? 'direct' : 'tunnel',
    };
  });
  const hiddenCount = Math.max(0, outbounds.length - visible.length);
  return { items, hiddenCount };
}
