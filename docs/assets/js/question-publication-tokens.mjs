import { normalizeRepositoryId } from './question-drafts-core.mjs';

const FORMAT = 'llm-question-publication-tokens';
const VERSION = 1;
const REMOTE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,119}$/;
const REQUEST_ID_PATTERN = REMOTE_ID_PATTERN;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,172}$/;
const MAX_TOKENS = 500;

const cleanRemoteId = (value) => {
  const id = String(value || '').trim().toLowerCase();
  if (!REMOTE_ID_PATTERN.test(id)) throw new TypeError('公开题编号无效');
  return id;
};

const cleanToken = (value) => {
  const token = String(value || '').trim();
  if (!TOKEN_PATTERN.test(token)) throw new TypeError('公开题编辑凭证无效');
  return token;
};

const cleanLocalId = (value) => {
  const id = String(value || '').trim();
  if (!LOCAL_ID_PATTERN.test(id)) throw new TypeError('本机题目编号无效');
  return id;
};

const cleanPendingPublication = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('待发布题目凭证无效');
  }
  const requestId = String(value.requestId || '').trim().toLowerCase();
  if (!REQUEST_ID_PATTERN.test(requestId)) throw new TypeError('待发布请求编号无效');
  return { requestId, editToken: cleanToken(value.editToken) };
};

export const questionPublicationTokensStorageKey = (repositoryId) => (
  `llm-interview-suite:${encodeURIComponent(normalizeRepositoryId(repositoryId))}:question-publication-tokens:v1`
);

export const createQuestionPublicationTokens = (repositoryId) => ({
  format: FORMAT,
  version: VERSION,
  repositoryId: normalizeRepositoryId(repositoryId),
  tokens: {},
  pending: {},
});

export const sanitizeQuestionPublicationTokens = (value, { repositoryId } = {}) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('公开题编辑凭证数据无效');
  }
  if (value.format !== FORMAT || value.version !== VERSION) {
    throw new TypeError('暂不支持这份公开题编辑凭证');
  }
  const owner = normalizeRepositoryId(value.repositoryId);
  if (repositoryId !== undefined && owner !== normalizeRepositoryId(repositoryId)) {
    throw new TypeError('公开题编辑凭证属于另一个题库');
  }
  if (!value.tokens || typeof value.tokens !== 'object' || Array.isArray(value.tokens)) {
    throw new TypeError('公开题编辑凭证列表无效');
  }
  const entries = Object.entries(value.tokens);
  if (entries.length > MAX_TOKENS) throw new TypeError('公开题编辑凭证数量超出上限');
  const tokens = Object.fromEntries(entries.map(([id, token]) => [cleanRemoteId(id), cleanToken(token)]));
  const pendingEntries = Object.entries(value.pending || {});
  if (pendingEntries.length > MAX_TOKENS) throw new TypeError('待发布题目凭证数量超出上限');
  const pending = Object.fromEntries(pendingEntries.map(([id, publication]) => [
    cleanLocalId(id),
    cleanPendingPublication(publication),
  ]));
  return { format: FORMAT, version: VERSION, repositoryId: owner, tokens, pending };
};

export const parseQuestionPublicationTokens = (raw, options = {}) => {
  if (!raw) return createQuestionPublicationTokens(options.repositoryId);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new TypeError('公开题编辑凭证不是有效 JSON');
  }
  return sanitizeQuestionPublicationTokens(parsed, options);
};

export const serializeQuestionPublicationTokens = (value, options = {}) => JSON.stringify(
  sanitizeQuestionPublicationTokens(value, options),
);

export const getQuestionPublicationToken = (value, remoteId) => (
  sanitizeQuestionPublicationTokens(value).tokens[cleanRemoteId(remoteId)] || ''
);

export const getRecoverableQuestionPublicationToken = (
  value,
  { remoteId = '', localId = '' } = {},
) => {
  const state = sanitizeQuestionPublicationTokens(value);
  const directToken = remoteId ? state.tokens[cleanRemoteId(remoteId)] : '';
  if (directToken) return directToken;
  if (!localId) return '';
  return state.pending[cleanLocalId(localId)]?.editToken || '';
};

export const setQuestionPublicationToken = (value, remoteId, editToken) => {
  const state = sanitizeQuestionPublicationTokens(value);
  return {
    ...state,
    tokens: { ...state.tokens, [cleanRemoteId(remoteId)]: cleanToken(editToken) },
  };
};

export const removeQuestionPublicationToken = (value, remoteId) => {
  const state = sanitizeQuestionPublicationTokens(value);
  const tokens = { ...state.tokens };
  delete tokens[cleanRemoteId(remoteId)];
  return { ...state, tokens };
};

export const getPendingQuestionPublication = (value, localId) => {
  const state = sanitizeQuestionPublicationTokens(value);
  return state.pending[cleanLocalId(localId)] || null;
};

export const setPendingQuestionPublication = (value, localId, publication) => {
  const state = sanitizeQuestionPublicationTokens(value);
  return {
    ...state,
    pending: {
      ...state.pending,
      [cleanLocalId(localId)]: cleanPendingPublication(publication),
    },
  };
};

export const completePendingQuestionPublication = (value, localId, remoteId, editToken) => {
  const state = sanitizeQuestionPublicationTokens(value);
  const pending = { ...state.pending };
  delete pending[cleanLocalId(localId)];
  return {
    ...state,
    tokens: { ...state.tokens, [cleanRemoteId(remoteId)]: cleanToken(editToken) },
    pending,
  };
};

export const removePendingQuestionPublication = (value, localId) => {
  const state = sanitizeQuestionPublicationTokens(value);
  const pending = { ...state.pending };
  delete pending[cleanLocalId(localId)];
  return { ...state, pending };
};

export const generateQuestionPublicationToken = (cryptoObject = globalThis.crypto) => {
  if (!cryptoObject?.getRandomValues) throw new Error('浏览器无法生成安全的公开题编辑凭证');
  const bytes = new Uint8Array(32);
  cryptoObject.getRandomValues(bytes);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};
