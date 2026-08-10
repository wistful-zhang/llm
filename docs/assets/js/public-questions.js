import {
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
  getPendingQuestionPublication,
  parseQuestionPublicationTokens,
  questionPublicationTokensStorageKey,
} from './question-publication-tokens.mjs';
import { validateKramdownMath } from './latex-input-core.mjs';
import { clearMath, prepareKramdownMath, renderMath } from './math-render.mjs';

const root = document.querySelector('[data-public-questions]');

if (root) {
  const apiBaseUrl = root.dataset.questionsApiUrl || '';
  const repositoryId = root.dataset.repositoryId || '';
  const captureUrl = root.dataset.captureUrl || '/capture/';
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
    if (!element) return;
    const source = element.textContent || '';
    if (validateKramdownMath(source).length === 0) prepareKramdownMath(element, options);
  };

  const prepareQuestionMath = (card) => {
    prepareSafeMath(card.querySelector('h2'), { forceInline: true });
    card.querySelectorAll('.public-question-answer')
      .forEach((answer) => prepareSafeMath(answer));
    card.querySelectorAll('.public-question-details-content li')
      .forEach((followUp) => prepareSafeMath(followUp, { forceInline: true }));
  };

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const editUrl = (localId) => {
    const url = new URL(captureUrl, window.location.href);
    url.searchParams.set('edit', localId);
    url.hash = 'question-draft-form';
    return url.toString();
  };

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
        .filter((question) => question.remoteId)
          .map((question) => [question.remoteId, question])),
        byLocalId: new Map(state.questions
          .filter((question) => (
            question.visibility === 'public'
              && getPendingQuestionPublication(publicationTokens, question.id)
          ))
          .map((question) => [question.id, question])),
      };
    } catch {
      return { byRemoteId: new Map(), byLocalId: new Map() };
    }
  };

  const createQuestion = (question, ownedByRemoteId) => {
    const card = makeElement('article', 'question-card question-card-public');
    card.dataset.category = question.category || '待整理';
    card.dataset.difficulty = question.difficulty || '待评估';
    card.dataset.verified = 'false';
    card.dataset.answerStatus = question.answerStatus;
    card.dataset.studyTier = question.studyTier;
    card.dataset.searchId = question.searchId;
    card.dataset.source = 'shared';
    card.dataset.remoteId = question.id;
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

    card.append(makeElement('div', 'card-number', ''));
    const body = makeElement('div', 'card-body');
    const meta = makeElement('div', 'card-meta');
    meta.append(
      makeElement('span', '', question.category === '待整理' || !question.category
        ? '未分类'
        : question.category),
      makeElement('span', 'question-visibility-badge question-visibility-public', '公开'),
    );
    if (question.author) meta.append(makeElement('span', 'public-question-author', question.author));
    if (question.difficulty && question.difficulty !== '待评估') {
      meta.insertBefore(
        makeElement('span', `difficulty difficulty-${question.difficulty}`, question.difficulty),
        meta.children[1],
      );
    }
    if (question.answerStatus !== 'complete') {
      meta.append(makeElement('span', 'answer-state-badge', '待解答'));
    } else {
      meta.append(makeElement('span', 'review-pending-badge', '参考答案 · 用户提供'));
    }
    if (question.followUps.length > 0) {
      meta.append(makeElement('span', '', `${question.followUps.length} 个追问`));
    }
    body.append(meta, makeElement('h2', '', question.title));

    const tags = makeElement('div', 'tag-list');
    question.tags.forEach((tag) => tags.append(makeElement('span', 'tag', tag)));
    body.append(tags);

    if (question.answer || question.followUps.length > 0 || question.source) {
      const details = makeElement('details', 'public-question-details');
      details.append(makeElement('summary', '', question.answer ? '查看参考答案' : '查看题目补充'));
      const content = makeElement('div', 'public-question-details-content');
      if (question.answer) content.append(makeElement('p', 'public-question-answer', question.answer));
      if (question.followUps.length > 0) {
        content.append(makeElement('strong', '', '追问'));
        const followUps = document.createElement('ol');
        question.followUps.forEach((item) => followUps.append(makeElement('li', '', item)));
        content.append(followUps);
      }
      if (question.source) content.append(makeElement('small', '', `来源：${question.source}`));
      details.append(content);
      body.append(details);
    }

    const owned = ownedByRemoteId.byRemoteId.get(question.id)
      || (question.localId ? ownedByRemoteId.byLocalId.get(question.localId) : null);
    const action = owned
      ? makeElement('a', 'card-arrow public-question-edit', '编辑 →')
      : makeElement('span', 'card-arrow', '公开');
    if (owned) action.href = editUrl(owned.id);
    card.append(body, action);
    prepareQuestionMath(card);
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

  const fetchAllQuestions = async (signal) => {
    const questions = [];
    const seenCursors = new Set();
    let cursor = 0;
    for (let page = 0; page < 20; page += 1) {
      if (seenCursors.has(cursor)) break;
      seenCursors.add(cursor);
      const response = await fetch(
        buildPublicQuestionsApiUrl(apiBaseUrl, cursor, PUBLIC_QUESTIONS_PAGE_SIZE),
        { headers: { Accept: 'application/json' }, signal },
      );
      if (!response.ok) throw new Error(`公开题共享服务 ${response.status}`);
      const payload = await response.json();
      questions.push(...normalizePublicQuestions(payload));
      const nextCursor = Number(payload?.nextCursor);
      if (payload?.nextCursor === null || !Number.isSafeInteger(nextCursor) || nextCursor < 0) break;
      cursor = nextCursor;
    }
    return [...new Map(questions.map((question) => [question.id, question])).values()];
  };

  const loadPublicQuestions = async ({ force = false } = {}) => {
    if (!apiBaseUrl || !list) {
      setStatus('当前站点尚未配置共享公开题服务；仓库题和私人题仍可正常使用。');
      if (fallback) fallback.hidden = false;
      notifyLoaded([]);
      return;
    }
    if (!force && Date.now() - lastLoadedAt < 5000) return;
    if (loadPromise) return loadPromise;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PUBLIC_QUESTIONS_TIMEOUT_MS);
    loadPromise = (async () => {
      try {
        const questions = await fetchAllQuestions(controller.signal);
        const ownedByRemoteId = ownedQuestions();
        clearMath(list);
        list.replaceChildren(...questions.map((question) => createQuestion(question, ownedByRemoteId)));
        void renderMath(list);
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
        window.clearTimeout(timeoutId);
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
