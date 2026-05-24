import { NextRequest, NextResponse } from "next/server";

type FreshnessStatus = "fresh" | "outdated";

type FreshnessReview = {
  id: string;
  productId: string;
  storeId: string;
  status: FreshnessStatus;
  shelfLifeDays?: number;
  note?: string;
  createdAt: string;
};

type FreshnessStore = {
  reviews: FreshnessReview[];
};

declare global {
  // eslint-disable-next-line no-var
  var groceryViewFreshnessReviews: FreshnessStore | undefined;
}

const freshnessStore =
  globalThis.groceryViewFreshnessReviews ??
  (globalThis.groceryViewFreshnessReviews = { reviews: [] });

function isFreshnessStatus(value: unknown): value is FreshnessStatus {
  return value === "fresh" || value === "outdated";
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const storeId = searchParams.get("storeId");

  const reviews = freshnessStore.reviews.filter((review) => {
    return (!productId || review.productId === productId) && (!storeId || review.storeId === storeId);
  });

  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const productId = cleanText(body?.productId);
  const storeId = cleanText(body?.storeId);
  const note = cleanText(body?.note);
  const shelfLifeDays = Number(body?.shelfLifeDays);

  if (!productId || !storeId || !isFreshnessStatus(body?.status)) {
    return NextResponse.json({ error: "productId, storeId and status are required" }, { status: 400 });
  }

  if (body?.shelfLifeDays !== undefined && (!Number.isFinite(shelfLifeDays) || shelfLifeDays < 0)) {
    return NextResponse.json({ error: "shelfLifeDays must be zero or greater" }, { status: 400 });
  }

  const review: FreshnessReview = {
    id: crypto.randomUUID(),
    productId,
    storeId,
    status: body.status,
    ...(body.shelfLifeDays !== undefined ? { shelfLifeDays } : {}),
    ...(note ? { note: note.slice(0, 280) } : {}),
    createdAt: new Date().toISOString(),
  };

  freshnessStore.reviews.unshift(review);

  return NextResponse.json({ review }, { status: 201 });
}
