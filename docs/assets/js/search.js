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
  const studyTier = document.querySelector('#question-study-tier');
  const difficulty = document.querySelector('#question-difficulty');
  const reviewState = document.querySelector('#question-review-state');
  const questionList = document.querySelector('#question-list');
  const cards = [...document.querySelectorAll('.question-card')];
  const filters = [...document.querySelectorAll('.filter')];
  const empty = document.querySelector('#empty-state');
  const status = document.querySelector('#result-status');
  const summary = document.querySelector('#library-result-summary');
  const loadMore = document.querySelector('#question-load-more');

  if (!search || !empty) return;

  let activeCategory = null;
  let answerIndexState = 'idle';
  let answerIndexPromise = null;
  let lastIndexFailureAt = 0;
  let visibleLimit = 60;
  const answerSearchById = new Map();
  const pageSize = 60;

  const normalize = (value) => String(value || '').trim().toLocaleLowerCase();

  const setIndexEntries = (entries) => {
    if (!Array.isArray(entries)) throw new Error('答案搜索索引格式无效');
    entries.forEach((entry) => {
      if (!entry || typeof entry.id !== 'string' || typeof entry.search !== 'string') return;
      answerSearchById.set(entry.id, normalize(entry.search));
    });
  };

  const update = () => {
    const keyword = normalize(search.value);
    const activeStudyTier = studyTier?.value || '';
    const activeDifficulty = difficulty?.value || '';
    const activeReviewState = reviewState?.value || '';
    let matchingCount = 0;
    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesCategory = activeCategory === null || card.dataset.category === activeCategory;
      const matchesStudyTier = !activeStudyTier || card.dataset.studyTier === activeStudyTier;
      const matchesDifficulty = !activeDifficulty || card.dataset.difficulty === activeDifficulty;
      const cardReviewState = card.dataset.answerStatus === 'pending'
        ? 'pending'
        : (card.dataset.verified === 'true' ? 'verified' : 'review');
      const matchesReviewState = !activeReviewState || cardReviewState === activeReviewState;
      const metadata = normalize(card.dataset.search || '');
      const answer = answerSearchById.get(card.dataset.searchId) || '';
      const matchesKeyword = !keyword || metadata.includes(keyword) || answer.includes(keyword);
      const matches = matchesCategory && matchesStudyTier && matchesDifficulty && matchesReviewState && matchesKeyword;
      if (matches) matchingCount += 1;
      const visible = matches && matchingCount <= visibleLimit;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (cards.length === 0) {
      empty.textContent = '题库还没有公开内容；“＋题目”可以只留在本机，也可以在 GitHub 确认后公开给大家。';
    } else if (answerIndexState === 'failed' && keyword) {
      empty.textContent = '题目、分类和标签中没有匹配项；答案全文暂时无法搜索，请稍后重试。';
    } else {
      empty.textContent = activeStudyTier
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

  search.addEventListener('input', () => {
    visibleLimit = pageSize;
    update();
    if (normalize(search.value)) void loadAnswerIndex();
  });
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && search.value) {
      search.value = '';
      visibleLimit = pageSize;
      update();
    }
  });

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.hasAttribute('data-filter-all') ? null : button.dataset.category;
      visibleLimit = pageSize;
      filters.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      update();
    });
  });

  difficulty?.addEventListener('change', () => {
    visibleLimit = pageSize;
    update();
  });

  studyTier?.addEventListener('change', () => {
    visibleLimit = pageSize;
    update();
  });

  reviewState?.addEventListener('change', () => {
    visibleLimit = pageSize;
    update();
  });

  loadMore?.addEventListener('click', () => {
    const previouslyVisible = visibleLimit;
    visibleLimit += pageSize;
    update();
    const firstNewCard = cards.filter((card) => !card.hidden)[previouslyVisible];
    firstNewCard?.focus();
  });

  update();
  if (normalize(search.value)) void loadAnswerIndex();
})();
