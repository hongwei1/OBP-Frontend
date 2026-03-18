import { createOpeyAuthHandler } from '@obp/shared/server/opey';
import { env } from '$env/dynamic/private';

export const { POST } = createOpeyAuthHandler({
	opeyBaseUrl: env.OPEY_BASE_URL ?? '',
	getAccessToken: (event) => event.locals.session?.data?.oauth?.access_token
});
