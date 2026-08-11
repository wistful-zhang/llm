import { prepareKramdownMath, renderMathElements } from './math-render.mjs';
import { validatePlainTextMath } from './latex-input-core.mjs';

const article = document.querySelector('[data-public-question]');
if (article) {
  const mathRoots = [];
  const title = article.querySelector('.question-header h1');
  if (
    title
    && validatePlainTextMath(title.textContent || '').length === 0
    && prepareKramdownMath(title, { forceInline: true })
  ) mathRoots.push(title);
  const followUps = [...article.querySelectorAll('.question-followups li')];
  followUps.forEach((followUp) => {
    if (
      validatePlainTextMath(followUp.textContent || '').length === 0
      && prepareKramdownMath(followUp, { forceInline: true })
    ) mathRoots.push(followUp);
  });
  const answer = article.querySelector('[data-question-answer]');
  if (answer) mathRoots.push(answer);
  void renderMathElements(mathRoots);
}
