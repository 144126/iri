const PORT = Number(Deno.env.get("PORT")) || 8080;

const waiting: WebSocket[] = [];
const pairs = new Map<WebSocket, WebSocket>();

function pair_up() {
	while (waiting.length >= 2) {
		const a = waiting.shift()!;
		const b = waiting.shift()!;
		pairs.set(a, b);
		pairs.set(b, a);
		a.send(JSON.stringify({ t: "matched" }));
		b.send(JSON.stringify({ t: "matched" }));
	}
}

function remove(ws: WebSocket) {
	const p = pairs.get(ws);
	if (p) {
		pairs.delete(ws);
		pairs.delete(p);
		p.send(JSON.stringify({ t: "partner_left" }));
	}
	const i = waiting.indexOf(ws);
	if (i !== -1) waiting.splice(i, 1);
}

Deno.serve({ port: PORT }, (req) => {
	if (req.headers.get("upgrade") !== "websocket") {
		return new Response("expected websocket", { status: 426 });
	}
	const { socket, response } = Deno.upgradeWebSocket(req);

	socket.onmessage = (e) => {
		let m: { t: string; d?: string };
		try { m = JSON.parse(e.data as string); } catch { return; }
		switch (m.t) {
			case "find":
				waiting.push(socket);
				socket.send(JSON.stringify({ t: "waiting" }));
				pair_up();
				break;
			case "msg": {
				const p = pairs.get(socket);
				if (p && p.readyState === WebSocket.OPEN) {
					p.send(JSON.stringify({ t: "msg", d: m.d }));
				}
				break;
			}
			case "skip":
				remove(socket);
				socket.send(JSON.stringify({ t: "waiting" }));
				waiting.push(socket);
				pair_up();
				break;
			case "ping":
				socket.send(JSON.stringify({ t: "pong" }));
				break;
		}
	};

	socket.onclose = () => remove(socket);

	return response;
});

console.log(`ws server on :${PORT}`);
