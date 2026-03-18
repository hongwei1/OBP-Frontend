import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("MembershipsAPI");

interface Group {
  group_id: string;
  bank_id: string;
  group_name: string;
  group_description: string;
  is_enabled: boolean;
  list_of_roles?: string[];
}

interface GroupsResponse {
  groups: Group[];
}

interface Entitlement {
  entitlement_id: string;
  role_name: string;
  bank_id: string;
  user_id?: string;
  username?: string;
}

interface GroupWithEntitlements extends Group {
  entitlements: Entitlement[];
}

// POST - Create a new group membership
export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for membership creation");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { user_id, group_id } = body;

    if (!user_id) {
      return json({ error: "user_id is required" }, { status: 400 });
    }

    if (!group_id) {
      return json({ error: "group_id is required" }, { status: 400 });
    }

    logger.info("=== CREATE GROUP MEMBERSHIP ===");
    logger.info(`User ID: ${user_id}`);
    logger.info(`Group ID: ${group_id}`);

    const requestBody = {
      group_id,
    };

    const endpoint = `/obp/v6.0.0/users/${user_id}/group-entitlements`;
    logger.info(`POST ${endpoint}`);
    logger.info(`Request body: ${JSON.stringify(requestBody)}`);

    const response = await obp_requests.post(
      endpoint,
      requestBody,
      accessToken,
    );

    logger.info("Group membership created successfully");
    logger.info(`Response: ${JSON.stringify(response)}`);

    // Log entitlements created and skipped
    if (
      response.entitlements_created &&
      response.entitlements_created.length > 0
    ) {
      logger.info(
        `Entitlements created: ${response.entitlements_created.join(", ")}`,
      );
    }

    if (
      response.entitlements_skipped &&
      response.entitlements_skipped.length > 0
    ) {
      logger.info(
        `Entitlements skipped: ${response.entitlements_skipped.join(", ")}`,
      );
    }

    return json(response);
  } catch (err) {
    logger.error("Error creating group membership:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};

// GET - Fetch all memberships (aggregated from all users with group memberships)
export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the OAuth session data
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for memberships list");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    logger.info("=== FETCHING GROUPS AND THEIR ENTITLEMENTS ===");

    // Step 1: Get all groups
    const groupsEndpoint = `/obp/v6.0.0/management/groups`;
    logger.info(`Fetching groups: ${groupsEndpoint}`);
    const groupsResponse: GroupsResponse = await obp_requests.get(
      groupsEndpoint,
      accessToken,
    );

    const groups = groupsResponse.groups || [];
    logger.info(`Found ${groups.length} groups`);

    // Step 2: For each group, fetch its entitlements
    const groupsWithEntitlements: GroupWithEntitlements[] = [];

    for (const group of groups) {
      try {
        const entitlementsEndpoint = `/obp/v6.0.0/management/groups/${group.group_id}/entitlements`;
        logger.info(
          `Fetching entitlements for group ${group.group_id}: ${entitlementsEndpoint}`,
        );

        const entitlementsResponse = await obp_requests.get(
          entitlementsEndpoint,
          accessToken,
        );

        const entitlements = entitlementsResponse.entitlements || [];
        logger.info(
          `Group ${group.group_id} has ${entitlements.length} entitlements`,
        );

        groupsWithEntitlements.push({
          ...group,
          entitlements: entitlements,
        });
      } catch (err) {
        logger.error(
          `Error fetching entitlements for group ${group.group_id}:`,
          err,
        );
        // Still add the group but with empty entitlements
        groupsWithEntitlements.push({
          ...group,
          entitlements: [],
        });
      }
    }

    logger.info(
      `Successfully fetched ${groupsWithEntitlements.length} groups with their entitlements`,
    );

    return json({ groupsWithEntitlements });
  } catch (err) {
    logger.error("Error fetching groups and entitlements:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
