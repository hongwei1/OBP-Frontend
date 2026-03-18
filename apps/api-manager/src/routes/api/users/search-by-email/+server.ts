import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("UsersSearchByEmailAPI");

export const GET: RequestHandler = async ({ url, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for user search by email");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const email = url.searchParams.get("email");

    if (!email) {
      return json({ error: "Email is required" }, { status: 400 });
    }

    logger.info("=== USER SEARCH BY EMAIL API CALL ===");
    const endpoint = `/obp/v4.0.0/users/email/${encodeURIComponent(email)}/terminator`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: ${response?.users?.length || 0} users found`);

    if (response?.users) {
      return json({
        users: response.users,
        count: response.users.length,
      });
    } else {
      return json({
        users: [],
        count: 0,
      });
    }
  } catch (err) {
    logger.error("ERROR SEARCHING USERS BY EMAIL:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return json(
      {
        users: [],
        count: 0,
        error:
          err instanceof Error ? err.message : "Failed to search users by email",
      },
      { status: 500 },
    );
  }
};
