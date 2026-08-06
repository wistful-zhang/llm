import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

const [tracks, home, practice, guide, search, practiceScript, stylesheet, about] = await Promise.all([
  read('../docs/_data/study_tracks.yml'),
  read('../docs/index.html'),
  read('../docs/practice.html'),
  read('../docs/study-tiers.md'),
  read('../docs/assets/js/search.js'),
  read('../docs/assets/js/practice.js'),
  read('../docs/assets/css/style.css'),
  read('../docs/about.md'),
]);

test('四条岗位路线由单一数据文件驱动，并同时用于浏览、模拟和说明页', () => {
  for (const id of ['application', 'training', 'inference', 'multimodal']) {
    assert.match(tracks, new RegExp(`- id: ${id}\\b`));
  }
  assert.match(tracks, /RAG[\s\S]*?Agent[\s\S]*?评测与安全[\s\S]*?系统设计/);
  assert.match(tracks, /预训练与数据[\s\S]*?训练与对齐[\s\S]*?训练工程[\s\S]*?数学基础/);
  assert.match(tracks, /推理与部署[\s\S]*?系统设计[\s\S]*?工程实践/);

  assert.match(home, /for track in site\.data\.study_tracks/);
  assert.match(home, /id="question-track"[\s\S]*?data-categories=/);
  assert.match(practice, /for track in site\.data\.study_tracks/);
  assert.match(practice, /id="practice-track"[\s\S]*?data-categories=/);
  assert.match(guide, /for track in site\.data\.study_tracks/);
  assert.match(guide, /track={{ track\.id \| url_encode }}&amp;tier=recommended/);
});

test('岗位预设会自动启用“核心加专项”，并在首页与模拟页共用本机偏好', () => {
  assert.match(search, /track\.value \? 'recommended' : defaultStudyTier/);
  assert.match(search, /llm-interview-practice:\$\{repositoryId\}:preferences:v1/);
  assert.match(search, /applyInitialRoute\(\)/);
  assert.match(search, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(search, /params\.has\('track'\)[\s\S]*?writeTrackPreference\(\)/);

  assert.match(practiceScript, /trackSelect\.value \? 'recommended' : defaultStudyTier/);
  assert.match(practiceScript, /llm-interview-practice:\$\{repositoryId\}:preferences:v1/);
  assert.match(practiceScript, /trackCategories: selectedTrackCategories\(\)/);
  assert.match(practiceScript, /applyInitialRoute\(\)/);
  assert.match(practiceScript, /params\.has\('track'\)[\s\S]*?writeStorage\('localStorage', preferenceStorageKey/);
  assert.match(guide, /\?track=&amp;tier=core/);
});

test('默认模拟只抽资料已核验题，并说明按分类分散抽题', () => {
  const verification = practice.match(/<select id="practice-verification"[\s\S]*?<\/select>/)?.[0] || '';
  assert.match(verification, /<option value="verified" selected>资料已核验（推荐）<\/option>/);
  assert.match(verification, /<option value="">包含全部可用答案<\/option>/);
  assert.match(practiceScript, /优先覆盖不同分类/);
});

test('首页会显示当前范围的分类计数、禁用空分类，并能一键恢复默认', () => {
  assert.match(home, /id="question-clear-filters"/);
  assert.match(home, /data-label="{{ category_label \| escape }}"/);
  assert.match(search, /const categoryCounts = new Map/);
  assert.match(search, /button\.textContent = `\$\{label\}（\$\{count\}）`/);
  assert.match(search, /button\.disabled = count === 0/);
  assert.match(search, /clearFilters\?\.addEventListener\('click'/);
  assert.match(home, /data-default-tier="\{% if core_count > 0 %\}core\{% endif %\}"/);
  assert.match(practice, /data-default-tier="\{% if core_questions\.size > 0 %\}core\{% endif %\}"/);
  assert.match(stylesheet, /\.filter:disabled/);
});

test('可复用页面使用真实公开题数，不向题库副本硬编码 1000 道', () => {
  assert.match(home, /{{ published_questions\.size }} 道是覆盖面/);
  assert.match(guide, /published_question_count = site\.questions \| where: 'published', true \| size/);
  assert.match(about, /published_question_count = site\.questions \| where: 'published', true \| size/);
  assert.doesNotMatch(home, />1000 道是覆盖面/);
  assert.doesNotMatch(guide, /^# 1000 道题/m);
  assert.doesNotMatch(about, /^1000 道题/m);
});

test('岗位路线卡片和移动端布局可直接操作', () => {
  assert.match(stylesheet, /\.study-route-grid/);
  assert.match(stylesheet, /\.study-route-actions/);
  assert.match(stylesheet, /@media \(max-width: 720px\)[\s\S]*?\.study-route-grid \{ grid-template-columns: 1fr; \}/);
});
