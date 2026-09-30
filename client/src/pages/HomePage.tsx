import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { analyzeMatch } from '../services/rag';
import { extractTextFromPDF } from '../services/pdf';
import type { MatchResponse } from '../types';
import { MatchResults } from '../components/MatchResults';

type Status = 'idle' | 'analyzing' | 'done' | 'error';
type InputType = 'text' | 'pdf';

const STATUS_LABELS: Record<Status, string> = {
  idle: '',
  analyzing: 'Processing & Analyzing...',
  done: 'Analysis complete!',
  error: 'Something went wrong.',
};

export function HomePage() {
  const [resumeType, setResumeType] = useState<InputType>('text');
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [jdType, setJdType] = useState<InputType>('text');
  const [jobDescription, setJobDescription] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<MatchResponse | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const isProcessing = status === 'analyzing';

  const isResumeValid = resumeType === 'text'
    ? resumeText.trim().length >= 50
    : resumeFile !== null;

  const isJdValid = jdType === 'text'
    ? jobDescription.trim().length >= 20
    : jdFile !== null;

  const canSubmit = isResumeValid && isJdValid && !isProcessing;

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      setFile(file);
    }
  };

  async function handleAnalyze() {
    setError('');
    setResult(null);

    try {
      setStatus('analyzing');
      
      let parsedResume = '';
      if (resumeType === 'text') {
        parsedResume = resumeText.trim();
      } else if (resumeFile) {
        parsedResume = await extractTextFromPDF(resumeFile);
      }

      let parsedJd = '';
      if (jdType === 'text') {
        parsedJd = jobDescription.trim();
      } else if (jdFile) {
        parsedJd = await extractTextFromPDF(jdFile);
      }

      if (parsedResume.length < 50) {
        throw new Error('Resume is too short — provide at least 50 characters of text or a valid PDF');
      }
      if (parsedJd.length < 20) {
        throw new Error('Job description is too short — provide at least 20 characters of text or a valid PDF');
      }

      const matchResult = await analyzeMatch(parsedResume, parsedJd);
      setResult(matchResult);
      setStatus('done');

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'An unexpected error occurred');
    }
  }

  function handleReset() {
    setResumeText('');
    setResumeFile(null);
    setJobDescription('');
    setJdFile(null);
    setResult(null);
    setStatus('idle');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen">
      <nav className="brutal-nav mx-4 mt-4 sm:mx-8 sm:mt-6 px-6 py-4 flex items-center justify-between">
        <span
          className="font-display text-lg font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ROLELENS
        </span>
        {result && (
          <button onClick={handleReset} className="brutal-btn-outline">
            New Match
          </button>
        )}
      </nav>

      <main className="mx-4 sm:mx-8 mt-8 sm:mt-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start">
            
            {/* Left Column */}
            <div>
              <div className="mb-6">
                <span className="brutal-badge">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-accent-cyan)' }}
                  />
                  RAG Powered
                </span>
              </div>
              <h1
                className="text-5xl sm:text-6xl lg:text-[68px] font-bold leading-[0.95] tracking-[-2px] mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                RESUME MATCH,
                <br />
                <span className="highlight">AMPLIFIED</span>
              </h1>
              <p
                className="text-sm leading-relaxed mb-10 max-w-md"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                RoleLens connects to your resume and
                brings AI-powered analysis directly into your
                job search workflow.
              </p>
              
              {/* Feature Cards */}
              <div className="space-y-3 max-w-md">
                <div className="feature-card">
                  <div className="feature-icon" style={{ backgroundColor: 'var(--color-accent-cyan)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M12 1L14.6 9.4L23 12L14.6 14.6L12 23L9.4 14.6L1 12L9.4 9.4Z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                      Vector Search
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Semantic similarity matching
                    </div>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon" style={{ backgroundColor: 'var(--color-accent-cyan)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="20" height="20">
                      <circle cx="12" cy="12" r="7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                      Smart Chunking
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Section-aware text splitting
                    </div>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-icon" style={{ backgroundColor: 'var(--color-accent-yellow)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700 }}>{'{·}'}</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                      LLM Analysis
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Structured AI scoring
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="brutal-card p-6 sm:p-8">
              <h2
                className="text-xl font-bold tracking-tight uppercase mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Match Your Resume
              </h2>
              <p className="text-xs mb-0" style={{ color: 'var(--color-text-muted)' }}>
                Provide your resume and a job description to analyze the match.
              </p>
              <hr className="brutal-divider" />

              {/* Resume Input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                    Resume
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setResumeType('text')} 
                      className={`text-[10px] uppercase px-2 py-1 rounded border-2 font-bold ${resumeType === 'text' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-transparent text-[#1a1a1a] border-[#1a1a1a]'}`}
                    >
                      Text
                    </button>
                    <button 
                      onClick={() => setResumeType('pdf')} 
                      className={`text-[10px] uppercase px-2 py-1 rounded border-2 font-bold ${resumeType === 'pdf' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-transparent text-[#1a1a1a] border-[#1a1a1a]'}`}
                    >
                      PDF
                    </button>
                  </div>
                </div>

                {resumeType === 'text' ? (
                  <>
                    <textarea
                      value={resumeText}
                      onChange={e => setResumeText(e.target.value)}
                      placeholder="Paste your resume here..."
                      rows={5}
                      className="brutal-textarea"
                      disabled={isProcessing}
                    />
                    <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {resumeText.length} chars · min 50
                    </div>
                  </>
                ) : (
                  <div className="brutal-card p-4 flex flex-col items-center justify-center min-h-[120px] bg-[#f8f8f5] text-center relative border-dashed border-2">
                    {resumeFile ? (
                      <div className="w-full flex flex-col items-center gap-2">
                        <div className="font-bold text-sm">📄 {resumeFile.name}</div>
                        <div className="text-xs text-gray-500">{(resumeFile.size / 1024).toFixed(1)} KB</div>
                        <button onClick={() => setResumeFile(null)} className="text-xs underline text-red-500 mt-2 font-bold">Remove</button>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-2 cursor-pointer">
                        <input 
                          type="file" 
                          accept=".pdf" 
                          onChange={e => handleFileChange(e, setResumeFile)} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isProcessing}
                        />
                        <div className="font-bold text-sm uppercase">Upload PDF</div>
                        <div className="text-xs text-gray-500">Drop your PDF here or click to browse</div>
                        <div className="text-[10px] text-gray-400 mt-1">PDF only • Max 10 MB</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Job Description Input */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                    Job Description
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setJdType('text')} 
                      className={`text-[10px] uppercase px-2 py-1 rounded border-2 font-bold ${jdType === 'text' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-transparent text-[#1a1a1a] border-[#1a1a1a]'}`}
                    >
                      Text
                    </button>
                    <button 
                      onClick={() => setJdType('pdf')} 
                      className={`text-[10px] uppercase px-2 py-1 rounded border-2 font-bold ${jdType === 'pdf' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-transparent text-[#1a1a1a] border-[#1a1a1a]'}`}
                    >
                      PDF
                    </button>
                  </div>
                </div>

                {jdType === 'text' ? (
                  <>
                    <textarea
                      value={jobDescription}
                      onChange={e => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      rows={5}
                      className="brutal-textarea"
                      disabled={isProcessing}
                    />
                    <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      {jobDescription.length} chars · min 20
                    </div>
                  </>
                ) : (
                  <div className="brutal-card p-4 flex flex-col items-center justify-center min-h-[120px] bg-[#f8f8f5] text-center relative border-dashed border-2">
                    {jdFile ? (
                      <div className="w-full flex flex-col items-center gap-2">
                        <div className="font-bold text-sm">📄 {jdFile.name}</div>
                        <div className="text-xs text-gray-500">{(jdFile.size / 1024).toFixed(1)} KB</div>
                        <button onClick={() => setJdFile(null)} className="text-xs underline text-red-500 mt-2 font-bold">Remove</button>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-2 cursor-pointer">
                        <input 
                          type="file" 
                          accept=".pdf" 
                          onChange={e => handleFileChange(e, setJdFile)} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isProcessing}
                        />
                        <div className="font-bold text-sm uppercase">Upload PDF</div>
                        <div className="text-xs text-gray-500">Drop your PDF here or click to browse</div>
                        <div className="text-[10px] text-gray-400 mt-1">PDF only • Max 10 MB</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="brutal-card mb-4 p-4 flex items-center gap-3" style={{ background: 'var(--color-bg)' }}>
                  <div className="brutal-spinner" />
                  <div>
                    <div className="text-xs font-bold uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                      {STATUS_LABELS[status]}
                    </div>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="brutal-card mb-4 p-4" style={{ borderColor: 'var(--color-error)', background: '#fef2f2' }}>
                  <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-error)', fontFamily: 'var(--font-display)' }}>
                    Error
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-error)' }}>
                    {error}
                  </div>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!canSubmit || isProcessing}
                className="brutal-btn"
              >
                {isProcessing ? (
                  <>
                    <div className="brutal-spinner-light" />
                    Processing...
                  </>
                ) : (
                  <>
                    Analyze Match
                    <span>→</span>
                  </>
                )}
              </button>
              
              <p className="text-center mt-4 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Uses <u>in-memory RAG</u> for semantic search and <u>Gemini</u> for analysis.
              </p>
            </div>
          </div>
        </div>
      </main>

      {result && (
        <section ref={resultsRef} className="mx-4 sm:mx-8 mt-12 mb-16">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <hr className="brutal-divider flex-1" />
              <span className="text-sm font-bold uppercase tracking-widest whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
                Results
              </span>
              <hr className="brutal-divider flex-1" />
            </div>
            <MatchResults result={result} />
          </div>
        </section>
      )}

      <footer className="mx-4 sm:mx-8 mb-6 mt-16">
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Built with React · Express · Gemini — Genuine RAG pipeline (Stateless)
          </p>
        </div>
      </footer>
    </div>
  );
}
