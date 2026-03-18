import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ConnectorMetricsAPI");

export const GET: RequestHandler = async ({ locals, url }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for connector metrics API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    // Build query parameters from URL search params
    const queryParams = new URLSearchParams();

    // Supported filters for connector metrics
    const supportedParams = [
      "from_date",
      "to_date",
      "limit",
      "offset",
      "connector_name",
      "function_name",
      "correlation_id",
    ];

    supportedParams.forEach((param) => {
      const value = url.searchParams.get(param);
      if (value && value.trim() !== "") {
        queryParams.append(param, value);
      }
    });

    // Set defaults if not provided
    if (!queryParams.has("limit")) {
      queryParams.set("limit", "50");
    }

    logger.info("=== CONNECTOR METRICS API CALL ===");
    const endpoint = `/obp/v6.0.0/management/connector/metrics?${queryParams.toString()}`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: ${response?.metrics?.length || 0} connector metrics`);

    return json({
      metrics: response.metrics || [],
      count: response.metrics?.length || 0,
    });
  } catch (err) {
    logger.error("Error fetching connector metrics:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    return json(
      {
        metrics: [],
        count: 0,
        error: message,
        obpErrorCode,
      },
      { status: 500 }
    );
  }
};
