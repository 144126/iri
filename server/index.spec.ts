import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const HOST = Deno.env.get('TEST_WS_HOST') || '127.0.0.1';
const PORT = Deno.env.get('TEST_WS_PORT') || '8080';
const url = `ws://${HOST}:${PORT}`;

function connect(): Promise<WebSocket> {
	return new Promise((ok, fail) => {
		const ws = new WebSocket(url);
		ws.onopen = () => ok(ws);
		ws.onerror = () => fail(new Error('connect failed'));
	});
}

function wait(ws: WebSocket, t: string): Promise<Record<string, unknown>> {
	return new Promise((ok) => {
		const cb = (e: MessageEvent) => {
			const m = JSON.parse(e.data as string);
			if (m.t === t) ok(m);
			else ws.addEventListener('message', cb, { once: true });
		};
		ws.addEventListener('message', cb, { once: true });
	});
}

Deno.test('pairs two users', async () => {
	const a = await connect();
	const b = await connect();
	const pMa = wait(a, 'matched');
	const pMb = wait(b, 'matched');
	a.send(JSON.stringify({ t: 'find' }));
	b.send(JSON.stringify({ t: 'find' }));
	assertEquals((await pMa).t, 'matched');
	assertEquals((await pMb).t, 'matched');
	a.close();
	b.close();
});

Deno.test('relays messages', async () => {
	const a = await connect();
	const b = await connect();
	const pMa = wait(a, 'matched');
	const pMb = wait(b, 'matched');
	a.send(JSON.stringify({ t: 'find' }));
	b.send(JSON.stringify({ t: 'find' }));
	await pMa;
	await pMb;
	const pMsg = wait(b, 'msg');
	a.send(JSON.stringify({ t: 'msg', d: 'hello' }));
	const m = await pMsg;
	assertEquals(m.d, 'hello');
	a.close();
	b.close();
});

Deno.test('notifies partner on disconnect', async () => {
	const a = await connect();
	const b = await connect();
	const pMa = wait(a, 'matched');
	const pMb = wait(b, 'matched');
	a.send(JSON.stringify({ t: 'find' }));
	b.send(JSON.stringify({ t: 'find' }));
	await pMa;
	await pMb;
	const pLeft = wait(b, 'partner_left');
	a.close();
	assertEquals((await pLeft).t, 'partner_left');
	b.close();
});
