import { useState } from 'react';
import { toKeys, correctKeys, sameSet } from '../answers.js';

function fmtDuration(s) {
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export default function Results({ attempt, onExit }) {
  const [filter, setFilter] = useState('all'); // all | wrong
  const [openQ, setOpenQ] = useState({});
  const { overall, sections, cases, review } = attempt;
  const runnerUpTraps = (cases ?? []).reduce((n, c) => n + c.runnerUpPicks, 0);

  const shown = review.filter((r) => (filter === 'all' ? true : !sameSet(r.chosen, correctKeys(r))));

  return (
    <div className="results">
      <div className="exam-header">
        <div><strong>{attempt.examTitle} — Results</strong></div>
        <button className="btn ghost" onClick={onExit}>Back to Home</button>
      </div>

      <div className={`score-hero ${overall.passed ? 'pass-bg' : 'fail-bg'}`}>
        <div className="score-big">{overall.scaledScore}</div>
        <div className="score-hero-detail">
          <div className={`score-verdict ${overall.passed ? 'pass' : 'fail'}`}>
            {overall.passed ? 'PASS' : 'FAIL'}
          </div>
          <div>Passing score: {overall.passingScore} / 1000</div>
          <div>
            Overall: {overall.correct}/{overall.total} correct ({overall.percentage}%)
          </div>
          <div>Time used: {fmtDuration(attempt.elapsedSeconds)}</div>
        </div>
      </div>

      <h3>Score by Exam Section</h3>
      <table className="history-table sections-table">
        <thead>
          <tr><th>Section</th><th>Correct</th><th>Percentage</th><th></th></tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.domainId}>
              <td>{s.domainId} — {s.domainName}</td>
              <td>{s.correct}/{s.total}</td>
              <td>{s.percentage}%</td>
              <td className="bar-cell">
                <div className="bar-track">
                  <div
                    className={`bar-fill ${s.percentage >= 70 ? 'bar-good' : s.percentage >= 50 ? 'bar-mid' : 'bar-bad'}`}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {cases?.length > 0 && (
        <>
          <h3>Score by Case Study</h3>
          <table className="history-table sections-table">
            <thead>
              <tr><th>Case</th><th>Correct</th><th>Percentage</th><th>Close-second picks</th><th></th></tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.caseId}>
                  <td>{c.caseId} — {c.caseTitle}</td>
                  <td>{c.correct}/{c.total}</td>
                  <td>{c.percentage}%</td>
                  <td>{c.runnerUpPicks}</td>
                  <td className="bar-cell">
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${c.percentage >= 70 ? 'bar-good' : c.percentage >= 50 ? 'bar-mid' : 'bar-bad'}`}
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {runnerUpTraps > 0 && (
            <p className="muted trap-note">
              You picked the defensible-but-weaker option on {runnerUpTraps} question
              {runnerUpTraps === 1 ? '' : 's'}. Those are the ones worth re-reading first — the design
              was sound, it just dropped one of the case requirements.
            </p>
          )}
        </>
      )}

      <div className="review-header">
        <h3>Question Review</h3>
        <div>
          <button className={`btn tiny ${filter === 'all' ? '' : 'ghost'}`} onClick={() => setFilter('all')}>
            All ({review.length})
          </button>{' '}
          <button className={`btn tiny ${filter === 'wrong' ? '' : 'ghost'}`} onClick={() => setFilter('wrong')}>
            Incorrect only
          </button>
        </div>
      </div>

      {shown.map((r) => {
        const chosenKeys = toKeys(r.chosen);
        const isCorrect = sameSet(chosenKeys, correctKeys(r));
        const open = !!openQ[r.id];
        return (
          <div key={r.id} className={`review-card ${isCorrect ? 'rc-right' : 'rc-wrong'}`}>
            <button className="review-toggle" onClick={() => setOpenQ((o) => ({ ...o, [r.id]: !o[r.id] }))}>
              <span className={`rc-badge ${isCorrect ? 'pass' : 'fail'}`}>{isCorrect ? '✔' : '✘'}</span>
              <span className="rc-domain">{r.caseId ? `${r.caseId} · ${r.domainId}` : r.domainId}</span>
              <span className="rc-q">{r.question}</span>
              <span className="rc-chevron">{open ? '▾' : '▸'}</span>
            </button>
            {open && (
              <div className="review-body">
                {r.options.map((o) => (
                  <div
                    key={o.key}
                    className={`option ${o.correct ? 'correct' : o.runnerUp ? 'runner-up' : chosenKeys.includes(o.key) ? 'incorrect' : 'neutral'}`}
                  >
                    <div className="option-btn as-static">
                      <span className="option-key">{o.key}</span>
                      <span>
                        {o.text}
                        {o.runnerUp && <em className="close-second"> — close second</em>}
                        {chosenKeys.includes(o.key) && <em className="you-chose"> — your answer</em>}
                      </span>
                    </div>
                    <div className="explanation">
                      <p>{o.explanation}</p>
                      <a className="citation" href={o.citation.url} target="_blank" rel="noreferrer">
                        📄 {o.citation.title}
                      </a>
                    </div>
                  </div>
                ))}
                {chosenKeys.length === 0 && <p className="muted">You did not answer this question.</p>}
                {chosenKeys.length > 0 && chosenKeys.length < correctKeys(r).length && (
                  <p className="muted">
                    This was a select-{correctKeys(r).length} question and you chose only{' '}
                    {chosenKeys.length}. Partial selections score zero.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
