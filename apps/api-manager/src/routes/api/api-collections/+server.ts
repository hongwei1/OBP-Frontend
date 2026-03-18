import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ApiCollectionsAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for collection creation");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { api_collection_name, description, is_sharable } = body;

    if (!api_collection_name) {
      return json(
        { error: "api_collection_name is required" },
        { status: 400 },
      );
    }

    logger.info("=== CREATE API COLLECTION ===");
    logger.info(`Name: ${api_collection_name}`);
    logger.info(`Description: ${description}`);
    logger.info(`Is Sharable: ${is_sharable}`);

    const requestBody: any = {
      api_collection_name,
      is_sharable: is_sharable ?? false,
    };

    // Only include description if provided
    if (description && description.trim() !== "") {
      requestBody.description = description;
    }

    const endpoint = `/obp/v6.0.0/my/api-collections`;
    logger.info(`POST ${endpoint}`);
    logger.info(`Request body: ${JSON.stringify(requestBody)}`);

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("API collection created successfully");
    logger.info(`Response: ${JSON.stringify(response)}`);

    return json(response);
  } catch (err) {
    logger.error("Error creating API collection:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
