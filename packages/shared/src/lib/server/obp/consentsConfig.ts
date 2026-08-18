/**
 * Caps consent TTLs at the OBP server's configured maximum.
 *
 * OBP rejects `POST /obp/.../my/consents/IMPLICIT` with OBP-35020 when
 * `time_to_live` exceeds the server prop `consents.max_time_to_live`. To avoid
 * that error we fetch the public config endpoint (which returns
 * `max_time_to_live_in_seconds`) and clamp our requested TTL against it before
 * creating the consent.
 *
 * TWO paths are tried, newest first. OBP-API renamed this endpoint from
 * `/obp/v7.0.0/consents/config` to `/obp/v7.0.0/public/consent-config`, so a
 * single path only works against one side of that rename.
 *
 * The endpoint may also genuinely not exist on older OBP versions — in that case
 * the helper returns `null` and capping is skipped. That tolerance is why the
 * rename went unnoticed: asking the wrong URL and talking to an older server look
 * identical from here, and both silently disable the capping this module exists to
 * do. Trying both paths is what tells them apart, so keep the fallback even when
 * the new path becomes universal.
 *
 * Cached in-process: 1 hour on success, 5 minutes on miss/error (so a deploy
 * that adds the endpoint is picked up reasonably quickly without spamming).
 */

import { createLogger } from '$shared/utils/logger';

const logger = createLogger('ConsentsConfig');

const CACHE_OK_TTL_MS = 60 * 60 * 1000;
const CACHE_MISS_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
	value: number | null;
	expiresAt: number;
}

let cache: CacheEntry | null = null;

/** Shape compatible with each app's `obp_requests.get(path, accessToken?)`. */
export type ObpGet = (path: string, accessToken?: string) => Promise<any>;

/**
 * Newest first. `/public/consent-config` is where OBP-API serves this today;
 * `/consents/config` is the pre-rename path, kept so one Portal build works against
 * servers on either side of the change.
 */
const CONFIG_PATHS = ['/obp/v7.0.0/public/consent-config', '/obp/v7.0.0/consents/config'];

/**
 * Try each known path in turn, returning the first response that carries the field.
 *
 * A path that is simply not routed (OBP answers `OBP-10404`, its routing-miss code)
 * means "wrong URL for this server", so the next candidate is tried. Any other failure
 * — auth, a 5xx, a network error — is not a wrong-URL signal and is rethrown, so a
 * broken server is not quietly reported as "endpoint unavailable".
 */
async function fetchConfig(obpGet: ObpGet): Promise<any | null> {
	let lastNotFound: unknown = null;
	for (const path of CONFIG_PATHS) {
		try {
			const data = await obpGet(path);
			if (data && typeof data === 'object') return data;
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			if (msg.includes('OBP-10404') || msg.includes('404')) {
				lastNotFound = err;
				continue;
			}
			throw err;
		}
	}
	if (lastNotFound) throw lastNotFound;
	return null;
}

/**
 * Return the server's `consents.max_time_to_live` (in seconds), or `null` if
 * the endpoint is unavailable on this OBP version.
 */
export async function getConsentsMaxTtlSeconds(obpGet: ObpGet): Promise<number | null> {
	const now = Date.now();
	if (cache && cache.expiresAt > now) return cache.value;

	try {
		const data = await fetchConfig(obpGet);
		const raw = data?.max_time_to_live_in_seconds;
		const max = typeof raw === 'number' && raw > 0 ? raw : null;
		cache = {
			value: max,
			expiresAt: now + (max !== null ? CACHE_OK_TTL_MS : CACHE_MISS_TTL_MS)
		};
		if (max !== null) {
			logger.debug(`OBP consents max TTL: ${max}s (~${(max / 86400).toFixed(1)} days)`);
		} else {
			logger.debug('OBP /consents/config returned no max_time_to_live_in_seconds — capping disabled.');
		}
		return max;
	} catch (err: unknown) {
		// Most likely cause on current OBP versions: endpoint not deployed yet.
		// Keep this at debug so it isn't noisy in production logs.
		const msg = err instanceof Error ? err.message : String(err);
		cache = { value: null, expiresAt: now + CACHE_MISS_TTL_MS };
		logger.debug(
			`OBP consent-config unavailable on ${CONFIG_PATHS.join(' and ')}, ` +
				`TTL capping disabled: ${msg}`
		);
		return null;
	}
}

/**
 * Clamp a desired consent TTL (seconds) against the OBP server's configured
 * maximum. Returns the effective TTL plus diagnostic info so the caller can
 * log when it had to clamp.
 *
 * Usage:
 *   const { ttl, max, capped } = await capConsentTtlSeconds(
 *     desired,
 *     (p, t) => obp_requests.get(p, t)
 *   );
 *   if (capped) logger.info(`TTL clamped: requested ${desired}s, OBP max ${max}s`);
 */
export async function capConsentTtlSeconds(
	desiredSeconds: number,
	obpGet: ObpGet
): Promise<{ ttl: number; max: number | null; capped: boolean }> {
	const max = await getConsentsMaxTtlSeconds(obpGet);
	if (max === null) return { ttl: desiredSeconds, max: null, capped: false };
	const ttl = Math.min(desiredSeconds, max);
	return { ttl, max, capped: ttl < desiredSeconds };
}

/** For tests. */
export function _resetConsentsConfigCache(): void {
	cache = null;
}
