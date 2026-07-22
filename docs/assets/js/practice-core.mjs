export const PRACTICE_VERSION = 1;

export const RATINGS = Object.freeze({
  mastered: '能独立讲清楚',
  prompted: '需要一些提示',
  unknown: '还不会',
  skipped: '暂时跳过',
});

const WEAK_RATING_ORDER = Object.freeze({ unknown: 0, prompted: 1, skipped: 2 });

export function isRating(value) {
  return Object.hasOwn(RATINGS, value);
}

export function uniqueQuestions(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    if (!question?.id || seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

export function filterQuestions(questions, filters = {}) {
  const category = String(filters.category || '');
  const difficulty = String(filters.difficulty || '');
  const requestedVerification = String(filters.verification || '');
  const verification = ['verified', 'review'].includes(requestedVerification) ? requestedVerification : '';

  return uniqueQuestions(questions).filter((question) => (
    (!category || question.category === category) &&
    (!difficulty || question.difficulty === difficulty) &&
    (!verification || (verification === 'verified') === (question.verified === true))
  ));
}

export function shuffleQuestions(questions, random = Math.random) {
  const shuffled = [...questions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const value = Math.min(Math.max(Number(random()) || 0, 0), 0.9999999999999999);
    const swapIndex = Math.floor(value * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function buildQueue(questions, filters = {}, requestedCount = 5, random = Math.random) {
  const pool = filterQuestions(questions, filters);
  const parsedCount = Number.parseInt(requestedCount, 10);
  const limit = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 5;
  return shuffleQuestions(pool, random).slice(0, Math.min(limit, pool.length));
}

export function summarizeSession(queue, records) {
  const recordById = new Map();
  records.forEach((record) => {
    if (record?.id && isRating(record.rating) && !recordById.has(record.id)) {
      const duration = Number(record.durationMs);
      recordById.set(record.id, {
        id: record.id,
        rating: record.rating,
        durationMs: Number.isFinite(duration) && duration >= 0 ? duration : 0,
      });
    }
  });

  const completed = queue
    .filter((question) => recordById.has(question.id))
    .map((question) => ({ ...question, ...recordById.get(question.id) }));

  const counts = Object.fromEntries(Object.keys(RATINGS).map((rating) => [rating, 0]));
  completed.forEach((record) => { counts[record.rating] += 1; });

  const weak = completed
    .filter((record) => record.rating !== 'mastered')
    .sort((left, right) => WEAK_RATING_ORDER[left.rating] - WEAK_RATING_ORDER[right.rating]);

  return {
    total: queue.length,
    completed: completed.length,
    counts,
    weak,
    records: completed,
    durationMs: completed.reduce((total, record) => total + record.durationMs, 0),
  };
}

export function restoreSession(value, questions, repositoryId) {
  if (!value || value.version !== PRACTICE_VERSION || value.repositoryId !== repositoryId) return null;
  if (!['asking', 'revealed'].includes(value.phase) || !Array.isArray(value.queue)) return null;

  const currentById = new Map(questions.map((question) => [question.id, question]));
  const queue = uniqueQuestions(value.queue.map((question) => {
    const id = String(question?.id || '');
    const current = currentById.get(id);
    const source = current || question;
    return {
      id,
      title: String(source?.title || ''),
      category: String(source?.category || ''),
      difficulty: String(source?.difficulty || ''),
      verified: source?.verified === true,
      url: String(source?.url || ''),
    };
  }));
  const cursor = Math.min(Math.max(Number.parseInt(value.cursor, 10) || 0, 0), queue.length);
  const availableIds = new Set(currentById.keys());
  const completedQueue = queue.slice(0, cursor);
  const originalCurrentId = queue[cursor]?.id;
  const remainingQueue = queue.slice(cursor).filter((question) => availableIds.has(question.id));
  const removedCount = queue.length - cursor - remainingQueue.length;
  const restoredQueue = [...completedQueue, ...remainingQueue];
  const records = Array.isArray(value.records)
    ? value.records.filter((record) => record?.id && isRating(record.rating))
    : [];

  if (restoredQueue.length === 0) return null;
  const complete = completedQueue.length >= restoredQueue.length;
  if (complete && records.length === 0) return null;

  const currentChanged = !complete && originalCurrentId !== restoredQueue[completedQueue.length]?.id;
  const elapsed = Number(value.currentElapsedMs);

  return {
    version: PRACTICE_VERSION,
    repositoryId,
    phase: complete || currentChanged ? 'asking' : value.phase,
    queue: restoredQueue,
    cursor: completedQueue.length,
    records,
    pendingRating: complete || currentChanged || !isRating(value.pendingRating) ? '' : value.pendingRating,
    currentElapsedMs: complete || currentChanged || !Number.isFinite(elapsed) || elapsed < 0 ? 0 : elapsed,
    filters: value.filters && typeof value.filters === 'object' ? value.filters : {},
    createdAt: String(value.createdAt || new Date().toISOString()),
    removedCount,
    complete,
  };
}
