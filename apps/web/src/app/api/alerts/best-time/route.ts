type BestTimeAlertRule = {
  categories: string[];
  createdAt: string;
  id: string;
  minConfidence: number;
  stores: string[];
};

function splitList(value: FormDataEntryValue | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => splitList(entry));
  }

  return String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function readBody(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  const form = await request.formData();
  return {
    categories: form.get('categories'),
    minConfidence: form.get('minConfidence'),
    stores: form.get('stores'),
  };
}

export async function GET() {
  return Response.json({
    maxConfidence: 100,
    minConfidence: 1,
    requiredFields: ['stores', 'categories', 'minConfidence'],
  });
}

export async function POST(request: Request) {
  const body = await readBody(request).catch(() => null);
  const stores = splitList(body?.stores);
  const categories = splitList(body?.categories);
  const minConfidence = Number(body?.minConfidence ?? 85);

  if (stores.length === 0 || categories.length === 0) {
    return Response.json({ error: 'At least one target store and category are required.' }, { status: 400 });
  }

  if (!Number.isFinite(minConfidence) || minConfidence < 1 || minConfidence > 100) {
    return Response.json({ error: 'Confidence threshold must be between 1 and 100.' }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const rule: BestTimeAlertRule = {
    categories,
    createdAt,
    id: `best-time-${Date.now()}`,
    minConfidence,
    stores,
  };

  return Response.json({
    nextEvaluation: 'next price refresh',
    rule,
    status: 'active',
  }, { status: 201 });
}
