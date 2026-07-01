<script lang="ts">
	import { resolve } from '$app/paths';
	import { fly, fade } from 'svelte/transition';
</script>

<svelte:head>
	<title>ri - chat with strangers, anonymously</title>
	<meta
		name="description"
		content="Chat with strangers anonymously. No signup, no tracking, no history."
	/>
</svelte:head>

<section
	class="min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh-4rem)] flex items-center px-5 md:px-8"
>
	<div class="grid grid-cols-1 lg:grid-cols-5 gap-12 w-full max-w-7xl mx-auto items-center">
		<div class="lg:col-span-3" in:fade={{ duration: 600 }}>
			<h1
				class="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter leading-none text-stone-100"
			>
				ri
			</h1>
			<p class="mt-5 md:mt-6 text-lg md:text-xl text-stone-400 max-w-md leading-relaxed">
				Chat with strangers. Anonymously.
			</p>
			<div class="mt-8 md:mt-10">
				<a
					href={resolve('/chat')}
					class="inline-flex items-center px-7 md:px-8 py-3 rounded-full bg-amber-400 text-zinc-950 font-semibold text-sm hover:bg-amber-500 active:scale-[0.98] transition-all"
				>
					Start chatting
				</a>
			</div>
		</div>
		<div
			class="hidden lg:flex lg:col-span-2 items-center justify-center"
			in:fade={{ duration: 800 }}
		>
			<div
				class="w-72 h-72 xl:w-96 xl:h-96 rounded-full bg-gradient-to-br from-amber-400/25 via-amber-500/10 to-transparent blur-3xl"
			/>
		</div>
	</div>
</section>

<section class="px-5 md:px-8 py-24 md:py-32">
	<div class="max-w-7xl mx-auto">
		<h2 class="text-2xl md:text-3xl font-semibold tracking-tight text-stone-100">How it works</h2>
		<div class="mt-14 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
			<div
				class="md:pr-8 md:border-r md:border-zinc-800"
				in:fly={{ x: -20, duration: 500, delay: 100 }}
			>
				<span class="text-5xl font-bold text-amber-400/15">01</span>
				<h3 class="mt-4 text-xl font-semibold text-stone-100">Find</h3>
				<p class="mt-2 text-stone-400 leading-relaxed">
					Click find. Get matched with a stranger in seconds.
				</p>
			</div>
			<div in:fly={{ x: 20, duration: 500, delay: 200 }}>
				<span class="text-5xl font-bold text-amber-400/15">02</span>
				<h3 class="mt-4 text-xl font-semibold text-stone-100">Talk</h3>
				<p class="mt-2 text-stone-400 leading-relaxed">Chat anonymously. No login, no history.</p>
			</div>
			<div class="md:col-span-2 text-center" in:fly={{ y: 20, duration: 500, delay: 300 }}>
				<span class="text-5xl font-bold text-amber-400/15">03</span>
				<h3 class="mt-4 text-xl font-semibold text-stone-100">Skip</h3>
				<p class="mt-2 text-stone-400 leading-relaxed max-w-md mx-auto">
					Not vibing? Skip and meet someone new.
				</p>
			</div>
		</div>
	</div>
</section>

<section class="px-5 md:px-8 py-24 md:py-32 border-t border-zinc-800">
	<div class="max-w-7xl mx-auto text-center">
		<h2 class="text-2xl md:text-3xl font-semibold tracking-tight text-stone-100">Ready?</h2>
		<p class="mt-3 text-stone-400">No signup. No tracking. Just talk.</p>
		<div class="mt-8">
			<a
				href={resolve('/chat')}
				class="inline-flex items-center px-8 py-3 rounded-full bg-amber-400 text-zinc-950 font-semibold text-sm hover:bg-amber-500 active:scale-[0.98] transition-all"
			>
				Start chatting
			</a>
		</div>
		<p class="mt-16 text-xs text-stone-600">ri - 2026</p>
	</div>
</section>
