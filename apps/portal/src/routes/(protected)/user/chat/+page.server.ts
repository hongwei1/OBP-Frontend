import { createLogger } from '@obp/shared/utils';
const logger = createLogger('ChatRoomsServer');
import type { RequestEvent, Actions } from '@sveltejs/kit';
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

	try {
		const response = await obp_requests.get('/obp/v6.0.0/chat-rooms', token);
		const chatRooms = response.chat_rooms || [];

		// The chat-rooms endpoint returns unread_count on each room directly
		const unreadCounts: Record<string, number> = {};
		for (const room of chatRooms) {
			unreadCounts[room.chat_room_id] = room.unread_count || 0;
		}

		return {
			chatRooms,
			unreadCounts
		};
	} catch (e) {
		logger.error('Error fetching chat rooms:', e);
		error(500, {
			message: 'Could not fetch chat rooms at this time. Please try again later.'
		});
	}
}

export const actions = {
	create: async ({ request, locals }) => {
		const token = locals.session.data.oauth?.access_token;
		if (!token) {
			return { message: 'No access token found in session.' };
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString()?.trim();
		const description = formData.get('description')?.toString()?.trim() || '';

		if (!name) {
			return { message: 'Chat room name is required.' };
		}

		try {
			const room = await obp_requests.post('/obp/v6.0.0/chat-rooms', { name, description }, token);
			return {
				success: true,
				message: 'Chat room created successfully.',
				createdRoom: room
			};
		} catch (err) {
			logger.error('Error creating chat room:', err);
			let errorMessage = 'Failed to create chat room.';
			if (err instanceof OBPRequestError) {
				errorMessage = err.message;
			}
			return { message: errorMessage };
		}
	}
} satisfies Actions;
