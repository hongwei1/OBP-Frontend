import { createLogger } from '@obp/shared/utils';
import { obp_requests } from "$lib/obp/requests";
import { error, fail } from "@sveltejs/kit";
import type { OBPChatRoom } from "$lib/obp/types";
import type { RequestEvent } from "@sveltejs/kit";
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import { extractErrorDetails } from "$lib/obp/errors";

const logger = createLogger("SystemChatRoomsServer");

export async function load(event: RequestEvent) {
  const session = event.locals.session;

  if (!session?.data?.user) {
    throw error(401, "Unauthorized");
  }

  const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
  const accessToken = sessionOAuth?.accessToken;

  if (!accessToken) {
    logger.warn("No access token available");
    return {
      chatRooms: [],
      hasApiAccess: false,
      error: "No API access token available",
    };
  }

  let chatRooms: OBPChatRoom[] = [];
  let errorMessage: string | null = null;

  try {
    const endpoint = `/obp/v6.0.0/chat-rooms`;
    const response = await obp_requests.get(endpoint, accessToken);
    chatRooms = response?.chat_rooms || [];
    logger.info(`Fetched ${chatRooms.length} system chat rooms`);
  } catch (e: any) {
    logger.error("Error fetching system chat rooms:", e);
    errorMessage = e?.message || "Could not fetch chat rooms.";
  }

  chatRooms.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  return {
    chatRooms,
    hasApiAccess: true,
    error: errorMessage,
  };
}

export const actions = {
  create: async (event: RequestEvent) => {
    const session = event.locals.session;
    if (!session?.data?.user) throw error(401, "Unauthorized");

    const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
    const accessToken = sessionOAuth?.accessToken;
    if (!accessToken) return fail(401, { error: "No access token" });

    const formData = await event.request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) return fail(400, { error: "Name is required" });

    try {
      const result = await obp_requests.post(
        `/obp/v6.0.0/chat-rooms`,
        { name, description: description || "" },
        accessToken,
      );
      return { success: true, action: "create", chatRoom: result };
    } catch (e: any) {
      const { message } = extractErrorDetails(e);
      return fail(500, { error: message });
    }
  },

  delete: async (event: RequestEvent) => {
    const session = event.locals.session;
    if (!session?.data?.user) throw error(401, "Unauthorized");

    const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session);
    const accessToken = sessionOAuth?.accessToken;
    if (!accessToken) return fail(401, { error: "No access token" });

    const formData = await event.request.formData();
    const chatRoomId = formData.get("chat_room_id") as string;

    if (!chatRoomId) return fail(400, { error: "Chat room ID is required" });

    try {
      await obp_requests.delete(
        `/obp/v6.0.0/chat-rooms/${chatRoomId}`,
        accessToken,
      );
      return { success: true, action: "delete" };
    } catch (e: any) {
      const { message } = extractErrorDetails(e);
      return fail(500, { error: message });
    }
  },
};
