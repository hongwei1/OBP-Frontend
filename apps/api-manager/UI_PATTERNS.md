# UI Patterns and Component Guidelines

## Overview

This document describes the UI frameworks, patterns, and components used in the API Manager II project. **Always reference this document before creating new pages or components.**

## Tech Stack

### Core Frameworks
- **SvelteKit** - Application framework
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Skeleton UI** (`@skeletonlabs/skeleton-svelte`) - Used ONLY for navigation/layout components

### Styling Approach
- **Tailwind utility classes** for all styling
- **Plain HTML elements** (not component libraries) for page content
- **Responsive design** using Tailwind breakpoints

## What NOT to Use

❌ **DO NOT** use these component libraries:
- shadcn/ui (No `$lib/components/ui/button`, `$lib/components/ui/card`, etc.)
- Material UI
- Radix UI primitives
- Any other third-party component library (except Skeleton UI for nav)

❌ **DO NOT** use:
- `toast` from `svelte-sonner` - Use native `alert()` instead
- Dialog components from external libraries
- Dropdown menu components from external libraries

## Correct Patterns

### ✅ Forms and Inputs

```svelte
<input
  type="text"
  placeholder="Enter text..."
  class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
/>

<textarea
  rows="4"
  class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
></textarea>

<select
  class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
>
  <option value="">Select...</option>
</select>
```

### ✅ Buttons

```svelte
<!-- Primary Button -->
<button
  class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
>
  Button Text
</button>

<!-- Secondary Button -->
<button
  class="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
>
  Button Text
</button>

<!-- Danger Button -->
<button
  class="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
>
  Delete
</button>

<!-- Icon Button -->
<button
  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
  title="Action"
>
  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <!-- SVG path -->
  </svg>
</button>
```

### ✅ Cards/Containers

```svelte
<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
  <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Card Title</h2>
  <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Card description</p>
  <!-- Card content -->
</div>
```

### ✅ Tables

```svelte
<div class="overflow-x-auto">
  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
    <thead class="bg-gray-50 dark:bg-gray-900/50">
      <tr>
        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Header
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
          Cell content
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### ✅ Badges/Pills

```svelte
<!-- Primary Badge -->
<span class="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
  Active
</span>

<!-- Success Badge -->
<span class="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
  Success
</span>

<!-- Outline Badge -->
<span class="inline-flex rounded-full border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
  Outline
</span>
```

### ✅ Modals/Dialogs

Use native Svelte `{#if}` blocks with fixed positioning:

```svelte
{#if showModal}
  <div class="fixed inset-0 z-50 overflow-y-auto" on:click={() => (showModal = false)}>
    <div class="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      
      <!-- Modal -->
      <div
        class="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
        on:click|stopPropagation
      >
        <div class="bg-white px-4 pt-5 pb-4 dark:bg-gray-800 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Modal Title</h3>
          <!-- Modal content -->
        </div>
        <div class="bg-gray-50 px-4 py-3 dark:bg-gray-900/50 sm:flex sm:flex-row-reverse sm:px-6">
          <button class="...">Confirm</button>
          <button on:click={() => (showModal = false)} class="...">Cancel</button>
        </div>
      </div>
    </div>
  </div>
{/if}
```

### ✅ Icons

Use inline SVG with Tailwind classes:

```svelte
<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M..." />
</svg>
```

### ✅ Alerts/Notifications

```svelte
<!-- Info Alert -->
<div class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
  <div class="flex items-start">
    <svg class="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
      <!-- Icon path -->
    </svg>
    <div>
      <h3 class="text-sm font-medium text-blue-900 dark:text-blue-100">Info Title</h3>
      <p class="mt-1 text-sm text-blue-800 dark:text-blue-200">Message text</p>
    </div>
  </div>
</div>

<!-- Warning Alert -->
<div class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
  <p class="text-sm text-amber-800 dark:text-amber-200">⚠️ Warning message</p>
</div>

<!-- Use native alert() for simple notifications -->
<script>
  alert('Action completed successfully');
</script>
```

## Reference Pages

Before creating new pages, **always check these examples**:

### Form Pages
- `src/routes/(protected)/consumers/+page.svelte` - List view with cards
- `src/routes/(protected)/dynamic-entities/create/+page.svelte` - Form with validation

### Table Pages
- `src/routes/(protected)/users/+page.svelte` - Table with actions
- `src/routes/(protected)/dynamic-entities/+page.svelte` - Table with filters

### Navigation
- `src/routes/+layout.svelte` - Main layout with Skeleton UI Navigation

## Color Palette

### Primary Actions
- Blue: `bg-blue-600`, `text-blue-600`, `hover:bg-blue-700`

### Status Colors
- Success/Green: `bg-green-100`, `text-green-800`
- Warning/Amber: `bg-amber-100`, `text-amber-800`
- Error/Red: `bg-red-100`, `text-red-800`
- Info/Blue: `bg-blue-100`, `text-blue-800`

### Neutral Colors
- Backgrounds: `bg-white`, `bg-gray-50`, `bg-gray-100`
- Text: `text-gray-900`, `text-gray-700`, `text-gray-600`
- Borders: `border-gray-200`, `border-gray-300`

### Dark Mode
Always include dark mode variants:
- `dark:bg-gray-800`, `dark:text-gray-100`, `dark:border-gray-700`

## Layout Patterns

### Container
```svelte
<div class="container mx-auto px-4 py-8">
  <!-- Page content -->
</div>
```

### Page Header
```svelte
<div class="mb-6 flex items-center justify-between">
  <div>
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Page Title</h1>
    <p class="mt-1 text-gray-600 dark:text-gray-400">Page description</p>
  </div>
  <button class="...">Action</button>
</div>
```

### Grid Layouts
```svelte
<!-- Stats Grid -->
<div class="grid gap-4 md:grid-cols-3">
  <!-- Cards -->
</div>

<!-- Form Grid -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
  <!-- Form fields -->
</div>
```

## Checklist for New Pages

Before creating a new page, verify:

- [ ] Referenced an existing page for patterns
- [ ] Using Tailwind CSS utility classes only
- [ ] Using plain HTML elements (no shadcn/ui)
- [ ] Included dark mode variants (`dark:*`)
- [ ] Using native `alert()` for notifications
- [ ] Modals use `{#if}` blocks with fixed positioning
- [ ] Icons are inline SVG
- [ ] Responsive design with Tailwind breakpoints
- [ ] Matches the color palette above

## Questions?

If you're unsure about a pattern:
1. Check the reference pages listed above
2. Search for similar patterns in `src/routes/(protected)/`
3. Ask before introducing new dependencies or patterns

---

**Last Updated:** 2024-12-02
