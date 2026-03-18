import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { checkAPIAuth } from "$lib/utils/apiAuth";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("SignalChannelDeleteAPI");

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const auth = checkAPIAuth(locals);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const accessToken = auth.accessToken!;
  const channelName = params.channel_name;

  try {
    logger.info(`=== SIGNAL CHANNEL DELETE API CALL: ${channelName} ===`);
    const endpoint = `/obp/v6.0.0/signal/channels/${encodeURIComponent(channelName)}`;

    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info(`Deleted signal channel: ${channelName}`);

    return json(response);
  } catch (err) {
    logger.error(`ERROR DELETING SIGNAL CHANNEL ${channelName}:`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to delete signal channel",
      },
      { status: 500 },
    );
  }
};
