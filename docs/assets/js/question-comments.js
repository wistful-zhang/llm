import {
  COMMENT_LIMITS,
  buildCommentActionUrl,
  buildCommentsUrl,
  buildConfigUrl,
  createClientSecret,
  createRequestId,
  isEditToken,
  normalizeComment,
  normalizeCommentsConfig,
  normalizeCommentsPage,
  validateApiUrl,
  validateCommentDraft,
  validateQuestionSlug,
} from './native-comments-core.mjs';

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const REQUEST_TIMEOUT_MS = 10000;
const MAX_SAVED_EDIT_TOKENS = 1000;
let turnstileLoader = null;

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileLoader) return turnstileLoader;
  turnstileLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    const script = existing || document.createElement('script');
    const handleReady = () => {
      if (window.turnstile) resolve(window.turnstile);
      else {
        script.remove();
        reject(new Error('Turnstile 未正确加载'));
      }
    };
    script.addEventListener('load', handleReady, { once: true });
    script.addEventListener('error', () => {
      script.remove();
      reject(new Error('Turnstile 加载失败'));
    }, { once: true });
    if (!existing) {
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.head.append(script);
    }
  }).catch((error) => {
    turnstileLoader = null;
    throw error;
  });
  return turnstileLoader;
};

const requestJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || '';
      const error = new Error(message || `评论服务返回 ${response.status}`);
      error.status = response.status;
      error.code = payload?.error?.code || payload?.code || '';
      throw error;
    }
    return payload;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const readableError = (error, fallback) => {
  if (error?.name === 'AbortError') return '请求超时，请检查网络后重试。';
  if (error?.status === 429) return '留言有点频繁，请稍后再试。';
  if (error?.code === 'turnstile_failed') return '人机验证已过期，请完成新的验证后重试。';
  if (error?.code === 'thread_locked') return '这道题的评论已由管理员暂时关闭。';
  if (error?.code === 'edit_denied') return '本机修改凭据不正确，或这条评论已经被管理员处理。';
  if (error?.code === 'delete_denied') return '本机删除凭据不正确，或这条评论已经删除。';
  if (error?.code === 'question_not_published') return '这道题已经下线或尚未公开，暂时不能继续评论。';
  return error?.message || fallback;
};

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '时间未知' : dateFormatter.format(date);
};

const storageFor = (apiUrl) => {
  const key = `llm-interview-native-comments:v1:${encodeURIComponent(apiUrl)}`;
  const empty = { nickname: '', tokens: {} };
  const read = () => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || 'null');
      if (!parsed || typeof parsed !== 'object') return empty;
      const nickname = String(parsed.nickname || '').slice(0, COMMENT_LIMITS.nicknameMax);
      const entries = Object.entries(parsed.tokens || {})
        .filter(([id, token]) => /^[0-9a-f-]{36}$/i.test(id) && isEditToken(token))
        .slice(-MAX_SAVED_EDIT_TOKENS);
      return { nickname, tokens: Object.fromEntries(entries) };
    } catch {
      return empty;
    }
  };
  const write = (value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Losing the local edit token must not make a successfully published comment look failed.
    }
  };
  return { read, write };
};

const createButton = (label, className, handler, ariaLabel = '') => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
  button.addEventListener('click', handler);
  return button;
};

const initializedRoots = new WeakSet();

const initializeQuestionComments = (root) => {
  if (!root || initializedRoots.has(root)) return;
  const api = validateApiUrl(root.dataset.commentsApi || '', window.location.href);
  const questionSlug = validateQuestionSlug(root.dataset.questionSlug || '');
  const form = root.querySelector('[data-comment-form]');
  const nicknameInput = root.querySelector('[data-comment-nickname]');
  const bodyInput = root.querySelector('[data-comment-body]');
  const honeypotInput = root.querySelector('[data-comment-website]');
  const counter = root.querySelector('[data-comment-counter]');
  const submitButton = root.querySelector('[data-comment-submit]');
  const cancelButton = root.querySelector('[data-comment-cancel]');
  const replyContext = root.querySelector('[data-comment-reply-context]');
  const formStatus = root.querySelector('[data-comment-form-status]');
  const configRetryButton = root.querySelector('[data-comment-config-retry]');
  const turnstileRoot = root.querySelector('[data-comment-turnstile]');
  const listRegion = root.querySelector('[data-comment-list-region]');
  const list = root.querySelector('[data-comment-list]');
  const listStatus = root.querySelector('[data-comment-list-status]');
  const emptyState = root.querySelector('[data-comment-empty]');
  const loadError = root.querySelector('[data-comment-load-error]');
  const retryButton = root.querySelector('[data-comment-retry]');
  const loadMoreButton = root.querySelector('[data-comment-load-more]');
  const count = root.querySelector('[data-comment-count]');
  const jump = document.querySelector('[data-question-comments-jump]');

  if (!api || !questionSlug || !form || !nicknameInput || !bodyInput || !submitButton
    || !listRegion || !list || !listStatus || !emptyState || !loadError || !retryButton
    || !loadMoreButton || !counter || !formStatus || !configRetryButton || !turnstileRoot
    || !replyContext) return;
  initializedRoots.add(root);

  const apiRoot = api.href.replace(/\/+$/, '');
  const storage = storageFor(apiRoot);
  const saved = storage.read();
  const comments = new Map();
  const state = {
    cursor: 0,
    nextCursor: null,
    loading: false,
    locked: false,
    writeEnabled: false,
    captchaToken: '',
    turnstile: null,
    widgetId: null,
    captchaBusy: false,
    configBusy: false,
    replyTo: null,
    editing: null,
    pendingCreate: null,
    pendingReport: null,
    rootDraft: '',
    saved,
  };
  nicknameInput.value = saved.nickname;

  const setFormStatus = (message, kind = '') => {
    formStatus.textContent = message;
    formStatus.dataset.state = kind;
  };

  const updateCounter = () => {
    counter.textContent = `${bodyInput.value.length} / ${COMMENT_LIMITS.bodyMax}`;
  };

  const updateComposer = () => {
    if (state.editing) {
      replyContext.hidden = false;
      replyContext.textContent = `正在修改 ${state.editing.floor} 楼的评论`;
      submitButton.textContent = '保存修改';
      nicknameInput.disabled = true;
      bodyInput.disabled = false;
      submitButton.disabled = false;
      if (cancelButton) cancelButton.hidden = false;
      return;
    }
    if (state.replyTo) {
      replyContext.hidden = false;
      replyContext.textContent = `回复 ${state.replyTo.floor} 楼 @${state.replyTo.nickname}`;
      submitButton.textContent = '发布回复';
      nicknameInput.disabled = state.locked;
      bodyInput.disabled = state.locked;
      submitButton.disabled = state.locked || !state.captchaToken;
      if (cancelButton) cancelButton.hidden = false;
      return;
    }
    replyContext.hidden = true;
    replyContext.textContent = '';
    submitButton.textContent = state.locked ? '评论区已锁定' : '发布评论';
    nicknameInput.disabled = state.locked;
    bodyInput.disabled = state.locked;
    submitButton.disabled = state.locked || !state.captchaToken;
    if (cancelButton) cancelButton.hidden = true;
  };

  const resetCaptcha = () => {
    state.captchaToken = '';
    if (state.turnstile && state.widgetId != null) state.turnstile.reset(state.widgetId);
    if (!state.editing) submitButton.disabled = true;
  };

  const cancelComposerMode = () => {
    state.replyTo = null;
    state.editing = null;
    state.pendingCreate = null;
    bodyInput.value = state.rootDraft;
    updateCounter();
    updateComposer();
    if (state.captchaToken) submitButton.disabled = state.locked;
    setFormStatus(state.locked ? '评论区已锁定；仍可举报，自己发布的内容仍可编辑或删除。' : '');
  };

  const saveProfile = () => {
    state.saved.nickname = nicknameInput.value.trim().replace(/\s+/g, ' ')
      .slice(0, COMMENT_LIMITS.nicknameMax);
    storage.write(state.saved);
  };

  const updateCount = (total) => {
    if (count) count.textContent = `（${total}）`;
    if (jump) jump.textContent = total > 0 ? `评论与补充（${total}）↓` : '评论与补充 ↓';
  };

  const renderAllComments = () => {
    const ordered = [...comments.values()].sort((left, right) => left.floor - right.floor);
    list.replaceChildren(...ordered.map((comment) => renderComment(comment)));
  };

  const replaceComment = (comment) => {
    comments.set(comment.id, comment);
    renderAllComments();
  };

  const reportComment = async (comment, alreadyConfirmed = false) => {
    if (!alreadyConfirmed
      && !window.confirm(`匿名举报 ${comment.floor} 楼？管理员会核对后处理，举报不会自动隐藏评论。`)) return;
    if (state.captchaBusy) {
      setFormStatus('另一项验证操作正在提交，请稍后再试。', 'pending');
      return;
    }
    if (!state.captchaToken) {
      state.pendingReport = comment;
      setFormStatus('请先完成人机验证，验证通过后会自动提交举报。', 'pending');
      turnstileRoot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (state.turnstile && state.widgetId != null) state.turnstile.reset(state.widgetId);
      return;
    }

    const token = state.captchaToken;
    state.pendingReport = null;
    state.captchaBusy = true;
    submitButton.disabled = true;
    setFormStatus(`正在提交对 ${comment.floor} 楼的举报…`, 'pending');
    try {
      await requestJson(buildCommentActionUrl(apiRoot, comment.id, 'reports'), {
        method: 'POST',
        body: JSON.stringify({
          reason: 'user_report',
          turnstileToken: token,
          requestId: createRequestId(),
          website: '',
        }),
      });
      setFormStatus('举报已提交。管理员核对前，评论仍会正常显示。', 'success');
    } catch (error) {
      setFormStatus(readableError(error, '举报失败，请稍后重试。'), 'error');
    } finally {
      state.captchaBusy = false;
      resetCaptcha();
    }
  };

  const deleteComment = async (comment) => {
    const editToken = state.saved.tokens[comment.id];
    if (!isEditToken(editToken) || !window.confirm(`删除自己发布的 ${comment.floor} 楼评论？删除后楼层会保留，但正文不能恢复。`)) return;
    setFormStatus(`正在删除 ${comment.floor} 楼…`, 'pending');
    try {
      const payload = await requestJson(buildCommentActionUrl(apiRoot, comment.id), {
        method: 'DELETE',
        body: JSON.stringify({ editToken }),
      });
      const deleted = normalizeComment(payload?.comment);
      if (!deleted) throw new Error('评论服务返回了无效内容');
      delete state.saved.tokens[comment.id];
      storage.write(state.saved);
      replaceComment(deleted);
      setFormStatus('评论已删除，楼层已保留。', 'success');
    } catch (error) {
      setFormStatus(readableError(error, '删除失败，请稍后重试。'), 'error');
    }
  };

  const renderComment = (comment) => {
    const item = document.createElement('li');
    item.className = `question-comment${comment.status === 'deleted' ? ' is-deleted' : ''}`;
    item.id = `comment-${comment.id}`;
    item.dataset.commentId = comment.id;

    const header = document.createElement('header');
    const author = document.createElement('strong');
    author.textContent = comment.nickname;
    const floor = document.createElement('span');
    floor.className = 'question-comment-floor';
    floor.textContent = `${comment.floor} 楼`;
    const time = document.createElement('time');
    time.dateTime = comment.createdAt;
    time.title = formatDate(comment.createdAt);
    time.textContent = formatDate(comment.createdAt);
    header.append(author, floor, time);
    if (Date.parse(comment.updatedAt) > Date.parse(comment.createdAt) + 1000) {
      const edited = document.createElement('span');
      edited.className = 'question-comment-edited';
      edited.title = `最后修改：${formatDate(comment.updatedAt)}`;
      edited.textContent = '已编辑';
      header.append(edited);
    }

    item.append(header);
    if (comment.replyTo) {
      const reply = document.createElement('a');
      reply.className = 'question-comment-reply-reference';
      reply.href = `#comment-${comment.replyTo.id}`;
      reply.textContent = `回复 ${comment.replyTo.floor} 楼 @${comment.replyTo.nickname}`;
      item.append(reply);
    }

    const body = document.createElement('p');
    body.className = 'question-comment-body';
    body.textContent = comment.body;
    item.append(body);

    if (comment.status === 'visible' && state.writeEnabled) {
      const actions = document.createElement('div');
      actions.className = 'question-comment-actions';
      if (!state.locked) {
        actions.append(createButton('回复', 'text-button', () => {
          if (!state.replyTo && !state.editing) state.rootDraft = bodyInput.value;
          state.editing = null;
          state.replyTo = comment;
          state.pendingCreate = null;
          bodyInput.value = '';
          updateCounter();
          updateComposer();
          bodyInput.focus();
        }, `回复 ${comment.floor} 楼 @${comment.nickname}`));
      }
      actions.append(createButton(
        '举报',
        'text-button subtle-button',
        () => void reportComment(comment),
        `举报 ${comment.floor} 楼`,
      ));
      if (isEditToken(state.saved.tokens[comment.id])) {
        actions.append(createButton('编辑', 'text-button', () => {
          if (!state.replyTo && !state.editing) state.rootDraft = bodyInput.value;
          state.replyTo = null;
          state.editing = comment;
          state.pendingCreate = null;
          bodyInput.value = comment.body;
          updateCounter();
          updateComposer();
          submitButton.disabled = false;
          bodyInput.focus();
        }, `编辑自己发布的 ${comment.floor} 楼`));
        actions.append(createButton(
          '删除',
          'text-button danger-text-button',
          () => void deleteComment(comment),
          `删除自己发布的 ${comment.floor} 楼`,
        ));
      }
      item.append(actions);
    }
    return item;
  };

  const loadComments = async ({ reset = false } = {}) => {
    if (state.loading) return;
    state.loading = true;
    listRegion.setAttribute('aria-busy', 'true');
    loadError.hidden = true;
    retryButton.hidden = true;
    loadMoreButton.disabled = true;
    listStatus.textContent = reset ? '正在加载评论…' : '正在加载更多评论…';
    if (reset) {
      state.cursor = 0;
      state.nextCursor = null;
      comments.clear();
      list.replaceChildren();
    }

    try {
      const page = normalizeCommentsPage(await requestJson(buildCommentsUrl(apiRoot, questionSlug, {
        cursor: reset ? 0 : state.cursor,
      })));
      page.comments.forEach((comment) => {
        comments.set(comment.id, comment);
      });
      const wasLocked = state.locked;
      state.nextCursor = page.nextCursor;
      state.cursor = page.nextCursor || state.cursor;
      state.locked = page.locked;
      renderAllComments();
      if (state.writeEnabled) {
        form.hidden = false;
        updateComposer();
      }
      emptyState.hidden = page.total !== 0;
      list.hidden = comments.size === 0;
      loadMoreButton.hidden = !page.nextCursor;
      listStatus.textContent = page.total === 0 ? '' : `已显示 ${comments.size} 条评论，共 ${page.total} 条。`;
      updateCount(page.total);
      if (page.locked) {
        setFormStatus('评论区已锁定；仍可举报，自己发布的内容仍可编辑或删除。', 'pending');
      } else if (wasLocked && state.writeEnabled) {
        setFormStatus('评论区已经重新开放。', 'success');
      }
    } catch (error) {
      loadError.hidden = false;
      retryButton.hidden = false;
      listStatus.textContent = readableError(error, '评论暂时加载失败。');
    } finally {
      state.loading = false;
      listRegion.setAttribute('aria-busy', 'false');
      loadMoreButton.disabled = false;
    }
  };

  const submitEdit = async (draft) => {
    const comment = state.editing;
    const editToken = state.saved.tokens[comment.id];
    if (!isEditToken(editToken)) throw new Error('本机修改凭据已经丢失，无法继续编辑。');
    const payload = await requestJson(buildCommentActionUrl(apiRoot, comment.id), {
      method: 'PATCH',
      body: JSON.stringify({ body: draft.body, editToken }),
    });
    const updated = normalizeComment(payload?.comment);
    if (!updated) throw new Error('评论服务返回了无效内容');
    replaceComment(updated);
    cancelComposerMode();
    setFormStatus('修改已保存。', 'success');
  };

  const submitNewComment = async (draft) => {
    if (!state.captchaToken) throw new Error('请先完成人机验证。');
    if (state.captchaBusy) throw new Error('另一项验证操作正在提交，请稍后再试。');
    if (!state.pendingCreate) {
      state.pendingCreate = { requestId: createRequestId(), editToken: createClientSecret() };
    }
    const token = state.captchaToken;
    const pending = state.pendingCreate;
    state.captchaBusy = true;
    let payload;
    try {
      payload = await requestJson(buildCommentsUrl(apiRoot, questionSlug), {
        method: 'POST',
        body: JSON.stringify({
          nickname: draft.nickname,
          body: draft.body,
          parentId: state.replyTo?.id || null,
          turnstileToken: token,
          requestId: pending.requestId,
          editToken: pending.editToken,
          website: honeypotInput?.value || '',
        }),
      });
    } finally {
      state.captchaBusy = false;
    }
    const created = normalizeComment(payload?.comment);
    if (!created) throw new Error('评论服务返回了无效内容');
    state.saved.tokens[created.id] = pending.editToken;
    const savedTokenIds = Object.keys(state.saved.tokens);
    savedTokenIds.slice(0, -MAX_SAVED_EDIT_TOKENS).forEach((id) => {
      delete state.saved.tokens[id];
    });
    storage.write(state.saved);
    replaceComment(created);
    updateCount(Number(payload?.total) || comments.size);
    emptyState.hidden = true;
    list.hidden = false;
    state.pendingCreate = null;
    const wasReply = Boolean(state.replyTo);
    state.replyTo = null;
    if (!wasReply) state.rootDraft = '';
    bodyInput.value = wasReply ? state.rootDraft : '';
    updateCounter();
    updateComposer();
    setFormStatus(`发布成功，显示在 ${created.floor} 楼。`, 'success');
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.locked && !state.editing) {
      setFormStatus('评论区已锁定，暂时不能发布新内容。', 'pending');
      return;
    }
    if (state.captchaBusy) {
      setFormStatus('另一项验证操作正在提交，请稍后再试。', 'pending');
      return;
    }
    const draft = validateCommentDraft({ nickname: nicknameInput.value, body: bodyInput.value });
    if (draft.errors.length > 0) {
      setFormStatus(draft.errors[0], 'error');
      return;
    }
    submitButton.disabled = true;
    submitButton.textContent = state.editing ? '正在保存…' : '正在发布…';
    setFormStatus(state.editing ? '正在保存修改…' : '正在发布评论…', 'pending');
    try {
      if (state.editing) await submitEdit(draft);
      else await submitNewComment(draft);
      saveProfile();
    } catch (error) {
      setFormStatus(readableError(error, '发布失败，内容已保留，请重试。'), 'error');
    } finally {
      if (!state.editing) resetCaptcha();
      updateComposer();
    }
  });

  nicknameInput.addEventListener('input', () => {
    state.pendingCreate = null;
    saveProfile();
  });
  bodyInput.addEventListener('input', () => {
    state.pendingCreate = null;
    if (!state.replyTo && !state.editing) state.rootDraft = bodyInput.value;
    updateCounter();
  });
  cancelButton?.addEventListener('click', cancelComposerMode);
  retryButton.addEventListener('click', () => void loadComments({ reset: true }));
  loadMoreButton.addEventListener('click', () => void loadComments());
  updateCounter();
  updateComposer();

  const configure = async () => {
    if (state.configBusy) return;
    state.configBusy = true;
    configRetryButton.hidden = true;
    setFormStatus('正在连接站内评论服务…', 'pending');
    try {
      const config = normalizeCommentsConfig(await requestJson(buildConfigUrl(apiRoot)));
      state.writeEnabled = config.writeEnabled;
      if (!config.writeEnabled) {
        form.hidden = true;
        renderAllComments();
        setFormStatus('当前评论区只读，可以查看已有内容。', 'pending');
        return;
      }
      form.hidden = false;
      state.turnstile = await loadTurnstile();
      state.widgetId = state.turnstile.render(turnstileRoot, {
        sitekey: config.turnstileSiteKey,
        action: 'question-comment',
        language: 'zh-CN',
        size: 'flexible',
        appearance: 'interaction-only',
        callback: (token) => {
          state.captchaToken = token;
          if (state.pendingReport) {
            submitButton.disabled = true;
            void reportComment(state.pendingReport, true);
          } else {
            submitButton.disabled = state.locked;
          }
        },
        'expired-callback': () => {
          state.captchaToken = '';
          if (!state.editing) submitButton.disabled = true;
          setFormStatus('人机验证已过期，请重新完成验证。', 'error');
        },
        'error-callback': () => {
          state.captchaToken = '';
          if (!state.editing) submitButton.disabled = true;
          setFormStatus('人机验证暂时不可用，请稍后重试。', 'error');
        },
      });
      renderAllComments();
      updateComposer();
      setFormStatus(state.locked
        ? '评论区已锁定；仍可举报，自己发布的内容仍可编辑或删除。'
        : '');
    } catch (error) {
      state.writeEnabled = false;
      form.hidden = true;
      configRetryButton.hidden = false;
      renderAllComments();
      setFormStatus(readableError(error, '评论发表功能暂时不可用。'), 'error');
    } finally {
      state.configBusy = false;
    }
  };

  configRetryButton.addEventListener('click', () => { void configure(); });

  void (async () => {
    await loadComments({ reset: true });
    await configure();
  })();
};

document.querySelectorAll('[data-question-comments]').forEach(initializeQuestionComments);
document.addEventListener('question-comments:ready', (event) => {
  if (event.target?.matches?.('[data-question-comments]')) {
    initializeQuestionComments(event.target);
  }
});
