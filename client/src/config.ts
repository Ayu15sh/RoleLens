export const config = {
  llmApiKey: import.meta.env.VITE_LLM_API_KEY,
  llmModel: import.meta.env.VITE_LLM_MODEL || 'gemini-2.5-flash',
  llmProvider: import.meta.env.VITE_LLM_PROVIDER || 'gemini',
  embeddingModel: import.meta.env.VITE_EMBEDDING_MODEL || 'gemini-embedding-2',
  topK: parseInt(import.meta.env.VITE_TOP_K || '5', 10),
  chunkOverlap: parseInt(import.meta.env.VITE_CHUNK_OVERLAP || '50', 10),
  maxChunkSize: parseInt(import.meta.env.VITE_MAX_CHUNK_SIZE || '500', 10),
};
