import {
  createEmptyTracker,
  sanitizeTracker,
} from './interview-tracker-core.mjs';

export class TrackerStorageError extends Error {
  constructor(message, code, cause) {
    super(message, cause ? { cause } : undefined);
    this.name = 'TrackerStorageError';
    this.code = code;
  }
}

export const trackerStorageKey = (repositoryId) => (
  `llm-interview-suite:${encodeURIComponent(String(repositoryId || 'default'))}:tracker`
);

export function readTrackerStorage(storage, key, repositoryId, now = new Date().toISOString()) {
  let raw;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    return {
      status: 'unavailable',
      data: createEmptyTracker(repositoryId, now),
      raw: '',
      error,
    };
  }

  if (!raw) {
    return {
      status: 'empty',
      data: createEmptyTracker(repositoryId, now),
      raw: '',
      error: null,
    };
  }

  try {
    return {
      status: 'ready',
      data: sanitizeTracker(JSON.parse(raw), { repositoryId, now }),
      raw,
      error: null,
    };
  } catch (error) {
    return { status: 'corrupt', data: null, raw, error };
  }
}

export function writeTrackerStorage(storage, key, tracker, expectedRevision, repositoryId) {
  let currentRaw;
  try {
    currentRaw = storage.getItem(key);
  } catch (error) {
    throw new TrackerStorageError('浏览器不允许保存面试记录。', 'unavailable', error);
  }

  if (currentRaw) {
    let current;
    try {
      current = sanitizeTracker(JSON.parse(currentRaw), { repositoryId });
    } catch (error) {
      throw new TrackerStorageError('现有记录无法读取，已停止覆盖以保护原始数据。', 'corrupt', error);
    }
    if (current.revision !== expectedRevision) {
      throw new TrackerStorageError('另一个页面已经更新了面试记录。', 'conflict');
    }
  } else if (expectedRevision !== 0) {
    throw new TrackerStorageError('面试记录已在另一个页面被清空。', 'conflict');
  }

  try {
    storage.setItem(key, JSON.stringify(tracker));
  } catch (error) {
    throw new TrackerStorageError('浏览器保存空间不足或被禁用。', 'unavailable', error);
  }
  return tracker;
}

export function preserveTrackerBackup(storage, key, raw) {
  if (!raw) return false;
  try {
    storage.setItem(`${key}:backup`, raw);
    return true;
  } catch {
    return false;
  }
}

export function clearTrackerStorage(storage, key) {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
