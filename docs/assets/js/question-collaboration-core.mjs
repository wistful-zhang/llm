const REPOSITORY_NWO_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]+$/;
const QUESTION_SLUG_PATTERN = /^[\p{L}\p{N}](?:[\p{L}\p{N}._-]{0,199})$/u;
const PUBLIC_QUESTION_PREFIX = '[新增题目]';
const PUBLIC_QUESTION_LABEL = 'public-question';
const COMMENT_FIELD_HEADING = '你的评论、补充或纠错';
const COMMENT_NEXT_FIELD_HEADING = '公开确认';

const validateRepositoryNwo = (value) => {
  const repository = String(value || '').trim();
  if (!REPOSITORY_NWO_PATTERN.test(repository)) {
    throw new TypeError('无效的 GitHub 仓库标识 repository_nwo');
  }
  return repository;
};

const validateQuestionSlug = (value) => {
  const slug = String(value || '').trim();
  if (!QUESTION_SLUG_PATTERN.test(slug)) {
    throw new TypeError('无效的题目 slug');
  }
  return slug;
};

const validateIssueNumber = (value) => {
  const issueNumber = Number(value);
  if (!Number.isSafeInteger(issueNumber) || issueNumber < 1 || String(value).trim() !== String(issueNumber)) {
    throw new TypeError('Issue 编号必须是正整数');
  }
  return issueNumber;
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

export const questionDiscussionTitle = (slug) => (
  `[题目评论] question:${validateQuestionSlug(slug)}`
);

export const buildQuestionDiscussionSearchApiUrl = (repositoryNwo, slug) => {
  const repository = validateRepositoryNwo(repositoryNwo);
  const title = questionDiscussionTitle(slug);
  const url = new URL('https://api.github.com/search/issues');
  url.searchParams.set('q', `repo:${repository} is:issue is:open in:title "${title}"`);
  url.searchParams.set('sort', 'created');
  url.searchParams.set('order', 'asc');
  url.searchParams.set('per_page', '100');
  return url.toString();
};

export const normalizeQuestionDiscussion = (payload, repositoryNwo, slug) => {
  const repository = validateRepositoryNwo(repositoryNwo);
  const expectedTitle = questionDiscussionTitle(slug);
  if (!Array.isArray(payload?.items)) return null;

  const candidates = payload.items.flatMap((issue) => {
    if (!issue || typeof issue !== 'object' || issue.pull_request) return [];
    const number = Number(issue.number);
    if (!Number.isSafeInteger(number) || number < 1 || issue.title !== expectedTitle) return [];
    const body = typeof issue.body === 'string' ? issue.body : '';
    const escapedCommentHeading = COMMENT_FIELD_HEADING.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedNextHeading = COMMENT_NEXT_FIELD_HEADING.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fieldPattern = new RegExp(`(?:^|\\n)###\\s+${escapedCommentHeading}\\s*\\n([\\s\\S]*?)(?=\\n###\\s+${escapedNextHeading}\\s*\\n|$)`);
    const openingBody = (fieldPattern.exec(body)?.[1] || '').trim();
    return [{
      number,
      state: issue.state === 'closed' ? 'closed' : 'open',
      locked: issue.locked === true,
      comments: Number.isSafeInteger(Number(issue.comments)) && Number(issue.comments) > 0
        ? Number(issue.comments)
        : 0,
      openingComment: openingBody ? {
        id: `issue-${number}`,
        author: typeof issue.user?.login === 'string' && issue.user.login.trim()
          ? issue.user.login.trim()
          : 'GitHub 用户',
        body: openingBody,
        createdAt: typeof issue.created_at === 'string' ? issue.created_at : '',
        updatedAt: typeof issue.updated_at === 'string' ? issue.updated_at : '',
        url: `https://github.com/${repository}/issues/${number}`,
      } : null,
      url: `https://github.com/${repository}/issues/${number}`,
    }];
  });

  return candidates.sort((left, right) => {
    const leftInactive = left.state !== 'open' || left.locked;
    const rightInactive = right.state !== 'open' || right.locked;
    return Number(leftInactive) - Number(rightInactive) || left.number - right.number;
  })[0] || null;
};

export const buildQuestionCommentsApiUrl = (
  repositoryNwo,
  issueNumber,
  perPage = 100,
  page = 1,
) => {
  const repository = validateRepositoryNwo(repositoryNwo);
  const number = validateIssueNumber(issueNumber);
  const { pageSize, pageNumber } = validatePagination(perPage, page);
  const url = new URL(`https://api.github.com/repos/${repository}/issues/${number}/comments`);
  url.searchParams.set('per_page', String(pageSize));
  url.searchParams.set('page', String(pageNumber));
  return url.toString();
};

export const normalizeQuestionComments = (payload, repositoryNwo, issueNumber) => {
  const repository = validateRepositoryNwo(repositoryNwo);
  const number = validateIssueNumber(issueNumber);
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((comment) => {
    if (!comment || typeof comment !== 'object') return [];
    const id = Number(comment.id);
    const body = typeof comment.body === 'string' ? comment.body.trim() : '';
    if (!Number.isSafeInteger(id) || id < 1 || !body) return [];
    return [{
      id,
      author: typeof comment.user?.login === 'string' && comment.user.login.trim()
        ? comment.user.login.trim()
        : 'GitHub 用户',
      body,
      createdAt: typeof comment.created_at === 'string' ? comment.created_at : '',
      updatedAt: typeof comment.updated_at === 'string' ? comment.updated_at : '',
      url: `https://github.com/${repository}/issues/${number}#issuecomment-${id}`,
    }];
  });
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

export const buildQuestionCommentFormUrl = (
  repositoryNwo,
  slug,
  questionTitle,
  questionUrl,
) => {
  const repository = validateRepositoryNwo(repositoryNwo);
  const title = questionDiscussionTitle(slug);
  const params = new URLSearchParams({
    template: 'question-comment.yml',
    title,
    question_url: String(questionUrl || ''),
    context: String(questionTitle || ''),
  });
  return `https://github.com/${repository}/issues/new?${params.toString()}`;
};
