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

async function queryTurso(sql) {
  const res = await fetch(TURSO_URL, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TURSO_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql } },
        { type: 'close' }
      ]
    })
  });
  const json = await res.json();
  return json.results?.[0]?.response?.result;
}

async function compare() {
  console.log('--- SO SÁNH BẢNG GIỮA MINIPC VÀ TURSO CLOUD ---');
  const tablesMiniRes = await queryMiniPC("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const tables = tablesMiniRes.rows.map(r => r[0].value);

  for (const t of tables) {
    try {
      const cMiniRes = await queryMiniPC(`SELECT COUNT(*) FROM "${t}"`);
      const cMini = cMiniRes.rows[0][0].value;
      let cTurso = 'ERROR';
      try {
        const cTursoRes = await queryTurso(`SELECT COUNT(*) FROM "${t}"`);
        cTurso = cTursoRes ? cTursoRes.rows[0][0].value : 'null';
      } catch (eTurso) {
        cTurso = eTurso.message;
      }
      console.log(`Bảng: ${t.padEnd(25)} | MiniPC: ${String(cMini).padStart(6)} | Turso Cloud: ${String(cTurso).padStart(6)} | Diff: ${cMini != cTurso ? '⚠️ LỆCH' : '✅'}`);
    } catch (e) {
      console.log(`Bảng: ${t.padEnd(25)} | Error: ${e.message}`);
    }
  }
}

compare();
