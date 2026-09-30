import type { Chunk, RetrievedChunk } from '../../types';
import { generateEmbedding } from '../embedding';
import { config } from '../../config';

/**
 * Calculates cosine similarity between two vectors.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * In-memory vector similarity search.
 *
 * Given a job description and a list of resume chunks (with embeddings), this function:
 * 1. Generates an embedding for the job description text.
 * 2. Calculates cosine similarity between the job description and each chunk.
 * 3. Returns the Top-K chunks ranked by similarity.
 */
export async function searchSimilarChunksInMemory(
  resumeChunks: (Chunk & { embedding: number[] })[],
  jobDescriptionText: string,
  topK?: number
): Promise<RetrievedChunk[]> {
  const k = topK ?? config.topK;

  // Step 1: Generate embedding for the job description
  const jobEmbedding = await generateEmbedding(jobDescriptionText);

  // Step 2: Calculate similarity for all chunks
  const scoredChunks = resumeChunks.map(chunk => {
    const similarity = cosineSimilarity(jobEmbedding, chunk.embedding);
    return {
      id: `chunk-${chunk.chunk_index}`,
      content: chunk.content,
      section: chunk.section,
      similarity,
      chunk_index: chunk.chunk_index,
      tokenCount: chunk.tokenCount,
    };
  });

  // Step 3: Sort by similarity descending and take Top-K
  scoredChunks.sort((a, b) => b.similarity - a.similarity);
  return scoredChunks.slice(0, k);
}
