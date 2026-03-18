import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("SystemDynamicEndpointAPI");

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
    const { id } = params;

    if (!id) {
      return json({ error: "Endpoint ID is required" }, { status: 400 });
    }

    logger.info(`Fetching system dynamic endpoint: ${id}`);

    const endpoint = `/obp/v6.0.0/management/dynamic-endpoints/${id}`;
    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("System dynamic endpoint retrieved successfully");
    return json(response);
  } catch (err) {
    logger.error("Error fetching system dynamic endpoint:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
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
    const { id } = params;

    if (!id) {
      return json({ error: "Endpoint ID is required" }, { status: 400 });
    }

    logger.info(`Deleting system dynamic endpoint: ${id}`);

    const endpoint = `/obp/v6.0.0/management/dynamic-endpoints/${id}`;
    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info("System dynamic endpoint deleted successfully");
    return json(response);
  } catch (err) {
    logger.error("Error deleting system dynamic endpoint:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
