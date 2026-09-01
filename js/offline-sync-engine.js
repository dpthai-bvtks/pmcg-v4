/**
 * OFFLINE SYNC ENGINE & EMERGENCY DATA BACKUP MODULE (v3.2.1)
 * Tích hợp Dexie.js + IndexedDB dung lượng cao (hàng trăm MB)
 * Cho phép PMCG V3 tự chủ hoạt động 100% khi mất mạng hoặc Server gặp sự cố.
 */

window.OfflineSyncEngine = (function () {
  'use strict';

  const DB_NAME = 'PMCG_Offline_DB';
  let dexieDb = null;

  // Khởi tạo Dexie IndexedDB Store
  try {
    if (typeof window.Dexie !== 'undefined') {
      dexieDb = new window.Dexie(DB_NAME);
      dexieDb.version(1).stores({
        cache: 'key, timestamp',
        patients: '++id, name, age, room, status, order_idx',
        history: '++id, date, patient_name, procedure_name, staff_name',
        schedules: 'date, created_at',
        chamcong: 'month_year, updated_at',
        thongke: 'month_year, updated_at',
        syncQueue: '++id, action, timestamp'
      });
      console.log('[Dexie.js] Khởi tạo bộ nhớ đệm Offline IndexedDB thành công!');
    }
  } catch (e) {
    console.warn('[Dexie.js] Khởi tạo Dexie thất bại, chuyển sang IndexedDB thuần:', e);
  }

  // Fallback IndexedDB thuần nếu Dexie chưa sẵn sàng
  let rawDbInstance = null;
  function openRawDB() {
    return new Promise((resolve) => {
      if (rawDbInstance) return resolve(rawDbInstance);
      if (!window.indexedDB) return resolve(null);

      const request = indexedDB.open('PMCG_Raw_DB', 1);
      request.onupgradeneeded = function (e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = function (e) {
        rawDbInstance = e.target.result;
        resolve(rawDbInstance);
      };
      request.onerror = function () {
        resolve(null);
      };
    });
  }

  /**
   * Lưu dữ liệu vào cache Offline (Dexie -> IndexedDB -> LocalStorage)
   */
  async function saveCache(key, data) {
    try {
      if (dexieDb && dexieDb.cache) {
        await dexieDb.cache.put({ key: key, data: data, timestamp: Date.now() });
      } else {
        const db = await openRawDB();
        if (db) {
          const tx = db.transaction('cache', 'readwrite');
          tx.objectStore('cache').put({ key: key, data: data, timestamp: Date.now() });
        }
      }
    } catch (e) {
      console.warn('[OfflineSyncEngine Save Warning]:', e);
    }

    // Luôn duy trì đồng bộ bản sao nhẹ trên LocalStorage cho các hàm đọc đồng bộ tức thì
    try {
      if (key === 'times_bootstrap_cache' || key === 'meds_success') {
        localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
      }
    } catch (e) {
      // LocalStorage đầy thì bỏ qua, dữ liệu đã an toàn trong IndexedDB
    }
  }

  /**
   * Đọc dữ liệu từ cache Offline
   */
  async function getCache(key) {
    try {
      if (dexieDb && dexieDb.cache) {
        const rec = await dexieDb.cache.get(key);
        if (rec && rec.data !== undefined) return rec.data;
      }

      const db = await openRawDB();
      if (db) {
        const val = await new Promise((resolve) => {
          const tx = db.transaction('cache', 'readonly');
          const req = tx.objectStore('cache').get(key);
          req.onsuccess = () => resolve(req.result ? req.result.data : null);
          req.onerror = () => resolve(null);
        });
        if (val !== null) return val;
      }
    } catch (e) {
      console.warn('[OfflineSyncEngine Get Warning]:', e);
    }

    // Fallback sang LocalStorage
    try {
      const raw = localStorage.getItem(key) || localStorage.getItem('pmcg_cache_' + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Lưu hàng loạt lịch sử thủ thuật vào Dexie
   */
  async function bulkSaveHistory(records) {
    if (!dexieDb || !dexieDb.history || !Array.isArray(records)) return false;
    try {
      await dexieDb.history.clear();
      await dexieDb.history.bulkPut(records);
      return true;
    } catch (e) {
      console.warn('[Dexie bulkSaveHistory error]:', e);
      return false;
    }
  }

  /**
   * 1-Click Xuất file sao lưu khẩn cấp JSON
   */
  function exportEmergencyBackupData() {
    try {
      const cache = window.dataCache || {};
      const backupPayload = {
        app: 'PMCG-Xeplichthuthuat',
        version: '3.2.1',
        exportTime: new Date().toLocaleString('vi-VN'),
        data: {
          pat: cache.pat || [],
          staff: cache.staff || [],
          machines: cache.machines || cache.machine || [],
          rooms: cache.rooms || cache.room || [],
          procedures: cache.procedures || cache.proc || [],
          schedule: cache.schedule || window.currentScheduleData || [],
          unscheduled: window.lastUnscheduledData || []
        }
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `PMCG_Backup_DuPhong_${new Date().toISOString().slice(0, 10)}.json`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (typeof window.showToast === 'function') {
        window.showToast('✅ Đã xuất file sao lưu khẩn cấp thành công!');
      } else {
        alert(`✅ Đã xuất file sao lưu khẩn cấp thành công!\nTên file: ${filename}`);
      }
    } catch (e) {
      alert('❌ Lỗi xuất file dự phòng: ' + e.message);
    }
  }

  /**
   * 1-Click Nạp file sao lưu khẩn cấp JSON
   */
  function importEmergencyBackupData(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const payload = JSON.parse(e.target.result);
        if (!payload.data) throw new Error('File không đúng cấu trúc dự phòng PMCG!');

        const d = payload.data;
        if (!window.dataCache) window.dataCache = {};
        window.dataCache.pat = d.pat || [];
        window.dataCache.staff = d.staff || [];
        window.dataCache.machine = d.machines || d.machine || [];
        window.dataCache.machines = window.dataCache.machine;
        window.dataCache.room = d.rooms || d.room || [];
        window.dataCache.rooms = window.dataCache.room;
        window.dataCache.proc = d.procedures || d.proc || [];
        window.dataCache.procedures = window.dataCache.proc;
        window.dataCache.schedule = d.schedule || [];
        window.currentScheduleData = d.schedule || [];
        window.lastUnscheduledData = d.unscheduled || [];

        // Lưu vào Offline Dexie Cache
        saveCache('times_bootstrap_cache', window.dataCache);
        localStorage.setItem('meds_success', JSON.stringify(d.schedule || []));

        if (typeof filterSchedule === 'function') filterSchedule();
        if (typeof renderPatientsTable === 'function') renderPatientsTable();
        if (typeof renderStats === 'function') renderStats(window.lastUnscheduledData);

        if (typeof window.showToast === 'function') {
          window.showToast('✅ Đã nạp thành công dữ liệu từ file sao lưu!');
        } else {
          alert(`✅ Đã nạp thành công dữ liệu từ file sao lưu!\nThời điểm tạo file: ${payload.exportTime || 'Không xác định'}`);
        }
      } catch (err) {
        alert('❌ Lỗi nạp file dự phòng: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ==========================================
  // ⚡ REAL-TIME LIVE SYNC BUS (BroadcastChannel)
  // ==========================================
  let liveBus = null;
  const liveListeners = new Set();

  try {
    if (typeof window.BroadcastChannel !== 'undefined') {
      liveBus = new window.BroadcastChannel('pmcg_live_bus');
      liveBus.onmessage = function (event) {
        if (!event || !event.data) return;
        const { type, payload, timestamp } = event.data;
        console.log(`[LiveSync Bus] Nhận sự kiện '${type}' lúc ${new Date(timestamp).toLocaleTimeString()}`);
        liveListeners.forEach(listener => {
          try {
            listener(type, payload, timestamp);
          } catch (e) {
            console.warn('[LiveSync Listener Error]:', e);
          }
        });
      };
      console.log('[LiveSync Bus] Kênh phát sóng thời gian thực BroadcastChannel đã kích hoạt!');
    }
  } catch (e) {
    console.warn('[LiveSync Bus] Trình duyệt không hỗ trợ BroadcastChannel:', e);
  }

  /**
   * Phát tín hiệu sự kiện thay đổi dữ liệu tới tất cả các Tab / Cửa sổ khác
   */
  function broadcastLiveEvent(type, payload = null) {
    try {
      if (liveBus) {
        liveBus.postMessage({
          type: type,
          payload: payload,
          timestamp: Date.now()
        });
      }
    } catch (e) {
      console.warn('[LiveSync Broadcast Error]:', e);
    }
  }

  /**
   * Đăng ký nhận sự kiện đồng bộ thời gian thực từ các Tab khác
   */
  function registerLiveListener(callback) {
    if (typeof callback === 'function') {
      liveListeners.add(callback);
      return () => liveListeners.delete(callback);
    }
    return () => {};
  }

  /**
   * Đẩy tác vụ vào hàng đợi đồng bộ ngoại tuyến (syncQueue)
   */
  async function enqueueSyncAction(action, payload) {
    try {
      if (dexieDb && dexieDb.syncQueue) {
        await dexieDb.syncQueue.add({ action, payload, timestamp: Date.now() });
      } else {
        const db = await openRawDB();
        if (db) {
          const tx = db.transaction('syncQueue', 'readwrite');
          tx.objectStore('syncQueue').add({ action, payload, timestamp: Date.now() });
        }
      }
    } catch (e) {
      console.warn('[enqueueSyncAction error]:', e);
    }
  }

  /**
   * Lắng nghe trạng thái Online để tự động đồng bộ
   */
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('[Network] Thiết bị đã trực tuyến trở lại! Đang chuẩn bị đồng bộ nền...');
      broadcastLiveEvent('NETWORK_ONLINE', { online: true });
    });
    window.addEventListener('offline', () => {
      console.log('[Network] Thiết bị đang ngoại tuyến. Hệ thống chuyển sang chế độ tự chủ Dexie Offline.');
      broadcastLiveEvent('NETWORK_OFFLINE', { online: false });
    });
  }

  return {
    saveCache,
    getCache,
    bulkSaveHistory,
    exportEmergencyBackupData,
    importEmergencyBackupData,
    broadcastLiveEvent,
    registerLiveListener,
    enqueueSyncAction,
    getDexieDB: () => dexieDb
  };
})();
