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
    const visibleState = issue.locked ? 'locked' : issue.state;
    state.className = `community-thread-state community-thread-state-${visibleState}`;
    state.textContent = issue.locked ? '已锁定' : issue.state === 'closed' ? '已归档' : '讨论中';

    heading.append(kind, state);

    const title = document.createElement('h3');
    title.textContent = issue.title;

    const meta = document.createElement('p');
    meta.className = 'community-thread-meta';
    meta.textContent = `#${issue.number} · ${issue.author} · ${formatUpdatedAt(issue.updatedAt)} · ${issue.comments} 条评论`;

    const action = document.createElement('span');
    action.className = 'community-thread-action';
    action.textContent = issue.locked ? '查看讨论 ↗' : issue.comments > 0 ? '查看评论 ↗' : '来写第一条评论 ↗';

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
    let failureMessage = '';

    try {
      const payload = [];
      const pageSize = 100;
      const maxPages = 3;
      const visibleLimit = 12;

      for (let page = 1; page <= maxPages; page += 1) {
        const response = await fetch(buildCommunityIssuesApiUrl(repositoryNwo, pageSize, page), {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });
        if (!response.ok) {
          failureMessage = [404, 410].includes(response.status)
            ? '无法读取社区动态：仓库可能为私有、已关闭 Issues，或当前访问者没有权限。'
            : '暂时无法读取社区动态，可能是 GitHub API 限流或网络异常。';
          throw new Error(`GitHub API ${response.status}`);
        }

        const batch = await response.json();
        if (!Array.isArray(batch)) throw new TypeError('GitHub Issues API 返回格式异常');
        payload.push(...batch);

        const foundCount = normalizeCommunityIssues(payload, repositoryNwo).length;
        if (foundCount >= visibleLimit || batch.length < pageSize) break;
      }

      const issues = normalizeCommunityIssues(payload, repositoryNwo).slice(0, visibleLimit);
      list.replaceChildren(...issues.map(createThread));
      list.hidden = issues.length === 0;

      if (issues.length === 0) {
        setStatus('最近可读取的公开动态中还没有社区投稿。可以成为第一个分享题目的人。');
      } else {
        setStatus(`最近更新的 ${issues.length} 个公开讨论；点击帖子即可查看和评论。`);
      }
    } catch {
      list.replaceChildren();
      list.hidden = true;
      setStatus(failureMessage || '暂时无法读取社区动态；如果仓库允许公开创建 Issue，仍可使用上方投稿和评论入口。');
      if (fallback) fallback.hidden = false;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  loadCommunity();
}
