import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("CreateApiCollectionPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  // Get user entitlements from session for role checking
  const userEntitlements = (session.data.user as any)?.entitlements?.list || [];

  // No special roles required for creating personal API collections
  const requiredRoles: any[] = [];

  if (!accessToken) {
    logger.warn("No access token available for create API collection page");
    return {
      userEntitlements,
      requiredRoles,
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  return {
    userEntitlements,
    requiredRoles,
    hasApiAccess: true,
  };
};
