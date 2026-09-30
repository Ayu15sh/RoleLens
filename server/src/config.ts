import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (one level up from server/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  llmApiKey: string;
  llmModel: string;
  llmProvider: string;
  embeddingModel: string;
  topK: number;
  chunkOverlap: number;
  maxChunkSize: number;
  clientUrl: string;
  nodeEnv: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  port: parseInt(getEnvVar('PORT', '5000'), 10),
  llmApiKey: getEnvVar('LLM_API_KEY'),
  llmModel: getEnvVar('LLM_MODEL', 'gpt-4o-mini'),
  llmProvider: getEnvVar('LLM_PROVIDER', 'openai'),
  embeddingModel: getEnvVar('EMBEDDING_MODEL', 'text-embedding-3-small'),
  topK: parseInt(getEnvVar('TOP_K', '5'), 10),
  chunkOverlap: parseInt(getEnvVar('CHUNK_OVERLAP', '50'), 10),
  maxChunkSize: parseInt(getEnvVar('MAX_CHUNK_SIZE', '500'), 10),
  clientUrl: getEnvVar('CLIENT_URL', 'http://localhost:5173'),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
};
