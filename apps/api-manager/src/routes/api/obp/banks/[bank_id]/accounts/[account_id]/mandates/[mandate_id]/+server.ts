import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from '$lib/obp/errors';
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "@obp/shared/utils";

const logger = createLogger("MandatesAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for fetching mandate");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, account_id, mandate_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!account_id) {
    return json({ error: "Account ID is required" }, { status: 400 });
  }

  if (!mandate_id) {
    return json({ error: "Mandate ID is required" }, { status: 400 });
  }

  try {
    logger.info(`Fetching mandate: bank=${bank_id}, account=${account_id}, mandate=${mandate_id}`);

    const endpoint = `/obp/v6.0.0/banks/${bank_id}/accounts/${account_id}/mandates/${mandate_id}`;
    const response = await obp_requests.get(endpoint, accessToken);

    return json(response, { status: 200 });
  } catch (err) {
    logger.error("Error fetching mandate:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for updating mandate");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, account_id, mandate_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!account_id) {
    return json({ error: "Account ID is required" }, { status: 400 });
  }

  if (!mandate_id) {
    return json({ error: "Mandate ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    logger.info(`Updating mandate: bank=${bank_id}, account=${account_id}, mandate=${mandate_id}`);

    const endpoint = `/obp/v6.0.0/banks/${bank_id}/accounts/${account_id}/mandates/${mandate_id}`;
    const response = await obp_requests.put(endpoint, body, accessToken);

    return json(response, { status: 200 });
  } catch (err) {
    logger.error("Error updating mandate:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for deleting mandate");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, account_id, mandate_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!account_id) {
    return json({ error: "Account ID is required" }, { status: 400 });
  }

  if (!mandate_id) {
    return json({ error: "Mandate ID is required" }, { status: 400 });
  }

  try {
    logger.info(`Deleting mandate: bank=${bank_id}, account=${account_id}, mandate=${mandate_id}`);

    const endpoint = `/obp/v6.0.0/banks/${bank_id}/accounts/${account_id}/mandates/${mandate_id}`;
    await obp_requests.delete(endpoint, accessToken);

    return new Response(null, { status: 204 });
  } catch (err) {
    logger.error("Error deleting mandate:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
