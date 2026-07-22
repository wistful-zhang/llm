import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { findSensitivePublicContent } from '../docs/assets/js/public-content-privacy.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const [page, script, layout, stylesheet] = await Promise.all([
  read('../docs/capture.html'),
  read('../docs/assets/js/question-capture.js'),
  read('../docs/_layouts/default.html'),
  read('../docs/assets/css/style.css'),
]);

const attributesFor = (html, id) => {
  const match = html.match(new RegExp(`<[^>]+\\bid=["']${id}["'][^>]*>`, 'i'));
  assert.ok(match, `页面缺少 #${id}`);
  return match[0];
};

test('快速记题页提供无需 Markdown 的完整表单，并允许只保存问题', () => {
  assert.match(page, /permalink:\s*\/capture\//);
  assert.match(page, /data-question-capture/);
  assert.match(page, /data-repository-id="{{ site\.github\.repository_nwo/);
  assert.match(page, /data-repository-url="{{ site\.github\.repository_url/);

  const title = attributesFor(page, 'question-draft-title');
  assert.match(title, /\bname="title"/);
  assert.match(title, /\brequired\b/);
  assert.match(title, /\bminlength="2"/);
  assert.match(title, /\bmaxlength="160"/);

  const answer = attributesFor(page, 'question-draft-answer');
  assert.match(answer, /\bname="answer"/);
  assert.match(answer, /\bmaxlength="12000"/);
  assert.doesNotMatch(answer, /\brequired\b/);
  assert.match(page, /我的答案或思路[\s\S]*可留空/);
  assert.match(page, /不确定答案也可以先保存/);

  assert.match(attributesFor(page, 'question-draft-category'), /\bvalue="待整理"/);
  assert.match(attributesFor(page, 'question-draft-difficulty'), /\bname="difficulty"/);
  assert.match(page, /<option value="待评估" selected>待评估<\/option>/);
  assert.match(attributesFor(page, 'question-draft-answer-status'), /\bname="answerStatus"/);
  assert.match(page, /<option value="pending" selected>/);
  assert.match(page, /<option value="complete">/);
  assert.match(page, /写了几句思路也不会自动算完成/);

  assert.match(page, /普通段落即可，不要求 Markdown/);
  assert.match(attributesFor(page, 'question-draft-save'), /\btype="submit"/);
  assert.match(page, /保存到当前浏览器/);
  assert.match(page, /question-capture\.js/);
});

test('页面明确区分本机、仓库和网站展示状态，且不收集访问凭据', () => {
  assert.match(page, /分清三个状态/);
  assert.match(page, /本机草稿[\s\S]*只在当前浏览器/);
  assert.match(page, /仓库草稿[\s\S]*GitHub 身份和写入权限/);
  assert.match(page, /published[\s\S]*true[\s\S]*显示在阅读网站/);
  assert.match(page, /不会要求你填写 Token/);
  assert.match(page, /不会自动上传/);
  assert.match(page, /只填题目也能保存，不会自动进入公开题库/);
  assert.match(page, /浏览器明文本地存储/);
  assert.match(page, /公司机密、未授权题库或受 NDA 约束/);

  assert.doesNotMatch(page, /<input[^>]+type=["']password["']/i);
  assert.doesNotMatch(page, /<(?:input|textarea)[^>]+name=["'][^"']*(?:token|password|secret|pat)[^"']*["']/i);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|\bAuthorization\b|api\.github\.com/i);
});

test('脚本引用的页面控件全部存在，状态信息可被辅助技术获知', () => {
  const pageIds = new Set([...page.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
  const referencedIds = [...script.matchAll(/root\.querySelector\(["']#([^"']+)["']\)/g)]
    .map((match) => match[1]);

  assert.ok(referencedIds.length >= 25, '应覆盖完整的表单、列表、练习和备份控件');
  referencedIds.forEach((id) => assert.ok(pageIds.has(id), `脚本引用了不存在的 #${id}`));
  assert.equal(new Set(referencedIds).size, referencedIds.length, '同一个页面控件不应重复绑定为不同变量');

  assert.match(attributesFor(page, 'question-draft-form-status'), /\brole="status"/);
  assert.match(attributesFor(page, 'question-draft-form-status'), /\baria-live="polite"/);
  assert.match(attributesFor(page, 'question-draft-alert'), /\brole="alert"/);
  assert.match(attributesFor(page, 'question-draft-practice-reveal'), /\baria-expanded="false"/);
  assert.match(attributesFor(page, 'question-draft-practice-reveal'), /\baria-controls="question-draft-practice-answer"/);
  assert.match(attributesFor(page, 'question-draft-practice-answer'), /\btabindex="-1"/);
  assert.match(attributesFor(page, 'question-draft-search'), /\baria-label="搜索本机题目、答案、分类或标签"/);
  assert.match(stylesheet, /\.capture-section-heading h2:focus-visible/);
});

test('渲染本机题目只使用安全 DOM API，并在外发操作前检查隐私和危险标记', () => {
  assert.match(script, /import \{ findSensitivePublicContent \} from '\.\/public-content-privacy\.mjs'/);
  assert.match(script, /findUnsafeQuestionAnswer,/);
  assert.match(script, /element\.textContent = text/);
  assert.match(script, /list\.replaceChildren\(\.\.\.filtered\.map\(createQuestionCard\)\)/);
  assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);

  assert.match(script, /findSensitivePublicContent\(\s*question\.title,\s*question\.answer,\s*question\.source,\s*question\.tags,?\s*\)/);
  assert.match(script, /原始 HTML/);
  assert.match(script, /Liquid 模板标记/);
  assert.match(script, /Markdown 图片或截图/);
  assert.match(script, /危险链接协议/);
  assert.match(script, /已阻止外发操作：检测到/);
  assert.match(script, /const outboundActions = new Set\(\[/);
  assert.match(script, /outboundActions\.has\(action\) && !publishSafety\(question, status\)/);
  assert.match(script, /技术示例可以放进 Markdown 代码块/);
});

test('浏览器端隐私检查能识别常见及简单混淆的联系方式', () => {
  const findings = findSensitivePublicContent(
    '手机 138 0013 8000',
    '邮箱 person&#64;example.com',
    '会议 https%3A%2F%2Fmeet.google.com%2Fabc-defg-hij',
  );

  assert.deepEqual(findings, ['疑似手机号码', '疑似邮箱地址', '疑似会议链接']);
  assert.deepEqual(findSensitivePublicContent('讨论 HTTPS、95% 成功率和普通项目链接。'), []);
});

test('GitHub Issue 投稿保持“两步操作”，不会预填或自动提交用户正文', () => {
  assert.match(script, /button\('复制投稿内容', 'copy-contribution'/);
  assert.match(script, /'copy-contribution'\) await copyText\(contributionText\(question\)\)/);
  assert.match(script, /'打开 GitHub 投稿表单 ↗'/);
  assert.match(script, /issue\.dataset\.action = 'open-issue'/);
  assert.match(script, /issue\.rel = 'noopener noreferrer'/);

  const issueUrlBlock = script.match(/const issueUrl = \(question\) => \{[\s\S]*?\n  \};/);
  assert.ok(issueUrlBlock, '应集中构造受控的 Issue 地址');
  assert.match(issueUrlBlock[0], /template: 'community-question\.yml'/);
  assert.match(issueUrlBlock[0], /title: `\[社区投稿\] \$\{question\.title\}`/);
  assert.doesNotMatch(issueUrlBlock[0], /\bbody\s*:/);

  assert.match(script, /GitHub Issue 的标题、正文和附件提交后会公开/);
  assert.match(script, /if \(!window\.confirm\(warning\)\) event\.preventDefault\(\)/);
  assert.match(script, /投稿内容已复制。请打开 GitHub 投稿表单并人工确认公开/);
  assert.match(script, /打开仓库，再进入 docs\/_questions\//);
  assert.match(script, /放在仓库根目录不会生效/);
  assert.doesNotMatch(script, /\.submit\s*\(|requestSubmit\s*\(/);
});

test('切换编辑、恢复或全删前不会静默覆盖尚未保存的表单', () => {
  assert.match(script, /if \(action === 'edit'\)[\s\S]*formDirty && !window\.confirm\('切换到另一道题/);
  assert.match(script, /const formWarning = formDirty \? ' 当前表单中尚未保存的文字会被清空。' : ''/);
  assert.match(script, /const formWarning = formDirty \? ' 当前表单中尚未保存的文字也会被清空。' : ''/);
  assert.match(script, /彻底删除当前浏览器中的 \$\{state\.questions\.length\}[\s\S]*\$\{formWarning\}/);
  assert.match(script, /formDirty && idInput\.value === question\.id[\s\S]*正在编辑的尚未保存文字也会丢失/);
});

test('本地存储按仓库隔离，写入前检测跨标签页冲突并处理损坏与容量失败', () => {
  assert.match(script, /const storageKey = questionDraftsStorageKey\(repositoryId\)/);
  assert.match(script, /storage = window\.localStorage/);
  assert.match(script, /parseQuestionDraftsJson\(raw, \{ repositoryId \}\)/);
  assert.match(script, /serialized = serializeQuestionDrafts\(next, \{ repositoryId \}\)/);
  assert.match(script, /storage\.setItem\(storageKey, serialized\)/);
  assert.match(script, /const currentRaw = storage\.getItem\(storageKey\) \|\| ''/);
  assert.match(script, /if \(currentRaw !== persistedRaw\)[\s\S]*另一个标签页已经更新本机题目/);
  assert.match(script, /persistedRaw = serialized/);
  assert.match(script, /浏览器没有保存这次修改[\s\S]*请立即导出 JSON/);
  assert.match(script, /修改目前只暂存在这个页面[\s\S]*刷新前请立即导出 JSON/);
  assert.match(script, /hasUnpersistedState/);
  assert.match(script, /beforeunload/);
  assert.match(script, /localDate: localDate\(\)/);
  assert.match(script, /return `\$\{question\.date\}-\$\{suffix\}\.md`/);

  assert.match(script, /if \(error instanceof QuestionDraftDataError\)[\s\S]*setWriteControls\(true\)/);
  assert.match(script, /下载原始数据/);
  assert.match(script, /为避免覆盖原数据，新增、编辑和导入已经暂停/);
  assert.match(script, /window\.addEventListener\('storage', \(event\) => \{/);
  assert.match(script, /if \(event\.key !== storageKey\) return/);
  assert.match(script, /event\.newValue\s*\?\s*parseQuestionDraftsJson\(event\.newValue, \{ repositoryId \}\)/);
  assert.match(script, /已同步另一个标签页中的最新本机题目/);
  const crossTabFailure = script.match(/window\.addEventListener\('storage',[\s\S]*?\n  \}\);/);
  assert.ok(crossTabFailure, '应监听跨标签页的 storage 事件');
  assert.match(crossTabFailure[0], /setWriteControls\(true\)/);
  assert.match(crossTabFailure[0], /setWriteControls\(false\)/);
  assert.match(crossTabFailure[0], /另一个标签页写入了无法读取的数据/);
});

test('JSON 备份导入导出有大小限制、合并预览和用户确认', () => {
  assert.match(attributesFor(page, 'question-draft-import-file'), /\baccept="application\/json,\.json"/);
  assert.match(page, /JSON 用于完整恢复，文件是未加密明文/);
  assert.match(script, /exportQuestionDraftsJson\(state\)/);
  assert.match(script, /application\/json;charset=utf-8/);
  assert.match(script, /全部本机题目已导出为未加密 JSON/);

  assert.match(script, /file\.size > 5 \* 1024 \* 1024/);
  assert.match(script, /importQuestionDraftsJson\(state, await file\.text\(\), \{/);
  assert.match(script, /allowCrossRepository: true/);
  assert.match(script, /备份来自 \$\{report\.sourceRepositoryId\}，恢复后会归入当前题库/);
  assert.match(script, /有 \$\{report\.conflicts\.length\} 道冲突题将保留本机现有版本/);
  assert.match(script, /if \(!window\.confirm\(`\$\{sourceText\}[\s\S]*确认恢复吗？`\)\) return/);
  assert.match(script, /commit\(report\.data, `已恢复 \$\{report\.added\} 道题/);
});

test('桌面和移动端都保留醒目的记题入口，窄屏隐藏低优先级入口', () => {
  assert.match(layout, /class="capture-link"[^>]+href="{{ '\/capture\/' \| relative_url }}"[^>]*>＋记题<\/a>/);
  assert.match(layout, /\{% if page\.url == '\/capture\/' %\} aria-current="page"\{% endif %\}/);
  assert.match(layout, /<a href="{{ '\/capture\/' \| relative_url }}">快速记题<\/a>/);

  const mobileBlock = stylesheet.match(/@media \(max-width: 720px\) \{[\s\S]*?\n\}/);
  assert.ok(mobileBlock, '应有 720px 移动端布局');
  assert.match(mobileBlock[0], /\.nav-wrap nav \.start-link \{ display: none; \}/);
  assert.match(mobileBlock[0], /\.nav-wrap nav \.optional-link \{ display: none; \}/);
  assert.match(mobileBlock[0], /\.capture-workspace \{ grid-template-columns: 1fr; \}/);
  assert.match(mobileBlock[0], /\.question-draft-card-actions[^}]*flex-direction: column/);
  assert.match(mobileBlock[0], /min-height: 44px/);
  assert.doesNotMatch(stylesheet, /\.capture-link\s*\{[^}]*display:\s*none/);
});
