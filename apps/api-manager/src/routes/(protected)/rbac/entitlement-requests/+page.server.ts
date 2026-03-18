import { createLogger } from "$lib/utils/logger";
const logger = createLogger("EntitlementRequestsPageServer");
import type { PageServerLoad } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";

interface EntitlementRequest {
  entitlement_request_id: string;
  user: {
    user_id: string;
    username: string;
    email: string;
  };
  role_name: string;
  bank_id?: string;
  created: string;
}

interface EntitlementRequestsResponse {
  entitlement_requests: EntitlementRequest[];
}

const DEFAULT_LIMIT = 50;

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for entitlement requests API calls");
    return {
      entitlementRequests: [],
      hasApiAccess: false,
      error: "No API access token available",
      limit: DEFAULT_LIMIT,
      offset: 0,
    };
  }

  const limit = parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT));
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const sortDirection = url.searchParams.get("sort_direction") || "DESC";

  try {
    logger.info("=== ENTITLEMENT REQUESTS API CALL ===");
    const endpoint = `/obp/v6.0.0/entitlement-requests?limit=${limit}&offset=${offset}&sort_direction=${sortDirection}`;
    logger.info(`Request: ${endpoint}`);

    const response: EntitlementRequestsResponse = await obp_requests.get(
      endpoint,
      accessToken,
    );

    logger.info(
      `Response: ${response.entitlement_requests?.length || 0} entitlement requests`,
    );

    return {
      entitlementRequests: response.entitlement_requests || [],
      hasApiAccess: true,
      limit,
      offset,
    };
  } catch (err) {
    logger.error("Error loading entitlement requests:", err);

    return {
      entitlementRequests: [],
      hasApiAccess: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to load entitlement requests",
      limit,
      offset,
    };
  }
};
