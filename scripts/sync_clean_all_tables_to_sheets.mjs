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
  console.log('🚀 ĐỒNG BỘ CHUẨN XÁC DỮ LIỆU TỪ MINIPC VÀO GOOGLE SHEETS & DỌN DẸP TAB RÁC');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // 1. Dọn sạch các sheet alias thừa
  const redundantAliasSheets = [
    'pat', 'staff', 'machines', 'rooms', 'procedures', 'protocols', 'schedule', 'history'
  ];
  console.log('--- 1. Xóa nội dung các tab alias dư thừa ---');
  for (const sName of redundantAliasSheets) {
    try {
      const res = await postGAS({ action: 'saveTable', args: [sName, []] });
      console.log(`- Đã xóa sạch nội dung tab alias thừa [${sName}]: ${res.status}`);
    } catch(e) {
      console.log(`- Bỏ qua [${sName}]: ${e.message}`);
    }
  }

  // 2. Danh sách các bảng nghiệp vụ chính cần đẩy vào Google Sheets
  const tables = [
    'benh_nhan',
    'nhan_su',
    'may_moc',
    'phong',
    'thu_thuat',
    'cham_cong',
    'thong_ke',
    'cai_dat',
    'gio_ban_chung_cu',
    'tim_ranh',
    'phac_do',
    'tai_lieu',
    'tai_khoan',
    'lich_su_dinh_muc',
    'tenants',
    'lich_trinh'
  ];

  console.log('\n--- 2. Đẩy dữ liệu chuẩn từ MiniPC vào các bảng chính trên Google Sheets ---');
  for (const t of tables) {
    const rows = await queryMiniPC(`SELECT * FROM ${t}`);
    const t0 = Date.now();
    const res = await postGAS({ action: 'saveTable', args: [t, rows] });
    console.log(`- Bảng [${t.padEnd(20)}] (${String(rows.length).padStart(4)} dòng) -> ${res.status} (${((Date.now() - t0)/1000).toFixed(1)}s)`);

    // Đồng bộ song song cả tab PascalCase tương ứng nếu có để phục vụ các phiên bản legacy
    const pascalMap = {
      'benh_nhan': 'BenhNhan',
      'nhan_su': 'NhanSu',
      'may_moc': 'MayMoc',
      'phong': 'Phong',
      'thu_thuat': 'ThuThuat',
      'cham_cong': 'ChamCong',
      'thong_ke': 'ThongKe',
      'cai_dat': 'CaiDat',
      'gio_ban_chung_cu': 'GioBanChungCu',
      'tai_khoan': 'TaiKhoan',
      'lich_trinh': 'LichTrinh'
    };
    if (pascalMap[t]) {
      const pName = pascalMap[t];
      await postGAS({ action: 'saveTable', args: [pName, rows] });
      console.log(`  -> Đồng bộ chuẩn hóa tab [${pName.padEnd(16)}] (${String(rows.length).padStart(4)} dòng)`);
    }
  }

  // 3. Đẩy 1500 dòng mới nhất của bảng lớn lich_su
  console.log('\n--- 3. Đồng bộ 1,500 dòng mới nhất của bảng lớn [lich_su] ---');
  const histRows = await queryMiniPC('SELECT * FROM lich_su ORDER BY id DESC LIMIT 1500');
  const tHist = Date.now();
  await postGAS({ action: 'saveTable', args: ['lich_su', histRows] });
  await postGAS({ action: 'saveTable', args: ['LichSu', histRows] });
  console.log(`- Đã đồng bộ [lich_su] & [LichSu] (1,500 dòng mới nhất) trong ${((Date.now() - tHist)/1000).toFixed(1)}s`);

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 HOÀN TẤT ĐỒNG BỘ DỮ LIỆU LÊN GOOGLE SHEETS!');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
}

run().catch(console.error);
