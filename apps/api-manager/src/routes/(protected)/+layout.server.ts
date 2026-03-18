import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = locals.session;
  const userEntitlements =
    (session?.data?.user as any)?.entitlements?.list || [];
  const userId = (session?.data?.user as any)?.user_id || "";
  return { userEntitlements, userId };
};
