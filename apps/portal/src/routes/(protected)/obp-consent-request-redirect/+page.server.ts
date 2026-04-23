import { createLogger } from '@obp/shared/utils';
const logger = createLogger('OBPConsentRequestRedirect');
import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export async function load(event: RequestEvent) {
	const consentId = event.url.searchParams.get('CONSENT_ID');
	const bankId = event.url.searchParams.get('bank_id');

	if (!consentId) {
		return {
			loadError: 'Missing required parameter: CONSENT_ID.',
			consentId: '',
			oidcReturnUrl: '',
		};
	}

	// Retrieve the OIDC return URL from session
	const flowData = event.locals.session.data.obpConsentFlow;
	const oidcReturnUrl = flowData?.oidcReturnUrl || '';

	if (oidcReturnUrl) {
		// Build the redirect URL back to OBP-OIDC
		const returnUrl = new URL(oidcReturnUrl);
		returnUrl.searchParams.set('consent_id', consentId);
		returnUrl.searchParams.set('consent_status', 'ACCEPTED');
		if (bankId) {
			returnUrl.searchParams.set('bank_id', bankId);
		}

		// Pass the authenticated user's ID so OBP-OIDC can generate the auth code for this user
		const userId = event.locals.session.data.user?.user_id;
		if (userId) {
			returnUrl.searchParams.set('user_id', userId);
		}

		// Clean up the consent flow data from session
		const sessionData = { ...event.locals.session.data };
		delete sessionData.obpConsentFlow;
		await event.locals.session.setData(sessionData);
		await event.locals.session.save();

		return {
			consentId,
			oidcReturnUrl: returnUrl.toString(),
		};
	}

	logger.warn('No OIDC return URL found in session for consent redirect');
	return {
		consentId,
		oidcReturnUrl: '',
	};
}
