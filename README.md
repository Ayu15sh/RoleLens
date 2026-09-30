# RoleLens — RAG-Powered Resume & Job Matching System

A full-stack stateless application that uses **Retrieval-Augmented Generation (RAG)** to analyze how well a resume matches a job description. Built with React, Express, and Gemini.

> This is **not** a simple "send resume + JD to ChatGPT" wrapper. The system implements a genuine RAG pipeline in-memory: chunk → embed → retrieve → augment → generate.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                          │
│                                                                     │
│  ┌────────────────────────┐  ┌────────────────────────┐            │
│  │ Resume Input (Text/PDF)│  │ JD Input (Text/PDF)    │            │
│  └───────────┬────────────┘  └───────────┬────────────┘            │
│              │                           │                         │
└──────────────┼───────────────────────────┼─────────────────────────┘
               │                           │
               ▼                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express) - Stateless                   │
│                                                                     │
│  ┌─────────────────────────────────────┐                            │
│  │         INGESTION PIPELINE          │                            │
│  │                                     │                            │
│  │  PDF Parsing / Text Extraction      │                            │
│  │       │                             │                            │
│  │       ▼                             │                            │
│  │  ┌──────────┐                       │                            │
│  │  │ Chunking │ (logical sections)    │                            │
│  │  └────┬─────┘                       │                            │
│  │       ▼                             │                            │
│  │  ┌──────────────┐                   │                            │
│  │  │  Embeddings  │ (Gemini API)      │                            │
│  │  └──────────────┘                   │                            │
│  └─────────────────────────────────────┘                            │
│                                                                     │
│  ┌─────────────────────────────────────┐                            │
│  │          RAG PIPELINE               │                            │
│  │                                     │                            │
│  │  Job Description Embedding          │                            │
│  │       │                             │                            │
│  │       ▼                             │                            │
│  │  ┌───────────────┐                  │                            │
│  │  │ Vector Search │ (cosine sim)     │                            │
│  │  └───────┬───────┘                  │                            │
│  │          ▼                          │                            │
│  │  ┌───────────────┐                  │                            │
│  │  │ Top-K Chunks  │ (retrieval)      │                            │
│  │  └───────┬───────┘                  │                            │
│  │          ▼                          │                            │
│  │  ┌───────────────┐                  │                            │
│  │  │  RAG Prompt   │ (augmentation)   │                            │
│  │  └───────┬───────┘                  │                            │
│  │          ▼                          │                            │
│  │  ┌───────────────┐                  │                            │
│  │  │  LLM (GPT-4o) │ (generation)    │──────────► JSON           │
│  │  └───────────────┘                  │                            │
│  └─────────────────────────────────────┘                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What is RAG?

**Retrieval-Augmented Generation (RAG)** is a technique that enhances LLM responses by first retrieving relevant information from an external knowledge base, then including that information as context in the LLM prompt.

### The RAG Pipeline

1. **Embeddings**: Text is converted into dense numerical vectors (arrays of floats) that capture semantic meaning. Texts about similar topics produce similar vectors, even with different words.
2. **Retrieval**: When a query arrives (the job description), we generate its embedding and search against the resume chunk embeddings for the most similar chunks (in-memory cosine similarity search). This is the "R" in RAG.
3. **Augmentation**: The retrieved chunks are inserted into the LLM prompt as context. Instead of the full document, the LLM sees only the most relevant pieces. This is the "A" in RAG.
4. **Generation**: The LLM generates a response grounded in the retrieved context. This is the "G" in RAG.

### Why not just send the whole resume to the LLM?

- **Token limits**: Long resumes may exceed the context window.
- **Noise reduction**: Irrelevant sections dilute the LLM's attention.
- **Precision**: The model performs better when given focused, relevant context.

---

## Why Embeddings?

Traditional keyword matching ("Does the resume contain 'Python'?") fails in many cases:

| Scenario | Keyword Match | Embedding Match |
|---|---|---|
| Resume says "ML" but job says "machine learning" | ✗ Miss | ✓ Match |
| Resume says "built REST APIs" but job says "API development" | ✗ Miss | ✓ Match |
| Resume says "Python" and job says "Python" but in different contexts | ✓ False positive | ✓ Context-aware |

Embeddings capture **semantic meaning**, not just lexical overlap. Two texts about the same concept will have high cosine similarity even if they use completely different words.

---

## Why Chunking?

### The Problem
Embedding models work best on focused, coherent text. A 2-page resume embedded as a single vector creates a "blurry" embedding that tries to represent everything (skills, education, experience) at once.

### The Solution
We split the resume into logical sections, each producing a focused embedding:
- "Skills" chunk → embedding that captures technical capabilities
- "Experience at TechCorp" → embedding that captures specific work history

---

## Why Top-K?

Top-K controls how many chunks are retrieved.

| K Value | Recall | Precision | Token Usage | Best For |
|---|---|---|---|---|
| K=3 | Lower | Higher | Minimal | Focused analysis, short resumes |
| K=5 | Balanced | Balanced | Moderate | Default — good tradeoff |
| K=10 | Higher | Lower | High | Comprehensive analysis, long resumes |

The `TOP_K` environment variable makes this easy to experiment with.

---

## API Documentation

### Health Check

```
GET /api/health
```

### Run Match Analysis (Full RAG Pipeline)

```
POST /api/match
Content-Type: multipart/form-data

formData.append('resumeText', '...'); // Or formData.append('resumeFile', file)
formData.append('jobDescriptionText', '...'); // Or formData.append('jobDescriptionFile', file)
```

Response (200):
```json
{
  "id": "uuid",
  "matchScore": 78,
  "analysis": {
    "matchScore": 78,
    "matchingSkills": ["Python", "React", "AWS"],
    "missingSkills": ["Rust", "gRPC"],
    "relevantExperience": ["4 years full-stack development"],
    "recommendations": ["Add Rust experience"],
    "explanation": "The candidate shows strong alignment with..."
  },
  "retrievedChunks": [
    {
      "id": "chunk-1",
      "content": "Senior Software Engineer at TechCorp...",
      "section": "Experience",
      "similarity": 0.89,
      "chunk_index": 1
    }
  ],
  "resumeId": "uuid",
  "jobDescriptionId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## AI Pipeline — Complete Request Lifecycle

When the user clicks "Analyze Match", the following happens:

```
1. Frontend → POST /api/match (with Text or PDF)
   a. Backend parses PDF (if uploaded) and extracts text
   b. Chunking service splits resume into logical sections
   c. Embedding service generates vectors for each chunk (batched API call)
   d. Generate embedding for the job description
   e. In-memory cosine similarity search:
      Calculates similarity between JD vector and all chunk vectors
   f. Retrieve Top-K most similar resume chunks
   g. Prompt builder constructs RAG prompt:
      [Job Description] + [Retrieved Chunks] + [Task Instructions]
   h. LLM generates structured JSON analysis
   i. Zod validates the LLM response
   j. Response returned to frontend (Stateless - nothing stored in DB)
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Gemini API key

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd jobmatch-ai

# 2. Create .env file
cp .env.example .env
# Edit .env with your Gemini API key

# 3. Install dependencies
cd server && npm install
cd ../client && npm install

# 4. Start the backend
cd server && npm run dev

# 5. Start the frontend (new terminal)
cd ../client && npm run dev

# 6. Open http://localhost:5173
```

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind | UI for text/PDF input and results display |
| Backend | Node.js + Express + TypeScript + Multer | REST API, PDF parsing, RAG orchestration |
| Storage | Stateless In-Memory | No database needed (deployable anywhere) |
| AI | Gemini API | Embeddings and LLM generation |
| Validation | Zod | LLM response validation |

---

## License

MIT
