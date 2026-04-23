import { createLogger } from '@obp/shared/utils';
const logger = createLogger('FinancialProductsServer');

import type { RequestEvent } from '@sveltejs/kit';
import type { OBPProduct } from '$lib/obp/types';
import { obp_requests } from '$lib/obp/requests';
import { OBPRequestError, OBPRateLimitError, OBPTimeoutError } from '@obp/shared/obp';
import { env } from '$env/dynamic/private';

const API_VERSION = 'v6.0.0';

export async function load(event: RequestEvent) {
	const apiExplorerUrl = env.API_EXPLORER_URL || '';
	const token = event.locals.session?.data?.oauth?.access_token;
	const isLoggedIn = !!token;

	const warnings: string[] = [];

	// First check if OBP-API is responding
	try {
		await obp_requests.get(`/obp/${API_VERSION}/root`);
	} catch (e) {
		const errorMsg = e instanceof OBPTimeoutError
			? 'OBP-API did not respond within 15 seconds. The server may be overloaded or down.'
			: e instanceof OBPRateLimitError
				? 'OBP-API rate limit exceeded. Please wait a moment and try again.'
				: 'OBP-API is not responding. Please check that the API server is running.';
		logger.error('OBP-API is not responding:', e);
		return {
			products: [] as OBPProduct[],
			warnings: [],
			message: errorMsg,
			apiExplorerUrl,
			isLoggedIn
		};
	}

	let products: OBPProduct[] = [];

	try {
		const productsResponse = await obp_requests.get(
			`/obp/${API_VERSION}/products?tag=featured`,
			token
		);
		products = productsResponse?.products || [];
		logger.info(`Fetched ${products.length} featured financial products across all banks`);
	} catch (e) {
		logger.error('Error fetching financial products at all banks:', e);
		if (e instanceof OBPRateLimitError) {
			warnings.push('API rate limit exceeded while loading financial products.');
		} else if (e instanceof OBPTimeoutError) {
			warnings.push('Request timed out loading financial products.');
		} else if (e instanceof OBPRequestError) {
			warnings.push(`Could not load financial products: ${e.message}`);
		} else {
			warnings.push('Could not load financial products.');
		}
	}

	// Sort products alphabetically by name
	products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

	return {
		products,
		warnings,
		apiExplorerUrl,
		isLoggedIn
	};
}
