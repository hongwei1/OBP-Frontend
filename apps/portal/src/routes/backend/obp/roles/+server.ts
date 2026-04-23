import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { obpErrorResponse } from "@obp/shared/obp";
import { createLogger } from "@obp/shared/utils";

const logger = createLogger("RolesAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ message: "Unauthorized", code: 401 }, { status: 401 });
  }

  try {
    const accessToken = session.data.oauth?.access_token;
    const response = await obp_requests.get("/obp/v2.1.0/roles", accessToken);
    return json(response);
  } catch (err: unknown) {
    logger.error("Error fetching roles:", err);
    const { body, status } = obpErrorResponse(err);
    return json(body, { status });
  }
};
