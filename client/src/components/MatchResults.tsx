import type { MatchResponse } from '../types';

interface Props {
  result: MatchResponse;
}

export function MatchResults({ result }: Props) {
  const { analysis, retrievedChunks } = result;

  const scoreColor =
    analysis.matchScore >= 75
      ? 'var(--color-success)'
      : analysis.matchScore >= 50
        ? '#eab308'
        : 'var(--color-error)';

  return (
    <div className="space-y-6">
      {/* ===== MATCH SCORE ===== */}
      <div className="brutal-card-shadow p-8 text-center">
        <div
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        >
          Match Score
        </div>
        <div
          className="text-7xl sm:text-8xl font-bold tracking-[-4px]"
          style={{ fontFamily: 'var(--font-display)', color: scoreColor }}
        >
          {analysis.matchScore}
          <span className="text-3xl">%</span>
        </div>
      </div>

      {/* ===== SKILLS GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matching Skills */}
        <div className="brutal-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: 'var(--color-success)' }}
            />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Matching Skills ({analysis.matchingSkills.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.matchingSkills.map((skill, i) => (
              <span
                key={i}
                className="brutal-tag"
                style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
              >
                {skill}
              </span>
            ))}
            {analysis.matchingSkills.length === 0 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                No matching skills found
              </span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="brutal-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: 'var(--color-error)' }}
            />
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Missing Skills ({analysis.missingSkills.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.missingSkills.map((skill, i) => (
              <span
                key={i}
                className="brutal-tag"
                style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
              >
                {skill}
              </span>
            ))}
            {analysis.missingSkills.length === 0 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                No missing skills identified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== RELEVANT EXPERIENCE ===== */}
      {analysis.relevantExperience.length > 0 && (
        <div className="brutal-card p-6">
          <div
            className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Relevant Experience
          </div>
          <div className="space-y-3">
            {analysis.relevantExperience.map((exp, i) => (
              <div
                key={i}
                className="flex gap-3 items-start text-sm"
              >
                <span
                  className="mt-1 inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-accent-cyan)' }}
                />
                <span style={{ color: 'var(--color-text)' }}>{exp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== RECOMMENDATIONS ===== */}
      {analysis.recommendations.length > 0 && (
        <div className="brutal-card p-6" style={{ borderColor: 'var(--color-accent-yellow)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: 'var(--color-accent-yellow)', fontFamily: 'var(--font-display)' }}
            >
              !
            </div>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Recommendations
            </span>
          </div>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 items-start text-sm">
                <span
                  className="text-xs font-bold mt-0.5 flex-shrink-0"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== EXPLANATION ===== */}
      <div className="brutal-card p-6">
        <div
          className="text-xs font-bold uppercase tracking-wider mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Analysis Explanation
        </div>
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--color-text)' }}
        >
          {analysis.explanation}
        </p>
      </div>

      {/* ===== RETRIEVED CHUNKS (RAG DEBUG) ===== */}
      <details className="brutal-card">
        <summary
          className="p-6 cursor-pointer select-none flex items-center justify-between"
        >
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
          >
            Retrieved Chunks ({retrievedChunks.length}) — RAG Debug
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            ▾
          </span>
        </summary>
        <div className="px-6 pb-6 space-y-3">
          {retrievedChunks.map((chunk, i) => (
            <div key={i} className="brutal-card p-4" style={{ background: 'var(--color-bg)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="brutal-badge"
                    style={{
                      padding: '2px 8px',
                      fontSize: '10px',
                      backgroundColor: 'var(--color-accent-cyan)',
                    }}
                  >
                    {chunk.section || 'General'}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    Chunk #{chunk.chunk_index}
                  </span>
                </div>
                <span
                  className="text-[11px] font-bold"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: chunk.similarity > 0.8 ? 'var(--color-success)' : 'var(--color-text-muted)',
                  }}
                >
                  {(chunk.similarity * 100).toFixed(1)}% sim
                </span>
              </div>
              <p
                className="text-[11px] leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {chunk.content.substring(0, 400)}
                {chunk.content.length > 400 && '...'}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
