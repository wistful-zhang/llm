import { parseQuestionDraftsJson } from './question-drafts-core.mjs';

export const LOCAL_QUESTION_PREVIEW_LIMIT = 6;

export const compareLocalQuestionNumber = (left, right) => {
  const numberOrder = Number(left?.localNumber) - Number(right?.localNumber);
  if (Number.isFinite(numberOrder) && numberOrder !== 0) return numberOrder;
  return String(left?.id || '').localeCompare(String(right?.id || ''));
};

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
    .sort(compareLocalQuestionNumber);

  return {
    total: sorted.length,
    complete: sorted.filter((question) => question.answerStatus === 'complete').length,
    plannedPublic: sorted.filter((question) => question.visibility === 'public').length,
    questions: sorted.slice(0, limit).map((question) => ({
      id: question.id,
      localNumber: question.localNumber,
      title: question.title,
      category: question.category,
      difficulty: question.difficulty,
      answerStatus: question.answerStatus,
      visibility: question.visibility,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    })),
  };
}
