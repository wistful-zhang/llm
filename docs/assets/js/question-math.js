import { renderMath } from './math-render.mjs';

const answer = document.querySelector('[data-question-answer]');
if (answer) void renderMath(answer);
