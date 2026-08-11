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
  buildPublicQuestionApiUrl,
  buildPublicQuestionDetailUrl,
  buildPublicQuestionsCollectionApiUrl,
  buildQuestionsConfigApiUrl,
  normalizePublicQuestionResponse,
  PUBLIC_QUESTIONS_TIMEOUT_MS,
  readQuestionsApiError,
} from './question-collaboration-core.mjs';
import { groupFollowUpsForDisplay } from './follow-up-display-core.mjs';
import {
  createQuestionPublicationTokens,
  completePendingQuestionPublication,
  generateQuestionPublicationToken,
  getRecoverableQuestionPublicationToken,
  getPendingQuestionPublication,
  parseQuestionPublicationTokens,
  questionPublicationTokensStorageKey,
  removePendingQuestionPublication,
  removeQuestionPublicationToken,
  serializeQuestionPublicationTokens,
  setPendingQuestionPublication,
} from './question-publication-tokens.mjs';
import {
  insertLatexTemplate,
  kramdownMathToMathJax,
  parseKramdownMath,
  validateKramdownMath,
  validatePlainTextMath,
} from './latex-input-core.mjs';
import { clearMath, renderMath } from './math-render.mjs';

const root = document.querySelector('[data-question-capture]');

if (root) {
  const repositoryId = root.dataset.repositoryId;
  const storageKey = questionDraftsStorageKey(repositoryId);
  const publicationTokensKey = questionPublicationTokensStorageKey(repositoryId);
  const questionsApiUrl = root.dataset.questionsApiUrl || '';
  const questionDetailUrl = root.dataset.questionDetailUrl || '/shared-question/';
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
  const publicChallenge = root.querySelector('#question-public-challenge');
  const publicChallengeStatus = root.querySelector('#question-public-challenge-status');
  const publicChallengeWidget = root.querySelector('#question-public-challenge-widget');
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
  let publicationTokensBlocked = false;
  let damagedRaw = '';
  let persistedRaw = '';
  let persistedPublicationTokensRaw = '';
  let hasUnpersistedState = false;
  let formDirty = false;
  let state = createEmptyQuestionDrafts(repositoryId);
  let publicationTokens = createQuestionPublicationTokens(repositoryId);
  let questionsApiConfigPromise = null;
  let questionsApiConfig = null;
  let turnstileScriptPromise = null;
  let turnstileWidgetId = null;
  let turnstileToken = '';
  let pendingPublicAction = null;
  let latexPreviewTimer = 0;
  let latexPreviewRevision = 0;
  let latexPreviewRenderQueue = Promise.resolve();

  const makeElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const makeFollowUpItem = ({ question, answer: followUpAnswer }, transform = (value) => value) => {
    const item = document.createElement('li');
    item.append(makeElement('strong', '', transform(question)));
    if (followUpAnswer) {
      item.append(document.createTextNode(` ${transform(followUpAnswer)}`));
    }
    return item;
  };

  const publicQuestionDetailUrl = (questionId) => buildPublicQuestionDetailUrl(
    questionDetailUrl,
    questionId,
    window.location.href,
  );

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
          setLatexStatus(`${errors[0]}。私人题仍可保存；公开题请补完整后再发布。`, 'error');
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
    if (storageBlocked || publicationTokensBlocked) return;
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
      try {
        persistedPublicationTokensRaw = storage.getItem(publicationTokensKey) || '';
        publicationTokens = parseQuestionPublicationTokens(
          persistedPublicationTokensRaw,
          { repositoryId },
        );
      } catch {
        publicationTokensBlocked = true;
        publicationTokens = createQuestionPublicationTokens(repositoryId);
        setAlert('公开题编辑凭证无法读取', '私人题仍可正常使用，但为避免覆盖原凭证，公开题的发布、修改和删除已暂停。请先导出题目备份，再清理当前站点的损坏存储。');
      }
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
      : '修改目前只暂存在这个页面，尚未持久保存，也没有同步到共享题库；刷新前请立即导出 JSON。';
    return true;
  };

  const questionById = (id) => state.questions.find((question) => question.id === id);

  const requestJson = async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PUBLIC_QUESTIONS_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...options,
        headers: { Accept: 'application/json', ...(options.headers || {}) },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(await readQuestionsApiError(response, `共享题库请求失败（${response.status}）`));
      }
      return await response.json();
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const loadQuestionsApiConfig = async () => {
    if (questionsApiConfig) return questionsApiConfig;
    if (!questionsApiUrl) throw new Error('当前站点尚未配置共享公开题服务。');
    if (questionsApiConfigPromise) return questionsApiConfigPromise;
    questionsApiConfigPromise = requestJson(buildQuestionsConfigApiUrl(questionsApiUrl))
      .then((payload) => {
        questionsApiConfig = {
          writeEnabled: payload?.questionsWriteEnabled === true || payload?.writeEnabled === true,
          turnstileSiteKey: String(payload?.turnstileSiteKey || '').trim(),
        };
        return questionsApiConfig;
      })
      .finally(() => { questionsApiConfigPromise = null; });
    return questionsApiConfigPromise;
  };

  const loadTurnstileScript = () => {
    if (window.turnstile?.render) return Promise.resolve(window.turnstile);
    if (turnstileScriptPromise) return turnstileScriptPromise;
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', () => {
        if (window.turnstile?.render) resolve(window.turnstile);
        else reject(new Error('安全验证组件没有正确加载。'));
      }, { once: true });
      script.addEventListener('error', () => reject(new Error('安全验证组件加载失败。')), { once: true });
      document.head.append(script);
    }).catch((error) => {
      turnstileScriptPromise = null;
      throw error;
    });
    return turnstileScriptPromise;
  };

  const resetTurnstile = () => {
    turnstileToken = '';
    if (turnstileWidgetId !== null && window.turnstile?.reset) {
      window.turnstile.reset(turnstileWidgetId);
    }
  };

  const preparePublicChallenge = async () => {
    const config = await loadQuestionsApiConfig();
    if (!config.writeEnabled || !config.turnstileSiteKey) {
      throw new Error('共享公开题服务暂时不接受发布，请稍后重试。');
    }
    publicChallenge.hidden = false;
    publicChallengeStatus.textContent = turnstileToken ? '验证已完成，可以直接发布。' : '正在完成防滥用验证…';
    const turnstile = await loadTurnstileScript();
    if (turnstileWidgetId === null) {
      turnstileWidgetId = turnstile.render(publicChallengeWidget, {
        sitekey: config.turnstileSiteKey,
        action: 'public-question',
        appearance: 'interaction-only',
        callback: (token) => {
          turnstileToken = String(token || '');
          publicChallengeStatus.textContent = '验证已完成，正在发布…';
          const action = pendingPublicAction;
          pendingPublicAction = null;
          if (action) void action(turnstileToken);
        },
        'expired-callback': () => {
          turnstileToken = '';
          publicChallengeStatus.textContent = '验证已过期，请重新完成验证。';
        },
        'error-callback': () => {
          turnstileToken = '';
          publicChallengeStatus.textContent = '安全验证暂时失败，请稍后重试。';
        },
      });
    }
    return turnstileToken;
  };

  const withPublicChallenge = async (action) => {
    const token = await preparePublicChallenge();
    if (token) return action(token);
    pendingPublicAction = action;
    formStatus.textContent = '题目已保存在当前浏览器；完成上方安全验证后会自动公开。';
    return undefined;
  };

  const persistPublicationTokens = (next) => {
    if (publicationTokensBlocked || !storageAvailable || !storage) {
      throw new Error('当前浏览器无法保存公开题编辑凭证。');
    }
    const serialized = serializeQuestionPublicationTokens(next, { repositoryId });
    const currentRaw = storage.getItem(publicationTokensKey) || '';
    if (currentRaw !== persistedPublicationTokensRaw) {
      publicationTokensBlocked = true;
      setAlert('另一个标签页已经更新公开题编辑凭证', '为避免覆盖，当前页面没有写入凭证，也不会修改或删除共享题库中的题目。请刷新后重试。');
      throw new Error('检测到另一个标签页更新了公开题编辑凭证，请刷新后重试。');
    }
    storage.setItem(publicationTokensKey, serialized);
    persistedPublicationTokensRaw = serialized;
    publicationTokens = next;
  };

  const publicationTokenFor = (question) => getRecoverableQuestionPublicationToken(
    publicationTokens,
    { remoteId: question.remoteId, localId: question.id },
  );

  const assertRemoteMutationStateCurrent = () => {
    if (storageBlocked || publicationTokensBlocked || !storageAvailable || !storage || hasUnpersistedState) {
      throw new Error('当前页面没有可核对的完整本机状态，请恢复本地存储后重试。');
    }
    let currentRaw;
    let currentPublicationTokensRaw;
    try {
      currentRaw = storage.getItem(storageKey) || '';
      currentPublicationTokensRaw = storage.getItem(publicationTokensKey) || '';
    } catch {
      throw new Error('浏览器无法核对最新本机状态，因此没有向共享题库发送请求。');
    }
    if (currentRaw !== persistedRaw) {
      setAlert('另一个标签页已经更新本机题目', '当前页面没有覆盖另一页，也没有修改或删除共享题库中的题目。请刷新后检查最新内容。');
      throw new Error('检测到另一个标签页更新了本机题目，请刷新后重试。');
    }
    if (currentPublicationTokensRaw !== persistedPublicationTokensRaw) {
      publicationTokensBlocked = true;
      setAlert('另一个标签页已经更新公开题编辑凭证', '当前页面没有覆盖凭证，也没有修改或删除共享题库中的题目。请刷新后重试。');
      throw new Error('检测到另一个标签页更新了公开题编辑凭证，请刷新后重试。');
    }
  };

  const rememberPendingPublication = (localId, publication) => {
    persistPublicationTokens(setPendingQuestionPublication(publicationTokens, localId, publication));
  };

  const completePendingPublication = (localId, remoteId, token) => {
    persistPublicationTokens(completePendingQuestionPublication(
      publicationTokens,
      localId,
      remoteId,
      token,
    ));
  };

  const forgetPublicationCredentials = (question) => {
    const withoutRemoteToken = removeQuestionPublicationToken(
      publicationTokens,
      question.remoteId,
    );
    persistPublicationTokens(removePendingQuestionPublication(withoutRemoteToken, question.id));
  };

  const formatTime = (value) => new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const filenameFor = (question) => {
    const suffix = question.id.replace(/[^A-Za-z0-9_-]/g, '-').slice(-24) || 'question';
    return `${question.date}-${suffix}.md`;
  };

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
      const [mathError] = validatePlainTextMath(value);
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
        question.visibility === 'public' && !question.remoteId
          ? 'question-visibility-badge question-publication-incomplete'
          : `question-visibility-badge question-visibility-${question.visibility}`,
        question.visibility === 'public'
          ? (question.remoteId ? '公开' : '公开失败 · 仅此浏览器')
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

    const followUpGroups = groupFollowUpsForDisplay(question.followUps);
    if (followUpGroups.length > 0) {
      const followUps = makeElement('div', 'question-draft-card-follow-ups');
      followUps.append(makeElement('strong', '', `常见追问 · ${followUpGroups.length} 条`));
      const followUpList = document.createElement('ol');
      followUpList.append(...followUpGroups.map((item) => makeFollowUpItem(item)));
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
    if (question.remoteId) {
      const viewPublicPage = makeElement('a', 'text-link', '查看公开页面 ↗');
      viewPublicPage.href = publicQuestionDetailUrl(question.remoteId);
      actions.append(viewPublicPage);
    }
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
        ? (question.remoteId
          ? '这道题已在共享题库中；编辑并保存后会立即更新。'
          : '公开失败。这道题目前只在这个浏览器中，可以重新发布。')
        : '这是一道私人题，也会显示在首页题库中，但只保存在当前浏览器。',
    );
    const publishActions = makeElement('div', 'question-draft-publish-actions');
    publishActions.append(
      button('只让 Codex 补答案', 'copy-answer-prompt', 'text-button', question.id),
      button('复制 Markdown', 'copy-markdown', 'text-button', question.id),
      button('下载 Markdown', 'download-markdown', 'text-button', question.id),
    );
    if (question.visibility === 'public' && !question.remoteId) {
      publishActions.append(button('重新发布', 'retry-public', 'primary-button', question.id));
    }
    const deleteLabel = question.remoteId
      ? '从公开题库撤回并删除'
      : (question.visibility === 'public' ? '删除这道未发布题目' : '删除这道私人题');
    publishActions.append(button(deleteLabel, 'delete', 'text-button interview-danger-button', question.id));
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
    pendingPublicAction = null;
    publicChallenge.hidden = true;
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
    const followUpGroups = groupFollowUpsForDisplay(question.followUps);
    if (followUpGroups.length > 0) {
      practiceParts.push(makeElement('strong', '', '常见追问'));
      const followUpList = document.createElement('ol');
      followUpList.append(...followUpGroups.map((item) => makeFollowUpItem(
        item,
        (value) => kramdownMathToMathJax(value, { forceInline: true }),
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
      .every((value) => validatePlainTextMath(value).length === 0);
    if (practiceMathIsValid) void renderMath(practice);
  };

  const closePractice = () => {
    const questionId = practice.dataset.questionId;
    practice.hidden = true;
    practice.dataset.questionId = '';
    list.querySelector(`[data-question-id="${CSS.escape(questionId)}"][data-action="practice"]`)?.focus();
  };

  const publicQuestionPayload = (question) => ({
    title: question.title,
    category: question.category,
    difficulty: question.difficulty,
    answerStatus: question.answerStatus,
    answer: question.answer,
    followUps: question.followUps,
    tags: question.tags,
    source: question.source,
    localId: question.id,
  });

  const redirectToLibrary = () => {
    if (!libraryUrl || hasUnpersistedState) return;
    const target = new URL(libraryUrl);
    target.hash = 'question-list-section';
    window.location.assign(target.toString());
  };

  const setPublishing = (active) => {
    saveButton.disabled = active;
    saveButton.setAttribute('aria-busy', String(active));
  };

  const postPublicQuestion = async (question, status = formStatus) => {
    if (!publishSafety(question, status)) return;
    if (publicationTokensBlocked || !storageAvailable || hasUnpersistedState) {
      status.textContent = '题目已留在当前页面，但浏览器无法安全保存公开题编辑凭证，因此没有发布。请先恢复本地存储后重试。';
      return;
    }
    if (!questionsApiUrl) {
      status.textContent = '题目已保存在当前浏览器，但站点尚未配置共享公开题服务，因此目前没有对其他人发布。';
      return;
    }

    let pending = getPendingQuestionPublication(publicationTokens, question.id);

    const submit = async (securityToken) => {
      setPublishing(true);
      status.textContent = '正在发布到公开题库…';
      try {
        if (!pending) {
          pending = {
            requestId: crypto.randomUUID(),
            editToken: generateQuestionPublicationToken(),
          };
          rememberPendingPublication(question.id, pending);
        }
        assertRemoteMutationStateCurrent();
        const payload = await requestJson(buildPublicQuestionsCollectionApiUrl(questionsApiUrl), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...publicQuestionPayload(question),
            requestId: pending.requestId,
            editToken: pending.editToken,
            turnstileToken: securityToken,
            website: '',
          }),
        });
        const published = normalizePublicQuestionResponse(payload);
        if (!published) throw new Error('共享题库返回了无法识别的题目数据。');
        const linked = updateQuestionDraft(state, question.id, { remoteId: published.id }, {
          repositoryId,
          now: new Date().toISOString(),
        });
        if (!commit(linked, '公开题已发布，所有人现在都能在题库中看到。', {
          requirePersistence: true,
        })) {
          throw new Error('题目已经公开，但本机没有保存远端编号；发布恢复记录仍在，请刷新后用同一道题重试。');
        }
        try {
          completePendingPublication(question.id, published.id, pending.editToken);
        } catch {
          status.textContent = '题目已经公开；编辑凭证仍以本机发布恢复记录保留，刷新后仍可继续管理。';
        }
        pendingPublicAction = null;
        publicChallenge.hidden = true;
        resetForm();
        redirectToLibrary();
      } catch (error) {
        status.textContent = `公开发布失败：${error?.message || '共享题库暂时不可用'}。题目仍在当前浏览器，可以重新发布。`;
      } finally {
        resetTurnstile();
        setPublishing(false);
      }
    };

    try {
      await withPublicChallenge(submit);
    } catch (error) {
      status.textContent = `题目仍保存在当前浏览器，但尚未公开：${error?.message || '安全验证暂时不可用'}。`;
    }
  };

  const patchPublicQuestion = async (question, next) => {
    assertRemoteMutationStateCurrent();
    const token = publicationTokenFor(question);
    if (!token) throw new Error('当前浏览器没有这道公开题的编辑凭证，不能覆盖线上版本。');
    setPublishing(true);
    try {
      await requestJson(buildPublicQuestionApiUrl(questionsApiUrl, question.remoteId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...publicQuestionPayload(question), editToken: token }),
      });
      if (!commit(next, '公开题修改已同步，题库刷新后即可看到。')) return;
      resetForm();
      redirectToLibrary();
    } finally {
      setPublishing(false);
    }
  };

  const deletePublicQuestion = async (question) => {
    assertRemoteMutationStateCurrent();
    const token = publicationTokenFor(question);
    if (!token) throw new Error('当前浏览器没有这道公开题的删除凭证。');
    await requestJson(buildPublicQuestionApiUrl(questionsApiUrl, question.remoteId), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editToken: token }),
    });
    forgetPublicationCredentials(question);
  };

  const handleSaveError = (error, fallback = '无法保存这道题，请检查输入。') => {
    const field = error instanceof QuestionDraftDataError && error.field
      ? inputByField[error.field]
      : null;
    if (field) {
      field.setCustomValidity?.(error.message);
      field.setAttribute('aria-invalid', 'true');
      field.reportValidity?.();
      field.focus();
    }
    formStatus.textContent = error?.message || fallback;
  };

  const saveQuestion = async () => {
    const visibility = selectedVisibility();
    if (storageBlocked || !form.reportValidity()) return;
    try {
      const questionId = idInput.value;
      const previousQuestion = questionId ? questionById(questionId) : null;
      const values = formValues();
      const now = new Date().toISOString();
      const next = questionId
        ? updateQuestionDraft(state, questionId, {
          ...values,
          remoteId: previousQuestion?.remoteId && visibility === 'private'
            ? ''
            : previousQuestion?.remoteId,
        }, { repositoryId, now })
        : addQuestionDraft(state, values, {
          repositoryId,
          now,
          localDate: localDate(),
        });
      const savedQuestion = questionId
        ? next.questions.find((question) => question.id === questionId)
        : next.questions.at(-1);

      if (previousQuestion?.remoteId && visibility === 'public') {
        if (!publishSafety(savedQuestion, formStatus)) return;
        try {
          await patchPublicQuestion(savedQuestion, next);
        } catch (error) {
          formStatus.textContent = `公开题修改失败，公开版本没有改变；当前表单内容仍保留：${error?.message || '共享题库暂时不可用'}。`;
        }
        return;
      }

      if (previousQuestion?.remoteId && visibility === 'private') {
        setPublishing(true);
        try {
          await deletePublicQuestion(previousQuestion);
          if (!commit(next, '题目已改为私人，并从共享题库下架。')) return;
          resetForm();
          redirectToLibrary();
        } catch (error) {
          formStatus.textContent = `没有改为私人，公开版本仍然可见：${error?.message || '共享题库暂时不可用'}。`;
        } finally {
          setPublishing(false);
        }
        return;
      }

      const savedMessage = visibility === 'public'
        ? '题目已保存在当前浏览器，正在发布到公开题库。'
        : (questionId ? '私人题修改已保存。' : '私人题已添加到题库。');
      if (!commit(next, savedMessage)) return;
      if (savedQuestion?.visibility === 'public') {
        await postPublicQuestion(savedQuestion, formStatus);
        return;
      }

      resetForm();
      redirectToLibrary();
    } catch (error) {
      handleSaveError(error);
    }
  };

  // 题目、答案和来源控件没有 name；脚本接管 submit 后按可见性保存或调用共享服务。
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void saveQuestion();
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
    input.addEventListener('change', () => {
      updateVisibilityUi();
      if (selectedVisibility() === 'public') {
        void preparePublicChallenge().catch((error) => {
          publicChallenge.hidden = false;
          publicChallengeStatus.textContent = error?.message || '公开发布安全验证暂时不可用。';
        });
      } else {
        pendingPublicAction = null;
        publicChallenge.hidden = true;
      }
    });
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
      const scope = question.remoteId ? '这会从公开题库撤回，并删除当前浏览器中的副本。' : '此操作无法撤销。';
      if (!window.confirm(`删除题目“${question.title}”？${scope}${unsaved}`)) return;
      try {
        if (question.remoteId) await deletePublicQuestion(question);
        const next = deleteQuestionDraft(state, question.id, { repositoryId, now: new Date().toISOString() });
        const message = question.remoteId
          ? '这道题已从公开题库撤回，并从当前浏览器删除。'
          : '这道题已从当前浏览器删除。';
        if (commit(next, message) && idInput.value === question.id) resetForm();
      } catch (error) {
        status.textContent = `没有删除：${error?.message || '共享题库暂时不可用'}。`;
      }
      return;
    }
    if (action === 'retry-public') {
      await postPublicQuestion(question, status);
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
    const sharedCount = state.questions.filter((question) => question.remoteId).length;
    const uncertainCount = state.questions.filter((question) => (
      getPendingQuestionPublication(publicationTokens, question.id)
    )).length;
    if (sharedCount || uncertainCount) {
      formStatus.textContent = `为避免公开题遗留，不能批量清空：请先逐题删除 ${sharedCount} 道已公开题${uncertainCount ? `，并重试确认 ${uncertainCount} 道结果不确定的发布` : ''}。`;
      return;
    }
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
    if (event.key === publicationTokensKey) {
      try {
        const incomingRaw = event.newValue || '';
        publicationTokens = parseQuestionPublicationTokens(incomingRaw, { repositoryId });
        persistedPublicationTokensRaw = incomingRaw;
        publicationTokensBlocked = false;
      } catch {
        publicationTokensBlocked = true;
        setAlert('另一个标签页写入了无法读取的公开题编辑凭证', '为避免覆盖，公开题的发布、修改和删除已暂停；私人题不受影响。');
      }
      return;
    }
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
}
