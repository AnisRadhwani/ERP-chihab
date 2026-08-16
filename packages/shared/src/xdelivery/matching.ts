export interface ParsedMarchandise {
  label: string | null;
  quantity: number;
}

/** Extract product label from X-Delivery Marchandise field */
export function parseMarchandise(marchandise: string): ParsedMarchandise {
  const trimmed = marchandise.trim();
  if (!trimmed) return { label: null, quantity: 1 };

  const qtyMatch = trimmed.match(/\bx\s*(\d+)\s*$/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  if (parenMatch) {
    return { label: parenMatch[1].trim(), quantity: quantity || 1 };
  }

  return { label: trimmed, quantity: quantity || 1 };
}

export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface MatchableProduct {
  id: string;
  name: string;
  matchKeywords: string[];
}

export function matchProduct(
  marchandise: string,
  products: MatchableProduct[]
): MatchableProduct | null {
  const { label } = parseMarchandise(marchandise);
  if (!label) return null;

  const normalizedMarchandise = normalizeForMatch(marchandise);
  const normalizedLabel = normalizeForMatch(label);

  for (const product of products) {
    if (!product.matchKeywords?.length) continue;

    for (const keyword of product.matchKeywords) {
      const normalizedKeyword = normalizeForMatch(keyword);
      if (!normalizedKeyword) continue;

      if (
        normalizedLabel.includes(normalizedKeyword) ||
        normalizedMarchandise.includes(normalizedKeyword) ||
        normalizeForMatch(product.name).includes(normalizedKeyword)
      ) {
        return product;
      }
    }

    const normalizedName = normalizeForMatch(product.name);
    if (
      normalizedLabel.includes(normalizedName) ||
      normalizedMarchandise.includes(normalizedName)
    ) {
      return product;
    }
  }

  return null;
}
