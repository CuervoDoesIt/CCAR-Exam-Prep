# CCAR Mock Exam Content Specification

This spec governs ALL question bank JSON files in `server/data/`. Every authoring and review agent must follow it exactly.

## Exams

### CCAR-F — Claude Certified Architect: Foundations
- 60 questions, 120 minutes, passing scaled score 720 (scale: `100 + (correct/60)*900`, rounded)
- Exams 1–2 are all single-choice; exam 5 mixes in 15 multiple-response items (see below)
- Domains and question counts per exam set:
  | ID | Domain | Questions |
  |----|--------|-----------|
  | D1 | Agentic Architecture & Orchestration | 14 |
  | D2 | Tool Design & MCP Integration | 13 |
  | D3 | Claude Code Configuration & Workflows | 11 |
  | D4 | Prompt Engineering & Structured Output | 12 |
  | D5 | Context Management & Reliability | 10 |

### CCAR-P — Claude Certified Architect: Professional
- 63 questions, 120 minutes, passing scaled score 720 (scale: `100 + (correct/63)*900`, rounded)
- Exams 1–2 are all single-choice; exam 5 mixes in 16 multiple-response items (see below)
- Domains and question counts per exam set:
  | ID | Domain | Questions |
  |----|--------|-----------|
  | D1 | Solution Design & Architecture | 11 |
  | D2 | Claude Models, Prompting & Context Engineering | 11 |
  | D3 | Integration (Tool Use, MCP, Agent SDK) | 17 |
  | D4 | Evaluation, Testing & Optimization | 11 |
  | D5 | Governance, Safety & Risk Management | 7 |
  | D6 | Stakeholder Communication & Lifecycle Management | 4 |
  | D7 | Developer Productivity & Operational Enablement | 2 |

### CCDV-F — Claude Certified Developer: Foundations
- 53 questions, 120 minutes, passing scaled score 720 (scale: `100 + (correct/53)*900`, rounded)
- Domain names and weights are taken verbatim from Anthropic's *Claude Certified Developer – Foundations Exam Guide*, v1.0, effective July 2026.
- Domains and question counts per exam set:
  | ID | Domain | Weight | Questions |
  |----|--------|--------|-----------|
  | D1 | Agents and Workflows | 14.7% | 8 |
  | D2 | Applications and Integration | 33.1% | 17 |
  | D3 | Claude Code | 3.1% | 2 |
  | D4 | Eval, Testing, and Debugging | 2.6% | 1 |
  | D5 | Model Selection and Optimization | 16.8% | 9 |
  | D6 | Prompt and Context Engineering | 11.0% | 6 |
  | D7 | Security and Safety | 8.1% | 4 |
  | D8 | Tools and MCPs | 10.6% | 6 |
- **Includes multiple-response items** (see "Multiple-response items" below). Target 8 of the 53 per exam set.
- **Emphasis differs from CCAR.** CCAR is a solution-architecture credential — design judgement and trade-offs. CCDV-F is an implementation credential: request/response shapes, SDK usage, parameter semantics, error handling, and operational mechanics. Where CCAR-F asks "which architecture fits", CCDV-F asks "which call, parameter, or code change produces this result".
- Topics that CCAR-F lists as **out of scope** are **in scope** for CCDV-F and are the cleanest place to avoid duplicating existing content: streaming, vision/image inputs, prompt caching mechanics, authentication and API key management, and rate limiting / retry behaviour.

## File layout

One JSON file per domain per exam set, e.g. `server/data/ccar-f/exam1/d1.json`.

## JSON schema (per domain file)

```json
{
  "examId": "ccar-f-exam1",
  "domainId": "D1",
  "domainName": "Agentic Architecture & Orchestration",
  "questions": [
    {
      "id": "F1-D1-01",
      "question": "Scenario text ending in a clear question?",
      "options": [
        {
          "key": "A",
          "text": "Option text.",
          "correct": false,
          "explanation": "2-4 sentences: WHY this is wrong (or right), grounded in Anthropic guidance. Written to teach, not just judge.",
          "citation": { "title": "Human-readable doc title", "url": "https://..." }
        }
        // exactly 4 options: A, B, C, D — exactly ONE has "correct": true
      ]
    }
  ]
}
```

## Multiple-response items

All three certifications include "Which TWO…" items. These use the same schema plus two fields:

```json
{
  "id": "V1-D8-03",
  "type": "multi",
  "selectCount": 2,
  "question": "... Which TWO practices should the team adopt?",
  "options": [ /* exactly 5 options: A, B, C, D, E — exactly TWO have "correct": true */ ]
}
```

Rules:
- `type: "multi"` requires `selectCount: 2` and exactly 5 options keyed A–E, of which exactly 2 are correct.
- The stem **must** contain the word `TWO` in caps so the candidate knows how many to pick; the validator enforces this.
- Scored all-or-nothing, as on the real exam. One right pick earns zero.
- Every option still needs its own explanation and citation. Explanations for the two correct options should say why each independently qualifies — not "A and C are both right".
- Omit `type`/`selectCount` entirely for normal single-choice items.
- **Not permitted in case-study (hard mode) exams** — the `runnerUp` mechanic is inherently a single-answer contrast.

### Where they live

| Set | Multiple-response items |
| --- | --- |
| `ccdv-f/exam1`, `ccdv-f/exam2` | 8 of 53 |
| `ccar-f/exam5` | 15 of 60 |
| `ccar-p/exam5` | 16 of 63 |
| `ccar-f/exam1|exam2`, `ccar-p/exam1|exam2` | 0 — frozen, see below |
| all `exam3`/`exam4` (case studies) | 0 — forbidden by the `runnerUp` contrast |

`ccar-f/exam5` and `ccar-p/exam5` exist **only** because exams 1 and 2 are frozen
while the user studies them. They carry the same blueprint and length as exams 1
and 2, so Real Mode section scoring stays faithful; the difference is that about
a quarter of the items are "Which TWO…". Per-domain multi targets are enforced by
`MULTI_BY_DOMAIN` in `validate.js` so the format cannot cluster into one section,
which would make that section's all-or-nothing scoring swingy.

Exam 5 content must not repeat exams 1 or 2 for the same certification — different
scenarios, and a different angle on any shared sub-topic.

## Content rules

1. **Single-choice**: exactly 4 options, exactly 1 correct. Randomize which letter is correct (roughly even distribution across A–D within a file).
2. **Scenario-based**: questions open with a short realistic enterprise scenario (fintech, healthcare, B2B SaaS, e-commerce, legal, etc.) then ask a decision question. CCAR-P scenarios include constraints (latency SLAs, cost budgets, compliance) and are harder than CCAR-F.
3. **Every option gets an explanation** — including wrong ones. Explanations must state the underlying Anthropic principle, e.g. "Anthropic's guidance is to start with the simplest solution and only add agentic complexity when it measurably improves outcomes."
4. **Every option gets a citation** to a real, currently-live Anthropic-family doc page. Verify each URL exists (WebFetch it) before citing. Approved sources:
   - https://docs.claude.com/en/docs/... (API/platform docs: tool use, prompt engineering, prompt caching, context windows, models, streaming, batches, embeddings, vision, extended thinking, citations)
   - https://docs.claude.com/en/docs/claude-code/... (Claude Code: settings, hooks, slash commands, memory/CLAUDE.md, subagents, MCP)
   - https://docs.claude.com/en/api/... (API reference)
   - https://modelcontextprotocol.io/... (MCP spec and docs)
   - https://www.anthropic.com/engineering/... (e.g. building-effective-agents, claude-code-best-practices, effective context engineering, multi-agent research system, writing tools for agents)
   - https://www.anthropic.com/news/... (model/feature announcements) — use sparingly
   If a URL 404s, find the current equivalent instead of citing it.
5. **Accuracy over plausibility**: never invent API parameters, config file names, header names, or model behaviors. If unsure, research first. Key facts that MUST be correct include: `stop_reason` values (`end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn`, `refusal`, `model_context_window_exceeded`), tool_use/tool_result message flow, prompt caching mechanics (cache prefix ordering, `cache_control` breakpoints, 5-min/1-h TTL), MCP primitives (tools/resources/prompts; of the client features, **sampling and roots are deprecated as of MCP protocol revision `2026-07-28`** — only elicitation remains current), Claude Code file locations (`.claude/commands/`, `.claude/agents/`, `CLAUDE.md`, `settings.json`, hooks events), context window sizes, and the guidance in "Building Effective Agents" (workflows vs agents, prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer).
6. **Distractors are plausible but definitively wrong** — common misconceptions, not absurdities. Avoid "all of the above"/"none of the above".
7. **No duplicate concepts** within a domain file; vary scenarios and industries. Exam 2 must not repeat Exam 1's questions (different scenarios and sub-topics or angles).
8. Keep question text under ~90 words; option text under ~35 words.
9. Valid JSON — no trailing commas, no comments. Validate mentally before writing.

## Volatile facts (re-verified 2026-09-07)

These have all changed recently enough that memorised knowledge is likely wrong. Re-fetch
the doc before relying on any of them; update this list when you find it stale.

- **Assistant prefill is no longer a valid technique on current models.** Never make it a
  correct answer. The documented replacements are structured outputs, `output_config.format`,
  system-prompt instructions, and XML output tags. It may appear only as a distractor, or in
  a stem that explicitly pins an older model.
  Precise boundary, verified 2026-09-07: prefilling *the last assistant turn* is unsupported
  "starting with Claude 4.6 models and Claude Mythos Preview", and such requests return a 400.
  Earlier models still support prefill, and assistant messages elsewhere in the conversation
  are unaffected. So write "on current models" — not "removed from the API", which is false.
  Source: `prompt-engineering/claude-prompting-best-practices`, §"Migrating away from
  prefilled responses". The old dedicated prefill doc page now redirects to the overview.
- **Extended-thinking effort is nested**: `output_config: { effort: "low"|"medium"|"high"|"xhigh"|"max" }`,
  default `"high"`. There is no top-level `effort` parameter.
- `thinking: { type: "adaptive" }` is current. `thinking: { type: "enabled", budget_tokens: N }`
  is deprecated and errors on the newest models.
- Fast mode is top-level `speed: "fast"` plus the `fast-mode-2026-02-01` beta header;
  not available with the Batch API.
- Thinking token accounting is at `usage.output_tokens_details.thinking_tokens`.
- `Authorization: Bearer` is the primary auth header; `x-api-key` is a legacy fallback.
- **Doc host migration**: `docs.claude.com` 301-redirects. Cite the canonical hosts —
  `platform.claude.com` for API/platform docs, `code.claude.com` for Claude Code docs.
- **Compaction and tool-result clearing are two different mechanisms — do not blur them.**
  Server-side *compaction* (`/build-with-claude/compaction`) replaces older content with a
  model-written summary, so a specific identifier is not guaranteed to survive. *Tool result
  clearing* (`/build-with-claude/context-editing`, `clear_tool_uses_20250919`) replaces the
  result *body* with placeholder text but leaves the preceding `tool_use` block — including
  its inputs — in place, since `clear_tool_inputs` defaults to false. So "clearing loses the
  citation" is only true when the citation lived in the tool *result*. Cite each mechanism to
  its own page; the compaction page does not document clearing and vice versa.
  Neither page contains any warning about losing "subtle detail" or nuance — do not attribute
  one to Anthropic. The supportable statement is that compaction "replaces older content with
  a concise summary", and the lossiness follows from that.
