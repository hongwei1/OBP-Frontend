import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ResourceDocsAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for resource docs API call");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== RESOURCE DOCS API CALL ===");
    const endpoint = `/obp/v6.0.0/resource-docs/v6.0.0/obp`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(
      `Response: ${response.resource_docs?.length || 0} resource docs`
    );

    return json(response);
  } catch (err) {
    logger.error("Error fetching resource docs:", err);

    return json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch resource docs",
      },
      { status: 500 }
    );
  }
};
