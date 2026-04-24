import type { RequestHandler } from './$types';
import { healthCheckRegistry } from '@obp/shared/health-check';
import { get } from 'svelte/store';

export const GET: RequestHandler = async () => {
	const snapshots = get(healthCheckRegistry.getStore());
	const services = Object.values(snapshots);
	const healthy = services.length === 0 || services.every((s) => s.status === 'healthy');

	return new Response(JSON.stringify({ status: healthy ? 'ok' : 'error' }), {
		status: healthy ? 200 : 503,
		headers: { 'Content-Type': 'application/json' }
	});
};
