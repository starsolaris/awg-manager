import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from './client';

describe('ApiClient error shape', () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it('attaches status and parsed body to the thrown Error on 422', async () => {
		const fakeBody = {
			sbCheck:
				'FATAL[0000] initialize dns router: dns rule[0]: rule-set not found: geosite-google\n: exit status 1',
		};
		globalThis.fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify(fakeBody), {
				status: 422,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		let caught: unknown;
		try {
			await api.singboxRouterStagingApply();
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeInstanceOf(Error);
		const err = caught as Error & { status?: number; body?: unknown };
		expect(err.status).toBe(422);
		expect(err.body).toEqual(fakeBody);
	});

	it('attaches status and body on a standard envelope error too', async () => {
		const fakeBody = { error: true, message: 'тест', code: 'TEST' };
		globalThis.fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify(fakeBody), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		let caught: unknown;
		try {
			await api.singboxRouterStagingApply();
		} catch (e) {
			caught = e;
		}
		const err = caught as Error & { status?: number; body?: unknown };
		expect(err.status).toBe(400);
		expect(err.body).toEqual(fakeBody);
		expect(err.message).toBe('тест');
	});

	it('serializes multi-select log filters as repeated query params', async () => {
		let capturedUrl = '';
		globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
			capturedUrl = String(input);
			return new Response(
				JSON.stringify({
					success: true,
					data: {
						enabled: true,
						logs: [],
						total: 0,
						bucket: 'app',
						bufferSize: 0,
						bufferCapacity: 5000,
					},
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		});

		await api.getLogs({
			bucket: 'singbox',
			groups: ['singbox'],
			subgroups: ['inbound', 'dns'],
			limit: 200,
			offset: 0,
		});

		const url = new URL(capturedUrl, 'http://test.local');
		expect(url.pathname).toBe('/api/logs');
		expect(url.searchParams.get('bucket')).toBe('singbox');
		expect(url.searchParams.getAll('group')).toEqual(['singbox']);
		expect(url.searchParams.getAll('subgroup')).toEqual(['inbound', 'dns']);
		expect(url.searchParams.get('limit')).toBe('200');
		expect(url.searchParams.get('offset')).toBe('0');
	});
});
