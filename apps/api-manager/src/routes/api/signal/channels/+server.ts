import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { checkAPIAuth } from "$lib/utils/apiAuth";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("SignalChannelsAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const auth = checkAPIAuth(locals);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const accessToken = auth.accessToken!;

  try {
    logger.info("=== SIGNAL CHANNELS LIST API CALL ===");
    const endpoint = `/obp/v6.0.0/signal/channels`;

    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(
      `Retrieved ${response?.channels?.length ?? 0} signal channels`,
    );

    return json(response);
  } catch (err) {
    logger.error("ERROR FETCHING SIGNAL CHANNELS:");
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch signal channels",
      },
      { status: 500 },
    );
  }
};
