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
    startButton.textContent = '再答一次';
    status.textContent = '参考内容已显示：先对照“面试时怎么答”，再看完整知识点。';

    const answerGuide = [...answer.querySelectorAll('h2')]
      .find((heading) => heading.textContent.trim() === '面试时怎么答');
    const answerTarget = answerGuide || answer;
    answerTarget.tabIndex = -1;
    answerTarget.focus({ preventScroll: true });
    answerTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    status.textContent = '正在口述：直接回答这道题，用自己的话把关键点讲清楚。';
    coach.scrollIntoView({ behavior: 'smooth', block: 'start' });

    timerId = window.setInterval(() => {
      remainingSeconds -= 1;
      updateTimer();
      if (remainingSeconds <= 0) {
        stopTimer();
        status.textContent = '时间到。如果已经说清楚就收尾，再看参考说法对照。';
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
