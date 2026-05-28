function normalizeScore(score, outOf = 100) {
  if (score === null || score === undefined || score === "") return null;
  const num = Number(score);
  if (isNaN(num)) return null;
  const normalized = Math.round((num / outOf) * 100);
  return Math.min(100, Math.max(0, normalized));
}

module.exports = normalizeScore;
