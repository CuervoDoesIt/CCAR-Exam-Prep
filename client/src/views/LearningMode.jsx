import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { loadProgress, saveProgress, clearProgress } from '../progress.js';
import CasePanel from '../components/CasePanel.jsx';

export default function LearningMode({ examId, onExit }) {
  const storageKey = `ccar:learn:${examId}`;
  const saved = useRef(loadProgress(storageKey)).current;

  const [exam, setExam] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(saved?.idx ?? 0);
  const [picked, setPicked] = useState(saved?.picked ?? {}); // questionId -> option key
  const [domainFilter, setDomainFilter] = useState(saved?.domainFilter ?? 'all');

  useEffect(() => {
    api.getExam(examId, 'learning').then(setExam).catch((e) => setError(e.message));
  }, [examId]);

  // Filter value is 'all', a domain id ('D3'), or a case id prefixed 'case:CS2'.
  const questions = useMemo(() => {
    if (!exam) return [];
    if (domainFilter === 'all') return exam.questions;
    if (domainFilter.startsWith('case:')) {
      const id = domainFilter.slice(5);
      return exam.questions.filter((q) => q.caseId === id);
    }
    return exam.questions.filter((q) => q.domainId === domainFilter);
  }, [exam, domainFilter]);

  // Reset position when the user changes the filter, but not on the initial
  // mount — otherwise a restored position would be thrown away.
  const firstFilterRun = useRef(true);
  useEffect(() => {
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
      return;
    }
    setIdx(0);
  }, [domainFilter]);

  useEffect(() => {
    saveProgress(storageKey, { idx, picked, domainFilter });
  }, [storageKey, idx, picked, domainFilter]);

  if (error) return <div className="panel error-panel">{error}</div>;
  if (!exam) return <div className="panel">Loading exam…</div>;

  const safeIdx = Math.min(idx, Math.max(0, questions.length - 1));
  const q = questions[safeIdx];
  if (!q) return <div className="panel">No questions in this section.</div>;
  const chosen = picked[q.id];
  const revealed = chosen !== undefined;
  const correctKey = q.options.find((o) => o.correct).key;
  const answeredCount = questions.filter((qq) => picked[qq.id] !== undefined).length;
  const correctCount = questions.filter((qq) => {
    const p = picked[qq.id];
    return p !== undefined && qq.options.find((o) => o.key === p)?.correct;
  }).length;
  const activeCase = exam.cases?.find((c) => c.caseId === q.caseId);
  const numberInCase = activeCase
    ? exam.questions.filter((qq) => qq.caseId === q.caseId).findIndex((qq) => qq.id === q.id) + 1
    : null;

  return (
    <div className="exam-view">
      <div className="exam-header">
        <div>
          <span className="mode-tag learn-tag">LEARNING MODE</span>
          <strong> {exam.title}</strong>
        </div>
        <div className="exam-header-right">
          <span className="muted">
            {answeredCount > 0 && `${correctCount}/${answeredCount} correct so far · `}
            Question {safeIdx + 1} of {questions.length}
          </span>
          <button
            className="btn ghost"
            onClick={() => {
              if (!window.confirm('Clear your saved answers and start this exam over?')) return;
              clearProgress(storageKey);
              setPicked({});
              setIdx(0);
            }}
          >
            Reset
          </button>
          <button className="btn ghost" onClick={onExit}>Exit</button>
        </div>
      </div>

      <div className="learn-filter">
        <label>Section:&nbsp;</label>
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          <option value="all">All sections</option>
          {exam.cases && (
            <optgroup label="Case studies">
              {exam.cases.map((c) => (
                <option key={c.caseId} value={`case:${c.caseId}`}>
                  {c.caseId} — {c.caseTitle} ({c.count})
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label="Domains">
            {exam.domains.map((d) => (
              <option key={d.domainId} value={d.domainId}>
                {d.domainId} — {d.domainName} ({d.count})
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <CasePanel caseData={activeCase} questionNumberInCase={numberInCase} />

      <div className="question-card">
        <div className="q-domain">
          {q.domainId} · {q.domainName}
          {q.secondaryDomains?.length > 0 && (
            <span className="cross-domain"> + {q.secondaryDomains.join(', ')}</span>
          )}
        </div>
        <h3 className="q-text">{q.question}</h3>
        <div className="options">
          {q.options.map((o) => {
            let cls = 'option';
            if (revealed) {
              if (o.correct) cls += ' correct';
              else if (o.runnerUp) cls += ' runner-up';
              else if (o.key === chosen) cls += ' incorrect';
              else cls += ' neutral';
            }
            return (
              <div key={o.key} className={cls}>
                <button
                  className="option-btn"
                  disabled={revealed}
                  onClick={() => setPicked((p) => ({ ...p, [q.id]: o.key }))}
                >
                  <span className="option-key">{o.key}</span>
                  <span>{o.text}</span>
                </button>
                {revealed && (
                  <div className="explanation">
                    <div className="expl-verdict">
                      {o.correct
                        ? '✔ Correct answer'
                        : o.runnerUp
                          ? `◆ Close second${o.key === chosen ? ' — your choice' : ''} — defensible, but not the strongest fit`
                          : o.key === chosen
                            ? '✘ Your choice — incorrect'
                            : '✘ Incorrect'}
                    </div>
                    <p>{o.explanation}</p>
                    <a className="citation" href={o.citation.url} target="_blank" rel="noreferrer">
                      📄 {o.citation.title}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {revealed && (
          <div className={`verdict-banner ${chosen === correctKey ? 'pass' : 'fail'}`}>
            {chosen === correctKey
              ? 'Correct! Review the explanations for the other options to reinforce why they fail.'
              : q.options.find((o) => o.key === chosen)?.runnerUp
                ? `Close — ${chosen} is a defensible design, but ${correctKey} is stronger. Read both explanations to see which requirement ${chosen} drops.`
                : `Incorrect — the right answer is ${correctKey}. Read all four explanations before moving on.`}
          </div>
        )}
      </div>

      <div className="nav-row">
        <button className="btn ghost" disabled={safeIdx === 0} onClick={() => setIdx(safeIdx - 1)}>← Previous</button>
        <div className="palette">
          {questions.map((qq, i) => {
            const p = picked[qq.id];
            let cls = 'pal';
            if (p !== undefined) cls += qq.options.find((o) => o.key === p)?.correct ? ' pal-right' : ' pal-wrong';
            if (i === safeIdx) cls += ' pal-current';
            return (
              <button key={qq.id} className={cls} onClick={() => setIdx(i)} title={qq.id}>
                {i + 1}
              </button>
            );
          })}
        </div>
        <button className="btn ghost" disabled={safeIdx === questions.length - 1} onClick={() => setIdx(safeIdx + 1)}>Next →</button>
      </div>
    </div>
  );
}
