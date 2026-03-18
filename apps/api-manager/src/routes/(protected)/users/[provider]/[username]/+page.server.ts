import { createLogger } from "$lib/utils/logger";
const logger = createLogger("UserDetailPageServer");
import type { PageServerLoad } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const { provider, username } = params;

  if (!provider || !username) {
    throw error(400, "Provider and username are required");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for user detail API call");
    return {
      user: null,
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  let user = null;

  try {
    // Fetch user details from OBP API
    logger.info("=== USER DETAIL API CALL ===");
    const endpoint = `/obp/v6.0.0/users/provider/${encodeURIComponent(provider)}/username/${encodeURIComponent(username)}`;
    logger.info(`Request: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: User ${username} from provider ${provider}`);

    if (response) {
      user = response;
    } else {
      logger.warn("NO USER DATA IN RESPONSE");
      return {
        user: null,
        provider,
        username,
        hasApiAccess: true,
        error: "User not found",
      };
    }
  } catch (err) {
    logger.error("ERROR FETCHING USER DETAIL:");
    logger.error(`  Error type: ${err?.constructor?.name}`);
    logger.error(
      `  Error message: ${err instanceof Error ? err.message : String(err)}`,
    );

    return {
      user: null,
      provider,
      username,
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load user details",
    };
  }

  return {
    user,
    provider,
    username,
    hasApiAccess: true,
  };
};
