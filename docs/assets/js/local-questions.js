import {
  parseQuestionDraftsJson,
  questionDraftsStorageKey,
} from './question-drafts-core.mjs';
import { groupFollowUpsForDisplay } from './follow-up-display-core.mjs';
import { compareLocalQuestionNumber } from './local-questions-core.mjs';

const PREVIEW_LIMIT = 6;
const VALID_VISIBILITIES = new Set(['private', 'public']);

export function selectLocalQuestions(questions, options = {}) {
  const visibility = VALID_VISIBILITIES.has(options.visibility) ? options.visibility : '';
  const limit = Number.isInteger(options.limit) && options.limit > 0
    ? Math.min(options.limit, 1000)
    : PREVIEW_LIMIT;
  const filtered = (Array.isArray(questions) ? questions : [])
    .filter((question) => !visibility || question.visibility === visibility)
    .sort(compareLocalQuestionNumber);

  return {
    total: filtered.length,
    complete: filtered.filter((question) => question.answerStatus === 'complete').length,
    questions: options.all === true ? filtered : filtered.slice(0, limit),
  };
}

const roots = typeof document === 'undefined'
  ? []
  : [...document.querySelectorAll('[data-local-questions]')];

if (roots.length > 0) {
  const publishedRemoteIds = new Set();
  const publishedLocalIds = new Set();

  const makeElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const editUrl = (captureUrl, questionId) => {
    const url = new URL(captureUrl, window.location.href);
    url.searchParams.set('edit', questionId);
    url.hash = 'question-draft-form';
    return url.toString();
  };

  const contexts = roots.map((root) => {
    const repositoryId = root.dataset.repositoryId || '';
    return {
      root,
      repositoryId,
      storageKey: questionDraftsStorageKey(repositoryId),
      captureUrl: root.dataset.captureUrl || '/capture/',
      status: root.querySelector('[data-local-questions-status]'),
      list: root.querySelector('[data-local-questions-list]'),
      error: root.querySelector('[data-local-questions-error]'),
    };
  });

  const createQuestionCard = (question, context) => {
    const localNumber = question.localNumber;
    const card = makeElement('a', 'question-card question-card-local');
    card.href = editUrl(context.captureUrl, question.id);
    card.dataset.category = question.category;
    card.dataset.difficulty = question.difficulty;
    card.dataset.verified = 'false';
    card.dataset.answerStatus = question.answerStatus;
    card.dataset.studyTier = 'unclassified';
    card.dataset.searchId = `local:${question.id}`;
    card.dataset.source = 'local';
    card.dataset.localId = question.id;
    card.dataset.questionNumber = `private:${localNumber}`;
    if (question.remoteId) card.dataset.remoteId = question.remoteId;
    card.dataset.search = [
      question.title,
      question.category,
      question.difficulty,
      question.answer,
      ...(question.followUps || []),
      ...(question.tags || []),
    ].join(' ');

    const number = makeElement(
      'div',
      'card-number card-number-private',
      `私${String(localNumber).padStart(3, '0')}`,
    );
    number.setAttribute('aria-label', `本机题第 ${localNumber} 题`);
    card.append(number);
    const body = makeElement('div', 'card-body');
    const meta = makeElement('div', 'card-meta');
    meta.append(makeElement('span', '', question.category === '待整理' ? '未分类' : question.category));
    if (question.difficulty !== '待评估') {
      meta.append(makeElement(
        'span',
        `difficulty difficulty-${question.difficulty}`,
        question.difficulty,
      ));
    }
    meta.append(makeElement(
      'span',
      question.visibility === 'private'
        ? 'question-visibility-badge question-visibility-private'
        : (question.remoteId
          ? 'question-visibility-badge question-visibility-public'
          : 'question-visibility-badge question-publication-incomplete'),
      question.visibility === 'private'
        ? '私人 · 仅此浏览器'
        : (question.remoteId ? '公开' : '公开失败 · 仅此浏览器'),
    ));
    if (question.answerStatus !== 'complete') {
      meta.append(makeElement('span', 'answer-state-badge', '待解答'));
    }
    const followUpCount = groupFollowUpsForDisplay(question.followUps).length;
    if (followUpCount > 0) meta.append(makeElement('span', '', `${followUpCount} 条追问`));
    body.append(meta, makeElement('h2', '', question.title));

    const tags = makeElement('div', 'tag-list');
    (question.tags || []).forEach((tag) => tags.append(makeElement('span', 'tag', tag)));
    body.append(tags);
    card.append(body, makeElement('span', 'card-arrow', '编辑 →'));
    return card;
  };

  const notifyLibraryChanged = () => {
    document.dispatchEvent(new CustomEvent('question-library:changed'));
  };

  const showError = (context, message) => {
    context.list?.replaceChildren();
    if (context.status) context.status.textContent = '私人题暂时无法读取。';
    if (context.error) {
      context.error.textContent = `${message} 请到“增加题目”页下载原始数据或恢复备份；这里不会重置或上传任何内容。`;
      context.error.hidden = false;
    }
    notifyLibraryChanged();
  };

  const render = (context) => {
    if (!context.list) return;
    let raw;
    try {
      raw = window.localStorage.getItem(context.storageKey) || '';
    } catch {
      showError(context, '当前浏览器没有开放本地存储。');
      return;
    }

    try {
      const state = raw
        ? parseQuestionDraftsJson(raw, { repositoryId: context.repositoryId })
        : { questions: [] };
      const summary = selectLocalQuestions(state.questions, { all: true });
      const visibleQuestions = summary.questions.filter((question) => (
        (!question.remoteId || !publishedRemoteIds.has(question.remoteId))
          && (question.visibility !== 'public' || !publishedLocalIds.has(question.id))
      ));
      context.list.replaceChildren(
        ...visibleQuestions.map((question) => createQuestionCard(question, context)),
      );
      if (context.error) context.error.hidden = true;
      if (context.status) {
        const privateCount = summary.questions
          .filter((question) => question.visibility === 'private').length;
        const unfinishedPublicCount = summary.questions
          .filter((question) => question.visibility === 'public' && !question.remoteId).length;
        context.status.textContent = summary.total === 0
          ? '私人题只在当前浏览器显示。'
          : `本机有 ${privateCount} 道私人题${unfinishedPublicCount ? ` · ${unfinishedPublicCount} 道公开失败题目` : ''}`;
      }
      notifyLibraryChanged();
    } catch (caught) {
      showError(context, caught?.message || '题目数据格式无效。');
    }
  };

  const renderAll = () => contexts.forEach(render);

  document.addEventListener('question-library:public-loaded', (event) => {
    publishedRemoteIds.clear();
    publishedLocalIds.clear();
    const remoteIds = Array.isArray(event.detail?.remoteIds) ? event.detail.remoteIds : [];
    const localIds = Array.isArray(event.detail?.localIds) ? event.detail.localIds : [];
    remoteIds.forEach((id) => publishedRemoteIds.add(String(id)));
    localIds.forEach((id) => publishedLocalIds.add(String(id)));
    renderAll();
  });
  window.addEventListener('storage', (event) => {
    contexts
      .filter((context) => event.key === context.storageKey)
      .forEach(render);
  });
  window.addEventListener('pageshow', renderAll);
  window.addEventListener('focus', renderAll);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') renderAll();
  });

  renderAll();
}
