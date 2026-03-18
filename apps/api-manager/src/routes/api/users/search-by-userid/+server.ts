import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("UsersSearchByUserIdAPI");

export const GET: RequestHandler = async ({ url, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for user search by user ID");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return json({ error: "User ID is required" }, { status: 400 });
    }

    logger.info("=== USER SEARCH BY USER ID API CALL ===");
    const endpoint = `/obp/v6.0.0/users/user-id/${encodeURIComponent(userId)}`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: User found`);

    if (response) {
      return json({
        user: response,
      });
    } else {
      return json({
        user: null,
        error: "User not found",
      });
    }
  } catch (err) {
    logger.error("ERROR SEARCHING USER BY USER ID:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        user: null,
        error:
          err instanceof Error
            ? err.message
            : "Failed to search user by user ID",
      },
      { status: 500 },
    );
  }
};
