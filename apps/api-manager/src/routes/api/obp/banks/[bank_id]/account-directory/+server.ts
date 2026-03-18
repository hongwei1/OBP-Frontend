import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("AccountDirectoryAPI");

export const GET: RequestHandler = async ({ locals, params, url }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for fetching account directory");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  try {
    const limit = url.searchParams.get("limit") || "50";
    const offset = url.searchParams.get("offset") || "0";

    logger.info(`Fetching account directory for bank: ${bank_id}`);

    const endpoint = `/obp/v6.0.0/banks/${encodeURIComponent(bank_id)}/account-directory?limit=${limit}&offset=${offset}`;
    const response = await obp_requests.get(endpoint, accessToken);

    const accounts = response.accounts || [];
    logger.info(
      `Retrieved ${accounts.length} accounts in directory for bank ${bank_id}`,
    );

    return json({ accounts }, { status: 200 });
  } catch (err) {
    logger.error("Error fetching account directory:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message, accounts: [] };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
