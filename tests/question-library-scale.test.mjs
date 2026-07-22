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
  assert.match(page, /默认显示 {{ core_count }} 道核心必会题/);
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

test('首页默认显示核心必会，并把备考层级与其他条件取交集', async () => {
  const [page, script] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/assets/js/search.js'),
  ]);
  const tierSelect = page.match(/<select id="question-study-tier"[\s\S]*?<\/select>/)?.[0] || '';

  assert.match(tierSelect, /<option value="core"\{% if core_count > 0 %\} selected\{% endif %\}>核心必会/);
  assert.match(tierSelect, /<option value="role">岗位专项/);
  assert.match(tierSelect, /<option value="extended">扩展知识点/);
  assert.match(tierSelect, /<option value="archive">待重整/);
  assert.match(tierSelect, /<option value=""\{% if core_count == 0 %\} selected\{% endif %\}>全部/);
  assert.match(page, /data-study-tier="{{ study_tier \| escape }}"/);
  assert.match(page, /id="library-result-summary">默认显示 {{ core_count }} 道核心必会题/);
  assert.match(script, /const activeStudyTier = studyTier\?\.value \|\| ''/);
  assert.match(script, /const matchesStudyTier = !activeStudyTier \|\| card\.dataset\.studyTier === activeStudyTier/);
  assert.match(script, /matchesCategory && matchesStudyTier && matchesDifficulty && matchesReviewState && matchesKeyword/);
  assert.match(script, /studyTier\?\.addEventListener\('change',[\s\S]*?visibleLimit = pageSize/);
});

test('模拟面试默认核心必会，并把层级传入随机题池过滤', async () => {
  const [page, script] = await Promise.all([
    read('../docs/practice.html'),
    read('../docs/assets/js/practice.js'),
  ]);
  const tierSelect = page.match(/<select id="practice-study-tier"[\s\S]*?<\/select>/)?.[0] || '';

  assert.match(tierSelect, /core_questions\.size > 0[\s\S]*?<option value="core" selected>核心必会/);
  assert.match(tierSelect, /<option value="archive">待重整[^<]*不推荐/);
  assert.match(tierSelect, /<option value=""\{% if core_questions\.size == 0 %\} selected\{% endif %\}>全部可练题/);
  assert.match(page, /data-study-tier="{{ question\.study_tier \| default: 'unclassified' \| escape }}"/);
  assert.match(script, /studyTier: normalizeStudyTier\(element\.dataset\.studyTier\)/);
  assert.match(script, /studyTier: studyTierSelect\?\.value \|\| ''/);
  assert.match(script, /const pool = filterQuestions\(questions, getFilters\(\)\)/);
  assert.match(script, /\[studyTierSelect, categorySelect, difficultySelect, verificationSelect, countSelect\]/);
});

test('题卡使用浏览器延迟渲染提示降低长列表绘制开销', async () => {
  const css = await read('../docs/assets/css/style.css');

  const cardRule = css.match(/\.question-card \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(cardRule, /content-visibility: auto/);
  assert.match(cardRule, /contain-intrinsic-size: auto 112px/);
});

test('已核验答案与批量扩展后的待校对答案不会混为一谈', async () => {
  const [page, questionLayout, css, practicePage, practiceScript] = await Promise.all([
    read('../docs/index.html'),
    read('../docs/_layouts/question.html'),
    read('../docs/assets/css/style.css'),
    read('../docs/practice.html'),
    read('../docs/assets/js/practice.js'),
  ]);

  assert.match(page, /study-tier-badge[\s\S]*?question\.verified == true[\s\S]*?资料核验/);
  assert.match(page, /question\.verified != true[\s\S]*?参考答案 · 待校对/);
  assert.match(questionLayout, /if answer_ready and page\.verified != true[\s\S]*?show_provenance = true/);
  assert.match(questionLayout, /if answer_ready and page\.verified != true[\s\S]*?参考答案 · 待校对/);
  assert.match(css, /\.review-pending-badge/);
  assert.match(practicePage, /id="practice-question-review"[\s\S]*?参考答案 · 待校对/);
  assert.match(practicePage, /id="practice-verification"[\s\S]*?只练资料已核验[\s\S]*?只练参考答案待校对/);
  assert.match(practicePage, /更多设置 <span>难度、答案状态、题数<\/span>/);
  assert.match(practiceScript, /reviewBadge\.hidden = question\.verified === true/);
  assert.match(practiceScript, /verification: verificationSelect\.value/);
  assert.match(practiceScript, /verified: verified === true/);
});
