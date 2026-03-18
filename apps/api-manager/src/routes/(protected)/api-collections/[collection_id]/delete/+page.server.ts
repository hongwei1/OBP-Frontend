import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("DeleteApiCollectionPageServer");

interface ApiCollection {
  api_collection_id: string;
  user_id: string;
  api_collection_name: string;
  is_sharable: boolean;
  description: string;
}

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const { collection_id } = params;

  if (!collection_id) {
    throw error(400, "Collection ID is required");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];

  // No special roles required for deleting personal API collections
  const requiredRoles: any[] = [];

  if (!accessToken) {
    logger.warn("No access token available for delete API collection page");
    return {
      collection: null,
      userEntitlements,
      requiredRoles,
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  try {
    logger.info("=== FETCHING API COLLECTION FOR DELETION ===");
    logger.info(`Collection ID: ${collection_id}`);
    const endpoint = `/obp/v6.0.0/my/api-collections/${collection_id}`;
    logger.info(`Request: ${endpoint}`);

    const response: ApiCollection = await obp_requests.get(
      endpoint,
      accessToken,
    );

    logger.info(`Response: Collection ${response.api_collection_name}`);

    return {
      collection: response,
      userEntitlements,
      requiredRoles,
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading API collection:", err);

    return {
      collection: null,
      userEntitlements,
      requiredRoles,
      hasApiAccess: false,
      error:
        err instanceof Error ? err.message : "Failed to load API collection",
    };
  }
};
