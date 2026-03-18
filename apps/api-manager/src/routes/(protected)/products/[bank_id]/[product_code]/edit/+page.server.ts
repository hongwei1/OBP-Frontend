import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { createLogger } from "$lib/utils/logger";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";

const logger = createLogger("EditProductPageServer");

interface ApiCollection {
  api_collection_id: string;
  user_id: string;
  api_collection_name: string;
  is_sharable: boolean;
  description: string;
}

interface ApiCollectionsResponse {
  api_collections: ApiCollection[];
}

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available for edit product page");
    return {
      product: null,
      collections: [],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  const bankId = params.bank_id;
  const productCode = params.product_code;

  try {
    logger.info(`=== FETCHING PRODUCT AND COLLECTIONS FOR EDIT ===`);

    // Fetch product and collections in parallel
    const [product, collectionsResponse] = await Promise.all([
      obp_requests.get(
        `/obp/v6.0.0/banks/${bankId}/api-products/${productCode}`,
        accessToken,
      ),
      obp_requests.get(
        `/obp/v6.0.0/my/api-collections`,
        accessToken,
      ) as Promise<ApiCollectionsResponse>,
    ]);

    logger.info(`Product fetched, ${collectionsResponse.api_collections?.length || 0} collections`);

    return {
      product,
      collections: collectionsResponse.api_collections || [],
      hasApiAccess: true,
    };
  } catch (err) {
    logger.error("Error loading product/collections for edit:", err);

    return {
      product: null,
      collections: [],
      hasApiAccess: false,
      error:
        err instanceof Error ? err.message : "Failed to load product data",
    };
  }
};
