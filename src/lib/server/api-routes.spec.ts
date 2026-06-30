import { describe, it, expect, vi } from 'vitest';

const mockEmbed = vi.fn();
const mockUpsertPoint = vi.fn();
const mockSearch = vi.fn();

vi.mock('$lib/server/embed', () => ({ embed: mockEmbed }));
vi.mock('$lib/server/db', () => ({ upsert_point: mockUpsertPoint, search: mockSearch }));

const { PUT, POST } = await import('../../routes/+server');

function req(body: unknown): { request: { json: () => Promise<unknown> } } {
	return { request: { json: async () => body } };
}

describe('PUT /', () => {
	it('embeds text and upserts point', async () => {
		mockEmbed.mockResolvedValueOnce([0.1, 0.2, 0.3]);
		const r = await PUT(req({ t: 'hello', g: 'm', a: 30 }) as unknown as Parameters<typeof PUT>[0]);
		expect(mockEmbed).toHaveBeenCalledWith('hello');
		expect(mockUpsertPoint).toHaveBeenCalled();
		const id = mockUpsertPoint.mock.calls[0][0];
		expect(id).toBeTypeOf('string');
		expect(mockUpsertPoint.mock.calls[0][1]).toEqual([0.1, 0.2, 0.3]);
		expect(mockUpsertPoint.mock.calls[0][2]).toEqual({ t: 'hello', g: 'm', a: 30 });
		const body = await r.json();
		expect(body).toEqual({ ok: true });
	});
});

describe('POST /', () => {
	it('embeds text and searches with filters', async () => {
		mockEmbed.mockResolvedValueOnce([0.1, 0.2]);
		mockSearch.mockResolvedValueOnce([{ t: 'result', g: 'f', a: 25 }]);
		const r = await POST(
			req({ t: 'query', g: 'f', i: 18, x: 65 }) as unknown as Parameters<typeof POST>[0]
		);
		expect(mockEmbed).toHaveBeenCalledWith('query');
		expect(mockSearch).toHaveBeenCalledWith([0.1, 0.2], { g: 'f', a_min: 18, a_max: 65 });
		const body = await r.json();
		expect(body).toEqual([{ t: 'result', g: 'f', a: 25 }]);
	});
});
