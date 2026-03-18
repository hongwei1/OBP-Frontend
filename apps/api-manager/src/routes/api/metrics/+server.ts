import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { checkAPIAuth } from "$lib/utils/apiAuth";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("MetricsAPI");

export const GET: RequestHandler = async ({ url, locals }) => {
  const auth = checkAPIAuth(locals);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const accessToken = auth.accessToken!;

  try {
    // Get all query parameters from the request
    const queryString = url.searchParams.toString();

    // Build the OBP API endpoint with the query string
    const endpoint = `/obp/v6.0.0/management/metrics?${queryString}`;

    logger.info("=== METRICS API CALL ===");
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: ${response?.metrics?.length || 0} records`);

    if (response?.metrics) {
      return json({
        metrics: response.metrics,
        count: response.metrics.length,
      });
    } else {
      logger.warn("NO METRICS DATA IN RESPONSE");
      return json({
        metrics: [],
        count: 0,
        error: "No metrics data found in API response",
      });
    }
  } catch (err) {
    logger.error("ERROR FETCHING METRICS:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        metrics: [],
        count: 0,
        error: err instanceof Error ? err.message : "Failed to fetch metrics",
      },
      { status: 500 },
    );
  }
};
