import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

test('千题规模下支持难度筛选和分批显示', async () => {
  const [page, script] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/assets/js/search.js'),
  ]);

  assert.match(page, /id="question-difficulty"/);
  assert.match(page, /id="question-review-state"/);
  assert.match(page, /data-difficulty="{{ question\.difficulty \| escape }}"/);
  assert.match(page, /data-verified="{{ question\.verified \| default: false }}"/);
  assert.match(page, /id="library-result-summary"/);
  assert.match(page, /未启用 JavaScript[\s\S]*?筛选和分批显示暂不可用/);
  assert.match(page, /共 {{ published_questions\.size }} 道符合条件/);
  assert.match(page, /id="question-load-more"/);
  assert.match(script, /const pageSize = 60/);
  assert.match(script, /matchesDifficulty/);
  assert.match(script, /matchesReviewState/);
  assert.match(script, /matchingCount <= visibleLimit/);
  assert.match(script, /visibleLimit \+= pageSize/);
  assert.match(script, /firstNewCard\?\.focus\(\)/);
  assert.match(script, /controller\.abort\(\), 8000/);
  assert.match(script, /已显示 \$\{visibleCount\} \/ \$\{matchingCount\} 道符合条件/);
  assert.match(script, /当前显示 \$\{visibleCount\} \/ \$\{matchingCount\} 道题目/);
});

test('更换搜索和筛选条件会从首批题目重新显示', async () => {
  const script = await read('../docs/assets/js/search.js');

  assert.match(script, /search\.addEventListener\('input',[\s\S]*?visibleLimit = pageSize/);
  assert.match(script, /button\.addEventListener\('click',[\s\S]*?visibleLimit = pageSize/);
  assert.match(script, /difficulty\?\.addEventListener\('change',[\s\S]*?visibleLimit = pageSize/);
  assert.match(script, /reviewState\?\.addEventListener\('change',[\s\S]*?visibleLimit = pageSize/);
});

test('题卡使用浏览器延迟渲染提示降低长列表绘制开销', async () => {
  const css = await read('../docs/assets/css/style.css');

  const cardRule = css.match(/\.question-card \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(cardRule, /content-visibility: auto/);
  assert.match(cardRule, /contain-intrinsic-size: auto 112px/);
});

test('已核验答案与批量扩展后的待复核答案不会混为一谈', async () => {
  const [page, questionLayout, css, practicePage, practiceScript] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/_layouts/question.html'),
    read('../docs/assets/css/style.css'),
    read('../docs/practice.html'),
    read('../docs/assets/js/practice.js'),
  ]);

  assert.match(page, /{{ verified_count }} 道资料核验/);
  assert.match(page, /question\.verified != true[\s\S]*?答案待复核/);
  assert.match(questionLayout, /if answer_ready and page\.verified != true[\s\S]*?show_provenance = true/);
  assert.match(questionLayout, /if answer_ready and page\.verified != true[\s\S]*?答案待复核/);
  assert.match(css, /\.review-pending-badge/);
  assert.match(practicePage, /id="practice-question-review"[\s\S]*?答案待复核/);
  assert.match(practicePage, /id="practice-verification"[\s\S]*?只练资料已核验[\s\S]*?只练答案待复核/);
  assert.match(practicePage, /更多设置 <span>难度、答案状态、题数<\/span>/);
  assert.match(practiceScript, /reviewBadge\.hidden = question\.verified === true/);
  assert.match(practiceScript, /verification: verificationSelect\.value/);
  assert.match(practiceScript, /verified: verified === true/);
});
