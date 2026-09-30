import { RetrievedChunk } from '../../types';

/**
 * Build the RAG prompt that will be sent to the LLM.
 *
 * This is the "Augmentation" step in Retrieval-Augmented Generation.
 * Instead of sending the entire resume (which may be noisy and exceed token limits),
 * we send only the most relevant chunks retrieved via vector similarity search.
 *
 * The prompt has three sections:
 * 1. JOB DESCRIPTION — the full job description
 * 2. RELEVANT RESUME CONTEXT — the Top-K retrieved chunks with section labels
 *    and similarity scores (for transparency)
 * 3. TASK — structured instructions telling the LLM exactly what to analyze
 *    and what JSON format to return
 */
export function buildMatchPrompt(
  jobDescription: string,
  retrievedChunks: RetrievedChunk[]
): string {
  const chunksText = retrievedChunks
    .map((chunk, i) => {
      const sectionLabel = chunk.section ? `[${chunk.section}]` : '[General]';
      const score = (chunk.similarity * 100).toFixed(1);
      return `--- Chunk ${i + 1} ${sectionLabel} (Relevance: ${score}%) ---\n${chunk.content}`;
    })
    .join('\n\n');

  return `You are an expert resume analyst and career advisor. Your task is to analyze how well a candidate's resume matches a specific job description.

You will be given:
1. A job description
2. The most relevant sections from the candidate's resume (retrieved via semantic search)

Analyze the match carefully and provide a structured assessment.

=== JOB DESCRIPTION ===

${jobDescription}

=== RELEVANT RESUME CONTEXT ===

${chunksText}

=== TASK ===

Based on the job description and the relevant resume sections provided above, analyze the candidate's fit for this role.

Return your analysis as a JSON object with the following structure:

{
  "matchScore": <number between 0 and 100 representing overall match percentage>,
  "matchingSkills": [<list of skills/technologies from the resume that match the job requirements>],
  "missingSkills": [<list of skills/technologies required by the job but not found in the resume>],
  "relevantExperience": [<list of specific experiences from the resume that are relevant to this job>],
  "recommendations": [<list of actionable suggestions for the candidate to improve their fit>],
  "explanation": "<2-3 paragraph explanation of the match analysis, discussing strengths, gaps, and overall assessment>"
}

Important guidelines:
- Base your analysis ONLY on the resume context provided. Do not assume skills not mentioned.
- Be specific when listing skills — use exact technology names.
- Recommendations should be actionable and specific to this job description.
- The match score should genuinely reflect the alignment between resume and job.
- If key information appears to be missing from the retrieved context, note that in the explanation.

Return ONLY the JSON object, no additional text.`;
}

/**
 * Build a simpler prompt for extracting the job title and company
 * from a job description (used when storing the JD).
 */
export function buildJobExtractionPrompt(jobDescription: string): string {
  return `Extract the job title and company name from this job description. Return a JSON object with "title" and "company" fields. If either is not found, use null.

Job Description:
${jobDescription.substring(0, 500)}

Return ONLY the JSON object.`;
}
