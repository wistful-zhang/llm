const ANSWER_PREFIX = /^答\s*[：:]\s*/u;
const INLINE_ANSWER = /^(.*?(?:[？?]|\s))答\s*[：:]\s*(.*)$/u;
const QUESTION_END = /[？?]\s*$/u;
const STATEMENT_END = /[。.!！]\s*$/u;

const normalizeItem = (value) => String(value || '').trim();

const stripAnswerPrefix = (value) => normalizeItem(value)
  .replace(ANSWER_PREFIX, '')
  .trim();

const splitExplicitPair = (text) => {
  const match = INLINE_ANSWER.exec(text);
  if (!match) return null;
  return {
    question: match[1].trim(),
    answer: match[2].trim(),
  };
};

const isLegacyAlternatingList = (items) => (
  items.length >= 4
  && items.length % 2 === 0
  && items.every((item) => !splitExplicitPair(item) && !ANSWER_PREFIX.test(item))
  && items.every((item, index) => (
    index % 2 === 0
      ? QUESTION_END.test(item)
      : !QUESTION_END.test(item) && STATEMENT_END.test(item)
  ))
);

export const groupFollowUpsForDisplay = (values) => {
  const items = (Array.isArray(values) ? values : [])
    .map(normalizeItem)
    .filter(Boolean);

  if (isLegacyAlternatingList(items)) {
    const groups = [];
    for (let index = 0; index < items.length; index += 2) {
      groups.push({ question: items[index], answer: items[index + 1] });
    }
    return groups;
  }

  const groups = [];
  items.forEach((item) => {
    const explicitPair = splitExplicitPair(item);
    if (explicitPair) {
      groups.push(explicitPair);
      return;
    }

    if (ANSWER_PREFIX.test(item) && groups.length > 0 && !groups.at(-1).answer) {
      groups.at(-1).answer = stripAnswerPrefix(item);
      return;
    }

    groups.push({ question: stripAnswerPrefix(item), answer: '' });
  });
  return groups;
};
