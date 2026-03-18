import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("AbacRuleValidateAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for ABAC rule validation");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rule_code } = body;

    if (!rule_code || typeof rule_code !== "string") {
      return json(
        {
          valid: false,
          error: "rule_code is required and must be a string",
        },
        { status: 400 },
      );
    }

    logger.info(`Validating ABAC rule code`);
    logger.debug(`Rule code: ${rule_code}`);

    // Call the OBP API to validate the rule
    const endpoint = `/obp/v6.0.0/management/abac-rules/validate`;

    const requestBody = {
      rule_code: rule_code,
    };

    logger.debug(
      "Request body being sent to OBP:",
      JSON.stringify(requestBody, null, 2),
    );

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("ABAC rule validation completed");
    logger.debug("OBP API response:", JSON.stringify(response, null, 2));

    // OBP API response format should include validation result
    // Only return the OBP error message verbatim
    return json({
      valid: response.valid ?? true,
      message: response.message || null,
    });
  } catch (err) {
    logger.error("Error validating ABAC rule:", err);

    return json({
      valid: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
