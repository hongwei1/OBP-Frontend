import { createOpeyAuthHandler } from '@obp/shared/server/opey';
import { env } from '$env/dynamic/private';
import { obpIntegrationService } from '$lib/server/opey/OBPIntegrationService';

export const { POST } = createOpeyAuthHandler({
	opeyBaseUrl: env.OPEY_BASE_URL!,
	opeyConsumerId: env.OPEY_CONSUMER_ID,
	getAccessToken: (event) => event.locals.session?.data?.oauth?.access_token,
	getSession: (event) => event.locals.session,
	getOrCreateOpeyConsent: (session) => obpIntegrationService.getOrCreateOpeyConsent(session)
});
