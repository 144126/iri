import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_URL, QDRANT_KEY } from '$env/static/private';

const C = 'i';

const c = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_KEY });

export async function upsert_point(
	id: string,
	vector: number[],
	payload: { t: string; g: string; a: number }
) {
	await c.upsert(C, {
		points: [{ id, vector, payload: { ...payload, s: '' } }]
	});
}

export async function search(
	qVector: number[],
	filter: { g?: string; a_min?: number; a_max?: number }
) {
	const must: Record<string, unknown>[] = [];
	if (filter.g) must.push({ key: 'g', match: { value: filter.g } });
	if (filter.a_min !== undefined || filter.a_max !== undefined) {
		const r: Record<string, number> = {};
		if (filter.a_min !== undefined) r.gte = filter.a_min;
		if (filter.a_max !== undefined) r.lte = filter.a_max;
		must.push({ key: 'a', range: r });
	}
	const r = await c.query(C, {
		query: qVector,
		filter: must.length ? { must } : undefined,
		limit: 10,
		with_payload: true
	});
	return r.points.map((p) => p.payload as { t: string; g: string; a: number });
}
