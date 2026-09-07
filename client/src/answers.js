// Answers are stored per question as either a single option key ("B") for
// single-choice questions or an array of keys (["B","D"]) for multiple-response
// questions. Everything below normalises to arrays so both shapes — including
// sessions saved to localStorage before multi-select existed — behave the same.

export function toKeys(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function selectCount(q) {
  return q.selectCount ?? 1;
}

// True once the user has picked the required number of options. A partially
// filled multi-select is deliberately NOT an answer: the real exam scores
// multiple-response items all-or-nothing.
export function isAnswered(q, value) {
  return toKeys(value).length === selectCount(q);
}

export function correctKeys(q) {
  return q.options.filter((o) => o.correct).map((o) => o.key);
}

export function sameSet(a, b) {
  const x = [...toKeys(a)].sort();
  const y = [...toKeys(b)].sort();
  return x.length === y.length && x.every((k, i) => k === y[i]);
}

export function isCorrect(q, value) {
  return isAnswered(q, value) && sameSet(value, correctKeys(q));
}

// Toggling a key. Single-choice replaces (and clicking the current pick clears
// it); multi-select adds until full, and refuses extras rather than silently
// evicting an earlier pick the user may still want.
export function toggleKey(q, value, key) {
  const keys = toKeys(value);
  const want = selectCount(q);
  if (want === 1) return keys[0] === key ? undefined : key;
  if (keys.includes(key)) {
    const next = keys.filter((k) => k !== key);
    return next.length ? next : undefined;
  }
  if (keys.length >= want) return keys;
  return [...keys, key];
}
