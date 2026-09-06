import { useState } from 'react';

// Shows the client scenario a block of questions is written against. Collapsible,
// because on later questions you usually only need the requirement list.
export default function CasePanel({ caseData, questionNumberInCase }) {
  const [open, setOpen] = useState(true);
  if (!caseData) return null;

  return (
    <div className="case-panel">
      <button className="case-head" onClick={() => setOpen((o) => !o)}>
        <span className="case-tag">{caseData.caseId}</span>
        <span className="case-title">{caseData.caseTitle}</span>
        <span className="muted case-meta">
          {questionNumberInCase ? `Q${questionNumberInCase} of ${caseData.count} · ` : ''}
          {open ? 'Hide scenario ▲' : 'Show scenario ▼'}
        </span>
      </button>
      {open && (
        <div className="case-body">
          {caseData.caseScenario.split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      <ul className="case-reqs">
        {caseData.caseRequirements.map((r) => {
          const m = r.match(/^(R\d+):\s*(.*)$/);
          return (
            <li key={r}>
              <span className="req-key">{m ? m[1] : '•'}</span>
              <span>{m ? m[2] : r}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
