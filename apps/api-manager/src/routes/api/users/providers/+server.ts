import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ProvidersAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for providers API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== PROVIDERS API CALL ===");
    const endpoint = `/obp/v6.0.0/providers`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Raw response from OBP API:");
    logger.info(JSON.stringify(response, null, 2));
    logger.info(`Response type: ${typeof response}`);
    logger.info(
      `Response keys: ${response ? Object.keys(response).join(", ") : "none"}`,
    );

    if (response?.providers) {
      // Extract provider IDs from the response
      const providerIds = response.providers.map(
        (p: any) => p.provider_id || p.provider || p,
      );
      logger.info(`Extracted ${providerIds.length} provider IDs`);
      return json({
        providers: providerIds,
        count: providerIds.length,
      });
    } else {
      logger.warn("NO PROVIDERS DATA IN RESPONSE");
      return json({
        providers: [],
        count: 0,
      });
    }
  } catch (err) {
    logger.error("ERROR FETCHING PROVIDERS:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        providers: [],
        count: 0,
        error: err instanceof Error ? err.message : "Failed to fetch providers",
      },
      { status: 500 },
    );
  }
};
