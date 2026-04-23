import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { createLogger } from "@obp/shared/utils";
import { obpErrorResponse } from "@obp/shared/obp";

const logger = createLogger("BanksAPI");

export const GET: RequestHandler = async ({ locals }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    return json({ message: "Unauthorized", code: 401 }, { status: 401 });
  }

  try {
    const endpoint = `/obp/v6.0.0/banks`;
    const accessToken = session.data.oauth?.access_token;
    const response = await obp_requests.get(endpoint, accessToken);

    const banks = (response.banks || []).filter(
      (b: any) => b.bank_id != null,
    );

    return json({
      banks,
      count: banks.length,
    });
  } catch (err: unknown) {
    logger.error("Error fetching banks:", err);

    const { body, status } = obpErrorResponse(err);
    return json(body, { status });
  }
};
