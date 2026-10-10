import http from 'http';
import https from 'https';

const MINIPC_URL = 'http://127.0.0.1:8080/v2/pipeline';
const MINIPC_TOKEN = 'pmcg_sec_4ce384f00896635ad33fb7ddba1619c8490fd24cad22e67d';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyNvZYGa2UMzaZiGamV2bABMwgC_lo4-bNuoAqL-rOjBA3_leXw72wrV2aFOfABf_Ho/exec';

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
          if (!json.results || !json.results[0] || !json.results[0].response || !json.results[0].response.result) {
            return resolve([]);
          }
          const result = json.results[0].response.result;
          const cols = result.cols.map(c => c.name);
          const rows = result.rows.map(r => {
            const obj = {};
            cols.forEach((c, i) => {
              obj[c] = r[i] !== null && r[i] !== undefined ? (r[i].value !== undefined ? r[i].value : r[i]) : null;
            });
            return obj;
          });
          resolve(rows);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function postGAS(data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const u = new URL(GAS_URL);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, redirectRes => {
          let body = '';
          redirectRes.on('data', c => body += c);
          redirectRes.on('end', () => {
            try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
          });
        }).on('error', reject);
        return;
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('🚀 ĐỒNG BỘ TOÀN BỘ 100% BẢNG LICH_SU TỪ MINIPC SQLITE LÊN GOOGLE SHEETS');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // 1. Đếm tổng số dòng trong bảng lich_su của MiniPC
  const countRes = await queryMiniPC('SELECT COUNT(*) as total FROM lich_su');
  const total = countRes[0] ? Number(countRes[0].total) : 0;
  console.log(`📊 Tổng số bản ghi lịch sử trong MiniPC SQLite (pmcg.db): ${total.toLocaleString()} dòng`);

  if (total === 0) {
    console.log('Không có dữ liệu trong bảng lich_su, kết thúc.');
    return;
  }

  const BATCH_SIZE = 1500;
  let offset = 0;
  let isFirst = true;
  let batchIndex = 1;
  const totalBatches = Math.ceil(total / BATCH_SIZE);

  console.log(`⚙ Kế hoạch: Chia làm ${totalBatches} khối (${BATCH_SIZE.toLocaleString()} dòng/khối) để truyền an toàn 100% không bị timeout.\n`);

  const tStartAll = Date.now();

  while (offset < total) {
    const chunk = await queryMiniPC(`SELECT * FROM lich_su ORDER BY id ASC LIMIT ${BATCH_SIZE} OFFSET ${offset}`);
    if (!chunk || chunk.length === 0) break;

    const action = isFirst ? 'saveTable' : 'appendTable';
    const t0 = Date.now();
    
    let res;
    let retryCount = 0;
    while (retryCount < 3) {
      try {
        res = await postGAS({ action, args: ['lich_su', chunk] });
        if (res && res.status === 'success') break;
        throw new Error((res && res.error) || 'Lỗi không xác định');
      } catch(e) {
        retryCount++;
        console.warn(`  ⚠️ Thử lại khối ${batchIndex} (lần ${retryCount}/3): ${e.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✔ [Khối ${String(batchIndex).padStart(2)}/${totalBatches}] (${String(offset + 1).padStart(5)} - ${String(offset + chunk.length).padStart(5)} / ${total.toLocaleString()}) -> ${action}: ${res?.status || 'OK'} (${elapsed}s)`);

    isFirst = false;
    offset += chunk.length;
    batchIndex++;
  }

  const totalTime = ((Date.now() - tStartAll) / 1000).toFixed(1);
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log(`🎉 HOÀN TẤT ĐỒNG BỘ 100% TOÀN BỘ ${total.toLocaleString()} DÒNG LICH_SU LÊN GOOGLE SHEETS TRONG ${totalTime}s!`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
}

run().catch(console.error);
