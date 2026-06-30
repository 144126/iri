import { describe, it, expect, vi } from 'vitest';

const embedContent = vi.fn().mockResolvedValue({
	embedding: { values: [0.1, 0.2, 0.3] }
});

vi.mock('@google/generative-ai', () => ({
	GoogleGenerativeAI: vi.fn().mockImplementation(function () {
		return { getGenerativeModel: () => ({ embedContent }) };
	})
}));

vi.mock('$env/static/private', () => ({ GEMINI: 'fake-key' }));

const { embed } = await import('./embed');

describe('embed', () => {
	it('returns embedding vector for text', async () => {
		const v = await embed('hello');
		expect(Array.isArray(v)).toBe(true);
		expect(v.length).toBeGreaterThan(0);
	});
});
