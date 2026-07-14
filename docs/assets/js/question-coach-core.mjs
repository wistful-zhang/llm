export const DEFAULT_ANSWER_SECONDS = 60;

export const formatCountdown = (seconds) => {
  const numericSeconds = Number(seconds);
  const safeSeconds = Number.isFinite(numericSeconds)
    ? Math.max(0, Math.floor(numericSeconds))
    : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};
