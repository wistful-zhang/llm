import { parseQuestionDraftsJson } from './question-drafts-core.mjs';

export const LOCAL_QUESTION_PREVIEW_LIMIT = 6;

export function summarizeLocalQuestions(raw, options = {}) {
  const repositoryId = String(options.repositoryId || '');
  const limit = Number.isInteger(options.limit) && options.limit > 0
    ? Math.min(options.limit, 20)
    : LOCAL_QUESTION_PREVIEW_LIMIT;

  if (!raw) {
    return {
      total: 0,
      complete: 0,
      plannedPublic: 0,
      questions: [],
    };
  }

  const state = parseQuestionDraftsJson(raw, { repositoryId });
  const sorted = [...state.questions]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return {
    total: sorted.length,
    complete: sorted.filter((question) => question.answerStatus === 'complete').length,
    plannedPublic: sorted.filter((question) => question.visibility === 'public').length,
    questions: sorted.slice(0, limit).map((question) => ({
      id: question.id,
      title: question.title,
      category: question.category,
      difficulty: question.difficulty,
      answerStatus: question.answerStatus,
      visibility: question.visibility,
      updatedAt: question.updatedAt,
    })),
  };
}
