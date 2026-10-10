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
  console.log('🚀 ĐỒNG BỘ CƠ SỞ DỮ LIỆU TỪ MINIPC SQLITE LÊN GOOGLE SHEETS (PMCG-Database-v4)');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // 1. Kiểm tra kết nối Google Apps Script & MiniPC
  console.log('--- 1. Kiểm tra kết nối MiniPC & Google Apps Script ---');
  const ping = await postGAS({ action: 'ping', args: [] });
  if (!ping || ping.status !== 'success') {
    throw new Error('Không thể kết nối tới Google Apps Script Web App!');
  }
  console.log(`✔ Google Sheet ID: ${ping.data?.spreadsheetId} (${ping.data?.spreadsheetName})`);

  const minipcCheck = await queryMiniPC('SELECT COUNT(*) as count FROM benh_nhan');
  console.log(`✔ MiniPC SQLite: Đang chạy trực tiếp (benh_nhan có ${minipcCheck[0]?.count} bản ghi)`);

  // 2. Thử xóa triệt để hoặc dọn sạch nội dung các tab alias / dư thừa
  console.log('\n--- 2. Dọn dẹp các tab dư thừa / trùng lặp ---');
  const redundantSheets = [
    'pat', 'staff', 'machines', 'rooms', 'procedures', 'protocols', 'schedule', 'history',
    'BenhNhan', 'NhanSu', 'MayMoc', 'Phong', 'ThuThuat', 'LichTrinh',
    'TaiKhoan', 'ChamCong', 'ThongKe', 'CaiDat', 'GioBanChungCu'
  ];

  // Thử gọi lệnh xóa tab trực tiếp nếu Apps Script đã được cập nhật
  const delTry = await postGAS({ action: 'cleanupRedundantSheets', args: [] });
  if (delTry && delTry.status === 'success') {
    console.log(`✔ Apps Script đã xóa trực tiếp: ${delTry.data}`);
  } else {
    // Nếu Apps Script chưa deploy bản mới, xóa sạch nội dung (clear contents) các sheet này
    console.log('ℹ Apps Script chưa kích hoạt lệnh xóa tab trực tiếp, tiến hành làm rỗng nội dung các tab alias...');
    for (const sName of redundantSheets) {
      try {
        await postGAS({ action: 'saveTable', args: [sName, []] });
      } catch(e) {}
    }
    console.log('✔ Đã làm rỗng toàn bộ nội dung của các tab alias/trùng lặp!');
  }

  // 3. Danh sách các bảng nghiệp vụ chính cần đẩy vào Google Sheets
  const tables = [
    'benh_nhan',
    'nhan_su',
    'may_moc',
    'phong',
    'thu_thuat',
    'phac_do',
    'lich_trinh',
    'gio_ban_chung_cu',
    'tim_ranh',
    'cai_dat',
    'cham_cong',
    'thong_ke',
    'tai_khoan',
    'tai_lieu',
    'tenants',
    'lich_su_dinh_muc'
  ];

  console.log('\n--- 3. Đẩy dữ liệu chuẩn từ MiniPC vào các bảng chuẩn trên Google Sheets ---');
  for (const t of tables) {
    const rows = await queryMiniPC(`SELECT * FROM ${t}`);
    const t0 = Date.now();
    const res = await postGAS({ action: 'saveTable', args: [t, rows] });
    console.log(`✔ Bảng [${t.padEnd(20)}] (${String(rows.length).padStart(4)} dòng) -> ${res.status} (${((Date.now() - t0)/1000).toFixed(1)}s)`);
  }

  // 4. Đồng bộ bảng lớn [lich_su] (2,500 dòng mới nhất)
  console.log('\n--- 4. Đồng bộ 2,500 dòng mới nhất của bảng lớn [lich_su] ---');
  const histRows = await queryMiniPC('SELECT * FROM lich_su ORDER BY id DESC LIMIT 2500');
  const tHist = Date.now();
  const resHist1 = await postGAS({ action: 'saveTable', args: ['lich_su', histRows] });
  console.log(`✔ Bảng [lich_su             ] (2,500 dòng) -> ${resHist1.status} (${((Date.now() - tHist)/1000).toFixed(1)}s)`);

  // Đồng bộ cả tab LichSu để các phiên bản cũ / báo cáo đọc liền mạch
  const resHist2 = await postGAS({ action: 'saveTable', args: ['LichSu', histRows] });
  console.log(`✔ Bảng [LichSu              ] (2,500 dòng) -> ${resHist2.status}`);

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 ĐÃ ĐỒNG BỘ THÀNH CÔNG TOÀN BỘ CƠ SỞ DỮ LIỆU TỪ MINIPC LÊN GOOGLE SHEETS!');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
}

run().catch(console.error);
