(() => {
  document.querySelectorAll('[data-open-details]').forEach((link) => {
    link.addEventListener('click', () => {
      const details = document.getElementById(link.dataset.openDetails);
      if (details?.tagName === 'DETAILS') details.open = true;
    });
  });

  const resolveTemplateLinks = async () => {
    const links = [...document.querySelectorAll('[data-template-repository]')];
    if (links.length === 0) return;

    const useRepositoryFallback = () => {
      links.forEach((link) => { link.textContent = '打开 GitHub 仓库，再点 Use this template ↗'; });
    };

    const repository = links[0].dataset.templateRepository;
    const [owner, name] = (repository || '').split('/');
    if (!owner || !name) {
      useRepositoryFallback();
      return;
    }

    try {
      const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) {
        useRepositoryFallback();
        return;
      }

      const current = await response.json();
      const usesCurrentRepository = current.is_template === true;
      const parentTemplate = current.parent?.is_template
        ? current.parent
        : current.parent?.template_repository;
      const template = usesCurrentRepository
        ? current
        : current.template_repository || parentTemplate;
      if (!template?.html_url) {
        useRepositoryFallback();
        return;
      }

      links.forEach((link) => {
        link.href = `${template.html_url.replace(/\/$/, '')}/generate`;
        link.textContent = usesCurrentRepository
          ? '复制当前题库到自己的 GitHub ↗'
          : '从基础模板创建（不含本站新增内容） ↗';
      });
    } catch {
      // 网络或 API 限流时保留仓库首页链接，并说明仍需手动点击模板按钮。
      useRepositoryFallback();
    }
  };

  resolveTemplateLinks();

  const search = document.querySelector('#question-search');
  const track = document.querySelector('#question-track');
  const studyTier = document.querySelector('#question-study-tier');
  const difficulty = document.querySelector('#question-difficulty');
  const reviewState = document.querySelector('#question-review-state');
  const questionList = document.querySelector('#question-list');
  const filters = [...document.querySelectorAll('.filter[data-filter-all], .filter[data-category]')];
  const clearFilters = document.querySelector('#question-clear-filters');
  const empty = document.querySelector('#empty-state');
  const status = document.querySelector('#result-status');
  const summary = document.querySelector('#library-result-summary');
  const loadMore = document.querySelector('#question-load-more');
  const total = document.querySelector('[data-question-total]');

  if (!search || !empty) return;

  let activeCategory = null;
  let answerIndexState = 'idle';
  let answerIndexPromise = null;
  let lastIndexFailureAt = 0;
  let visibleLimit = 60;
  let requestedFocusId = '';
  let publicQuestionsSettled = document.querySelector('[data-public-questions]')
    ?.dataset.publicQuestionsSettled === 'true';
  const answerSearchById = new Map();
  const pageSize = 60;
  const defaultStudyTier = studyTier?.dataset.defaultTier || '';
  const repositoryId = questionList?.dataset.repositoryId
    || `${window.location.host}${window.location.pathname}`;
  const preferenceStorageKey = `llm-interview-practice:${repositoryId}:preferences:v1`;

  const normalize = (value) => String(value || '').trim().toLocaleLowerCase();
  const currentCards = () => (
    questionList ? [...questionList.querySelectorAll('.question-card')] : []
  );

  const setIndexEntries = (entries) => {
    if (!Array.isArray(entries)) throw new Error('答案搜索索引格式无效');
    entries.forEach((entry) => {
      if (!entry || typeof entry.id !== 'string' || typeof entry.search !== 'string') return;
      answerSearchById.set(entry.id, normalize(entry.search));
    });
  };

  const selectedTrackCategories = () => new Set(
    (track?.options[track.selectedIndex]?.dataset.categories || '')
      .split('|')
      .map((category) => category.trim())
      .filter(Boolean),
  );

  const update = () => {
    const cards = currentCards();
    const requestedCard = requestedFocusId
      ? cards.find((card) => card.dataset.searchId === requestedFocusId)
      : null;
    if (requestedCard && publicQuestionsSettled) {
      search.value = '';
      if (track) track.value = '';
      if (studyTier) studyTier.value = '';
      if (difficulty) difficulty.value = '';
      if (reviewState) reviewState.value = '';
      setActiveCategory();
      visibleLimit = Math.max(visibleLimit, cards.indexOf(requestedCard) + 1);
      requestedFocusId = '';
    }
    const keyword = normalize(search.value);
    const activeStudyTier = studyTier?.value || '';
    const activeDifficulty = difficulty?.value || '';
    const activeReviewState = reviewState?.value || '';
    const trackCategories = selectedTrackCategories();
    const categoryCounts = new Map(filters.map((button) => [button.dataset.category || '', 0]));
    let matchingCount = 0;
    let visibleCount = 0;
    let allCategoryCount = 0;

    cards.forEach((card) => {
      const cardStudyTier = card.dataset.studyTier || 'unclassified';
      const matchesRecommendedRoute = cardStudyTier === 'core' || (
        cardStudyTier === 'role'
        && trackCategories.size > 0
        && trackCategories.has(card.dataset.category)
      );
      const matchesExactScope = (
        (!activeStudyTier || cardStudyTier === activeStudyTier)
        && (
          trackCategories.size === 0
          || activeStudyTier === 'core'
          || trackCategories.has(card.dataset.category)
        )
      );
      const matchesStudyScope = activeStudyTier === 'recommended'
        ? matchesRecommendedRoute
        : matchesExactScope;
      const matchesDifficulty = !activeDifficulty || card.dataset.difficulty === activeDifficulty;
      const cardReviewState = card.dataset.answerStatus === 'pending'
        ? 'pending'
        : (card.dataset.verified === 'true' ? 'verified' : 'review');
      const matchesReviewState = !activeReviewState || cardReviewState === activeReviewState;
      const metadata = normalize(card.dataset.search || '');
      const answer = answerSearchById.get(card.dataset.searchId) || '';
      const matchesKeyword = !keyword || metadata.includes(keyword) || answer.includes(keyword);
      const matchesBase = matchesStudyScope && matchesDifficulty && matchesReviewState && matchesKeyword;
      const matchesCategory = activeCategory === null || card.dataset.category === activeCategory;
      const matches = matchesBase && matchesCategory;

      if (matchesBase) {
        allCategoryCount += 1;
        categoryCounts.set(
          card.dataset.category,
          (categoryCounts.get(card.dataset.category) || 0) + 1,
        );
      }
      if (matches) matchingCount += 1;
      const visible = matches && matchingCount <= visibleLimit;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    filters.forEach((button) => {
      const count = button.hasAttribute('data-filter-all')
        ? allCategoryCount
        : (categoryCounts.get(button.dataset.category) || 0);
      const label = button.dataset.label || button.textContent.replace(/\s*（\d+）$/, '');
      button.textContent = `${label}（${count}）`;
      button.disabled = count === 0 && button.dataset.category !== activeCategory;
    });

    if (total) total.textContent = String(cards.length);

    if (cards.length === 0) {
      empty.textContent = '题库还没有内容；点击“＋增加题目”即可添加公开题或私人题。';
    } else if (answerIndexState === 'failed' && keyword) {
      empty.textContent = '题目、分类和标签中没有匹配项；答案全文暂时无法搜索，请稍后重试。';
    } else if (activeStudyTier === 'recommended' && !track?.value) {
      empty.textContent = '请先选择一个目标方向，或把备考层级切回“核心必会”。';
    } else {
      empty.textContent = activeStudyTier || track?.value
        ? '当前备考层级没有匹配题目；可以更换层级或关键词。'
        : '没有找到匹配的题目，换个关键词试试。';
    }

    const loadingAnswers = Boolean(keyword) && answerIndexState === 'loading';
    empty.hidden = visibleCount !== 0 || loadingAnswers;
    const remaining = Math.max(0, matchingCount - visibleCount);
    if (summary) {
      summary.textContent = loadingAnswers
        ? `已显示 ${visibleCount} 道，正在继续搜索答案全文…`
        : (matchingCount === visibleCount
          ? `共 ${matchingCount} 道符合条件`
          : `已显示 ${visibleCount} / ${matchingCount} 道符合条件`);
    }
    if (loadMore) {
      loadMore.hidden = loadingAnswers || remaining === 0;
      loadMore.textContent = `再显示 ${Math.min(pageSize, remaining)} 道`;
    }
    if (status) {
      const scopeStatus = loadingAnswers
        ? '，正在继续搜索答案全文'
        : (keyword && answerIndexState === 'failed' ? '；答案全文暂时无法搜索' : '');
      status.textContent = `当前显示 ${visibleCount} / ${matchingCount} 道题目${scopeStatus}`;
    }
    if (requestedCard && publicQuestionsSettled) {
      const url = new URL(window.location.href);
      url.searchParams.delete('focus');
      url.searchParams.delete('q');
      url.searchParams.delete('track');
      url.searchParams.delete('tier');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
      requestedCard.classList.add('is-newly-added');
      window.requestAnimationFrame(() => {
        requestedCard.focus({ preventScroll: true });
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        requestedCard.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      });
      window.setTimeout(() => requestedCard.classList.remove('is-newly-added'), 5000);
    }
  };

  const loadAnswerIndex = () => {
    const indexUrl = questionList?.dataset.searchIndexUrl;
    if (!indexUrl || answerIndexState === 'loaded') return Promise.resolve();
    if (answerIndexPromise) return answerIndexPromise;
    if (answerIndexState === 'failed' && Date.now() - lastIndexFailureAt < 10000) return Promise.resolve();

    answerIndexState = 'loading';
    update();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    answerIndexPromise = fetch(indexUrl, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'force-cache',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`答案搜索索引加载失败（${response.status}）`);
        return response.json();
      })
      .then((entries) => {
        answerSearchById.clear();
        setIndexEntries(entries);
        answerIndexState = 'loaded';
      })
      .catch(() => {
        answerSearchById.clear();
        answerIndexState = 'failed';
        lastIndexFailureAt = Date.now();
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        answerIndexPromise = null;
        update();
      });
    return answerIndexPromise;
  };

  const setActiveCategory = (category = null) => {
    activeCategory = category;
    filters.forEach((button) => {
      const active = category === null
        ? button.hasAttribute('data-filter-all')
        : button.dataset.category === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const findOption = (select, value) => (
    select ? [...select.options].find((option) => option.value === value) : null
  );

  const writeTrackPreference = () => {
    try {
      window.localStorage.setItem(preferenceStorageKey, JSON.stringify({ trackId: track?.value || '' }));
    } catch {
      // 隐私模式或存储受限时仍可在当前页面使用筛选。
    }
  };

  const syncRouteUrl = () => {
    const url = new URL(window.location.href);
    const keyword = search.value.trim().slice(0, 160);
    if (keyword) url.searchParams.set('q', keyword);
    else url.searchParams.delete('q');
    if (track?.value) url.searchParams.set('track', track.value);
    else url.searchParams.delete('track');
    if (studyTier?.value && (studyTier.value !== defaultStudyTier || track?.value)) {
      url.searchParams.set('tier', studyTier.value);
    } else {
      url.searchParams.delete('tier');
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const applyInitialRoute = () => {
    const params = new URLSearchParams(window.location.search);
    const requestedFocus = params.get('focus') || '';
    if (/^(?:local|shared):[A-Za-z0-9:_-]{1,120}$/.test(requestedFocus)) {
      requestedFocusId = requestedFocus;
    }
    const requestedKeyword = params.get('q');
    if (requestedKeyword) search.value = requestedKeyword.slice(0, 160);
    let storedTrack = '';
    try {
      storedTrack = JSON.parse(window.localStorage.getItem(preferenceStorageKey) || '{}').trackId || '';
    } catch {
      storedTrack = '';
    }
    const requestedTrack = params.has('track') ? params.get('track') : storedTrack;
    const trackOption = findOption(track, requestedTrack);
    if (trackOption) {
      track.value = trackOption.value;
      if (params.has('track')) writeTrackPreference();
    }

    const requestedTier = params.get('tier');
    const tierOption = findOption(studyTier, requestedTier);
    if (tierOption) {
      studyTier.value = tierOption.value;
    } else if (track?.value) {
      studyTier.value = 'recommended';
    }
  };

  search.addEventListener('input', () => {
    visibleLimit = pageSize;
    syncRouteUrl();
    update();
    if (normalize(search.value)) void loadAnswerIndex();
  });
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && search.value) {
      search.value = '';
      visibleLimit = pageSize;
      syncRouteUrl();
      update();
    }
  });

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      setActiveCategory(button.hasAttribute('data-filter-all') ? null : button.dataset.category);
      visibleLimit = pageSize;
      update();
    });
  });

  difficulty?.addEventListener('change', () => {
    visibleLimit = pageSize;
    update();
  });

  studyTier?.addEventListener('change', () => {
    setActiveCategory();
    syncRouteUrl();
    visibleLimit = pageSize;
    update();
  });

  track?.addEventListener('change', () => {
    setActiveCategory();
    if (studyTier) studyTier.value = track.value ? 'recommended' : defaultStudyTier;
    writeTrackPreference();
    syncRouteUrl();
    visibleLimit = pageSize;
    update();
  });

  reviewState?.addEventListener('change', () => {
    visibleLimit = pageSize;
    update();
  });

  clearFilters?.addEventListener('click', () => {
    search.value = '';
    if (track) track.value = '';
    if (studyTier) studyTier.value = defaultStudyTier;
    if (difficulty) difficulty.value = '';
    if (reviewState) reviewState.value = '';
    setActiveCategory();
    writeTrackPreference();
    syncRouteUrl();
    visibleLimit = pageSize;
    update();
    search.focus();
  });

  loadMore?.addEventListener('click', () => {
    const previouslyVisible = visibleLimit;
    visibleLimit += pageSize;
    update();
    const firstNewCard = currentCards().filter((card) => !card.hidden)[previouslyVisible];
    firstNewCard?.focus();
  });

  document.addEventListener('question-library:changed', () => {
    update();
  });
  document.addEventListener('question-library:public-settled', () => {
    publicQuestionsSettled = true;
    update();
  });

  applyInitialRoute();
  update();
  if (normalize(search.value)) void loadAnswerIndex();
})();
