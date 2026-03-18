import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { checkAPIAuth } from "$lib/utils/apiAuth";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("CacheInfoAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const auth = checkAPIAuth(locals);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const accessToken = auth.accessToken!;

  try {
    logger.info("=== CACHE INFO API CALL ===");
    const endpoint = `/obp/v6.0.0/system/cache/info`;

    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Retrieved cache information with ${response?.namespaces?.length || 0} namespaces`);

    return json(response);
  } catch (err) {
    logger.error("ERROR FETCHING CACHE INFO:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch cache info",
      },
      { status: 500 },
    );
  }
};
