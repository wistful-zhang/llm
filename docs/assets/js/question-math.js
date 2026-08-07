import { prepareKramdownMath, renderMath } from './math-render.mjs';

const article = document.querySelector('[data-public-question]');
if (article) {
  const title = article.querySelector('.question-header h1');
  if (title) prepareKramdownMath(title, { forceInline: true });
  article.querySelectorAll('.question-followups li')
    .forEach((followUp) => prepareKramdownMath(followUp, { forceInline: true }));
  void renderMath(article);
}
