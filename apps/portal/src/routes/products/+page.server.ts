import { createLogger } from '@obp/shared/utils';
const logger = createLogger('ProductsServer');

import type { RequestEvent } from '@sveltejs/kit';
import type { OBPProduct, APIProductDetails } from '$lib/obp/types';
import { obp_requests } from '$lib/obp/requests';
import { OBPRequestError, OBPRateLimitError, OBPTimeoutError } from '@obp/shared/obp';
import { env } from '$env/dynamic/private';

const API_VERSION = 'v6.0.0';

/**
 * Map an API Product response directly to APIProductDetails.
 * Reads first-class fields from the API Product response.
 */
function mapApiProductDetails(apiProduct: any): APIProductDetails {
	const product: OBPProduct = {
		bank_id: apiProduct.bank_id,
		product_code: apiProduct.api_product_code,
		parent_product_code: apiProduct.parent_api_product_code,
		name: apiProduct.name,
		more_info_url: apiProduct.more_info_url,
		terms_and_conditions_url: apiProduct.terms_and_conditions_url,
		description: apiProduct.description,
		meta: apiProduct.meta,
		product_attributes: apiProduct.attributes || []
	};

	return {
		product,
		apiCollectionId: apiProduct.collection_id || undefined,
		category: apiProduct.category || undefined,
		priceMonthly: apiProduct.monthly_subscription_amount
			? parseFloat(apiProduct.monthly_subscription_amount)
			: undefined,
		priceCurrency: apiProduct.monthly_subscription_currency || undefined,
		rateLimitPerSecond: apiProduct.per_second_call_limit || undefined,
		rateLimitPerMinute: apiProduct.per_minute_call_limit || undefined,
		rateLimitPerHour: apiProduct.per_hour_call_limit || undefined,
		rateLimitPerDay: apiProduct.per_day_call_limit || undefined,
		rateLimitPerWeek: apiProduct.per_week_call_limit || undefined,
		rateLimitPerMonth: apiProduct.per_month_call_limit || undefined
	};
}

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
			products: [],
			warnings: [],
			message: errorMsg,
			apiExplorerUrl,
			isLoggedIn
		};
	}

	let products: APIProductDetails[] = [];

	try {
		const apiProductsResponse = await obp_requests.get(
			`/obp/${API_VERSION}/api-products?tag=featured`,
			token
		);
		const rawApiProducts = apiProductsResponse?.api_products || [];
		products = rawApiProducts.map(mapApiProductDetails);
		logger.info(`Fetched ${products.length} featured api products across all banks`);
	} catch (e) {
		logger.error('Error fetching api products at all banks:', e);
		if (e instanceof OBPRateLimitError) {
			warnings.push('API rate limit exceeded while loading API products.');
		} else if (e instanceof OBPTimeoutError) {
			warnings.push('Request timed out loading API products.');
		} else if (e instanceof OBPRequestError) {
			warnings.push(`Could not load API products: ${e.message}`);
		} else {
			warnings.push('Could not load API products.');
		}
	}

	// Sort products by price (free first, then ascending)
	products.sort((a, b) => {
		const priceA = a.priceMonthly ?? 0;
		const priceB = b.priceMonthly ?? 0;
		return priceA - priceB;
	});

	return {
		products,
		warnings,
		apiExplorerUrl,
		isLoggedIn
	};
}
