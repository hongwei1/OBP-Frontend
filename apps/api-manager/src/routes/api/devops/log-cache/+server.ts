import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { checkAPIAuth } from "$lib/utils/apiAuth";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("LogCacheAPI");

export const GET: RequestHandler = async ({ url, locals }) => {
  const auth = checkAPIAuth(locals);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const accessToken = auth.accessToken!;

  try {
    const logLevel = url.searchParams.get("log_level") || "ALL";

    logger.info("=== LOG-CACHE API CALL ===");
    const endpoint = `/obp/v6.0.0/system/log-cache/${encodeURIComponent(logLevel.toLowerCase())}`;

    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Retrieved ${response?.entries?.length || 0} log entries`);

    return json(response);
  } catch (err) {
    logger.error("ERROR FETCHING LOG-CACHE:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error: err instanceof Error ? err.message : "Failed to fetch log-cache",
      },
      { status: 500 },
    );
  }
};
