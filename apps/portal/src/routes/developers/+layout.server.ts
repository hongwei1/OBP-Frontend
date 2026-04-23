import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export function load() {
	const rawHost = publicEnv.PUBLIC_OBP_BASE_URL || '';
	// Strip protocol for display in code examples
	const apiHost = rawHost.replace(/^https?:\/\//, '');
	// Strip query params and trailing slash to get a clean base for constructing links
	const rawExplorerUrl = env.API_EXPLORER_URL || '';
	const apiExplorerUrl = rawExplorerUrl.split('?')[0].replace(/\/$/, '');
	return {
		apiHost,
		apiBaseUrl: rawHost,
		apiExplorerUrl
	};
}
