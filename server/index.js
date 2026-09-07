import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const STORE_DIR = path.join(__dirname, "store");
const ATTEMPTS_FILE = path.join(STORE_DIR, "attempts.json");

const EXAM_META = {
  "ccar-f-exam1": { cert: "CCAR-F", title: "CCAR-F Mock Exam 1", dir: ["ccar-f", "exam1"], questionCount: 60, timeLimitMinutes: 120 },
  "ccar-f-exam2": { cert: "CCAR-F", title: "CCAR-F Mock Exam 2", dir: ["ccar-f", "exam2"], questionCount: 60, timeLimitMinutes: 120 },
  "ccar-p-exam1": { cert: "CCAR-P", title: "CCAR-P Mock Exam 1", dir: ["ccar-p", "exam1"], questionCount: 63, timeLimitMinutes: 120 },
  "ccar-p-exam2": { cert: "CCAR-P", title: "CCAR-P Mock Exam 2", dir: ["ccar-p", "exam2"], questionCount: 63, timeLimitMinutes: 120 },
  "ccar-p-exam3": { cert: "CCAR-P", title: "CCAR-P Mock Exam 3 — Case Studies", dir: ["ccar-p", "exam3"], questionCount: 63, timeLimitMinutes: 120, format: "case" },
  "ccar-p-exam4": { cert: "CCAR-P", title: "CCAR-P Mock Exam 4 — Case Studies", dir: ["ccar-p", "exam4"], questionCount: 63, timeLimitMinutes: 120, format: "case" },
  "ccdv-f-exam1": { cert: "CCDV-F", title: "CCDV-F Mock Exam 1", dir: ["ccdv-f", "exam1"], questionCount: 53, timeLimitMinutes: 120 },
  "ccdv-f-exam2": { cert: "CCDV-F", title: "CCDV-F Mock Exam 2", dir: ["ccdv-f", "exam2"], questionCount: 53, timeLimitMinutes: 120 },
  "ccdv-f-exam3": { cert: "CCDV-F", title: "CCDV-F Mock Exam 3 — Case Studies", dir: ["ccdv-f", "exam3"], questionCount: 53, timeLimitMinutes: 120, format: "case" },
  "ccdv-f-exam4": { cert: "CCDV-F", title: "CCDV-F Mock Exam 4 — Case Studies", dir: ["ccdv-f", "exam4"], questionCount: 53, timeLimitMinutes: 120, format: "case" },
};
const PASSING_SCALED = 720;

// Case exams carry only a primaryDomain id per question; the display name comes
// from the certification's blueprint.
const DOMAIN_NAMES = {
  "CCAR-P": {
    D1: "Solution Design & Architecture",
    D2: "Claude Models, Prompting & Context Engineering",
    D3: "Integration (Tool Use, MCP, Agent SDK)",
    D4: "Evaluation, Testing & Optimization",
    D5: "Governance, Safety & Risk Management",
    D6: "Stakeholder Communication & Lifecycle Management",
    D7: "Developer Productivity & Operational Enablement",
  },
  // Official CCDV-F blueprint (Exam Guide v1.0, effective July 2026).
  "CCDV-F": {
    D1: "Agents and Workflows",
    D2: "Applications and Integration",
    D3: "Claude Code",
    D4: "Eval, Testing, and Debugging",
    D5: "Model Selection and Optimization",
    D6: "Prompt and Context Engineering",
    D7: "Security and Safety",
    D8: "Tools and MCPs",
  },
};

// Answers arrive as a key ("B") for single-choice or an array (["B","D"]) for
// multiple-response items. Normalise to arrays so grading handles both.
function toKeys(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function sameSet(a, b) {
  const x = [...a].sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((k, i) => k === y[i]);
}

function readJsonFiles(dir, pattern) {
  const out = [];
  for (const f of fs.readdirSync(dir).filter((f) => pattern.test(f)).sort()) {
    try {
      out.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
    } catch {
      // skip unreadable/partial files (agents may still be writing)
    }
  }
  return out;
}

function loadDomainExam(examId, meta, dir) {
  const domains = readJsonFiles(dir, /^d\d+\.json$/);
  if (domains.length === 0) return null;
  domains.sort((a, b) => a.domainId.localeCompare(b.domainId, undefined, { numeric: true }));
  const questions = domains.flatMap((d) =>
    d.questions.map((q) => ({ ...q, domainId: d.domainId, domainName: d.domainName }))
  );
  return {
    examId,
    ...meta,
    domains: domains.map((d) => ({ domainId: d.domainId, domainName: d.domainName, count: d.questions.length })),
    questions,
  };
}

function loadCaseExam(examId, meta, dir) {
  const cases = readJsonFiles(dir, /^cs\d+\.json$/);
  if (cases.length === 0) return null;
  const names = DOMAIN_NAMES[meta.cert] ?? {};
  cases.sort((a, b) => a.caseId.localeCompare(b.caseId, undefined, { numeric: true }));
  const questions = cases.flatMap((c) =>
    c.questions.map((q) => ({
      ...q,
      domainId: q.primaryDomain,
      domainName: names[q.primaryDomain] ?? q.primaryDomain,
      caseId: c.caseId,
      caseTitle: c.caseTitle,
    }))
  );
  const counts = {};
  for (const q of questions) counts[q.domainId] = (counts[q.domainId] ?? 0) + 1;
  return {
    examId,
    ...meta,
    cases: cases.map((c) => ({
      caseId: c.caseId,
      caseTitle: c.caseTitle,
      caseScenario: c.caseScenario,
      caseRequirements: c.caseRequirements,
      count: c.questions.length,
    })),
    domains: Object.keys(counts)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((id) => ({ domainId: id, domainName: names[id] ?? id, count: counts[id] })),
    questions,
  };
}

function loadExam(examId) {
  const meta = EXAM_META[examId];
  if (!meta) return null;
  const dir = path.join(DATA_DIR, ...meta.dir);
  if (!fs.existsSync(dir)) return null;
  return meta.format === "case"
    ? loadCaseExam(examId, meta, dir)
    : loadDomainExam(examId, meta, dir);
}

function stripAnswers(exam) {
  return {
    ...exam,
    questions: exam.questions.map((q) => ({
      ...q,
      options: q.options.map(({ key, text }) => ({ key, text })),
    })),
  };
}

function scaledScore(correct, total) {
  return Math.round(100 + (correct / total) * 900);
}

function pct(correct, total) {
  return Math.round((correct / total) * 1000) / 10;
}

function gradeAttempt(exam, answers) {
  const byDomain = {};
  const byCase = {};
  const questionResults = [];
  let correctCount = 0;
  for (const q of exam.questions) {
    const chosen = answers[q.id] ?? null;
    const chosenKeys = toKeys(chosen);
    const correctOptKeys = q.options.filter((o) => o.correct).map((o) => o.key);
    // Multiple-response items are all-or-nothing, as on the real exam.
    const isCorrect = chosenKeys.length > 0 && sameSet(chosenKeys, correctOptKeys);
    if (isCorrect) correctCount++;
    if (!byDomain[q.domainId]) {
      byDomain[q.domainId] = { domainId: q.domainId, domainName: q.domainName, correct: 0, total: 0 };
    }
    byDomain[q.domainId].total++;
    if (isCorrect) byDomain[q.domainId].correct++;
    if (q.caseId) {
      if (!byCase[q.caseId]) {
        byCase[q.caseId] = { caseId: q.caseId, caseTitle: q.caseTitle, correct: 0, total: 0, runnerUpPicks: 0 };
      }
      byCase[q.caseId].total++;
      if (isCorrect) byCase[q.caseId].correct++;
      else if (
        chosenKeys.length === 1 &&
        q.options.find((o) => o.key === chosenKeys[0])?.runnerUp
      ) {
        byCase[q.caseId].runnerUpPicks++;
      }
    }
    questionResults.push({
      id: q.id,
      domainId: q.domainId,
      caseId: q.caseId ?? null,
      chosen,
      correctKeys: correctOptKeys,
      isCorrect,
    });
  }
  const total = exam.questions.length;
  const scaled = scaledScore(correctCount, total);
  const cases = Object.values(byCase)
    .sort((a, b) => a.caseId.localeCompare(b.caseId, undefined, { numeric: true }))
    .map((c) => ({ ...c, percentage: pct(c.correct, c.total) }));
  return {
    overall: {
      correct: correctCount,
      total,
      percentage: pct(correctCount, total),
      scaledScore: scaled,
      passingScore: PASSING_SCALED,
      passed: scaled >= PASSING_SCALED,
    },
    sections: Object.values(byDomain)
      .sort((a, b) => a.domainId.localeCompare(b.domainId, undefined, { numeric: true }))
      .map((d) => ({ ...d, percentage: pct(d.correct, d.total) })),
    cases,
    questionResults,
  };
}

function readAttempts() {
  try {
    return JSON.parse(fs.readFileSync(ATTEMPTS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeAttempts(attempts) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/exams", (_req, res) => {
  const list = Object.keys(EXAM_META).map((id) => {
    const exam = loadExam(id);
    const meta = EXAM_META[id];
    return {
      examId: id,
      cert: meta.cert,
      title: meta.title,
      questionCount: meta.questionCount,
      timeLimitMinutes: meta.timeLimitMinutes,
      passingScore: PASSING_SCALED,
      format: meta.format ?? "domain",
      available: !!exam && exam.questions.length === meta.questionCount,
      loadedQuestions: exam ? exam.questions.length : 0,
      domains: exam ? exam.domains : [],
      caseCount: exam?.cases ? exam.cases.length : 0,
    };
  });
  res.json(list);
});

app.get("/api/exams/:id", (req, res) => {
  const exam = loadExam(req.params.id);
  if (!exam) return res.status(404).json({ error: "Exam not found or not yet available" });
  const mode = req.query.mode === "learning" ? "learning" : "real";
  res.json(mode === "learning" ? exam : stripAnswers(exam));
});

app.post("/api/attempts", (req, res) => {
  const { examId, answers, elapsedSeconds } = req.body || {};
  if (!examId || typeof answers !== "object" || answers === null) {
    return res.status(400).json({ error: "examId and answers are required" });
  }
  const exam = loadExam(examId);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  const result = gradeAttempt(exam, answers);
  // include full option detail so the results review screen can teach.
  // isCorrect comes from the grader rather than being recomputed client-side,
  // so the review screen can never disagree with the score above it.
  const verdicts = new Map(result.questionResults.map((r) => [r.id, r.isCorrect]));
  const review = exam.questions.map((q) => ({
    id: q.id,
    domainId: q.domainId,
    domainName: q.domainName,
    caseId: q.caseId ?? null,
    caseTitle: q.caseTitle ?? null,
    question: q.question,
    chosen: answers[q.id] ?? null,
    isCorrect: verdicts.get(q.id) ?? false,
    options: q.options,
  }));
  const attempt = {
    id: `${examId}-${Date.now()}`,
    examId,
    examTitle: exam.title,
    cert: exam.cert,
    completedAt: new Date().toISOString(),
    elapsedSeconds: Number(elapsedSeconds) || 0,
    overall: result.overall,
    sections: result.sections,
    cases: result.cases,
  };
  const attempts = readAttempts();
  attempts.unshift(attempt);
  writeAttempts(attempts.slice(0, 200));
  res.json({ ...attempt, questionResults: result.questionResults, review });
});

app.get("/api/attempts", (_req, res) => {
  res.json(readAttempts());
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`CCAR study server listening on http://localhost:${PORT}`));
