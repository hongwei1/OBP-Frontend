import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("BankDynamicEntitiesListAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
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
    logger.info(`Fetching bank-level dynamic entities for bank: ${bankId}`);

    const endpoint = `/obp/v6.0.0/management/banks/${bankId}/dynamic-entities`;
    const response = await obp_requests.get(endpoint, accessToken);

    const entities = response.dynamic_entities || [];

    logger.info(`Retrieved ${entities.length} bank-level dynamic entities for ${bankId}`);
    return json({ dynamic_entities: entities });
  } catch (err) {
    logger.error(`Error fetching bank-level dynamic entities for ${bankId}:`, err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
