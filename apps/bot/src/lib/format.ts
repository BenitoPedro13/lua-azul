/** Format a millisecond duration as `H:MM:SS` or `M:SS`. Streams → "LIVE". */
export function formatDuration(ms: number | undefined, isStream = false): string {
  if (isStream) return 'LIVE';
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return '0:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Truncate a string to `max` chars with an ellipsis. */
export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
