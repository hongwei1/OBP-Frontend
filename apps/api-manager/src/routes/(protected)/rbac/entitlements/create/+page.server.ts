import { createLogger } from "$lib/utils/logger";
const logger = createLogger("CreateEntitlementPageServer");
import type { PageServerLoad } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";

interface Role {
  role: string;
  requires_bank_id: boolean;
}

interface RolesResponse {
  roles: Role[];
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for create entitlement page");
    return {
      roles: [],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  try {
    logger.info("=== FETCHING ROLES FOR CREATE ENTITLEMENT PAGE ===");
    const endpoint = `/obp/v6.0.0/roles`;
    logger.info(`Request: ${endpoint}`);

    const response: RolesResponse = await obp_requests.get(
      endpoint,
      accessToken,
    );

    logger.info(`Response: ${response.roles?.length || 0} roles`);

    return {
      roles: response.roles || [],
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading roles:", err);

    return {
      roles: [],
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load roles",
    };
  }
};
