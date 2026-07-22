const REPOSITORY_NWO_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]+$/;

const COMMUNITY_PREFIXES = [
  { prefix: '[社区投稿]', kind: 'question' },
  { prefix: '[题目校对]', kind: 'review' },
];

const validateRepositoryNwo = (repositoryNwo) => {
  const normalized = String(repositoryNwo || '').trim();
  if (!REPOSITORY_NWO_PATTERN.test(normalized)) {
    throw new TypeError('无效的 GitHub 仓库标识 repository_nwo');
  }
  return normalized;
};

export const buildCommunityIssuesApiUrl = (repositoryNwo, perPage = 30, page = 1) => {
  const repository = validateRepositoryNwo(repositoryNwo);
  const pageSize = Number(perPage);
  const pageNumber = Number(page);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new RangeError('社区列表每页数量必须是 1 到 100 的整数');
  }
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 10) {
    throw new RangeError('社区列表页码必须是 1 到 10 的整数');
  }

  const url = new URL(`https://api.github.com/repos/${repository}/issues`);
  url.searchParams.set('state', 'all');
  url.searchParams.set('sort', 'updated');
  url.searchParams.set('direction', 'desc');
  url.searchParams.set('per_page', String(pageSize));
  url.searchParams.set('page', String(pageNumber));
  return url.toString();
};

export const normalizeCommunityIssues = (payload, repositoryNwo) => {
  if (!Array.isArray(payload)) return [];
  const repository = validateRepositoryNwo(repositoryNwo);

  return payload.flatMap((issue) => {
    if (!issue || typeof issue !== 'object' || issue.pull_request) return [];

    const title = typeof issue.title === 'string' ? issue.title.trim() : '';
    const matchedPrefix = COMMUNITY_PREFIXES.find(({ prefix }) => title.startsWith(prefix));
    const number = Number(issue.number);
    if (!matchedPrefix || !Number.isSafeInteger(number) || number < 1) return [];

    const cleanTitle = title.slice(matchedPrefix.prefix.length).trim() || title;
    const comments = Number.isSafeInteger(Number(issue.comments)) && Number(issue.comments) > 0
      ? Number(issue.comments)
      : 0;

    return [{
      number,
      kind: matchedPrefix.kind,
      title: cleanTitle,
      author: typeof issue.user?.login === 'string' ? issue.user.login : 'GitHub 用户',
      comments,
      state: issue.state === 'closed' ? 'closed' : 'open',
      locked: issue.locked === true,
      updatedAt: typeof issue.updated_at === 'string' ? issue.updated_at : '',
      url: `https://github.com/${repository}/issues/${number}`,
    }];
  });
};
