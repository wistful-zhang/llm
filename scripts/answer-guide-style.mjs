export const ANSWER_MARKER = '**可以这样答：**';
export const MIN_SPOKEN_ANSWER_LENGTH = 80;
export const MAX_SPOKEN_ANSWER_LENGTH = 240;

export const parseAnswerGuide = (section) => {
  const markerCount = section.split(ANSWER_MARKER).length - 1;
  const markerIndex = section.indexOf(ANSWER_MARKER);
  const guidanceOnly = markerIndex >= 0 ? section.slice(0, markerIndex) : section;
  const spokenSection = markerIndex >= 0
    ? section.slice(markerIndex + ANSWER_MARKER.length)
    : '';
  const spokenAnswer = spokenSection
    .split(/\r?\n/)
    .filter((line) => /^>\s*/.test(line))
    .map((line) => line.replace(/^>\s*/, ''))
    .join(' ')
    .replace(/[`*_]/g, '')
    .trim();
  const guidanceText = guidanceOnly
    .split(/\r?\n/)
    .filter((line) => !/^>\s*/.test(line))
    .join(' ')
    .replace(/[`*_#>-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    markerCount,
    guidanceOnly,
    spokenSection,
    spokenAnswer,
    guidanceText,
  };
};

export const hasValidSpokenAnswerLength = (answer) =>
  answer.length >= MIN_SPOKEN_ANSWER_LENGTH &&
  answer.length <= MAX_SPOKEN_ANSWER_LENGTH;

export const hasDirectorLanguage = (section, spokenAnswer = '') =>
  /(?:这里|到此|答完|说完|讲完|指标后|指标讲完)(?:先)?(?:停顿|停一下|就停)|停下(?:来)?等(?:待)?(?:面试官)?追问|等面试官追问|第一轮回答就完整|为了避免像背书|答案会更像做过真实判断/.test(section) ||
  /我会先给结论|答完停顿|说完停顿|到此停顿/.test(spokenAnswer);
