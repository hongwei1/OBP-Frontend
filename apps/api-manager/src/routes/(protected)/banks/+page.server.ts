import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("BanksPageServer");

export const load: PageServerLoad = async ({ locals }) => {
  logger.info("=== Banks Page Load Started ===");

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

  logger.info("Access token present, fetching banks");

  try {
    const endpoint = "/obp/v6.0.0/banks";
    logger.info(`Making API request to: ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    const banks = response.banks || [];
    logger.info(`Retrieved ${banks.length} banks`);

    // Sort banks alphabetically by full_name
    banks.sort((a: any, b: any) => {
      const nameA = (a.full_name || "").toLowerCase();
      const nameB = (b.full_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return {
      banks,
    };
  } catch (err: any) {
    logger.error("Error fetching banks:", err);
    return {
      banks: [],
      error:
        err instanceof Error ? err.message : "Failed to fetch banks",
    };
  }
};
