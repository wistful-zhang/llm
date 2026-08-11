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
import {
  getRecoverableQuestionPublicationToken,
  parseQuestionPublicationTokens,
  questionPublicationTokensStorageKey,
} from './question-publication-tokens.mjs';
import { groupFollowUpsForDisplay } from './follow-up-display-core.mjs';
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
  const answerTitle = root.querySelector('[data-shared-question-answer-title]');
  const answerContent = root.querySelector('[data-shared-question-answer-content]');
  const answerBlock = root.querySelector('[data-shared-question-answer-block]')
    || answerContent?.closest('blockquote');
  const unanswered = root.querySelector('[data-shared-question-unanswered]');
  const ownerActions = root.querySelector('[data-shared-question-owner-actions]');
  const editLink = root.querySelector('[data-shared-question-edit]');
  const shareControls = root.querySelector('[data-share-controls]');
  const commentsRoot = root.querySelector('[data-question-comments]');
  let requestRevision = 0;
  let activeController = null;

  const makeElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const makeFollowUpItem = ({ question, answer: followUpAnswer }) => {
    const item = document.createElement('li');
    item.append(makeElement('strong', '', question));
    if (followUpAnswer) item.append(document.createTextNode(` ${followUpAnswer}`));
    return item;
  };

  const prepareSafeMath = (element, options = {}) => {
    if (!element) return false;
    const value = element.textContent || '';
    if (validateKramdownMath(value).length > 0) return false;
    prepareKramdownMath(element, options);
    return true;
  };

  const editUrl = (localId) => {
    const url = new URL(captureUrl, window.location.href);
    url.searchParams.set('edit', localId);
    url.hash = 'question-draft-form';
    return url.toString();
  };

  const findOwnedQuestion = (question) => {
    try {
      const raw = window.localStorage.getItem(questionDraftsStorageKey(repositoryId)) || '';
      if (!raw) return null;
      const state = parseQuestionDraftsJson(raw, { repositoryId });
      const publicationTokens = parseQuestionPublicationTokens(
        window.localStorage.getItem(questionPublicationTokensStorageKey(repositoryId)) || '',
        { repositoryId },
      );
      const owned = state.questions.find((candidate) => candidate.remoteId === question.id)
        || (question.localId
          ? state.questions.find((candidate) => (
            candidate.id === question.localId && candidate.visibility === 'public'
          ))
          : null);
      if (!owned) return null;
      return getRecoverableQuestionPublicationToken(publicationTokens, {
        remoteId: question.id,
        localId: owned.id,
      }) ? owned : null;
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
    if (revision !== requestRevision) return;
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
      ? `发布者（用户填写）：${question.author}`
      : '由题库使用者公开发布';
    source.hidden = !question.source;
    source.textContent = question.source ? `面试场景（用户填写）：${question.source}` : '';
    const dateLabel = formatDate(question.updatedAt || question.createdAt);
    publishedTime.hidden = !dateLabel;
    publishedTime.dateTime = question.updatedAt || question.createdAt || '';
    publishedTime.textContent = dateLabel ? `更新于 ${dateLabel}` : '';

    tags.replaceChildren(...question.tags.map((tag) => {
      const item = makeElement('span', 'tag', tag);
      item.setAttribute('role', 'listitem');
      return item;
    }));

    const followUpGroups = groupFollowUpsForDisplay(question.followUps);
    const hasFollowUps = followUpGroups.length > 0;
    followUpList.replaceChildren(...followUpGroups.map(makeFollowUpItem));
    followUps.hidden = !hasFollowUps;

    const hasAnswer = Boolean(question.answer);
    answerTitle.textContent = question.answerStatus === 'complete' ? '面试时怎么答' : '当前思路';
    answerContent.textContent = question.answer;
    answerTitle.hidden = !hasAnswer;
    answerBlock.hidden = !hasAnswer;
    answer.hidden = !hasAnswer && !hasFollowUps;
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

    const owned = findOwnedQuestion(question);
    ownerActions.hidden = !owned;
    if (owned) editLink.href = editUrl(owned.id);

    shareControls.dataset.shareTitle = question.title;
    const mathRoots = [];
    if (prepareSafeMath(title, { forceInline: true })) mathRoots.push(title);
    followUpList.querySelectorAll('li').forEach((item) => {
      if (prepareSafeMath(item, { forceInline: true })) mathRoots.push(item);
    });
    if (hasAnswer && prepareSafeMath(answerContent)) mathRoots.push(answerContent);

    loading.hidden = true;
    errorPanel.hidden = true;
    content.hidden = false;
    if (commentsRoot) {
      commentsRoot.dataset.questionSlug = question.id;
      commentsRoot.hidden = false;
      commentsRoot.dispatchEvent(new CustomEvent('question-comments:ready', { bubbles: true }));
    }
    mathRoots.forEach((element) => { void renderMath(element); });
  };

  const loadQuestion = async () => {
    const revision = ++requestRevision;
    activeController?.abort();
    activeController = null;
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
    activeController = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), PUBLIC_QUESTIONS_TIMEOUT_MS);
    try {
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (revision !== requestRevision) return;
      if (!response.ok) {
        if (response.status === 404) {
          showError('这道公开题已不存在', '它可能已被发布者删除或由站主下架。你可以返回题库继续浏览。', { retry: false });
          return;
        }
        throw new Error(await readQuestionsApiError(response, `公开题共享服务 ${response.status}`));
      }
      const question = normalizePublicQuestionResponse(await response.json());
      if (revision !== requestRevision) return;
      if (!question) throw new Error('共享题库返回了无法识别的题目数据。');
      renderQuestion(question, revision);
    } catch (caught) {
      if (revision !== requestRevision) return;
      const timedOut = caught?.name === 'AbortError';
      const serviceMessage = String(caught?.message || '');
      showError(
        timedOut ? '读取这道题超时了' : '暂时无法打开这道题',
        timedOut
          ? '网络响应较慢，可以重新加载。'
          : (/^(?:公开题共享服务|共享题库)/.test(serviceMessage)
            ? serviceMessage
            : '共享题库暂时没有响应，请稍后重试。'),
      );
    } finally {
      window.clearTimeout(timeoutId);
      if (activeController === controller) activeController = null;
    }
  };

  retryButton.addEventListener('click', () => { void loadQuestion(); });
  void loadQuestion();
}
