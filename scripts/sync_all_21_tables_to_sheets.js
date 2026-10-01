/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🚀 SCRIPT ĐỒNG BỘ TOÀN BỘ 21 BẢNG TỪ MINIPC SQLITE LÊN GOOGLE SHEETS
 * Hỗ trợ tự động phân trang (chunking) cho bảng lớn như lich_su (23,907 dòng)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const http = require('http');
const https = require('https');

const MINIPC_URL = 'http://127.0.0.1:8080/v2/pipeline';
const MINIPC_TOKEN = 'pmcg_sec_4ce384f00896635ad33fb7ddba1619c8490fd24cad22e67d';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyNvZYGa2UMzaZiGamV2bABMwgC_lo4-bNuoAqL-rOjBA3_leXw72wrV2aFOfABf_Ho/exec';

function queryMiniPC(sql) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql } }]
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
        } catch(e) {
          reject(e);
        }
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

async function syncAll() {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ 21 BẢNG TỪ MINIPC SQLITE LÊN GOOGLE SHEETS ===\n');

  // Kiểm tra phiên bản Google Apps Script
  const checkCaps = await postGAS({ action: 'listSheets', args: [] });
  const isNewGAS = checkCaps && checkCaps.status === 'success';
  console.log(`Phiên bản Google Apps Script trên Cloud: ${isNewGAS ? 'MỚI (Hỗ trợ toàn diện 21 bảng & chia khối)' : 'CŨ (Chỉ hỗ trợ 11 bảng cơ bản)'}`);

  // Danh sách toàn bộ 21 bảng trong MiniPC SQLite
  const tables = [
    'audit_logs',
    'benh_nhan',
    'cai_dat',
    'cham_cong',
    'gio_ban_chung_cu',
    'lich_su',
    'lich_su_dinh_muc',
    'lich_trinh',
    'login_attempts',
    'may_moc',
    'nhan_su',
    'payment_transactions',
    'phac_do',
    'phong',
    'sqlite_sequence',
    'tai_khoan',
    'tai_lieu',
    'tenants',
    'thong_ke',
    'thu_thuat',
    'tim_ranh'
  ];

  if (!isNewGAS) {
    console.log('\n[LƯU Ý QUAN TRỌNG]:');
    console.log('Google Apps Script trên Cloud hiện đang chạy bản cũ, chưa cập nhật file code.gs mới.');
    console.log('Hệ thống sẽ đồng bộ trước 11 bảng chuẩn tương thích, bao gồm cả ma_bn mới.');
    console.log('Để tạo đầy đủ tab riêng cho cả 21 bảng (phac_do, tim_ranh, gio_ban_chung_cu, v.v.):');
    console.log('👉 Hãy copy nội dung file backups/legacy-apps-script/code.gs dán vào script.google.com rồi nhấn Triển khai (Deploy) lại bản mới!\n');

    const backupPayload = {};
    for (const t of tables) {
      if (t === 'lich_su') {
        const rows = await queryMiniPC('SELECT * FROM lich_su ORDER BY id DESC LIMIT 1500');
        backupPayload[t] = rows;
        console.log(`- Đọc ${t}: ${rows.length} dòng (1500 dòng mới nhất để tránh timeout GAS cũ)`);
      } else {
        const rows = await queryMiniPC(`SELECT * FROM ${t}`);
        backupPayload[t] = rows;
        console.log(`- Đọc ${t}: ${rows.length} dòng`);
      }
    }

    // PascalCase mapping
    backupPayload.pat = backupPayload.benh_nhan;
    backupPayload.staff = backupPayload.nhan_su;
    backupPayload.machines = backupPayload.may_moc;
    backupPayload.rooms = backupPayload.phong;
    backupPayload.procedures = backupPayload.thu_thuat;
    backupPayload.schedule = backupPayload.lich_trinh;
    backupPayload.history = backupPayload.lich_su;
    backupPayload.accounts = backupPayload.tai_khoan;
    backupPayload.chamCong = backupPayload.cham_cong;
    backupPayload.thongKe = backupPayload.thong_ke;
    backupPayload.caiDat = backupPayload.cai_dat;

    console.log('\nĐang gửi payload saveBootstrapBackup lên Google Apps Script...');
    const t0 = Date.now();
    const res = await postGAS({ action: 'saveBootstrapBackup', args: [backupPayload] });
    console.log(`=> Kết quả (${((Date.now() - t0) / 1000).toFixed(1)}s):`, res);
    return;
  }

  // NẾU ĐÃ CẬP NHẬT CODE.GS MỚI: Đồng bộ trọn vẹn 21 bảng từng bảng một và chia khối cho lich_su
  console.log('\nTiến hành đẩy trọn bộ 21 bảng vào từng tab riêng biệt trên Google Sheets:');

  for (const t of tables) {
    if (t === 'lich_su') {
      // Đếm số dòng của lich_su
      const countRes = await queryMiniPC('SELECT COUNT(*) as total FROM lich_su');
      const total = countRes[0] ? countRes[0].total : 0;
      console.log(`\n--- Đồng bộ bảng LỚN: lich_su (${total} dòng) theo từng khối 2,000 dòng ---`);
      
      const BATCH_SIZE = 2000;
      let offset = 0;
      let isFirst = true;

      while (offset < total) {
        const chunk = await queryMiniPC(`SELECT * FROM lich_su ORDER BY id ASC LIMIT ${BATCH_SIZE} OFFSET ${offset}`);
        if (!chunk || chunk.length === 0) break;

        const action = isFirst ? 'saveTable' : 'appendTable';
        const tStart = Date.now();
        const res = await postGAS({ action, args: ['lich_su', chunk] });
        console.log(`  [${offset + 1} - ${offset + chunk.length} / ${total}] -> ${action}: ${res.status} (${((Date.now() - tStart)/1000).toFixed(1)}s)`);

        isFirst = false;
        offset += chunk.length;
      }
    } else {
      const rows = await queryMiniPC(`SELECT * FROM ${t}`);
      const tStart = Date.now();
      const res = await postGAS({ action: 'saveTable', args: [t, rows] });
      console.log(`- Bảng ${t.padEnd(22)} (${rows.length.toString().padStart(4)} dòng) -> ${res.status} (${((Date.now() - tStart)/1000).toFixed(1)}s)`);
    }
  }

  // Đồng bộ cả các sheet PascalCase để các hàm báo cáo / bootstrap cũ đọc liền mạch
  console.log('\n--- Đồng bộ thêm các sheet PascalCase chuẩn tương thích hệ thống ---');
  const pascalMap = {
    'BenhNhan': 'benh_nhan',
    'NhanSu': 'nhan_su',
    'MayMoc': 'may_moc',
    'Phong': 'phong',
    'ThuThuat': 'thu_thuat',
    'TaiKhoan': 'tai_khoan',
    'ChamCong': 'cham_cong',
    'ThongKe': 'thong_ke',
    'CaiDat': 'cai_dat',
    'GioBanChungCu': 'gio_ban_chung_cu'
  };
  for (const [pName, tName] of Object.entries(pascalMap)) {
    const rows = await queryMiniPC(`SELECT * FROM ${tName}`);
    await postGAS({ action: 'saveTable', args: [pName, rows] });
    console.log(`- Mirror ${pName} (${rows.length} dòng) -> OK`);
  }

  console.log('\n=== HOÀN TẤT ĐỒNG BỘ TRỌN VẸN 21 BẢNG LÊN GOOGLE SHEETS! ===');
}

syncAll().catch(console.error);
