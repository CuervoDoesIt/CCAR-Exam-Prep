import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { loadProgress, saveProgress, clearProgress } from '../progress.js';
import { toKeys, selectCount, isAnswered, toggleKey } from '../answers.js';
import CasePanel from '../components/CasePanel.jsx';

function fmtClock(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function RealMode({ examId, onExit, onFinished }) {
  const storageKey = `ccar:real:${examId}`;
  // A saved session is only usable while its deadline is still in the future.
  const saved = useRef(
    (() => {
      const s = loadProgress(storageKey);
      if (s && typeof s.deadline === 'number' && s.deadline > Date.now()) return s;
      clearProgress(storageKey);
      return null;
    })(),
  ).current;

  const [exam, setExam] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(saved?.idx ?? 0);
  const [answers, setAnswers] = useState(saved?.answers ?? {});
  const [flagged, setFlagged] = useState(saved?.flagged ?? {});
  const [remaining, setRemaining] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startRef = useRef(saved?.startedAt ?? null);
  const deadlineRef = useRef(saved?.deadline ?? null);
  const submittedRef = useRef(false);
  // refs so the auto-submit timer sees current state without re-arming
  const stateRef = useRef({ answers: {}, exam: null });
  stateRef.current = { answers, exam };

  useEffect(() => {
    api.getExam(examId, 'real')
      .then((e) => {
        if (deadlineRef.current === null) {
          startRef.current = Date.now();
          deadlineRef.current = startRef.current + e.timeLimitMinutes * 60 * 1000;
        }
        setExam(e);
        setRemaining(Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000)));
      })
      .catch((e) => setError(e.message));
  }, [examId]);

  // The countdown is derived from an absolute deadline, so a reload or a
  // sleeping tab can never hand back extra time.
  useEffect(() => {
    if (!exam) return undefined;
    const tick = () => {
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) doSubmit();
    };
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);

  useEffect(() => {
    if (!exam || submittedRef.current) return;
    saveProgress(storageKey, {
      idx,
      answers,
      flagged,
      startedAt: startRef.current,
      deadline: deadlineRef.current,
    });
  }, [storageKey, exam, idx, answers, flagged]);

  async function doSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const { answers: ans, exam: ex } = stateRef.current;
    const elapsed = Math.round((Date.now() - startRef.current) / 1000);
    try {
      const attempt = await api.submitAttempt(ex.examId, ans, elapsed);
      clearProgress(storageKey);
      onFinished(attempt);
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setError(`Submit failed: ${e.message}`);
    }
  }

  if (error) return <div className="panel error-panel">{error}</div>;
  if (!exam) return <div className="panel">Loading exam…</div>;
  if (submitting) return <div className="panel">Grading your exam…</div>;

  const q = exam.questions[idx];
  const answeredCount = exam.questions.filter((qq) => isAnswered(qq, answers[qq.id])).length;
  const low = remaining <= 300;
  const want = selectCount(q);
  const chosenKeys = toKeys(answers[q.id]);
  const activeCase = exam.cases?.find((c) => c.caseId === q.caseId);
  const numberInCase = activeCase
    ? exam.questions.filter((qq) => qq.caseId === q.caseId).findIndex((qq) => qq.id === q.id) + 1
    : null;

  return (
    <div className="exam-view">
      <div className="exam-header">
        <div>
          <span className="mode-tag real-tag">REAL MODE</span>
          <strong> {exam.title}</strong>
        </div>
        <div className="exam-header-right">
          <span className={`timer ${low ? 'timer-low' : ''}`}>⏱ {fmtClock(remaining)}</span>
          <span className="muted">{answeredCount}/{exam.questions.length} answered</span>
          <button
            className="btn ghost"
            onClick={() => {
              if (!window.confirm('Abandon this attempt? Your answers and remaining time will be discarded.')) return;
              clearProgress(storageKey);
              onExit();
            }}
          >
            Abandon
          </button>
        </div>
      </div>

      <CasePanel caseData={activeCase} questionNumberInCase={numberInCase} />

      <div className="question-card">
        <div className="q-domain-row">
          <div className="q-domain">Question {idx + 1} of {exam.questions.length}</div>
          <button
            className={`btn tiny ${flagged[q.id] ? 'flag-on' : 'ghost'}`}
            onClick={() => setFlagged((f) => ({ ...f, [q.id]: !f[q.id] }))}
          >
            {flagged[q.id] ? '🚩 Flagged' : 'Flag for review'}
          </button>
        </div>
        <h3 className="q-text">{q.question}</h3>
        {want > 1 && (
          <div className="select-hint">
            Select {want} — {chosenKeys.length} of {want} chosen
          </div>
        )}
        <div className="options">
          {q.options.map((o) => (
            <div key={o.key} className={`option ${chosenKeys.includes(o.key) ? 'selected' : ''}`}>
              <button
                className="option-btn"
                onClick={() =>
                  setAnswers((a) => {
                    const next = { ...a };
                    const v = toggleKey(q, a[q.id], o.key);
                    if (v === undefined) delete next[q.id];
                    else next[q.id] = v;
                    return next;
                  })
                }
              >
                <span className="option-key">{o.key}</span>
                <span>{o.text}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="nav-row">
        <button className="btn ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Previous</button>
        <div className="palette">
          {exam.questions.map((qq, i) => {
            let cls = 'pal';
            if (isAnswered(qq, answers[qq.id])) cls += ' pal-answered';
            else if (toKeys(answers[qq.id]).length > 0) cls += ' pal-partial';
            if (flagged[qq.id]) cls += ' pal-flagged';
            if (i === idx) cls += ' pal-current';
            if (i > 0 && qq.caseId && qq.caseId !== exam.questions[i - 1].caseId) cls += ' pal-case-start';
            return (
              <button key={qq.id} className={cls} onClick={() => setIdx(i)} title={qq.caseId ?? qq.id}>
                {i + 1}
              </button>
            );
          })}
        </div>
        {idx < exam.questions.length - 1 ? (
          <button className="btn" onClick={() => setIdx(idx + 1)}>Next →</button>
        ) : (
          <button className="btn real" onClick={() => setConfirmSubmit(true)}>Finish Exam</button>
        )}
      </div>

      <div className="submit-row">
        <button className="btn real" onClick={() => setConfirmSubmit(true)}>Submit Exam</button>
      </div>

      {confirmSubmit && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Submit exam?</h3>
            <p>
              You have answered {answeredCount} of {exam.questions.length} questions.
              {answeredCount < exam.questions.length && ' Unanswered questions will be marked incorrect.'}
              {exam.questions.some(
                (qq) => !isAnswered(qq, answers[qq.id]) && toKeys(answers[qq.id]).length > 0,
              ) && ' Select-two questions without both picks count as unanswered.'}
            </p>
            <div className="modal-buttons">
              <button className="btn ghost" onClick={() => setConfirmSubmit(false)}>Keep working</button>
              <button className="btn real" onClick={doSubmit}>Submit now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
