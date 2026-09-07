import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { loadProgress, saveProgress, clearProgress } from '../progress.js';
import { toKeys, selectCount, isAnswered, isCorrect, correctKeys, toggleKey } from '../answers.js';
import CasePanel from '../components/CasePanel.jsx';

export default function LearningMode({ examId, onExit }) {
  const storageKey = `ccar:learn:${examId}`;
  const saved = useRef(loadProgress(storageKey)).current;

  const [exam, setExam] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(saved?.idx ?? 0);
  const [picked, setPicked] = useState(saved?.picked ?? {}); // questionId -> option key(s)
  // Select-two items reveal on an explicit click rather than on the second pick,
  // so completing the pair can't lock in an answer the user was still editing.
  const [checked, setChecked] = useState(saved?.checked ?? {});
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
    saveProgress(storageKey, { idx, picked, checked, domainFilter });
  }, [storageKey, idx, picked, checked, domainFilter]);

  if (error) return <div className="panel error-panel">{error}</div>;
  if (!exam) return <div className="panel">Loading exam…</div>;

  const safeIdx = Math.min(idx, Math.max(0, questions.length - 1));
  const q = questions[safeIdx];
  if (!q) return <div className="panel">No questions in this section.</div>;
  const chosenKeys = toKeys(picked[q.id]);
  const want = selectCount(q);
  // A single-choice pick is unambiguous, so it reveals immediately. Select-two
  // waits for an explicit confirm: the click that completes the pair would
  // otherwise lock the answer while the user was still adjusting it.
  const isRevealed = (qq) =>
    selectCount(qq) > 1 ? !!checked[qq.id] : isAnswered(qq, picked[qq.id]);
  const revealed = isRevealed(q);
  const keysCorrect = correctKeys(q);
  const gotIt = isCorrect(q, picked[q.id]);
  const answeredCount = questions.filter(isRevealed).length;
  const correctCount = questions.filter((qq) => isRevealed(qq) && isCorrect(qq, picked[qq.id])).length;
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
              setChecked({});
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
        {want > 1 && !revealed && (
          <div className="select-hint">
            Select {want} — {chosenKeys.length} of {want} chosen. Scored all-or-nothing.
          </div>
        )}
        <div className="options">
          {q.options.map((o) => {
            const mine = chosenKeys.includes(o.key);
            let cls = 'option';
            if (revealed) {
              if (o.correct) cls += ' correct';
              else if (o.runnerUp) cls += ' runner-up';
              else if (mine) cls += ' incorrect';
              else cls += ' neutral';
            } else if (mine) {
              cls += ' selected';
            }
            return (
              <div key={o.key} className={cls}>
                <button
                  className="option-btn"
                  disabled={revealed}
                  onClick={() =>
                    setPicked((p) => {
                      const next = { ...p };
                      const v = toggleKey(q, p[q.id], o.key);
                      if (v === undefined) delete next[q.id];
                      else next[q.id] = v;
                      return next;
                    })
                  }
                >
                  <span className="option-key">{o.key}</span>
                  <span>{o.text}</span>
                </button>
                {revealed && (
                  <div className="explanation">
                    <div className="expl-verdict">
                      {o.correct
                        ? `✔ Correct answer${mine ? ' — you picked this' : ''}`
                        : o.runnerUp
                          ? `◆ Close second${mine ? ' — your choice' : ''} — defensible, but not the strongest fit`
                          : mine
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
        {want > 1 && !revealed && (
          <div className="check-row">
            <button
              className="btn"
              disabled={chosenKeys.length !== want}
              onClick={() => setChecked((c) => ({ ...c, [q.id]: true }))}
            >
              Check answer
            </button>
            <span className="muted">
              {chosenKeys.length === want
                ? 'You can still change your picks until you check.'
                : `Choose ${want - chosenKeys.length} more.`}
            </span>
          </div>
        )}
        {revealed && (
          <div className={`verdict-banner ${gotIt ? 'pass' : 'fail'}`}>
            {gotIt
              ? 'Correct! Review the explanations for the other options to reinforce why they fail.'
              : want > 1
                ? `Incorrect — the answer is ${keysCorrect.join(' and ')}. Select-two items are scored all-or-nothing, so one right pick earns nothing. Read every explanation before moving on.`
                : q.options.find((o) => o.key === chosenKeys[0])?.runnerUp
                  ? `Close — ${chosenKeys[0]} is a defensible design, but ${keysCorrect[0]} is stronger. Read both explanations to see which requirement ${chosenKeys[0]} drops.`
                  : `Incorrect — the right answer is ${keysCorrect[0]}. Read all ${q.options.length} explanations before moving on.`}
          </div>
        )}
      </div>

      <div className="nav-row">
        <button className="btn ghost" disabled={safeIdx === 0} onClick={() => setIdx(safeIdx - 1)}>← Previous</button>
        <div className="palette">
          {questions.map((qq, i) => {
            let cls = 'pal';
            // Gate on isRevealed, not isAnswered: colouring a select-two right or
            // wrong before it has been checked would give the answer away.
            if (isRevealed(qq)) cls += isCorrect(qq, picked[qq.id]) ? ' pal-right' : ' pal-wrong';
            else if (toKeys(picked[qq.id]).length > 0) cls += ' pal-partial';
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
