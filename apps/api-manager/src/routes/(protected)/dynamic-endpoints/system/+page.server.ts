import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("SystemDynamicEndpointsPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  logger.info("=== System Dynamic Endpoints Page Load Started ===");

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

  logger.info("Access token present, fetching dynamic endpoints");

  try {
    const endpoint = "/obp/v6.0.0/management/dynamic-endpoints";
    logger.info(`Making API request to: ${endpoint}`);

    const endpointsResponse = await obp_requests.get(endpoint, accessToken);

    const endpoints = endpointsResponse.dynamic_endpoints || [];
    logger.info(`Retrieved ${endpoints.length} system dynamic endpoints`);

    return {
      endpoints,
    };
  } catch (err: any) {
    logger.error("Error fetching system dynamic endpoints:", err);
    logger.error("Error details:", {
      message: err?.message,
      status: err?.status,
      statusText: err?.statusText,
      response: err?.response,
    });
    return {
      endpoints: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to fetch system dynamic endpoints",
    };
  }
};
