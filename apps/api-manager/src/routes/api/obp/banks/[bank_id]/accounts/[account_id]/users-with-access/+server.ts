import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("UsersWithAccountAccessAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for fetching users with account access");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, account_id } = params;

  if (!bank_id || !account_id) {
    return json({ error: "Bank ID and Account ID are required" }, { status: 400 });
  }

  try {
    logger.info(`Fetching users with access for bank: ${bank_id}, account: ${account_id}`);

    const endpoint = `/obp/v6.0.0/banks/${encodeURIComponent(bank_id)}/accounts/${encodeURIComponent(account_id)}/users-with-access`;
    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Retrieved users with access for account ${account_id}`);

    return json(response, { status: 200 });
  } catch (err) {
    logger.error("Error fetching users with account access:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
