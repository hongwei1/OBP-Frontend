import { describe, it, expect } from 'vitest';
import { getPageRoles, checkRoles, type UserEntitlement } from '$lib/utils/roleChecker';

/**
 * OBP-API added CanDeleteSignalChannel to DELETE /signal/channels/{name}. The page keeps
 * `required: []` -- viewing channels needs nothing -- and declares the delete role as
 * optional, so the page stays reachable and only that one action is gated.
 *
 * What this pins down is the wiring and the exact role string. The page-level behaviour
 * (that no request is sent when the role is absent) is NOT covered here: api-manager has no
 * working component-test setup -- vite.config.ts points its "client" project at
 * vitest-setup-client.ts and test/setup.ts, neither of which exists, and the repo has no
 * .svelte.test.ts files at all. Standing that up is a bigger change than this fix.
 */

const ROLE = 'CanDeleteSignalChannel';

function entitlement(role_name: string): UserEntitlement {
	return { entitlement_id: 'e-1', role_name, bank_id: '' };
}

describe('signal-channels page roles', () => {
	it('is reachable without any role, so viewing keeps working', () => {
		const config = getPageRoles('/(protected)/system/signal-channels');
		expect(config).toBeDefined();
		expect(config!.required).toEqual([]);
	});

	it('declares the delete role that OBP-API now enforces', () => {
		const config = getPageRoles('/(protected)/system/signal-channels');
		expect(config!.optional?.map((r) => r.role)).toContain(ROLE);
	});

	it('reports the role missing for a user who does not hold it', () => {
		const result = checkRoles([entitlement('CanGetSignalStats')], [{ role: ROLE }]);
		expect(result.hasAllRoles).toBe(false);
		expect(result.missingRoles.map((r) => r.role)).toEqual([ROLE]);
	});

	it('reports the role present for a user who does', () => {
		const result = checkRoles([entitlement(ROLE)], [{ role: ROLE }]);
		expect(result.hasAllRoles).toBe(true);
		expect(result.missingRoles).toEqual([]);
	});
});
