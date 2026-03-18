import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { error } from "@sveltejs/kit";
import type { OBPConsumer } from "$lib/obp/types";
import type { RequestEvent } from "@sveltejs/kit";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("ConsumersServer");

export async function load(event: RequestEvent) {
  const session = event.locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for consumers API calls");
    return {
      consumers: [],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  let consumers: OBPConsumer[] = [];
  let errorMessage: string | null = null;

  try {
    logger.info("=== GET ALL CONSUMERS API CALL ===");
    const endpoint = `/obp/v6.0.0/management/consumers?limit=500&offset=0&from_date=1970-01-01T00:00:00.000Z`;
    logger.info(`Request: ${endpoint}`);

    const consumersResponse = await obp_requests.get(endpoint, accessToken);

    consumers = consumersResponse?.consumers || [];
    logger.info(`Response: ${consumers.length} consumers`);
  } catch (e: any) {
    logger.error("Error fetching consumers:", e);
    errorMessage =
      e?.message || "Could not fetch consumers. Please try again later.";
  }

  // Sort consumers by created date, most recent first
  consumers.sort((a: OBPConsumer, b: OBPConsumer) => {
    const dateA = a.created ? new Date(a.created).getTime() : 0;
    const dateB = b.created ? new Date(b.created).getTime() : 0;
    return dateB - dateA; // Most recent first
  });

  return {
    consumers,
    hasApiAccess: true,
    error: errorMessage,
  };
}
