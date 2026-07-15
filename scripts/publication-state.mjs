export const hasMeaningfulAnswer = (body = '') => body
  .replace(/<!--[^]*?-->/g, '')
  .replace(/<p>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, '')
  .trim()
  .length > 0;

export const ANSWER_STATUSES = Object.freeze({
  pending: 'pending',
  complete: 'complete',
});

const allowedAnswerStatuses = new Set(Object.values(ANSWER_STATUSES));

export const getEffectiveAnswerStatus = ({ answerStatus = '', body = '' } = {}) => {
  const explicitStatus = String(answerStatus || '').trim();
  if (!explicitStatus) {
    return hasMeaningfulAnswer(body) ? ANSWER_STATUSES.complete : ANSWER_STATUSES.pending;
  }
  return allowedAnswerStatuses.has(explicitStatus) ? explicitStatus : null;
};

export const hasCompleteAnswer = ({ answerStatus = '', body = '' } = {}) =>
  getEffectiveAnswerStatus({ answerStatus, body }) === ANSWER_STATUSES.complete &&
  hasMeaningfulAnswer(body);

export const getPublicationState = ({ published, verified, answerStatus = '', body = '' }) => {
  const effectiveAnswerStatus = getEffectiveAnswerStatus({ answerStatus, body });
  if (effectiveAnswerStatus === null) return 'invalid';
  if (!published) return 'draft';
  if (effectiveAnswerStatus !== ANSWER_STATUSES.complete || !hasMeaningfulAnswer(body)) {
    return 'question-only';
  }
  return verified ? 'verified' : 'answered';
};
