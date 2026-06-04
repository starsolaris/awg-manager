import { describe, expect, it } from 'vitest';
import type { CatalogPreset } from '$lib/types';
import { hrNeoCatalogPresetFilter, splitPresetDnsEntries } from './catalog-preset';

const base = {
	id: 'x',
	name: 'X',
	iconSlug: 'x',
	category: 'media',
	origin: 'builtin' as const,
	engines: {},
};

describe('splitPresetDnsEntries', () => {
	it('maps domains and subnets arrays to HR editor fields', () => {
		const p: CatalogPreset = {
			...base,
			engines: {
				dns: {
					domains: ['example.com', 'geoip:ru'],
					subnets: ['91.108.4.0/22', '10.0.0.0/8'],
				},
			},
		};
		expect(splitPresetDnsEntries(p)).toEqual({
			domainLines: ['example.com'],
			cidrLines: ['geoip:ru', '91.108.4.0/22', '10.0.0.0/8'],
		});
	});
});

describe('hrNeoCatalogPresetFilter', () => {
	it('accepts subnet-only presets', () => {
		const p: CatalogPreset = {
			...base,
			engines: { dns: { subnets: ['10.0.0.0/8'] } },
		};
		expect(hrNeoCatalogPresetFilter(p)).toBe(true);
	});
});
