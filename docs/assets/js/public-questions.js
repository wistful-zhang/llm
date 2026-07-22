import {
  buildPublicQuestionsApiUrl,
  normalizePublicQuestions,
} from './question-collaboration-core.mjs';

const root = document.querySelector('[data-public-questions]');

if (root) {
  const repositoryNwo = root.dataset.repositoryNwo || '';
  const status = root.querySelector('[data-public-questions-status]');
  const list = root.querySelector('[data-public-questions-list]');
  const fallback = root.querySelector('[data-public-questions-fallback]');
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '最近更新' : `${dateFormatter.format(date)} 更新`;
  };

  const createQuestion = (question) => {
    const link = document.createElement('a');
    link.className = 'public-question-card';
    link.href = question.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const meta = document.createElement('div');
    meta.className = 'public-question-meta';
    const badge = document.createElement('span');
    badge.className = 'public-question-badge';
    badge.textContent = '公开补充';
    const detail = document.createElement('span');
    detail.textContent = `#${question.number} · ${question.author} · ${formatDate(question.updatedAt)}`;
    meta.append(badge, detail);

    const title = document.createElement('h3');
    title.textContent = question.title;
    const action = document.createElement('span');
    action.className = 'public-question-action';
    action.textContent = question.locked
      ? '查看题目 ↗'
      : (question.comments > 0 ? `${question.comments} 条评论 ↗` : '回答或评论 ↗');

    link.append(meta, title, action);
    return link;
  };

  const loadPublicQuestions = async () => {
    if (!repositoryNwo || !list) {
      setStatus('当前预览没有连接可用的 GitHub 仓库。');
      if (fallback) fallback.hidden = false;
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(buildPublicQuestionsApiUrl(repositoryNwo, 30, 1), {
        headers: { Accept: 'application/vnd.github+json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`GitHub Issues API ${response.status}`);
      const questions = normalizePublicQuestions(await response.json(), repositoryNwo).slice(0, 12);
      list.replaceChildren(...questions.map(createQuestion));
      list.hidden = questions.length === 0;
      setStatus(questions.length > 0
        ? `最近 ${questions.length} 道由使用者主动公开的题目；点击后可回答和评论。`
        : '还没有使用者公开增加题目。你可以只发布问题，答案以后再补。');
    } catch {
      list.replaceChildren();
      list.hidden = true;
      setStatus('暂时无法读取使用者公开补充，可能是网络异常或 GitHub API 限流。');
      if (fallback) fallback.hidden = false;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  void loadPublicQuestions();
}
