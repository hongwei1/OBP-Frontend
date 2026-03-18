import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ConnectorCountsAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for connector counts API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== CONNECTOR COUNTS API CALL ===");
    const endpoint = `/obp/v6.0.0/management/connector/metrics/counts`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: ${response?.connector_counts?.length || 0} connector counts`);

    return json({
      connector_counts: response.connector_counts || [],
      count: response.connector_counts?.length || 0,
    });
  } catch (err) {
    logger.error("Error fetching connector counts:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    return json(
      {
        connector_counts: [],
        count: 0,
        error: message,
        obpErrorCode,
      },
      { status: 500 },
    );
  }
};
