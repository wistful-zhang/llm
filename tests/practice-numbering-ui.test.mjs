import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

test('模拟面试同时展示固定题库号和本轮随机位置', async () => {
  const [page, script] = await Promise.all([
    read('../docs/practice.html'),
    read('../docs/assets/js/practice.js'),
  ]);

  assert.match(page, /published_questions \| sort: 'question_number'/);
  assert.match(page, /id="practice-progress-text">本轮第 1 \/ 1 题/);
  assert.match(page, /id="practice-question-library-number"[^>]*>题库 #001/);
  assert.match(page, /data-question-number="{{ question\.question_number }}"/);
  assert.match(script, /questionNumber: Number\.parseInt\(element\.dataset\.questionNumber, 10\)/);
  assert.match(script, /const sessionPosition = `本轮第 \$\{state\.cursor \+ 1} \/ \$\{state\.queue\.length} 题`/);
  assert.match(script, /`题库 #\$\{String\(question\.questionNumber\)\.padStart\(3, '0'\)}`/);
  assert.match(script, /libraryNumberBadge\.hidden = !hasLibraryNumber/);
  assert.match(script, /announce\(`\$\{sessionPosition}\$\{libraryNumber/);
  assert.doesNotMatch(script, /progressText\.textContent = `第 \$\{state\.cursor \+ 1} 题，共/);
});

test('手机题卡保留紧凑固定题号且为正文和操作列留出安全宽度', async () => {
  const stylesheet = await read('../docs/assets/css/style.css');
  const mobileStart = stylesheet.indexOf('@media (max-width: 720px)');
  const mobileEnd = stylesheet.indexOf('@media (max-width:', mobileStart + 1);
  const mobileStyles = stylesheet.slice(mobileStart, mobileEnd > mobileStart ? mobileEnd : undefined);

  assert.match(stylesheet, /\.card-number \{[\s\S]*?font-variant-numeric: tabular-nums;[\s\S]*?white-space: nowrap;/);
  assert.match(
    mobileStyles,
    /\.question-card \{ grid-template-columns: 46px minmax\(0, 1fr\) auto; gap: 10px;/,
  );
  assert.match(mobileStyles, /\.card-number \{ max-width: 46px; overflow: hidden; font-size: \.72rem; \}/);
  assert.doesNotMatch(mobileStyles, /\.card-number \{ display: none; \}/);
});

test('模板版本与固定题号升级说明保持一致', async () => {
  const [templateVersion, packageJson, changelog, upgrading] = await Promise.all([
    read('../TEMPLATE_VERSION'),
    read('../package.json').then(JSON.parse),
    read('../CHANGELOG.md'),
    read('../UPGRADING.md'),
  ]);

  assert.equal(templateVersion.trim(), '1.9.5');
  assert.equal(packageJson.version, '1.9.5');
  assert.match(changelog, /## 1\.9\.5 - 2026-08-31/);
  assert.match(upgrading, /## 升级到 1\.9\.5 的固定题号/);
  assert.match(upgrading, /0003_stable_question_numbers\.sql/);
});
