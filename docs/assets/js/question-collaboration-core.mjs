const REPOSITORY_NWO_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]+$/;
const PUBLIC_QUESTION_PREFIX = '[新增题目]';
const PUBLIC_QUESTION_LABEL = 'public-question';
export const PUBLIC_QUESTIONS_TIMEOUT_MS = 15_000;

const cleanPublicField = (value, maxLength = 30) => {
  const cleaned = String(value || '')
    .normalize('NFKC')
    .replace(/^[#*_`\s]+|[#*_`\s]+$/g, '')
    .trim();
  if (!cleaned || /^no response$/i.test(cleaned)) return '';
  return [...cleaned].slice(0, maxLength).join('');
};

const cleanPublicText = (value, maxLength = 12_000) => {
  const cleaned = String(value || '')
    .replace(/\r\n?/g, '\n')
    .trim();
  if (!cleaned || /^_?no response_?$/i.test(cleaned)) return '';
  return [...cleaned].slice(0, maxLength).join('');
};

export const readPublicQuestionSection = (body, label, maxLength = 12_000) => {
  const source = typeof body === 'string' ? body.replace(/\r\n?/g, '\n') : '';
  const escapedLabel = String(label || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!source || !escapedLabel) return '';
  const heading = new RegExp(`^###\\s+${escapedLabel}\\s*$`, 'mi').exec(source);
  if (!heading) return '';
  const remainder = source.slice(heading.index + heading[0].length).replace(/^\s*\n/, '');
  const nextHeading = remainder.search(/^###\s+/m);
  return cleanPublicText(nextHeading >= 0 ? remainder.slice(0, nextHeading) : remainder, maxLength);
};

const readInlineBlock = (source, label, stopLabels = [], maxLength = 12_000) => {
  const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
  const labelPattern = new RegExp(`^${String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[：:]\\s*(.*)$`);
  const stopPatterns = stopLabels.map((item) => new RegExp(
    `^${String(item).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[：:]`,
  ));
  const start = lines.findIndex((line) => labelPattern.test(line.trim()));
  if (start < 0) return '';
  const first = lines[start].trim().match(labelPattern)?.[1] || '';
  const values = first ? [first] : [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (stopPatterns.some((pattern) => pattern.test(lines[index].trim()))) break;
    values.push(lines[index]);
  }
  return cleanPublicText(values.join('\n'), maxLength);
};

export const readPublicQuestionField = (body, label, maxLength = 30) => {
  const source = typeof body === 'string' ? body.replace(/\r\n?/g, '\n') : '';
  const escapedLabel = String(label || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!source || !escapedLabel) return '';
  const heading = source.match(new RegExp(`^###\\s+${escapedLabel}\\s*\\n+(?:\\s*\\n)*([^\\n]+)`, 'mi'));
  const inline = source.match(new RegExp(`^${escapedLabel}[：:]\\s*([^\\n]+)`, 'mi'));
  return cleanPublicField(heading?.[1] || inline?.[1] || '', maxLength);
};

const hasPublicConfirmation = (body) => (
  /^###\s+(?:最终)?公开确认\s*$[\s\S]*?^- \[x\]\s+/mi.test(String(body || ''))
);

const parseTags = (value) => [...new Set(String(value || '')
  .replace(/^标签[：:]\s*/i, '')
  .split(/[，,、|]/)
  .map((tag) => cleanPublicField(tag, 30))
  .filter(Boolean))].slice(0, 12);

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

export const buildPublicQuestionsApiUrl = (repositoryNwo, perPage = 30, page = 1, state = 'open') => {
  const repository = validateRepositoryNwo(repositoryNwo);
  const { pageSize, pageNumber } = validatePagination(perPage, page);
  if (!['open', 'all'].includes(state)) {
    throw new RangeError('Issue 状态必须是 open 或 all');
  }
  const url = new URL(`https://api.github.com/repos/${repository}/issues`);
  url.searchParams.set('state', state);
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
    if (
      !Number.isSafeInteger(number)
      || number < 1
      || !hasLabel
      || issue.state === 'closed'
      || !hasPublicConfirmation(issue.body)
    ) {
      return [];
    }
    const webDetails = readPublicQuestionSection(issue.body, '已从网站带入的题目内容', 20_000);
    const directTitle = readPublicQuestionSection(issue.body, '面试题目', 160).split('\n')[0];
    const webTitle = readInlineBlock(
      webDetails,
      '题目',
      ['站内题目编号', '可见性', '答案状态', '分类'],
      160,
    ).split('\n')[0];
    const titleFromBody = directTitle || webTitle;
    const cleanTitle = titleFromBody || (title.startsWith(PUBLIC_QUESTION_PREFIX)
      ? title.slice(PUBLIC_QUESTION_PREFIX.length)
      : title).trim().slice(0, 160);
    if (!cleanTitle) return [];
    const directAnswer = readPublicQuestionSection(issue.body, '你的答案或思路（可选）');
    const answer = directAnswer || readInlineBlock(
      webDetails,
      '参考答案 / 当前思路',
      ['追问记录（每行一条）', '追问记录', '追问'],
    );
    const directFollowUps = readPublicQuestionSection(issue.body, '现场追问（可选）', 3_200);
    const followUpText = directFollowUps || readInlineBlock(
      webDetails,
      '追问记录（每行一条）',
      [],
      3_200,
    );
    const explicitAnswerStatus = readPublicQuestionField(issue.body, '答案状态');
    const answerStatus = answer && (!explicitAnswerStatus || explicitAnswerStatus === '已完成')
      ? 'complete'
      : 'pending';
    const context = readPublicQuestionSection(issue.body, '标签或匿名背景（可选）', 500);
    const tags = parseTags(readPublicQuestionField(issue.body, '标签') || context);
    const localIdValue = readPublicQuestionField(issue.body, '站内题目编号', 80);
    const localId = /^[A-Za-z0-9._:-]{1,80}$/.test(localIdValue) ? localIdValue : '';
    const rawDifficulty = readPublicQuestionField(issue.body, '难度');
    const difficulty = ['待评估', '简单', '中等', '困难'].includes(rawDifficulty)
      ? rawDifficulty
      : '待评估';
    return [{
      number,
      id: `github:${repository}#${number}`,
      title: cleanTitle,
      author: typeof issue.user?.login === 'string' && issue.user.login.trim()
        ? issue.user.login.trim()
        : 'GitHub 用户',
      comments: Number.isSafeInteger(Number(issue.comments)) && Number(issue.comments) > 0
        ? Number(issue.comments)
        : 0,
      state: 'open',
      locked: issue.locked === true,
      category: readPublicQuestionField(issue.body, '分类') || '待整理',
      difficulty,
      answer,
      answerStatus,
      followUps: followUpText
        .split('\n')
        .map((item) => cleanPublicText(item, 300))
        .filter(Boolean)
        .slice(0, 10),
      tags,
      localId,
      verified: false,
      studyTier: 'archive',
      createdAt: typeof issue.created_at === 'string' ? issue.created_at : '',
      updatedAt: typeof issue.updated_at === 'string' ? issue.updated_at : '',
      url: `https://github.com/${repository}/issues/${number}`,
    }];
  });
};
