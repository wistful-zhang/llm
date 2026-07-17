import {
  MODES,
  OUTCOMES,
  STAGES,
  buildApplicationViews,
  buildPublicExperienceDraft,
  createEmptyTracker,
  createTrackerBackup,
  filterApplicationViews,
  listTrackerYears,
  listUpcomingItems,
  mergeTrackers,
  nextStage,
  parseTrackerBackup,
  removeApplication,
  removeRound,
  roundOutcome,
  summarizeTracker,
  trackerToCsv,
  updateApplication,
  upsertInterview,
} from './interview-tracker-core.mjs';
import {
  clearTrackerStorage,
  preserveTrackerBackup,
  readTrackerStorage,
  trackerStorageKey,
  writeTrackerStorage,
} from './interview-tracker-storage.mjs';

(() => {
  const root = document.querySelector('#interview-tracker');
  const form = document.querySelector('#interview-form');
  if (!root || !form) return;

  const repositoryId = root.dataset.repositoryId || `${window.location.host}${window.location.pathname}`;
  const storageKey = trackerStorageKey(repositoryId);
  let storage;
  try {
    storage = window.localStorage;
  } catch (error) {
    storage = {
      getItem() { throw error; },
      setItem() { throw error; },
      removeItem() { throw error; },
    };
  }

  const addButton = document.querySelector('#interview-add');
  const formPanel = document.querySelector('#interview-form-panel');
  const formTitle = document.querySelector('#interview-form-title');
  const formKicker = document.querySelector('#interview-form-kicker');
  const formCloseButton = document.querySelector('#interview-form-close');
  const cancelButton = document.querySelector('#interview-cancel');
  const saveButton = document.querySelector('#interview-save');
  const formModeInput = document.querySelector('#interview-form-mode');
  const roundIdInput = document.querySelector('#interview-round-id');
  const applicationIdInput = document.querySelector('#interview-application-id');
  const companyInput = document.querySelector('#interview-company');
  const companyOptions = document.querySelector('#interview-company-options');
  const roleInput = document.querySelector('#interview-role');
  const dateInput = document.querySelector('#interview-date');
  const stageInput = document.querySelector('#interview-stage');
  const outcomeInput = document.querySelector('#interview-outcome');
  const modeInput = document.querySelector('#interview-mode');
  const ratingInput = document.querySelector('#interview-rating');
  const sourceInput = document.querySelector('#interview-source');
  const nextActionInput = document.querySelector('#interview-next-action');
  const nextDateInput = document.querySelector('#interview-next-date');
  const reflectionInput = document.querySelector('#interview-reflection');
  const visibilityInputs = [...form.querySelectorAll('input[name="visibility"]')];
  const basicLegend = document.querySelector('#interview-basic-legend');
  const fieldsetHint = document.querySelector('#interview-fieldset-hint');
  const companyHint = document.querySelector('#interview-company-hint');
  const moreFields = document.querySelector('#interview-more-fields');
  const moreTitle = document.querySelector('#interview-more-title');
  const moreHint = document.querySelector('#interview-more-hint');
  const roundFields = [...document.querySelectorAll('.interview-round-field')];
  const applicationFields = [...document.querySelectorAll('.interview-application-field')];

  const statCompanies = document.querySelector('#interview-stat-companies');
  const statRounds = document.querySelector('#interview-stat-rounds');
  const statActive = document.querySelector('#interview-stat-active');
  const statOffers = document.querySelector('#interview-stat-offers');
  const upcomingSection = document.querySelector('#interview-upcoming-section');
  const upcomingList = document.querySelector('#interview-upcoming-list');

  const searchInput = document.querySelector('#interview-search');
  const toolbar = document.querySelector('#interview-toolbar');
  const outcomeFilter = document.querySelector('#interview-filter-outcome');
  const yearFilter = document.querySelector('#interview-filter-year');
  const clearFiltersButton = document.querySelector('#interview-clear-filters');
  const filterEmptyClearButton = document.querySelector('#interview-filter-empty-clear');
  const flowList = document.querySelector('#interview-flow-list');
  const recordCount = document.querySelector('#interview-record-count');
  const firstEmpty = document.querySelector('#interview-first-empty');
  const filterEmpty = document.querySelector('#interview-filter-empty');
  const emptyAddButton = document.querySelector('#interview-empty-add');

  const exportJsonButton = document.querySelector('#interview-export-json');
  const exportCsvButton = document.querySelector('#interview-export-csv');
  const importJsonButton = document.querySelector('#interview-import-json');
  const importFileInput = document.querySelector('#interview-import-file');
  const clearAllButton = document.querySelector('#interview-clear-all');

  const storageAlert = document.querySelector('#interview-storage-alert');
  const storageAlertTitle = document.querySelector('#interview-storage-alert-title');
  const storageAlertText = document.querySelector('#interview-storage-alert-text');
  const storageAlertActions = document.querySelector('#interview-storage-alert-actions');
  const downloadRawButton = document.querySelector('#interview-download-raw');
  const clearDamagedButton = document.querySelector('#interview-clear-damaged');
  const alertExportButton = document.querySelector('#interview-alert-export');
  const liveStatus = document.querySelector('#interview-live-status');
  const saveSuccess = document.querySelector('#interview-save-success');
  const saveSuccessTitle = document.querySelector('#interview-save-success-title');
  const saveSuccessClose = document.querySelector('#interview-save-success-close');
  const publicationUrl = root.dataset.publicationUrl || root.dataset.manageUrl || '../manage/#experience-publication';

  let loaded = readTrackerStorage(storage, storageKey, repositoryId);
  let tracker = loaded.data;
  let damagedRaw = loaded.status === 'corrupt' ? loaded.raw : '';
  let storageAvailable = loaded.status !== 'unavailable';
  let storageBlocked = loaded.status === 'corrupt';
  let formDirty = false;
  let damagedRawDownloaded = false;
  let formReturnFocus = { element: addButton };
  let filterAnnouncementTimer = 0;

  const localDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const makeId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  };

  const announce = (message) => {
    liveStatus.textContent = '';
    window.requestAnimationFrame(() => { liveStatus.textContent = message; });
  };

  const makeElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const button = (label, action, className, data = {}) => {
    const element = makeElement('button', className, label);
    element.type = 'button';
    element.dataset.action = action;
    Object.entries(data).forEach(([key, value]) => { element.dataset[key] = value; });
    return element;
  };

  const formatDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return value || '';
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
      .format(new Date(year, month - 1, day));
  };

  const setAlert = (title, message, options = {}) => {
    storageAlert.hidden = false;
    storageAlertTitle.textContent = title;
    storageAlertText.textContent = message;
    downloadRawButton.hidden = !options.damaged;
    clearDamagedButton.hidden = !options.damaged;
    alertExportButton.hidden = !options.temporary;
    storageAlertActions.hidden = !options.damaged && !options.temporary;
    storageAlert.classList.toggle('is-danger', Boolean(options.damaged));
  };

  const clearAlert = () => {
    if (!storageAvailable) return;
    storageAlert.hidden = true;
    storageAlertActions.hidden = true;
    downloadRawButton.hidden = false;
    clearDamagedButton.hidden = false;
    alertExportButton.hidden = true;
    storageAlert.classList.remove('is-danger');
  };

  const setWriteControls = (disabled) => {
    addButton.disabled = disabled;
    emptyAddButton.disabled = disabled;
    saveButton.disabled = disabled;
    clearAllButton.disabled = disabled;
  };

  const downloadText = (filename, contents, type) => {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
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
        return;
      } catch {
        // Clipboard permission can be denied even when the API exists; use a local fallback.
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('copy failed');
  };

  const backupFilename = (extension) => `大模型面经-面试记录-${localDate()}.${extension}`;

  const getView = (applicationId) => buildApplicationViews(tracker)
    .find((view) => view.application.id === applicationId);

  const getRoundContext = (roundId) => {
    const round = tracker.rounds.find((item) => item.id === roundId);
    if (!round) return null;
    const view = getView(round.applicationId);
    return view ? { round, view } : null;
  };

  const renderStats = () => {
    const summary = summarizeTracker(tracker, localDate());
    statCompanies.textContent = String(summary.interviewedCompanies);
    statRounds.textContent = String(summary.completedRounds);
    statActive.textContent = String(summary.activeApplications);
    statOffers.textContent = String(summary.offers);
  };

  const renderUpcoming = () => {
    const items = listUpcomingItems(tracker, localDate()).slice(0, 6);
    upcomingList.replaceChildren();
    upcomingSection.hidden = items.length === 0;
    items.forEach((item) => {
      const row = makeElement('li', 'interview-upcoming-item');
      const time = makeElement('time', '', formatDate(item.date));
      time.dateTime = item.date;
      const copy = makeElement('div');
      copy.append(
        makeElement('strong', '', `${item.company} · ${item.role}`),
        makeElement('span', '', item.type === 'interview' ? `面试：${item.label}` : `待办：${item.label}`),
      );
      if (item.overdue) {
        time.classList.add('is-overdue');
        copy.append(makeElement('span', 'interview-overdue', '已逾期'));
      }
      row.append(time, copy);
      upcomingList.append(row);
    });
  };

  const renderCompanyOptions = () => {
    companyOptions.replaceChildren();
    [...tracker.companies]
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
      .forEach((company) => {
        const option = document.createElement('option');
        option.value = company.name;
        companyOptions.append(option);
      });
  };

  const renderYearOptions = () => {
    const selected = yearFilter.value;
    yearFilter.replaceChildren(new Option('全部年份', ''));
    listTrackerYears(tracker).forEach((year) => yearFilter.add(new Option(`${year} 年`, year)));
    yearFilter.value = [...yearFilter.options].some((option) => option.value === selected) ? selected : '';
  };

  const createOutcomeBadge = (outcome) => makeElement(
    'span',
    `interview-outcome interview-outcome-${outcome}`,
    OUTCOMES[outcome] || '待反馈',
  );

  const applicationVisibility = (application) => (application?.visibility === 'public' ? 'public' : 'private');

  const createVisibilityBadge = (application) => {
    const visibility = applicationVisibility(application);
    const badge = makeElement(
      'span',
      `interview-visibility-badge interview-visibility-${visibility}`,
      visibility === 'public' ? '可整理公开' : '仅自己',
    );
    badge.title = visibility === 'public'
      ? '仍只保存在当前浏览器，必须匿名检查并二次发布'
      : '只保存在当前浏览器';
    return badge;
  };

  const createPublicationPanel = (view) => {
    const panel = makeElement('section', 'interview-publication-panel');
    const panelId = `interview-publication-${view.application.id}`;
    const headingId = `${panelId}-title`;
    panel.id = panelId;
    panel.hidden = true;
    panel.setAttribute('aria-labelledby', headingId);

    const heading = makeElement('h4', '', '匿名公开预览');
    heading.id = headingId;
    heading.tabIndex = -1;
    const note = makeElement(
      'p',
      'interview-publication-note',
      '下面只是本地生成的脱敏草稿，不会自动上传。已排除流程中的来源、下一步、个人复盘等信息；公开前仍要人工检查并二次确认。',
    );
    const preview = makeElement('pre', 'interview-publication-preview', buildPublicExperienceDraft(view));
    preview.tabIndex = 0;

    const actions = makeElement('div', 'interview-publication-actions');
    actions.append(button('复制匿名草稿', 'copy-publication', 'primary-button', { applicationId: view.application.id }));
    const manageLink = makeElement('a', 'secondary-button', '进入二次整理页（不会自动发布）');
    manageLink.href = publicationUrl;
    actions.append(
      manageLink,
      button('收起预览', 'close-publication', 'text-button', { applicationId: view.application.id }),
    );

    const status = makeElement('p', 'interview-publication-status');
    status.id = `${panelId}-status`;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    panel.append(heading, note, preview, actions, status);
    return panel;
  };

  const createRoundItem = (round) => {
    const item = makeElement('li', 'interview-round-item');
    item.id = `interview-round-${round.id}`;

    const top = makeElement('div', 'interview-round-top');
    const identity = makeElement('div', 'interview-round-identity');
    const time = makeElement('time', '', formatDate(round.date));
    time.dateTime = round.date;
    identity.append(time, makeElement('strong', '', STAGES[round.stage] || STAGES.other));
    const badges = makeElement('div', 'interview-round-badges');
    badges.append(createOutcomeBadge(roundOutcome(round)), makeElement('span', 'interview-mode', MODES[round.mode] || MODES.other));
    top.append(identity, badges);
    item.append(top);

    if (round.rating) item.append(makeElement('p', 'interview-round-rating', `自我感觉：${round.rating} / 5`));
    if (round.reflection) item.append(makeElement('p', 'interview-round-reflection', round.reflection));

    const actions = makeElement('div', 'interview-round-actions');
    actions.append(
      button('编辑本轮', 'edit-round', 'text-button', { roundId: round.id }),
      button('删除本轮', 'delete-round', 'text-button interview-danger-button', { roundId: round.id }),
    );
    item.append(actions);
    return item;
  };

  const createFlowCard = (view) => {
    const article = makeElement('article', 'interview-flow-card');
    article.id = `interview-flow-${view.application.id}`;
    article.tabIndex = -1;

    const header = makeElement('header', 'interview-flow-header');
    const heading = makeElement('div');
    heading.append(
      makeElement('span', 'section-kicker', view.company.name),
      makeElement('h3', '', view.application.role),
    );
    const statuses = makeElement('div', 'interview-flow-statuses');
    statuses.append(createVisibilityBadge(view.application), createOutcomeBadge(view.latestOutcome));
    header.append(heading, statuses);

    const meta = makeElement('p', 'interview-flow-meta');
    meta.textContent = `${view.rounds.length} 轮记录 · 最近 ${formatDate(view.latestRound.date)}`;
    if (view.application.source) meta.append(document.createTextNode(` · ${view.application.source}`));

    article.append(header, meta);

    if (view.application.nextAction) {
      const next = makeElement('div', 'interview-next-action');
      next.append(
        makeElement('strong', '', '下一步'),
        makeElement('span', '', view.application.nextAction),
      );
      if (view.application.nextActionOn) {
        const time = makeElement('time', '', formatDate(view.application.nextActionOn));
        time.dateTime = view.application.nextActionOn;
        next.append(time);
      }
      article.append(next);
    }

    const rounds = makeElement('ol', 'interview-round-list');
    view.rounds.forEach((round) => rounds.append(createRoundItem(round)));
    article.append(rounds);

    const footer = makeElement('footer', 'interview-flow-actions');
    footer.append(
      button('＋ 预约 / 记录下一轮', 'next-round', 'secondary-button', { applicationId: view.application.id }),
      button('编辑流程信息', 'edit-application', 'text-button', { applicationId: view.application.id }),
    );
    let publicationPanel = null;
    if (applicationVisibility(view.application) === 'public') {
      publicationPanel = createPublicationPanel(view);
      const publicationButton = button(
        '整理公开面经',
        'prepare-publication',
        'secondary-button interview-publication-button',
        { applicationId: view.application.id },
      );
      publicationButton.setAttribute('aria-expanded', 'false');
      publicationButton.setAttribute('aria-controls', publicationPanel.id);
      footer.append(publicationButton);
    }
    const questionLink = makeElement('a', 'text-link', '保存本轮题目草稿');
    questionLink.href = root.dataset.manageUrl || '../manage/#capture-workflow';
    footer.append(
      questionLink,
      button('删除整个流程', 'delete-application', 'text-button interview-danger-button', { applicationId: view.application.id }),
    );
    article.append(footer);
    if (publicationPanel) article.append(publicationPanel);
    return article;
  };

  const renderFlows = () => {
    const views = buildApplicationViews(tracker);
    const filtered = filterApplicationViews(views, {
      query: searchInput.value,
      outcome: outcomeFilter.value,
      year: yearFilter.value,
    });
    flowList.replaceChildren(...filtered.map(createFlowCard));

    const roundCount = views.reduce((total, view) => total + view.rounds.length, 0);
    const filteredRoundCount = filtered.reduce((total, view) => total + view.rounds.length, 0);
    const filtering = Boolean(searchInput.value || outcomeFilter.value || yearFilter.value);
    recordCount.textContent = views.length
      ? `${filtering ? `显示 ${filtered.length} / ${views.length} 个流程 · ${filteredRoundCount} 轮记录` : `${views.length} 个流程 · ${roundCount} 轮记录`}`
      : '还没有记录';
    toolbar.hidden = views.length === 0;
    // “彻底删除”也负责清除恢复流程留下的安全副本，因此即使列表为空也要可用。
    clearAllButton.disabled = storageBlocked;
    firstEmpty.hidden = views.length !== 0;
    filterEmpty.hidden = views.length === 0 || filtered.length !== 0;
    flowList.hidden = filtered.length === 0;
    return { total: views.length, visible: filtered.length, visibleRounds: filteredRoundCount };
  };

  const renderAll = () => {
    if (!tracker) return;
    renderStats();
    renderUpcoming();
    renderCompanyOptions();
    renderYearOptions();
    renderFlows();
  };

  const setRoundFieldsEnabled = (enabled) => {
    roundFields.forEach((field) => {
      field.hidden = !enabled;
      field.querySelectorAll('input, select, textarea').forEach((control) => { control.disabled = !enabled; });
    });
  };

  const setApplicationFieldsEnabled = (enabled) => {
    applicationFields.forEach((field) => {
      field.hidden = !enabled;
      field.querySelectorAll('input, select, textarea').forEach((control) => { control.disabled = !enabled; });
    });
  };

  const setIdentityLocked = (locked) => {
    companyInput.readOnly = locked;
    roleInput.readOnly = locked;
    companyInput.setAttribute('aria-describedby', 'interview-company-hint');
    companyHint.textContent = locked
      ? '公司和岗位属于整个流程，本轮编辑时已锁定；需要更正请使用记录卡片中的“编辑流程信息”。'
      : '敏感场景建议用固定匿名代号，同一名称会自动合并公司统计。';
  };

  const setVisibility = (value) => {
    const normalized = value === 'public' ? 'public' : 'private';
    visibilityInputs.forEach((input) => { input.checked = input.value === normalized; });
  };

  const rememberFormTrigger = (trigger) => {
    if (!trigger?.focus) {
      formReturnFocus = { element: addButton };
      return;
    }
    formReturnFocus = {
      element: trigger,
      action: trigger.dataset?.action || '',
      roundId: trigger.dataset?.roundId || '',
      applicationId: trigger.dataset?.applicationId || '',
    };
  };

  const resolveFormReturnFocus = () => {
    const available = (element) => (
      element?.isConnected && !element.disabled && !element.closest('[hidden]')
    );
    if (available(formReturnFocus.element)) return formReturnFocus.element;
    if (formReturnFocus.action) {
      const matching = [...flowList.querySelectorAll(`button[data-action="${formReturnFocus.action}"]`)]
        .find((candidate) => (
          (!formReturnFocus.roundId || candidate.dataset.roundId === formReturnFocus.roundId)
          && (!formReturnFocus.applicationId || candidate.dataset.applicationId === formReturnFocus.applicationId)
        ));
      if (available(matching)) return matching;
    }
    return addButton;
  };

  const resetForm = () => {
    form.reset();
    formModeInput.value = 'round';
    roundIdInput.value = '';
    applicationIdInput.value = '';
    dateInput.value = localDate();
    stageInput.value = 'first';
    outcomeInput.value = 'waiting';
    modeInput.value = 'online';
    ratingInput.value = '0';
    setVisibility('private');
    setRoundFieldsEnabled(true);
    setApplicationFieldsEnabled(true);
    setIdentityLocked(false);
    basicLegend.textContent = '基本信息';
    fieldsetHint.textContent = '带“必填”的 5 项就能保存；同一流程继续面试时，使用记录卡片里的“预约 / 记录下一轮”。';
    moreTitle.textContent = '补充复盘与下一步';
    moreHint.textContent = '选填，但建议面完顺手写';
    moreFields.open = false;
    [...form.elements].forEach((element) => element.removeAttribute?.('aria-invalid'));
    formDirty = false;
  };

  const revealForm = () => {
    formPanel.hidden = false;
    addButton.setAttribute('aria-expanded', 'true');
    window.requestAnimationFrame(() => {
      formTitle.focus({ preventScroll: true });
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
      const top = formPanel.getBoundingClientRect().top + window.scrollY - headerHeight - 14;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  };

  const openNewForm = (trigger = addButton) => {
    if (storageBlocked) return;
    rememberFormTrigger(trigger);
    resetForm();
    formKicker.textContent = '刚面完先速记';
    formTitle.textContent = '新增一场面试';
    saveButton.textContent = '保存记录';
    saveSuccess.hidden = true;
    revealForm();
  };

  const openNextRoundForm = (applicationId, trigger) => {
    const view = getView(applicationId);
    if (!view || storageBlocked) return;
    rememberFormTrigger(trigger);
    resetForm();
    applicationIdInput.value = applicationId;
    companyInput.value = view.company.name;
    roleInput.value = view.application.role;
    sourceInput.value = view.application.source;
    nextActionInput.value = view.application.nextAction;
    nextDateInput.value = view.application.nextActionOn;
    setVisibility(view.application.visibility);
    modeInput.value = view.latestRound?.mode || 'online';
    stageInput.value = nextStage(view.latestRound?.stage);
    outcomeInput.value = 'scheduled';
    setIdentityLocked(true);
    setApplicationFieldsEnabled(false);
    moreTitle.textContent = '补充本轮复盘';
    moreHint.textContent = '可在面试结束后补写';
    moreFields.open = false;
    formKicker.textContent = `${view.company.name} · ${view.application.role}`;
    formTitle.textContent = '预约 / 记录下一轮';
    fieldsetHint.textContent = '这是新的面试轮次，不会覆盖上一轮。已经面完时把“本轮结果”改为待反馈或实际结果。';
    saveButton.textContent = '保存这一轮';
    saveSuccess.hidden = true;
    revealForm();
  };

  const openEditForm = (roundId, trigger) => {
    const context = getRoundContext(roundId);
    if (!context || storageBlocked) return;
    rememberFormTrigger(trigger);
    const { round, view } = context;
    resetForm();
    roundIdInput.value = round.id;
    applicationIdInput.value = view.application.id;
    companyInput.value = view.company.name;
    roleInput.value = view.application.role;
    dateInput.value = round.date;
    stageInput.value = round.stage;
    outcomeInput.value = roundOutcome(round);
    modeInput.value = round.mode;
    ratingInput.value = String(round.rating || 0);
    sourceInput.value = view.application.source;
    nextActionInput.value = view.application.nextAction;
    nextDateInput.value = view.application.nextActionOn;
    setVisibility(view.application.visibility);
    reflectionInput.value = round.reflection;
    setIdentityLocked(true);
    setApplicationFieldsEnabled(false);
    moreTitle.textContent = '补充本轮复盘';
    moreHint.textContent = '自我感觉与改进动作';
    moreFields.open = Boolean(round.rating || round.reflection);
    formKicker.textContent = `${view.company.name} · ${view.application.role}`;
    formTitle.textContent = '编辑本轮记录';
    fieldsetHint.textContent = '这里只修改当前轮次的日期、结果和复盘；公司、岗位及流程待办请使用“编辑流程信息”。';
    saveButton.textContent = '保存修改';
    saveSuccess.hidden = true;
    revealForm();
  };

  const openEditApplicationForm = (applicationId, trigger) => {
    const view = getView(applicationId);
    if (!view || storageBlocked) return;
    rememberFormTrigger(trigger);
    resetForm();
    formModeInput.value = 'application';
    applicationIdInput.value = view.application.id;
    companyInput.value = view.company.name;
    roleInput.value = view.application.role;
    sourceInput.value = view.application.source;
    nextActionInput.value = view.application.nextAction;
    nextDateInput.value = view.application.nextActionOn;
    setVisibility(view.application.visibility);
    setRoundFieldsEnabled(false);
    setApplicationFieldsEnabled(true);
    setIdentityLocked(false);
    moreFields.open = true;
    basicLegend.textContent = '流程信息';
    moreTitle.textContent = '来源与下一步';
    moreHint.textContent = '整个流程共用';
    fieldsetHint.textContent = `修改会应用到这个流程下的全部 ${view.rounds.length} 轮记录，轮次日期、结果和复盘不会改变。`;
    formKicker.textContent = `${view.company.name} · ${view.application.role}`;
    formTitle.textContent = '编辑流程信息';
    saveButton.textContent = '保存流程信息';
    saveSuccess.hidden = true;
    revealForm();
  };

  const closeForm = (force = false, restoreFocus = true) => {
    if (!force && formDirty && !window.confirm('表单里还有未保存的内容，确定关闭吗？')) return;
    formPanel.hidden = true;
    addButton.setAttribute('aria-expanded', 'false');
    resetForm();
    if (restoreFocus) resolveFormReturnFocus().focus({ preventScroll: true });
  };

  const handleStorageFailure = (error) => {
    if (error.code === 'conflict') {
      const latest = readTrackerStorage(storage, storageKey, repositoryId);
      if (latest.data) {
        tracker = latest.data;
        renderAll();
      }
      setAlert('另一个页面更新了记录', '本次修改尚未保存。已载入最新数据，请检查当前表单后再保存一次。');
      announce('另一个页面更新了记录，本次修改尚未保存。');
      return;
    }
    if (error.code === 'corrupt') {
      loaded = readTrackerStorage(storage, storageKey, repositoryId);
      damagedRaw = loaded.raw || '';
      storageBlocked = true;
      setWriteControls(true);
      setAlert('检测到无法读取的本地记录', '系统已停止写入，原始数据仍保留。请先下载原始数据，再清除或恢复有效的 JSON 备份。', { damaged: true });
      return;
    }
    storageAvailable = false;
    setAlert('浏览器没有保存本次修改', '本页仍可继续使用，但刷新后记录可能丢失。请立即导出临时 JSON，并检查浏览器隐私或存储设置。', { temporary: true });
  };

  const commit = (next, message) => {
    const expectedRevision = tracker.revision;
    if (storageAvailable) {
      try {
        writeTrackerStorage(storage, storageKey, next, expectedRevision, repositoryId);
        clearAlert();
      } catch (error) {
        handleStorageFailure(error);
        if (error.code !== 'unavailable') return false;
      }
    }
    tracker = next;
    renderAll();
    announce(message);
    return true;
  };

  const formValues = () => ({
    roundId: roundIdInput.value,
    applicationId: applicationIdInput.value,
    company: companyInput.value,
    role: roleInput.value,
    visibility: visibilityInputs.find((input) => input.checked)?.value || 'private',
    date: dateInput.value,
    stage: stageInput.value,
    outcome: outcomeInput.value,
    mode: modeInput.value,
    rating: ratingInput.value,
    source: sourceInput.value,
    nextAction: nextActionInput.value,
    nextActionOn: nextDateInput.value,
    reflection: reflectionInput.value,
  });

  const clearFilters = () => {
    searchInput.value = '';
    outcomeFilter.value = '';
    yearFilter.value = '';
    window.clearTimeout(filterAnnouncementTimer);
    renderFlows();
    announce('已清除面试记录筛选。');
  };

  const renderFilteredResults = () => {
    const result = renderFlows();
    window.clearTimeout(filterAnnouncementTimer);
    filterAnnouncementTimer = window.setTimeout(() => {
      announce(result.visible > 0
        ? `筛选后显示 ${result.visible} 个面试流程，共 ${result.visibleRounds} 轮记录。`
        : '没有符合当前筛选条件的面试流程。');
    }, 250);
  };

  const publicationPanelFor = (applicationId) => document.getElementById(`interview-publication-${applicationId}`);

  const publicationButtonFor = (applicationId) => (
    [...flowList.querySelectorAll('button[data-action="prepare-publication"]')]
      .find((candidate) => candidate.dataset.applicationId === applicationId)
  );

  const openPublicationPanel = (applicationId, trigger) => {
    const panel = publicationPanelFor(applicationId);
    if (!panel) return;
    panel.hidden = false;
    trigger?.setAttribute('aria-expanded', 'true');
    panel.querySelector('h4')?.focus({ preventScroll: true });
    panel.scrollIntoView({ block: 'nearest' });
  };

  const closePublicationPanel = (applicationId) => {
    const panel = publicationPanelFor(applicationId);
    const trigger = publicationButtonFor(applicationId);
    if (!panel) return;
    panel.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.focus({ preventScroll: true });
  };

  const copyPublication = async (applicationId) => {
    const view = getView(applicationId);
    const panel = publicationPanelFor(applicationId);
    const status = panel?.querySelector('.interview-publication-status');
    if (!view || !panel || !status || applicationVisibility(view.application) !== 'public') return;
    try {
      await copyText(buildPublicExperienceDraft(view));
      status.textContent = '匿名草稿已复制。进入整理页后仍需人工检查，并再次确认发布。';
      announce('匿名面经草稿已复制。');
    } catch {
      status.textContent = '复制失败，请手动选中上方预览文本后复制。';
      announce('匿名草稿复制失败。');
    }
  };

  const showSaveSuccess = (message) => {
    const summary = summarizeTracker(tracker, localDate());
    saveSuccessTitle.textContent = `${message}：已面 ${summary.interviewedCompanies} 家公司，共 ${summary.completedRounds} 轮`;
    saveSuccess.hidden = false;
    saveSuccess.focus({ preventScroll: true });
    const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
    const top = saveSuccess.getBoundingClientRect().top + window.scrollY - headerHeight - 14;
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (storageBlocked || !form.reportValidity()) return;
    try {
      const values = formValues();
      const editingApplication = formModeInput.value === 'application';
      const next = editingApplication ? updateApplication(tracker, values, {
        idFactory: makeId,
        repositoryId,
        now: new Date().toISOString(),
      }) : upsertInterview(tracker, values, {
        idFactory: makeId,
        repositoryId,
        now: new Date().toISOString(),
      });
      const edited = Boolean(roundIdInput.value);
      const message = editingApplication ? '面试流程信息已更新。' : (edited ? '本轮面试记录已更新。' : '面试记录已保存。');
      if (commit(next, message)) {
        formDirty = false;
        closeForm(true, false);
        showSaveSuccess(editingApplication ? '流程信息已更新' : '面试记录已保存');
      }
    } catch (error) {
      const field = error.field ? form.elements.namedItem(error.field) : null;
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
      }
      announce(error.message || '记录未保存，请检查表单。');
    }
  });

  form.addEventListener('input', (event) => {
    formDirty = true;
    event.target.removeAttribute?.('aria-invalid');
  });

  addButton.addEventListener('click', (event) => (formPanel.hidden ? openNewForm(event.currentTarget) : closeForm()));
  emptyAddButton.addEventListener('click', (event) => openNewForm(event.currentTarget));
  formCloseButton.addEventListener('click', () => closeForm());
  cancelButton.addEventListener('click', () => closeForm());

  flowList.addEventListener('click', async (event) => {
    const target = event.target.closest('button[data-action]');
    if (!target) return;
    const { action, roundId, applicationId } = target.dataset;

    if (action === 'edit-round') openEditForm(roundId, target);
    if (action === 'next-round') openNextRoundForm(applicationId, target);
    if (action === 'edit-application') openEditApplicationForm(applicationId, target);
    if (action === 'prepare-publication') openPublicationPanel(applicationId, target);
    if (action === 'close-publication') closePublicationPanel(applicationId);
    if (action === 'copy-publication') await copyPublication(applicationId);

    if (action === 'delete-round') {
      const context = getRoundContext(roundId);
      if (!context || !window.confirm(`删除 ${context.view.company.name} 的这轮面试记录？此操作无法撤销。`)) return;
      const next = removeRound(tracker, roundId, { repositoryId, now: new Date().toISOString() });
      commit(next, '这一轮面试记录已删除。');
    }

    if (action === 'delete-application') {
      const view = getView(applicationId);
      if (!view || !window.confirm(`删除 ${view.company.name} · ${view.application.role} 的整个流程和 ${view.rounds.length} 轮记录？此操作无法撤销。`)) return;
      const next = removeApplication(tracker, applicationId, { repositoryId, now: new Date().toISOString() });
      commit(next, '整个面试流程已删除。');
    }
  });

  searchInput.addEventListener('input', renderFilteredResults);
  outcomeFilter.addEventListener('change', renderFilteredResults);
  yearFilter.addEventListener('change', renderFilteredResults);
  clearFiltersButton.addEventListener('click', clearFilters);
  filterEmptyClearButton.addEventListener('click', clearFilters);

  exportJsonButton.addEventListener('click', () => {
    const backup = createTrackerBackup(tracker);
    downloadText(backupFilename('json'), JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
    announce('JSON 备份已导出。');
  });

  exportCsvButton.addEventListener('click', () => {
    downloadText(backupFilename('csv'), `\uFEFF${trackerToCsv(tracker)}`, 'text/csv;charset=utf-8');
    announce('CSV 表格已导出。');
  });

  importJsonButton.addEventListener('click', () => importFileInput.click());

  importFileInput.addEventListener('change', async () => {
    const [file] = importFileInput.files;
    importFileInput.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      announce('备份文件超过 5 MB，已停止导入。');
      return;
    }

    try {
      const parsed = parseTrackerBackup(await file.text(), { repositoryId });
      const crossRepositoryText = parsed.crossRepository ? ' 这份备份来自另一个仓库，导入后会改为当前题库。' : '';
      const message = `备份中有 ${parsed.data.companies.length} 家公司、${parsed.data.applications.length} 个流程和 ${parsed.data.rounds.length} 轮记录。${crossRepositoryText}确定与当前记录合并吗？同编号内容冲突时会保留本机版本。`;
      if (!window.confirm(message)) return;

      let preserved = false;
      if (storageAvailable) {
        let currentRaw = '';
        try { currentRaw = storage.getItem(storageKey) || ''; } catch { currentRaw = ''; }
        preserved = preserveTrackerBackup(storage, storageKey, currentRaw || damagedRaw);
      }

      if (storageBlocked) {
        if (!preserved && !damagedRawDownloaded) {
          setAlert('还不能替换损坏数据', '浏览器无法保存安全副本。请先点击“下载原始数据”，再重新恢复 JSON。', { damaged: true });
          return;
        }
        if (!clearTrackerStorage(storage, storageKey)) throw new Error('浏览器未能清除损坏数据，请检查站点存储设置。');
        tracker = createEmptyTracker(repositoryId);
        storageBlocked = false;
        damagedRaw = '';
        damagedRawDownloaded = false;
        setWriteControls(false);
      }

      let conflictCount = 0;
      const next = mergeTrackers(tracker, parsed.data, {
        repositoryId,
        now: new Date().toISOString(),
        onConflict: () => { conflictCount += 1; },
      });
      if (commit(next, `已恢复 ${parsed.data.rounds.length} 轮面试记录。`)) {
        closeForm(true);
        if (conflictCount > 0) {
          setAlert('备份已合并，本机内容已保留', `发现 ${conflictCount} 条同编号内容冲突，没有覆盖本机版本。如果需要完全替换，请先导出本机备份、清空记录，再重新导入。`);
        }
      }
    } catch (error) {
      announce(error.message || '无法读取这份备份。');
      setAlert('备份没有导入', error.message || '文件格式无效，请选择本页面导出的 JSON 备份。');
    }
  });

  clearAllButton.addEventListener('click', () => {
    if (!window.confirm('确定彻底删除本机的全部公司、流程、面试记录和系统安全副本吗？建议先导出 JSON 备份。此操作无法撤销。')) return;
    if (storageAvailable && !clearTrackerStorage(storage, storageKey, { includeBackup: true })) {
      setAlert('没有彻底删除本机记录', '浏览器拒绝了删除操作，仍可能保留记录或安全副本。请检查站点存储设置后重试。');
      return;
    }
    tracker = createEmptyTracker(repositoryId);
    saveSuccess.hidden = true;
    closeForm(true);
    renderAll();
    announce('本机面试记录和系统安全副本已彻底删除。');
  });

  downloadRawButton.addEventListener('click', () => {
    if (!damagedRaw) return;
    downloadText(`面试记录-无法读取的原始数据-${localDate()}.txt`, damagedRaw, 'text/plain;charset=utf-8');
    damagedRawDownloaded = true;
    announce('原始数据已下载。');
  });

  alertExportButton.addEventListener('click', () => {
    const backup = createTrackerBackup(tracker);
    downloadText(backupFilename('json'), JSON.stringify(backup, null, 2), 'application/json;charset=utf-8');
    announce('临时 JSON 已导出，请在关闭或刷新页面前妥善保存。');
  });

  clearDamagedButton.addEventListener('click', () => {
    if (!window.confirm('清除当前无法读取的记录？系统会先尝试保存安全副本；如果浏览器空间不足，你需要先下载原始数据。')) return;
    const preserved = preserveTrackerBackup(storage, storageKey, damagedRaw);
    if (!preserved && !damagedRawDownloaded) {
      setAlert('还不能清除损坏数据', '浏览器无法保存安全副本。请先点击“下载原始数据”，再重新清除。', { damaged: true });
      return;
    }
    if (!clearTrackerStorage(storage, storageKey)) {
      setAlert('没有清除损坏数据', '浏览器拒绝了清除操作，原始数据仍保留。请检查站点存储设置。', { damaged: true });
      return;
    }
    tracker = createEmptyTracker(repositoryId);
    damagedRaw = '';
    damagedRawDownloaded = false;
    storageBlocked = false;
    setWriteControls(false);
    clearAlert();
    renderAll();
    announce('损坏数据已清除，可以重新记录或恢复 JSON 备份。');
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey) return;
    const latest = readTrackerStorage(storage, storageKey, repositoryId);
    if (!formPanel.hidden) {
      setAlert('另一个页面更新了记录', '当前表单基于旧版本，本页没有自动替换。保存时会先检测冲突；也可以关闭表单后刷新最新数据。');
      announce('另一个页面更新了面试记录。');
      return;
    }
    if (latest.data) {
      tracker = latest.data;
      renderAll();
      announce('已同步另一个标签页中的最新面试记录。');
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!formDirty || formPanel.hidden) return;
    event.preventDefault();
    event.returnValue = '';
  });

  if (loaded.status === 'unavailable') {
    setAlert('浏览器无法持久保存记录', '本页仍可临时使用，但刷新后内容可能丢失。请导出临时 JSON，并检查无痕模式、站点存储或浏览器隐私设置。', { temporary: true });
  } else if (loaded.status === 'corrupt') {
    tracker = createEmptyTracker(repositoryId);
    setWriteControls(true);
    setAlert('检测到无法读取的本地记录', '系统没有删除或覆盖原始数据。请先下载原始数据，再清除损坏数据或恢复有效的 JSON 备份。', { damaged: true });
  }

  resetForm();
  renderAll();

  saveSuccessClose.addEventListener('click', () => {
    saveSuccess.hidden = true;
    resolveFormReturnFocus().focus({ preventScroll: true });
  });
})();
