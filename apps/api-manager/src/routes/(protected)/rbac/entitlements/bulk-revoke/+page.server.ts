import { createLogger } from '@obp/shared/utils';
const logger = createLogger("BulkRevokePageServer");
import type { PageServerLoad } from "./$types";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    return { hasApiAccess: false, error: "No API access token available" };
  }

  return { hasApiAccess: true };
};
