import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("CustomerAttributeAPI");

export const POST: RequestHandler = async ({ locals, params, request }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for creating customer attribute");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, customer_id } = params;

  if (!bank_id || !customer_id) {
    return json({ error: "Bank ID and Customer ID are required" }, { status: 400 });
  }

  try {
    const body = await request.json();

    logger.info(`Creating customer attribute: bank=${bank_id}, customer=${customer_id}`);

    const endpoint = `/obp/v4.0.0/banks/${bank_id}/customers/${customer_id}/attribute`;
    const response = await obp_requests.post(endpoint, body, accessToken);

    return json(response, { status: 201 });
  } catch (err) {
    logger.error("Error creating customer attribute:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
