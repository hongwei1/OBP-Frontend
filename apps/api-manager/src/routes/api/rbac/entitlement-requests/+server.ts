import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("EntitlementRequestsAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for entitlement request");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role_name, bank_id } = body;

    if (!role_name) {
      return json({ error: "role_name is required" }, { status: 400 });
    }

    logger.info("=== CREATE ENTITLEMENT REQUEST ===");
    logger.info(`Role: ${role_name}`);
    logger.info(`Bank ID: ${bank_id || "(empty string)"}`);

    const requestBody: any = {
      role_name,
      // Always include bank_id - use empty string for system-wide roles
      bank_id: bank_id || "",
    };

    const endpoint = `/obp/v6.0.0/entitlement-requests`;
    logger.info(`POST ${endpoint}`);
    logger.info(`Request body: ${JSON.stringify(requestBody)}`);

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("Entitlement request created successfully");
    logger.info(`Response: ${JSON.stringify(response)}`);

    return json(response);
  } catch (err) {
    logger.error("Error creating entitlement request:", err);

    const errorMessage =
      err instanceof Error
        ? err.message
        : "Failed to create entitlement request";

    return json({ error: errorMessage }, { status: 500 });
  }
};
