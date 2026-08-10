import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

import { findSensitivePublicContent } from '../docs/assets/js/public-content-privacy.mjs';
import { parseQuestionDocument } from '../scripts/question-publication.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const [
  page,
  script,
  layout,
  stylesheet,
  cms,
  latexCore,
  questionMath,
  questionLayout,
  draftsCore,
  publicQuestionsScript,
  sharedQuestionScript,
  sharedQuestionPage,
] = await Promise.all([
  read('../docs/capture.html'),
  read('../docs/assets/js/question-capture.js'),
  read('../docs/_layouts/default.html'),
  read('../docs/assets/css/style.css'),
  read('../.pages.yml'),
  read('../docs/assets/js/latex-input-core.mjs'),
  read('../docs/assets/js/question-math.js'),
  read('../docs/_layouts/question.html'),
  read('../docs/assets/js/question-drafts-core.mjs'),
  read('../docs/assets/js/public-questions.js'),
  read('../docs/assets/js/shared-question.js'),
  read('../docs/shared-question.html'),
]);

const questionDirectory = new URL('../docs/_questions/', import.meta.url);
const questionFilenames = (await readdir(questionDirectory))
  .filter((filename) => /\.(?:md|markdown)$/i.test(filename));
const questionCategoryRows = await Promise.all(questionFilenames.map(async (filename) => {
  const source = await readFile(new URL(filename, questionDirectory), 'utf8');
  const parsed = parseQuestionDocument(source, filename);
  return {
    category: String(parsed.values.get('category') || ''),
    published: parsed.values.get('published') === true,
  };
}));
const currentCategories = [...new Set(questionCategoryRows
  .filter(({ published }) => published)
  .map(({ category }) => category))]
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right, 'zh-CN'));

const attributesFor = (html, id) => {
  const match = html.match(new RegExp(`<[^>]+\\bid=["']${id}["'][^>]*>`, 'i'));
  assert.ok(match, `页面缺少 #${id}`);
  return match[0];
};

const inputFor = (html, name, value) => {
  const match = [...html.matchAll(/<input\b[^>]*>/gi)].find((candidate) => (
    new RegExp(`\\bname=["']${name}["']`, 'i').test(candidate[0])
      && new RegExp(`\\bvalue=["']${value}["']`, 'i').test(candidate[0])
  ));
  assert.ok(match, `页面缺少 name=${name} value=${value} 的输入项`);
  return match[0];
};

const yamlFieldSection = (source, fieldName, nextFieldName) => {
  const normalized = source.replace(/\r\n?/g, '\n');
  const match = normalized.match(new RegExp(
    `\\n      - name: ${fieldName}\\n[\\s\\S]*?(?=\\n      - name: ${nextFieldName}\\n)`,
  ));
  assert.ok(match, `配置缺少 ${fieldName} 字段`);
  return match[0];
};

const yamlListAfter = (section, marker, endMarker = null) => {
  const tail = section.split(marker)[1] || '';
  const block = endMarker ? tail.split(endMarker)[0] : tail;
  return [...block.matchAll(/^\s+-\s+(.+?)\s*$/gm)].map((match) => match[1]);
};

test('快速记题页提供无需 Markdown 的完整表单，并允许只保存问题', () => {
  assert.match(page, /permalink:\s*\/capture\//);
  assert.match(page, /data-question-capture/);
  assert.match(page, /data-repository-id="{{ site\.github\.repository_nwo/);
  assert.match(page, /data-questions-api-url="{{ site\.data\.question_runtime\.api_url/);

  const title = attributesFor(page, 'question-draft-title');
  assert.doesNotMatch(title, /\bname=/);
  assert.match(title, /\brequired\b/);
  assert.match(title, /\bminlength="2"/);
  assert.match(title, /\bmaxlength="160"/);

  const answer = attributesFor(page, 'question-draft-answer');
  assert.doesNotMatch(answer, /\bname=/);
  assert.match(answer, /\bmaxlength="12000"/);
  assert.doesNotMatch(answer, /\brequired\b/);
  assert.match(page, /我的答案或思路[\s\S]*可留空/);
  assert.match(page, /不确定答案也可以先保存/);

  const followUps = attributesFor(page, 'question-draft-follow-ups');
  assert.doesNotMatch(followUps, /\bname=/);
  assert.match(followUps, /\bmaxlength="3200"/);
  assert.doesNotMatch(followUps, /\brequired\b/);
  assert.match(page, /追问 \/ 补充问题[\s\S]*最多 10 条，每条最多 300 字/);
  assert.match(script, /const followUpsInput = root\.querySelector\('#question-draft-follow-ups'\)/);
  assert.match(script, /followUps:\s*followUpsInput\.value/);
  assert.match(script, /followUpsInput\.value = question\.followUps\.join\('\\n'\)/);
  assert.match(stylesheet, /#question-draft-follow-ups \{ min-height: 140px; \}/);

  const category = attributesFor(page, 'question-draft-category');
  assert.match(category, /^<select\b/i);
  assert.doesNotMatch(category, /\bname=/);
  assert.match(page, /<option value="待整理" selected>待整理（稍后分类）<\/option>/);
  assert.match(page, /for category in published_categories/);
  assert.match(page, /unless category == '待整理'/);
  assert.doesNotMatch(page, /<datalist\b|list="question-draft-categories"/);
  assert.doesNotMatch(attributesFor(page, 'question-draft-difficulty'), /\bname=/);
  assert.match(page, /<option value="待评估" selected>待评估<\/option>/);
  assert.doesNotMatch(attributesFor(page, 'question-draft-answer-status'), /\bname=/);
  assert.match(page, /<option value="pending" selected>/);
  assert.match(page, /<option value="complete">/);
  assert.match(page, /写了几句思路也不会自动算完成/);
  assert.match(page, /直接放入当前题库已有分类/);

  assert.match(page, /普通段落即可，不要求 Markdown/);
  assert.match(attributesFor(page, 'question-draft-save'), /\btype="submit"/);
  assert.match(page, /添加私人题目/);
  assert.match(page, /question-capture\.js/);
});

test('答案输入支持安全的 LaTeX 插入、即时预览和失败兜底', () => {
  assert.match(attributesFor(page, 'question-draft-answer'), /aria-describedby="question-draft-answer-help question-draft-latex-status"/);
  assert.match(attributesFor(page, 'question-draft-latex-inline'), /type="button"/);
  assert.match(attributesFor(page, 'question-draft-latex-display'), /type="button"/);
  assert.match(attributesFor(page, 'question-draft-latex-inline'), /aria-controls="question-draft-answer"/);
  assert.match(page, /公式用成对的 <code>\$\$<\/code> 包住/);
  assert.match(page, /单个 <code>\$<\/code> 不作为公式分隔符/);
  assert.match(page, /注意力复杂度是 \$\$O\(n\^2\)\$\$/);
  assert.match(page, /question-draft-latex-preview-title/);
  assert.match(page, /aria-live="polite"/);

  assert.match(script, /insertLatexTemplate,/);
  assert.match(script, /parseKramdownMath,/);
  assert.match(script, /validateKramdownMath,/);
  assert.match(script, /import \{ clearMath, renderMath \} from '\.\/math-render\.mjs'/);
  assert.match(script, /answerInput\.dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/);
  assert.match(script, /window\.setTimeout\(\(\) => \{[\s\S]*?latexPreviewRenderQueue = latexPreviewRenderQueue\.then\([\s\S]*?\}, 280\)/);
  assert.match(script, /clearMath\(latexPreview\);[\s\S]*?latexPreview\.replaceChildren[\s\S]*?await renderMath\(latexPreview\)/);
  assert.match(script, /公式预览暂时不可用，内容已原样保留，仍可保存和导出/);
  assert.match(script, /if \(!rendered\) \{[\s\S]*?latexPreviewItem\(segment, index, false\)/);
  assert.match(script, /result\.value\.length > answerInput\.maxLength/);
  assert.match(script, /refreshLatexPreview\(\);[\s\S]*?formDirty = false/);
  assert.doesNotMatch(`${script}\n${latexCore}`, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);

  assert.match(stylesheet, /\.question-latex-actions button \{ min-height: 44px/);
  assert.match(stylesheet, /\.question-latex-preview-formula \{[^}]*overflow-x: auto/);
  assert.match(stylesheet, /\.question-latex-examples \{[^}]*grid-template-columns/);
  assert.match(stylesheet, /\.question-latex-help summary \{[^}]*min-height: 44px/);
});

test('正式题目、本机口述练习和共享公开题详情都会安全渲染答案、标题和追问中的公式', () => {
  assert.match(questionMath, /prepareKramdownMath\(title, \{ forceInline: true \}\)/);
  assert.match(questionMath, /\.question-followups li/);
  assert.match(questionMath, /void renderMath\(article\)/);
  assert.match(questionLayout, /\{% endif %\}\s*<script type="module" src="\{\{ '\/assets\/js\/question-math\.js'/);
  assert.match(script, /kramdownMathToMathJax\(question\.answer\)/);
  assert.match(script, /kramdownMathToMathJax\(item, \{ forceInline: true \}\)/);
  assert.match(script, /void renderMath\(practice\)/);
  assert.match(publicQuestionsScript, /import \{ validateKramdownMath \} from '\.\/latex-input-core\.mjs'/);
  assert.match(publicQuestionsScript, /import \{ clearMath, prepareKramdownMath, renderMath \} from '\.\/math-render\.mjs'/);
  assert.match(publicQuestionsScript, /const source = element\.textContent \|\| ''/);
  assert.match(publicQuestionsScript, /validateKramdownMath\(source\)\.length === 0/);
  assert.match(publicQuestionsScript, /card\.querySelector\('h2'\), \{ forceInline: true \}/);
  assert.match(publicQuestionsScript, /clearMath\(list\);[\s\S]*list\.replaceChildren[\s\S]*void renderMath\(list\)/);
  assert.match(sharedQuestionPage, /data-shared-question-title/);
  assert.match(sharedQuestionPage, /data-question-answer/);
  assert.match(sharedQuestionPage, /data-shared-question-followup-list/);
  assert.match(sharedQuestionScript, /validateKramdownMath\(value\)\.length === 0/);
  assert.match(sharedQuestionScript, /prepareSafeMath\(title, \{ forceInline: true \}\)/);
  assert.match(sharedQuestionScript, /followUpList\.querySelectorAll\('li'\)/);
  assert.match(sharedQuestionScript, /prepareSafeMath\(answer\)/);
  assert.match(sharedQuestionScript, /content\.hidden = false;[\s\S]*void renderMath\(content\)/);
  assert.doesNotMatch(publicQuestionsScript, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
  assert.doesNotMatch(sharedQuestionScript, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);
});

test('网页与 Pages CMS 使用同一组当前已有分类下拉选项', () => {
  const expected = ['待整理', ...currentCategories].sort((left, right) => left.localeCompare(right, 'zh-CN'));
  const cmsCategory = yamlFieldSection(cms, 'category', 'difficulty');
  const cmsValues = yamlListAfter(cmsCategory, '          values:\n')
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));

  assert.match(cmsCategory, /type: select/);
  assert.deepEqual(cmsValues, expected);
  assert.match(page, /for category in published_categories/);
  assert.match(page, /unless category == '待整理'/);
});

test('编辑旧草稿时临时保留已经不在当前下拉框中的历史分类', () => {
  assert.match(script, /const selectCategory = \(category\) =>/);
  assert.match(script, /document\.createElement\('option'\)/);
  assert.match(script, /option\.textContent = `\$\{value\}（已有草稿）`/);
  assert.match(script, /option\.dataset\.legacyCategory = 'true'/);
  assert.match(script, /selectCategory\(question\.category\)/);
  assert.doesNotMatch(script, /categoryInput\.value = question\.category/);
});

test('脚本失效时原生表单不会把题目、答案或来源拼进网址', () => {
  assert.match(attributesFor(page, 'question-draft-form'), /\bmethod="post"/);
  for (const id of [
    'question-draft-id',
    'question-draft-title',
    'question-draft-category',
    'question-draft-difficulty',
    'question-draft-answer-status',
    'question-draft-tags',
    'question-draft-source',
    'question-draft-answer',
    'question-draft-follow-ups',
  ]) {
    assert.doesNotMatch(attributesFor(page, id), /\bname=/, `${id} 不应成为原生表单的成功控件`);
  }
  assert.match(script, /form\.addEventListener\('submit',[\s\S]*?event\.preventDefault\(\);[\s\S]*?saveQuestion\(\);[\s\S]*?\}\);/);
  assert.doesNotMatch(script, /saveButton\.addEventListener\('click', saveQuestion\)/);
  assert.doesNotMatch(script, /form\.elements\.namedItem/);
  assert.doesNotMatch(script, /\.submit\s*\(|requestSubmit\s*\(/);
});

test('网页导出的 Markdown 默认待重整，并按公开或私人写入发布标记', () => {
  assert.match(draftsCore, /study_tier: archive/);
  assert.match(draftsCore, /published: \$\{question\.visibility === 'public'\}/);
  assert.match(draftsCore, /answer_status: \$\{answerStatus\}/);
});

test('新增题目只选择公开或私人，两种题都会进入统一题库', () => {
  const privateOption = inputFor(page, 'visibility', 'private');
  const publicOption = inputFor(page, 'visibility', 'public');

  for (const option of [privateOption, publicOption]) {
    assert.match(option, /\btype="radio"/);
    assert.match(option, /\bname="visibility"/);
  }
  assert.match(privateOption, /\bvalue="private"/);
  assert.match(privateOption, /\bchecked\b/);
  assert.match(publicOption, /\bvalue="public"/);
  assert.doesNotMatch(publicOption, /\bchecked\b/);
  assert.doesNotMatch(page, /question-public-confirmed|question-public-confirmation/);
  assert.match(page, /<legend>谁可以看这道题？<\/legend>/);
  assert.match(page, /<strong>私人<\/strong>[\s\S]*也会加入题库[\s\S]*当前浏览器[\s\S]*标记“私人”/);

  assert.match(script, /visibility:\s*selectedVisibility\(\)/);
  assert.match(script, /question\.visibility === 'public'/);
  assert.match(script, /input\.checked = input\.value === 'private'/);
  assert.match(script, /input\.checked = input\.value === question\.visibility/);
  assert.match(script, /const visibility = selectedVisibility\(\)/);
  assert.match(script, /visibility === 'public' \? '发布公开题目' : '添加私人题目'/);
  assert.match(script, /target\.hash = 'question-list-section'/);
  assert.match(script, /window\.location\.assign\(target\.toString\(\)\)/);
  assert.doesNotMatch(script, /publicConfirmation|publicConfirmedInput|showPublicChoices/);
});

test('页面明确区分私人本机题与公开题，且不收集访问凭据', () => {
  assert.match(page, /公开和私人都会加入题库/);
  assert.match(page, /<b>私人<\/b>[\s\S]*当前浏览器[\s\S]*标记“私人”/);
  assert.match(page, /选择私人时，内容只保存在当前浏览器/);
  assert.match(page, /选择公开时，题目、答案、追问、分类、标签和来源会上传到共享题库并公开显示/);
  assert.match(page, /公司机密、未授权题库或受 NDA 约束/);

  assert.doesNotMatch(page, /<input[^>]+type=["']password["']/i);
  assert.doesNotMatch(page, /<(?:input|textarea)[^>]+name=["'][^"']*(?:token|password|secret|pat)[^"']*["']/i);
  assert.match(script, /buildPublicQuestionsCollectionApiUrl\(questionsApiUrl\)/);
  assert.match(script, /method: 'POST'/);
  assert.match(script, /公开发布失败：[\s\S]*题目仍在当前浏览器，可以重新发布/);
  assert.doesNotMatch(script, /XMLHttpRequest|\bAuthorization\b/i);
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
  assert.match(attributesFor(page, 'question-draft-search'), /\baria-label="搜索本机题目、答案、追问、分类或标签"/);
  assert.match(stylesheet, /\.capture-section-heading h2:focus-visible/);
});

test('渲染本机题目只使用安全 DOM API，并在外发操作前检查隐私和危险标记', () => {
  assert.match(script, /import \{ findSensitivePublicContent \} from '\.\/public-content-privacy\.mjs'/);
  assert.match(script, /findUnsafeQuestionAnswer,/);
  assert.match(script, /element\.textContent = text/);
  assert.match(script, /list\.replaceChildren\(\.\.\.filtered\.map\(createQuestionCard\)\)/);
  assert.doesNotMatch(script, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write\s*\(/);

  assert.match(script, /findSensitivePublicContent\(\s*question\.title,\s*question\.answer,\s*question\.followUps,\s*question\.source,\s*question\.tags,?\s*\)/);
  assert.match(script, /findUnsafeQuestionAnswer\(question\.followUps\.join\('\\n'\)\)/);
  assert.match(script, /\.\.\.question\.followUps,[\s\S]*question\.category/);
  assert.match(script, /追问记录 · \$\{question\.followUps\.length\} 条/);
  assert.match(script, /practiceAnswer\.replaceChildren\(\.\.\.practiceParts\)/);
  assert.match(stylesheet, /\.question-draft-card-follow-ups/);
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

test('公开主提交直接写入共享题库，追问随请求一并提交', () => {
  assert.match(page, /data-library-url="\{\{ '\/' \| relative_url \}\}"/);
  assert.match(page, /两种题都在同一个题库/);
  assert.match(page, /<strong>私人题<\/strong>[\s\S]*保存后直接回到题库[\s\S]*只在本机可见/);
  assert.doesNotMatch(script, /ISSUE_TEMPLATE|issues\/new|buildIssueLaunch|open-issue/i);

  const payloadBlock = script.match(/const publicQuestionPayload = \(question\) => \(\{[\s\S]*?\n  \}\);/);
  assert.ok(payloadBlock, '应集中构造共享题 API 请求内容');
  for (const field of ['title', 'category', 'difficulty', 'answerStatus', 'answer', 'followUps', 'tags', 'source']) {
    assert.match(payloadBlock[0], new RegExp(`${field}: question\\.${field}`));
  }

  const postBlock = script.match(/const postPublicQuestion = async \(question, status = formStatus\) => \{[\s\S]*?\n  \};/);
  assert.ok(postBlock, '应能定位公开题直发流程');
  assert.match(postBlock[0], /buildPublicQuestionsCollectionApiUrl\(questionsApiUrl\)/);
  assert.match(postBlock[0], /method: 'POST'/);
  assert.match(postBlock[0], /\.\.\.publicQuestionPayload\(question\)/);
  assert.match(postBlock[0], /requestId: pending\.requestId/);
  assert.match(postBlock[0], /editToken: pending\.editToken/);
  assert.match(postBlock[0], /turnstileToken: securityToken/);
  assert.match(postBlock[0], /updateQuestionDraft\(state, question\.id, \{ remoteId: published\.id \}/);
  assert.ok(
    postBlock[0].indexOf('commit(linked')
      < postBlock[0].indexOf('completePendingPublication(question.id, published.id, pending.editToken)'),
    'POST 成功后必须先持久化 remoteId，再清除 localId 恢复记录',
  );
  assert.match(postBlock[0], /commit\(linked,[\s\S]*?requirePersistence: true/);
  assert.match(postBlock[0], /发布恢复记录仍在/);
  assert.match(postBlock[0], /编辑凭证仍以本机发布恢复记录保留/);
  assert.match(postBlock[0], /redirectToLibrary\(\)/);
  assert.match(postBlock[0], /公开发布失败：[\s\S]*题目仍在当前浏览器，可以重新发布/);

  const saveBlock = script.replace(/\r\n?/g, '\n').match(/const saveQuestion = async \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(saveBlock, '应能定位本机保存与公开直发流程');
  assert.match(saveBlock[0], /savedQuestion\?\.visibility === 'public'/);
  assert.match(saveBlock[0], /await postPublicQuestion\(savedQuestion, formStatus\)/);
  assert.match(script, /target\.hash = 'question-list-section'/);
  assert.match(script, /if \(action === 'retry-public'\) \{[\s\S]*?await postPublicQuestion\(question, status\)/);
  assert.match(script, /button\('重新发布', 'retry-public'/);
  assert.match(script, /'从公开题库撤回并删除'/);
  assert.doesNotMatch(script, /window\.open\(|github\.com\/.*issues/i);
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
  assert.match(script, /persistedPublicationTokensRaw = serialized/);
  assert.match(script, /currentPublicationTokensRaw !== persistedPublicationTokensRaw/);
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

test('公开题修改和删除会在发远端请求前核对两份本机存储修订', () => {
  const guardBlock = script.match(/const assertRemoteMutationStateCurrent = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(guardBlock, '应有远端写操作的同步前置检查');
  assert.match(guardBlock[0], /storage\.getItem\(storageKey\)/);
  assert.match(guardBlock[0], /storage\.getItem\(publicationTokensKey\)/);
  assert.match(guardBlock[0], /currentRaw !== persistedRaw/);
  assert.match(guardBlock[0], /currentPublicationTokensRaw !== persistedPublicationTokensRaw/);
  assert.match(guardBlock[0], /没有修改或删除共享题库中的题目/);

  for (const functionName of ['patchPublicQuestion', 'deletePublicQuestion']) {
    const block = script.match(new RegExp(
      `const ${functionName} = async \\(question(?:, next)?\\) => \\{[\\s\\S]*?\\n  \\};`,
    ));
    assert.ok(block, `应能定位 ${functionName}`);
    assert.ok(
      block[0].indexOf('assertRemoteMutationStateCurrent()') < block[0].indexOf('requestJson('),
      `${functionName} 检测到跨标签页修订时不得发远端请求`,
    );
  }
});

test('JSON 备份导入导出有大小限制、合并预览和用户确认', () => {
  assert.match(attributesFor(page, 'question-draft-import-file'), /\baccept="application\/json,\.json"/);
  assert.match(page, /JSON 用于恢复题目内容，文件是未加密明文/);
  assert.match(page, /公开题的修改凭据只留在当前浏览器，不会写进备份/);
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
  assert.match(layout, /class="capture-link"[^>]+href="{{ '\/capture\/' \| relative_url }}"[^>]*>＋题目<\/a>/);
  assert.match(layout, /\{% if page\.url == '\/capture\/' %\} aria-current="page"\{% endif %\}/);
  assert.match(layout, /<a href="{{ '\/capture\/' \| relative_url }}">增加题目<\/a>/);

  const mobileBlock = stylesheet.match(/@media \(max-width: 720px\) \{[\s\S]*?\n\}/);
  assert.ok(mobileBlock, '应有 720px 移动端布局');
  assert.match(mobileBlock[0], /\.nav-wrap nav \.start-link \{ display: none; \}/);
  assert.match(mobileBlock[0], /\.nav-wrap nav \.optional-link \{ display: none; \}/);
  assert.match(mobileBlock[0], /\.capture-workspace \{ grid-template-columns: 1fr; \}/);
  assert.match(mobileBlock[0], /\.question-draft-card-actions[^}]*flex-direction: column/);
  assert.match(mobileBlock[0], /min-height: 44px/);
  assert.doesNotMatch(stylesheet, /\.capture-link\s*\{[^}]*display:\s*none/);
});
