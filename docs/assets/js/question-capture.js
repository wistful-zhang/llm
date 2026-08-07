import {
  QuestionDraftDataError,
  addQuestionDraft,
  buildQuestionAnswerPrompt,
  buildQuestionMarkdown,
  createEmptyQuestionDrafts,
  deleteQuestionDraft,
  exportQuestionDraftsJson,
  findUnsafeQuestionAnswer,
  importQuestionDraftsJson,
  parseQuestionDraftsJson,
  questionDraftsStorageKey,
  serializeQuestionDrafts,
  updateQuestionDraft,
} from './question-drafts-core.mjs';
import { findSensitivePublicContent } from './public-content-privacy.mjs';
import {
  buildPublicQuestionsApiUrl,
  normalizePublicQuestions,
  PUBLIC_QUESTIONS_TIMEOUT_MS,
} from './question-collaboration-core.mjs';
import {
  insertLatexTemplate,
  kramdownMathToMathJax,
  parseKramdownMath,
  validateKramdownMath,
} from './latex-input-core.mjs';
import { clearMath, renderMath } from './math-render.mjs';

const root = document.querySelector('[data-question-capture]');

if (root) {
  const repositoryId = root.dataset.repositoryId;
  const storageKey = questionDraftsStorageKey(repositoryId);
  const repositoryUrl = (() => {
    try {
      const url = new URL(root.dataset.repositoryUrl);
      const segments = url.pathname.split('/').filter(Boolean);
      return url.protocol === 'https:' && url.hostname === 'github.com' && segments.length === 2
        ? `${url.origin}/${segments.map(encodeURIComponent).join('/')}`
        : '';
    } catch {
      return '';
    }
  })();
  const repositoryNwo = root.dataset.repositoryNwo || '';
  const libraryUrl = (() => {
    try {
      if (!root.dataset.libraryUrl) return '';
      const url = new URL(root.dataset.libraryUrl, window.location.href);
      return url.origin === window.location.origin && ['http:', 'https:'].includes(url.protocol)
        ? url.toString()
        : '';
    } catch {
      return '';
    }
  })();

  const form = root.querySelector('#question-draft-form');
  const idInput = root.querySelector('#question-draft-id');
  const titleInput = root.querySelector('#question-draft-title');
  const answerInput = root.querySelector('#question-draft-answer');
  const latexInlineButton = root.querySelector('#question-draft-latex-inline');
  const latexDisplayButton = root.querySelector('#question-draft-latex-display');
  const latexPreview = root.querySelector('#question-draft-latex-preview');
  const latexStatus = root.querySelector('#question-draft-latex-status');
  const followUpsInput = root.querySelector('#question-draft-follow-ups');
  const answerStatusInput = root.querySelector('#question-draft-answer-status');
  const visibilityInputs = [...root.querySelectorAll('input[name="visibility"]')];
  const categoryInput = root.querySelector('#question-draft-category');
  const difficultyInput = root.querySelector('#question-draft-difficulty');
  const tagsInput = root.querySelector('#question-draft-tags');
  const sourceInput = root.querySelector('#question-draft-source');
  const modeBadge = root.querySelector('#question-draft-mode');
  const formTitle = root.querySelector('#capture-form-title');
  const formStatus = root.querySelector('#question-draft-form-status');
  const saveButton = root.querySelector('#question-draft-save');
  const resetButton = root.querySelector('#question-draft-reset');
  const searchInput = root.querySelector('#question-draft-search');
  const list = root.querySelector('#question-draft-list');
  const count = root.querySelector('#question-draft-count');
  const empty = root.querySelector('#question-draft-empty');
  const filterEmpty = root.querySelector('#question-draft-filter-empty');
  const alertBox = root.querySelector('#question-draft-alert');
  const alertTitle = root.querySelector('#question-draft-alert-title');
  const alertMessage = root.querySelector('#question-draft-alert-message');
  const downloadRawButton = root.querySelector('#question-draft-download-raw');
  const clearDamagedButton = root.querySelector('#question-draft-clear-damaged');
  const practice = root.querySelector('#question-draft-practice');
  const practiceTitle = root.querySelector('#question-draft-practice-title');
  const practiceReveal = root.querySelector('#question-draft-practice-reveal');
  const practiceAnswer = root.querySelector('#question-draft-practice-answer');
  const practiceClose = root.querySelector('#question-draft-practice-close');
  const exportButton = root.querySelector('#question-draft-export');
  const importButton = root.querySelector('#question-draft-import');
  const importFile = root.querySelector('#question-draft-import-file');
  const clearAllButton = root.querySelector('#question-draft-clear-all');
  const inputByField = {
    title: titleInput,
    answer: answerInput,
    followUps: followUpsInput,
    answerStatus: answerStatusInput,
    visibility: visibilityInputs[0],
    category: categoryInput,
    difficulty: difficultyInput,
    tags: tagsInput,
    source: sourceInput,
  };

  let storage;
  let storageAvailable = true;
  let storageBlocked = false;
  let damagedRaw = '';
  let persistedRaw = '';
  let hasUnpersistedState = false;
  let formDirty = false;
  let state = createEmptyQuestionDrafts(repositoryId);
  let publicIssuesByTitle = new Map();
  let publicIssuesLoadPromise = null;
  let latexPreviewTimer = 0;
  let latexPreviewRevision = 0;
  let latexPreviewRenderQueue = Promise.resolve();

  const makeElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const button = (label, action, className = 'text-button', questionId = '') => {
    const element = makeElement('button', className, label);
    element.type = 'button';
    element.dataset.action = action;
    if (questionId) element.dataset.questionId = questionId;
    return element;
  };

  const setLatexStatus = (message, stateName = '') => {
    latexStatus.textContent = message;
    latexStatus.classList.toggle('is-error', stateName === 'error');
    latexStatus.classList.toggle('is-warning', stateName === 'warning');
  };

  const latexPreviewItem = (segment, index, renderable = true) => {
    const item = makeElement('div', 'question-latex-preview-item');
    item.append(makeElement(
      'span',
      'question-latex-preview-kind',
      `${segment.display ? '独立公式' : '行内公式'} ${index + 1}`,
    ));
    const source = makeElement(
      'code',
      'question-latex-preview-source',
      `$$${segment.content}$$`,
    );
    item.append(source);
    if (!renderable) return item;
    const formula = makeElement('div', 'question-latex-preview-formula');
    formula.classList.add('is-pending');
    formula.setAttribute('aria-hidden', 'true');
    formula.textContent = segment.display
      ? `\\[${segment.content}\\]`
      : `\\(${segment.content}\\)`;
    item.append(formula);
    return item;
  };

  const refreshLatexPreview = () => {
    const revision = ++latexPreviewRevision;
    window.clearTimeout(latexPreviewTimer);
    clearMath(latexPreview);

    const parsed = parseKramdownMath(answerInput.value);
    const errors = validateKramdownMath(answerInput.value);
    const visibleSegments = parsed.segments.slice(0, 12);
    if (visibleSegments.length === 0) {
      latexPreview.replaceChildren(makeElement(
        'p',
        'is-empty',
        errors.length ? '公式源码会原样保留，补完整后再显示排版效果。' : '还没有公式，普通文字仍可直接保存。',
      ));
    } else {
      latexPreview.replaceChildren(...visibleSegments.map((segment, index) => (
        latexPreviewItem(segment, index, false)
      )));
    }

    if (errors.length > 0) {
      latexPreviewTimer = window.setTimeout(() => {
        if (revision === latexPreviewRevision) {
          setLatexStatus(`${errors[0]}。草稿仍可保存，请补完整后再同步 GitHub。`, 'error');
        }
      }, 280);
      return;
    }
    if (parsed.segments.length === 0) {
      setLatexStatus('输入完整公式后，这里会显示排版效果。');
      return;
    }

    latexPreviewTimer = window.setTimeout(() => {
      const renderCurrentPreview = async () => {
        if (revision !== latexPreviewRevision) return;
        clearMath(latexPreview);
        latexPreview.replaceChildren(...visibleSegments.map(latexPreviewItem));
        const rendered = await renderMath(latexPreview);
        if (revision !== latexPreviewRevision) return;
        if (!rendered) {
          clearMath(latexPreview);
          latexPreview.replaceChildren(...visibleSegments.map((segment, index) => (
            latexPreviewItem(segment, index, false)
          )));
          setLatexStatus('公式预览暂时不可用，内容已原样保留，仍可保存和导出。', 'warning');
          return;
        }
        latexPreview.querySelectorAll('.question-latex-preview-source')
          .forEach((source) => { source.hidden = true; });
        latexPreview.querySelectorAll('.question-latex-preview-formula')
          .forEach((formula) => {
            formula.classList.remove('is-pending');
            formula.removeAttribute('aria-hidden');
          });
        const limited = parsed.segments.length > visibleSegments.length
          ? `；当前显示前 ${visibleSegments.length} 个`
          : '';
        setLatexStatus(`已识别 ${parsed.segments.length} 个公式${limited}；保存和导出会保留原始 LaTeX。`);
      };
      latexPreviewRenderQueue = latexPreviewRenderQueue.then(
        renderCurrentPreview,
        renderCurrentPreview,
      );
    }, 280);
  };

  const insertLatex = (mode) => {
    const result = insertLatexTemplate(
      answerInput.value,
      answerInput.selectionStart,
      answerInput.selectionEnd,
      mode,
    );
    if (answerInput.maxLength > 0 && result.value.length > answerInput.maxLength) {
      setLatexStatus(`答案最多 ${answerInput.maxLength} 个字符，请先删减内容再插入公式。`, 'warning');
      answerInput.focus();
      return;
    }
    answerInput.value = result.value;
    answerInput.focus();
    answerInput.setSelectionRange(result.selectionStart, result.selectionEnd);
    answerInput.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const localDate = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  };

  const downloadText = (filename, text, type) => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const copyText = async (value) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // 受限浏览器继续使用选择复制兜底。
      }
    }
    const input = document.createElement('textarea');
    input.value = value;
    input.readOnly = true;
    input.tabIndex = -1;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) throw new Error('浏览器没有允许自动复制。');
    return true;
  };

  const setAlert = (title, message, options = {}) => {
    alertTitle.textContent = title;
    alertMessage.textContent = message;
    downloadRawButton.hidden = !options.damaged;
    clearDamagedButton.hidden = !options.damaged;
    alertBox.hidden = false;
  };

  const clearAlert = () => {
    if (storageBlocked) return;
    alertBox.hidden = true;
    downloadRawButton.hidden = true;
    clearDamagedButton.hidden = true;
  };

  const setWriteControls = (disabled) => {
    [...form.elements].forEach((element) => { element.disabled = disabled; });
    importButton.disabled = disabled;
    clearAllButton.disabled = disabled;
  };

  const readInitialState = () => {
    try {
      storage = window.localStorage;
      const raw = storage.getItem(storageKey);
      persistedRaw = raw || '';
      state = raw
        ? parseQuestionDraftsJson(raw, { repositoryId })
        : createEmptyQuestionDrafts(repositoryId);
    } catch (error) {
      if (error instanceof QuestionDraftDataError) {
        storageBlocked = true;
        try { damagedRaw = storage?.getItem(storageKey) || ''; } catch { damagedRaw = ''; }
        state = createEmptyQuestionDrafts(repositoryId);
        setWriteControls(true);
        setAlert('本机题目数据无法读取', `${error.message} 为避免覆盖原数据，新增、编辑和导入已经暂停。请先下载原始数据，再确认重置。`, { damaged: true });
        return;
      }
      storageAvailable = false;
      state = createEmptyQuestionDrafts(repositoryId);
      setAlert('浏览器没有开放本地存储', '本页仍可临时记题和导出 JSON，但刷新后可能丢失；本站没有把内容上传到其他地方。');
    }
  };

  const commit = (next, message, options = {}) => {
    if (storageBlocked) return false;
    let serialized;
    try {
      serialized = serializeQuestionDrafts(next, { repositoryId });
    } catch (error) {
      setAlert('这次修改没有保存', error?.message || '本机题目数据超出安全存储范围。请先导出 JSON，再精简内容。');
      return false;
    }
    let persisted = false;
    if (storageAvailable) {
      try {
        const currentRaw = storage.getItem(storageKey) || '';
        if (currentRaw !== persistedRaw) {
          setAlert('另一个标签页已经更新本机题目', '刚才的操作没有覆盖另一页。请先复制当前表单中需要保留的文字，再刷新页面检查最新内容。');
          return false;
        }
        storage.setItem(storageKey, serialized);
        persistedRaw = serialized;
        hasUnpersistedState = false;
        persisted = true;
        clearAlert();
      } catch (error) {
        setAlert('浏览器没有保存这次修改', `本页内仍会保留修改，但刷新后可能丢失。请立即导出 JSON。${error?.message ? ` 原因：${error.message}` : ''}`);
      }
    }
    if (!persisted && options.requirePersistence && persistedRaw) {
      if (!storageAvailable) {
        setAlert('没有删除本机题目', '浏览器当前不允许修改原有本机存储。旧题仍会在刷新后出现，请先导出 JSON，再检查站点存储设置。');
      }
      return false;
    }
    state = next;
    hasUnpersistedState = !persisted && serialized !== persistedRaw;
    render();
    formStatus.textContent = persisted
      ? message
      : '修改目前只暂存在这个页面，尚未持久保存，也没有上传 GitHub；刷新前请立即导出 JSON。';
    return true;
  };

  const questionById = (id) => state.questions.find((question) => question.id === id);

  const publicTitleKey = (value) => String(value || '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('zh-CN');

  const loadPublicIssueMatches = async () => {
    if (!repositoryNwo || publicIssuesLoadPromise) return publicIssuesLoadPromise;
    let apiUrl = '';
    try {
      apiUrl = buildPublicQuestionsApiUrl(repositoryNwo, 100, 1, 'all');
    } catch {
      return undefined;
    }
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PUBLIC_QUESTIONS_TIMEOUT_MS);
    publicIssuesLoadPromise = fetch(apiUrl, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub Issues API ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        publicIssuesByTitle = new Map(normalizePublicQuestions(payload, repositoryNwo)
          .map((issue) => [publicTitleKey(issue.title), issue]));
        render();
      })
      .catch(() => {
        // 公开状态读取失败不影响本机记题、编辑、备份或导出。
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        publicIssuesLoadPromise = null;
      });
    return publicIssuesLoadPromise;
  };

  const formatTime = (value) => new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const buildIssueLaunch = (question) => {
    if (!repositoryUrl) return { url: '', omittedFields: [] };
    const params = new URLSearchParams({
      template: 'public-question-from-web.yml',
      title: `[新增题目] ${question.title}`,
    });
    const omittedFields = [];
    const included = { answer: true, followUps: true, source: true, tags: true };
    const updateDetails = () => params.set('details', contributionText(question, included));
    updateDetails();
    const toUrl = () => `${repositoryUrl}/issues/new?${params.toString()}`;
    const omit = (field, label) => {
      if (!included[field]) return;
      included[field] = false;
      omittedFields.push(label);
      updateDetails();
    };

    // GitHub 会拒绝过长的网址。只降级可选长字段，题目、分类和难度始终只从网页带入一次。
    if (toUrl().length > 6500) omit('answer', '答案');
    if (toUrl().length > 6500) omit('followUps', '追问');
    if (toUrl().length > 6500) omit('tags', '标签');
    if (toUrl().length > 6500) omit('source', '来源');

    return { url: toUrl(), omittedFields };
  };

  const filenameFor = (question) => {
    const suffix = question.id.replace(/[^A-Za-z0-9_-]/g, '-').slice(-24) || 'question';
    return `${question.date}-${suffix}.md`;
  };

  const contributionText = (question, included = {
    answer: true,
    followUps: true,
    source: true,
    tags: true,
  }) => [
    `题目：${question.title}`,
    `站内题目编号：${question.id}`,
    '可见性：公开',
    `答案状态：${question.answerStatus === 'complete' ? '已完成' : '待解答'}`,
    `分类：${question.category}`,
    `难度：${question.difficulty}`,
    included.tags ? `标签：${question.tags.join('、') || '无'}` : '',
    included.source ? `匿名来源：${question.source || '未填写'}` : '',
    included.answer ? '' : null,
    included.answer ? '参考答案 / 当前思路：' : null,
    included.answer ? (question.answer || '暂未作答') : null,
    included.followUps && question.followUps.length ? '' : null,
    included.followUps && question.followUps.length ? '追问记录（每行一条）：' : null,
    included.followUps && question.followUps.length ? question.followUps.join('\n') : null,
  ].filter((line) => line !== null && line !== '').join('\n');

  const unsafeMetadataReasons = (question) => {
    const joined = [question.title, question.source, ...question.tags]
      .join('\n')
      .replace(/<(?:unk|pad|bos|eos|mask|sep|cls)>/gi, '');
    const reasons = [];
    if (/<\/?[A-Za-z][^>]*>|<!--[\s\S]*?-->/i.test(joined)) reasons.push('原始 HTML');
    if (/{{|{%|%}|}}/.test(joined)) reasons.push('Liquid 模板标记');
    if (/!\[[^\]]*\](?:\([^)]*\)|\[[^\]]*\])/.test(joined)) reasons.push('Markdown 图片或截图');
    if (/\b(?:javascript|vbscript|data|file|blob)\s*:/i.test(joined)) reasons.push('危险链接协议');
    return reasons;
  };

  const publishSafety = (question, status) => {
    const findings = findSensitivePublicContent(
      question.title,
      question.answer,
      question.followUps,
      question.source,
      question.tags,
    );
    if (findings.length > 0) {
      status.textContent = `已阻止外发操作：检测到${findings.join('、')}。请先编辑并移除，再重试。`;
      status.focus?.();
      return false;
    }
    const mathFields = [
      ['题目', question.title],
      ['答案', question.answer],
      ...question.followUps.map((followUp, index) => [`第 ${index + 1} 条追问`, followUp]),
    ];
    for (const [label, value] of mathFields) {
      const [mathError] = validateKramdownMath(value);
      if (!mathError) continue;
      status.textContent = `已阻止外发操作：${label}：${mathError}。请先编辑补完整；本机草稿不会丢失。`;
      status.focus?.();
      return false;
    }
    const markup = [
      ...unsafeMetadataReasons(question),
      ...findUnsafeQuestionAnswer(question.answer),
      ...findUnsafeQuestionAnswer(question.followUps.join('\n')),
    ];
    const uniqueMarkup = [...new Set(markup)];
    if (uniqueMarkup.length > 0) {
      status.textContent = `已阻止外发操作：检测到${uniqueMarkup.join('、')}。技术示例可以放进 Markdown 代码块；其他内容请先移除或安全改写。`;
      return false;
    }
    return true;
  };

  const selectedVisibility = () => (
    visibilityInputs.find((input) => input.checked)?.value || 'private'
  );

  const updateVisibilityUi = (editing = Boolean(idInput.value)) => {
    const visibility = selectedVisibility();
    saveButton.textContent = editing
      ? '保存修改'
      : (visibility === 'public' ? '发布公开题目' : '添加私人题目');
  };

  const createQuestionCard = (question) => {
    const submittedIssue = publicIssuesByTitle.get(publicTitleKey(question.title));
    const card = makeElement('article', 'question-draft-card');
    card.dataset.questionId = question.id;

    const header = document.createElement('header');
    const copy = document.createElement('div');
    const meta = makeElement('div', 'question-draft-card-meta');
    meta.append(
      makeElement('span', 'tag', question.category),
      makeElement('span', `difficulty difficulty-${question.difficulty}`, question.difficulty),
      makeElement('span', 'answer-state-badge', question.answerStatus === 'complete' ? '答案已完成' : '待解答'),
      makeElement(
        'span',
        `question-visibility-badge question-visibility-${question.visibility}`,
        question.visibility === 'public'
          ? (submittedIssue ? `公开 · #${submittedIssue.number}` : '公开发布未完成 · 仅此浏览器')
          : '私人 · 仅此浏览器',
      ),
    );
    copy.append(meta, makeElement('h3', '', question.title));
    const time = makeElement('time', 'question-draft-card-time', `更新于 ${formatTime(question.updatedAt)}`);
    time.dateTime = question.updatedAt;
    header.append(copy, time);
    card.append(header);

    const answer = makeElement(
      'p',
      `question-draft-card-answer${question.answer ? '' : ' is-empty'}`,
      question.answer || '目前只有问题，答案以后再补。',
    );
    card.append(answer);

    if (question.followUps.length > 0) {
      const followUps = makeElement('div', 'question-draft-card-follow-ups');
      followUps.append(makeElement('strong', '', `追问记录 · ${question.followUps.length} 条`));
      const followUpList = document.createElement('ol');
      question.followUps.forEach((item) => followUpList.append(makeElement('li', '', item)));
      followUps.append(followUpList);
      card.append(followUps);
    }

    if (question.tags.length > 0 || question.source) {
      const tags = makeElement('div', 'question-draft-card-tags');
      question.tags.forEach((tag) => tags.append(makeElement('span', 'tag', tag)));
      if (question.source) tags.append(makeElement('span', 'tag', `来源：${question.source}`));
      card.append(tags);
    }

    const actions = makeElement('div', 'question-draft-card-actions');
    actions.append(
      button('编辑', 'edit', 'secondary-button', question.id),
      button('复制题目', 'copy-question', 'text-button', question.id),
    );
    if (question.answer || question.followUps.length > 0) {
      actions.append(button('口述练习', 'practice', 'text-button', question.id));
    }
    card.append(actions);

    const more = makeElement('details', 'question-draft-card-more');
    more.append(makeElement('summary', '', '更多操作'));
    const note = makeElement(
      'p',
      'question-draft-publish-note',
      question.visibility === 'public'
        ? (submittedIssue
          ? `这道题已经公开发布为 #${submittedIssue.number}，所有人都会在同一个题库中看到。编辑或关闭 GitHub Issue 会更新或下架公开版本。`
          : '这道题选择了公开，但还没有完成 GitHub 最终提交，因此目前只在这个浏览器显示。')
        : '这是一道私人题，也会显示在首页题库中，但只保存在当前浏览器。',
    );
    const publishActions = makeElement('div', 'question-draft-publish-actions');
    publishActions.append(
      button('只让 Codex 补答案', 'copy-answer-prompt', 'text-button', question.id),
      button('复制 Markdown', 'copy-markdown', 'text-button', question.id),
      button('下载 Markdown', 'download-markdown', 'text-button', question.id),
    );
    if (repositoryUrl && question.visibility === 'public') {
      publishActions.append(submittedIssue
        ? button(`查看或修改公开题 #${submittedIssue.number} ↗`, 'open-submitted-issue', 'secondary-button', question.id)
        : button('继续公开发布（需 GitHub 登录） ↗', 'open-issue', 'primary-button', question.id));
    }
    publishActions.append(button('删除这道本机题目', 'delete', 'text-button interview-danger-button', question.id));
    const status = makeElement('p', 'question-draft-card-status');
    status.tabIndex = -1;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    more.append(note, publishActions, status);
    card.append(more);
    return card;
  };

  function render() {
    const normalizeSearch = (value) => String(value).normalize('NFKC').toLocaleLowerCase('zh-CN');
    const keyword = normalizeSearch(searchInput.value.trim());
    const sorted = [...state.questions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const filtered = sorted.filter((question) => {
      if (!keyword) return true;
      const searchable = [
        question.title,
        question.answer,
        ...question.followUps,
        question.category,
        question.difficulty,
        question.source,
        ...question.tags,
      ].join(' ');
      return normalizeSearch(searchable).includes(keyword);
    });
    list.replaceChildren(...filtered.map(createQuestionCard));
    const complete = state.questions.filter((question) => question.answerStatus === 'complete').length;
    count.textContent = state.questions.length
      ? `${state.questions.length} 道本机题目 · ${complete} 道答案已完成`
      : '还没有本机题目';
    empty.hidden = state.questions.length !== 0;
    filterEmpty.hidden = state.questions.length === 0 || filtered.length !== 0;
  }

  const clearLegacyCategoryOptions = () => {
    categoryInput.querySelectorAll('option[data-legacy-category]').forEach((option) => option.remove());
  };

  const selectCategory = (category) => {
    const value = String(category || '').trim() || '待整理';
    clearLegacyCategoryOptions();
    if (![...categoryInput.options].some((option) => option.value === value)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = `${value}（已有草稿）`;
      option.dataset.legacyCategory = 'true';
      categoryInput.append(option);
    }
    categoryInput.value = value;
  };

  const resetForm = (focus = false) => {
    form.reset();
    idInput.value = '';
    selectCategory('待整理');
    difficultyInput.value = '待评估';
    answerStatusInput.value = 'pending';
    visibilityInputs.forEach((input) => { input.checked = input.value === 'private'; });
    modeBadge.textContent = '新题';
    formTitle.textContent = '记录一道题';
    updateVisibilityUi();
    [...form.elements].forEach((element) => {
      element.removeAttribute('aria-invalid');
      element.setCustomValidity?.('');
    });
    refreshLatexPreview();
    formDirty = false;
    if (focus) titleInput.focus();
  };

  const formValues = () => ({
    title: titleInput.value,
    answer: answerInput.value,
    followUps: followUpsInput.value,
    answerStatus: answerStatusInput.value,
    visibility: selectedVisibility(),
    category: categoryInput.value || '待整理',
    difficulty: difficultyInput.value,
    tags: tagsInput.value,
    source: sourceInput.value,
  });

  const editQuestion = (question) => {
    idInput.value = question.id;
    titleInput.value = question.title;
    answerInput.value = question.answer;
    followUpsInput.value = question.followUps.join('\n');
    answerStatusInput.value = question.answerStatus;
    visibilityInputs.forEach((input) => { input.checked = input.value === question.visibility; });
    selectCategory(question.category);
    difficultyInput.value = question.difficulty;
    tagsInput.value = question.tags.join('，');
    sourceInput.value = question.source;
    modeBadge.textContent = '编辑中';
    formTitle.textContent = '编辑本机题目';
    updateVisibilityUi(true);
    refreshLatexPreview();
    formDirty = false;
    formTitle.focus({ preventScroll: true });
    form.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const openPractice = (question) => {
    clearMath(practice);
    practice.dataset.questionId = question.id;
    practiceTitle.textContent = kramdownMathToMathJax(question.title, { forceInline: true });
    const practiceParts = [];
    if (question.answer) {
      practiceParts.push(makeElement('strong', '', '我的答案'));
      practiceParts.push(makeElement('p', '', kramdownMathToMathJax(question.answer)));
    } else {
      practiceParts.push(makeElement('p', 'is-empty', '这道题还没有填写答案。'));
    }
    if (question.followUps.length > 0) {
      practiceParts.push(makeElement('strong', '', '追问记录'));
      const followUpList = document.createElement('ol');
      question.followUps.forEach((item) => followUpList.append(makeElement(
        'li',
        '',
        kramdownMathToMathJax(item, { forceInline: true }),
      )));
      practiceParts.push(followUpList);
    }
    practiceAnswer.replaceChildren(...practiceParts);
    practiceAnswer.hidden = true;
    practiceReveal.hidden = false;
    practiceReveal.setAttribute('aria-expanded', 'false');
    practice.hidden = false;
    practiceTitle.focus({ preventScroll: true });
    practice.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const practiceMathIsValid = [question.title, question.answer, ...question.followUps]
      .every((value) => validateKramdownMath(value).length === 0);
    if (practiceMathIsValid) void renderMath(practice);
  };

  const closePractice = () => {
    const questionId = practice.dataset.questionId;
    practice.hidden = true;
    practice.dataset.questionId = '';
    list.querySelector(`[data-question-id="${CSS.escape(questionId)}"][data-action="practice"]`)?.focus();
  };

  const saveQuestion = () => {
    const visibility = selectedVisibility();
    if (storageBlocked || !form.reportValidity()) return;
    try {
      const questionId = idInput.value;
      const previousQuestion = questionId ? questionById(questionId) : null;
      const values = formValues();
      const next = questionId
        ? updateQuestionDraft(state, questionId, values, { repositoryId, now: new Date().toISOString() })
        : addQuestionDraft(state, values, {
          repositoryId,
          now: new Date().toISOString(),
          localDate: localDate(),
        });
      const savedQuestion = questionId
        ? next.questions.find((question) => question.id === questionId)
        : next.questions.at(-1);
      const savedMessage = visibility === 'public'
        ? '题目已安全保存到当前浏览器，正在准备公开发布。'
        : (questionId ? '私人题修改已保存。' : '私人题已添加到题库。');
      if (commit(next, savedMessage)) {
        const submittedIssue = publicIssuesByTitle.get(publicTitleKey(savedQuestion?.title))
          || publicIssuesByTitle.get(publicTitleKey(previousQuestion?.title));
        if (savedQuestion?.visibility === 'public') {
          if (submittedIssue) {
            const opened = window.open(submittedIssue.url, '_blank');
            if (opened) opened.opener = null;
            resetForm();
            formStatus.textContent = opened
              ? '本机修改已保存。公开版本由已打开的 GitHub 页面管理；点击 Edit 即可修改公开答案。'
              : '本机修改已保存。请在题目卡中打开 GitHub 公开版本继续修改。';
            return;
          }
          if (!publishSafety(savedQuestion, formStatus)) return;
          const launch = buildIssueLaunch(savedQuestion);
          if (!launch.url) {
            formStatus.textContent = '题目已保存，但当前站点没有连接 GitHub 仓库，暂时不能公开发布。';
            return;
          }
          const opened = window.open(launch.url, '_blank');
          if (opened) opened.opener = null;
          if (!opened) {
            formStatus.textContent = '题目已保存，但浏览器拦截了 GitHub 发布页；请从下方题目卡点击“继续公开发布”。';
            return;
          }
          resetForm();
          if (launch.omittedFields.length > 0) {
            formStatus.textContent = `已打开 GitHub 发布页。由于内容较长，${launch.omittedFields.join('、')}没有自动带入，请在提交前补上。`;
            return;
          }
          if (libraryUrl && !hasUnpersistedState) {
            const target = new URL(libraryUrl);
            target.hash = 'question-list-section';
            window.location.assign(target.toString());
          }
          return;
        }

        if (submittedIssue) {
          const opened = window.open(submittedIssue.url, '_blank');
          if (opened) opened.opener = null;
          resetForm();
          formStatus.textContent = opened
            ? '私人副本已保存，但原公开题仍然可见。请在已打开的 GitHub 页面关闭 Issue，公开版本才会下架。'
            : '私人副本已保存，但原公开题仍然可见。请从题目卡打开 GitHub 并关闭 Issue。';
          return;
        }

        resetForm();
        // 只有 localStorage 已确认写入后才离开本页；内存临时态必须留在这里供用户导出救援。
        if (libraryUrl && !hasUnpersistedState) {
          const target = new URL(libraryUrl);
          target.hash = 'question-list-section';
          window.location.assign(target.toString());
        }
      }
    } catch (error) {
      const field = error instanceof QuestionDraftDataError && error.field
        ? inputByField[error.field]
        : null;
      if (field) {
        field.setCustomValidity?.(error.message);
        field.setAttribute('aria-invalid', 'true');
        field.reportValidity?.();
        field.focus();
      }
      formStatus.textContent = error?.message || '无法保存这道题，请检查输入。';
    }
  };

  // 题目、答案和来源控件没有 name；脚本接管 submit 后只写入当前浏览器。
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveQuestion();
  });

  form.addEventListener('input', (event) => {
    formDirty = true;
    event.target.removeAttribute?.('aria-invalid');
    event.target.setCustomValidity?.('');
    if (event.target === answerInput) refreshLatexPreview();
  });

  latexInlineButton.addEventListener('click', () => insertLatex('inline'));
  latexDisplayButton.addEventListener('click', () => insertLatex('display'));

  visibilityInputs.forEach((input) => {
    input.addEventListener('change', () => updateVisibilityUi());
  });

  resetButton.addEventListener('click', () => {
    if (formDirty && !window.confirm('清空当前表单？尚未保存的文字会丢失。')) return;
    resetForm(true);
    formStatus.textContent = '';
  });

  searchInput.addEventListener('input', render);

  list.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-action][data-question-id]');
    if (!trigger || !list.contains(trigger)) return;
    const question = questionById(trigger.dataset.questionId);
    if (!question) return;
    const status = trigger.closest('.question-draft-card')?.querySelector('.question-draft-card-status');
    const action = trigger.dataset.action;

    if (action === 'edit') {
      if (formDirty && !window.confirm('切换到另一道题？当前表单中尚未保存的文字会被覆盖。')) return;
      editQuestion(question);
      return;
    }
    if (action === 'practice') {
      openPractice(question);
      return;
    }
    if (action === 'delete') {
      const unsaved = formDirty && idInput.value === question.id
        ? ' 当前正在编辑的尚未保存文字也会丢失。'
        : '';
      if (!window.confirm(`删除本机题目“${question.title}”？此操作无法撤销。${unsaved}`)) return;
      const next = deleteQuestionDraft(state, question.id, { repositoryId, now: new Date().toISOString() });
      if (commit(next, '这道题已从当前浏览器删除。') && idInput.value === question.id) resetForm();
      return;
    }
    if (action === 'open-submitted-issue') {
      const submittedIssue = publicIssuesByTitle.get(publicTitleKey(question.title));
      if (!submittedIssue) {
        status.textContent = '暂时没有读取到对应公开题，请稍后重试或刷新页面。';
        void loadPublicIssueMatches();
        return;
      }
      const opened = window.open(submittedIssue.url, '_blank');
      if (opened) opened.opener = null;
      status.textContent = opened
        ? `已打开公开题 #${submittedIssue.number}；可以在 GitHub 中编辑答案或关闭下架。`
        : '浏览器拦截了新窗口；请允许本站打开新标签页后重试。';
      return;
    }
    if (action === 'open-issue') {
      if (!publishSafety(question, status)) {
        return;
      }
      const launch = buildIssueLaunch(question);
      const opened = window.open(launch.url, '_blank');
      if (opened) opened.opener = null;
      status.textContent = opened
        ? (launch.omittedFields.length
          ? `${launch.omittedFields.join('、')}没有自动带入，请复制公开内容并在 GitHub 补齐；当前尚未提交。`
          : '已打开 GitHub 最终确认页；点击提交后会直接进入题库，不需要审核。')
        : '浏览器拦截了新窗口；请允许本站打开新标签页后重试。';
      return;
    }

    try {
      const outboundActions = new Set([
        'copy-answer-prompt',
        'copy-markdown',
        'download-markdown',
      ]);
      if (outboundActions.has(action) && !publishSafety(question, status)) return;
      if (action === 'copy-question') await copyText(question.title);
      if (action === 'copy-answer-prompt') await copyText(buildQuestionAnswerPrompt(question));
      if (action === 'copy-markdown') await copyText(buildQuestionMarkdown(question));
      if (action === 'download-markdown') {
        downloadText(filenameFor(question), buildQuestionMarkdown(question), 'text/markdown;charset=utf-8');
      }
      const messages = {
        'copy-question': '题目已复制。',
        'copy-answer-prompt': '补答指令已复制；生成结果需要你检查后再粘贴回来。',
        'copy-markdown': 'Markdown 已复制；它还没有上传或发布。',
        'download-markdown': 'Markdown 文件已下载；它还没有上传或发布。',
      };
      status.textContent = messages[action] || '操作已完成。';
    } catch (error) {
      status.textContent = error?.message || '操作失败，请重试。';
    }
  });

  practiceReveal.addEventListener('click', () => {
    practiceAnswer.hidden = false;
    practiceReveal.hidden = true;
    practiceReveal.setAttribute('aria-expanded', 'true');
    practiceAnswer.focus?.();
  });
  practiceClose.addEventListener('click', closePractice);

  exportButton.addEventListener('click', () => {
    downloadText(
      `大模型面经-本机题目-${localDate()}.json`,
      exportQuestionDraftsJson(state),
      'application/json;charset=utf-8',
    );
    formStatus.textContent = '全部本机题目已导出为未加密 JSON，请妥善保存。';
  });

  importButton.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const [file] = importFile.files;
    importFile.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAlert('题目没有恢复', '文件超过 5 MB。请选择本页面导出的 JSON 备份。');
      return;
    }
    try {
      const report = importQuestionDraftsJson(state, await file.text(), {
        repositoryId,
        allowCrossRepository: true,
        now: new Date().toISOString(),
      });
      const sourceText = report.sourceRepositoryId && report.sourceRepositoryId !== repositoryId
        ? `备份来自 ${report.sourceRepositoryId}，恢复后会归入当前题库。`
        : '备份来自当前题库。';
      const conflictText = report.conflicts.length
        ? `有 ${report.conflicts.length} 道冲突题将保留本机现有版本。`
        : '没有内容冲突。';
      const formWarning = formDirty ? ' 当前表单中尚未保存的文字会被清空。' : '';
      if (!window.confirm(`${sourceText} 将新增 ${report.added} 道题；${conflictText}${formWarning} 确认恢复吗？`)) return;
      if (commit(report.data, `已恢复 ${report.added} 道题；${report.conflicts.length} 道冲突题保留了本机版本。`)) {
        resetForm();
      }
    } catch (error) {
      setAlert('题目没有恢复', error?.message || '文件格式无效，请选择本页面导出的 JSON 备份。');
    }
  });

  clearAllButton.addEventListener('click', () => {
    const formWarning = formDirty ? ' 当前表单中尚未保存的文字也会被清空。' : '';
    if (!window.confirm(`彻底删除当前浏览器中的 ${state.questions.length} 道本机题目？建议先导出 JSON。此操作无法撤销。${formWarning}`)) return;
    const next = {
      ...createEmptyQuestionDrafts(repositoryId),
      revision: state.revision + 1,
    };
    if (commit(next, '当前浏览器中的本机题目已全部删除。', { requirePersistence: true })) resetForm();
  });

  downloadRawButton.addEventListener('click', () => {
    if (!damagedRaw) return;
    downloadText(`本机题目-无法读取的原始数据-${localDate()}.txt`, damagedRaw, 'text/plain;charset=utf-8');
  });

  clearDamagedButton.addEventListener('click', () => {
    if (!window.confirm('确认已经下载需要保留的原始数据，并重置这份损坏的本机题目吗？此操作无法撤销。')) return;
    try { storage?.removeItem(storageKey); } catch (error) {
      setAlert('无法重置本机题目', error?.message || '浏览器拒绝了删除操作。', { damaged: true });
      return;
    }
    storageBlocked = false;
    damagedRaw = '';
    persistedRaw = '';
    hasUnpersistedState = false;
    state = createEmptyQuestionDrafts(repositoryId);
    setWriteControls(false);
    clearAlert();
    resetForm();
    render();
    formStatus.textContent = '损坏的本机数据已重置，现在可以重新记题或恢复 JSON。';
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey) return;
    try {
      const incoming = event.newValue
        ? parseQuestionDraftsJson(event.newValue, { repositoryId })
        : createEmptyQuestionDrafts(repositoryId);
      if (formDirty || idInput.value || hasUnpersistedState) {
        setAlert('另一个标签页已经更新本机题目', '当前页面有尚未持久保存的内容，因此没有自动刷新。请先导出 JSON 或复制需要保留的文字；下次保存会再次检查并阻止覆盖。');
        return;
      }
      state = incoming;
      persistedRaw = event.newValue || '';
      hasUnpersistedState = false;
      storageBlocked = false;
      setWriteControls(false);
      clearAlert();
      practice.hidden = true;
      practice.dataset.questionId = '';
      render();
      formStatus.textContent = '已同步另一个标签页中的最新本机题目。';
    } catch (error) {
      storageBlocked = true;
      damagedRaw = event.newValue || '';
      setWriteControls(true);
      setAlert('另一个标签页写入了无法读取的数据', `${error?.message || '数据格式无效。'} 为避免覆盖，编辑已经暂停。`, { damaged: true });
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!formDirty && !hasUnpersistedState) return;
    event.preventDefault();
    event.returnValue = '';
  });

  let publicIssueRetryTimer = 0;
  window.addEventListener('focus', () => {
    void loadPublicIssueMatches();
    window.clearTimeout(publicIssueRetryTimer);
    publicIssueRetryTimer = window.setTimeout(() => { void loadPublicIssueMatches(); }, 12_000);
  });

  readInitialState();
  resetForm();
  render();
  const requestedEditId = new URL(window.location.href).searchParams.get('edit');
  if (requestedEditId) {
    const requestedQuestion = questionById(requestedEditId);
    if (requestedQuestion) {
      editQuestion(requestedQuestion);
    } else {
      formStatus.textContent = '没有在当前浏览器找到这道本机题目；它可能位于另一台设备、另一个浏览器或另一个题库副本中。';
    }
  }
  void loadPublicIssueMatches();
}
