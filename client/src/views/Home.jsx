import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { loadProgress } from '../progress.js';

function fmtDuration(s) {
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

const CERT_INFO = {
  'CCAR-F': {
    label: 'CCAR-F · Architect Foundations',
    blurb: 'Core mechanics: agentic loop, tool use & MCP, Claude Code, prompting, context management.',
  },
  'CCAR-P': {
    label: 'CCAR-P · Architect Professional',
    blurb: 'Enterprise architecture: solution design, integration, evaluation, governance, lifecycle.',
  },
  'CCDV-F': {
    label: 'CCDV-F · Developer Foundations',
    blurb: 'Implementation: request and response shapes, SDK usage, parameters, error handling, evals.',
  },
};

export default function Home({ onStart }) {
  const [exams, setExams] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listExams().then(setExams).catch((e) => setError(e.message));
    api.listAttempts().then(setAttempts).catch(() => {});
  }, []);

  if (error) return <div className="panel error-panel">Cannot reach the study server: {error}. Start it with <code>npm start</code> in <code>server/</code>.</div>;
  if (!exams) return <div className="panel">Loading exams…</div>;

  // Derived from what the server actually serves rather than hardcoded: a
  // hardcoded list silently dropped the whole CCDV-F track once, so a cert the
  // API knows about can never again be invisible here. Order follows the API.
  const certs = [...new Set(exams.map((e) => e.cert))].map((id) => ({
    id,
    ...(CERT_INFO[id] ?? { label: id, blurb: '' }),
  }));

  return (
    <div className="home">
      <section className="hero-copy">
        <h1>Interactive Claude Certification Mock Exams</h1>
        <p>
          Two ways to study: <strong>Learning Mode</strong> explains every answer choice with Anthropic
          documentation citations. <strong>Real Mode</strong> simulates the actual exam — timed, no hints,
          full section-by-section score report at the end.
        </p>
      </section>

      {certs.map((cert) => (
        <section key={cert.id} className="cert-block">
          <h2>{cert.label}</h2>
          <p className="muted">{cert.blurb}</p>
          <div className="exam-grid">
            {exams.filter((e) => e.cert === cert.id).map((exam) => {
              const learnSaved = loadProgress(`ccar:learn:${exam.examId}`);
              const realSaved = loadProgress(`ccar:real:${exam.examId}`);
              const learnDone = learnSaved ? Object.keys(learnSaved.picked ?? {}).length : 0;
              const realLive = realSaved && realSaved.deadline > Date.now();
              return (
              <div key={exam.examId} className={`exam-card ${exam.available ? '' : 'disabled'}`}>
                <h3>
                  {exam.title}
                  {exam.format === 'case' && <span className="hard-badge">HARD</span>}
                </h3>
                <ul className="exam-facts">
                  <li>{exam.questionCount} questions</li>
                  <li>{exam.timeLimitMinutes} minutes</li>
                  <li>Pass: {exam.passingScore} / 1000 scaled</li>
                  <li>
                    {exam.format === 'case'
                      ? `${exam.caseCount || '—'} client case studies`
                      : `${exam.domains.length || '—'} sections`}
                  </li>
                </ul>
                {exam.format === 'case' && (
                  <p className="muted card-note">
                    Cross-domain questions on a shared client scenario, each with a strong answer and a
                    defensible runner-up.
                  </p>
                )}
                {exam.available ? (
                  <div className="mode-buttons">
                    <button className="btn learn" onClick={() => onStart(exam.examId, 'learning')}>
                      {learnDone > 0 ? `Resume Learning (${learnDone})` : 'Learning Mode'}
                    </button>
                    <button className="btn real" onClick={() => onStart(exam.examId, 'real')}>
                      {realLive ? 'Resume Real Mode' : 'Real Mode'}
                    </button>
                  </div>
                ) : (
                  <p className="muted">
                    Question bank loading… {exam.loadedQuestions}/{exam.questionCount} ready
                  </p>
                )}
              </div>
              );
            })}
          </div>
        </section>
      ))}

      {attempts.length > 0 && (
        <section className="cert-block">
          <h2>Attempt History</h2>
          <table className="history-table">
            <thead>
              <tr><th>Date</th><th>Exam</th><th>Score</th><th>Scaled</th><th>Result</th><th>Time</th></tr>
            </thead>
            <tbody>
              {attempts.slice(0, 10).map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.completedAt).toLocaleString()}</td>
                  <td>{a.examTitle}</td>
                  <td>{a.overall.correct}/{a.overall.total} ({a.overall.percentage}%)</td>
                  <td>{a.overall.scaledScore}</td>
                  <td className={a.overall.passed ? 'pass' : 'fail'}>{a.overall.passed ? 'PASS' : 'FAIL'}</td>
                  <td>{fmtDuration(a.elapsedSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
