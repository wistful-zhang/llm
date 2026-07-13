(() => {
  const search = document.querySelector('#question-search');
  const cards = [...document.querySelectorAll('.question-card')];
  const filters = [...document.querySelectorAll('.filter')];
  const empty = document.querySelector('#empty-state');
  const status = document.querySelector('#result-status');

  if (!search || !empty) return;

  let activeCategory = 'all';

  const normalize = (value) => value.trim().toLocaleLowerCase();

  const update = () => {
    const keyword = normalize(search.value);
    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
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

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      filters.forEach((item) => item.classList.toggle('active', item === button));
      update();
    });
  });

  update();
})();
