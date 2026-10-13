export interface StoredCharacter {
  id: string;
  name: string;
  series: string;
}

const sessionCharacters = new Map<string, StoredCharacter>();

export function characterStorageKey(userId: string) {
  return `scripto-selected-character:${userId}`;
}

export function readStoredCharacter(userId: string): StoredCharacter | null {
  const key = characterStorageKey(userId);
  try {
    const value = localStorage.getItem(key);
    if (!value) return sessionCharacters.get(key) ?? null;
    const parsed = JSON.parse(value) as Partial<StoredCharacter>;
    if (
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.series === "string"
    ) {
      const character = { id: parsed.id, name: parsed.name, series: parsed.series };
      sessionCharacters.set(key, character);
      return character;
    }
  } catch {
    // Fall back to in-memory state when browser storage is unavailable.
  }
  return sessionCharacters.get(key) ?? null;
}

export function storeCharacter(userId: string, character: StoredCharacter) {
  const key = characterStorageKey(userId);
  sessionCharacters.set(key, character);
  try {
    localStorage.setItem(key, JSON.stringify(character));
  } catch {
    // The selection remains available for this visit from memory.
  }
}

export function clearStoredCharacter(userId: string) {
  const key = characterStorageKey(userId);
  sessionCharacters.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage is optional.
  }
}
