import {
  parseQuestionDraftsJson,
  questionDraftsStorageKey,
} from './question-drafts-core.mjs';

const PREVIEW_LIMIT = 6;
const VALID_VISIBILITIES = new Set(['private', 'public']);

export function selectLocalQuestions(questions, options = {}) {
  const visibility = VALID_VISIBILITIES.has(options.visibility) ? options.visibility : '';
  const limit = Number.isInteger(options.limit) && options.limit > 0
    ? Math.min(options.limit, 20)
    : PREVIEW_LIMIT;
  const filtered = (Array.isArray(questions) ? questions : [])
    .filter((question) => !visibility || question.visibility === visibility)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return {
    total: filtered.length,
    complete: filtered.filter((question) => question.answerStatus === 'complete').length,
    questions: filtered.slice(0, limit),
  };
}

const roots = typeof document === 'undefined'
  ? []
  : [...document.querySelectorAll('[data-local-questions]')];

if (roots.length > 0) {
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
      visibility: VALID_VISIBILITIES.has(root.dataset.visibility) ? root.dataset.visibility : '',
      status: root.querySelector('[data-local-questions-status]'),
      list: root.querySelector('[data-local-questions-list]'),
      error: root.querySelector('[data-local-questions-error]'),
    };
  });

  const createQuestionCard = (question, context) => {
    const card = makeElement('a', 'local-question-card');
    card.href = editUrl(context.captureUrl, question.id);

    const meta = makeElement('div', 'local-question-meta');
    meta.append(
      makeElement(
        'span',
        'local-question-badge',
        question.visibility === 'public' ? '我的题目' : '未发布草稿',
      ),
      makeElement('span', '', question.category),
      makeElement('span', '', question.answerStatus === 'complete' ? '答案已完成' : '待解答'),
      makeElement(
        'span',
        question.visibility === 'public' ? 'local-question-planned' : '',
        question.visibility === 'public' ? '当前浏览器保存' : '仅我可见',
      ),
    );
    const followUpCount = Array.isArray(question.followUps) ? question.followUps.length : 0;
    if (followUpCount > 0) meta.append(makeElement('span', '', `${followUpCount} 个追问`));

    const title = makeElement('h3', '', question.title);
    const action = makeElement(
      'span',
      'local-question-action',
      question.visibility === 'public' ? '打开、补追问或同步 →' : '打开并编辑 →',
    );
    card.append(meta, title, action);
    return card;
  };

  const showError = (context, message) => {
    context.root.hidden = false;
    context.list.replaceChildren();
    context.status.textContent = '本机题目暂时无法读取。';
    context.error.textContent = `${message} 请到“增加题目”页下载原始数据或恢复备份；这里不会重置或上传任何内容。`;
    context.error.hidden = false;
  };

  const render = (context) => {
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
      const summary = selectLocalQuestions(state.questions, { visibility: context.visibility });
      if (summary.total === 0) {
        context.root.hidden = true;
        context.list.replaceChildren();
        context.error.hidden = true;
        return;
      }

      context.root.hidden = false;
      context.error.hidden = true;
      context.status.textContent = context.visibility === 'public'
        ? `${summary.total} 道我的题目 · ${summary.complete} 道答案已完成 · GitHub 同步状态以仓库为准`
        : `${summary.total} 道未发布草稿 · ${summary.complete} 道答案已完成`;
      context.list.replaceChildren(
        ...summary.questions.map((question) => createQuestionCard(question, context)),
      );
    } catch (caught) {
      showError(context, caught?.message || '题目数据格式无效。');
    }
  };

  const renderAll = () => contexts.forEach(render);

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
