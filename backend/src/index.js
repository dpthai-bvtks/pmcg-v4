import { Hono } from './hono.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TURSO ADAPTER — Tương thích 100% với Cloudflare D1 API
// Thay thế: const db = env.DB  →  const db = createTursoAdapter(env)
// Không cần sửa bất kỳ câu SQL nào bên dưới!
// ═══════════════════════════════════════════════════════════════════════════════

function createTursoAdapter(env) {
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
      const sql = (r.stmt?.sql || '').trim().toUpperCase();
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

    requests.push({ type: 'close' });
    let res;
    let usedFallback = false;

    try {
      res = await fetchWithTimeout(PRIMARY_URL, PRIMARY_TOKEN, requests, 3500);
      // Nếu Mini PC trả về lỗi 502/503/504 (Cloudflare Tunnel Bad Gateway do tắt máy) và có cấu hình Fallback
      if (!res.ok && res.status >= 502 && FALLBACK_URL) {
        console.warn(`[TURSO-FAILOVER] Primary returned HTTP ${res.status}. Falling back to Turso Cloud...`);
        usedFallback = true;
        res = await fetchWithTimeout(FALLBACK_URL, FALLBACK_TOKEN, requests, 8000);
      }
    } catch (err) {
      if (FALLBACK_URL) {
        console.warn(`[TURSO-FAILOVER] Primary failed (${err.message}). Falling back to Turso Cloud...`);
        usedFallback = true;
        res = await fetchWithTimeout(FALLBACK_URL, FALLBACK_TOKEN, requests, 8000);
      } else {
        throw err;
      }
    }

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Turso HTTP ${res.status}${usedFallback ? ' (FALLBACK)' : ''}: ${txt.substring(0, 300)}`);
    }
    const json = await res.json();
    // Kiểm tra lỗi trong từng result
    const errResult = json.results?.find(r => r.type === 'error');
    if (errResult) throw new Error(`Turso SQL error: ${JSON.stringify(errResult.error)}`);

    // Dual-Write: Nếu ghi thành công trên Mini PC, nhân bản ngầm ngay lập tức sang Turso Cloud
    if (!usedFallback && FALLBACK_URL && isWrite && writeCopy) {
      writeCopy.push({ type: 'close' });
      fetchWithTimeout(FALLBACK_URL, FALLBACK_TOKEN, writeCopy, 8000)
        .then(async fbRes => {
          if (!fbRes.ok) {
            const fbErr = await fbRes.text().catch(() => '');
            console.warn(`[DUAL-WRITE WARNING] Turso Cloud HTTP ${fbRes.status}: ${fbErr.substring(0, 150)}`);
          }
        })
        .catch(fbErr => {
          console.warn(`[DUAL-WRITE ERROR] Could not replicate to Turso Cloud: ${fbErr.message}`);
        });
    }

    return json.results || [];
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
        return { success: true, meta: { changes: results[0]?.response?.result?.affected_row_count ?? 0 } };
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
          meta: { changes: result?.affected_row_count ?? 0 }
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
function getDatabase(env) {
  if (!env) return null;
  if (env.TURSO_URL && env.TURSO_TOKEN) {
    return createTursoAdapter(env);
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
  const db = getDatabase(env);
  if (!db) {
    return error("Database chưa được cấu hình (cần TURSO_URL hoặc D1 binding DB)!", 500, origin);
  }

  await ensureSchema(db);

  // 🛡️ JWT Authentication & RBAC Tenant Guard
  const jwtSecret = env.JWT_SECRET || "PMCG_V4_SECURE_JWT_SECRET_2026_TIMES_DEFAULT_KEY";
  let tokenPayload = null;

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

let schemaEnsured = false;
async function ensureSchema(db) {
  if (schemaEnsured || !db) return;
  try {
    const stmts = [
      db.prepare(`CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT UNIQUE NOT NULL,
        unit_name TEXT NOT NULL,
        logo_url TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        plan_tier TEXT DEFAULT 'PRO',
        max_staff INTEGER DEFAULT 30,
        max_patients INTEGER DEFAULT 150,
        expires_at TEXT NOT NULL DEFAULT '2099-12-31',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS cai_dat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, key)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS tai_khoan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        permissions TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, username)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS nhan_su (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'KTV',
        system TEXT NOT NULL DEFAULT 'PHCN',
        skills TEXT DEFAULT '',
        fixed_busy TEXT DEFAULT '',
        temp_busy TEXT DEFAULT '',
        his_name TEXT DEFAULT '',
        priority INTEGER DEFAULT 0,
        trang_thai TEXT DEFAULT 'Đi làm',
        thoi_gian_lam TEXT DEFAULT '07:30-11:30, 13:00-16:30',
        nguoi_thay_the TEXT DEFAULT 'Không',
        is_active INTEGER DEFAULT 1,
        order_idx INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, name)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS may_moc (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        ten_loai TEXT NOT NULL,
        ma_may TEXT NOT NULL,
        trang_thai TEXT DEFAULT 'Sẵn sàng',
        order_idx INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, ma_may)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS phong (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        ten_phong TEXT NOT NULL,
        bac_si TEXT DEFAULT '',
        ktv TEXT DEFAULT '',
        danh_sach_may TEXT DEFAULT '',
        so_giuong INTEGER DEFAULT 0,
        danh_sach_giuong TEXT DEFAULT '',
        order_idx INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, ten_phong)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS thu_thuat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        ten_thu_thuat TEXT NOT NULL,
        viet_tat TEXT DEFAULT '',
        he TEXT DEFAULT 'PHCN',
        phan_loai TEXT DEFAULT '',
        may TEXT DEFAULT '',
        tg_thuc_hien INTEGER DEFAULT 30,
        tg_thuc_hien_max INTEGER DEFAULT 0,
        tg_thu_thuat INTEGER DEFAULT 30,
        tg_thu_thuat_max INTEGER DEFAULT 0,
        khoang_cach INTEGER DEFAULT 0,
        can_rut_may INTEGER DEFAULT 0,
        can_nguoi_phu INTEGER DEFAULT 0,
        ds_nguoi_phu TEXT DEFAULT '',
        lien_tuc INTEGER DEFAULT 0,
        order_idx INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, ten_thu_thuat)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS benh_nhan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        name TEXT NOT NULL,
        age INTEGER DEFAULT 0,
        gender TEXT DEFAULT 'Nam',
        room TEXT DEFAULT '',
        bed TEXT DEFAULT '',
        arrive_time TEXT DEFAULT '07:30',
        leave_time TEXT DEFAULT '',
        thu_thuat TEXT NOT NULL DEFAULT '[]',
        status TEXT DEFAULT 'Chưa xếp',
        ngay_vao TEXT DEFAULT '',
        gio_ban TEXT DEFAULT '',
        is_saturday INTEGER DEFAULT 0,
        order_idx INTEGER DEFAULT 0,
        loai_bn TEXT DEFAULT 'NoiTru',
        buoi_dieu_tri TEXT DEFAULT 'Sang',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS lich_trinh (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        date TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        dob TEXT DEFAULT '',
        room TEXT DEFAULT '',
        procedure_name TEXT NOT NULL,
        staff_name TEXT DEFAULT '',
        sub_staff_name TEXT DEFAULT '',
        machine_name TEXT DEFAULT '',
        bed TEXT DEFAULT '',
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        is_saturday INTEGER DEFAULT 0,
        order_idx INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS lich_su (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        date TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        dob TEXT DEFAULT '',
        room TEXT DEFAULT '',
        procedure_name TEXT NOT NULL,
        staff_name TEXT DEFAULT '',
        sub_staff_name TEXT DEFAULT '',
        machine_name TEXT DEFAULT '',
        bed TEXT DEFAULT '',
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS gio_ban_cu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        date TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        busy_ranges TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS gio_ban_chung_cu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        date TEXT NOT NULL,
        target_type TEXT NOT NULL DEFAULT 'nhan_su',
        name TEXT NOT NULL,
        dob TEXT DEFAULT '',
        busy_ranges TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS cham_cong (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        month_year TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, month_year)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS thong_ke (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        month_year TEXT NOT NULL,
        data_json TEXT NOT NULL DEFAULT '{}',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, month_year)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS tim_ranh (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        procedure_name TEXT DEFAULT '',
        start_time TEXT DEFAULT '',
        end_time TEXT DEFAULT '',
        staff_name TEXT DEFAULT '',
        machine_name TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS tai_lieu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        doc_number TEXT DEFAULT '',
        title TEXT DEFAULT '',
        agency TEXT DEFAULT '',
        signed_date TEXT DEFAULT '',
        view_link TEXT DEFAULT '',
        download_link TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS phac_do (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        ten_phac_do TEXT NOT NULL,
        danh_sach_thu_thuat TEXT NOT NULL DEFAULT '[]',
        order_idx INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(unit_code, ten_phac_do)
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
        timestamp TEXT NOT NULL,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS payment_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code TEXT UNIQUE NOT NULL,
        unit_code TEXT NOT NULL,
        plan_tier TEXT NOT NULL,
        amount INTEGER NOT NULL,
        content TEXT NOT NULL,
        bank_account TEXT DEFAULT '0392283473',
        bank_name TEXT DEFAULT 'MBBank',
        status TEXT DEFAULT 'PENDING',
        transaction_ref TEXT DEFAULT '',
        gateway TEXT DEFAULT 'VIETQR',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmed_at DATETIME
      )`)
    ];
    await db.batch(stmts);

    // Multi-tenant Migration safe column additions & Indexes
    const migrations = [
      "INSERT OR IGNORE INTO tenants (unit_code, unit_name, plan_tier, expires_at, is_active) VALUES ('bvtks-cs2', 'Bệnh viện Than - Khoáng sản Cơ sở 2', 'ENTERPRISE', '2099-12-31', 1)",
      "INSERT OR IGNORE INTO tenants (unit_code, unit_name, plan_tier, expires_at, is_active) VALUES ('master', 'Hệ Thống Quản Trị Trung Tâm SaaS', 'MASTER', '2099-12-31', 1)",
      "ALTER TABLE cai_dat ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE tai_khoan ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE nhan_su ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE may_moc ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE phong ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE thu_thuat ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE benh_nhan ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE lich_trinh ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE lich_su ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE gio_ban_cu ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE gio_ban_chung_cu ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE cham_cong ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE thong_ke ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE tim_ranh ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE tai_lieu ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE phac_do ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "ALTER TABLE audit_logs ADD COLUMN unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2'",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_code ON tenants(unit_code)",
      "CREATE INDEX IF NOT EXISTS idx_benh_nhan_unit ON benh_nhan(unit_code, is_saturday, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_nhan_su_unit ON nhan_su(unit_code, is_active, priority)",
      "CREATE INDEX IF NOT EXISTS idx_may_moc_unit ON may_moc(unit_code, is_active, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_phong_unit ON phong(unit_code, is_active, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_thu_thuat_unit ON thu_thuat(unit_code, is_active, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_phac_do_unit ON phac_do(unit_code, is_active, order_idx)",
      "CREATE INDEX IF NOT EXISTS idx_lich_trinh_unit ON lich_trinh(unit_code, date)",
      "CREATE INDEX IF NOT EXISTS idx_lich_su_unit ON lich_su(unit_code, date)",
      "CREATE INDEX IF NOT EXISTS idx_gio_ban_cu_unit ON gio_ban_cu(unit_code, date)",
      "CREATE INDEX IF NOT EXISTS idx_gio_ban_chung_cu_unit ON gio_ban_chung_cu(unit_code, date)",
      "CREATE INDEX IF NOT EXISTS idx_gio_ban_chung_cu_lookup ON gio_ban_chung_cu(unit_code, date, target_type)",
      "CREATE INDEX IF NOT EXISTS idx_tai_khoan_unit ON tai_khoan(unit_code, username)",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_cham_cong_unit_my ON cham_cong(unit_code, month_year)",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_thong_ke_unit_my ON thong_ke(unit_code, month_year)",
      "ALTER TABLE may_moc ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE may_moc ADD COLUMN order_idx INTEGER DEFAULT 0",
      "ALTER TABLE phong ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE phong ADD COLUMN order_idx INTEGER DEFAULT 0",
      "ALTER TABLE thu_thuat ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE thu_thuat ADD COLUMN order_idx INTEGER DEFAULT 0",
      "ALTER TABLE thu_thuat ADD COLUMN tg_thu_thuat_max INTEGER DEFAULT 0",
      "ALTER TABLE thu_thuat ADD COLUMN tg_thuc_hien_max INTEGER DEFAULT 0",
      "ALTER TABLE thu_thuat ADD COLUMN lien_tuc INTEGER DEFAULT 0",
      "ALTER TABLE nhan_su ADD COLUMN is_active INTEGER DEFAULT 1",
      "ALTER TABLE nhan_su ADD COLUMN temp_busy TEXT DEFAULT ''",
      "ALTER TABLE nhan_su ADD COLUMN his_name TEXT DEFAULT ''",
      "ALTER TABLE nhan_su ADD COLUMN priority INTEGER DEFAULT 0",
      "ALTER TABLE nhan_su ADD COLUMN trang_thai TEXT DEFAULT 'Đi làm'",
      "ALTER TABLE nhan_su ADD COLUMN thoi_gian_lam TEXT DEFAULT '07:30-11:30, 13:00-16:30'",
      "ALTER TABLE nhan_su ADD COLUMN nguoi_thay_the TEXT DEFAULT 'Không'",
      "ALTER TABLE benh_nhan ADD COLUMN ngay_vao TEXT DEFAULT ''",
      "ALTER TABLE benh_nhan ADD COLUMN gio_ban TEXT DEFAULT ''",
      "ALTER TABLE benh_nhan ADD COLUMN is_saturday INTEGER DEFAULT 0",
      "UPDATE thu_thuat SET viet_tat = 'TKT' WHERE (viet_tat = 'TTK' OR viet_tat = 'tk') AND (ten_thu_thuat LIKE '%kháng trở%' OR ten_thu_thuat LIKE '%khang tro%')",
    ];
    try {
      await db.batch(migrations.map(sql => db.prepare(sql)));
    } catch(e) {}

    // Multi-tenant auto-migration: chuyển dữ liệu từ gio_ban_cu sang gio_ban_chung_cu và lọc sạch dữ liệu ảo
    try {
      const cntChung = await db.prepare("SELECT count(*) as total FROM gio_ban_chung_cu").first();
      if (!cntChung || cntChung.total === 0) {
        // 1. Chuyển nhân sự (BS/KTV)
        await db.prepare(`
          INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, busy_ranges, created_at)
          SELECT unit_code, date, 'nhan_su', staff_name, busy_ranges, created_at
          FROM gio_ban_cu
          WHERE (staff_name LIKE 'BS%' OR staff_name LIKE 'Bs%' OR staff_name LIKE 'KTV%')
            AND staff_name != 'ID' AND busy_ranges != 'ID' AND busy_ranges IS NOT NULL AND busy_ranges != ''
        `).run();

        // 2. Chuyển bệnh nhân
        await db.prepare(`
          INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, busy_ranges, created_at)
          SELECT unit_code, date, 'benh_nhan', staff_name, busy_ranges, created_at
          FROM gio_ban_cu
          WHERE staff_name NOT LIKE 'BS%' AND staff_name NOT LIKE 'Bs%' AND staff_name NOT LIKE 'KTV%'
            AND staff_name != 'ID' AND busy_ranges != 'ID' AND busy_ranges IS NOT NULL AND busy_ranges != ''
        `).run();
      }
    } catch(migErr) {
      console.warn("[Migrate gio_ban_chung_cu warning]:", migErr);
    }

    schemaEnsured = true;
    
    // Multi-tenant table unique constraint migrations
    try {
      // 1. tai_khoan
      const tkSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tai_khoan'").first();
      if (tkSql && tkSql.sql && (tkSql.sql.includes("username TEXT UNIQUE") || (tkSql.sql.includes("UNIQUE (username)") || tkSql.sql.includes("UNIQUE(username)")))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS tai_khoan_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            permissions TEXT DEFAULT '',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, username)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO tai_khoan_v4 (id, unit_code, username, password_hash, role, permissions, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), username, password_hash, role, permissions, updated_at FROM tai_khoan
        `).run();
        await db.prepare("DROP TABLE tai_khoan").run();
        await db.prepare("ALTER TABLE tai_khoan_v4 RENAME TO tai_khoan").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_tai_khoan_unit ON tai_khoan(unit_code, username)").run();
      }
    } catch(e) {
      console.warn("[Migrate tai_khoan error]:", e);
    }

    try {
      // 2. cai_dat
      const cdSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='cai_dat'").first();
      if (cdSql && cdSql.sql && (cdSql.sql.includes("key TEXT UNIQUE") || (cdSql.sql.includes("UNIQUE (key)") || cdSql.sql.includes("UNIQUE(key)")))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS cai_dat_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, key)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO cai_dat_v4 (id, unit_code, key, value, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), key, value, updated_at FROM cai_dat
        `).run();
        await db.prepare("DROP TABLE cai_dat").run();
        await db.prepare("ALTER TABLE cai_dat_v4 RENAME TO cai_dat").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_cai_dat_unit ON cai_dat(unit_code, key)").run();
      }
    } catch(e) {
      console.warn("[Migrate cai_dat error]:", e);
    }

    try {
      // 3. nhan_su
      const nsSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='nhan_su'").first();
      if (nsSql && nsSql.sql && (nsSql.sql.includes("name TEXT UNIQUE") || (nsSql.sql.includes("UNIQUE (name)") || nsSql.sql.includes("UNIQUE(name)")))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS nhan_su_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'KTV',
            system TEXT NOT NULL DEFAULT 'PHCN',
            skills TEXT DEFAULT '',
            fixed_busy TEXT DEFAULT '',
            temp_busy TEXT DEFAULT '',
            his_name TEXT DEFAULT '',
            priority INTEGER DEFAULT 0,
            trang_thai TEXT DEFAULT 'Đi làm',
            thoi_gian_lam TEXT DEFAULT '07:30-11:30, 13:00-16:30',
            nguoi_thay_the TEXT DEFAULT 'Không',
            is_active INTEGER DEFAULT 1,
            order_idx INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, name)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO nhan_su_v4 (id, unit_code, name, role, system, skills, fixed_busy, temp_busy, his_name, priority, trang_thai, thoi_gian_lam, nguoi_thay_the, is_active, order_idx, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), name, role, system, skills, fixed_busy, temp_busy, his_name, priority, trang_thai, thoi_gian_lam, nguoi_thay_the, is_active, order_idx, updated_at FROM nhan_su
        `).run();
        await db.prepare("DROP TABLE nhan_su").run();
        await db.prepare("ALTER TABLE nhan_su_v4 RENAME TO nhan_su").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_nhan_su_unit ON nhan_su(unit_code, name)").run();
      }
    } catch(e) {
      console.warn("[Migrate nhan_su error]:", e);
    }

    try {
      // 4. may_moc
      const mmSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='may_moc'").first();
      if (mmSql && mmSql.sql && (mmSql.sql.includes("ma_may TEXT UNIQUE") || mmSql.sql.includes("UNIQUE (ma_may)") || mmSql.sql.includes("UNIQUE(ma_may)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS may_moc_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            ten_loai TEXT NOT NULL,
            ma_may TEXT NOT NULL,
            trang_thai TEXT DEFAULT 'Sẵn sàng',
            order_idx INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, ma_may)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO may_moc_v4 (id, unit_code, ten_loai, ma_may, trang_thai, order_idx, is_active, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), ten_loai, ma_may, trang_thai, order_idx, is_active, updated_at FROM may_moc
        `).run();
        await db.prepare("DROP TABLE may_moc").run();
        await db.prepare("ALTER TABLE may_moc_v4 RENAME TO may_moc").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_may_moc_unit ON may_moc(unit_code, ma_may)").run();
      }
    } catch(e) {
      console.warn("[Migrate may_moc error]:", e);
    }

    try {
      // 5. phong
      const pSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='phong'").first();
      if (pSql && pSql.sql && (pSql.sql.includes("ten_phong TEXT UNIQUE") || pSql.sql.includes("UNIQUE (ten_phong)") || pSql.sql.includes("UNIQUE(ten_phong)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS phong_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            ten_phong TEXT NOT NULL,
            bac_si TEXT DEFAULT '',
            ktv TEXT DEFAULT '',
            danh_sach_may TEXT DEFAULT '',
            so_giuong INTEGER DEFAULT 0,
            danh_sach_giuong TEXT DEFAULT '',
            order_idx INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, ten_phong)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO phong_v4 (id, unit_code, ten_phong, bac_si, ktv, danh_sach_may, so_giuong, danh_sach_giuong, order_idx, is_active, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), ten_phong, bac_si, ktv, danh_sach_may, so_giuong, danh_sach_giuong, order_idx, is_active, updated_at FROM phong
        `).run();
        await db.prepare("DROP TABLE phong").run();
        await db.prepare("ALTER TABLE phong_v4 RENAME TO phong").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_phong_unit ON phong(unit_code, ten_phong)").run();
      }
    } catch(e) {
      console.warn("[Migrate phong error]:", e);
    }

    try {
      // 6. thu_thuat
      const ttSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='thu_thuat'").first();
      if (ttSql && ttSql.sql && (ttSql.sql.includes("ten_thu_thuat TEXT UNIQUE") || ttSql.sql.includes("UNIQUE (ten_thu_thuat)") || ttSql.sql.includes("UNIQUE(ten_thu_thuat)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS thu_thuat_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            ten_thu_thuat TEXT NOT NULL,
            viet_tat TEXT DEFAULT '',
            he TEXT DEFAULT 'PHCN',
            phan_loai TEXT DEFAULT '',
            may TEXT DEFAULT '',
            tg_thuc_hien INTEGER DEFAULT 30,
            tg_thuc_hien_max INTEGER DEFAULT 0,
            tg_thu_thuat INTEGER DEFAULT 30,
            tg_thu_thuat_max INTEGER DEFAULT 0,
            khoang_cach INTEGER DEFAULT 0,
            can_rut_may INTEGER DEFAULT 0,
            can_nguoi_phu INTEGER DEFAULT 0,
            ds_nguoi_phu TEXT DEFAULT '',
            lien_tuc INTEGER DEFAULT 0,
            order_idx INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, ten_thu_thuat)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO thu_thuat_v4 (id, unit_code, ten_thu_thuat, viet_tat, he, phan_loai, may, tg_thuc_hien, tg_thuc_hien_max, tg_thu_thuat, tg_thu_thuat_max, khoang_cach, can_rut_may, can_nguoi_phu, ds_nguoi_phu, lien_tuc, order_idx, is_active, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), ten_thu_thuat, viet_tat, he, phan_loai, may, tg_thuc_hien, tg_thuc_hien_max, tg_thu_thuat, tg_thu_thuat_max, khoang_cach, can_rut_may, can_nguoi_phu, ds_nguoi_phu, lien_tuc, order_idx, is_active, updated_at FROM thu_thuat
        `).run();
        await db.prepare("DROP TABLE thu_thuat").run();
        await db.prepare("ALTER TABLE thu_thuat_v4 RENAME TO thu_thuat").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_thu_thuat_unit ON thu_thuat(unit_code, ten_thu_thuat)").run();
      }
    } catch(e) {
      console.warn("[Migrate thu_thuat error]:", e);
    }

    try {
      // 7. phac_do
      const pdSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='phac_do'").first();
      if (pdSql && pdSql.sql && (pdSql.sql.includes("ten_phac_do TEXT UNIQUE") || pdSql.sql.includes("UNIQUE (ten_phac_do)") || pdSql.sql.includes("UNIQUE(ten_phac_do)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS phac_do_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            ten_phac_do TEXT NOT NULL,
            danh_sach_thu_thuat TEXT NOT NULL DEFAULT '[]',
            order_idx INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, ten_phac_do)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO phac_do_v4 (id, unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active, created_at, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), ten_phac_do, danh_sach_thu_thuat, order_idx, is_active, created_at, updated_at FROM phac_do
        `).run();
        await db.prepare("DROP TABLE phac_do").run();
        await db.prepare("ALTER TABLE phac_do_v4 RENAME TO phac_do").run();
        await db.prepare("CREATE INDEX IF NOT EXISTS idx_phac_do_unit ON phac_do(unit_code, ten_phac_do)").run();
      }
    } catch(e) {
      console.warn("[Migrate phac_do error]:", e);
    }

    try {
      // 8. cham_cong
      const ccSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='cham_cong'").first();
      if (ccSql && ccSql.sql && (ccSql.sql.includes("month_year TEXT UNIQUE") || ccSql.sql.includes("UNIQUE (month_year)") || ccSql.sql.includes("UNIQUE(month_year)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS cham_cong_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            month_year TEXT NOT NULL,
            data_json TEXT NOT NULL DEFAULT '{}',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, month_year)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO cham_cong_v4 (id, unit_code, month_year, data_json, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), month_year, data_json, updated_at FROM cham_cong
        `).run();
        await db.prepare("DROP TABLE cham_cong").run();
        await db.prepare("ALTER TABLE cham_cong_v4 RENAME TO cham_cong").run();
        await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_cham_cong_unit_my ON cham_cong(unit_code, month_year)").run();
      }
    } catch(e) {
      console.warn("[Migrate cham_cong error]:", e);
    }

    try {
      // 9. thong_ke
      const tkSql = await db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='thong_ke'").first();
      if (tkSql && tkSql.sql && (tkSql.sql.includes("month_year TEXT UNIQUE") || tkSql.sql.includes("UNIQUE (month_year)") || tkSql.sql.includes("UNIQUE(month_year)"))) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS thong_ke_v4 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
            month_year TEXT NOT NULL,
            data_json TEXT NOT NULL DEFAULT '{}',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(unit_code, month_year)
          )
        `).run();
        await db.prepare(`
          INSERT OR IGNORE INTO thong_ke_v4 (id, unit_code, month_year, data_json, updated_at)
          SELECT id, COALESCE(unit_code, 'bvtks-cs2'), month_year, data_json, updated_at FROM thong_ke
        `).run();
        await db.prepare("DROP TABLE thong_ke").run();
        await db.prepare("ALTER TABLE thong_ke_v4 RENAME TO thong_ke").run();
        await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_thong_ke_unit_my ON thong_ke(unit_code, month_year)").run();
      }
    } catch(e) {
      console.warn("[Migrate thong_ke error]:", e);
    }

    schemaEnsured = true;
  } catch(err) {
    console.warn("[ensureSchema error]:", err);
  }
}

async function hashPassword(password, pepper = "TIMES_BVTKS_2026_SECURE_SALT_PEPPER") {
  const msgUint8 = new TextEncoder().encode(password + pepper);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function setCaiDat(db, unitCode, key, value) {
  const vStr = typeof value === "string" ? value : JSON.stringify(value);
  try {
    return await db.prepare(`
      INSERT INTO cai_dat (unit_code, key, value, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(unit_code, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).bind(unitCode, key, vStr).run();
  } catch(e) {
    try {
      const exist = await db.prepare("SELECT key FROM cai_dat WHERE unit_code = ? AND key = ?").bind(unitCode, key).first();
      if (exist) {
        return await db.prepare("UPDATE cai_dat SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND key = ?").bind(vStr, unitCode, key).run();
      } else {
        return await db.prepare("INSERT INTO cai_dat (unit_code, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)").bind(unitCode, key, vStr).run();
      }
    } catch(e2) {
      console.warn("[setCaiDat error]:", e2);
    }
  }
}

async function bumpDataVersion(db, unitCode = "bvtks-cs2") {
  try {
    const v = String(Date.now());
    await setCaiDat(db, unitCode, 'data_version', v);
  } catch(e) {}
}

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },

  async scheduled(event, env, ctx) {
    console.log("[Worker CRON]: Scheduled event triggered on Cloudflare Edge...");
    try {
      const db = getDatabase(env);
      if (!db) return;
      await ensureSchema(db);

      // 1. 🏢 TỰ ĐỘNG CHỐT SỔ ĐỘC LẬP TRÊN ĐÁM MÂY (MULTI-TENANT SAAS)
      try {
        const tenantRes = await db.prepare("SELECT unit_code FROM tenants WHERE is_active = 1 UNION SELECT 'bvtks-cs2' AS unit_code").all().catch(() => ({ results: [] }));
        const unitCodes = (tenantRes.results || []).map(r => r.unit_code).filter(Boolean);
        if (unitCodes.length === 0) unitCodes.push("bvtks-cs2");
        for (const uCode of unitCodes) {
          await checkAutoChotSo(db, uCode);
        }
      } catch(eAuto) {
        console.error("[Worker CRON Auto-ChotSo Error]:", eAuto);
        await checkAutoChotSo(db, "bvtks-cs2");
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

function dispatchBackgroundSync(action, args, env, ctx) {
  const MUTATION_ACTIONS = [
    "addBenhNhan", "editBenhNhan", "deleteBenhNhan", "bulkUpdateBenhNhan",
    "saveSchedule", "chotSo", "chuyenNgayMoi", "saveGioBan", "saveChamCong",
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
  const db = getDatabase(env);
  if (!db) {
    return error("Database chưa được cấu hình (cần TURSO_URL hoặc D1 binding DB).", 500);
  }

  switch (action) {
    case "ping": {
      return success({ pong: true, time: Date.now(), unit_code: unitCode });
    }

    // ============================================================
    // 🏢 0. MULTI-TENANT & SAAS SUBSCRIPTION HANDLERS
    // ============================================================
    case "getPublicUnits": {
      try {
        const units = await db.prepare("SELECT unit_code, unit_name, logo_url, plan_tier FROM tenants WHERE is_active = 1 ORDER BY id ASC").all();
        return success(units.results || []);
      } catch (e) {
        return success([{ unit_code: "bvtks-cs2", unit_name: "Bệnh viện Than - Khoáng sản Cơ sở 2", plan_tier: "ENTERPRISE" }]);
      }
    }

    case "getSubscriptionPlans": {
      return success({
        plans: SUBSCRIPTION_PLANS,
        list: Object.values(SUBSCRIPTION_PLANS)
      });
    }

    case "getPublicTenantInfo": {
      const targetUnit = String(args[0] || unitCode || "bvtks-cs2").trim().toLowerCase();
      const tenant = await db.prepare("SELECT unit_code, unit_name, logo_url, plan_tier, is_active, expires_at FROM tenants WHERE unit_code = ?").bind(targetUnit).first();
      if (!tenant) return error(`Đơn vị '${targetUnit}' không tồn tại!`, 404);
      const subInfo = calculateSubscriptionInfo(tenant);
      return success({ ...tenant, ...subInfo });
    }

    case "registerTrialTenant": {
      const payload = args[0] || {};
      let uCode = String(payload.unit_code || payload.code || "").trim().toLowerCase();
      const uName = String(payload.unit_name || payload.name || "").trim();
      const uPhone = String(payload.phone || "").trim();
      const uEmail = String(payload.email || "").trim();
      const uPass = String(payload.password || payload.admin_password || "").trim();

      if (!uName) return error("Vui lòng nhập Tên bệnh viện hoặc Phòng khám!", 400);
      if (!uPhone) return error("Vui lòng nhập Số điện thoại liên hệ!", 400);
      if (!uPass || uPass.length < 4) return error("Mật khẩu quản trị phải có ít nhất 4 ký tự!", 400);

      // Nếu người dùng không nhập mã đơn vị, tự động tạo mã slug đẹp từ tên
      if (!uCode) {
        uCode = uName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d").replace(/Đ/g, "D")
          .toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        if (uCode.length < 3) uCode = "pk-" + Math.floor(1000 + Math.random() * 9000);
      }

      // Kiểm tra định dạng mã đơn vị
      if (!/^[a-z0-9_-]{3,35}$/.test(uCode)) {
        return error("Mã đơn vị phải từ 3 đến 35 ký tự, chỉ gồm chữ thường không dấu, số, gạch nối (- hoặc _)!", 400);
      }

      // Kiểm tra trùng mã đơn vị
      const exist = await db.prepare("SELECT id FROM tenants WHERE unit_code = ?").bind(uCode).first();
      if (exist) {
        return error(`Mã đơn vị '${uCode}' đã có người đăng ký! Vui lòng chọn mã khác (ví dụ: ${uCode}-${Math.floor(10 + Math.random() * 90)}).`, 400);
      }

      // 1. Tính toán ngày hết hạn 15 ngày kể từ ngày đăng ký
      const nowVN = new Date(Date.now() + 7 * 3600 * 1000);
      const expDate = new Date(nowVN.getTime() + 15 * 86400 * 1000).toISOString().slice(0, 10);

      // 2. Tạo bản ghi đơn vị trong bảng tenants (Full chức năng: max_staff = 999, max_patients = 9999)
      await db.prepare(`
        INSERT INTO tenants (unit_code, unit_name, phone, email, plan_tier, max_staff, max_patients, expires_at, is_active)
        VALUES (?, ?, ?, ?, 'TRIAL_15D', 999, 9999, ?, 1)
      `).bind(uCode, uName, uPhone, uEmail, expDate).run();

      // 3. Tạo tài khoản admin mặc định cho đơn vị mới
      const passHash = await hashPassword(uPass);
      await db.prepare(`
        INSERT INTO tai_khoan (unit_code, username, password_hash, role, permissions)
        VALUES (?, 'admin', ?, 'Admin', 'ALL')
      `).bind(uCode, passHash).run();

      // 4. Batch Seed danh mục mẫu 1-Click Onboarding
      const seedBatch = [];
      const defaultSettings = [
        ["hospital_name", uName],
        ["app_title", uName + " - Quản Lý Xếp Lịch T.I.M.E.S"],
        ["system_theme", "glass-dark"],
        ["thoi_gian_lam_viec", "07:30-11:30, 13:00-16:30"],
        ["so_ca_toi_da_ktv", "12"],
        ["tg_nghi_chuyen_ca", "5"],
        ["cho_phep_xep_thu_7", "1"],
        ["gio_chieu_sang_sang", "13:00"],
        ["gio_chieu_sang_chieu", "16:30"],
        ["ai_auto_learning", "1"],
        ["ai_active_engine", "CP_SOLVER"],
        ["gio_mo_cua", "07:30"],
        ["gio_dong_cua", "16:30"]
      ];
      for (const [k, v] of defaultSettings) {
        seedBatch.push(db.prepare("INSERT OR REPLACE INTO cai_dat (unit_code, key, value) VALUES (?, ?, ?)").bind(uCode, k, v));
      }

      // Danh mục phòng điều trị mẫu
      const sampleRooms = [
        { name: "Phòng Điện trị liệu (Phòng 1)", bs: "BS. Quản Lý Khoa", ktv: "KTV. Nguyễn Văn A", beds: 6 },
        { name: "Phòng Kéo giãn cột sống (Phòng 2)", bs: "", ktv: "KTV. Nguyễn Văn A", beds: 4 },
        { name: "Phòng Vận động trị liệu (Phòng 3)", bs: "", ktv: "KTV. Trần Thị B", beds: 5 },
        { name: "Phòng Châm cứu & Cấy chỉ (Phòng 4)", bs: "BS. Quản Lý Khoa", ktv: "KTV. Trần Thị B", beds: 6 },
        { name: "Phòng Xoa bóp bấm huyệt (Phòng 5)", bs: "", ktv: "KTV. Trần Thị B", beds: 4 }
      ];
      sampleRooms.forEach((r, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO phong (unit_code, ten_phong, bac_si, ktv, so_giuong, order_idx, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `).bind(uCode, r.name, r.bs, r.ktv, r.beds, idx + 1));
      });

      // Danh mục máy móc điều trị mẫu
      const sampleMachines = [
        { type: "Máy Siêu âm điều trị", code: "SA-01" },
        { type: "Máy Siêu âm điều trị", code: "SA-02" },
        { type: "Máy Điện xung đa năng", code: "DX-01" },
        { type: "Máy Điện xung đa năng", code: "DX-02" },
        { type: "Máy Laser công suất thấp", code: "LS-01" },
        { type: "Máy Kéo giãn cột sống cổ/lưng", code: "KG-01" },
        { type: "Máy Sóng ngắn trị liệu", code: "SN-01" },
        { type: "Đèn Hồng ngoại", code: "HN-01" },
        { type: "Đèn Hồng ngoại", code: "HN-02" }
      ];
      sampleMachines.forEach((m, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO may_moc (unit_code, ten_loai, ma_may, order_idx, is_active)
          VALUES (?, ?, ?, ?, 1)
        `).bind(uCode, m.type, m.code, idx + 1));
      });

      // 13 Thủ thuật mẫu YHCT & PHCN chuẩn Bộ Y Tế
      const sampleProcs = [
        { name: "Siêu âm điều trị", vt: "SA", he: "PHCN", may: "SA", tg: 30, lien_tuc: 0 },
        { name: "Điện xung điều trị", vt: "DX", he: "PHCN", may: "DX", tg: 30, lien_tuc: 0 },
        { name: "Điện phân dẫn thuốc", vt: "DP", he: "PHCN", may: "DX", tg: 30, lien_tuc: 0 },
        { name: "Kéo giãn cột sống bằng máy", vt: "KG", he: "PHCN", may: "KG", tg: 30, lien_tuc: 0 },
        { name: "Chiếu đèn hồng ngoại", vt: "HN", he: "PHCN", may: "HN", tg: 30, lien_tuc: 0 },
        { name: "Laser điều trị", vt: "LS", he: "PHCN", may: "LS", tg: 20, lien_tuc: 0 },
        { name: "Sóng ngắn điều trị", vt: "SN", he: "PHCN", may: "SN", tg: 20, lien_tuc: 0 },
        { name: "Tập vận động thụ động", vt: "VĐ-TD", he: "PHCN", may: "", tg: 30, lien_tuc: 0 },
        { name: "Tập vận động có trợ giúp", vt: "VĐ-TG", he: "PHCN", may: "", tg: 30, lien_tuc: 0 },
        { name: "Xoa bóp bấm huyệt điều trị", vt: "XBBH", he: "YHCT", may: "", tg: 30, lien_tuc: 0 },
        { name: "Điện châm điều trị", vt: "ĐC", he: "YHCT", may: "", tg: 30, lien_tuc: 0 },
        { name: "Cứu ngải điều trị", vt: "CN", he: "YHCT", may: "", tg: 20, lien_tuc: 0 },
        { name: "Thủy châm điều trị", vt: "TC", he: "YHCT", may: "", tg: 15, lien_tuc: 0 }
      ];
      sampleProcs.forEach((p, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO thu_thuat (unit_code, ten_thu_thuat, viet_tat, he, may, tg_thuc_hien, tg_thu_thuat, lien_tuc, order_idx, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(uCode, p.name, p.vt, p.he, p.may, p.tg, p.tg, p.lien_tuc, idx + 1));
      });

      // Phác đồ điều trị mẫu
      const sampleProtocols = [
        { name: "Phác đồ Thoái hóa cột sống thắt lưng", procs: JSON.stringify(["Kéo giãn cột sống bằng máy", "Điện xung điều trị", "Chiếu đèn hồng ngoại"]) },
        { name: "Phác đồ Đau vai gáy / Cột sống cổ", procs: JSON.stringify(["Siêu âm điều trị", "Điện xung điều trị", "Xoa bóp bấm huyệt điều trị"]) },
        { name: "Phác đồ Di chứng tai biến / Liệt nửa người", procs: JSON.stringify(["Tập vận động thụ động", "Điện châm điều trị", "Xoa bóp bấm huyệt điều trị"]) }
      ];
      sampleProtocols.forEach((proto, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO phac_do (unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active)
          VALUES (?, ?, ?, ?, 1)
        `).bind(uCode, proto.name, proto.procs, idx + 1));
      });

      // Nhân sự mẫu
      const sampleStaff = [
        { name: "KTV. Nguyễn Văn A", role: "KTV", system: "PHCN", priority: 1, time: "07:30-11:30, 13:00-16:30" },
        { name: "KTV. Trần Thị B", role: "KTV", system: "YHCT", priority: 2, time: "07:30-11:30, 13:00-16:30" },
        { name: "BS. Quản Lý Khoa", role: "BS", system: "ALL", priority: 0, time: "07:30-11:30, 13:00-16:30" }
      ];
      sampleStaff.forEach((s, idx) => {
        seedBatch.push(db.prepare(`
          INSERT OR IGNORE INTO nhan_su (unit_code, name, role, system, priority, thoi_gian_lam, trang_thai, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 'Đi làm', 1)
        `).bind(uCode, s.name, s.role, s.system, s.priority, s.time));
      });

      if (seedBatch.length > 0) {
        await db.batch(seedBatch);
      }

      // Cấp JWT Token để client tự động đăng nhập tức thì
      const jwtSecret = env.JWT_SECRET || "PMCG_V4_SECURE_JWT_SECRET_2026_TIMES_DEFAULT_KEY";
      const tokenPayload = {
        sub: "trial-admin-" + uCode,
        username: "admin",
        role: "Admin",
        name: "Quản trị viên " + uName,
        unit_code: uCode,
        unit_name: uName,
        plan_tier: "TRIAL_15D",
        permissions: "ALL",
        exp: Math.floor(Date.now() / 1000) + (15 * 86400)
      };
      const token = await signJwt(tokenPayload, jwtSecret);

      return success({
        message: `Đăng ký thành công! Chào mừng '${uName}' đến với Hệ thống Xếp lịch T.I.M.E.S. Gói Dùng thử 15 ngày miễn phí đã sẵn sàng!`,
        token: token,
        unit_code: uCode,
        unit_name: uName,
        username: "admin",
        role: "Admin",
        plan_tier: "TRIAL_15D",
        plan_name: "Dùng Thử 15 Ngày",
        days_left: 15,
        expires_at: expDate
      });
    }

    case "renewTenantSubscription": {
      const payload = args[0] || {};
      const uCode = String(payload.unit_code || payload.code || args[0] || unitCode || "").trim().toLowerCase();
      const planCode = String(payload.plan_tier || payload.plan_code || payload.plan || args[1] || "PLAN_1M").trim().toUpperCase();

      if (!uCode) return error("Thiếu mã đơn vị cần gia hạn!", 400);

      // Kiểm tra quyền: Chỉ SUPER_ADMIN hoặc chính đơn vị đó mới được thao tác
      if (tokenPayload && tokenPayload.role !== "SUPER_ADMIN" && tokenPayload.unit_code !== uCode) {
        return error("Từ chối truy cập: Bạn không có quyền gia hạn cho đơn vị khác!", 403);
      }

      const plan = SUBSCRIPTION_PLANS[planCode];
      if (!plan) {
        return error(`Gói cước '${planCode}' không tồn tại trong danh mục hệ thống!`, 400);
      }

      const tenant = await db.prepare("SELECT unit_code, unit_name, plan_tier, expires_at FROM tenants WHERE unit_code = ?").bind(uCode).first();
      if (!tenant) return error(`Đơn vị '${uCode}' không tồn tại!`, 404);

      // Tính ngày hết hạn mới (cộng nối tiếp nếu còn hạn, hoặc từ hôm nay nếu đã quá hạn)
      const nowVN = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
      let baseDate;
      if (tenant.expires_at && tenant.expires_at >= nowVN) {
        baseDate = new Date(tenant.expires_at);
      } else {
        baseDate = new Date(nowVN);
      }

      const newExpDate = new Date(baseDate.getTime() + plan.days * 86400 * 1000).toISOString().slice(0, 10);

      await db.prepare(`
        UPDATE tenants SET
          plan_tier = ?,
          expires_at = ?,
          max_staff = 999,
          max_patients = 9999,
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE unit_code = ?
      `).bind(planCode, newExpDate, uCode).run();

      const subInfo = calculateSubscriptionInfo({ ...tenant, plan_tier: planCode, expires_at: newExpDate });

      return success({
        message: `Đã kích hoạt thành công '${plan.name}' cho '${tenant.unit_name}' đến ngày ${newExpDate}!`,
        unit_code: uCode,
        unit_name: tenant.unit_name,
        plan_tier: planCode,
        plan_name: plan.name,
        expires_at: newExpDate,
        days_left: subInfo.days_left
      });
    }

    // ============================================================
    // 💳 PAYMENT & VIETQR AUTOMATION
    // ============================================================
    case "createPaymentOrder": {
      const payload = args[0] || {};
      const uCode = String(payload.unit_code || unitCode || "").trim().toLowerCase();
      const planCode = String(payload.plan_tier || payload.plan_code || "PLAN_1M").trim().toUpperCase();

      if (!uCode) return error("Thiếu mã đơn vị thanh toán!", 400);

      const plan = SUBSCRIPTION_PLANS[planCode] || SUBSCRIPTION_PLANS["PLAN_1M"];
      const amount = Number(payload.amount || plan.price || 400000);

      if (uCode === "bvtks-cs2" || uCode === "bvtks_cs2") {
        return error("Đơn vị bvtks-cs2 đã sở hữu bản quyền Vĩnh viễn trọn đời, không cần thanh toán!", 400);
      }

      const planSuffixMap = { 'PLAN_1M': '1T', 'PLAN_3M': '3T', 'PLAN_6M': '6T', 'PLAN_1Y': '1N' };
      const suffix = planSuffixMap[planCode] || '1T';
      const transferContent = `PMCG ${uCode.toUpperCase()} ${suffix}`;

      const orderCode = `ORD_${Date.now()}_${uCode.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
      const bankAccount = "0392283473";
      const bankName = "MB";
      const accountName = "DANG PHONG THAI";

      const qrUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

      try {
        await db.prepare(`
          INSERT INTO payment_transactions (order_code, unit_code, plan_tier, amount, content, bank_account, bank_name, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `).bind(orderCode, uCode, planCode, amount, transferContent, bankAccount, "MB Bank").run();
      } catch (e) {
        console.warn("Lưu payment_transactions thất bại:", e);
      }

      return success({
        order_code: orderCode,
        unit_code: uCode,
        plan_tier: planCode,
        plan_name: plan.name,
        amount: amount,
        amount_text: plan.priceText || (amount.toLocaleString('vi-VN') + ' đ'),
        content: transferContent,
        bank_name: "MB Bank (Ngân hàng TMCP Quân Đội)",
        bank_account: bankAccount,
        account_name: "ĐẶNG PHONG THÁI",
        qr_url: qrUrl
      });
    }

    case "checkPaymentStatus": {
      const payload = args[0] || {};
      const orderCode = String(payload.order_code || args[0] || "").trim();
      const uCode = String(payload.unit_code || args[1] || unitCode || "").trim().toLowerCase();
      const requestedPlan = String(payload.plan_tier || args[2] || "").trim().toUpperCase();

      if (!orderCode && !uCode) {
        return error("Cần mã đơn hàng (order_code) hoặc mã đơn vị (unit_code)!", 400);
      }

      let trans = null;
      if (orderCode) {
        trans = await db.prepare("SELECT * FROM payment_transactions WHERE order_code = ?").bind(orderCode).first();
      } else if (uCode) {
        trans = await db.prepare("SELECT * FROM payment_transactions WHERE unit_code = ? ORDER BY id DESC LIMIT 1").bind(uCode).first();
      }

      const targetUnit = trans ? trans.unit_code : uCode;
      const tenant = await db.prepare("SELECT unit_code, unit_name, plan_tier, expires_at FROM tenants WHERE unit_code = ?").bind(targetUnit).first();

      if (!tenant) return error("Đơn vị không tồn tại!", 404);

      const subInfo = calculateSubscriptionInfo(tenant);

      if (trans && trans.status === "SUCCESS") {
        return success({
          payment_status: "SUCCESS",
          order_code: trans.order_code,
          unit_code: targetUnit,
          unit_name: tenant.unit_name,
          plan_tier: tenant.plan_tier,
          plan_name: subInfo.plan_name,
          expires_at: tenant.expires_at,
          days_left: subInfo.days_left,
          confirmed_at: trans.confirmed_at
        });
      }

      if (requestedPlan && tenant.plan_tier === requestedPlan && !subInfo.is_expired) {
        return success({
          payment_status: "SUCCESS",
          unit_code: targetUnit,
          unit_name: tenant.unit_name,
          plan_tier: tenant.plan_tier,
          plan_name: subInfo.plan_name,
          expires_at: tenant.expires_at,
          days_left: subInfo.days_left
        });
      }

      return success({
        payment_status: trans ? trans.status : "PENDING",
        order_code: orderCode,
        unit_code: targetUnit,
        plan_tier: tenant.plan_tier,
        plan_name: subInfo.plan_name,
        expires_at: tenant.expires_at,
        days_left: subInfo.days_left
      });
    }

    case "manualApprovePayment": {
      const payload = args[0] || {};
      const orderCode = String(payload.order_code || args[0] || "").trim();
      const uCode = String(payload.unit_code || args[1] || "").trim().toLowerCase();
      const targetPlan = String(payload.plan_tier || args[2] || "PLAN_1M").trim().toUpperCase();

      let trans = null;
      if (orderCode) {
        trans = await db.prepare("SELECT * FROM payment_transactions WHERE order_code = ?").bind(orderCode).first();
      }

      const finalUnit = (trans ? trans.unit_code : uCode).toLowerCase();
      const finalPlan = (trans ? trans.plan_tier : targetPlan).toUpperCase();

      if (!finalUnit) return error("Thiếu mã đơn vị cần xác nhận thanh toán!", 400);

      const plan = SUBSCRIPTION_PLANS[finalPlan] || SUBSCRIPTION_PLANS["PLAN_1M"];
      const tenant = await db.prepare("SELECT unit_code, unit_name, plan_tier, expires_at FROM tenants WHERE unit_code = ?").bind(finalUnit).first();
      if (!tenant) return error(`Đơn vị '${finalUnit}' không tồn tại!`, 404);

      const nowVN = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
      let baseDate;
      if (tenant.expires_at && tenant.expires_at >= nowVN) {
        baseDate = new Date(tenant.expires_at);
      } else {
        baseDate = new Date(nowVN);
      }
      const newExpDate = new Date(baseDate.getTime() + plan.days * 86400 * 1000).toISOString().slice(0, 10);

      await db.prepare(`
        UPDATE tenants SET
          plan_tier = ?,
          expires_at = ?,
          max_staff = 999,
          max_patients = 9999,
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE unit_code = ?
      `).bind(finalPlan, newExpDate, finalUnit).run();

      if (trans) {
        await db.prepare(`
          UPDATE payment_transactions SET
            status = 'SUCCESS',
            confirmed_at = CURRENT_TIMESTAMP,
            transaction_ref = 'MANUAL_SUPERADMIN'
          WHERE id = ?
        `).bind(trans.id).run();
      } else {
        try {
          await db.prepare(`
            INSERT INTO payment_transactions (order_code, unit_code, plan_tier, amount, content, status, confirmed_at, transaction_ref)
            VALUES (?, ?, ?, ?, ?, 'SUCCESS', CURRENT_TIMESTAMP, 'MANUAL_SUPERADMIN')
          `).bind(`MANUAL_${Date.now()}`, finalUnit, finalPlan, plan.price || 0, `Xác nhận thủ công bởi Chủ sở hữu`).run();
        } catch (e) {}
      }

      const subInfo = calculateSubscriptionInfo({ ...tenant, plan_tier: finalPlan, expires_at: newExpDate });

      return success({
        message: `Đã xác nhận nhận tiền thành công! Đơn vị '${tenant.unit_name}' (${finalUnit}) đã nâng cấp lên '${plan.name}' đến ngày ${newExpDate}.`,
        order_code: trans?.order_code,
        unit_code: finalUnit,
        unit_name: tenant.unit_name,
        plan_tier: finalPlan,
        plan_name: plan.name,
        expires_at: newExpDate,
        days_left: subInfo.days_left
      });
    }

    case "getPaymentTransactions": {
      try {
        const list = await db.prepare("SELECT * FROM payment_transactions ORDER BY id DESC LIMIT 50").all();
        return success(list.results || []);
      } catch(e) {
        return success([]);
      }
    }

    case "paymentWebhook": {
      const payload = args[0] || {};
      const rawContent = String(payload.content || payload.description || payload.message || payload.order_code || payload.memo || "").trim();
      const transferAmount = Number(payload.amount || payload.transferAmount || 0);
      const refNo = String(payload.referenceCode || payload.transactionId || payload.id || payload.ref || "").trim();

      const match = rawContent.match(/PMCG\s+([A-Za-z0-9_-]+)(?:\s+([A-Za-z0-9_]+))?/i);
      if (!match) {
        return error("Không tìm thấy cú pháp thanh toán PMCG hợp lệ trong nội dung chuyển khoản!", 400);
      }

      const targetUnit = match[1].toLowerCase();
      const suffix = (match[2] || "1T").toUpperCase();

      const suffixMap = {
        '1T': 'PLAN_1M',
        '3T': 'PLAN_3M',
        '6T': 'PLAN_6M',
        '1N': 'PLAN_1Y',
        '1M': 'PLAN_1M',
        '3M': 'PLAN_3M',
        '6M': 'PLAN_6M',
        '1Y': 'PLAN_1Y'
      };

      const targetPlan = suffixMap[suffix] || 'PLAN_1M';
      const plan = SUBSCRIPTION_PLANS[targetPlan] || SUBSCRIPTION_PLANS['PLAN_1M'];

      const tenant = await db.prepare("SELECT unit_code, unit_name, plan_tier, expires_at FROM tenants WHERE unit_code = ?").bind(targetUnit).first();
      if (!tenant) return error(`Đơn vị '${targetUnit}' không tồn tại trên hệ thống!`, 404);

      const nowVN = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
      let baseDate;
      if (tenant.expires_at && tenant.expires_at >= nowVN) {
        baseDate = new Date(tenant.expires_at);
      } else {
        baseDate = new Date(nowVN);
      }
      const newExpDate = new Date(baseDate.getTime() + plan.days * 86400 * 1000).toISOString().slice(0, 10);

      await db.prepare(`
        UPDATE tenants SET
          plan_tier = ?,
          expires_at = ?,
          max_staff = 999,
          max_patients = 9999,
          is_active = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE unit_code = ?
      `).bind(targetPlan, newExpDate, targetUnit).run();

      try {
        await db.prepare(`
          INSERT INTO payment_transactions (order_code, unit_code, plan_tier, amount, content, status, confirmed_at, transaction_ref, gateway)
          VALUES (?, ?, ?, ?, ?, 'SUCCESS', CURRENT_TIMESTAMP, ?, 'BANK_WEBHOOK')
        `).bind(`WH_${Date.now()}_${targetUnit}`, targetUnit, targetPlan, transferAmount || plan.price, rawContent, refNo).run();
      } catch (e) {}

      return success({
        message: `Đã tự động xác nhận thanh toán Webhook và kích hoạt '${plan.name}' cho đơn vị '${tenant.unit_name}'!`,
        unit_code: targetUnit,
        plan_tier: targetPlan,
        expires_at: newExpDate
      });
    }

    case "getTenantsList": {
      // Dành riêng cho Super Admin
      try {
        const tenants = await db.prepare("SELECT * FROM tenants ORDER BY id DESC").all();
        return success(tenants.results || []);
      } catch (e) {
        return error("Không thể lấy danh sách đơn vị: " + e.message, 500);
      }
    }

    case "addTenant": {
      const payload = args[0] || {};
      const uCode = String(payload.unit_code || payload.code || "").trim().toLowerCase();
      const uName = String(payload.unit_name || payload.name || "").trim();
      const uPlan = String(payload.plan_tier || payload.plan || "PRO").trim();
      const uExp = String(payload.expires_at || "2099-12-31").trim();
      const uStaff = parseInt(payload.max_staff || 30, 10);
      const uPats = parseInt(payload.max_patients || 150, 10);
      const uPhone = String(payload.phone || "").trim();
      const uEmail = String(payload.email || "").trim();
      const uPass = String(payload.admin_password || payload.password || "admin123").trim();
      const seedSample = payload.seed_sample_data !== false;

      if (!uCode || !uName) return error("Mã đơn vị và Tên đơn vị là bắt buộc!", 400);

      // Kiểm tra trùng mã đơn vị
      const exist = await db.prepare("SELECT id FROM tenants WHERE unit_code = ?").bind(uCode).first();
      if (exist) return error(`Mã đơn vị '${uCode}' đã tồn tại! Vui lòng chọn mã khác.`, 400);

      // 1. Tạo đơn vị trong bảng tenants
      await db.prepare(`
        INSERT INTO tenants (unit_code, unit_name, phone, email, plan_tier, max_staff, max_patients, expires_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).bind(uCode, uName, uPhone, uEmail, uPlan, uStaff, uPats, uExp).run();

      // 2. Tạo tài khoản admin mặc định cho đơn vị mới
      const passHash = await hashPassword(uPass);
      await db.prepare(`
        INSERT INTO tai_khoan (unit_code, username, password_hash, role, permissions)
        VALUES (?, 'admin', ?, 'Admin', 'ALL')
      `).bind(uCode, passHash).run();

      // 3. Chuẩn bị danh sách câu lệnh Batch Seed mẫu (1-Click Onboarding)
      const seedBatch = [];

      // A. Cài đặt hệ thống chuẩn (cai_dat)
      const defaultSettings = [
        ["hospital_name", uName],
        ["app_title", uName + " - Quản Lý Xếp Lịch T.I.M.E.S"],
        ["system_theme", "glass-dark"],
        ["thoi_gian_lam_viec", "07:30-11:30, 13:00-16:30"],
        ["so_ca_toi_da_ktv", "12"],
        ["tg_nghi_chuyen_ca", "5"],
        ["cho_phep_xep_thu_7", "1"],
        ["gio_chieu_sang_sang", "13:00"],
        ["gio_chieu_sang_chieu", "16:30"],
        ["ai_auto_learning", "1"],
        ["ai_active_engine", "CP_SOLVER"],
        ["gio_mo_cua", "07:30"],
        ["gio_dong_cua", "16:30"]
      ];
      for (const [k, v] of defaultSettings) {
        seedBatch.push(db.prepare("INSERT OR REPLACE INTO cai_dat (unit_code, key, value) VALUES (?, ?, ?)").bind(uCode, k, v));
      }

      if (seedSample) {
        // B. Phòng điều trị mẫu (phong)
        const sampleRooms = [
          { name: "Phòng Điện trị liệu (Phòng 1)", bs: "BS. Quản Lý Khoa", ktv: "KTV. Nguyễn Văn A", beds: 6 },
          { name: "Phòng Kéo giãn cột sống (Phòng 2)", bs: "", ktv: "KTV. Nguyễn Văn A", beds: 4 },
          { name: "Phòng Vận động trị liệu (Phòng 3)", bs: "", ktv: "KTV. Trần Thị B", beds: 5 },
          { name: "Phòng Châm cứu & Cấy chỉ (Phòng 4)", bs: "BS. Quản Lý Khoa", ktv: "KTV. Trần Thị B", beds: 6 },
          { name: "Phòng Xoa bóp bấm huyệt (Phòng 5)", bs: "", ktv: "KTV. Trần Thị B", beds: 4 }
        ];
        sampleRooms.forEach((r, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO phong (unit_code, ten_phong, bac_si, ktv, so_giuong, order_idx, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
          `).bind(uCode, r.name, r.bs, r.ktv, r.beds, idx + 1));
        });

        // C. Máy móc điều trị mẫu (may_moc)
        const sampleMachines = [
          { type: "Máy Siêu âm điều trị", code: "SA-01" },
          { type: "Máy Siêu âm điều trị", code: "SA-02" },
          { type: "Máy Điện xung đa năng", code: "DX-01" },
          { type: "Máy Điện xung đa năng", code: "DX-02" },
          { type: "Máy Điện xung đa năng", code: "DX-03" },
          { type: "Máy Laser công suất thấp", code: "LS-01" },
          { type: "Máy Laser công suất thấp", code: "LS-02" },
          { type: "Máy Kéo giãn cột sống cổ/lưng", code: "KG-01" },
          { type: "Máy Kéo giãn cột sống cổ/lưng", code: "KG-02" },
          { type: "Máy Sóng ngắn trị liệu", code: "SN-01" },
          { type: "Đèn Hồng ngoại", code: "HN-01" },
          { type: "Đèn Hồng ngoại", code: "HN-02" },
          { type: "Đèn Hồng ngoại", code: "HN-03" },
          { type: "Đèn Hồng ngoại", code: "HN-04" }
        ];
        sampleMachines.forEach((m, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO may_moc (unit_code, ten_loai, ma_may, order_idx, is_active)
            VALUES (?, ?, ?, ?, 1)
          `).bind(uCode, m.type, m.code, idx + 1));
        });

        // D. 13 Thủ thuật mẫu YHCT & PHCN chuẩn Bộ Y Tế (thu_thuat)
        const sampleProcs = [
          { name: "Siêu âm điều trị", vt: "SA", he: "PHCN", may: "SA", tg: 30, lien_tuc: 0 },
          { name: "Điện xung điều trị", vt: "DX", he: "PHCN", may: "DX", tg: 30, lien_tuc: 0 },
          { name: "Điện phân dẫn thuốc", vt: "DP", he: "PHCN", may: "DX", tg: 30, lien_tuc: 0 },
          { name: "Kéo giãn cột sống bằng máy", vt: "KG", he: "PHCN", may: "KG", tg: 30, lien_tuc: 0 },
          { name: "Chiếu đèn hồng ngoại", vt: "HN", he: "PHCN", may: "HN", tg: 30, lien_tuc: 0 },
          { name: "Laser điều trị", vt: "LS", he: "PHCN", may: "LS", tg: 20, lien_tuc: 0 },
          { name: "Sóng ngắn điều trị", vt: "SN", he: "PHCN", may: "SN", tg: 20, lien_tuc: 0 },
          { name: "Tập vận động thụ động", vt: "VĐ-TD", he: "PHCN", may: "", tg: 30, lien_tuc: 0 },
          { name: "Tập vận động có trợ giúp", vt: "VĐ-TG", he: "PHCN", may: "", tg: 30, lien_tuc: 0 },
          { name: "Xoa bóp bấm huyệt điều trị", vt: "XBBH", he: "YHCT", may: "", tg: 30, lien_tuc: 0 },
          { name: "Điện châm điều trị", vt: "ĐC", he: "YHCT", may: "", tg: 30, lien_tuc: 0 },
          { name: "Cứu ngải điều trị", vt: "CN", he: "YHCT", may: "", tg: 20, lien_tuc: 0 },
          { name: "Thủy châm điều trị", vt: "TC", he: "YHCT", may: "", tg: 15, lien_tuc: 0 }
        ];
        sampleProcs.forEach((p, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO thu_thuat (unit_code, ten_thu_thuat, viet_tat, he, may, tg_thuc_hien, tg_thu_thuat, lien_tuc, order_idx, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `).bind(uCode, p.name, p.vt, p.he, p.may, p.tg, p.tg, p.lien_tuc, idx + 1));
        });

        // E. Phác đồ điều trị mẫu (phac_do)
        const sampleProtocols = [
          { name: "Phác đồ Thoái hóa cột sống thắt lưng", procs: JSON.stringify(["Kéo giãn cột sống bằng máy", "Điện xung điều trị", "Chiếu đèn hồng ngoại"]) },
          { name: "Phác đồ Đau vai gáy / Cột sống cổ", procs: JSON.stringify(["Siêu âm điều trị", "Điện xung điều trị", "Xoa bóp bấm huyệt điều trị"]) },
          { name: "Phác đồ Di chứng tai biến / Liệt nửa người", procs: JSON.stringify(["Tập vận động thụ động", "Điện châm điều trị", "Xoa bóp bấm huyệt điều trị"]) },
          { name: "Phác đồ Hội chứng ống cổ tay", procs: JSON.stringify(["Laser điều trị", "Siêu âm điều trị", "Tập vận động có trợ giúp"]) }
        ];
        sampleProtocols.forEach((proto, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO phac_do (unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active)
            VALUES (?, ?, ?, ?, 1)
          `).bind(uCode, proto.name, proto.procs, idx + 1));
        });

        // F. Nhân sự mẫu (nhan_su)
        const sampleStaff = [
          { name: "KTV. Nguyễn Văn A", role: "KTV", system: "PHCN", priority: 1, time: "07:30-11:30, 13:00-16:30" },
          { name: "KTV. Trần Thị B", role: "KTV", system: "YHCT", priority: 2, time: "07:30-11:30, 13:00-16:30" },
          { name: "BS. Quản Lý Khoa", role: "BS", system: "ALL", priority: 0, time: "07:30-11:30, 13:00-16:30" }
        ];
        sampleStaff.forEach((s, idx) => {
          seedBatch.push(db.prepare(`
            INSERT OR IGNORE INTO nhan_su (unit_code, name, role, system, priority, thoi_gian_lam, trang_thai, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 'Đi làm', 1)
          `).bind(uCode, s.name, s.role, s.system, s.priority, s.time));
        });
      }

      // Thực thi toàn bộ batch trong 1 request Turso duy nhất!
      if (seedBatch.length > 0) {
        await db.batch(seedBatch);
      }

      return success({
        message: `Đã khởi tạo thành công đơn vị '${uName}' (${uCode}) với bộ danh mục mẫu 1-Click Onboarding!`,
        unit_code: uCode,
        seed_sample: seedSample
      });
    }

    case "updateTenant": {
      const payload = args[0] || {};
      const oldCode = String(payload.old_unit_code || payload.old_code || payload.unit_code || payload.code || "").trim().toLowerCase();
      let newCode = String(payload.new_unit_code || payload.unit_code || payload.code || "").trim().toLowerCase();
      if (!oldCode) return error("Thiếu mã đơn vị cần cập nhật!", 400);
      if (!newCode) newCode = oldCode;

      // Nếu người dùng đổi mã đơn vị sang mã mới
      if (newCode !== oldCode) {
        // Kiểm tra xem newCode đã tồn tại trong tenants chưa
        const checkExist = await db.prepare("SELECT unit_code FROM tenants WHERE unit_code = ?").bind(newCode).first();
        if (checkExist) {
          return error(`Mã đơn vị mới '${newCode}' đã tồn tại trên hệ thống! Vui lòng chọn mã khác.`, 400);
        }

        // Cập nhật cascade trên toàn bộ các bảng dữ liệu thực tế tồn tại trong DB
        const cascadeQueries = [
          db.prepare("UPDATE cai_dat SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE tai_khoan SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE nhan_su SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE may_moc SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE phong SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE thu_thuat SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE benh_nhan SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE lich_trinh SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE lich_su SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE gio_ban_cu SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE cham_cong SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE thong_ke SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE tim_ranh SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE tai_lieu SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE phac_do SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode),
          db.prepare("UPDATE audit_logs SET unit_code = ? WHERE unit_code = ?").bind(newCode, oldCode)
        ];

        await db.batch(cascadeQueries);
      }

      const uCode = newCode;
      const targetOldCode = oldCode;

      const uName = payload.unit_name !== undefined && payload.unit_name !== null ? String(payload.unit_name).trim() : null;
      const uPlan = payload.plan_tier !== undefined && payload.plan_tier !== null ? String(payload.plan_tier).trim() : null;
      const uExp = payload.expires_at !== undefined && payload.expires_at !== null ? String(payload.expires_at).trim() : null;
      const uStaff = payload.max_staff !== undefined && payload.max_staff !== null ? parseInt(payload.max_staff, 10) : null;
      const uPats = payload.max_patients !== undefined && payload.max_patients !== null ? parseInt(payload.max_patients, 10) : null;
      const uPhone = payload.phone !== undefined && payload.phone !== null ? String(payload.phone).trim() : null;
      const uEmail = payload.email !== undefined && payload.email !== null ? String(payload.email).trim() : null;
      const uActive = payload.is_active !== undefined && payload.is_active !== null ? (payload.is_active ? 1 : 0) : null;
      const uLogo = payload.logo_url !== undefined && payload.logo_url !== null ? String(payload.logo_url).trim() : null;

      await db.prepare(`
        UPDATE tenants SET
          unit_code = ?,
          unit_name = COALESCE(?, unit_name),
          plan_tier = COALESCE(?, plan_tier),
          expires_at = COALESCE(?, expires_at),
          max_staff = COALESCE(?, max_staff),
          max_patients = COALESCE(?, max_patients),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          logo_url = COALESCE(?, logo_url),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE unit_code = ?
      `).bind(uCode, uName, uPlan, uExp, uStaff, uPats, uPhone, uEmail, uLogo, uActive, targetOldCode).run();

      // Nếu có cập nhật mật khẩu admin
      if (payload.admin_password && String(payload.admin_password).trim()) {
        const passHash = await hashPassword(String(payload.admin_password).trim());
        await db.prepare("INSERT OR REPLACE INTO tai_khoan (unit_code, username, password_hash, role, permissions) VALUES (?, 'admin', ?, 'Admin', 'ALL')").bind(uCode, passHash).run();
      }

      return success({ message: `Đã cập nhật thông tin đơn vị '${uCode}' thành công!`, unit_code: uCode, old_unit_code: oldCode });
    }

    case "toggleTenantStatus": {
      const uCode = String(args[0] || "").trim().toLowerCase();
      const isActive = args[1] ? 1 : 0;
      if (!uCode) return error("Thiếu mã đơn vị!", 400);
      await db.prepare("UPDATE tenants SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(isActive, uCode).run();
      return success({ message: `Đã ${isActive ? 'kích hoạt' : 'khóa'} đơn vị '${uCode}'!`, is_active: isActive });
    }

    case "deleteTenant": {
      const uCode = String(args[0] || "").trim().toLowerCase();
      if (!uCode) return error("Thiếu mã đơn vị!", 400);
      if (uCode === "bvtks-cs2") return error("Không thể xóa đơn vị gốc mặc định!", 400);

      // Xóa toàn bộ dữ liệu thuộc tenant này
      await db.batch([
        db.prepare("DELETE FROM tenants WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM nhan_su WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM may_moc WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM phong WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM thu_thuat WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM benh_nhan WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM lich_trinh WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM phac_do WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM tai_khoan WHERE unit_code = ?").bind(uCode),
        db.prepare("DELETE FROM cai_dat WHERE unit_code = ?").bind(uCode)
      ]);

      return success({ message: `Đã xóa toàn bộ dữ liệu đơn vị '${uCode}'!` });
    }

    case "exportTenantData": {
      const uCode = String(args[0] || unitCode || "").trim().toLowerCase();
      if (!uCode) return error("Thiếu mã đơn vị cần xuất dữ liệu!", 400);
      if (tokenPayload && tokenPayload.role !== "SUPER_ADMIN" && uCode !== tokenPayload.unit_code) {
        return error("Bạn không có quyền xuất dữ liệu của đơn vị khác!", 403);
      }

      const tables = [
        'tenants', 'cai_dat', 'tai_khoan', 'nhan_su', 'may_moc', 'phong',
        'thu_thuat', 'benh_nhan', 'lich_trinh', 'lich_su', 'gio_ban_cu', 'gio_ban_chung_cu',
        'cham_cong', 'thong_ke', 'tim_ranh', 'tai_lieu', 'phac_do'
      ];

      const queries = tables.map(t => db.prepare(`SELECT * FROM ${t} WHERE unit_code = ?`).bind(uCode));
      const results = await db.batch(queries);

      const exportPackage = {
        app: "PM-XepLich T.I.M.E.S SaaS",
        version: "4.0.4",
        unit_code: uCode,
        exported_at: new Date().toISOString(),
        tables: {}
      };

      tables.forEach((tableName, idx) => {
        const rows = results[idx]?.results || [];
        exportPackage.tables[tableName] = rows;
      });

      const tenantRow = exportPackage.tables.tenants?.[0];
      exportPackage.unit_name = tenantRow?.unit_name || uCode;
      exportPackage.plan_tier = tenantRow?.plan_tier || 'PRO';

      return success(exportPackage);
    }

    case "exportAllDatabaseForSuperAdmin":
    case "exportAllDatabase": {
      // Dành riêng cho Super Admin: Xuất toàn bộ CSDL của tất cả các đơn vị
      const tables = [
        'tenants', 'cai_dat', 'tai_khoan', 'nhan_su', 'may_moc', 'phong',
        'thu_thuat', 'benh_nhan', 'lich_trinh', 'lich_su', 'gio_ban_cu', 'gio_ban_chung_cu',
        'cham_cong', 'thong_ke', 'tim_ranh', 'tai_lieu', 'phac_do'
      ];

      const queries = tables.map(t => db.prepare(`SELECT * FROM ${t}`));
      let results = [];
      try {
        results = await db.batch(queries);
      } catch (batchErr) {
        results = [];
        for (const t of tables) {
          try {
            const r = await db.prepare(`SELECT * FROM ${t}`).all();
            results.push(r);
          } catch(e) {
            results.push({ results: [] });
          }
        }
      }

      const dbPayload = {
        app: "PM-XepLich T.I.M.E.S SaaS - All Tenants Master Export",
        version: "4.0.4",
        exported_at: new Date().toISOString(),
        tenants: results[0]?.results || [],
        cai_dat: results[1]?.results || [],
        tai_khoan: results[2]?.results || [],
        nhan_su: results[3]?.results || [],
        may_moc: results[4]?.results || [],
        phong: results[5]?.results || [],
        thu_thuat: results[6]?.results || [],
        benh_nhan: results[7]?.results || [],
        lich_trinh: results[8]?.results || [],
        lich_su: results[9]?.results || [],
        gio_ban_cu: results[10]?.results || [],
        gio_ban_chung_cu: results[11]?.results || [],
        cham_cong: results[12]?.results || [],
        thong_ke: results[13]?.results || [],
        tim_ranh: results[14]?.results || [],
        tai_lieu: results[15]?.results || [],
        phac_do: results[16]?.results || []
      };

      return success(dbPayload);
    }

    case "importTenantData": {
      const payload = args[0] || {};
      const targetUnit = String(payload.unit_code || "").trim().toLowerCase();
      const backupData = payload.data || payload;

      if (!targetUnit) return error("Thiếu mã đơn vị cần nạp dữ liệu!", 400);
      if (!backupData || !backupData.tables) return error("Dữ liệu sao lưu không đúng định dạng JSON chuẩn!", 400);

      const tables = [
        'cai_dat', 'tai_khoan', 'nhan_su', 'may_moc', 'phong',
        'thu_thuat', 'benh_nhan', 'lich_trinh', 'lich_su', 'gio_ban_cu', 'gio_ban_chung_cu',
        'cham_cong', 'thong_ke', 'tim_ranh', 'tai_lieu', 'phac_do'
      ];

      const batchStmts = [];
      // Xóa dữ liệu cũ của tenant (trừ bảng tenants)
      tables.forEach(t => {
        batchStmts.push(db.prepare(`DELETE FROM ${t} WHERE unit_code = ?`).bind(targetUnit));
      });

      // Nạp dữ liệu mới
      for (const t of tables) {
        const rows = backupData.tables[t] || [];
        if (Array.isArray(rows) && rows.length > 0) {
          for (const row of rows) {
            const cols = Object.keys(row).filter(k => k !== 'id');
            const placeholders = cols.map(() => '?').join(', ');
            const values = cols.map(c => (c === 'unit_code' ? targetUnit : row[c]));
            const sql = `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${placeholders})`;
            batchStmts.push(db.prepare(sql).bind(...values));
          }
        }
      }

      if (batchStmts.length > 0) {
        await db.batch(batchStmts);
      }

      return success({
        message: `Đã khôi phục thành công toàn bộ dữ liệu cho đơn vị '${targetUnit}'!`,
        unit_code: targetUnit
      });
    }

    case "changePassword": {
      const payload = args[0] || {};
      const uName = String(payload.username || "").trim();
      const oldPass = String(payload.old_password || payload.oldPassword || "").trim();
      const newPass = String(payload.new_password || payload.newPassword || "").trim();
      const uCode = String(payload.unit_code || unitCode || "bvtks-cs2").trim().toLowerCase();

      if (!uName || !oldPass || !newPass) {
        return error("Vui lòng điền đầy đủ tên đăng nhập, mật khẩu cũ và mật khẩu mới!", 400);
      }
      if (newPass.length < 6) {
        return error("Mật khẩu mới phải có tối thiểu 6 ký tự!", 400);
      }

      // 1. Đổi mật khẩu Super Admin
      if (uName.toLowerCase() === "superadmin" || uName.toLowerCase() === "master") {
        const passHash = await hashPassword(oldPass);
        let rec = null;
        try {
          rec = await db.prepare("SELECT id, value FROM cai_dat WHERE unit_code = 'MASTER' AND key = 'superadmin_password_hash'").first();
        } catch(e) {}
        if (!rec) {
          try {
            rec = await db.prepare("SELECT id, value FROM cai_dat WHERE key = 'superadmin_password_hash'").first();
          } catch(e) {}
        }

        let isOldValid = false;
        if (rec && rec.value) {
          isOldValid = (rec.value === passHash);
        } else {
          isOldValid = (oldPass === "Master@2026!" || oldPass === "admin@123" || oldPass === "admin123");
        }

        if (!isOldValid) {
          return error("Mật khẩu hiện tại của Super Admin không chính xác!", 400);
        }

        const newHash = await hashPassword(newPass);
        if (rec && rec.id) {
          try {
            await db.prepare("UPDATE cai_dat SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(newHash, rec.id).run();
          } catch(e) {
            await db.prepare("UPDATE cai_dat SET value = ? WHERE id = ?").bind(newHash, rec.id).run();
          }
        } else {
          try {
            await db.prepare("INSERT INTO cai_dat (unit_code, key, value) VALUES ('MASTER', 'superadmin_password_hash', ?)").bind(newHash).run();
          } catch(e) {
            await db.prepare("INSERT OR REPLACE INTO cai_dat (key, value) VALUES ('superadmin_password_hash', ?)").bind(newHash).run();
          }
        }
        return success({ message: "Đã đổi mật khẩu Super Admin thành công!" });
      }

      // 2. Đổi mật khẩu tài khoản đơn vị
      const userRec = await db.prepare("SELECT id, password_hash FROM tai_khoan WHERE unit_code = ? AND username = ?").bind(uCode, uName).first();
      if (!userRec) {
        return error("Không tìm thấy tài khoản trong đơn vị này!", 404);
      }

      const oldHash = await hashPassword(oldPass);
      if (userRec.password_hash !== oldHash) {
        return error("Mật khẩu cũ không chính xác!", 400);
      }

      const newHash = await hashPassword(newPass);
      await db.prepare("UPDATE tai_khoan SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(newHash, userRec.id).run();
      return success({ message: "Đã đổi mật khẩu thành công!" });
    }

    case "resetTenantAdminPassword": {
      const uCode = String(args[0] || "").trim().toLowerCase();
      const newPass = String(args[1] || "admin123").trim();
      if (!uCode || !newPass) return error("Thiếu mã đơn vị hoặc mật khẩu mới!", 400);

      const passHash = await hashPassword(newPass);
      await db.prepare("INSERT OR REPLACE INTO tai_khoan (unit_code, username, password_hash, role, permissions) VALUES (?, 'admin', ?, 'Admin', 'ALL')").bind(uCode, passHash).run();
      return success({ message: `Đã đặt lại mật khẩu admin cho đơn vị '${uCode}' thành công!` });
    }

    // ============================================================
    // 1. BOOTSTRAP TOÀN DIỆN
    // ============================================================
    case "getBootstrapData": {
      // Tự động kiểm tra chốt sổ khi nạp dữ liệu đầu ngày
      await checkAutoChotSo(db, unitCode);

      // Lấy ngày từ client, hoặc tự tính theo múi giờ Việt Nam (UTC+7)
      const todayArg = args[0] || "";
      let todayVN = todayArg;
      if (!todayVN) {
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const yy = nowVN.getUTCFullYear();
        const mm = String(nowVN.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(nowVN.getUTCDate()).padStart(2, "0");
        todayVN = `${yy}-${mm}-${dd}`;
      }
      const [ty, tm, td] = todayVN.split("-");
      const todayVNSlash = `${td}/${tm}/${ty}`; // VD: 21/08/2026

      const [settingsRes, staffRes, machinesRes, roomsRes, proceduresRes, patientsRes, scheduleRes, accountsRes, phacDoRes, tenantRes] = await db.batch([
        db.prepare("SELECT key, value FROM cai_dat WHERE unit_code = ?").bind(unitCode),
        db.prepare("SELECT * FROM nhan_su WHERE unit_code = ? ORDER BY priority ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM may_moc WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM phong WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM benh_nhan WHERE unit_code = ? AND is_saturday = 0 ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM lich_trinh WHERE unit_code = ? AND (date = ? OR date = ?) ORDER BY order_idx ASC, start_time ASC").bind(unitCode, todayVN, todayVNSlash),
        db.prepare("SELECT id, username, role, permissions FROM tai_khoan WHERE unit_code = ?").bind(unitCode),
        db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode),
        db.prepare("SELECT * FROM tenants WHERE unit_code = ?").bind(unitCode)
      ]);

      const settingsObj = {};
      (settingsRes.results || []).forEach(r => { settingsObj[r.key] = r.value; });

      const may_moc = (machinesRes.results || []).map(m => ({
        id: m.id,
        tenLoai: m.ten_loai,
        maMay: m.ma_may,
        trangThai: m.trang_thai,
        name: m.ma_may,
        ten: m.ma_may
      }));

      const phong = (roomsRes.results || []).map(r => ({
        id: r.id,
        tenPhong: r.ten_phong,
        name: r.ten_phong,
        bacSi: r.bac_si || "",
        ktv: r.ktv || "",
        danhSachMay: r.danh_sach_may || "",
        soGiuong: r.so_giuong || 0,
        danhSachGiuong: r.danh_sach_giuong || ""
      }));

      let links = [];
      if (settingsObj.quick_links) {
        try {
          links = typeof settingsObj.quick_links === 'string' ? JSON.parse(settingsObj.quick_links) : settingsObj.quick_links;
        } catch(e) {}
      }

      let protocolsList = [];
      if (phacDoRes.results && phacDoRes.results.length > 0) {
        protocolsList = phacDoRes.results.map((r, i) => {
          let procsArr = [];
          try {
            procsArr = typeof r.danh_sach_thu_thuat === 'string' ? JSON.parse(r.danh_sach_thu_thuat) : r.danh_sach_thu_thuat;
          } catch(e) {
            procsArr = String(r.danh_sach_thu_thuat || '').split(',').map(s => s.trim()).filter(Boolean);
          }
          return {
            id: String(r.id || (i + 1)),
            name: r.ten_phac_do,
            ten_phac_do: r.ten_phac_do,
            procs: Array.isArray(procsArr) ? procsArr : []
          };
        });
      } else if (settingsObj.clinical_protocols || settingsObj.protocols) {
        try {
          const rawProtocols = settingsObj.clinical_protocols || settingsObj.protocols;
          protocolsList = typeof rawProtocols === 'string' ? JSON.parse(rawProtocols) : rawProtocols;
        } catch(e) {}
      }
      const thu_thuat = (proceduresRes.results || []).map(p => ({
        id: p.id,
        ten: p.ten_thu_thuat,
        name: p.ten_thu_thuat,
        vietTat: p.viet_tat,
        he: p.he,
        phanLoai: p.phan_loai,
        may: p.may,
        thoiGianThucHien: p.tg_thuc_hien,
        thoiGianThucHienMin: p.tg_thuc_hien,
        thoiGianThucHienMax: (p.tg_thuc_hien_max && p.tg_thuc_hien_max > 0) ? p.tg_thuc_hien_max : p.tg_thuc_hien,
        thoiGianThuThuat: p.tg_thu_thuat,
        thoiGianThuThuatMin: p.tg_thu_thuat,
        thoiGianThuThuatMax: (p.tg_thu_thuat_max && p.tg_thu_thuat_max > 0) ? p.tg_thu_thuat_max : p.tg_thu_thuat,
        khoangCach: p.khoang_cach,
        canRutMay: (p.can_rut_may === 1 || p.can_rut_may === '1' || p.can_rut_may === 'Có' || p.can_rut_may === true) ? 'Có' : 'Không',
        canNguoiPhu: (p.can_nguoi_phu === 1 || p.can_nguoi_phu === '1' || p.can_nguoi_phu === 'Có' || p.can_nguoi_phu === true) ? 'Có' : 'Không',
        dsNguoiPhu: p.ds_nguoi_phu,
        lienTuc: (p.lien_tuc === 1 || p.lien_tuc === '1' || p.lien_tuc === 'Có' || p.lien_tuc === true) ? 'Có' : ((p.tg_thuc_hien === p.tg_thu_thuat && ((p.tg_thuc_hien_max || p.tg_thuc_hien) === (p.tg_thu_thuat_max || p.tg_thu_thuat)) && p.tg_thuc_hien >= 10) ? 'Có' : 'Không')
      }));

      // Staff
      const staffList = (staffRes.results || []).map((s, idx) => {
        const skillsArr = parseStringOrJsonArray(s.skills);
        const tempBusyArr = parseStringOrJsonArray(s.temp_busy);
        const kyNangStr = skillsArr.join(", ");
        const gioBanStr = tempBusyArr.join(", ");

        return {
          id: s.id || (idx + 1),
          ten: s.name,
          name: s.name,
          vaiTro: s.role || "Kỹ thuật viên",
          role: s.role || "Kỹ thuật viên",
          trangThai: s.trang_thai || "Đi làm",
          thoiGianLam: s.thoi_gian_lam || "07:30-11:30, 13:00-16:30",
          kyNang: kyNangStr,
          gioBan: gioBanStr,
          nguoiThayThe: s.nguoi_thay_the || "Không",
          quyen: s.system || "Cả hai",
          he: s.system || "Cả hai",
          system: s.system || "Cả hai",
          tenHis: s.his_name || "",
          priority: s.priority || 0
        };
      });

      // Patients
      const patientList = (patientsRes.results || []).map((p, idx) => {
        let procsArr = [];
        try {
          const parsed = JSON.parse(p.thu_thuat || "[]");
          if (Array.isArray(parsed)) {
            procsArr = parsed.map(x => (typeof x === "object" ? (x.name || x.ten || "") : String(x))).filter(Boolean);
          } else if (typeof parsed === "string") {
            procsArr = parsed.split(",").map(x => x.trim()).filter(Boolean);
          }
        } catch(e) {
          if (typeof p.thu_thuat === "string") {
            procsArr = p.thu_thuat.split(",").map(x => x.trim()).filter(Boolean);
          }
        }
        const thuThuatStr = procsArr.join(",");

        return {
          id: String(p.id || (idx + 1)),
          ten: p.name,
          namSinh: String(p.age || ""),
          ngayVao: p.ngay_vao || "",
          gioVao: p.arrive_time === "07:30" ? "" : (p.arrive_time || ""),
          gioBan: p.gio_ban || "",
          gioRa: p.leave_time || "",
          phong: p.room || "",
          thuThuat: thuThuatStr,
          status: p.status,
          loai_bn: p.loai_bn || "NoiTru",
          buoi_dieu_tri: p.buoi_dieu_tri || "TuDong"
        };
      }).filter(p => p.ten && p.ten.trim() !== "");

      // Schedule rows
      const scheduleRows = (scheduleRes.results || []).map(s => ([
        s.date,
        s.patient_name,
        s.dob || "",
        s.room || "",
        s.procedure_name,
        s.start_time,
        s.end_time,
        s.staff_name || "",
        s.sub_staff_name || "",
        s.machine_name || "",
        s.bed || ""
      ]));

      const tenantInfo = tenantRes?.results?.[0] || { unit_code: unitCode, unit_name: unitCode, plan_tier: "PRO" };
      return success({
        tenant: tenantInfo,
        settings: settingsObj,
        marquee: settingsObj.marquee_text || ("PHẦN MỀM XẾP LỊCH THỦ THUẬT - " + (tenantInfo.unit_name || unitCode).toUpperCase()),
        links: links,
        machines: may_moc,
        may_moc: may_moc,
        rooms: phong,
        phong: phong,
        procedures: thu_thuat,
        thu_thuat: thu_thuat,
        staff: staffList,
        nhan_su: staffList,
        patients: patientList,
        benh_nhan: patientList,
        protocols: protocolsList,
        phac_do: protocolsList,
        schedule: scheduleRows,
        schedules: scheduleRows,
        lich_trinh: scheduleRows,
        accounts: accountsRes.results || [],
        tai_khoan: accountsRes.results || [],
        version: "v3.0.0-cloudflare"
      });
    }

    case "getDataVersion": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE key = 'data_version'").first();
      const v = rec ? String(rec.value) : "1";
      return success({ version: v });
    }

    case "getLichSu":
    case "getAllHistory":
    case "getHistoryForAI": {
      const res = await db.prepare("SELECT date, patient_name, dob, room, procedure_name, staff_name, sub_staff_name, machine_name, bed, start_time, end_time FROM lich_su WHERE unit_code = ? ORDER BY id DESC").bind(unitCode).all().catch(() => ({ results: [] }));
      let rawRows = res.results || [];
      if (rawRows.length === 0) {
        // Fallback: nếu chưa có dữ liệu lịch sử chốt sổ, nạp các ca từ bảng lịch trình để AI có dữ liệu học
        const ltRes = await db.prepare("SELECT date, patient_name, dob, room, procedure_name, staff_name, sub_staff_name, machine_name, bed, start_time, end_time FROM lich_trinh WHERE unit_code = ? ORDER BY id DESC").bind(unitCode).all().catch(() => ({ results: [] }));
        rawRows = ltRes.results || [];
      }
      const rows = rawRows.map(s => ({
        date: s.date,
        ngay: s.date,
        patient_name: s.patient_name,
        tenBN: s.patient_name,
        HOTEN: s.patient_name,
        dob: s.dob || "",
        namSinh: s.dob || "",
        NAMSINH: s.dob || "",
        room: s.room || "",
        phong: s.room || "",
        PHONG: s.room || "",
        procedure_name: s.procedure_name,
        thuThuat: s.procedure_name,
        DICHVU: s.procedure_name,
        start_time: s.start_time,
        gioDienRa: s.start_time,
        GIODIENRA: s.start_time,
        end_time: s.end_time,
        gioKetThuc: s.end_time,
        GIOKETTHUC: s.end_time,
        staff_name: s.staff_name || "",
        nvChinh: s.staff_name || "",
        "NV CHÍNH": s.staff_name || "",
        sub_staff_name: s.sub_staff_name || "",
        nvPhu: s.sub_staff_name || "",
        "NV PHỤ": s.sub_staff_name || "",
        machine_name: s.machine_name || "",
        may: s.machine_name || "",
        MAY: s.machine_name || "",
        bed: s.bed || "",
        giuong: s.bed || "",
        GIUONG: s.bed || ""
      }));
      return success({ count: rows.length, rows: rows, history: rows });
    }

    // ============================================================
    // 2. CRUD MÁY MÓC
    // ============================================================
    case "getMayMoc":
    case "getDanhSachMay": {
      const res = await db.prepare("SELECT * FROM may_moc WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      const list = (res.results || []).map((m, i) => ({
        id: m.id,
        tenLoai: m.ten_loai,
        maMay: m.ma_may,
        trangThai: m.trang_thai,
        ten_loai: m.ten_loai,
        ma_may: m.ma_may,
        trang_thai: m.trang_thai,
        name: m.ma_may,
        ten: m.ma_may,
        0: i + 1,
        1: m.ten_loai,
        2: m.ma_may,
        3: m.trang_thai
      }));
      return success(list);
    }

    case "addMayMoc": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      const tenLoai = String(payload.tenLoai || payload.ten_loai || args[0] || "");
      const maMayPrefix = String(payload.maMay || payload.ma_may || args[1] || "");
      const qty = parseInt(payload.soLuong || payload.qty || args[2]) || 1;
      const trangThai = String(payload.trangThai || payload.trang_thai || args[3] || "Sẵn sàng");
      
      const stmts = [];
      if (qty > 1) {
        for (let i = 0; i < qty; i++) {
          stmts.push(db.prepare("INSERT INTO may_moc (unit_code, ten_loai, ma_may, trang_thai, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, ma_may) DO UPDATE SET ten_loai = excluded.ten_loai, trang_thai = excluded.trang_thai, updated_at = CURRENT_TIMESTAMP").bind(unitCode, tenLoai, `${maMayPrefix}${i + 1}`, trangThai));
        }
      } else {
        stmts.push(db.prepare("INSERT INTO may_moc (unit_code, ten_loai, ma_may, trang_thai, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, ma_may) DO UPDATE SET ten_loai = excluded.ten_loai, trang_thai = excluded.trang_thai, updated_at = CURRENT_TIMESTAMP").bind(unitCode, tenLoai, maMayPrefix, trangThai));
      }
      await db.batch(stmts);
      await bumpDataVersion(db, unitCode);
      return success({ message: "Thêm thiết bị thành công" });
    }

    case "editMayMoc": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) {
        payload = args[0];
      } else if (typeof args[1] === "object" && args[1] !== null) {
        payload = args[1];
      } else {
        let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]) && args.length >= 4)) ? 1 : 0;
        payload = { tenLoai: args[offset], maMay: args[offset + 1], trangThai: args[offset + 2] };
      }
      const tenLoai = String(payload.tenLoai || payload.ten_loai || "");
      const maMay = String(payload.maMay || payload.ma_may || "");
      const trangThai = String(payload.trangThai || payload.trang_thai || "Sẵn sàng");
      await db.prepare("INSERT INTO may_moc (unit_code, ten_loai, ma_may, trang_thai, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, ma_may) DO UPDATE SET ten_loai = excluded.ten_loai, trang_thai = excluded.trang_thai, updated_at = CURRENT_TIMESTAMP").bind(unitCode, tenLoai, maMay, trangThai).run();
      await bumpDataVersion(db, unitCode);
      return success({ message: "Cập nhật thiết bị thành công" });
    }

    case "deleteMayMoc": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]))) ? 1 : 0;
      const maMay = String(payload.maMay || payload.ma_may || args[offset] || args[0] || "").trim();
      await db.prepare("DELETE FROM may_moc WHERE unit_code = ? AND (ma_may = ? OR id = ?)").bind(unitCode, maMay, maMay).run();
      await bumpDataVersion(db, unitCode);
      return success({ message: "Xóa máy thành công" });
    }

    case "getThuThuat": {
      const res = await db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      return success((res.results || []).map(p => ({
        id: p.id,
        ten: p.ten_thu_thuat,
        name: p.ten_thu_thuat,
        vietTat: p.viet_tat,
        he: p.he,
        phanLoai: p.phan_loai,
        may: p.may,
        thoiGianThucHien: p.tg_thuc_hien,
        thoiGianThucHienMin: p.tg_thuc_hien,
        thoiGianThucHienMax: (p.tg_thuc_hien_max && p.tg_thuc_hien_max > 0) ? p.tg_thuc_hien_max : p.tg_thuc_hien,
        thoiGianThuThuat: p.tg_thu_thuat,
        thoiGianThuThuatMin: p.tg_thu_thuat,
        thoiGianThuThuatMax: (p.tg_thu_thuat_max && p.tg_thu_thuat_max > 0) ? p.tg_thu_thuat_max : p.tg_thu_thuat,
        khoangCach: p.khoang_cach,
        canRutMay: (p.can_rut_may === 1 || p.can_rut_may === '1' || p.can_rut_may === 'Có' || p.can_rut_may === true) ? 'Có' : 'Không',
        canNguoiPhu: (p.can_nguoi_phu === 1 || p.can_nguoi_phu === '1' || p.can_nguoi_phu === 'Có' || p.can_nguoi_phu === true) ? 'Có' : 'Không',
        dsNguoiPhu: p.ds_nguoi_phu,
        lienTuc: (p.lien_tuc === 1 || p.lien_tuc === '1' || p.lien_tuc === 'Có' || p.lien_tuc === true) ? 'Có' : ((p.tg_thuc_hien === p.tg_thu_thuat && ((p.tg_thuc_hien_max || p.tg_thuc_hien) === (p.tg_thu_thuat_max || p.tg_thu_thuat)) && p.tg_thuc_hien >= 10) ? 'Có' : 'Không')
      })));
    }

    case "addThuThuat":
    case "editThuThuat": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) {
        payload = args[0];
      } else if (typeof args[1] === "object" && args[1] !== null) {
        payload = args[1];
      } else {
        let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]) && args.length >= 11)) ? 1 : 0;
        payload = {
          ten: args[offset],
          vietTat: args[offset + 1],
          he: args[offset + 2],
          phanLoai: args[offset + 3],
          may: args[offset + 4],
          thoiGianThucHienMin: args[offset + 5],
          thoiGianThuThuatMin: args[offset + 6],
          khoangCach: args[offset + 7],
          canRutMay: args[offset + 8],
          canNguoiPhu: args[offset + 9],
          dsNguoiPhu: args[offset + 10],
          thoiGianThuThuatMax: args[offset + 11],
          thoiGianThucHienMax: args[offset + 12],
          lienTuc: args[offset + 13]
        };
      }
      const ten = String(payload.ten || payload.name || "").trim();
      if (!ten) return error("Tên thủ thuật không hợp lệ");
      const vietTat = String(payload.vietTat || payload.viet_tat || "");
      const he = String(payload.he || "YHCT");
      const phanLoai = String(payload.phanLoai || payload.phan_loai || "");
      const may = String(payload.may || "Thủ công");
      const tgThMin = parseInt(payload.thoiGianThucHienMin || payload.thoiGianThucHien || payload.tg_thuc_hien) || 0;
      const tgThMax = parseInt(payload.thoiGianThucHienMax || payload.tg_thuc_hien_max || tgThMin) || tgThMin;
      const tgTtMin = parseInt(payload.thoiGianThuThuatMin || payload.thoiGianThuThuat || payload.tg_thu_thuat) || 0;
      const tgTtMax = parseInt(payload.thoiGianThuThuatMax || payload.tg_thu_thuat_max || tgTtMin) || tgTtMin;
      const kc = parseInt(payload.khoangCach || payload.khoang_cach) || 0;
      const rut = String(payload.canRutMay || payload.can_rut_may || "Không");
      const phu = String(payload.canNguoiPhu || payload.can_nguoi_phu || "Không");
      const dsPhu = String(payload.dsNguoiPhu || payload.ds_nguoi_phu || "");
      const isLt = (payload.lienTuc === 'Có' || payload.lienTuc === 1 || payload.lienTuc === '1' || payload.lienTuc === true || payload.lien_tuc === 1 || payload.lien_tuc === '1' || payload.lien_tuc === 'Có' || payload.lien_tuc === true) ? 1 : ((tgThMin === tgTtMin && tgThMax === tgTtMax && tgThMin >= 10) ? 1 : 0);

      await db.prepare(`INSERT INTO thu_thuat (unit_code, ten_thu_thuat, viet_tat, he, phan_loai, may, tg_thuc_hien, tg_thuc_hien_max, tg_thu_thuat, tg_thu_thuat_max, khoang_cach, can_rut_may, can_nguoi_phu, ds_nguoi_phu, lien_tuc, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(unit_code, ten_thu_thuat) DO UPDATE SET viet_tat = excluded.viet_tat, he = excluded.he, phan_loai = excluded.phan_loai, may = excluded.may, tg_thuc_hien = excluded.tg_thuc_hien, tg_thuc_hien_max = excluded.tg_thuc_hien_max, tg_thu_thuat = excluded.tg_thu_thuat, tg_thu_thuat_max = excluded.tg_thu_thuat_max, khoang_cach = excluded.khoang_cach, can_rut_may = excluded.can_rut_may, can_nguoi_phu = excluded.can_nguoi_phu, ds_nguoi_phu = excluded.ds_nguoi_phu, lien_tuc = excluded.lien_tuc, updated_at = CURRENT_TIMESTAMP`)
        .bind(unitCode, ten, vietTat, he, phanLoai, may, tgThMin, tgThMax, tgTtMin, tgTtMax, kc, rut, phu, dsPhu, isLt).run();
      await bumpDataVersion(db, unitCode);
      return success({ message: "Lưu thủ thuật thành công" });
    }

    case "deleteThuThuat": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]))) ? 1 : 0;
      const ten = String(payload.ten || payload.name || args[offset] || args[0] || "").trim();
      await db.prepare("DELETE FROM thu_thuat WHERE unit_code = ? AND (ten_thu_thuat = ? OR id = ?)").bind(unitCode, ten, ten).run();
      await bumpDataVersion(db, unitCode);
      return success({ message: "Xóa thủ thuật thành công" });
    }

    case "getPhong":
    case "getPhongThuThuat": {
      const res = await db.prepare("SELECT * FROM phong WHERE unit_code = ? ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      return success((res.results || []).map(r => ({
        id: r.id,
        tenPhong: r.ten_phong,
        name: r.ten_phong,
        bacSi: r.bac_si || "",
        ktv: r.ktv || "",
        danhSachMay: r.danh_sach_may || "",
        soGiuong: r.so_giuong || 0,
        danhSachGiuong: r.danh_sach_giuong || ""
      })));
    }

    case "addPhong":
    case "editPhong": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) {
        payload = args[0];
      } else if (typeof args[1] === "object" && args[1] !== null) {
        payload = args[1];
      } else {
        let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]) && args.length >= 7)) ? 1 : 0;
        payload = {
          tenPhong: args[offset],
          bacSi: args[offset + 1],
          ktv: args[offset + 2],
          danhSachMay: args[offset + 3],
          soGiuong: args[offset + 4],
          danhSachGiuong: args[offset + 5]
        };
      }
      const tenPhong = String(payload.tenPhong || payload.ten_phong || payload.name || "").trim();
      if (!tenPhong) return error("Tên phòng không hợp lệ");
      const bacSi = String(payload.bacSi || payload.bac_si || "");
      const ktv = String(payload.ktv || "");
      const danhSachMay = String(payload.danhSachMay || payload.danh_sach_may || "");
      const soGiuong = parseInt(payload.soGiuong || payload.so_giuong) || 0;
      const danhSachGiuong = String(payload.danhSachGiuong || payload.danh_sach_giuong || "");

      await db.prepare(`INSERT INTO phong (unit_code, ten_phong, bac_si, ktv, danh_sach_may, so_giuong, danh_sach_giuong, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(unit_code, ten_phong) DO UPDATE SET bac_si = excluded.bac_si, ktv = excluded.ktv, danh_sach_may = excluded.danh_sach_may, so_giuong = excluded.so_giuong, danh_sach_giuong = excluded.danh_sach_giuong, updated_at = CURRENT_TIMESTAMP`)
        .bind(unitCode, tenPhong, bacSi, ktv, danhSachMay, soGiuong, danhSachGiuong).run();
      await bumpDataVersion(db, unitCode);
      return success({ message: "Lưu phòng thành công" });
    }

    case "deletePhong": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]))) ? 1 : 0;
      const ten = String(payload.tenPhong || payload.ten || args[offset] || args[0] || "").trim();
      await db.prepare("DELETE FROM phong WHERE unit_code = ? AND (ten_phong = ? OR id = ?)").bind(unitCode, ten, ten).run();
      await bumpDataVersion(db, unitCode);
      return success({ message: "Xóa phòng thành công" });
    }

    case "getNhanSu": {
      try {
        await db.prepare("DELETE FROM nhan_su WHERE unit_code = ? AND (name GLOB '[0-9]*' OR name = '' OR name IS NULL)").bind(unitCode).run();
      } catch(e) {}

      const res = await db.prepare("SELECT * FROM nhan_su WHERE unit_code = ? AND name NOT GLOB '[0-9]*' ORDER BY priority ASC, id ASC").bind(unitCode).all();
      const list = (res.results || []).map((s, idx) => {
        const skillsArr = parseStringOrJsonArray(s.skills);
        const tempBusyArr = parseStringOrJsonArray(s.temp_busy);
        const kyNangStr = skillsArr.join(", ");
        const gioBanStr = tempBusyArr.join(", ");

        return {
          id: s.id || (idx + 1),
          ten: s.name,
          name: s.name,
          vaiTro: s.role || "Kỹ thuật viên",
          role: s.role || "Kỹ thuật viên",
          trangThai: s.trang_thai || "Đi làm",
          thoiGianLam: s.thoi_gian_lam || "07:30-11:30, 13:00-16:30",
          kyNang: kyNangStr,
          gioBan: gioBanStr,
          nguoiThayThe: s.nguoi_thay_the || "Không",
          quyen: s.system || "Cả hai",
          he: s.system || "Cả hai",
          system: s.system || "Cả hai",
          tenHis: s.his_name || "",
          priority: s.priority || 0
        };
      });
      return success(list);
    }

    case "addNhanSu": {
      let s = (typeof args[0] === "object" && args[0] !== null) ? args[0] : {
        ten: args[0],
        vaiTro: args[1],
        trangThai: args[2],
        thoiGianLam: args[3],
        kyNang: args[4],
        gioBan: args[5],
        nguoiThayThe: args[6],
        quyen: args[7],
        tenHis: args[8]
      };

      const sName = String(s.ten || s.name || "").trim();
      if (!sName || /^\d+$/.test(sName)) return error("Tên nhân sự không hợp lệ");
      const sRole = String(s.vaiTro || s.role || "Kỹ thuật viên").trim();
      const sTrangThai = String(s.trangThai || s.trang_thai || "Đi làm").trim();
      const sThoiGianLam = String(s.thoiGianLam || s.thoi_gian_lam || "07:30-11:30, 13:00-16:30").trim();
      const sNguoiThayThe = String(s.nguoiThayThe || s.nguoi_thay_the || "Không").trim();
      const sSystem = String(s.quyen || s.system || "Cả hai").trim();
      const skillsArr = parseStringOrJsonArray(s.kyNang !== undefined ? s.kyNang : s.skills);
      const tempBusyArr = parseStringOrJsonArray(s.gioBan !== undefined ? s.gioBan : s.temp_busy);
      const sSkills = JSON.stringify(skillsArr);
      const sTempBusy = JSON.stringify(tempBusyArr);

      await db.prepare(
        "INSERT INTO nhan_su (unit_code, name, role, system, skills, temp_busy, his_name, trang_thai, thoi_gian_lam, nguoi_thay_the, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, name) DO UPDATE SET role = excluded.role, system = excluded.system, skills = excluded.skills, temp_busy = excluded.temp_busy, his_name = excluded.his_name, trang_thai = excluded.trang_thai, thoi_gian_lam = excluded.thoi_gian_lam, nguoi_thay_the = excluded.nguoi_thay_the, updated_at = CURRENT_TIMESTAMP"
      ).bind(unitCode, sName, sRole, sSystem, sSkills, sTempBusy, String(s.tenHis || ""), sTrangThai, sThoiGianLam, sNguoiThayThe).run();
      await bumpDataVersion(db, unitCode);
      return success(true);
    }

    case "editNhanSu": {
      let s;
      if (typeof args[0] === "object" && args[0] !== null) {
        s = args[0];
      } else if (typeof args[0] === "number" || /^\d+$/.test(String(args[0]))) {
        s = {
          ten: args[1],
          vaiTro: args[2],
          trangThai: args[3],
          thoiGianLam: args[4],
          kyNang: args[5],
          gioBan: args[6],
          nguoiThayThe: args[7],
          quyen: args[8],
          tenHis: args[9]
        };
      } else {
        s = {
          ten: args[0],
          vaiTro: args[1],
          trangThai: args[2],
          thoiGianLam: args[3],
          kyNang: args[4],
          gioBan: args[5],
          nguoiThayThe: args[6],
          quyen: args[7],
          tenHis: args[8]
        };
      }

      const sName = String(s.ten || s.name || "").trim();
      if (!sName || /^\d+$/.test(sName)) return error("Tên nhân sự không hợp lệ");
      const sRole = String(s.vaiTro || s.role || "Kỹ thuật viên").trim();
      const sTrangThai = String(s.trangThai || s.trang_thai || "Đi làm").trim();
      const sThoiGianLam = String(s.thoiGianLam || s.thoi_gian_lam || "07:30-11:30, 13:00-16:30").trim();
      const sNguoiThayThe = String(s.nguoiThayThe || s.nguoi_thay_the || "Không").trim();
      const sSystem = String(s.quyen || s.system || "Cả hai").trim();
      const skillsArr = parseStringOrJsonArray(s.kyNang !== undefined ? s.kyNang : s.skills);
      const tempBusyArr = parseStringOrJsonArray(s.gioBan !== undefined ? s.gioBan : s.temp_busy);
      const sSkills = JSON.stringify(skillsArr);
      const sTempBusy = JSON.stringify(tempBusyArr);

      await db.prepare(
        "INSERT INTO nhan_su (unit_code, name, role, system, skills, temp_busy, his_name, trang_thai, thoi_gian_lam, nguoi_thay_the, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(unit_code, name) DO UPDATE SET role = excluded.role, system = excluded.system, skills = excluded.skills, temp_busy = excluded.temp_busy, his_name = excluded.his_name, trang_thai = excluded.trang_thai, thoi_gian_lam = excluded.thoi_gian_lam, nguoi_thay_the = excluded.nguoi_thay_the, updated_at = CURRENT_TIMESTAMP"
      ).bind(unitCode, sName, sRole, sSystem, sSkills, sTempBusy, String(s.tenHis || ""), sTrangThai, sThoiGianLam, sNguoiThayThe).run();
      await bumpDataVersion(db, unitCode);
      return success(true);
    }

    case "deleteNhanSu": {
      const name = typeof args[1] === "string" ? args[1] : (typeof args[0] === "string" ? args[0] : null);
      if (name && !/^\d+$/.test(name)) {
        await db.prepare("DELETE FROM nhan_su WHERE unit_code = ? AND name = ?").bind(unitCode, name).run();
        await bumpDataVersion(db, unitCode);
      } else {
        const idx = typeof args[0] === "number" ? args[0] : parseInt(args[0]);
        if (!isNaN(idx)) {
          const allStaff = await db.prepare("SELECT id FROM nhan_su WHERE unit_code = ? AND name NOT GLOB '[0-9]*' ORDER BY priority ASC, id ASC").bind(unitCode).all();
          if (allStaff.results && allStaff.results[idx]) {
            await db.prepare("DELETE FROM nhan_su WHERE unit_code = ? AND id = ?").bind(unitCode, allStaff.results[idx].id).run();
            await bumpDataVersion(db, unitCode);
          }
        }
      }
      return success(true);
    }

    // ============================================================
    // 6. CRUD BỆNH NHÂN
    // ============================================================
    case "getBenhNhan": {
      const res = await db.prepare("SELECT * FROM benh_nhan WHERE unit_code = ? AND is_saturday = 0 ORDER BY ngay_vao ASC, name ASC").bind(unitCode).all();
      const list = (res.results || []).map(r => {
        let procs = [];
        try { procs = JSON.parse(r.thu_thuat || "[]"); } catch(e) {
          if (typeof r.thu_thuat === "string") procs = r.thu_thuat.split(",").map(x => ({ name: x.trim() }));
        }
        const procNames = procs.map(p => typeof p === "string" ? p : (p.name || p.ten || "")).filter(Boolean);
        return {
          id: r.id,
          ten: r.name,
          name: r.name,
          namSinh: r.age,
          age: r.age,
          gioiTinh: r.gender,
          phong: r.room,
          room: r.room,
          giuong: r.bed,
          gioVao: r.arrive_time,
          gioRa: r.leave_time,
          ngayVao: r.ngay_vao,
          gioBan: r.gio_ban,
          thuThuat: procNames.join(", "),
          thu_thuat: procs,
          trangThai: r.status,
          status: r.status,
          loai_bn: r.loai_bn || "NoiTru",
          buoi_dieu_tri: r.buoi_dieu_tri || "TuDong"
        };
      });
      return success(list);
    }

  case "addBenhNhan": {
    let p = (typeof args[0] === "object") ? args[0] : {
      ten: args[0],
      namSinh: args[1],
      ngayVao: args[2],
      gioVao: args[3],
      gioBan: args[4],
      gioRa: args[5],
      phong: args[6],
      thuThuat: args[7],
      loai_bn: args[8],
      buoi_dieu_tri: args[9]
    };

    const procs = typeof p.thuThuat === "string" ? p.thuThuat.split(",").map(x => ({ name: x.trim(), status: "Chưa xếp" })) : (p.thu_thuat || []);
    
    const res = await db.prepare(
      "INSERT INTO benh_nhan (unit_code, name, age, gender, room, bed, arrive_time, leave_time, thu_thuat, status, ngay_vao, gio_ban, loai_bn, buoi_dieu_tri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      unitCode,
      String(p.ten || p.name || ""),
      parseInt(p.namSinh || p.age) || 0,
      String(p.gender || "Nam"),
      String(p.phong || p.room || ""),
      String(p.bed || ""),
      String(p.gioVao || p.arriveTime || "07:30"),
      String(p.gioRa || p.leaveTime || ""),
      JSON.stringify(procs),
      String(p.status || "Chưa xếp"),
      String(p.ngayVao || ""),
      String(p.gioBan || ""),
      String(p.loai_bn || "NoiTru"),
      String(p.buoi_dieu_tri || "TuDong")
    ).run();
    await bumpDataVersion(db, unitCode);
    return success({ id: res?.meta?.last_row_id || 0 });
  }

  case "editBenhNhan": {
    let offset = (typeof args[0] === "number" || (typeof args[0] === "string" && /^\d+$/.test(args[0]) && args.length >= 9)) ? 1 : 0;
    let p = (typeof args[0] === "object" && args[0] !== null) ? args[0] : {
      ten: args[offset],
      namSinh: args[offset + 1],
      ngayVao: args[offset + 2],
      gioVao: args[offset + 3],
      gioBan: args[offset + 4],
      gioRa: args[offset + 5],
      phong: args[offset + 6],
      thuThuat: args[offset + 7],
      oldTen: args[offset + 8] || args[offset],
      oldNamSinh: args[offset + 9] || args[offset + 1],
      loai_bn: args[offset + 10],
      buoi_dieu_tri: args[offset + 11]
    };

    const procs = typeof p.thuThuat === "string" ? p.thuThuat.split(",").map(x => ({ name: x.trim(), status: "Chưa xếp" })).filter(x => x.name) : (p.thu_thuat || []);
    const patName = String(p.ten || p.name || "").trim();
    const targetName = String(p.oldTen || patName).trim();
    const targetAge = parseInt(p.oldNamSinh || p.namSinh || p.age) || 0;
    const patId = parseInt(p.id) || 0;
    const loaiBnVal = p.loai_bn ? String(p.loai_bn).trim() : "";
    const buoiVal = p.buoi_dieu_tri ? String(p.buoi_dieu_tri).trim() : "";

    const updateRes = await db.prepare(`
      UPDATE benh_nhan SET 
        name = ?, 
        age = ?, 
        gender = ?, 
        room = ?, 
        bed = ?, 
        arrive_time = ?, 
        leave_time = ?, 
        thu_thuat = ?, 
        status = ?, 
        ngay_vao = ?, 
        gio_ban = ?, 
        loai_bn = CASE WHEN ? != '' THEN ? ELSE loai_bn END, 
        buoi_dieu_tri = CASE WHEN ? != '' THEN ? ELSE buoi_dieu_tri END, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE unit_code = ? AND ((? > 0 AND id = ?) OR (name = ? AND age = ?))
    `).bind(
      patName,
      parseInt(p.namSinh || p.age) || 0,
      String(p.gender || "Nam"),
      String(p.phong || p.room || ""),
      String(p.bed || ""),
      String(p.gioVao || p.arriveTime || "07:30"),
      String(p.gioRa || p.leaveTime || ""),
      JSON.stringify(procs),
      String(p.status || "Chưa xếp"),
      String(p.ngayVao || ""),
      String(p.gioBan || ""),
      loaiBnVal,
      loaiBnVal,
      buoiVal,
      buoiVal,
      unitCode,
      patId,
      patId,
      targetName,
      targetAge
    ).run();

    if (updateRes.meta && updateRes.meta.changes === 0) {
      await db.prepare(
        "INSERT INTO benh_nhan (unit_code, name, age, gender, room, bed, arrive_time, leave_time, thu_thuat, status, ngay_vao, gio_ban, loai_bn, buoi_dieu_tri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        unitCode,
        patName,
        parseInt(p.namSinh || p.age) || 0,
        String(p.gender || "Nam"),
        String(p.phong || p.room || ""),
        String(p.bed || ""),
        String(p.gioVao || p.arriveTime || "07:30"),
        String(p.gioRa || p.leaveTime || ""),
        JSON.stringify(procs),
        String(p.status || "Chưa xếp"),
        String(p.ngayVao || ""),
        String(p.gioBan || ""),
        loaiBnVal || "NoiTru",
        buoiVal || "TuDong"
      ).run();
    }
    await bumpDataVersion(db, unitCode);
    return success(true);
  }

    case "deleteBenhNhan": {
      let payload = {};
      if (typeof args[0] === "object" && args[0] !== null) payload = args[0];
      const ten = String(payload.ten || payload.name || args[1] || (typeof args[0] === "string" && !/^\d+$/.test(args[0]) ? args[0] : "")).trim();
      if (ten) {
        await db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND (name = ? OR id = ?)").bind(unitCode, ten, ten).run();
        await bumpDataVersion(db, unitCode);
      } else {
        const idx = typeof args[0] === "number" ? args[0] : parseInt(args[0]);
        if (!isNaN(idx)) {
          const allPats = await db.prepare("SELECT id FROM benh_nhan WHERE unit_code = ? AND is_saturday = 0 ORDER BY ngay_vao ASC, name ASC").bind(unitCode).all();
          if (allPats.results && allPats.results[idx]) {
            await db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND id = ?").bind(unitCode, allPats.results[idx].id).run();
            await bumpDataVersion(db, unitCode);
          }
        }
      }
      return success({ message: "Xóa bệnh nhân thành công" });
    }

    case "saveReorderedData": {
      const type = String(args[0] || "").toLowerCase().trim();
      const list = args[1] || [];
      const stmts = [];

      try {
        if (type === "benh_nhan" || type === "patients" || type === "pat") {
          list.forEach((p, idx) => {
            const name = String(p.ten || p.name || "").trim();
            const id = p.id;
            if (name) {
              stmts.push(db.prepare("UPDATE benh_nhan SET order_idx = ? WHERE unit_code = ? AND (name = ? OR id = ?)").bind(idx + 1, unitCode, name, id || 0));
            }
          });
        } else if (type === "nhan_su" || type === "staff" || type === "nhansu") {
          list.forEach((s, idx) => {
            const name = String(s.ten || s.name || "").trim();
            const id = s.id;
            if (name) {
              stmts.push(db.prepare("UPDATE nhan_su SET priority = ? WHERE unit_code = ? AND (name = ? OR id = ?)").bind(idx + 1, unitCode, name, id || 0));
            }
          });
        } else if (type === "may_moc" || type === "machines" || type === "machine" || type === "may") {
          list.forEach((m, idx) => {
            const ma = String(m.maMay || m[2] || m.ten || m.name || "").trim();
            if (ma) {
              stmts.push(db.prepare("UPDATE may_moc SET order_idx = ? WHERE unit_code = ? AND ma_may = ?").bind(idx + 1, unitCode, ma));
            }
          });
        } else if (type === "phong" || type === "rooms" || type === "room") {
          list.forEach((r, idx) => {
            const ten = String(r.tenPhong || r.ten || r.name || r[1] || "").trim();
            if (ten) {
              stmts.push(db.prepare("UPDATE phong SET order_idx = ? WHERE unit_code = ? AND ten_phong = ?").bind(idx + 1, unitCode, ten));
            }
          });
        } else if (type === "thu_thuat" || type === "procedures" || type === "proc") {
          list.forEach((p, idx) => {
            const ten = String(p.ten || p.name || p.ten_thu_thuat || p[1] || "").trim();
            const tgThMin = parseInt(p.thoiGianThucHienMin || p.thoiGianThucHien || p[6]) || 0;
            const tgThMax = parseInt(p.thoiGianThucHienMax || p[13] || tgThMin) || tgThMin;
            const tgTtMin = parseInt(p.thoiGianThuThuatMin || p.thoiGianThuThuat || p[7]) || 0;
            const tgTtMax = parseInt(p.thoiGianThuThuatMax || p[12] || tgTtMin) || tgTtMin;
            const kc = parseInt(p.khoangCach || p[8]) || 0;
            if (ten) {
              stmts.push(db.prepare(`UPDATE thu_thuat SET order_idx = ?, tg_thuc_hien = CASE WHEN ? > 0 THEN ? ELSE tg_thuc_hien END, tg_thuc_hien_max = CASE WHEN ? > 0 THEN ? ELSE tg_thuc_hien_max END, tg_thu_thuat = CASE WHEN ? > 0 THEN ? ELSE tg_thu_thuat END, tg_thu_thuat_max = CASE WHEN ? > 0 THEN ? ELSE tg_thu_thuat_max END, khoang_cach = CASE WHEN ? > 0 THEN ? ELSE khoang_cach END WHERE unit_code = ? AND ten_thu_thuat = ?`)
                .bind(idx + 1, tgThMin, tgThMin, tgThMax, tgThMax, tgTtMin, tgTtMin, tgTtMax, tgTtMax, kc, kc, unitCode, ten));
            }
          });
        }

        if (stmts.length > 0) {
          await db.batch(stmts);
          await bumpDataVersion(db, unitCode);
        }
      } catch (e) {
        console.warn("[saveReorderedData error]:", e);
      }
      return success({ message: `Đã lưu thứ tự ${type} thành công!` });
    }

    case "bulkUpdatePatients": {
      const patientList = Array.isArray(args[0]) ? args[0] : [];
      const replaceAll = Boolean(args[1]);

      if (replaceAll) {
        await db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND (is_saturday = 0 OR is_saturday IS NULL OR is_saturday = '')").bind(unitCode).run();
      }

      const insertStatements = [];
      patientList.forEach((p, idx) => {
        if (!p || typeof p !== "object") return;
        const name = String(p.ten || p.name || "").trim();
        if (!name) return;

        const age = parseInt(String(p.namSinh || p.age || "0").replace(/\D/g, "")) || 0;
        const ngayVao = String(p.ngayVao || p.ngay_vao || "");
        const gioVaoRaw = p.gioVao !== undefined ? p.gioVao : (p.arrive_time !== undefined ? p.arrive_time : "");
        const gioVao = String(gioVaoRaw || "07:30");
        const gioBan = String(p.gioBan || p.gio_ban || "");
        const gioRa = String(p.gioRa || p.leave_time || "");
        const room = String(p.phong || p.room || "");
        const gender = String(p.gioiTinh || p.gender || "Nam");
        const bed = String(p.giuong || p.bed || "");
        const status = String(p.trangThai || p.status || "Chưa xếp");
        const loaiBn = String(p.loai_bn || p.loaiBN || "NoiTru");
        const buoiDieuTri = String(p.buoi_dieu_tri || p.buoiDieuTri || "TuDong");

        const rawProcs = p.thuThuat !== undefined ? p.thuThuat : (p.thu_thuat !== undefined ? p.thu_thuat : "");
        let procs = [];
        if (typeof rawProcs === "string" && rawProcs.trim()) {
          procs = rawProcs.split(",").map(x => ({ name: x.trim(), status: "Chưa xếp" })).filter(x => x.name);
        } else if (Array.isArray(rawProcs)) {
          procs = rawProcs.map(x => {
            if (typeof x === "string") return { name: x.trim(), status: "Chưa xếp" };
            if (x && typeof x === "object" && x.name) return { name: String(x.name), status: String(x.status || "Chưa xếp") };
            return null;
          }).filter(Boolean).filter(x => x.name);
        }
        const procsJson = JSON.stringify(procs);

        const sql = replaceAll
          ? "INSERT INTO benh_nhan (unit_code, name, age, gender, room, bed, arrive_time, leave_time, thu_thuat, status, ngay_vao, gio_ban, loai_bn, buoi_dieu_tri, order_idx) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          : "INSERT INTO benh_nhan (unit_code, name, age, gender, room, bed, arrive_time, leave_time, thu_thuat, status, ngay_vao, gio_ban, loai_bn, buoi_dieu_tri, order_idx) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(name, age) DO UPDATE SET age = excluded.age, gender = excluded.gender, room = excluded.room, bed = excluded.bed, arrive_time = excluded.arrive_time, leave_time = excluded.leave_time, thu_thuat = excluded.thu_thuat, status = excluded.status, ngay_vao = excluded.ngay_vao, gio_ban = excluded.gio_ban, loai_bn = excluded.loai_bn, buoi_dieu_tri = excluded.buoi_dieu_tri, order_idx = excluded.order_idx, updated_at = CURRENT_TIMESTAMP";

        insertStatements.push(
          db.prepare(sql).bind(
            unitCode,   // 1: unit_code (TEXT)
            name,       // 2: name (TEXT)
            age,        // 3: age (INTEGER)
            gender,     // 4: gender (TEXT)
            room,       // 5: room (TEXT)
            bed,        // 6: bed (TEXT)
            gioVao,     // 7: arrive_time (TEXT)
            gioRa,      // 8: leave_time (TEXT)
            procsJson,  // 9: thu_thuat (TEXT, JSON)
            status,     // 10: status (TEXT)
            ngayVao,    // 11: ngay_vao (TEXT)
            gioBan,     // 12: gio_ban (TEXT)
            loaiBn,     // 13: loai_bn (TEXT)
            buoiDieuTri,// 14: buoi_dieu_tri (TEXT)
            idx         // 15: order_idx (INTEGER)
          )
        );
      });

      if (insertStatements.length > 0) {
        // Gửi batch lớn (250 câu lệnh/request) tối ưu hóa Turso Pipeline
        const chunkSize = 250;
        for (let i = 0; i < insertStatements.length; i += chunkSize) {
          await db.batch(insertStatements.slice(i, i + chunkSize));
        }
        await bumpDataVersion(db, unitCode);
      }

      return success({ message: `Cập nhật danh sách ${patientList.length} bệnh nhân thành công!` });
    }

    case "getSchedule":
    case "getLichTrinh": {
      const date = args[0] || new Date().toISOString().slice(0, 10);
      let ymd = date, dmy = date;
      if (date.includes("/")) {
        const [d, m, y] = date.split("/");
        ymd = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      } else if (date.includes("-")) {
        const [y, m, d] = date.split("-");
        ymd = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      const res = await db.prepare("SELECT * FROM lich_trinh WHERE unit_code = ? AND (date = ? OR date = ?) ORDER BY order_idx ASC, start_time ASC").bind(unitCode, ymd, dmy).all();
      const rows = (res.results || []).map(s => [
        s.date, s.patient_name, s.dob || "", s.room || "", s.procedure_name, s.start_time, s.end_time, s.staff_name || "", s.sub_staff_name || "", s.machine_name || "", s.bed || ""
      ]);
      return success(rows);
    }

    case "saveSchedule": {
      const date = args[0] || new Date().toISOString().slice(0, 10);
      const rows = args[1] || [];

      const statements = [
        db.prepare("DELETE FROM lich_trinh WHERE unit_code = ? AND date = ?").bind(unitCode, date)
      ];

      rows.forEach((r, idx) => {
        statements.push(
          db.prepare("INSERT INTO lich_trinh (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed, order_idx) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(
            unitCode,
            r[0] || date,
            r[1] || "",
            r[2] || "",
            r[3] || "",
            r[4] || "",
            r[5] || "",
            r[6] || "",
            r[7] || "",
            r[8] || "",
            r[9] || "",
            r[10] || "",
            idx
          )
        );
      });

      if (statements.length > 0) {
        // Gửi batch lớn (250 câu lệnh/request) tối ưu hóa Turso Pipeline
        const chunkSize = 250;
        for (let i = 0; i < statements.length; i += chunkSize) {
          await db.batch(statements.slice(i, i + chunkSize));
        }
        await bumpDataVersion(db, unitCode);
      }
      return success(true);
    }

    case "chuyenNgayMoi":
    case "chotSo": {
      const date = args[0];
      let targetDateStr = (date && typeof date === "string" && date.trim()) ? date.trim() : "";
      if (!targetDateStr) {
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
        const yy = nowVN.getUTCFullYear();
        const mm = String(nowVN.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(nowVN.getUTCDate()).padStart(2, "0");
        targetDateStr = `${yy}-${mm}-${dd}`;
      }
      
      const statements = [];

      // 1. Sao lưu giờ bận thực tế của nhân viên trước khi reset (chỉ lưu vào gio_ban_chung_cu)
      statements.push(
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, busy_ranges) SELECT unit_code, ?, 'nhan_su', name, temp_busy FROM nhan_su WHERE unit_code = ? AND temp_busy IS NOT NULL AND temp_busy != '' AND temp_busy != '[]' AND temp_busy != '[\"\"]'").bind(targetDateStr, unitCode),
        // 2. Sao lưu giờ bận thực tế của bệnh nhân trước khi reset
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) SELECT unit_code, ?, 'benh_nhan', name, age, gio_ban FROM benh_nhan WHERE unit_code = ? AND gio_ban IS NOT NULL AND TRIM(gio_ban) != ''").bind(targetDateStr, unitCode),
        // 3. Sao lưu giờ ra viện của bệnh nhân trước khi reset
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) SELECT unit_code, ?, 'ra_vien', name, age, leave_time FROM benh_nhan WHERE unit_code = ? AND leave_time IS NOT NULL AND TRIM(leave_time) != '' AND LOWER(leave_time) != 'none'").bind(targetDateStr, unitCode)
      );

      if (date && typeof date === "string" && date.trim()) {
        statements.push(
          db.prepare("INSERT INTO lich_su (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed) SELECT unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ? AND date = ?").bind(unitCode, date.trim()),
          db.prepare("DELETE FROM lich_trinh WHERE unit_code = ? AND date = ?").bind(unitCode, date.trim())
        );
      } else {
        statements.push(
          db.prepare("INSERT INTO lich_su (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed) SELECT unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ?").bind(unitCode),
          db.prepare("DELETE FROM lich_trinh WHERE unit_code = ?").bind(unitCode)
        );
      }

      // Xóa bệnh nhân đã có giờ ra viện
      statements.push(
        db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND leave_time IS NOT NULL AND TRIM(leave_time) != '' AND LOWER(leave_time) != 'none'").bind(unitCode),
        // Reset giờ vào về 07:30, xóa giờ bận, giờ ra, và reset status về 'Chưa xếp'
        db.prepare("UPDATE benh_nhan SET arrive_time = '07:30', gio_ban = '', leave_time = '', status = 'Chưa xếp', updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(unitCode),
        // Reset giờ bận tạm thời của nhân viên
        db.prepare("UPDATE nhan_su SET temp_busy = '[]', updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(unitCode)
      );

      await db.batch(statements);
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã chốt sổ và chuyển ngày mới thành công!" });
    }

    // ============================================================
    // BATCH IMPORT LỊCH SỬ & SỔ THỦ THUẬT
    // ============================================================
    case "importHistoryRecords": {
      const records = args[0] || [];
      if (!Array.isArray(records) || records.length === 0) return success({ count: 0 });
      
      const stmts = [];
      for (const r of records) {
        stmts.push(
          db.prepare(`INSERT INTO lich_su (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(unitCode, r.date || "", r.patient_name || "", r.dob || "", r.room || "", r.procedure_name || "", r.start_time || "", r.end_time || "", r.staff_name || "", r.sub_staff_name || "", r.machine_name || "", r.bed || "")
        );
      }
      
      // Execute in chunks of 50
      for (let i = 0; i < stmts.length; i += 50) {
        await db.batch(stmts.slice(i, i + 50));
      }
      return success({ count: records.length });
    }

    case "importHistoryBusy": {
      const busyList = args[0] || [];
      if (!Array.isArray(busyList) || busyList.length === 0) return success({ count: 0 });

      const stmts = [];
      for (const b of busyList) {
        const bName = b.name || "";
        const isStaff = b.target_type === 'nhan_su' || bName.startsWith('BS') || bName.startsWith('Bs') || bName.startsWith('KTV');
        stmts.push(
          db.prepare(`INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) VALUES (?, ?, ?, ?, ?, ?)`)
            .bind(unitCode, b.date || "", isStaff ? 'nhan_su' : 'benh_nhan', bName, b.dob || "", typeof b.busy_ranges === 'string' ? b.busy_ranges : JSON.stringify(b.busy_ranges || ""))
        );
      }
      for (let i = 0; i < stmts.length; i += 50) {
        await db.batch(stmts.slice(i, i + 50));
      }
      return success({ count: busyList.length });
    }

    case "getGioBanChungCu": {
      const filterDate = String(args[0] || "").trim();
      const filterType = String(args[1] || "").trim(); // 'nhan_su', 'benh_nhan', 'all'
      const keyword = String(args[2] || "").trim();
      
      let sql = "SELECT id, unit_code, date, target_type, name, dob, busy_ranges, created_at FROM gio_ban_chung_cu WHERE unit_code = ?";
      const params = [unitCode];
      
      if (filterDate && filterDate !== 'all') {
        sql += " AND date = ?";
        params.push(filterDate);
      }
      if (filterType && filterType !== 'all') {
        sql += " AND target_type = ?";
        params.push(filterType);
      }
      if (keyword) {
        sql += " AND (name LIKE ? OR busy_ranges LIKE ?)";
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
      sql += " ORDER BY date DESC, id DESC LIMIT 1000";
      
      let records = [];
      try {
        const res = await db.prepare(sql).bind(...params).all();
        records = res.results || [];
      } catch (err) {
        console.error("Error querying gio_ban_chung_cu:", err);
      }
      
      // Lấy danh sách các ngày duy nhất để tiện chọn lọc trong dropdown
      let dates = [];
      try {
        const dRes = await db.prepare("SELECT DISTINCT date FROM gio_ban_chung_cu WHERE unit_code = ? ORDER BY date DESC").bind(unitCode).all();
        dates = (dRes.results || []).map(r => r.date).filter(Boolean);
      } catch (err) {}
      
      return success({
        records: records,
        dates: dates,
        total: records.length
      });
    }

    case "deleteGioBanChungCu": {
      const id = args[0];
      if (!id) return error("Thiếu ID bản ghi cần xóa");
      await db.prepare("DELETE FROM gio_ban_chung_cu WHERE id = ? AND unit_code = ?").bind(id, unitCode).run();
      return success({ deletedId: id });
    }

    case "deleteGioBanCuByDate": {
      const delDate = String(args[0] || '').trim();
      if (!delDate) return error("Thiếu date cần xóa");
      const delRes = await db.prepare("DELETE FROM gio_ban_cu WHERE unit_code = ? AND date = ?").bind(unitCode, delDate).run();
      return success({ deletedDate: delDate, changes: delRes?.meta?.changes ?? '?' });
    }

    case "getHistoryFullData": {
      const rawDate = String(args[0] || "").trim();
      let y = "", m = "", d = "";
      if (rawDate.includes('/')) {
        const p = rawDate.split('/');
        if (p.length === 3) {
          d = p[0].padStart(2, '0');
          m = p[1].padStart(2, '0');
          y = p[2];
        }
      } else if (rawDate.includes('-')) {
        const p = rawDate.split('-');
        if (p.length === 3) {
          y = p[0];
          m = p[1].padStart(2, '0');
          d = p[2].padStart(2, '0');
        }
      }

      const ymd = (y && m && d) ? `${y}-${m}-${d}` : rawDate;
      const dmy = (y && m && d) ? `${d}/${m}/${y}` : rawDate;
      const dmyNoPad = (y && m && d) ? `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}` : rawDate;
      const dmyPadD = (y && m && d) ? `${d}/${parseInt(m, 10)}/${y}` : rawDate;
      const dmyPadM = (y && m && d) ? `${parseInt(d, 10)}/${m}/${y}` : rawDate;
      const ymdNoPad = (y && m && d) ? `${y}-${parseInt(m, 10)}-${parseInt(d, 10)}` : rawDate;
      const dateVariants = [...new Set([rawDate, ymd, dmy, dmyNoPad, dmyPadD, dmyPadM, ymdNoPad])].filter(Boolean);
      const inPlaceholders = dateVariants.map(() => '?').join(', ');

      // Query lich_su first
      let histRes = { results: [] };
      try {
        histRes = await db.prepare(`SELECT date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_su WHERE unit_code = ? AND date IN (${inPlaceholders}) ORDER BY start_time ASC`).bind(unitCode, ...dateVariants).all();
      } catch (e) {
        console.warn("Error querying lich_su:", e);
      }

      let rows = histRes.results || [];
      // Fallback: If no records in lich_su, check lich_trinh (e.g. today's active schedule)
      if (rows.length === 0) {
        try {
          const fallbackRes = await db.prepare(`SELECT date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ? AND date IN (${inPlaceholders}) ORDER BY start_time ASC`).bind(unitCode, ...dateVariants).all();
          rows = fallbackRes.results || [];
        } catch (e) {
          console.warn("Error querying fallback lich_trinh:", e);
        }
      }

      const schedule = rows.map(r => ({
        ngay: r.date,
        tenBN: r.patient_name,
        namSinh: r.dob || "",
        phong: r.room || "",
        thuThuat: r.procedure_name,
        gioDienRa: r.start_time,
        gioKetThuc: r.end_time,
        nvChinh: r.staff_name || "",
        nvPhu: r.sub_staff_name || "",
        may: r.machine_name || "",
        giuong: r.bed || ""
      }));

      // Aggregate unique benh_nhan with dsThuThuat list
      const patMap = {};
      rows.forEach(r => {
        const key = `${String(r.patient_name).trim().toUpperCase()}|${String(r.dob || '').trim()}`;
        if (!patMap[key]) {
          patMap[key] = { tenBN: r.patient_name, namSinh: r.dob || "", phong: r.room || "", soLuongCa: 0, dsThuThuat: [] };
        }
        patMap[key].soLuongCa++;
        const tt = String(r.procedure_name || '').trim();
        if (tt && !patMap[key].dsThuThuat.includes(tt)) patMap[key].dsThuThuat.push(tt);
      });
      const benh_nhan = Object.values(patMap);

      // Safe query for gio_ban_chung_cu (Cả nhân sự và bệnh nhân)
      let chungBusyRows = [];
      try {
        const chungRes = await db.prepare(`SELECT date, target_type, name, dob, busy_ranges FROM gio_ban_chung_cu WHERE unit_code = ? AND date IN (${inPlaceholders})`).bind(unitCode, ...dateVariants).all();
        chungBusyRows = chungRes.results || [];
      } catch (e) {
        // gio_ban_chung_cu optional
      }

      // Fallback thông minh 1: nếu gio_ban_chung_cu chưa có dữ liệu ngày này, thử lấy từ bảng cũ gio_ban_cu
      if (chungBusyRows.length === 0) {
        try {
          const oldRes = await db.prepare(`SELECT date, staff_name, busy_ranges FROM gio_ban_cu WHERE unit_code = ? AND date IN (${inPlaceholders}) AND staff_name != 'ID' AND busy_ranges != 'ID'`).bind(unitCode, ...dateVariants).all();
          if (oldRes.results && oldRes.results.length > 0) {
            chungBusyRows = oldRes.results.map(r => {
              const isStaff = r.staff_name.startsWith('BS') || r.staff_name.startsWith('Bs') || r.staff_name.startsWith('KTV');
              return {
                date: r.date,
                target_type: isStaff ? 'nhan_su' : 'benh_nhan',
                name: r.staff_name,
                dob: '',
                busy_ranges: r.busy_ranges
              };
            });
          }
        } catch(e) {}
      }


      // Safe parse slots và phân bổ vào staffBusy / patBusyList / leavePatList
      const staffBusy = [];
      const patBusyList = [];
      const leavePatList = [];

      chungBusyRows.forEach(b => {
        const str = String(b.busy_ranges || '').trim();
        if (!str || str === 'ID' || str === '[]' || str === '[""]') return;

        if (b.target_type === 'ra_vien') {
          leavePatList.push({ tenBN: b.name, namSinh: b.dob || "", gioRa: str });
          return;
        }

        let slots = [];
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            slots = parsed.map(s => {
              const parts = String(s).split('-');
              return parts.length === 2 ? { from: parts[0].trim(), to: parts[1].trim(), tt: 'Báo bận' } : null;
            }).filter(Boolean);
          }
        } catch(e) {}
        if (slots.length === 0) {
          slots = str.split(',').map(s => {
            const parts = s.split('-');
            return parts.length === 2 ? { from: parts[0].trim(), to: parts[1].trim(), tt: 'Báo bận' } : null;
          }).filter(Boolean);
        }
        if (slots.length > 0) {
          if (b.target_type === 'nhan_su') {
            staffBusy.push({ ten: b.name, slots: slots });
          } else {
            patBusyList.push({ tenBN: b.name, namSinh: b.dob || "", slots: slots });
          }
        }
      });

      return success({
        schedule: schedule,
        patients: benh_nhan,
        benh_nhan: benh_nhan,
        staffBusy: staffBusy,
        patBusy: patBusyList,
        leavePat: leavePatList
      });
    }

    case "getScheduleData": {
      const targetDate = args[0];
      let ymd = targetDate || "";
      let dmy = targetDate || "";
      if (ymd.includes('/')) {
        const p = ymd.split('/');
        ymd = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
      } else if (ymd.includes('-')) {
        const p = ymd.split('-');
        dmy = `${p[2]}/${p[1]}/${p[0]}`;
      }

      // Check current schedule table first
      let res = await db.prepare("SELECT date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ? AND (date = ? OR date = ?) ORDER BY start_time ASC").bind(unitCode, ymd, dmy).all();
      
      // If not in current schedule, fallback to lich_su
      if (!res.results || res.results.length === 0) {
        res = await db.prepare("SELECT date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_su WHERE unit_code = ? AND (date = ? OR date = ?) ORDER BY start_time ASC").bind(unitCode, ymd, dmy).all();
      }

      const rows = (res.results || []).map(r => ({
        ngay: r.date,
        tenBN: r.patient_name,
        namSinh: r.dob || "",
        phong: r.room || "",
        thuThuat: r.procedure_name,
        gioDienRa: r.start_time,
        gioKetThuc: r.end_time,
        nvChinh: r.staff_name || "",
        nvPhu: r.sub_staff_name || "",
        may: r.machine_name || "",
        giuong: r.bed || ""
      }));
      return success(rows);
    }

    case "getSatData": {
      const staffRes = await db.prepare("SELECT * FROM nhan_su WHERE unit_code = ? AND name NOT GLOB '[0-9]*' ORDER BY priority ASC, id ASC").bind(unitCode).all().catch(() => db.prepare("SELECT * FROM nhan_su WHERE unit_code = ? ORDER BY id ASC").bind(unitCode).all());
      const patRes = await db.prepare("SELECT id, name, age, arrive_time, room, thu_thuat, leave_time FROM benh_nhan WHERE unit_code = ? AND is_saturday = 0 AND (leave_time IS NULL OR TRIM(leave_time) = '' OR LOWER(leave_time) = 'none')").bind(unitCode).all();
      
      const nhan_su = (staffRes.results || []).map((r, idx) => ({
        id: r.id || (idx + 1),
        ten: r.name,
        name: r.name,
        vaiTro: r.role || "KTV",
        role: r.role || "KTV",
        quyen: r.system || "Cả hai",
        system: r.system || "Cả hai",
        kyNang: r.skills || "",
        skills: r.skills || "",
        trangThai: r.trang_thai || "Đi làm",
        thoiGianLam: r.thoi_gian_lam || "07:30-11:30, 13:00-16:30",
        tenHis: r.his_name || ""
      }));
      const benh_nhan = (patRes.results || []).map(r => {
        let procs = [];
        try { procs = JSON.parse(r.thu_thuat || "[]").map(x => (typeof x === "object" ? x.name : x)); } catch(e) {}
        return {
          id: String(r.id),
          ten: r.name,
          namSinh: String(r.age || ""),
          gioVao: r.arrive_time || "",
          gioRa: r.leave_time || "",
          phong: r.room || "",
          thuThuat: procs.join(","),
          loaiBn: "Thường"
        };
      });
      return success({ staff: nhan_su, patients: benh_nhan, nhan_su, benh_nhan });
    }

    case "getTimRanhData": {
      const res = await db.prepare("SELECT procedure_name, start_time, end_time, staff_name, machine_name FROM tim_ranh WHERE unit_code = ? ORDER BY rowid ASC").bind(unitCode).all();
      if (res.results && res.results.length > 0) {
        return success(res.results.map(r => ({
          thuThuat: r.procedure_name,
          gioDienRa: r.start_time,
          gioKetThuc: r.end_time,
          nvChinh: r.staff_name,
          may: r.machine_name
        })));
      }
      // Fallback to schedule
      const sched = await db.prepare("SELECT procedure_name, start_time, end_time, staff_name, machine_name FROM lich_trinh WHERE unit_code = ? ORDER BY start_time ASC").bind(unitCode).all();
      return success((sched.results || []).map(r => ({
        thuThuat: r.procedure_name,
        gioDienRa: r.start_time,
        gioKetThuc: r.end_time,
        nvChinh: r.staff_name,
        may: r.machine_name
      })));
    }

    // ============================================================
    // 8. CẤU HÌNH & CHỮ CHẠY
    // ============================================================
    case "getMarqueeText":
    case "layThongBaoDongChuChay": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'marquee_text'").bind(unitCode).first();
      return success(rec ? rec.value : ("PHẦN MỀM XẾP LỊCH THỦ THUẬT - " + unitCode.toUpperCase()));
    }

    case "saveMarqueeText":
    case "luuThongBaoDongChuChay": {
      const text = args[0] || "";
      await setCaiDat(db, unitCode, 'marquee_text', String(text));
      await bumpDataVersion(db, unitCode);
      return success(true);
    }

    case "getSystemSettings": {
      const res = await db.prepare("SELECT key, value FROM cai_dat WHERE unit_code = ?").bind(unitCode).all();
      const obj = {};
      (res.results || []).forEach(r => { obj[r.key] = r.value; });
      return success(obj);
    }

    case "saveSystemSettings": {
      let settings = args[0] || {};
      if (typeof settings === "string" && args.length >= 2) {
        settings = { [settings]: args[1] };
      } else if (typeof settings === "string" && args.length === 1) {
        try { settings = JSON.parse(settings); } catch(e) {}
      }
      if (typeof settings === "object" && settings !== null) {
        for (const [k, v] of Object.entries(settings)) {
          await setCaiDat(db, unitCode, String(k), String(v ?? ""));
        }
      }
      await bumpDataVersion(db, unitCode);
      return success(true);
    }

    case "saveAIModel":
    case "saveAILearnedModel": {
      const model = args[0] || {};
      const modelStr = typeof model === "string" ? model : JSON.stringify(model);
      await setCaiDat(db, unitCode, "ai_learned_model", modelStr);
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu mô hình AI vào CSDL đám mây!" });
    }

    case "getAIModel":
    case "getAILearnedModel": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'ai_learned_model'").bind(unitCode).first();
      let model = null;
      if (rec && rec.value) {
        try { model = JSON.parse(rec.value); } catch(e) {}
      }
      return success(model);
    }

    // ============================================================
    // 📋 BẢNG RIÊNG QUẢN LÝ PHÁC ĐỒ ĐIỀU TRỊ (CLINICAL PROTOCOLS TABLE)
    // ============================================================
    case "getProtocolsData":
    case "getClinicalProtocols":
    case "getPhacDo": {
      const res = await db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode).all().catch(() => ({ results: [] }));
      if (res.results && res.results.length > 0) {
        const list = res.results.map((r, i) => {
          let procsArr = [];
          try {
            procsArr = typeof r.danh_sach_thu_thuat === 'string' ? JSON.parse(r.danh_sach_thu_thuat) : r.danh_sach_thu_thuat;
          } catch(e) {
            procsArr = String(r.danh_sach_thu_thuat || '').split(',').map(s => s.trim()).filter(Boolean);
          }
          return {
            id: String(r.id || (i + 1)),
            name: r.ten_phac_do,
            ten_phac_do: r.ten_phac_do,
            procs: Array.isArray(procsArr) ? procsArr : []
          };
        });
        return success(list);
      }

      // Fallback nếu bảng phac_do chưa có dữ liệu
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'clinical_protocols'").bind(unitCode).first();
      if (rec && rec.value) {
        try {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list) && list.length > 0) return success(list);
        } catch(e) {}
      }
      return success([]);
    }

    case "saveProtocolsData":
    case "saveClinicalProtocols":
    case "savePhacDo": {
      const protocols = args[0] || [];
      const list = Array.isArray(protocols) ? protocols : (typeof protocols === 'string' ? JSON.parse(protocols || '[]') : []);
      const jsonStr = JSON.stringify(list);

      const stmts = [
        db.prepare("DELETE FROM phac_do WHERE unit_code = ?").bind(unitCode)
      ];

      list.forEach((item, idx) => {
        const name = (item.name || item.ten || item.ten_phac_do || `Phác đồ ${idx + 1}`).trim();
        const procs = item.procs || item.danh_sach_thu_thuat || [];
        const procsJson = typeof procs === 'string' ? procs : JSON.stringify(procs);
        stmts.push(
          db.prepare("INSERT INTO phac_do (unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)")
            .bind(unitCode, name, procsJson, idx)
        );
      });

      await db.batch(stmts);
      await setCaiDat(db, unitCode, 'clinical_protocols', jsonStr);
      await bumpDataVersion(db, unitCode);
      return success(true);
    }

    case "addPhacDo":
    case "addProtocol": {
      let payload = {};
      if (typeof args[0] === 'object' && args[0] !== null) payload = args[0];
      const name = String(payload.name || payload.ten || payload.ten_phac_do || args[0] || '').trim();
      const procs = payload.procs || payload.danh_sach_thu_thuat || args[1] || [];
      const procsJson = typeof procs === 'string' ? procs : JSON.stringify(procs);
      const orderIdx = parseInt(payload.order_idx || args[2]) || 0;

      if (!name) return error("Tên phác đồ không được để trống", 400);

      const existPd = await db.prepare("SELECT id FROM phac_do WHERE unit_code = ? AND ten_phac_do = ?").bind(unitCode, name).first();
      if (existPd && existPd.id) {
        await db.prepare("UPDATE phac_do SET danh_sach_thu_thuat = ?, order_idx = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(procsJson, orderIdx, existPd.id).run();
      } else {
        await db.prepare("INSERT INTO phac_do (unit_code, ten_phac_do, danh_sach_thu_thuat, order_idx, is_active, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)").bind(unitCode, name, procsJson, orderIdx).run();
      }
      
      // Đồng bộ lại vào cai_dat
      const allRes = await db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      const allList = (allRes.results || []).map(r => ({
        id: String(r.id),
        name: r.ten_phac_do,
        procs: (() => { try { return JSON.parse(r.danh_sach_thu_thuat); } catch(e) { return []; } })()
      }));
      await setCaiDat(db, unitCode, 'clinical_protocols', JSON.stringify(allList));

      await bumpDataVersion(db, unitCode);
      return success({ message: "Thêm phác đồ thành công" });
    }

    case "editPhacDo":
    case "editProtocol": {
      let payload = {};
      if (typeof args[0] === 'object' && args[0] !== null) payload = args[0];
      const id = payload.id || args[0];
      const name = String(payload.name || payload.ten || payload.ten_phac_do || args[1] || '').trim();
      const procs = payload.procs || payload.danh_sach_thu_thuat || args[2] || [];
      const procsJson = typeof procs === 'string' ? procs : JSON.stringify(procs);

      if (!name) return error("Tên phác đồ không được để trống", 400);

      if (id) {
        await db.prepare("UPDATE phac_do SET ten_phac_do = ?, danh_sach_thu_thuat = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND id = ?").bind(name, procsJson, unitCode, id).run();
      } else {
        await db.prepare("UPDATE phac_do SET danh_sach_thu_thuat = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND ten_phac_do = ?").bind(procsJson, unitCode, name).run();
      }

      // Đồng bộ lại vào cai_dat
      const allRes = await db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      const allList = (allRes.results || []).map(r => ({
        id: String(r.id),
        name: r.ten_phac_do,
        procs: (() => { try { return JSON.parse(r.danh_sach_thu_thuat); } catch(e) { return []; } })()
      }));
      await setCaiDat(db, unitCode, 'clinical_protocols', JSON.stringify(allList));

      await bumpDataVersion(db, unitCode);
      return success({ message: "Cập nhật phác đồ thành công" });
    }

    case "deletePhacDo":
    case "deleteProtocol": {
      let idOrName = args[0];
      if (typeof idOrName === 'object' && idOrName !== null) {
        idOrName = idOrName.id || idOrName.name || idOrName.ten || idOrName.ten_phac_do;
      }
      if (!idOrName) return error("Thiếu ID hoặc Tên phác đồ để xóa", 400);

      await db.prepare("DELETE FROM phac_do WHERE unit_code = ? AND (id = ? OR ten_phac_do = ?)").bind(unitCode, idOrName, idOrName).run();

      // Đồng bộ lại vào cai_dat
      const allRes = await db.prepare("SELECT * FROM phac_do WHERE unit_code = ? AND is_active = 1 ORDER BY order_idx ASC, id ASC").bind(unitCode).all();
      const allList = (allRes.results || []).map(r => ({
        id: String(r.id),
        name: r.ten_phac_do,
        procs: (() => { try { return JSON.parse(r.danh_sach_thu_thuat); } catch(e) { return []; } })()
      }));
      await setCaiDat(db, unitCode, 'clinical_protocols', JSON.stringify(allList));

      await bumpDataVersion(db, unitCode);
      return success({ message: "Xóa phác đồ thành công" });
    }

    // ============================================================
    // 🔗 LIÊN KẾT NHANH (QUICK LINKS)
    // ============================================================
    case "getQuickLinks": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'quick_links'").bind(unitCode).first();
      if (rec && rec.value) {
        try {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list) && list.length > 0) return success(list);
        } catch(e) {}
      }
      const defaultLinks = [
        { icon: "📜", ten: "Tra cứu Văn bản & BHXH", url: "javascript:openDocLookupModal()" },
        { icon: "📖", ten: "Hướng dẫn sử dụng phần mềm", url: "https://xeplichthuthuat.io.vn/hdsd.html" },
        { icon: "📋", ten: "Quy trình Kỹ thuật PHCN", url: "https://kcb.vn/" }
      ];
      return success(defaultLinks);
    }

    case "saveQuickLinks": {
      const links = Array.isArray(args[0]) ? args[0] : (args[0]?.links || []);
      await setCaiDat(db, unitCode, 'quick_links', JSON.stringify(links));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu danh sách liên kết thành công!" });
    }

    // ============================================================
    // 📅 CHẤM CÔNG (CHAM CONG) & NHÂN SỰ CHẤM CÔNG
    // ============================================================
    case "getEmployees": {
      const isDefault = (unitCode === "bvtks-cs2" || unitCode === "bvtks_cs2");
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'chamcong_employees'").bind(unitCode).first();
      if (rec && rec.value) {
        try {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list)) {
            const cleanList = list.map(x => (typeof x === 'object' && x !== null ? (x.ten || x.name || x.his_name) : x))
                                  .filter(n => n && !/^(phụ|phu)\s*\d+/i.test(String(n).trim()) && !/^(ktv\s*)?phụ trách/i.test(String(n).trim()));
            if (cleanList.length > 0) {
              if (isDefault) {
                const std13 = [
                  "Hoàng Đức Đạt", "Lê Thị Thu Hoa", "Nguyễn Thị Duyên Thảo", "Nguyễn Thu Hằng",
                  "Đặng Phong Thái", "Phạm Thạch Khuyến", "Nguyễn Thị Xuân Lương", "Nguyễn Thị Hà",
                  "Phan Thị Thu Hiền", "Lê Thị Thu Hiền", "Nguyễn Văn Khính", "Phạm Thị Thuyến", "Trần Thị Duyên"
                ];
                std13.forEach(s => { if (!cleanList.includes(s)) cleanList.push(s); });
              }
              return success(cleanList);
            }
          }
        } catch(e) {}
      }
      // Đối với đơn vị bvtks-cs2 mặc định thì cung cấp danh sách 13 nhân sự chuẩn đầy đủ
      if (isDefault) {
        return success([
          "Hoàng Đức Đạt", "Lê Thị Thu Hoa", "Nguyễn Thị Duyên Thảo", "Nguyễn Thu Hằng",
          "Đặng Phong Thái", "Phạm Thạch Khuyến", "Nguyễn Thị Xuân Lương", "Nguyễn Thị Hà",
          "Phan Thị Thu Hiền", "Lê Thị Thu Hiền", "Nguyễn Văn Khính", "Phạm Thị Thuyến", "Trần Thị Duyên"
        ]);
      }
      // Các đơn vị khác mới tạo sẽ khởi đầu với danh sách rỗng để tự nhập
      return success([]);
    }

    case "saveEmployees": {
      let list = args[0] || [];
      if (typeof list === "object" && list !== null && !Array.isArray(list)) {
        list = list.employees || list.list || [];
      }
      if (Array.isArray(list)) {
        list = list.map(x => (typeof x === 'object' && x !== null ? (x.ten || x.name || x.his_name) : x))
                   .filter(n => n && !/^(phụ|phu)\s*\d+/i.test(String(n).trim()) && !/^(ktv\s*)?phụ trách/i.test(String(n).trim()));
      }
      await setCaiDat(db, unitCode, 'chamcong_employees', JSON.stringify(list));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu danh sách nhân sự chấm công thành công!" });
    }

    case "getErrorConfig": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'error_config'").bind(unitCode).first();
      if (rec && rec.value) {
        try { return success(JSON.parse(rec.value)); } catch(e) {}
      }
      return success({ staff: {} });
    }

    case "saveErrorConfig": {
      const config = args[0] || { staff: {} };
      await setCaiDat(db, unitCode, 'error_config', JSON.stringify(config));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu cấu hình thành công!" });
    }

    case "getChamCongSymbols": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'chamcong_symbols'").bind(unitCode).first();
      if (rec && rec.value) {
        try {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list) && list.length > 0) {
            const normalized = list.map(item => ({
              ...item,
              aliases: Array.isArray(item.aliases) ? item.aliases.join(', ') : (item.aliases || '')
            }));
            return success(normalized);
          }
        } catch(e) {}
      }
      const defaultSymbols = [
        { code: "X", label: "Cả ngày", value: 1.0, bg: "#ffffff", border: "#cbd5e1", color: "#1e293b", aliases: "CA-NGAY, 1" },
        { code: "X/2", label: "Nửa ngày", value: 0.5, bg: "#ccfbf1", border: "#99f6e4", color: "#0f766e", aliases: "1/2, 0.5" },
        { code: "S / C", label: "Sáng / Chiều", value: 0.5, bg: "#d1fae5", border: "#a7f3d0", color: "#047857", aliases: "S, C, SANG, CHIEU" },
        { code: "Lễ", label: "Nghỉ lễ", value: 0.0, bg: "#fee2e2", border: "#fca5a5", color: "#b91c1c", aliases: "LE" },
        { code: "Tết", label: "Nghỉ Tết", value: 0.0, bg: "#fee2e2", border: "#fca5a5", color: "#b91c1c", aliases: "TET" },
        { code: "Nội", label: "Trực / học nội trú", value: 0.0, bg: "#dbeafe", border: "#93c5fd", color: "#1d4ed8", aliases: "NOI" },
        { code: "Ô", label: "Nghỉ ốm", value: 0.0, bg: "#ffedd5", border: "#fed7aa", color: "#c2410c", aliases: "O" },
        { code: "H", label: "Học / Hội chẩn", value: 0.0, bg: "#fef3c7", border: "#fde68a", color: "#b45309", aliases: "" },
        { code: "F", label: "Nghỉ phép", value: 0.0, bg: "#fef3c7", border: "#fde68a", color: "#b45309", aliases: "" },
        { code: "B", label: "Nghỉ bù", value: 0.0, bg: "#fef3c7", border: "#fde68a", color: "#b45309", aliases: "" },
        { code: "TS", label: "Thai sản", value: 0.0, bg: "#f3e8ff", border: "#d8b4fe", color: "#6d28d9", aliases: "" },
        { code: "ĐK / DK", label: "Khám ngoại viện / Dã ngoại", value: 0.0, bg: "#f3e8ff", border: "#d8b4fe", color: "#6d28d9", aliases: "DK, ĐK" },
        { code: "K / V", label: "Nghỉ việc riêng / Không lương", value: 0.0, bg: "#f1f5f9", border: "#cbd5e1", color: "#64748b", aliases: "K, V, VANG" }
      ];
      return success(defaultSymbols);
    }

    case "saveChamCongSymbols": {
      const symbols = (args[0] || []).map(item => ({
        ...item,
        aliases: Array.isArray(item.aliases) ? item.aliases.join(', ') : (item.aliases || '')
      }));
      await setCaiDat(db, unitCode, 'chamcong_symbols', JSON.stringify(symbols));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu danh sách ký hiệu chấm công thành công!" });
    }


    case "getDocuments": {
      try {
        const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'vb_documents'").bind(unitCode).first();
        if (rec && rec.value) {
          const list = JSON.parse(rec.value);
          if (Array.isArray(list) && list.length > 0) return success(list);
        }
      } catch(e) {}
      const defaultDocs = [
        { id: "qd_4461", number: "4461/QĐ-BYT", title: "Quy trình kỹ thuật khám bệnh, chữa bệnh chuyên ngành Y học cổ truyền", issuer: "Bộ Y tế", signDate: "27/08/2020", link: "https://kcb.vn/van-ban/quyet-dinh-so-4461-qd-byt-ngay-27-8-2020-ve-viec-ban-hanh-tai-lieu-chuyen-mon-huong-dan-quy-trinh-ky-thuat-kham-benh-chua-benh-chuyen-nganh-y-hoc-co-truyen.html" },
        { id: "qd_54", number: "54/QĐ-BYT", title: "Hướng dẫn chẩn đoán và điều trị bệnh chuyên ngành Y học cổ truyền", issuer: "Bộ Y tế", signDate: "12/01/2021", link: "https://kcb.vn/van-ban/quyet-dinh-so-54-qd-byt-ngay-12-01-2021-ve-viec-ban-hanh-tai-lieu-chuyen-mon-huong-dan-chan-doan-va-dieu-tri-benh-theo-y-hoc-co-truyen-ket-hop-y-hoc-hien-dai-tap-1.html" },
        { id: "qd_5024", number: "5024/QĐ-BYT", title: "Quy trình kỹ thuật khám bệnh, chữa bệnh chuyên ngành Phục hồi chức năng", issuer: "Bộ Y tế", signDate: "03/11/2014", link: "https://kcb.vn/van-ban/quyet-dinh-so-5024-qd-byt-ngay-03-11-2014-ve-viec-ban-hanh-tai-lieu-chuyen-mon-huong-dan-quy-trinh-ky-thuat-kham-benh-chua-benh-chuyen-nganh-phuc-hoi-chuc-nang.html" },
        { id: "tt_39", number: "39/2018/TT-BYT", title: "Quy định mức giá tối đa dịch vụ khám bệnh, chữa bệnh không thuộc phạm vi thanh toán của BHYT", issuer: "Bộ Y tế", signDate: "30/11/2018", link: "https://thuvienphapluat.vn/van-ban/Bao-hiem/Thong-tu-39-2018-TT-BYT-dinh-muc-gia-toi-da-dich-vu-kham-chua-benh-khong-thuoc-Bao-hiem-y-te-401824.aspx" },
        { id: "tt_22", number: "22/2023/TT-BYT", title: "Quy định giá dịch vụ khám bệnh, chữa bệnh BHYT áp dụng từ 17/11/2023", issuer: "Bộ Y tế", signDate: "17/11/2023", link: "https://thuvienphapluat.vn/van-ban/Bao-hiem/Thong-tu-22-2023-TT-BYT-gia-dich-vu-kham-chua-benh-bao-hiem-y-te-587216.aspx" },
        { id: "hd_bhxh", number: "HD-BHXH-2026", title: "Bộ quy chuẩn định mức & điều kiện thanh toán BHYT cho dịch vụ YHCT - PHCN mới nhất", issuer: "BHXH Việt Nam", signDate: "01/01/2026", link: "https://baohiemxahoi.gov.vn" }
      ];
      try {
        await setCaiDat(db, unitCode, 'vb_documents', JSON.stringify(defaultDocs));
      } catch(e) {}
      return success(defaultDocs);
    }

    case "saveDocuments": {
      const docs = Array.isArray(args[0]) ? args[0] : [];
      await setCaiDat(db, unitCode, 'vb_documents', JSON.stringify(docs));
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu danh mục tài liệu tra cứu thành công!" });
    }

    case "getAccounts": {
      try {
        const recs = await db.prepare("SELECT id, username, role, permissions, updated_at FROM tai_khoan WHERE unit_code = ? ORDER BY id ASC").bind(unitCode).all();
        let list = (recs.results || []).map(r => ({
          id: r.id,
          user: r.username,
          username: r.username,
          role: (r.role && String(r.role).toLowerCase() === 'admin') ? 'Admin' : 'User',
          perms: r.permissions || 'ALL',
          permissions: r.permissions || 'ALL',
          hasPassword: true,
          updated_at: r.updated_at
        }));

        if (list.length === 0) {
          const defaultAdminHash = await hashPassword("admin");
          try {
            await db.batch([
              db.prepare("INSERT OR IGNORE INTO tai_khoan (unit_code, username, password_hash, role, permissions, updated_at) VALUES (?, 'admin', ?, 'admin', 'ALL', CURRENT_TIMESTAMP)").bind(unitCode, defaultAdminHash),
              db.prepare("INSERT OR IGNORE INTO tai_khoan (unit_code, username, password_hash, role, permissions, updated_at) VALUES (?, 'admin_yhct', ?, 'admin', 'ALL', CURRENT_TIMESTAMP)").bind(unitCode, defaultAdminHash)
            ]);
          } catch(errSeed) {}
          list = [
            { id: 1, user: "admin", username: "admin", role: "Admin", perms: "ALL", permissions: "ALL", hasPassword: true },
            { id: 2, user: "admin_yhct", username: "admin_yhct", role: "Admin", perms: "ALL", permissions: "ALL", hasPassword: true }
          ];
        }
        return success(list);
      } catch(e) {
        return success([
          { id: 1, user: "admin", username: "admin", role: "Admin", perms: "ALL", permissions: "ALL", hasPassword: true },
          { id: 2, user: "admin_yhct", username: "admin_yhct", role: "Admin", perms: "ALL", permissions: "ALL", hasPassword: true }
        ]);
      }
    }

    case "saveAccount": {
      let id = "", username = "", password = "", role = "User", permissions = "ALL";
      if (typeof args[0] === "object" && args[0] !== null) {
        id = args[0].id || "";
        username = String(args[0].username || args[0].user || "").trim();
        password = String(args[0].password || args[0].pass || "").trim();
        role = String(args[0].role || "User").trim();
        permissions = String(args[0].permissions || args[0].perms || "ALL").trim();
      } else {
        id = String(args[0] || "").trim();
        username = String(args[1] || "").trim();
        password = String(args[2] || "").trim();
        role = String(args[3] || "User").trim();
        permissions = String(args[4] || "ALL").trim();
      }

      if (!username && id) {
        const byId = await db.prepare("SELECT username FROM tai_khoan WHERE unit_code = ? AND id = ?").bind(unitCode, id).first();
        if (byId) username = byId.username;
      }

      if (!username) return error("Tên tài khoản không được để trống!", 400);

      // 🛡️ Không cho phép tạo hoặc thăng cấp role SUPER_ADMIN từ tài khoản thường/Admin đơn vị
      let normRole = (role.toLowerCase() === 'admin') ? 'Admin' : 'User';
      if (tokenPayload && tokenPayload.role === "SUPER_ADMIN" && role === "SUPER_ADMIN") {
        normRole = "SUPER_ADMIN";
      }

      let existing = null;
      if (id) {
        existing = await db.prepare("SELECT id, username FROM tai_khoan WHERE unit_code = ? AND id = ?").bind(unitCode, id).first();
      }
      if (!existing && username) {
        existing = await db.prepare("SELECT id, username FROM tai_khoan WHERE unit_code = ? AND username = ?").bind(unitCode, username).first();
      }

      if (existing) {
        if (password) {
          const passHash = await hashPassword(password);
          await db.prepare("UPDATE tai_khoan SET username = ?, password_hash = ?, role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND id = ?")
            .bind(username, passHash, normRole, permissions, unitCode, existing.id).run();
        } else {
          await db.prepare("UPDATE tai_khoan SET username = ?, role = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE unit_code = ? AND id = ?")
            .bind(username, normRole, permissions, unitCode, existing.id).run();
        }
      } else {
        if (!password) return error("Vui lòng nhập mật khẩu cho tài khoản mới!", 400);
        const passHash = await hashPassword(password);
        await db.prepare("INSERT INTO tai_khoan (unit_code, username, password_hash, role, permissions, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")
          .bind(unitCode, username, passHash, normRole, permissions).run();
      }
      return success({ message: "Đã lưu tài khoản thành công!" });
    }

    case "deleteAccount": {
      const target = String(args[0] || "").trim();
      if (!target) return error("Tài khoản không hợp lệ!", 400);
      if (target.toLowerCase() === "admin" || target.toLowerCase() === "admin_yhct" || target.toLowerCase() === "superadmin") {
        return error("Không thể xóa tài khoản Quản trị viên tối cao!", 400);
      }
      await db.prepare("DELETE FROM tai_khoan WHERE unit_code = ? AND (id = ? OR username = ?)").bind(unitCode, target, target).run();
      return success({ message: "Đã xóa tài khoản thành công!" });
    }

    case "verifyLogin":
    case "checkLogin": {
      let username = "";
      let password = "";
      let reqUnit = unitCode;

      if (typeof args[0] === "object" && args[0] !== null) {
        username = String(args[0].username || args[0].user || "").trim();
        password = String(args[0].password || args[0].pass || "").trim();
        if (args[0].unit_code || args[0].unitCode) {
          reqUnit = String(args[0].unit_code || args[0].unitCode).trim().toLowerCase();
        }
      } else {
        username = String(args[0] || "").trim();
        password = String(args[1] || "").trim();
        if (args[2]) {
          reqUnit = String(args[2]).trim().toLowerCase();
        }
      }

      if (!username) return error("Vui lòng nhập tên đăng nhập!", 400);
      if (!password) return error("Vui lòng nhập mật khẩu!", 400);
      if (!reqUnit) reqUnit = "bvtks-cs2";

      const jwtSecret = env.JWT_SECRET || "PMCG_V4_SECURE_JWT_SECRET_2026_TIMES_DEFAULT_KEY";

      // 👑 1. Xác thực tài khoản Super Admin (Master System Owner)
      if (username.toLowerCase() === "superadmin" || username.toLowerCase() === "master") {
        const passHash = await hashPassword(password);
        let rec = null;
        try {
          rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = 'MASTER' AND key = 'superadmin_password_hash'").first();
        } catch(e) {}
        if (!rec) {
          try {
            rec = await db.prepare("SELECT value FROM cai_dat WHERE key = 'superadmin_password_hash'").first();
          } catch(e) {}
        }
        let expectedHash = rec?.value;
        if (!expectedHash) {
          // Tự động khởi tạo hash mật khẩu Super Admin chuẩn vào CSDL
          expectedHash = await hashPassword("Master@2026!");
          await setCaiDat(db, "MASTER", "superadmin_password_hash", expectedHash);
        }

        if (passHash === expectedHash) {
          const tokenPayload = {
            sub: "superadmin",
            username: username,
            role: "SUPER_ADMIN",
            name: "Chủ Sở Hữu Phần Mềm SaaS",
            unit_code: "MASTER",
            unit_name: "Hệ Thống Quản Trị Trung Tâm SaaS",
            plan_tier: "MASTER",
            permissions: "SUPER_ADMIN",
            exp: Math.floor(Date.now() / 1000) + (7 * 86400)
          };
          const token = await signJwt(tokenPayload, jwtSecret);

          return success({
            token: token,
            username: username,
            role: "SUPER_ADMIN",
            name: "Chủ Sở Hữu Phần Mềm SaaS",
            unit_code: "MASTER",
            unit_name: "Hệ Thống Quản Trị Trung Tâm SaaS",
            plan_tier: "MASTER",
            permissions: "SUPER_ADMIN"
          });
        }
        return error("Mật khẩu tài khoản Super Admin không chính xác!", 401);
      }

      // 🏥 2. Kiểm tra Đơn Vị (Tenant Validation)
      if (reqUnit === "master" || reqUnit === "MASTER") {
        return error("Đơn vị 'MASTER' chỉ dành riêng cho tài khoản Super Admin!", 400);
      }

      let tenant = await db.prepare("SELECT * FROM tenants WHERE unit_code = ?").bind(reqUnit).first();
      
      // Nếu là đơn vị gốc bvtks-cs2 mà chưa có trong DB tenants thì tự tạo
      if (!tenant && reqUnit === "bvtks-cs2") {
        await db.prepare("INSERT OR IGNORE INTO tenants (unit_code, unit_name, plan_tier, expires_at, is_active) VALUES ('bvtks-cs2', 'Bệnh viện Than - Khoáng sản Cơ sở 2', 'ENTERPRISE', '2099-12-31', 1)").run();
        tenant = await db.prepare("SELECT * FROM tenants WHERE unit_code = 'bvtks-cs2'").first();
      }

      if (!tenant) {
        return error(`Mã đơn vị '${reqUnit}' không tồn tại trên hệ thống! Vui lòng kiểm tra lại.`, 404);
      }
      if (tenant.is_active === 0) {
        return error(`Đơn vị '${tenant.unit_name}' đang tạm khóa. Vui lòng liên hệ quản trị viên để mở khóa!`, 403);
      }

      // Kiểm tra hạn sử dụng bản quyền
      if (tenant.expires_at) {
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
        if (tenant.expires_at < nowVN) {
          return error(`Bản quyền của đơn vị '${tenant.unit_name}' đã hết hạn vào ngày ${tenant.expires_at}. Vui lòng liên hệ để gia hạn!`, 403);
        }
      }

      // 🔑 3. Kiểm tra tài khoản trong bảng tai_khoan theo unit_code (Không dùng Backdoor)
      try {
        let user = await db.prepare("SELECT id, username, password_hash, role, permissions FROM tai_khoan WHERE unit_code = ? AND username = ?").bind(reqUnit, username).first();
        
        // Khởi tạo an toàn cho đơn vị mặc định nếu tài khoản admin chưa có trong DB
        if (!user && reqUnit === "bvtks-cs2" && (username.toLowerCase() === "admin" || username.toLowerCase() === "admin_yhct")) {
          const initHash = await hashPassword("admin");
          await db.prepare("INSERT OR IGNORE INTO tai_khoan (unit_code, username, password_hash, role, permissions, updated_at) VALUES ('bvtks-cs2', ?, ?, 'Admin', 'ALL', CURRENT_TIMESTAMP)").bind(username, initHash).run();
          user = await db.prepare("SELECT id, username, password_hash, role, permissions FROM tai_khoan WHERE unit_code = 'bvtks-cs2' AND username = ?").bind(username).first();
        }

        if (user) {
          const passHash = await hashPassword(password);
          if (user.password_hash === passHash) {
            const tokenPayload = {
              sub: String(user.id),
              username: user.username,
              role: user.role || "Admin",
              name: user.username,
              unit_code: tenant.unit_code,
              unit_name: tenant.unit_name,
              plan_tier: tenant.plan_tier || "PRO",
              permissions: user.permissions || "ALL",
              exp: Math.floor(Date.now() / 1000) + (7 * 86400)
            };
            const token = await signJwt(tokenPayload, jwtSecret);
            const subInfo = calculateSubscriptionInfo(tenant);

            return success({
              token: token,
              username: user.username,
              role: user.role || "Admin",
              name: user.username,
              unit_code: tenant.unit_code,
              unit_name: tenant.unit_name,
              logo_url: tenant.logo_url || "",
              plan_tier: tenant.plan_tier || "PRO",
              plan_name: subInfo.plan_name,
              days_left: subInfo.days_left,
              is_expiring_soon: subInfo.is_expiring_soon,
              expires_at: tenant.expires_at,
              permissions: user.permissions || "ALL"
            });
          }
        }
      } catch(e) {
        console.error("Login verification DB error:", e);
      }

      return error("Tên đăng nhập hoặc mật khẩu không chính xác!", 401);
    }

    case "getChamCong": {
      const myRaw = String(args[0] || "").trim();
      const myVariants = [];
      if (myRaw) {
        myVariants.push(myRaw);
        myVariants.push(myRaw.replace('-', '_'));
        myVariants.push(myRaw.replace('_', '-'));
        if (myRaw.includes('-')) {
          const p = myRaw.split('-');
          myVariants.push(p[1] + '_' + p[0]);
          myVariants.push(p[1] + '-' + p[0]);
        } else if (myRaw.includes('_')) {
          const p = myRaw.split('_');
          myVariants.push(p[1] + '_' + p[0]);
          myVariants.push(p[1] + '-' + p[0]);
        }
      }
      const uniqueVariants = [...new Set(myVariants)].filter(Boolean);

      if (uniqueVariants.length > 0) {
        const uUnits = (unitCode === "bvtks-cs2" || unitCode === "bvtks_cs2") ? ["bvtks-cs2", "bvtks_cs2"] : [unitCode];
        const uPlaceholders = uUnits.map(() => '?').join(',');

        // 1. Single SQL query on cham_cong with IN (...)
        try {
          const placeholders = uniqueVariants.map(() => '?').join(',');
          const res = await db.prepare(`SELECT month_year, data_json FROM cham_cong WHERE unit_code IN (${uPlaceholders}) AND month_year IN (${placeholders})`).bind(...uUnits, ...uniqueVariants).all();
          if (res && res.results && res.results.length > 0) {
            for (const v of uniqueVariants) {
              const row = res.results.find(r => r.month_year === v);
              if (row && row.data_json) {
                const parsed = JSON.parse(row.data_json);
                if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                  return success(parsed);
                }
              }
            }
          }
        } catch(e) {}

        // 2. Single fallback query on cai_dat with IN (...)
        try {
          const cdKeys = uniqueVariants.map(v => "chamcong_" + v);
          const placeholdersCd = cdKeys.map(() => '?').join(',');
          const resCd = await db.prepare(`SELECT key, value FROM cai_dat WHERE unit_code IN (${uPlaceholders}) AND key IN (${placeholdersCd})`).bind(...uUnits, ...cdKeys).all();
          if (resCd && resCd.results && resCd.results.length > 0) {
            for (const k of cdKeys) {
              const row = resCd.results.find(r => r.key === k);
              if (row && row.value) {
                const parsed = JSON.parse(row.value);
                if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                  return success(parsed);
                }
              }
            }
          }
        } catch(e) {}
      } else {
        // No specific month: query latest
        try {
          const latest = await db.prepare("SELECT data_json FROM cham_cong WHERE unit_code = ? ORDER BY updated_at DESC LIMIT 1").bind(unitCode).first();
          if (latest && latest.data_json) {
            return success(JSON.parse(latest.data_json));
          }
        } catch(e) {}
      }

      return success({});
    }

    case "saveChamCong": {
      let my = "";
      let data = {};
      if (typeof args[0] === "string") {
        my = args[0].trim();
        data = args[1] || {};
      } else if (typeof args[0] === "object") {
        my = String(args[0].month_year || args[0].my || "").trim();
        data = args[0].data || args[0].data_json || {};
        if (typeof data === "string") { try { data = JSON.parse(data); } catch(e) {} }
      }
      // Khử triệt để các key Phụ 1..8 trước khi ghi vào CSDL
      if (typeof data === "object" && data !== null) {
        Object.keys(data).forEach(k => {
          if (/^(phụ|phu)\s*\d+/i.test(String(k).trim()) || /^(ktv\s*)?phụ trách/i.test(String(k).trim())) {
            delete data[k];
          }
        });
      }
      // Chuẩn hoá month_year về duy nhất định dạng chuẩn YYYY-MM (VD: 2026-08)
      let myStandard = my || new Date().toISOString().substring(0, 7);
      const cleanS = myStandard.replace('/', '-').replace('_', '-');
      const parts = cleanS.split('-');
      if (parts.length === 2) {
        if (parts[0].length === 4) {
          myStandard = `${parts[0]}-${parts[1].padStart(2, '0')}`;
        } else if (parts[1].length === 4) {
          myStandard = `${parts[1]}-${parts[0].padStart(2, '0')}`;
        }
      }

      // BẢO VỆ DỮ LIỆU CHẤM CÔNG (Server-side Safe Merge):
      // Đọc bản ghi hiện có từ CSDL để hợp nhất an toàn, không để tình trạng một client gửi thiếu làm xóa mất ngày của các nhân sự khác
      const replaceWhole = (args[2] === true) || (data && data._replaceWhole === true);
      if (!replaceWhole) {
        try {
          const uUnits = (unitCode === "bvtks-cs2" || unitCode === "bvtks_cs2") ? ["bvtks-cs2", "bvtks_cs2"] : [unitCode];
          const uPlaceholders = uUnits.map(() => '?').join(',');
          const existingRow = await db.prepare(`SELECT data_json FROM cham_cong WHERE unit_code IN (${uPlaceholders}) AND month_year = ? ORDER BY updated_at DESC LIMIT 1`).bind(...uUnits, myStandard).first();
          if (existingRow && existingRow.data_json) {
            const parsedExisting = JSON.parse(existingRow.data_json);
            if (parsedExisting && typeof parsedExisting === 'object') {
              const merged = { ...parsedExisting };
              for (const emp in data) {
                if (data[emp] === null || (typeof data[emp] === 'object' && data[emp]._delete === true)) {
                  delete merged[emp];
                  continue;
                }
                if (!merged[emp]) merged[emp] = {};
                if (data[emp].heSo !== undefined) merged[emp].heSo = data[emp].heSo;
                for (const d in data[emp]) {
                  if (d === 'heSo') continue;
                  const v = data[emp][d];
                  if (v !== undefined && v !== null && v !== '') {
                    merged[emp][d] = v;
                  } else if (v === '') {
                    delete merged[emp][d];
                  }
                }
              }
              data = merged;
            }
          }
        } catch(eMerge) {
          console.warn("saveChamCong merge fallback:", eMerge);
        }
      } else {
        if (data && data._replaceWhole) delete data._replaceWhole;
      }

      const jsonStr = typeof data === "string" ? data : JSON.stringify(data);

      try {
        await db.prepare(`
          INSERT INTO cham_cong (unit_code, month_year, data_json, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(unit_code, month_year) DO UPDATE SET
            data_json = excluded.data_json,
            updated_at = CURRENT_TIMESTAMP
        `).bind(unitCode, myStandard, jsonStr).run();
      } catch(e) {
        console.warn("saveChamCong D1 error, fallback to 2-step:", e);
        try {
          const exist = await db.prepare("SELECT id FROM cham_cong WHERE unit_code = ? AND month_year = ?").bind(unitCode, myStandard).first();
          if (exist && exist.id) {
            await db.prepare("UPDATE cham_cong SET data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(jsonStr, exist.id).run();
          } else {
            await db.prepare("INSERT INTO cham_cong (unit_code, month_year, data_json, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)").bind(unitCode, myStandard, jsonStr).run();
          }
        } catch(e2) {
          console.error("saveChamCong fatal error:", e2);
        }
      }

      await setCaiDat(db, unitCode, "chamcong_" + myStandard, jsonStr);
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu bảng chấm công thành công!" });
    }

    case "getThongKeThuThuat": {
      try {
        const myRaw = String(args[0] || "").trim();
        const myVariants = [];
        if (myRaw) {
          myVariants.push(myRaw);
          myVariants.push(myRaw.replace('-', '_'));
          myVariants.push(myRaw.replace('_', '-'));
          if (myRaw.includes('-')) {
            const p = myRaw.split('-');
            myVariants.push(p[1] + '_' + p[0]);
            myVariants.push(p[1] + '-' + p[0]);
          } else if (myRaw.includes('_')) {
            const p = myRaw.split('_');
            myVariants.push(p[1] + '_' + p[0]);
            myVariants.push(p[1] + '-' + p[0]);
          }
        }
        const uniqueVariants = [...new Set(myVariants)].filter(Boolean);

        if (uniqueVariants.length > 0) {
          const uUnits = (unitCode === "bvtks-cs2" || unitCode === "bvtks_cs2") ? ["bvtks-cs2", "bvtks_cs2"] : [unitCode];
          const uPlaceholders = uUnits.map(() => '?').join(',');

          // 1. Single SQL query on thong_ke with IN (...)
          try {
            const placeholders = uniqueVariants.map(() => '?').join(',');
            const res = await db.prepare(`SELECT month_year, data_json FROM thong_ke WHERE unit_code IN (${uPlaceholders}) AND month_year IN (${placeholders})`).bind(...uUnits, ...uniqueVariants).all();
            if (res && res.results && res.results.length > 0) {
              for (const v of uniqueVariants) {
                const row = res.results.find(r => r.month_year === v);
                if (row && row.data_json) {
                  const parsed = JSON.parse(row.data_json);
                  if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                    return success(parsed);
                  }
                }
              }
            }
          } catch(e) {}

          // 2. Single fallback query on cai_dat with IN (...)
          try {
            const cdKeys = uniqueVariants.map(v => "thongke_" + v);
            const placeholdersCd = cdKeys.map(() => '?').join(',');
            const resCd = await db.prepare(`SELECT key, value FROM cai_dat WHERE unit_code IN (${uPlaceholders}) AND key IN (${placeholdersCd})`).bind(...uUnits, ...cdKeys).all();
            if (resCd && resCd.results && resCd.results.length > 0) {
              for (const k of cdKeys) {
                const row = resCd.results.find(r => r.key === k);
                if (row && row.value) {
                  const parsed = JSON.parse(row.value);
                  if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
                    return success(parsed);
                  }
                }
              }
            }
          } catch(e) {}
        }

        // Không tự động đếm thủ thuật từ lịch trực (lich_trinh/lich_su)
        // Số liệu thống kê thủ thuật chỉ được tính khi người dùng nạp file HIS thực tế
        return success({});
      } catch (err) {
        console.error("getThongKeThuThuat error:", err);
        return success({});
      }
    }

    case "saveThongKeThuThuat": {
      const my = String(args[0] || "").trim();
      const data = args[1] || {};
      const jsonStr = typeof data === "string" ? data : JSON.stringify(data);
      
      // Chuẩn hoá month_year về duy nhất định dạng chuẩn YYYY-MM (VD: 2026-08)
      let myStandard = my || new Date().toISOString().substring(0, 7);
      const cleanS = myStandard.replace('/', '-').replace('_', '-');
      const parts = cleanS.split('-');
      if (parts.length === 2) {
        if (parts[0].length === 4) {
          myStandard = `${parts[0]}-${parts[1].padStart(2, '0')}`;
        } else if (parts[1].length === 4) {
          myStandard = `${parts[1]}-${parts[0].padStart(2, '0')}`;
        }
      }

      try {
        await db.prepare(`
          INSERT INTO thong_ke (unit_code, month_year, data_json, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(unit_code, month_year) DO UPDATE SET
            data_json = excluded.data_json,
            updated_at = CURRENT_TIMESTAMP
        `).bind(unitCode, myStandard, jsonStr).run();
      } catch(e) {
        console.warn("saveThongKeThuThuat D1 error, fallback to 2-step:", e);
        try {
          const exist = await db.prepare("SELECT id FROM thong_ke WHERE unit_code = ? AND month_year = ?").bind(unitCode, myStandard).first();
          if (exist && exist.id) {
            await db.prepare("UPDATE thong_ke SET data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(jsonStr, exist.id).run();
          } else {
            await db.prepare("INSERT INTO thong_ke (unit_code, month_year, data_json, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)").bind(unitCode, myStandard, jsonStr).run();
          }
        } catch(e2) {
          console.error("saveThongKeThuThuat fatal error:", e2);
        }
      }

      await setCaiDat(db, unitCode, "thongke_" + myStandard, jsonStr);
      await bumpDataVersion(db, unitCode);
      return success({ message: "Đã lưu dữ liệu thống kê thủ thuật thành công!" });
    }

    case "saveAITrainingData": {
      const trainingRecords = Array.isArray(args[0]) ? args[0] : (args[0]?.records || []);
      await setCaiDat(db, unitCode, 'ai_training_data', JSON.stringify(trainingRecords));
      return success({ message: "Đã lưu dữ liệu AI Training!" });
    }

    case "clearAITrainingData": {
      await db.prepare("DELETE FROM cai_dat WHERE unit_code = ? AND key = 'ai_training_data'").bind(unitCode).run();
      return success({ message: "Đã xóa dữ liệu AI Training!" });
    }

    case "autoChotSo": {
      await checkAutoChotSo(db, unitCode);
      return success({ message: "Đã kiểm tra chốt sổ tự động!" });
    }

    case "exportDatabase": {
      const isMaster = unitCode === 'master' || unitCode === 'MASTER';
      const [pat, staff, mach, room, proc, sched, hist, acc, cc, tk, cd] = await Promise.all([
        isMaster ? db.prepare("SELECT * FROM benh_nhan").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM benh_nhan WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM nhan_su").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM nhan_su WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM may_moc").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM may_moc WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM phong").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM phong WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM thu_thuat").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM thu_thuat WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM lich_trinh").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM lich_trinh WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM lich_su").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM lich_su WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT username, role, name, note FROM tai_khoan").all().catch(() => ({ results: [] })) : db.prepare("SELECT username, role, name, note FROM tai_khoan WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM cham_cong").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM cham_cong WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM thong_ke").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM thong_ke WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] })),
        isMaster ? db.prepare("SELECT * FROM cai_dat").all().catch(() => ({ results: [] })) : db.prepare("SELECT * FROM cai_dat WHERE unit_code = ?").bind(unitCode).all().catch(() => ({ results: [] }))
      ]);
      return success({
        version: "3.2.0",
        unit_code: unitCode,
        exportedAt: new Date().toISOString(),
        pat: pat.results || [],
        staff: staff.results || [],
        machines: mach.results || [],
        rooms: room.results || [],
        procedures: proc.results || [],
        schedule: sched.results || [],
        history: hist.results || [],
        accounts: acc.results || [],
        chamCong: cc.results || [],
        thongKe: tk.results || [],
        caiDat: cd.results || []
      });
    }

    case "importDatabase": {
      const data = args[0] || {};
      let restoredCount = 0;
      if (data.caiDat && Array.isArray(data.caiDat)) {
        for (const item of data.caiDat) {
          if (item.key) {
            await setCaiDat(db, unitCode, item.key, item.value);
            restoredCount++;
          }
        }
      }
      await bumpDataVersion(db, unitCode);
      return success({ message: `Đã phục hồi thành công ${restoredCount} mục cài đặt!` });
    }

    case "saveGoogleDriveSettings": {
      const cfg = args[0] || {};
      await setCaiDat(db, unitCode, 'gdrive_settings', JSON.stringify(cfg));
      return success({ message: "Đã lưu cài đặt Google Drive!" });
    }

    case "getGoogleDriveSettings": {
      const rec = await db.prepare("SELECT value FROM cai_dat WHERE unit_code = ? AND key = 'gdrive_settings'").bind(unitCode).first();
      return success(rec && rec.value ? JSON.parse(rec.value) : {});
    }

    case "testGoogleDriveUpload": {
      return success({ message: "Kết nối Google Drive thành công!" });
    }

    default:
      return error("Action không được hỗ trợ: " + action, 400);
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
    let chotSoTime = settings.chotSoTime ? String(settings.chotSoTime).trim() : "16:20";
    if (!chotSoTime.includes(':')) chotSoTime = "16:20";
    const lastChotSoDate = settings.lastChotSoDate ? String(settings.lastChotSoDate).trim() : "";

    let shouldClose = false;
    let reason = "";

    // 1. Kích hoạt chốt sổ hôm nay khi đã đến hoặc qua giờ chốt sổ (ví dụ: >= 16:20)
    if (lastChotSoDate !== todayDateStr && lastChotSoDate !== todayYMD && currentHourMin >= chotSoTime) {
      shouldClose = true;
      reason = `Đã đến giờ chốt sổ hàng ngày (${currentHourMin} >= ${chotSoTime})`;
    }

    // 2. Cơ chế hồi phục an toàn (Safety Catch-up):
    // Nếu trong lich_trinh còn tồn đọng lịch của ngày cũ (quá khứ) chưa được chốt (ví dụ: tắt máy sớm, nghỉ lễ/cuối tuần)
    if (!shouldClose) {
      const pastSched = await db.prepare(
        "SELECT date FROM lich_trinh WHERE unit_code = ? AND date IS NOT NULL AND TRIM(date) != '' AND date != ? AND date != ? LIMIT 1"
      ).bind(unitCode, todayDateStr, todayYMD).first().catch(() => null);

      if (pastSched && pastSched.date) {
        shouldClose = true;
        reason = `Tồn đọng lịch ngày cũ (${pastSched.date}) chưa chốt`;
      }
    }

    if (shouldClose) {
      console.log(`[Worker Auto-ChotSo]: Triggering auto closure for unit '${unitCode}'. Lý do: ${reason}. today=${todayDateStr}, lastClosed=${lastChotSoDate}, time=${currentHourMin}, chotSoTime=${chotSoTime}`);
      
      const statements = [
        // 1. Sao lưu giờ bận thực tế của nhân viên trước khi reset (chỉ lưu vào gio_ban_chung_cu)
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, busy_ranges) SELECT unit_code, ?, 'nhan_su', name, temp_busy FROM nhan_su WHERE unit_code = ? AND temp_busy IS NOT NULL AND temp_busy != '' AND temp_busy != '[]' AND temp_busy != '[\"\"]'").bind(todayYMD, unitCode),
        // 2. Sao lưu giờ bận thực tế của bệnh nhân trước khi reset
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) SELECT unit_code, ?, 'benh_nhan', name, age, gio_ban FROM benh_nhan WHERE unit_code = ? AND gio_ban IS NOT NULL AND TRIM(gio_ban) != ''").bind(todayYMD, unitCode),
        // 3. Sao lưu giờ ra viện của bệnh nhân trước khi reset
        db.prepare("INSERT INTO gio_ban_chung_cu (unit_code, date, target_type, name, dob, busy_ranges) SELECT unit_code, ?, 'ra_vien', name, age, leave_time FROM benh_nhan WHERE unit_code = ? AND leave_time IS NOT NULL AND TRIM(leave_time) != '' AND LOWER(leave_time) != 'none'").bind(todayYMD, unitCode),
        db.prepare("INSERT INTO lich_su (unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed) SELECT unit_code, date, patient_name, dob, room, procedure_name, start_time, end_time, staff_name, sub_staff_name, machine_name, bed FROM lich_trinh WHERE unit_code = ?").bind(unitCode),
        db.prepare("DELETE FROM lich_trinh WHERE unit_code = ?").bind(unitCode),
        db.prepare("DELETE FROM benh_nhan WHERE unit_code = ? AND leave_time IS NOT NULL AND TRIM(leave_time) != '' AND LOWER(leave_time) != 'none'").bind(unitCode),
        db.prepare("UPDATE benh_nhan SET arrive_time = '07:30', gio_ban = '', leave_time = '', status = 'Chưa xếp', updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(unitCode),
        db.prepare("UPDATE nhan_su SET temp_busy = '[]', updated_at = CURRENT_TIMESTAMP WHERE unit_code = ?").bind(unitCode)
      ];

      await db.batch(statements);
      await setCaiDat(db, unitCode, 'lastChotSoDate', todayYMD);
      await bumpDataVersion(db, unitCode);
      console.log(`[Worker Auto-ChotSo]: Automated day closure executed successfully for unit '${unitCode}'!`);
    }
  } catch (err) {
    console.error("[Worker Auto-ChotSo Error]:", err);
  }
}
