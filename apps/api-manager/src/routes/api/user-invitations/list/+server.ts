import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("UserInvitationListAPI");

export const GET: RequestHandler = async ({ url, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for user invitation list");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const bank_id = url.searchParams.get("bank_id");

    if (!bank_id) {
      return json(
        { error: "bank_id parameter is required" },
        { status: 400 }
      );
    }

    logger.info("=== LIST USER INVITATIONS ===");
    const endpoint = `/obp/v4.0.0/banks/${bank_id}/user-invitations`;
    logger.info(`Request: GET ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info(`Response: ${response?.user_invitations?.length || 0} invitations`);

    return json({
      user_invitations: response.user_invitations || [],
      count: response.user_invitations?.length || 0,
    });
  } catch (err: any) {
    logger.error("Error fetching user invitations:", err);

    // Handle specific OBP error codes
    const errorMessage = err?.message || "Failed to fetch user invitations";
    const statusCode = err?.status || 500;

    return json(
      {
        user_invitations: [],
        count: 0,
        error: errorMessage,
        details: err?.error || err
      },
      { status: statusCode }
    );
  }
};
