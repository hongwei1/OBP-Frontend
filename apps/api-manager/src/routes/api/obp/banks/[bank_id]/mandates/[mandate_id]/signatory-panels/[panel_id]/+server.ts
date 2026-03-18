import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("SignatoryPanelsAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for fetching signatory panel");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, mandate_id, panel_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!mandate_id) {
    return json({ error: "Mandate ID is required" }, { status: 400 });
  }

  if (!panel_id) {
    return json({ error: "Panel ID is required" }, { status: 400 });
  }

  try {
    logger.info(`Fetching signatory panel: bank=${bank_id}, mandate=${mandate_id}, panel=${panel_id}`);

    const endpoint = `/obp/v6.0.0/banks/${bank_id}/mandates/${mandate_id}/signatory-panels/${panel_id}`;
    const response = await obp_requests.get(endpoint, accessToken);

    return json(response, { status: 200 });
  } catch (err) {
    logger.error("Error fetching signatory panel:", err);

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
    logger.warn("No access token available for updating signatory panel");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, mandate_id, panel_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!mandate_id) {
    return json({ error: "Mandate ID is required" }, { status: 400 });
  }

  if (!panel_id) {
    return json({ error: "Panel ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    logger.info(`Updating signatory panel: bank=${bank_id}, mandate=${mandate_id}, panel=${panel_id}`);

    const endpoint = `/obp/v6.0.0/banks/${bank_id}/mandates/${mandate_id}/signatory-panels/${panel_id}`;
    const response = await obp_requests.put(endpoint, body, accessToken);

    return json(response, { status: 200 });
  } catch (err) {
    logger.error("Error updating signatory panel:", err);

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
    logger.warn("No access token available for deleting signatory panel");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, mandate_id, panel_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!mandate_id) {
    return json({ error: "Mandate ID is required" }, { status: 400 });
  }

  if (!panel_id) {
    return json({ error: "Panel ID is required" }, { status: 400 });
  }

  try {
    logger.info(`Deleting signatory panel: bank=${bank_id}, mandate=${mandate_id}, panel=${panel_id}`);

    const endpoint = `/obp/v6.0.0/banks/${bank_id}/mandates/${mandate_id}/signatory-panels/${panel_id}`;
    await obp_requests.delete(endpoint, accessToken);

    return new Response(null, { status: 204 });
  } catch (err) {
    logger.error("Error deleting signatory panel:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
