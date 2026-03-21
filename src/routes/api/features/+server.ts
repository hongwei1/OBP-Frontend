import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { checkAPIAuth } from "$lib/utils/apiAuth";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("FeaturesAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const auth = checkAPIAuth(locals);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const accessToken = auth.accessToken!;

  try {
    const endpoint = "/obp/v6.0.0/features";
    logger.info(`Fetching features from ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Features response: ${JSON.stringify(response)}`);

    return json(response);
  } catch (err) {
    logger.error("Error fetching features:", err);

    return json(
      {
        error: err instanceof Error ? err.message : "Failed to fetch features",
      },
      { status: 500 },
    );
  }
};
