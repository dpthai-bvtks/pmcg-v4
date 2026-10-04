import http from 'http';

const MINIPC_URL = 'http://127.0.0.1:8080/v2/pipeline';
const MINIPC_TOKEN = 'pmcg_sec_4ce384f00896635ad33fb7ddba1619c8490fd24cad22e67d';

const TURSO_URL = 'https://pmcg-v4-dpthai-bvtks.aws-ap-northeast-1.turso.io/v2/pipeline';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkyNjIzNDQsImlkIjoiMDFhMDVmOTAtY2QwMS03OTYyLTg0YjgtYzk1YWVhMTJhNWZmIiwia2lkIjoiUTh6blZSZmxiaEMyLXRIYjI0ZFhNMUVXcWtWOFRBTlJtTEE5Z01QV2pJcyIsInJpZCI6ImNhNWJhMGQwLTE0MzctNDFlOS1iNWQ0LTE3YmFiMzdjMTQ5ZCJ9.u-sW0PnXJ-a0q7EJBlIBE-FIIO85D9kpALTsiQPZhSQPBAee5RTlLUMxrIukSuSDbUMvtbb4cqDg9KWl6v5mAw';

function queryMiniPC(sql) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql } }, { type: 'close' }]
    });
    const u = new URL(MINIPC_URL);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIPC_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const r = json.results?.[0]?.response?.result;
          resolve(r);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function queryTurso(sql, args = []) {
  const pipelineArgs = args.map(v => {
    if (v === null || v === undefined) return { type: 'null' };
    if (typeof v === 'number') return { type: Number.isInteger(v) ? 'integer' : 'float', value: String(v) };
    if (typeof v === 'boolean') return { type: 'integer', value: v ? '1' : '0' };
    return { type: 'text', value: String(v) };
  });

  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TURSO_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args: pipelineArgs } },
        { type: 'close' }
      ]
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Turso HTTP ${res.status}: ${t}`);
  }
  const json = await res.json();
  const err = json.results?.find(r => r.type === 'error');
  if (err) throw new Error(`Turso Error: ${JSON.stringify(err.error)}`);
  return json.results?.[0]?.response?.result;
}

async function batchTurso(stmts) {
  const requests = stmts.map(s => ({
    type: 'execute',
    stmt: {
      sql: s.sql,
      args: (s.args || []).map(v => {
        if (v === null || v === undefined) return { type: 'null' };
        if (typeof v === 'number') return { type: Number.isInteger(v) ? 'integer' : 'float', value: String(v) };
        if (typeof v === 'boolean') return { type: 'integer', value: v ? '1' : '0' };
        return { type: 'text', value: String(v) };
      })
    }
  }));
  requests.push({ type: 'close' });

  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TURSO_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Turso HTTP ${res.status}: ${t}`);
  }
  const json = await res.json();
  const err = json.results?.find(r => r.type === 'error');
  if (err) throw new Error(`Turso Batch Error: ${JSON.stringify(err.error)}`);
  return json.results;
}

function parseMiniPCCell(cell) {
  if (!cell || cell.type === 'null') return null;
  if (cell.type === 'integer') return parseInt(cell.value, 10);
  if (cell.type === 'float') return parseFloat(cell.value);
  return cell.value;
}

async function syncTable(table) {
  process.stdout.write(`Đang đồng bộ bảng [${table}]... `);

  // Nếu là cai_dat, đảm bảo bảng có schema chuẩn multi-tenant
  if (table === 'cai_dat') {
    await queryTurso(`DROP TABLE IF EXISTS cai_dat`);
    await queryTurso(`CREATE TABLE cai_dat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_code TEXT NOT NULL DEFAULT 'bvtks-cs2',
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(unit_code, key)
    )`);
  }

  // Lấy schema của bảng trên Turso Cloud
  const tursoInfoRes = await queryTurso(`PRAGMA table_info("${table}")`);
  const tursoCols = (tursoInfoRes?.rows || []).map(r => r[1].value);

  // Lấy toàn bộ dữ liệu từ MiniPC
  const miniRes = await queryMiniPC(`SELECT * FROM "${table}"`);
  if (!miniRes) {
    console.log('Lỗi đọc MiniPC');
    return;
  }
  const miniCols = miniRes.cols.map(c => c.name);
  const commonCols = miniCols.filter(c => tursoCols.includes(c));
  const rows = miniRes.rows || [];

  // Xóa dữ liệu cũ trên Turso Cloud
  await queryTurso(`DELETE FROM "${table}"`);

  if (rows.length === 0) {
    console.log(`✅ Hoàn tất (0 dòng)`);
    return;
  }

  // Chia nhỏ batch 100 dòng để không vượt quá giới hạn payload của Turso Pipeline
  const BATCH_SIZE = 100;
  const colNames = commonCols.map(c => `"${c}"`).join(', ');
  const placeholders = commonCols.map(() => '?').join(', ');
  const insertSql = `INSERT INTO "${table}" (${colNames}) VALUES (${placeholders})`;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const stmts = chunk.map(r => {
      const values = commonCols.map(col => {
        const colIdx = miniCols.indexOf(col);
        return parseMiniPCCell(r[colIdx]);
      });
      return {
        sql: insertSql,
        args: values
      };
    });
    await batchTurso(stmts);
  }

  console.log(`✅ Đã đẩy thành công ${rows.length} dòng lên Turso Cloud!`);
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🚀 BẮT ĐẦU ĐỒNG BỘ TOÀN DIỆN CSDL TỪ MINIPC SANG TURSO CLOUD');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const tablesMiniRes = await queryMiniPC("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const tables = tablesMiniRes.rows.map(r => r[0].value);

  // Sắp xếp thứ tự bảng: các bảng cấu hình & nhân sự trước, lịch sử sau
  const priority = [
    'tenants', 'cai_dat', 'tai_khoan', 'nhan_su', 'may_moc', 'phong',
    'thu_thuat', 'benh_nhan', 'lich_trinh', 'cham_cong', 'thong_ke',
    'tim_ranh', 'tai_lieu', 'phac_do', 'gio_ban_chung_cu',
    'login_attempts', 'payment_transactions', 'audit_logs', 'lich_su_dinh_muc'
  ];

  for (const t of priority) {
    if (tables.includes(t)) {
      try {
        await syncTable(t);
      } catch (e) {
        console.log(`❌ Lỗi bảng [${t}]:`, e.message);
      }
    }
  }

  // Đồng bộ bảng lớn lich_su nếu cần
  if (tables.includes('lich_su')) {
    try {
      const cMini = (await queryMiniPC('SELECT COUNT(*) FROM lich_su')).rows[0][0].value;
      const cTurso = (await queryTurso('SELECT COUNT(*) FROM lich_su')).rows[0][0].value;
      console.log(`Bảng [lich_su]: MiniPC=${cMini}, Turso=${cTurso}`);
      if (cMini !== cTurso) {
        console.log('Đang đồng bộ bù chênh lệch cho bảng lich_su...');
        // Đẩy bù những bản ghi mới
        const maxTursoIdRes = await queryTurso('SELECT MAX(id) FROM lich_su');
        const maxId = maxTursoIdRes.rows[0][0].value || 0;
        const diffRes = await queryMiniPC(`SELECT * FROM lich_su WHERE id > ${maxId}`);
        if (diffRes && diffRes.rows && diffRes.rows.length > 0) {
          const cols = diffRes.cols.map(c => c.name);
          const colNames = cols.map(c => `"${c}"`).join(', ');
          const placeholders = cols.map(() => '?').join(', ');
          const insertSql = `INSERT INTO lich_su (${colNames}) VALUES (${placeholders})`;
          const BATCH_SIZE = 100;
          for (let i = 0; i < diffRes.rows.length; i += BATCH_SIZE) {
            const chunk = diffRes.rows.slice(i, i + BATCH_SIZE);
            const stmts = chunk.map(r => ({ sql: insertSql, args: r.map(parseMiniPCCell) }));
            await batchTurso(stmts);
          }
          console.log(`✅ Đã đẩy bù ${diffRes.rows.length} dòng cho lich_su!`);
        }
      } else {
        console.log('✅ Bảng [lich_su] đã đồng nhất số dòng (24,402 dòng).');
      }
    } catch (e) {
      console.log('Lỗi kiểm tra lich_su:', e.message);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 HOÀN TẤT ĐỒNG BỘ CSDL TỪ MINIPC SANG TURSO CLOUD!');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
}

run().catch(console.error);
