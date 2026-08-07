import {
  buildPublicQuestionsApiUrl,
  normalizePublicQuestions,
  PUBLIC_QUESTIONS_TIMEOUT_MS,
} from './question-collaboration-core.mjs';

const root = document.querySelector('[data-public-questions]');

if (root) {
  const repositoryNwo = root.dataset.repositoryNwo || '';
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

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const createQuestion = (question) => {
    const link = makeElement('a', 'question-card question-card-public');
    link.href = question.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.dataset.category = question.category || '待整理';
    link.dataset.difficulty = question.difficulty || '待评估';
    link.dataset.verified = 'false';
    link.dataset.answerStatus = question.answerStatus;
    link.dataset.studyTier = question.studyTier;
    link.dataset.searchId = question.id;
    link.dataset.source = 'github';
    if (question.localId) link.dataset.localId = question.localId;
    link.dataset.search = [
      question.title,
      question.category,
      question.difficulty,
      question.answer,
      ...question.followUps,
      ...question.tags,
      question.author,
    ].join(' ');

    link.append(makeElement('div', 'card-number', ''));
    const body = makeElement('div', 'card-body');
    const meta = makeElement('div', 'card-meta');
    meta.append(
      makeElement('span', '', question.category === '待整理' || !question.category
        ? '未分类'
        : question.category),
      makeElement('span', 'question-visibility-badge question-visibility-public', '公开'),
      makeElement('span', 'public-question-author', `${question.author} · #${question.number}`),
    );
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
    link.append(body, makeElement('span', 'card-arrow', '查看 →'));
    return link;
  };

  const notifyLoaded = (questions) => {
    document.dispatchEvent(new CustomEvent('question-library:public-loaded', {
      detail: { localIds: questions.map((question) => question.localId).filter(Boolean) },
    }));
    document.dispatchEvent(new CustomEvent('question-library:changed'));
  };

  const loadPublicQuestions = async ({ force = false } = {}) => {
    if (!repositoryNwo || !list) {
      setStatus('当前预览没有连接可用的 GitHub 仓库；仓库题和私人题仍可正常使用。');
      if (fallback) fallback.hidden = false;
      return;
    }
    if (!force && Date.now() - lastLoadedAt < 5000) return;
    if (loadPromise) return loadPromise;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PUBLIC_QUESTIONS_TIMEOUT_MS);
    loadPromise = (async () => {
      try {
        const response = await fetch(buildPublicQuestionsApiUrl(repositoryNwo, 100, 1), {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`GitHub Issues API ${response.status}`);
        const questions = normalizePublicQuestions(await response.json(), repositoryNwo);
        list.replaceChildren(...questions.map(createQuestion));
        list.hidden = questions.length === 0;
        if (fallback) fallback.hidden = true;
        setStatus(questions.length > 0
          ? `已载入 ${questions.length} 道大家直接发布的公开题目。`
          : '还没有使用者发布公开题目；公开提交后会直接加入这里。');
        lastLoadedAt = Date.now();
        notifyLoaded(questions);
      } catch {
        setStatus('大家发布的公开题目暂时无法读取；仓库题和私人题仍可正常使用。');
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
