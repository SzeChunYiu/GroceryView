export type HttpHeaders = Record<string, string>;

export type PostJsonRequest<TBody> = {
  url: string;
  body: TBody;
  headers?: HttpHeaders;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type PostJsonResponse<TResponse> = {
  status: number;
  statusText: string;
  data: TResponse;
  headers: HttpHeaders;
};

export type FetchImpl = typeof fetch;

export class HttpClientError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'HttpClientError';
  }
}

function readHeaders(headers: Headers): HttpHeaders {
  const output: HttpHeaders = {};
  headers.forEach((value, key) => {
    output[key] = value;
  });
  return output;
}

function toFetchError(error: unknown, url: string): Error {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new HttpClientError(`Request to ${url} timed out.`, url);
  }

  return new HttpClientError(`Request to ${url} failed.` , url);
}

const DEFAULT_TIMEOUT_MS = 10_000;

export async function postJson<TBody, TResponse>(request: PostJsonRequest<TBody>): Promise<PostJsonResponse<TResponse>> {
  const {
    url,
    body,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch
  } = request;

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorBody = await safeReadText(response);
      throw new HttpClientError(
        `Request to ${url} failed with status ${response.status}: ${errorBody}`,
        url,
        response.status
      );
    }

    const data = (await response.json()) as TResponse;
    return {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: readHeaders(response.headers)
    };
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw error;
    }
    throw toFetchError(error, url);
  } finally {
    clearTimeout(timeout);
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text || '';
  } catch {
    return '';
  }
}
