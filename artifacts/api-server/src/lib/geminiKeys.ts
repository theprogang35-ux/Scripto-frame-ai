type GeminiKeyEntry = {
  key: string;
  slot: string;
};

const configuredKeys: GeminiKeyEntry[] = [
  ["GEMINI_API_KEY", process.env.GEMINI_API_KEY],
  ["GEMINI_API_KEY_1", process.env.GEMINI_API_KEY_1],
  ["GEMINI_API_KEY_2", process.env.GEMINI_API_KEY_2],
  ["GEMINI_API_KEY_3", process.env.GEMINI_API_KEY_3],
  ["GEMINI_API_KEY_4", process.env.GEMINI_API_KEY_4],
]
  .filter((entry): entry is [string, string] => Boolean(entry[1]))
  .reduce<GeminiKeyEntry[]>((unique, [slot, key]) => {
    if (!unique.some((entry) => entry.key === key)) unique.push({ key, slot });
    return unique;
  }, []);

let nextStartIndex = 0;
const cooldownUntil = new Map<string, number>();

export function getGeminiKeyCount(): number {
  return configuredKeys.length;
}

/**
 * Returns every configured key once, starting at a different key for each
 * request. Keys that recently returned a quota/auth/provider error are tried
 * last so healthy projects get preference without permanently disabling a key.
 */
export function getGeminiKeyCandidates(): GeminiKeyEntry[] {
  if (configuredKeys.length === 0) return [];

  const start = nextStartIndex % configuredKeys.length;
  nextStartIndex = (nextStartIndex + 1) % configuredKeys.length;
  const now = Date.now();
  const ordered = configuredKeys
    .slice(start)
    .concat(configuredKeys.slice(0, start));
  const available = ordered.filter((entry) => (cooldownUntil.get(entry.key) ?? 0) <= now);
  const coolingDown = ordered.filter((entry) => (cooldownUntil.get(entry.key) ?? 0) > now);
  return available.concat(coolingDown);
}

export function markGeminiKeyFailure(key: string, status: number): void {
  if (![401, 403, 408, 429, 500, 502, 503, 504].includes(status)) return;
  const cooldownMs = status === 429 ? 60_000 : status === 401 || status === 403 ? 30_000 : 10_000;
  cooldownUntil.set(key, Date.now() + cooldownMs);
}

export function getGeminiKeySlot(key: string): string {
  return configuredKeys.find((entry) => entry.key === key)?.slot ?? "unknown";
}