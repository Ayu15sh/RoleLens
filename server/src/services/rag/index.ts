import { chunkResume } from '../chunking';
import { generateEmbeddings, generateEmbedding } from '../embedding';
import { searchSimilarChunksInMemory } from '../retrieval';
import { buildMatchPrompt, buildJobExtractionPrompt } from '../llm/prompts';
import { generateMatchAnalysis } from '../llm';
import { MatchResponse, Chunk } from '../../types';
import { config } from '../../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Full stateless RAG match pipeline.
 *
 * 1. Chunk the resume text
 * 2. Generate embeddings for resume chunks
 * 3. Generate embedding for the job description
 * 4. In-memory vector similarity search → retrieve Top-K chunks
 * 5. Build RAG prompt with retrieved context
 * 6. Send to LLM for structured analysis
 * 7. Return results directly (no DB storage)
 */
export async function analyzeMatch(
  resumeText: string,
  jobDescriptionText: string
): Promise<MatchResponse> {
  // Step 1: Chunk the resume
  console.log(`Chunking resume...`);
  const chunks = chunkResume(resumeText);
  if (chunks.length === 0) {
    throw new Error('Resume produced no chunks — text may be empty or unparseable');
  }

  // Step 2: Generate embeddings for resume chunks
  console.log(`Generating embeddings for ${chunks.length} chunks...`);
  const chunkTexts = chunks.map(c => c.content);
  const chunkEmbeddings = await generateEmbeddings(chunkTexts);

  const chunksWithEmbeddings = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: chunkEmbeddings[i],
  }));

  // Step 3: Vector similarity search (In-Memory)
  console.log(`Searching for top ${config.topK} similar chunks...`);
  const retrievedChunks = await searchSimilarChunksInMemory(
    chunksWithEmbeddings,
    jobDescriptionText,
    config.topK
  );

  console.log(
    `Retrieved ${retrievedChunks.length} chunks:`,
    retrievedChunks.map(c => `${c.section} (${(c.similarity * 100).toFixed(1)}%)`)
  );

  if (retrievedChunks.length === 0) {
    throw new Error('No relevant resume chunks found');
  }

  // Step 4: Build RAG prompt with retrieved context
  const prompt = buildMatchPrompt(jobDescriptionText, retrievedChunks);

  // Step 5: Send to LLM for analysis
  console.log('Sending RAG prompt to LLM...');
  const analysis = await generateMatchAnalysis(prompt);

  // Step 6: Return formatted response
  const resumeId = uuidv4();
  const jobDescriptionId = uuidv4();
  const matchId = uuidv4();

  return {
    id: matchId,
    matchScore: analysis.matchScore,
    analysis,
    retrievedChunks,
    resumeId,
    jobDescriptionId,
    createdAt: new Date(),
  };
}
