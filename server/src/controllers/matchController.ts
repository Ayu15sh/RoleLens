import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { analyzeMatch } from '../services/rag';
const pdfParse = require('pdf-parse');

/**
 * Helper to extract text from a string or uploaded file
 */
async function extractText(
  textValue?: string,
  file?: Express.Multer.File
): Promise<string> {
  if (textValue && textValue.trim().length > 0) {
    return textValue.trim();
  }
  if (file) {
    if (file.mimetype !== 'application/pdf') {
      throw new AppError('Only PDF files are supported', 400);
    }
    try {
      const pdfData = await pdfParse(file.buffer);
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new AppError('Could not extract text from PDF or PDF is empty', 400);
      }
      return pdfData.text.trim();
    } catch (e: any) {
      throw new AppError(`Error parsing PDF: ${e.message}`, 400);
    }
  }
  throw new AppError('No text or file provided', 400);
}

/**
 * POST /api/match
 * Stateless RAG pipeline:
 * 1. Extract text from uploaded PDFs or raw text strings.
 * 2. Run analysis via the RAG service.
 * 3. Return results.
 */
export const matchHandler = asyncHandler(async (req: Request, res: Response) => {
  const { resumeText, jobDescriptionText } = req.body;
  
  // Cast req.files since we are using multer.fields
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  
  const resumeFile = files?.['resumeFile']?.[0];
  const jdFile = files?.['jobDescriptionFile']?.[0];

  const parsedResume = await extractText(resumeText, resumeFile);
  const parsedJd = await extractText(jobDescriptionText, jdFile);

  if (parsedResume.length < 50) {
    throw new AppError('Resume is too short — provide at least 50 characters of text or a valid PDF', 400);
  }
  if (parsedJd.length < 20) {
    throw new AppError('Job description is too short — provide at least 20 characters of text or a valid PDF', 400);
  }

  console.log(`Starting match analysis...`);
  const result = await analyzeMatch(parsedResume, parsedJd);

  res.status(200).json(result);
});
