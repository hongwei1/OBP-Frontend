import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("ApiCollectionByNameAPI");

export const GET: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collection_name } = params;

  if (!collection_name) {
    return json({ error: "collection_name is required" }, { status: 400 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for collection lookup");
    return json({ error: "No API access token available" }, { status: 401 });
  }

  try {
    const endpoint = `/obp/v6.0.0/my/api-collections/name/${encodeURIComponent(collection_name)}`;
    logger.info(`GET ${endpoint}`);

    const response = await obp_requests.get(endpoint, accessToken);

    return json(response);
  } catch (err) {
    logger.error("Error fetching API collection by name:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    const errorResponse: any = { error: message };
    if (obpErrorCode) {
      errorResponse.obpErrorCode = obpErrorCode;
    }

    return json(errorResponse, { status: 404 });
  }
};
