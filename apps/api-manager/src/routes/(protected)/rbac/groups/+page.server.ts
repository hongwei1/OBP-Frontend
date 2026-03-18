import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("GroupsPageServer");

interface Group {
  group_id: string;
  bank_id: string;
  group_name: string;
  group_description: string;
  is_enabled: boolean;
  list_of_roles?: string[];
}

interface GroupsResponse {
  groups: Group[];
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
    logger.warn("No access token available for groups page");
    return {
      groups: [],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  try {
    logger.info("=== FETCHING GROUPS ===");
    const endpoint = `/obp/v6.0.0/management/groups`;
    logger.info(`Request: ${endpoint}`);

    const response: GroupsResponse = await obp_requests.get(
      endpoint,
      accessToken,
    );

    logger.info(`Response: ${response.groups?.length || 0} groups`);

    return {
      groups: response.groups || [],
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading groups:", err);

    return {
      groups: [],
      hasApiAccess: false,
      error: err instanceof Error ? err.message : "Failed to load groups",
    };
  }
};
