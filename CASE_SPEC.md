# CASE_SPEC.md — Hard Mode (Case-Study) Exam Authoring Contract

This governs **CCAR-P Mock Exam 3** and **CCAR-P Mock Exam 4** only.
It does **not** apply to `ccar-f/exam1`, `ccar-f/exam2`, `ccar-p/exam1`, `ccar-p/exam2`,
which are frozen and must never be edited.

For anything not specified here, `CONTENT_SPEC.md` still applies (citation domains,
factual-accuracy rules, plausible distractors, no answer-length giveaways).

---

## 1. What makes these exams "hard mode"

The real CCAR-P exam presents a **client use case** and then asks a series of questions
about it. Three properties define this format, and every question must exhibit all three:

1. **Shared scenario.** Questions are not self-contained. They lean on facts established
   in the case scenario (scale, latency budget, regulatory posture, team size, existing
   stack, cost ceiling). A question that reads identically with the scenario removed is
   a failed question — rewrite it.

2. **Cross-domain reasoning.** Arriving at the correct answer must require combining at
   least two exam domains. Example: choosing a caching strategy (D2) that also has to
   survive a data-residency constraint (D5) and not break a tool-use loop (D3). Each
   question declares a `primaryDomain` (used for section scoring) and 1–3
   `secondaryDomains` it genuinely draws on.

3. **A strong answer and a defensible runner-up.** Exactly one option is `correct`.
   Exactly one *other* option is marked `runnerUp: true`. The runner-up must be a
   genuinely reasonable architecture that a competent practitioner might choose — it
   loses only because it fails to satisfy one or more *specific, named* requirements
   from the case. The remaining two options are ordinary distractors: wrong on the
   merits, not merely weaker.

---

## 2. Exam shape

| | |
|---|---|
| Question count | **63** |
| Time limit | **120 minutes** |
| Passing score | **720** scaled (`100 + correct/total × 900`) |
| Structure | **5 full cases × 12 questions + 1 mini-case × 3 questions** |

Files: `server/data/ccar-p/exam3/cs1.json` … `cs6.json`
       `server/data/ccar-p/exam4/cs1.json` … `cs6.json`
(`cs1`–`cs5` are 12 questions each; `cs6` is the 3-question mini-case.)

### Domain allocation (must match exactly)

Section scoring still reports the seven CCAR-P domains, so `primaryDomain` counts across
the whole exam must hit the blueprint. Per-case allocation:

| Case | D1 | D2 | D3 | D4 | D5 | D6 | D7 | Total |
|------|----|----|----|----|----|----|----|-------|
| cs1  | 3 | 2 | 3 | 2 | 1 | 1 | 0 | 12 |
| cs2  | 2 | 2 | 4 | 2 | 1 | 0 | 1 | 12 |
| cs3  | 2 | 3 | 3 | 2 | 1 | 1 | 0 | 12 |
| cs4  | 2 | 2 | 3 | 2 | 2 | 1 | 0 | 12 |
| cs5  | 2 | 2 | 3 | 2 | 2 | 1 | 0 | 12 |
| cs6  | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 3  |
| **Total** | **11** | **11** | **17** | **11** | **7** | **4** | **2** | **63** |

Domain names (use verbatim):

- `D1` Solution Design & Architecture
- `D2` Claude Models, Prompting & Context Engineering
- `D3` Integration (Tool Use, MCP, Agent SDK)
- `D4` Evaluation, Testing & Optimization
- `D5` Governance, Safety & Risk Management
- `D6` Stakeholder Communication & Lifecycle Management
- `D7` Developer Productivity & Operational Enablement

---

## 3. File schema

```json
{
  "examId": "ccar-p-exam3",
  "caseId": "CS1",
  "caseTitle": "Meridian Health — clinical documentation assistant",
  "caseScenario": "Two to four paragraphs of client context...",
  "caseRequirements": [
    "R1: p95 end-to-end latency under 4 seconds for the interactive path.",
    "R2: No PHI may leave the customer's VPC.",
    "R3: Every clinical summary must be traceable to source chart sections."
  ],
  "questions": [
    {
      "id": "P3-CS1-01",
      "primaryDomain": "D1",
      "secondaryDomains": ["D3", "D5"],
      "question": "Scenario-grounded question text...",
      "options": [
        {
          "key": "A",
          "text": "...",
          "correct": true,
          "explanation": "Why this satisfies R1, R2 and R3 together...",
          "citation": { "title": "...", "url": "https://docs.claude.com/..." }
        },
        {
          "key": "B",
          "text": "...",
          "correct": false,
          "runnerUp": true,
          "explanation": "This is a sound design and does satisfy R1 and R3, but it violates R2 because ...",
          "citation": { "title": "...", "url": "https://docs.claude.com/..." }
        },
        { "key": "C", "text": "...", "correct": false, "explanation": "...", "citation": { "...": "..." } },
        { "key": "D", "text": "...", "correct": false, "explanation": "...", "citation": { "...": "..." } }
      ]
    }
  ]
}
```

### Field rules

- `caseRequirements` — 4 to 6 entries, each prefixed `R1:`, `R2:`, … They are the
  scoring rubric the questions are written against. Requirements must be concrete and
  checkable (a number, a boundary, a compliance rule), never vague aspirations.
- `id` — `P3-CS{n}-{nn}` for exam 3, `P4-CS{n}-{nn}` for exam 4, `nn` zero-padded from `01`.
- `primaryDomain` — one of `D1`–`D7`; drives section scoring.
- `secondaryDomains` — 1–3 other domain ids, no duplicates, must not include the primary.
- `options` — exactly 4, keys `A`–`D` in order; exactly one `correct: true`; exactly one
  `runnerUp: true` on a **non-correct** option.
- `citation` — every option, on an approved Anthropic domain (see `CONTENT_SPEC.md`).

---

## 4. Writing rules specific to hard mode

1. **The runner-up explanation must name the requirement it fails.** Write
   "…but it does not meet **R2**, because …". This is the single most valuable teaching
   signal in these exams; a runner-up explanation that only says "this is less optimal"
   is unacceptable.

2. **The correct explanation must show the trade-off, not just the answer.** State
   explicitly why it beats the runner-up — which requirement the runner-up drops and this
   one keeps.

3. **No length giveaway.** The correct option must not be systematically the longest.
   Across each case file, aim for the correct option to be longest no more than ~3 of 12
   times. Make the runner-up as long and as polished as the correct answer.

4. **Vary which letter is correct.** Roughly even A/B/C/D distribution per file.

5. **Escalating difficulty within a case.** Early questions establish the architecture;
   later questions stress it (a new constraint arrives, a component fails, cost doubles,
   an auditor asks a question). Reference earlier decisions where natural.

6. **Realistic clients.** Invent a named company, an industry, a scale, and a budget.
   Sectors should differ across the 12 cases — no two cases in the same vertical.

7. **Factual accuracy outranks narrative.** Every technical claim must be verifiable in
   current Anthropic documentation. If the story needs a capability Claude does not have,
   change the story.

---

## 5. Validation

`npm run validate` checks these files structurally: counts, id format, domain allocation
against the table above, exactly one correct and exactly one runner-up, citation domains,
and explanation length. Run it after every content change.
