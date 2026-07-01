<script lang="ts">
	import { resolve } from '$app/paths';
	import '../app.css';
	import '@fontsource/geist-sans/400.css';
	import '@fontsource/geist-sans/500.css';
	import '@fontsource/geist-sans/600.css';
	import '@fontsource/geist-sans/700.css';
	import '@fontsource/geist-sans/800.css';
	import '@fontsource/geist-mono/400.css';
	import '@fontsource/geist-mono/500.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-[100dvh] flex flex-col">
	<nav
		class="flex items-center justify-between h-14 md:h-16 px-5 md:px-8 border-b border-zinc-800 shrink-0"
	>
		<a href={resolve('/')} class="text-lg font-semibold tracking-tight text-stone-100">ri</a>
	</nav>
	<main class="flex-1 flex flex-col">
		{@render children()}
	</main>
</div>
