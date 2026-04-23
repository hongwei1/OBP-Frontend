/**
 * A chat message can be authored by a user, a consumer (app), or both.
 * Prefer the human username when present; otherwise show the consumer name.
 */
export interface ChatMessageSenderFields {
	sender_username: string;
	sender_consumer_name: string;
}

/** Display name of the message author — username if present, otherwise consumer name. */
export function messageSenderName(message: ChatMessageSenderFields): string {
	return message.sender_username ? message.sender_username : message.sender_consumer_name;
}
