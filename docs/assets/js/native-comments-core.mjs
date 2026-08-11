export const COMMENT_LIMITS = Object.freeze({
  nicknameMin: 2,
  nicknameMax: 24,
  bodyMin: 2,
  bodyMax: 2000,
  pageSize: 20,
});

const SLUG_PATTERN = /^[\p{L}\p{N}](?:[\p{L}\p{N}._-]{0,199})$/u;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const SITE_KEY_PATTERN = /^[A-Za-z0-9_-]{10,100}$/;

export const normalizePlainText = (value) => String(value ?? '')
  .replace(/\r\n?/g, '\n')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  .trim();

export const validateApiUrl = (value, baseUrl = 'https://example.invalid/') => {
  const raw = String(value ?? '').trim();
  if (!raw || raw.length > 500) return null;

  try {
    const url = new URL(raw, baseUrl);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
      || url.username
      || url.password
      || url.search
      || url.hash
      || url.pathname !== '/') return null;
    return url;
  } catch {
    return null;
  }
};

export const validateQuestionSlug = (value) => {
  const slug = String(value ?? '').trim();
  return SLUG_PATTERN.test(slug) ? slug : null;
};

export const buildCommentsUrl = (apiUrl, questionSlug, { cursor = 0, limit = COMMENT_LIMITS.pageSize } = {}) => {
  const base = validateApiUrl(apiUrl);
  const slug = validateQuestionSlug(questionSlug);
  if (!base || !slug) throw new TypeError('评论接口或题目标识无效');
  const url = new URL(`${base.href.replace(/\/+$/, '')}/v1/questions/${encodeURIComponent(slug)}/comments`);
  const safeCursor = Number.isSafeInteger(Number(cursor)) && Number(cursor) >= 0 ? Number(cursor) : 0;
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || COMMENT_LIMITS.pageSize));
  url.searchParams.set('cursor', String(safeCursor));
  url.searchParams.set('limit', String(safeLimit));
  return url;
};

export const buildConfigUrl = (apiUrl) => {
  const base = validateApiUrl(apiUrl);
  if (!base) throw new TypeError('评论接口无效');
  return new URL(`${base.href.replace(/\/+$/, '')}/v1/config`);
};

export const buildCommentActionUrl = (apiUrl, commentId, action = '') => {
  const base = validateApiUrl(apiUrl);
  const id = String(commentId ?? '').trim();
  if (!base || !UUID_PATTERN.test(id)) throw new TypeError('评论接口或评论标识无效');
  const suffix = action === 'reports' ? '/reports' : '';
  return new URL(`${base.href.replace(/\/+$/, '')}/v1/comments/${id}${suffix}`);
};

export const validateCommentDraft = ({ nickname, body }) => {
  const cleanNickname = normalizePlainText(nickname).replace(/\s+/g, ' ') || '匿名访客';
  const cleanBody = normalizePlainText(body);
  const errors = [];
  if (cleanNickname.length < COMMENT_LIMITS.nicknameMin || cleanNickname.length > COMMENT_LIMITS.nicknameMax) {
    errors.push(`昵称请填写 ${COMMENT_LIMITS.nicknameMin}–${COMMENT_LIMITS.nicknameMax} 个字`);
  }
  if (cleanBody.length < COMMENT_LIMITS.bodyMin || cleanBody.length > COMMENT_LIMITS.bodyMax) {
    errors.push(`评论请填写 ${COMMENT_LIMITS.bodyMin}–${COMMENT_LIMITS.bodyMax} 个字`);
  }
  return { nickname: cleanNickname, body: cleanBody, errors };
};

export const normalizeComment = (value) => {
  if (!value || typeof value !== 'object') return null;
  const id = String(value.id ?? '').trim();
  const floor = Number(value.floor);
  const nickname = normalizePlainText(value.nickname);
  const body = normalizePlainText(value.body);
  const createdAt = String(value.createdAt ?? '');
  const updatedAt = String(value.updatedAt ?? '');
  const status = value.status === 'deleted' ? 'deleted' : 'visible';
  if (!UUID_PATTERN.test(id)
    || !Number.isSafeInteger(floor)
    || floor < 1
    || nickname.length > COMMENT_LIMITS.nicknameMax
    || body.length > COMMENT_LIMITS.bodyMax
    || Number.isNaN(Date.parse(createdAt))) return null;

  let replyTo = null;
  if (value.replyTo && typeof value.replyTo === 'object') {
    const replyId = String(value.replyTo.id ?? '').trim();
    const replyFloor = Number(value.replyTo.floor);
    const replyNickname = normalizePlainText(value.replyTo.nickname);
    if (UUID_PATTERN.test(replyId)
      && Number.isSafeInteger(replyFloor)
      && replyFloor > 0
      && replyNickname.length <= COMMENT_LIMITS.nicknameMax) {
      replyTo = { id: replyId, floor: replyFloor, nickname: replyNickname };
    }
  }

  return {
    id,
    floor,
    nickname: status === 'deleted' ? '已删除' : nickname,
    body: status === 'deleted' ? '该评论已删除。' : body,
    createdAt,
    updatedAt: Number.isNaN(Date.parse(updatedAt)) ? createdAt : updatedAt,
    replyTo,
    status,
  };
};

export const normalizeCommentsPage = (value) => {
  if (!value || typeof value !== 'object' || !Array.isArray(value.comments)) {
    throw new TypeError('评论响应格式无效');
  }
  const comments = value.comments.map(normalizeComment).filter(Boolean);
  const total = Number(value.total);
  const nextCursor = Number(value.nextCursor);
  return {
    comments,
    total: Number.isSafeInteger(total) && total >= comments.length ? total : comments.length,
    nextCursor: Number.isSafeInteger(nextCursor) && nextCursor > 0 ? nextCursor : null,
    locked: value.locked === true,
  };
};

export const normalizeCommentsConfig = (value) => {
  if (!value || typeof value !== 'object') throw new TypeError('评论配置响应格式无效');
  const siteId = String(value.siteId ?? '').trim();
  const turnstileSiteKey = String(value.turnstileSiteKey ?? '').trim();
  const writeEnabled = value.writeEnabled === true;
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(siteId)
    || (writeEnabled && !SITE_KEY_PATTERN.test(turnstileSiteKey))) {
    throw new TypeError('评论服务尚未完成配置');
  }
  return { siteId, turnstileSiteKey, writeEnabled };
};

export const isEditToken = (value) => TOKEN_PATTERN.test(String(value ?? ''));

export const createClientSecret = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

export const createRequestId = () => crypto.randomUUID();
