import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from '$lib/obp/errors';
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "@obp/shared/utils";

const logger = createLogger("MandateProvisionsAPI");

export const GET: RequestHandler = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for fetching mandate provision");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, mandate_id, provision_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!mandate_id) {
    return json({ error: "Mandate ID is required" }, { status: 400 });
  }

  if (!provision_id) {
    return json({ error: "Provision ID is required" }, { status: 400 });
  }

  try {
    logger.info(`Fetching mandate provision: bank=${bank_id}, mandate=${mandate_id}, provision=${provision_id}`);

    const endpoint = `/obp/v6.0.0/banks/${bank_id}/mandates/${mandate_id}/provisions/${provision_id}`;
    const response = await obp_requests.get(endpoint, accessToken);

    return json(response, { status: 200 });
  } catch (err) {
    logger.error("Error fetching mandate provision:", err);

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
    logger.warn("No access token available for updating mandate provision");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, mandate_id, provision_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!mandate_id) {
    return json({ error: "Mandate ID is required" }, { status: 400 });
  }

  if (!provision_id) {
    return json({ error: "Provision ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    logger.info(`Updating mandate provision: bank=${bank_id}, mandate=${mandate_id}, provision=${provision_id}`);

    const endpoint = `/obp/v6.0.0/banks/${bank_id}/mandates/${mandate_id}/provisions/${provision_id}`;
    const response = await obp_requests.put(endpoint, body, accessToken);

    return json(response, { status: 200 });
  } catch (err) {
    logger.error("Error updating mandate provision:", err);

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
    logger.warn("No access token available for deleting mandate provision");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bank_id, mandate_id, provision_id } = params;

  if (!bank_id) {
    return json({ error: "Bank ID is required" }, { status: 400 });
  }

  if (!mandate_id) {
    return json({ error: "Mandate ID is required" }, { status: 400 });
  }

  if (!provision_id) {
    return json({ error: "Provision ID is required" }, { status: 400 });
  }

  try {
    logger.info(`Deleting mandate provision: bank=${bank_id}, mandate=${mandate_id}, provision=${provision_id}`);

    const endpoint = `/obp/v6.0.0/banks/${bank_id}/mandates/${mandate_id}/provisions/${provision_id}`;
    await obp_requests.delete(endpoint, accessToken);

    return new Response(null, { status: 204 });
  } catch (err) {
    logger.error("Error deleting mandate provision:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
