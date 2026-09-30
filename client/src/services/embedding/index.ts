import OpenAI from 'openai';
import { config } from '../../config';

/**
 * OpenAI client instance.
 * Used for both embedding generation and LLM completions.
 * The API key is loaded from environment variables — never hardcoded.
 */
const openai = new OpenAI({
  apiKey: config.llmApiKey,
  baseURL: config.llmProvider === 'gemini' ? (typeof window !== 'undefined' ? window.location.origin : '') + '/gemini-api/v1beta/openai/' : undefined,
  dangerouslyAllowBrowser: true,
});

/**
 * Generate embeddings for one or more text inputs.
 *
 * Why embeddings?
 * - Embeddings convert text into dense numerical vectors that capture semantic meaning.
 * - Two texts about the same topic will have similar vectors, even if they use
 *   different words. This is far more powerful than keyword matching for
 *   finding relevant resume sections for a given job description.
 *
 * We use OpenAI's text-embedding-3-small (1536 dimensions) by default.
 * Batching multiple texts in one API call is more efficient.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  try {
    const response = await openai.embeddings.create({
      model: config.embeddingModel,
      input: texts,
    });

    // Sort by index to maintain input order
    const sorted = response.data.sort((a, b) => a.index - b.index);
    return sorted.map(item => item.embedding);
  } catch (error: any) {
    console.error('Embedding generation failed:', error.message);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

/**
 * Generate a single embedding for one text input.
 * Convenience wrapper around generateEmbeddings.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}

export { openai };
