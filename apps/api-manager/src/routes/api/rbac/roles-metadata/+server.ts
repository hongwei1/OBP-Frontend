import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("RolesMetadataAPI");

interface RoleMetadata {
  role: string;
  requires_bank_id: boolean;
}

interface RolesResponse {
  roles: RoleMetadata[];
}

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for roles metadata");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== ROLES METADATA API CALL ===");
    const endpoint = `/obp/v6.0.0/roles`;
    logger.info(`Request: ${endpoint}`);

    const response: RolesResponse = await obp_requests.get(
      endpoint,
      accessToken,
    );

    logger.info(`Response: ${response.roles?.length || 0} roles`);

    return json({
      roles: response.roles || [],
    });
  } catch (err) {
    logger.error("Error fetching roles metadata:", err);

    const errorMessage =
      err instanceof Error ? err.message : "Failed to fetch roles metadata";

    return json({ error: errorMessage }, { status: 500 });
  }
};
