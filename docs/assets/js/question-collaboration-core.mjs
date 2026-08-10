const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,119}$/;
const VALID_DIFFICULTIES = new Set(['待评估', '简单', '中等', '困难']);
const VALID_ANSWER_STATUSES = new Set(['pending', 'complete']);

export const PUBLIC_QUESTIONS_TIMEOUT_MS = 15_000;
export const PUBLIC_QUESTIONS_PAGE_SIZE = 50;

const cleanInline = (value, maxLength) => String(value || '')
  .normalize('NFC')
  .replace(/[\u0000-\u001f\u007f]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

const cleanText = (value, maxLength) => String(value || '')
  .replace(/\r\n?/g, '\n')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
  .trim()
  .slice(0, maxLength);

const cleanList = (value, itemLimit, itemLength) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((candidate) => {
    if (typeof candidate !== 'string') return [];
    const item = cleanInline(candidate, itemLength);
    const identity = item.toLocaleLowerCase('zh-CN');
    if (!item || seen.has(identity)) return [];
    seen.add(identity);
    return [item];
  }).slice(0, itemLimit);
};

export const normalizeQuestionsApiBaseUrl = (value, { allowLocalhost = false } = {}) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new TypeError('公开题共享服务地址无效');
  }
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(allowLocalhost && local && url.protocol === 'http:')) {
    throw new TypeError('公开题共享服务必须使用 HTTPS');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new TypeError('公开题共享服务地址不能包含账号、查询参数或片段');
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new TypeError('公开题共享服务只接受根网址');
  }
  return url.origin;
};

const validatePagination = (cursor, limit) => {
  const safeCursor = Number(cursor);
  const safeLimit = Number(limit);
  if (!Number.isSafeInteger(safeCursor) || safeCursor < 0) {
    throw new RangeError('公开题游标必须是非负整数');
  }
  if (!Number.isSafeInteger(safeLimit) || safeLimit < 1 || safeLimit > 100) {
    throw new RangeError('公开题每页数量必须是 1 到 100 的整数');
  }
  return { cursor: safeCursor, limit: safeLimit };
};

export const buildPublicQuestionsApiUrl = (
  apiBaseUrl,
  cursor = 0,
  limit = PUBLIC_QUESTIONS_PAGE_SIZE,
) => {
  const url = new URL(buildPublicQuestionsCollectionApiUrl(apiBaseUrl));
  const pagination = validatePagination(cursor, limit);
  url.searchParams.set('cursor', String(pagination.cursor));
  url.searchParams.set('limit', String(pagination.limit));
  return url.toString();
};

export const buildPublicQuestionsCollectionApiUrl = (apiBaseUrl) => {
  const origin = normalizeQuestionsApiBaseUrl(apiBaseUrl, {
    allowLocalhost: typeof location !== 'undefined'
      && ['localhost', '127.0.0.1'].includes(location.hostname),
  });
  if (!origin) throw new TypeError('尚未配置公开题共享服务');
  return new URL('/v1/questions', origin).toString();
};

export const buildPublicQuestionApiUrl = (apiBaseUrl, questionId) => {
  const origin = normalizeQuestionsApiBaseUrl(apiBaseUrl, {
    allowLocalhost: typeof location !== 'undefined'
      && ['localhost', '127.0.0.1'].includes(location.hostname),
  });
  const id = String(questionId || '').trim().toLowerCase();
  if (!origin) throw new TypeError('尚未配置公开题共享服务');
  if (!UUID_PATTERN.test(id)) throw new TypeError('公开题编号无效');
  return new URL(`/v1/questions/${encodeURIComponent(id)}`, origin).toString();
};

export const buildQuestionsConfigApiUrl = (apiBaseUrl) => {
  const origin = normalizeQuestionsApiBaseUrl(apiBaseUrl, {
    allowLocalhost: typeof location !== 'undefined'
      && ['localhost', '127.0.0.1'].includes(location.hostname),
  });
  if (!origin) throw new TypeError('尚未配置公开题共享服务');
  return new URL('/v1/config', origin).toString();
};

const normalizeQuestion = (candidate) => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const id = String(candidate.id || '').trim().toLowerCase();
  const title = cleanInline(candidate.title, 160);
  if (!UUID_PATTERN.test(id) || !title || candidate.status === 'deleted') return null;
  const answer = cleanText(candidate.answer, 50_000);
  const rawAnswerStatus = cleanInline(candidate.answerStatus, 20);
  const answerStatus = answer && rawAnswerStatus === 'complete' ? 'complete' : 'pending';
  const rawDifficulty = cleanInline(candidate.difficulty, 20);
  const localId = cleanInline(candidate.localId, 120);
  return {
    id,
    searchId: `shared:${id}`,
    title,
    category: cleanInline(candidate.category, 30) || '待整理',
    difficulty: VALID_DIFFICULTIES.has(rawDifficulty) ? rawDifficulty : '待评估',
    answerStatus: VALID_ANSWER_STATUSES.has(answerStatus) ? answerStatus : 'pending',
    answer,
    followUps: cleanList(candidate.followUps, 10, 300),
    tags: cleanList(candidate.tags, 12, 30),
    source: cleanInline(candidate.source, 80),
    author: cleanInline(candidate.author, 40) || '匿名发布者',
    localId: LOCAL_ID_PATTERN.test(localId) ? localId : '',
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : '',
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : '',
    status: 'visible',
    verified: false,
    studyTier: 'archive',
  };
};

export const normalizePublicQuestions = (payload) => {
  const candidates = Array.isArray(payload) ? payload : payload?.questions;
  if (!Array.isArray(candidates)) return [];
  const seen = new Set();
  return candidates.flatMap((candidate) => {
    const question = normalizeQuestion(candidate);
    if (!question || seen.has(question.id)) return [];
    seen.add(question.id);
    return [question];
  });
};

export const normalizePublicQuestionResponse = (payload) => normalizeQuestion(payload?.question);

export const readQuestionsApiError = async (response, fallback) => {
  try {
    const payload = await response.json();
    const message = cleanInline(payload?.error?.message || payload?.message, 240);
    return message || fallback;
  } catch {
    return fallback;
  }
};
