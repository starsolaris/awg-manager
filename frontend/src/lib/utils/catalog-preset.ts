import type { CatalogPreset } from '$lib/types';

export function presetDnsEntryCount(p: CatalogPreset): number {
	const dns = p.engines.dns;
	return (dns?.domains?.length ?? 0) + (dns?.subnets?.length ?? 0);
}

/** HR Neo: only presets with inline domain/CIDR lists (no subscription-only lists). */
export function hrNeoCatalogPresetFilter(p: CatalogPreset): boolean {
	return presetDnsEntryCount(p) > 0;
}

export function dnsRouteCatalogPresetFilter(p: CatalogPreset): boolean {
	return !!p.engines.dns;
}

export function splitPresetDnsEntries(p: CatalogPreset): {
	domainLines: string[];
	cidrLines: string[];
} {
	const dns = p.engines.dns;
	const domainLines: string[] = [];
	const cidrLines: string[] = [];

	for (const e of dns?.domains ?? []) {
		if (e.startsWith('geoip:') || /^[\d.:a-fA-F]+\/\d+$/.test(e)) cidrLines.push(e);
		else domainLines.push(e);
	}
	for (const e of dns?.subnets ?? []) {
		cidrLines.push(e);
	}

	return { domainLines, cidrLines };
}
