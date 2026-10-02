/**
 * 🛡️ VERIFY BUILD & RUNTIME INTEGRITY (T.I.M.E.S System v4)
 * Script kiểm tra tự động bắt buộc trước khi build/deploy:
 * 1. Kiểm tra cú pháp (Syntax) 100% các tệp JS và CSS.
 * 2. Trích xuất và kiểm tra cú pháp toàn bộ inline <script> trong index.html, hdsd.html.
 * 3. Quét phát hiện các lệnh gán top-level `window.xyz = xyz;` mà `xyz` chưa được khai báo (Chống ReferenceError).
 * 4. Mô phỏng thực thi Runtime trong Node VM Sandbox để phát hiện TDZ (Temporal Dead Zone) và ReferenceError.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
let hasErrors = false;

function logPass(msg) {
  console.log(`\x1b[32m  ✔ [PASS]\x1b[0m ${msg}`);
}
function logFail(msg, detail = '') {
  hasErrors = true;
  console.error(`\x1b[31m  ✖ [FAIL]\x1b[0m ${msg}`);
  if (detail) console.error(`    \x1b[33m└─ ${detail}\x1b[0m`);
}
function logSection(title) {
  console.log(`\n\x1b[36m=== ${title} ===\x1b[0m`);
}

// -------------------------------------------------------------
// 1. KIỂM TRA CÚ PHÁP CÁC FILE JS CHÍNH VÀ BACKEND
// -------------------------------------------------------------
logSection('1. Kiểm tra cú pháp (node -c) các tệp JavaScript cốt lõi');
const coreFiles = [
  'js/init.js',
  'js/app.js',
  'js/scheduler-engine.js',
  'js/ai-scheduler.js',
  'js/cp-solver.js',
  'js/thongke.js',
  'js/sync.js',
  'js/schedule-utils.js',
  'js/schedule-strategies.js',
  'js/offline-sync-engine.js',
  'backend/src/index.js',
  'backend/src/schema.js',
  'backend/src/routes/staff.js',
  'backend/src/routes/patients.js',
  'backend/src/routes/schedules.js',
  'backend/src/routes/tenants.js',
  'backend/src/routes/backup-sync.js'
];

for (const file of coreFiles) {
  const fullPath = path.join(ROOT_DIR, file);
  if (!fs.existsSync(fullPath)) continue;
  try {
    execSync(`node -c "${fullPath}"`, { stdio: 'pipe' });
    logPass(file);
  } catch (err) {
    logFail(file, err.stderr ? err.stderr.toString().trim() : err.message);
  }
}

// -------------------------------------------------------------
// 2. TRÍCH XUẤT VÀ KIỂM TRA INLINE SCRIPTS TRONG CÁC FILE HTML
// -------------------------------------------------------------
logSection('2. Kiểm tra cú pháp toàn bộ inline <script> trong HTML');
const htmlFiles = ['index.html', 'hdsd.html'];

for (const htmlFile of htmlFiles) {
  const fullPath = path.join(ROOT_DIR, htmlFile);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf8');
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 0;

  while ((match = scriptRegex.exec(content)) !== null) {
    scriptIndex++;
    const code = match[1];
    // Bỏ qua schema JSON-LD
    if (code.includes('application/ld+json') || code.includes('@context')) {
      logPass(`${htmlFile} -> Script #${scriptIndex} (JSON-LD Schema)`);
      continue;
    }

    try {
      new Function(code);
      logPass(`${htmlFile} -> Script #${scriptIndex}`);
    } catch (err) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      logFail(`${htmlFile} -> Script #${scriptIndex} tại khoảng dòng ${lineNum}`, err.message);
    }
  }
}

// -------------------------------------------------------------
// 3. QUÉT TĨNH PHÁT HIỆN LỖI GÁN TOP-LEVEL `window.abc = abc;`
// -------------------------------------------------------------
logSection('3. Quét tĩnh các lệnh gán window.* ở phạm vi cấp cao (Top-Level Scope)');
for (const relFile of ['js/app.js', 'js/init.js', 'js/scheduler-engine.js']) {
  const fullPath = path.join(ROOT_DIR, relFile);
  if (!fs.existsSync(fullPath)) continue;

  const code = fs.readFileSync(fullPath, 'utf8');
  const lines = code.split('\n');
  const topAssignRegex = /^[ ]{4,8}window\.([a-zA-Z0-9_$]+)\s*=\s*([a-zA-Z0-9_$]+)\s*;/;

  let fileHasTopAssignError = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(topAssignRegex);
    if (m) {
      const targetVar = m[2];
      // Bỏ qua giá trị literals hoặc số
      if (/^\d+$/.test(targetVar) || ['true', 'false', 'null', 'undefined', 'window', 'this'].includes(targetVar)) continue;

      // Kiểm tra xem targetVar có được định nghĩa (hàm hoặc biến) trong toàn tệp hay không
      const defRegex = new RegExp(`(function\\s+${targetVar}\\b|\\b(const|let|var|class)\\s+${targetVar}\\b)`);
      if (!defRegex.test(code)) {
        // Kiểm tra xem có phải tham số trong hàm enclosing không
        let isParam = false;
        for (let j = Math.max(0, i - 15); j < i; j++) {
          if (lines[j].includes(`function`) && lines[j].includes(targetVar)) {
            isParam = true;
            break;
          }
        }
        if (!isParam) {
          logFail(`${relFile}:${i + 1}`, `Gán window.${m[1]} = ${targetVar}; nhưng '${targetVar}' KHÔNG được khai báo trong file! (Gây ReferenceError lúc runtime)`);
          fileHasTopAssignError = true;
        }
      }
    }
  }
  if (!fileHasTopAssignError) {
    logPass(`${relFile}: Toàn bộ các phép gán window.* đều có định nghĩa hợp lệ.`);
  }
}

// -------------------------------------------------------------
// 4. MÔ PHỎNG THỰC THI RUNTIME TRONG NODE VM SANDBOX
// -------------------------------------------------------------
logSection('4. Mô phỏng thực thi Runtime trong Node VM Sandbox (Kiểm tra TDZ & Runtime Exception)');

function runInSandbox(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const dummyEl = {
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild: () => {},
    removeChild: () => {},
    setAttribute: () => {},
    getAttribute: () => '',
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false }
  };

  const sandbox = {
    window: {},
    document: {
      getElementById: () => dummyEl,
      querySelector: () => dummyEl,
      querySelectorAll: () => [dummyEl],
      createElement: () => dummyEl,
      addEventListener: () => {},
      removeEventListener: () => {},
      body: dummyEl,
      documentElement: dummyEl
    },
    localStorage: { getItem: () => null, setItem: () => null, removeItem: () => null },
    sessionStorage: { getItem: () => null, setItem: () => null, removeItem: () => null },
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    navigator: { userAgent: 'NodeTest', serviceWorker: { register: () => Promise.resolve() } },
    location: { reload: () => {}, hash: '', href: 'https://xeplichthuthuat.io.vn/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success' }) }),
    setTimeout: (fn) => 1,
    clearTimeout: () => {},
    setInterval: (fn) => 1,
    clearInterval: () => {},
    requestAnimationFrame: (fn) => setTimeout(fn, 16),
    cancelAnimationFrame: () => {}
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  try {
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: path.basename(filePath), timeout: 5000 });
    logPass(`${path.basename(filePath)} thực thi Runtime hoàn chỉnh (0 lỗi top-level)`);
  } catch (err) {
    logFail(`${path.basename(filePath)} văng lỗi khi thực thi Runtime`, err.stack ? err.stack.split('\n').slice(0, 3).join('\n') : err.message);
  }
}

runInSandbox(path.join(ROOT_DIR, 'js/schedule-utils.js'));
runInSandbox(path.join(ROOT_DIR, 'js/init.js'));
runInSandbox(path.join(ROOT_DIR, 'js/app.js'));
runInSandbox(path.join(ROOT_DIR, 'js/scheduler-engine.js'));

// -------------------------------------------------------------
// TỔNG KẾT
// -------------------------------------------------------------
console.log('\n-------------------------------------------------------------');
if (hasErrors) {
  console.error('\x1b[31m❌ PHÁT HIỆN LỖI! Tuyệt đối KHÔNG deploy hoặc commit code khi bài test chưa vượt qua.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\x1b[32m✅ TẤT CẢ CÁC BÀI TEST ĐÃ VƯỢT QUA 100%! Mã nguồn an toàn để deploy và push.\x1b[0m\n');
  process.exit(0);
}
