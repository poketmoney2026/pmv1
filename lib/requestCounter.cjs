const FLUSH_INTERVAL_MS = 10000;
const FLUSH_THRESHOLD = 10;

let buffer = new Map();
let bufferedTotal = 0;
let flushTimer = null;
let flushing = false;

function normalizeDomain(req) {
  const raw = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim().toLowerCase();
  if (!raw) return '';
  return raw.split(',')[0].trim().replace(/:\d+$/, '');
}

function shouldTrack(req) {
  const url = String(req.url || '');
  if (!url || url.startsWith('/_next/') || url.startsWith('/socket.io') || url === '/favicon.ico') return false;
  if (/\.(?:css|js|map|png|jpe?g|gif|svg|webp|ico|mp3|woff2?|ttf|eot)$/i.test(url)) return false;
  return true;
}

async function flushNow() {
  if (flushing || buffer.size === 0) return;
  flushing = true;
  const pending = buffer;
  buffer = new Map();
  bufferedTotal = 0;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    const [{ default: dbConnect }, { default: DomainRequest }] = await Promise.all([
      import('../lib/dbConnect.js'),
      import('../models/DomainRequest.js'),
    ]);

    await dbConnect();
    const ops = Array.from(pending.entries()).map(([domain, count]) => ({
      updateOne: {
        filter: { domain },
        update: { $inc: { request: count }, $setOnInsert: { domain } },
        upsert: true,
      },
    }));

    if (ops.length) {
      await DomainRequest.bulkWrite(ops, { ordered: false });
    }
  } catch (error) {
    for (const [domain, count] of pending.entries()) {
      buffer.set(domain, (buffer.get(domain) || 0) + count);
      bufferedTotal += count;
    }
  } finally {
    flushing = false;
    if (buffer.size > 0 && !flushTimer) {
      flushTimer = setTimeout(flushNow, FLUSH_INTERVAL_MS);
      if (typeof flushTimer.unref === 'function') flushTimer.unref();
    }
  }
}

function scheduleFlush() {
  if (bufferedTotal >= FLUSH_THRESHOLD) {
    void flushNow();
    return;
  }
  if (!flushTimer) {
    flushTimer = setTimeout(flushNow, FLUSH_INTERVAL_MS);
    if (typeof flushTimer.unref === 'function') flushTimer.unref();
  }
}

function trackRequest(req) {
  if (!shouldTrack(req)) return;
  const domain = normalizeDomain(req);
  if (!domain) return;
  buffer.set(domain, (buffer.get(domain) || 0) + 1);
  bufferedTotal += 1;
  scheduleFlush();
}

module.exports = {
  trackRequest,
  flushNow,
};
