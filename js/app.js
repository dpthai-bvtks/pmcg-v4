// =========================================================
// TURBO CLOUDFLARE API BRIDGE & GLOBAL INITIALIZATION
// =========================================================
window.dataCache = window.dataCache || { pat: [], staff: [], machine: [], room: [], proc: [] };
var dataCache = window.dataCache;

window.google = window.google || {};
window.google.script = window.google.script || {};
window.google.script.run = window.google.script.run || new Proxy({}, {
    get: function (target, prop) {
        if (prop === 'withSuccessHandler') {
            return function (onSuccess) {
                return new Proxy({}, {
                    get: function (t, fnName) {
                        if (fnName === 'withFailureHandler') {
                            return function (onError) {
                                return new Proxy({}, {
                                    get: function (t2, realFnName) {
                                        return function (...args) {
                                            callApi(realFnName, args, onSuccess, onError);
                                        };
                                    }
                                });
                            };
                        }
                        return function (...args) {
                            callApi(fnName, args, onSuccess, null);
                        };
                    }
                });
            };
        }
        if (prop === 'withFailureHandler') {
            return function (onError) {
                return new Proxy({}, {
                    get: function (t, fnName) {
                        return function (...args) {
                            callApi(fnName, args, null, onError);
                        };
                    }
                });
            };
        }
        return function (...args) {
            callApi(prop, args, null, null);
        };
    }
});
var google = window.google;


// =========================================================
// 🛡️ BẢO MẬT DỮ LIỆU (DOMPURIFY) & 🔍 TÌM KIẾM MỜ (FUSE.JS)
// =========================================================
function sanitizeInput(dirty) {
    if (!dirty) return '';
    if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
        return DOMPurify.sanitize(String(dirty), {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br', 'mark'],
            ALLOWED_ATTR: ['style', 'class', 'title']
        });
    }
    return String(dirty).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}
window.sanitizeInput = sanitizeInput;

function removeVietnameseTones(str) {
    if (!str) return '';
    return String(str)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .trim()
        .toLowerCase();
}
window.removeVietnameseTones = removeVietnameseTones;

function fuzzySearchList(list, query, keys = ['tenBN', 'phong', 'nvChinh', 'nvPhu', 'thuThuat', 'may', 'giuong', 'namSinh']) {
    if (!query || !list || !list.length) return list;
    const cleanQuery = String(query).trim();
    if (!cleanQuery) return list;

    const qNoTone = removeVietnameseTones(cleanQuery);
    const tokens = qNoTone.split(/\s+/).filter(Boolean);
    if (!tokens.length) return list;

    return list.filter(row => {
        if (!row) return false;
        // Trích xuất toàn bộ trường dữ liệu của dòng thành 1 chuỗi không dấu
        const rowValues = keys.map(k => String(row[k] || '')).join(' ');
        const rowNoTone = removeVietnameseTones(rowValues);

        // Mọi từ khóa người dùng gõ vào đều phải xuất hiện trong dòng
        return tokens.every(tok => rowNoTone.includes(tok));
    });
}
window.fuzzySearchList = fuzzySearchList;

// =========================================================
// 🛡️ DATA VALIDATION SCHEMAS (ZOD ENGINE)
// =========================================================
(function initMedicalSchemas() {
    try {
        const _z = (typeof Zod !== 'undefined' && Zod.z) ? Zod.z : (typeof z !== 'undefined' ? z : null);
        if (_z) {
            window.MedicalSchemas = {
                patient: _z.object({
                    ten: _z.string().min(1, 'Tên bệnh nhân không được để trống'),
                    namSinh: _z.union([_z.string(), _z.number()]).optional(),
                    phong: _z.string().optional(),
                    giuong: _z.string().optional(),
                    thuThuat: _z.union([_z.string(), _z.array(_z.any())]).optional()
                }),
                scheduleRow: _z.object({
                    tenBN: _z.string().min(1, 'Tên bệnh nhân không được để trống'),
                    thuThuat: _z.string().min(1, 'Thủ thuật không được để trống'),
                    gioDienRa: _z.string().regex(/^\d{1,2}:\d{2}$/, 'Giờ bắt đầu không hợp lệ (HH:MM)'),
                    gioKetThuc: _z.string().regex(/^\d{1,2}:\d{2}$/, 'Giờ kết thúc không hợp lệ (HH:MM)'),
                    phong: _z.string().optional(),
                    nvChinh: _z.string().optional(),
                    may: _z.string().optional()
                }),
                validatePatient: function (data) {
                    return this.patient.safeParse(data);
                },
                validateScheduleRow: function (data) {
                    return this.scheduleRow.safeParse(data);
                }
            };
        }
    } catch (e) {
        console.warn('Lỗi khởi tạo Zod schemas:', e);
    }
})();

// =========================================================
// GLOBAL HELPERS & DUAL-MODE TABLE REORDERING ENGINE
// =========================================================
function withLock(fn) {
    let locked = false;
    return function (...args) {
        if (locked) {
            console.warn('[withLock]: Thao tác đang được xử lý, vui lòng chờ...');
            return;
        }
        locked = true;
        try {
            const res = fn.apply(this, args);
            if (res && typeof res.then === 'function') {
                return res.finally(() => { locked = false; });
            }
            setTimeout(() => { locked = false; }, 300);
            return res;
        } catch (e) {
            locked = false;
            throw e;
        }
    };
}
window.withLock = withLock;

window.moveRowUp = function (type, index) {
    let arr = null;
    let renderFn = null;
    if (type === 'staff') { arr = dataCache.staff; renderFn = renderStaffTable; }
    else if (type === 'machines') { arr = dataCache.machine; renderFn = renderMachinesTable; }
    else if (type === 'procedures') { arr = dataCache.proc; renderFn = renderProceduresTable; }
    else if (type === 'protocols') { arr = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : null; renderFn = renderProtocolsTable; }
    else if (type === 'rooms') { arr = dataCache.room; renderFn = renderRoomsTable; }

    if (!arr || index <= 0 || index >= arr.length) return;
    const item = arr.splice(index, 1)[0];
    arr.splice(index - 1, 0, item);
    if (typeof renderFn === 'function') renderFn();
    if (type === 'protocols') { saveProtocolsData(arr); } else { saveReorderedData(type, arr); }
};

window.moveRowDown = function (type, index) {
    let arr = null;
    let renderFn = null;
    if (type === 'staff') { arr = dataCache.staff; renderFn = renderStaffTable; }
    else if (type === 'machines') { arr = dataCache.machine; renderFn = renderMachinesTable; }
    else if (type === 'procedures') { arr = dataCache.proc; renderFn = renderProceduresTable; }
    else if (type === 'protocols') { arr = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : null; renderFn = renderProtocolsTable; }
    else if (type === 'rooms') { arr = dataCache.room; renderFn = renderRoomsTable; }

    if (!arr || index < 0 || index >= arr.length - 1) return;
    const item = arr.splice(index, 1)[0];
    arr.splice(index + 1, 0, item);
    if (typeof renderFn === 'function') renderFn();
    if (type === 'protocols') { saveProtocolsData(arr); } else { saveReorderedData(type, arr); }
};

window.renderSttOrderControl = function (type, i, total) {
    return `<div class="stt-order-cell" style="display:inline-flex; align-items:center; justify-content:center; gap:5px;">
        <span class="drag-handle-btn" title="Bấm giữ kéo thả ☰ để sắp xếp thứ tự" style="cursor:grab; user-select:none; font-size:14px; color:#475569; padding:2px 4px; border-radius:4px; transition:background 0.2s;">☰</span>
        <span style="font-weight:700; min-width:18px; text-align:center;">${i + 1}</span>
    </div>`;
};

let _isDraggingRow = false;
window._isDraggingRow = false;

function saveReorderedData(type, list) {
    try {
        localStorage.setItem('times_' + type + '_order', JSON.stringify(list.map(x => x.ten || x.name || x.maMay || x.tenPhong)));
    } catch (e) { }
    callApi('saveReorderedData', [type, list], res => {
        console.log(`[Reorder]: Đã đồng bộ thứ tự ${type} lên Cloudflare D1!`);
    }, err => {
        console.warn('[Reorder] Lỗi đồng bộ:', err);
    });
}

function initTableDragAndDrop(tbodyId, arrayRef, onReorderFinish) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (typeof Sortable !== 'undefined') {
        if (tbody._sortableInstance) {
            try { tbody._sortableInstance.destroy(); } catch(e){}
        }
        tbody._sortableInstance = new Sortable(tbody, {
            animation: 180,
            handle: '.drag-handle-btn',
            draggable: 'tr',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            forceFallback: false,
            onStart: function () {
                window._isDraggingRow = true;
            },
            onEnd: function (evt) {
                setTimeout(() => { window._isDraggingRow = false; }, 300);
                if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
                    const item = arrayRef.splice(evt.oldIndex, 1)[0];
                    arrayRef.splice(evt.newIndex, 0, item);
                    if (typeof onReorderFinish === 'function') {
                        onReorderFinish(arrayRef);
                    }
                }
            }
        });
        return;
    }
}

/* ==========================================
   T.I.M.E.S SYSTEM - CORE APPLICATION LOGIC
   ========================================== */

window.showGlobalLoading = function (text) {

            let overlay = document.getElementById('global-loading-overlay');

            if (!overlay) {

                overlay = document.createElement('div');

                overlay.id = 'global-loading-overlay';

                overlay.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999999; flex-direction:column; justify-content:center; align-items:center; color:white; font-size:18px; font-weight:bold; backdrop-filter: blur(2px);';

                overlay.innerHTML = '<div style="border:4px solid rgba(255,255,255,0.3); border-top:4px solid #fff; border-radius:50%; width:40px; height:40px; animation:spin 1s linear infinite; margin-bottom:15px;"></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style><span id="global-loading-text"></span>';

                document.body.appendChild(overlay);

            }

            document.getElementById('global-loading-text').innerText = text || 'Đang xử lý...';

            overlay.style.display = 'flex';

        };

        window.hideGlobalLoading = function () {

            const overlay = document.getElementById('global-loading-overlay');

            if (overlay) overlay.style.display = 'none';

        };

        window.showToast = function (message, type = 'success', duration = 3500) {
            let container = document.getElementById('global-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'global-toast-container';
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
            const toast = document.createElement('div');
            toast.className = `toast-card ${type}`;
            let icon = '🔔';
            if (type === 'success') icon = '✅';
            else if (type === 'error') icon = '❌';
            else if (type === 'info') icon = 'ℹ️';
            toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
            container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 50);
            setTimeout(() => {
                toast.classList.remove('show');
                toast.classList.add('hide');
                setTimeout(() => toast.remove(), 450);
            }, duration);
        };

        // Check for pending success toast on reload
        if (sessionStorage.getItem('sync_success_toast') === 'true') {
            sessionStorage.removeItem('sync_success_toast');
            setTimeout(() => {
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('Đồng bộ thành công', 'Hệ thống đã nạp và làm sạch toàn bộ dữ liệu từ Google Sheets thành công!', '🎉', '#27ae60');
                } else {
                    alert('✅ Đồng bộ thành công!');
                }
            }, 600);
        }

        // Check for pending chot so success toast on reload
        if (sessionStorage.getItem('chot_so_success_toast') === 'true') {
            sessionStorage.removeItem('chot_so_success_toast');
            setTimeout(() => {
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('Chốt sổ thành công', 'Hệ thống đã chốt sổ và tự động cập nhật dữ liệu mới thành công!', '🎉', '#27ae60');
                } else {
                    alert('✅ Chốt sổ thành công!');
                }
            }, 600);
        }

        window.onerror = function (msg, url, lineNo, columnNo, error) {
            // Bỏ qua lỗi cross-origin (Script error. dòng 0) từ CDN/extension/JSONP
            if (msg === 'Script error.' || lineNo === 0 || !lineNo) {
                console.warn('[Notice] Bỏ qua thông báo cross-origin script:', msg);
                return true;
            }
            console.error('JS ERROR:', msg, 'at', url, 'line', lineNo, error);
            return false;
        };

        window.addEventListener('unhandledrejection', function (event) {
            console.warn('[Unhandled Rejection]:', event.reason);
        });

        console.log('MAIN SCRIPT STARTING...');

        function formatSlotDisplay(slot) {
            if (!slot || typeof slot !== 'string' || !slot.includes('-')) return slot;
            const parts = slot.split('-');
            if (parts.length === 2) {
                const start = parts[0].trim();
                const end = parts[1].trim();
                if (start === end) return start;
                
                const sParts = start.split(':');
                const eParts = end.split(':');
                if (sParts.length === 2 && eParts.length === 2) {
                    const sMin = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);
                    const eMin = parseInt(eParts[0], 10) * 60 + parseInt(eParts[1], 10);
                    if (eMin - sMin <= 1 && eMin >= sMin) {
                        return start;
                    }
                }
            }
            return slot;
        }

        // ============================================================
        // GITHUB PAGES API CONFIGURATION (SELF-HEALING)
        // ============================================================
        const DEFAULT_API_URL = 'https://pmcg-api.dpthai-ttytmk.workers.dev';
        const SECONDARY_BACKUP_URL = (localStorage.getItem('times_backup_api_url') || '').trim();
        window._serverMode = 'primary'; // 'primary' | 'backup' | 'offline'
        let _consecutiveApiErrors = 0;

        function updateServerStatusBadge(mode) {
            window._serverMode = mode;
            const badge = document.getElementById('server-status-badge');
            if (!badge) return;
            if (mode === 'primary') {
                badge.style.background = '#27ae60'; badge.innerText = '🟢 Cloudflare Main';
            } else if (mode === 'backup') {
                badge.style.background = '#f39c12'; badge.innerText = '🟡 Google Sheets Backup';
            } else {
                badge.style.background = '#e74c3c'; badge.innerText = '⚡️ Mode Ngoại Tuyến';
            }
        }
        window.updateServerStatusBadge = updateServerStatusBadge;

        function getApiUrl() {
            const backupUrl = (localStorage.getItem('times_backup_api_url') || '').trim();
            if (window._serverMode === 'backup' && backupUrl) {
                return backupUrl;
            }
            let customUrl = (localStorage.getItem('times_custom_api_url') || '').trim();
            if (customUrl.includes('script.google.com') || customUrl.includes('google.com/macros')) {
                localStorage.removeItem('times_custom_api_url');
                customUrl = '';
            }
            return customUrl || DEFAULT_API_URL;
        }
        window.getApiUrl = getApiUrl;

        window.setCustomApiUrl = function(newUrl) {
            if (!newUrl || newUrl.trim() === '' || newUrl.trim() === DEFAULT_API_URL) {
                localStorage.removeItem('times_custom_api_url');
            } else {
                localStorage.setItem('times_custom_api_url', newUrl.trim());
            }
        };


        window.toggleEmergencyBackupMenu = function() {
            const current = window._serverMode || 'primary';
            const msg = `Trạng thái máy chủ hiện tại: ${current === 'primary' ? '🟢 Cloudflare Main (Chính)' : (current === 'backup' ? '🟡 Google Sheets Backup (Dự phòng)' : '⚡️ Ngoại tuyến')}\n\nNhập 1: Kết nối lại Cloudflare Main\nNhập 2: Xuất file dự phòng khẩn cấp (.json)\nNhập 3: Nhập URL Google Apps Script dự phòng\nNhập 4: 🔄 Đồng bộ toàn bộ dữ liệu & Lịch sử D1 sang Google Sheets ngay`;
            const choice = prompt(msg);
            if (choice === '1') {
                _consecutiveApiErrors = 0;
                updateServerStatusBadge('primary');
                alert('Đã kết nối lại Máy chủ chính Cloudflare Main!');
            } else if (choice === '2') {
                if (window.OfflineSyncEngine) window.OfflineSyncEngine.exportEmergencyBackupData();
            } else if (choice === '3') {
                const url = prompt('Nhập URL Google Apps Script WebApp dự phòng (Dạng: https://script.google.com/macros/s/.../exec):');
                if (url && url.trim()) {
                    localStorage.setItem('times_backup_api_url', url.trim());
                    if (typeof callApi === 'function') {
                        callApi('saveSystemSettings', ['gdrive_webhook_url', url.trim()]);
                    }
                    alert('Đã lưu URL máy chủ dự phòng Google Apps Script!');
                }
            } else if (choice === '4') {
                window.syncAllD1DataToBackupSheets();
            }
        };


        
        window.syncAllD1DataToBackupSheets = async function() {
            let backupUrl = (localStorage.getItem('times_backup_api_url') || '').trim();
            if (!backupUrl) {
                backupUrl = prompt('Vui lòng nhập URL Google Apps Script WebApp dự phòng (Dạng: https://script.google.com/macros/s/.../exec):');
                if (backupUrl && backupUrl.trim()) {
                    localStorage.setItem('times_backup_api_url', backupUrl.trim());
                } else {
                    return alert('Vui lòng cung cấp URL Google Apps Script để đồng bộ!');
                }
            }

            backupUrl = backupUrl.trim();
            if (backupUrl.endsWith('/edit') || backupUrl.includes('/edit?') || backupUrl.includes('drive.google.com')) {
                const fixUrl = prompt('URL bạn nhập có vẻ là link chỉnh sửa script hoặc link thư mục Drive, không phải link Web App kết thúc bằng /exec.\nVui lòng nhập lại URL Google Apps Script WebApp:', backupUrl.replace(/\/edit.*$/, '/exec'));
                if (fixUrl && fixUrl.trim()) {
                    backupUrl = fixUrl.trim();
                    localStorage.setItem('times_backup_api_url', backupUrl);
                } else {
                    return;
                }
            }

            let modal = document.getElementById('sync-progress-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'sync-progress-modal';
                modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px);';
                modal.innerHTML = `
                <div style="background:#fff; width:520px; max-width:92%; border-radius:12px; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.3); text-align:center; font-family:sans-serif;">
                    <div style="font-size:36px; margin-bottom:10px;">🔄</div>
                    <h3 style="margin:0 0 10px 0; color:#2c3e50; font-size:18px;">Đồng bộ Trọn bộ CSDL Cloudflare D1 ➔ Google Sheets</h3>
                    <p id="sync-step-text" style="color:#7f8c8d; font-size:13px; margin:0 0 16px 0; line-height:1.5;">Đang khởi tạo kết nối...</p>
                    <div style="background:#ecf0f1; border-radius:10px; height:16px; overflow:hidden; margin-bottom:16px; position:relative;">
                        <div id="sync-progress-bar" style="background:linear-gradient(90deg, #27ae60, #2ecc71); width:5%; height:100%; transition:width 0.3s ease; border-radius:10px;"></div>
                    </div>
                    <div id="sync-percentage" style="font-size:14px; font-weight:bold; color:#27ae60;">5%</div>
                    <button id="sync-close-btn" style="display:none; margin-top:16px; padding:10px 24px; background:#27ae60; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;" onclick="document.getElementById('sync-progress-modal').style.display='none'">Hoàn tất / Đóng</button>
                </div>`;
                document.body.appendChild(modal);
            }
            modal.style.display = 'flex';
            const stepText = document.getElementById('sync-step-text');
            const progressBar = document.getElementById('sync-progress-bar');
            const percentText = document.getElementById('sync-percentage');
            const closeBtn = document.getElementById('sync-close-btn');
            closeBtn.style.display = 'none';

            function updateProgress(percent, text) {
                if (progressBar) progressBar.style.width = percent + '%';
                if (percentText) percentText.innerText = percent + '%';
                if (stepText) stepText.innerText = text;
            }

            try {
                updateProgress(15, '[1/4] 📡 Đang xuất trọn bộ CSDL & Lịch Sử từ Cloudflare D1...');
                
                let dbPayload = null;
                try {
                    const respExport = await fetch(DEFAULT_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'exportDatabase', args: [] })
                    });
                    const resExport = await respExport.json();
                    if (resExport && resExport.status === 'success' && resExport.data) {
                        const d = resExport.data;
                        dbPayload = {
                            benh_nhan: d.pat || [],
                            nhan_su: d.staff || [],
                            may_moc: d.machines || [],
                            phong: d.rooms || [],
                            thu_thuat: d.procedures || [],
                            lich_trinh: d.schedule || [],
                            lich_su: d.history || [],
                            tai_khoan: d.accounts || [],
                            cham_cong: d.chamCong || [],
                            thong_ke: d.thongKe || [],
                            cai_dat: d.caiDat || []
                        };
                    }
                } catch(e) { console.warn('Could not fetch exportDatabase from D1, fallback to local cache:', e); }

                const cache = window.dataCache || {};

                updateProgress(45, '[2/4] 📦 Đóng gói trọn bộ các bảng dữ liệu...');
                await new Promise(r => setTimeout(r, 200));

                const payload = dbPayload || {
                    benh_nhan: cache.pat || [],
                    nhan_su: cache.staff || [],
                    may_moc: cache.machines || [],
                    phong: cache.rooms || [],
                    thu_thuat: cache.procedures || [],
                    lich_trinh: cache.schedule || window.currentScheduleData || [],
                    lich_su: cache.history || [],
                    tai_khoan: JSON.parse(localStorage.getItem('times_accounts_cache') || '[]'),
                    cham_cong: localStorage.getItem('pmcg_cham_cong_data') || '',
                    thong_ke: localStorage.getItem('pmcg_thong_ke_cache') || '',
                    cai_dat: localStorage.getItem('times_settings_cache') || ''
                };

                updateProgress(75, '[3/4] 📤 Truyền dữ liệu sang Google Apps Script...');

                const resp = await fetch(backupUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ action: 'saveBootstrapBackup', args: [payload] })
                });

                const rawText = await resp.text();
                let res;
                try {
                    res = JSON.parse(rawText);
                } catch (parseErr) {
                    if (rawText.includes('<!DOCTYPE') || rawText.includes('<html') || rawText.includes('ServiceLogin')) {
                        throw new Error("Google Apps Script WebApp chưa cấp quyền công khai. Vui lòng vào Apps Script -> Deploy -> Manage deployments -> Chọn 'Anyone' tại 'Who has access', hoặc kiểm tra URL kết thúc bằng /exec.");
                    } else {
                        throw new Error("Phản hồi không hợp lệ từ Apps Script: " + rawText.slice(0, 120));
                    }
                }

                if (res && res.status === 'success') {
                    updateProgress(100, '✅ Đồng bộ hoàn tất 100%! Đã lưu trọn bộ tất cả các trang Bệnh nhân, Nhân sự, Máy móc, Phòng, Thủ thuật, Lịch trình, Lịch sử, Tài khoản vào Google Sheets!');
                    if (percentText) percentText.innerHTML = '<span style="color:#27ae60">🎉 ĐỒNG BỘ TRỌN BỘ THÀNH CÔNG!</span>';
                } else {
                    updateProgress(100, '⚠️ Kết quả: ' + (res.error || res.data || res.message || 'Đã gửi'));
                }
                closeBtn.style.display = 'inline-block';
            } catch (err) {
                updateProgress(100, '❌ Lỗi kết nối Google Apps Script dự phòng: ' + err.message);
                if (percentText) percentText.innerHTML = '<span style="color:#e74c3c">❌ LỖI ĐỒNG BỘ</span>';
                closeBtn.style.display = 'inline-block';
            }
        };
        // =========================================================
// TURBO CLOUDFLARE API BRIDGE & GLOBAL INITIALIZATION
// =========================================================
window.dataCache = window.dataCache || { pat: [], staff: [], machine: [], room: [], proc: [] };
var dataCache = window.dataCache;

window.google = window.google || {};
window.google.script = window.google.script || {};
window.google.script.run = window.google.script.run || new Proxy({}, {
    get: function (target, prop) {
        if (prop === 'withSuccessHandler') {
            return function (onSuccess) {
                return new Proxy({}, {
                    get: function (t, fnName) {
                        if (fnName === 'withFailureHandler') {
                            return function (onError) {
                                return new Proxy({}, {
                                    get: function (t2, realFnName) {
                                        return function (...args) {
                                            callApi(realFnName, args, onSuccess, onError);
                                        };
                                    }
                                });
                            };
                        }
                        return function (...args) {
                            callApi(fnName, args, onSuccess, null);
                        };
                    }
                });
            };
        }
        if (prop === 'withFailureHandler') {
            return function (onError) {
                return new Proxy({}, {
                    get: function (t, fnName) {
                        return function (...args) {
                            callApi(fnName, args, null, onError);
                        };
                    }
                });
            };
        }
        return function (...args) {
            callApi(prop, args, null, null);
        };
    }
});
var google = window.google;


// =========================================================
// GLOBAL HELPERS & DUAL-MODE TABLE REORDERING ENGINE
// =========================================================
function withLock(fn) {
    let locked = false;
    return function (...args) {
        if (locked) {
            console.warn('[withLock]: Thao tác đang được xử lý, vui lòng chờ...');
            return;
        }
        locked = true;
        try {
            const res = fn.apply(this, args);
            if (res && typeof res.then === 'function') {
                return res.finally(() => { locked = false; });
            }
            setTimeout(() => { locked = false; }, 300);
            return res;
        } catch (e) {
            locked = false;
            throw e;
        }
    };
}
window.withLock = withLock;

window.moveRowUp = function (type, index) {
    let arr = null;
    let renderFn = null;
    if (type === 'staff') { arr = dataCache.staff; renderFn = renderStaffTable; }
    else if (type === 'machines') { arr = dataCache.machine; renderFn = renderMachinesTable; }
    else if (type === 'procedures') { arr = dataCache.proc; renderFn = renderProceduresTable; }
    else if (type === 'rooms') { arr = dataCache.room; renderFn = renderRoomsTable; }

    if (!arr || index <= 0 || index >= arr.length) return;
    const item = arr.splice(index, 1)[0];
    arr.splice(index - 1, 0, item);
    if (typeof renderFn === 'function') renderFn();
    saveReorderedData(type, arr);
};

window.moveRowDown = function (type, index) {
    let arr = null;
    let renderFn = null;
    if (type === 'staff') { arr = dataCache.staff; renderFn = renderStaffTable; }
    else if (type === 'machines') { arr = dataCache.machine; renderFn = renderMachinesTable; }
    else if (type === 'procedures') { arr = dataCache.proc; renderFn = renderProceduresTable; }
    else if (type === 'rooms') { arr = dataCache.room; renderFn = renderRoomsTable; }

    if (!arr || index < 0 || index >= arr.length - 1) return;
    const item = arr.splice(index, 1)[0];
    arr.splice(index + 1, 0, item);
    if (typeof renderFn === 'function') renderFn();
    saveReorderedData(type, arr);
};

window.renderSttOrderControl = function (type, i, total) {
    return `<div class="stt-order-cell" style="display:inline-flex; align-items:center; justify-content:center; gap:5px;">
        <span class="drag-handle-btn" title="Bấm giữ kéo thả ☰ để sắp xếp thứ tự" style="cursor:grab; user-select:none; font-size:14px; color:#475569; padding:2px 4px; border-radius:4px; transition:background 0.2s;">☰</span>
        <span style="font-weight:700; min-width:18px; text-align:center;">${i + 1}</span>
    </div>`;
};

// ============================================================
        // GITHUB PAGES API CONFIGURATION (SELF-HEALING)
        // ============================================================
        // ============================================================
        // DUAL-ENGINE HIGH-PERFORMANCE API DISPATCHER (FETCH + JSONP + DEDUPLICATION)
        // ============================================================
        
        // ============================================================
        // GITHUB PAGES API CONFIGURATION (SELF-HEALING)
        // ============================================================
        
        // ============================================================
        // GITHUB PAGES API CONFIGURATION (SELF-HEALING)
        // ============================================================
        const MAX_CONCURRENT_API_REQUESTS = 3;
        let activeApiRequests = 0;
        let apiQueue = [];
        let mutationCount = 0;
        const inFlightRequests = new Map();

        function checkMutationLoading() {
            if (mutationCount > 0) {
                if (window.showGlobalLoading) window.showGlobalLoading("Đang xử lý dữ liệu...");
            } else {
                if (window.hideGlobalLoading) window.hideGlobalLoading();
            }
        }

        
        async function executeApiTask(task) {
            const { functionName, args, onSuccess, onError, isMutation, retries = 0 } = task;
            activeApiRequests++;

            const finish = () => {
                activeApiRequests--;
                if (isMutation) {
                    mutationCount = Math.max(0, mutationCount - 1);
                    checkMutationLoading();
                }
                setTimeout(scheduleNextApiRequest, 20);
            };

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                const currentUnit = localStorage.getItem('pm_unit_code') || 'bvtks_cs2';

                const response = await fetch(getApiUrl(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-unit-code': currentUnit
                    },
                    body: JSON.stringify({
                        action: functionName,
                        args: args || [],
                        unit_code: currentUnit
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const rawText = await response.text();
                finish();

                let result;
                try {
                    result = JSON.parse(rawText);
                } catch (parseErr) {
                    if (rawText.includes('<!DOCTYPE') || rawText.includes('<html') || rawText.includes('ServiceLogin')) {
                        const errMsg = "Máy chủ trả về trang HTML thay vì JSON. Nếu dùng Google Apps Script dự phòng, vui lòng cấp quyền 'Anyone' (Bất kỳ ai) khi Deploy Web App.";
                        if (onError) onError(errMsg);
                        else alert('Lỗi: ' + errMsg);
                        return;
                    }
                    throw parseErr;
                }

                if (result && result.status === 'success') {
                    _consecutiveApiErrors = 0;
                    if (onSuccess) {
                        try { onSuccess(result.data); } catch(e) { console.error(`Error in onSuccess for ${functionName}:`, e); }
                    }
                } else {
                    const errMsg = (result && result.error) ? result.error : 'Lỗi không xác định từ máy chủ.';
                    if (onError) onError(errMsg);
                    else alert('Lỗi: ' + errMsg);
                }
            } catch (err) {
                console.warn(`[Cloudflare API Error] ${functionName}:`, err);
                finish();
                if (onError) onError(err.message || 'Lỗi kết nối máy chủ Cloudflare');
                else console.error(err);
            }
        }

        function executeJsonpFallback(task, onFinish) {
            const { functionName, args, onSuccess, onError, retries = 0 } = task;
            const callbackName = 'jsonp_times_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
            const script = document.createElement('script');
            const params = new URLSearchParams({
                action: functionName,
                args: JSON.stringify(args),
                callback: callbackName
            });
            script.src = getApiUrl() + '?' + params.toString();
            script.async = true;
            script.crossOrigin = 'anonymous';

            let isFinished = false;

            const cleanup = () => {
                if (isFinished) return;
                isFinished = true;
                delete window[callbackName];
                if (script.parentNode) script.parentNode.removeChild(script);
                if (onFinish) onFinish();
            };

            let timeoutTimer = setTimeout(() => {
                if (isFinished) return;
                console.warn(`[API Timeout] ${functionName} timed out (attempt ${retries + 1})`);
                if (retries < 1) {
                    cleanup();
                    setTimeout(() => {
                        apiQueue.push({ ...task, retries: retries + 1 });
                        scheduleNextApiRequest();
                    }, 1000);
                } else {
                    cleanup();
                    const errMsg = `Quá thời gian kết nối máy chủ (${functionName}).`;
                    if (onError) onError(errMsg);
                    else console.error(errMsg);
                }
            }, 30000);

            window[callbackName] = function (result) {
                clearTimeout(timeoutTimer);
                if (isFinished) return;
                cleanup();

                if (result && result.status === 'success') {
                    if (task && task.isMutation) {
                        try {
                            if (window.OfflineSyncEngine && typeof window.OfflineSyncEngine.broadcastLiveEvent === 'function') {
                                window.OfflineSyncEngine.broadcastLiveEvent('CACHE_UPDATED', { functionName, timestamp: Date.now() });
                            }
                        } catch(e) {}
                    }
                    if (onSuccess) {
                        try { onSuccess(result.data); } catch(e) { console.error(`Error in onSuccess handler for ${functionName}:`, e); }
                    }
                } else {
                    const errMsg = (result && result.error) ? result.error : 'Lỗi không xác định từ máy chủ.';
                    if (onError) onError(errMsg);
                    else alert('Lỗi: ' + errMsg);
                }
            };

            script.onerror = function () {
                clearTimeout(timeoutTimer);
                if (isFinished) return;
                console.warn(`[API Script Error] ${functionName} failed to load (attempt ${retries + 1})`);
                if (retries < 1) {
                    cleanup();
                    setTimeout(() => {
                        apiQueue.push({ ...task, retries: retries + 1 });
                        scheduleNextApiRequest();
                    }, 1000);
                } else {
                    cleanup();
                    const errMsg = `Không thể kết nối đến máy chủ (${functionName}).`;
                    if (onError) onError(errMsg);
                    else console.error(errMsg);
                }
            };

            document.head.appendChild(script);
        }

        function scheduleNextApiRequest() {
            if (activeApiRequests >= MAX_CONCURRENT_API_REQUESTS || apiQueue.length === 0) return;
            const nextTask = apiQueue.shift();
            executeApiTask(nextTask);
        }

        function callApi(functionName, args, onSuccess, onError) {
            const isSilentMutation = functionName === 'saveChamCong' || functionName === 'saveReorderedData' || functionName === 'saveReorder'
                || functionName === 'editBenhNhan' || functionName === 'editNhanSu' || functionName === 'editMayMoc' || functionName === 'editThuThuat' || functionName === 'editPhong';
            const isMutation = functionName.startsWith('add') || functionName.startsWith('edit') || functionName.startsWith('delete') || functionName.startsWith('bulkUpdate') || functionName.startsWith('save') || functionName.startsWith('chotSo') || functionName.startsWith('runScheduling') || functionName.startsWith('chuyenNgayMoi');
            
            // In-flight deduplication for non-mutation queries (getSchedule, getSystemSettings, getDataVersion...)
            if (!isMutation) {
                const reqKey = functionName + ':' + JSON.stringify(args || []);
                if (inFlightRequests.has(reqKey)) {
                    inFlightRequests.get(reqKey).then(
                        data => { if (onSuccess) onSuccess(data); },
                        err => { if (onError) onError(err); }
                    );
                    return;
                }

                let resolveInFlight, rejectInFlight;
                const inFlightPromise = new Promise((res, rej) => {
                    resolveInFlight = res;
                    rejectInFlight = rej;
                });
                inFlightRequests.set(reqKey, inFlightPromise);

                const origOnSuccess = onSuccess;
                const origOnError = onError;

                onSuccess = (data) => {
                    inFlightRequests.delete(reqKey);
                    resolveInFlight(data);
                    if (origOnSuccess) origOnSuccess(data);
                };

                onError = (err) => {
                    inFlightRequests.delete(reqKey);
                    rejectInFlight(err);
                    if (origOnError) origOnError(err);
                };
            }

            const shouldShowLoading = isMutation && !isSilentMutation;
            if (shouldShowLoading) {
                mutationCount++;
                checkMutationLoading();
            }

            const task = { functionName, args: args || [], onSuccess, onError, isMutation: shouldShowLoading, retries: 0 };
            apiQueue.push(task);
            scheduleNextApiRequest();
        }

        function escapeHtml(string) {
            if (string === null || string === undefined) return '';
            const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
                "`": "&#x60;"
            };
            return String(string).replace(/[&<>"'`]/g, s => map[s]);
        }




        window.google = window.google || {};

        window.google.script = window.google.script || {};

        window.google.script.run = new Proxy({}, {

            get: function (target, prop) {

                if (prop === 'withSuccessHandler') {

                    return function (successCallback) {

                        return new Proxy({}, {

                            get: function (target2, prop2) {

                                if (prop2 === 'withFailureHandler') {

                                    return function (errorCallback) {

                                        return new Proxy({}, {

                                            get: function (target3, methodName) {

                                                return function (...args) {

                                                    callApi(methodName, args, successCallback, errorCallback);

                                                };

                                            }

                                        });

                                    };

                                }

                                return function (...args) {

                                    callApi(prop2, args, successCallback, null);

                                };

                            }

                        });

                    };

                }

                if (prop === 'withFailureHandler') {

                    return function (errorCallback) {

                        return new Proxy({}, {

                            get: function (target2, prop2) {

                                if (prop2 === 'withSuccessHandler') {

                                    return function (successCallback) {

                                        return new Proxy({}, {

                                            get: function (target3, methodName) {

                                                return function (...args) {

                                                    callApi(methodName, args, successCallback, errorCallback);

                                                };

                                            }

                                        });

                                    };

                                }

                                return function (...args) {

                                    callApi(prop2, args, null, errorCallback);

                                };

                            }

                        });

                    };

                }

                return function (...args) {

                    callApi(prop, args, null, null);

                };

            }

        });











        // --- AUTH CODE MOVED TO TOP ---

        // ============================================================

        let adminAccCache = [];



        // --- Block Merged ---



        console.log('--- JS Block: Auth & Permissions started ---');

        window.doLogin = function () {
            const unit = (document.getElementById('login-unit')?.value || '').trim().toLowerCase() || 'bvtks_cs2';
            const user = (document.getElementById('login-user')?.value || '').trim();
            const pass = (document.getElementById('login-pass')?.value || '').trim();
            const errDiv = document.getElementById('login-error');
            const btn = document.getElementById('btn-do-login');

            if (!user || !pass) {
                if (errDiv) {
                    errDiv.innerText = "Vui lòng nhập đầy đủ mã đơn vị, tên đăng nhập và mật khẩu!";
                    errDiv.style.display = "block";
                }
                return;
            }

            if (btn) { btn.innerText = "⏳ Đang kiểm tra..."; btn.disabled = true; }
            if (errDiv) errDiv.style.display = "none";

            localStorage.setItem('pm_unit_code', unit);

            const resetBtn = () => {
                if (btn) { btn.innerText = "Đăng Nhập ➔"; btn.disabled = false; }
            };

            const handleSuccess = res => {
                resetBtn();
                if (res && (res.username || res.role || res.success)) {
                    const uName = res.username || user || 'admin';
                    const uRole = res.role || 'Admin';
                    const uPerms = res.permissions || 'all';
                    const uUnit = res.unit_code || unit;
                    const uUnitName = res.unit_name || 'Bệnh viện Than - Khoáng sản Cơ sở 2';

                    localStorage.setItem('pm_unit_code', uUnit);
                    localStorage.setItem('pm_unit_name', uUnitName);
                    localStorage.setItem('meds_session', JSON.stringify({
                        username: uName,
                        role: uRole,
                        permissions: uPerms,
                        unit_code: uUnit,
                        unit_name: uUnitName,
                        plan_tier: res.plan_tier || 'PRO',
                        sessionId: 'sess_' + Date.now()
                    }));

                    // Dynamic Brand Header Update
                    if (typeof window.updateAppHeader === 'function') {
                        window.updateAppHeader(uUnit, uRole);
                    }
                    document.title = 'T.I.M.E.S System - Phần mềm xếp lịch thủ thuật thông minh';

                    // Super Admin UI handling
                    if (uRole === 'SUPER_ADMIN') {
                        const superTab = document.getElementById('nav-tab-tenants');
                        if (superTab) superTab.style.display = 'flex';
                        if (typeof loadTenantsList === 'function') loadTenantsList();
                    }

                    const overlay = document.getElementById('login-overlay');
                    if (overlay) overlay.style.display = 'none';

                    document.querySelectorAll('.app-user-name').forEach(el => el.innerText = uName);
                    document.querySelectorAll('.app-user-role').forEach(el => el.innerText = uRole);
                    if (typeof applyPermissions === 'function') applyPermissions(uRole, uPerms);
                    if (typeof updateLogoutButton === 'function') updateLogoutButton(uName);
                    if (typeof updateLogoutButton === 'function') updateLogoutButton(uName);

                    let targetTab = (uRole === 'SUPER_ADMIN') ? 'tab-tenants' : 'tab-home';
                    if (window.location.hash) {
                        targetTab = window.location.hash.substring(1);
                    }
                    const tabBtn = document.querySelector(`.nav-tab[data-tab="${targetTab}"]`) || document.querySelector(`.nav-item[data-tab="${targetTab}"]`);
                    if (tabBtn) {
                        tabBtn.click();
                    } else {
                        document.querySelector('.nav-tab[data-tab="tab-home"]')?.click();
                    }

                    if ((uRole === 'Admin' || uRole === 'admin' || uRole === 'SUPER_ADMIN') && typeof loadAccounts === 'function') {
                        try { loadAccounts(); } catch(e) {}
                    }
                } else {
                    const msg = (res && (res.message || res.error)) ? (res.message || res.error) : "Tài khoản hoặc mật khẩu không chính xác!";
                    if (errDiv) { errDiv.innerText = msg; errDiv.style.display = "block"; }
                }
            };

            const handleError = err => {
                resetBtn();
                if (errDiv) {
                    errDiv.innerText = err && err.message ? err.message : "Lỗi kết nối máy chủ!";
                    errDiv.style.display = "block";
                }
            };

            callApi('verifyLogin', [user, pass, unit], handleSuccess, handleError);
        };

        console.log('--- JS Block: Main Logic started ---');

        // ============================================================

        console.log('--- JS Block: Foundation started ---');

        // 🔧 HELPER UTILITIES

        // ============================================================



        window.alert = function (message) {

            const m = String(message).toLowerCase();

            const [type, title] =

                (m.includes('lỗi') || m.includes('thất bại')) ? ['error', 'LỖI HỆ THỐNG'] :

                    (m.includes('thành công') || m.includes('xong')) ? ['success', 'THÀNH CÔNG'] :

                        (m.includes('vui lòng') || m.includes('chưa')) ? ['warning', 'LƯU Ý'] :

                            ['info', 'THÔNG BÁO'];

            if (typeof showCustomAlert === 'function') {
                let icon = '💡', color = '#3498db';
                if (type === 'error') { icon = '🛑'; color = '#e74c3c'; }
                else if (type === 'success') { icon = '✅'; color = '#27ae60'; }
                else if (type === 'warning') { icon = '⚠️'; color = '#f39c12'; }
                showCustomAlert(title, message, icon, color);
            } else if (typeof showThongBao === 'function') {
                showThongBao(title, message, type);
            } else {
                console.log(message);
            }

        };



        dataCache = window.dataCache || { machine: [], proc: [], staff: [], room: [], pat: [] };




        let editIndex = { machine: -1, proc: -1, staff: -1, room: -1, pat: -1, proto: -1 };

        let lastBusyContext = 'staff';

        window.currentScheduleData = [];

        window.lastUnscheduledData = JSON.parse(localStorage.getItem('meds_unscheduled')) || [];

        window.currentRotData = window.lastUnscheduledData;

        window.viewingImportedScheduleFile = false;

        window.scheduleSortState = null;



        // ─── Chống double-click ───────────────────────────────────────

        function withLock(fn, delay = 500) {

            let locked = false;

            return function (...args) {

                if (locked) return;

                locked = true;

                setTimeout(() => { locked = false; }, delay);

                fn.apply(this, args);

            };

        }



        // ─── Tiện ích chung ──────────────────────────────────────────

        function xoaDau(str) {

            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

        }

        function normalizeName(str) {

            if (!str) return "";

            return xoaDau(String(str)).toLowerCase().replace(/\s+/g, '');

        }

        // ⚠️ CẢNH BÁO: ĐỒNG BỘ VỚI t2m() trong code.gs-v2.txt — sửa 1 bên PHẢI sửa bên kia!
        function t2m(t_str) {

            if (!t_str || !String(t_str).includes(":")) return 0;

            let parts = String(t_str).split(":");

            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

        }



        function isDroppedScheduleRow(row) {

            const g = String(row?.gioDienRa || row?.[5] || '');

            return g === '--' || g.includes('Rớt');

        }



        function normalizeScheduleRow(row) {
            if (!row) return {};
            if (Array.isArray(row)) {
                return {
                    ngay: row[0] || '', tenBN: row[1] || '', namSinh: row[2] || '', phong: row[3] || '', thuThuat: row[4] || '',
                    gioDienRa: row[5] || '', gioKetThuc: row[6] || '', nvChinh: row[7] || '', nvPhu: row[8] || '', may: row[9] || '', giuong: row[10] || ''
                };
            }
            return {
                ngay: row.ngay || row.NGAY || '',
                tenBN: row.tenBN || row.HOTEN || '',
                namSinh: row.namSinh || row.NAMSINH || '',
                phong: row.phong || row.PHONG || '',
                thuThuat: row.thuThuat || row.DICHVU || '',
                gioDienRa: row.gioDienRa || row.GIODIENRA || '',
                gioKetThuc: row.gioKetThuc || row.GIOKETTHUC || '',
                nvChinh: row.nvChinh || row['NV CHÍNH'] || '',
                nvPhu: row.nvPhu || row['NV PHỤ'] || '',
                may: row.may || row.MAY || '',
                giuong: row.giuong || row.GIUONG || '',
                __isDischarged: !!row.__isDischarged,
                __dropped: !!row.__dropped
            };
        }



        function normalizeDroppedItem(item, fallbackDate = '') {

            if (!item) return {};

            if (Array.isArray(item)) {

                return {

                    ngay: item[0] || fallbackDate, bn: item[1] || '', ns: item[2] || '',

                    room: item[3] || '', phong: item[3] || '', tt: item[4] || '',

                    staff: item[7] || '', reason: item[11] || item[8] || 'Thiếu nhân sự/Máy hoặc hết giờ'

                };

            }

            const room = item.room || item.phong || '';

            return {

                ...item,

                ngay: item.ngay || fallbackDate,

                bn: item.bn || item.tenBN || '',

                ns: item.ns || item.namSinh || '',

                room,

                phong: room,

                tt: item.tt || item.thuThuat || '',

                reason: item.reason || item.liDo || 'Thiếu nhân sự/Máy hoặc hết giờ'

            };

        }



        function setUnscheduledData(items, dateVal = '') {

            const seen = new Set();

            const normalized = (items || []).map(item => normalizeDroppedItem(item, dateVal)).filter(item => {

                const key = [item.ngay, item.bn, item.ns, item.tt, item.room || item.phong, item.reason].map(x => String(x || '').trim().toLowerCase()).join('|');

                if (seen.has(key)) return false;

                seen.add(key);

                return true;

            });

            window.lastUnscheduledData = normalized;

            window.currentRotData = normalized;

            localStorage.setItem('meds_unscheduled', JSON.stringify(normalized));

            if (dateVal) localStorage.setItem('meds_schedule_date', dateVal);

            return normalized;

        }

        function m2t(mins) {

            let h = Math.floor(mins / 60), m = mins % 60;

            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        }

        function renderEmptyRow(colspan, msg = 'Chưa có dữ liệu') {

            return `<tr><td colspan="${colspan}" align="center" style="padding:20px;color:#999">${msg}</td></tr>`;

        }

        function sortTimeSlots(slotsStr) {

            if (!slotsStr) return "";

            let slots = [...new Set(slotsStr.split(',').map(s => s.trim()).filter(s => s))];

            slots.sort((a, b) => t2m(a.split('-')[0].trim()) - t2m(b.split('-')[0].trim()));

            return slots.join(', ');

        }

        function getShortSkills(skillStr, isStaff = false) {
            if (!skillStr) return '';
            const str = typeof skillStr === 'string' ? skillStr : (Array.isArray(skillStr) ? skillStr.join(', ') : String(skillStr || ''));
            const arr = str.split(',').map(sk => sk.trim().toLowerCase()).filter(sk => sk);
            if (!arr.length) return '';

            const procList = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.proc)) ? dataCache.proc : [];

            if (!isStaff) {
                return arr.map(sk => {
                    let proc = procList.find(p => p && p.ten && p.ten.toLowerCase() === sk);
                    return (proc && proc.vietTat) ? proc.vietTat : sk;
                }).join(', ');
            }

            const allYHCT = procList.filter(p => p && p.he === 'YHCT');
            const allPHCN = procList.filter(p => p && p.he === 'PHCN');
            const staffYHCT = allYHCT.filter(p => p && p.ten && arr.includes(p.ten.toLowerCase()));
            const staffPHCN = allPHCN.filter(p => p && p.ten && arr.includes(p.ten.toLowerCase()));
            const missingYHCT = allYHCT.filter(p => p && p.ten && !arr.includes(p.ten.toLowerCase()));
            const missingPHCN = allPHCN.filter(p => p && p.ten && !arr.includes(p.ten.toLowerCase()));

            let yhctStr = '';
            if (staffYHCT.length > 0) {
                if (missingYHCT.length === 0) yhctStr = 'YHCT';
                else if (missingYHCT.length <= 4) yhctStr = 'YHCT - ' + missingYHCT.map(p => p.vietTat || p.ten).join(', ');
                else yhctStr = staffYHCT.map(p => p.vietTat || p.ten).join(', ');
            }

            let phcnStr = '';
            if (staffPHCN.length > 0) {
                if (missingPHCN.length === 0) phcnStr = 'PHCN';
                else if (missingPHCN.length <= 4) phcnStr = 'PHCN - ' + missingPHCN.map(p => p.vietTat || p.ten).join(', ');
                else phcnStr = staffPHCN.map(p => p.vietTat || p.ten).join(', ');
            }

            if (yhctStr === 'YHCT' && phcnStr === 'PHCN') return 'YHCT+PHCN';
            const res = [];
            if (yhctStr) res.push(yhctStr);
            if (phcnStr) res.push(phcnStr);
            return res.join('; ');
        }



        // ─── Index lookup gom chung ──────────────────────────────────

        
        function matchProc(a, b) {
            if (!a || !b) return false;
            const strA = String(a).trim().toLowerCase();
            const strB = String(b).trim().toLowerCase();
            if (strA === strB) return true;

            // 1. Tra cứu database theo mã viết tắt hoặc tên đầy đủ (chính xác 100%)
            const procs = (window.dataCache && window.dataCache.proc) ? window.dataCache.proc : [];
            const procA = procs.find(p => (p.ten && p.ten.toLowerCase() === strA) || (p.vietTat && p.vietTat.toLowerCase() === strA));
            const procB = procs.find(p => (p.ten && p.ten.toLowerCase() === strB) || (p.vietTat && p.vietTat.toLowerCase() === strB));
            if (procA && procB && procA.ten && procB.ten && procA.ten.toLowerCase() === procB.ten.toLowerCase()) return true;
            if (procA && (procA.ten.toLowerCase() === strB || (procA.vietTat && procA.vietTat.toLowerCase() === strB))) return true;
            if (procB && (procB.ten.toLowerCase() === strA || (procB.vietTat && procB.vietTat.toLowerCase() === strA))) return true;

            // 2. Kiểm tra phân biệt từ khóa đặc biệt để tránh bắt nhầm (vd: 'liệt', 'vùng', 'bấm huyệt', 'kháng trở', 'trợ giúp', 'thở')
            const distinctKeywords = ['liệt', 'vùng', 'bấm huyệt', 'kháng trở', 'trợ giúp', 'thở'];
            for (const kw of distinctKeywords) {
                const hasA = strA.includes(kw) || (procA && procA.ten && procA.ten.toLowerCase().includes(kw));
                const hasB = strB.includes(kw) || (procB && procB.ten && procB.ten.toLowerCase().includes(kw));
                if (hasA !== hasB) return false;
            }

            // 3. Substring match an toàn (sau khi đã loại trừ các keyword phân biệt)
            if (strA.includes(strB) || strB.includes(strA)) return true;

            // 4. Token-based matching: các token chính của b đều nằm trong a
            const tokensB = strB.split(/\s+/).filter(tok => tok.length > 1);
            if (tokensB.length >= 2 && tokensB.every(tok => strA.includes(tok))) return true;
            const tokensA = strA.split(/\s+/).filter(tok => tok.length > 1);
            if (tokensA.length >= 2 && tokensA.every(tok => strB.includes(tok))) return true;

            return false;
        }
        window.matchProc = matchProc;

        function reconcileUnscheduledData(inputList) {
            const schedData = window.currentScheduleData || [];
            let unschedData = inputList !== undefined ? inputList : (window.lastUnscheduledData || []);
            if (!unschedData.length) {
                window.lastUnscheduledData = [];
                try { localStorage.setItem('meds_unscheduled', '[]'); } catch(e){}
                return [];
            }

            const activePatList = (window.dataCache && window.dataCache.pat) ? window.dataCache.pat : [];
            const remainingDropped = [];
            const schedCountMap = {};

            schedData.forEach(row => {
                const rowRoom = String(row.phong || row.PHONG || row[3] || '').trim();
                const key = String(row.tenBN || '').toUpperCase().trim() + "_" + String(row.namSinh || '').trim() + (rowRoom ? "_" + rowRoom : "");
                if (!schedCountMap[key]) schedCountMap[key] = [];
                schedCountMap[key].push(String(row.thuThuat || '').trim());
            });

            const seenDropKeys = new Set();
            unschedData.forEach(d => {
                const patName = String(d.bn || d.tenBN || '').toUpperCase().trim();
                const patNS = String(d.ns || d.namSinh || '').trim();
                const patRoom = String(d.phong || d.room || '').trim();
                const key = patName + "_" + patNS + (patRoom ? "_" + patRoom : "");
                const dropProc = String(d.tt || d.thuThuat || '').trim();
                const dropSig = key + "|" + dropProc.toLowerCase();
                if (seenDropKeys.has(dropSig)) return;
                seenDropKeys.add(dropSig);

                const patObj = activePatList.find(p => String(p.ten || '').toUpperCase().trim() === patName && String(p.namSinh || '').trim() === patNS && (!patRoom || String(p.phong || '').trim() === patRoom));
                const reqProcs = patObj && patObj.thuThuat ? patObj.thuThuat.split(',').map(x => x.trim()).filter(Boolean) : [];
                const schedProcsForPat = schedCountMap[key] || [];

                const reqCountForThisProc = reqProcs.filter(p => matchProc(p, dropProc)).length || 1;
                const schedCountForThisProc = schedProcsForPat.filter(p => matchProc(p, dropProc)).length;

                // Nếu số ca đã có trong lịch >= số ca yêu cầu, ca rớt này đã được giải quyết
                if (schedCountForThisProc >= reqCountForThisProc) {
                    return;
                }
                remainingDropped.push(d);
            });

            window.lastUnscheduledData = remainingDropped;
            try {
                localStorage.setItem('meds_unscheduled', JSON.stringify(remainingDropped));
            } catch(e){}
            return remainingDropped;
        }

        function getEntityIdx(cacheKey, inputId) {
            let val = document.getElementById(inputId)?.value;
            if (!val) return -1;
            val = val.trim();

            if (cacheKey === 'pat') {
                const patList = dataCache.pat || [];
                
                // 1. Match format "Tên (NămSinh)" or "Tên - NămSinh"
                const matchWithNs = val.match(/^(.*?)\s*[\(\-]\s*(\d{4}|\?)\s*(?:[\-\)].*)?$/);
                if (matchWithNs) {
                    const rawName = matchWithNs[1].trim();
                    const rawNs = matchWithNs[2].trim();
                    const exactMatch = patList.findIndex(item => 
                        normalizeName(item.ten) === normalizeName(rawName) && 
                        (rawNs === '?' || String(item.namSinh || '').trim() === rawNs)
                    );
                    if (exactMatch !== -1) return exactMatch;
                }

                // 2. If user clicked a row in busy/leave table, match lastSelectedPatIdx
                if (typeof window.lastSelectedPatIdx === 'number' && window.lastSelectedPatIdx >= 0 && window.lastSelectedPatIdx < patList.length) {
                    const selectedPat = patList[window.lastSelectedPatIdx];
                    if (normalizeName(selectedPat.ten) === normalizeName(val) || val.startsWith(selectedPat.ten)) {
                        return window.lastSelectedPatIdx;
                    }
                }

                // 3. Match by normalizeName
                const normVal = normalizeName(val);
                const nameMatches = patList.map((item, idx) => ({ item, idx })).filter(({ item }) => normalizeName(item.ten) === normVal);
                if (nameMatches.length > 0) {
                    return nameMatches[0].idx;
                }
                return -1;
            }

            return dataCache[cacheKey].findIndex(item => normalizeName(item.ten) === normalizeName(val));
        }

        function getBusyPatIdx() { return getEntityIdx('pat', 'busy-pat-input'); }

        function getLeavePatIdx() { return getEntityIdx('pat', 'leave-pat-input'); }



        // ============================================================

        // ⏰ TIME MASKING

        // ============================================================

        document.addEventListener('input', function (e) {

            if (!e.target?.classList.contains('time-input')) return;

            if (e.inputType === 'deleteContentBackward') return;

            let v = e.target.value.replace(/\D/g, '');

            if (!v.length) { e.target.value = ''; return; }

            if (v.length === 1 && parseInt(v) >= 3) v = '0' + v;

            let h = v.substring(0, 2), m = v.substring(2, 4);

            if (h.length === 2 && parseInt(h) > 23) h = '23';

            if (m.length === 2 && parseInt(m) > 59) m = '59';

            let res = h;

            if (v.length >= 2) res += ':' + m;

            e.target.value = res.substring(0, 5);

        });

        document.addEventListener('focusout', function (e) {

            if (!e.target?.classList.contains('time-input') || !e.target.value) return;

            const v = e.target.value;

            if (v.length === 2 && !v.includes(':')) e.target.value = v + ':00';

            else if (v.endsWith(':')) e.target.value = v + '00';

            else if (v.length === 4 && v.includes(':')) e.target.value = v + '0';

        });



        // ============================================================

        // 🔤 TABLE SORTING

        // ============================================================

        function setupTableSorting(container = document) {

            container.querySelectorAll('th').forEach(th => {

                if (th.dataset.sortBound) return;

                th.dataset.sortBound = "true";

                th.title = 'Bấm để sắp xếp (A-Z / Z-A)';

                th.addEventListener('click', function () {

                    const table = this.closest('table');

                    const tbody = table?.querySelector('tbody');

                    if (!tbody) return;

                    const index = Array.from(this.parentElement.children).indexOf(this);

                    let isAsc = this.dataset.dir !== 'asc';



                    if (table?.id === 'schedule-table') {

                        window.scheduleSortState = { index, dir: isAsc ? 'asc' : 'desc' };

                        this.parentElement.querySelectorAll('th').forEach(el => {

                            if (el !== this) el.dataset.dir = '';

                            el.innerText = el.innerText.replace(' ▲', '').replace(' ▼', '');

                        });

                        this.dataset.dir = window.scheduleSortState.dir;

                        this.innerText = this.innerText.replace(' ▲', '').replace(' ▼', '') + (isAsc ? ' ▲' : ' ▼');

                        schedCurrentPage = 1;

                        renderSchedPage();

                        return;

                    }



                    const rows = Array.from(tbody.querySelectorAll('tr'));

                    if (rows.length === 0 || (rows.length === 1 && rows[0].cells.length <= 1)) return;



                    this.dataset.dir = isAsc ? 'asc' : 'desc';

                    this.parentElement.querySelectorAll('th').forEach(el => {

                        if (el !== this) el.dataset.dir = '';

                        el.innerText = el.innerText.replace(' ▲', '').replace(' ▼', '');

                    });

                    this.innerText = this.innerText + (isAsc ? ' ▲' : ' ▼');



                    rows.sort((a, b) => {

                        let valA = a.cells[index]?.innerText.trim() || '';

                        let valB = b.cells[index]?.innerText.trim() || '';

                        let numA = parseFloat(valA.replace(/,/g, ''));

                        let numB = parseFloat(valB.replace(/,/g, ''));

                        let dateA = valA.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

                        let dateB = valB.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

                        let primaryDiff = 0;



                        if (dateA && dateB) {

                            valA = dateA[3] + dateA[2] + dateA[1];

                            valB = dateB[3] + dateB[2] + dateB[1];

                            primaryDiff = isAsc ? valA.localeCompare(valB, 'vi', { numeric: true }) : valB.localeCompare(valA, 'vi', { numeric: true });

                        } else if (valA.match(/^\d{2}:\d{2}$/) && valB.match(/^\d{2}:\d{2}$/)) {

                            valA = valA.replace(':', '');

                            valB = valB.replace(':', '');

                            primaryDiff = isAsc ? valA.localeCompare(valB, 'vi', { numeric: true }) : valB.localeCompare(valA, 'vi', { numeric: true });

                        } else if (!isNaN(numA) && !isNaN(numB) && !valA.match(/[a-zA-ZÀ-ỹ]/) && !valB.match(/[a-zA-ZÀ-ỹ]/)) {

                            primaryDiff = isAsc ? numA - numB : numB - numA;

                        } else {

                            primaryDiff = isAsc ? valA.localeCompare(valB, 'vi', { numeric: true }) : valB.localeCompare(valA, 'vi', { numeric: true });

                        }



                        if (primaryDiff !== 0) return primaryDiff;



                        const headerCells = Array.from(this.parentElement.children);

                        let timeColIdx = headerCells.findIndex(th => {

                            const text = th.innerText.toLowerCase();

                            return text.includes('bắt đầu') || text.includes('giờ') || text.includes('thời gian') || text.includes('b.đầu');

                        });



                        if (timeColIdx !== -1 && timeColIdx !== index) {

                            let timeA = a.cells[timeColIdx]?.innerText.trim().replace(':', '') || '';

                            let timeB = b.cells[timeColIdx]?.innerText.trim().replace(':', '') || '';

                            return timeA.localeCompare(timeB, 'vi', { numeric: true });

                        }



                        return 0;

                    });

                    rows.forEach(row => tbody.appendChild(row));



                    if (this.parentElement.children[0].innerText.includes('STT')) {

                        let stt = 1;

                        Array.from(tbody.querySelectorAll('tr')).forEach(row => {

                            if (row.cells[0]) row.cells[0].innerText = stt++;

                        });

                    }

                });

            });

        }



        // ============================================================

        // ⌨️ GLOBAL KEYBOARD SHORTCUTS

        // ============================================================

        document.addEventListener('keydown', function (e) {

            const isInput = e.target.tagName.toLowerCase() === 'textarea' ||

                (e.target.tagName.toLowerCase() === 'input' && (e.target.type === 'text' || e.target.type === 'number'));

            if (isInput && e.key !== 'Enter') return;



            const activeTab = document.querySelector('.tab-content.active');

            if (!activeTab) return;

            const tabId = activeTab.id;



            if (e.key === 'Enter') {

                const targetId = e.target.id;

                e.preventDefault();

                if (tabId === 'tab-busy') {

                    if (targetId === 'busy-staff-select') { document.getElementById('busy-staff-from').focus(); return; }

                    if (targetId === 'busy-pat-input') { document.getElementById('busy-pat-from').focus(); return; }

                    if (targetId === 'leave-pat-input') {

                        let t = document.getElementById('leave-pat-time');

                        if (!t.value) t.value = '14:00';

                    }

                }

                if (isInput) e.target.blur();

                const tabBtnMap = {
                    'tab-machines': 'btn-save-machine',
                    'tab-procedures': () => {
                        const inProtoForm = document.activeElement && document.activeElement.closest('#sidebar-form-proto');
                        if (inProtoForm) {
                            document.getElementById('btn-save-proto')?.click();
                        } else {
                            document.getElementById('btn-save-proc')?.click();
                        }
                    },
                    'tab-staff': 'btn-save-staff',
                    'tab-rooms': 'btn-save-room',
                    'tab-patients': 'btn-save-pat',
                };

                if (typeof tabBtnMap[tabId] === 'function') { tabBtnMap[tabId](); return; }
                else if (tabBtnMap[tabId]) { document.getElementById(tabBtnMap[tabId])?.click(); return; }

                if (tabId === 'tab-busy') {

                    const busyBtnMap = { staff: 'btn-sv-stf-bsy', pat: 'btn-sv-pat-bsy', leave: 'btn-sv-pat-lv' };

                    document.getElementById(busyBtnMap[lastBusyContext])?.click();

                }

                if (tabId === 'tab-utils') {

                    // Tự động điền ngày hôm nay khi lần đầu mở tab
                    const utilsDateEl = document.getElementById('utils-search-date');
                    if (utilsDateEl && !utilsDateEl.value) {
                        const todayStr = new Date().toISOString().slice(0, 10);
                        utilsDateEl.value = todayStr;
                        if (utilsDateEl._flatpickr) utilsDateEl._flatpickr.setDate(todayStr, false);
                    }

                    if (targetId === 'search-doc-time') timBacSiRanh();

                    else if (targetId === 'search-machine-time' || targetId === 'search-machine-type') timMayRanh();

                }

            }



            if (e.key === 'Delete' && !isInput) {

                const delMap = {

                    'tab-machines': () => editIndex.machine > -1 && deleteMachine(editIndex.machine),

                    'tab-procedures': () => editIndex.proc > -1 && deleteProcedure(editIndex.proc),

                    'tab-staff': () => editIndex.staff > -1 && deleteStaff(editIndex.staff),

                    'tab-rooms': () => editIndex.room > -1 && deleteRoom(editIndex.room),

                    'tab-patients': () => editIndex.pat > -1 && deletePatient(editIndex.pat),

                };

                if (delMap[tabId]) { delMap[tabId](); return; }

                if (tabId === 'tab-busy') {

                    const busyDelMap = { staff: 'btn-del-stf-bsy', pat: 'btn-del-pat-bsy', leave: 'btn-cl-pat-lv' };

                    document.getElementById(busyDelMap[lastBusyContext])?.click();

                }

            }

        });



        // ============================================================

        // 🚀 DOM READY

        // ============================================================

        document.addEventListener('DOMContentLoaded', function () {

            // Phần 1: Bơm Footer

            try {

                const khuonDuc = document.getElementById('khuon-duc-footer');

                if (khuonDuc) {

                    const noiDungFooter = khuonDuc.innerHTML;

                    document.querySelectorAll('.tab-content, .page').forEach(tab => tab.insertAdjacentHTML('beforeend', noiDungFooter));

                }

            } catch (err) { console.warn("Lỗi khi bơm Footer:", err); }



            // Phần 2: Chuyển Tab (Sử dụng history.replaceState, ngăn chặn hoàn toàn trình duyệt nhảy cuộn xuống đáy trang)
            function switchTab(targetTab) {
                if (!targetTab) return;
                try {
                    // Cập nhật hash trên URL mà KHÔNG kích hoạt cơ chế cuộn anchor của trình duyệt
                    try {
                        history.replaceState(null, null, '#' + targetTab);
                    } catch (e) {}

                    const tabs = document.querySelectorAll('.nav-tab, .nav-item');
                    tabs.forEach(t => t.classList.remove('active'));
                    const activeBtn = document.querySelector(`.nav-tab[data-tab="${targetTab}"], [data-tab="${targetTab}"]`);
                    if (activeBtn) activeBtn.classList.add('active');

                    document.querySelectorAll('.tab-content, .page').forEach(c => c.classList.remove('active'));
                    const targetEl = document.getElementById(targetTab);
                    if (targetEl) {
                        targetEl.classList.add('active');
                        const scContainer = document.querySelector('.tab-scroll-content');
                        if (scContainer) scContainer.scrollTop = 0;
                    }
                    window.scrollTo(0, 0);

                    // Body classes
                    document.body.classList.toggle('tab-sat-active', targetTab === 'tab-sat');
                    document.body.classList.toggle('tab-schedule-active', targetTab === 'tab-schedule');

                    // Data loads
                    if (targetTab === 'tab-sat' && typeof satCache !== 'undefined' && Object.keys(satCache).length === 0) {
                        if (typeof taiDsSat === 'function') taiDsSat();
                    }
                    if (targetTab === 'tab-home' || targetTab === 'page-dashboard') {
                        if (typeof loadDashboard === 'function') loadDashboard();
                    }
                    if (targetTab === 'tab-schedule') {
                        if (typeof schedCurrentPage !== 'undefined') schedCurrentPage = 1;
                        if (typeof loadScheduleList === 'function') loadScheduleList();
                    }
                    if (targetTab === 'tab-stats' && typeof renderStats === 'function') {
                        renderStats(window.lastUnscheduledData);
                    }
                    if (targetTab === 'tab-procedures') {
                        if (typeof renderProceduresTable === 'function') renderProceduresTable();
                        if (typeof renderProtoProcsFormCheckboxes === 'function') renderProtoProcsFormCheckboxes();
                        if (typeof renderProtocolsTable === 'function') renderProtocolsTable();
                    }
                    if (targetTab === 'tab-rooms' && typeof renderDynamicMachineInputs === 'function') {
                        renderDynamicMachineInputs();
                    }
                    if (targetTab === 'tab-chamcong') {
                        if (typeof loadChamCongData === 'function') loadChamCongData();
                    }
                    if (targetTab === 'tab-thongke') {
                        if (typeof loadThongKeData === 'function') loadThongKeData();
                    }
                    if (targetTab === 'tab-tenants') {
                        if (typeof loadTenantsList === 'function') loadTenantsList();
                    }
                    if ((targetTab === 'tab-staff' || targetTab === 'tab-patients') && typeof renderProcedureCheckboxes === 'function') {
                        renderProcedureCheckboxes();
                    }
                } catch (err) {
                    console.warn("Lỗi khi chuyển tab:", err);
                }
            }
            window.switchTab = switchTab;

            const tabs = document.querySelectorAll('.nav-tab, .nav-item');
            tabs.forEach(tab => {
                tab.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetTab = tab.getAttribute('data-tab');
                    if (targetTab) {
                        window.switchTab(targetTab);
                    }
                }, true);
            });

            // Khởi tạo tab ban đầu
            const initialHash = window.location.hash ? window.location.hash.substring(1) : '';
            const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
            let defaultTab = initialHash;
            if (!defaultTab) {
                defaultTab = (sess.role === 'SUPER_ADMIN') ? 'tab-tenants' : 'tab-home';
            }
            if (defaultTab) {
                window.switchTab(defaultTab);
            }
        });

        // --- USER MENU DROPDOWN LOGIC ---
        function goToAdminTab() {
            const tabBtn = document.querySelector('.nav-tab[data-tab="tab-admin"]');
            if (tabBtn) {
                tabBtn.click();
            } else {
                document.querySelectorAll('.tab-content, .page').forEach(c => c.classList.remove('active'));
                const targetEl = document.getElementById('tab-admin');
                if (targetEl) targetEl.classList.add('active');
                if (typeof switchAdminSection === 'function') {
                    const activeSubBtn = document.querySelector('.admin-nav-btn.active') || document.getElementById('nav-btn-settings');
                    switchAdminSection('admin-sec-settings', activeSubBtn);
                }
                try { history.replaceState(null, '', '#tab=tab-admin'); } catch(e) {}
            }
            const dropMenu = document.getElementById('user-dropdown-menu');
            if (dropMenu) dropMenu.style.display = 'none';
            const arrow = document.getElementById('user-dropdown-arrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        }

        window.triggerLogout = function () {
            const dropMenu = document.getElementById('user-dropdown-menu');
            if (dropMenu) dropMenu.style.display = 'none';
            const arrow = document.getElementById('user-dropdown-arrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';

            if (typeof showCustomConfirm === 'function') {
                showCustomConfirm('Đăng xuất tài khoản', 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?', doLogout);
            } else if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?')) {
                doLogout();
            }
        };

        // Event Listeners for toggle
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof loadSystemSettings === 'function') loadSystemSettings();

            const btnUser = document.getElementById('nav-btn-user');
            const menu = document.getElementById('user-dropdown-menu');
            const arrow = document.getElementById('user-dropdown-arrow');

            if (btnUser && menu) {
                btnUser.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = menu.style.display === 'block';
                    menu.style.display = isOpen ? 'none' : 'block';
                    if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
                });
            }

            document.addEventListener('click', (e) => {
                if (menu && menu.style.display === 'block') {
                    const container = document.getElementById('user-menu-container');
                    if (container && !container.contains(e.target)) {
                        menu.style.display = 'none';
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    }
                }
            });
        });

        // ============================================================
        // ✅ KIỂM TRA LỖI HIS
        // ============================================================

        function initErrorChecker() {
            const fileInput = document.getElementById('error-file-input');
            if (!fileInput) return;
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) {
                    return;
                }

                if (window.showGlobalLoading) window.showGlobalLoading('Đang phân tích file HIS...');

                const reader = new FileReader();
                reader.onload = function (ev) {
                    try {
                        const data = new Uint8Array(ev.target.result);
                        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        
                        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                        let headerRowIndex = -1;
                        let isInternalSchedule = false;

                        for (let i = 0; i < Math.min(rawData.length, 50); i++) {
                            const rowStr = (rawData[i] || []).map(c => typeof xoaDau === 'function' ? xoaDau(String(c || '').toLowerCase()).trim() : String(c || '').toLowerCase().trim());
                            if (rowStr.some(c => c.includes("ten benh nhan") || c.includes("ten bn") || c.includes("hoten"))) {
                                headerRowIndex = i;
                                isInternalSchedule = true;
                                break;
                            } else if (rowStr.some(c => c.includes("stt") || c.includes("name") || c.includes("mabn"))) {
                                headerRowIndex = i;
                                break;
                            }
                        }

                        if (headerRowIndex < 0) headerRowIndex = 0;

                        let dataRows = [];
                        if (isInternalSchedule) {
                            const headerRow = (rawData[headerRowIndex] || []).map(h => typeof xoaDau === 'function' ? xoaDau(String(h || '').toLowerCase()).trim() : String(h || '').toLowerCase().trim());
                            const colIdx = {
                                ngay: headerRow.findIndex(h => h.includes('ngay')),
                                ten: headerRow.findIndex(h => h.includes('ten benh nhan') || h.includes('ten bn') || h.includes('hoten')),
                                tt: headerRow.findIndex(h => h.includes('thu thuat') || h.includes('dich vu') || h.includes('dichvu')),
                                bd: headerRow.findIndex(h => h.includes('bat dau') || h.includes('gio dien ra') || h.includes('giodienra')),
                                kt: headerRow.findIndex(h => h.includes('ket thuc') || h.includes('gioketthuc')),
                                nv: headerRow.findIndex(h => h.includes('nv chinh') || h.includes('nhan vien chinh'))
                            };

                            dataRows = rawData.slice(headerRowIndex + 1).filter(r => r && r.some(c => String(c).trim())).map(r => {
                                const ngayStr = colIdx.ngay >= 0 ? String(r[colIdx.ngay] || '').trim() : '';
                                const bdStr = colIdx.bd >= 0 ? String(r[colIdx.bd] || '').trim() : '';
                                const ktStr = colIdx.kt >= 0 ? String(r[colIdx.kt] || '').trim() : '';

                                if (bdStr.includes('Rớt') || bdStr === '--' || !bdStr) return null;

                                const datePart = ngayStr.includes('-') ? ngayStr.split('-').reverse().join('/') : ngayStr;
                                const startFull = datePart ? `${bdStr} ${datePart}` : bdStr;
                                const endFull = datePart ? `${ktStr} ${datePart}` : ktStr;

                                const cleanBN = (colIdx.ten >= 0 ? String(r[colIdx.ten] || '') : '').replace(/\s*\((?:✔ RV|❌ Rớt|RV|Rớt)\)/gi, '').trim();
                                const procName = colIdx.tt >= 0 ? String(r[colIdx.tt] || '').trim() : '';
                                const procInfo = mapProcedureJS(procName);
                                const procLoai = procInfo ? (procInfo.phanLoai || procInfo.loai || procInfo.he || '') : '';

                                return {
                                    'AT': colIdx.nv >= 0 ? r[colIdx.nv] : '',
                                    'C': cleanBN,
                                    'AE': procName,
                                    'AG': procName,
                                    'AF': 'Chủ động',
                                    'AS': 'Khác',
                                    'AN': procLoai,
                                    'AH': startFull,
                                    'L': endFull
                                };
                            }).filter(Boolean);
                        } else {
                            dataRows = XLSX.utils.sheet_to_json(worksheet, { header: "A", range: headerRowIndex, defval: "" });
                        }

                        processErrorChecking(dataRows);
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                    } catch (err) {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        console.error(err);
                        alert("Lỗi khi đọc file. Vui lòng kiểm tra lại cấu trúc form.");
                        timeTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa tải dữ liệu</td></tr>';
                        otherTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa tải dữ liệu</td></tr>';
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        }

        function normalizeTextJS(text) {
            if (!text || typeof text !== 'string') return '';
            return text.normalize('NFC').trim().toLowerCase();
        }

        function getShortNameJS(fullName) {
            const lowerName = normalizeTextJS(fullName);
            if (!lowerName) return '';
            
            for (const s of dataCache.staff) {
                const tenHIS = String(s.tenHis || '').toLowerCase();
                if (!tenHIS) continue;
                const keys = tenHIS.split(',').map(k => k.trim()).filter(k => k);
                for (const k of keys) {
                    if (lowerName.includes(k)) return s.ten;
                }
            }
            return String(fullName).trim();
        }

        function mapProcedureJS(procStr) {
            const procStrLower = normalizeTextJS(procStr);
            for (const p of dataCache.proc) {
                const ten = String(p.ten || '').toLowerCase();
                const vietTat = String(p.vietTat || '').toLowerCase();
                if (ten && procStrLower.includes(ten)) return p;
                if (vietTat && procStrLower === vietTat) return p;
            }
            return null;
        }

        function checkPermissionJS(techName, procInfo) {
            const staff = dataCache.staff.find(s => s.ten === techName);
            if (!staff) return true;
            if (!procInfo) return true;
            
            const staffQuyen = staff.quyen || 'Cả hai';
            if (staffQuyen === 'Cả hai') return true;
            
            const procSystem = procInfo.he || 'PHCN';
            return staffQuyen === procSystem;
        }

        function convertExcelDateToJSDate(serial) {
            if (!serial) return null;
            if (typeof serial === 'string') {
                const s = serial.trim();
                const match1 = s.match(/^(\d{1,2}):(\d{1,2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (match1) return new Date(parseInt(match1[5]), parseInt(match1[4]) - 1, parseInt(match1[3]), parseInt(match1[1]), parseInt(match1[2]), 0, 0);
                const match2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})/);
                if (match2) return new Date(parseInt(match2[3]), parseInt(match2[2]) - 1, parseInt(match2[1]), parseInt(match2[4]), parseInt(match2[5]), 0, 0);
                const dateObj = new Date(s);
                if (!isNaN(dateObj.getTime())) return dateObj;
                const parts = s.match(/(\d+):(\d+)/);
                if (parts) {
                     const d = new Date(1900, 0, 1);
                     d.setHours(parseInt(parts[1]), parseInt(parts[2]), 0, 0);
                     return d;
                }
                return null;
            }
            if (serial instanceof Date) return serial;
            const utc_days = Math.floor(serial - 25569);
            const utc_value = utc_days * 86400; 
            const date_info = new Date(utc_value * 1000);
            const fractional_day = serial - Math.floor(serial) + 0.0000001;
            let total_seconds = Math.floor(86400 * fractional_day);
            const seconds = total_seconds % 60;
            total_seconds -= seconds;
            const hours = Math.floor(total_seconds / (60 * 60));
            const minutes = Math.floor(total_seconds / 60) % 60;
            date_info.setHours(hours, minutes, seconds, 0);
            return date_info;
        }

        function formatDate(date) {
            if (!date || isNaN(date.getTime())) return '';
            const h = String(date.getHours()).padStart(2, '0');
            const m = String(date.getMinutes()).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const mo = String(date.getMonth() + 1).padStart(2, '0');
            return `${h}:${m} (${d}/${mo})`;
        }

        function addOtherRow(tbody, stt, tech, patientAndProc, time, reason) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${stt}</td><td><strong>${tech}</strong></td><td>${patientAndProc}</td><td>${time}</td><td><span style="color:#d35400; font-weight:bold;">${reason}</span></td>`;
            tbody.appendChild(tr);
        }

        function addTimeRow(tbody, stt, tech, ca1Str, ca2Str, reason) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${stt}</td><td><strong>${tech}</strong></td><td>${ca1Str}</td><td>${ca2Str}</td><td><span style="color:#c0392b; font-weight:bold;">${reason}</span></td>`;
            tbody.appendChild(tr);
        }

        function processErrorChecking(dataRows) {
            const countBody = document.getElementById('count-body');
            const timeTbody = document.getElementById('error-time-body');
            const otherTbody = document.getElementById('error-other-body');
            if (countBody) countBody.innerHTML = '';
            timeTbody.innerHTML = '';
            otherTbody.innerHTML = '';

            const counts = {};
            dataCache.staff.forEach(s => {
                counts[s.ten] = { l1: 0, l2: 0, l3: 0, other: 0 };
            });

            let sttTime = 1;
            let sttOther = 1;

            const grouped = {};
            const validStaffNames = dataCache.staff.map(s => s.ten);

            for (let row of dataRows) {
                let techRaw = String(row['AT'] || '').trim();
                let techNorm = getShortNameJS(techRaw);

                if (techNorm && counts[techNorm]) {
                    const procName = String(row['AE'] || '').trim();
                    const procInfo = mapProcedureJS(procName);
                    const loaiVal = String(row['AN'] || (procInfo ? (procInfo.phanLoai || procInfo.loai || procInfo.phan_loai || '') : '')).normalize('NFC').toLowerCase().trim();

                    if (/\bloại\s*3\b|\bloai\s*3\b|\b3\b|\bloại\s*iii\b|\bloai\s*iii\b/.test(loaiVal)) {
                        counts[techNorm].l3++;
                    } else if (/\bloại\s*2\b|\bloai\s*2\b|\b2\b|\bloại\s*ii\b|\bloai\s*ii\b/.test(loaiVal)) {
                        counts[techNorm].l2++;
                    } else if (/\bloại\s*1\b|\bloai\s*1\b|\b1\b|\bloại\s*i\b|\bloai\s*i\b/.test(loaiVal)) {
                        counts[techNorm].l1++;
                    } else {
                        counts[techNorm].other++;
                    }
                }

                if (!row['AH'] || !row['L']) continue;
                
                let start = convertExcelDateToJSDate(row['AH']);
                let end = convertExcelDateToJSDate(row['L']);
                if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) continue;

                if (!techNorm) continue;
                
                if (!grouped[techNorm]) grouped[techNorm] = [];
                
                grouped[techNorm].push({
                    raw: row,
                    patientName: String(row['C'] || 'Không rõ'),
                    procName: String(row['AE'] || ''),
                    procMethod: String(row['AG'] || ''),
                    ptttStatus: String(row['AF'] || ''),
                    anesName: String(row['AS'] || ''),
                    techRaw: techRaw,
                    start: start,
                    end: end
                });
            }

            for (const [tech, groupRows] of Object.entries(grouped)) {
                groupRows.sort((a, b) => a.start - b.start);
                const fastRows = [];

                for (const row of groupRows) {
                    const procInfo = mapProcedureJS(row.procName);
                    const timeAStr = `${formatDate(row.start)} -> ${formatDate(row.end)}`;
                    
                    if (!validStaffNames.includes(tech)) {
                        addOtherRow(otherTbody, sttOther++, row.techRaw, `${row.patientName}<br/>${row.procName}`, timeAStr, "Sai tên nhân viên (Không có trong CSDL)");
                    }
                    
                    const status = String(row.ptttStatus).trim().toLowerCase();
                    if (status !== "chủ động" && status !== "nan" && status !== "") {
                        addOtherRow(otherTbody, sttOther++, tech, `${row.patientName}<br/>${row.procName}`, timeAStr, `Sai Tình hình PTTT: '${row.ptttStatus}' (Phải là Chủ động)`);
                    }
                    
                    const anes = String(row.anesName).trim().toLowerCase();
                    if (anes !== "khác" && anes !== "nan" && anes !== "") {
                        addOtherRow(otherTbody, sttOther++, tech, `${row.patientName}<br/>${row.procName}`, timeAStr, `Sai Vô cảm: '${row.anesName}' (Bắt buộc Khác)`);
                    }

                    if (normalizeTextJS(row.procName) !== normalizeTextJS(row.procMethod)) {
                        addOtherRow(otherTbody, sttOther++, tech, `${row.patientName}<br/>${row.procName}`, timeAStr, `Sai PP tiến hành: '${row.procMethod}' (Phải giống tên thủ thuật)`);
                    }

                    if (!procInfo) continue;

                    if (!checkPermissionJS(tech, procInfo)) {
                        addOtherRow(otherTbody, sttOther++, tech, `${row.patientName}<br/>${procInfo.ten}`, timeAStr, "Làm thủ thuật ngoài phạm vi phân quyền");
                    }
                    
                    const tth_mins = parseInt(procInfo.thoiGianThucHien) || 0;
                    const ttg_mins = parseInt(procInfo.thoiGianThuThuat) || 0;
                    const execEnd = new Date(row.start.getTime() + tth_mins * 60000);
                    
                    fastRows.push({
                        raw: row,
                        patientName: row.patientName,
                        info: procInfo,
                        start: row.start,
                        end: row.end,
                        execEnd: execEnd,
                        isCont: tth_mins === ttg_mins
                    });
                }

                const n = fastRows.length;
                for (let i = 0; i < n; i++) {
                    const A = fastRows[i];
                    const timeAStr = `${formatDate(A.start)} -> ${formatDate(A.end)}`;
                    for (let j = i + 1; j < n; j++) {
                        const B = fastRows[j];
                        if (B.start.getTime() > A.end.getTime()) break;
                        
                        let errorReason = "";
                        const aTc = A.info.ten === 'Thủy châm';
                        const bTc = B.info.ten === 'Thủy châm';
                        
                        const inExec = (s, pt, e) => (pt <= s && s < e);
                        const overlap = (s1, e1, s2, e2) => (Math.max(s1, s2) < Math.min(e1, e2));
                        
                        const bStart = B.start.getTime();
                        const bEnd = B.end.getTime();
                        const aStart = A.start.getTime();
                        const aEnd = A.end.getTime();
                        const aExecEnd = A.execEnd.getTime();
                        const bExecEnd = B.execEnd.getTime();

                        if (bStart === aStart) {
                            errorReason = "Trùng giờ bắt đầu";
                        } else if (bStart < aEnd) {
                            if (A.isCont) {
                                errorReason = `Lấn giờ (A làm liên tục ${A.info.thoiGianThucHien}p)`;
                            } else if (B.isCont) {
                                if (inExec(bStart, aEnd, bExecEnd)) errorReason = `B đè lên A (B làm liên tục ${B.info.thoiGianThucHien}p)`;
                            } else {
                                if (bStart < aExecEnd) errorReason = `B bắt đầu khi A chưa xong Thực Hiện (${A.info.thoiGianThucHien}p)`;
                                else if (aTc || bTc) {
                                    if (overlap(aEnd - 2 * 60000, aEnd, bStart, bExecEnd)) errorReason = `Rút kim A bị trùng lúc B đang Thực Hiện`;
                                }
                            }
                        }

                        if (errorReason) {
                            const timeBStr = `${formatDate(B.start)} -> ${formatDate(B.end)}`;
                            const ca1Info = `${A.patientName}<br/>${A.info.ten}<br/>${timeAStr}`;
                            const ca2Info = `${B.patientName}<br/>${B.info.ten}<br/>${timeBStr}`;
                            addTimeRow(timeTbody, sttTime++, tech, ca1Info, ca2Info, errorReason);
                        }
                    }
                }
            }

            if (timeTbody.children.length === 0) timeTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có lỗi trùng giờ! 🎉</td></tr>';
            if (otherTbody.children.length === 0) otherTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có lỗi phân quyền/quy trình! 🎉</td></tr>';

            if (countBody) {
                let countHtml = '';
                let t1 = 0, t2 = 0, t3 = 0, to = 0;
                dataCache.staff.forEach(s => {
                    const c = counts[s.ten];
                    if (!c) return;
                    if (c.l1 === 0 && c.l2 === 0 && c.l3 === 0 && c.other === 0) return;
                    t1 += c.l1; t2 += c.l2; t3 += c.l3; to += c.other;
                    countHtml += `<tr>
                        <td><strong>${s.ten}</strong></td>
                        <td style="text-align:center">${c.l1}</td>
                        <td style="text-align:center">${c.l2}</td>
                        <td style="text-align:center">${c.l3}</td>
                        <td style="text-align:center">${c.other}</td>
                    </tr>`;
                });
                countHtml += `<tr style="font-weight:bold; background:#eafaf1;">
                    <td>TỔNG CỘNG</td>
                    <td style="text-align:center">${t1}</td>
                    <td style="text-align:center">${t2}</td>
                    <td style="text-align:center">${t3}</td>
                    <td style="text-align:center">${to}</td>
                </tr>`;
                countBody.innerHTML = countHtml || '<tr><td colspan="5" style="text-align:center;">Chưa có dữ liệu thủ thuật</td></tr>';
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            initErrorChecker();
            setTimeout(() => {
                if (typeof window.checkBackupReminder === 'function') window.checkBackupReminder();
                if (typeof window.loadQuickLinks === 'function') window.loadQuickLinks();
            }, 1500);
        });

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
        const autoTime = localStorage.getItem('ai_auto_train_time') || '17:00';
        if (autoEnableEl) autoEnableEl.value = autoEnable ? "1" : "0";
        if (autoTimeEl) autoTimeEl.value = autoTime;
    } catch(e) {
        console.warn('[renderAISettingsUI] Lỗi hiển thị thông số AI:', e);
    }
};

window.saveAIAutoTrainConfig = function() {
    const enableEl = document.getElementById('ai-auto-train-enable');
    const timeEl = document.getElementById('ai-auto-train-time');
    const enable = enableEl ? enableEl.value : '1';
    const time = timeEl ? timeEl.value : '17:00';

    localStorage.setItem('ai_auto_train_enable', enable);
    localStorage.setItem('ai_auto_train_time', time);

    const configObj = { enable, time };
    callApi('saveSystemSettings', ['ai_auto_train_config', JSON.stringify(configObj)], null, null);

    showCustomAlert("Thành công", `Đã lưu cấu hình tự động huấn luyện AI hàng ngày vào lúc ${time} thành công!`);
};

window.calibrateAIFromHistory = async function() {
    if (window.showGlobalLoading) window.showGlobalLoading("Đang tải toàn bộ dữ liệu từ bảng lịch sử Cloudflare D1 để huấn luyện AI...");

    const executeTraining = (historyRows) => {
        try {
            if (!Array.isArray(historyRows) || historyRows.length === 0) {
                if (window.hideGlobalLoading) window.hideGlobalLoading();
                showCustomAlert("Thông báo", "Không tải được dữ liệu lịch sử từ Cloudflare D1. Vui lòng kiểm tra lại kết nối mạng!");
                return;
            }

            let model = null;
            if (window.AIScheduler && typeof window.AIScheduler.trainFromHistory === 'function') {
                model = window.AIScheduler.trainFromHistory(historyRows);
            }

            if (window.hideGlobalLoading) window.hideGlobalLoading();
            const trainedCount = model ? (model.trainedRows || 0) : historyRows.length;
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

            showCustomAlert(
                "Huấn luyện AI thành công",
                `Đã cập nhật mô hình AI lúc ${timeStr}!\n\n📊 Dữ liệu thực tế: ${trainedCount.toLocaleString('vi-VN')} dòng từ bảng lịch sử (Cloudflare D1)\n👥 Cặp thói quen nhân sự: ${affinityCount.toLocaleString('vi-VN')} mẫu thói quen\n🚦 Tắc nghẽn máy móc & khung giờ vàng đã được tối ưu.`
            );
        } catch(err) {
            if (window.hideGlobalLoading) window.hideGlobalLoading();
            showCustomAlert("Thông báo", "Lỗi huấn luyện AI: " + err.message);
        }
    };

    async function fetchDirectly() {
        try {
            const apiUrl = (typeof getApiUrl === 'function') ? getApiUrl() : 'https://pmcg-api.dpthai-ttytmk.workers.dev/';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getLichSu', args: [] })
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
                if (rows && rows.length > 0) {
                    executeTraining(rows);
                } else {
                    fetchDirectly();
                }
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
    callApi('getQuickLinks', [], links => {
        const uls = document.querySelectorAll('.khu-vuc-lien-ket');
        if (uls.length) {
            let list = (links && Array.isArray(links) && links.length) ? links : [
                { icon: "📜", ten: "Tra cứu Văn bản & BHXH", url: "javascript:openDocLookupModal()" },
                { icon: "📖", ten: "Hướng dẫn sử dụng phần mềm", url: "javascript:openHdsdModal()" },
                { icon: "📋", ten: "Quy trình Kỹ thuật PHCN", url: "https://kcb.vn/" }
            ];

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
        }
        window.renderAdminQuickLinksUI(links);
    }, err => {
        console.warn("[QuickLinks] Lỗi tải danh sách liên kết:", err);
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
        div.style.cssText = 'display: flex; gap: 8px; align-items: center; background: #fff; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1;';
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
    div.style.cssText = 'display: flex; gap: 8px; align-items: center; background: #fff; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1;';
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
            if (typeof updateUnscheduledStats === 'function') updateUnscheduledStats([]);
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

// ============================================================
// 📜 QUẢN LÝ & TRA CỨU VĂN BẢN & BHXH (DOCUMENT LOOKUP SYSTEM)
// ============================================================
// 📖 HƯỚNG DẪN SỬ DỤNG (HDSD MODAL VIEWER)
// ============================================================
window.openHdsdModal = function() {
    const modal = document.getElementById('modal-hdsd-viewer');
    const iframe = document.getElementById('hdsd-modal-iframe');
    if (iframe && (!iframe.src || iframe.src === 'about:blank' || iframe.src.endsWith('about:blank'))) {
        iframe.src = 'hdsd.html?v=3.2.0';
    }
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeHdsdModal = function() {
    const modal = document.getElementById('modal-hdsd-viewer');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
};

// ============================================================
// 📜 TRA CỨU VĂN BẢN & QUY ĐỊNH BHXH / Y TẾ (D1 DATABASE)
// ============================================================
window.cachedDocuments = [];
window.isDocAdminEditing = false;
window.editingDocIndex = -1;

const STANDARD_DEFAULT_DOCS = [
    {
        doc_number: "QĐ 3981/QĐ-BYT",
        title: "Hướng dẫn Quy trình Kỹ thuật Khám chữa bệnh Chuyên ngành Phục hồi chức năng (Tập 1, 2, 3)",
        agency: "Bộ Y tế",
        signed_date: "01/10/2014",
        view_link: "https://kcb.vn/",
        download_link: "https://kcb.vn/"
    },
    {
        doc_number: "TT 46/2013/TT-BYT",
        title: "Hướng dẫn Quy trình Kỹ thuật Khám chữa bệnh Chuyên ngành Y học cổ truyền (Mới nhất)",
        agency: "Bộ Y tế",
        signed_date: "31/12/2013",
        view_link: "https://kcb.vn/",
        download_link: "https://kcb.vn/"
    },
    {
        doc_number: "CV 1085/BYT-BH",
        title: "Hướng dẫn vướng mắc thanh toán chi phí KCB (Nhóm dịch vụ YHCT - PHCN cùng cơ chế)",
        agency: "Bộ Y tế",
        signed_date: "08/03/2024",
        view_link: "https://baohiemxahoi.gov.vn/",
        download_link: "https://baohiemxahoi.gov.vn/"
    },
    {
        doc_number: "TT 32/2023/TT-BYT",
        title: "Phụ lục danh mục chuyên môn & định mức kỹ thuật Bác sĩ Y học cổ truyền",
        agency: "Bộ Y tế",
        signed_date: "31/12/2023",
        view_link: "https://kcb.vn/",
        download_link: "https://kcb.vn/"
    },
    {
        doc_number: "TT 22/2023/TT-BYT",
        title: "Quy định thống nhất giá dịch vụ khám bệnh, chữa bệnh BHYT giữa các bệnh viện",
        agency: "Bộ Y tế",
        signed_date: "17/11/2023",
        view_link: "https://kcb.vn/",
        download_link: "https://kcb.vn/"
    },
    {
        doc_number: "QĐ 130/QĐ-BYT",
        title: "Chuẩn và định dạng dữ liệu đầu ra phục vụ quản lý và giám định, thanh toán BHYT",
        agency: "Bộ Y tế",
        signed_date: "18/01/2023",
        view_link: "https://kcb.vn/",
        download_link: "https://kcb.vn/"
    }
];

window.openDocLookupModal = function() {
    const modal = document.getElementById('modal-doc-lookup');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    window.loadDocumentListFromServer();
};

window.closeDocLookupModal = function() {
    const modal = document.getElementById('modal-doc-lookup');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    window.hideDocAddPanel();
};

window.loadDocumentListFromServer = function() {
    const tbody = document.getElementById('doc-lookup-table-body');
    if (window.cachedDocuments && window.cachedDocuments.length > 0) {
        window.renderDocLookupTableUI(window.cachedDocuments);
        return;
    }

    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" align="center" style="padding: 30px; color: #64748b;">⏳ Đang nạp danh sách văn bản từ Cloudflare D1...</td></tr>';
    }

    const handleSuccess = (res) => {
        let list = [];
        if (res && res.status === 'success' && res.data) {
            list = Array.isArray(res.data) ? res.data : [];
        } else if (Array.isArray(res)) {
            list = res;
        }

        if (!list || list.length === 0) {
            list = [...STANDARD_DEFAULT_DOCS];
        }
        window.cachedDocuments = list;
        window.renderDocLookupTableUI(list);
    };

    const handleFailure = (err) => {
        console.warn("[DocLookup] Lỗi kết nối D1, dùng danh mục chuẩn:", err);
        window.cachedDocuments = [...STANDARD_DEFAULT_DOCS];
        window.renderDocLookupTableUI(window.cachedDocuments);
    };

    if (window.google && window.google.script && window.google.script.run) {
        window.google.script.run
            .withSuccessHandler(handleSuccess)
            .withFailureHandler(handleFailure)
            .getDocuments();
    } else if (typeof callApi === 'function') {
        callApi('getDocuments', [], handleSuccess, handleFailure);
    } else {
        handleFailure("No API");
    }
};

window.renderDocLookupTableUI = function(docs) {
    const tbody = document.getElementById('doc-lookup-table-body');
    const badge = document.getElementById('doc-count-badge');
    if (!tbody) return;

    if (badge) badge.innerText = docs.length;

    if (!docs || docs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" align="center" style="padding: 30px; color: #94a3b8;">Không tìm thấy văn bản nào thỏa điều kiện.</td></tr>';
        return;
    }

    const htmlContent = docs.map((doc, idx) => {
        const docNum = doc.doc_number || doc.soHieu || '<i style="color:#94a3b8;">Chưa có</i>';
        const title = doc.title || doc.tenVanBan || '';
        const agency = doc.agency || doc.coQuan || 'Bộ Y tế';
        const date = doc.signed_date || doc.ngayKy || '--/--/----';
        const viewLink = doc.view_link || doc.linkXem || 'https://kcb.vn/';
        const downLink = doc.download_link || doc.linkTai || 'https://baohiemxahoi.gov.vn/';

        const adminBtns = window.isDocAdminEditing ? 
            `<button type="button" onclick="editDocItemUI(${idx})" style="padding: 4px 8px; background: #0284c7; color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight:600; cursor: pointer; margin-left: 3px;" title="Chỉnh sửa">✏️ Sửa</button>
             <button type="button" onclick="removeDocItemUI(${idx})" style="padding: 4px 8px; background: #ef4444; color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight:600; cursor: pointer; margin-left: 3px;" title="Xóa">🗑️ Xóa</button>` : '';

        return `
            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <td style="padding: 10px; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
                <td style="padding: 10px; font-weight: 700; color: #1e3a8a;">${docNum}</td>
                <td style="padding: 10px; color: #1e293b; line-height: 1.4; font-weight: 500;">${escapeHtml(title)}</td>
                <td style="padding: 10px; color: #475569;"><span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 12px; font-size: 11.5px; font-weight: 600; white-space: nowrap;">${escapeHtml(agency)}</span></td>
                <td style="padding: 10px; text-align: center; color: #64748b; font-size: 12px;">${date}</td>
                <td style="padding: 10px; text-align: center; white-space: nowrap;">
                    <a href="${viewLink}" target="_blank" style="padding: 4px 9px; background: #2563eb; color: #fff; border-radius: 4px; text-decoration: none; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;" title="Xem trực tiếp">
                        <span>👁️</span> Xem
                    </a>
                    <a href="${downLink}" target="_blank" style="padding: 4px 9px; background: #059669; color: #fff; border-radius: 4px; text-decoration: none; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; margin-left: 3px;" title="Tải file PDF">
                        <span>📥</span> Tải
                    </a>
                    ${adminBtns}
                </td>
            </tr>`;
    }).join('');

    tbody.innerHTML = htmlContent;
};

window.filterDocLookupList = function() {
    const rawQuery = document.getElementById('doc-search-input')?.value || '';
    const queryNoTone = removeVietnameseTones(rawQuery);
    const tokens = queryNoTone.split(/\s+/).filter(Boolean);
    const agency = document.getElementById('doc-filter-agency')?.value || '';

    const filtered = (window.cachedDocuments || []).filter(doc => {
        const docNum = (doc.doc_number || doc.soHieu || '').toLowerCase();
        const title = (doc.title || doc.tenVanBan || '').toLowerCase();
        const ag = (doc.agency || doc.coQuan || '').toLowerCase();

        const allText = `${docNum} ${title} ${ag}`;
        const allTextNoTone = removeVietnameseTones(allText);

        const matchQuery = !tokens.length || tokens.every(tok => allTextNoTone.includes(tok));
        const matchAgency = !agency || (doc.agency || doc.coQuan || '').includes(agency);

        return matchQuery && matchAgency;
    });

    window.renderDocLookupTableUI(filtered);
};

window.showDocAddPanel = function() {
    window.isDocAdminEditing = true;
    window.editingDocIndex = -1;
    const panel = document.getElementById('doc-admin-editor-panel');
    const titleEl = document.getElementById('doc-editor-title');
    const btnSubmit = document.getElementById('btn-submit-doc');
    const btnSave = document.getElementById('btn-save-doc-admin');

    if (titleEl) titleEl.innerText = '➕ THÊM VĂN BẢN QUY ĐỊNH MỚI';
    if (btnSubmit) btnSubmit.innerText = 'Thêm Vào Danh Sách';

    // Clear inputs
    ['new-doc-number', 'new-doc-title', 'new-doc-agency', 'new-doc-date', 'new-doc-viewlink', 'new-doc-downlink'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const agencyInput = document.getElementById('new-doc-agency');
    if (agencyInput) agencyInput.value = 'Bộ Y tế';

    if (panel) panel.style.display = 'block';
    if (btnSave) btnSave.style.display = 'inline-block';
    window.renderDocLookupTableUI(window.cachedDocuments);
};

window.hideDocAddPanel = function() {
    const panel = document.getElementById('doc-admin-editor-panel');
    if (panel) panel.style.display = 'none';
};

window.toggleDocAdminMode = function() {
    window.isDocAdminEditing = !window.isDocAdminEditing;
    const panel = document.getElementById('doc-admin-editor-panel');
    const btnSave = document.getElementById('btn-save-doc-admin');
    const btnToggle = document.getElementById('btn-admin-manage-docs');

    if (btnSave) btnSave.style.display = window.isDocAdminEditing ? 'inline-block' : 'none';
    if (btnToggle) {
        btnToggle.style.background = window.isDocAdminEditing ? '#dc2626' : '#0284c7';
        btnToggle.innerHTML = window.isDocAdminEditing ? '<span>✖</span> Thoát Sửa' : '<span>⚙️</span> Quản Lý / Sửa';
    }

    if (!window.isDocAdminEditing && panel) panel.style.display = 'none';
    window.renderDocLookupTableUI(window.cachedDocuments);
};

window.editDocItemUI = function(idx) {
    if (idx < 0 || idx >= window.cachedDocuments.length) return;
    window.editingDocIndex = idx;
    window.isDocAdminEditing = true;
    const doc = window.cachedDocuments[idx];

    const panel = document.getElementById('doc-admin-editor-panel');
    const titleEl = document.getElementById('doc-editor-title');
    const btnSubmit = document.getElementById('btn-submit-doc');
    const btnSave = document.getElementById('btn-save-doc-admin');

    if (titleEl) titleEl.innerText = '✏️ CHỈNH SỬA VĂN BẢN: ' + (doc.doc_number || doc.title);
    if (btnSubmit) btnSubmit.innerText = 'Cập Nhật Thay Đổi';

    document.getElementById('new-doc-number').value = doc.doc_number || doc.soHieu || '';
    document.getElementById('new-doc-title').value = doc.title || doc.tenVanBan || '';
    document.getElementById('new-doc-agency').value = doc.agency || doc.coQuan || '';
    document.getElementById('new-doc-date').value = doc.signed_date || doc.ngayKy || '';
    document.getElementById('new-doc-viewlink').value = doc.view_link || doc.linkXem || '';
    document.getElementById('new-doc-downlink').value = doc.download_link || doc.linkTai || '';

    if (panel) panel.style.display = 'block';
    if (btnSave) btnSave.style.display = 'inline-block';
    panel.scrollIntoView({ behavior: 'smooth' });
};

window.cancelEditDoc = function() {
    window.editingDocIndex = -1;
    window.hideDocAddPanel();
};

window.addNewDocToListUI = function() {
    const num = document.getElementById('new-doc-number')?.value?.trim();
    const title = document.getElementById('new-doc-title')?.value?.trim();
    const agency = document.getElementById('new-doc-agency')?.value?.trim() || "Bộ Y tế";
    const date = document.getElementById('new-doc-date')?.value?.trim() || "--/--/----";
    const viewLink = document.getElementById('new-doc-viewlink')?.value?.trim() || "https://kcb.vn/";
    const downLink = document.getElementById('new-doc-downlink')?.value?.trim() || "https://baohiemxahoi.gov.vn/";

    if (!title) {
        alert("Vui lòng nhập Tên văn bản / Trích yếu nội dung!");
        return;
    }

    const docObj = {
        doc_number: num || "",
        title: title,
        agency: agency,
        signed_date: date,
        view_link: viewLink,
        download_link: downLink
    };

    if (window.editingDocIndex >= 0 && window.editingDocIndex < window.cachedDocuments.length) {
        window.cachedDocuments[window.editingDocIndex] = docObj;
        window.editingDocIndex = -1;
    } else {
        window.cachedDocuments.unshift(docObj);
    }

    window.hideDocAddPanel();
    window.renderDocLookupTableUI(window.cachedDocuments);
    const btnSave = document.getElementById('btn-save-doc-admin');
    if (btnSave) btnSave.style.display = 'inline-block';
    alert("Đã cập nhật danh sách! Vui lòng bấm '💾 Lưu Thay Đổi Vào D1' ở góc dưới để lưu vĩnh viễn.");
};

window.removeDocItemUI = function(index) {
    if (index < 0 || index >= window.cachedDocuments.length) return;
    const doc = window.cachedDocuments[index];
    if (!confirm("Bác sĩ có chắc muốn xóa văn bản: " + (doc.title || doc.doc_number) + "?")) return;

    window.cachedDocuments.splice(index, 1);
    window.renderDocLookupTableUI(window.cachedDocuments);
    const btnSave = document.getElementById('btn-save-doc-admin');
    if (btnSave) btnSave.style.display = 'inline-block';
};

window.restoreDefaultStandardDocs = function() {
    if (!confirm("Khôi phục lại danh sách 6 văn bản quy định YHCT - PHCN chuẩn 2026?")) return;
    window.cachedDocuments = [...STANDARD_DEFAULT_DOCS];
    window.renderDocLookupTableUI(window.cachedDocuments);
    const btnSave = document.getElementById('btn-save-doc-admin');
    if (btnSave) btnSave.style.display = 'inline-block';
    alert("Đã tải lại mẫu chuẩn! Bác sĩ bấm '💾 Lưu Thay Đổi Vào D1' để ghi nhận vào hệ thống.");
};

window.saveDocListToServer = function() {
    const btn = document.getElementById('btn-save-doc-admin');
    if (btn) { btn.innerText = "⏳ Đang lưu..."; btn.disabled = true; }

    const handleSuccess = () => {
        if (btn) { btn.innerText = "💾 Lưu Thay Đổi Vào D1"; btn.disabled = false; }
        alert("✅ Đã lưu toàn bộ danh sách văn bản thành công vào Cloudflare D1 Database!");
    };

    const handleFailure = (err) => {
        if (btn) { btn.innerText = "💾 Lưu Thay Đổi Vào D1"; btn.disabled = false; }
        alert("❌ Lỗi khi lưu văn bản lên máy chủ: " + (err.message || err));
    };

    if (window.google && window.google.script && window.google.script.run) {
        window.google.script.run
            .withSuccessHandler(handleSuccess)
            .withFailureHandler(handleFailure)
            .saveDocuments(window.cachedDocuments);
    } else if (typeof callApi === 'function') {
        callApi('saveDocuments', [window.cachedDocuments], handleSuccess, handleFailure);
    }
};


// ============================================================
// 📱 MOBILE & TABLET NAVIGATION CONTROLLER (v3.2.0)
// ============================================================

window.switchMobileNav = function(tabId, el) {
    if (tabId === 'tab-settings') tabId = 'tab-admin';
    if (el) {
        document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));
        el.classList.add('active');
    }
    const desktopTabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (desktopTabBtn) {
        desktopTabBtn.click();
    } else {
        document.querySelectorAll('.tab-content, .page').forEach(c => c.classList.remove('active'));
        const targetEl = document.getElementById(tabId);
        if (targetEl) targetEl.classList.add('active');
        if (tabId === 'tab-admin') {
            if (typeof loadSystemSettings === 'function') loadSystemSettings();
            if (typeof switchAdminSection === 'function') {
                const activeSubBtn = document.querySelector('.admin-nav-btn.active') || document.getElementById('nav-btn-settings');
                switchAdminSection('admin-sec-settings', activeSubBtn);
            }
        }
        try { history.replaceState(null, '', '#tab=' + tabId); } catch(e) {}
    }
    window.toggleMobileDrawer(false);
};

window.toggleMobileDrawer = function(forceState) {
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-drawer-overlay');
    if (!drawer || !overlay) return;

    const isActive = drawer.classList.contains('active');
    const newState = (forceState !== undefined) ? forceState : !isActive;

    if (newState) {
        drawer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.openTabFromDrawer = function(tabId) {
    if (tabId === 'tab-settings') tabId = 'tab-admin';
    window.toggleMobileDrawer(false);
    const mobileBottomBtn = document.querySelector(`.mobile-nav-item[data-tab="${tabId}"]`);
    if (mobileBottomBtn) {
        document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));
        mobileBottomBtn.classList.add('active');
    } else {
        document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));
    }
    const desktopTabBtn = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
    if (desktopTabBtn) {
        desktopTabBtn.click();
    } else {
        document.querySelectorAll('.tab-content, .page').forEach(c => c.classList.remove('active'));
        const targetEl = document.getElementById(tabId);
        if (targetEl) targetEl.classList.add('active');
        if (tabId === 'tab-admin') {
            if (typeof loadSystemSettings === 'function') loadSystemSettings();
            if (typeof switchAdminSection === 'function') {
                const activeSubBtn = document.querySelector('.admin-nav-btn.active') || document.getElementById('nav-btn-settings');
                switchAdminSection('admin-sec-settings', activeSubBtn);
            }
        }
        try { history.replaceState(null, '', '#tab=' + tabId); } catch(e) {}
    }
};

window.openAddPatientModal = function() {
    window.switchMobileNav('tab-patients', document.querySelector('.mobile-nav-item[data-tab="tab-patients"]'));
    setTimeout(() => {
        if (typeof window.openMobileFormForEdit === 'function') window.openMobileFormForEdit('pat');
        const nameInput = document.getElementById('pat-name');
        if (nameInput) {
            nameInput.focus();
        }
    }, 200);
};

// Sync Mobile Bottom Nav with Hash Changes
window.addEventListener('hashchange', () => {
    const currentTab = (window.location.hash || '#tab-home').substring(1);
    const matchingMobileBtn = document.querySelector(`.mobile-nav-item[data-tab="${currentTab}"]`);
    if (matchingMobileBtn) {
        document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));
        matchingMobileBtn.classList.add('active');
    }
});


// ============================================================
// 📱 MOBILE FORM TOGGLE & EDIT EXPANSION HELPERS
// ============================================================

window.toggleMobileForm = function(btn) {
    if (!btn) return;
    const parent = btn.closest('.split-layout') || btn.closest('.tab-content') || document.querySelector('.tab-content.active');
    if (!parent) return;
    const form = parent.querySelector('.sidebar-form');
    if (!form) return;
    
    const isShowing = form.classList.contains('show-mobile-form');
    if (isShowing) {
        form.classList.remove('show-mobile-form');
        btn.innerHTML = '➕ Thêm Mới / Nhập Liệu';
        btn.classList.remove('active');
    } else {
        form.classList.add('show-mobile-form');
        btn.innerHTML = '✖ Đóng Khung Nhập Liệu';
        btn.classList.add('active');
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.openMobileFormForEdit = function(type) {
    const tabMap = {
        machine: 'tab-machines',
        machines: 'tab-machines',
        proc: 'tab-procedures',
        procedures: 'tab-procedures',
        staff: 'tab-staff',
        room: 'tab-rooms',
        rooms: 'tab-rooms',
        pat: 'tab-patients',
        patient: 'tab-patients',
        patients: 'tab-patients',
        busy: 'tab-busy'
    };
    const tabId = tabMap[type] || ('tab-' + type);
    const targetTab = document.getElementById(tabId) || document.querySelector('.tab-content.active');
    if (targetTab) {
        const form = targetTab.querySelector('.sidebar-form');
        const toggleBtn = targetTab.querySelector('.mobile-toggle-form-btn');
        if (form) {
            form.classList.add('show-mobile-form');
            if (toggleBtn) {
                toggleBtn.innerHTML = '✖ Đóng Khung Nhập Liệu';
                toggleBtn.classList.add('active');
            }
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};



// ============================================================
// 🏢 QUẢN TRỊ ĐƠN VỊ & BẢN QUYỀN SAAS (SUPER ADMIN)
// ============================================================
window.loadTenantsList = function () {
    const tbody = document.getElementById('tenants-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748b;">⏳ Đang tải danh sách đơn vị từ máy chủ Cloudflare D1...</td></tr>';

    if (typeof callApi === 'function') {
        callApi('getTenantsList', [], res => {
            const list = Array.isArray(res) ? res : (res?.data || []);
            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">Chưa có đơn vị nào được tạo.</td></tr>';
                return;
            }

            // Thống kê
            let activeCount = 0, enterpriseCount = 0;
            list.forEach(t => {
                if (t.is_active) activeCount++;
                if (t.plan_tier === 'ENTERPRISE') enterpriseCount++;
            });
            document.getElementById('stat-total-tenants').innerText = list.length;
            document.getElementById('stat-active-tenants').innerText = activeCount;
            document.getElementById('stat-enterprise-tenants').innerText = enterpriseCount;

            // Render bảng
            tbody.innerHTML = list.map(t => {
                const isActive = t.is_active === 1;
                const statusBadge = isActive
                    ? '<span style="background:#dcfce7; color:#15803d; padding:4px 8px; border-radius:6px; font-weight:700; font-size:11px;">🟢 Hoạt Động</span>'
                    : '<span style="background:#fee2e2; color:#b91c1c; padding:4px 8px; border-radius:6px; font-weight:700; font-size:11px;">🔴 Tạm Khóa</span>';

                const planBadge = `<span style="background:#e0e7ff; color:#3730a3; padding:3px 8px; border-radius:6px; font-weight:700; font-size:11px;">${t.plan_tier || 'PRO'}</span>`;

                return `
                    <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <td style="padding:12px 14px; font-weight:700; color:#1e40af;">${t.unit_code}</td>
                        <td style="padding:12px 14px; font-weight:600; color:#1e293b;">${t.unit_name}</td>
                        <td style="padding:12px 14px;">${planBadge}</td>
                        <td style="padding:12px 14px; color:#475569;">${t.expires_at || 'Vĩnh viễn'}</td>
                        <td style="padding:12px 14px; font-size:12px; color:#64748b;">${t.max_staff || 30} KTV / ${t.max_patients || 150} BN</td>
                        <td style="padding:12px 14px; font-size:12px; color:#64748b;">${t.phone || '-'}</td>
                        <td style="padding:12px 14px; text-align:center;">${statusBadge}</td>
                        <td style="padding:12px 14px; text-align:center;">
                            <div style="display:flex; justify-content:center; gap:6px;">
                                <button class="btn btn-sm btn-secondary" onclick="openEditTenantModal('${t.unit_code}', '${encodeURIComponent(t.unit_name)}', '${t.plan_tier}', '${t.expires_at}', ${t.max_staff}, ${t.max_patients}, '${t.phone || ''}')" title="Chỉnh sửa / Gia hạn">✏️ Sửa</button>
                                <button class="btn btn-sm btn-warning" onclick="resetTenantPasswordPrompt('${t.unit_code}')" title="Đặt lại mật khẩu Admin">🔑 Pass</button>
                                <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleTenantStatus('${t.unit_code}', ${isActive ? 0 : 1})" title="${isActive ? 'Khóa đơn vị' : 'Mở khóa đơn vị'}">${isActive ? '🔒 Khóa' : '🔓 Mở'}</button>
                                ${t.unit_code !== 'bvtks_cs2' ? `<button class="btn btn-sm btn-danger" onclick="deleteTenantPrompt('${t.unit_code}', '${encodeURIComponent(t.unit_name)}')" title="Xóa vĩnh viễn">🗑️ Xóa</button>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }, err => {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#e11d48;">Lỗi khi tải danh sách: ${err && err.message ? err.message : 'Không xác định'}</td></tr>`;
        });
    }
};

window.openAddTenantModal = function () {
    document.getElementById('modal-tenant-title').innerText = '➕ Thêm Bệnh Viện / Đơn Vị Mới';
    document.getElementById('tenant-form-code').value = '';
    document.getElementById('tenant-form-code').disabled = false;
    document.getElementById('tenant-form-name').value = '';
    document.getElementById('tenant-form-plan').value = 'PRO';
    document.getElementById('tenant-form-expires').value = '2099-12-31';
    document.getElementById('tenant-form-max-staff').value = '30';
    document.getElementById('tenant-form-max-patients').value = '150';
    document.getElementById('tenant-form-phone').value = '';
    document.getElementById('tenant-form-password').value = 'admin123';
    document.getElementById('modal-tenant-form').style.display = 'flex';
};

window.openEditTenantModal = function (code, encName, plan, expires, maxStaff, maxPatients, phone) {
    document.getElementById('modal-tenant-title').innerText = '✏️ Chỉnh Sửa & Gia Hạn Đơn Vị: ' + code;
    document.getElementById('tenant-form-code').value = code;
    document.getElementById('tenant-form-code').disabled = true;
    document.getElementById('tenant-form-name').value = decodeURIComponent(encName);
    document.getElementById('tenant-form-plan').value = plan || 'PRO';
    document.getElementById('tenant-form-expires').value = expires || '2099-12-31';
    document.getElementById('tenant-form-max-staff').value = maxStaff || 30;
    document.getElementById('tenant-form-max-patients').value = maxPatients || 150;
    document.getElementById('tenant-form-phone').value = phone || '';
    document.getElementById('tenant-form-password').value = '';
    document.getElementById('modal-tenant-form').style.display = 'flex';
};

window.closeTenantModal = function () {
    document.getElementById('modal-tenant-form').style.display = 'none';
};

window.saveTenantData = function () {
    const isEdit = document.getElementById('tenant-form-code').disabled;
    const code = document.getElementById('tenant-form-code').value.trim().toLowerCase();
    const name = document.getElementById('tenant-form-name').value.trim();
    const plan = document.getElementById('tenant-form-plan').value;
    const expires = document.getElementById('tenant-form-expires').value;
    const maxStaff = parseInt(document.getElementById('tenant-form-max-staff').value || 30, 10);
    const maxPatients = parseInt(document.getElementById('tenant-form-max-patients').value || 150, 10);
    const phone = document.getElementById('tenant-form-phone').value.trim();
    const password = document.getElementById('tenant-form-password').value.trim();

    if (!code || !name) {
        alert('Vui lòng nhập đầy đủ Mã đơn vị và Tên đơn vị!');
        return;
    }

    const payload = {
        unit_code: code,
        unit_name: name,
        plan_tier: plan,
        expires_at: expires,
        max_staff: maxStaff,
        max_patients: maxPatients,
        phone: phone,
        admin_password: password || 'admin123'
    };

    const action = isEdit ? 'updateTenant' : 'addTenant';
    const btn = document.getElementById('btn-save-tenant');
    if (btn) { btn.innerText = '⏳ Đang lưu...'; btn.disabled = true; }

    callApi(action, [payload], res => {
        if (btn) { btn.innerText = '💾 Lưu Đơn Vị'; btn.disabled = false; }
        closeTenantModal();
        alert(isEdit ? 'Đã cập nhật thông tin đơn vị thành công!' : 'Đã tạo mới đơn vị thành công!');
        loadTenantsList();
    }, err => {
        if (btn) { btn.innerText = '💾 Lưu Đơn Vị'; btn.disabled = false; }
        alert('Lỗi: ' + (err && err.message ? err.message : 'Không thể lưu đơn vị'));
    });
};

window.toggleTenantStatus = function (code, newStatus) {
    const actionText = newStatus === 1 ? 'MỞ KHÓA' : 'TẠM KHÓA';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} đơn vị '${code}' không?`)) return;

    callApi('toggleTenantStatus', [code, newStatus], res => {
        loadTenantsList();
    }, err => {
        alert('Lỗi: ' + (err && err.message ? err.message : 'Không thể thay đổi trạng thái'));
    });
};

window.resetTenantPasswordPrompt = function (code) {
    const newPass = prompt(`Nhập mật khẩu Admin mới cho đơn vị '${code}':`, 'admin123');
    if (!newPass) return;

    callApi('resetTenantAdminPassword', [code, newPass], res => {
        alert(`Đã đặt lại mật khẩu Admin cho đơn vị '${code}' thành công!`);
    }, err => {
        alert('Lỗi: ' + (err && err.message ? err.message : 'Không thể đặt lại mật khẩu'));
    });
};

window.deleteTenantPrompt = function (code, encName) {
    const name = decodeURIComponent(encName);
    if (!confirm(`⚠️ CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn vị '${name}' (${code}) và toàn bộ dữ liệu xếp lịch, bệnh nhân, nhân sự của đơn vị này không?`)) return;

    callApi('deleteTenant', [code], res => {
        alert(`Đã xóa thành công đơn vị '${code}'!`);
        loadTenantsList();
    }, err => {
        alert('Lỗi: ' + (err && err.message ? err.message : 'Không thể xóa đơn vị'));
    });
};


// ============================================================
// 🔑 ĐỔI MẬT KHẨU TÀI KHOẢN (SUPER ADMIN & ALL USERS)
// ============================================================
window.openChangePasswordModal = function() {
    const userMenu = document.getElementById('user-dropdown-menu');
    if (userMenu) userMenu.style.display = 'none';

    let currentUsername = 'admin';
    try {
        const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
        currentUsername = sess.username || currentUsername;
    } catch(e) {}

    const uInput = document.getElementById('cpw-username');
    if (uInput) uInput.value = currentUsername;

    const oldInput = document.getElementById('cpw-old-password');
    const newInput = document.getElementById('cpw-new-password');
    const confInput = document.getElementById('cpw-confirm-password');

    if (oldInput) oldInput.value = '';
    if (newInput) newInput.value = '';
    if (confInput) confInput.value = '';

    const modal = document.getElementById('modal-change-password');
    if (modal) modal.style.display = 'flex';
};

window.closeChangePasswordModal = function() {
    const modal = document.getElementById('modal-change-password');
    if (modal) modal.style.display = 'none';
};

window.submitChangePassword = async function() {
    const uName = (document.getElementById('cpw-username')?.value || '').trim();
    const oldPass = (document.getElementById('cpw-old-password')?.value || '').trim();
    const newPass = (document.getElementById('cpw-new-password')?.value || '').trim();
    const confPass = (document.getElementById('cpw-confirm-password')?.value || '').trim();

    if (!oldPass) {
        alert('⚠️ Vui lòng nhập mật khẩu hiện tại!');
        return;
    }
    if (!newPass || newPass.length < 6) {
        alert('⚠️ Mật khẩu mới phải có tối thiểu 6 ký tự!');
        return;
    }
    if (newPass !== confPass) {
        alert('⚠️ Mật khẩu xác nhận không khớp với mật khẩu mới!');
        return;
    }

    const btn = document.getElementById('btn-save-change-password');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Đang lưu...';
    }

    try {
        const currentUnit = localStorage.getItem('pm_unit_code') || 'bvtks_cs2';
        const res = await executeApiTask('changePassword', [{
            username: uName,
            old_password: oldPass,
            new_password: newPass,
            unit_code: currentUnit
        }]);

        if (res && res.status === 'success') {
            alert('🎉 ' + (res.data?.message || 'Đã đổi mật khẩu thành công!'));
            closeChangePasswordModal();
        } else {
            alert('❌ ' + (res?.error || 'Không thể đổi mật khẩu. Vui lòng thử lại!'));
        }
    } catch(err) {
        console.error('Change password error:', err);
        alert('❌ Lỗi kết nối: ' + (err.message || String(err)));
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>💾</span> Lưu Mật Khẩu';
        }
    }
};
