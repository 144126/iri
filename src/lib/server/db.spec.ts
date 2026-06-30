import { describe, it, expect, vi } from 'vitest';

const mockUpsert = vi.fn();
const mockQuery = vi.fn();

vi.mock('@qdrant/js-client-rest', () => ({
	QdrantClient: vi.fn().mockImplementation(function () {
		return { upsert: mockUpsert, query: mockQuery };
	})
}));

vi.mock('$env/static/private', () => ({
	QDRANT_URL: 'http://fake',
	QDRANT_KEY: 'fake-key'
}));

const { upsert_point, search } = await import('./db');

describe('upsert_point', () => {
	it('calls upsert with correct payload', async () => {
		await upsert_point('id-1', [0.1, 0.2], { t: 'hi', g: 'm', a: 25 });
		expect(mockUpsert).toHaveBeenCalledWith('i', {
			points: [{ id: 'id-1', vector: [0.1, 0.2], payload: { t: 'hi', g: 'm', a: 25, s: '' } }]
		});
	});
});

describe('search', () => {
	it('builds gender filter', async () => {
		mockQuery.mockResolvedValueOnce({ points: [] });
		await search([0.1, 0.2], { g: 'f' });
		expect(mockQuery).toHaveBeenCalledWith('i', {
			query: [0.1, 0.2],
			filter: { must: [{ key: 'g', match: { value: 'f' } }] },
			limit: 10,
			with_payload: true
		});
	});

	it('builds age range filter', async () => {
		mockQuery.mockResolvedValueOnce({ points: [] });
		await search([0.1, 0.2], { a_min: 18, a_max: 65 });
		expect(mockQuery).toHaveBeenCalledWith('i', {
			query: [0.1, 0.2],
			filter: { must: [{ key: 'a', range: { gte: 18, lte: 65 } }] },
			limit: 10,
			with_payload: true
		});
	});

	it('skips filter when no conditions', async () => {
		mockQuery.mockResolvedValueOnce({ points: [] });
		await search([0.1, 0.2], {});
		expect(mockQuery).toHaveBeenCalledWith('i', {
			query: [0.1, 0.2],
			filter: undefined,
			limit: 10,
			with_payload: true
		});
	});

	it('returns payloads from results', async () => {
		mockQuery.mockResolvedValueOnce({
			points: [{ payload: { t: 'hi', g: 'm', a: 30 } }, { payload: { t: 'bye', g: 'f', a: 25 } }]
		});
		const rows = await search([0.1], {});
		expect(rows).toEqual([
			{ t: 'hi', g: 'm', a: 30 },
			{ t: 'bye', g: 'f', a: 25 }
		]);
	});
});
