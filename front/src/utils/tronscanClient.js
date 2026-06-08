const MIN_REQUEST_INTERVAL_MS = 700;
const RATE_LIMIT_BUFFER_MS = 1500;
const DEFAULT_MAX_RETRIES = 2;

let requestQueue = Promise.resolve();
let lastRequestStartedAt = 0;
let suspendedUntil = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRateLimitDelay = (text, retryAfterHeader) => {
  const retryAfterSeconds = Number(retryAfterHeader);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  const suspendedMatch = String(text).match(/suspended\s+for\s+(\d+)\s*s/i);
  if (suspendedMatch) {
    return Number(suspendedMatch[1]) * 1000;
  }

  return 60000;
};

const waitForQueueSlot = async () => {
  const now = Date.now();
  const waitUntil = Math.max(suspendedUntil, lastRequestStartedAt + MIN_REQUEST_INTERVAL_MS);

  if (waitUntil > now) {
    await sleep(waitUntil - now);
  }

  lastRequestStartedAt = Date.now();
};

const parseJsonResponse = (text) => {
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Tronscan returned invalid JSON: ${error.message}`);
  }
};

const executeTronscanRequest = async (url, options, attempt = 0) => {
  await waitForQueueSlot();

  const response = await fetch(url, options);
  const text = await response.text();

  if (response.status === 429) {
    const retryDelay = parseRateLimitDelay(text, response.headers.get('Retry-After'));
    suspendedUntil = Date.now() + retryDelay + RATE_LIMIT_BUFFER_MS;

    if (attempt < DEFAULT_MAX_RETRIES) {
      await sleep(retryDelay + RATE_LIMIT_BUFFER_MS);
      return executeTronscanRequest(url, options, attempt + 1);
    }

    throw new Error(`Tronscan rate limit exceeded. Retry delay: ${Math.ceil(retryDelay / 1000)} seconds.`);
  }

  if (!response.ok) {
    throw new Error(`Tronscan HTTP error ${response.status}: ${text.slice(0, 200)}`);
  }

  return parseJsonResponse(text);
};

export const fetchTronscanJson = (url, options = {}) => {
  const queuedRequest = requestQueue.then(
    () => executeTronscanRequest(url, options),
    () => executeTronscanRequest(url, options),
  );

  requestQueue = queuedRequest.catch(() => {});

  return queuedRequest;
};
