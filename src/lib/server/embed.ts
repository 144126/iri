import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI } from '$env/static/private';

const genAI = new GoogleGenerativeAI(GEMINI);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

export async function embed(text: string): Promise<number[]> {
	const r = await model.embedContent(text);
	return r.embedding.values;
}
