import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("PersonalDynamicEntityCommunityAPI");

// GET - List community records for an entity (read-only)
export const GET: RequestHandler = async ({ params, locals }) => {
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

  try {
    const { entityName } = params;

    if (!entityName) {
      return json({ error: "Entity name is required" }, { status: 400 });
    }

    logger.info(`Fetching community records for entity: ${entityName}`);

    const endpoint = `/obp/dynamic-entity/community/${entityName}`;
    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Community records retrieved successfully");
    return json(response);
  } catch (err) {
    logger.error("Error fetching community records:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
