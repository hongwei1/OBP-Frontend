import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("EntitlementsByUserAPI");

export const GET: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const user_id = params.user_id;

  if (!user_id) {
    return json({ error: "user_id is required" }, { status: 400 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for fetching user entitlements");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info(`Fetching entitlements for user ${user_id}`);
    const endpoint = `/obp/v6.0.0/users/${user_id}/entitlements`;
    const response = await obp_requests.get(endpoint, accessToken);

    return json(response);
  } catch (err) {
    const { message, obpErrorCode } = extractErrorDetails(err);
    const statusCode = (err as any)?.statusCode || 500;

    logger.error(`Error fetching entitlements for user ${user_id}:`, err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: statusCode });
  }
};
