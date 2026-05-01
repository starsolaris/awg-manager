// Stateful mock proxy: sits between Vite and Prism.
// - Holds usageLevel in memory; persists across GET/POST.
// - Forwards all other requests transparently.
// - Optional: simulate /singbox/install failure via env MOCK_SINGBOX_INSTALL_FAIL=1
//   or runtime POST /__mock/singbox-install-fail body {"enabled": true|false}.
// - Streams /events normally (Prism handles SSE shape).
// Default upstream: http://127.0.0.1:8080 (Prism). Listen: 8081.

import http from 'node:http';

const UPSTREAM = process.env.UPSTREAM ?? 'http://127.0.0.1:8080';
const PORT = Number(process.env.PORT ?? 8081);
const VALID = new Set(['basic', 'advanced', 'expert']);

// In-memory state. Default 'basic' so the welcome banner + minimal nav
// are visible on first load (the more interesting case to inspect).
let usageLevel = 'basic';
let singboxInstallShouldFail = process.env.MOCK_SINGBOX_INSTALL_FAIL === '1';
const FAKE_INSTALL_STDERR = `Collected errors:
 * verify_pkg_installable: Only have 12 KB available on filesystem /opt, pkg sing-box needs 18432
 * opkg_install_cmd: Cannot install package sing-box.
opkg_install_cmd: failed.
exit code 255`;

async function fetchJSON(path, init) {
	const r = await fetch(`${UPSTREAM}${path}`, init);
	const text = await r.text();
	try {
		return { status: r.status, body: JSON.parse(text) };
	} catch {
		return { status: r.status, body: text };
	}
}

function send(res, status, body, contentType = 'application/json') {
	res.writeHead(status, { 'Content-Type': contentType });
	res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	const path = url.pathname;

	if (req.method === 'GET' && path === '/settings/get') {
		fetchJSON('/settings/get').then(({ status, body }) => {
			if (body && typeof body === 'object' && body.data) {
				body.data.usageLevel = usageLevel;
			}
			send(res, status, body);
		});
		return;
	}

	if (req.method === 'POST' && path === '/settings/update') {
		let raw = '';
		req.on('data', (c) => (raw += c));
		req.on('end', async () => {
			try {
				const payload = JSON.parse(raw);
				if (typeof payload.usageLevel === 'string') {
					if (!VALID.has(payload.usageLevel)) {
						send(res, 400, {
							success: false,
							error: 'invalid usageLevel',
							code: 'INVALID_USAGE_LEVEL',
						});
						return;
					}
					usageLevel = payload.usageLevel;
				}
				const { status, body } = await fetchJSON('/settings/get');
				if (body && typeof body === 'object' && body.data) {
					body.data.usageLevel = usageLevel;
				}
				send(res, status, body);
				console.log(`[mock-proxy] usageLevel → ${usageLevel}`);
			} catch (e) {
				send(res, 500, { success: false, error: String(e) });
			}
		});
		return;
	}

	if (req.method === 'POST' && path === '/singbox/install') {
		if (singboxInstallShouldFail) {
			send(res, 500, {
				success: false,
				error: FAKE_INSTALL_STDERR,
				code: 'SINGBOX_INSTALL_ERROR',
			});
			console.log('[mock-proxy] simulated /singbox/install failure');
			return;
		}
		// Falls through to the generic pass-through below.
	}

	if (req.method === 'POST' && path === '/__mock/singbox-install-fail') {
		let raw = '';
		req.on('data', (c) => (raw += c));
		req.on('end', () => {
			try {
				const body = JSON.parse(raw);
				singboxInstallShouldFail = !!body.enabled;
				send(res, 200, { ok: true, singboxInstallShouldFail });
				console.log(`[mock-proxy] singboxInstallShouldFail → ${singboxInstallShouldFail}`);
			} catch (e) {
				send(res, 400, { error: String(e) });
			}
		});
		return;
	}

	// Pass-through for everything else (including /events SSE).
	const upstream = new URL(UPSTREAM);
	const proxyReq = http.request(
		{
			hostname: upstream.hostname,
			port: upstream.port,
			path: req.url,
			method: req.method,
			headers: { ...req.headers, host: upstream.host },
		},
		(proxyRes) => {
			res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
			proxyRes.pipe(res);
		},
	);
	proxyReq.on('error', (e) => {
		if (!res.headersSent) {
			send(res, 502, { error: String(e) });
		} else {
			res.end();
		}
	});
	req.pipe(proxyReq);
});

server.listen(PORT, '127.0.0.1', () => {
	console.log(`mock-proxy on http://127.0.0.1:${PORT} → ${UPSTREAM} (usageLevel=${usageLevel})`);
});
