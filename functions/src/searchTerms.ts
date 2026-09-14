function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function generateSearchTerms(...strings: string[]): string[] {
  const terms = new Set<string>();

  for (const value of strings) {
    const normalized = normalize(value);
    if (!normalized) continue;

    const words = normalized.split(/\s+/).filter(Boolean);
    for (let start = 0; start < words.length; start += 1) {
      let combination = "";
      for (let end = start; end < words.length; end += 1) {
        combination += words[end];
        for (let length = 1; length <= combination.length; length += 1) {
          terms.add(combination.slice(0, length));
        }
      }
    }
  }

  return [...terms].sort();
}