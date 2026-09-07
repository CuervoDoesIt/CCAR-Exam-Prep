# CCAR Exam Prep

An interactive study app for the Claude Certified **Architect** exams — CCAR-F (Foundations) and CCAR-P (Professional) — and the Claude Certified **Developer** exam, CCDV-F (Foundations).

Twelve full-length mock exams — 704 questions total — each answer option explained and cited against Anthropic's official documentation. Every certification has both a blueprint-exact set and a harder case-study set.

## Two study modes

**Learning Mode** — Work at your own pace. Every option, right or wrong, comes with an explanation of *why* and a link to the Anthropic documentation it derives from. Filter by exam domain or by case study, and your position is saved automatically so you can close the tab and pick up later.

**Real Mode** — The exam as it actually runs: timed, no hints, no answers until you submit. You get a flaggable question palette for review passes. On submission you receive a scaled score, a pass/fail verdict, and a correct/incorrect breakdown by exam section showing both the fraction and the percentage. The countdown is anchored to an absolute deadline, so refreshing the page never grants extra time.

## The exams

| Exam | Format | Questions | Time | Pass |
|---|---|---|---|---|
| CCAR-F Mock 1 & 2 | 5 domains | 60 | 120 min | 720 / 1000 |
| CCAR-F Mock 3 & 4 | Case studies · **hard** | 60 | 120 min | 720 / 1000 |
| CCAR-P Mock 1 & 2 | 7 domains | 63 | 120 min | 720 / 1000 |
| CCAR-P Mock 3 & 4 | Case studies · **hard** | 63 | 120 min | 720 / 1000 |
| CCDV-F Mock 1 & 2 | 8 domains | 53 | 120 min | 720 / 1000 |
| CCDV-F Mock 3 & 4 | Case studies · **hard** | 53 | 120 min | 720 / 1000 |

The two tracks deliberately test different things. CCAR asks *which architecture fits*; CCDV-F asks *which call, parameter, or code change produces this result* — request and response shapes, `stop_reason` handling, streaming, prompt-caching mechanics, tool round trips, retry behaviour. Topics CCAR-F lists as out of scope are core CCDV-F material, so the banks barely overlap.

The CCDV-F exams also include **multiple-response** items ("Which TWO…"), as the real one does. They are scored all-or-nothing: one right pick earns zero.

### Case-study exams (hard mode)

Mock 3 & 4 of every certification mirror the harder shape of the real professional exam: a detailed client scenario with numbered requirements (`R1`–`R6`), followed by a run of questions that each require reasoning across several exam domains at once.

Their defining feature is the **close second**. On every question two options are defensible, but one is stronger because it satisfies *all* the stated requirements while the other quietly drops one. The runner-up is tracked separately, so your results tell you not just what you got wrong but where you chose a sound design that missed a requirement — usually the most useful thing to re-read.

Thirty-four client scenarios, no two in the same vertical: healthcare, finance, e-commerce, legal, field service, developer tooling, public sector, media, telecom, education, insurance, biotech, freight, airline, gaming, agritech, proptech, music streaming, construction, hospitality, philanthropy, automotive, maritime ports, electric utilities, retail pharmacy, film/VFX, recruiting, museums, card payments, semiconductors, veterinary care, apparel supply chain, wildfire response, and sports analytics.

The three hard-mode banks stay distinct by design. CCAR-P turns on governance and stakeholder pressure; CCAR-F stays inside the build — decomposition, tool boundaries, `CLAUDE.md` vs slash command vs hook, structured output, long-run context; CCDV-F turns on the wire — parameters, payload shapes, and error handling. CCAR-F and CCAR-P hard mode are blueprint-exact; CCDV-F's deliberately over-weights its two thinnest domains, which are only 2 and 1 items on the real exam and too thin to study from.

## Running it

```bash
npm run install:all   # install root, server, and client dependencies
npm run dev           # start both; client on :5173, API on :4000
```

The client proxies `/api` to the server, so open **http://localhost:5173**.

Other scripts:

```bash
npm run server        # API only
npm run client        # Vite dev server only
npm run validate      # structural + quality checks on all question banks
npm run build         # production client build
```

## How it's put together

- **`client/`** — Vite + React. `views/` holds the four screens (Home, LearningMode, RealMode, Results); `progress.js` handles localStorage persistence; `CasePanel.jsx` renders the collapsible client scenario on case exams.
- **`server/`** — Express. Loads question banks from `data/`, grades submissions, and persists attempt history to `store/`.
- **`server/data/{ccar-f,ccar-p,ccdv-f}/exam*/`** — the question banks. Domain exams use one file per domain (`d1.json`…); case exams use one file per case study (`cs1.json`…).
- **`client/src/answers.js`** — the one place that knows how an answer is shaped, so single-choice and multiple-response items are handled identically everywhere else.
- **`CONTENT_SPEC.md`** / **`CASE_SPEC.md`** — the authoring contracts for each format. `server/validate.js` enforces them.

Real Mode payloads are stripped server-side — options are reduced to key and text before they leave the API, so answers and explanations can't be read out of the network tab. Grading happens on the server.

## Content accuracy

Every question was reviewed a second time against live Anthropic documentation, checking answer keys, technical claims, numeric figures, and citation links. `npm run validate` additionally enforces the structural contract and guards against the ways multiple-choice banks tend to leak answers — the correct option being consistently longest, or the answer letters falling into a predictable pattern.

Citations point to `platform.claude.com`, `code.claude.com`, `modelcontextprotocol.io`, `anthropic.com`, and — in the older CCAR banks — `docs.claude.com`, which now redirects to the first two.

Anthropic's docs move quickly, and several facts changed recently enough that memory is an unreliable guide. `CONTENT_SPEC.md` carries a **Volatile facts** section listing the ones most likely to be stale; check it before authoring or trusting a question in those areas.

> Unofficial study material, not affiliated with or endorsed by Anthropic. Verify against the official documentation.
