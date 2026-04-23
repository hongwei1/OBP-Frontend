import { createLogger } from '@obp/shared/utils';
const logger = createLogger('LayoutServer');
import type { RequestEvent } from "@sveltejs/kit";
import { obp_requests } from '$lib/obp/requests';
// import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
// import { storePopup } from '@skeletonlabs/skeleton';
// storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });

import { env } from "$env/dynamic/private";
import { env as publicEnv } from '$env/dynamic/public';

export interface RootLayoutData {
    userId?: string;
    email?: string;
    username?: string;
    externalLinks: Record<string, string>;
    showEarlyAccess?: boolean;
    totalUnreadCount?: number;
}

export async function load(event: RequestEvent) {
	const { session } = event.locals;

	let data: Partial<RootLayoutData> = {};

	let externalLinks = {
		API_EXPLORER_URL: env.API_EXPLORER_URL,
		API_MANAGER_URL: env.API_MANAGER_URL,
		SANDBOX_POPULATOR_URL: env.SANDBOX_POPULATOR_URL,
		SUBSCRIPTIONS_URL: publicEnv.PUBLIC_SUBSCRIPTIONS_URL,
		LEGACY_PORTAL_URL: publicEnv.PUBLIC_LEGACY_PORTAL_URL
	};

	// Filter out undefined/null values and warn about missing ones
	const validExternalLinks: Record<string, string> = {};
	Object.entries(externalLinks).forEach(([name, url]) => {
		if (!url) {
			logger.warn(`Environment variable ${name} is not set, it will not show up in the menu.`);
		} else {
			validExternalLinks[name] = url;
		}
	});

	// Only treat the user as logged in if they have both user data and a valid access token
    if (session?.data?.user && session?.data?.oauth?.access_token) {
        data.userId = session.data.user.user_id;
        data.email = session.data.user.email;
        data.username = session.data.user.username;
    }

	// Check if user has EARLY_ACCESS personal data field set to YES
	let showEarlyAccess = false;
	let totalUnreadCount = 0;
	const accessToken = session?.data?.oauth?.access_token;
	if (accessToken) {
		try {
			const [personalDataResponse, chatRoomsResponse] = await Promise.all([
				obp_requests.get('/obp/v6.0.0/my/personal-data-fields', accessToken).catch((err) => {
					logger.warn('Failed to fetch personal data fields:', err);
					return { user_attributes: [] };
				}),
				obp_requests.get('/obp/v6.0.0/chat-rooms', accessToken).catch((err) => {
					logger.warn('Failed to fetch chat rooms for unread count:', err);
					return { chat_rooms: [] };
				})
			]);
			const fields = personalDataResponse.user_attributes || [];
			showEarlyAccess = fields.some(
				(f: { name: string; value: string }) => f.name === 'EARLY_ACCESS' && f.value === 'YES'
			);
			// The chat-rooms endpoint returns unread_count on each room directly
			const chatRooms = chatRoomsResponse.chat_rooms || [];
			totalUnreadCount = chatRooms.reduce(
				(sum: number, room: { unread_count?: number }) => sum + (room.unread_count || 0),
				0
			);
		} catch (error) {
			logger.warn('Could not fetch layout data:', error);
		}
	}

	return {
		...data,
		externalLinks: validExternalLinks,
		showEarlyAccess,
		totalUnreadCount
	} as RootLayoutData
}
