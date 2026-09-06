// Lightweight localStorage persistence so a page reload never loses your place.
export function loadProgress(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProgress(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode — progress simply isn't persisted */
  }
}

export function clearProgress(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
