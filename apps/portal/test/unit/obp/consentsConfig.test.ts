import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getConsentsMaxTtlSeconds,
	capConsentTtlSeconds,
	_resetConsentsConfigCache
} from '@obp/shared/server/obp';

/**
 * Lives here rather than beside the source: packages/shared's vitest config is jsdom-only
 * and explicitly excludes src/lib/server/**, and Portal is the consumer whose behaviour
 * this protects. Portal's "server" vitest project runs test/** under node.
 */

const NEW_PATH = '/obp/v7.0.0/public/consent-config';
const OLD_PATH = '/obp/v7.0.0/consents/config';

/** What obp_requests.get throws for a path OBP-API does not route. */
function routingMiss() {
	return new Error(
		'404 {"code":404,"message":"OBP-10404: 404 Not Found. The server could not find the requested URI."}'
	);
}

// The answer is cached for an hour, so without this the first case would decide the rest.
beforeEach(() => {
	_resetConsentsConfigCache();
	vi.clearAllMocks();
});

describe('getConsentsMaxTtlSeconds', () => {
	it('asks for the current path first', async () => {
		const obpGet = vi.fn().mockResolvedValue({ max_time_to_live_in_seconds: 3600 });

		expect(await getConsentsMaxTtlSeconds(obpGet)).toBe(3600);
		expect(obpGet).toHaveBeenCalledTimes(1);
		expect(obpGet).toHaveBeenCalledWith(NEW_PATH);
	});

	// The regression this file exists for: OBP-API renamed the endpoint, Portal kept asking
	// for the old path, and the module's tolerance for a missing endpoint turned that into
	// silently switching capping off rather than into an error anybody would see.
	it('falls back to the pre-rename path when the current one is not routed', async () => {
		const obpGet = vi
			.fn()
			.mockRejectedValueOnce(routingMiss())
			.mockResolvedValueOnce({ max_time_to_live_in_seconds: 7200 });

		expect(await getConsentsMaxTtlSeconds(obpGet)).toBe(7200);
		expect(obpGet).toHaveBeenNthCalledWith(1, NEW_PATH);
		expect(obpGet).toHaveBeenNthCalledWith(2, OLD_PATH);
	});

	it('returns null only when neither path is routed', async () => {
		const obpGet = vi.fn().mockRejectedValue(routingMiss());

		expect(await getConsentsMaxTtlSeconds(obpGet)).toBeNull();
		expect(obpGet).toHaveBeenCalledTimes(2);
	});

	// A 500 or an auth failure is not evidence that we asked for the wrong URL, so it must
	// not trigger the fallback -- otherwise a broken server reads as "old server" and every
	// request is made twice.
	it('does not treat a non-404 failure as a wrong path', async () => {
		const obpGet = vi.fn().mockRejectedValue(new Error('500 Internal Server Error'));

		expect(await getConsentsMaxTtlSeconds(obpGet)).toBeNull();
		expect(obpGet).toHaveBeenCalledTimes(1);
	});

	it('caches, so a second caller does not re-ask', async () => {
		const obpGet = vi.fn().mockResolvedValue({ max_time_to_live_in_seconds: 3600 });

		await getConsentsMaxTtlSeconds(obpGet);
		await getConsentsMaxTtlSeconds(obpGet);
		expect(obpGet).toHaveBeenCalledTimes(1);
	});
});

describe('capConsentTtlSeconds', () => {
	it('clamps to the server maximum, which is the whole point of the lookup', async () => {
		const obpGet = vi.fn().mockResolvedValue({ max_time_to_live_in_seconds: 3600 });

		expect(await capConsentTtlSeconds(86400, obpGet)).toEqual({
			ttl: 3600,
			max: 3600,
			capped: true
		});
	});

	it('leaves a TTL below the maximum alone', async () => {
		const obpGet = vi.fn().mockResolvedValue({ max_time_to_live_in_seconds: 86400 });

		expect(await capConsentTtlSeconds(3600, obpGet)).toEqual({
			ttl: 3600,
			max: 86400,
			capped: false
		});
	});

	// Capping off is the pre-existing tolerance for genuinely old servers. It stays -- what
	// changed is that a rename no longer looks like an old server.
	it('leaves the TTL untouched when the endpoint is on neither path', async () => {
		const obpGet = vi.fn().mockRejectedValue(routingMiss());

		expect(await capConsentTtlSeconds(86400, obpGet)).toEqual({
			ttl: 86400,
			max: null,
			capped: false
		});
	});
});
