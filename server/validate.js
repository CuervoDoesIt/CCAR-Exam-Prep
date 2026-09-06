// Validates all question bank files against CONTENT_SPEC.md and CASE_SPEC.md.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");

const EXPECTED = {
  "ccar-f/exam1": { D1: 14, D2: 13, D3: 11, D4: 12, D5: 10 },
  "ccar-f/exam2": { D1: 14, D2: 13, D3: 11, D4: 12, D5: 10 },
  "ccar-p/exam1": { D1: 11, D2: 11, D3: 17, D4: 11, D5: 7, D6: 4, D7: 2 },
  "ccar-p/exam2": { D1: 11, D2: 11, D3: 17, D4: 11, D5: 7, D6: 4, D7: 2 },
};

// Hard-mode case exams: per-case primaryDomain allocation (see CASE_SPEC.md).
const CASE_ALLOCATION = {
  cs1: { D1: 3, D2: 2, D3: 3, D4: 2, D5: 1, D6: 1 },
  cs2: { D1: 2, D2: 2, D3: 4, D4: 2, D5: 1, D7: 1 },
  cs3: { D1: 2, D2: 3, D3: 3, D4: 2, D5: 1, D6: 1 },
  cs4: { D1: 2, D2: 2, D3: 3, D4: 2, D5: 2, D6: 1 },
  cs5: { D1: 2, D2: 2, D3: 3, D4: 2, D5: 2, D6: 1 },
  cs6: { D3: 1, D4: 1, D7: 1 },
};
const EXPECTED_CASES = {
  "ccar-p/exam3": { prefix: "P3", allocation: CASE_ALLOCATION },
  "ccar-p/exam4": { prefix: "P4", allocation: CASE_ALLOCATION },
};

const DOMAIN_IDS = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
const CITATION_RE =
  /^https:\/\/(docs\.claude\.com|platform\.claude\.com|code\.claude\.com|www\.anthropic\.com|modelcontextprotocol\.io|docs\.anthropic\.com)\//;

let errors = 0;
let warnings = 0;
const err = (m) => { errors++; console.error("ERROR:", m); };
const warn = (m) => { warnings++; console.warn("warn :", m); };

// Shared per-question structural checks. Returns the correct option's key, or null.
function checkQuestion(file, q, seen) {
  if (!q.id || seen.has(q.id)) err(`${file}: missing/duplicate id ${q.id}`);
  seen.add(q.id);
  if (!q.question) err(`${file} ${q.id}: empty question`);
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    err(`${file} ${q.id}: needs exactly 4 options`);
    return null;
  }
  const keys = q.options.map((o) => o.key).join("");
  if (keys !== "ABCD") err(`${file} ${q.id}: option keys ${keys} != ABCD`);
  const correct = q.options.filter((o) => o.correct === true);
  if (correct.length !== 1) err(`${file} ${q.id}: ${correct.length} correct options`);
  for (const o of q.options) {
    if (!o.text) err(`${file} ${q.id}${o.key}: empty text`);
    if (!o.explanation || o.explanation.length < 40) warn(`${file} ${q.id}${o.key}: explanation short/missing`);
    if (!o.citation || !o.citation.url || !CITATION_RE.test(o.citation.url)) {
      err(`${file} ${q.id}${o.key}: missing or non-approved citation URL (${o.citation && o.citation.url})`);
    }
  }
  return correct.length === 1 ? correct[0].key : null;
}

function checkLetterDistribution(file, letterDist, total) {
  const max = Math.max(...Object.values(letterDist));
  if (total >= 10 && max > Math.ceil(total * 0.5)) {
    warn(`${file}: skewed correct-letter distribution ${JSON.stringify(letterDist)}`);
  }
}

// ---- domain-organised exams -------------------------------------------------
for (const [rel, domains] of Object.entries(EXPECTED)) {
  const dir = path.join(DATA_DIR, ...rel.split("/"));
  for (const [domainId, count] of Object.entries(domains)) {
    const name = `${domainId.toLowerCase()}.json`;
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) { err(`${rel}/${name} missing`); continue; }
    let data;
    try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
    catch (e) { err(`${rel}/${name} invalid JSON: ${e.message}`); continue; }
    if (data.domainId !== domainId) err(`${file}: domainId ${data.domainId} != ${domainId}`);
    if (!Array.isArray(data.questions)) { err(`${file}: questions not an array`); continue; }
    if (data.questions.length !== count) err(`${file}: ${data.questions.length} questions, expected ${count}`);
    const seen = new Set();
    const letterDist = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of data.questions) {
      const k = checkQuestion(file, q, seen);
      if (k) letterDist[k]++;
    }
    checkLetterDistribution(file, letterDist, data.questions.length);
  }
}

// ---- hard-mode case-study exams ---------------------------------------------
for (const [rel, spec] of Object.entries(EXPECTED_CASES)) {
  const dir = path.join(DATA_DIR, ...rel.split("/"));
  for (const [caseKey, allocation] of Object.entries(spec.allocation)) {
    const name = `${caseKey}.json`;
    const file = path.join(dir, name);
    const expectedTotal = Object.values(allocation).reduce((a, b) => a + b, 0);
    if (!fs.existsSync(file)) { err(`${rel}/${name} missing`); continue; }
    let data;
    try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
    catch (e) { err(`${rel}/${name} invalid JSON: ${e.message}`); continue; }

    const expectedCaseId = caseKey.toUpperCase();
    if (data.caseId !== expectedCaseId) err(`${file}: caseId ${data.caseId} != ${expectedCaseId}`);
    if (!data.caseTitle) err(`${file}: missing caseTitle`);
    if (!data.caseScenario || data.caseScenario.length < 400) {
      err(`${file}: caseScenario missing or too short (needs a substantive client description)`);
    }
    if (!Array.isArray(data.caseRequirements) || data.caseRequirements.length < 4 || data.caseRequirements.length > 6) {
      err(`${file}: caseRequirements must be an array of 4-6 entries`);
    } else {
      data.caseRequirements.forEach((r, i) => {
        if (!new RegExp(`^R${i + 1}:`).test(r)) err(`${file}: requirement ${i + 1} must start with "R${i + 1}:"`);
      });
    }
    if (!Array.isArray(data.questions)) { err(`${file}: questions not an array`); continue; }
    if (data.questions.length !== expectedTotal) {
      err(`${file}: ${data.questions.length} questions, expected ${expectedTotal}`);
    }

    const seen = new Set();
    const letterDist = { A: 0, B: 0, C: 0, D: 0 };
    const domainCounts = {};
    let longestIsCorrect = 0;
    data.questions.forEach((q, i) => {
      const k = checkQuestion(file, q, seen);
      if (k) letterDist[k]++;

      const expectedId = `${spec.prefix}-${expectedCaseId}-${String(i + 1).padStart(2, "0")}`;
      if (q.id !== expectedId) err(`${file}: question ${i + 1} id ${q.id} != ${expectedId}`);

      if (!DOMAIN_IDS.includes(q.primaryDomain)) err(`${file} ${q.id}: bad primaryDomain ${q.primaryDomain}`);
      else domainCounts[q.primaryDomain] = (domainCounts[q.primaryDomain] ?? 0) + 1;

      if (!Array.isArray(q.secondaryDomains) || q.secondaryDomains.length < 1 || q.secondaryDomains.length > 3) {
        err(`${file} ${q.id}: secondaryDomains must be an array of 1-3 domain ids`);
      } else {
        const uniq = new Set(q.secondaryDomains);
        if (uniq.size !== q.secondaryDomains.length) err(`${file} ${q.id}: duplicate secondaryDomains`);
        if (uniq.has(q.primaryDomain)) err(`${file} ${q.id}: primaryDomain repeated in secondaryDomains`);
        for (const d of q.secondaryDomains) {
          if (!DOMAIN_IDS.includes(d)) err(`${file} ${q.id}: bad secondaryDomain ${d}`);
        }
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) return;
      const runnerUps = q.options.filter((o) => o.runnerUp === true);
      if (runnerUps.length !== 1) err(`${file} ${q.id}: ${runnerUps.length} runnerUp options, expected exactly 1`);
      else if (runnerUps[0].correct === true) err(`${file} ${q.id}: runnerUp must not also be the correct option`);
      else if (!/\bR[1-6]\b/.test(runnerUps[0].explanation ?? "")) {
        err(`${file} ${q.id}${runnerUps[0].key}: runnerUp explanation must name the requirement it fails (e.g. "R2")`);
      }

      const maxLen = Math.max(...q.options.map((o) => (o.text ?? "").length));
      const correctOpt = q.options.find((o) => o.correct === true);
      if (correctOpt && (correctOpt.text ?? "").length === maxLen) longestIsCorrect++;
    });

    for (const d of DOMAIN_IDS) {
      const want = allocation[d] ?? 0;
      const got = domainCounts[d] ?? 0;
      if (want !== got) err(`${file}: primaryDomain ${d} count ${got}, expected ${want}`);
    }
    checkLetterDistribution(file, letterDist, data.questions.length);
    if (longestIsCorrect > Math.ceil(data.questions.length * 0.4)) {
      warn(`${file}: correct option is the longest in ${longestIsCorrect}/${data.questions.length} questions (length giveaway)`);
    }
  }
}

console.log(`\nValidation complete: ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors > 0 ? 1 : 0);
