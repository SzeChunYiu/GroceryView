import { parsePackageSize } from "./unit-normalizer.ts"
import { duplicateProductMatchKey, normalizeDuplicateProductText, type DuplicateProductMatchKey } from "./normalization.ts"

export type ProductRecord = {
  id: string
  name: string
  brand?: string | null
  barcode?: string | null
  category?: string | null
  imageUrl?: string | null
  sourceUrl?: string | null
  size?: string | null
  unitLabel?: string | null
  unit?: string | null
  ean?: string | null
  upc?: string | null
}

export type DuplicateCandidate = {
  id: string
  source: ProductRecord
  match: ProductRecord
  confidence: number
  signals: string[]
  preview: ProductRecord
  matchKey: DuplicateProductMatchKey
}

export type DuplicateReviewAction = "merge" | "ignore" | "confidence"

export type DuplicateReviewRow = DuplicateCandidate & {
  confidenceLabel: "High" | "Medium" | "Needs review"
  recommendedAction: DuplicateReviewAction
}

export type DuplicateReviewGroup = {
  id: string
  matchKey: DuplicateProductMatchKey
  products: ProductRecord[]
  candidates: DuplicateReviewRow[]
  signals: string[]
  recommendedAction: DuplicateReviewAction
}

export type DuplicateMergeQueueItem = DuplicateReviewGroup & {
  canonicalProduct: ProductRecord
  mergeNote: string
}

export type DuplicateReconcileWorkflow = {
  auditLog: DuplicateReviewAuditEntry[]
  groups: DuplicateReviewGroup[]
  guardrails: string[]
  mergeQueue: DuplicateMergeQueueItem[]
  publicTickerAliasMap: Record<string, string>
  stats: {
    inputProductCount: number
    productCountInGroups: number
    reviewGroupCount: number
    readyToMergeCount: number
    needsConfidenceCount: number
    keepSeparateCount: number
  }
}

export type DuplicateReviewDecision = "merge" | "reject" | "alias" | "undo"

export type DuplicateReviewAuditEntry = {
  action: DuplicateReviewDecision
  actor: string
  canonicalProductId: string
  groupId: string
  note: string
  recordedAt: string
  targetProductIds: string[]
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

function barcodeFor(product: ProductRecord) {
  return (product.barcode ?? product.ean ?? product.upc ?? "").replace(/\D/g, "")
}

export function titleSignatureForProduct(product: ProductRecord) {
  const key = duplicateProductMatchKey(product)
  return [
    key.normalizedBrand,
    key.normalizedName,
    key.normalizedSize,
    key.normalizedUnit
  ].filter(Boolean).join(":")
}

function confidenceFor(left: ProductRecord, right: ProductRecord) {
  const signals: string[] = []
  const leftKey = duplicateProductMatchKey(left)
  const rightKey = duplicateProductMatchKey(right)
  const leftBarcode = barcodeFor(left)
  const rightBarcode = barcodeFor(right)
  const leftTitleSignature = titleSignatureForProduct(left)
  const rightTitleSignature = titleSignatureForProduct(right)
  let score = tokenSimilarity(left.name, right.name) * 0.45

  if (leftBarcode && leftBarcode === rightBarcode) {
    score += 0.65
    signals.push("same barcode")
  }

  if (leftKey.normalizedBrand && leftKey.normalizedBrand === rightKey.normalizedBrand) {
    score += 0.2
    signals.push("same brand")
  }

  if (leftKey.normalizedSize && leftKey.normalizedSize === rightKey.normalizedSize) {
    score += 0.15
    signals.push("same size")
  }

  if (leftKey.normalizedUnit && leftKey.normalizedUnit === rightKey.normalizedUnit) {
    score += 0.05
    signals.push("same unit")
  }

  if (sameText(left.category, right.category)) {
    score += 0.1
    signals.push("same category")
  }

  const nameScore = tokenSimilarity(left.name, right.name)
  if (leftKey.normalizedName && leftKey.normalizedName === rightKey.normalizedName) {
    signals.push("same normalized name")
  } else if (nameScore >= 0.75) {
    signals.push("very similar names")
  } else if (nameScore >= 0.5) {
    signals.push("similar names")
  }

  if (leftTitleSignature && leftTitleSignature === rightTitleSignature) {
    score += 0.15
    signals.push("same title signature")
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
    unit: primary.unit || duplicate.unit,
    barcode: primary.barcode || duplicate.barcode,
    ean: primary.ean || duplicate.ean,
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
      const matchKey = duplicateProductMatchKey(source)

      if (result.confidence >= threshold) {
        candidates.push({
          id: `${source.id}:${match.id}`,
          source,
          match,
          confidence: result.confidence,
          signals: result.signals,
          preview: mergeProductRecords(source, match),
          matchKey,
        })
      }
    }
  }

  return candidates.sort((left, right) => right.confidence - left.confidence)
}

export function getDuplicateReviewAction(candidate: DuplicateCandidate): DuplicateReviewAction {
  if (candidate.confidence >= 0.85) {
    return "merge"
  }

  if (candidate.confidence < 0.65) {
    return "ignore"
  }

  return "confidence"
}

export function buildDuplicateReviewRows(products: ProductRecord[], threshold = 0.55): DuplicateReviewRow[] {
  return findDuplicateProducts(products, threshold).map((candidate) => ({
    ...candidate,
    confidenceLabel:
      candidate.confidence >= 0.85
        ? "High"
        : candidate.confidence >= 0.7
          ? "Medium"
          : "Needs review",
    recommendedAction: getDuplicateReviewAction(candidate),
  }))
}

function groupIdForCandidate(candidate: DuplicateReviewRow) {
  const sourceKey = duplicateProductMatchKey(candidate.source)
  const matchKey = duplicateProductMatchKey(candidate.match)
  const sourceBarcode = barcodeFor(candidate.source)
  const matchBarcode = barcodeFor(candidate.match)
  if (sourceBarcode && sourceBarcode === matchBarcode) return `barcode:${sourceBarcode}`

  const keyParts = [
    sourceKey.normalizedBrand,
    sourceKey.normalizedName,
    sourceKey.normalizedSize,
    sourceKey.normalizedUnit
  ].filter(Boolean)

  return `normalized:${keyParts.join(":") || normalizeDuplicateProductText(candidate.id)}`
}

function addUniqueProduct(products: ProductRecord[], product: ProductRecord) {
  if (!products.some((item) => item.id === product.id)) products.push(product)
}

function higherPriorityAction(left: DuplicateReviewAction, right: DuplicateReviewAction): DuplicateReviewAction {
  const priority: Record<DuplicateReviewAction, number> = { merge: 3, confidence: 2, ignore: 1 }
  return priority[left] >= priority[right] ? left : right
}

export function buildDuplicateReviewGroups(products: ProductRecord[], threshold = 0.55): DuplicateReviewGroup[] {
  const groups = new Map<string, DuplicateReviewGroup>()

  for (const candidate of buildDuplicateReviewRows(products, threshold)) {
    const id = groupIdForCandidate(candidate)
    const group = groups.get(id) ?? {
      id,
      matchKey: candidate.matchKey,
      products: [],
      candidates: [],
      signals: [],
      recommendedAction: candidate.recommendedAction
    }

    addUniqueProduct(group.products, candidate.source)
    addUniqueProduct(group.products, candidate.match)
    group.candidates.push(candidate)
    group.signals = [...new Set([...group.signals, ...candidate.signals])]
    group.recommendedAction = higherPriorityAction(group.recommendedAction, candidate.recommendedAction)
    groups.set(id, group)
  }

  return [...groups.values()].sort((left, right) => {
    const leftConfidence = Math.max(...left.candidates.map((candidate) => candidate.confidence))
    const rightConfidence = Math.max(...right.candidates.map((candidate) => candidate.confidence))
    return rightConfidence - leftConfidence || right.products.length - left.products.length
  })
}

function canonicalProductFor(products: ProductRecord[]) {
  return [...products].sort((left, right) => {
    const leftScore = (barcodeFor(left) ? 4 : 0) + (left.imageUrl ? 2 : 0) + (left.sourceUrl ? 1 : 0)
    const rightScore = (barcodeFor(right) ? 4 : 0) + (right.imageUrl ? 2 : 0) + (right.sourceUrl ? 1 : 0)
    return rightScore - leftScore || left.id.localeCompare(right.id)
  })[0]!
}

function mergeNoteFor(group: DuplicateReviewGroup, canonicalProduct: ProductRecord) {
  const topConfidence = Math.max(...group.candidates.map((candidate) => candidate.confidence))
  const signalSummary = group.signals.length > 0 ? group.signals.join(", ") : "normalized product attributes"
  return `Canonical ${canonicalProduct.id} selected for ${Math.round(topConfidence * 100)}% confidence group using ${signalSummary}.`
}

export function buildDuplicateReconcileWorkflow(products: ProductRecord[], threshold = 0.65): DuplicateReconcileWorkflow {
  const groups = buildDuplicateReviewGroups(products, threshold)
  const mergeQueue = groups
    .filter((group) => group.recommendedAction === "merge")
    .map((group) => {
      const canonicalProduct = canonicalProductFor(group.products)
      return {
        ...group,
        canonicalProduct,
        mergeNote: mergeNoteFor(group, canonicalProduct)
      }
    })
  const productCountInGroups = new Set(groups.flatMap((group) => group.products.map((product) => product.id))).size
  const publicTickerAliasMap = Object.fromEntries(mergeQueue.flatMap((group) => (
    group.products
      .filter((product) => product.id !== group.canonicalProduct.id)
      .map((product) => [product.id, group.canonicalProduct.id])
  )))
  const auditLog = mergeQueue.slice(0, 8).map((group, index) => ({
    action: "alias" as const,
    actor: "system:duplicate-heuristics",
    canonicalProductId: group.canonicalProduct.id,
    groupId: group.id,
    note: group.mergeNote,
    recordedAt: new Date(Date.UTC(2026, 4, 25, 8, index, 0)).toISOString(),
    targetProductIds: group.products.filter((product) => product.id !== group.canonicalProduct.id).map((product) => product.id)
  }))

  return {
    auditLog,
    groups,
    mergeQueue,
    publicTickerAliasMap,
    stats: {
      inputProductCount: products.length,
      productCountInGroups,
      reviewGroupCount: groups.length,
      readyToMergeCount: mergeQueue.length,
      needsConfidenceCount: groups.filter((group) => group.recommendedAction === "confidence").length,
      keepSeparateCount: groups.filter((group) => group.recommendedAction === "ignore").length
    },
    guardrails: [
      "Barcode matches can enter the merge queue, but no product is reconciled without an admin decision.",
      "Brand, title signature, package size, and unit evidence are kept visible for every candidate group.",
      "Merge previews preserve the strongest observed identifiers and never delete source rows automatically.",
      "Public ticker aliases collapse duplicate fragments to the chosen canonical id until an admin rejects or undoes the group."
    ]
  }
}

export function duplicateReviewAuditEntryForAction(input: {
  action: DuplicateReviewDecision
  actor?: string
  group: DuplicateReviewGroup
  note?: string
  recordedAt?: string
}) {
  const canonicalProduct = chooseCanonicalProduct(input.group.products)

  return {
    action: input.action,
    actor: input.actor ?? "admin:ops",
    canonicalProductId: canonicalProduct.id,
    groupId: input.group.id,
    note: input.note ?? `${input.action} decision recorded for duplicate candidate group ${input.group.id}.`,
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    targetProductIds: input.group.products.filter((product) => product.id !== canonicalProduct.id).map((product) => product.id)
  } satisfies DuplicateReviewAuditEntry
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

function canonicalScore(product: ProductRecord) {
  return [product.ean, product.upc].filter(Boolean).length * 3
    + [product.brand, product.category, product.size, product.unit].filter(Boolean).length
}

export function chooseCanonicalProduct(products: ProductRecord[]): ProductRecord {
  const sorted = [...products].sort((left, right) => {
    const scoreDelta = canonicalScore(right) - canonicalScore(left)
    if (scoreDelta !== 0) return scoreDelta
    return left.id.localeCompare(right.id)
  })

  const canonicalProduct = sorted[0]
  if (!canonicalProduct) throw new Error("Duplicate merge groups require at least one product")
  return canonicalProduct
}

function mergeNoteForGroup(group: DuplicateReviewGroup, canonicalProduct: ProductRecord) {
  const mergedIds = group.products
    .filter((product) => product.id !== canonicalProduct.id)
    .map((product) => product.id)
    .join(", ")
  const signals = group.signals.length > 0 ? group.signals.join(", ") : "similar product text"

  return `Keep ${canonicalProduct.id} as canonical; attach ${mergedIds || "no secondary records"} as aliases so continuous price history is preserved. Signals: ${signals}.`
}

export function buildDuplicateMergeQueue(products: ProductRecord[], threshold = 0.55): DuplicateMergeQueueItem[] {
  return buildDuplicateReviewGroups(products, threshold).map((group) => {
    const canonicalProduct = chooseCanonicalProduct(group.products)
    return {
      ...group,
      canonicalProduct,
      mergeNote: mergeNoteForGroup(group, canonicalProduct)
    }
  })
}
