import { createLogger } from "$lib/utils/logger";
const logger = createLogger("EntitlementsPageServer");
import type { PageServerLoad } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";

interface Entitlement {
  entitlement_id: string;
  role_name: string;
  bank_id: string;
  user_id: string;
  username: string;
}

interface EntitlementsResponse {
  list: Entitlement[];
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
    logger.warn("No access token available for entitlements API calls");
    return {
      entitlements: [],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  try {
    logger.info("=== ENTITLEMENTS API CALL ===");
    const endpoint = `/obp/v6.0.0/entitlements`;
    logger.info(`Request: ${endpoint}`);

    const response: EntitlementsResponse = await obp_requests.get(
      endpoint,
      accessToken,
    );

    const allEntitlements = response.list || [];
    logger.info(`Response: ${allEntitlements.length} entitlements`);

    // TODO: Filter out entitlements with null/empty usernames
    // This should be fixed at the API level - the entitlements endpoint should always return valid usernames
    const entitlements = allEntitlements.filter(
      (entitlement) =>
        entitlement.username && entitlement.username.trim() !== "",
    );
    logger.info(
      `Filtered to ${entitlements.length} entitlements with valid usernames (removed ${allEntitlements.length - entitlements.length})`,
    );

    return {
      entitlements,
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading entitlements:", err);

    return {
      entitlements: [],
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load entitlements",
    };
  }
};
