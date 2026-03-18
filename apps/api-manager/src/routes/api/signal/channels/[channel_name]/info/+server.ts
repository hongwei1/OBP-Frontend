import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { checkAPIAuth } from "$lib/utils/apiAuth";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("SignalChannelInfoAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
  const auth = checkAPIAuth(locals);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const accessToken = auth.accessToken!;
  const channelName = params.channel_name;

  try {
    logger.info(`=== SIGNAL CHANNEL INFO API CALL: ${channelName} ===`);
    const endpoint = `/obp/v6.0.0/signal/channels/${encodeURIComponent(channelName)}/info`;

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Retrieved info for channel: ${channelName}`);

    return json(response);
  } catch (err) {
    logger.error(`ERROR FETCHING SIGNAL CHANNEL INFO for ${channelName}:`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch channel info",
      },
      { status: 500 },
    );
  }
};
