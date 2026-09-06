# CCAR Mock Exam Content Specification

This spec governs ALL question bank JSON files in `server/data/`. Every authoring and review agent must follow it exactly.

## Exams

### CCAR-F — Claude Certified Architect: Foundations
- 60 single-choice questions, 120 minutes, passing scaled score 720 (scale: `100 + (correct/60)*900`, rounded)
- Domains and question counts per exam set:
  | ID | Domain | Questions |
  |----|--------|-----------|
  | D1 | Agentic Architecture & Orchestration | 14 |
  | D2 | Tool Design & MCP Integration | 13 |
  | D3 | Claude Code Configuration & Workflows | 11 |
  | D4 | Prompt Engineering & Structured Output | 12 |
  | D5 | Context Management & Reliability | 10 |

### CCAR-P — Claude Certified Architect: Professional
- 63 single-choice questions, 120 minutes, passing scaled score 720 (scale: `100 + (correct/63)*900`, rounded)
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
5. **Accuracy over plausibility**: never invent API parameters, config file names, header names, or model behaviors. If unsure, research first. Key facts that MUST be correct include: `stop_reason` values (`tool_use`, `end_turn`, `max_tokens`, `stop_sequence`, `refusal`), tool_use/tool_result message flow, prompt caching mechanics (cache prefix ordering, `cache_control` breakpoints, 5-min/1-h TTL), MCP primitives (tools/resources/prompts + sampling/roots/elicitation), Claude Code file locations (`.claude/commands/`, `.claude/agents/`, `CLAUDE.md`, `settings.json`, hooks events), context window sizes, and the guidance in "Building Effective Agents" (workflows vs agents, prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer).
6. **Distractors are plausible but definitively wrong** — common misconceptions, not absurdities. Avoid "all of the above"/"none of the above".
7. **No duplicate concepts** within a domain file; vary scenarios and industries. Exam 2 must not repeat Exam 1's questions (different scenarios and sub-topics or angles).
8. Keep question text under ~90 words; option text under ~35 words.
9. Valid JSON — no trailing commas, no comments. Validate mentally before writing.
