import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("SystemDynamicEntityCRUDPageServer");

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    throw error(401, "No API access token available");
  }

  const { id } = params;

  if (!id) {
    throw error(400, "Entity ID is required");
  }

  try {
    // Fetch all system dynamic entities to get the entity definition
    const entitiesResponse = await obp_requests.get(
      "/obp/v6.0.0/management/system-dynamic-entities",
      accessToken,
    );
    const entities = entitiesResponse.dynamic_entities || [];

    // Find the specific entity by dynamic_entity_id
    const entity = entities.find((e: any) => e.dynamic_entity_id === id);

    if (!entity) {
      throw error(404, "System dynamic entity not found");
    }

    // Fetch data records for this entity
    // In v6.0.0, the entity name is in the entity_name field
    const entityName = entity.entity_name || null;
    let dataRecords = [];

    if (entityName) {
      try {
        const dataResponse = await obp_requests.get(
          `/obp/dynamic-entity/${entityName}`,
          accessToken,
        );
        // The response might be an array or an object with a data/records property
        if (Array.isArray(dataResponse)) {
          dataRecords = dataResponse;
        } else {
          // Try common patterns: data, records, entityName, or snake_case version (e.g., piano_list)
          const snakeCaseKey = `${entityName.toLowerCase()}_list`;
          dataRecords =
            dataResponse.data ||
            dataResponse.records ||
            dataResponse[entityName] ||
            dataResponse[snakeCaseKey] ||
            [];
        }
      } catch (dataErr) {
        logger.warn("Could not fetch data records:", dataErr);
        // Not throwing error here, just returning empty records
      }
    }

    // Get user entitlements from session for role checking
    const userEntitlements =
      (session.data.user as any)?.entitlements?.list || [];

    return {
      entity,
      dataRecords,
      userEntitlements,
    };
  } catch (err) {
    logger.error("Error fetching system dynamic entity:", err);

    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }

    throw error(
      500,
      err instanceof Error
        ? err.message
        : "Failed to fetch system dynamic entity",
    );
  }
};
