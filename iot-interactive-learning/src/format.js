// Podium times are compared in milliseconds but read in seconds.
export const formatDuration = ms =>
  typeof ms === 'number' && Number.isFinite(ms) ? `${(ms / 1000).toFixed(1)} วิ` : '—';
