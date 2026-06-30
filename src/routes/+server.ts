import { json } from '@sveltejs/kit';
import { embed } from '$lib/server/embed';
import { upsert_point, search } from '$lib/server/db';

export async function PUT({ request }) {
	const { t, g, a } = await request.json();
	const v = await embed(t);
	await upsert_point(crypto.randomUUID(), v, { t, g, a });
	return json({ ok: true });
}

export async function POST({ request }) {
	const { t, g, i, x } = await request.json();
	const v = await embed(t);
	const rows = await search(v, { g, a_min: i, a_max: x });
	return json(rows);
}
