/**
 * A direct message is just a non-open chat room with exactly two participants.
 * The OBP-API exposes both fields on every chat-room JSON payload, so this
 * predicate works on any room object that came from a chat-rooms endpoint.
 */
export interface ChatRoomDmFields {
	is_open_room: boolean;
	participant_count: number;
}

/** True iff the room is a 1-on-1 direct message. */
export function isDirectMessage(room: ChatRoomDmFields): boolean {
	return !room.is_open_room && room.participant_count === 2;
}
