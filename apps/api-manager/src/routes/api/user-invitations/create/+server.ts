import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("UserInvitationCreateAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for user invitation creation");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bank_id, first_name, last_name, email, company, country, purpose } = body;

    // Validate required fields
    if (!bank_id || !first_name || !last_name || !email || !company || !country || !purpose) {
      return json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    logger.info("=== CREATE USER INVITATION ===");
    const endpoint = `/obp/v4.0.0/banks/${bank_id}/user-invitation`;
    logger.info(`Request: POST ${endpoint}`);
    logger.info(`Data:`, { first_name, last_name, email, company, country, purpose });

    const payload = {
      first_name,
      last_name,
      email,
      company,
      country,
      purpose
    };

    const response = await obp_requests.post(endpoint, payload, accessToken);

    logger.info(`Response:`, response);

    return json(response, { status: 201 });
  } catch (err: any) {
    logger.error("Error creating user invitation:", err);

    // Handle specific OBP error codes
    const errorMessage = err?.message || "Failed to create user invitation";
    const statusCode = err?.status || 500;

    return json(
      {
        error: errorMessage,
        details: err?.error || err
      },
      { status: statusCode }
    );
  }
};
