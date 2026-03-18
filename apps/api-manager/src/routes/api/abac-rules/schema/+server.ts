import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("AbacRuleSchemaAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for ABAC rule schema");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const endpoint = `/obp/v6.0.0/management/abac-rules-schema`;

  try {
    logger.info("Fetching ABAC rule schema from OBP");
    logger.info(`Calling endpoint: ${endpoint}`);
    logger.info(`Using access token: ${accessToken ? "present" : "missing"}`);

    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("ABAC rule schema fetched successfully");
    logger.info("Response type:", typeof response);
    logger.info("Response keys:", Object.keys(response || {}));
    logger.debug("Full OBP API response:", JSON.stringify(response, null, 2));

    return json(response);
  } catch (err) {
    // DON'T SWALLOW ERRORS - Log everything
    logger.error("!!! FULL ERROR FETCHING ABAC RULE SCHEMA !!!");
    logger.error("Raw error object:", err);
    logger.error("Error type:", typeof err);
    logger.error("Error constructor:", err?.constructor?.name);
    logger.error("Error string:", String(err));

    if (err && typeof err === "object") {
      logger.error("Error keys:", Object.keys(err));
      logger.error("Error enumerable properties:", JSON.stringify(err));
      logger.error(
        "Error all properties:",
        JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
      );
    }

    if (err instanceof Error) {
      logger.error("Error message:", err.message);
      logger.error("Error stack:", err.stack);
      logger.error("Error name:", err.name);
    }

    // Check for any custom properties
    const errObj = err as any;
    if (errObj) {
      logger.error("statusCode:", errObj.statusCode);
      logger.error("obpErrorCode:", errObj.obpErrorCode);
      logger.error("response:", errObj.response);
      logger.error("data:", errObj.data);
    }

    // Extract OBP error details if available
    let obpErrorCode = errObj?.obpErrorCode || errObj?.code || undefined;
    let obpMessage = errObj?.message || errObj?.error || undefined;
    let statusCode = errObj?.statusCode || errObj?.status || 500;

    // Return EVERYTHING - don't filter or sanitize
    return json(
      {
        success: false,
        error: String(err),
        errorMessage: err instanceof Error ? err.message : "Unknown error",
        errorName: err instanceof Error ? err.name : undefined,
        errorStack: err instanceof Error ? err.stack : undefined,
        obpErrorCode: obpErrorCode,
        obpMessage: obpMessage,
        statusCode: statusCode,
        rawError: err,
        stringified: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        endpoint: endpoint,
        obpEndpoint: endpoint,
        proxyEndpoint: "/api/abac-rules/schema",
      },
      { status: statusCode },
    );
  }
};
