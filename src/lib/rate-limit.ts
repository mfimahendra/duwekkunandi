const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type Entry = { count: number; resetAt: number };

// In-memory per instance; Vercel serverless instances do not share this state.
const attempts = new Map<string, Entry>();

function prune(now: number) {
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }
}

export function getLockoutMs(key: string): number {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) return 0;
  return entry.count >= MAX_ATTEMPTS ? entry.resetAt - now : 0;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  if (attempts.size > 10_000) prune(now);
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function resetFailures(key: string): void {
  attempts.delete(key);
}
