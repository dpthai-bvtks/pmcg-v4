import { Hono } from './hono.js';
import { handleStaffAction } from './routes/staff.js';
import { handlePatientsAction } from './routes/patients.js';
import { handleSchedulesAction } from './routes/schedules.js';
import { handleTenantsAction } from './routes/tenants.js';
import { handleBackupSyncAction } from './routes/backup-sync.js';
import { ensureSchema } from './schema.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TURSO ADAPTER — Tương thích 100% với Cloudflare D1 API
// Thay thế: const db = env.DB  →  const db = createTursoAdapter(env)
// Không cần sửa bất kỳ câu SQL nào bên dưới!
// ═══════════════════════════════════════════════════════════════════════════════

function createTursoAdapter(env, ctx) {
  const PRIMARY_URL    = env.TURSO_URL;
  const PRIMARY_TOKEN  = env.TURSO_TOKEN;
  const FALLBACK_URL   = env.TURSO_FALLBACK_URL;
  const FALLBACK_TOKEN = env.TURSO_FALLBACK_TOKEN || env.TURSO_TOKEN;

  if (!PRIMARY_URL || !PRIMARY_TOKEN) throw new Error("Thiếu TURSO_URL hoặc TURSO_TOKEN trong env");

  async function fetchWithTimeout(url, token, requests, timeoutMs = 3500) {
    const httpUrl     = url.replace('libsql://', 'https://');
    const pipelineUrl = `${httpUrl}/v2/pipeline`;
    const controller  = new AbortController();
    const timer       = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(pipelineUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests }),
        signal: controller.signal
      });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  function isWriteOperation(reqs) {
    return reqs.some(r => {
      if (r.type !== 'execute') return false;
      const rawSql = (r.stmt?.sql || '').trim();
      const sql = rawSql.replace(/\/\*[\s\S]*?\*\//g, '').trim().toUpperCase();
      return (
        sql.startsWith('INSERT') ||
        sql.startsWith('UPDATE') ||
        sql.startsWith('DELETE') ||
        sql.startsWith('REPLACE') ||
        sql.startsWith('CREATE') ||
        sql.startsWith('DROP') ||
        sql.startsWith('ALTER')
      );
    });
  }

  async function runPipeline(requests) {
    const isWrite = isWriteOperation(requests);
    const writeCopy = isWrite ? JSON.parse(JSON.stringify(requests)) : null;

    let primaryJson = null;
    let usedFallback = false;
    let lastPrimaryError = null;

    // Retry loop on Primary (up to 3 attempts) for transient "database is locked" errors
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const payload = JSON.parse(JSON.stringify(requests));
      payload.push({ type: 'close' });

      try {
        const res = await fetchWithTimeout(PRIMARY_URL, PRIMARY_TOKEN, payload, 4000);

        if (!res.ok && res.status >= 500 && FALLBACK_URL) {
          console.warn(`[TURSO-FAILOVER] Primary returned HTTP ${res.status} (attempt ${attempt}). Falling back...`);
          break; // Failover to Fallback URL
        }

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Turso HTTP ${res.status}: ${txt.substring(0, 300)}`);
        }

        const json = await res.json();
        const errResult = json.results?.find(r => r.type === 'error');

        if (errResult) {
          const errObjStr = JSON.stringify(errResult.error || {});
          const errMessage = String(errResult.error?.message || errObjStr).toLowerCase();
          const isLocked = errMessage.includes('database is locked') || errMessage.includes('sqlite_busy') || errMessage.includes('busy');

          if (isLocked && attempt < maxAttempts) {
            console.warn(`[TURSO-RETRY] Database locked on Primary (attempt ${attempt}/${maxAttempts}). Retrying in ${attempt * 200}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 200));
            continue;
          }
          throw new Error(`Turso SQL error: ${errObjStr}`);
        }

        primaryJson = json;
        break; // Successfully executed on Primary
      } catch (err) {
        lastPrimaryError = err;
        const errMessage = String(err.message || '').toLowerCase();
        const isLocked = errMessage.includes('database is locked') || errMessage.includes('sqlite_busy') || errMessage.includes('busy');

        if (isLocked && attempt < maxAttempts) {
          console.warn(`[TURSO-RETRY] Primary caught lock error (attempt ${attempt}/${maxAttempts}): ${err.message}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 200));
          continue;
        }

        if (FALLBACK_URL) {
          console.warn(`[TURSO-FAILOVER] Primary attempt ${attempt} failed (${err.message}). Trying Fallback...`);
          break;
        } else {
          throw err;
        }
      }
    }

    if (primaryJson) {
      // Dual-Write: Nếu ghi thành công trên Primary, nhân bản ngầm an toàn sang Turso Cloud
      if (!usedFallback && FALLBACK_URL && isWrite && writeCopy) {
        writeCopy.push({ type: 'close' });
        const replicatePromise = fetchWithTimeout(FALLBACK_URL, FALLBACK_TOKEN, writeCopy, 8000)
          .then(async fbRes => {
            if (!fbRes.ok) {
              const fbErr = await fbRes.text().catch(() => '');
              console.warn(`[DUAL-WRITE WARNING] Turso Cloud HTTP ${fbRes.status}: ${fbErr.substring(0, 150)}`);
            }
          })
          .catch(fbErr => {
            console.warn(`[DUAL-WRITE ERROR] Could not replicate to Turso Cloud: ${fbErr.message}`);
          });

        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(replicatePromise);
        }
      }

      return primaryJson.results || [];
    }

    // Attempt Fallback if Primary failed completely
    if (FALLBACK_URL) {
      usedFallback = true;
      const fbPayload = JSON.parse(JSON.stringify(requests));
      fbPayload.push({ type: 'close' });

      const res = await fetchWithTimeout(FALLBACK_URL, FALLBACK_TOKEN, fbPayload, 8000);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Turso HTTP ${res.status} (FALLBACK): ${txt.substring(0, 300)}`);
      }
      const json = await res.json();
      const errResult = json.results?.find(r => r.type === 'error');
      if (errResult) throw new Error(`Turso SQL error (FALLBACK): ${JSON.stringify(errResult.error)}`);
      return json.results || [];
    }

    throw lastPrimaryError || new Error("Turso pipeline execution failed");
  }

  // Chuyển hàng Turso [{type,value}, ...] → Object plain
  function rowToObj(columns, row) {
    const obj = {};
    columns.forEach((col, i) => {
      const cell = row[i];
      if (!cell || cell.type === 'null') {
        obj[col] = null;
      } else if (cell.type === 'integer') {
        obj[col] = parseInt(cell.value, 10);
      } else if (cell.type === 'float') {
        obj[col] = parseFloat(cell.value);
      } else {
        obj[col] = cell.value;
      }
    });
    return obj;
  }

  // Tạo một statement object (giống D1 PreparedStatement)
  function makeStmt(sql, boundArgs = []) {
    const pipelineStmt = {
      sql,
      args: boundArgs.map(v => {
        if (v === null || v === undefined) return { type: 'null' };
        if (typeof v === 'number') return { type: Number.isInteger(v) ? 'integer' : 'float', value: String(v) };
        if (typeof v === 'boolean') return { type: 'integer', value: v ? '1' : '0' };
        return { type: 'text', value: String(v) };
      })
    };

    return {
      _pipelineStmt: pipelineStmt,

      // Hỗ trợ .bind(...args) như D1
      bind(...args) { return makeStmt(sql, args); },

      // .run() → { success: true, meta: {} }
      async run() {
        const results = await runPipeline([{ type: 'execute', stmt: pipelineStmt }]);
        const resObj = results[0]?.response?.result;
        return {
          success: true,
          meta: {
            changes: resObj?.affected_row_count ?? 0,
            last_row_id: resObj?.last_insert_rowid ?? null
          }
        };
      },

      // .first() → object hoặc null
      async first(colName) {
        const results = await runPipeline([{ type: 'execute', stmt: pipelineStmt }]);
        const result = results[0]?.response?.result;
        if (!result || !result.rows?.length) return null;
        const obj = rowToObj(result.cols.map(c => c.name), result.rows[0]);
        return colName !== undefined ? obj[colName] : obj;
      },

      // .all() → { results: [...] }
      async all() {
        const results = await runPipeline([{ type: 'execute', stmt: pipelineStmt }]);
        const result = results[0]?.response?.result;
        if (!result) return { results: [] };
        const cols = result.cols.map(c => c.name);
        return { results: (result.rows || []).map(row => rowToObj(cols, row)) };
      }
    };
  }

  return {
    // db.prepare(sql) — giống D1
    prepare(sql) { return makeStmt(sql); },

    // db.batch([stmt1, stmt2, ...]) — Gửi tất cả trong 1 HTTP request duy nhất qua Turso Pipeline
    async batch(stmts) {
      if (!stmts || !stmts.length) return [];
      const requests = stmts.map(s => {
        if (s && s._pipelineStmt) {
          return { type: 'execute', stmt: s._pipelineStmt };
        }
        return { type: 'execute', stmt: { sql: typeof s === 'string' ? s : (s?.sql || ''), args: [] } };
      });
      const results = await runPipeline(requests);
      return results.map(r => {
        if (r.type === 'error') return { success: false, error: r.error, results: [] };
        const result = r.response?.result;
        const cols = result?.cols ? result.cols.map(c => c.name) : [];
        const rows = (result?.rows || []).map(row => rowToObj(cols, row));
        return {
          success: true,
          results: rows,
          meta: {
            changes: result?.affected_row_count ?? 0,
            last_row_id: result?.last_insert_rowid ?? null
          }
        };
      });
    },

    // db.exec(sql) — chạy nhiều câu raw trong 1 pipeline
    async exec(sql) {
      const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      if (!stmts.length) return;
      const requests = stmts.map(s => ({ type: 'execute', stmt: { sql: s, args: [] } }));
      await runPipeline(requests);
    }
  };
}
function getDatabase(env, ctx) {
  if (!env) return null;
  if (env.TURSO_URL && env.TURSO_TOKEN) {
    return createTursoAdapter(env, ctx);
  }
  return env.DB || null;
}

// ═══════════════════════════════════════════════════════════════════════════════

function normalizeMonthKeys(inputStr) {
  const str = String(inputStr || '').trim();
  if (!str) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return [`${y}-${m}`, `${y}_${m}`, `${m}_${y}`, `${m}-${y}`, `${m}/${y}`];
  }
  const keys = [str];
  let m = str.match(/^(\d{4})[-_\/](\d{1,2})$/);
  if (m) {
    const y = m[1];
    const mo = m[2].padStart(2, '0');
    const moNoPad = String(parseInt(m[2], 10));
    keys.push(`${y}-${mo}`, `${y}_${mo}`, `${mo}_${y}`, `${mo}-${y}`, `${mo}/${y}`, `${moNoPad}_${y}`, `${y}_${moNoPad}`);
  }
  m = str.match(/^(\d{1,2})[-_\/](\d{4})$/);
  if (m) {
    const y = m[2];
    const mo = m[1].padStart(2, '0');
    const moNoPad = String(parseInt(m[1], 10));
    keys.push(`${y}-${mo}`, `${y}_${mo}`, `${mo}_${y}`, `${mo}-${y}`, `${mo}/${y}`, `${moNoPad}_${y}`, `${y}_${moNoPad}`);
  }
  return [...new Set(keys)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ WEB CRYPTO JWT (HMAC-SHA256) STATELESS AUTHENTICATION MODULE
// ═══════════════════════════════════════════════════════════════════════════════

function base64UrlEncode(bufferOrStr) {
  let binStr = "";
  if (typeof bufferOrStr === "string") {
    const bytes = new TextEncoder().encode(bufferOrStr);
    for (let i = 0; i < bytes.length; i++) binStr += String.fromCharCode(bytes[i]);
  } else if (bufferOrStr instanceof ArrayBuffer) {
    const bytes = new Uint8Array(bufferOrStr);
    for (let i = 0; i < bytes.length; i++) binStr += String.fromCharCode(bytes[i]);
  } else if (ArrayBuffer.isView(bufferOrStr)) {
    const bytes = new Uint8Array(bufferOrStr.buffer, bufferOrStr.byteOffset, bufferOrStr.byteLength);
    for (let i = 0; i < bytes.length; i++) binStr += String.fromCharCode(bytes[i]);
  }
  return btoa(binStr).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function base64UrlToBytes(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return bytes;
}

async function signJwt(payload, secret) {
  const enc = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const sigB64 = base64UrlEncode(sigBuf);
  return `${data}.${sigB64}`;
}

async function verifyJwt(token, secret) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToBytes(sigB64);
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Lấy JWT_SECRET an toàn từ biến môi trường Cloudflare Worker.
 * Tuyệt đối không dùng fallback hardcode trong mã nguồn.
 */
function getJwtSecret(env) {
  const secret = env?.JWT_SECRET;
  if (!secret || typeof secret !== "string" || secret.trim().length < 32) {
    throw new Error("SECURITY_CONFIG_ERROR: Biến môi trường JWT_SECRET chưa được cấu hình hoặc quá ngắn (< 32 ký tự). Hãy cấu hình qua Cloudflare Worker Secrets ('wrangler secret put JWT_SECRET').");
  }
  return secret.trim();
}

/**
 * CLOUDFLARE WORKER HONO BACKEND CHO PM-XEPLICH V4 THƯƠNG MẠI
 * Bảo mật cao cấp: JWT Authentication, Strict CORS, RBAC & Multi-Tenant Clamping
 */

const ALLOWED_ORIGINS = [
  "https://www.xeplichthuthuat.io.vn",
  "https://xeplichthuthuat.io.vn",
  "https://pmcg-v4.pages.dev",
  "https://pmcg-v3.pages.dev"
];

function getCorsOrigin(requestOrigin) {
  if (!requestOrigin) return "https://www.xeplichthuthuat.io.vn";
  const o = String(requestOrigin).trim();
  if (ALLOWED_ORIGINS.includes(o) || o.startsWith("http://localhost:") || o.startsWith("http://127.0.0.1:")) {
    return o;
  }
  return "https://www.xeplichthuthuat.io.vn";
}

function getCorsHeaders(origin = "") {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(origin),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, x-unit-code, X-Unit-Code",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...getCorsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  });
}

function success(data, origin = "") {
  return jsonResponse({ status: "success", data }, 200, origin);
}

function error(message, status = 400, origin = "") {
  return jsonResponse({ status: "error", error: message }, status, origin);
}

const app = new Hono();

// Global CORS & Security Headers Middleware
app.use('*', async (c, next) => {
  const origin = c.req.header("Origin") || "";
  const corsHeaders = getCorsHeaders(origin);
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  await next();
  for (const [k, v] of Object.entries(corsHeaders)) {
    c.header(k, v);
  }
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "SAMEORIGIN");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

// Global Error Handler
app.onError((err, c) => {
  const origin = c.req.header("Origin") || "";
  console.error("[Global Hono Error]:", err);
  return jsonResponse({
    status: "error",
    error: err.message || "Internal Server Error",
    code: "SERVER_ERROR"
  }, 500, origin);
});

// Root & Health Check
app.get('/', (c) => {
  const origin = c.req.header("Origin") || "";
  return success({
    message: "PM-XepLich v4 Multi-Tenant Cloudflare Hono API is running securely!",
    version: "4.0.5-PRO",
    engine: "Hono on Cloudflare Workers",
    timestamp: new Date().toISOString()
  }, origin);
});

app.get('/api/ping', (c) => {
  const origin = c.req.header("Origin") || "";
  return success({
    message: "PM-XepLich v4 Multi-Tenant Cloudflare Hono API is running securely!",
    version: "4.0.5-PRO",
    timestamp: new Date().toISOString()
  }, origin);
});

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ CHỐNG BRUTE-FORCE & PASSWORD SPRAYING (PERSISTENT DB + IN-MEMORY FALLBACK)
// ═══════════════════════════════════════════════════════════════════════════════

const loginRateLimiter = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // Khóa 15 phút nếu sai liên tiếp
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;   // Khung thời gian theo dõi 15 phút

function sanitizeInputText(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/\bon\w+\s*=/gi, "");
}

async function checkLoginRateLimit(db, clientKey) {
  const now = Date.now();
  if (db && typeof db.prepare === "function") {
    try {
      const record = await db.prepare("SELECT attempt_count, last_attempt, locked_until FROM login_attempts WHERE client_key = ?").bind(clientKey).first();
      if (record) {
        if (record.locked_until && record.locked_until > now) {
          const remainingMins = Math.ceil((record.locked_until - now) / 60000);
          return { allowed: false, remainingMins };
        }
        if (now - record.last_attempt > ATTEMPT_WINDOW_MS) {
          await db.prepare("DELETE FROM login_attempts WHERE client_key = ?").bind(clientKey).run().catch(() => {});
        }
      }
    } catch (err) {
      console.warn("[RateLimit DB Check Error]:", err);
    }
  }

  // Fallback in-memory
  const record = loginRateLimiter.get(clientKey);
  if (!record) return { allowed: true };
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingMins = Math.ceil((record.lockedUntil - now) / 60000);
    return { allowed: false, remainingMins };
  }
  if (now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
    loginRateLimiter.delete(clientKey);
    return { allowed: true };
  }
  return { allowed: true };
}

async function recordLoginFailure(db, clientKey) {
  const now = Date.now();
  let count = 1;
  let lockedUntil = 0;

  if (db && typeof db.prepare === "function") {
    try {
      const record = await db.prepare("SELECT attempt_count, last_attempt, locked_until FROM login_attempts WHERE client_key = ?").bind(clientKey).first();
      if (record) {
        count = (now - record.last_attempt > ATTEMPT_WINDOW_MS) ? 1 : (record.attempt_count + 1);
      } else {
        count = 1;
      }
      if (count >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = now + LOCKOUT_DURATION_MS;
      }
      await db.prepare(`
        INSERT INTO login_attempts (client_key, attempt_count, last_attempt, locked_until)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(client_key) DO UPDATE SET
          attempt_count = excluded.attempt_count,
          last_attempt = excluded.last_attempt,
          locked_until = excluded.locked_until
      `).bind(clientKey, count, now, lockedUntil).run().catch(async () => {
        await db.prepare("DELETE FROM login_attempts WHERE client_key = ?").bind(clientKey).run().catch(() => {});
        await db.prepare("INSERT INTO login_attempts (client_key, attempt_count, last_attempt, locked_until) VALUES (?, ?, ?, ?)").bind(clientKey, count, now, lockedUntil).run().catch(() => {});
      });
    } catch (err) {
      console.warn("[RateLimit DB Failure Record Error]:", err);
    }
  }

  // Cập nhật in-memory
  const record = loginRateLimiter.get(clientKey) || { count: 0, lockedUntil: 0, lastAttempt: now };
  record.count = (now - record.lastAttempt > ATTEMPT_WINDOW_MS) ? 1 : record.count + 1;
  record.lastAttempt = now;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  loginRateLimiter.set(clientKey, record);
  if (loginRateLimiter.size > 1000) {
    for (const [k, v] of loginRateLimiter.entries()) {
      if (now - v.lastAttempt > ATTEMPT_WINDOW_MS && (!v.lockedUntil || v.lockedUntil < now)) {
        loginRateLimiter.delete(k);
      }
    }
  }
}

async function recordLoginSuccess(db, clientKey) {
  loginRateLimiter.delete(clientKey);
  if (db && typeof db.prepare === "function") {
    try {
      await db.prepare("DELETE FROM login_attempts WHERE client_key = ?").bind(clientKey).run().catch(() => {});
    } catch (e) {}
  }
}

// Universal API Action Bridge (POST / and POST /api/action)
async function processApiRequest(c) {
  const origin = c.req.header("Origin") || "";
  let action = c.req.query("action") || "";
  let args = [];
  let reqUnitCode = c.req.header("x-unit-code") || c.req.query("unit_code") || c.req.query("unitCode") || "";

  if (c.req.method === "POST") {
    const body = await c.req.json().catch(() => ({}));
    action = body.action || action;
    args = body.args || [];
    if (!reqUnitCode && (body.unit_code || body.unitCode)) {
      reqUnitCode = body.unit_code || body.unitCode;
    }
  } else {
    const argsParam = c.req.query("args");
    if (argsParam) {
      try { args = JSON.parse(argsParam); } catch (e) {}
    }
  }

  reqUnitCode = String(reqUnitCode || "bvtks-cs2").trim().toLowerCase();

  if (!action || action === "ping") {
    return success({
      message: "PM-XepLich v4 Multi-Tenant SaaS API is running securely!",
      version: "4.0.5-PRO",
      unit_code: reqUnitCode,
      timestamp: new Date().toISOString()
    }, origin);
  }

  const env = c.env;
  const ctx = c.executionCtx;
  const db = getDatabase(env, ctx);
  if (!db) {
    return error("Database chưa được cấu hình (cần TURSO_URL hoặc D1 binding DB)!", 500, origin);
  }

  await ensureSchema(db);

  // 🛡️ JWT Authentication & RBAC Tenant Guard
  const PUBLIC_ACTIONS = new Set([
    "ping",
    "getPublicUnits",
    "getPublicTenantInfo",
    "verifyLogin",
    "checkLogin",
    "getDataVersion",
    "getSubscriptionPlans",
    "registerTrialTenant",
    "createPaymentOrder",
    "checkPaymentStatus",
    "paymentWebhook"
  ]);

  let jwtSecret = "";
  try {
    jwtSecret = getJwtSecret(env);
  } catch (errSec) {
    if (!PUBLIC_ACTIONS.has(action) || action === "verifyLogin" || action === "checkLogin" || action === "registerTrialTenant") {
      console.error("[SECURITY FATAL]", errSec.message);
      return error("Lỗi bảo mật hệ thống: Chưa cấu hình biến môi trường JWT_SECRET trên Cloudflare Worker (yêu cầu tối thiểu 32 ký tự). Hãy cấu hình qua 'wrangler secret put JWT_SECRET'!", 500, origin);
    }
  }
  let tokenPayload = null;

  if (!PUBLIC_ACTIONS.has(action)) {
    const authHeader = c.req.header("authorization") || c.req.raw?.headers?.get("authorization") || "";
    let token = "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token && c.req.query("token")) {
      token = c.req.query("token").trim();
    }

    if (!token) {
      return jsonResponse({
        status: "error",
        error: "Yêu cầu đăng nhập để truy cập dữ liệu hệ thống (Thiếu Authentication Token)!",
        code: "UNAUTHORIZED"
      }, 401, origin);
    }

    tokenPayload = await verifyJwt(token, jwtSecret);
    if (!tokenPayload) {
      return jsonResponse({
        status: "error",
        error: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!",
        code: "TOKEN_EXPIRED"
      }, 401, origin);
    }

    // 🔒 RBAC Check: Super Admin only actions
    const SUPER_ADMIN_ACTIONS = new Set([
      "getTenantsList",
      "addTenant",
      "updateTenant",
      "toggleTenantStatus",
      "deleteTenant",
      "resetTenantAdminPassword",
      "exportAllDatabase",
      "exportAllDatabaseForSuperAdmin",
      "getPaymentTransactions",
      "manualApprovePayment"
    ]);

    if (SUPER_ADMIN_ACTIONS.has(action) && tokenPayload.role !== "SUPER_ADMIN") {
      return jsonResponse({
        status: "error",
        error: "Từ chối truy cập: Thao tác này chỉ dành riêng cho tài khoản Quản Trị Tối Cao (SUPER_ADMIN)!",
        code: "FORBIDDEN"
      }, 403, origin);
    }

    // 🔒 RBAC Check: Tenant Admin only actions
    const TENANT_ADMIN_ACTIONS = new Set([
      "saveAccount",
      "deleteAccount",
      "saveSystemSettings",
      "saveGeneralSettings",
      "saveEmployees",
      "saveErrorConfig",
      "saveChamCongSymbols",
      "saveQuickLinks",
      "saveDocuments",
      "saveGoogleDriveSettings"
    ]);

    if (TENANT_ADMIN_ACTIONS.has(action) && tokenPayload.role !== "SUPER_ADMIN" && String(tokenPayload.role).toLowerCase() !== "admin") {
      return jsonResponse({
        status: "error",
        error: "Từ chối truy cập: Thao tác này yêu cầu quyền Quản trị viên (Admin) của đơn vị!",
        code: "FORBIDDEN"
      }, 403, origin);
    }
  }

  // 🏢 Tenant Clamping (Cách ly dữ liệu 100%, chống IDOR)
  let effectiveUnitCode = reqUnitCode;
  if (tokenPayload) {
    if (tokenPayload.role === "SUPER_ADMIN") {
      effectiveUnitCode = reqUnitCode || tokenPayload.unit_code || "bvtks-cs2";
    } else {
      // Tài khoản thông thường hoặc Admin đơn vị BẮT BUỘC dùng unit_code từ Token đã ký bảo mật!
      effectiveUnitCode = tokenPayload.unit_code;
    }
  }

  try {
    const res = await handleApiAction(action, args, env, c.req.raw, ctx, effectiveUnitCode, tokenPayload, origin);
    if (res && res.status === 200) {
      dispatchBackgroundSync(action, args, env, ctx, effectiveUnitCode);
    }
    return res;
  } catch (err) {
    console.error(`[API Action Error - ${action}]:`, err);
    return error(`[Server Action Error - ${action}]: ${err.message || String(err)}`, 500, origin);
  }
}

app.post('/', processApiRequest);
app.post('/api/action', processApiRequest);
app.get('/api/action', processApiRequest);
app.get('/api/bootstrap', processApiRequest);

function parseStringOrJsonArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(x => String(x).trim()).filter(Boolean);
  const str = String(val).trim();
  if (!str || str === "[]") return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(x => (typeof x === "object" ? (x.name || x.ten || "") : String(x)).trim()).filter(Boolean);
  } catch(e) {}
  return str.split(",").map(x => x.trim()).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💎 HỆ THỐNG 5 GÓI CƯỚC THƯƠNG MẠI T.I.M.E.S SAAS (FULL CHỨC NĂNG 100%)
// ═══════════════════════════════════════════════════════════════════════════════
const SUBSCRIPTION_PLANS = {
  TRIAL_15D: {
    code: "TRIAL_15D",
    name: "Dùng Thử 15 Ngày",
    durationDays: 15,
    days: 15,
    price: 0,
    priceText: "0 đ (Miễn phí)",
    monthlyRate: "Miễn phí 100%",
    monthlyEquiv: "Miễn phí",
    badge: "Trải Nghiệm",
    description: "Trải nghiệm đầy đủ 100% tính năng trong 15 ngày, không giới hạn",
    popular: false,
    features: [
      "Full 100% tính năng AI Xếp Lịch T.I.M.E.S",
      "Không giới hạn số lượng KTV và Bệnh nhân",
      "Đầy đủ danh mục Thủ thuật, Máy móc, Phòng khám",
      "Xuất báo cáo Excel, PDF & Chấm công tự động",
      "Hỗ trợ kỹ thuật trực tiếp"
    ]
  },
  PLAN_1M: {
    code: "PLAN_1M",
    name: "Gói 1 Tháng",
    durationDays: 30,
    days: 30,
    price: 400000,
    priceText: "400.000 đ",
    monthlyRate: "400.000 đ/tháng",
    monthlyEquiv: "400.000 đ / tháng",
    badge: "1 Tháng",
    description: "Linh hoạt cho 1 tháng vận hành và kiểm nghiệm thực tế",
    popular: false,
    features: [
      "Full 100% tính năng AI Xếp Lịch T.I.M.E.S",
      "Không giới hạn số lượng KTV và Bệnh nhân",
      "Đồng bộ dữ liệu thời gian thực trên Cloudflare D1",
      "Xuất báo cáo Excel, PDF & Chấm công tự động",
      "Hỗ trợ kỹ thuật 24/7"
    ]
  },
  PLAN_3M: {
    code: "PLAN_3M",
    name: "Gói 3 Tháng",
    durationDays: 90,
    days: 90,
    price: 1125000,
    priceText: "1.125.000 đ",
    monthlyRate: "375.000 đ/tháng",
    monthlyEquiv: "375.000 đ / tháng",
    badge: "Tiết kiệm 6%",
    description: "Tiết kiệm 6% chi phí cho phòng khám vừa và nhỏ (375k/tháng)",
    popular: false,
    features: [
      "Full 100% tính năng AI Xếp Lịch T.I.M.E.S",
      "Không giới hạn số lượng KTV và Bệnh nhân",
      "Đồng bộ dữ liệu thời gian thực trên Cloudflare D1",
      "Sao lưu và phục hồi dữ liệu an toàn",
      "Hỗ trợ kỹ thuật ưu tiên 24/7"
    ]
  },
  PLAN_6M: {
    code: "PLAN_6M",
    name: "Gói 6 Tháng",
    durationDays: 180,
    days: 180,
    price: 2100000,
    priceText: "2.100.000 đ",
    monthlyRate: "350.000 đ/tháng",
    monthlyEquiv: "350.000 đ / tháng",
    badge: "Phổ Biến ⭐",
    popular: true,
    description: "Khuyên dùng cho khoa phòng bệnh viện hoạt động liên tục (350k/tháng)",
    features: [
      "Full 100% tính năng AI Xếp Lịch T.I.M.E.S",
      "Không giới hạn số lượng KTV và Bệnh nhân",
      "Đồng bộ dữ liệu thời gian thực trên Cloudflare D1",
      "Sao lưu tự động & Bảo mật phân quyền RBAC đa tầng",
      "Hỗ trợ kỹ thuật chuyên sâu 24/7"
    ]
  },
  PLAN_1Y: {
    code: "PLAN_1Y",
    name: "Gói 1 Năm",
    durationDays: 365,
    days: 365,
    price: 3900000,
    priceText: "3.900.000 đ",
    monthlyRate: "325.000 đ/tháng",
    monthlyEquiv: "325.000 đ / tháng",
    badge: "Tiết Kiệm Nhất 🔥",
    bestValue: true,
    description: "Tiết kiệm tối đa 18.75% chi phí (chỉ 325.000 đ/tháng)",
    features: [
      "Full 100% tính năng AI Xếp Lịch T.I.M.E.S",
      "Không giới hạn số lượng KTV và Bệnh nhân",
      "Đồng bộ đa thiết bị không giới hạn",
      "Cập nhật miễn phí các thuật toán AI mới nhất",
      "Hỗ trợ kỹ thuật VIP & Đào tạo trực tiếp"
    ]
  },
  ENTERPRISE: {
    code: "ENTERPRISE",
    name: "Bản Quyền Vĩnh Viễn",
    durationDays: 99999,
    days: 99999,
    price: 0,
    priceText: "Vĩnh Viễn",
    monthlyRate: "Trọn Đời",
    monthlyEquiv: "Sở Hữu Trọn Đời",
    badge: "Vĩnh Viễn 👑",
    bestValue: true,
    description: "Bản quyền sở hữu trọn đời không giới hạn thời gian",
    features: [
      "Bản quyền sở hữu vĩnh viễn không giới hạn thời hạn",
      "Full 100% tính năng AI Xếp Lịch T.I.M.E.S",
      "Không giới hạn số lượng KTV và Bệnh nhân",
      "Đồng bộ đa thiết bị không giới hạn",
      "Cập nhật miễn phí các thuật toán AI mới nhất",
      "Hỗ trợ kỹ thuật trực tiếp ưu tiên cao nhất"
    ]
  }
};

function calculateSubscriptionInfo(tenant) {
  if (!tenant) return { plan_code: "ENTERPRISE", plan_name: "Bản Quyền Vĩnh Viễn", days_left: 99999, is_expired: false, is_expiring_soon: false, is_lifetime: true };
  const uCode = String(tenant.unit_code || "").trim().toLowerCase();
  const rawTier = String(tenant.plan_tier || "PRO").trim().toUpperCase();

  // Đơn vị bvtks-cs2 hoặc gói ENTERPRISE luôn có bản quyền Vĩnh viễn tuyệt đối
  if (uCode === "bvtks-cs2" || uCode === "bvtks_cs2" || rawTier === "ENTERPRISE" || rawTier === "LIFETIME") {
    return {
      plan_code: "ENTERPRISE",
      plan_name: "Bản Quyền Vĩnh Viễn",
      expires_at: "2099-12-31",
      days_left: 99999,
      is_expired: false,
      is_expiring_soon: false,
      is_lifetime: true,
      status_text: "Vĩnh Viễn"
    };
  }

  const plan = SUBSCRIPTION_PLANS[rawTier] || {
    code: rawTier,
    name: rawTier === "MASTER" ? "Chủ Quản Hệ Thống" : rawTier,
    days: 365,
    priceText: "Liên hệ"
  };

  const nowVN = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  let daysLeft = 0;
  let isExpired = false;
  if (tenant.expires_at) {
    const diffTime = new Date(tenant.expires_at).getTime() - new Date(nowVN).getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
    if (daysLeft < 0) {
      isExpired = true;
      daysLeft = 0;
    }
  }

  return {
    plan_code: rawTier,
    plan_name: plan.name,
    expires_at: tenant.expires_at || "2099-12-31",
    days_left: daysLeft,
    is_expired: isExpired,
    is_expiring_soon: (!isExpired && daysLeft <= 7 && rawTier !== "ENTERPRISE" && rawTier !== "MASTER")
  };
}

// 🗄️ ensureSchema and self-healing migrations are modularized in ./schema.js

/**
 * 🛡️ BACKEND PATIENT NAME HEALING ENGINE
 * Tự động sửa chữa các chuỗi bị lỗi ký tự (\uFFFD, \u0000) hoặc nuốt nguyên âm tiếng Việt
 */
function healBackendPatientName(rawName, forceUpperCase = false) {
  if (!rawName) return '';
  let name = String(rawName).normalize('NFC').trim();
  if (!name) return '';

  const isAllUpper = (name === name.toUpperCase() && /[A-ZÀ-Ỹ]/.test(name));
  const shouldUpper = forceUpperCase || isAllUpper;

  const hasCorruptChar = /[\ufffd\u0000]/.test(name) || /\b[A-Za-zÀ-ỹ]+\?[A-Za-zÀ-ỹ]+\b/.test(name);
  const hasSwallowedVowel = /\b(Trn|Cưng|Lnh|Nguyn|Phm)\b/i.test(name) ||
    /\bTr[\ufffd\s\?]*n\b/i.test(name) ||
    /\bL[\ufffd\s\?]*nh\b/i.test(name) ||
    /\bC[\ufffd\s\?]*ng\b/i.test(name) ||
    /\bNguy[\ufffd\s\?]*n\b/i.test(name) ||
    /\bPh[\ufffd\s\?]*m\b/i.test(name);

  if (!hasCorruptChar && !hasSwallowedVowel) {
    return shouldUpper ? name.toUpperCase() : name;
  }

  let healed = name;
  healed = healed.replace(/\bTr[\ufffd\s\?]*n\b/gi, 'Trần');
  healed = healed.replace(/\bTrn\b/gi, 'Trần');
  healed = healed.replace(/\bL[\ufffd\s\?]*nh\b/gi, 'Lãnh');
  healed = healed.replace(/\bLnh\b/gi, 'Lãnh');
  healed = healed.replace(/\bC[\ufffd\s\?]*ng\b/gi, 'Cường');
  healed = healed.replace(/\bCưng\b/gi, 'Cường');
  healed = healed.replace(/\bNguy[\ufffd\s\?]*n\b/gi, 'Nguyễn');
  healed = healed.replace(/\bNguyn\b/gi, 'Nguyễn');
  healed = healed.replace(/\bPh[\ufffd\s\?]*m\b/gi, 'Phạm');
  healed = healed.replace(/\bPhm\b/gi, 'Phạm');
  healed = healed.replace(/\bHo[\ufffd\s\?]*ng\b/gi, 'Hoàng');
  healed = healed.replace(/(Văn|Thị)\s+H[\ufffd\s\?]*ng\b/gi, '$1 Hồng');
  healed = healed.replace(/[\ufffd\u0000]/g, '').replace(/\s+/g, ' ').trim();

  if (shouldUpper) {
    return healed.toUpperCase();
  }
  return healed.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ BẢO MẬT MẬT KHẨU TIÊU CHUẨN OWASP (PBKDF2-HMAC-SHA256, 100K ITERATIONS)
// Hỗ trợ Salt ngẫu nhiên theo từng tài khoản & Transparent Auto-Migration
// ═══════════════════════════════════════════════════════════════════════════════

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const cleanHex = String(hex || "").trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return res === 0;
}

async function hashPasswordLegacy(password, pepper = null) {
  const finalPepper = pepper || (typeof env !== "undefined" && env?.LEGACY_PEPPER) || "TIMES_BVTKS_2026_SECURE_SALT_PEPPER";
  const msgUint8 = new TextEncoder().encode(password + finalPepper);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hashPasswordPBKDF2(password, saltHex = null, iterations = 100000) {
  const enc = new TextEncoder();
  const saltBytes = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const finalSaltHex = saltHex || bytesToHex(saltBytes);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(String(password)),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    256 // 32 bytes
  );

  const hashHex = bytesToHex(new Uint8Array(derivedBits));
  return `pbkdf2:sha256:${iterations}:${finalSaltHex}:${hashHex}`;
}

async function hashPassword(password) {
  return await hashPasswordPBKDF2(password);
}

function isLegacyHash(storedHash) {
  return Boolean(storedHash && typeof storedHash === "string" && !storedHash.startsWith("pbkdf2:sha256:"));
}

async function verifyPassword(password, storedHash, env = null) {
  if (!password || !storedHash) return false;
  const sHash = String(storedHash).trim();
  if (sHash.startsWith("pbkdf2:sha256:")) {
    const parts = sHash.split(":");
    if (parts.length !== 5) return false;
    const iterations = parseInt(parts[2], 10);
    const saltHex = parts[3];
    const expectedDerivedHex = parts[4];
    const computed = await hashPasswordPBKDF2(password, saltHex, iterations);
    const computedParts = computed.split(":");
    return timingSafeEqualStr(computedParts[4], expectedDerivedHex);
  } else {
    // Legacy SHA-256 with pepper (hỗ trợ cấu hình qua env.LEGACY_PEPPER)
    const pepper = (env && env.LEGACY_PEPPER) ? env.LEGACY_PEPPER : "TIMES_BVTKS_2026_SECURE_SALT_PEPPER";
    const legacy = await hashPasswordLegacy(password, pepper);
    return timingSafeEqualStr(legacy, sHash);
  }
}

async function setCaiDat(db, unitCode, key, value) {
  const vStr = typeof value === "string" ? value : JSON.stringify(value);
  try {
    const exist = await db.prepare("SELECT id FROM cai_dat WHERE unit_code = ? AND key = ?").bind(unitCode, key).first();
    if (exist && exist.id) {
      return await db.prepare("UPDATE cai_dat SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(vStr, exist.id).run();
    } else {
      return await db.prepare("INSERT INTO cai_dat (unit_code, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)").bind(unitCode, key, vStr).run();
    }
  } catch(e) {
    try {
      return await db.prepare("UPDATE cai_dat SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND key = ?").bind(vStr, unitCode, key).run();
    } catch(e2) {
      console.warn("[setCaiDat error]:", e2);
    }
  }
}

function makeBumpDataVersionStmt(db, unitCode = "bvtks-cs2") {
  const v = String(Date.now());
  return db.prepare("UPDATE cai_dat SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND key = 'data_version'").bind(v, unitCode);
}

async function bumpDataVersion(db, unitCode = "bvtks-cs2") {
  const v = String(Date.now());
  try {
    const res = await makeBumpDataVersionStmt(db, unitCode).run();
    if (!res || (res.meta && res.meta.changes === 0) || (res.rowsAffected === 0)) {
      await setCaiDat(db, unitCode, "data_version", v);
    }
  } catch(e) {
    try {
      await setCaiDat(db, unitCode, "data_version", v);
    } catch(err) {
      console.warn("[bumpDataVersion warning]:", err);
    }
  }
}

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },

  async scheduled(event, env, ctx) {
    console.log("[Worker CRON]: Scheduled event triggered on Cloudflare Edge...");
    try {
      const db = getDatabase(env, ctx);
      if (!db) return;
      await ensureSchema(db);

      // 1. 🏢 TỰ ĐỘNG CHỐT SỔ ĐỘC LẬP TRÊN ĐÁM MÂY (MULTI-TENANT SAAS)
      try {
        const tenantRes = await db.prepare("SELECT unit_code FROM tenants WHERE is_active = 1 UNION SELECT 'bvtks-cs2' AS unit_code").all().catch(() => ({ results: [] }));
        const unitCodes = (tenantRes.results || []).map(r => r.unit_code).filter(Boolean);
        if (unitCodes.length === 0) unitCodes.push("bvtks-cs2");
        for (const uCode of unitCodes) {
          await checkAutoChotSo(db, uCode);
          // Tự động huấn luyện & cập nhật mô hình AI hàng ngày trên Cloudflare Edge
          await trainAIModelOnServer(db, uCode).catch(() => {});
        }
      } catch(eAuto) {
        console.error("[Worker CRON Auto-ChotSo Error]:", eAuto);
        await checkAutoChotSo(db, "bvtks-cs2");
        await trainAIModelOnServer(db, "bvtks-cs2").catch(() => {});
      }

      // 2. 💾 TỰ ĐỘNG SAO LƯU GOOGLE DRIVE VÀO KHUNG 17:00 GIỜ VN (10:00 UTC)
      const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
      const hh = nowVN.getUTCHours();
      const mm = nowVN.getUTCMinutes();
      // Chạy backup nếu ở khung 17h (17:00 - 17:15 VN)
      if (hh === 17 && mm < 15) {
        console.log("[Worker CRON]: Executing daily automated backup trigger at 17:00 VN...");
        const rec = await db.prepare("SELECT value FROM cai_dat WHERE key = 'gdrive_webhook_url'").first();
        const webhookUrl = rec ? String(rec.value).trim() : "";
        if (!webhookUrl || !webhookUrl.startsWith("http")) {
          console.log("[Worker CRON]: No valid Google Drive Webhook URL configured. Skipping remote backup.");
        } else {
          const [
            tai_khoan, nhan_su, may_moc, phong, thu_thuat,
            benh_nhan, lich_trinh, lich_su, gio_ban_cu,
            cham_cong, thong_ke, tim_ranh, tai_lieu, cai_dat
          ] = await Promise.all([
            db.prepare("SELECT * FROM tai_khoan").all(),
            db.prepare("SELECT * FROM nhan_su").all(),
            db.prepare("SELECT * FROM may_moc").all(),
            db.prepare("SELECT * FROM phong").all(),
            db.prepare("SELECT * FROM thu_thuat").all(),
            db.prepare("SELECT * FROM benh_nhan").all(),
            db.prepare("SELECT * FROM lich_trinh").all(),
            db.prepare("SELECT * FROM lich_su").all(),
            db.prepare("SELECT * FROM gio_ban_cu").all(),
            db.prepare("SELECT * FROM cham_cong").all(),
            db.prepare("SELECT * FROM thong_ke").all(),
            db.prepare("SELECT * FROM tim_ranh").all(),
            db.prepare("SELECT * FROM tai_lieu").all(),
            db.prepare("SELECT * FROM cai_dat").all()
          ]);

          const backupData = {
            version: "v3.6",
            exportDate: new Date().toISOString(),
            tables: {
              tai_khoan: tai_khoan.results || [],
              nhan_su: nhan_su.results || [],
              may_moc: may_moc.results || [],
              phong: phong.results || [],
              thu_thuat: thu_thuat.results || [],
              benh_nhan: benh_nhan.results || [],
              lich_trinh: lich_trinh.results || [],
              lich_su: lich_su.results || [],
              gio_ban_cu: gio_ban_cu.results || [],
              cham_cong: cham_cong.results || [],
              thong_ke: thong_ke.results || [],
              tim_ranh: tim_ranh.results || [],
              tai_lieu: tai_lieu.results || [],
              cai_dat: cai_dat.results || []
            }
          };

          const dateStr = new Date().toISOString().slice(0, 10);
          const filename = `PMCG_D1_Backup_AUTO_${dateStr}.json`;

          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: filename,
              content: JSON.stringify(backupData)
            })
          });
          console.log(`[Worker CRON]: Automated backup uploaded to Google Drive successfully (${filename})!`);
        }
      }
    } catch(err) {
      console.error("[Worker CRON Error]:", err);
    }
  }
};

function dispatchBackgroundSync(action, args, env, ctx, unitCode = "bvtks-cs2") {
  const MUTATION_ACTIONS = [
    "addBenhNhan", "editBenhNhan", "deleteBenhNhan", "bulkUpdateBenhNhan",
    "saveSchedule", "chotSo", "chuyenNgayMoi", "saveGioBan", "saveChamCong", "deduplicateHistory",
    "addNhanSu", "editNhanSu", "deleteNhanSu",
    "addMayMoc", "editMayMoc", "deleteMayMoc",
    "addPhong", "editPhong", "deletePhong",
    "addThuThuat", "editThuThuat", "deleteThuThuat",
    "saveSystemSettings", "saveGeneralSettings",
    "saveProtocolsData", "saveClinicalProtocols",
    "addPhacDo", "editPhacDo", "deletePhacDo", "savePhacDo"
  ];

  if (!MUTATION_ACTIONS.includes(action)) return;
  if (!ctx || typeof ctx.waitUntil !== "function") return;

  ctx.waitUntil((async () => {
    try {
      const db = getDatabase(env);
      if (!db) return;
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE (key = 'google_sheets_webhook_url' OR key = 'backup_api_url') AND unit_code = ?").bind(unitCode).first().catch(() => null);
      let webhookUrl = rec ? String(rec.value).trim() : "";
      if (!webhookUrl || !webhookUrl.startsWith("http")) return;
      const dupIdx = webhookUrl.indexOf('/exechttps://');
      if (dupIdx !== -1) {
        webhookUrl = webhookUrl.substring(0, dupIdx + 5);
      }

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action,
          args: args,
          timestamp: new Date().toISOString()
        })
      });
      console.log(`[Background Sync]: Successfully dispatched mutation '${action}' to Google Sheets webhook.`);
    } catch (err) {
      console.warn(`[Background Sync Error] '${action}':`, err);
    }
  })());
}

async function handleApiAction(action, args, env, request, ctx, unitCode = "bvtks-cs2", tokenPayload = null, requestOrigin = "") {
  if (unitCode === "bvtks_cs2") unitCode = "bvtks-cs2";
  const db = getDatabase(env, ctx);
  if (!db) {
    return error("Database chưa được cấu hình (cần TURSO_URL hoặc D1 binding DB).", 500);
  }

  const context = {
    action,
    args,
    env,
    request,
    executionCtx: ctx,
    unitCode,
    tokenPayload,
    origin: requestOrigin,
    db,
    helpers: {
      success: (data, o = requestOrigin) => success(data, o),
      error: (msg, status = 400, o = requestOrigin) => error(msg, status, o),
      jsonResponse: (data, status = 200, o = requestOrigin) => jsonResponse(data, status, o),
      setCaiDat,
      bumpDataVersion,
      makeBumpDataVersionStmt,
      normalizeMonthKeys,
      parseStringOrJsonArray,
      sanitizeInputText,
      hashPassword,
      verifyPassword,
      isLegacyHash,
      SUBSCRIPTION_PLANS,
      calculateSubscriptionInfo,
      ensureSchema,
      healBackendPatientName,
      checkAutoChotSo,
      autoTrainAIModel: trainAIModelOnServer,
      trainAIModelOnServer,
      checkLoginRateLimit,
      recordLoginFailure,
      recordLoginSuccess,
      signJwt,
      getJwtSecret
    }
  };

  try {
    let res = await handleStaffAction(action, context);
    if (res) return res;

    res = await handlePatientsAction(action, context);
    if (res) return res;

    res = await handleSchedulesAction(action, context);
    if (res) return res;

    res = await handleTenantsAction(action, context);
    if (res) return res;

    res = await handleBackupSyncAction(action, context);
    if (res) return res;

    return error("Action không được hỗ trợ: " + action, 400, requestOrigin);
  } catch (err) {
    console.error(`[Router Error - ${action}]:`, err);
    return error(`[Router Error - ${action}]: ${err.message || String(err)}`, 500, requestOrigin);
  }
}

async function checkAutoChotSo(db, unitCode = "bvtks-cs2") {
  try {
    const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const hh = String(nowVN.getUTCHours()).padStart(2, '0');
    const mm = String(nowVN.getUTCMinutes()).padStart(2, '0');
    const currentHourMin = `${hh}:${mm}`;

    const dd = String(nowVN.getUTCDate()).padStart(2, '0');
    const month = String(nowVN.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = nowVN.getUTCFullYear();
    const todayDateStr = `${dd}/${month}/${yyyy}`;
    const todayYMD = `${yyyy}-${month}-${dd}`;

    const keysRes = await db.prepare("SELECT key, value FROM cai_dat WHERE unit_code = ? AND key IN ('chotSoTime', 'lastChotSoDate')").bind(unitCode).all();
    const settings = {};
    (keysRes.results || []).forEach(r => { settings[r.key] = r.value; });

    // Giờ chốt sổ linh hoạt theo cấu hình đơn vị (mặc định 16:20)
    let rawChotSo = settings.chotSoTime ? String(settings.chotSoTime).trim().toLowerCase().replace(/h/g, ':') : "16:20";
    rawChotSo = rawChotSo.replace(/[^0-9:]/g, '');
    const timeParts = rawChotSo.split(':').filter(Boolean);
    let chotSoTime = "16:20";
    if (timeParts.length >= 1) {
      const chH = String(Math.min(23, Math.max(0, parseInt(timeParts[0], 10) || 0))).padStart(2, '0');
      const chM = String(timeParts.length > 1 ? Math.min(59, Math.max(0, parseInt(timeParts[1], 10) || 0)) : 0).padStart(2, '0');
      chotSoTime = `${chH}:${chM}`;
    }
    const lastChotSoDate = settings.lastChotSoDate ? String(settings.lastChotSoDate).trim() : "";

    let shouldClose = false;
    let closeTargetDate = "";
    let reason = "";

    // 1. Kích hoạt chốt sổ hôm nay khi đã đến hoặc qua giờ chốt sổ (ví dụ: >= 16:20)
    const todaySched = await db.prepare(
      "SELECT date FROM lich_trinh WHERE unit_code = ? AND (date = ? OR date = ?) LIMIT 1"
    ).bind(unitCode, todayDateStr, todayYMD).first().catch(() => null);

    // CHỈ tự động chốt nếu hôm nay chưa chốt (lastChotSoDate !== todayDateStr && lastChotSoDate !== todayYMD)
    // Nếu người dùng xếp lại lịch sau giờ chốt sổ, TUYỆT ĐỐI không tự ý xóa sạch lịch vừa tạo!
    if (currentHourMin >= chotSoTime && todaySched) {
      if (lastChotSoDate !== todayDateStr && lastChotSoDate !== todayYMD) {
        shouldClose = true;
        closeTargetDate = todaySched.date || todayYMD;
        reason = `Đã đến giờ chốt sổ hàng ngày (${currentHourMin} >= ${chotSoTime})`;
      }
    }

    // 2. Cơ chế hồi phục an toàn (Safety Catch-up):
    // Chỉ tự động chốt nếu trong lich_trinh còn tồn đọng lịch của ngày QUÁ KHỨ (ngày cũ nhỏ hơn hôm nay)
    // Tuyệt đối KHÔNG chốt ngày hôm nay hoặc ngày tương lai (ngày mai, tuần sau)
    if (!shouldClose) {
      const allDatesRes = await db.prepare(
        "SELECT DISTINCT date FROM lich_trinh WHERE unit_code = ? AND date IS NOT NULL AND TRIM(date) != ''"
      ).bind(unitCode).all().catch(() => ({ results: [] }));

      const parseDateToYMD = (dStr) => {
        if (!dStr) return "";
        const s = String(dStr).trim();
        if (s.includes("/")) {
          const p = s.split("/");
          if (p.length === 3) return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
        }
        return s;
      };

      for (const row of (allDatesRes.results || [])) {
        const rowYMD = parseDateToYMD(row.date);
        if (rowYMD && rowYMD < todayYMD) {
          shouldClose = true;
          closeTargetDate = row.date;
          reason = `Tồn đọng lịch ngày cũ (${row.date}) chưa chốt`;
          break;
        }
      }
    }

    if (shouldClose) {
      const targetArchiveDate = closeTargetDate || todayYMD;
      console.log(`[Worker Auto-ChotSo]: Triggering auto closure for unit '${unitCode}'. Lý do: ${reason}. targetArchiveDate=${targetArchiveDate}, today=${todayDateStr}, lastClosed=${lastChotSoDate}, time=${currentHourMin}, chotSoTime=${chotSoTime}`);
      
      const countRes = await db.prepare("SELECT count(*) as cnt FROM lich_trinh WHERE unit_code = ?").bind(unitCode).first().catch(() => null);
      const countToArchive = countRes ? Number(countRes.cnt || 0) : 0;

      const statements = [
        // 1. Sao lưu giờ bận thực tế của nhân viên trước khi reset (chỉ lưu vào gio_ban_chung_cu theo đúng ngày chốt)
        db.prepare("DELETE FROM gio_ban_chung_cu WHERE unit_code = ? AND date = ?").bind(unitCode, targetArchiveDate),
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, busy_ranges) SELECT unit_code, ?, 'nhan_su', name, temp_busy FROM nhan_su WHERE unit_code = ? AND temp_busy IS NOT NULL AND temp_busy != '' AND temp_busy != '[]' AND temp_busy != '[\"\"]'").bind(targetArchiveDate, unitCode),
        // 2. Sao lưu giờ bận thực tế của bệnh nhân trước khi reset
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) SELECT unit_code, ?, 'benh_nhan', name, age, gio_ban FROM benh_nhan WHERE unit_code = ? AND gio_ban IS NOT NULL AND TRIM(gio_ban) != ''").bind(targetArchiveDate, unitCode),
        // 3. Sao lưu giờ ra viện của bệnh nhân trước khi reset
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) SELECT unit_code, ?, 'ra_vien', name, age, leave_time FROM benh_nhan WHERE unit_code = ? AND leave_time IS NOT NULL AND TRIM(leave_time) != '' AND LOWER(leave_time) != 'none'").bind(targetArchiveDate, unitCode),
        db.prepare("DELETE FROM lich_su WHERE unit_code = ? AND date IN (SELECT DISTINCT date FROM lich_trinh WHERE unit_code = ?)").bind(unitCode, unitCode),
        db.prepare("INSERT INTO lich_su (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed) SELECT unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ?").bind(unitCode),
        db.prepare("DELETE FROM lich_trinh WHERE unit_code = ?").bind(unitCode),
        db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND leave_time IS NOT NULL AND TRIM(leave_time) != '' AND LOWER(leave_time) != 'none'").bind(unitCode),
        db.prepare("UPDATE benh_nhan SET arrive_time = '07:30', gio_ban = '', leave_time = '', status = 'Chưa xếp', updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(unitCode),
        db.prepare("UPDATE nhan_su SET temp_busy = '[]', updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(unitCode)
      ];

      await db.batch(statements);
      // Ghi nhận lastChotSoDate theo đúng ngày thực tế vừa chốt (tránh làm tê liệt ngày hôm nay)
      await setCaiDat(db, unitCode, 'lastChotSoDate', targetArchiveDate);
      // Tự động huấn luyện mô hình AI ngay sau khi chuyển dữ liệu vào lịch sử (nếu không tắt)
      try {
        const aiSetting = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'ai_auto_train_enable'").bind(unitCode).first();
        if (!aiSetting || aiSetting.value !== '0') {
          await trainAIModelOnServer(db, unitCode).catch((err) => console.warn("Lỗi trainAIModelOnServer sau auto-chotSo:", err));
        }
      } catch(e) {
        await trainAIModelOnServer(db, unitCode).catch(() => {});
      }
      await bumpDataVersion(db, unitCode);
      console.log(`[Worker Auto-ChotSo]: Automated day closure executed successfully for unit '${unitCode}' (Date: ${targetArchiveDate}, Count: ${countToArchive})!`);
      return { closed: true, date: targetArchiveDate, reason, count: countToArchive };
    }
    return { closed: false };
  } catch (err) {
    console.error("[Worker Auto-ChotSo Error]:", err);
    return { closed: false, error: err.message };
  }
}

/**
 * 🤖 Tự động học & cập nhật mô hình AI từ toàn bộ dữ liệu lịch sử trên máy chủ / Cloud
 */
async function trainAIModelOnServer(db, unitCode = "bvtks-cs2") {
  try {
    const res = await db.prepare(
      "SELECT procedure_name, room, staff_name, start_time, machine_name FROM lich_su WHERE unit_code = ? ORDER BY id DESC LIMIT 30000"
    ).bind(unitCode).all().catch(() => ({ results: [] }));
    const historyRows = res.results || [];
    if (historyRows.length === 0) return null;

    const defaultCongestion = {
      "Kéo giãn": 1.45,
      "Siêu âm": 1.35,
      "Sóng ngắn": 1.20,
      "Parafin": 1.15,
      "Điện xung": 1.05,
      "Laser": 1.10
    };
    const defaultPatientWeights = {
      discharged: 3.5,
      rareMachine: 2.8,
      procCount: 1.8,
      earlyArrival: 1.2,
      elderly: 0.8
    };

    const model = {
      version: "4.1.3-AI",
      trainedRows: historyRows.length,
      lastTrained: new Date().toISOString(),
      staffAffinity: {},
      timeSlotDist: {},
      machineCongestion: { ...defaultCongestion },
      patientWeights: { ...defaultPatientWeights }
    };

    const machineCounts = {};

    historyRows.forEach(row => {
      if (!row) return;
      const proc = String(row.procedure_name || '').trim();
      const room = String(row.room || '').trim();
      const staff = String(row.staff_name || '').trim();
      const timeStart = String(row.start_time || '').trim();
      const machine = String(row.machine_name || '').trim();

      if (!proc || !staff) return;

      const affinityKey = `${proc.toLowerCase()}@${room.toLowerCase()}`;
      if (!model.staffAffinity[affinityKey]) model.staffAffinity[affinityKey] = {};
      model.staffAffinity[affinityKey][staff] = (model.staffAffinity[affinityKey][staff] || 0) + 1;

      if (timeStart && timeStart.includes(':')) {
        const hour = parseInt(timeStart.split(':')[0], 10) || 7;
        const isMorning = hour < 12;
        if (!model.timeSlotDist[proc]) model.timeSlotDist[proc] = { morning: 0, afternoon: 0, total: 0 };
        if (isMorning) model.timeSlotDist[proc].morning++;
        else model.timeSlotDist[proc].afternoon++;
        model.timeSlotDist[proc].total++;
      }

      if (machine && machine !== 'Thủ công' && machine !== 'None' && machine !== '--') {
        const loaiMay = machine.split('-')[0].trim();
        machineCounts[loaiMay] = (machineCounts[loaiMay] || 0) + 1;
      }
    });

    const totalMachineUses = Object.values(machineCounts).reduce((a, b) => a + b, 0);
    if (totalMachineUses > 0) {
      const avgUsesPerType = totalMachineUses / Object.keys(machineCounts).length;
      Object.keys(machineCounts).forEach(mType => {
        const ratio = machineCounts[mType] / avgUsesPerType;
        model.machineCongestion[mType] = Math.max(1.0, Math.min(2.0, Number(ratio.toFixed(2))));
      });
    }

    await setCaiDat(db, unitCode, "ai_learned_model", JSON.stringify(model));
    console.log(`[Worker AI-Train]: Successfully auto-trained AI model for unit '${unitCode}' with ${historyRows.length} rows.`);
    return model;
  } catch (err) {
    console.error("[Worker AI-Train Error]:", err);
    return null;
  }
}

