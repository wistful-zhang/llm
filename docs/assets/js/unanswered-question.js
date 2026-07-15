import { buildAnswerPrompt, normalizeQuestionTitle } from './unanswered-core.mjs';

(() => {
  const panel = document.querySelector('[data-unanswered-question]');
  if (!panel) return;

  const title = normalizeQuestionTitle(panel.dataset.questionTitle);
  const controls = panel.querySelector('[data-copy-controls]');
  const promptButton = panel.querySelector('[data-copy-answer-prompt]');
  const questionButton = panel.querySelector('[data-copy-question]');
  const status = panel.querySelector('[data-copy-status]');
  if (!controls || !promptButton || !questionButton || !status || !title) return;

  const copyText = async (value) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return;
      } catch {
        // Some browsers expose Clipboard API but deny it; use the legacy fallback below.
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

  const handleCopy = async (value, successMessage) => {
    try {
      await copyText(value);
      status.textContent = successMessage;
    } catch {
      status.textContent = '复制失败，请手动选中题目后复制。';
    }
  };

  controls.hidden = false;
  promptButton.addEventListener('click', () => handleCopy(
    buildAnswerPrompt(title),
    '补答指令已复制。回到 Codex 粘贴即可。',
  ));
  questionButton.addEventListener('click', () => handleCopy(
    title,
    '题目已复制。',
  ));
})();
