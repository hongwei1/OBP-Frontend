import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ProductsAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;
  const bankId = params.bank_id;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!bankId) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for products API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info(`=== API PRODUCTS API CALL for bank ${bankId} ===`);
    const endpoint = `/obp/v6.0.0/banks/${bankId}/api-products`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: ${response?.api_products?.length || 0} api products`);

    return json({
      products: response.api_products || [],
      count: response.api_products?.length || 0,
    });
  } catch (err) {
    logger.error("Error fetching products:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    return json(
      {
        products: [],
        count: 0,
        error: message,
        obpErrorCode,
      },
      { status: 500 }
    );
  }
};
