import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("BanksAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for create bank API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    logger.info("=== CREATE BANK API CALL ===");
    const endpoint = `/obp/v6.0.0/banks`;

    const response = await obp_requests.post(endpoint, body, accessToken);

    logger.info(`Bank created: ${response?.bank_id}`);

    return json(response, { status: 201 });
  } catch (err) {
    logger.error("Error creating bank:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    return json(
      {
        error: message,
        obpErrorCode,
      },
      { status: 400 }
    );
  }
};

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for banks API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== BANKS API CALL ===");
    const endpoint = `/obp/v6.0.0/banks`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: ${response?.banks?.length || 0} banks`);

    return json({
      banks: response.banks || [],
      count: response.banks?.length || 0,
    });
  } catch (err) {
    logger.error("Error fetching banks:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    return json(
      {
        banks: [],
        count: 0,
        error: message,
        obpErrorCode,
      },
      { status: 500 }
    );
  }
};
