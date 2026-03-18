import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("EditAbacRuleServer");

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = locals.session;
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const token = sessionOAuth?.accessToken;

  if (!token) {
    error(401, {
      message: "Unauthorized: No access token found in session.",
    });
  }

  const ruleId = params.rule_id;

  if (!ruleId) {
    error(400, {
      message: "Rule ID is required",
    });
  }

  // Fetch the specific ABAC rule
  let rule = null;
  let fetchError = null;

  try {
    logger.info(`Fetching ABAC rule with ID: ${ruleId}`);
    const endpoint = `/obp/v6.0.0/management/abac-rules/${ruleId}`;
    rule = await obp_requests.get(endpoint, token);
    logger.debug("ABAC rule data:", JSON.stringify(rule, null, 2));
  } catch (e) {
    logger.error(`Error fetching ABAC rule ${ruleId}:`, e);
    fetchError = e instanceof Error ? e.message : "Failed to fetch ABAC rule";
  }

  if (!rule) {
    error(404, {
      message: fetchError || "ABAC rule not found",
    });
  }

  return {
    rule,
    ruleId,
  };
};
