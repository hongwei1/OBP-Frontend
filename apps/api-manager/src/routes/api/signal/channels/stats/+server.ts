import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { checkAPIAuth } from "$lib/utils/apiAuth";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("SignalStatsAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const auth = checkAPIAuth(locals);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const accessToken = auth.accessToken!;

  try {
    logger.info("=== SIGNAL STATS API CALL ===");
    const endpoint = `/obp/v6.0.0/signal/channels/stats`;

    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(
      `Retrieved signal stats: ${response?.total_channels ?? 0} channels, ${response?.total_messages ?? 0} messages`,
    );

    return json(response);
  } catch (err) {
    logger.error("ERROR FETCHING SIGNAL STATS:");
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch signal stats",
      },
      { status: 500 },
    );
  }
};
