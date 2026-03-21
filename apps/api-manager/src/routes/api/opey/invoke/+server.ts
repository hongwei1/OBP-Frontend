import { createLogger } from '@obp/shared/utils';
const logger = createLogger('OpeyInvokeProxy');
import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { env } from '$env/dynamic/private';

/**
 * POST /api/opey/invoke
 *
 * Proxies non-streaming invoke requests to the Opey service.
 * Used by the Opey Insight Bar for quick, single-response insights.
 * Returns the complete ChatMessage response (no streaming).
 */
export async function POST(event: RequestEvent) {
	const opeyBaseUrl = env.OPEY_BASE_URL || 'http://localhost:5000';
	const body = await event.request.text();
	const cookie = event.request.headers.get('cookie') || '';

	logger.debug('Proxying invoke request to Opey');

	try {
		const opeyResponse = await fetch(`${opeyBaseUrl}/invoke`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': cookie
			},
			body
		});

		if (!opeyResponse.ok) {
			const errorText = await opeyResponse.text();
			logger.warn(`Opey invoke failed: ${opeyResponse.status} ${errorText}`);
			return json(
				{ error: errorText },
				{ status: opeyResponse.status }
			);
		}

		const result = await opeyResponse.json();

		// Forward any cookies Opey sets
		const setCookie = opeyResponse.headers.get('set-cookie');
		const headers: Record<string, string> = {};
		if (setCookie) headers['Set-Cookie'] = setCookie;

		return json(result, { headers });
	} catch (err) {
		logger.error('Error proxying invoke request:', err);
		return json({ error: 'Failed to connect to Opey service' }, { status: 502 });
	}
}
