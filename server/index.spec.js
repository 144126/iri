import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { WebSocket } from 'ws';

const TEST_PORT = 18789;
let proc;
const url = `ws://localhost:${TEST_PORT}`;

before(() => {
	return new Promise((ok) => {
		proc = spawn('node', ['index.js'], {
			env: { ...process.env, PORT: String(TEST_PORT) },
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		proc.stdout.once('data', () => ok());
	});
});

after(() => {
	proc?.kill();
	setTimeout(() => process.exit(0), 50);
});

function connect() {
	return new Promise((ok, fail) => {
		const ws = new WebSocket(url);
		ws.on('open', () => ok(ws));
		ws.on('error', fail);
	});
}

function wait(ws, t) {
	return new Promise((ok) => {
		const cb = (raw) => {
			const m = JSON.parse(raw.toString());
			if (m.t === t) ok(m);
			else ws.once('message', cb);
		};
		ws.once('message', cb);
	});
}

describe('ws relay', () => {
	it('pairs two users', async () => {
		const a = await connect();
		const b = await connect();
		a.send(JSON.stringify({ t: 'find' }));
		b.send(JSON.stringify({ t: 'find' }));
		assert.equal((await wait(a, 'matched')).t, 'matched');
		assert.equal((await wait(b, 'matched')).t, 'matched');
		a.close(); b.close();
	});

	it('relays messages between paired users', async () => {
		const a = await connect();
		const b = await connect();
		a.send(JSON.stringify({ t: 'find' }));
		b.send(JSON.stringify({ t: 'find' }));
		await wait(a, 'matched');
		a.send(JSON.stringify({ t: 'msg', d: 'hello' }));
		const m = await wait(b, 'msg');
		assert.equal(m.d, 'hello');
		a.close(); b.close();
	});

	it('notifies partner on disconnect', async () => {
		const a = await connect();
		const b = await connect();
		a.send(JSON.stringify({ t: 'find' }));
		b.send(JSON.stringify({ t: 'find' }));
		await wait(a, 'matched');
		a.close();
		assert.equal((await wait(b, 'partner_left')).t, 'partner_left');
		b.close();
	});
});
