import { openai } from '../embedding';
import { config } from '../../config';
import type { MatchAnalysis } from '../../types';
import { z } from 'zod';

/**
 * Zod schema for validating the LLM response.
 * Even with JSON mode, the LLM can return malformed data.
 * Validation ensures the rest of the pipeline can rely on the structure.
 */
const matchAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  relevantExperience: z.array(z.string()),
  recommendations: z.array(z.string()),
  explanation: z.string(),
});

/**
 * Send a prompt to the LLM and get a structured response.
 *
 * Uses JSON mode (response_format: json_object) to ensure the LLM
 * returns valid JSON. We then validate the structure with Zod
 * to catch any hallucinated or missing fields.
 */
export async function generateMatchAnalysis(
  prompt: string
): Promise<MatchAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: config.llmModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume analyst. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temperature for more consistent, factual analysis
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('LLM returned empty response');
    }

    // Parse and validate the JSON response
    let parsed: unknown;
    try {
      // Strip potential markdown fencing that Gemini sometimes adds even in JSON mode
      let jsonString = content.trim();
      if (jsonString.startsWith('```')) {
        const firstLineBreak = jsonString.indexOf('\\n');
        if (firstLineBreak !== -1) {
          jsonString = jsonString.slice(firstLineBreak + 1);
        }
        if (jsonString.endsWith('```')) {
          jsonString = jsonString.slice(0, -3);
        }
      }
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`LLM returned invalid JSON: ${content.substring(0, 500)}`);
    }

    const validated = matchAnalysisSchema.parse(parsed);
    return validated;
  } catch (error: any) {
    // Re-throw Zod validation errors with context
    if (error.name === 'ZodError') {
      throw new Error(
        `LLM response failed validation: ${error.errors.map((e: any) => e.message).join(', ')}`
      );
    }
    throw new Error(`LLM generation failed: ${error.message}`);
  }
}

/**
 * Extract job title and company from a job description.
 * Uses a lightweight LLM call for metadata extraction.
 */
export async function extractJobMetadata(
  prompt: string
): Promise<{ title: string | null; company: string | null }> {
  try {
    const response = await openai.chat.completions.create({
      model: config.llmModel,
      messages: [
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { title: null, company: null };

    let jsonString = content.trim();
    if (jsonString.startsWith('```')) {
      const firstLineBreak = jsonString.indexOf('\\n');
      if (firstLineBreak !== -1) {
        jsonString = jsonString.slice(firstLineBreak + 1);
      }
      if (jsonString.endsWith('```')) {
        jsonString = jsonString.slice(0, -3);
      }
    }

    const parsed = JSON.parse(jsonString);
    return {
      title: parsed.title || null,
      company: parsed.company || null,
    };
  } catch (e) {
    // Non-critical — metadata extraction failure shouldn't break the flow
    return { title: null, company: null };
  }
}
