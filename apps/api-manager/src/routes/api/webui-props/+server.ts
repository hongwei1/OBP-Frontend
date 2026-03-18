import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("WebUIPropsAPI");

export const PUT: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for webui prop creation");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, value } = body;

    if (!name || typeof name !== "string") {
      return json(
        { error: "name is required and must be a string" },
        { status: 400 },
      );
    }

    if (!value || typeof value !== "string") {
      return json(
        { error: "value is required and must be a string" },
        { status: 400 },
      );
    }

    logger.info("Creating/updating webui prop");
    logger.info(`Name: ${name}`);

    const requestBody = {
      value,
    };

    const endpoint = `/obp/v6.0.0/management/webui_props/${name}`;
    logger.info(`PUT ${endpoint}`);

    const response = await obp_requests.put(endpoint, requestBody, accessToken);

    logger.info("WebUI prop created successfully");
    return json(response);
  } catch (err) {
    logger.error("Error creating webui prop:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
