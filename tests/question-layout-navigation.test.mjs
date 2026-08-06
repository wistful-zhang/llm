import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readLayout = () => readFile(
  new URL('../docs/_layouts/question.html', import.meta.url),
  'utf8',
);

test('待重整题仅在来源明确标记批量扩展时显示批量扩展警告', async () => {
  const layout = await readLayout();
  const sourceDetection = layout.match(
    /\{% assign source_is_batch_expansion = false %\}[\s\S]*?\{% assign answer_text =/,
  )?.[0] || '';
  const archiveWarning = layout.match(
    /\{% if study_tier == 'archive' %\}[\s\S]*?\{% elsif study_tier == 'extended' %\}/,
  )?.[0] || '';

  assert.match(
    sourceDetection,
    /source_note contains '尚无逐题真实面经频率证明'[\s\S]*?source_note contains '扩展知识点整理'[\s\S]*?source_is_batch_expansion = true/,
  );
  assert.match(
    archiveWarning,
    /\{% if source_is_batch_expansion %\}[\s\S]*?它来自批量扩展[\s\S]*?\{% else %\}[\s\S]*?它尚未完成学习优先级整理与人工复核/,
  );
  assert.equal(
    (archiveWarning.match(/它来自批量扩展/g) || []).length,
    1,
    '普通手工待重整题的兜底文案不能声称来自批量扩展',
  );
});

test('题目翻页只从相同备考层级的已发布题目中寻找相邻项', async () => {
  const layout = await readLayout();
  const navigation = layout.match(
    /\{% assign same_tier_questions =[\s\S]*?<nav class="question-nav"[\s\S]*?<\/nav>/,
  )?.[0] || '';

  assert.match(
    navigation,
    /site\.questions \| where: 'published', true \| where: 'study_tier', study_tier \| sort: 'date' \| reverse/,
  );
  assert.match(
    navigation,
    /candidate_question\.url == page\.url[\s\S]*?previous_same_tier = candidate_question/,
  );
  assert.match(
    navigation,
    /current_question_found[\s\S]*?next_same_tier = candidate_question[\s\S]*?\{% break %\}/,
  );
  assert.match(navigation, /aria-label="同一备考层级的题目翻页"/);
  assert.match(navigation, /previous_same_tier\.url[\s\S]*?next_same_tier\.url/);
  assert.doesNotMatch(navigation, /page\.(?:previous|next)/);
});
