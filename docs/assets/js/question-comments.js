import {
  buildQuestionCommentFormUrl,
  buildQuestionCommentsApiUrl,
  buildQuestionDiscussionSearchApiUrl,
  normalizeQuestionComments,
  normalizeQuestionDiscussion,
} from './question-collaboration-core.mjs';

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '时间未知' : dateFormatter.format(date);
};

const createComment = (comment) => {
  const article = document.createElement('article');
  article.className = 'question-comment';

  const header = document.createElement('header');
  const author = document.createElement('strong');
  author.textContent = comment.author;
  const time = document.createElement('time');
  time.dateTime = comment.createdAt || '';
  time.textContent = formatDate(comment.createdAt);
  header.append(author, time);

  const body = document.createElement('p');
  body.className = 'question-comment-body';
  body.textContent = comment.body;

  const link = document.createElement('a');
  link.className = 'text-link question-comment-source';
  link.href = comment.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '在 GitHub 查看 ↗';

  article.append(header, body, link);
  return article;
};

document.querySelectorAll('[data-question-comments]').forEach((root) => {
  const repositoryNwo = root.dataset.repositoryNwo || '';
  const questionSlug = root.dataset.questionSlug || '';
  const questionTitle = root.dataset.questionTitle || '';
  const questionUrl = root.dataset.questionUrl || window.location.href;
  const status = root.querySelector('[data-question-comments-status]');
  const list = root.querySelector('[data-question-comments-list]');
  const start = root.querySelector('[data-question-comments-start]');
  const open = root.querySelector('[data-question-comments-open]');
  const fallback = root.querySelector('[data-question-comments-fallback]');
  const confirmEmpty = root.querySelector('[data-question-comments-confirm-empty]');
  const jump = document.querySelector('[data-question-comments-jump]');

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const showStart = () => {
    if (start) start.hidden = false;
    if (open) open.hidden = true;
  };

  confirmEmpty?.addEventListener('click', () => {
    const confirmed = window.confirm('GitHub API 暂时没有确认评论状态。请先打开上面的精确搜索；只有确认没有已有线程时，才新建第一条评论。你已经检查过了吗？');
    if (!confirmed) return;
    showStart();
    confirmEmpty.hidden = true;
    setStatus('已显示“写第一条评论”。请保留自动填写的标题，避免评论跑到其他题目。');
  });

  const loadComments = async () => {
    if (!repositoryNwo || !questionSlug || !list) {
      setStatus('当前预览没有连接可用的 GitHub 仓库；发布网站后即可启用题目评论。');
      if (fallback) fallback.hidden = false;
      return;
    }

    try {
      if (start) {
        start.href = buildQuestionCommentFormUrl(
          repositoryNwo,
          questionSlug,
          questionTitle,
          questionUrl,
        );
      }
    } catch {
      setStatus('这道题的评论标识无效，请联系题库维护者。');
      if (fallback) fallback.hidden = false;
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    let resolvedDiscussion = null;

    try {
      const discussionResponse = await fetch(
        buildQuestionDiscussionSearchApiUrl(repositoryNwo, questionSlug),
        {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        },
      );
      if (!discussionResponse.ok) throw new Error(`GitHub Search API ${discussionResponse.status}`);
      const discussion = normalizeQuestionDiscussion(
        await discussionResponse.json(),
        repositoryNwo,
        questionSlug,
      );
      resolvedDiscussion = discussion;

      if (!discussion) {
        list.replaceChildren();
        list.hidden = true;
        setStatus('还没有人评论这道题。你可以补充另一种答法、追问或纠错。');
        if (jump) jump.textContent = '写第一条评论 ↓';
        showStart();
        return;
      }

      if (open) {
        open.href = discussion.url;
        open.textContent = discussion.locked ? '查看已锁定的讨论 ↗' : '发表评论 ↗';
        open.hidden = false;
      }
      if (start) start.hidden = true;

      const commentsResponse = await fetch(
        buildQuestionCommentsApiUrl(repositoryNwo, discussion.number),
        {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        },
      );
      if (!commentsResponse.ok) throw new Error(`GitHub Comments API ${commentsResponse.status}`);
      const replies = normalizeQuestionComments(
        await commentsResponse.json(),
        repositoryNwo,
        discussion.number,
      );
      const comments = [discussion.openingComment, ...replies].filter(Boolean);
      list.replaceChildren(...comments.map(createComment));
      list.hidden = comments.length === 0;

      if (comments.length === 0) {
        setStatus('这道题的讨论已经建立，还没有可显示的评论。');
      } else {
        const truncated = discussion.comments > replies.length;
        setStatus(truncated
          ? `当前显示前 ${comments.length} 条公开评论；更多内容请到 GitHub 查看。`
          : `${comments.length} 条公开评论；登录 GitHub 后可以继续留言。`);
        if (jump) jump.textContent = `评论与补充（${comments.length}）↓`;
      }
    } catch {
      list.replaceChildren();
      list.hidden = true;
      setStatus('暂时无法读取评论，可能是网络异常或 GitHub API 限流。');
      if (jump) jump.textContent = '查看评论入口 ↓';
      if (fallback) fallback.hidden = false;
      if (resolvedDiscussion) {
        if (confirmEmpty) confirmEmpty.hidden = true;
        if (start) start.hidden = true;
        if (open) {
          open.href = resolvedDiscussion.url;
          open.textContent = '前往 GitHub 查看或评论 ↗';
          open.hidden = false;
        }
      } else {
        if (start) start.hidden = true;
        if (open) open.hidden = true;
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  void loadComments();
});
