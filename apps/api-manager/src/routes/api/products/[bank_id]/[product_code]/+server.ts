import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ProductAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;
  const bankId = params.bank_id;
  const productCode = params.product_code;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!bankId) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!productCode) {
    return json({ error: "Product code is required" }, { status: 400 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for product API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info(`=== API PRODUCT API CALL for bank ${bankId}, product ${productCode} ===`);
    const endpoint = `/obp/v6.0.0/banks/${bankId}/api-products/${productCode}`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: Product retrieved`);

    return json(response);
  } catch (err) {
    logger.error("Error fetching product:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    return json(
      {
        error: message,
        obpErrorCode,
      },
      { status: 500 }
    );
  }
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  const session = locals.session;
  const bankId = params.bank_id;
  const productCode = params.product_code;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!bankId) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!productCode) {
    return json({ error: "Product code is required" }, { status: 400 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for product API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();

    logger.info(`=== CREATE/UPDATE API PRODUCT API CALL for bank ${bankId}, product ${productCode} ===`);
    const endpoint = `/obp/v6.0.0/banks/${bankId}/api-products/${productCode}`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.put(endpoint, body, accessToken);

    logger.info(`Response: Product created/updated`);

    return json(response);
  } catch (err) {
    logger.error("Error creating/updating product:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    return json(
      {
        error: message,
        obpErrorCode,
      },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;
  const bankId = params.bank_id;
  const productCode = params.product_code;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!bankId) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!productCode) {
    return json({ error: "Product code is required" }, { status: 400 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for product API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info(`=== DELETE API PRODUCT API CALL for bank ${bankId}, product ${productCode} ===`);
    const endpoint = `/obp/v6.0.0/banks/${bankId}/api-products/${productCode}`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info(`Response: Product deleted`);

    return json({ success: true, ...response });
  } catch (err) {
    logger.error("Error deleting product:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    return json(
      {
        error: message,
        obpErrorCode,
      },
      { status: 500 }
    );
  }
};
