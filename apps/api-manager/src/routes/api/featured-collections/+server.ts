import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("FeaturedCollectionsAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for adding featured collection");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { api_collection_id, sort_order } = body;

    if (!api_collection_id) {
      return json({ error: "api_collection_id is required" }, { status: 400 });
    }

    if (sort_order === undefined || sort_order < 1) {
      return json(
        { error: "sort_order is required and must be at least 1" },
        { status: 400 },
      );
    }

    logger.info("=== ADD FEATURED API COLLECTION ===");
    logger.info(`Collection ID: ${api_collection_id}`);
    logger.info(`Sort Order: ${sort_order}`);

    const requestBody = {
      api_collection_id,
      sort_order,
    };

    const endpoint = `/obp/v6.0.0/management/api-collections/featured`;
    logger.info(`POST ${endpoint}`);
    logger.info(`Request body: ${JSON.stringify(requestBody)}`);

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("Featured API collection added successfully");
    logger.info(`Response: ${JSON.stringify(response)}`);

    return json(response);
  } catch (err) {
    logger.error("Error adding featured API collection:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
