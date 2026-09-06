# CCAR Exam Prep

An interactive study app for the **CCAR-F (Foundations)** and **CCAR-P (Professional)** Claude Certified Architect exams.

Six full-length mock exams — 372 questions total — each answer option explained and cited against Anthropic's official documentation.

## Two study modes

**Learning Mode** — Work at your own pace. Every option, right or wrong, comes with an explanation of *why* and a link to the Anthropic documentation it derives from. Filter by exam domain or by case study, and your position is saved automatically so you can close the tab and pick up later.

**Real Mode** — The exam as it actually runs: timed, no hints, no answers until you submit. You get a flaggable question palette for review passes. On submission you receive a scaled score, a pass/fail verdict, and a correct/incorrect breakdown by exam section showing both the fraction and the percentage. The countdown is anchored to an absolute deadline, so refreshing the page never grants extra time.

## The exams

| Exam | Format | Questions | Time | Pass |
|---|---|---|---|---|
| CCAR-F Mock 1 & 2 | 5 domains | 60 | 120 min | 720 / 1000 |
| CCAR-P Mock 1 & 2 | 7 domains | 63 | 120 min | 720 / 1000 |
| CCAR-P Mock 3 & 4 | Case studies · **hard** | 63 | 120 min | 720 / 1000 |

### Case-study exams (hard mode)

Mock 3 and 4 mirror the harder shape of the real CCAR-P: a detailed client scenario with numbered requirements (`R1`–`R6`), followed by twelve questions that each require reasoning across several exam domains at once.

Their defining feature is the **close second**. On every question two options are defensible, but one is stronger because it satisfies *all* the stated requirements while the other quietly drops one. The runner-up is tracked separately, so your results tell you not just what you got wrong but where you chose a sound design that missed a requirement — usually the most useful thing to re-read.

Twelve client scenarios span healthcare, finance, e-commerce, legal, field service, developer tooling, public sector, media, telecom, education, insurance, and biotech.

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
- **`server/data/{ccar-f,ccar-p}/exam*/`** — the question banks. Domain exams use one file per domain (`d1.json`…); case exams use one file per case study (`cs1.json`…).
- **`CONTENT_SPEC.md`** / **`CASE_SPEC.md`** — the authoring contracts for each format. `server/validate.js` enforces them.

Real Mode payloads are stripped server-side — options are reduced to key and text before they leave the API, so answers and explanations can't be read out of the network tab. Grading happens on the server.

## Content accuracy

Every question was reviewed a second time against live Anthropic documentation, checking answer keys, technical claims, numeric figures, and citation links. `npm run validate` additionally enforces the structural contract and guards against the ways multiple-choice banks tend to leak answers — the correct option being consistently longest, or the answer letters falling into a predictable pattern.

Citations point to `docs.claude.com`, `platform.claude.com`, `code.claude.com`, `modelcontextprotocol.io`, and `anthropic.com`.

> Unofficial study material, not affiliated with or endorsed by Anthropic. Verify against the official documentation.
