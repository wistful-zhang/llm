import {
  PRACTICE_VERSION,
  RATINGS,
  buildQueue,
  filterQuestions,
  isRating,
  restoreSession,
  shuffleQuestions,
  summarizeSession,
} from './practice-core.mjs';
import { clearMath, renderMath } from './math-render.mjs';

(() => {
  const source = document.querySelector('#practice-question-data');
  const practicePage = document.querySelector('.practice-page');
  const setup = document.querySelector('#practice-setup');
  const session = document.querySelector('#practice-session');
  const summarySection = document.querySelector('#practice-summary');
  if (!source || !setup || !session || !summarySection) return;

  const questions = [...source.querySelectorAll('[data-question-id]')].map((element) => ({
    id: element.dataset.questionId,
    title: element.dataset.title,
    category: element.dataset.category,
    difficulty: element.dataset.difficulty,
    verified: element.dataset.verified === 'true',
    url: element.dataset.url,
  }));
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const repositoryId = source.dataset.repositoryId || `${window.location.host}${window.location.pathname}`;
  const activeSessionKey = `llm-interview-practice:${repositoryId}:session:v${PRACTICE_VERSION}`;
  const resultStorageKey = `llm-interview-practice:${repositoryId}:result:v${PRACTICE_VERSION}`;

  const form = document.querySelector('#practice-form');
  const categorySelect = document.querySelector('#practice-category');
  const difficultySelect = document.querySelector('#practice-difficulty');
  const verificationSelect = document.querySelector('#practice-verification');
  const countSelect = document.querySelector('#practice-count');
  const startButton = document.querySelector('#practice-start');
  const poolStatus = document.querySelector('#practice-pool-status');
  const liveStatus = document.querySelector('#practice-live-status');
  const storageStatus = document.querySelector('#practice-storage-status');
  const resumeCard = document.querySelector('#practice-resume');
  const resumeText = document.querySelector('#practice-resume-text');
  const resumeButton = document.querySelector('#practice-resume-button');
  const discardResumeButton = document.querySelector('#practice-discard-resume');
  const lastResultCard = document.querySelector('#practice-last-result');
  const lastResultText = document.querySelector('#practice-last-result-text');
  const lastWeakButton = document.querySelector('#practice-last-weak');

  const progressText = document.querySelector('#practice-progress-text');
  const progress = document.querySelector('#practice-progress');
  const timer = document.querySelector('#practice-timer');
  const categoryBadge = document.querySelector('#practice-question-category');
  const difficultyBadge = document.querySelector('#practice-question-difficulty');
  const verifiedBadge = document.querySelector('#practice-question-verified');
  const reviewBadge = document.querySelector('#practice-question-review');
  const questionTitle = document.querySelector('#practice-question-title');
  const revealButton = document.querySelector('#practice-reveal');
  const skipButton = document.querySelector('#practice-skip');
  const answerSection = document.querySelector('#practice-answer');
  const answerTitle = document.querySelector('#practice-answer-title');
  const answerContent = document.querySelector('#practice-answer-content');
  const ratingFieldset = document.querySelector('#practice-rating');
  const ratingInputs = [...document.querySelectorAll('input[name="practice-rating"]')];
  const nextButton = document.querySelector('#practice-next');
  const endButton = document.querySelector('#practice-end');
  const exitConfirm = document.querySelector('#practice-exit-confirm');
  const continueButton = document.querySelector('#practice-continue');
  const confirmEndButton = document.querySelector('#practice-confirm-end');

  const summaryTitle = document.querySelector('#practice-summary-title');
  const summaryLead = document.querySelector('#practice-summary-lead');
  const summaryCompleted = document.querySelector('#practice-summary-completed');
  const summaryMastered = document.querySelector('#practice-summary-mastered');
  const summaryPrompted = document.querySelector('#practice-summary-prompted');
  const summaryReview = document.querySelector('#practice-summary-review');
  const summaryDuration = document.querySelector('#practice-summary-duration');
  const weakSection = document.querySelector('#practice-weak-section');
  const weakTitle = document.querySelector('#practice-weak-title');
  const weakList = document.querySelector('#practice-weak-list');
  const retryWeakButton = document.querySelector('#practice-retry-weak');
  const restartButton = document.querySelector('#practice-restart');

  let state = null;
  let resumableState = null;
  let lastSummary = null;
  let lastStoredResult = null;
  let activeTimerStartedAt = 0;
  let timerInterval = 0;
  let timerCheckpointAt = 0;
  let storageWarningShown = false;
  let answerRenderToken = 0;
  const answerCache = new Map();
  const answerRequests = new Map();

  const clock = () => window.performance?.now?.() ?? Date.now();

  const announce = (message) => {
    if (liveStatus) liveStatus.textContent = message;
  };

  const moveFocusTo = (element) => {
    window.requestAnimationFrame(() => {
      const positionElement = () => {
        const header = document.querySelector('.site-header');
        const offset = (header?.offsetHeight || 0) + 18;
        const top = element.getBoundingClientRect().top + window.scrollY - offset;
        const previousBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
        document.documentElement.style.scrollBehavior = previousBehavior;
      };
      element.focus({ preventScroll: true });
      positionElement();
    });
  };

  const showStorageWarning = () => {
    if (storageWarningShown || !storageStatus) return;
    storageWarningShown = true;
    storageStatus.hidden = false;
    storageStatus.textContent = '浏览器未允许保存练习进度。本轮仍可继续，但刷新后可能无法恢复。';
  };

  const readStorage = (storageName, key) => {
    try {
      return window[storageName].getItem(key);
    } catch {
      showStorageWarning();
      return null;
    }
  };

  const writeStorage = (storageName, key, value) => {
    try {
      window[storageName].setItem(key, value);
      return true;
    } catch {
      showStorageWarning();
      return false;
    }
  };

  const removeStorage = (storageName, key) => {
    try {
      window[storageName].removeItem(key);
    } catch {
      showStorageWarning();
    }
  };

  const formatClock = (milliseconds) => {
    const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const formatDuration = (milliseconds) => {
    const seconds = Math.round(Math.max(0, milliseconds) / 1000);
    if (seconds < 60) return `${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return remaining ? `${minutes} 分 ${remaining} 秒` : `${minutes} 分钟`;
  };

  const cacheAnswer = (id, fragment) => {
    answerCache.delete(id);
    answerCache.set(id, fragment);
    if (answerCache.size > 20) answerCache.delete(answerCache.keys().next().value);
  };

  const readCachedAnswer = (id) => {
    const cached = answerCache.get(id);
    if (!cached) return null;
    answerCache.delete(id);
    answerCache.set(id, cached);
    return cached;
  };

  const makeAnswerFragment = (html, pageUrl) => {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const answer = parsed.querySelector('.question-answer');
    if (!answer) throw new Error('题解页中没有找到答案内容');

    answer.querySelectorAll('[href], [src]').forEach((element) => {
      ['href', 'src'].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value || value.startsWith('#')) return;
        try {
          element.setAttribute(attribute, new URL(value, pageUrl).href);
        } catch {
          element.removeAttribute(attribute);
        }
      });
    });

    const fragment = document.createDocumentFragment();
    [...answer.childNodes].forEach((node) => fragment.append(node.cloneNode(true)));
    if (!fragment.hasChildNodes()) throw new Error('题解内容为空');
    return fragment;
  };

  const loadQuestionAnswer = async (question) => {
    const cached = readCachedAnswer(question.id);
    if (cached) return Promise.resolve(cached);
    if (answerRequests.has(question.id)) return answerRequests.get(question.id);

    const requestUrl = new URL(question.url, window.location.href);
    if (requestUrl.origin !== window.location.origin) {
      return Promise.reject(new Error('题解地址不是本站地址'));
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    const request = fetch(requestUrl.href, {
      headers: { Accept: 'text/html' },
      credentials: 'same-origin',
      cache: 'force-cache',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`题解加载失败（${response.status}）`);
        const responseUrl = new URL(response.url || requestUrl.href, requestUrl.href);
        if (responseUrl.origin !== window.location.origin) throw new Error('题解被重定向到站外');
        const html = await response.text();
        if (html.length > 2000000) throw new Error('题解页面体积异常');
        const fragment = makeAnswerFragment(html, responseUrl.href);
        cacheAnswer(question.id, fragment);
        return fragment;
      })
      .finally(() => {
        window.clearTimeout(timeout);
        answerRequests.delete(question.id);
      });

    answerRequests.set(question.id, request);
    return request;
  };

  const lowerAnswerHeadings = (answer) => {
    answer.querySelectorAll('h2, h3, h4, h5').forEach((heading) => {
      const level = Math.min(Number(heading.tagName.slice(1)) + 1, 6);
      const replacement = document.createElement(`h${level}`);
      [...heading.attributes].forEach((attribute) => replacement.setAttribute(attribute.name, attribute.value));
      replacement.append(...heading.childNodes);
      heading.replaceWith(replacement);
    });
  };

  const makeAnswerStatus = (message) => {
    const statusMessage = document.createElement('p');
    statusMessage.setAttribute('role', 'status');
    statusMessage.textContent = message;
    return statusMessage;
  };

  const currentElapsedMs = () => {
    if (!state) return 0;
    return state.currentElapsedMs + (activeTimerStartedAt ? clock() - activeTimerStartedAt : 0);
  };

  const snapshotState = () => ({
    version: PRACTICE_VERSION,
    repositoryId,
    phase: state.phase,
    queue: state.queue,
    cursor: state.cursor,
    records: state.records,
    pendingRating: state.pendingRating,
    currentElapsedMs: currentElapsedMs(),
    filters: state.filters,
    createdAt: state.createdAt,
    revision: (state.revision || 0) + 1,
  });

  const persistSession = () => {
    if (!state) return;
    const snapshot = snapshotState();
    state.revision = snapshot.revision;
    writeStorage('localStorage', activeSessionKey, JSON.stringify(snapshot));
  };

  const stopTimerInterval = () => {
    if (timerInterval) window.clearInterval(timerInterval);
    timerInterval = 0;
  };

  const renderTimer = () => {
    if (timer) timer.textContent = formatClock(currentElapsedMs());
  };

  const pauseTimer = (save = true) => {
    if (state && activeTimerStartedAt) {
      state.currentElapsedMs += clock() - activeTimerStartedAt;
    }
    activeTimerStartedAt = 0;
    stopTimerInterval();
    renderTimer();
    if (save && state) persistSession();
  };

  const startTimer = () => {
    if (!state || state.phase !== 'asking' || activeTimerStartedAt || document.hidden) return;
    activeTimerStartedAt = clock();
    timerCheckpointAt = activeTimerStartedAt;
    renderTimer();
    timerInterval = window.setInterval(() => {
      renderTimer();
      const now = clock();
      if (now - timerCheckpointAt >= 5000) {
        timerCheckpointAt = now;
        persistSession();
      }
    }, 500);
  };

  const currentQuestion = () => {
    const snapshot = state?.queue[state.cursor];
    return snapshot ? (questionById.get(snapshot.id) || snapshot) : null;
  };

  const getFilters = () => ({
    category: categorySelect.value,
    difficulty: difficultySelect.value,
    verification: verificationSelect.value,
  });

  const updateSetup = () => {
    const pool = filterQuestions(questions, getFilters());
    const requested = Number.parseInt(countSelect.value, 10) || 5;
    const actual = Math.min(pool.length, requested);
    const label = actual <= 2 ? '练习' : '模拟';

    startButton.disabled = actual === 0;
    startButton.textContent = actual === 0
      ? '当前范围暂无题目'
      : `开始 ${actual} 题${label} · 约 ${actual * 2} 分钟`;

    if (pool.length === 0) {
      poolStatus.textContent = '这个筛选组合暂时没有题目，请调整范围。';
    } else if (pool.length < requested) {
      poolStatus.textContent = `该范围只有 ${pool.length} 道题，本轮将使用全部题目，且不会重复。`;
    } else {
      poolStatus.textContent = `将从 ${pool.length} 道题中随机抽取 ${actual} 道，同一轮不会重复。`;
    }
  };

  const showSetup = () => {
    pauseTimer(false);
    answerRenderToken += 1;
    state = null;
    session.hidden = true;
    summarySection.hidden = true;
    setup.hidden = false;
    practicePage.classList.remove('is-active', 'is-summary');
    updateSetup();
    categorySelect.focus();
  };

  const showAnswer = async (moveFocus = true) => {
    const question = currentQuestion();
    if (!question?.url) return;
    const renderToken = ++answerRenderToken;

    clearMath(answerContent);
    answerContent.replaceChildren(makeAnswerStatus('正在加载这道题的参考回答…'));
    answerContent.setAttribute('aria-busy', 'true');
    answerSection.hidden = false;
    ratingFieldset.hidden = true;
    revealButton.hidden = true;
    skipButton.hidden = true;
    revealButton.setAttribute('aria-expanded', 'true');
    if (moveFocus) moveFocusTo(answerTitle);
    announce('正在加载这道题的参考回答。');

    try {
      const cachedAnswer = await loadQuestionAnswer(question);
      if (renderToken !== answerRenderToken || !state || state.phase !== 'revealed' || currentQuestion()?.id !== question.id) return;

      const answer = cachedAnswer.cloneNode(true);
      lowerAnswerHeadings(answer);
      answerContent.replaceChildren(answer);
      answerContent.removeAttribute('aria-busy');
      void renderMath(answerContent);
      ratingFieldset.hidden = false;
      ratingInputs.forEach((input) => { input.checked = input.value === state.pendingRating; });
      nextButton.disabled = !isRating(state.pendingRating);
      nextButton.textContent = state.cursor === state.queue.length - 1 ? '完成本轮' : '下一题';
      announce('答题提示与参考回答已展开，请对照后完成自我评价。');
    } catch {
      if (renderToken !== answerRenderToken || !state || state.phase !== 'revealed' || currentQuestion()?.id !== question.id) return;

      answerContent.removeAttribute('aria-busy');
      const message = makeAnswerStatus('参考回答暂时没有加载成功。你可以重试，或直接打开题解页查看。');
      const actions = document.createElement('p');
      const retry = document.createElement('button');
      const directLink = document.createElement('a');
      retry.className = 'secondary-button';
      retry.type = 'button';
      retry.textContent = '重新加载参考回答';
      retry.addEventListener('click', () => { void showAnswer(true); });
      directLink.className = 'text-link';
      directLink.href = question.url;
      directLink.target = '_blank';
      directLink.rel = 'noopener noreferrer';
      directLink.textContent = '打开完整题解 →';
      actions.append(retry, document.createTextNode(' '), directLink);
      answerContent.replaceChildren(message, actions);
      ratingFieldset.hidden = false;
      ratingInputs.forEach((input) => { input.checked = input.value === state.pendingRating; });
      nextButton.disabled = !isRating(state.pendingRating);
      nextButton.textContent = state.cursor === state.queue.length - 1 ? '完成本轮' : '下一题';
      skipButton.hidden = false;
      skipButton.textContent = '跳过本题，继续';
      announce('参考回答加载失败，可以重试、打开完整题解，或直接自评后继续。');
      if (moveFocus && document.activeElement === answerTitle) retry.focus();
    }
  };

  const renderQuestion = ({ moveFocus = true } = {}) => {
    const question = currentQuestion();
    if (!question) return;
    answerRenderToken += 1;

    setup.hidden = true;
    summarySection.hidden = true;
    session.hidden = false;
    practicePage.classList.add('is-active');
    practicePage.classList.remove('is-summary');
    exitConfirm.hidden = true;
    endButton.setAttribute('aria-expanded', 'false');
    progressText.textContent = `第 ${state.cursor + 1} 题，共 ${state.queue.length} 题`;
    progress.max = state.queue.length;
    progress.value = state.cursor + 1;
    progress.setAttribute('aria-valuetext', `第 ${state.cursor + 1} 题，共 ${state.queue.length} 题`);
    categoryBadge.textContent = question.category;
    difficultyBadge.textContent = question.difficulty;
    if (verifiedBadge) verifiedBadge.hidden = question.verified !== true;
    if (reviewBadge) reviewBadge.hidden = question.verified === true;
    questionTitle.textContent = question.title;
    timer.textContent = formatClock(state.currentElapsedMs);
    answerSection.hidden = true;
    ratingFieldset.hidden = true;
    clearMath(answerContent);
    answerContent.replaceChildren();
    revealButton.hidden = false;
    skipButton.hidden = false;
    skipButton.textContent = '暂时跳过';
    revealButton.setAttribute('aria-expanded', 'false');
    ratingInputs.forEach((input) => { input.checked = false; });
    nextButton.disabled = true;

    if (state.phase === 'revealed') {
      void showAnswer(false);
      pauseTimer(false);
    } else {
      void loadQuestionAnswer(question).catch(() => {});
      startTimer();
    }

    if (moveFocus) moveFocusTo(questionTitle);
    announce(`第 ${state.cursor + 1} 题，共 ${state.queue.length} 题。`);
    persistSession();
  };

  const startWithQuestions = (selectedQuestions, filters = {}) => {
    const queue = selectedQuestions.map(({ id, title, category, difficulty, verified, url }) => ({
      id, title, category, difficulty, verified: verified === true, url,
    }));
    if (queue.length === 0) return;

    removeStorage('localStorage', activeSessionKey);
    resumableState = null;
    resumeCard.hidden = true;
    state = {
      version: PRACTICE_VERSION,
      repositoryId,
      phase: 'asking',
      queue,
      cursor: 0,
      records: [],
      pendingRating: '',
      currentElapsedMs: 0,
      filters,
      createdAt: new Date().toISOString(),
      revision: 0,
    };
    renderQuestion();
  };

  const recordCurrent = (rating) => {
    const question = currentQuestion();
    if (!question || !isRating(rating)) return false;
    state.records = state.records.filter((record) => record.id !== question.id);
    state.records.push({ id: question.id, rating, durationMs: Math.round(state.currentElapsedMs) });
    return true;
  };

  const advance = () => {
    state.cursor += 1;
    state.phase = 'asking';
    state.pendingRating = '';
    state.currentElapsedMs = 0;
    activeTimerStartedAt = 0;
    if (state.cursor >= state.queue.length) {
      finishSession(false);
      return;
    }
    renderQuestion();
  };

  const createWeakItem = (record) => {
    const item = document.createElement('li');
    item.className = 'practice-review-item';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    const meta = document.createElement('span');
    const current = questionById.get(record.id);

    title.textContent = record.title;
    meta.textContent = `${record.category} · ${record.difficulty} · ${RATINGS[record.rating]} · ${formatDuration(record.durationMs)}`;
    copy.append(title, meta);
    item.append(copy);
    if (current) {
      const link = document.createElement('a');
      link.href = current.url;
      link.textContent = '查看题解 →';
      item.append(link);
    } else {
      const missing = document.createElement('span');
      missing.className = 'practice-missing-question';
      missing.textContent = '题目已删除';
      item.append(missing);
    }
    return item;
  };

  function finishSession(endedEarly) {
    if (!state) return;
    pauseTimer(false);
    answerRenderToken += 1;
    if (state.phase === 'revealed' && isRating(state.pendingRating)) {
      recordCurrent(state.pendingRating);
    }

    lastSummary = summarizeSession(state.queue, state.records);
    lastSummary.endedEarly = endedEarly;
    removeStorage('localStorage', activeSessionKey);
    resumableState = null;

    const storedResult = {
      version: PRACTICE_VERSION,
      repositoryId,
      completedAt: new Date().toISOString(),
      total: lastSummary.total,
      completed: lastSummary.completed,
      counts: lastSummary.counts,
      weakIds: lastSummary.weak.map((record) => record.id),
    };
    writeStorage('localStorage', resultStorageKey, JSON.stringify(storedResult));
    lastStoredResult = storedResult;
    loadStoredResult();

    setup.hidden = true;
    session.hidden = true;
    summarySection.hidden = false;
    practicePage.classList.remove('is-active');
    practicePage.classList.add('is-summary');
    summaryTitle.textContent = endedEarly ? '本轮已结束' : '本轮完成';
    summaryCompleted.textContent = `${lastSummary.completed} / ${lastSummary.total}`;
    summaryMastered.textContent = lastSummary.counts.mastered;
    summaryPrompted.textContent = lastSummary.counts.prompted;
    summaryReview.textContent = lastSummary.counts.unknown + lastSummary.counts.skipped;
    summaryDuration.textContent = formatDuration(lastSummary.durationMs);

    if (lastSummary.weak.length === 0 && lastSummary.completed > 0) {
      summaryLead.textContent = '这轮已处理的题目都能独立讲清楚，换一组继续保持。';
      weakSection.hidden = true;
      retryWeakButton.hidden = true;
      restartButton.textContent = '换一组随机题';
    } else {
      summaryLead.textContent = lastSummary.completed === 0
        ? `本轮尚未处理题目，可以重新开始。`
        : `已处理 ${lastSummary.completed} / ${lastSummary.total} 题，建议先复习 ${lastSummary.weak.length} 道薄弱题。`;
      weakSection.hidden = lastSummary.weak.length === 0;
      weakTitle.textContent = `优先复习（${lastSummary.weak.length}）`;
      weakList.replaceChildren(...lastSummary.weak.map(createWeakItem));
      retryWeakButton.hidden = lastSummary.weak.length === 0;
      retryWeakButton.textContent = `只练薄弱题（${lastSummary.weak.length}）`;
      restartButton.textContent = '再随机一轮';
    }

    state = null;
    moveFocusTo(summaryTitle);
    announce('复盘结果已生成。');
  }

  const loadStoredResult = () => {
    const raw = readStorage('localStorage', resultStorageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.version !== PRACTICE_VERSION || parsed.repositoryId !== repositoryId) return;
      lastStoredResult = parsed;
      const time = new Date(parsed.completedAt);
      const weakCount = Array.isArray(parsed.weakIds) ? parsed.weakIds.length : 0;
      lastResultText.textContent = `${time.toLocaleString('zh-CN')} · 已处理 ${parsed.completed} 题 · 薄弱题 ${weakCount} 道`;
      lastResultCard.hidden = false;
      const availableWeak = (parsed.weakIds || []).filter((id) => questionById.has(id));
      lastWeakButton.hidden = availableWeak.length === 0;
      lastWeakButton.textContent = `继续练薄弱题（${availableWeak.length}）`;
    } catch {
      removeStorage('localStorage', resultStorageKey);
    }
  };

  const presentResumableSession = (restored) => {
    resumableState = restored;
    resumeCard.hidden = false;
    const stage = restored.phase === 'revealed' ? '等待自评' : '正在思考';
    resumeText.textContent = `上次停在第 ${restored.cursor + 1} / ${restored.queue.length} 题（${stage}）。`;
    if (restored.removedCount > 0) {
      announce(`有 ${restored.removedCount} 道题已不存在，已从未完成队列中移除。`);
    }
  };

  const loadResumableSession = () => {
    const raw = readStorage('localStorage', activeSessionKey);
    if (!raw) return;
    try {
      const restored = restoreSession(JSON.parse(raw), questions, repositoryId);
      if (!restored) {
        removeStorage('localStorage', activeSessionKey);
        return;
      }
      if (restored.complete) {
        state = { ...restored, revision: 0 };
        finishSession(true);
        announce(`有 ${restored.removedCount} 道未完成题目已不存在，已显示现有复盘。`);
        return;
      }
      presentResumableSession(restored);
    } catch {
      removeStorage('localStorage', activeSessionKey);
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (resumableState && !window.confirm('开始新一轮会放弃上次未完成的进度，确定继续吗？')) return;
    const filters = getFilters();
    const queue = buildQueue(questions, filters, countSelect.value);
    startWithQuestions(queue, { ...filters, count: Number.parseInt(countSelect.value, 10) || 5 });
  });

  [categorySelect, difficultySelect, verificationSelect, countSelect].forEach((control) => {
    control.addEventListener('change', updateSetup);
  });

  revealButton.addEventListener('click', () => {
    if (!state || state.phase !== 'asking') return;
    pauseTimer(false);
    state.phase = 'revealed';
    state.pendingRating = '';
    persistSession();
    void showAnswer();
  });

  skipButton.addEventListener('click', () => {
    if (!state || !['asking', 'revealed'].includes(state.phase)) return;
    pauseTimer(false);
    if (recordCurrent('skipped')) advance();
  });

  ratingInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (!state || state.phase !== 'revealed' || !isRating(input.value)) return;
      state.pendingRating = input.value;
      nextButton.disabled = false;
      persistSession();
    });
  });

  nextButton.addEventListener('click', () => {
    if (!state || state.phase !== 'revealed' || !isRating(state.pendingRating)) return;
    if (recordCurrent(state.pendingRating)) advance();
  });

  endButton.addEventListener('click', () => {
    pauseTimer();
    exitConfirm.hidden = false;
    endButton.setAttribute('aria-expanded', 'true');
    continueButton.focus();
  });

  continueButton.addEventListener('click', () => {
    exitConfirm.hidden = true;
    endButton.setAttribute('aria-expanded', 'false');
    endButton.focus();
    startTimer();
  });

  confirmEndButton.addEventListener('click', () => finishSession(true));

  exitConfirm.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      continueButton.click();
    }
  });

  resumeButton.addEventListener('click', () => {
    if (!resumableState) return;
    state = { ...resumableState, revision: 0 };
    resumableState = null;
    resumeCard.hidden = true;
    renderQuestion();
  });

  discardResumeButton.addEventListener('click', () => {
    resumableState = null;
    removeStorage('localStorage', activeSessionKey);
    resumeCard.hidden = true;
    announce('已放弃上次未完成的练习，可以重新选择范围。');
  });

  retryWeakButton.addEventListener('click', () => {
    const weakQuestions = (lastSummary?.weak || [])
      .map((record) => questionById.get(record.id))
      .filter(Boolean);
    startWithQuestions(shuffleQuestions(weakQuestions), { weakOnly: true, count: weakQuestions.length });
  });

  lastWeakButton.addEventListener('click', () => {
    const weakQuestions = (lastStoredResult?.weakIds || [])
      .map((id) => questionById.get(id))
      .filter(Boolean);
    startWithQuestions(shuffleQuestions(weakQuestions), { weakOnly: true, count: weakQuestions.length });
  });

  restartButton.addEventListener('click', showSetup);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseTimer();
    else startTimer();
  });
  window.addEventListener('pagehide', () => pauseTimer());
  window.addEventListener('pageshow', () => startTimer());
  window.addEventListener('storage', (event) => {
    if (event.key !== activeSessionKey) return;

    pauseTimer(false);
    answerRenderToken += 1;
    state = null;
    session.hidden = true;
    summarySection.hidden = true;
    setup.hidden = false;
    practicePage.classList.remove('is-active', 'is-summary');
    resumableState = null;
    resumeCard.hidden = true;

    if (event.newValue) {
      try {
        const restored = restoreSession(JSON.parse(event.newValue), questions, repositoryId);
        if (restored && !restored.complete) presentResumableSession(restored);
      } catch {
        // 另一个标签页的损坏记录不会影响本页继续使用。
      }
    }

    storageStatus.hidden = false;
    storageStatus.textContent = '另一个标签页更新了本题库的练习进度。本页已暂停，请继续最新进度或重新开始。';
    announce(storageStatus.textContent);
  });

  loadResumableSession();
  loadStoredResult();
  updateSetup();
})();
