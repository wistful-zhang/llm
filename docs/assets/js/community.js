import {
  buildCommunityIssuesApiUrl,
  normalizeCommunityIssues,
} from './community-core.mjs';

const feed = document.querySelector('[data-community-feed]');

if (feed) {
  const repositoryNwo = feed.dataset.repositoryNwo || '';
  const status = feed.querySelector('[data-community-status]');
  const list = feed.querySelector('[data-community-list]');
  const fallback = feed.querySelector('[data-community-fallback]');
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const formatUpdatedAt = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '最近有更新' : `${dateFormatter.format(date)} 更新`;
  };

  const createThread = (issue) => {
    const link = document.createElement('a');
    link.className = 'community-thread';
    link.href = issue.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const heading = document.createElement('div');
    heading.className = 'community-thread-heading';

    const kind = document.createElement('span');
    kind.className = `community-thread-kind community-thread-kind-${issue.kind}`;
    kind.textContent = issue.kind === 'question' ? '题目投稿' : '题目校对';

    const state = document.createElement('span');
    state.className = `community-thread-state community-thread-state-${issue.state}`;
    state.textContent = issue.state === 'closed' ? '已归档' : '讨论中';

    heading.append(kind, state);

    const title = document.createElement('h3');
    title.textContent = issue.title;

    const meta = document.createElement('p');
    meta.className = 'community-thread-meta';
    meta.textContent = `#${issue.number} · ${issue.author} · ${formatUpdatedAt(issue.updatedAt)} · ${issue.comments} 条评论`;

    const action = document.createElement('span');
    action.className = 'community-thread-action';
    action.textContent = issue.comments > 0 ? '查看评论 ↗' : '来写第一条评论 ↗';

    link.append(heading, title, meta, action);
    return link;
  };

  const loadCommunity = async () => {
    if (!repositoryNwo || !list) {
      setStatus('当前站点没有可识别的 GitHub 仓库。仓库主人发布到 GitHub Pages 后，这里会显示社区动态。');
      if (fallback) fallback.hidden = false;
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(buildCommunityIssuesApiUrl(repositoryNwo, 50), {
        headers: { Accept: 'application/vnd.github+json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);

      const issues = normalizeCommunityIssues(await response.json(), repositoryNwo);
      list.replaceChildren(...issues.map(createThread));
      list.hidden = issues.length === 0;

      if (issues.length === 0) {
        setStatus('还没有社区投稿。可以成为第一个分享题目的人。');
      } else {
        setStatus(`最近更新的 ${issues.length} 个公开讨论；点击帖子即可查看和评论。`);
      }
    } catch {
      list.replaceChildren();
      list.hidden = true;
      setStatus('暂时无法读取社区动态，可能是 API 限流、网络异常或仓库为私有；投稿和评论入口仍可使用。');
      if (fallback) fallback.hidden = false;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  loadCommunity();
}
