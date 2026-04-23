import { createLogger } from '@obp/shared/utils';
const logger = createLogger('ChatRoomServer');
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { obp_requests } from '$lib/obp/requests';
import { OBPRequestError } from '@obp/shared/obp';

export async function load(event: RequestEvent) {
	const token = event.locals.session.data.oauth?.access_token;
	if (!token) {
		error(401, {
			message: 'Unauthorized: No access token found in session.'
		});
	}

	const chatRoomId = event.params.chatRoomId;

	try {
		// Chat room is essential — fail if it can't be fetched
		const chatRoom = await obp_requests.get(`/obp/v6.0.0/chat-rooms/${chatRoomId}`, token);

		// Messages and participants are fetched in parallel but non-fatal
		const [messagesResponse, participantsResponse] = await Promise.all([
			obp_requests.get(`/obp/v6.0.0/chat-rooms/${chatRoomId}/messages`, token).catch((e) => {
				logger.error('Error fetching messages:', e);
				return { messages: [] };
			}),
			obp_requests.get(`/obp/v6.0.0/chat-rooms/${chatRoomId}/participants`, token).catch((e) => {
				logger.error('Error fetching participants:', e);
				return { participants: [] };
			})
		]);

		return {
			chatRoom,
			messages: messagesResponse.messages || [],
			participants: participantsResponse.participants || [],
			currentUserId: event.locals.session.data.user?.user_id || ''
		};
	} catch (e) {
		logger.error('Error fetching chat room:', e);

		if (e instanceof OBPRequestError) {
			const code = parseInt(e.code);
			error(code >= 400 && code < 500 ? code : 500, {
				message: e.message
			});
		}

		// Diagnostic: is the OBP-API reachable at all?
		const originalError = e instanceof Error ? e.message : String(e);
		let diagnostic = '';
		try {
			await obp_requests.get('/obp/v6.0.0/root', undefined);
			// API is reachable — retry the original request once
			logger.info('OBP-API /root is reachable, retrying chat room fetch...');
			try {
				const chatRoom = await obp_requests.get(`/obp/v6.0.0/chat-rooms/${chatRoomId}`, token);
				const [messagesResponse, participantsResponse] = await Promise.all([
					obp_requests.get(`/obp/v6.0.0/chat-rooms/${chatRoomId}/messages`, token).catch(() => ({ messages: [] })),
					obp_requests.get(`/obp/v6.0.0/chat-rooms/${chatRoomId}/participants`, token).catch(() => ({ participants: [] }))
				]);
				return {
					chatRoom,
					messages: messagesResponse.messages || [],
					participants: participantsResponse.participants || [],
					currentUserId: event.locals.session.data.user?.user_id || ''
				};
			} catch (retryError) {
				diagnostic = `OBP-API is reachable (/root OK) but chat room endpoint failed on retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`;
			}
		} catch {
			diagnostic = 'OBP-API is not reachable (/root failed). The API may be down or restarting.';
		}

		logger.error(diagnostic);
		error(500, { message: `${originalError}. ${diagnostic}` });
	}
}
