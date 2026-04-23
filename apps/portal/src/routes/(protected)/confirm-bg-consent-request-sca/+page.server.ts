import { createLogger } from '@obp/shared/utils';
const logger = createLogger('ConfirmBGConsentRequestSCA');
import type { RequestEvent, Actions } from '@sveltejs/kit';
import { redirect, isRedirect } from '@sveltejs/kit';
import { obp_requests } from '$lib/obp/requests';
import { OBPRequestError } from '@obp/shared/obp';
import { env } from '$env/dynamic/private';

export async function load(event: RequestEvent) {
	const consentId = event.url.searchParams.get('CONSENT_ID');


	if (!consentId) {
		return {
			loadError: 'Missing required parameter: CONSENT_ID.',
			consentId: '',
			};
	}

	return { consentId };
}

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const otp = formData.get('otp') as string;
		const consentId = formData.get('consentId') as string;

		if (!otp) {
			return { message: 'Please enter the OTP code.' };
		}

		const token = locals.session.data.oauth?.access_token;
		if (!token) {
			return { message: 'No access token found in session.' };
		}

		const defaultBankId = env.DEFAULT_BANK_ID;
		if (!defaultBankId) {
			logger.error('DEFAULT_BANK_ID environment variable is not set');
			return { message: 'Server configuration error: DEFAULT_BANK_ID is not set.' };
		}

		try {
			const response = await obp_requests.post(
				`/obp/v3.1.0/banks/${defaultBankId}/consents/${consentId}/challenge`,
				{ answer: otp },
				token
			);

			if (response.status === 'ACCEPTED' || response.status === 'VALID') {
				redirect(303, `/confirm-bg-consent-request-redirect-uri?CONSENT_ID=${consentId}`);
			}

			return {
				message: `Challenge was not accepted. Status: ${response.status}`
			};
		} catch (e) {
			if (isRedirect(e)) throw e;
			logger.error('Error submitting BG consent SCA:', e);
			let errorMessage = 'Failed to verify OTP.';
			if (e instanceof OBPRequestError) {
				errorMessage = e.message;
			}
			return { message: errorMessage };
		}
	}
} satisfies Actions;
