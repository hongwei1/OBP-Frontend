import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("PersonalDynamicEntitiesPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  logger.info("=== Personal Dynamic Entities Page Load Started ===");

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

  logger.info("Access token present, fetching personal dynamic entities");

  try {
    const endpoint = "/obp/v6.0.0/personal-dynamic-entities/available";
    logger.info(`Making API request to: ${endpoint}`);

    const entitiesResponse = await obp_requests.get(endpoint, accessToken);

    const entities = entitiesResponse.dynamic_entities || [];
    logger.info(`Retrieved ${entities.length} personal dynamic entities`);

    // Sort entities alphabetically by entity name
    entities.sort((a: any, b: any) => {
      const nameA = (a.entity_name || "").toLowerCase();
      const nameB = (b.entity_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return {
      entities,
    };
  } catch (err: any) {
    logger.error("Error fetching personal dynamic entities:", err);
    return {
      entities: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to fetch personal dynamic entities",
    };
  }
};
