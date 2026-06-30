import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;

const waiting = [];
const pairs = new Map();

function pair_up() {
	while (waiting.length >= 2) {
		const a = waiting.shift();
		const b = waiting.shift();
		pairs.set(a, b);
		pairs.set(b, a);
		a.send(JSON.stringify({ t: 'matched' }));
		b.send(JSON.stringify({ t: 'matched' }));
	}
}

function remove(ws) {
	const p = pairs.get(ws);
	if (p) {
		pairs.delete(ws);
		pairs.delete(p);
		p.send(JSON.stringify({ t: 'partner_left' }));
	}
	const i = waiting.indexOf(ws);
	if (i !== -1) waiting.splice(i, 1);
}

const srv = createServer();
const wss = new WebSocketServer({ server: srv });

wss.on('connection', (ws) => {
	ws.on('message', (raw) => {
		let m;
		try { m = JSON.parse(raw.toString()); } catch { return; }
		switch (m.t) {
			case 'find':
				waiting.push(ws);
				ws.send(JSON.stringify({ t: 'waiting' }));
				pair_up();
				break;
			case 'msg': {
				const p = pairs.get(ws);
				if (p && p.readyState === 1) p.send(JSON.stringify({ t: 'msg', d: m.d }));
				break;
			}
			case 'skip':
				remove(ws);
				ws.send(JSON.stringify({ t: 'waiting' }));
				waiting.push(ws);
				pair_up();
				break;
			case 'ping':
				ws.send(JSON.stringify({ t: 'pong' }));
				break;
		}
	});
	ws.on('close', () => remove(ws));
});

srv.listen(PORT, () => console.log(`ws server on :${srv.address().port}`));
