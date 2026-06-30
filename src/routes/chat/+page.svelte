<script lang="ts">
	import { PUBLIC_WS_URL } from '$env/static/public';

	let state = $state<'idle' | 'waiting' | 'chat'>('idle');
	let msgs = $state<{ me: boolean; d: string }[]>([]);
	let input = $state('');
	let ws: WebSocket | null = null;

	function connect() {
		ws = new WebSocket(PUBLIC_WS_URL);
		ws.onopen = () => ws!.send(JSON.stringify({ t: 'find' }));
		ws.onmessage = (e) => {
			const m = JSON.parse(e.data);
			switch (m.t) {
				case 'waiting':
					state = 'waiting';
					break;
				case 'matched':
					state = 'chat';
					break;
				case 'msg':
					msgs = [...msgs, { me: false, d: m.d }];
					break;
				case 'partner_left':
					msgs = [...msgs, { me: false, d: '— partner left —' }];
					state = 'idle';
					break;
			}
		};
		ws.onclose = () => { state = 'idle'; ws = null; };
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
</script>

<div class="chat">
	{#if state === 'idle'}
		<button onclick={connect}>find stranger</button>
	{:else if state === 'waiting'}
		<p>waiting for someone...</p>
		<button onclick={() => { ws?.close(); state = 'idle'; }}>cancel</button>
	{:else if state === 'chat'}
		<div class="msgs">
			{#each msgs as m}
				<p class:me={m.me}>{m.d}</p>
			{/each}
		</div>
		<form onsubmit={(e) => { e.preventDefault(); send(); }}>
			<input bind:value={input} placeholder="type..." />
			<button type="submit">send</button>
			<button type="button" onclick={skip}>skip</button>
		</form>
	{/if}
</div>
