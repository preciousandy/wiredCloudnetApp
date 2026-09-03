/** Presentation helpers. No business logic lives here. */

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** Clock format for the video player scrubber. */
export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const paddedSecs = String(secs).padStart(2, '0');
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSecs}`;
  return `${minutes}:${paddedSecs}`;
}

export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (value < 1_000) return String(value);
  if (value < 1_000_000) return `${trim(value / 1_000)}K`;
  if (value < 1_000_000_000) return `${trim(value / 1_000_000)}M`;
  return `${trim(value / 1_000_000_000)}B`;
}

function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  if (!Number.isFinite(diffMs)) return '';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return then.toLocaleDateString();
}

/** Transaction rows and receipts. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
