import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("AbacRuleExecuteAPI");

export const POST: RequestHandler = async ({ request, locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for ABAC rule execution");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const ruleId = params.rule_id;

  if (!ruleId) {
    return json({ error: "Rule ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { parameters } = body;

    logger.info(`Executing ABAC rule: ${ruleId}`);
    logger.info(`Parameters:`, JSON.stringify(parameters, null, 2));

    // Transform nested dot notation to flat structure
    // Only _id fields are supported by the execute endpoint
    // e.g., "AuthenticatedUser.user_id" -> "authenticated_user_id"
    //       "OnBehalfOfUser.user_id" -> "on_behalf_of_user_id"
    //       "Account.account_id" -> "account_id"
    const flatParameters: Record<string, any> = {};

    Object.keys(parameters).forEach((key) => {
      const parts = key.split(".");
      if (parts.length === 2) {
        const [context, property] = parts;

        // Map context to snake_case parameter name
        const contextMap: Record<string, string> = {
          AuthenticatedUser: "authenticated_user_id",
          OnBehalfOfUser: "on_behalf_of_user_id",
          Context: "context_id",
          User: "user_id",
          Bank: "bank_id",
          Account: "account_id",
          View: "view_id",
          Transaction: "transaction_id",
          Customer: "customer_id",
        };

        const paramName = contextMap[context] || property;
        flatParameters[paramName] = parameters[key];
      } else {
        // If not in expected format, just use as-is
        flatParameters[key] = parameters[key];
      }
    });

    logger.info(
      `Transformed parameters:`,
      JSON.stringify(flatParameters, null, 2),
    );

    // Call the OBP API to execute the rule
    const endpoint = `/obp/v6.0.0/management/abac-rules/${ruleId}/execute`;
    logger.info(`POST ${endpoint}`);

    logger.info(
      "Request body being sent to OBP:",
      JSON.stringify(flatParameters, null, 2),
    );

    const response = await obp_requests.post(
      endpoint,
      flatParameters,
      accessToken,
    );

    logger.info("ABAC rule executed successfully");
    logger.info("OBP API response:", JSON.stringify(response, null, 2));

    return json(response);
  } catch (err) {
    logger.error(`Error executing ABAC rule ${ruleId}:`, err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
