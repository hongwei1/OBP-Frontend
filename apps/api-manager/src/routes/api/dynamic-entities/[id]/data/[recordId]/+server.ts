import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("DynamicEntityRecordAPI");

// Helper function to get entity name from entity ID
async function getEntityName(
  entityId: string,
  accessToken: string,
): Promise<string | null> {
  try {
    const entitiesResponse = await obp_requests.get(
      "/obp/v6.0.0/management/system-dynamic-entities",
      accessToken,
    );
    const entities = entitiesResponse.dynamic_entities || [];
    const entity = entities.find((e: any) => e.dynamic_entity_id === entityId);

    if (!entity) return null;

    // In v6.0.0, the entity name is in the entity_name field
    return entity.entity_name || null;
  } catch (err) {
    logger.error("Error fetching entity name:", err);
    return null;
  }
}

// GET - Fetch a specific record
export const GET: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id, recordId } = params;

    if (!id) {
      return json({ error: "Entity ID is required" }, { status: 400 });
    }

    if (!recordId) {
      return json({ error: "Record ID is required" }, { status: 400 });
    }

    // Get entity name from ID
    const entityName = await getEntityName(id, accessToken);
    if (!entityName) {
      return json({ error: "Entity not found" }, { status: 404 });
    }

    logger.info(`Fetching record ${recordId} for entity: ${entityName}`);

    const endpoint = `/obp/dynamic-entity/${entityName}/${recordId}`;
    const response = await obp_requests.get(endpoint, accessToken);

    logger.info("Record retrieved successfully");
    return json(response);
  } catch (err) {
    logger.error("Error fetching record:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};

// PUT - Update a specific record
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id, recordId } = params;

    if (!id) {
      return json({ error: "Entity ID is required" }, { status: 400 });
    }

    if (!recordId) {
      return json({ error: "Record ID is required" }, { status: 400 });
    }

    const body = await request.json();

    if (!body || typeof body !== "object") {
      return json(
        { error: "Request body must be a valid object" },
        { status: 400 },
      );
    }

    // Get entity name from ID
    const entityName = await getEntityName(id, accessToken);
    if (!entityName) {
      return json({ error: "Entity not found" }, { status: 404 });
    }

    logger.info(`Updating record ${recordId} for entity: ${entityName}`);
    logger.info(`Data: ${JSON.stringify(body)}`);

    const endpoint = `/obp/dynamic-entity/${entityName}/${recordId}`;
    const response = await obp_requests.put(endpoint, body, accessToken);

    logger.info("Record updated successfully");
    return json(response);
  } catch (err) {
    logger.error("Error updating record:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};

// DELETE - Delete a specific record
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const { id, recordId } = params;

    if (!id) {
      return json({ error: "Entity ID is required" }, { status: 400 });
    }

    if (!recordId) {
      return json({ error: "Record ID is required" }, { status: 400 });
    }

    // Get entity name from ID
    const entityName = await getEntityName(id, accessToken);
    if (!entityName) {
      return json({ error: "Entity not found" }, { status: 404 });
    }

    logger.info(`Deleting record ${recordId} for entity: ${entityName}`);

    const endpoint = `/obp/dynamic-entity/${entityName}/${recordId}`;
    const response = await obp_requests.delete(endpoint, accessToken);

    logger.info("Record deleted successfully");
    return json(response);
  } catch (err) {
    logger.error("Error deleting record:", err);

    // Extract full error details - NEVER hide or simplify OBP error messages!
    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 500 });
  }
};
