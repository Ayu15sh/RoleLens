// Shared types between frontend and backend

export interface MatchAnalysis {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  relevantExperience: string[];
  recommendations: string[];
  explanation: string;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  section: string | null;
  similarity: number;
  chunk_index: number;
}

export interface ResumeResponse {
  id: string;
  name: string;
  rawText?: string;
  isIndexed: boolean;
  createdAt: string;
}

export interface IndexResponse {
  message: string;
  resumeId: string;
  chunksCreated: number;
  sections: string[];
}

export interface MatchResponse {
  id: string;
  matchScore: number;
  analysis: MatchAnalysis;
  retrievedChunks: RetrievedChunk[];
  resumeId: string;
  jobDescriptionId: string;
  createdAt: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
