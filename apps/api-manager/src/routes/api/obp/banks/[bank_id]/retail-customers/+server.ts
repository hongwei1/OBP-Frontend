import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from '$lib/obp/errors';
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "@obp/shared/utils";

const logger = createLogger("RetailCustomersAPI");

export const GET: RequestHandler = async ({ locals, params, url }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for fetching retail customers");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  try {
    const limit = url.searchParams.get("limit") || "50";
    const offset = url.searchParams.get("offset") || "0";
    const sort_direction = url.searchParams.get("sort_direction") || "ASC";

    logger.info(`Fetching retail customers for bank: ${bank_id}`);

    const endpoint = `/obp/v6.0.0/banks/${encodeURIComponent(bank_id)}/retail-customers?limit=${limit}&offset=${offset}&sort_direction=${sort_direction}`;
    const response = await obp_requests.get(endpoint, accessToken);

    const customers = response.customers || [];
    logger.info(
      `Retrieved ${customers.length} retail customers for bank ${bank_id}`,
    );

    return json({ customers }, { status: 200 });
  } catch (err) {
    logger.error("Error fetching retail customers:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message, customers: [] };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
