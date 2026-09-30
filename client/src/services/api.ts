import type { MatchResponse, ApiError } from '../types';

const API_BASE = '/api';

/**
 * Run the full RAG match analysis (stateless).
 */
export async function analyzeMatch(formData: FormData): Promise<MatchResponse> {
  const response = await fetch(`${API_BASE}/match`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'NetworkError',
      message: `Request failed with status ${response.status}`,
      statusCode: response.status,
    }));
    throw new Error(error.message);
  }

  return response.json();
}
