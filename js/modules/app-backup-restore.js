/**
 * 📦 T.I.M.E.S System v4 - Backup & Restore Module
 */

// ============================================================
// 📦 SAO LƯU & KHÔI PHỤC DỮ LIỆU CLOUDFLARE D1 (BACKUP & RESTORE)
// ============================================================

window.exportFullDatabaseBackup = function() {
    if (window.showGlobalLoading) window.showGlobalLoading("Đang xuất bản sao lưu toàn bộ Cloudflare D1...");
    callApi('exportDatabase', [], async data => {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        if (!data || !data.tables) {
            return showCustomAlert("Lỗi", "Không thể lấy dữ liệu sao lưu từ máy chủ!");
        }

        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10) + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        a.href = url;
        a.download = `PMCG_D1_Backup_FULL_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Tự động ghi vào thư mục máy tính đã kết nối (nếu có)
        const savedToLocalFolder = await window.autoSaveToLocalDir(data);

        localStorage.setItem('last_backup_timestamp', Date.now().toString());
        const extraMsg = savedToLocalFolder ? " (Đã tự động lưu 1 bản vào thư mục máy tính của bác sĩ)" : "";
        showCustomAlert("Thành công", `Đã tải về bản sao lưu dữ liệu toàn diện (phiên bản ${data.version || 'v3.6'})${extraMsg}!`);
    }, err => {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        showCustomAlert("Lỗi sao lưu", "Lỗi: " + (typeof err === 'string' ? err : JSON.stringify(err)));
    });
};

window.importFullDatabaseBackup = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            if (!backupData || !backupData.tables) {
                return showCustomAlert("Lỗi khôi phục", "File chọn không đúng định dạng sao lưu PM-XepLich!");
            }

            const tableNames = Object.keys(backupData.tables);
            let totalRows = 0;
            tableNames.forEach(t => { totalRows += (backupData.tables[t] || []).length; });

            const dateStr = backupData.exportDate ? new Date(backupData.exportDate).toLocaleString('vi-VN') : 'Không rõ';

            showCustomConfirm(
                "Xác Nhận Khôi Phục Dữ Liệu",
                `⚠️ BẠN CÓ CHẮC CHẮN MỐN KHÔI PHỤC DỮ LIỆU D1?\n\n` +
                `📅 Ngày sao lưu: ${dateStr}\n` +
                `📊 Tổng số bảng: ${tableNames.length} bảng\n` +
                `📋 Tổng số bản ghi: ${totalRows} dòng\n\n` +
                `LƯU Ý: Thao tác này sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu trong file sao lưu!`,
                function() {
                    if (window.showGlobalLoading) window.showGlobalLoading("Đang khôi phục cơ sở dữ liệu Cloudflare D1...");
                    callApi('importDatabase', [backupData], res => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        showCustomAlert("Thành công", res.message || "Khôi phục dữ liệu thành công!");
                        setTimeout(() => { location.reload(); }, 1500);
                    }, err => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        showCustomAlert("Lỗi khôi phục", "Không thể khôi phục dữ liệu: " + (typeof err === 'string' ? err : JSON.stringify(err)));
                    });
                }
            );
        } catch(err) {
            showCustomAlert("Lỗi đọc file", "File sao lưu bị hỏng hoặc không đúng chuẩn JSON: " + err.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
};

window.onBackupScheduleUIChange = function() {
    const periodEl = document.getElementById('backup-reminder-period');
    const period = periodEl ? periodEl.value : 'none';
    const dowContainer = document.getElementById('backup-dow-container');
    const domContainer = document.getElementById('backup-dom-container');
    const timeContainer = document.getElementById('backup-time-container');

    if (period === 'none') {
        if (dowContainer) dowContainer.style.display = 'none';
        if (domContainer) domContainer.style.display = 'none';
        if (timeContainer) timeContainer.style.display = 'none';
    } else if (period === 'daily') {
        if (dowContainer) dowContainer.style.display = 'none';
        if (domContainer) domContainer.style.display = 'none';
        if (timeContainer) timeContainer.style.display = 'flex';
    } else if (period === 'weekly') {
        if (dowContainer) dowContainer.style.display = 'flex';
        if (domContainer) domContainer.style.display = 'none';
        if (timeContainer) timeContainer.style.display = 'flex';
    } else if (period === 'monthly') {
        if (dowContainer) dowContainer.style.display = 'none';
        if (domContainer) domContainer.style.display = 'flex';
        if (timeContainer) timeContainer.style.display = 'flex';
    }
};

window.saveBackupScheduleSettings = function() {
    const period = document.getElementById('backup-reminder-period').value;
    const time = document.getElementById('backup-reminder-time').value || '17:00';
    const dow = document.getElementById('backup-reminder-dow').value || '1';
    const dom = document.getElementById('backup-reminder-dom').value || '1';

    localStorage.setItem('backup_reminder_period', period);
    localStorage.setItem('backup_reminder_time', time);
    localStorage.setItem('backup_reminder_dow', dow);
    localStorage.setItem('backup_reminder_dom', dom);

    const configObj = { period, time, dow, dom };
    callApi('saveSystemSettings', ['backup_schedule_config', JSON.stringify(configObj)], null, null);

    showCustomAlert("Thành công", "Đã lưu cấu hình lịch tự động sao lưu & nhắc nhở thành công!");
};

window.renderAISettingsUI = function() {
    try {
        const model = (window.AIScheduler && typeof window.AIScheduler.getModel === 'function') ? window.AIScheduler.getModel() : null;
        const trainedRowsEl = document.getElementById('ai-stat-trained-rows');
        const lastTrainedEl = document.getElementById('ai-stat-last-trained');
        const affinityEl = document.getElementById('ai-stat-affinity-count');
        const autoEnableEl = document.getElementById('ai-auto-train-enable');
        const autoTimeEl = document.getElementById('ai-auto-train-time');

        if (model) {
            const rowsCount = model.trainedRows || 0;
            if (trainedRowsEl) trainedRowsEl.innerText = `${rowsCount.toLocaleString('vi-VN')} dòng`;
            
            if (lastTrainedEl) {
                if (model.lastTrained) {
                    const d = new Date(model.lastTrained);
                    const hh = String(d.getHours()).padStart(2, '0');
                    const mm = String(d.getMinutes()).padStart(2, '0');
                    const ss = String(d.getSeconds()).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const MM = String(d.getMonth() + 1).padStart(2, '0');
                    const yyyy = d.getFullYear();
                    lastTrainedEl.innerText = `${hh}:${mm}:${ss} - ${dd}/${MM}/${yyyy}`;
                } else {
                    lastTrainedEl.innerText = "Chưa huấn luyện";
                }
            }
            const countAffinity = model.staffAffinity ? Object.keys(model.staffAffinity).length : 0;
            if (affinityEl) affinityEl.innerText = `${countAffinity.toLocaleString('vi-VN')} cặp thói quen`;
        }

        const autoEnable = localStorage.getItem('ai_auto_train_enable') !== '0';
        if (autoEnableEl) {
            autoEnableEl.value = autoEnable ? "1" : "0";
            if (!autoEnableEl._hasAutoSave) {
                autoEnableEl._hasAutoSave = true;
                autoEnableEl.addEventListener('change', () => {
                    if (typeof saveAIAutoTrainConfig === 'function') saveAIAutoTrainConfig();
                });
            }
        }
    } catch(e) {
        console.warn('[renderAISettingsUI] Lỗi hiển thị thông số AI:', e);
    }
};

window.saveAIAutoTrainConfig = function() {
    const enableEl = document.getElementById('ai-auto-train-enable');
    const enable = enableEl ? enableEl.value : '1';

    localStorage.setItem('ai_auto_train_enable', enable);

    const configObj = { enable };
    callApi('saveSystemSettings', [{ 
        ai_auto_train_config: JSON.stringify(configObj),
        ai_auto_train_enable: enable
    }], null, null);

    const statusText = enable === '1' ? 'BẬT (Tự động học ngay sau khi chốt sổ hàng ngày)' : 'TẮT';
    showCustomAlert("Thành công", `Đã lưu cấu hình tự động huấn luyện AI: ${statusText}!`);
};

window.calibrateAIFromHistory = async function(options = {}) {
    const isSilent = (typeof options === 'object' && options !== null && options.silent === true);
    const reason = (typeof options === 'object' && options !== null && options.reason) ? options.reason : 'manual';

    if (!isSilent && window.showGlobalLoading) {
        window.showGlobalLoading("Đang nạp dữ liệu lịch sử và lịch trình thực tế để huấn luyện AI...");
    }

    const executeTraining = (historyRows) => {
        try {
            // Gom tất cả nguồn dữ liệu khả dụng:
            let combinedRows = Array.isArray(historyRows) ? [...historyRows] : [];
            
            // Bổ sung lịch trình hiện tại & bộ đệm
            if (typeof dataCache !== 'undefined') {
                if (Array.isArray(dataCache.schedule)) combinedRows = combinedRows.concat(dataCache.schedule);
                if (Array.isArray(dataCache.lich_trinh)) combinedRows = combinedRows.concat(dataCache.lich_trinh);
                if (Array.isArray(dataCache.history)) combinedRows = combinedRows.concat(dataCache.history);
            }
            if (Array.isArray(window.currentScheduleData)) {
                combinedRows = combinedRows.concat(window.currentScheduleData);
            }

            // Đọc thêm từ bootstrap cache nếu có
            try {
                const cacheKey = typeof window.getBootstrapCacheKey === 'function' ? window.getBootstrapCacheKey() : 'times_bootstrap_cache';
                const bStr = localStorage.getItem(cacheKey);
                if (bStr) {
                    const bObj = JSON.parse(bStr);
                    if (Array.isArray(bObj.schedule)) combinedRows = combinedRows.concat(bObj.schedule);
                    if (Array.isArray(bObj.history)) combinedRows = combinedRows.concat(bObj.history);
                }
            } catch(e) {}

            if (combinedRows.length === 0) {
                if (!isSilent && window.hideGlobalLoading) window.hideGlobalLoading();
                if (!isSilent) showCustomAlert("Thông báo", "Chưa có dữ liệu lịch trình hoặc lịch sử điều trị để huấn luyện AI. Bác sĩ hãy xếp lịch hoặc nhập dữ liệu trước nhé!");
                return;
            }

            let model = null;
            if (window.AIScheduler && typeof window.AIScheduler.trainFromHistory === 'function') {
                model = window.AIScheduler.trainFromHistory(combinedRows);
            }

            // ☁️ Lưu trực tiếp mô hình AI lên CSDL đám mây (cai_dat)
            if (model && typeof callApi === 'function') {
                callApi('saveSystemSettings', [{ ai_learned_model: JSON.stringify(model) }], null, null);
            }

            // Ghi nhận ngày tự động học gần nhất
            const todayStr = new Date().toISOString().slice(0, 10);
            localStorage.setItem('ai_last_auto_train_date', todayStr);

            if (!isSilent && window.hideGlobalLoading) window.hideGlobalLoading();
            const trainedCount = model ? (model.trainedRows || 0) : combinedRows.length;
            const affinityCount = model && model.staffAffinity ? Object.keys(model.staffAffinity).length : 0;
            
            if (typeof window.renderAISettingsUI === 'function') window.renderAISettingsUI();

            const d = new Date();
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const MM = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            const timeStr = `${hh}:${mm}:${ss} - ${dd}/${MM}/${yyyy}`;

            if (!isSilent) {
                showCustomAlert(
                    "Huấn luyện AI thành công",
                    `Đã cập nhật mô hình AI lúc ${timeStr}!\n\n📊 Dữ liệu thực tế: ${trainedCount.toLocaleString('vi-VN')} dòng (Đã đồng bộ lên CSDL máy chủ)\n👥 Cặp thói quen nhân sự: ${affinityCount.toLocaleString('vi-VN')} mẫu thói quen\n🚦 Tắc nghẽn máy móc & khung giờ vàng đã được tối ưu.`
                );
            } else {
                console.log(`[AIScheduler] ✅ [Auto-Train ${reason}] Đã tự động cập nhật mô hình AI (${trainedCount.toLocaleString('vi-VN')} dòng, ${affinityCount} thói quen) lúc ${timeStr}`);
                if (typeof window.showToast === 'function') {
                    window.showToast(`🤖 AI đã tự động học từ ${trainedCount.toLocaleString('vi-VN')} dòng dữ liệu lâm sàng!`, 'success', 3500);
                }
            }
        } catch(err) {
            if (!isSilent && window.hideGlobalLoading) window.hideGlobalLoading();
            if (!isSilent) showCustomAlert("Thông báo", "Lỗi huấn luyện AI: " + err.message);
            else console.warn('[AIScheduler] Lỗi tự động huấn luyện AI ngầm:', err);
        }
    };

    async function fetchDirectly() {
        try {
            const apiUrl = (typeof getApiUrl === 'function') ? getApiUrl() : 'https://pmcg-api.dpthai-ttytmk.workers.dev/';
            const curUnit = (typeof getCurrentUnitCode === 'function') ? getCurrentUnitCode() : (localStorage.getItem('pm_unit_code') || 'bvtks-cs2');
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-unit-code': curUnit },
                body: JSON.stringify({ action: 'getLichSu', args: [], unit_code: curUnit })
            });
            const json = await response.json();
            let rows = [];
            if (json && json.data) {
                if (Array.isArray(json.data.rows)) rows = json.data.rows;
                else if (Array.isArray(json.data.history)) rows = json.data.history;
                else if (Array.isArray(json.data)) rows = json.data;
            }
            executeTraining(rows);
        } catch (e) {
            console.error('[AI] Lỗi fetch trực tiếp:', e);
            executeTraining([]);
        }
    }

    try {
        if (typeof callApi === 'function') {
            callApi('getLichSu', [], (res) => {
                let rows = [];
                if (res) {
                    if (Array.isArray(res.rows)) rows = res.rows;
                    else if (Array.isArray(res.history)) rows = res.history;
                    else if (Array.isArray(res.data)) rows = res.data;
                    else if (Array.isArray(res)) rows = res;
                }
                executeTraining(rows);
            }, (err) => {
                console.warn('[AI] callApi getLichSu error, fetching directly:', err);
                fetchDirectly();
            });
        } else {
            fetchDirectly();
        }
    } catch(err) {
        fetchDirectly();
    }
};

window.checkBackupReminder = function() {
    const period = localStorage.getItem('backup_reminder_period') || 'none';
    const time = localStorage.getItem('backup_reminder_time') || '17:00';
    const dow = localStorage.getItem('backup_reminder_dow') || '1';
    const dom = localStorage.getItem('backup_reminder_dom') || '1';

    const periodEl = document.getElementById('backup-reminder-period');
    if (periodEl) periodEl.value = period;
    const timeEl = document.getElementById('backup-reminder-time');
    if (timeEl) timeEl.value = time;
    const dowEl = document.getElementById('backup-reminder-dow');
    if (dowEl) dowEl.value = dow;
    const domEl = document.getElementById('backup-reminder-dom');
    if (domEl) domEl.value = dom;

    if (typeof window.onBackupScheduleUIChange === 'function') window.onBackupScheduleUIChange();
    if (typeof window.loadGoogleDriveSettingsUI === 'function') window.loadGoogleDriveSettingsUI();
};

const BK_DB_NAME = 'PMCG_Local_Backup_DB';
const BK_STORE_NAME = 'handles';

function getBackupIDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject(new Error("IndexedDB không được hỗ trợ trên trình duyệt này"));
        const req = indexedDB.open(BK_DB_NAME, 1);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(BK_STORE_NAME)) {
                db.createObjectStore(BK_STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = e => reject(e.target?.error || e);
    });
}

async function setSavedDirHandle(handle) {
    const db = await getBackupIDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(BK_STORE_NAME, 'readwrite');
        tx.objectStore(BK_STORE_NAME).put(handle, 'backup_dir_handle');
        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e);
    });
}

async function getSavedDirHandle() {
    try {
        const db = await getBackupIDB();
        return new Promise((resolve) => {
            const tx = db.transaction(BK_STORE_NAME, 'readonly');
            const req = tx.objectStore(BK_STORE_NAME).get('backup_dir_handle');
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch(e) { return null; }
}

window.selectLocalBackupDirectory = async function() {
    if (!('showDirectoryPicker' in window)) {
        return showCustomAlert("Trình duyệt không hỗ trợ", "Trình duyệt của bác sĩ chưa hỗ trợ chọn thư mục lưu tự động. Vui lòng dùng Chrome, Edge hoặc Brave mới nhất!");
    }
    try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        await setSavedDirHandle(handle);
        const displayEl = document.getElementById('local-dir-path-display');
        if (displayEl) displayEl.innerText = "📁 Đã chọn: " + handle.name;
        showCustomAlert("Thành công", `Đã kết nối thư mục [${handle.name}]! Từ giờ khi bấm sao lưu, hệ thống sẽ tự ghi file thẳng vào thư mục này mà không cần hỏi 'Save As'.`);
    } catch(err) {
        if (err.name !== 'AbortError') showCustomAlert("Lỗi", "Không thể chọn thư mục: " + err.message);
    }
};

window.autoSaveToLocalDir = async function(backupData) {
    const handle = await getSavedDirHandle();
    if (!handle) return false;

    try {
        let perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
            perm = await handle.requestPermission({ mode: 'readwrite' });
        }
        if (perm !== 'granted') return false;

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10) + '_' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        const filename = `PMCG_D1_Backup_AUTO_${dateStr}.json`;

        const fileHandle = await handle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(backupData, null, 2));
        await writable.close();
        return true;
    } catch(e) {
        console.warn("[AutoSaveLocal] Lỗi lưu file vào thư mục:", e);
        return false;
    }
};

window.saveGoogleDriveSettingsUI = function() {
    const urlInput = document.getElementById('gdrive-webhook-url');
    const url = urlInput ? urlInput.value.trim() : "";
    if (url && !url.startsWith('http')) {
        return showCustomAlert("Lỗi", "URL Google Drive Webhook phải bắt đầu bằng http:// hoặc https://");
    }
    callApi('saveGoogleDriveSettings', [url], res => {
        showCustomAlert("Thành công", res.message || "Đã lưu cài đặt Google Drive Webhook!");
    }, err => {
        showCustomAlert("Lỗi", "Không thể lưu cài đặt: " + err);
    });
};

window.testGoogleDriveUploadUI = function() {
    const urlInput = document.getElementById('gdrive-webhook-url');
    const url = urlInput ? urlInput.value.trim() : "";
    if (!url || !url.startsWith('http')) {
        return showCustomAlert("Lỗi", "Vui lòng nhập URL Google Drive Webhook trước khi thử nghiệm!");
    }
    if (window.showGlobalLoading) window.showGlobalLoading("Đang đẩy file sao lưu thử nghiệm lên Google Drive...");
    callApi('testGoogleDriveUpload', [url], res => {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        showCustomAlert("Thành công", res.message || "Đã tải file sao lưu lên Google Drive thành công!");
    }, err => {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        showCustomAlert("Lỗi Google Drive", "Không thể tải lên Google Drive: " + err);
    });
};

window.loadGoogleDriveSettingsUI = function() {
    callApi('getGoogleDriveSettings', [], url => {
        const urlInput = document.getElementById('gdrive-webhook-url');
        if (urlInput && url) urlInput.value = url;
    }, null);

    getSavedDirHandle().then(handle => {
        if (handle) {
            const displayEl = document.getElementById('local-dir-path-display');
            if (displayEl) displayEl.innerText = "📁 Đã chọn: " + handle.name;
        }
    });
};

// ============================================================
// 🔗 QUẢN LÝ LIÊN KẾT NHANH (FOOTER QUICK LINKS)
// ============================================================

window.loadQuickLinks = function() {
    const uls = document.querySelectorAll('.khu-vuc-lien-ket');
    const defaultList = [
        { icon: "📜", ten: "Tra cứu Văn bản & BHXH", url: "javascript:openDocLookupModal()" },
        { icon: "📖", ten: "Hướng dẫn sử dụng phần mềm", url: "javascript:openHdsdModal()" },
        { icon: "📋", ten: "Quy trình Kỹ thuật PHCN", url: "https://kcb.vn/" }
    ];

    const renderLinks = (list) => {
        if (!uls.length) return;
        const htmlContent = list.map(item => {
            const itemTen = String(item.ten || item.name || '');
            const itemUrl = String(item.url || '');
            const isDocLookup = itemUrl.includes('tracuu') || itemUrl.includes('openDocLookupModal') || itemTen.includes('Tra cứu') || itemTen.includes('Văn bản');
            const isHdsd = itemUrl.includes('hdsd') || itemUrl.includes('huong-dan') || itemUrl.includes('openHdsdModal') || itemTen.includes('Hướng dẫn') || itemTen.includes('HDSD');

            if (isDocLookup) {
                return `<li><a href="javascript:void(0)" onclick="openDocLookupModal()"><span class="f-icon">${item.icon || '📜'}</span> <span>${itemTen}</span></a></li>`;
            }
            if (isHdsd) {
                return `<li><a href="javascript:void(0)" onclick="openHdsdModal()"><span class="f-icon">${item.icon || '📖'}</span> <span>${itemTen}</span></a></li>`;
            }
            return `<li><a href="${itemUrl || '#'}" target="_blank" rel="noopener"><span class="f-icon">${item.icon || '🔗'}</span> <span>${itemTen}</span></a></li>`;
        }).join('');
        uls.forEach(ul => { ul.innerHTML = htmlContent; });
    };

    const token = localStorage.getItem('pm_jwt_token');
    let hasValidSession = false;
    try {
        const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
        if (sess && (sess.username || sess.role)) hasValidSession = true;
    } catch(e) {}

    // Chưa đăng nhập: render liên kết mặc định mà không gọi API
    if (!token || !hasValidSession) {
        renderLinks(defaultList);
        return;
    }

    callApi('getQuickLinks', [], links => {
        const list = (links && Array.isArray(links) && links.length) ? links : defaultList;
        renderLinks(list);
        window.renderAdminQuickLinksUI(links);
    }, err => {
        renderLinks(defaultList);
    });
};

window.renderAdminQuickLinksUI = function(links) {
    const container = document.getElementById('admin-quicklinks-list');
    if (!container) return;
    container.innerHTML = '';

    const list = (links && Array.isArray(links) && links.length) ? links : [
        { icon: "📖", ten: "Hướng dẫn sử dụng phần mềm", url: "#" },
        { icon: "📋", ten: "Quy trình Kỹ thuật PHCN", url: "#" },
        { icon: "💰", ten: "Bảng giá Dịch vụ KCB", url: "#" }
    ];

    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'quicklink-admin-item';
        div.style.cssText = 'display: flex; gap: 8px; align-items: center; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1;';
        div.innerHTML = `
            <input type="text" value="${item.icon || '🔗'}" class="ql-icon" placeholder="Icon" style="width: 45px; text-align: center; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
            <input type="text" value="${item.ten || item.name || ''}" class="ql-ten" placeholder="Tên hiển thị" style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
            <input type="text" value="${item.url || '#'}" class="ql-url" placeholder="URL liên kết (http://...)" style="flex: 2; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
            <button type="button" onclick="this.parentElement.remove()" style="background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; font-weight: bold; cursor: pointer;">✕</button>
        `;
        container.appendChild(div);
    });
};

window.addAdminQuickLinkRow = function() {
    const container = document.getElementById('admin-quicklinks-list');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'quicklink-admin-item';
    div.style.cssText = 'display: flex; gap: 8px; align-items: center; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1;';
    div.innerHTML = `
        <input type="text" value="🔗" class="ql-icon" placeholder="Icon" style="width: 45px; text-align: center; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
        <input type="text" value="" class="ql-ten" placeholder="Tên hiển thị" style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
        <input type="text" value="#" class="ql-url" placeholder="URL liên kết (http://...)" style="flex: 2; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
        <button type="button" onclick="this.parentElement.remove()" style="background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; font-weight: bold; cursor: pointer;">✕</button>
    `;
    container.appendChild(div);
};

window.saveAdminQuickLinks = function(btn) {
    const items = document.querySelectorAll('.quicklink-admin-item');
    const links = [];
    items.forEach(el => {
        const icon = el.querySelector('.ql-icon').value.trim() || '🔗';
        const ten = el.querySelector('.ql-ten').value.trim();
        const url = el.querySelector('.ql-url').value.trim() || '#';
        if (ten) {
            links.push({ icon, ten, url });
        }
    });

    callApi('saveQuickLinks', [links], res => {
        showCustomAlert("Thành công", res.message || "Đã lưu danh sách Liên Kết Nhanh!");
        loadQuickLinks();
    }, err => {
        showCustomAlert("Lỗi", "Không thể lưu danh sách liên kết: " + err);
    });
};

// ============================================================
// 🏷️ XỬ LÝ CẤU HÌNH THƯƠNG HIỆU BẢN TRẮNG (WHITE LABEL)
// ============================================================
window.saveWhiteLabelBranding = function() {
    const hosp = document.getElementById('wl-hospital-name')?.value?.trim();
    const brand = document.getElementById('wl-brand-name')?.value?.trim();
    const hotline = document.getElementById('wl-hotline')?.value?.trim();

    if (window.APP_CONFIG) {
        if (hosp) window.APP_CONFIG.HOSPITAL_NAME = hosp;
        if (brand) window.APP_CONFIG.BRAND_NAME = brand;
        if (hotline) window.APP_CONFIG.SUPPORT_HOTLINE = hotline;

        localStorage.setItem('wl_custom_config', JSON.stringify({
            HOSPITAL_NAME: window.APP_CONFIG.HOSPITAL_NAME,
            BRAND_NAME: window.APP_CONFIG.BRAND_NAME,
            SUPPORT_HOTLINE: window.APP_CONFIG.SUPPORT_HOTLINE
        }));

        if (typeof window.applyAppConfig === 'function') window.applyAppConfig();
        showCustomAlert("Thành công", "Đã cập nhật cấu hình thương hiệu đơn vị!");
    }
};

window.loadSavedWhiteLabelBranding = function() {
    const saved = localStorage.getItem('wl_custom_config');
    if (saved && window.APP_CONFIG) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(window.APP_CONFIG, parsed);
        } catch (e) {}
    }
    if (typeof window.applyAppConfig === 'function') window.applyAppConfig();

    // Populate inputs in settings tab
    const hospInput = document.getElementById('wl-hospital-name');
    if (hospInput && window.APP_CONFIG) hospInput.value = window.APP_CONFIG.HOSPITAL_NAME || '';

    const brandInput = document.getElementById('wl-brand-name');
    if (brandInput && window.APP_CONFIG) brandInput.value = window.APP_CONFIG.BRAND_NAME || '';

    const hotlineInput = document.getElementById('wl-hotline');
    if (hotlineInput && window.APP_CONFIG) hotlineInput.value = window.APP_CONFIG.SUPPORT_HOTLINE || '';
};

window.wipeAllDataForNewClient = function() {
    showCustomConfirm(
        "⚠️ XẮC NHẬN XÓA TRẮNG DỮ LIỆU LỊCH",
        "Bạn có chắc chắn muốn XÓA TRẮNG toàn bộ lịch trình và dữ liệu bệnh nhân thử nghiệm để bàn giao cho Khoa/Bệnh viện mới không?\n\nLƯU Ý: Thao tác này sẽ xóa sạch dữ liệu bệnh nhân đang lưu tạm trong máy!",
        function() {
            window.currentScheduleData = [];
            window.lastUnscheduledData = [];
            localStorage.removeItem('cached_schedule_data');
            localStorage.removeItem('cached_unscheduled_data');

            if (typeof renderScheduleTable === 'function') renderScheduleTable([]);
            if (typeof renderSchedPage === 'function') renderSchedPage();
            if (typeof updateUnscheduledStats === 'function') updateUnscheduledStats([]);
            if (typeof renderStats === 'function') renderStats([]);
            showCustomAlert("Đã xóa trắng", "Đã dọn dẹp sạch toàn bộ lịch trình. Hệ thống đã sẵn sàng nạp dữ liệu đơn vị mới!");
        }
    );
};

window.loadDemoSetupData = function() {
    showCustomAlert("Nạp dữ liệu mẫu", "Đã kích hoạt chế độ nạp dữ liệu mẫu thương mại. Bạn có thể sử dụng nút 📂 TẢI FILE LỊCH CŨ hoặc nhập Excel danh mục!");
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.loadSavedWhiteLabelBranding === 'function') {
            window.loadSavedWhiteLabelBranding();
        }
    }, 200);
});

// ==========================================
// DYNAMIC MONTH/YEAR DROPDOWN GENERATOR
// ==========================================
function populateMonthYearDropdown() {
    const select = document.getElementById('pat-date-month-year');
    if (!select) return;
    select.innerHTML = '';
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Generate months for previous year, this year, and next year
    for (let y = currentYear - 1; y <= currentYear + 1; y++) {
        for (let m = 0; m < 12; m++) {
            const mm = String(m + 1).padStart(2, '0');
            const val = `${mm}/${y}`;
            const option = document.createElement('option');
            option.value = val;
            option.textContent = `Tháng ${mm}/${y}`;
            if (y === currentYear && m === currentMonth) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    }
}
window.populateMonthYearDropdown = populateMonthYearDropdown;
