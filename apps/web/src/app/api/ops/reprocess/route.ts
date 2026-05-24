import { NextResponse } from "next/server";

const replayableDatasets = new Set([
  "open-prices",
  "receipt-ocr",
  "store-catalog",
]);

async function readReplayRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as { dataset?: string; source?: string };
  }

  const formData = await request.formData();

  return {
    dataset: formData.get("dataset")?.toString(),
    source: formData.get("source")?.toString(),
  };
}

export async function POST(request: Request) {
  const { dataset, source } = await readReplayRequest(request);

  if (!dataset || !replayableDatasets.has(dataset)) {
    return NextResponse.json(
      { error: "Unknown dataset replay request" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    dataset,
    source: source ?? dataset,
    status: "queued",
    replayQueuedAt: new Date().toISOString(),
  });
}
