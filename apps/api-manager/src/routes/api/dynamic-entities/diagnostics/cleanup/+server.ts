import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("DynamicEntityCleanupAPI");

export const DELETE: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for orphaned entity cleanup");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const endpoint = `/obp/v6.0.0/management/diagnostics/dynamic-entities/orphaned-records`;

    logger.info(`=== DYNAMIC ENTITY ORPHANED RECORDS CLEANUP ===`);
    logger.info(`Request: DELETE ${endpoint}`);

    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info(`Cleanup completed: ${response.total_records_deleted} records deleted`);
    return json(response);
  } catch (err) {
    logger.error("Error cleaning up orphaned records:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
