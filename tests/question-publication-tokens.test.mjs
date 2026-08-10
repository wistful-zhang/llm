import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completePendingQuestionPublication,
  createQuestionPublicationTokens,
  generateQuestionPublicationToken,
  getPendingQuestionPublication,
  getRecoverableQuestionPublicationToken,
  getQuestionPublicationToken,
  parseQuestionPublicationTokens,
  questionPublicationTokensStorageKey,
  serializeQuestionPublicationTokens,
  setPendingQuestionPublication,
} from '../docs/assets/js/question-publication-tokens.mjs';

const repositoryId = 'owner/repo';
const localId = 'question_local_1';
const remoteId = '123e4567-e89b-42d3-a456-426614174000';
const requestId = '123e4567-e89b-42d3-a456-426614174001';

test('待发布请求与编辑凭证会持久化，响应丢失后的重试可复用', () => {
  const editToken = generateQuestionPublicationToken();
  const pending = setPendingQuestionPublication(
    createQuestionPublicationTokens(repositoryId),
    localId,
    { requestId, editToken },
  );
  const restored = parseQuestionPublicationTokens(
    serializeQuestionPublicationTokens(pending, { repositoryId }),
    { repositoryId },
  );

  assert.deepEqual(getPendingQuestionPublication(restored, localId), { requestId, editToken });
  assert.match(editToken, /^[A-Za-z0-9_-]{43}$/);
  assert.match(questionPublicationTokensStorageKey(repositoryId), /question-publication-tokens:v1$/);
});

test('发布成功会原子清除 pending 并按 remoteId 保存编辑凭证', () => {
  const editToken = generateQuestionPublicationToken();
  const pending = setPendingQuestionPublication(
    createQuestionPublicationTokens(repositoryId),
    localId,
    { requestId, editToken },
  );
  const completed = completePendingQuestionPublication(
    pending,
    localId,
    remoteId,
    editToken,
  );

  assert.equal(getPendingQuestionPublication(completed, localId), null);
  assert.equal(getQuestionPublicationToken(completed, remoteId), editToken);
});

test('远端编号已写入但凭证收口失败时，仍可用 localId 的恢复记录管理公开题', () => {
  const editToken = generateQuestionPublicationToken();
  const pending = setPendingQuestionPublication(
    createQuestionPublicationTokens(repositoryId),
    localId,
    { requestId, editToken },
  );

  assert.equal(getQuestionPublicationToken(
    completePendingQuestionPublication(pending, localId, remoteId, editToken),
    remoteId,
  ), editToken);
  assert.equal(getRecoverableQuestionPublicationToken(pending, { remoteId, localId }), editToken);
  assert.equal(getRecoverableQuestionPublicationToken(pending, {
    remoteId,
    localId: 'question_local_2',
  }), '');
});

test('凭据存储拒绝弱 token、非法 UUID 与跨题库读取', () => {
  assert.throws(
    () => setPendingQuestionPublication(createQuestionPublicationTokens(repositoryId), localId, {
      requestId: 'not-a-uuid',
      editToken: 'weak',
    }),
    /请求编号|编辑凭证/,
  );
  const raw = serializeQuestionPublicationTokens(createQuestionPublicationTokens(repositoryId));
  assert.throws(
    () => parseQuestionPublicationTokens(raw, { repositoryId: 'other/repo' }),
    /另一个题库/,
  );
});
