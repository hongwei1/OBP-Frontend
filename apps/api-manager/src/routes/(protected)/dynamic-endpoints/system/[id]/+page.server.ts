import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { obp_requests } from "$lib/obp/requests";

const logger = createLogger("SystemDynamicEndpointDetailPageServer");

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
    throw error(400, "Endpoint ID is required");
  }

  try {
    // Fetch the specific dynamic endpoint
    const endpoint = `/obp/v6.0.0/management/dynamic-endpoints/${id}`;
    const dynamicEndpoint = await obp_requests.get(endpoint, accessToken);

    if (!dynamicEndpoint) {
      throw error(404, "System dynamic endpoint not found");
    }

    return {
      endpoint: dynamicEndpoint,
    };
  } catch (err) {
    logger.error("Error fetching system dynamic endpoint:", err);

    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }

    throw error(
      500,
      err instanceof Error
        ? err.message
        : "Failed to fetch system dynamic endpoint",
    );
  }
};
