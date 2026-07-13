(() => {
  const resolveTemplateLinks = async () => {
    const links = [...document.querySelectorAll('[data-template-repository]')];
    if (links.length === 0) return;

    const repository = links[0].dataset.templateRepository;
    const [owner, name] = (repository || '').split('/');
    if (!owner || !name) return;

    try {
      const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) return;

      const current = await response.json();
      const template = current.is_template ? current : current.template_repository;
      if (!template?.html_url) {
        links.forEach((link) => { link.textContent = '打开 GitHub 仓库（需先开启模板） ↗'; });
        return;
      }

      links.forEach((link) => {
        link.href = `${template.html_url.replace(/\/$/, '')}/generate`;
        link.textContent = '打开 GitHub 模板创建页 ↗';
      });
    } catch {
      // 网络或 API 限流时保留安全的仓库首页链接。
    }
  };

  resolveTemplateLinks();

  const search = document.querySelector('#question-search');
  const cards = [...document.querySelectorAll('.question-card')];
  const filters = [...document.querySelectorAll('.filter')];
  const empty = document.querySelector('#empty-state');
  const status = document.querySelector('#result-status');

  if (!search || !empty) return;

  let activeCategory = null;

  const normalize = (value) => String(value || '').trim().toLocaleLowerCase();

  const update = () => {
    const keyword = normalize(search.value);
    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesCategory = activeCategory === null || card.dataset.category === activeCategory;
      const matchesKeyword = !keyword || normalize(card.dataset.search || '').includes(keyword);
      const visible = matchesCategory && matchesKeyword;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    empty.textContent = cards.length === 0
      ? '题库还没有内容，请从管理后台添加第一道题。'
      : '没有找到匹配的题目，换个关键词试试。';
    empty.hidden = visibleCount !== 0;
    if (status) status.textContent = `当前显示 ${visibleCount} 道题目`;
  };

  search.addEventListener('input', update);
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && search.value) {
      search.value = '';
      update();
    }
  });

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.hasAttribute('data-filter-all') ? null : button.dataset.category;
      filters.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      update();
    });
  });

  update();
})();
