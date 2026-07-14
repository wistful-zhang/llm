import { DEFAULT_ANSWER_SECONDS, formatCountdown } from './question-coach-core.mjs';

(() => {
  const coach = document.querySelector('[data-question-coach]');
  const answer = document.querySelector('[data-question-answer]');
  if (!coach || !answer) return;

  const controls = coach.querySelector('[data-coach-controls]');
  const startButton = coach.querySelector('[data-coach-start]');
  const revealButton = coach.querySelector('[data-coach-reveal]');
  const timerOutput = coach.querySelector('[data-coach-timer]');
  const status = coach.querySelector('[data-coach-status]');
  if (!controls || !startButton || !revealButton || !timerOutput || !status) return;

  let remainingSeconds = DEFAULT_ANSWER_SECONDS;
  let timerId = null;

  const stopTimer = () => {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
  };

  const updateTimer = () => {
    timerOutput.value = formatCountdown(remainingSeconds);
    timerOutput.textContent = formatCountdown(remainingSeconds);
  };

  const revealAnswer = () => {
    stopTimer();
    answer.hidden = false;
    answer.removeAttribute('aria-hidden');
    coach.classList.remove('is-practicing');
    revealButton.hidden = true;
    startButton.hidden = false;
    startButton.textContent = '重新练一次';
    status.textContent = '答案已显示：先看“面试时怎么答”，再按需展开原理和工程细节。';

    const answerGuide = [...answer.querySelectorAll('h2')]
      .find((heading) => heading.textContent.trim() === '面试时怎么答');
    (answerGuide || answer).scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startPractice = () => {
    stopTimer();
    remainingSeconds = DEFAULT_ANSWER_SECONDS;
    updateTimer();
    answer.hidden = true;
    answer.setAttribute('aria-hidden', 'true');
    coach.classList.add('is-practicing');
    startButton.hidden = true;
    revealButton.hidden = false;
    status.textContent = '正在口述：先结论，再原理和取舍，最后补项目或验证指标。';
    coach.scrollIntoView({ behavior: 'smooth', block: 'start' });

    timerId = window.setInterval(() => {
      remainingSeconds -= 1;
      updateTimer();
      if (remainingSeconds <= 0) {
        stopTimer();
        status.textContent = '时间到。先用一句话收尾，再查看答题方法对照。';
        revealButton.focus();
      }
    }, 1000);
  };

  controls.hidden = false;
  status.hidden = false;
  updateTimer();
  startButton.addEventListener('click', startPractice);
  revealButton.addEventListener('click', revealAnswer);
  window.addEventListener('pagehide', stopTimer);
})();
