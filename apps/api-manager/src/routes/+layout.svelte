<script lang="ts">
  import "../app.css";
  import { NavigationSidebar } from "@obp/shared";
  import { page } from "$app/state";
  import { navSections as allNavSections, myAccountItems } from "$lib/config/navigation";
  import { SITE_MAP, type UserEntitlement } from "$lib/utils/roleChecker";

  // Separate My Account from sections — it's handled by the myAccountItems prop
  const sections = allNavSections.filter(s => s.id !== "my-account");

  import Toast from "$lib/components/Toast.svelte";
  import ApiActivityIndicator from "$lib/components/ApiActivityIndicator.svelte";
  import OpeyInsightBar from "$lib/components/OpeyInsightBar.svelte";
  import { describeRoute } from "$lib/config/insightMessages";
  import { createLogger } from "$lib/utils/logger";
  import { resourceDocsCache } from "$lib/stores/resourceDocsCache";
  import { currentBank } from "$lib/stores/currentBank.svelte";
  import { userPreferences } from "$lib/stores/userPreferences.svelte";
  import { onMount, tick } from "svelte";

  const logger = createLogger("LayoutClient");
  const layoutStartTime = performance.now();
  logger.info("🎨 Layout client initialization started");

  // Lucide Icons
  import {
    Compass,
    KeyRound,
    SquareTerminal,
    Users,
    ChevronDown,
    CreditCard,
    Globe,
  } from "@lucide/svelte";

  import { env } from "$env/dynamic/public";
  import type { RootLayoutData } from "./+layout.server";

  logger.info("📦 All imports loaded");
  const importsLoadedTime = performance.now();
  logger.info(
    `⏱️  Imports loaded in ${(importsLoadedTime - layoutStartTime).toFixed(2)}ms`,
  );

  let { data, children } = $props();
  logger.info("📊 Props received from server");
  let isAuthenticated = $state(false);
  let displayMode: "dark" | "light" = $state(userPreferences.theme);
  let userMenuOpen = $state(false);
  let bankSelectorOpen = $state(false);
  let bankSelectEl: HTMLSelectElement | undefined = $state();

  async function openBankSelector() {
    bankSelectorOpen = true;
    await tick();
    try { bankSelectEl?.showPicker(); } catch {}
  }
  let systemDynamicEntities = $state<any[]>([]);

  logger.info("🔐 Checking authentication state");

  // Make authentication reactive to data changes
  $effect(() => {
    if (data.userId) {
      isAuthenticated = true;
      logger.info(`✅ User authenticated: ${data.userId}`);
    } else {
      isAuthenticated = false;
      logger.info("ℹ️  User not authenticated");
    }
  });

  // Pre-warm resource docs cache, fetch banks, and load preferences for authenticated users
  onMount(() => {
    if (isAuthenticated) {
      logger.info("🔄 Pre-warming browser resource docs cache...");
      resourceDocsCache.preWarmCache(undefined as any);
      currentBank.fetchBanks();
      userPreferences.loadFromOBP();
    }
  });

  // Fetch system dynamic entities for shortcuts
  async function fetchSystemDynamicEntities() {
    if (!isAuthenticated) return;

    try {
      const response = await fetch("/api/dynamic-entities/system/list", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        systemDynamicEntities = data.entities || [];
        logger.info(
          `✅ Loaded ${systemDynamicEntities.length} system dynamic entities`,
        );
      }
    } catch (error) {
      logger.error("Failed to fetch system dynamic entities:", error);
    }
  }

  onMount(() => {
    fetchSystemDynamicEntities();
  });

  // Refresh dynamic entities when navigating within dynamic entities section
  $effect(() => {
    if (page.url.pathname.startsWith("/dynamic-entities/system")) {
      fetchSystemDynamicEntities();
    }
  });

  function userHasRole(roleName: string): boolean {
    const entitlements: UserEntitlement[] = data.userEntitlements || [];
    return entitlements.some((e) => e.role_name === roleName);
  }

  function getMenuTooltip(href: string, label: string): string {
    if (href.startsWith("http")) return label;
    const path = href.split("?")[0];
    const config = SITE_MAP[path];
    if (!config) return `${label}\nNo Roles required`;
    const roles = config.required;
    if (roles.length === 0) return `${label}\nRequired roles: (none)`;
    const lines = roles.map((r) => {
      const has = userHasRole(r.role);
      return `${has ? "\u2713" : "\u2717"} ${r.role}`;
    });
    if (roles.length === 1) {
      return `${label}\nRequired role:\n${lines[0]}`;
    }
    const logic = config.requirementType === "AND" ? "AND" : "OR";
    const separator = logic === "AND" ? "\n" : `\n  ${logic} `;
    return `${label}\nRequired roles (${logic}):\n${lines.join(separator)}`;
  }

  logger.info("🧭 Navigation state initialized");
  const navStateTime = performance.now();
  logger.info(
    `⏱️  Navigation state in ${(navStateTime - importsLoadedTime).toFixed(2)}ms`,
  );

  // Log when layout is fully initialized
  $effect(() => {
    const layoutEndTime = performance.now();
    const totalTime = layoutEndTime - layoutStartTime;
    logger.info(
      `✅ Layout client fully initialized in ${totalTime.toFixed(2)}ms`,
    );
  });

  // Menu items (flat list at top of sidebar)
  let menuItems = $state([
    ...(data.externalLinks.API_EXPLORER_URL
      ? [
          {
            href: data.externalLinks.API_EXPLORER_URL,
            label: "API Explorer",
            iconComponent: Compass,
            external: true,
          },
        ]
      : []),
    ...(data.externalLinks.PORTAL_URL
      ? [
          {
            href: data.externalLinks.PORTAL_URL,
            label: "Portal",
            iconComponent: Globe,
            external: true,
          },
        ]
      : []),
    {
      label: "Users",
      href: "/users",
      iconComponent: Users,
    },
    {
      label: "Consumers",
      href: "/consumers",
      iconComponent: KeyRound,
    },
    ...(data.externalLinks.SUBSCRIPTIONS_URL
      ? [
          {
            href: data.externalLinks.SUBSCRIPTIONS_URL,
            label: "Subscriptions",
            iconComponent: CreditCard,
            external: true,
          },
        ]
      : []),
    ...(data.externalLinks.API_MANAGER_URL
      ? [
          {
            href: data.externalLinks.API_MANAGER_URL,
            label: "API Manager",
            iconComponent: SquareTerminal,
            external: true,
          },
        ]
      : []),
  ]);

  let footerLinks = $state([
    {
      href: "https://github.com/OpenBankProject",
      label: "GitHub",
      iconLight: "/github-mark.svg",
      iconDark: "/github-mark-white.svg",
    },
  ]);

  // Default logo URL, can be overridden by PUBLIC_LOGO_URL in .env
  const defaultLogoUrl = "/logo2x-1.png";
  const defaultDarkLogoUrl = "/obp_logo.png";
  let lightLogoUrl = $state(env.PUBLIC_LOGO_URL || defaultLogoUrl);

  if (!env.PUBLIC_DARK_LOGO_URL) {
    env.PUBLIC_DARK_LOGO_URL = env.PUBLIC_LOGO_URL || defaultLogoUrl;
  }

  let darkLogoUrl = $state(env.PUBLIC_DARK_LOGO_URL || defaultDarkLogoUrl);

  const logoWidth = env.PUBLIC_LOGO_WIDTH || "100%";

  let logoUrl = $derived.by(() => {
    return displayMode === "dark" ? darkLogoUrl : lightLogoUrl;
  });

  // Sponsor image URL - supports light/dark mode
  let sponsorImageUrl = $derived.by(() => {
    if (displayMode === "dark" && env.PUBLIC_SPONSOR_DARK_IMAGE) {
      return env.PUBLIC_SPONSOR_DARK_IMAGE;
    }
    return env.PUBLIC_SPONSOR_IMAGE;
  });
</script>

<div
  class="grid h-screen w-full grid-cols-[auto_1fr] divide-x divide-solid divide-surface-100-900 overflow-hidden"
>
  <NavigationSidebar
    {menuItems}
    {myAccountItems}
    {sections}
    {logoUrl}
    {logoWidth}
    {isAuthenticated}
    currentPathname={page.url.pathname}
    currentSearch={page.url.search}
    bind:displayMode
    {footerLinks}
    copyrightHolder="TESOBE"
    copyrightStartYear={2011}
    {sponsorImageUrl}
    sponsorInfoUrl={env.PUBLIC_SPONSOR_INFO_URL}
    sponsorNote={env.PUBLIC_SPONSOR_NOTE}
    legacyPortalUrl={data.externalLinks.LEGACY_PORTAL_URL}
    collapsedLogoUrl={env.PUBLIC_MINIMAL_LOGO_URL || env.PUBLIC_DARK_LOGO_URL}
    getTooltip={getMenuTooltip}
  />
  <div
    class="h-full bg-conic-250 from-30% via-40% to-50% dark:from-primary-950 dark:via-tertiary-500/70 dark:to-primary-950"
  >
    <div class="flex flex-col backdrop-blur-2xl" style="height: calc(100vh - 48px);">
      <div
        class="bg-opacity-0 flex items-center justify-between px-4 py-2 shadow-md z-10"
        style="height: 48px; flex-shrink: 0;"
      >
        <div>
          {#if isAuthenticated}
            {#if bankSelectorOpen}
              <div class="flex items-center gap-2">
                <select
                  bind:this={bankSelectEl}
                  class="rounded-md border border-surface-300-700 bg-surface-100-900 px-2 py-1 text-sm"
                  value={currentBank.bankId}
                  onchange={(e) => {
                    currentBank.selectById(e.currentTarget.value);
                    bankSelectorOpen = false;
                  }}
                >
                  <option value="">-- Select a bank --</option>
                  {#each currentBank.banks as bank}
                    <option value={bank.bank_id}>
                      {bank.bank_id} — {bank.bank_code} — {bank.full_name}
                    </option>
                  {/each}
                </select>
                <button
                  type="button"
                  class="text-sm opacity-60 hover:opacity-100"
                  onclick={() => bankSelectorOpen = false}
                  title="Close"
                >&times;</button>
              </div>
            {:else if currentBank.bank}
              <span class="text-sm" class:bank-changed={currentBank.justChanged}>{currentBank.bank.full_name}: {currentBank.bank.bank_id} ({currentBank.bank.bank_code}) <button type="button" class="hover:text-tertiary-400" onclick={openBankSelector} title="Change current bank">&#9998;</button></span>
            {:else}
              <button type="button" class="text-sm opacity-70 hover:text-tertiary-400 hover:opacity-100" onclick={openBankSelector}>Select Bank &#9998;</button>
            {/if}
          {/if}
        </div>
        {#if isAuthenticated}
          <div class="relative mx-4">
            <button
              type="button"
              class="flex items-center gap-1 hover:text-tertiary-400"
              onclick={() => (userMenuOpen = !userMenuOpen)}
              onblur={() => setTimeout(() => (userMenuOpen = false), 150)}
            >
              {data.username}
              <ChevronDown class="size-4" />
            </button>
            {#if userMenuOpen}
              <div class="absolute right-0 z-50 mt-2 min-w-[140px] rounded-md border border-surface-300-700 bg-surface-100-900 py-1 shadow-lg">
                <a
                  href="/user"
                  class="block px-4 py-2 text-sm hover:preset-tonal"
                >
                  My Account
                </a>
                <a
                  href="/logout"
                  class="block px-4 py-2 text-sm hover:preset-tonal"
                >
                  Logout
                </a>
              </div>
            {/if}
          </div>
        {:else}
          <div class="flex items-center">
            <span class="mx-4 hover:text-tertiary-400"
              ><a href="{data.externalLinks.PORTAL_URL}/register">Register</a>
            </span>
            <button type="button" class="btn preset-filled-surface-950-50"
              ><a href="/login">Login</a></button
            >
          </div>
        {/if}
      </div>

      <main
        class="flex flex-col overflow-auto"
        style="height: calc(100vh - 48px);"
      >
        {#if isAuthenticated && page.url.pathname !== '/'}
          {#key page.url.pathname}
            <OpeyInsightBar pathname={page.url.pathname} pageContext={describeRoute(page.url.pathname)} />
          {/key}
        {/if}
        {@render children()}
      </main>
    </div>
  </div>
</div>

<!-- Global Toast Component -->
<Toast />

<!-- Global API Activity Indicator -->
<ApiActivityIndicator />

<style>
  @keyframes bank-highlight {
    0%   { color: #22c55e; }  /* green */
    25%  { color: #3b82f6; }  /* blue */
    50%  { color: #a855f7; }  /* purple */
    75%  { color: #f59e0b; }  /* amber */
    100% { color: inherit; }
  }

  :global(.bank-changed) {
    animation: bank-highlight 1.5s ease-in-out;
    font-weight: 700;
  }
</style>
