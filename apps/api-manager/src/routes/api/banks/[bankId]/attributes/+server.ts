import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { extractErrorDetails } from "$lib/obp/errors";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("BankAttributesAPI");

export const POST: RequestHandler = async ({ request, params, locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    return json({ error: "No API access token available" }, { status: 401 });
  }

  const { bankId } = params;

  try {
    const body = await request.json();
    logger.info(`Creating attribute for bank ${bankId}`);
    const endpoint = `/obp/v6.0.0/banks/${bankId}/attribute`;

    const response = await obp_requests.post(endpoint, body, accessToken);

    logger.info(`Attribute created for bank ${bankId}: ${response?.name}`);

    return json(response, { status: 201 });
  } catch (err) {
    logger.error("Error creating bank attribute:", err);

    const { message, obpErrorCode } = extractErrorDetails(err);

    return json(
      {
        error: message,
        obpErrorCode,
      },
      { status: 400 }
    );
  }
};
