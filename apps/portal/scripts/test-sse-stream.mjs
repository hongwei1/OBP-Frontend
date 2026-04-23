#!/usr/bin/env node
/**
 * Test the SvelteKit /api/chat/{roomId}/stream SSE endpoint directly,
 * bypassing the browser. Useful for confirming whether the SSE → gRPC
 * pipeline delivers events end-to-end when the browser is problematic.
 *
 * Usage:
 *   1. Log in to the portal in your browser.
 *   2. In DevTools → Application → Cookies → http://localhost:5174,
 *      copy the value of the session cookie (name is usually `session` or
 *      similar — paste the whole `name=value` pair below).
 *   3. Run:
 *        SESSION_COOKIE='session=xxxxxxxx' \
 *        ROOM_ID='bc2fe5ec-6023-41e8-9cd0-d3043e22042c' \
 *        node scripts/test-sse-stream.mjs
 *
 * The script prints HTTP status + headers, then every SSE frame as it arrives.
 * Ctrl+C to stop.
 */

import http from 'node:http';

const ROOM_ID = process.env.ROOM_ID;
const SESSION_COOKIE = process.env.SESSION_COOKIE;
const HOST = process.env.PORTAL_HOST || 'localhost';
const PORT = parseInt(process.env.PORTAL_PORT || '5174', 10);

if (!ROOM_ID) {
	console.error('ERROR: set ROOM_ID env var, e.g. ROOM_ID=bc2fe5ec-...');
	process.exit(1);
}
if (!SESSION_COOKIE) {
	console.error('ERROR: set SESSION_COOKIE env var, e.g. SESSION_COOKIE="session=..."');
	process.exit(1);
}

const path = `/api/chat/${ROOM_ID}/stream`;

console.log(`→ GET http://${HOST}:${PORT}${path}`);
console.log(`  Cookie: ${SESSION_COOKIE.replace(/=.*/, '=<redacted>')}`);
console.log('');

const req = http.request(
	{
		host: HOST,
		port: PORT,
		path,
		method: 'GET',
		headers: {
			Accept: 'text/event-stream',
			'Cache-Control': 'no-cache',
			Cookie: SESSION_COOKIE
		}
	},
	(res) => {
		console.log(`← HTTP ${res.statusCode} ${res.statusMessage}`);
		console.log('  Response headers:');
		for (const [k, v] of Object.entries(res.headers)) {
			console.log(`    ${k}: ${v}`);
		}
		console.log('');

		if (res.statusCode !== 200) {
			let body = '';
			res.on('data', (chunk) => (body += chunk));
			res.on('end', () => {
				console.log('Body:', body);
				process.exit(res.statusCode === 401 ? 2 : 1);
			});
			return;
		}

		console.log('--- stream open, waiting for events (Ctrl+C to stop) ---');
		console.log('');

		let buffer = '';
		res.setEncoding('utf8');
		res.on('data', (chunk) => {
			buffer += chunk;
			// SSE frames are separated by blank lines (\n\n)
			let idx;
			while ((idx = buffer.indexOf('\n\n')) !== -1) {
				const frame = buffer.slice(0, idx);
				buffer = buffer.slice(idx + 2);
				const ts = new Date().toISOString();
				console.log(`[${ts}] --- frame ---`);
				for (const line of frame.split('\n')) {
					console.log(`  ${line}`);
				}
			}
		});
		res.on('end', () => {
			console.log('');
			console.log(`[${new Date().toISOString()}] stream ended by server`);
			process.exit(0);
		});
		res.on('close', () => {
			console.log('');
			console.log(`[${new Date().toISOString()}] connection closed`);
			process.exit(0);
		});
		res.on('error', (err) => {
			console.error('response error:', err);
			process.exit(1);
		});
	}
);

req.on('error', (err) => {
	console.error('request error:', err);
	process.exit(1);
});

req.end();
