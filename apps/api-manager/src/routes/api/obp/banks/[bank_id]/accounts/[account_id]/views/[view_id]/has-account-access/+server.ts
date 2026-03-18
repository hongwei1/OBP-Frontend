import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("HasAccountAccessAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for checking account access");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, account_id, view_id } = params;

  if (!bank_id || !account_id || !view_id) {
    return json({ error: "Bank ID, Account ID and View ID are required" }, { status: 400 });
  }

  try {
    const endpoint = `/obp/v6.0.0/banks/${bank_id}/accounts/${account_id}/views/${view_id}/has-account-access`;
    logger.info("=== HAS ACCOUNT ACCESS CHECK ===");
    logger.info(`Request: GET ${endpoint}`);
    logger.info(`Params: bank_id=${bank_id}, account_id=${account_id}, view_id=${view_id}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: ${JSON.stringify(response)}`);

    return json(response, { status: 200 });
  } catch (err) {
    logger.error("=== HAS ACCOUNT ACCESS CHECK FAILED ===");
    logger.error("Error checking account access:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);
    logger.error(`Error details: message="${message}", obpErrorCode="${obpErrorCode || "none"}"`);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
