import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { obp_requests } from "$lib/obp/requests";
import { obpErrorResponse } from "@obp/shared/obp";
import { createLogger } from "@obp/shared/utils";

const logger = createLogger("StartDmAPI");

/**
 * Find or create a 1-on-1 chat room with the given user.
 *
 * Body: { "user_id": "<target user_id>" }
 *
 * Calls the new OBPv6.0.0 chat-rooms search endpoint with
 * `exact_participants: true` to look for an existing DM. If none exists,
 * creates a new chat room and adds the target user as a participant.
 *
 * Returns: { "chat_room_id": "<id>" }
 */
export const POST: RequestHandler = async ({ locals, request }) => {
  const session = locals.session;
  const accessToken = session?.data?.oauth?.access_token;
  const currentUserId = session?.data?.user?.user_id;

  if (!session?.data?.user || !accessToken || !currentUserId) {
    return json({ message: "Unauthorized", code: 401 }, { status: 401 });
  }

  let body: { user_id?: string };
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid JSON body", code: 400 }, { status: 400 });
  }

  const targetUserId = body.user_id;
  if (!targetUserId) {
    return json({ message: "user_id is required", code: 400 }, { status: 400 });
  }

  if (targetUserId === currentUserId) {
    return json(
      { message: "Cannot start a direct message with yourself", code: 400 },
      { status: 400 },
    );
  }

  try {
    // 1. Look for an existing 1-on-1 room with this user.
    const searchResponse = await obp_requests.post(
      "/obp/v6.0.0/chat-rooms/search",
      { with_user_ids: [targetUserId], exact_participants: true },
      accessToken,
    );
    const existing = searchResponse.chat_rooms || [];
    if (existing.length > 0) {
      logger.info(`Found existing DM with user ${targetUserId}: ${existing[0].chat_room_id}`);
      return json({ chat_room_id: existing[0].chat_room_id });
    }

    // 2. None exists — create a new room and add the target user.
    const newRoom = await obp_requests.post(
      "/obp/v6.0.0/chat-rooms",
      {
        name: `dm-${currentUserId}-${targetUserId}-${Date.now()}`,
        description: "",
      },
      accessToken,
    );
    const newRoomId = newRoom.chat_room_id;
    if (!newRoomId) {
      logger.error("Created chat room had no chat_room_id:", newRoom);
      return json(
        { message: "Failed to create chat room", code: 500 },
        { status: 500 },
      );
    }

    await obp_requests.post(
      `/obp/v6.0.0/chat-rooms/${newRoomId}/participants`,
      { user_id: targetUserId },
      accessToken,
    );

    logger.info(`Created new DM ${newRoomId} between ${currentUserId} and ${targetUserId}`);
    return json({ chat_room_id: newRoomId });
  } catch (err: unknown) {
    logger.error("Error starting DM:", err);
    const { body: errBody, status } = obpErrorResponse(err);
    return json(errBody, { status });
  }
};
