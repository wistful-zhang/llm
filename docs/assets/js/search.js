(() => {
  const search = document.querySelector('#question-search');
  const cards = [...document.querySelectorAll('.question-card')];
  const filters = [...document.querySelectorAll('.filter')];
  const empty = document.querySelector('#empty-state');

  if (!search || cards.length === 0) return;

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

    empty.hidden = visibleCount !== 0;
  };

  search.addEventListener('input', update);

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      filters.forEach((item) => item.classList.toggle('active', item === button));
      update();
    });
  });
})();

