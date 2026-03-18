import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("BankDynamicEntityCreateAPI");

export const POST: RequestHandler = async ({ request, locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const bankId = params.bankId;

  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return json(
        { error: "Request body must be a valid object" },
        { status: 400 },
      );
    }

    logger.info(`Creating bank-level dynamic entity for bank: ${bankId}`);
    logger.info("Payload:", JSON.stringify(body, null, 2));

    const endpoint = `/obp/v6.0.0/management/banks/${bankId}/dynamic-entities`;
    const response = await obp_requests.post(endpoint, body, accessToken);

    logger.info(`Bank-level dynamic entity created successfully for ${bankId}`);
    return json(response);
  } catch (err) {
    logger.error(`Error creating bank-level dynamic entity for ${bankId}:`, err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
