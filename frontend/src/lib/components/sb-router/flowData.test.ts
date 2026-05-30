import { describe, it, expect } from 'vitest';
import { deriveOutboundList } from './flowData';
import type { SingboxRouterOutbound } from '$lib/types';

function ob(partial: { tag: string; type?: string; [k: string]: unknown }): SingboxRouterOutbound {
  return partial as unknown as SingboxRouterOutbound;
}

describe('deriveOutboundList', () => {
  it('empty array → пустой результат', () => {
    expect(deriveOutboundList([])).toEqual({ items: [], hiddenCount: 0 });
  });

  it('direct outbound — tone muted', () => {
    const r = deriveOutboundList([ob({ tag: 'direct', type: 'direct' })]);
    expect(r.items[0].tone).toBe('muted');
    expect(r.items[0].label).toBe('direct');
  });

  it('block/reject — tone error', () => {
    const r1 = deriveOutboundList([ob({ tag: 'block', type: 'block' })]);
    expect(r1.items[0].tone).toBe('error');
    const r2 = deriveOutboundList([ob({ tag: 'reject', type: 'block' })]);
    expect(r2.items[0].tone).toBe('error');
  });

  it('tunnel (wireguard etc) — tone success', () => {
    const r = deriveOutboundList([ob({ tag: 'warp', type: 'wireguard' })]);
    expect(r.items[0].tone).toBe('success');
  });

  it('composite (selector/urltest/loadbalance) — tone success', () => {
    const sel = deriveOutboundList([ob({ tag: 'sel', type: 'selector' })]);
    expect(sel.items[0].tone).toBe('success');
    const ut = deriveOutboundList([ob({ tag: 'best', type: 'urltest' })]);
    expect(ut.items[0].tone).toBe('success');
    const lb = deriveOutboundList([ob({ tag: 'lb', type: 'loadbalance' })]);
    expect(lb.items[0].tone).toBe('success');
  });

  it('unknown type — tone warning', () => {
    const r = deriveOutboundList([ob({ tag: 'mystery', type: 'unknown-type' })]);
    expect(r.items[0].tone).toBe('warning');
  });

  it('no type field — tone warning', () => {
    const r = deriveOutboundList([{ tag: 'naked' } as unknown as SingboxRouterOutbound]);
    expect(r.items[0].tone).toBe('warning');
  });

  it('label truncation для длинных tag', () => {
    const longTag = 'very-long-outbound-tag-that-exceeds-twenty-chars';
    const r = deriveOutboundList([ob({ tag: longTag, type: 'wireguard' })]);
    expect(r.items[0].label.length).toBeLessThanOrEqual(20);
  });

  it('maxItems 4 — 5 outbounds → 4 visible + hiddenCount 1', () => {
    const five: SingboxRouterOutbound[] = [
      ob({ tag: 'a', type: 'wireguard' }),
      ob({ tag: 'b', type: 'wireguard' }),
      ob({ tag: 'c', type: 'wireguard' }),
      ob({ tag: 'd', type: 'wireguard' }),
      ob({ tag: 'e', type: 'wireguard' }),
    ];
    const r = deriveOutboundList(five, 4);
    expect(r.items).toHaveLength(4);
    expect(r.hiddenCount).toBe(1);
  });

  it('maxItems равен размеру — hiddenCount 0', () => {
    const four: SingboxRouterOutbound[] = [
      ob({ tag: 'a', type: 'wireguard' }),
      ob({ tag: 'b', type: 'wireguard' }),
      ob({ tag: 'c', type: 'wireguard' }),
      ob({ tag: 'd', type: 'wireguard' }),
    ];
    const r = deriveOutboundList(four, 4);
    expect(r.hiddenCount).toBe(0);
  });

  it('default maxItems 4 если не задан', () => {
    const six: SingboxRouterOutbound[] = Array.from({ length: 6 }, (_, i) =>
      ob({ tag: `o${i}`, type: 'wireguard' }),
    );
    const r = deriveOutboundList(six);
    expect(r.items).toHaveLength(4);
    expect(r.hiddenCount).toBe(2);
  });

  it('сохраняет порядок входного списка', () => {
    const list: SingboxRouterOutbound[] = [
      ob({ tag: 'first',  type: 'wireguard' }),
      ob({ tag: 'second', type: 'direct' }),
      ob({ tag: 'third',  type: 'block' }),
    ];
    const r = deriveOutboundList(list);
    expect(r.items.map((i) => i.tag)).toEqual(['first', 'second', 'third']);
  });
});
