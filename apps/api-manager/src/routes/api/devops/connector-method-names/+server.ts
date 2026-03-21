import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "@obp/shared/utils";

const logger = createLogger("ConnectorMethodNamesAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    logger.error("No user in session - returning 401");
    return json(
      { error: "Unauthorized - No user in session" },
      { status: 401 },
    );
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.error("No access token available for connector method names API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== CONNECTOR METHOD NAMES API CALL ===");
    const endpoint = `/obp/v6.0.0/system/connector-method-names`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Connector method names fetched successfully");

    return json(response);
  } catch (err) {
    logger.error("ERROR FETCHING CONNECTOR METHOD NAMES:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch connector method names",
      },
      { status: 500 },
    );
  }
};
