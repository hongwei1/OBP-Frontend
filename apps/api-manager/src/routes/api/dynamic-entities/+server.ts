import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("DynamicEntitiesAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for dynamic entity creation");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Accept both dynamic_entity_id and definition_id for flexibility
    const dynamic_entity_id = body.dynamic_entity_id || body.definition_id;
    const { data } = body;

    if (!dynamic_entity_id) {
      return json(
        { error: "dynamic_entity_id or definition_id is required" },
        { status: 400 },
      );
    }

    if (!data || typeof data !== "object") {
      return json(
        { error: "data is required and must be an object" },
        { status: 400 },
      );
    }

    logger.info("Creating dynamic entity");
    logger.info(`Dynamic Entity ID: ${dynamic_entity_id}`);

    const requestBody = {
      dynamic_entity_id,
      data,
    };

    const endpoint = `/obp/v6.0.0/management/system-dynamic-entities`;
    logger.info(`POST ${endpoint}`);

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("Dynamic entity created successfully");
    return json(response);
  } catch (err) {
    logger.error("Error creating dynamic entity:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
