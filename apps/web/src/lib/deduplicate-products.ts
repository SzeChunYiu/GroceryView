import { parsePackageSize } from "./unit-normalizer"

export type ProductRecord = {
  id: string
  name: string
  brand?: string | null
  category?: string | null
  size?: string | null
  upc?: string | null
  sourceLabels?: string[] | null
}

export type DuplicateCandidate = {
  id: string
  source: ProductRecord
  match: ProductRecord
  confidence: number
  signals: string[]
  sourceOverlap: string[]
  preview: ProductRecord
}

const stopWords = new Set(["and", "the", "a", "an", "of", "for"])

function normalize(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function tokens(value?: string | null) {
  return normalize(value)
    .split(" ")
    .filter((token) => token && !stopWords.has(token))
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = new Set(tokens(left))
  const rightTokens = new Set(tokens(right))

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0
  }

  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length
  const union = new Set([...leftTokens, ...rightTokens]).size

  return overlap / union
}

function sameText(left?: string | null, right?: string | null) {
  const normalizedLeft = normalize(left)
  const normalizedRight = normalize(right)

  return Boolean(normalizedLeft && normalizedLeft === normalizedRight)
}

function normalizedSourceLabels(product: ProductRecord) {
  return [...new Set((product.sourceLabels ?? []).map((source) => source.trim()).filter(Boolean))]
}

function sourceOverlapFor(left: ProductRecord, right: ProductRecord) {
  const rightSources = new Set(normalizedSourceLabels(right).map((source) => source.toLowerCase()))

  return normalizedSourceLabels(left).filter((source) => rightSources.has(source.toLowerCase()))
}

function confidenceFor(left: ProductRecord, right: ProductRecord) {
  const signals: string[] = []
  let score = tokenSimilarity(left.name, right.name) * 0.45
  const sourceOverlap = sourceOverlapFor(left, right)

  if (sameText(left.brand, right.brand)) {
    score += 0.2
    signals.push("same brand")
  }

  if (sameText(left.size, right.size)) {
    score += 0.15
    signals.push("same size")
  }

  if (sameText(left.category, right.category)) {
    score += 0.1
    signals.push("same category")
  }

  if (sameText(left.upc, right.upc)) {
    score += 0.35
    signals.push("same UPC")
  }

  if (sourceOverlap.length > 0) {
    score += 0.1
    signals.push("source overlap")
  }

  const nameScore = tokenSimilarity(left.name, right.name)
  if (nameScore >= 0.75) {
    signals.push("very similar names")
  } else if (nameScore >= 0.5) {
    signals.push("similar names")
  }

  return {
    confidence: Math.min(1, Number(score.toFixed(2))),
    signals,
    sourceOverlap,
  }
}

export function mergeProductRecords(primary: ProductRecord, duplicate: ProductRecord): ProductRecord {
  return {
    ...duplicate,
    ...primary,
    brand: primary.brand || duplicate.brand,
    category: primary.category || duplicate.category,
    size: primary.size || duplicate.size,
    upc: primary.upc || duplicate.upc,
  }
}

export function findDuplicateProducts(products: ProductRecord[], threshold = 0.55): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = []

  for (let leftIndex = 0; leftIndex < products.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < products.length; rightIndex += 1) {
      const source = products[leftIndex]
      const match = products[rightIndex]
      const result = confidenceFor(source, match)

      if (result.confidence >= threshold) {
        candidates.push({
          id: `${source.id}:${match.id}`,
          source,
          match,
          confidence: result.confidence,
          signals: result.signals,
          sourceOverlap: result.sourceOverlap,
          preview: mergeProductRecords(source, match),
        })
      }
    }
  }

  return candidates.sort((left, right) => right.confidence - left.confidence)
}

export type SubstitutionSavingsProduct = ProductRecord & {
  price: number
}

export type SubstitutionSavingsSuggestion = {
  product: SubstitutionSavingsProduct
  unitPrice: number
  savings: number
  savingsPercent: number
  normalizedSizeLabel: string
  reason: string
}

function normalizedUnitPriceFor(product: SubstitutionSavingsProduct) {
  const parsedSize = parsePackageSize(product.size)
  if (!parsedSize || parsedSize.quantity <= 0 || !Number.isFinite(product.price)) return null

  return {
    unitPrice: product.price / parsedSize.quantity,
    normalizedSizeLabel: parsedSize.label,
    unit: parsedSize.unit,
  }
}

export function findSubstitutionSavings(
  target: SubstitutionSavingsProduct,
  products: SubstitutionSavingsProduct[],
): SubstitutionSavingsSuggestion[] {
  const targetUnitPrice = normalizedUnitPriceFor(target)
  if (!target.category || !targetUnitPrice) return []

  return products
    .filter((product) => product.id !== target.id && sameText(product.category, target.category))
    .map((product) => {
      const candidateUnitPrice = normalizedUnitPriceFor(product)
      if (!candidateUnitPrice || candidateUnitPrice.unit !== targetUnitPrice.unit) return null

      const savings = targetUnitPrice.unitPrice - candidateUnitPrice.unitPrice
      if (savings <= 0) return null

      return {
        product,
        unitPrice: Number(candidateUnitPrice.unitPrice.toFixed(2)),
        savings: Number(savings.toFixed(2)),
        savingsPercent: Number(((savings / targetUnitPrice.unitPrice) * 100).toFixed(0)),
        normalizedSizeLabel: candidateUnitPrice.normalizedSizeLabel,
        reason: `Same ${target.category} category, normalized to ${candidateUnitPrice.normalizedSizeLabel}`,
      }
    })
    .filter((suggestion): suggestion is SubstitutionSavingsSuggestion => Boolean(suggestion))
    .sort((left, right) => right.savings - left.savings)
    .slice(0, 3)
}
