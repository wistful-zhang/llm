import { questionDraftsStorageKey } from './question-drafts-core.mjs';
import { summarizeLocalQuestions } from './local-questions-core.mjs';

const root = document.querySelector('[data-local-questions]');

if (root) {
  const repositoryId = root.dataset.repositoryId || '';
  const storageKey = questionDraftsStorageKey(repositoryId);
  const captureUrl = root.dataset.captureUrl || '/capture/';
  const status = root.querySelector('[data-local-questions-status]');
  const list = root.querySelector('[data-local-questions-list]');
  const error = root.querySelector('[data-local-questions-error]');

  const makeElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const editUrl = (questionId) => {
    const url = new URL(captureUrl, window.location.href);
    url.searchParams.set('edit', questionId);
    url.hash = 'question-draft-form';
    return url.toString();
  };

  const createQuestionCard = (question) => {
    const card = makeElement('a', 'local-question-card');
    card.href = editUrl(question.id);

    const meta = makeElement('div', 'local-question-meta');
    meta.append(
      makeElement('span', 'local-question-badge', '仅当前浏览器'),
      makeElement('span', '', question.category),
      makeElement('span', '', question.answerStatus === 'complete' ? '答案已完成' : '待解答'),
      makeElement(
        'span',
        question.visibility === 'public' ? 'local-question-planned' : '',
        question.visibility === 'public' ? '准备公开 · 尚未确认提交' : '私人题目',
      ),
    );

    const title = makeElement('h3', '', question.title);
    const action = makeElement('span', 'local-question-action', '打开并编辑 →');
    card.append(meta, title, action);
    return card;
  };

  const showError = (message) => {
    root.hidden = false;
    list.replaceChildren();
    status.textContent = '本机题目暂时无法读取。';
    error.textContent = `${message} 请到“增加题目”页下载原始数据或恢复备份；这里不会重置或上传任何内容。`;
    error.hidden = false;
  };

  const render = () => {
    let raw;
    try {
      raw = window.localStorage.getItem(storageKey) || '';
    } catch {
      showError('当前浏览器没有开放本地存储。');
      return;
    }

    try {
      const summary = summarizeLocalQuestions(raw, { repositoryId });
      if (summary.total === 0) {
        root.hidden = true;
        list.replaceChildren();
        error.hidden = true;
        return;
      }

      root.hidden = false;
      error.hidden = true;
      status.textContent = `${summary.total} 道本机题目 · ${summary.complete} 道答案已完成${summary.plannedPublic > 0 ? ` · ${summary.plannedPublic} 道准备公开但尚未确认提交` : ''}`;
      list.replaceChildren(...summary.questions.map(createQuestionCard));
    } catch (caught) {
      showError(caught?.message || '题目数据格式无效。');
    }
  };

  window.addEventListener('storage', (event) => {
    if (event.key === storageKey) render();
  });
  window.addEventListener('pageshow', render);
  window.addEventListener('focus', render);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') render();
  });

  render();
}
