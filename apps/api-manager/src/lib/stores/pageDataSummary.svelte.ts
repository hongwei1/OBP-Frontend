/**
 * A simple reactive store that pages write to after loading data.
 * The Opey Insight Bar reads from this to enrich notebook entries.
 *
 * Usage from any page:
 *   import { pageDataSummary } from '$lib/stores/pageDataSummary.svelte';
 *   pageDataSummary.set("12 banks loaded, 3 have routings configured");
 */

let summary = $state("");

export const pageDataSummary = {
	get value() { return summary; },
	set(text: string) { summary = text; },
	clear() { summary = ""; },
};
