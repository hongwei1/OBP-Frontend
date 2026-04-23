<script lang="ts">
	let { data, form } = $props();
</script>

<div class="mx-auto max-w-2xl p-8">
		<h1 class="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
			Consent Request
		</h1>

		{#if data.loadError}
			<div class="bg-error-500/10 border-error-500 mb-4 rounded-lg border p-4">
				<p class="text-error-500 font-semibold">{data.loadError}</p>
			</div>
		{/if}

			<p class="mb-6 text-gray-700 dark:text-gray-300">
				{#if data.consumerName}
					<strong>{data.consumerName}</strong> is requesting access to your account.
				{:else}
					An application is requesting access to your account.
				{/if}
				Please review the details below and confirm if you agree.
			</p>

			{#if form?.message}
				<div class="bg-error-500/10 border-error-500 mb-4 rounded-lg border p-4">
					<p class="text-error-500 font-semibold">{form.message}</p>
				</div>
			{/if}

			<!-- Consent Details -->
			<div class="mb-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
				<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
					Consent Details
				</h2>

				<div class="mb-4 rounded bg-gray-50 p-4 dark:bg-gray-700">
					<pre
						class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{JSON.stringify(data.payload, null, 2)}</pre>
				</div>

				<div class="grid gap-3 text-sm">
					{#if data.payload.everything !== undefined}
						<div class="flex items-center justify-between">
							<span class="font-medium text-gray-700 dark:text-gray-300">Access Level:</span>
							<span class="text-gray-900 dark:text-gray-100">
								{data.payload.everything ? 'Full access' : 'Limited access'}
							</span>
						</div>
					{/if}

					{#if data.payload.time_to_live}
						<div class="flex items-center justify-between">
							<span class="font-medium text-gray-700 dark:text-gray-300">Valid For:</span>
							<span class="text-gray-900 dark:text-gray-100">
								{data.payload.time_to_live} seconds
							</span>
						</div>
					{/if}

					{#if data.payload.valid_from}
						<div class="flex items-center justify-between">
							<span class="font-medium text-gray-700 dark:text-gray-300">Valid From:</span>
							<span class="text-gray-900 dark:text-gray-100">{data.payload.valid_from}</span>
						</div>
					{/if}

					{#if data.bankId}
						<div class="flex items-center justify-between">
							<span class="font-medium text-gray-700 dark:text-gray-300">Bank:</span>
							<span class="text-gray-900 dark:text-gray-100">{data.bankId}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-4">
				<form method="post" action="?/confirm" class="flex-1">
					<input type="hidden" name="consentRequestId" value={data.consentRequestId} />
					<input type="hidden" name="bankId" value={data.bankId} />
					<button type="submit" class="btn preset-filled-primary-500 w-full">
						Confirm Consent
					</button>
				</form>
				<form method="post" action="?/deny" class="flex-1">
					<button type="submit" class="btn preset-filled-error-500 w-full">
						Deny
					</button>
				</form>
			</div>
	</div>
