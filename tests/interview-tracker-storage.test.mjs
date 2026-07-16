import test from 'node:test';
import assert from 'node:assert/strict';

import { createEmptyTracker } from '../docs/assets/js/interview-tracker-core.mjs';
import {
  TrackerStorageError,
  clearTrackerStorage,
  preserveTrackerBackup,
  readTrackerStorage,
  trackerStorageKey,
  writeTrackerStorage,
} from '../docs/assets/js/interview-tracker-storage.mjs';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) { return this.values.get(key) ?? null; }

  setItem(key, value) { this.values.set(key, String(value)); }

  removeItem(key) { this.values.delete(key); }
}

test('稳定存储 key 不把 schema 版本写进名称', () => {
  const key = trackerStorageKey('owner/repo');
  assert.equal(key, 'llm-interview-suite:owner%2Frepo:tracker');
  assert.doesNotMatch(key, /:v\d+/);
});

test('空存储返回可写的新数据，写入后可以恢复', () => {
  const storage = new MemoryStorage();
  const key = trackerStorageKey('owner/repo');
  const empty = readTrackerStorage(storage, key, 'owner/repo', '2026-07-16T00:00:00.000Z');
  assert.equal(empty.status, 'empty');
  assert.equal(empty.data.revision, 0);

  const updated = { ...createEmptyTracker('owner/repo'), revision: 1 };
  writeTrackerStorage(storage, key, updated, 0, 'owner/repo');
  assert.equal(readTrackerStorage(storage, key, 'owner/repo').data.revision, 1);
});

test('修订号冲突时拒绝静默覆盖', () => {
  const storage = new MemoryStorage();
  const key = trackerStorageKey('owner/repo');
  writeTrackerStorage(storage, key, { ...createEmptyTracker('owner/repo'), revision: 1 }, 0, 'owner/repo');

  assert.throws(
    () => writeTrackerStorage(storage, key, { ...createEmptyTracker('owner/repo'), revision: 2 }, 0, 'owner/repo'),
    (error) => error instanceof TrackerStorageError && error.code === 'conflict',
  );
});

test('损坏记录不会被自动删除或覆盖，并能另存原始备份', () => {
  const storage = new MemoryStorage();
  const key = trackerStorageKey('owner/repo');
  storage.setItem(key, '{bad json');
  const loaded = readTrackerStorage(storage, key, 'owner/repo');
  assert.equal(loaded.status, 'corrupt');
  assert.equal(storage.getItem(key), '{bad json');
  assert.equal(preserveTrackerBackup(storage, key, loaded.raw), true);
  assert.equal(storage.getItem(`${key}:backup`), '{bad json');

  assert.throws(
    () => writeTrackerStorage(storage, key, { ...createEmptyTracker('owner/repo'), revision: 1 }, 0, 'owner/repo'),
    (error) => error instanceof TrackerStorageError && error.code === 'corrupt',
  );
});

test('浏览器存储不可用时明确降级而不是抛出未处理错误', () => {
  const storage = { getItem() { throw new Error('blocked'); } };
  const loaded = readTrackerStorage(storage, 'key', 'owner/repo');
  assert.equal(loaded.status, 'unavailable');
  assert.equal(loaded.data.repositoryId, 'owner/repo');
});

test('清空和备份操作保持显式', () => {
  const storage = new MemoryStorage();
  storage.setItem('key', 'value');
  assert.equal(preserveTrackerBackup(storage, 'key', 'value'), true);
  assert.equal(clearTrackerStorage(storage, 'key'), true);
  assert.equal(storage.getItem('key'), null);
  assert.equal(storage.getItem('key:backup'), 'value');
});
