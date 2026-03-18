import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { obp_requests } from "$lib/obp/requests";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { createLogger } from "$lib/utils/logger";

const logger = createLogger("WebUIPropsEditServer");

export const load: PageServerLoad = async ({ locals, params }) => {
  const session = locals.session;
  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const token = sessionOAuth?.accessToken;

  if (!token) {
    error(401, {
      message: "Unauthorized: No access token found in session.",
    });
  }

  const propName = params.id;

  if (!propName) {
    error(400, {
      message: "WebUI Prop name is required",
    });
  }

  // Fetch the specific prop to edit
  let prop = null;

  try {
    // First, get all props to find the one we want
    const propsResponse = await obp_requests.get(
      `/obp/v6.0.0/webui-props?what=active`,
      token,
    );

    if (propsResponse?.webui_props) {
      prop = propsResponse.webui_props.find((p: any) => p.name === propName);
    }

    if (!prop) {
      logger.warn(`WebUI prop not found: ${propName}`);
      error(404, {
        message: "WebUI prop not found",
      });
    }

    logger.debug(`Retrieved webui prop: ${prop.name}`);
  } catch (e) {
    logger.error("Error fetching webui prop:", e);
    error(500, {
      message:
        "Could not fetch webui prop at this time. Please try again later.",
    });
  }

  return {
    prop,
  };
};
