import {
  buildPublicQuestionDetailUrl,
  buildPublicQuestionsApiUrl,
  normalizePublicQuestions,
  PUBLIC_QUESTIONS_PAGE_SIZE,
  PUBLIC_QUESTIONS_TIMEOUT_MS,
} from './question-collaboration-core.mjs';
import {
  parseQuestionDraftsJson,
  questionDraftsStorageKey,
} from './question-drafts-core.mjs';
import {
  getRecoverableQuestionPublicationToken,
  parseQuestionPublicationTokens,
  questionPublicationTokensStorageKey,
} from './question-publication-tokens.mjs';
import { validatePlainTextMath } from './latex-input-core.mjs';
import { clearMath, prepareKramdownMath, renderMath } from './math-render.mjs';
import { groupFollowUpsForDisplay } from './follow-up-display-core.mjs';

const root = document.querySelector('[data-public-questions]');
const genericAuthors = new Set(['匿名用户', '匿名发布者']);
const MAX_PUBLIC_QUESTION_PAGES = 500;

if (root) {
  const apiBaseUrl = root.dataset.questionsApiUrl || '';
  const repositoryId = root.dataset.repositoryId || '';
  const questionDetailUrl = root.dataset.questionDetailUrl || '/shared-question/';
  const status = root.querySelector('[data-public-questions-status]');
  const list = root.querySelector('[data-public-questions-list]');
  const fallback = root.querySelector('[data-public-questions-fallback]');
  let lastLoadedAt = 0;
  let loadPromise = null;

  const makeElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const prepareSafeMath = (element, options = {}) => {
    if (!element) return false;
    const source = element.textContent || '';
    if (validatePlainTextMath(source).length > 0) return false;
    prepareKramdownMath(element, options);
    return true;
  };

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const detailUrl = (questionId) => buildPublicQuestionDetailUrl(
    questionDetailUrl,
    questionId,
    window.location.href,
  );

  const ownedQuestions = () => {
    try {
      const raw = window.localStorage.getItem(questionDraftsStorageKey(repositoryId)) || '';
      if (!raw) return { byRemoteId: new Map(), byLocalId: new Map() };
      const state = parseQuestionDraftsJson(raw, { repositoryId });
      const publicationTokens = parseQuestionPublicationTokens(
        window.localStorage.getItem(questionPublicationTokensStorageKey(repositoryId)) || '',
        { repositoryId },
      );
      return {
        byRemoteId: new Map(state.questions
          .filter((question) => (
            question.remoteId
              && getRecoverableQuestionPublicationToken(publicationTokens, {
                remoteId: question.remoteId,
                localId: question.id,
              })
          ))
          .map((question) => [question.remoteId, question])),
        byLocalId: new Map(state.questions
          .filter((question) => (
            question.visibility === 'public'
              && getRecoverableQuestionPublicationToken(publicationTokens, {
                remoteId: question.remoteId,
                localId: question.id,
              })
          ))
          .map((question) => [question.id, question])),
      };
    } catch {
      return { byRemoteId: new Map(), byLocalId: new Map() };
    }
  };

  const createQuestion = (question, ownedByRemoteId) => {
    const followUpCount = groupFollowUpsForDisplay(question.followUps).length;
    const card = makeElement('a', 'question-card question-card-public');
    card.href = detailUrl(question.id);
    card.dataset.category = question.category || '待整理';
    card.dataset.difficulty = question.difficulty || '待评估';
    card.dataset.verified = 'false';
    card.dataset.answerStatus = question.answerStatus;
    card.dataset.studyTier = question.studyTier;
    card.dataset.searchId = question.searchId;
    card.dataset.source = 'shared';
    card.dataset.remoteId = question.id;
    card.dataset.questionNumber = String(question.libraryNumber);
    if (question.localId) card.dataset.localId = question.localId;
    card.dataset.search = [
      question.title,
      question.category,
      question.difficulty,
      question.answer,
      ...question.followUps,
      ...question.tags,
      question.author,
      question.source,
    ].join(' ');

    const number = makeElement(
      'div',
      'card-number card-number-public',
      `公${String(question.libraryNumber).padStart(3, '0')}`,
    );
    number.setAttribute('aria-label', `公开题第 ${question.libraryNumber} 题`);
    card.append(number);
    const body = makeElement('div', 'card-body');
    const meta = makeElement('div', 'card-meta');
    meta.append(
      makeElement('span', '', question.category === '待整理' || !question.category
        ? '未分类'
        : question.category),
      makeElement('span', 'question-visibility-badge question-visibility-public', '大家发布'),
    );
    if (question.author && !genericAuthors.has(question.author)) {
      meta.append(makeElement('span', 'public-question-author', question.author));
    }
    if (question.difficulty && question.difficulty !== '待评估') {
      meta.insertBefore(
        makeElement('span', `difficulty difficulty-${question.difficulty}`, question.difficulty),
        meta.children[1],
      );
    }
    if (question.answerStatus !== 'complete') {
      meta.append(makeElement('span', 'answer-state-badge', question.answer ? '思路未完成' : '待解答'));
    } else {
      meta.append(makeElement('span', 'review-pending-badge', '网友答法 · 未核验'));
    }
    if (followUpCount > 0) {
      meta.append(makeElement('span', '', `${followUpCount} 条追问`));
    }
    body.append(meta, makeElement('h2', '', question.title));

    const tags = makeElement('div', 'tag-list');
    question.tags.forEach((tag) => tags.append(makeElement('span', 'tag', tag)));
    body.append(tags);

    const owned = ownedByRemoteId.byRemoteId.get(question.id)
      || (question.localId ? ownedByRemoteId.byLocalId.get(question.localId) : null);
    if (owned) meta.append(makeElement('span', 'question-owner-badge', '我发布的'));
    const action = makeElement('span', 'card-arrow', '↗');
    action.setAttribute('aria-hidden', 'true');
    card.append(body, action);
    return card;
  };

  const notifyLoaded = (questions) => {
    document.dispatchEvent(new CustomEvent('question-library:public-loaded', {
      detail: {
        remoteIds: questions.map((question) => question.id),
        localIds: questions.map((question) => question.localId).filter(Boolean),
      },
    }));
    document.dispatchEvent(new CustomEvent('question-library:changed'));
  };

  const notifySettled = () => {
    root.dataset.publicQuestionsSettled = 'true';
    document.dispatchEvent(new CustomEvent('question-library:public-settled'));
  };

  const fetchQuestionPage = async (cursor) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PUBLIC_QUESTIONS_TIMEOUT_MS);
    try {
      const response = await fetch(
        buildPublicQuestionsApiUrl(apiBaseUrl, cursor, PUBLIC_QUESTIONS_PAGE_SIZE),
        { headers: { Accept: 'application/json' }, signal: controller.signal },
      );
      if (!response.ok) throw new Error(`公开题共享服务 ${response.status}`);
      return response.json();
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const fetchAllQuestions = async () => {
    const questions = [];
    const seenCursors = new Set();
    let cursor = 0;
    let reachedEnd = false;
    for (let page = 0; page < MAX_PUBLIC_QUESTION_PAGES; page += 1) {
      if (seenCursors.has(cursor)) throw new Error('公开题共享服务返回了重复分页游标');
      seenCursors.add(cursor);
      const payload = await fetchQuestionPage(cursor);
      questions.push(...normalizePublicQuestions(payload));
      const nextCursor = Number(payload?.nextCursor);
      if (payload?.nextCursor === null) {
        reachedEnd = true;
        break;
      }
      if (!Number.isSafeInteger(nextCursor) || nextCursor <= cursor) {
        throw new Error('公开题共享服务返回了无效分页游标');
      }
      cursor = nextCursor;
    }
    if (!reachedEnd) throw new Error('公开题数量超过单次安全读取上限');
    return [...new Map(questions.map((question) => [question.id, question])).values()]
      .sort((left, right) => (
        left.libraryNumber - right.libraryNumber || left.id.localeCompare(right.id)
      ));
  };

  const loadPublicQuestions = async ({ force = false } = {}) => {
    if (!apiBaseUrl || !list) {
      setStatus('当前站点尚未配置共享公开题服务；仓库题和私人题仍可正常使用。');
      if (fallback) fallback.hidden = false;
      notifyLoaded([]);
      notifySettled();
      return;
    }
    if (!force && Date.now() - lastLoadedAt < 5000) return;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      try {
        const questions = await fetchAllQuestions();
        const ownedByRemoteId = ownedQuestions();
        const cards = questions.map((question) => createQuestion(question, ownedByRemoteId));
        clearMath(list);
        list.replaceChildren(...cards);
        cards.forEach((card) => {
          const cardTitle = card.querySelector('h2');
          if (prepareSafeMath(cardTitle, { forceInline: true })) void renderMath(cardTitle);
        });
        list.hidden = questions.length === 0;
        if (fallback) fallback.hidden = true;
        setStatus(questions.length > 0
          ? `已载入 ${questions.length} 道大家直接发布的公开题目。`
          : '还没有使用者发布公开题目；选择公开并保存后会立即加入这里。');
        lastLoadedAt = Date.now();
        notifyLoaded(questions);
      } catch {
        setStatus('共享公开题暂时无法读取；仓库题和当前浏览器中的题目仍可正常使用。');
        if (fallback) fallback.hidden = false;
        document.dispatchEvent(new CustomEvent('question-library:changed'));
      } finally {
        notifySettled();
        loadPromise = null;
      }
    })();
    return loadPromise;
  };

  void loadPublicQuestions();
  window.addEventListener('focus', () => { void loadPublicQuestions({ force: true }); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void loadPublicQuestions({ force: true });
  });
}
