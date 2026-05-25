import { normalizeUnitPriceForPackageText } from './normalization'

export type ProductRecord = {
  id: string
  name: string
  brand?: string | null
  category?: string | null
  size?: string | null
  upc?: string | null
}

export type CheaperSubstitutionProduct = ProductRecord & {
  price: number
  packageText: string
}

export type CheaperSubstitutionSuggestion = {
  source: CheaperSubstitutionProduct
  substitute: CheaperSubstitutionProduct
  sourceUnitPrice: number
  substituteUnitPrice: number
  comparableUnit: 'kg' | 'l' | 'piece'
  savingsPerUnit: number
  savingsPercent: number
  reasons: string[]
}

export type DuplicateCandidate = {
  id: string
  source: ProductRecord
  match: ProductRecord
  confidence: number
  signals: string[]
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

export function normalizedCategory(value?: string | null) {
  return normalize(value).replace(/\s+/g, '-')
}

function confidenceFor(left: ProductRecord, right: ProductRecord) {
  const signals: string[] = []
  let score = tokenSimilarity(left.name, right.name) * 0.45

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

  const nameScore = tokenSimilarity(left.name, right.name)
  if (nameScore >= 0.75) {
    signals.push("very similar names")
  } else if (nameScore >= 0.5) {
    signals.push("similar names")
  }

  return {
    confidence: Math.min(1, Number(score.toFixed(2))),
    signals,
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
          preview: mergeProductRecords(source, match),
        })
      }
    }
  }

  return candidates.sort((left, right) => right.confidence - left.confidence)
}

export function findCheaperBasketSubstitutions(
  products: CheaperSubstitutionProduct[],
  selectedProducts: CheaperSubstitutionProduct[],
): CheaperSubstitutionSuggestion[] {
  const selectedIds = new Set(selectedProducts.map((product) => product.id))
  const suggestions: CheaperSubstitutionSuggestion[] = []

  for (const source of selectedProducts) {
    const sourceCategory = normalizedCategory(source.category)
    const sourceUnitPrice = normalizeUnitPriceForPackageText(source.price, source.packageText)
    if (!sourceCategory || !sourceUnitPrice) continue

    const candidates = products
      .filter((candidate) => candidate.id !== source.id && !selectedIds.has(candidate.id))
      .map((candidate) => {
        const candidateCategory = normalizedCategory(candidate.category)
        const candidateUnitPrice = normalizeUnitPriceForPackageText(candidate.price, candidate.packageText)
        if (!candidateCategory || candidateCategory !== sourceCategory || !candidateUnitPrice) return null
        if (candidateUnitPrice.comparableUnit !== sourceUnitPrice.comparableUnit) return null
        if (candidateUnitPrice.value >= sourceUnitPrice.value) return null

        const savingsPerUnit = sourceUnitPrice.value - candidateUnitPrice.value
        return {
          source,
          substitute: candidate,
          sourceUnitPrice: Number(sourceUnitPrice.value.toFixed(2)),
          substituteUnitPrice: Number(candidateUnitPrice.value.toFixed(2)),
          comparableUnit: sourceUnitPrice.comparableUnit,
          savingsPerUnit: Number(savingsPerUnit.toFixed(2)),
          savingsPercent: Number(((savingsPerUnit / sourceUnitPrice.value) * 100).toFixed(1)),
          reasons: [
            'same category',
            `normalized ${sourceUnitPrice.comparableUnit} unit`,
            sameText(source.brand, candidate.brand) ? 'same brand' : 'lower unit price'
          ]
        }
      })
      .filter((candidate): candidate is CheaperSubstitutionSuggestion => candidate !== null)
      .sort((left, right) => right.savingsPerUnit - left.savingsPerUnit)

    const bestCandidate = candidates[0]
    if (bestCandidate) suggestions.push(bestCandidate)
  }

  return suggestions.sort((left, right) => right.savingsPerUnit - left.savingsPerUnit)
}
