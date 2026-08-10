import {
  buildPublicQuestionApiUrl,
  normalizePublicQuestionResponse,
  PUBLIC_QUESTIONS_TIMEOUT_MS,
  readQuestionsApiError,
} from './question-collaboration-core.mjs';
import {
  parseQuestionDraftsJson,
  questionDraftsStorageKey,
} from './question-drafts-core.mjs';
import { validateKramdownMath } from './latex-input-core.mjs';
import { prepareKramdownMath, renderMath } from './math-render.mjs';

const root = document.querySelector('[data-shared-question]');
const genericAuthors = new Set(['匿名用户', '匿名发布者']);

if (root) {
  const apiBaseUrl = root.dataset.questionsApiUrl || '';
  const repositoryId = root.dataset.repositoryId || '';
  const captureUrl = root.dataset.captureUrl || '/capture/';
  const siteTitle = root.dataset.siteTitle || '大模型面经';
  const loading = root.querySelector('[data-shared-question-loading]');
  const errorPanel = root.querySelector('[data-shared-question-error]');
  const errorTitle = root.querySelector('[data-shared-question-error-title]');
  const errorMessage = root.querySelector('[data-shared-question-error-message]');
  const retryButton = root.querySelector('[data-shared-question-retry]');
  const content = root.querySelector('[data-shared-question-content]');
  const eyebrow = root.querySelector('[data-shared-question-eyebrow]');
  const title = root.querySelector('[data-shared-question-title]');
  const answerBadge = root.querySelector('[data-shared-question-answer-badge]');
  const author = root.querySelector('[data-shared-question-author]');
  const source = root.querySelector('[data-shared-question-source]');
  const publishedTime = root.querySelector('[data-shared-question-time]');
  const tags = root.querySelector('[data-shared-question-tags]');
  const followUps = root.querySelector('[data-shared-question-followups]');
  const followUpList = root.querySelector('[data-shared-question-followup-list]');
  const coach = root.querySelector('[data-question-coach]');
  const draftNote = root.querySelector('[data-shared-question-draft-note]');
  const answer = root.querySelector('[data-question-answer]');
  const unanswered = root.querySelector('[data-shared-question-unanswered]');
  const ownerActions = root.querySelector('[data-shared-question-owner-actions]');
  const editLink = root.querySelector('[data-shared-question-edit]');
  const shareControls = root.querySelector('[data-share-controls]');
  let requestRevision = 0;

  const makeElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const prepareSafeMath = (element, options = {}) => {
    if (!element) return;
    const value = element.textContent || '';
    if (validateKramdownMath(value).length === 0) prepareKramdownMath(element, options);
  };

  const editUrl = (localId) => {
    const url = new URL(captureUrl, window.location.href);
    url.searchParams.set('edit', localId);
    url.hash = 'question-draft-form';
    return url.toString();
  };

  const findOwnedQuestion = (remoteId) => {
    try {
      const raw = window.localStorage.getItem(questionDraftsStorageKey(repositoryId)) || '';
      if (!raw) return null;
      const state = parseQuestionDraftsJson(raw, { repositoryId });
      return state.questions.find((question) => question.remoteId === remoteId) || null;
    } catch {
      return null;
    }
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const setAnswerBadge = (text, className) => {
    answerBadge.className = className;
    answerBadge.textContent = text;
  };

  const showError = (heading, message, { retry = true } = {}) => {
    loading.hidden = true;
    content.hidden = true;
    errorPanel.hidden = false;
    errorTitle.textContent = heading;
    errorMessage.textContent = message;
    retryButton.hidden = !retry;
  };

  const renderQuestion = (question, revision) => {
    eyebrow.textContent = question.difficulty === '待评估'
      ? (question.category === '待整理' ? '未分类' : question.category)
      : `${question.category === '待整理' ? '未分类' : question.category} · ${question.difficulty}`;
    title.textContent = question.title;
    document.title = `${question.title} · ${siteTitle}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = `公开面试题：${question.title}`;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.href;
    const openGraphUrl = document.querySelector('meta[property="og:url"]');
    if (openGraphUrl) openGraphUrl.content = window.location.href;
    const openGraphTitle = document.querySelector('meta[property="og:title"]');
    if (openGraphTitle) openGraphTitle.content = document.title;

    author.textContent = question.author && !genericAuthors.has(question.author)
      ? `发布者：${question.author}`
      : '由题库使用者公开发布';
    source.hidden = !question.source;
    source.textContent = question.source ? `面试场景：${question.source}` : '';
    const dateLabel = formatDate(question.updatedAt || question.createdAt);
    publishedTime.hidden = !dateLabel;
    publishedTime.dateTime = question.updatedAt || question.createdAt || '';
    publishedTime.textContent = dateLabel ? `更新于 ${dateLabel}` : '';

    tags.replaceChildren(...question.tags.map((tag) => {
      const item = makeElement('span', 'tag', tag);
      item.setAttribute('role', 'listitem');
      return item;
    }));

    followUpList.replaceChildren(...question.followUps.map((item) => makeElement('li', '', item)));
    followUps.hidden = question.followUps.length === 0;

    answer.replaceChildren();
    const hasAnswer = Boolean(question.answer);
    if (hasAnswer) answer.append(makeElement('p', 'shared-question-answer-text', question.answer));
    answer.hidden = !hasAnswer;
    coach.hidden = !hasAnswer || question.answerStatus !== 'complete';
    draftNote.hidden = !hasAnswer || question.answerStatus === 'complete';
    unanswered.hidden = hasAnswer;
    if (question.answerStatus === 'complete' && hasAnswer) {
      setAnswerBadge('网友答法 · 未核验', 'review-pending-badge');
    } else if (hasAnswer) {
      setAnswerBadge('思路未完成', 'answer-state-badge');
    } else {
      setAnswerBadge('待解答', 'answer-state-badge');
    }

    const owned = findOwnedQuestion(question.id);
    ownerActions.hidden = !owned;
    if (owned) editLink.href = editUrl(owned.id);

    shareControls.dataset.shareTitle = question.title;
    prepareSafeMath(title, { forceInline: true });
    followUpList.querySelectorAll('li').forEach((item) => prepareSafeMath(item, { forceInline: true }));
    prepareSafeMath(answer);
    if (revision !== requestRevision) return;

    loading.hidden = true;
    errorPanel.hidden = true;
    content.hidden = false;
    title.focus({ preventScroll: true });
    void renderMath(content);
  };

  const loadQuestion = async () => {
    const revision = ++requestRevision;
    loading.hidden = false;
    errorPanel.hidden = true;
    content.hidden = true;

    const questionId = new URLSearchParams(window.location.search).get('id') || '';
    if (!questionId) {
      showError('没有指定要查看的题目', '请先从题库中选择一道公开题。', { retry: false });
      return;
    }
    if (!apiBaseUrl) {
      showError('共享公开题服务尚未配置', '题库主人需要先配置公开题服务；内置题和私人题仍可正常使用。', { retry: false });
      return;
    }
    let apiUrl;
    try {
      apiUrl = buildPublicQuestionApiUrl(apiBaseUrl, questionId);
    } catch {
      showError(
        '公开题链接不完整',
        '这个链接中的题目编号无效，请返回题库重新打开。',
        { retry: false },
      );
      return;
    }

    const normalizedQuestionId = questionId.trim().toLowerCase();
    const canonicalUrl = new URL(window.location.href);
    canonicalUrl.search = '';
    canonicalUrl.hash = '';
    canonicalUrl.searchParams.set('id', normalizedQuestionId);
    if (canonicalUrl.toString() !== window.location.href) {
      window.history.replaceState(null, '', canonicalUrl);
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PUBLIC_QUESTIONS_TIMEOUT_MS);
    try {
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 404) {
          showError('这道公开题已不存在', '它可能已被发布者删除或由站主下架。你可以返回题库继续浏览。', { retry: false });
          return;
        }
        throw new Error(await readQuestionsApiError(response, `公开题共享服务 ${response.status}`));
      }
      const question = normalizePublicQuestionResponse(await response.json());
      if (!question) throw new Error('共享题库返回了无法识别的题目数据。');
      renderQuestion(question, revision);
    } catch (caught) {
      if (revision !== requestRevision) return;
      const timedOut = caught?.name === 'AbortError';
      showError(
        timedOut ? '读取这道题超时了' : '暂时无法打开这道题',
        timedOut ? '网络响应较慢，可以重新加载。' : '共享题库暂时没有响应，请稍后重试。',
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  retryButton.addEventListener('click', () => { void loadQuestion(); });
  void loadQuestion();
}
