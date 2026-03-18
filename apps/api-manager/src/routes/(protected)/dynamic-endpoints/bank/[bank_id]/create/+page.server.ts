import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    throw error(401, "No API access token available");
  }

  const { bank_id } = params;

  if (!bank_id) {
    throw error(400, "Bank ID is required");
  }

  // Get parent layout data to access externalLinks
  const parentData = await parent();

  return {
    bank_id,
    externalLinks: parentData.externalLinks || {},
  };
};
