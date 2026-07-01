<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { PUBLIC_WS_URL } from '$env/static/public';

	let state = $state<'idle' | 'waiting' | 'chat'>('idle');
	let msgs = $state<{ me: boolean; d: string; sys?: boolean }[]>([]);
	let input = $state('');
	let ws: WebSocket | null = null;
	let msgContainer: HTMLDivElement | undefined = $state(undefined);

	let waitingDots = $state(0);
	let dotTimer: ReturnType<typeof setInterval> | undefined;

	function connect() {
		ws = new WebSocket(PUBLIC_WS_URL);
		ws.onopen = () => ws!.send(JSON.stringify({ t: 'find' }));
		ws.onmessage = (e) => {
			const m = JSON.parse(e.data);
			switch (m.t) {
				case 'waiting':
					state = 'waiting';
					dotTimer = setInterval(() => (waitingDots = (waitingDots + 1) % 4), 400);
					break;
				case 'matched':
					clearInterval(dotTimer);
					state = 'chat';
					break;
				case 'msg':
					msgs = [...msgs, { me: false, d: m.d }];
					break;
				case 'partner_left':
					msgs = [...msgs, { me: false, d: 'partner left', sys: true }];
					state = 'idle';
					break;
			}
		};
		ws.onclose = () => {
			clearInterval(dotTimer);
			state = 'idle';
			ws = null;
		};
	}

	function send() {
		const d = input.trim();
		if (!d || !ws) return;
		ws.send(JSON.stringify({ t: 'msg', d }));
		msgs = [...msgs, { me: true, d }];
		input = '';
	}

	function skip() {
		if (!ws) return;
		ws.send(JSON.stringify({ t: 'skip' }));
		msgs = [];
		state = 'waiting';
	}

	function cancel() {
		ws?.close();
		state = 'idle';
	}

	$effect(() => {
		if (msgContainer && msgs.length) {
			requestAnimationFrame(() => {
				msgContainer!.scrollTop = msgContainer!.scrollHeight;
			});
		}
	});
</script>

<svelte:head>
	<title>chat | ri</title>
</svelte:head>

{#if state === 'idle'}
	<div class="h-full flex items-center justify-center px-5" in:fade={{ duration: 300 }}>
		<div class="text-center max-w-xs">
			<h1 class="text-3xl font-semibold tracking-tight text-stone-100">ri</h1>
			<p class="mt-2 text-stone-400 text-sm leading-relaxed">Chat with strangers. Anonymously.</p>
			<button
				onclick={connect}
				class="mt-8 px-7 py-3 rounded-full bg-amber-400 text-zinc-950 font-semibold text-sm hover:bg-amber-500 active:scale-[0.98] transition-all"
			>
				Find a stranger
			</button>
		</div>
	</div>
{:else if state === 'waiting'}
	<div class="h-full flex items-center justify-center px-5" in:fade={{ duration: 300 }}>
		<div class="text-center">
			<div class="flex items-center justify-center gap-1.5">
				<span
					class="w-2 h-2 rounded-full bg-amber-400/70"
					class:opacity-100={waitingDots >= 1}
					class:opacity-30={waitingDots < 1}
				/>
				<span
					class="w-2 h-2 rounded-full bg-amber-400/70 transition-opacity duration-300"
					class:opacity-100={waitingDots >= 2}
					class:opacity-30={waitingDots < 2}
				/>
				<span
					class="w-2 h-2 rounded-full bg-amber-400/70 transition-opacity duration-300"
					class:opacity-100={waitingDots >= 3}
					class:opacity-30={waitingDots < 3}
				/>
			</div>
			<p class="mt-4 text-stone-400 text-sm">Looking for someone</p>
			<button
				onclick={cancel}
				class="mt-6 text-xs text-stone-600 hover:text-stone-400 transition-colors"
			>
				Cancel
			</button>
		</div>
	</div>
{:else if state === 'chat'}
	<div class="h-full flex flex-col" in:fade={{ duration: 200 }}>
		<div
			class="flex items-center justify-between px-4 md:px-6 py-3 border-b border-zinc-800 shrink-0"
		>
			<div class="flex items-center gap-2">
				<span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
				<span class="text-xs font-medium text-stone-400">Connected</span>
			</div>
			<button onclick={skip} class="text-xs text-stone-600 hover:text-stone-400 transition-colors">
				Skip
			</button>
		</div>

		<div
			class="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3 chat-msgs"
			bind:this={msgContainer}
		>
			{#each msgs as m, i (i)}
				{#if m.sys}
					<p class="text-center text-stone-600 text-xs italic py-1" in:fade={{ duration: 200 }}>
						{m.d}
					</p>
				{:else}
					<div
						class="flex"
						class:justify-end={m.me}
						class:justify-start={!m.me}
						in:fly={{ y: 8, duration: 150 }}
					>
						<div
							class="max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
							class:bg-amber-500={m.me}
							class:text-white={m.me}
							class:rounded-br-sm={m.me}
							class:bg-zinc-800={!m.me}
							class:text-stone-200={!m.me}
							class:rounded-bl-sm={!m.me}
						>
							{m.d}
						</div>
					</div>
				{/if}
			{/each}
		</div>

		<div class="border-t border-zinc-800 px-4 md:px-6 py-3 shrink-0">
			<form
				onsubmit={(e) => {
					e.preventDefault();
					send();
				}}
				class="flex gap-2 max-w-3xl mx-auto items-center"
			>
				<input
					bind:value={input}
					placeholder="Type a message"
					class="flex-1 bg-zinc-900 rounded-full px-5 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:ring-1 focus:ring-zinc-700 transition-shadow"
				/>
				<button
					type="submit"
					disabled={!input.trim()}
					class="px-5 py-2.5 rounded-full bg-amber-400 text-zinc-950 font-semibold text-sm disabled:opacity-30 hover:bg-amber-500 active:scale-[0.98] transition-all"
				>
					Send
				</button>
			</form>
		</div>
	</div>
{/if}
