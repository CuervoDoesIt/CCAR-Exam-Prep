async function json(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  listExams: () => fetch('/api/exams').then(json),
  getExam: (id, mode) => fetch(`/api/exams/${id}?mode=${mode}`).then(json),
  submitAttempt: (examId, answers, elapsedSeconds) =>
    fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, answers, elapsedSeconds }),
    }).then(json),
  listAttempts: () => fetch('/api/attempts').then(json),
};
