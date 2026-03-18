import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("GroupsAPI");

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for group creation");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      bank_id,
      group_name,
      group_description,
      list_of_roles,
      is_enabled,
    } = body;

    if (!group_name) {
      return json({ error: "group_name is required" }, { status: 400 });
    }

    if (!group_description) {
      return json({ error: "group_description is required" }, { status: 400 });
    }

    if (
      !list_of_roles ||
      !Array.isArray(list_of_roles) ||
      list_of_roles.length === 0
    ) {
      return json(
        {
          error: "list_of_roles is required and must contain at least one role",
        },
        { status: 400 },
      );
    }

    logger.info("=== CREATE GROUP ===");
    logger.info(`Bank ID: ${bank_id}`);
    logger.info(`Group Name: ${group_name}`);
    logger.info(`Description: ${group_description}`);
    logger.info(`Roles: ${list_of_roles.join(", ")}`);
    logger.info(`Enabled: ${is_enabled}`);

    const requestBody: any = {
      group_name,
      group_description,
      list_of_roles,
      is_enabled: is_enabled ?? true,
    };

    // Only include bank_id if it's provided
    if (bank_id && bank_id.trim() !== "") {
      requestBody.bank_id = bank_id;
    }

    const endpoint = `/obp/v6.0.0/management/groups`;
    logger.info(`POST ${endpoint}`);
    logger.info(`Request body: ${JSON.stringify(requestBody)}`);

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("Group created successfully");
    logger.info(`Response: ${JSON.stringify(response)}`);

    return json(response);
  } catch (err) {
    logger.error("Error creating group:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
