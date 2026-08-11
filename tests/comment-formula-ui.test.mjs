import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('评论框提供轻量 LaTeX 插入、即时预览和清楚的纯文本边界', async () => {
  const [include, script] = await Promise.all([
    read('../docs/_includes/question-comments.html'),
    read('../docs/assets/js/question-comments.js'),
  ]);

  assert.match(include, /id="comment-body-input"/);
  assert.match(include, /data-comment-latex-inline[^>]*aria-controls="comment-body-input"/);
  assert.match(include, /data-comment-latex-display[^>]*aria-controls="comment-body-input"/);
  assert.match(include, /data-comment-latex-inline[^>]*type="button"|type="button"[^>]*data-comment-latex-inline/);
  assert.match(include, /data-comment-latex-display[^>]*type="button"|type="button"[^>]*data-comment-latex-display/);
  assert.match(include, /data-comment-latex-preview-region[^>]*role="region"/);
  assert.match(include, /data-comment-latex-preview-region[^>]*aria-busy="false"/);
  assert.match(include, /id="comment-latex-status"[^>]*aria-live="polite"/);
  assert.match(include, /aria-describedby="[^"]*comment-latex-status[^"]*"/);
  assert.match(include, /评论按纯文本保存/);
  assert.match(include, /不支持 HTML 或 Markdown/);

  assert.match(script, /insertLatexTemplate/);
  assert.match(script, /const formulaEnabled = Boolean/);
  assert.match(script, /if \(formulaEnabled\) latexAssist\.hidden = false/);
  assert.match(script, /if \(!formulaEnabled \|\| bodyInput\.disabled\) return/);
  assert.match(script, /window\.setTimeout\([\s\S]*?280\)/);
  assert.match(script, /analyzeCommentMath\(draft\.body\)[\s\S]*?公式暂时不能发布/);
  assert.match(script, /bodyInput\.setAttribute\('aria-invalid', 'true'\)/);
  assert.match(script, /请根据提示修正后再发布/);
  assert.match(script, /公式预览暂时不可用；内容已原样保留，仍可发布/);
  assert.match(script, /bodyInput\.dispatchEvent\(new Event\('input'/);
  assert.match(script, /setFormulaControlsDisabled\(state\.locked \|\| state\.submitting\)/);
  assert.match(script, /form\.setAttribute\('aria-busy', 'true'\)/);
  assert.match(script, /bodyInput\.disabled = state\.submitting/);
});

test('已发布评论只排版通过校验的独立公式节点，异常内容保持原文', async () => {
  const [script, mathCore, mathRender] = await Promise.all([
    read('../docs/assets/js/question-comments.js'),
    read('../docs/assets/js/comment-math-core.mjs'),
    read('../docs/assets/js/math-render.mjs'),
  ]);

  assert.match(script, /splitCommentMath\(comment\.body\)/);
  assert.match(script, /document\.createTextNode\(part\.value\)/);
  assert.match(script, /sourceNode\.textContent = part\.value/);
  assert.match(script, /mathEntries\.push\(\{ root: formula, sourceNode, wrapper \}\)/);
  assert.match(script, /updateMathElements\(\{[\s\S]*?clear:[\s\S]*?mutate:[\s\S]*?list\.replaceChildren[\s\S]*?render:/);
  assert.match(script, /if \(!split\.renderable\) \{[\s\S]*?body\.textContent = comment\.body/);
  assert.match(script, /sourceNode\.hidden = true/);
  assert.match(script, /mathRoot\.classList\.remove\('is-pending'\)/);
  assert.match(script, /wrapper\.classList\.add\('is-fallback'\)/);
  assert.match(mathCore, /formulas: 8/);
  assert.match(mathCore, /formulaLength: 1024/);
  assert.match(mathCore, /braceDepth: 32/);
  assert.match(mathCore, /environmentDepth: 8/);
  assert.match(mathRender, /export function updateMathElements/);
  assert.match(mathRender, /const mutationResult = typeof mutate === 'function' \? mutate\(\) : undefined/);
  assert.doesNotMatch(`${script}\n${mathCore}`, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(script, /\bclearMath\s*\(/);
  assert.doesNotMatch(script, /renderMath(?:Elements)?\(list\)|renderMath(?:Elements)?\(body\)/);
});

test('回复与编辑模式分别保留草稿，公式辅助缺失时评论核心仍可初始化', async () => {
  const script = await read('../docs/assets/js/question-comments.js');

  assert.match(script, /replyDrafts: new Map\(\)/);
  assert.match(script, /editDrafts: new Map\(\)/);
  assert.match(script, /const saveActiveComposerDraft/);
  assert.match(script, /state\.replyDrafts\.set\(state\.replyTo\.id, bodyInput\.value\)/);
  assert.match(script, /state\.editDrafts\.set\(state\.editing\.id, bodyInput\.value\)/);
  assert.match(script, /bodyInput\.value = state\.replyDrafts\.get\(comment\.id\) \|\| ''/);
  assert.match(script, /state\.editDrafts\.has\(comment\.id\)/);
  assert.match(script, /\|\| !replyContext\) return;[\s\S]*?const formulaEnabled/);
});

test('评论公式编辑器和长公式在手机端保持可操作且不撑宽页面', async () => {
  const stylesheet = await read('../docs/assets/css/style.css');

  assert.match(stylesheet, /\.question-latex-actions button \{[^}]*min-height: 44px/);
  assert.match(stylesheet, /\.comment-latex-assist \{[^}]*grid-column: 2/);
  assert.match(stylesheet, /\.comment-latex-assist \{ grid-column: auto; \}/);
  assert.match(stylesheet, /\.question-comment-math\.is-display \{[^}]*overflow-x: auto/);
  assert.match(stylesheet, /\.question-comment-math \{[^}]*max-width: 100%[^}]*overflow-x: auto/);
  assert.match(stylesheet, /\.question-comment-math-source \{[^}]*overflow-x: auto/);
  assert.match(stylesheet, /\.question-comment-math-source\[hidden\] \{ display: none; \}/);
  assert.match(stylesheet, /\.question-comment-math\.is-pending \{[^}]*clip-path: inset\(50%\)/);
  assert.match(stylesheet, /\.comment-composer input, \.comment-composer textarea \{ font-size: 16px; \}/);
});
