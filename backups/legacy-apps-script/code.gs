/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🌐 GOOGLE APPS SCRIPT BACKUP SERVER - PM-XEPLICH V4 (MULTI-TENANT SAAS)
 * Máy chủ sao lưu & dự phòng 100% tự động khi MiniPC tắt máy hoặc Turso hết Quota.
 * Đóng vai trò làm Mirror API đọc/ghi vào Google Sheets.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var callback = params.callback;
    var action = params.action || 'ping';
    var args = [];
    if (params.args) {
      try { args = JSON.parse(params.args); } catch(err) { args = [params.args]; }
    } else if (params.date) {
      args = [params.date];
    } else if (params.targetDate) {
      args = [params.targetDate];
    }

    var result = handleApiRequest(action, args);
    var jsonString = JSON.stringify(result);

    if (callback) {
      return ContentService.createTextOutput(callback + '(' + jsonString + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try { postData = JSON.parse(e.postData.contents); } catch(err) {}
    }
    var action = postData.action || (e && e.parameter ? e.parameter.action : '') || 'ping';
    var args = postData.args || [];
    if ((!args || !args.length) && e && e.parameter && e.parameter.args) {
      try { args = JSON.parse(e.parameter.args); } catch(err) {}
    }
    if ((!args || !args.length) && (postData.date || (e && e.parameter && e.parameter.date))) {
      args = [postData.date || (e && e.parameter && e.parameter.date)];
    }

    var result = handleApiRequest(action, args);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSpreadsheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch(e) {}
  
  // Trường hợp script chạy dạng Standalone (không gắn trực tiếp vào file Sheet)
  try {
    var files = DriveApp.getFilesByName('PMCG_Database_Backup');
    if (files.hasNext()) {
      return SpreadsheetApp.open(files.next());
    }
    return SpreadsheetApp.create('PMCG_Database_Backup');
  } catch(eDrive) {
    return null;
  }
}

function handleApiRequest(action, args) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { status: 'error', error: 'Không thể kết nối Google Spreadsheet' };

    switch (action) {
      case 'ping':
      case 'healthCheck':
        return {
          status: 'success',
          data: {
            mode: 'backup_google_sheets',
            server: 'PMCG Google Apps Script Mirror Server',
            spreadsheetId: ss.getId(),
            spreadsheetName: ss.getName(),
            timestamp: new Date().toISOString()
          }
        };

      case 'getBootstrapData':
        var targetDate = args && args[0] ? args[0] : '';
        return {
          status: 'success',
          data: getBootstrapDataFromSheets(ss, targetDate)
        };

      case 'getHistoryFullData':
        var histDate = args && args[0] ? args[0] : '';
        return {
          status: 'success',
          data: getHistoryFullDataFromSheets(ss, histDate)
        };

      case 'getLichSu':
      case 'getAllHistory':
        return {
          status: 'success',
          data: readSheetData(ss, 'LichSu')
        };

      case 'getGioBanChungCu':
        return {
          status: 'success',
          data: readSheetData(ss, 'GioBanChungCu')
        };

      case 'getBusyHistoryDates':
        return {
          status: 'success',
          data: getBusyHistoryDatesFromSheets(ss)
        };

      case 'getBenhNhan':
        return { status: 'success', data: readSheetData(ss, 'BenhNhan') };

      case 'getNhanSu':
        return { status: 'success', data: readSheetData(ss, 'NhanSu') };

      case 'getMayMoc':
        return { status: 'success', data: readSheetData(ss, 'MayMoc') };

      case 'getPhong':
        return { status: 'success', data: readSheetData(ss, 'Phong') };

      case 'getThuThuat':
        return { status: 'success', data: readSheetData(ss, 'ThuThuat') };

      case 'getSchedule':
      case 'getLichTrinh':
        var dateArg = args && args[0] ? args[0] : '';
        return {
          status: 'success',
          data: readScheduleFromSheet(ss, dateArg)
        };

      case 'saveSchedule':
      case 'saveLichTrinh':
        var dateVal = args && args[0] ? args[0] : '';
        var schedRows = args && args[1] ? args[1] : [];
        saveScheduleToSheet(ss, dateVal, schedRows);
        return {
          status: 'success',
          data: 'Đã lưu lịch dự phòng vào Google Sheets thành công!'
        };

      case 'saveBootstrapBackup':
        saveAllBootstrapToSheets(ss, args && args[0] ? args[0] : {});
        return {
          status: 'success',
          data: 'Đã sao lưu trọn bộ toàn bộ hệ thống sang Google Sheets thành công!'
        };

      case 'bulkUpdatePatients':
        var patList = args && args[0] ? args[0] : [];
        if (Array.isArray(patList) && patList.length > 0) {
          writeListToSheet(ss, 'BenhNhan', patList);
        }
        return { status: 'success', data: 'Đã lưu danh sách bệnh nhân vào Google Sheets!' };

      case 'addBenhNhan':
      case 'editBenhNhan':
        var curPats = readSheetData(ss, 'BenhNhan');
        var pData = args && args[0] ? (typeof args[0] === 'object' ? args[0] : {
          ten: args[0], namSinh: args[1], ngayVao: args[2], gioVao: args[3],
          gioBan: args[4], gioRa: args[5], phong: args[6], thuThuat: args[7],
          loai_bn: args[8], buoi_dieu_tri: args[9], maBN: args[10]
        }) : {};
        if (pData.ten) {
          var found = false;
          for (var pi = 0; pi < curPats.length; pi++) {
            var cp = curPats[pi];
            if (cp.ten === pData.ten && String(cp.namSinh || cp.age || '') === String(pData.namSinh || pData.age || '')) {
              if (!pData.maBN || !cp.maBN || cp.maBN === pData.maBN) {
                curPats[pi] = Object.assign(cp, pData);
                found = true;
                break;
              }
            }
          }
          if (!found) curPats.push(pData);
          writeListToSheet(ss, 'BenhNhan', curPats);
        }
        return { status: 'success', data: 'Đã cập nhật bệnh nhân vào Google Sheets!' };

      case 'loadAccounts':
        return { status: 'success', data: readSheetData(ss, 'TaiKhoan') };

      case 'saveTable':
      case 'syncTable':
        var tblName = args && args[0] ? args[0] : '';
        var tblRows = args && args[1] ? args[1] : [];
        if (tblName && Array.isArray(tblRows)) {
          writeListToSheet(ss, tblName, tblRows);
        }
        return { status: 'success', data: 'Đã lưu ' + tblRows.length + ' dòng vào sheet ' + tblName };

      case 'appendTable':
        var apTblName = args && args[0] ? args[0] : '';
        var apTblRows = args && args[1] ? args[1] : [];
        if (apTblName && Array.isArray(apTblRows)) {
          appendListToSheet(ss, apTblName, apTblRows);
        }
        return { status: 'success', data: 'Đã bổ sung ' + apTblRows.length + ' dòng vào sheet ' + apTblName };

      case 'listSheets':
        var sheets = ss.getSheets();
        var sheetNames = [];
        for (var s = 0; s < sheets.length; s++) {
          sheetNames.push({ name: sheets[s].getName(), rows: sheets[s].getLastRow() });
        }
        return { status: 'success', data: sheetNames };

      case 'deleteSheet':
      case 'deleteSheets':
        var targetSheets = args && args[0] ? (Array.isArray(args[0]) ? args[0] : [args[0]]) : [];
        var deleted = [];
        var allS = ss.getSheets();
        for (var sIdx = 0; sIdx < targetSheets.length; sIdx++) {
          var sName = targetSheets[sIdx];
          var sh = ss.getSheetByName(sName);
          if (sh && allS.length > 1) {
            ss.deleteSheet(sh);
            deleted.push(sName);
            allS = ss.getSheets();
          }
        }
        return { status: 'success', data: { deleted: deleted } };

      case 'cleanupRedundantSheets':
        var aliasList = ['pat', 'staff', 'machines', 'rooms', 'procedures', 'protocols', 'schedule', 'history'];
        var cleaned = [];
        var curSheets = ss.getSheets();
        for (var aIdx = 0; aIdx < aliasList.length; aIdx++) {
          var aName = aliasList[aIdx];
          var ash = ss.getSheetByName(aName);
          if (ash && curSheets.length > 1) {
            ss.deleteSheet(ash);
            cleaned.push(aName);
            curSheets = ss.getSheets();
          }
        }
        return { status: 'success', data: { cleaned: cleaned } };

      default:
        return { status: 'error', error: 'Action không hỗ trợ: ' + action };
    }
  } catch (err) {
    return { status: 'error', error: 'GAS Error: ' + err.toString() };
  }
}

function getBootstrapDataFromSheets(ss, dateVal) {
  var sched = readScheduleFromSheet(ss, dateVal);
  return {
    pat: readSheetData(ss, 'BenhNhan'),
    benh_nhan: readSheetData(ss, 'BenhNhan'),
    staff: readSheetData(ss, 'NhanSu'),
    nhan_su: readSheetData(ss, 'NhanSu'),
    machines: readSheetData(ss, 'MayMoc'),
    may_moc: readSheetData(ss, 'MayMoc'),
    rooms: readSheetData(ss, 'Phong'),
    phong: readSheetData(ss, 'Phong'),
    procedures: readSheetData(ss, 'ThuThuat'),
    thu_thuat: readSheetData(ss, 'ThuThuat'),
    schedule: sched,
    lich_trinh: sched,
    history: readSheetData(ss, 'LichSu'),
    lich_su: readSheetData(ss, 'LichSu'),
    is_finalized_today: false,
    finalized_today_count: 0,
    is_from_backup_sheets: true,
    serverTime: new Date().toISOString()
  };
}

function readSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var h = 0; h < headers.length; h++) {
      obj[headers[h]] = row[h];
    }
    list.push(obj);
  }
  return list;
}

function readScheduleFromSheet(ss, targetDate) {
  var sheet = ss.getSheetByName('LichTrinh');
  if (!sheet) return [];
  var data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];

  var rows = [];
  var cleanTarget = targetDate ? String(targetDate).trim() : '';

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r || r.length < 2 || !r[1]) continue;
    var rowDate = String(r[0] || '').trim();
    if (cleanTarget) {
      var normT = normDate(cleanTarget);
      var normR = normDate(rowDate);
      if (normT && normR && normT !== normR) continue;
    }
    rows.push([
      String(r[0] || ''),
      String(r[1] || ''),
      String(r[2] || ''),
      String(r[3] || ''),
      String(r[4] || ''),
      String(r[5] || ''),
      String(r[6] || ''),
      String(r[7] || ''),
      String(r[8] || ''),
      String(r[9] || ''),
      String(r[10] || '')
    ]);
  }
  return rows;
}

function normDate(s) {
  if (!s) return '';
  s = String(s).trim();
  if (s.indexOf('/') !== -1) {
    var p = s.split('/');
    if (p.length === 3) return p[2] + '-' + (p[1].length < 2 ? '0' + p[1] : p[1]) + '-' + (p[0].length < 2 ? '0' + p[0] : p[0]);
  }
  return s;
}

function saveScheduleToSheet(ss, dateVal, schedList) {
  var sheet = ss.getSheetByName('LichTrinh');
  if (!sheet) {
    sheet = ss.insertSheet('LichTrinh');
  }
  // Ghi đè sạch bảng LichTrinh để đảm bảo lịch luôn mới nhất và không bị trùng lặp
  sheet.clearContents();
  sheet.appendRow(['Ngay', 'TenBN', 'NamSinh', 'Phong', 'ThuThuat', 'GioDienRa', 'GioKetThuc', 'NVChinh', 'NVPhu', 'May', 'Giuong']);

  if (Array.isArray(schedList) && schedList.length > 0) {
    var matrix = [];
    for (var i = 0; i < schedList.length; i++) {
      var item = schedList[i];
      if (Array.isArray(item)) {
        matrix.push([
          String(item[0] || dateVal || ''),
          String(item[1] || ''),
          String(item[2] || ''),
          String(item[3] || ''),
          String(item[4] || ''),
          String(item[5] || ''),
          String(item[6] || ''),
          String(item[7] || ''),
          String(item[8] || ''),
          String(item[9] || ''),
          String(item[10] || '')
        ]);
      } else if (typeof item === 'object' && item !== null) {
        matrix.push([
          String(item.ngay || item.date || dateVal || ''),
          String(item.tenBN || item.patient_name || item.name || ''),
          String(item.namSinh || item.dob || ''),
          String(item.phong || item.room || ''),
          String(item.thuThuat || item.procedure_name || ''),
          String(item.gioDienRa || item.start_time || ''),
          String(item.gioKetThuc || item.end_time || ''),
          String(item.nvChinh || item.staff_name || ''),
          String(item.nvPhu || item.sub_staff_name || ''),
          String(item.may || item.machine_name || ''),
          String(item.giuong || item.bed || '')
        ]);
      }
    }
    if (matrix.length > 0) {
      var range = sheet.getRange(2, 1, matrix.length, 11);
      range.setNumberFormat('@');
      range.setValues(matrix);
    }
  }
}

function saveAllBootstrapToSheets(ss, dataObj) {
  if (!dataObj) return;

  var ALIAS_KEYS = { pat: 1, staff: 1, machines: 1, rooms: 1, procedures: 1, protocols: 1, schedule: 1, history: 1, accounts: 1, chamCong: 1, thongKe: 1, caiDat: 1, GioBanChungCu: 1 };
  // 1. DUYỆT TỰ ĐỘNG LƯU TOÀN BỘ 21 BẢNG ĐỘNG (CHỈ LƯU TÊN BẢNG SQLITE CHUẨN)
  for (var tableKey in dataObj) {
    if (ALIAS_KEYS[tableKey]) continue;
    var rows = dataObj[tableKey];
    if (Array.isArray(rows) && rows.length > 0) {
      writeListToSheet(ss, tableKey, rows);
    }
  }

  // 2. ĐỒNG BỘ CẢ CÁC SHEET CHUẨN CỦA HỆ THỐNG PMCG (PascalCase) ĐỂ TƯƠNG THÍCH HOÀN TOÀN
  var pat = dataObj.pat || dataObj.benh_nhan;
  if (pat && pat.length > 0) writeListToSheet(ss, 'BenhNhan', pat);
  var staff = dataObj.staff || dataObj.nhan_su;
  if (staff && staff.length > 0) writeListToSheet(ss, 'NhanSu', staff);
  var machines = dataObj.machines || dataObj.may_moc;
  if (machines && machines.length > 0) writeListToSheet(ss, 'MayMoc', machines);
  var rooms = dataObj.rooms || dataObj.phong;
  if (rooms && rooms.length > 0) writeListToSheet(ss, 'Phong', rooms);
  var procs = dataObj.procedures || dataObj.thu_thuat;
  if (procs && procs.length > 0) writeListToSheet(ss, 'ThuThuat', procs);
  var sched = dataObj.schedule || dataObj.lich_trinh;
  if (sched && sched.length > 0) saveScheduleToSheet(ss, '', sched);
  var hist = dataObj.history || dataObj.lich_su;
  if (hist && hist.length > 0) writeListToSheet(ss, 'LichSu', hist);
  var accs = dataObj.accounts || dataObj.tai_khoan;
  if (accs && accs.length > 0) writeListToSheet(ss, 'TaiKhoan', accs);
  var cc = dataObj.chamCong || dataObj.cham_cong;
  if (cc && cc.length > 0) writeListToSheet(ss, 'ChamCong', Array.isArray(cc) ? cc : [cc]);
  var tk = dataObj.thongKe || dataObj.thong_ke;
  if (tk && tk.length > 0) writeListToSheet(ss, 'ThongKe', Array.isArray(tk) ? tk : [tk]);
  var cd = dataObj.caiDat || dataObj.cai_dat;
  if (cd && cd.length > 0) writeListToSheet(ss, 'CaiDat', Array.isArray(cd) ? cd : [cd]);
  var gbc = dataObj.gio_ban_chung_cu || dataObj.GioBanChungCu;
  if (gbc && gbc.length > 0) writeListToSheet(ss, 'GioBanChungCu', gbc);
}

function writeListToSheet(ss, sheetName, list) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  else sheet.clearContents();

  if (!list || list.length === 0) return;
  var firstItem = list[0];
  var matrix = [];

  if (!Array.isArray(firstItem) && typeof firstItem === 'object') {
    var headers = Object.keys(firstItem);
    matrix.push(headers);
    for (var i = 0; i < list.length; i++) {
      var item = list[i] || {};
      var row = [];
      for (var h = 0; h < headers.length; h++) {
        var val = item[headers[h]];
        if (val === null || val === undefined) val = '';
        else if (typeof val === 'object') val = JSON.stringify(val);
        row.push(String(val));
      }
      matrix.push(row);
    }
  } else if (Array.isArray(firstItem)) {
    for (var i = 0; i < list.length; i++) {
      var r = list[i] || [];
      matrix.push(r.map(function(v) { return String(v || ''); }));
    }
  }

  if (matrix.length > 0 && matrix[0].length > 0) {
    var range = sheet.getRange(1, 1, matrix.length, matrix[0].length);
    range.setNumberFormat('@');
    range.setValues(matrix);
  }
}

function appendListToSheet(ss, sheetName, list) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    writeListToSheet(ss, sheetName, list);
    return;
  }
  if (!list || list.length === 0) return;
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    writeListToSheet(ss, sheetName, list);
    return;
  }

  var firstItem = list[0];
  var matrix = [];
  if (!Array.isArray(firstItem) && typeof firstItem === 'object') {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (var i = 0; i < list.length; i++) {
      var item = list[i] || {};
      var row = [];
      for (var h = 0; h < headers.length; h++) {
        var val = item[headers[h]];
        if (val === null || val === undefined) val = '';
        else if (typeof val === 'object') val = JSON.stringify(val);
        row.push(String(val));
      }
      matrix.push(row);
    }
  } else if (Array.isArray(firstItem)) {
    for (var i = 0; i < list.length; i++) {
      var r = list[i] || [];
      matrix.push(r.map(function(v) { return String(v || ''); }));
    }
  }

  if (matrix.length > 0 && matrix[0].length > 0) {
    var range = sheet.getRange(lastRow + 1, 1, matrix.length, matrix[0].length);
    range.setNumberFormat('@');
    range.setValues(matrix);
  }
}

function getHistoryFullDataFromSheets(ss, targetDate) {
  var cleanTarget = targetDate ? String(targetDate).trim() : '';
  var targetNorm = normDate(cleanTarget);

  // Đọc dữ liệu từ sheet LichSu
  var histList = readSheetData(ss, 'LichSu');
  var matchedRows = [];

  for (var i = 0; i < histList.length; i++) {
    var r = histList[i];
    var rDate = r.Ngay || r.ngay || r.date || r.Date || '';
    if (!cleanTarget || normDate(rDate) === targetNorm || rDate === cleanTarget) {
      matchedRows.push(r);
    }
  }

  // Nếu không thấy trong LichSu, thử tìm trong LichTrinh (ví dụ ngày hiện tại hoặc đang diễn ra)
  if (matchedRows.length === 0) {
    var schedList = readScheduleFromSheet(ss, targetDate);
    for (var j = 0; j < schedList.length; j++) {
      var s = schedList[j];
      matchedRows.push({
        ngay: s[0],
        tenBN: s[1],
        namSinh: s[2],
        phong: s[3],
        thuThuat: s[4],
        gioDienRa: s[5],
        gioKetThuc: s[6],
        nvChinh: s[7],
        nvPhu: s[8],
        may: s[9],
        giuong: s[10]
      });
    }
  }

  // Khử trùng lặp và ánh xạ sang định dạng schedule chuẩn
  var seenKeys = {};
  var schedule = [];
  var patMap = {};

  for (var k = 0; k < matchedRows.length; k++) {
    var item = matchedRows[k];
    var tenBN = item.TenBN || item.tenBN || item.patient_name || item.name || '';
    var namSinh = item.NamSinh || item.namSinh || item.dob || '';
    var phong = item.Phong || item.phong || item.room || '';
    var thuThuat = item.ThuThuat || item.thuThuat || item.procedure_name || '';
    var gioDienRa = item.GioDienRa || item.gioDienRa || item.start_time || '';
    var gioKetThuc = item.GioKetThuc || item.gioKetThuc || item.end_time || '';
    var nvChinh = item.NVChinh || item.nvChinh || item.staff_name || '';
    var nvPhu = item.NVPhu || item.nvPhu || item.sub_staff_name || '';
    var may = item.May || item.may || item.machine_name || '';
    var giuong = item.Giuong || item.giuong || item.bed || '';
    var ngayVal = item.Ngay || item.ngay || item.date || cleanTarget;

    if (!tenBN && !thuThuat) continue;

    var sig = (tenBN + '|' + namSinh + '|' + thuThuat + '|' + gioDienRa + '|' + gioKetThuc + '|' + nvChinh).toUpperCase();
    if (seenKeys[sig]) continue;
    seenKeys[sig] = true;

    schedule.push({
      ngay: ngayVal,
      tenBN: tenBN,
      namSinh: namSinh,
      phong: phong,
      thuThuat: thuThuat,
      gioDienRa: gioDienRa,
      gioKetThuc: gioKetThuc,
      nvChinh: nvChinh,
      nvPhu: nvPhu,
      may: may,
      giuong: giuong
    });

    var pKey = (tenBN + '|' + namSinh).toUpperCase();
    if (!patMap[pKey]) {
      patMap[pKey] = { tenBN: tenBN, namSinh: namSinh, phong: phong, soLuongCa: 0, dsThuThuat: [] };
    }
    patMap[pKey].soLuongCa++;
    if (thuThuat && patMap[pKey].dsThuThuat.indexOf(thuThuat) === -1) {
      patMap[pKey].dsThuThuat.push(thuThuat);
    }
  }

  var benh_nhan = [];
  for (var pk in patMap) {
    benh_nhan.push(patMap[pk]);
  }

  // Đọc danh mục báo bận / ra viện từ GioBanChungCu nếu có
  var staffBusy = [];
  var patBusy = [];
  var leavePat = [];
  var busySheet = ss.getSheetByName('GioBanChungCu');
  if (busySheet) {
    var busyRows = readSheetData(ss, 'GioBanChungCu');
    for (var b = 0; b < busyRows.length; b++) {
      var br = busyRows[b];
      var bDate = br.Date || br.date || br.Ngay || br.ngay || '';
      if (cleanTarget && normDate(bDate) !== targetNorm && bDate !== cleanTarget) continue;
      var tType = br.target_type || br.TargetType || '';
      var bName = br.Name || br.name || br.staff_name || br.ten || '';
      var bDob = br.Dob || br.dob || br.namSinh || '';
      var bRanges = br.busy_ranges || br.BusyRanges || '';
      if (!bRanges || bRanges === 'ID' || bRanges === '[]' || bRanges === '[""]') continue;

      if (tType === 'ra_vien') {
        leavePat.push({ tenBN: bName, namSinh: bDob, gioRa: bRanges });
        continue;
      }

      var slots = [];
      try {
        var parsed = JSON.parse(bRanges);
        if (Array.isArray(parsed)) {
          for (var p = 0; p < parsed.length; p++) {
            var parts = String(parsed[p]).split('-');
            if (parts.length === 2) slots.push({ from: parts[0].trim(), to: parts[1].trim(), tt: 'Báo bận' });
          }
        }
      } catch(e) {}
      if (slots.length === 0) {
        var pList = String(bRanges).split(',');
        for (var q = 0; q < pList.length; q++) {
          var qParts = pList[q].split('-');
          if (qParts.length === 2) slots.push({ from: qParts[0].trim(), to: qParts[1].trim(), tt: 'Báo bận' });
        }
      }
      if (slots.length > 0) {
        if (tType === 'nhan_su' || bName.indexOf('BS') === 0 || bName.indexOf('Bs') === 0 || bName.indexOf('KTV') === 0) {
          staffBusy.push({ ten: bName, slots: slots });
        } else {
          patBusy.push({ tenBN: bName, namSinh: bDob, slots: slots });
        }
      }
    }
  }

  return {
    schedule: schedule,
    patients: benh_nhan,
    benh_nhan: benh_nhan,
    staffBusy: staffBusy,
    patBusy: patBusy,
    leavePat: leavePat
  };
}

function getBusyHistoryDatesFromSheets(ss) {
  var dates = [];
  var seen = {};
  var histList = readSheetData(ss, 'LichSu');
  for (var i = 0; i < histList.length; i++) {
    var d = histList[i].Ngay || histList[i].ngay || histList[i].date || '';
    if (d) {
      var n = normDate(d);
      if (!seen[n]) { seen[n] = true; dates.push(n); }
    }
  }
  var busyList = readSheetData(ss, 'GioBanChungCu');
  for (var j = 0; j < busyList.length; j++) {
    var bd = busyList[j].Date || busyList[j].date || busyList[j].Ngay || busyList[j].ngay || '';
    if (bd) {
      var bn = normDate(bd);
      if (!seen[bn]) { seen[bn] = true; dates.push(bn); }
    }
  }
  dates.sort(function(a, b) { return b.localeCompare(a); });
  return dates;
}
