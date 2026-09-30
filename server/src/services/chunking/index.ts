import { Chunk } from '../../types';
import { config } from '../../config';

/**
 * Known resume section headers.
 * We use these to detect logical section boundaries in the resume text.
 * Order matters — more specific patterns should come first.
 */
const SECTION_PATTERNS: { pattern: RegExp; section: string }[] = [
  { pattern: /^(professional\s+)?summary/i, section: 'Summary' },
  { pattern: /^(career\s+)?objective/i, section: 'Summary' },
  { pattern: /^profile/i, section: 'Summary' },
  { pattern: /^about(\s+me)?/i, section: 'Summary' },
  { pattern: /^(work\s+)?experience/i, section: 'Experience' },
  { pattern: /^employment(\s+history)?/i, section: 'Experience' },
  { pattern: /^work\s+history/i, section: 'Experience' },
  { pattern: /^education/i, section: 'Education' },
  { pattern: /^academic/i, section: 'Education' },
  { pattern: /^(technical\s+)?skills/i, section: 'Skills' },
  { pattern: /^technologies/i, section: 'Skills' },
  { pattern: /^competenc/i, section: 'Skills' },
  { pattern: /^projects?/i, section: 'Projects' },
  { pattern: /^(personal\s+)?projects?/i, section: 'Projects' },
  { pattern: /^certifications?/i, section: 'Certifications' },
  { pattern: /^licenses?/i, section: 'Certifications' },
  { pattern: /^awards?/i, section: 'Achievements' },
  { pattern: /^achievements?/i, section: 'Achievements' },
  { pattern: /^honors?/i, section: 'Achievements' },
  { pattern: /^publications?/i, section: 'Publications' },
  { pattern: /^research/i, section: 'Research' },
  { pattern: /^volunteer/i, section: 'Volunteer' },
  { pattern: /^(additional\s+)?information/i, section: 'Additional' },
  { pattern: /^interests?/i, section: 'Interests' },
  { pattern: /^languages?/i, section: 'Languages' },
  { pattern: /^references?/i, section: 'References' },
  { pattern: /^contact/i, section: 'Contact' },
];

/**
 * Detect if a line is a section header.
 * Returns the section name if matched, null otherwise.
 */
function detectSection(line: string): string | null {
  const trimmed = line.trim()
    .replace(/^#+\s*/, '')   // Remove markdown headers
    .replace(/^[-=*]{2,}$/, '')  // Remove separator lines
    .replace(/[:\-_|]/g, ' ')   // Normalize separators
    .trim();

  if (!trimmed || trimmed.length > 60) return null;

  for (const { pattern, section } of SECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return section;
    }
  }
  return null;
}

/**
 * Rough token count estimation.
 * ~4 characters per token is a standard approximation for English text.
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split a long text block into smaller chunks based on paragraph boundaries.
 * Used as fallback when a single section is too large.
 */
function splitByParagraphs(
  text: string,
  section: string,
  startIndex: number,
  maxSize: number,
  overlap: number
): Chunk[] {
  const chunks: Chunk[] = [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

  let currentChunk = '';
  let chunkIdx = startIndex;

  for (const paragraph of paragraphs) {
    const combined = currentChunk
      ? currentChunk + '\n\n' + paragraph
      : paragraph;

    if (estimateTokenCount(combined) > maxSize && currentChunk) {
      // Save current chunk and start a new one
      chunks.push({
        content: currentChunk.trim(),
        section,
        index: chunkIdx++,
        tokenCount: estimateTokenCount(currentChunk.trim()),
      });

      // Apply overlap: carry the last portion of the previous chunk
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-overlap);
      currentChunk = overlapWords.join(' ') + '\n\n' + paragraph;
    } else {
      currentChunk = combined;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      section,
      index: chunkIdx,
      tokenCount: estimateTokenCount(currentChunk.trim()),
    });
  }

  return chunks;
}

/**
 * Main chunking function.
 *
 * Strategy:
 * 1. Try to split the resume into logical sections (Summary, Experience, etc.)
 *    by detecting section headers.
 * 2. If a section is too large, sub-split it by paragraphs with overlap.
 * 3. If no sections are detected (unstructured text), fall back to
 *    paragraph-based chunking with overlap.
 *
 * Why chunking matters for RAG:
 * - Embedding models have token limits and work best on focused text.
 * - Smaller, semantically coherent chunks produce better embeddings.
 * - Vector search can then retrieve only the most relevant parts of a resume
 *   rather than the entire document, reducing noise in the LLM context.
 */
export function chunkResume(rawText: string): Chunk[] {
  const lines = rawText.split('\n');
  const maxSize = config.maxChunkSize;
  const overlap = config.chunkOverlap;

  // Phase 1: Detect section boundaries
  interface RawSection {
    section: string;
    lines: string[];
  }

  const sections: RawSection[] = [];
  let currentSection: RawSection = { section: 'Header', lines: [] };

  for (const line of lines) {
    const detectedSection = detectSection(line);

    if (detectedSection) {
      // Save the previous section if it has content
      if (currentSection.lines.some(l => l.trim())) {
        sections.push(currentSection);
      }
      currentSection = { section: detectedSection, lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }

  // Push the last section
  if (currentSection.lines.some(l => l.trim())) {
    sections.push(currentSection);
  }

  // Phase 2: If no meaningful sections were detected, use paragraph-based chunking
  if (sections.length <= 1) {
    console.log('No section headers detected — falling back to paragraph chunking');
    return splitByParagraphs(rawText, 'General', 0, maxSize, overlap);
  }

  // Phase 3: Convert sections to chunks, splitting large sections
  const chunks: Chunk[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    const sectionText = section.lines.join('\n').trim();
    if (!sectionText) continue;

    const tokenCount = estimateTokenCount(sectionText);

    if (tokenCount <= maxSize) {
      // Section fits in one chunk
      chunks.push({
        content: sectionText,
        section: section.section,
        index: globalIndex++,
        tokenCount,
      });
    } else {
      // Section is too large — split by paragraphs
      const subChunks = splitByParagraphs(
        sectionText,
        section.section,
        globalIndex,
        maxSize,
        overlap
      );
      chunks.push(...subChunks);
      globalIndex += subChunks.length;
    }
  }

  console.log(
    `Chunked resume into ${chunks.length} chunks across sections: ` +
    `[${[...new Set(chunks.map(c => c.section))].join(', ')}]`
  );

  return chunks;
}
