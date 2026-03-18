import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("BankDetailPageServer");

export const load: PageServerLoad = async ({ params, locals }) => {
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

  const { bankId } = params;

  if (!bankId) {
    throw error(400, "Bank ID is required");
  }

  try {
    const endpoint = `/obp/v6.0.0/banks/${bankId}`;
    logger.info(`Making API request to: ${endpoint}`);

    const bank = await obp_requests.get(endpoint, accessToken);

    logger.info(`Retrieved bank: ${bank.bank_id}`);

    return {
      bank,
    };
  } catch (err: any) {
    logger.error("Error fetching bank:", err);

    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }

    throw error(
      404,
      err instanceof Error ? err.message : `Bank "${bankId}" not found`,
    );
  }
};
