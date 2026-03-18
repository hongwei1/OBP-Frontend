import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("SystemDynamicEntitiesPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  logger.info("=== System Dynamic Entities Page Load Started ===");

  const session = locals.session;

  if (!session?.data?.user) {
    logger.error("No user in session");
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.error("No access token available");
    throw error(401, "No API access token available");
  }

  logger.info("Access token present, fetching dynamic entities");

  try {
    const endpoint = "/obp/v6.0.0/management/system-dynamic-entities";
    logger.info(`Making API request to: ${endpoint}`);

    const entitiesResponse = await obp_requests.get(endpoint, accessToken);

    const entities = entitiesResponse.dynamic_entities || [];
    logger.info(`Retrieved ${entities.length} system dynamic entities`);
    logger.info(`Found ${entities.length} dynamic entities`);

    // Sort entities alphabetically by entity name
    entities.sort((a: any, b: any) => {
      const nameA = (a.entity_name || "").toLowerCase();
      const nameB = (b.entity_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    logger.info("Entities sorted alphabetically");

    // Get user entitlements from session for role checking
    const userEntitlements =
      (session.data.user as any)?.entitlements?.list || [];

    return {
      entities,
      userEntitlements,
    };
  } catch (err: any) {
    logger.error("Error fetching system dynamic entities:", err);
    logger.error("Error details:", {
      message: err?.message,
      status: err?.status,
      statusText: err?.statusText,
      response: err?.response,
    });
    return {
      entities: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to fetch system dynamic entities",
    };
  }
};
