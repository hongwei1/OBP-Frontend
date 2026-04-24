import { createLogger } from '@obp/shared/utils';
const logger = createLogger('OpeyStopProxy');
import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { obpErrorResponse } from '$lib/obp/errors';
import { checkAPIAuth } from '$lib/utils/apiAuth';
import { env } from '$env/dynamic/private';

export async function POST(event: RequestEvent) {
	const auth = checkAPIAuth(event.locals);
	if (!auth.authenticated) return auth.error!;

	const opeyBaseUrl = env.OPEY_BASE_URL || 'http://localhost:5000';
	const { threadId } = event.params;
	const cookie = event.request.headers.get('cookie') || '';

	logger.debug(`Proxying stop request for thread ${threadId}`);

	try {
		const opeyResponse = await fetch(`${opeyBaseUrl}/stream/${threadId}/stop`, {
			method: 'POST',
			headers: { 'Cookie': cookie }
		});
		const data = await opeyResponse.json().catch(() => ({}));
		return json(data, { status: opeyResponse.status });
	} catch (err) {
		logger.error('Failed to proxy stop request:', err);
		const { body, status } = obpErrorResponse(err);
		return json(body, { status });
	}
}
