const REPOSITORY_NWO_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]+$/;
const PUBLIC_QUESTION_PREFIX = '[新增题目]';
const PUBLIC_QUESTION_LABEL = 'public-question';

const validateRepositoryNwo = (value) => {
  const repository = String(value || '').trim();
  if (!REPOSITORY_NWO_PATTERN.test(repository)) {
    throw new TypeError('无效的 GitHub 仓库标识 repository_nwo');
  }
  return repository;
};

const validatePagination = (perPage, page) => {
  const pageSize = Number(perPage);
  const pageNumber = Number(page);
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new RangeError('每页数量 per_page 必须是 1 到 100 的整数');
  }
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 10) {
    throw new RangeError('分页页码必须是 1 到 10 的整数');
  }
  return { pageSize, pageNumber };
};

export const buildPublicQuestionsApiUrl = (repositoryNwo, perPage = 30, page = 1) => {
  const repository = validateRepositoryNwo(repositoryNwo);
  const { pageSize, pageNumber } = validatePagination(perPage, page);
  const url = new URL(`https://api.github.com/repos/${repository}/issues`);
  url.searchParams.set('state', 'open');
  url.searchParams.set('labels', PUBLIC_QUESTION_LABEL);
  url.searchParams.set('sort', 'updated');
  url.searchParams.set('direction', 'desc');
  url.searchParams.set('per_page', String(pageSize));
  url.searchParams.set('page', String(pageNumber));
  return url.toString();
};

export const normalizePublicQuestions = (payload, repositoryNwo) => {
  const repository = validateRepositoryNwo(repositoryNwo);
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((issue) => {
    if (!issue || typeof issue !== 'object' || issue.pull_request) return [];
    const number = Number(issue.number);
    const title = typeof issue.title === 'string' ? issue.title.trim() : '';
    const labels = Array.isArray(issue.labels) ? issue.labels : [];
    const hasLabel = labels.some((label) => (
      typeof label === 'string'
        ? label === PUBLIC_QUESTION_LABEL
        : label?.name === PUBLIC_QUESTION_LABEL
    ));
    if (!Number.isSafeInteger(number) || number < 1 || !hasLabel || !title.startsWith(PUBLIC_QUESTION_PREFIX)) {
      return [];
    }
    const cleanTitle = title.slice(PUBLIC_QUESTION_PREFIX.length).trim();
    if (!cleanTitle) return [];
    return [{
      number,
      title: cleanTitle,
      author: typeof issue.user?.login === 'string' && issue.user.login.trim()
        ? issue.user.login.trim()
        : 'GitHub 用户',
      comments: Number.isSafeInteger(Number(issue.comments)) && Number(issue.comments) > 0
        ? Number(issue.comments)
        : 0,
      state: issue.state === 'closed' ? 'closed' : 'open',
      locked: issue.locked === true,
      createdAt: typeof issue.created_at === 'string' ? issue.created_at : '',
      updatedAt: typeof issue.updated_at === 'string' ? issue.updated_at : '',
      url: `https://github.com/${repository}/issues/${number}`,
    }];
  });
};
