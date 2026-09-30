// ============================================
// Database entity types
// ============================================

export interface Resume {
  id: string;
  name: string;
  raw_text: string;
  is_indexed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ResumeChunk {
  id: string;
  resume_id: string;
  section: string | null;
  content: string;
  embedding: number[] | null;
  chunk_index: number;
  token_count: number | null;
  created_at: Date;
}

export interface JobDescription {
  id: string;
  title: string | null;
  company: string | null;
  content: string;
  embedding: number[] | null;
  created_at: Date;
}

export interface MatchResult {
  id: string;
  resume_id: string;
  job_description_id: string;
  match_score: number;
  analysis_json: MatchAnalysis;
  retrieved_chunks: RetrievedChunkInfo[] | null;
  top_k: number;
  created_at: Date;
}

// ============================================
// RAG pipeline types
// ============================================

export interface Chunk {
  content: string;
  section: string;
  index: number;
  tokenCount: number;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  section: string | null;
  similarity: number;
  chunk_index: number;
}

export interface RetrievedChunkInfo {
  chunk_id: string;
  similarity: number;
  section: string | null;
}

// ============================================
// LLM response types
// ============================================

export interface MatchAnalysis {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  relevantExperience: string[];
  recommendations: string[];
  explanation: string;
}

// ============================================
// API request/response types
// ============================================

export interface CreateResumeRequest {
  name: string;
  rawText: string;
}

export interface MatchRequest {
  resumeId: string;
  jobDescription: string;
}

export interface MatchResponse {
  id: string;
  matchScore: number;
  analysis: MatchAnalysis;
  retrievedChunks: RetrievedChunk[];
  resumeId: string;
  jobDescriptionId: string;
  createdAt: Date;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================
// Evaluation types
// ============================================

export interface EvaluationTestCase {
  name: string;
  resumeText: string;
  jobDescription: string;
  /** Sections that should be retrieved for a good match */
  expectedSections: string[];
  /** Keywords that should appear in retrieved chunks */
  expectedKeywords: string[];
}

export interface EvaluationResult {
  testName: string;
  topK: number;
  recallAtK: number;
  precisionAtK: number;
  avgSimilarity: number;
  retrievedSections: string[];
  expectedSections: string[];
}
