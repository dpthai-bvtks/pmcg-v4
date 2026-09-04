
window.toggleUserDropdown = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const menu = document.getElementById('user-dropdown-menu');
    const arrow = document.getElementById('user-dropdown-arrow');
    if (!menu) return;
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
    if (arrow) arrow.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
};

window.openChangePasswordModal = function(e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    // Đóng dropdown
    const userMenu = document.getElementById('user-dropdown-menu');
    if (userMenu) userMenu.style.display = 'none';
    const arrow = document.getElementById('user-dropdown-arrow');
    if (arrow) arrow.style.transform = 'rotate(0deg)';

    // Populate username
    let currentUsername = 'admin';
    try {
        const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
        currentUsername = sess.username || currentUsername;
    } catch(e2) {}

    // Lấy modal và hiển thị trực tiếp bằng removeProperty để xóa display:none cũ
    const modal = document.getElementById('modal-change-password');
    if (modal) {
        // Gán username
        const uInput = document.getElementById('cpw-username');
        if (uInput) uInput.value = currentUsername;
        const oldInput = document.getElementById('cpw-old-password');
        const newInput = document.getElementById('cpw-new-password');
        const confInput = document.getElementById('cpw-confirm-password');
        if (oldInput) oldInput.value = '';
        if (newInput) newInput.value = '';
        if (confInput) confInput.value = '';

        // Di chuyển modal lên body nếu chưa là con trực tiếp của body
        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }
        // Xóa style cũ và gán display mới
        modal.style.cssText = 'display:flex !important; position:fixed !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; background:rgba(15,23,42,0.65) !important; backdrop-filter:blur(4px) !important; z-index:2147483647 !important; align-items:center !important; justify-content:center !important;';

        setTimeout(() => { if (oldInput) oldInput.focus(); }, 100);
    }
};

window.closeChangePasswordModal = function() {
    const modal = document.getElementById('modal-change-password');
    if (modal) {
        modal.style.cssText = 'display:none !important;';
    }
};

window.closeProtocolModal = function() {
    const modal = document.getElementById('modal-protocol-editor');
    if (modal) modal.style.display = 'none';
};

window.saveProtocolFromModal = function() {
    if (typeof showCustomAlert === 'function') {
        showCustomAlert('Phác Đồ Mới', 'Tính năng thêm phác đồ nhanh qua cửa sổ nổi đang đồng bộ với danh mục phác đồ tiêu chuẩn.');
    } else if (typeof showThongBao === 'function') {
        showThongBao('Thông báo', 'Đang cập nhật phác đồ.', 'info');
    }
    window.closeProtocolModal();
};


window.updateAppHeader = function(unitCode, role) {
    const uCode = (unitCode || localStorage.getItem('pm_unit_code') || 'bvtks-cs2').toLowerCase();
    let sessRole = role;
    if (!sessRole) {
        try {
            const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
            sessRole = sess.role || '';
        } catch(e) {}
    }

    const appHosp = document.getElementById('app-hospital-name');
    const appSub = document.getElementById('app-sub-title');
    const appSlogan = document.getElementById('app-slogan');
    const mobSub = document.getElementById('mobile-header-date');

    const isSuper = (String(sessRole).toUpperCase() === 'SUPER_ADMIN' || String(sessRole).toUpperCase() === 'SUPERADMIN');
    if (isSuper) {
        if (appHosp) appHosp.innerText = 'T.I.M.E.S SYSTEM';
        if (appSub) appSub.innerText = 'HỆ THỐNG XẾP LỊCH THỦ THUẬT YHCT- PHCN THÔNG MINH';
        if (appSlogan) appSlogan.innerText = 'NHANH GỌN, TỐI ƯU, CHÍNH XÁC';
        if (mobSub) mobSub.innerText = 'YHCT - PHCN';
    } else if (uCode === 'bvtks-cs2') {
        if (appHosp) appHosp.innerText = 'BỆNH VIỆN THAN - KHOÁNG SẢN CS2';
        if (appSub) appSub.innerText = 'KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG';
        if (appSlogan) appSlogan.innerText = 'Y HỌC TỐT, PHỤC HỒI NHANH';
        if (mobSub) mobSub.innerText = 'Khoa YHCT - PHCN';
    } else {
        const uName = localStorage.getItem('pm_unit_name') || 'T.I.M.E.S SYSTEM';
        if (appHosp) appHosp.innerText = uName;
        if (appSub) appSub.innerText = 'Hệ thống xếp lịch thủ thuật YHCT- PHCN thông minh';
        if (appSlogan) appSlogan.innerText = 'Nhanh gọn, tối ưu, chính xác';
        if (mobSub) mobSub.innerText = 'YHCT - PHCN';
    }
};

window.openServerStatusModal = function (e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    // Đóng dropdown nếu đang mở
    const userMenu = document.getElementById('user-dropdown-menu');
    if (userMenu) userMenu.style.display = 'none';
    const arrow = document.getElementById('user-dropdown-arrow');
    if (arrow) arrow.style.transform = 'rotate(0deg)';

    // Tìm modal tĩnh trong DOM (đã có sẵn ở cuối body)
    const modal = document.getElementById('modal-server-status');
    if (!modal) { console.error('[ServerStatus] Không tìm thấy modal-server-status trong DOM!'); return; }

    // Đảm bảo modal là con trực tiếp của body để tránh bị clip bởi container cha
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    // Cập nhật thông tin đơn vị
    const uName = localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2';
    const uCode = (localStorage.getItem('pm_unit_code') || 'bvtks-cs2').toLowerCase();
    const unitEl = document.getElementById('modal-server-unit-name');
    if (unitEl) unitEl.innerText = `${uName} (${uCode})`;

    // Phân quyền: Chỉ Super Admin mới thấy các nút Sync Google Sheets, Xuất JSON, Cấu hình GAS
    let sessRole = '';
    try {
        const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
        sessRole = String(sess.role || '').toUpperCase();
    } catch (e2) {}
    const isSuperAdmin = (sessRole === 'SUPER_ADMIN' || sessRole === 'SUPERADMIN');
    const superAdminActions = document.getElementById('modal-server-super-admin-actions');
    if (superAdminActions) {
        superAdminActions.style.display = isSuperAdmin ? 'flex' : 'none';
    }

    // Hiển thị modal — dùng cssText !important (pattern đáng tin cậy nhất)
    modal.style.cssText = 'display:flex !important; position:fixed !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; background:rgba(15,23,42,0.65) !important; backdrop-filter:blur(5px) !important; z-index:2147483647 !important; align-items:center !important; justify-content:center !important;';
};

window.closeServerStatusModal = function () {
    const modal = document.getElementById('modal-server-status');
    if (modal) modal.style.setProperty('display', 'none', 'important');
};

window.toggleEmergencyBackupMenu = function (e) {
    window.openServerStatusModal(e);
};

// Đảm bảo gắn sự kiện click cho badge
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            const b = document.getElementById('server-status-badge');
            if (b) b.onclick = function (e) { window.openServerStatusModal(e); };
        });
    } else {
        const b = document.getElementById('server-status-badge');
        if (b) b.onclick = function (e) { window.openServerStatusModal(e); };
    }
}

window.pingServerConnection = function () {
    const btn = document.getElementById('btn-ping-server');
    const resultArea = document.getElementById('ping-result-area');

    // Hiển thị trạng thái đang ping
    if (btn) { btn.disabled = true; btn.innerHTML = '<span>⏳</span> Đang kiểm tra...'; }
    if (resultArea) { resultArea.style.display = 'none'; resultArea.innerHTML = ''; }

    const t0 = performance.now();
    callApi('ping', [], res => {
        const pingTime = Math.round(performance.now() - t0);
        const unitCode = res && res.unit_code ? res.unit_code : (localStorage.getItem('pm_unit_code') || 'bvtks-cs2');
        if (btn) { btn.disabled = false; btn.innerHTML = '<span>🔄</span> Kiểm Tra Tốc Độ Phản Hồi (Ping API)'; }
        if (resultArea) {
            resultArea.style.cssText = 'display:block; padding:10px 14px; border-radius:8px; font-size:12px; font-weight:600; line-height:1.8; background:#f0fdf4; border:1px solid #bbf7d0; color:#166534;';
            resultArea.innerHTML = `⚡ <strong>Phản hồi: ${pingTime} ms</strong><br>🟢 Trạng thái: Hoạt động hoàn hảo<br>🗄️ CSDL: Turso libSQL Cloud<br>🏥 Mã đơn vị: ${unitCode}`;
        }
    }, err => {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span>🔄</span> Kiểm Tra Tốc Độ Phản Hồi (Ping API)'; }
        if (resultArea) {
            resultArea.style.cssText = 'display:block; padding:10px 14px; border-radius:8px; font-size:12px; font-weight:600; line-height:1.8; background:#fef2f2; border:1px solid #fecaca; color:#991b1b;';
            resultArea.innerHTML = `⚠️ <strong>Lỗi kết nối</strong><br>${err && err.message ? err.message : 'Không thể kết nối tới máy chủ'}`;
        }
    });
};


window.sanitizeGoogleScriptUrl = function (rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let url = rawUrl.trim();
    if (!url) return '';

    // Khắc phục trường hợp dính liền 2 URL /exechttps://...
    const duplicateExecIdx = url.indexOf('/exechttps://');
    if (duplicateExecIdx !== -1) {
        url = url.substring(0, duplicateExecIdx + 5);
    } else {
        const matches = url.match(/https:\/\/script\.google\.com\/macros\/s\/[^\s/]+\/exec/g);
        if (matches && matches.length > 0) {
            url = matches[0];
        }
    }

    if (url.endsWith('/edit') || url.includes('/edit?') || url.includes('drive.google.com')) {
        url = url.replace(/\/edit.*$/, '/exec');
    }

    return url.trim();
};

let _gasCallbackOnSave = null;

window.openConfigGoogleScriptModal = function (callback) {
    _gasCallbackOnSave = typeof callback === 'function' ? callback : null;

    // Đóng dropdown và modal trạng thái nếu đang mở
    const userMenu = document.getElementById('user-dropdown-menu');
    if (userMenu) userMenu.style.display = 'none';

    const modal = document.getElementById('modal-config-gas');
    if (!modal) {
        console.error('[ConfigGAS] Không tìm thấy modal-config-gas!');
        return;
    }

    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const input = document.getElementById('gas-webhook-url-input');
    const msg = document.getElementById('gas-url-validation-msg');
    if (msg) { msg.style.display = 'none'; msg.innerHTML = ''; }

    let savedUrl = window.sanitizeGoogleScriptUrl(localStorage.getItem('times_backup_api_url') || '');
    if (savedUrl && savedUrl !== localStorage.getItem('times_backup_api_url')) {
        localStorage.setItem('times_backup_api_url', savedUrl);
    }
    if (input) {
        input.value = savedUrl;
        setTimeout(() => { input.focus(); input.select(); }, 100);
    }

    modal.style.cssText = 'display:flex !important; position:fixed !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; background:rgba(15,23,42,0.65) !important; backdrop-filter:blur(5px) !important; z-index:2147483647 !important; align-items:center !important; justify-content:center !important;';
};

window.closeConfigGoogleScriptModal = function () {
    const modal = document.getElementById('modal-config-gas');
    if (modal) modal.style.cssText = 'display:none !important;';
    _gasCallbackOnSave = null;
};

window.saveConfigGoogleScript = function () {
    const input = document.getElementById('gas-webhook-url-input');
    const msg = document.getElementById('gas-url-validation-msg');
    let url = window.sanitizeGoogleScriptUrl(input ? input.value : '');

    if (!url) {
        if (msg) {
            msg.style.cssText = 'display:block; background:#fef2f2; border:1px solid #fecaca; color:#991b1b;';
            msg.innerHTML = '⚠️ Vui lòng nhập đường dẫn URL WebApp hợp lệ!';
        }
        return;
    }

    if (input) input.value = url;

    if (!url.startsWith('https://script.google.com/') || !url.endsWith('/exec')) {
        if (msg) {
            msg.style.cssText = 'display:block; background:#fffbeb; border:1px solid #fde68a; color:#92400e;';
            msg.innerHTML = '⚠️ URL WebApp chuẩn thường có dạng: <code>https://script.google.com/macros/s/.../exec</code>. Hệ thống vẫn sẽ lưu URL này.';
        }
    }

    localStorage.setItem('times_backup_api_url', url);
    if (typeof callApi === 'function') {
        callApi('saveSystemSettings', ['gdrive_webhook_url', url]);
    }

    window.closeConfigGoogleScriptModal();
    if (typeof window.showToast === 'function') {
        window.showToast('✅ Đã lưu URL Google Apps Script thành công!', 'success');
    } else {
        alert('✅ Đã lưu URL Google Apps Script thành công!');
    }

    if (typeof _gasCallbackOnSave === 'function') {
        const cb = _gasCallbackOnSave;
        _gasCallbackOnSave = null;
        setTimeout(() => cb(url), 200);
    }
};

window.testGasConnection = async function () {
    const input = document.getElementById('gas-webhook-url-input');
    const msg = document.getElementById('gas-url-validation-msg');
    const btn = document.getElementById('btn-test-gas-conn');
    let url = window.sanitizeGoogleScriptUrl(input ? input.value : '');

    if (!url) {
        if (msg) {
            msg.style.cssText = 'display:block; background:#fef2f2; border:1px solid #fecaca; color:#991b1b;';
            msg.innerHTML = '⚠️ Vui lòng nhập URL trước khi kiểm tra!';
        }
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<span>⏳</span> Đang test...'; }
    if (msg) { msg.style.cssText = 'display:block; background:#f8fafc; border:1px solid #e2e8f0; color:#475569;'; msg.innerHTML = '🔄 Đang gửi tín hiệu kiểm tra tới Google Apps Script...'; }

    try {
        const t0 = performance.now();
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'ping', args: [] })
        });
        const elapsed = Math.round(performance.now() - t0);
        const text = await resp.text();

        if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('ServiceLogin')) {
            throw new Error("Chưa cấp quyền 'Anyone' tại mục 'Who has access' khi deploy WebApp.");
        }

        if (msg) {
            msg.style.cssText = 'display:block; background:#f0fdf4; border:1px solid #bbf7d0; color:#166534;';
            msg.innerHTML = `🟢 <strong>Kết nối thành công!</strong> (Phản hồi: ${elapsed} ms)<br>WebApp Google Apps Script đã sẵn sàng nhận dữ liệu.`;
        }
    } catch (err) {
        if (msg) {
            msg.style.cssText = 'display:block; background:#fef2f2; border:1px solid #fecaca; color:#991b1b;';
            msg.innerHTML = `❌ <strong>Lỗi kết nối:</strong> ${err.message || 'Không phản hồi'}<br><small>Kiểm tra lại quyền truy cập hoặc URL kết thúc bằng /exec.</small>`;
        }
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span>🧪</span> Kiểm Tra Kết Nối'; }
    }
};

window.configureBackupGoogleScript = function () {
    window.openConfigGoogleScriptModal();
};

// =========================================================
// TURBO CLOUDFLARE API BRIDGE & GLOBAL INITIALIZATION
// =========================================================
window.dataCache = window.dataCache || { pat: [], staff: [], machine: [], room: [], proc: [] };
var dataCache = window.dataCache;

var DEFAULT_PROTOCOLS = [
    { id: '1', name: 'Phác đồ 1', procs: ['Điện châm', 'Thủy châm', 'Điện xung'] },
    { id: '2', name: 'Phác đồ 2', procs: ['Điện châm', 'Thủy châm', 'Điện xung', 'Parafin'] },
    { id: '3', name: 'Phác đồ 3', procs: ['Điện châm', 'Thủy châm', 'Điện xung', 'Sóng ngắn'] },
    { id: '4', name: 'Phác đồ 4', procs: ['Điện châm', 'Thủy châm', 'Chiếu đèn hồng ngoại', 'Xoa bóp vùng'] },
    { id: '5', name: 'Phác đồ 5', procs: ['Thủy châm', 'Điện xung', 'Sóng ngắn'] },
    { id: '6', name: 'Phác đồ 6', procs: ['Điện châm', 'Thủy châm', 'Chiếu đèn hồng ngoại', 'Xoa bóp bấm huyệt'] },
    { id: '7', name: 'Phác đồ 7', procs: ['Điện châm liệt', 'Thủy châm', 'Điện xung', 'Tập vận động trợ giúp'] },
    { id: '8', name: 'Phác đồ 8', procs: ['Điện châm liệt', 'Thủy châm', 'Chiếu đèn hồng ngoại', 'Tập vận động trợ giúp'] },
    { id: '9', name: 'Phác đồ 9', procs: ['Thủy châm', 'Điện xung', 'Siêu âm điều trị'] },
    { id: '10', name: 'Phác đồ 10', procs: ['Chiếu đèn hồng ngoại', 'Tập vận động trợ giúp'] },
    { id: '11', name: 'Phác đồ 11', procs: ['Chiếu đèn hồng ngoại', 'Tập vận động có kháng trở'] },
    { id: '12', name: 'Phác đồ 12', procs: ['Chiếu đèn hồng ngoại', 'Tập thở PHCN'] },
    { id: '13', name: 'Phác đồ 13', procs: ['Điện xung', 'Tập thở PHCN'] }
];

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
            // Bỏ qua lỗi từ extension/Web Vitals/Cloudflare beacon bên ngoài (reportAllChanges / startTime)
            const msgStr = String(msg || '');
            const urlStr = String(url || '');
            if (msgStr.includes('startTime') || msgStr.includes('reportAllChanges') || urlStr.includes('VM')) {
                console.warn('[Notice] Bỏ qua lỗi đo lường hiệu năng bên ngoài (Web Vitals / Extension):', msg);
                return true;
            }
            console.error('JS ERROR:', msg, 'at', url, 'line', lineNo, error);
            return false;
        };

        window.addEventListener('unhandledrejection', function (event) {
            const reasonStr = String(event.reason || '');
            if (reasonStr.includes('startTime') || reasonStr.includes('reportAllChanges')) {
                event.preventDefault();
                return;
            }
            console.warn('[Unhandled Rejection]:', event.reason);
        });

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
        // 🏢 MULTI-TENANT STORAGE KEY & DOM SANITIZATION HELPERS
        // ============================================================
        function getCurrentUnitCode() {
            return (localStorage.getItem('pm_unit_code') || '').trim().toLowerCase();
        }
        function getUnitStorageKey(baseKey) {
            const u = getCurrentUnitCode();
            return u ? `${baseKey}_${u}` : baseKey;
        }
        function getBootstrapCacheKey() {
            const u = getCurrentUnitCode();
            return u ? ('times_bootstrap_cache_' + u) : 'times_bootstrap_cache';
        }
        window.getCurrentUnitCode = getCurrentUnitCode;
        window.getUnitStorageKey = getUnitStorageKey;
        window.getBootstrapCacheKey = getBootstrapCacheKey;

        function clearAllDomTables(showLoading = false) {
            const tableBodyIds = [
                'machines-list',
                'procedures-list',
                'protocols-list',
                'staff-list',
                'rooms-list',
                'patients-list',
                'busy-staff-tbody',
                'busy-pat-tbody',
                'leave-pat-tbody',
                'schedule-list',
                'count-body',
                'error-time-body',
                'error-other-body',
                'free-doc-list',
                'free-machine-list',
                'acc-list',
                'admin-employees-body',
                'chamcong-body',
                'tenants-table-body',
                'preview-thuthuat-body',
                'thongke-body',
                'stats-unscheduled-list',
                'stats-staff-list',
                'doc-lookup-table-body'
            ];

            const loadingHtml = '<tr><td colspan="12" align="center" style="padding:28px; color:#94a3b8;"><div class="spinner" style="margin:0 auto 10px auto;"></div><div style="font-size:12.5px;">Đang tải dữ liệu đơn vị...</div></td></tr>';

            tableBodyIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerHTML = showLoading ? loadingHtml : '';
                }
            });

            const previewTbody = document.getElementById('dashboard-preview-body');
            if (previewTbody) {
                previewTbody.innerHTML = showLoading 
                    ? loadingHtml 
                    : '<tr><td colspan="8" align="center" style="color:#94a3b8; padding:20px;">Chưa có dữ liệu lịch trình</td></tr>';
            }

            const statVal = showLoading ? '...' : '0';
            const elBN = document.getElementById('statBN'); if (elBN) elBN.textContent = statVal;
            const elStaff = document.getElementById('statStaff'); if (elStaff) elStaff.textContent = statVal;
            const elSched = document.getElementById('statScheduled'); if (elSched) elSched.textContent = statVal;
            const elDrop = document.getElementById('statDropped'); if (elDrop) elDrop.textContent = statVal;
            const elTotal = document.getElementById('statTotalProcs'); if (elTotal) elTotal.textContent = statVal;

            if (!showLoading) {
                ['pat-name', 'nam-sinh', 'pat-search-input', 'schedule-search-input', 'sat-search-bn', 'staff-name', 'room-name', 'proc-name'].forEach(id => {
                    const inp = document.getElementById(id);
                    if (inp) inp.value = '';
                });
            }
        }
        window.clearAllDomTables = clearAllDomTables;

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
                badge.style.background = '#059669';
                badge.innerHTML = '<span style="display:inline-block; width:6px; height:6px; background:#4ade80; border-radius:50%; box-shadow:0 0 6px #4ade80;"></span> Cloudflare & Turso';
            } else if (mode === 'backup') {
                badge.style.background = '#f39c12';
                badge.innerHTML = '<span style="display:inline-block; width:6px; height:6px; background:#fde047; border-radius:50%;"></span> Google Sheets Backup';
            } else {
                badge.style.background = '#e11d48';
                badge.innerHTML = '⚡️ Mode Ngoại Tuyến';
            }
        }
        window.updateServerStatusBadge = updateServerStatusBadge;

        function getApiUrl() {
            let backupUrl = (typeof window.sanitizeGoogleScriptUrl === 'function')
                ? window.sanitizeGoogleScriptUrl(localStorage.getItem('times_backup_api_url') || '')
                : (localStorage.getItem('times_backup_api_url') || '').trim();
            if (backupUrl && backupUrl !== localStorage.getItem('times_backup_api_url')) {
                localStorage.setItem('times_backup_api_url', backupUrl);
            }
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

        window.setCustomApiUrl = function (newUrl) {
            if (!newUrl || newUrl.trim() === '' || newUrl.trim() === DEFAULT_API_URL) {
                localStorage.removeItem('times_custom_api_url');
            } else {
                localStorage.setItem('times_custom_api_url', newUrl.trim());
            }
        };

        window.syncAllD1DataToBackupSheets = async function() {
            let backupUrl = (typeof window.sanitizeGoogleScriptUrl === 'function')
                ? window.sanitizeGoogleScriptUrl(localStorage.getItem('times_backup_api_url') || '')
                : (localStorage.getItem('times_backup_api_url') || '').trim();
            if (!backupUrl) {
                if (typeof window.openConfigGoogleScriptModal === 'function') {
                    window.openConfigGoogleScriptModal(() => {
                        window.syncAllD1DataToBackupSheets();
                    });
                    return;
                }
            }

            localStorage.setItem('times_backup_api_url', backupUrl);

            let sessRole = '';
            try {
                const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
                sessRole = String(sess.role || '').toUpperCase();
            } catch (e2) {}
            const isSuperAdmin = (sessRole === 'SUPER_ADMIN' || sessRole === 'SUPERADMIN');

            let modal = document.getElementById('sync-progress-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'sync-progress-modal';
                modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.65); z-index:2147483647; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(5px);';
                modal.innerHTML = `
                <div class="modal-dialog" style="width:520px; max-width:92%; border-radius:16px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.3); text-align:center; font-family:sans-serif; border:1px solid #e2e8f0;">
                    <div style="font-size:36px; margin-bottom:10px;">🔄</div>
                    <h3 id="sync-modal-title" style="margin:0 0 10px 0; color:#1e293b; font-size:18px; font-weight:800;">Đồng bộ Trọn bộ CSDL Turso Cloud ➔ Google Sheets</h3>
                    <p id="sync-step-text" style="color:#64748b; font-size:13px; margin:0 0 16px 0; line-height:1.5;">Đang khởi tạo kết nối...</p>
                    <div style="background:#f1f5f9; border-radius:10px; height:16px; overflow:hidden; margin-bottom:16px; position:relative; border:1px solid #e2e8f0;">
                        <div id="sync-progress-bar" style="background:linear-gradient(90deg, #10b981, #059669); width:5%; height:100%; transition:width 0.3s ease; border-radius:10px;"></div>
                    </div>
                    <div id="sync-percentage" style="font-size:14px; font-weight:800; color:#059669;">5%</div>
                    <button id="sync-close-btn" style="display:none; margin-top:16px; padding:10px 24px; background:#059669; color:#fff; border:none; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer;" onclick="document.getElementById('sync-progress-modal').style.display='none'">Hoàn tất / Đóng</button>
                </div>`;
                document.body.appendChild(modal);
            }
            if (modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }

            const titleEl = document.getElementById('sync-modal-title');
            if (titleEl) {
                titleEl.innerText = isSuperAdmin
                    ? 'Đồng bộ CSDL Toàn Cục (Tất Cả Các Đơn Vị) ➔ Google Sheets'
                    : 'Đồng bộ Trọn bộ CSDL Turso Cloud ➔ Google Sheets';
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
                const curUnitCode = (localStorage.getItem('pm_unit_code') || 'bvtks-cs2').toLowerCase();
                let dbPayload = null;

                if (isSuperAdmin) {
                    updateProgress(15, '[1/4] 📡 Đang xuất trọn bộ CSDL của TẤT CẢ các đơn vị từ Turso libSQL Cloud...');
                    try {
                        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl() : DEFAULT_API_URL;
                        const respExport = await fetch(apiUrl, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'x-unit-code': 'master'
                            },
                            body: JSON.stringify({ action: 'exportAllDatabaseForSuperAdmin', args: [], unit_code: 'master' })
                        });
                        const resExport = await respExport.json();
                        if (resExport && (resExport.status === 'success' || resExport.data)) {
                            dbPayload = resExport.data || resExport;
                        }
                    } catch (e) {
                        console.warn('[SyncSuperAdmin] Không thể exportAllDatabase, fallback:', e);
                    }
                } else {
                    updateProgress(15, `[1/4] 📡 Đang xuất CSDL đơn vị '${curUnitCode}' từ Turso libSQL Cloud...`);
                    try {
                        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl() : DEFAULT_API_URL;
                        const respExport = await fetch(apiUrl, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'x-unit-code': curUnitCode
                            },
                            body: JSON.stringify({ action: 'getBootstrapData', args: [], unit_code: curUnitCode })
                        });
                        const resExport = await respExport.json();
                        if (resExport && (resExport.status === 'success' || resExport.data)) {
                            const d = resExport.data || resExport;
                            dbPayload = {
                                benh_nhan: d.pat || d.benh_nhan || [],
                                nhan_su: d.staff || d.nhan_su || [],
                                may_moc: d.machine || d.machines || d.may_moc || [],
                                phong: d.room || d.rooms || d.phong || [],
                                thu_thuat: d.proc || d.procedures || d.thu_thuat || [],
                                phac_do: d.protocols || d.phac_do || [],
                                lich_trinh: d.schedule || d.lich_trinh || [],
                                lich_su: d.history || d.lich_su || [],
                                tai_khoan: d.accounts || d.tai_khoan || [],
                                cham_cong: d.chamCong || d.cham_cong || [],
                                thong_ke: d.thongKe || d.thong_ke || [],
                                cai_dat: d.caiDat || d.cai_dat || []
                            };
                        }
                    } catch (e) {
                        console.warn('[SyncTenant] Không thể fetch bootstrap data, fallback cache:', e);
                    }
                }

                const cache = window.dataCache || {};

                updateProgress(45, '[2/4] 📦 Đóng gói trọn bộ các bảng dữ liệu...');
                await new Promise(r => setTimeout(r, 200));

                const payload = dbPayload || {
                    benh_nhan: cache.pat || [],
                    nhan_su: cache.staff || [],
                    may_moc: cache.machine || cache.machines || [],
                    phong: cache.room || cache.rooms || [],
                    thu_thuat: cache.proc || cache.procedures || [],
                    phac_do: cache.protocols || [],
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
                    const successMsg = isSuperAdmin
                        ? '✅ Đồng bộ hoàn tất 100%! Đã lưu trọn bộ toàn bộ dữ liệu của TẤT CẢ các đơn vị vào Google Sheets!'
                        : '✅ Đồng bộ hoàn tất 100%! Đã lưu trọn bộ tất cả các trang Bệnh nhân, Nhân sự, Máy móc, Phòng, Thủ thuật, Phác đồ, Lịch trình, Lịch sử, Tài khoản vào Google Sheets!';
                    updateProgress(100, successMsg);
                    if (percentText) percentText.innerHTML = '<span style="color:#059669">🎉 ĐỒNG BỘ TRỌN BỘ THÀNH CÔNG!</span>';
                } else {
                    updateProgress(100, '⚠️ Kết quả: ' + (res.error || res.data || res.message || 'Đã gửi'));
                }
                closeBtn.style.display = 'inline-block';
            } catch (err) {
                updateProgress(100, '❌ Lỗi kết nối Google Apps Script dự phòng: ' + err.message);
                if (percentText) percentText.innerHTML = '<span style="color:#e11d48">❌ LỖI ĐỒNG BỘ</span>';
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
                const currentUnit = localStorage.getItem('pm_unit_code') || 'bvtks-cs2';

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
            return new Promise((resolve, reject) => {
                const isSilentMutation = functionName === 'saveChamCong' || functionName === 'saveReorderedData' || functionName === 'saveReorder'
                    || functionName === 'editBenhNhan' || functionName === 'editNhanSu' || functionName === 'editMayMoc' || functionName === 'editThuThuat' || functionName === 'editPhong';
                const isMutation = functionName.startsWith('add') || functionName.startsWith('edit') || functionName.startsWith('delete') || functionName.startsWith('bulkUpdate') || functionName.startsWith('save') || functionName.startsWith('chotSo') || functionName.startsWith('runScheduling') || functionName.startsWith('chuyenNgayMoi');
                
                // In-flight deduplication for non-mutation queries (getSchedule, getSystemSettings, getDataVersion...)
                if (!isMutation) {
                    const reqKey = functionName + ':' + JSON.stringify(args || []);
                    if (inFlightRequests.has(reqKey)) {
                        inFlightRequests.get(reqKey).then(
                            data => {
                                if (onSuccess) onSuccess(data);
                                resolve(data);
                            },
                            err => {
                                if (onError) onError(err);
                                reject(err);
                            }
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
                        resolve(data);
                    };

                    onError = (err) => {
                        inFlightRequests.delete(reqKey);
                        rejectInFlight(err);
                        if (origOnError) origOnError(err);
                        reject(err);
                    };
                } else {
                    const origOnSuccess = onSuccess;
                    const origOnError = onError;

                    onSuccess = (data) => {
                        if (origOnSuccess) origOnSuccess(data);
                        resolve(data);
                    };

                    onError = (err) => {
                        if (origOnError) origOnError(err);
                        reject(err);
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
            });
        }
        window.callApi = callApi;

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

        window.doLogin = function () {
            const unit = (document.getElementById('login-unit')?.value || '').trim().toLowerCase();
            const user = (document.getElementById('login-user')?.value || '').trim();
            const pass = (document.getElementById('login-pass')?.value || '').trim();
            const errDiv = document.getElementById('login-error');
            const btn = document.getElementById('btn-do-login');

            if (!unit || !user || !pass) {
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
                    const uUnit = (res.unit_code || unit).toLowerCase();
                    const uUnitName = res.unit_name || (uRole === 'SUPER_ADMIN' ? 'T.I.M.E.S SYSTEM' : 'Bệnh viện Than - Khoáng sản Cơ sở 2');

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

                    // ✅ 1. Xóa sạch bộ đệm lịch trình cục bộ của đơn vị trước đó
                    localStorage.removeItem('meds_success');
                    localStorage.removeItem('meds_unscheduled');
                    localStorage.removeItem('meds_schedule_date');
                    localStorage.removeItem('meds_schedule_unit');

                    // ✅ 2. Xóa sạch dữ liệu trong RAM của đơn vị cũ
                    window.currentScheduleData = null;
                    window.chamCongData = {};
                    window.thongKeData = {};
                    window.adminChamCongEmployees = [];

                    if (window._dashWorkdaysChart) {
                        try { window._dashWorkdaysChart.destroy(); } catch(e){}
                        window._dashWorkdaysChart = null;
                    }
                    if (window._dashProcsChart) {
                        try { window._dashProcsChart.destroy(); } catch(e){}
                        window._dashProcsChart = null;
                    }

                    if (window.dataCache) {
                        window.dataCache.pat = [];
                        window.dataCache.staff = [];
                        window.dataCache.machine = [];
                        window.dataCache.room = [];
                        window.dataCache.proc = [];
                        window.dataCache.schedule = [];
                        window.dataCache.protocols = [];
                    }
                    if (window.dataCacheTime) {
                        window.dataCacheTime = {};
                    }

                    // ✅ 3. Dọn sạch toàn bộ các bảng DOM và hiển thị trạng thái đang tải
                    if (typeof clearAllDomTables === 'function') {
                        clearAllDomTables(true);
                    }

                    if (typeof window.resetChamCongForUnit === 'function') {
                        window.resetChamCongForUnit(uUnit);
                    }

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

                    // ✅ 4. Tải dữ liệu Bootstrap mới nhất của đơn vị này ngay lập tức (forceRefresh = true)
                    if (typeof window.loadBootstrapData === 'function') {
                        try { window.loadBootstrapData(true); } catch(e) { console.warn('Lỗi loadBootstrapData:', e); }
                    } else if (typeof window.loadAllData === 'function') {
                        try { window.loadAllData(); } catch(e) {}
                    }

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

        // ============================================================

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
                        const t = document.getElementById('leave-pat-time');
                        if (t) {
                            if (!t.value) t.value = '14:00';
                            t.focus();
                            t.select();
                        }
                        return;
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



            // Phần 2: Chuyển Tab

            const tabs = document.querySelectorAll('.nav-tab, .nav-item');

            tabs.forEach(tab => {

                tab.addEventListener('click', () => {

                    try {

                        if (typeof window.flushPendingChamCongSave === 'function') {
                            try { window.flushPendingChamCongSave(); } catch(e) {}
                        }

                        tabs.forEach(t => t.classList.remove('active'));

                        tab.classList.add('active');

                        document.querySelectorAll('.tab-content, .page').forEach(c => c.classList.remove('active'));



                        const targetTab = tab.getAttribute('data-tab');

                        const targetEl = document.getElementById(targetTab);



                        if (targetEl) {
                            targetEl.classList.add('active');
                            const scContainer = document.querySelector('.tab-scroll-content');
                            if (scContainer) scContainer.scrollTop = 0;
                        } else {
                            console.warn("Không tìm thấy tab:", targetTab);
                        }



                        // Toggle class lên body để CSS điều chỉnh layout riêng cho từng tab

                        document.body.classList.toggle('tab-sat-active', targetTab === 'tab-sat');

                        document.body.classList.toggle('tab-schedule-active', targetTab === 'tab-schedule');



                        // Các lệnh gọi dữ liệu riêng cho từng Tab

                        if (targetTab === 'tab-sat' && typeof satCache !== 'undefined' && Object.keys(satCache).length === 0) {

                            if (typeof taiDsSat === 'function') taiDsSat();

                        }

                        if (targetTab === 'tab-home' || targetTab === 'page-dashboard') {

                            if (typeof loadDashboard === 'function') loadDashboard();

                        }



                        // 🔥 ĐOẠN FIX CHỐNG LỖI NHẢY TRANG CHO TAB XẾP LỊCH:

                        if (targetTab === 'tab-schedule') {

                            if (typeof schedCurrentPage !== 'undefined') schedCurrentPage = 1; // Luôn quay về trang 1

                            if (typeof loadScheduleList === 'function') loadScheduleList(); // Kích hoạt tải lại dữ liệu từ Sheet & ngắt trang

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

                        if (targetTab === 'tab-chamcong' && typeof loadChamCongData === 'function') {
                            loadChamCongData();
                        }

                        if (targetTab === 'tab-thongke' && typeof loadThongKeData === 'function') {
                            loadThongKeData();
                        }

                        if (targetTab === 'tab-admin') {
                            if (typeof loadSystemSettings === 'function') loadSystemSettings();
                            if (typeof switchAdminSection === 'function') {
                                const activeSubBtn = document.querySelector('.admin-nav-btn.active') || document.getElementById('nav-btn-settings');
                                switchAdminSection('admin-sec-settings', activeSubBtn);
                            }
                        }

                        // Cập nhật URL hash để hỗ trợ chia sẻ / mở trực tiếp tab
                        window.location.hash = '#' + targetTab;



                    } catch (error) { console.error("Lỗi chuyển tab:", error); }

                });

            });



                        // Phần 3: Khởi tạo ngày mặc định và nạp Bootstrap
            const today = new Date();
            if (document.getElementById('schedule-date')) {
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                document.getElementById('schedule-date').value = `${y}-${m}-${d}`;
            }

            if (typeof populateMonthYearDropdown === 'function') {
                populateMonthYearDropdown();
            }
            if (document.getElementById('pat-date-day')) {
                document.getElementById('pat-date-day').value = String(today.getDate()).padStart(2, '0');
            }
            if (document.getElementById('pat-date-month-year')) {
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                document.getElementById('pat-date-month-year').value = `${mm}/${today.getFullYear()}`;
            }

            if (typeof setupTableSorting === 'function') setupTableSorting();

            // Khởi động Context Menu và URL Hash Router
            if (typeof initTabContextMenu === 'function') initTabContextMenu();
            if (typeof handleInitialUrlTab === 'function') handleInitialUrlTab();

            // Khởi động nạp dữ liệu Bootstrap (All-in-One + Offline Cache)
            if (typeof initProtocolsData === 'function') {
                initProtocolsData();
            }
            if (typeof loadBootstrapData === 'function') {
                loadBootstrapData();
            } else if (typeof loadAllData === 'function') {
                loadAllData();
            }
        });

        // ============================================================
        // 🌐 TAB CONTEXT MENU & DEEP-LINKING (MỞ TRONG TAB MỚI)
        // ============================================================
        let _currentContextTabId = null;
        let _currentContextTabName = '';

        function initTabContextMenu() {
            const menu = document.getElementById('tab-context-menu');
            if (!menu) return;

            document.querySelectorAll('.nav-tab, .nav-item').forEach(tab => {
                // Click chuột phải
                tab.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    _currentContextTabId = tab.getAttribute('data-tab') || 'tab-home';
                    const textEl = tab.querySelector('.text');
                    _currentContextTabName = textEl ? textEl.innerText.trim() : (tab.innerText || 'Tab').trim();

                    const titleEl = document.getElementById('tab-context-title');
                    if (titleEl) titleEl.innerText = `📌 ${_currentContextTabName}`;

                    const menuWidth = 230;
                    const menuHeight = 150;
                    let posX = e.clientX;
                    let posY = e.clientY;

                    if (posX + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
                    if (posY + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 10;

                    menu.style.left = posX + 'px';
                    menu.style.top = posY + 'px';
                    menu.style.display = 'block';
                });

                // Hỗ trợ Middle Click (Click con lăn chuột) hoặc Ctrl+Click / Cmd+Click để mở Tab mới
                tab.addEventListener('auxclick', (e) => {
                    if (e.button === 1) { // Middle click
                        e.preventDefault();
                        const targetTab = tab.getAttribute('data-tab') || 'tab-home';
                        openTabInNewWindow(targetTab);
                    }
                });
                tab.addEventListener('click', (e) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const targetTab = tab.getAttribute('data-tab') || 'tab-home';
                        openTabInNewWindow(targetTab);
                    }
                });
            });

            // Ẩn context menu khi click ra ngoài hoặc cuộn
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) {
                    menu.style.display = 'none';
                }
            });
            window.addEventListener('scroll', () => { menu.style.display = 'none'; }, true);
        }
        window.initTabContextMenu = initTabContextMenu;

        function openTabInNewWindow(tabId) {
            if (!tabId) tabId = 'tab-home';
            const baseUrl = window.location.origin + window.location.pathname;
            const targetUrl = `${baseUrl}#tab=${tabId}`;
            window.open(targetUrl, '_blank');
        }
        window.openTabInNewWindow = openTabInNewWindow;

        function openCurrentTabInNewWindow() {
            const menu = document.getElementById('tab-context-menu');
            if (menu) menu.style.display = 'none';
            openTabInNewWindow(_currentContextTabId);
        }
        window.openCurrentTabInNewWindow = openCurrentTabInNewWindow;

        function copyCurrentTabLink() {
            const menu = document.getElementById('tab-context-menu');
            if (menu) menu.style.display = 'none';
            const tabId = _currentContextTabId || 'tab-home';
            const baseUrl = window.location.origin + window.location.pathname;
            const targetUrl = `${baseUrl}#tab=${tabId}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(targetUrl).then(() => {
                    if (typeof window.showToast === 'function') window.showToast(`📋 Đã sao chép liên kết Tab: ${targetUrl}`);
                }).catch(() => {
                    prompt('Sao chép liên kết Tab tại đây:', targetUrl);
                });
            } else {
                prompt('Sao chép liên kết Tab tại đây:', targetUrl);
            }
        }
        window.copyCurrentTabLink = copyCurrentTabLink;

        function reloadCurrentTab() {
            const menu = document.getElementById('tab-context-menu');
            if (menu) menu.style.display = 'none';
            const tabBtn = document.querySelector(`.nav-tab[data-tab="${_currentContextTabId}"]`);
            if (tabBtn) tabBtn.click();
            if (typeof window.loadBootstrapData === 'function') window.loadBootstrapData(true);
        }
        window.reloadCurrentTab = reloadCurrentTab;

        function handleInitialUrlTab() {
            const hash = window.location.hash || '';
            let targetTab = '';
            if (hash.startsWith('#tab=')) {
                targetTab = hash.replace('#tab=', '').trim();
            } else if (hash.startsWith('#tab-')) {
                targetTab = hash.substring(1).trim();
            }
            if (targetTab) {
                const tabBtn = document.querySelector(`.nav-tab[data-tab="${targetTab}"], .nav-item[data-tab="${targetTab}"]`);
                if (tabBtn) {
                    setTimeout(() => { tabBtn.click(); }, 80);
                }
            }
        }
        window.handleInitialUrlTab = handleInitialUrlTab;

        // ============================================================
        // 🚀 ALL-IN-ONE BOOTSTRAP DATA & OFFLINE-FIRST CACHE
        // ============================================================

        function applySystemSettings(res) {
            if (!res) res = {};
            const chotSoEl = document.getElementById("admin-chotso-time");
            if (chotSoEl) chotSoEl.value = res.chotSoTime || "16:20";

            const yhctLunchEl = document.getElementById("admin-yhct-lunch");
            if (yhctLunchEl) yhctLunchEl.value = (res.yhctLunch !== undefined && res.yhctLunch !== null && res.yhctLunch !== "") ? res.yhctLunch : "5";

            const yhctEndEl = document.getElementById("admin-yhct-end");
            if (yhctEndEl) yhctEndEl.value = (res.yhctEnd !== undefined && res.yhctEnd !== null && res.yhctEnd !== "") ? res.yhctEnd : "5";

            const dropWeightEl = document.getElementById("admin-weight-drop");
            if (dropWeightEl) dropWeightEl.value = (res.dropWeight !== undefined && res.dropWeight !== null && res.dropWeight !== "") ? res.dropWeight : "10000";

            const overtimeWeightEl = document.getElementById("admin-weight-overtime");
            if (overtimeWeightEl) overtimeWeightEl.value = (res.overtimeWeight !== undefined && res.overtimeWeight !== null && res.overtimeWeight !== "") ? res.overtimeWeight : "2";

            const imbalanceWeightEl = document.getElementById("admin-weight-imbalance");
            if (imbalanceWeightEl) imbalanceWeightEl.value = (res.imbalanceWeight !== undefined && res.imbalanceWeight !== null && res.imbalanceWeight !== "") ? res.imbalanceWeight : "0.1";
            
            // Restore backup reminder settings from D1 database configuration
            if (res.backup_schedule_config) {
                try {
                    const cfg = typeof res.backup_schedule_config === 'string' ? JSON.parse(res.backup_schedule_config) : res.backup_schedule_config;
                    if (cfg) {
                        localStorage.setItem('backup_reminder_period', cfg.period || 'none');
                        localStorage.setItem('backup_reminder_time', cfg.time || '17:00');
                        localStorage.setItem('backup_reminder_dow', cfg.dow || '1');
                        localStorage.setItem('backup_reminder_dom', cfg.dom || '1');
                        if (typeof window.checkBackupReminder === 'function') {
                            window.checkBackupReminder();
                        }
                    }
                } catch(e) {
                    console.error("Lỗi đồng bộ cấu hình nhắc sao lưu:", e);
                }
            }

            // Đồng bộ phác đồ từ Server Settings
            const rawProtocols = res.clinical_protocols || res.protocols;
            if (rawProtocols) {
                try {
                    const parsed = typeof rawProtocols === 'string' ? JSON.parse(rawProtocols) : rawProtocols;
                    if (Array.isArray(parsed)) {
                        window.dataCache.protocols = parsed;
                        if (typeof dataCache !== 'undefined') dataCache.protocols = parsed;
                        try { localStorage.setItem('meds_protocols', JSON.stringify(parsed)); } catch(e) {}
                        if (typeof renderProtocolsTable === 'function') renderProtocolsTable();
                        if (typeof renderProtocolSelectOptions === 'function') renderProtocolSelectOptions();
                    }
                } catch(e) {
                    console.error("Lỗi đồng bộ phác đồ từ server:", e);
                }
            }
        }

        function restoreOfflineCache() {
            try {
                const curUnit = getCurrentUnitCode();
                const sessionStr = localStorage.getItem('meds_session');
                if (!sessionStr || !curUnit) return;
                const cacheKey = getBootstrapCacheKey();
                const cachedStr = localStorage.getItem(cacheKey);
                if (cachedStr) {
                    const b = JSON.parse(cachedStr);
                    if (b && typeof dataCache !== 'undefined') {
                        // Phân lập: tuyệt đối không nạp cache của đơn vị khác
                        const bUnit = (b.unit_code || b.unit || '').toLowerCase();
                        if (bUnit && bUnit !== curUnit) {
                            return;
                        }

                        // ✅ Tính ngày hôm nay theo múi giờ VN (UTC+7)
                        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
                        const todayYMD = `${nowVN.getUTCFullYear()}-${String(nowVN.getUTCMonth() + 1).padStart(2, '0')}-${String(nowVN.getUTCDate()).padStart(2, '0')}`;
                        const dd = String(nowVN.getUTCDate()).padStart(2, '0');
                        const mm = String(nowVN.getUTCMonth() + 1).padStart(2, '0');
                        const todaySlash = `${dd}/${mm}/${nowVN.getUTCFullYear()}`; // VD: 21/08/2026

                        // Kiểm tra cache có phải của ngày hôm nay không
                        let cacheIsStale = false;
                        if (b.patients && Array.isArray(b.patients) && b.patients.length > 0) {
                            const firstPatDate = b.patients[0].ngayVao || b.patients[0].ngay_vao || '';
                            if (firstPatDate && firstPatDate !== todaySlash && firstPatDate !== todayYMD) {
                                cacheIsStale = true;
                            }
                        }
                        if (!cacheIsStale && b.schedule && Array.isArray(b.schedule) && b.schedule.length > 0) {
                            const firstSchedDate = b.schedule[0][0] || b.schedule[0].date || '';
                            if (firstSchedDate && firstSchedDate !== todayYMD && firstSchedDate !== todaySlash) {
                                cacheIsStale = true;
                            }
                        }

                        if (cacheIsStale) {
                            b.patients = [];
                            b.schedule = [];
                            try { localStorage.setItem(cacheKey, JSON.stringify(b)); } catch(e) {}
                        }

                        if (b.machines && Array.isArray(b.machines)) {
                            b.machines.forEach((m, i) => { if (m) m.sheetIndex = i; });
                            dataCache.machine = b.machines.filter(m => m && (m.tenLoai || m[1]));
                            if (typeof renderMachinesTable === 'function') renderMachinesTable();
                        } else {
                            dataCache.machine = [];
                        }
                        if (b.rooms && Array.isArray(b.rooms)) {
                            b.rooms.forEach((r, i) => { if (r) r.sheetIndex = i; });
                            dataCache.room = b.rooms.filter(r => r && (r.tenPhong || r[1]));
                            if (typeof renderRoomsTable === 'function') renderRoomsTable();
                        } else {
                            dataCache.room = [];
                        }
                        if (b.procedures && Array.isArray(b.procedures)) {
                            b.procedures.forEach((p, i) => { if (p) p.sheetIndex = i; });
                            dataCache.proc = b.procedures;
                            if (typeof renderProceduresTable === 'function') renderProceduresTable();
                            if (typeof renderProcedureCheckboxes === 'function') renderProcedureCheckboxes();
                        } else {
                            dataCache.proc = [];
                        }
                        if (b.staff && Array.isArray(b.staff)) {
                            b.staff.forEach((st, i) => { if (st) st.sheetIndex = i; });
                            dataCache.staff = b.staff.filter(st => st && st.ten);
                            if (typeof renderStaffTable === 'function') renderStaffTable();
                        } else {
                            dataCache.staff = [];
                        }
                        if (b && Array.isArray(b.schedule)) {
                            dataCache.schedule = b.schedule;
                            window.currentScheduleData = (b.schedule.length > 0 && typeof markDischargedInSchedule === 'function') ? markDischargedInSchedule(b.schedule) : (b.schedule || []);
                        } else {
                            dataCache.schedule = [];
                            window.currentScheduleData = [];
                        }
                        if (typeof loadScheduleList === 'function') loadScheduleList();

                        if (b && Array.isArray(b.patients)) {
                            b.patients.forEach((pt, i) => { if (pt) pt.sheetIndex = i; });
                            dataCache.pat = b.patients.filter(pt => pt && pt.ten);
                            if (typeof renderPatientsTable === 'function') renderPatientsTable();
                        } else {
                            dataCache.pat = [];
                        }
                        // Nạp phác đồ từ cache hoặc cài đặt máy chủ
                        const rawCachedProto = (b.settings && b.settings.clinical_protocols) || b.protocols;
                        if (rawCachedProto) {
                            try {
                                const parsed = typeof rawCachedProto === 'string' ? JSON.parse(rawCachedProto) : rawCachedProto;
                                if (Array.isArray(parsed)) {
                                    dataCache.protocols = parsed;
                                    if (window.dataCache) window.dataCache.protocols = parsed;
                                    if (typeof renderProtocolsTable === 'function') renderProtocolsTable();
                                    if (typeof renderProtocolSelectOptions === 'function') renderProtocolSelectOptions();
                                }
                            } catch(e) {}
                        }
                        if (b.settings) {
                            applySystemSettings(b.settings);
                        }
                        if (b.marquee) {
                            const el = document.getElementById('thong-bao-chay');
                            if (el) el.innerText = b.marquee;
                        }
                        const now = Date.now();
                        window.dataCacheTime = { pat: now, staff: now, machine: now, room: now, proc: now, sched: now };
                        if (typeof loadDashboard === 'function') loadDashboard();
                    }
                }
            } catch (e) {
                console.warn('[Offline Cache] Lỗi đọc dữ liệu cục bộ:', e);
            }
        }

        function loadBootstrapData(forceRefresh = false) {
            const sessionStr = localStorage.getItem('meds_session');
            const curUnit = getCurrentUnitCode();
            if (!sessionStr || !curUnit) {
                console.log('[Bootstrap] Chưa đăng nhập hoặc chưa chọn đơn vị, bỏ qua nạp dữ liệu.');
                return;
            }

            if (!forceRefresh) {
                restoreOfflineCache();
            }

            google.script.run
                .withSuccessHandler(function (b) {
                    if (!b) return;
                    try {
                        const curUnit = getCurrentUnitCode();
                        b.unit_code = curUnit;
                        localStorage.setItem(getBootstrapCacheKey(), JSON.stringify(b));
                    } catch (e) { }

                    const now = Date.now();
                    window.dataCacheTime = { pat: now, staff: now, machine: now, room: now, proc: now, sched: now };

                    if (typeof dataCache !== 'undefined') {
                        if (b.machines && Array.isArray(b.machines)) {
                            b.machines.forEach((m, i) => { if (m) m.sheetIndex = i; });
                            dataCache.machine = b.machines.filter(m => m && (m.tenLoai || m[1]));
                            if (typeof renderMachinesTable === 'function') renderMachinesTable();
                        }
                        if (b.rooms && Array.isArray(b.rooms)) {
                            b.rooms.forEach((r, i) => { if (r) r.sheetIndex = i; });
                            dataCache.room = b.rooms.filter(r => r && (r.tenPhong || r[1]));
                            if (typeof renderRoomsTable === 'function') renderRoomsTable();
                        }
                        if (b.procedures && Array.isArray(b.procedures)) {
                            b.procedures.forEach((p, i) => { if (p) p.sheetIndex = i; });
                            dataCache.proc = b.procedures;
                            if (typeof renderProceduresTable === 'function') renderProceduresTable();
                            if (typeof renderProcedureCheckboxes === 'function') renderProcedureCheckboxes();
                        }
                        if (b.staff && Array.isArray(b.staff)) {
                            b.staff.forEach((st, i) => { if (st) st.sheetIndex = i; });
                            dataCache.staff = b.staff.filter(st => st && st.ten);
                            if (typeof renderStaffTable === 'function') renderStaffTable();
                            if (typeof window.resetChamCongForUnit === 'function') {
                                window.resetChamCongForUnit(localStorage.getItem('pm_unit_code'));
                            }
                        }
                        if (b && Array.isArray(b.schedule)) {
                            dataCache.schedule = b.schedule;
                            window.currentScheduleData = (b.schedule.length > 0 && typeof markDischargedInSchedule === 'function') ? markDischargedInSchedule(b.schedule) : (b.schedule || []);
                        } else {
                            dataCache.schedule = [];
                            window.currentScheduleData = [];
                        }
                        if (typeof loadScheduleList === 'function') loadScheduleList();

                        if (b && Array.isArray(b.patients)) {
                            b.patients.forEach((pt, i) => { if (pt) pt.sheetIndex = i; });
                            dataCache.pat = b.patients.filter(pt => pt && pt.ten);
                        } else {
                            dataCache.pat = [];
                        }
                        if (typeof renderPatientsTable === 'function') renderPatientsTable();

                        // Đồng bộ phác đồ mới nhất từ máy chủ (Cloudflare D1)
                        const rawServerProto = (b.settings && b.settings.clinical_protocols) || b.protocols;
                        if (rawServerProto) {
                            try {
                                const parsed = typeof rawServerProto === 'string' ? JSON.parse(rawServerProto) : rawServerProto;
                                if (Array.isArray(parsed)) {
                                    dataCache.protocols = parsed;
                                    if (window.dataCache) window.dataCache.protocols = parsed;
                                    try { localStorage.setItem('meds_protocols', JSON.stringify(parsed)); } catch(e) {}
                                    if (typeof renderProtocolsTable === 'function') renderProtocolsTable();
                                    if (typeof renderProtocolSelectOptions === 'function') renderProtocolSelectOptions();
                                }
                            } catch(e) {}
                        }
                    }

                    if (b.settings) {
                        applySystemSettings(b.settings);
                    }

                    if (b.marquee) {
                        const el = document.getElementById('thong-bao-chay');
                        if (el) el.innerText = b.marquee;
                        const inp = document.getElementById('admin-marquee-input');
                        if (inp) inp.value = b.marquee;
                    }

                    if (b.links && Array.isArray(b.links)) {
                        const uls = document.querySelectorAll('#khu-vuc-lien-ket');
                        if (uls.length) {
                            const htmlContent = b.links.length
                                ? b.links.map(item => `<li><a href="${item.url}" target="_blank"><span class="f-icon">${item.icon}</span> ${item.ten}</a></li>`).join('')
                                : '<li><a href="#"><span class="f-icon">⚠️</span> Chưa có liên kết nào</a></li>';
                            uls.forEach(ul => { ul.innerHTML = htmlContent; });
                        }
                    }

                    if (typeof updateStats === 'function') updateStats();
                    if (typeof renderScheduleCalendar === 'function') renderScheduleCalendar();
                    if (typeof loadDashboard === 'function') loadDashboard();

                    if (!window._systemReadyLogged) {
                        window._systemReadyLogged = true;
                        console.log('✅ Hệ thống T.I.M.E.S đã tải và đồng bộ dữ liệu thành công! Sẵn sàng hoạt động.');
                    }
                })
                .withFailureHandler(function (err) {
                    if (!window._systemReadyLogged) {
                        window._systemReadyLogged = true;
                        console.log('✅ Hệ thống T.I.M.E.S đã sẵn sàng hoạt động (Chế độ ngoại tuyến).');
                    }
                    console.warn('[Bootstrap API] Máy chủ bận, đang sử dụng dữ liệu đã lưu trong máy:', err);
                    [loadMachines, loadRooms, loadScheduleList, loadProcedures, loadPatients, loadStaff].forEach(fn => fn());
                })
                .getBootstrapData();
        }

        function loadAllData() {
            loadBootstrapData();
        }
        window.loadBootstrapData = loadBootstrapData;
        window.loadAllData = loadAllData;
        window.restoreOfflineCache = restoreOfflineCache;

        // =================================================================

        // 🚀 HÀM LÕI: TẢI DỮ LIỆU ĐA NĂNG (BẢN FIX TRIỆT ĐỂ LỖI THAM SỐ)

        // =================================================================

        window.dataCacheTime = window.dataCacheTime || {};



        function loadEntity(apiMethod, cacheKey, callback, extraCallbacks = [], forceRefresh = false) {
            const CACHE_TTL = 5 * 60 * 1000; // Lưu Cache 5 phút
            const now = Date.now();
            window.dataCacheTime = window.dataCacheTime || {};

            let callbacksToRun = [];
            if (typeof callback === 'function') callbacksToRun.push(callback);
            if (Array.isArray(extraCallbacks)) callbacksToRun = callbacksToRun.concat(extraCallbacks);



            if (!forceRefresh && typeof dataCache !== 'undefined' && dataCache[cacheKey] && window.dataCacheTime[cacheKey] && dataCache[cacheKey].length > 0) {
                if (now - window.dataCacheTime[cacheKey] < CACHE_TTL) {
                    callbacksToRun.forEach(cb => cb());
                    return;
                }
            }

            loadFromSheets(apiMethod, cacheKey, callbacksToRun);
        }

        function loadFromSheets(apiMethod, cacheKey, callbacks) {
            google.script.run
                .withSuccessHandler(data => {
                    if (typeof dataCache !== 'undefined') {
                        const rawData = data || [];
                        rawData.forEach((item, i) => {
                            if (item) item.sheetIndex = i;
                        });
                        let cleaned = rawData;
                        if (cacheKey === 'pat' || cacheKey === 'staff') {
                            cleaned = rawData.filter(item => item && item.ten && String(item.ten).trim() !== '' && !/^\d+$/.test(String(item.ten).trim()));
                        } else if (cacheKey === 'machine') {
                            cleaned = rawData.filter(item => {
                                if (!item) return false;
                                const t = item.tenLoai || item.ten_loai || (Array.isArray(item) ? item[1] : '') || '';
                                return String(t).trim() !== '' && String(t).trim() !== 'undefined';
                            }).map(item => {
                                const tenLoai = String(item.tenLoai || item.ten_loai || (Array.isArray(item) ? item[1] : '') || '').trim();
                                const maMay = String(item.maMay || item.ma_may || (Array.isArray(item) ? item[2] : '') || '').trim();
                                const trangThai = String(item.trangThai || item.trang_thai || (Array.isArray(item) ? item[3] : '') || 'Sẵn sàng').trim();
                                return {
                                    ...((typeof item === 'object' && !Array.isArray(item)) ? item : {}),
                                    tenLoai,
                                    maMay,
                                    trangThai,
                                    ten_loai: tenLoai,
                                    ma_may: maMay,
                                    trang_thai: trangThai,
                                    1: tenLoai,
                                    2: maMay,
                                    3: trangThai
                                };
                            });
                        } else if (cacheKey === 'room') {
                            cleaned = rawData.filter(item => item && (item.tenPhong || item[1]) && String(item.tenPhong || item[1]).trim() !== '');
                        } else if (cacheKey === 'proc') {
                            cleaned = rawData.filter(item => item && (item.ten || item[1]) && String(item.ten || item[1]).trim() !== '');
                        }
                        cleaned.forEach((item, idx) => {
                            item.index = idx;
                        });
                        if (cacheKey === 'staff') {
                            cleaned.forEach(item => {
                                if (!item.thoiGianLam) item.thoiGianLam = "07:30-11:30, 13:00-16:30";
                                if (!item.trangThai) item.trangThai = "Đi làm";
                                if (!item.gioBan) item.gioBan = "";
                                if (!item.kyNang) item.kyNang = "";
                                if (!item.quyen) item.quyen = item.system || item.he || "PHCN";
                                if (!item.nguoiThayThe) item.nguoiThayThe = "Không";
                            });
                            try {
                                const localHisMap = JSON.parse(localStorage.getItem('staff_his_map') || '{}');
                                cleaned.forEach(item => {
                                    if (!item.tenHis && localHisMap[item.ten]) {
                                        item.tenHis = localHisMap[item.ten];
                                    } else if (item.tenHis) {
                                        localHisMap[item.ten] = item.tenHis;
                                    }
                                });
                                localStorage.setItem('staff_his_map', JSON.stringify(localHisMap));
                            } catch (e) { }
                        }
                        dataCache[cacheKey] = cleaned;
                    }
                    window.dataCacheTime = window.dataCacheTime || {};
                    window.dataCacheTime[cacheKey] = Date.now();
                    callbacks.forEach(cb => cb());
                })
                .withFailureHandler(e => {
                    console.error("❌ Lỗi tải [" + cacheKey + "]:", e);
                    callbacks.forEach(cb => cb());
                })
            [apiMethod]();
        }

        function triggerDataRefresh(btn) {
            const origText = btn.innerText;
            btn.disabled = true;
            btn.innerText = "⏳ ĐANG ĐỒNG BỘ...";
            if (window.showGlobalLoading) window.showGlobalLoading("Đang tải dữ liệu từ Google Sheets...");

            window.dataCacheTime = {}; // Xóa cache time

            Promise.all([
                new Promise((resolve) => {
                    loadEntity('getBenhNhan', 'pat', () => resolve(), [], true);
                }),
                new Promise((resolve) => {
                    loadEntity('getNhanSu', 'staff', () => resolve(), [], true);
                })
            ]).then(() => {
                if (window.hideGlobalLoading) window.hideGlobalLoading();
                btn.disabled = false;
                btn.innerText = origText;
                sessionStorage.setItem('sync_success_toast', 'true');
                location.reload();
            }).catch(err => {
                if (window.hideGlobalLoading) window.hideGlobalLoading();
                btn.disabled = false;
                btn.innerText = origText;
                if (window.showToast) {
                    window.showToast("❌ Lỗi tải dữ liệu: " + err, "error", 5000);
                } else {
                    alert("❌ Lỗi tải dữ liệu: " + err);
                }
            });
        }
        function loadMachines() { loadEntity('getDanhSachMay', 'machine', renderMachinesTable); }

        function loadRooms() { loadEntity('getPhongThuThuat', 'room', renderRoomsTable); }

        function loadPatients() { loadEntity('getBenhNhan', 'pat', renderPatientsTable); }

        function loadProcedures() {

            google.script.run.withSuccessHandler(data => {

                dataCache.proc = data;

                renderProceduresTable();

                renderProcedureCheckboxes();

                loadStaff();

            }).getThuThuat();

        }

        function loadStaff() {

            loadEntity('getNhanSu', 'staff', renderStaffTable, [

                () => { if (typeof loadPatients === 'function') loadPatients(); }

            ]);

        }



        // ============================================================

        // 📋 CANCEL EDIT (Form reset)

        // ============================================================

        function cancelEdit(type) {

            editIndex[type] = -1;

            document.querySelectorAll(`.tab-content.active .sidebar-form input[type="text"]:not([readonly]), .tab-content.active .sidebar-form input[type="number"], .tab-content.active .sidebar-form textarea:not([readonly])`).forEach(i => i.value = '');

            document.querySelectorAll(`.tab-content.active .sidebar-form input[type="checkbox"]`).forEach(c => c.checked = false);



            const configs = {

                machine: () => { document.getElementById('group-qty').style.display = 'flex'; document.getElementById('btn-save-machine').innerText = "Thêm"; document.getElementById('btn-cancel-machine').style.display = "none"; },

                proc: () => { 
                    document.getElementById('btn-save-proc').innerText = "Thêm"; 
                    document.getElementById('btn-cancel-proc').style.display = "none"; 
                    document.getElementById('proc-system').value = 'YHCT'; 
                    document.getElementById('proc-category').value = 'Chưa phân loại'; 
                    document.getElementById('proc-machine').value = 'Thủ công'; 
                    if (document.getElementById('proc-continuous-cb')) document.getElementById('proc-continuous-cb').checked = false;
                },

                staff: () => { document.getElementById('btn-save-staff').innerText = "Thêm"; document.getElementById('btn-cancel-staff').style.display = "none"; document.getElementById('staff-quyen').value = 'Cả hai'; document.getElementById('staff-role').value = 'Bác sĩ'; document.getElementById('staff-status').value = 'Đi làm'; },

                room: () => { document.getElementById('btn-save-room').innerText = "Thêm"; document.getElementById('btn-cancel-room').style.display = "none"; },

                proto: () => {
                    const btnSave = document.getElementById('btn-save-proto');
                    const btnCancel = document.getElementById('btn-cancel-proto');
                    const nameInput = document.getElementById('proto-name');
                    if (btnSave) btnSave.innerText = "➕ Thêm Phác Đồ";
                    if (btnCancel) btnCancel.style.display = "none";
                    if (nameInput) nameInput.value = '';
                    document.querySelectorAll('.proto-proc-cb').forEach(c => c.checked = false);
                    if (typeof updateProtoSelectedCount === 'function') updateProtoSelectedCount();
                },

                pat: () => {

                    document.getElementById('btn-save-pat').innerText = "Thêm";

                    document.getElementById('btn-cancel-pat').style.display = "none";

                    const today = new Date();

                    if (typeof populateMonthYearDropdown === 'function') populateMonthYearDropdown();
                    if (document.getElementById('pat-date-day')) {
                        document.getElementById('pat-date-day').value = String(today.getDate()).padStart(2, '0');
                    }
                    if (document.getElementById('pat-date-month-year')) {
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        document.getElementById('pat-date-month-year').value = `${mm}/${today.getFullYear()}`;
                    }

                    if(document.getElementById('pat-room')) document.getElementById('pat-room').value = '';
                    if(document.getElementById('pat-loai-bn')) document.getElementById('pat-loai-bn').value = 'NoiTru';
                    if(document.getElementById('pat-buoi-dieu-tri')) document.getElementById('pat-buoi-dieu-tri').value = 'TuDong';
                    if(typeof togglePatSessionSelect === 'function') togglePatSessionSelect();

                },

            };

            configs[type]?.();

        }



        function parseNgayVao(dStr) {
            if (!dStr || typeof dStr !== 'string' || !dStr.includes('/')) return 0;
            const parts = dStr.split('/');
            if (parts.length < 3) return 0;
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            return new Date(y, m, d).getTime();
        }

        function getGioVaoMinutes(gStr) {
            if (!gStr || typeof gStr !== 'string' || !gStr.includes(':')) {
                return 7 * 60 + 30; // 07:30 mặc định
            }
            const parts = gStr.split(':');
            const h = parseInt(parts[0], 10) || 0;
            const m = parseInt(parts[1], 10) || 0;
            return h * 60 + m;
        }

        // ============================================================

        // ⚙️ 1. MÁY MÓC

        // ============================================================


        function renderMachinesTable() {
            renderMachinesTable_Original();
            setTimeout(() => { }, 50);
        }

        function renderMachinesTable_Original() {
            const statEl = document.getElementById('stat-machines');
            if (statEl) statEl.innerText = dataCache.machine.length;
            const tbody = document.getElementById('machines-list');
            if (!tbody) return;

            const procMachineSelect = document.getElementById('proc-machine');
            const searchMachineSelect = document.getElementById('search-machine-type');
            if (procMachineSelect && searchMachineSelect) {
                const types = [...new Set(dataCache.machine.map(m => String(m.tenLoai || m[1] || '').trim()))].filter(Boolean);
                procMachineSelect.innerHTML = '<option>Thủ công</option>' + types.map(t => `<option value="${t}">${t}</option>`).join('');
                searchMachineSelect.innerHTML = '<option>Chọn loại máy</option>' + types.map(t => `<option value="${t}">${t}</option>`).join('');
            }

            if (!dataCache.machine.length) { tbody.innerHTML = renderEmptyRow(5, 'Chưa có thiết bị'); return; }

            tbody.innerHTML = dataCache.machine.map((item, i) => {
                const idx = dataCache.machine.indexOf(item);
                const ten = String(item.tenLoai || item[1] || '').trim();
                const ma = String(item.maMay || item[2] || '').trim();
                const tt = item.trangThai || item[3] || '';
                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" data-machine-index="${idx}" onclick="if(!window._isDraggingRow) editRoomMachine(parseInt(this.dataset.machineIndex))" title="Bấm sửa (Kéo thả nút ☰ hoặc bấm ▲/▼ để đổi thứ tự, Phím Delete để xóa)">
            <td>${renderSttOrderControl("machines", i, dataCache.machine.length)}</td>
            <td><b>${ten}</b></td>
            <td><span class="badge badge-info">${ma}</span></td>
            <td><span class="status-badge ${tt === 'Sẵn sàng' ? 'status-ready' : 'status-busy'}">${tt}</span></td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteMachine(${idx})">Xóa</button></td>
        </tr>`;
            }).join('');

            if (typeof renderDynamicMachineInputs === 'function') renderDynamicMachineInputs();

            initTableDragAndDrop('machines-list', dataCache.machine, () => {
                renderMachinesTable();
                saveReorderedData('machines', dataCache.machine);
            });
        }

        function saveMachine() {
            

            const t = document.getElementById('machine-type').value.trim();

            const c = document.getElementById('machine-code').value.trim();

            const q = document.getElementById('machine-qty').value;

            const s = document.getElementById('machine-status').value;

            if (!t || !c) return alert("Điền tên và mã máy!");

            if (editIndex.machine > -1) {

                dataCache.machine[editIndex.machine] = { tenLoai: t, maMay: c, trangThai: s };

                google.script.run.editMayMoc(editIndex.machine, t, c, s);

            } else {

                for (let i = 0; i < parseInt(q); i++) dataCache.machine.push({ tenLoai: t, maMay: `${c}${i + 1}`, trangThai: s });

                google.script.run.addMayMoc(t, c, q, s);

            }

            cancelEdit('machine'); renderMachinesTable();

        }

        function editRoomMachine(index) {
            if (window.innerWidth <= 960 && typeof window.openMobileFormForEdit === "function") window.openMobileFormForEdit("machine");

            editIndex.machine = index;

            const item = dataCache.machine[index];
            if (!item) return;

            const tenLoai = String(item.tenLoai || item.ten_loai || (Array.isArray(item) ? item[1] : '') || '').trim();
            const maMay = String(item.maMay || item.ma_may || (Array.isArray(item) ? item[2] : '') || '').trim();
            const trangThai = item.trangThai || item.trang_thai || (Array.isArray(item) ? item[3] : '') || 'Sẵn sàng';

            document.getElementById('machine-type').value = tenLoai;

            document.getElementById('machine-code').value = maMay;

            document.getElementById('machine-status').value = trangThai;

            document.getElementById('group-qty').style.display = 'none';

            document.getElementById('btn-save-machine').innerText = "Lưu Sửa";

            document.getElementById('btn-cancel-machine').style.display = "inline-block";

        }

        function deleteMachine(i) {
            

            showCustomConfirm("Xác nhận xóa máy", "Bác sĩ có chắc chắn muốn xóa máy này?", function () {

                if (window.showGlobalLoading) window.showGlobalLoading("Đang xóa máy móc...");

                const btnSave = document.getElementById('btn-save-machine');

                if (btnSave) { btnSave.disabled = true; btnSave.innerText = "Đang xóa..."; }

                dataCache.machine.splice(i, 1); renderMachinesTable();

                google.script.run

                    .withSuccessHandler(() => {

                        if (window.hideGlobalLoading) window.hideGlobalLoading();

                        if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }

                        if (typeof loadMachines === 'function') loadMachines();

                    })

                    .withFailureHandler(e => {

                        if (window.hideGlobalLoading) window.hideGlobalLoading();

                        if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }

                        alert('Lỗi: ' + e);

                    }).deleteMayMoc(i);

            });

        }

        function renderDynamicMachineInputs() {

            const container = document.getElementById('dynamic-machine-inputs');

            if (!container) return;

            if (!dataCache.machine || !Array.isArray(dataCache.machine) || dataCache.machine.length === 0) {
                container.innerHTML = '<div style="color:#7f8c8d; font-style:italic; grid-column:span 2;">Chưa có loại máy trong kho</div>';
                return;
            }

            const typeSet = new Set();
            const typeList = [];

            dataCache.machine.forEach(m => {
                if (!m) return;
                const rawName = m.tenLoai || m.ten_loai || (Array.isArray(m) ? m[1] : '') || m.ten || m.name || '';
                const nameStr = String(rawName).trim();
                if (!nameStr || nameStr === 'undefined' || nameStr === 'null' || nameStr.toLowerCase() === 'undefined') return;

                const lowerKey = nameStr.toLowerCase();
                if (!typeSet.has(lowerKey)) {
                    typeSet.add(lowerKey);
                    typeList.push(nameStr);
                }
            });

            if (typeList.length === 0) {
                container.innerHTML = '<div style="color:#7f8c8d; font-style:italic; grid-column:span 2;">Chưa có loại máy trong kho</div>';
                return;
            }

            container.innerHTML = typeList.map(type => `

        <div style="display:flex; justify-content:space-between; align-items:center" title="${escapeHtml(type)}">

            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px; text-transform:capitalize;">${escapeHtml(type)}</span>:

            <input type="number" class="room-machine-input" data-type="${escapeHtml(type.toLowerCase().trim())}" min="0" style="width:40px; padding:2px">

        </div>`).join('');

        }



        // ============================================================
        // 🎯 DYNAMIC CLINICAL PROTOCOLS ENGINE (Quản lý Phác đồ Riêng)
        // ============================================================
        function initProtocolsData() {
            if (!window.dataCache) window.dataCache = {};
            if (typeof dataCache === 'undefined') window.dataCache = window.dataCache || {};

            let loadedProtocols = null;
            try {
                const saved = localStorage.getItem('meds_protocols');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) loadedProtocols = parsed;
                }
            } catch (e) {}

            if (!loadedProtocols) {
                try {
                    const bStr = localStorage.getItem(window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache");
                    if (bStr) {
                        const b = JSON.parse(bStr);
                        const raw = (b.settings && b.settings.clinical_protocols) || b.protocols || b.phac_do;
                        if (raw) {
                            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                            if (Array.isArray(parsed) && parsed.length > 0) loadedProtocols = parsed;
                        }
                    }
                } catch(e) {}
            }

            if (!loadedProtocols || !loadedProtocols.length) {
                loadedProtocols = JSON.parse(JSON.stringify(DEFAULT_PROTOCOLS));
            }

            window.dataCache.protocols = loadedProtocols;
            if (typeof dataCache !== 'undefined') dataCache.protocols = loadedProtocols;

            renderProtoProcsFormCheckboxes();
            renderProtocolsTable();
            renderProtocolSelectOptions();

            // Lắng nghe sự kiện đồng bộ thời gian thực từ các Tab khác
            if (typeof window.OfflineSyncEngine !== 'undefined' && typeof window.OfflineSyncEngine.registerLiveListener === 'function') {
                window.OfflineSyncEngine.registerLiveListener((type, payload) => {
                    if (type === 'PROTOCOLS_UPDATED' && payload && Array.isArray(payload.protocols)) {
                        window.dataCache.protocols = payload.protocols;
                        if (typeof dataCache !== 'undefined') dataCache.protocols = payload.protocols;
                        try { localStorage.setItem('meds_protocols', JSON.stringify(payload.protocols)); } catch(e) {}
                        renderProtocolsTable();
                        renderProtocolSelectOptions();
                    }
                });
            }
        }
        window.initProtocolsData = initProtocolsData;

        // Render danh sách checkbox thủ thuật trực tiếp trong Form bên trái của Phác đồ
        function renderProtoProcsFormCheckboxes() {
            const yhctBox = document.getElementById('proto-checkboxes-yhct');
            const phcnBox = document.getElementById('proto-checkboxes-phcn');
            if (!yhctBox || !phcnBox) return;

            let allProcs = (window.dataCache && (window.dataCache.proc || window.dataCache.procedures)) ? (window.dataCache.proc || window.dataCache.procedures) : ((typeof dataCache !== 'undefined' && (dataCache.proc || dataCache.procedures)) ? (dataCache.proc || dataCache.procedures) : []);

            if (!allProcs || !allProcs.length) {
                try {
                    const saved = localStorage.getItem('meds_procedures');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        if (Array.isArray(parsed) && parsed.length) allProcs = parsed;
                    }
                } catch(e) {}
            }

            if (!allProcs || !allProcs.length) {
                try {
                    const bStr = localStorage.getItem(window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache");
                    if (bStr) {
                        const b = JSON.parse(bStr);
                        if (b && (b.proc || b.procedures)) {
                            allProcs = b.proc || b.procedures;
                        }
                    }
                } catch(e) {}
            }
            
            let yhctHtml = '', phcnHtml = '';
            (allProcs || []).forEach((p, idx) => {
                if (!p) return;
                const ten = p.ten || p.name || p[1] || '';
                const he = p.he || p[3] || 'PHCN';
                if (!ten) return;

                const escapedTen = escapeHtml(ten);
                const heUpper = String(he || '').trim().toUpperCase();
                const isYhct = heUpper === 'YHCT' || heUpper.includes('CỔ TRUYỀN') || heUpper.includes('ĐÔNG Y');
                
                const cbHtml = `<label class="checkbox-item proto-proc-item" data-name="${escapedTen.toLowerCase()}" style="font-size:11.5px; padding:3px 6px; margin-bottom:3px; display:flex; align-items:center; gap:6px; cursor:pointer; background:#fff; border-radius:4px; border:1px solid #cbd5e1;">
                    <input type="checkbox" class="proto-proc-cb" data-he="${isYhct ? 'YHCT' : 'PHCN'}" value="${escapedTen}" onchange="updateProtoSelectedCount()" style="width:15px; height:15px; margin:0; cursor:pointer; flex-shrink:0;">
                    <span style="font-size:11.5px; line-height:1.2; user-select:none; color:#1e293b;">${escapedTen}</span>
                </label>`;

                if (isYhct) yhctHtml += cbHtml;
                else phcnHtml += cbHtml;
            });

            yhctBox.innerHTML = yhctHtml || '<em style="color:#94a3b8; font-size:11px;">Chưa có thủ thuật YHCT</em>';
            phcnBox.innerHTML = phcnHtml || '<em style="color:#94a3b8; font-size:11px;">Chưa có thủ thuật PHCN</em>';
            updateProtoSelectedCount();
        }
        window.renderProtoProcsFormCheckboxes = renderProtoProcsFormCheckboxes;

        function updateProtoSelectedCount() {
            const badge = document.getElementById('proto-selected-count-badge');
            const count = document.querySelectorAll('.proto-proc-cb:checked').length;
            if (badge) {
                badge.innerText = `${count} đã chọn`;
                badge.style.background = count > 0 ? '#dbeafe' : '#eff6ff';
                badge.style.color = count > 0 ? '#1e40af' : '#64748b';
            }
        }
        window.updateProtoSelectedCount = updateProtoSelectedCount;

        function filterProtoCheckboxes() {
            const input = document.getElementById('proto-search-proc-input');
            const q = (input ? input.value : '').trim().toLowerCase();
            document.querySelectorAll('.proto-proc-item').forEach(item => {
                const name = item.getAttribute('data-name') || '';
                if (!q || name.includes(q)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        }
        window.filterProtoCheckboxes = filterProtoCheckboxes;

        function quickSelectProtoProcs(action) {
            if (action === 'clear') {
                document.querySelectorAll('.proto-proc-cb').forEach(cb => { cb.checked = false; });
            } else if (action === 'all_yhct') {
                document.querySelectorAll('.proto-proc-cb[data-he="YHCT"]').forEach(cb => { cb.checked = true; });
            } else if (action === 'all_phcn') {
                document.querySelectorAll('.proto-proc-cb[data-he="PHCN"]').forEach(cb => { cb.checked = true; });
            }
            updateProtoSelectedCount();
        }
        window.quickSelectProtoProcs = quickSelectProtoProcs;

        function syncProtocolsToCloud(showToastMsg = false) {
            const list = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : ((typeof dataCache !== 'undefined' && dataCache.protocols) ? dataCache.protocols : []);
            if (typeof callApi === 'function') {
                callApi('saveProtocolsData', [list], res => {
                    if (showToastMsg && typeof window.showToast === 'function') {
                        window.showToast(`☁️ Đã đồng bộ ${list.length} phác đồ vào Cloudflare D1 thành công!`);
                    }
                }, err => {
                    if (showToastMsg && typeof window.showToast === 'function') {
                        window.showToast('⚠️ Lỗi đồng bộ đám mây: ' + err, 'error');
                    }
                });
            }
        }
        window.syncProtocolsToCloud = syncProtocolsToCloud;

        function saveProtocolsData(newList) {
            if (!Array.isArray(newList)) newList = [];
            if (!window.dataCache) window.dataCache = {};
            if (typeof dataCache !== 'undefined') dataCache.protocols = newList;
            window.dataCache.protocols = newList;

            // 1. Lưu localStorage
            try {
                localStorage.setItem('meds_protocols', JSON.stringify(newList));
            } catch (e) {}

            // 2. Cập nhật trực tiếp vào times_bootstrap_cache
            try {
                const cachedStr = localStorage.getItem(window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache");
                if (cachedStr) {
                    const b = JSON.parse(cachedStr);
                    if (b) {
                        b.protocols = newList;
                        b.phac_do = newList;
                        if (!b.settings) b.settings = {};
                        b.settings.clinical_protocols = JSON.stringify(newList);
                        localStorage.setItem(window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache", JSON.stringify(b));
                    }
                }
            } catch (e) {}

            // 3. Lưu vào IndexedDB Dexie Cache
            if (typeof window.OfflineSyncEngine !== 'undefined') {
                if (typeof window.OfflineSyncEngine.saveCache === 'function') {
                    window.OfflineSyncEngine.saveCache('protocols', newList);
                }
                if (typeof window.OfflineSyncEngine.broadcastLiveEvent === 'function') {
                    window.OfflineSyncEngine.broadcastLiveEvent('PROTOCOLS_UPDATED', { protocols: newList, count: newList.length });
                }
            }

            // 4. Đồng bộ lên Cloudflare D1 Backend
            syncProtocolsToCloud(false);

            // 5. Cập nhật giao diện bảng và dropdown chọn phác đồ
            renderProtocolsTable();
            renderProtocolSelectOptions();
        }
        window.saveProtocolsData = saveProtocolsData;

        // Lưu / Cập nhật phác đồ từ Sidebar Form bên trái
        function saveProtocolFromForm() {
            const nameInput = document.getElementById('proto-name');
            const name = (nameInput ? nameInput.value : '').trim();

            if (!name) {
                if (typeof window.showToast === 'function') window.showToast('⚠️ Vui lòng nhập tên phác đồ điều trị!', 'warning');
                else alert('Vui lòng nhập tên phác đồ điều trị!');
                if (nameInput) nameInput.focus();
                return;
            }

            const checkedCbs = Array.from(document.querySelectorAll('.proto-proc-cb:checked'));
            const selectedProcs = checkedCbs.map(cb => (cb.value || '').trim()).filter(Boolean);

            if (!selectedProcs.length) {
                if (typeof window.showToast === 'function') window.showToast('⚠️ Vui lòng chọn ít nhất 1 thủ thuật cho phác đồ!', 'warning');
                else alert('Vui lòng chọn ít nhất 1 thủ thuật cho phác đồ!');
                return;
            }

            const currentList = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : ((typeof dataCache !== 'undefined' && dataCache.protocols) ? dataCache.protocols : []);
            const list = Array.isArray(currentList) ? [...currentList] : [];

            if (editIndex.proto > -1 && editIndex.proto < list.length) {
                const currentId = list[editIndex.proto] ? list[editIndex.proto].id : ('proto_' + Date.now());
                list[editIndex.proto] = { id: currentId, name, procs: selectedProcs };
            } else {
                list.push({
                    id: 'proto_' + Date.now(),
                    name,
                    procs: selectedProcs
                });
            }

            saveProtocolsData(list);
            cancelEdit('proto');
            
            if (typeof window.showToast === 'function') {
                window.showToast(`✅ Đã lưu phác đồ: "${name}" (${selectedProcs.length} thủ thuật)`);
            }
        }
        window.saveProtocolFromForm = saveProtocolFromForm;

        // Nạp phác đồ vào Sidebar Form bên trái để chỉnh sửa
        function editProtocol(index) {
            editIndex.proto = index;
            const currentList = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : ((typeof dataCache !== 'undefined' && dataCache.protocols) ? dataCache.protocols : []);
            if (index < 0 || index >= currentList.length) return;
            const target = currentList[index];

            // Đảm bảo danh sách checkbox thủ thuật đã được render
            if (!document.querySelectorAll('.proto-proc-cb').length) {
                renderProtoProcsFormCheckboxes();
            }

            const nameInput = document.getElementById('proto-name');
            if (nameInput) nameInput.value = target.name || target.ten_phac_do || `Phác đồ ${index + 1}`;

            let procsArr = [];
            if (Array.isArray(target.procs)) {
                procsArr = target.procs;
            } else if (typeof target.procs === 'string') {
                try {
                    const parsed = JSON.parse(target.procs);
                    procsArr = Array.isArray(parsed) ? parsed : target.procs.split(',').map(s => s.trim()).filter(Boolean);
                } catch(e) {
                    procsArr = target.procs.split(',').map(s => s.trim()).filter(Boolean);
                }
            }

            // Đánh dấu các checkbox
            document.querySelectorAll('.proto-proc-cb').forEach(cb => {
                const cbVal = String(cb.value || '').trim();
                const isMatch = procsArr.some(sp => {
                    const spName = (typeof sp === 'object' && sp !== null) ? (sp.name || sp.ten || '') : String(sp || '');
                    return typeof matchProc === 'function' ? matchProc(cbVal, spName) : (cbVal.toLowerCase() === spName.toLowerCase());
                });
                cb.checked = isMatch;
            });

            updateProtoSelectedCount();

            const btnSave = document.getElementById('btn-save-proto');
            const btnCancel = document.getElementById('btn-cancel-proto');
            if (btnSave) btnSave.innerText = "💾 Lưu Sửa Phác Đồ";
            if (btnCancel) btnCancel.style.display = "inline-block";

            // Cuộn nhẹ lên form trên màn hình di động/máy tính
            const formBox = document.getElementById('sidebar-form-proto');
            if (formBox) {
                formBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            if (nameInput) nameInput.focus();
        }
        window.editProtocol = editProtocol;

        function deleteProtocol(index) {
            const currentList = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : ((typeof dataCache !== 'undefined' && dataCache.protocols) ? dataCache.protocols : []);
            const list = Array.isArray(currentList) ? [...currentList] : [];
            if (index < 0 || index >= list.length) return;
            const target = list[index];
            const targetName = target.name || target.ten_phac_do || `Phác đồ ${index + 1}`;

            const doDelete = () => {
                list.splice(index, 1);
                saveProtocolsData(list);
                if (editIndex.proto === index) cancelEdit('proto');
                if (typeof window.showToast === 'function') {
                    window.showToast(`🗑️ Đã xóa phác đồ: "${targetName}"`);
                }
            };

            if (typeof showCustomConfirm === 'function') {
                showCustomConfirm("Xác nhận xóa phác đồ", `Bác sĩ có chắc chắn muốn xóa phác đồ "${targetName}" không?`, doDelete);
            } else if (confirm(`Bạn có chắc chắn muốn xóa phác đồ "${targetName}" không?`)) {
                doDelete();
            }
        }
        window.deleteProtocol = deleteProtocol;

        function renderProtocolsTable() {
            const tbody = document.getElementById('protocols-list');
            if (!tbody) return;
            const list = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : ((typeof dataCache !== 'undefined' && dataCache.protocols) ? dataCache.protocols : []);
            if (!list.length) {
                tbody.innerHTML = '<tr><td colspan="4" align="center" style="color:#64748b; padding:20px; font-size:13px;">Chưa có phác đồ điều trị nào. Hãy nhập thông tin ở Form bên trái để tạo phác đồ mới.</td></tr>';
                return;
            }
            tbody.innerHTML = list.map((item, i) => {
                let procsArr = [];
                if (Array.isArray(item.procs)) {
                    procsArr = item.procs;
                } else if (typeof item.procs === 'string') {
                    try {
                        const parsed = JSON.parse(item.procs);
                        procsArr = Array.isArray(parsed) ? parsed : item.procs.split(',').map(s => s.trim()).filter(Boolean);
                    } catch(e) {
                        procsArr = item.procs.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                const procsHtml = procsArr.map(p => {
                    const pName = (typeof p === 'object' && p !== null) ? (p.name || p.ten || '') : String(p || '');
                    return `<span class="badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; font-size:11px; padding:2px 7px; border-radius:10px; margin:2px 3px; display:inline-block;">${escapeHtml(pName)}</span>`;
                }).join('');
                const sttHtml = (typeof window.renderSttOrderControl === 'function') ? window.renderSttOrderControl("protocols", i, list.length) : `<span style="font-weight:700;">${i + 1}</span>`;
                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" ondblclick="editProtocol(${i})" title="Nhấp đúp chuột để chỉnh sửa phác đồ này">
                    <td align="center">${sttHtml}</td>
                    <td>
                        <strong style="color:#1e3a8a; font-size:13px;">${escapeHtml(item.name || `Phác đồ ${i + 1}`)}</strong>
                        <div style="font-size:11px; color:#64748b; margin-top:2px;">${procsArr.length} thủ thuật</div>
                    </td>
                    <td>${procsHtml || '<em style="color:#94a3b8;">Chưa chọn thủ thuật</em>'}</td>
                    <td align="center">
                        <button type="button" class="btn btn-primary btn-sm" onclick="editProtocol(${i})" style="margin-right:4px; font-size:11px; padding:3px 8px; cursor:pointer;" title="Sửa phác đồ">✏️ Sửa</button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteProtocol(${i})" style="font-size:11px; padding:3px 8px; cursor:pointer;" title="Xóa phác đồ">🗑️ Xóa</button>
                    </td>
                </tr>`;
            }).join('');

            if (typeof initTableDragAndDrop === 'function') {
                initTableDragAndDrop('protocols-list', (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : dataCache.protocols, () => {
                    renderProtocolsTable();
                    saveProtocolsData((window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : dataCache.protocols);
                });
            }
        }
        window.renderProtocolsTable = renderProtocolsTable;

        function renderProtocolSelectOptions() {
            const sel = document.getElementById('pat-protocol-select');
            if (!sel) return;
            const list = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : [];
            
            let optionsHtml = '<option value="">-- Chọn Phác đồ --</option>';
            list.forEach((item, i) => {
                let procsArr = [];
                if (Array.isArray(item.procs)) {
                    procsArr = item.procs;
                } else if (typeof item.procs === 'string') {
                    try {
                        const parsed = JSON.parse(item.procs);
                        procsArr = Array.isArray(parsed) ? parsed : item.procs.split(',').map(s => s.trim()).filter(Boolean);
                    } catch(e) {
                        procsArr = item.procs.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                const procsSummary = procsArr.map(p => (typeof p === 'object' && p !== null) ? (p.name || p.ten || '') : String(p || '')).filter(Boolean).join(', ');
                optionsHtml += `<option value="${i}">${escapeHtml(item.name || `Phác đồ ${i + 1}`)}: ${escapeHtml(procsSummary)}</option>`;
            });
            sel.innerHTML = optionsHtml;
        }
        window.renderProtocolSelectOptions = renderProtocolSelectOptions;

        function clearSelectedProcs() {
            document.querySelectorAll('.pat-proc-cb').forEach(cb => { cb.checked = false; });
            const sel = document.getElementById('pat-protocol-select');
            if (sel) sel.value = '';
        }
        window.clearSelectedProcs = clearSelectedProcs;

        function applyClinicalProtocol(protocolIdx) {
            if (protocolIdx === '' || protocolIdx === null || protocolIdx === undefined) {
                clearSelectedProcs();
                return;
            }
            const idx = parseInt(protocolIdx, 10);
            const list = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : [];
            if (isNaN(idx) || idx < 0 || idx >= list.length) return;

            const pObj = list[idx];
            let targetProcs = [];
            if (Array.isArray(pObj.procs)) {
                targetProcs = pObj.procs;
            } else if (typeof pObj.procs === 'string') {
                try {
                    const parsed = JSON.parse(pObj.procs);
                    targetProcs = Array.isArray(parsed) ? parsed : pObj.procs.split(',').map(s => s.trim()).filter(Boolean);
                } catch(e) {
                    targetProcs = pObj.procs.split(',').map(s => s.trim()).filter(Boolean);
                }
            }

            // Bỏ chọn trước khi áp dụng
            document.querySelectorAll('.pat-proc-cb').forEach(cb => { cb.checked = false; });

            let matchedCount = 0;
            document.querySelectorAll('.pat-proc-cb').forEach(cb => {
                const cbVal = String(cb.value || '').trim();
                const isMatch = targetProcs.some(target => {
                    const targetName = (typeof target === 'object' && target !== null) ? (target.name || target.ten || '') : String(target || '');
                    return typeof matchProc === 'function' ? matchProc(cbVal, targetName) : (cbVal.toLowerCase() === targetName.toLowerCase());
                });
                if (isMatch) {
                    cb.checked = true;
                    matchedCount++;
                    const parent = cb.closest('.checkbox-item') || cb.parentElement;
                    if (parent) {
                        parent.style.transition = 'background-color 0.3s';
                        parent.style.backgroundColor = '#dbeafe';
                        setTimeout(() => { parent.style.backgroundColor = ''; }, 600);
                    }
                }
            });

            if (typeof window.showToast === 'function') {
                window.showToast(`🎯 Đã áp dụng: ${pObj.name} (${matchedCount} thủ thuật)`);
            }
        }
        window.applyClinicalProtocol = applyClinicalProtocol;

        function renderProtocolSelectOptions() {
            const sel = document.getElementById('pat-protocol-select');
            if (!sel) return;
            const list = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : [];
            
            let optionsHtml = '<option value="">-- Chọn Phác đồ --</option>';
            list.forEach((item, i) => {
                let procsArr = [];
                if (Array.isArray(item.procs)) {
                    procsArr = item.procs;
                } else if (typeof item.procs === 'string') {
                    try {
                        const parsed = JSON.parse(item.procs);
                        procsArr = Array.isArray(parsed) ? parsed : item.procs.split(',').map(s => s.trim()).filter(Boolean);
                    } catch(e) {
                        procsArr = item.procs.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                const procsSummary = procsArr.map(p => (typeof p === 'object' && p !== null) ? (p.name || p.ten || '') : String(p || '')).filter(Boolean).join(', ');
                optionsHtml += `<option value="${i}">${escapeHtml(item.name || `Phác đồ ${i + 1}`)}: ${escapeHtml(procsSummary)}</option>`;
            });
            sel.innerHTML = optionsHtml;
        }
        window.renderProtocolSelectOptions = renderProtocolSelectOptions;

        function clearSelectedProcs() {
            document.querySelectorAll('.pat-proc-cb').forEach(cb => { cb.checked = false; });
            const sel = document.getElementById('pat-protocol-select');
            if (sel) sel.value = '';
        }
        window.clearSelectedProcs = clearSelectedProcs;

        function applyClinicalProtocol(protocolIdx) {
            if (protocolIdx === '' || protocolIdx === null || protocolIdx === undefined) {
                clearSelectedProcs();
                return;
            }
            const idx = parseInt(protocolIdx, 10);
            const list = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : [];
            if (isNaN(idx) || idx < 0 || idx >= list.length) return;

            const pObj = list[idx];
            let targetProcs = [];
            if (Array.isArray(pObj.procs)) {
                targetProcs = pObj.procs;
            } else if (typeof pObj.procs === 'string') {
                try {
                    const parsed = JSON.parse(pObj.procs);
                    targetProcs = Array.isArray(parsed) ? parsed : pObj.procs.split(',').map(s => s.trim()).filter(Boolean);
                } catch(e) {
                    targetProcs = pObj.procs.split(',').map(s => s.trim()).filter(Boolean);
                }
            }

            // Bỏ chọn trước khi áp dụng
            document.querySelectorAll('.pat-proc-cb').forEach(cb => { cb.checked = false; });

            let matchedCount = 0;
            document.querySelectorAll('.pat-proc-cb').forEach(cb => {
                const cbVal = String(cb.value || '').trim();
                const isMatch = targetProcs.some(target => {
                    const targetName = (typeof target === 'object' && target !== null) ? (target.name || target.ten || '') : String(target || '');
                    return typeof matchProc === 'function' ? matchProc(cbVal, targetName) : (cbVal.toLowerCase() === targetName.toLowerCase());
                });
                if (isMatch) {
                    cb.checked = true;
                    matchedCount++;
                    const parent = cb.closest('.checkbox-item') || cb.parentElement;
                    if (parent) {
                        parent.style.transition = 'background-color 0.3s';
                        parent.style.backgroundColor = '#dbeafe';
                        setTimeout(() => { parent.style.backgroundColor = ''; }, 600);
                    }
                }
            });

            if (typeof window.showToast === 'function') {
                window.showToast(`🎯 Đã áp dụng: ${pObj.name} (${matchedCount} thủ thuật)`);
            }
        }
        window.applyClinicalProtocol = applyClinicalProtocol;

        function toggleMobileForm(btn) {
            if (!btn) return;
            const parent = btn.closest('.split-layout') || btn.parentElement;
            if (!parent) return;
            const form = parent.querySelector('.sidebar-form');
            if (!form) return;
            
            const isHidden = window.getComputedStyle(form).display === 'none' || form.classList.contains('mobile-form-collapsed');
            if (isHidden) {
                form.style.display = 'block';
                form.classList.remove('mobile-form-collapsed');
                btn.innerHTML = '➖ Thu Gọn Form Nhập Liệu';
                btn.style.background = 'linear-gradient(135deg, #475569, #334155)';
            } else {
                form.style.display = 'none';
                form.classList.add('mobile-form-collapsed');
                btn.innerHTML = '➕ Thêm Mới / Nhập Liệu';
                btn.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
            }
        }
        window.toggleMobileForm = toggleMobileForm;

        // ============================================================
        // 💉 2. THỦ THUẬT
        // ============================================================

        function toggleAllSkills(checkbox, system) {
            const container = document.getElementById(system === 'YHCT' ? 'staff-skills-yhct' : 'staff-skills-phcn');
            if (container) {
                container.querySelectorAll('.skill-checkbox').forEach(cb => cb.checked = checkbox.checked);
            }
        }

        function renderProcedureCheckboxes() {
            let sYhct = `<h4 class="yhct">💊 YHCT <input type="checkbox" onchange="toggleAllSkills(this, 'YHCT')" style="margin-left:8px; cursor:pointer; transform:scale(1.2);" title="Chọn tất cả YHCT"></h4>`, 
                sPhcn = `<h4 class="phcn">⚙️ PHCN <input type="checkbox" onchange="toggleAllSkills(this, 'PHCN')" style="margin-left:8px; cursor:pointer; transform:scale(1.2);" title="Chọn tất cả PHCN"></h4>`;

            let pYhct = '<h4 class="yhct">💊 YHCT</h4>', pPhcn = '<h4 class="phcn">⚙️ PHCN</h4>';

            (dataCache.proc || []).forEach(p => {
                if (!p) return;
                const ten = p.ten || p[1] || '';
                const he = p.he || p[3] || 'PHCN';
                if (!ten) return;

                const escapedTen = escapeHtml(ten);
                const sCb = `<label class="checkbox-item"><input type="checkbox" class="skill-checkbox" value="${escapedTen}"> ${escapedTen}</label>`;
                const pCb = `<label class="checkbox-item"><input type="checkbox" class="pat-proc-cb" value="${escapedTen}"> ${escapedTen}</label>`;

                if (he === 'YHCT') { sYhct += sCb; pYhct += pCb; } else { sPhcn += sCb; pPhcn += pCb; }
            });

            [['staff-skills-yhct', sYhct], ['staff-skills-phcn', sPhcn], ['pat-skills-yhct', pYhct], ['pat-skills-phcn', pPhcn]]
                .forEach(([id, html]) => { const el = document.getElementById(id); if (el) el.innerHTML = html; });

            if (typeof renderProtoProcsFormCheckboxes === 'function') renderProtoProcsFormCheckboxes();
        }


        function renderProceduresTable() {
            renderProceduresTable_Original();
            if (typeof renderProtoProcsFormCheckboxes === 'function') renderProtoProcsFormCheckboxes();
            if (typeof renderProtocolsTable === 'function') renderProtocolsTable();
            if (typeof renderProtocolSelectOptions === 'function') renderProtocolSelectOptions();
        }

        function toggleContinuousProc(isChecked) {
            if (isChecked) {
                const thMin = document.getElementById('proc-person-time')?.value;
                const thMax = document.getElementById('proc-person-time-max')?.value;
                if (thMin) document.getElementById('proc-machine-time').value = thMin;
                if (thMax) document.getElementById('proc-machine-time-max').value = thMax;
            }
        }
        window.toggleContinuousProc = toggleContinuousProc;

        function renderProceduresTable_Original() {
            const tbody = document.getElementById('procedures-list');
            if (!tbody) return;
            if (!dataCache.proc.length) { tbody.innerHTML = renderEmptyRow(12); return; }

            tbody.innerHTML = dataCache.proc.map((item, i) => {
                const idx = dataCache.proc.indexOf(item);
                const isRutMay = (item.canRutMay === 'Có' || item.canRutMay === 1 || item.canRutMay === '1' || item.canRutMay === true || item[9] === 'Có' || item[9] === 1 || item[9] === '1');
                const isNguoiPhu = (item.canNguoiPhu === 'Có' || item.canNguoiPhu === 1 || item.canNguoiPhu === '1' || item.canNguoiPhu === true || item[10] === 'Có' || item[10] === 1 || item[10] === '1');
                const rutText = isRutMay ? 'Có' : 'Không';
                const phuText = isNguoiPhu ? 'Có' : 'Không';

                let tgThMin = parseInt(item.thoiGianThucHienMin || item.thoiGianThucHien || item[6]) || 0;
                let tgThMax = parseInt(item.thoiGianThucHienMax || item[13] || 0) || tgThMin;
                if (!tgThMax || tgThMax <= tgThMin) tgThMax = tgThMin;

                let tgMin = parseInt(item.thoiGianThuThuatMin || item.thoiGianThuThuat || item[7]) || 0;
                let tgMax = parseInt(item.thoiGianThuThuatMax || item[12] || 0) || 0;

                // Smart YHCT duration range fallback if not explicitly saved yet
                if (!tgMax || tgMax <= tgMin) {
                    const tenLower = String(item.ten || item.name || item[1] || '').toLowerCase();
                    if (tenLower.includes('điện châm') || tenLower === 'đc' || tenLower === 'dctb') {
                        if (tgMin === 25) tgMax = 30;
                        else if (tgMin === 30) tgMax = 35;
                    } else if (tenLower.includes('parafin') || tenLower === 'pa') {
                        if (tgMin === 20) tgMax = 25;
                    } else {
                        tgMax = tgMin;
                    }
                }

                const isLienTuc = (item.lienTuc === 'Có' || item.lienTuc === 1 || item.lienTuc === '1' || item.lienTuc === true || item[14] === 'Có' || item[14] === 1 || (tgThMin === tgMin && tgThMax === tgMax && tgThMin >= 10));
                const lienTucText = isLienTuc ? 'Có' : 'Không';

                const thMinDisplay = `<span class="proc-time-single">${tgThMin} phút</span>`;
                const thMaxDisplay = (tgThMax > tgThMin)
                    ? `<span class="proc-time-range-badge">${tgThMax} phút</span>`
                    : `<span class="proc-time-single">${tgThMax} phút</span>`;

                const minDisplay = `<span class="proc-time-single">${tgMin} phút</span>`;
                const maxDisplay = (tgMax > tgMin)
                    ? `<span class="proc-time-range-badge">${tgMax} phút</span>`
                    : `<span class="proc-time-single">${tgMax} phút</span>`;

                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" onclick="if(!window._isDraggingRow) editProc(${idx})" title="Bấm sửa (Kéo thả nút ☰ hoặc bấm ▲/▼ để đổi thứ tự, Phím Delete để xóa)">
            <td>${renderSttOrderControl("procedures", i, dataCache.proc.length)}</td>
            <td>${escapeHtml(item.ten || item[1] || '')}</td>
            <td><strong>${escapeHtml(item.vietTat || item[2] || '')}</strong></td>
            <td align="center">${thMinDisplay}</td>
            <td align="center">${thMaxDisplay}</td>
            <td align="center">${minDisplay}</td>
            <td align="center">${maxDisplay}</td>
            <td>${item.khoangCach || item[8] || 0} phút</td>
            <td align="center">${lienTucText}</td>
            <td align="center">${rutText}</td>
            <td align="center">${phuText}</td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteProcedure(${idx})">Xóa</button></td>
        </tr>`;
            }).join('');

            if (typeof filterProcTable === 'function') filterProcTable();

            initTableDragAndDrop('procedures-list', dataCache.proc, () => {
                renderProceduresTable();
                saveReorderedData('procedures', dataCache.proc);
            });
        }

        function saveProcedure() {
            const ten = document.getElementById('proc-name').value, vt = document.getElementById('proc-short').value;
            const he = document.getElementById('proc-system').value, loai = document.getElementById('proc-category').value;
            const may = document.getElementById('proc-machine').value;
            const tgThucHienMin = parseInt(document.getElementById('proc-person-time').value) || 0;
            const tgThucHienMaxInput = parseInt(document.getElementById('proc-person-time-max').value);
            const tgThucHienMax = (!isNaN(tgThucHienMaxInput) && tgThucHienMaxInput > 0) ? tgThucHienMaxInput : tgThucHienMin;
            const tgThuThuatMin = parseInt(document.getElementById('proc-machine-time').value) || 0;
            const tgThuThuatMaxInput = parseInt(document.getElementById('proc-machine-time-max').value);
            const tgThuThuatMax = (!isNaN(tgThuThuatMaxInput) && tgThuThuatMaxInput > 0) ? tgThuThuatMaxInput : tgThuThuatMin;
            const kc = parseInt(document.getElementById('proc-gap').value) || 0;
            const rut = document.getElementById('proc-unplug-cb').checked ? 'Có' : 'Không';
            const phu = document.getElementById('proc-assist-cb').checked ? 'Có' : 'Không';
            const lienTuc = document.getElementById('proc-continuous-cb').checked ? 'Có' : 'Không';
            const dsPhu = (rut === 'Có' || phu === 'Có') ? 'Tất cả Điều dưỡng' : '';

            if (!ten) return alert("Nhập tên thủ thuật");

            const obj = {
                ten, vietTat: vt, he, phanLoai: loai, may,
                thoiGianThucHien: tgThucHienMin,
                thoiGianThucHienMin: tgThucHienMin,
                thoiGianThucHienMax: tgThucHienMax,
                thoiGianThuThuat: tgThuThuatMin,
                thoiGianThuThuatMin: tgThuThuatMin,
                thoiGianThuThuatMax: tgThuThuatMax,
                khoangCach: kc, canRutMay: rut, canNguoiPhu: phu, dsNguoiPhu: dsPhu,
                lienTuc: lienTuc
            };

            if (editIndex.proc > -1) {
                dataCache.proc[editIndex.proc] = obj;
                if (typeof callApi === 'function') {
                    callApi('editThuThuat', [editIndex.proc, ten, vt, he, loai, may, tgThucHienMin, tgThuThuatMin, kc, rut, phu, dsPhu, tgThuThuatMax, tgThucHienMax, lienTuc]);
                }
            } else {
                dataCache.proc.push(obj);
                if (typeof callApi === 'function') {
                    callApi('addThuThuat', [ten, vt, he, loai, may, tgThucHienMin, tgThuThuatMin, kc, rut, phu, dsPhu, tgThuThuatMax, tgThucHienMax, lienTuc]);
                }
            }

            cancelEdit('proc'); renderProceduresTable(); renderProcedureCheckboxes();
        }

        function editProc(index) {
            editIndex.proc = index;
            const item = dataCache.proc[index];
            ['proc-name', 'proc-short', 'proc-system', 'proc-category', 'proc-machine', 'proc-person-time', 'proc-person-time-max', 'proc-machine-time', 'proc-machine-time-max', 'proc-gap'].forEach(id => {
                const keyMap = {
                    'proc-name': 'ten',
                    'proc-short': 'vietTat',
                    'proc-system': 'he',
                    'proc-category': 'phanLoai',
                    'proc-machine': 'may',
                    'proc-person-time': 'thoiGianThucHienMin',
                    'proc-person-time-max': 'thoiGianThucHienMax',
                    'proc-machine-time': 'thoiGianThuThuatMin',
                    'proc-machine-time-max': 'thoiGianThuThuatMax',
                    'proc-gap': 'khoangCach'
                };
                const el = document.getElementById(id);
                if (el) {
                    let val = item[keyMap[id]];
                    if (id === 'proc-person-time' && (!val && val !== 0)) val = item.thoiGianThucHien || item[6];
                    if (id === 'proc-person-time-max' && (!val && val !== 0)) val = item.thoiGianThucHienMax || item[13] || item.thoiGianThucHien || item[6];
                    if (id === 'proc-machine-time' && (!val && val !== 0)) val = item.thoiGianThuThuat || item[7];
                    if (id === 'proc-machine-time-max' && (!val && val !== 0)) val = item.thoiGianThuThuatMax || item[12] || item.thoiGianThuThuat || item[7];
                    el.value = (val !== undefined && val !== null) ? val : '';
                }
            });

            const isRutMay = (item.canRutMay === 'Có' || item.canRutMay === 1 || item.canRutMay === '1' || item.canRutMay === true || item[9] === 'Có' || item[9] === 1 || item[9] === '1');
            const isNguoiPhu = (item.canNguoiPhu === 'Có' || item.canNguoiPhu === 1 || item.canNguoiPhu === '1' || item.canNguoiPhu === true || item[10] === 'Có' || item[10] === 1 || item[10] === '1');
            const isLienTuc = (item.lienTuc === 'Có' || item.lienTuc === 1 || item.lienTuc === '1' || item.lienTuc === true || item[14] === 'Có' || item[14] === 1 || (item.thoiGianThucHienMin === item.thoiGianThuThuatMin && (item.thoiGianThucHienMax || item.thoiGianThucHienMin) === (item.thoiGianThuThuatMax || item.thoiGianThuThuatMin) && item.thoiGianThucHienMin >= 10));

            document.getElementById('proc-unplug-cb').checked = isRutMay;
            document.getElementById('proc-assist-cb').checked = isNguoiPhu;
            if (document.getElementById('proc-continuous-cb')) document.getElementById('proc-continuous-cb').checked = isLienTuc;
            document.getElementById('btn-save-proc').innerText = "Lưu Sửa";
            document.getElementById('btn-cancel-proc').style.display = "inline-block";
        }

        function deleteProcedure(i) {
            const item = dataCache.proc[i];
            if (!item) return;
            const ten = String(item.ten || item.name || item[1] || '').trim();

            showCustomConfirm("Xác nhận xóa thủ thuật", `Bác sĩ có chắc chắn muốn xóa thủ thuật "${ten}" không?`, function () {
                if (window.showGlobalLoading) window.showGlobalLoading("Đang xóa thủ thuật...");
                const btnSave = document.getElementById('btn-save-proc');
                if (btnSave) { btnSave.disabled = true; btnSave.innerText = "Đang xóa..."; }

                dataCache.proc.splice(i, 1);
                renderProceduresTable();
                renderProcedureCheckboxes();

                google.script.run
                    .withSuccessHandler(() => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }
                        if (typeof showToastSuccess === 'function') showToastSuccess(`Đã xóa thủ thuật "${ten}" thành công!`);
                    })
                    .withFailureHandler(e => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }
                        alert('Lỗi xóa thủ thuật: ' + e);
                    }).deleteThuThuat(i, ten);
            });
        }



        // ============================================================

        // 👨‍⚕️ 3. NHÂN SỰ

        // ============================================================


        function renderStaffTable() {
            renderStaffTable_Original();
            
            // Populate the "Tìm bác sĩ rảnh" filter dropdown
            const filterSelect = document.getElementById('filter-doc-name');
            if (filterSelect && dataCache.staff) {
                const currentVal = filterSelect.value;
                const docs = dataCache.staff.filter(s => {
                    const vt = String(s.vaiTro).toLowerCase();
                    return (vt.includes('bác sĩ') || vt.includes('ktv') || vt.includes('kỹ thuật viên')) && s.trangThai !== 'Nghỉ cả ngày';
                }).map(s => s.ten.trim());
                
                const uniqueDocs = [...new Set(docs)].sort();
                filterSelect.innerHTML = '<option value="">🔍 Lọc tên bác sĩ...</option>';
                uniqueDocs.forEach(docName => {
                    filterSelect.innerHTML += `<option value="${docName}">${docName}</option>`;
                });
                
                if (currentVal && uniqueDocs.includes(currentVal)) {
                    filterSelect.value = currentVal;
                }
            }

            setTimeout(() => { }, 50);
        }

        function renderStaffTable_Original() {
            const staffList = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.staff)) ? dataCache.staff : [];
            const filteredStaff = staffList.filter(s => {
                const role = String(s.vaiTro || s.role || '').toLowerCase();
                return role.includes('bác sĩ') || role.includes('kỹ thuật viên') || role.includes('ktv') || role.includes('bs');
            });
            const statEl = document.getElementById('stat-staff');
            if (statEl) statEl.innerText = filteredStaff.length;

            const docGrid = document.getElementById('room-doctors-grid');
            const ktvGrid = document.getElementById('room-ktv-grid');
            const ddGrid = document.getElementById('room-dd-grid');
            const staffGrid = document.getElementById('room-staff-grid');
            if (docGrid && (ktvGrid || staffGrid)) {
                let docHtml = '<div class="skills-col">', ktvHtml = '<div class="skills-col">', ddHtml = '<div class="skills-col">';
                staffList.forEach(s => {
                    if (!s || !s.ten) return;
                    const role = String(s.vaiTro || s.role || '').toLowerCase();
                    const tenLower = String(s.ten).toLowerCase();
                    const isDoc = role.includes('bác sĩ') || role.startsWith('bs') || tenLower.startsWith('bs');
                    const isKtv = role.includes('kỹ thuật viên') || role.includes('ktv') || tenLower.startsWith('ktv');
                    
                    if (isDoc) {
                        docHtml += `<label class="checkbox-item"><input type="checkbox" class="room-doc-cb" value="${escapeHtml(s.ten)}"> ${escapeHtml(s.ten)}</label>`;
                    } else if (isKtv) {
                        ktvHtml += `<label class="checkbox-item"><input type="checkbox" class="room-ktv-cb room-stf-cb" value="${escapeHtml(s.ten)}"> ${escapeHtml(s.ten)}</label>`;
                    } else {
                        ddHtml += `<label class="checkbox-item"><input type="checkbox" class="room-dd-cb room-stf-cb" value="${escapeHtml(s.ten)}"> ${escapeHtml(s.ten)}</label>`;
                    }
                });
                docGrid.innerHTML = docHtml + '</div>';
                if (ktvGrid) ktvGrid.innerHTML = ktvHtml + '</div>';
                if (ddGrid) ddGrid.innerHTML = ddHtml + '</div>';
                if (staffGrid) staffGrid.innerHTML = ktvHtml + ddHtml + '</div>';
            }

            const tbody = document.getElementById('staff-list');
            if (!tbody) return;
            if (!staffList.length) { tbody.innerHTML = renderEmptyRow(8, 'Chưa có dữ liệu nhân sự'); return; }

            tbody.innerHTML = staffList.map((item, i) => {
                const idx = staffList.indexOf(item);
                const kyNangHienThi = getShortSkills(item.kyNang, true);
                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" data-staff-index="${idx}" onclick="if(!window._isDraggingRow) editStaff(parseInt(this.dataset.staffIndex))" style="${item.trangThai !== 'Đi làm' ? 'opacity:0.5; background:#f9f9f9;' : ''}" title="Bấm sửa (Kéo thả nút ☰ hoặc bấm ▲/▼ để đổi thứ tự, Phím Delete để xóa)">
            <td>${renderSttOrderControl("staff", i, staffList.length)}</td>
            <td><strong>${escapeHtml(item.ten || '')}</strong></td>
            <td style="font-size:11px; max-width:100px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(item.tenHis || '')}">${escapeHtml(item.tenHis || '')}</td>
            <td><span style="color:${item.trangThai === 'Đi làm' ? '#28a745' : '#dc3545'}; font-weight:600">${escapeHtml(item.trangThai || 'Đi làm')}</span></td>
            <td>${escapeHtml(item.thoiGianLam || '07:30-11:30, 13:00-16:30')}</td>
            <td style="font-size:11px; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><strong>${escapeHtml(kyNangHienThi)}</strong></td>
            <td style="font-size:11px;"><strong>${item.quyen === 'Cả hai' ? 'YHCT+PHCN' : escapeHtml(item.quyen || '')}</strong></td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteStaff(${idx})">Xóa</button></td>
        </tr>`;
            }).join('');

            if (typeof renderBusyStaff === 'function') {
                try { renderBusyStaff(); } catch(e) { console.warn("[renderBusyStaff error]:", e); }
            }

            initTableDragAndDrop('staff-list', staffList, () => {
                renderStaffTable();
                saveReorderedData('staff', staffList);
            });
        }

        function saveStaff() {
            const ten = document.getElementById('staff-name').value.trim();
            const vaiTro = document.getElementById('staff-role').value;
            const trangThai = document.getElementById('staff-status').value;
            const tgLam = `${document.getElementById('staff-ms').value}-${document.getElementById('staff-me').value}, ${document.getElementById('staff-as').value}-${document.getElementById('staff-ae').value}`;
            const thayThe = document.getElementById('staff-replace').value;
            const quyen = document.getElementById('staff-quyen').value || 'Cả hai';
            const tenHis = document.getElementById('staff-ten-his').value.trim();
            const busyEl = document.getElementById('staff-busy');
            const gioBan = busyEl ? busyEl.value.trim() : (editIndex.staff > -1 ? (dataCache.staff[editIndex.staff]?.gioBan || '') : '');
            const kyNang = Array.from(document.querySelectorAll('.skill-checkbox:checked')).map(cb => cb.value).join(', ');

            if (!ten) return alert("Nhập tên!");

            try {
                const localHisMap = JSON.parse(localStorage.getItem('staff_his_map') || '{}');
                localHisMap[ten] = tenHis;
                localStorage.setItem('staff_his_map', JSON.stringify(localHisMap));
            } catch (e) { }

            const obj = { ten, vaiTro, trangThai, thoiGianLam: tgLam, kyNang, gioBan, nguoiThayThe: thayThe, quyen, tenHis };

            if (window.showGlobalLoading) window.showGlobalLoading("Đang lưu nhân sự...");
            if (editIndex.staff > -1) {
                const oldItem = dataCache.staff[editIndex.staff];
                const sheetIdx = oldItem.sheetIndex !== undefined ? oldItem.sheetIndex : editIndex.staff;
                obj.sheetIndex = sheetIdx;
                obj.index = editIndex.staff;
                dataCache.staff[editIndex.staff] = obj;
                if (window.dataCacheTime) window.dataCacheTime['staff'] = Date.now();
                google.script.run
                    .withSuccessHandler(() => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                    })
                    .withFailureHandler((err) => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        alert("Lỗi lưu nhân sự: " + (err.message || err));
                    })
                    .editNhanSu(sheetIdx, ten, vaiTro, trangThai, tgLam, kyNang, gioBan, thayThe, quyen, tenHis);
            } else {
                dataCache.staff.push(obj);
                if (window.dataCacheTime) window.dataCacheTime['staff'] = Date.now();
                google.script.run
                    .withSuccessHandler(() => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                    })
                    .withFailureHandler((err) => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        alert("Lỗi thêm nhân sự: " + (err.message || err));
                    })
                    .addNhanSu(ten, vaiTro, trangThai, tgLam, kyNang, gioBan, thayThe, quyen, tenHis);
            }

            cancelEdit('staff'); renderStaffTable();
        }

        function editStaff(index) {
            if (window.innerWidth <= 960 && typeof window.openMobileFormForEdit === "function") window.openMobileFormForEdit("staff");

            editIndex.staff = index;

            const item = dataCache.staff[index];

            document.getElementById('staff-name').value = item.ten;

            document.getElementById('staff-role').value = item.vaiTro;

            document.getElementById('staff-status').value = item.trangThai;

            document.getElementById('staff-quyen').value = item.quyen || 'Cả hai';
            document.getElementById('staff-ten-his').value = item.tenHis || '';

            document.getElementById('staff-busy').value = item.gioBan;

            document.getElementById('staff-replace').value = item.nguoiThayThe || 'Không';

            if (item.thoiGianLam) {

                const caArr = item.thoiGianLam.split(',');

                if (caArr[0]) { const sang = caArr[0].split('-'); if (sang[0]) document.getElementById('staff-ms').value = sang[0].trim(); if (sang[1]) document.getElementById('staff-me').value = sang[1].trim(); }

                if (caArr[1]) { const chieu = caArr[1].split('-'); if (chieu[0]) document.getElementById('staff-as').value = chieu[0].trim(); if (chieu[1]) document.getElementById('staff-ae').value = chieu[1].trim(); }

            }

            const skillsArr = item.kyNang.split(',').map(s => s.trim().toLowerCase());

            document.querySelectorAll('.skill-checkbox').forEach(cb => { cb.checked = skillsArr.includes(cb.value.toLowerCase()); });

            document.getElementById('btn-save-staff').innerText = "Lưu Sửa";

            document.getElementById('btn-cancel-staff').style.display = "inline-block";

        }

        function deleteStaff(i) {
            const s = dataCache.staff[i];
            if (!s) return;

            showCustomConfirm("Xác nhận xóa nhân sự", `Bác sĩ có chắc chắn muốn xóa nhân sự [ ${s.ten} ] không?`, function () {
                if (window.showGlobalLoading) window.showGlobalLoading("Đang xóa nhân sự...");
                const btnSave = document.getElementById('btn-save-staff');
                if (btnSave) { btnSave.disabled = true; btnSave.innerText = "Đang xóa..."; }

                const deletedSheetIndex = s.sheetIndex !== undefined ? s.sheetIndex : i;
                const staffName = s.ten;
                dataCache.staff.splice(i, 1);
                dataCache.staff.forEach((item, idx) => {
                    item.index = idx;
                    if (item.sheetIndex !== undefined && item.sheetIndex > deletedSheetIndex) {
                        item.sheetIndex--;
                    }
                });
                renderStaffTable();

                google.script.run.withSuccessHandler(() => {
                    if (window.hideGlobalLoading) window.hideGlobalLoading();
                    if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }
                    if (typeof loadDashboard === 'function') loadDashboard();
                })
                    .withFailureHandler(e => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }
                        alert('Lỗi khi xóa: ' + e);
                    }).deleteNhanSu(deletedSheetIndex, staffName);
            });
        }



        // ============================================================

        // 🏥 4. PHÒNG

        // ============================================================


        function renderRoomsTable() {
            renderRoomsTable_Original();
            setTimeout(() => { }, 50);
        }

        function renderRoomsTable_Original() {
            const tbody = document.getElementById('rooms-list');
            if (!tbody) return;
            const roomSelect = document.getElementById('pat-room');
            if (roomSelect) {
                const currentVal = roomSelect.value;
                const options = (dataCache.room || []).map(r => { const ten = String(r.tenPhong || r[1] || '').trim(); return `<option value="${escapeHtml(ten)}">${escapeHtml(ten)}</option>`; }).join('');
                roomSelect.innerHTML = `<option value="">-- Chọn phòng --</option>` + options;
                if (currentVal) roomSelect.value = currentVal;
            }

            if (typeof renderDynamicMachineInputs === 'function') {
                renderDynamicMachineInputs();
            }

            if (!dataCache.room || !dataCache.room.length) { tbody.innerHTML = renderEmptyRow(7, 'Chưa có dữ liệu phòng'); return; }

            tbody.innerHTML = dataCache.room.map((item, i) => {
                const idx = dataCache.room.indexOf(item);
                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" onclick="if(!window._isDraggingRow) editRoom(${idx})" title="Bấm sửa (Kéo thả nút ☰ hoặc bấm ▲/▼ để đổi thứ tự, Phím Delete để xóa)">
            <td>${renderSttOrderControl("rooms", i, dataCache.room.length)}</td>
            <td><strong>${escapeHtml(item.tenPhong || item[1] || '')}</strong></td>
            <td>${escapeHtml(item.bacSi || item[2] || '')}</td>
            <td style="font-size:11px">${item.ktv || item[3] || ''}</td>
            <td style="font-size:11px; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.danhSachMay || item[4] || ''}">${escapeHtml(item.danhSachMay || item[4] || '')}</td>
            <td style="text-align:center;">${item.soGiuong || item[5] || 0}</td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteRoom(${idx})">Xóa</button></td>
        </tr>`;
            }).join('');

            if (typeof filterRoomTable === 'function') filterRoomTable();

            initTableDragAndDrop('rooms-list', dataCache.room, () => {
                renderRoomsTable();
                saveReorderedData('rooms', dataCache.room);
            });
        }

        function saveRoom() {
            const ten = document.getElementById('room-name').value.trim();

            const slGiuong = parseInt(document.getElementById('room-beds').value) || 0;

            if (!ten) return alert("Nhập tên phòng");

            const bs = Array.from(document.querySelectorAll('.room-doc-cb:checked')).map(cb => cb.value).join(', ');

            const ktv = Array.from(document.querySelectorAll('.room-stf-cb:checked')).map(cb => cb.value).join(', ');

            const roomIdx = editIndex.room > -1 ? editIndex.room : dataCache.room.length;

            let usedBeds = 0;

            for (let i = 0; i < roomIdx; i++) usedBeds += parseInt(dataCache.room[i]?.soGiuong || dataCache.room[i]?.[5]) || 0;

            const dsGiuong = Array.from({ length: slGiuong }, (_, i) => "G" + (usedBeds + i + 1)).join(', ');

            let finalMachineList = [];

            document.querySelectorAll('.room-machine-input').forEach(inp => {

                let reqQty = parseInt(inp.value) || 0;

                if (!reqQty) return;

                const typeName = (inp.getAttribute('data-type') || '').toLowerCase().trim();
                if (!typeName || typeName === 'undefined' || typeName === 'null') return;

                const machinesOfType = (dataCache.machine || []).filter(m => {
                    if (!m) return false;
                    const t = String(m.tenLoai || m.ten_loai || (Array.isArray(m) ? m[1] : '') || m.ten || m.name || '').toLowerCase().trim();
                    return t === typeName;
                }).map(m => String(m.maMay || m.ma_may || (Array.isArray(m) ? m[2] : '') || m.ma || m.code || '').trim()).filter(Boolean);

                let usedCount = 0;

                for (let i = 0; i < roomIdx; i++) {
                    const rmList = String(dataCache.room[i]?.danhSachMay || dataCache.room[i]?.[4] || '');
                    rmList.split(',').map(x => x.trim()).filter(Boolean).forEach(code => {
                        const found = (dataCache.machine || []).find(m => {
                            if (!m) return false;
                            const mCode = String(m.maMay || m.ma_may || (Array.isArray(m) ? m[2] : '') || m.ma || m.code || '').trim();
                            return mCode.toLowerCase() === code.toLowerCase();
                        });

                        if (found) {
                            const foundType = String(found.tenLoai || found.ten_loai || (Array.isArray(found) ? found[1] : '') || found.ten || found.name || '').toLowerCase().trim();
                            if (foundType === typeName) usedCount++;
                        }
                    });

                }

                const assigned = machinesOfType.slice(usedCount, usedCount + reqQty);

                if (assigned.length < reqQty) alert(`⚠️ Kho thiếu máy [${typeName.toUpperCase()}]! Còn ${machinesOfType.length - usedCount} máy rảnh.`);

                finalMachineList = finalMachineList.concat(assigned);

            });

            const dsMay = finalMachineList.join(', ');

            if (editIndex.room > -1) {

                const oldName = dataCache.room[editIndex.room].tenPhong || dataCache.room[editIndex.room][1];

                dataCache.room[editIndex.room] = { tenPhong: ten, bacSi: bs, ktv, danhSachMay: dsMay, soGiuong: slGiuong, danhSachGiuong: dsGiuong };

                if (oldName !== ten && dataCache.pat) {

                    dataCache.pat.forEach(p => { 
                        const pRoom = p.phong || p[4] || '';
                        if (String(pRoom).trim() === String(oldName).trim()) {
                            if (p.phong !== undefined) p.phong = ten;
                            if (p[4] !== undefined) p[4] = ten;
                        }
                    });

                    if (typeof renderPatientsTable === 'function') renderPatientsTable();

                }

                google.script.run.editPhong(editIndex.room, ten, bs, ktv, dsMay, slGiuong, dsGiuong);

            } else {

                dataCache.room.push({ tenPhong: ten, bacSi: bs, ktv, danhSachMay: dsMay, soGiuong: slGiuong, danhSachGiuong: dsGiuong });

                google.script.run.addPhong(ten, bs, ktv, dsMay, slGiuong, dsGiuong);

            }

            cancelEdit('room'); renderRoomsTable();

        }

        function editRoom(index) {
            if (window.innerWidth <= 960 && typeof window.openMobileFormForEdit === "function") window.openMobileFormForEdit("room");

            editIndex.room = index;

            const item = dataCache.room[index];
            if (!item) return;

            // Luôn đảm bảo dynamic machine inputs được render đầy đủ trước khi gán giá trị
            if (typeof renderDynamicMachineInputs === 'function') {
                renderDynamicMachineInputs();
            }

            document.getElementById('room-name').value = item.tenPhong || item[1] || '';

            document.getElementById('room-beds').value = item.soGiuong || item[5] || 0;

            document.querySelectorAll('.room-doc-cb, .room-stf-cb').forEach(cb => cb.checked = false);

            const bacSi = item.bacSi || item[2] || '';
            if (bacSi) bacSi.split(',').forEach(b => { const cb = document.querySelector(`.room-doc-cb[value="${b.trim()}"]`); if (cb) cb.checked = true; });

            const ktv = item.ktv || item[3] || '';
            if (ktv) ktv.split(',').forEach(k => { const cb = document.querySelector(`.room-stf-cb[value="${k.trim()}"]`); if (cb) cb.checked = true; });

            document.querySelectorAll('.room-machine-input').forEach(inp => inp.value = '');

            const danhSachMay = item.danhSachMay || item[4] || '';
            if (danhSachMay && dataCache.machine && Array.isArray(dataCache.machine)) {

                danhSachMay.split(',').map(x => x.trim()).filter(Boolean).forEach(code => {

                    const m = dataCache.machine.find(x => {
                        if (!x) return false;
                        const mCode = String(x.maMay || x.ma_may || (Array.isArray(x) ? x[2] : '') || x.ma || x.code || '').trim();
                        return mCode.toLowerCase() === code.toLowerCase();
                    });

                    if (m) { 
                        const mType = String(m.tenLoai || m.ten_loai || (Array.isArray(m) ? m[1] : '') || m.ten || m.name || '').toLowerCase().trim();
                        if (mType && mType !== 'undefined' && mType !== 'null') {
                            const inp = document.querySelector(`.room-machine-input[data-type="${mType}"]`); 
                            if (inp) inp.value = (parseInt(inp.value) || 0) + 1; 
                        }
                    }

                });

            }

            document.getElementById('btn-save-room').innerText = "Lưu Sửa";

            document.getElementById('btn-cancel-room').style.display = "inline-block";

        }

        function deleteRoom(i) {
            

            showCustomConfirm("Xác nhận xóa phòng", "Bác sĩ có chắc chắn muốn xóa phòng này không?", function () {

                if (window.showGlobalLoading) window.showGlobalLoading("Đang xóa phòng...");

                const btnSave = document.getElementById('btn-save-room');

                if (btnSave) { btnSave.disabled = true; btnSave.innerText = "Đang xóa..."; }

                dataCache.room.splice(i, 1); renderRoomsTable();

                google.script.run

                    .withSuccessHandler(() => {

                        if (window.hideGlobalLoading) window.hideGlobalLoading();

                        if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }

                        if (typeof loadRooms === 'function') loadRooms();

                    })

                    .withFailureHandler(e => {

                        if (window.hideGlobalLoading) window.hideGlobalLoading();

                        if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }

                        alert('Lỗi: ' + e);

                    }).deletePhong(i);

            });

        }



        // ============================================================

        // 🛌 5. BỆNH NHÂN

        // ============================================================


        let _patSortMode = 2; // 2 = Ngày vào cũ -> mới (Mặc định), 1 = Ngày vào mới -> cũ, 2 = Ngày vào cũ -> mới
        window.toggleSortPatientsByNgayVao = function() {
            if (!dataCache.pat || !dataCache.pat.length) return;
            _patSortMode = (_patSortMode + 1) % 3;
            const th = document.getElementById('th-pat-ngayvao');
            if (th) {
                if (_patSortMode === 1) th.innerText = "Ngày Vào ▼";
                else if (_patSortMode === 2) th.innerText = "Ngày Vào ▲";
                else th.innerText = "Ngày Vào";
            }
            renderPatientsTable();
        };

        function renderPatientsTable(skipDashboard = false) {
            renderPatientsTable_Original();
            if (!skipDashboard && !window._isLoadingDashboard && typeof loadDashboard === 'function') {
                loadDashboard();
            }
        }

        function renderPatientsTable_Original() {
            const nameCount = {};
            (dataCache.pat || []).forEach(p => {
                const name = String(p.ten || '').trim();
                if (name) nameCount[name] = (nameCount[name] || 0) + 1;
            });

            const generalOptionsHtml = [...new Set((dataCache.pat || []).map(p => p.ten).filter(Boolean))].map(name => `<option value="${name}">`).join('');
            const dlPat = document.getElementById('pat-name-suggestions');
            if (dlPat) dlPat.innerHTML = generalOptionsHtml;

            const distinctOptionsHtml = [...new Set((dataCache.pat || []).map(p => {
                const name = String(p.ten || '').trim();
                const ns = String(p.namSinh || '').trim();
                const phong = String(p.phong || '').trim();
                if (!name) return '';
                if (nameCount[name] > 1 && ns) {
                    return `<option value="${name} (${ns})">${name} (${ns}${phong ? ' - ' + phong : ''})</option>`;
                }
                return `<option value="${name}">${name}${ns ? ' (' + ns + ')' : ''}</option>`;
            }).filter(Boolean))].join('');

            ['busy-pat-datalist', 'leave-pat-datalist'].forEach(id => {
                const dl = document.getElementById(id);
                if (dl) dl.innerHTML = distinctOptionsHtml;
            });
            const statPat = document.getElementById('stat-patients');
            if (statPat) statPat.innerText = dataCache.pat.length;

            const tbody = document.getElementById('patients-list');
            if (!tbody) return;
            if (!dataCache.pat.length) { tbody.innerHTML = renderEmptyRow(10, 'Chưa có dữ liệu bệnh nhân'); return; }

            const schedData = (window.currentScheduleData && window.currentScheduleData.length) ? window.currentScheduleData : ((typeof dataCache !== 'undefined' && dataCache.schedule) ? dataCache.schedule : []);

            let displayPatList = dataCache.pat.map((p, origIdx) => ({ ...p, _origIndex: p.index !== undefined ? p.index : origIdx }));
            
            const currentFilter = window._patientTypeFilter || 'all';
            if (currentFilter !== 'all') {
                displayPatList = displayPatList.filter(p => {
                    const loai = p.loai_bn || 'NoiTru';
                    return loai === currentFilter;
                });
            }
            if (_patSortMode === 1) {
                displayPatList.sort((a, b) => {
                    // 1. Ngày vào (Mới -> Cũ)
                    const dateA = parseNgayVao(a.ngayVao || '');
                    const dateB = parseNgayVao(b.ngayVao || '');
                    if (dateA !== dateB) return dateB - dateA;

                    // 2. Giờ vào (Muộn -> Sớm)
                    const timeA = getGioVaoMinutes(a.gioVao || '');
                    const timeB = getGioVaoMinutes(b.gioVao || '');
                    if (timeA !== timeB) return timeB - timeA;

                    // 3. Tên từ Z-A
                    return (b.ten || '').localeCompare(a.ten || '', 'vi');
                });
            } else if (_patSortMode === 2) {
                displayPatList.sort((a, b) => {
                    // 1. Ngày vào (Cũ -> Mới)
                    const dateA = parseNgayVao(a.ngayVao || '');
                    const dateB = parseNgayVao(b.ngayVao || '');
                    if (dateA !== dateB) return dateA - dateB;

                    // 2. Giờ vào (Sớm -> Muộn)
                    const timeA = getGioVaoMinutes(a.gioVao || '');
                    const timeB = getGioVaoMinutes(b.gioVao || '');
                    if (timeA !== timeB) return timeA - timeB;

                    // 3. Tên từ A-Z
                    return (a.ten || '').localeCompare(b.ten || '', 'vi');
                });
            } else {
                displayPatList.sort((a, b) => a._origIndex - b._origIndex);
            }

            tbody.innerHTML = displayPatList.map((item, i) => {
                const idx = item._origIndex;
                const patName = String(item.ten || '').toUpperCase().trim();
                const patNS = String(item.namSinh || '').trim();
                const reqProcs = item.thuThuat ? item.thuThuat.split(',').map(x => x.trim()).filter(Boolean) : [];
                const reqCount = reqProcs.length;

                const schedItems = schedData.filter(r => {
                    if (!r) return false;
                    const rName = String(r.tenBN || r.HOTEN || r[1] || '').toUpperCase().trim();
                    const rNS = String(r.namSinh || r.NAMSINH || r[2] || '').trim();
                    const rRoom = String(r.phong || r.PHONG || r[3] || '').trim();
                    const patRoom = String(item.phong || '').trim();
                    const isSameName = rName === patName;
                    const isSameNS = !patNS || !rNS || patNS === rNS;
                    const isSameRoom = !patRoom || !rRoom || patRoom === rRoom;
                    const gio = String(r.gioDienRa || r.GIODIENRA || r[5] || '');
                    const isNotDropped = !r.__dropped && gio !== '❌ Rớt' && gio !== '--';
                    return isSameName && isSameNS && isSameRoom && isNotDropped;
                });

                const missingProcs = [];
                const matchedSchedIndices = new Set();
                reqProcs.forEach(req => {
                    const foundIdx = schedItems.findIndex((s, sIdx) => !matchedSchedIndices.has(sIdx) && matchProc(s.thuThuat || s.DICHVU || s[4] || '', req));
                    if (foundIdx !== -1) {
                        matchedSchedIndices.add(foundIdx);
                    } else {
                        missingProcs.push(req);
                    }
                });

                let nhanTrangThai = '';
                if (reqCount > 0) {
                    if (schedItems.length === 0) {
                        nhanTrangThai = `<span style="background:#f39c12;color:white;padding:2px 6px;border-radius:10px;font-size:10px;margin-left:5px;">Chưa xếp</span>`;
                    } else if (missingProcs.length === 0) {
                        nhanTrangThai = `<span style="background:#2ecc71;color:white;padding:2px 6px;border-radius:10px;font-size:10px;margin-left:5px;">Đã đủ</span>`;
                    } else {
                        const displayText = getShortSkills(missingProcs.join(', '));
                        nhanTrangThai = `<span style="background:#3498db;color:white;padding:2px 6px;border-radius:10px;font-size:10px;margin-left:5px;">Thiếu: ${displayText}</span>`;
                    }
                }

                const displayGioYLenh = (item.gioVao && item.gioVao !== '07:30' && item.gioVao !== '7:30') ? item.gioVao : '';

                return `<tr class="editable-row" data-pat-index="${idx}" onclick="editPatient(parseInt(this.dataset.patIndex))" style="${item.gioRa ? 'background:#f8d7da;opacity:0.8;' : ''}" title="Bấm sửa (Phím Delete để xóa)">
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(item.ten)}</strong> ${nhanTrangThai}</td>
            <td>${escapeHtml(item.namSinh || '')}</td>
            <td style="text-align:center;">${item.loai_bn === 'NgoaiTru' ? '<span style="color:#d35400;font-weight:bold;font-size:11px;">Ngoại trú</span>' : '<span style="color:#27ae60;font-weight:bold;font-size:11px;">Nội trú</span>'}</td>
            <td>${escapeHtml(item.ngayVao || '')}</td>
            <td style="text-align:center;">${displayGioYLenh ? `<strong style="color:#e67e22">${escapeHtml(displayGioYLenh)}</strong>` : ''}</td>
            <td><strong style="color:#c0392b">${escapeHtml(item.gioRa || '')}</strong></td>
            <td>${escapeHtml(item.phong || '')}</td>
            <td style="font-size:11px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(item.thuThuat)}"><strong>${escapeHtml(getShortSkills(item.thuThuat))}</strong></td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deletePatient(parseInt(this.closest('tr').dataset.patIndex))">Xóa</button></td>
        </tr>`;
            }).join('');

            if (typeof renderBusyPat === 'function') renderBusyPat();
            if (typeof renderLeavePat === 'function') renderLeavePat();
            if (typeof filterPatientTable === 'function') filterPatientTable();
        }

        function updateBusyTime() {

            const start = document.getElementById('busy-start').value;

            const end = document.getElementById('busy-end').value;

            document.getElementById('pat-busy').value = (start && end) ? `${start}-${end}` : '';

        }

        function savePatient() {
            if (checkUnclosedDay()) return;


            // 🛡️ Chống gọi kép: Bỏ qua nếu đã đang xử lý
            if (window._savePatientLock) { console.warn("savePatient: blocked double call"); return; }
            window._savePatientLock = true;

            const currentEditIdx = editIndex.pat;
            const currentItem = currentEditIdx > -1 ? dataCache.pat[currentEditIdx] : null;

            let ten = document.getElementById('pat-name').value;
            const nam = document.getElementById('pat-year').value;
            // const ngay = document.getElementById('pat-date').value;
            // const gio = document.getElementById('pat-time').value.trim() || '07:30';
            const phong = document.getElementById('pat-room').value;
            const ban = document.getElementById('pat-busy').value;
            const ra = document.getElementById('pat-leave').value;
            const loai_bn = document.getElementById('pat-loai-bn').value;
            // Tự động xác định buổi điều trị cho bệnh nhân ngoại trú dựa trên giờ Y lệnh
            // Concat ngày vào từ 2 ô nhập
            const dayVal = String(document.getElementById('pat-date-day')?.value || '').trim().padStart(2, '0');
            const myVal = document.getElementById('pat-date-month-year')?.value || '';
            const ngay = `${dayVal}/${myVal}`;

            // Tự động xác định giờ vào và buổi điều trị
            const gioTyped = (document.getElementById('pat-time')?.value || '').trim();
            let gio = gioTyped || '07:30';
            // Luôn mặc định là Tự động (TuDong) theo yêu cầu ẩn cột của bác sĩ
            let buoi_dieu_tri = (currentEditIdx > -1 && currentItem) ? (currentItem.buoi_dieu_tri || 'TuDong') : 'TuDong';

            // Nếu có giờ ra viện -> bắt buộc Sáng
            if (ra) {
                buoi_dieu_tri = 'Sang';
            }
            const tt = Array.from(document.querySelectorAll('.pat-proc-cb:checked')).map(cb => cb.value).join(', ');

            if (!ten) { window._savePatientLock = false; return alert("Nhập tên bệnh nhân"); }
            if (!phong) { window._savePatientLock = false; return alert("Vui lòng chọn Phòng"); }

            ten = ten.trim().toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

            // 🛡️ Kiểm soát tính toàn vẹn dữ liệu bằng Zod Schema Engine
            if (window.MedicalSchemas && typeof window.MedicalSchemas.validatePatient === 'function') {
                const zRes = window.MedicalSchemas.validatePatient({
                    ten: ten,
                    namSinh: nam,
                    phong: phong,
                    thuThuat: tt
                });
                if (!zRes.success) {
                    window._savePatientLock = false;
                    const errDetail = zRes.error?.issues?.[0]?.message || 'Dữ liệu không hợp lệ';
                    return alert('⚠️ ' + errDetail);
                }
            }

            // Khóa form và nút lưu
            const btnSave = document.getElementById('btn-save-pat');
            if (btnSave) { btnSave.disabled = true; btnSave.innerText = 'Đang lưu...'; }

            // Chụp index TRƯỚC khi cancelEdit reset về -1

            // ⚡ Cập nhật tức thời lên giao diện (Optimistic UI Update) - 0ms delay!
            if (currentEditIdx > -1 && currentItem) {
                currentItem.ten = ten;
                currentItem.namSinh = nam;
                currentItem.ngayVao = ngay;
                currentItem.gioVao = gio;
                currentItem.gioBan = ban;
                currentItem.gioRa = ra;
                currentItem.phong = phong;
                currentItem.thuThuat = tt;
                currentItem.loai_bn = loai_bn;
                currentItem.buoi_dieu_tri = buoi_dieu_tri;
                renderPatientsTable();
            } else {
                const newPat = {
                    ten: ten,
                    namSinh: nam,
                    ngayVao: ngay,
                    gioVao: gio,
                    gioBan: ban,
                    gioRa: ra,
                    phong: phong,
                    thuThuat: tt,
                    sheetIndex: dataCache.pat ? dataCache.pat.length : 0,
                    index: dataCache.pat ? dataCache.pat.length : 0,
                    loai_bn: loai_bn,
                    buoi_dieu_tri: buoi_dieu_tri
                };
                if (!dataCache.pat) dataCache.pat = [];
                dataCache.pat.push(newPat);
                renderPatientsTable();
            }

            // Giải phóng nút và form ngay lập tức cho người dùng thao tác tiếp
            cancelEdit('pat');
            if (btnSave) { btnSave.disabled = false; btnSave.innerText = 'Lưu'; }
            document.getElementById('pat-name').focus();

            const onDone = () => {
                window._savePatientLock = false;
                if (window.dataCacheTime) window.dataCacheTime['pat'] = Date.now();
                if (typeof loadDashboard === 'function') loadDashboard();
            };

            const onError = (e) => {
                window._savePatientLock = false;
                alert('Lỗi khi lưu bệnh nhân: ' + e);
                // Khôi phục lại dữ liệu gốc từ máy chủ nếu xảy ra lỗi
                if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                loadEntity('getBenhNhan', 'pat', renderPatientsTable, [], true);
            };

            if (currentEditIdx > -1 && currentItem) {
                const sheetIdx = currentItem.sheetIndex !== undefined ? currentItem.sheetIndex : currentEditIdx;
                google.script.run
                    .withSuccessHandler(onDone)
                    .withFailureHandler(onError)
                    .editBenhNhan(sheetIdx, ten, nam, ngay, gio, ban, ra, phong, tt, currentItem.ten, currentItem.namSinh, loai_bn, buoi_dieu_tri);
            } else {
                google.script.run
                    .withSuccessHandler(onDone)
                    .withFailureHandler(onError)
                    .addBenhNhan(ten, nam, ngay, gio, ban, ra, phong, tt, loai_bn, buoi_dieu_tri);
            }

        }

        function editPatient(index) {
            if (window.innerWidth <= 960 && typeof window.openMobileFormForEdit === "function") window.openMobileFormForEdit("pat");
            if (checkUnclosedDay()) return;


            editIndex.pat = index;

            const item = dataCache.pat[index];

            document.getElementById('pat-name').value = item.ten;

            document.getElementById('pat-year').value = item.namSinh;

            const ngayVao = item.ngayVao || '';
            if (ngayVao.includes('/')) {
                const parts = ngayVao.split('/');
                if (document.getElementById('pat-date-day')) {
                    document.getElementById('pat-date-day').value = parts[0];
                }
                if (document.getElementById('pat-date-month-year')) {
                    document.getElementById('pat-date-month-year').value = `${parts[1]}/${parts[2]}`;
                }
            } else {
                const today = new Date();
                if (document.getElementById('pat-date-day')) {
                    document.getElementById('pat-date-day').value = String(today.getDate()).padStart(2, '0');
                }
                if (document.getElementById('pat-date-month-year')) {
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    document.getElementById('pat-date-month-year').value = `${mm}/${today.getFullYear()}`;
                }
            }

            const gioVal = item.gioVao || '';
            document.getElementById('pat-time').value = (gioVal === '07:30' || !gioVal) ? '' : gioVal;

            document.getElementById('pat-room').value = item.phong;

            document.getElementById('pat-leave').value = item.gioRa;

            const busyVal = item.gioBan || '';

            document.getElementById('pat-busy').value = busyVal;
            document.getElementById('pat-loai-bn').value = item.loai_bn || 'NoiTru';
            // Auto-detect buổi: nếu có giờ ra viện → sáng, không thì dùng giá trị đã lưu (mặc định TuDong)
            const autoDetectedBuoi = item.gioRa ? 'Sang' : (item.buoi_dieu_tri || 'TuDong');
            document.getElementById('pat-buoi-dieu-tri').value = autoDetectedBuoi;
            if (typeof togglePatSessionSelect === 'function') togglePatSessionSelect();

            if (busyVal.includes('-')) {

                document.getElementById('busy-start').value = busyVal.split('-')[0].trim();

                document.getElementById('busy-end').value = busyVal.split('-')[1].trim();

            } else {

                document.getElementById('busy-start').value = '';

                document.getElementById('busy-end').value = '';

            }

            const ttArr = item.thuThuat ? item.thuThuat.split(',').map(t => t.trim().toLowerCase()) : [];

            document.querySelectorAll('.pat-proc-cb').forEach(cb => { cb.checked = ttArr.includes(cb.value.toLowerCase()); });

            document.getElementById('btn-save-pat').innerText = "Lưu Sửa";

            document.getElementById('btn-cancel-pat').style.display = "inline-block";

        }

        // ============================================================

        // ♻️ HỆ THỐNG XÓA BỆNH NHÂN (TRỰC TIẾP, AN TOÀN)

        // ============================================================

        function deletePatient(i) {
            if (checkUnclosedDay()) return;


            const p = dataCache.pat[i];

            showCustomConfirm("Xác nhận xóa", `Bác sĩ có chắc chắn muốn xóa bệnh nhân [ ${p.ten} ]?`, function () {

                if (window.showGlobalLoading) window.showGlobalLoading("Đang xóa bệnh nhân...");



                // Xóa tạm trên giao diện
                const deletedSheetIndex = p.sheetIndex !== undefined ? p.sheetIndex : i;
                dataCache.pat.splice(i, 1);
                dataCache.pat.forEach((item, idx) => {
                    item.index = idx;
                    if (item.sheetIndex !== undefined && item.sheetIndex > deletedSheetIndex) {
                        item.sheetIndex--;
                    }
                });
                renderPatientsTable();

                // Khóa nút lưu để chống thao tác đè trong lúc chờ mạng
                const btnSave = document.getElementById('btn-save-pat');
                if (btnSave) { btnSave.disabled = true; btnSave.innerText = "Đang đồng bộ..."; }

                // Gọi máy chủ xóa ngay lập tức
                google.script.run
                    .withSuccessHandler(() => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }
                        if (typeof loadDashboard === 'function') loadDashboard();
                    })
                    .withFailureHandler(e => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        if (btnSave) { btnSave.disabled = false; btnSave.innerText = "Thêm"; }
                        alert('Lỗi khi xóa vĩnh viễn: ' + e);
                    })
                    .deleteBenhNhan(deletedSheetIndex, p.ten, p.namSinh);

            });

        }



        // Tự động điền năm sinh khi gõ tên bệnh nhân

        document.getElementById('pat-name').addEventListener('input', function () {

            const val = this.value.trim().toLowerCase();

            if (!val) return;

            const found = dataCache.pat.find(p => p.ten.toLowerCase() === val);

            if (found && !document.getElementById('pat-year').value) document.getElementById('pat-year').value = found.namSinh;

        });



        // Tìm kiếm bảng bệnh nhân (debounce chống Unikey)

        let patSearchTimeout;

        function filterPatientTable() {
            clearTimeout(patSearchTimeout);
            patSearchTimeout = setTimeout(function () {
                const rawFilter = document.getElementById("pat-search-input")?.value || '';
                const filterNoTone = removeVietnameseTones(rawFilter);
                const tokens = filterNoTone.split(/\s+/).filter(Boolean);

                const table = document.getElementById("patients-table");
                if (!table) return;

                let sttCounter = 1;
                Array.from(table.getElementsByTagName("tr")).slice(1).forEach(tr => {
                    const tds = tr.getElementsByTagName("td");
                    let show = false;
                    if (!tokens.length) {
                        show = true;
                    } else {
                        const rowText = Array.from(tds).slice(1, tds.length - 1).map(td => td.textContent || td.innerText || '').join(' ');
                        const rowNoTone = removeVietnameseTones(rowText);
                        show = tokens.every(tok => rowNoTone.includes(tok));
                    }
                    tr.style.display = show ? "" : "none";
                    if (show && tds[0]) tds[0].innerText = sttCounter++;
                });
            }, 100);
        }



        // ============================================================

        // ⏱ TAB GIỜ BẬN BỆNH NHÂN

        // ============================================================

        function renderBusyPat() {
            const tbody = document.getElementById('busy-pat-tbody');
            if (!tbody) return;
            let html = '';
            let stt = 1;
            (dataCache.pat || []).forEach((p, idx) => {
                if (!p.gioBan) return;
                const escapedTen = escapeHtml(p.ten);
                const ns = p.namSinh || '';
                const phong = p.phong || '';
                p.gioBan.split(',').map(s => s.trim()).filter(s => s).forEach(slot => {
                    html += `<tr class="editable-row" onclick="editBusyPat('${p.ten}', '${ns}', '${slot}', ${idx})" title="Bấm để sửa/xóa">
                        <td align="center" style="font-weight: 600; color: #475569; width: 32px;">${stt++}</td>
                        <td style="white-space: nowrap; font-weight: 600; text-align: left;">${escapedTen}</td>
                        <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 65px;">${ns}</td>
                        <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 75px;">${phong}</td>
                        <td align="center" style="color:#d35400; font-weight:bold; white-space: nowrap; width: 110px; min-width: 100px; font-family: monospace, sans-serif;">${formatSlotDisplay(slot)}</td>
                    </tr>`;
                });
            });
            tbody.innerHTML = html || `<tr><td colspan="5" align="center" style="color:gray; padding:10px;">Chưa có bệnh nhân bận</td></tr>`;
        }

        function editBusyPat(ten, namSinh, singleSlot, idx) {
            const inputName = document.getElementById('busy-pat-input');
            if (!inputName) return;
            inputName.value = (namSinh && (dataCache.pat || []).filter(p => p.ten === ten).length > 1) ? `${ten} (${namSinh})` : ten;
            window.lastSelectedPatIdx = (typeof idx === 'number') ? idx : -1;
            lastBusyContext = 'pat';

            if (singleSlot) {

                window.editingPatName = ten;

                window.editingPatSlot = singleSlot;

                const parts = singleSlot.split('-');

                document.getElementById('busy-pat-from').value = parts[0]?.trim() || '';

                document.getElementById('busy-pat-to').value = parts[1]?.trim() || '';

            } else {

                window.editingPatName = '';

                window.editingPatSlot = '';

                document.getElementById('busy-pat-from').value = '';

                document.getElementById('busy-pat-to').value = '';

            }

        }

        const savePatBusy = withLock(function () {
            if (checkUnclosedDay()) return;

            const idx = getBusyPatIdx();
            if (idx === -1) return alert('Vui lòng chọn đích danh bệnh nhân từ danh sách xổ xuống!');
            const fromObj = document.getElementById('busy-pat-from');
            const toObj = document.getElementById('busy-pat-to');
            const from = fromObj.value, to = toObj.value;
            if (!from) return alert('Nhập thời gian!');
            const finalTo = to || from;
            const p = dataCache.pat[idx];
            const newSlot = from + '-' + finalTo;
            if (window.editingPatSlot && window.editingPatName === p.ten) {
                let slotsArr = p.gioBan ? p.gioBan.split(',').map(x => x.trim()) : [];
                p.gioBan = slotsArr.filter(x => x && x !== window.editingPatSlot).join(', ');
                window.editingPatSlot = ''; window.editingPatName = '';
            }
            p.gioBan = sortTimeSlots(p.gioBan ? p.gioBan + ', ' + newSlot : newSlot);
            renderPatientsTable();
            if (typeof renderBusyPat === 'function') renderBusyPat();
            fromObj.value = ''; toObj.value = ''; fromObj.focus();
            const busyInput = document.getElementById('busy-pat-input');
            if (busyInput) busyInput.value = '';

            const sheetIdx = p.sheetIndex !== undefined ? p.sheetIndex : idx;
            google.script.run
                .withSuccessHandler(() => {
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = Date.now();
                })
                .withFailureHandler(err => {
                    alert("Lỗi lưu giờ bận: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                        () => { if (typeof renderBusyPat === 'function') renderBusyPat(); }
                    ], true);
                })
                .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan, p.gioRa, p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri);
        });

        function deleteSinglePatBusy() {
            if (checkUnclosedDay()) return;

            const idx = getBusyPatIdx();
            if (idx === -1) return alert('Vui lòng chọn đích danh bệnh nhân!');
            const from = document.getElementById('busy-pat-from').value;
            const to = document.getElementById('busy-pat-to').value;
            if (!from) return alert('Vui lòng click vào khoảng giờ trên bảng để xóa!');
            const finalTo = to || from;
            const p = dataCache.pat[idx];
            if (!p.gioBan) return;
            const slotToDelete = from + '-' + finalTo;

            showCustomConfirm("Xóa giờ bận", "Bác sĩ có muốn xóa giờ bận [ " + slotToDelete + " ] của BN: " + p.ten + "?", function () {
                p.gioBan = p.gioBan.split(',').map(x => x.trim()).filter(x => x && x !== slotToDelete).join(', ');
                renderPatientsTable();
                if (typeof renderBusyPat === 'function') renderBusyPat();
                document.getElementById('busy-pat-from').value = '';
                document.getElementById('busy-pat-to').value = '';
                const busyInput = document.getElementById('busy-pat-input');
                if (busyInput) busyInput.value = '';

                const sheetIdx = p.sheetIndex !== undefined ? p.sheetIndex : idx;
                google.script.run
                    .withSuccessHandler(() => {
                        if (window.dataCacheTime) window.dataCacheTime['pat'] = Date.now();
                    })
                    .withFailureHandler(err => {
                        alert("Lỗi xóa giờ bận: " + (err.message || err));
                        if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                        loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                            () => { if (typeof renderBusyPat === 'function') renderBusyPat(); }
                        ], true);
                    })
                    .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan, p.gioRa, p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri);
            });
        }

        function clearPatBusy() {
            if (checkUnclosedDay()) return;

            const idx = getBusyPatIdx();
            if (idx === -1) return alert('Vui lòng chọn đích danh bệnh nhân!');
            const p = dataCache.pat[idx];
            if (!confirm("Xóa toàn bộ giờ bận của BN: " + p.ten + "?")) return;

            p.gioBan = ''; 
            renderPatientsTable();
            if (typeof renderBusyPat === 'function') renderBusyPat();
            const busyInput = document.getElementById('busy-pat-input');
            if (busyInput) busyInput.value = '';

            const sheetIdx = p.sheetIndex !== undefined ? p.sheetIndex : idx;
            google.script.run
                .withSuccessHandler(() => {
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = Date.now();
                })
                .withFailureHandler(err => {
                    alert("Lỗi xóa giờ bận: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                        () => { if (typeof renderBusyPat === 'function') renderBusyPat(); }
                    ], true);
                })
                .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, '', p.gioRa, p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri);
        }



        // ============================================================

        // 🚪 TAB RA VIỆN

        // ============================================================

        function renderLeavePat() {
            const tbody = document.getElementById('leave-pat-tbody');
            if (!tbody) return;
            let html = '', stt = 1;
            (dataCache.pat || []).forEach((p, idx) => {
                if (!p.gioRa) return;
                const escapedTen = escapeHtml(p.ten);
                const ns = p.namSinh || '';
                const phong = p.phong || '';
                html += `<tr class="editable-row" onclick="editLeavePat('${p.ten}', '${ns}', '${p.gioRa}', ${idx})" title="Bấm để sửa/xóa">
                    <td align="center" style="font-weight: 600; color: #475569; width: 32px;">${stt++}</td>
                    <td style="white-space: nowrap; font-weight: 600; text-align: left;">${escapedTen}</td>
                    <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 65px;">${ns}</td>
                    <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 75px;">${phong}</td>
                    <td align="center" style="color:#8e44ad; font-weight:bold; white-space: nowrap; width: 80px; min-width: 75px; font-family: monospace, sans-serif;">${p.gioRa}</td>
                </tr>`;
            });
            tbody.innerHTML = html || `<tr><td colspan="5" align="center" style="color:gray; padding:10px;">Chưa có bệnh nhân ra viện</td></tr>`;
        }

        function editLeavePat(ten, namSinh, gioRa, idx) {
            const inputName = document.getElementById('leave-pat-input');
            if (!inputName) return;
            inputName.value = (namSinh && (dataCache.pat || []).filter(p => p.ten === ten).length > 1) ? `${ten} (${namSinh})` : ten;
            window.lastSelectedPatIdx = (typeof idx === 'number') ? idx : -1;
            lastBusyContext = 'leave';
            const t = document.getElementById('leave-pat-time');
            if (t) {
                t.value = gioRa || '14:00';
                t.focus();
                t.select();
            }
        }

        const savePatLeave = withLock(function () {
            if (checkUnclosedDay()) return;

            const idx = getLeavePatIdx();
            if (idx === -1) return alert('Vui lòng chọn đích danh bệnh nhân từ danh sách xổ xuống!');
            const leaveObj = document.getElementById('leave-pat-time');
            const leaveTime = leaveObj.value;
            if (!leaveTime) return alert('Nhập giờ ra viện!');
            const p = dataCache.pat[idx];

            p.gioRa = leaveTime;
            // Cập nhật ngay trên currentScheduleData để In/Xuất Excel phản ánh đúng
            if (window.currentScheduleData) {
                const patTenLower = String(p.ten || '').trim().toLowerCase();
                const patNs = String(p.namSinh || '').trim();
                window.currentScheduleData.forEach(row => {
                    const rowTenLower = String(row.tenBN || '').trim().toLowerCase();
                    const rowNs = String(row.namSinh || '').trim();
                    if (rowTenLower === patTenLower) {
                        if (patNs && rowNs) {
                            if (rowNs === patNs) row.__isDischarged = true;
                        } else {
                            row.__isDischarged = true;
                        }
                    }
                });
            }
            renderPatientsTable();
            if (typeof renderLeavePat === 'function') renderLeavePat();
            leaveObj.value = ''; leaveObj.focus();
            const leaveInput = document.getElementById('leave-pat-input');
            if (leaveInput) leaveInput.value = '';

            const sheetIdx = p.sheetIndex !== undefined ? p.sheetIndex : idx;
            google.script.run
                .withSuccessHandler(() => {
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = Date.now();
                })
                .withFailureHandler(err => {
                    alert("Lỗi cập nhật giờ ra viện: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                        () => { if (typeof renderLeavePat === 'function') renderLeavePat(); }
                    ], true);
                })
                .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan, leaveTime, p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri);
        });

        function clearPatLeave() {
            if (checkUnclosedDay()) return;

            const idx = getLeavePatIdx();
            if (idx === -1) return alert('Vui lòng chọn đích danh bệnh nhân!');
            const p = dataCache.pat[idx];
            if (!confirm("Hủy giờ ra viện của BN: " + p.ten + "?")) return;

            p.gioRa = '';
            if (window.currentScheduleData) {
                const patTenLower = String(p.ten || '').trim().toLowerCase();
                const patNs = String(p.namSinh || '').trim();
                window.currentScheduleData.forEach(row => {
                    const rowTenLower = String(row.tenBN || '').trim().toLowerCase();
                    const rowNs = String(row.namSinh || '').trim();
                    if (rowTenLower === patTenLower) {
                        if (patNs && rowNs) {
                            if (rowNs === patNs) row.__isDischarged = false;
                        } else {
                            row.__isDischarged = false;
                        }
                    }
                });
            }
            renderPatientsTable();
            if (typeof renderLeavePat === 'function') renderLeavePat();
            document.getElementById('leave-pat-time').value = '';
            const leaveInput = document.getElementById('leave-pat-input');
            if (leaveInput) leaveInput.value = '';

            const sheetIdx = p.sheetIndex !== undefined ? p.sheetIndex : idx;
            google.script.run
                .withSuccessHandler(() => {
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = Date.now();
                })
                .withFailureHandler(err => {
                    alert("Lỗi hủy giờ ra viện: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                        () => { if (typeof renderLeavePat === 'function') renderLeavePat(); }
                    ], true);
                })
                .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan, '', p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri);
        }



        // ============================================================

        // 👷 TAB GIỜ BẬN NHÂN VIÊN

        // ============================================================

        function renderBusyStaff() {
            const select = document.getElementById('busy-staff-select');
            const thead = document.getElementById('busy-staff-thead');
            const tbody = document.getElementById('busy-staff-tbody');
            if (!select || !thead || !tbody) return;

            const prevVal = select.value;
            select.innerHTML = (dataCache.staff || []).map((s, i) => `<option value="${i}">${escapeHtml(String(s.ten || '').toUpperCase())}</option>`).join('');
            if (prevVal !== "" && prevVal !== null && select.querySelector(`option[value="${prevVal}"]`)) {
                select.value = prevVal;
            }

            const busyIndices = (dataCache.staff || []).map((s, i) => (s && s.gioBan && String(s.gioBan).trim()) ? i : -1).filter(i => i > -1);

            if (!busyIndices.length) {
                thead.innerHTML = '';
                tbody.innerHTML = '<tr><td align="center" style="color:gray; padding:20px; font-style:italic;">✅ Hiện tại chưa có nhân viên nào báo bận</td></tr>';
                return;
            }

            thead.innerHTML = '<tr><th style="width: 40px; min-width: 40px; text-align: center;">STT</th>' + busyIndices.map(idx => `<th style="text-align:center; font-size:11px; text-transform:uppercase; padding:2px 6px;">${escapeHtml(dataCache.staff[idx].ten)}</th>`).join('') + '</tr>';

            const slotArrays = busyIndices.map(idx => {
                const gb = dataCache.staff[idx]?.gioBan;
                if (!gb) return [];
                if (Array.isArray(gb)) return gb.filter(Boolean);
                return String(gb).split(',').map(x => x.trim()).filter(Boolean);
            });

            const maxSlots = Math.max(...slotArrays.map(a => a.length), 0);

            let tbHtml = '';
            for (let i = 0; i < maxSlots; i++) {
                tbHtml += '<tr>';
                tbHtml += `<td align="center" style="font-weight: 700; color: #475569; width: 40px; min-width: 40px;">${i + 1}</td>`;

                busyIndices.forEach((origIdx, arrIdx) => {
                    const slot = slotArrays[arrIdx][i];
                    tbHtml += slot
                        ? `<td align="center" style="font-size:11px; color:#c0392b; font-weight:bold;" class="editable-row" onclick="editBusyStaff(${origIdx}, '${slot}')" title="Bấm sửa (Delete để xóa)">${formatSlotDisplay(slot)}</td>`
                        : `<td align="center" style="color:#bdc3c7;">-</td>`;
                });
                tbHtml += '</tr>';
            }
            tbody.innerHTML = tbHtml;
        }

        function editBusyStaff(staffIdx, slotStr) {
            lastBusyContext = 'staff';
            const select = document.getElementById('busy-staff-select');
            if (select) select.value = staffIdx;
            window.editingStaffIdx = staffIdx;
            window.editingStaffSlot = (slotStr && slotStr !== '-') ? slotStr : '';

            if (slotStr && slotStr !== '-') {
                const parts = slotStr.split('-');
                document.getElementById('busy-staff-from').value = parts[0]?.trim() || '';
                document.getElementById('busy-staff-to').value = parts[1]?.trim() || '';
            } else {
                document.getElementById('busy-staff-from').value = '';
                document.getElementById('busy-staff-to').value = '';
            }
        }

        const saveStaffBusy = withLock(function () {
            if (checkUnclosedDay()) return;

            const select = document.getElementById('busy-staff-select');
            if (!select) return;
            const idx = select.value;
            if (idx === "" || idx === null || isNaN(parseInt(idx))) return alert('Vui lòng chọn nhân viên!');
            const fromObj = document.getElementById('busy-staff-from');
            const toObj = document.getElementById('busy-staff-to');
            const from = fromObj.value.trim(), to = toObj.value.trim();
            if (!from) return alert('Vui lòng nhập thời gian!');
            const finalTo = to || from;
            const s = dataCache.staff[parseInt(idx)];
            if (!s) return alert('Không tìm thấy nhân viên!');
            const newSlot = from + '-' + finalTo;
            if (window.editingStaffSlot && String(window.editingStaffIdx) === String(idx)) {
                const curSlots = s.gioBan ? (typeof s.gioBan === 'string' ? s.gioBan.split(',') : s.gioBan).map(x => x.trim()).filter(x => x && x !== window.editingStaffSlot) : [];
                s.gioBan = curSlots.join(', ');
                window.editingStaffSlot = ''; window.editingStaffIdx = '';
            }
            s.gioBan = sortTimeSlots(s.gioBan ? s.gioBan + ', ' + newSlot : newSlot);
            renderStaffTable();
            if (typeof renderBusyStaff === 'function') renderBusyStaff();
            select.value = idx; fromObj.value = ''; toObj.value = ''; fromObj.focus();

            const sheetIdx = s.sheetIndex !== undefined ? s.sheetIndex : parseInt(idx);
            const kyNangStr = typeof s.kyNang === 'string' ? s.kyNang : (Array.isArray(s.kyNang) ? s.kyNang.join(', ') : '');
            const gioBanStr = typeof s.gioBan === 'string' ? s.gioBan : (Array.isArray(s.gioBan) ? s.gioBan.join(', ') : '');

            if (window.showGlobalLoading) window.showGlobalLoading("Đang lưu giờ bận nhân sự...");
            google.script.run
                .withSuccessHandler(() => {
                    if (window.hideGlobalLoading) window.hideGlobalLoading();
                    if (window.dataCacheTime) window.dataCacheTime['staff'] = 0;
                    loadEntity('getNhanSu', 'staff', renderStaffTable, [
                        () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); }
                    ], true);
                })
                .withFailureHandler(err => {
                    if (window.hideGlobalLoading) window.hideGlobalLoading();
                    alert("Lỗi lưu giờ bận: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['staff'] = 0;
                    loadEntity('getNhanSu', 'staff', renderStaffTable, [
                        () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); }
                    ], true);
                })
                .editNhanSu(sheetIdx, s.ten, s.vaiTro || 'Kỹ thuật viên', s.trangThai || 'Đi làm', s.thoiGianLam || '07:30-11:30, 13:00-16:30', kyNangStr, gioBanStr, s.nguoiThayThe || 'Không', s.quyen || 'Cả hai', s.tenHis || '');
        });

        function deleteSingleStaffBusy() {
            if (checkUnclosedDay()) return;

            const select = document.getElementById('busy-staff-select');
            if (!select) return;
            const idx = select.value;
            if (idx === "" || idx === null || isNaN(parseInt(idx))) return alert('Vui lòng chọn nhân viên!');
            const from = document.getElementById('busy-staff-from').value.trim();
            const to = document.getElementById('busy-staff-to').value.trim();
            if (!from) return alert('Vui lòng click vào một khoảng giờ trên bảng để xóa!');
            const finalTo = to || from;
            const s = dataCache.staff[parseInt(idx)];
            if (!s || !s.gioBan) return;
            const slotToDelete = from + '-' + finalTo;

            showCustomConfirm("Xóa giờ bận", "Bác sĩ có muốn xóa giờ bận [ " + slotToDelete + " ] của NV: " + s.ten + "?", function () {
                const curSlots = (typeof s.gioBan === 'string' ? s.gioBan.split(',') : s.gioBan).map(x => x.trim()).filter(x => x && x !== slotToDelete);
                s.gioBan = curSlots.join(', ');
                renderStaffTable();
                if (typeof renderBusyStaff === 'function') renderBusyStaff();
                document.getElementById('busy-staff-from').value = '';
                document.getElementById('busy-staff-to').value = '';

                const sheetIdx = s.sheetIndex !== undefined ? s.sheetIndex : parseInt(idx);
                const kyNangStr = typeof s.kyNang === 'string' ? s.kyNang : (Array.isArray(s.kyNang) ? s.kyNang.join(', ') : '');
                const gioBanStr = typeof s.gioBan === 'string' ? s.gioBan : (Array.isArray(s.gioBan) ? s.gioBan.join(', ') : '');

                if (window.showGlobalLoading) window.showGlobalLoading("Đang xóa giờ bận nhân sự...");
                google.script.run
                    .withSuccessHandler(() => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        if (window.dataCacheTime) window.dataCacheTime['staff'] = 0;
                        loadEntity('getNhanSu', 'staff', renderStaffTable, [
                            () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); }
                        ], true);
                    })
                    .withFailureHandler(err => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        alert("Lỗi xóa giờ bận: " + (err.message || err));
                        if (window.dataCacheTime) window.dataCacheTime['staff'] = 0;
                        loadEntity('getNhanSu', 'staff', renderStaffTable, [
                            () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); }
                        ], true);
                    })
                    .editNhanSu(sheetIdx, s.ten, s.vaiTro || 'Kỹ thuật viên', s.trangThai || 'Đi làm', s.thoiGianLam || '07:30-11:30, 13:00-16:30', kyNangStr, gioBanStr, s.nguoiThayThe || 'Không', s.quyen || 'Cả hai', s.tenHis || '');
            });
        }

        function clearStaffBusy() {
            if (checkUnclosedDay()) return;

            const select = document.getElementById('busy-staff-select');
            if (!select) return;
            const idx = select.value;
            if (idx === "" || idx === null || isNaN(parseInt(idx))) return alert('Vui lòng chọn nhân viên!');
            const s = dataCache.staff[parseInt(idx)];
            if (!s) return;
            if (!confirm("Xóa toàn bộ giờ bận của NV: " + s.ten + "?")) return;

            s.gioBan = ''; 
            renderStaffTable();
            if (typeof renderBusyStaff === 'function') renderBusyStaff();

            const sheetIdx = s.sheetIndex !== undefined ? s.sheetIndex : parseInt(idx);
            const kyNangStr = typeof s.kyNang === 'string' ? s.kyNang : (Array.isArray(s.kyNang) ? s.kyNang.join(', ') : '');

            if (window.showGlobalLoading) window.showGlobalLoading("Đang xóa toàn bộ giờ bận...");
            google.script.run
                .withSuccessHandler(() => {
                    if (window.hideGlobalLoading) window.hideGlobalLoading();
                    if (window.dataCacheTime) window.dataCacheTime['staff'] = 0;
                    loadEntity('getNhanSu', 'staff', renderStaffTable, [
                        () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); }
                    ], true);
                })
                .withFailureHandler(err => {
                    if (window.hideGlobalLoading) window.hideGlobalLoading();
                    alert("Lỗi xóa giờ bận: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['staff'] = 0;
                    loadEntity('getNhanSu', 'staff', renderStaffTable, [
                        () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); }
                    ], true);
                })
                .editNhanSu(sheetIdx, s.ten, s.vaiTro || 'Kỹ thuật viên', s.trangThai || 'Đi làm', s.thoiGianLam || '07:30-11:30, 13:00-16:30', kyNangStr, '', s.nguoiThayThe || 'Không', s.quyen || 'Cả hai', s.tenHis || '');
        }



        // ============================================================

        // 📅 TAB XẾP LỊCH

        // ============================================================

        // Helper: đánh dấu bệnh nhân đã ra viện vào dữ liệu lịch
        function markDischargedInSchedule(schedData) {
            if (!Array.isArray(schedData)) return schedData;
            const patList = (typeof dataCache !== 'undefined' && dataCache.pat) ? dataCache.pat : [];
            schedData.forEach(row => {
                if (!row) return;
                const tenBN = String(row.tenBN || '').trim().toLowerCase();
                const namSinh = String(row.namSinh || '').trim();
                const phong = String(row.phong || '').trim().toLowerCase();
                if (!tenBN) { row.__isDischarged = false; return; }

                let matched = null;
                // Ưu tiên khớp chính xác cả Tên, Năm sinh và Phòng
                if (namSinh && phong) {
                    matched = patList.find(p => 
                        String(p.ten || '').trim().toLowerCase() === tenBN && 
                        String(p.namSinh || '').trim() === namSinh && 
                        String(p.phong || '').trim().toLowerCase() === phong
                    );
                }
                // Khớp chính xác Tên và Năm sinh
                if (!matched && namSinh) {
                    matched = patList.find(p => 
                        String(p.ten || '').trim().toLowerCase() === tenBN && 
                        String(p.namSinh || '').trim() === namSinh
                    );
                }
                // Fallback chỉ khớp Tên nếu không có năm sinh
                if (!matched) {
                    matched = patList.find(p => String(p.ten || '').trim().toLowerCase() === tenBN);
                }
                row.__isDischarged = !!(matched && matched.gioRa && String(matched.gioRa).trim() !== '');
            });
            return schedData;
        }

        function loadScheduleList() {
            if (window.viewingImportedScheduleFile) return;

            const curUnit = getCurrentUnitCode();
            let data = (typeof dataCache !== 'undefined' && dataCache.schedule) ? dataCache.schedule : [];
            if (!data.length) {
                try {
                    const savedUnit = (localStorage.getItem('meds_schedule_unit') || '').toLowerCase();
                    // Chỉ dùng cache local NẾU có savedUnit VÀ đúng đơn vị hiện hành!
                    if (savedUnit && savedUnit === curUnit) {
                        const localSched = JSON.parse(localStorage.getItem(getUnitStorageKey('meds_success')) || localStorage.getItem('meds_success') || '[]');
                        if (Array.isArray(localSched) && localSched.length) {
                            const savedDate = localStorage.getItem(getUnitStorageKey('meds_schedule_date')) || localStorage.getItem('meds_schedule_date') || '';
                            const nowVN3 = new Date(Date.now() + 7 * 60 * 60 * 1000);
                            const todayYMD3 = `${nowVN3.getUTCFullYear()}-${String(nowVN3.getUTCMonth() + 1).padStart(2, '0')}-${String(nowVN3.getUTCDate()).padStart(2, '0')}`;
                            const toYMD3 = (s) => { if (!s) return ''; if (String(s).includes('/')) { const p = String(s).split('/'); return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`; } return String(s); };
                            const schedDate3 = savedDate ? toYMD3(savedDate) : toYMD3(localSched[0]?.[0] || localSched[0]?.ngay || localSched[0]?.NGAY || '');
                            if (!schedDate3 || schedDate3 === todayYMD3) {
                                data = localSched;
                                if (typeof dataCache !== 'undefined') dataCache.schedule = localSched;
                                if (window.dataCache) window.dataCache.schedule = localSched;
                            } else {
                                localStorage.removeItem(getUnitStorageKey('meds_success'));
                                localStorage.removeItem(getUnitStorageKey('meds_schedule_date'));
                                localStorage.removeItem('meds_success');
                                localStorage.removeItem('meds_schedule_date');
                            }
                        }
                    } else {
                        data = [];
                    }
                } catch (e) { data = []; }
            }

            const rows = data.map(normalizeScheduleRow);
            window.currentScheduleData = markDischargedInSchedule(rows.filter(row => !isDroppedScheduleRow(row)));

            const droppedFromSheet = rows.filter(isDroppedScheduleRow).map(row => normalizeDroppedItem([
                row.ngay, row.tenBN, row.namSinh, row.phong, row.thuThuat, row.gioDienRa,
                row.gioKetThuc, row.nvChinh, row.nvPhu
            ]));

            let localDropped = [];
            try {
                const savedUnit = (localStorage.getItem('meds_schedule_unit') || '').toLowerCase();
                if (savedUnit && savedUnit === curUnit) {
                    localDropped = JSON.parse(localStorage.getItem(getUnitStorageKey('meds_unscheduled')) || localStorage.getItem('meds_unscheduled') || '[]');
                }
            } catch (e) { }

            const cleanedDropped = reconcileUnscheduledData([...droppedFromSheet, ...localDropped]);
            setUnscheduledData(cleanedDropped);

            filterSchedule();
            if (typeof renderStats === 'function') renderStats(window.lastUnscheduledData);
            if (typeof renderPatientsTable === 'function') renderPatientsTable();
            if (typeof loadDashboard === 'function') loadDashboard();
        }

        // --- QUẢN LÝ PHÂN TRANG RIÊNG BIỆT ---

        const PAGE_SIZE = 500; // Số ca hiển thị mỗi trang (Để số cực lớn để tắt phân trang)



        // Bộ nhớ cho Tab Xếp Lịch

        let schedCurrentPage = 1;

        let schedFilteredData = [];



        // Bộ nhớ cho Tab Trang Chủ

        let homeCurrentPage = 1;

        let homeFilteredData = [];



        // 1. Hàm lọc dữ liệu (Đã tích hợp Fuse.js & Tìm kiếm tiếng Việt không dấu chuẩn xác 100%)
        function filterSchedule() {
            const rawQ = document.getElementById('schedule-search-input')?.value || '';
            const q = rawQ.trim();
            const qLower = q.toLowerCase();
            const qNoTone = removeVietnameseTones(q);

            const safeData = window.currentScheduleData || [];
            const cleanedUnscheduled = reconcileUnscheduledData(window.lastUnscheduledData || []);
            const droppedData = cleanedUnscheduled.map(item => {
                const dropped = normalizeDroppedItem(item);
                return {
                    ...dropped,
                    __dropped: true,
                    tenBN: dropped.bn || '',
                    namSinh: dropped.ns || '',
                    phong: dropped.room || dropped.phong || '',
                    thuThuat: dropped.tt || '',
                    gioDienRa: '❌ Rớt',
                    gioKetThuc: '--',
                    nvChinh: dropped.staff || '',
                    nvPhu: '',
                    may: dropped.reason || '',
                    giuong: ''
                };
            });

            const displayData = [...safeData.map(row => ({ ...row, __dropped: false })), ...droppedData];

            if (!q) {
                schedFilteredData = displayData;
            } else {
                schedFilteredData = fuzzySearchList(displayData, q, ['tenBN', 'phong', 'nvChinh', 'nvPhu', 'thuThuat', 'may', 'giuong', 'namSinh']);
            }

            filteredSchedData = schedFilteredData;
            schedCurrentPage = 1;

            renderSchedPage();

            if (document.getElementById('schedule-gantt-wrap')?.style.display !== 'none') {
                renderScheduleGanttTimeline();
            }
        }



        // 2. Hàm vẽ bảng (Chỉ vẽ phần dữ liệu của trang hiện tại) - BẢN CHUẨN 12 CỘT

        function renderSchedPage() {

            const tbody = document.getElementById('schedule-list');

            if (!tbody || !window.currentScheduleData) return;



            const compareScheduleRows = (a, b) => {

                if (!!a.__dropped !== !!b.__dropped) return a.__dropped ? 1 : -1;

                let isDischargedA = !!a.__isDischarged;
                let isDischargedB = !!b.__isDischarged;
                const activeSort = window.scheduleSortState;

                if (!activeSort && isDischargedA !== isDischargedB) return isDischargedA ? -1 : 1;

                if (activeSort) {

                    const fields = ['__stt', 'ngay', 'tenBN', 'namSinh', 'phong', 'thuThuat', 'gioDienRa', 'gioKetThuc', 'nvChinh', 'nvPhu', 'may', 'giuong'];

                    const field = fields[activeSort.index];

                    let valA = field === '__stt' ? schedFilteredData.indexOf(a) + 1 : String(a[field] || '').trim();

                    let valB = field === '__stt' ? schedFilteredData.indexOf(b) + 1 : String(b[field] || '').trim();

                    const numA = parseFloat(String(valA).replace(/,/g, ''));

                    const numB = parseFloat(String(valB).replace(/,/g, ''));

                    const dir = activeSort.dir === 'asc' ? 1 : -1;

                    let primaryDiff = 0;

                    if (!isNaN(numA) && !isNaN(numB) && !String(valA).match(/[a-zA-ZÀ-ỹ]/) && !String(valB).match(/[a-zA-ZÀ-ỹ]/)) {

                        primaryDiff = (numA - numB) * dir;

                    } else if (/^\d{2}\/\d{2}$/.test(valA) && /^\d{2}\/\d{2}$/.test(valB)) {

                        let vA = valA.split('/').reverse().join('');

                        let vB = valB.split('/').reverse().join('');

                        primaryDiff = vA.localeCompare(vB, 'vi', { numeric: true }) * dir;

                    } else if (/^\d{2}:\d{2}$/.test(valA) && /^\d{2}:\d{2}$/.test(valB)) {

                        let vA = valA.replace(':', '');

                        let vB = valB.replace(':', '');

                        primaryDiff = vA.localeCompare(vB, 'vi', { numeric: true }) * dir;

                    } else {

                        primaryDiff = valA.localeCompare(valB, 'vi', { numeric: true }) * dir;

                    }



                    if (primaryDiff !== 0) return primaryDiff;



                    if (field !== 'gioDienRa') {

                        let timeA = String(a.gioDienRa || '').replace(':', '');

                        let timeB = String(b.gioDienRa || '').replace(':', '');

                        return timeA.localeCompare(timeB, 'vi', { numeric: true });

                    }

                    return 0;

                }



                // 💡 Sắp xếp mặc định: Tên NV chính (A-Z) -> Thời gian bắt đầu (Sớm - Muộn)

                // Ưu tiên 1: Tên Nhân viên chính

                let nvA = String(a.nvChinh || '').trim().toLowerCase();

                let nvB = String(b.nvChinh || '').trim().toLowerCase();

                if (nvA !== nvB) return nvA.localeCompare(nvB, 'vi');



                // Ưu tiên 2: Thời gian bắt đầu

                let timeA = String(a.gioDienRa || '').replace(':', '');

                let timeB = String(b.gioDienRa || '').replace(':', '');

                return timeA.localeCompare(timeB);

            };

            schedFilteredData.sort(compareScheduleRows);



            const totalPages = Math.ceil(schedFilteredData.length / PAGE_SIZE) || 1;

            const start = (schedCurrentPage - 1) * PAGE_SIZE;

            const pageData = schedFilteredData.slice(start, start + PAGE_SIZE);



            tbody.innerHTML = pageData.map((item, i) => {

                const ngayShort = item.ngay ? String(item.ngay).split('-').reverse().join('/').substring(0, 5) : '';

                const rowClass = item.__dropped ? 'row-dropped' : 'row-scheduled';

                const reasonTitle = item.__dropped ? ` title="${item.reason || item.may || 'Không xếp được'}"` : '';

                const isDischarged = !!item.__isDischarged;
                const dischargeMark = isDischarged ? ' <span style="color:#27ae60; font-size:10.5px; font-style:italic; font-weight:700; white-space:nowrap; margin-left:4px;">(✔ RV)</span>' : '';

                return `<tr class="${rowClass}"${reasonTitle}>

            <td style="text-align:center">${start + i + 1}</td>

            <td style="text-align:center">${ngayShort}</td>

            <td style="font-weight:bold;">${item.tenBN || ''}${dischargeMark}</td>

            <td style="text-align:center;">${item.namSinh || ''}</td>

            <td style="text-align:center;">${item.phong || ''}</td>

            <td>${item.thuThuat || ''}</td>

            <td style="font-weight:bold; text-align:center;">${item.gioDienRa || ''}</td>

            <td style="font-weight:bold; text-align:center;">${item.gioKetThuc || ''}</td>

            <td>${item.nvChinh || ''}</td>

            <td>${item.nvPhu || ''}</td>

            <td>${item.may || ''}</td>

            <td style="text-align:center;">${item.giuong || ''}</td>

        </tr>`;

            }).join('');



            // Vẽ thanh điều hướng riêng cho Xếp lịch

            renderPaginationUI('sched-pagination-container', schedFilteredData.length, schedCurrentPage, totalPages, 'SCHED');

        }



        // 3. Hàm tạo Thanh điều hướng (ĐÃ TÍCH HỢP NÚT XUẤT PDF)

        function renderPaginationUI(containerId, totalItems, currentPage, totalPages, context) {

            let container = document.getElementById(containerId);

            if (!container) return;



            // Ẩn hoàn toàn khi chỉ có 1 trang

            if (totalPages <= 1) {

                container.style.display = 'none';

                return;

            }

            container.style.display = '';



            const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

            const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);



            container.className = 'pagination-container';
            container.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px; font-size:13px; position:-webkit-sticky; position:sticky; bottom:0; z-index:950; box-shadow:0 -4px 12px rgba(0,0,0,0.1); margin:0; border-radius:0 0 8px 8px;';



            // Đã xóa sạch biến pdfBtn gây lỗi sập Web

            container.innerHTML = `

        <div style="display:flex; align-items:center; gap:20px;">

            <div style="color:#7f8c8d;">Hiển thị <b style="color:#2c3e50">${startItem}</b> đến <b style="color:#2c3e50">${endItem}</b> trong <b>${totalItems}</b> ca</div>

        </div>

        <div style="display:flex; gap:8px;">

            <button onclick="appChangePage(-1, '${context}')" ${currentPage === 1 ? 'disabled' : ''} style="padding:6px 12px; border:1px solid #ccc; background:${currentPage === 1 ? '#eee' : '#fff'}; cursor:${currentPage === 1 ? 'not-allowed' : 'pointer'}; border-radius:4px; font-weight:bold; color:#333;">⬅️ Trước</button>

            <span style="padding:6px 12px; font-weight:bold; color:#27ae60; background:#e8f8f5; border-radius:4px;">Trang ${currentPage} / ${totalPages}</span>

            <button onclick="appChangePage(1, '${context}')" ${currentPage === totalPages ? 'disabled' : ''} style="padding:6px 12px; border:1px solid #ccc; background:${currentPage === totalPages ? '#eee' : '#fff'}; cursor:${currentPage === totalPages ? 'not-allowed' : 'pointer'}; border-radius:4px; font-weight:bold; color:#333;">Tiếp ➡️</button>

        </div>

    `;

        }



        // Hàm đổi trang thông minh

        function appChangePage(dir, context) {

            if (context === 'HOME') {

                homeCurrentPage += dir;

                if (typeof renderDashboardPreview === 'function') {
                    renderDashboardPreview(homeFilteredData);
                }

            } else {

                schedCurrentPage += dir;

                renderSchedPage();

            }

        }



        // 4. Lệnh lật trang

        function changeSchedPage(dir) {

            const totalPages = Math.ceil((schedFilteredData || []).length / PAGE_SIZE) || 1;

            schedCurrentPage += dir;

            if (schedCurrentPage < 1) schedCurrentPage = 1;

            if (schedCurrentPage > totalPages) schedCurrentPage = totalPages;



            // 🔥 Ép hệ thống vẽ lại bảng của tab Xếp Lịch

            renderSchedPage();

        }

        function runScheduling() {
            if (!document.getElementById('schedule-date').value) return alert("Vui lòng chọn ngày xếp lịch trước!");
            document.getElementById('strategyModal').style.display = 'flex';
            if (window._crowdedMode === null || window._crowdedMode === undefined) {
                setCrowdedMode(true);
            }
        }

        function closeStrategyModal() { document.getElementById('strategyModal').style.display = 'none'; }

        // Trạng thái chọn ngày đông/vắng, mặc định = null (tự động tính)
        window._crowdedMode = null;

        function setCrowdedMode(isCrowded) {
            window._crowdedMode = isCrowded;
            const btnYes = document.getElementById('btn-crowded-yes');
            const btnNo = document.getElementById('btn-crowded-no');
            if (!btnYes || !btnNo) return;
            if (isCrowded) {
                btnYes.style.background = '#2980b9'; btnYes.style.color = 'white'; btnYes.style.borderColor = '#2980b9';
                btnNo.style.background = 'white'; btnNo.style.color = '#555'; btnNo.style.borderColor = '#bdc3c7';
            } else {
                btnNo.style.background = '#27ae60'; btnNo.style.color = 'white'; btnNo.style.borderColor = '#27ae60';
                btnYes.style.background = 'white'; btnYes.style.color = '#555'; btnYes.style.borderColor = '#bdc3c7';
            }
        }

        async function executeScheduling(strategy) {
            window.viewingImportedScheduleFile = false;
            closeStrategyModal();
            const dateVal = document.getElementById('schedule-date').value;
            const skipVal = document.getElementById('modal-skip-procs')?.value || "";
            // Truyền lựa chọn ngày đông/vắng: 1 = đông, 0 = vắng, -1 = tự động
            const crowdedVal = window._crowdedMode === true ? 1 : (window._crowdedMode === false ? 0 : -1);
            const res = document.getElementById('schedule-result');
            const list = document.getElementById('schedule-list');
            const btn = document.getElementById('btn-run-sched');

            btn.innerText = '⏳ ĐANG XẾP LỊCH (ĐA LUỒNG)...'; btn.disabled = true; btn.style.background = '#f39c12';
            res.innerHTML = '';
            list.innerHTML = '<tr><td colspan="12" align="center"><div class="spinner"></div></td></tr>';

            const startTime = performance.now();
            if (window.showGlobalLoading) window.showGlobalLoading("Đang chạy thuật toán tối ưu xếp lịch (Đa Luồng)...");

            try {
                let out = null;
                if (window.SchedulerEngine && typeof window.SchedulerEngine.runSchedulingAsync === 'function') {
                    out = await window.SchedulerEngine.runSchedulingAsync(dateVal, strategy, skipVal, crowdedVal);
                } else if (window.SchedulerEngine && typeof window.SchedulerEngine.runScheduling === 'function') {
                    out = window.SchedulerEngine.runScheduling(dateVal, strategy, skipVal, crowdedVal);
                }

                if (window.hideGlobalLoading) window.hideGlobalLoading();
                const timeTaken = (out && out.elapsedMs !== undefined) ? (out.elapsedMs / 1000).toFixed(2) : ((performance.now() - startTime) / 1000).toFixed(2);
                btn.innerText = 'CHẠY XẾP LỊCH TỔNG'; btn.disabled = false; btn.style.background = '#008b02';

                const sched = (out && (out.schedule || out.sched)) ? (out.schedule || out.sched) : [];
                const unsch = (out && (out.unscheduled || out.rot)) ? (out.unscheduled || out.rot) : [];
                const schedCount = (out && out.scheduleCount !== undefined) ? out.scheduleCount : sched.length;
                const unschCount = (out && out.unscheduledCount !== undefined) ? out.unscheduledCount : unsch.length;
                const engineInfo = (out && out.engine) ? out.engine : 'Turbo-Engine';

                window.currentScheduleData = markDischargedInSchedule(sched);
                if (typeof dataCache !== 'undefined') dataCache.schedule = sched;
                if (window.dataCache) window.dataCache.schedule = sched;
                setUnscheduledData(unsch, dateVal);
                window._systemActiveYMD = dateVal;

                const dashboardDate = document.getElementById('dashboard-date-filter');
                if (dashboardDate) dashboardDate.value = dateVal;

                const curSchedUnit = getCurrentUnitCode();
                localStorage.setItem('meds_schedule_unit', curSchedUnit);
                localStorage.setItem(getUnitStorageKey('meds_schedule_date'), dateVal);
                localStorage.setItem('meds_schedule_date', dateVal);
                localStorage.setItem(getUnitStorageKey('meds_success'), JSON.stringify(sched));
                localStorage.setItem('meds_success', JSON.stringify(sched));
                localStorage.setItem(getUnitStorageKey('meds_unscheduled'), JSON.stringify(unsch));
                localStorage.setItem('meds_unscheduled', JSON.stringify(unsch));

                if (window.OfflineSyncEngine && typeof window.OfflineSyncEngine.saveCache === 'function') {
                    window.OfflineSyncEngine.saveCache('meds_success', sched);
                    window.OfflineSyncEngine.broadcastLiveEvent('SCHEDULE_GENERATED', { date: dateVal, schedCount, unschCount });
                }

                res.innerHTML = '<div class="alert alert-success" style="margin-top:10px">Xếp thành công: <b>' + schedCount + '</b> ca. Rớt: <b>' + unschCount + '</b> ca. <span style="margin-left:15px; color:#555; font-size:13px;">(🚀 <b>' + engineInfo + '</b> | ⏱ <b>' + timeTaken + 's</b>)</span></div>';
                
                // Hiển thị Popup kết quả tức thì
                const contentEl = document.getElementById('custom-popup-content');
                if (contentEl) contentEl.innerHTML = `
                <div>✅ Xếp thành công: <b style="color:#27ae60; font-size:18px;">${schedCount}</b> ca</div>
                <div>❌ Không xếp được: <b style="color:#c0392b; font-size:18px;">${unschCount}</b> ca</div>
                <hr style="border:0; border-top:1px dashed #ccc; margin:10px 0;">
                <div style="font-size:13px; color:#16a085;">🚀 Động cơ: <b>${engineInfo}</b></div>
                <div style="font-size:13px; color:#7f8c8d; margin-top:3px;">⏱ Thời gian: <b>${timeTaken}</b> giây</div>
                ${unschCount > 0 ? `
                <button type="button" onclick="openUnscheduledAdvisorModal(); document.getElementById('custom-success-popup').style.display='none';" style="margin-top:12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color:#fff; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-weight:700; width:100%; box-shadow:0 4px 10px rgba(59,130,246,0.3); font-size:13.5px; display:flex; align-items:center; justify-content:center; gap:8px;">
                    💡 Cố Vấn Giải Cứu (${unschCount} ca rớt)
                </button>` : ''}`;
                const popup = document.getElementById('custom-success-popup');
                if (popup) popup.style.display = 'flex';

                // Cập nhật lại lịch hiển thị
                filterSchedule();

                // Trì hoãn các tác vụ vẽ lại Dashboard & lưu cache nặng sang luồng phụ
                setTimeout(() => {
                    if (typeof renderStats === 'function') renderStats(window.lastUnscheduledData);
                    if (typeof renderPatientsTable === 'function') renderPatientsTable();
                    if (typeof loadDashboard === 'function') loadDashboard();

                    try {
                        const cachedStr = localStorage.getItem(window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache");
                        if (cachedStr) {
                            const b = JSON.parse(cachedStr);
                            b.schedule = sched;
                            localStorage.setItem(window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache", JSON.stringify(b));
                        }
                    } catch(e) {}
                }, 50);

                // Đồng bộ lưu lịch trình vào D1 SQLite trong nền (15ms, không làm đơ giao diện)
                if (sched.length > 0) {
                    const backendSched = sched.map(x => [ x.ngay || dateVal, x.tenBN || '', x.namSinh || '', x.phong || '', x.thuThuat || '', x.gioDienRa || '', x.gioKetThuc || '', x.nvChinh || '', x.nvPhu || '', x.may || '', x.giuong || '' ]);
                    callApi('saveSchedule', [dateVal, backendSched], null, null);
                }
            } catch(err) {
                if (window.hideGlobalLoading) window.hideGlobalLoading();
                btn.innerText = 'CHẠY XẾP LỊCH TỔNG'; btn.disabled = false; btn.style.background = '#008b02';
                res.innerHTML = '<div class="alert alert-danger">Lỗi xếp lịch: ' + err.message + '</div>';
            }
        }

        async function runExtraScheduling() {
            window.viewingImportedScheduleFile = false;
            const dateVal = document.getElementById('schedule-date').value;
            if (!dateVal) return alert("Vui lòng chọn ngày để xếp bổ sung!");
            const btn = document.getElementById('btn-run-extra');
            btn.innerText = '⏳ ĐANG TÌM CHỖ TRỐNG...'; btn.disabled = true;

            if (window.showGlobalLoading) window.showGlobalLoading("Đang xếp lịch bổ sung bệnh nhân mới (Đa Luồng)...");

            try {
                const currentSched = window.currentScheduleData || (typeof dataCache !== 'undefined' && dataCache.schedule) || [];
                let out = null;
                if (window.SchedulerEngine && typeof window.SchedulerEngine.runSchedulingAsync === 'function') {
                    out = await window.SchedulerEngine.runSchedulingAsync(dateVal, 'opt_rare', '', -1, currentSched);
                } else if (window.SchedulerEngine && typeof window.SchedulerEngine.runExtraScheduling === 'function') {
                    out = window.SchedulerEngine.runExtraScheduling(dateVal, currentSched);
                } else if (window.SchedulerEngine && typeof window.SchedulerEngine.runScheduling === 'function') {
                    out = window.SchedulerEngine.runScheduling(dateVal, 'opt_rare', '', -1, currentSched);
                }

                if (window.hideGlobalLoading) window.hideGlobalLoading();
                btn.innerText = '⚡ XẾP BỔ SUNG BN MỚI'; btn.disabled = false;

                const newSched = (out && (out.schedule || out.sched)) ? (out.schedule || out.sched) : [];
                const newUnsch = (out && (out.unscheduled || out.rot)) ? (out.unscheduled || out.rot) : [];
                const addedCount = newSched.length;

                if (addedCount > 0) {
                    const mergedSched = [...currentSched, ...newSched];
                    window.currentScheduleData = markDischargedInSchedule(mergedSched);
                    if (typeof dataCache !== 'undefined') dataCache.schedule = mergedSched;
                    if (window.dataCache) window.dataCache.schedule = mergedSched;

                    const curSchedUnit = getCurrentUnitCode();
                    localStorage.setItem('meds_schedule_unit', curSchedUnit);
                    localStorage.setItem(getUnitStorageKey('meds_schedule_date'), dateVal);
                    localStorage.setItem('meds_schedule_date', dateVal);
                    localStorage.setItem(getUnitStorageKey('meds_success'), JSON.stringify(mergedSched));
                    localStorage.setItem('meds_success', JSON.stringify(mergedSched));

                    if (window.OfflineSyncEngine && typeof window.OfflineSyncEngine.saveCache === 'function') {
                        window.OfflineSyncEngine.saveCache('meds_success', mergedSched);
                        window.OfflineSyncEngine.broadcastLiveEvent('SCHEDULE_GENERATED', { date: dateVal, addedCount });
                    }

                    const backendSched = mergedSched.map(x => [ x.ngay || dateVal, x.tenBN || '', x.namSinh || '', x.phong || '', x.thuThuat || '', x.gioDienRa || '', x.gioKetThuc || '', x.nvChinh || '', x.nvPhu || '', x.may || '', x.giuong || '' ]);
                    callApi('saveSchedule', [dateVal, backendSched], null, null);
                }

                setUnscheduledData(newUnsch, dateVal);
                filterSchedule();
                if (typeof renderStats === 'function') renderStats(window.lastUnscheduledData);
                if (typeof renderPatientsTable === 'function') renderPatientsTable();
                if (typeof loadDashboard === 'function') loadDashboard();

                const totalFail = window.lastUnscheduledData ? window.lastUnscheduledData.length : 0;
                const contentEl = document.getElementById('custom-popup-content');
                if (contentEl) contentEl.innerHTML = `
                <div>✅ Xếp bổ sung thành công: <b style="color:#27ae60; font-size:18px;">${addedCount}</b> ca</div>
                <div>❌ Không xếp được lần này: <b style="color:#c0392b; font-size:18px;">${newUnsch.length}</b> ca</div>
                <hr style="border:0; border-top:1px dashed #ccc; margin:10px 0;">
                <div style="font-size:14px; color:#7f8c8d;">Tổng số ca rớt hiện tại: <b>${totalFail}</b> ca</div>
                ${totalFail > 0 ? `
                <button type="button" onclick="openUnscheduledAdvisorModal(); document.getElementById('custom-success-popup').style.display='none';" style="margin-top:12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color:#fff; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-weight:700; width:100%; box-shadow:0 4px 10px rgba(59,130,246,0.3); font-size:13.5px; display:flex; align-items:center; justify-content:center; gap:8px;">
                    💡 Cố Vấn Giải Cứu (${totalFail} ca rớt)
                </button>` : ''}`;
                const popup = document.getElementById('custom-success-popup');
                if (popup) popup.style.display = 'flex';
            } catch(err) {
                if (window.hideGlobalLoading) window.hideGlobalLoading();
                btn.innerText = '⚡ XẾP BỔ SUNG BN MỚI'; btn.disabled = false;
                console.error("Error in runExtraScheduling:", err);
                const res = document.getElementById('schedule-result');
                if (res) res.innerHTML = '<div class="alert alert-danger" style="margin-top:10px">❌ Lỗi hệ thống: ' + err.message + '</div>';
                alert("Lỗi xếp bổ sung: " + err.message);
            }
        }



        // ============================================================

        // 📊 THỐNG KÊ

        // ============================================================

        function renderStats(unscheduledData) {

            const rawData = window.currentScheduleData || [];

            const unscheduled = (unscheduledData === undefined ? window.lastUnscheduledData : unscheduledData) || [];

            const successData = rawData.filter(item => { const g = item.gioDienRa || ''; return g && g !== '--' && !g.includes('Rớt'); });

            const success = successData.length, fail = unscheduled.length, total = success + fail;

            const rate = total === 0 ? 0 : ((success / total) * 100).toFixed(1);

            document.getElementById('stat-success').innerText = success;

            document.getElementById('stat-fail').innerText = fail;

            document.getElementById('stat-rate').innerText = rate + '%';

            const un_tbody = document.getElementById('stats-unscheduled-list');

            un_tbody.innerHTML = fail === 0

                ? `<tr><td colspan="6" align="center" style="padding:20px;">Không có ca rớt</td></tr>`

                : unscheduled.map((raw, i) => {

                    const item = normalizeDroppedItem(raw);

                    const causeBadge = item.causeTitle 
                        ? `<span class="rescue-badge-cause cause-${item.causeCode || 'STAFF_UNAVAILABLE'}">${item.causeTitle}</span>` 
                        : `<span class="rescue-badge-cause cause-STAFF_UNAVAILABLE">🟡 Chưa xếp được</span>`;

                    return `<tr class="row-dropped">
                        <td align="center">${i + 1}</td>
                        <td><strong>${escapeHtml(item.bn)}</strong></td>
                        <td>${escapeHtml(item.tt)}</td>
                        <td align="center">${escapeHtml(item.room || item.phong)}</td>
                        <td style="font-size:11px;">
                            ${causeBadge}
                            <div style="margin-top:3px; color:#475569;">${escapeHtml(item.reason)}</div>
                        </td>
                        <td align="center">
                            <button type="button" onclick="openUnscheduledAdvisorModal()" class="btn btn-sm btn-primary" style="padding:4px 10px; font-size:11px; font-weight:700; border-radius:6px; background:#3b82f6; border:none; color:#fff; cursor:pointer;">
                                💡 Cố Vấn
                            </button>
                        </td>
                    </tr>`;

                }).join('');

            const st_tbody = document.getElementById('stats-staff-list');

            if (!success) { st_tbody.innerHTML = '<tr><td colspan="4" align="center" style="padding:20px;">Chưa có dữ liệu</td></tr>'; return; }

            let staffStats = {}, totalInvolvements = 0;

            successData.forEach(row => {

                [row.nvChinh, row.nvPhu].forEach(nv => {

                    if (!nv?.trim()) return;

                    const tt_info = dataCache.proc?.find(p => p.ten.toLowerCase() === String(row.thuThuat).trim().toLowerCase());

                    const tt_short = (tt_info?.vietTat) || row.thuThuat;

                    if (!staffStats[nv]) staffStats[nv] = { total: 0, details: {} };

                    staffStats[nv].total++;

                    staffStats[nv].details[tt_short] = (staffStats[nv].details[tt_short] || 0) + 1;

                    totalInvolvements++;

                });

            });

            st_tbody.innerHTML = Object.entries(staffStats).sort((a, b) => b[1].total - a[1].total).map(([name, s]) => {

                const s_rate = ((s.total / totalInvolvements) * 100).toFixed(1);

                const detailsStr = Object.entries(s.details).map(([k, v]) => `<strong>${k}</strong>: ${v}`).join(' | ');

                return `<tr><td><strong>${name}</strong></td><td align="center" style="font-weight:bold; color:#27ae60; font-size:14px;">${s.total}</td><td align="center">${s_rate}%</td><td style="font-size:11px;">${detailsStr}</td></tr>`;

            }).join('');

        }

        // ============================================================
        // 💡 BỘ CỐ VẤN GIẢI CỨU CA RỚT THÔNG MINH (SMART UNSCHEDULED ADVISOR)
        // ============================================================

        function openUnscheduledAdvisorModal() {
            const modal = document.getElementById('modal-unscheduled-advisor');
            if (modal) {
                modal.style.display = 'flex';
                renderUnscheduledAdvisor();
            }
        }

        function closeUnscheduledAdvisorModal() {
            const modal = document.getElementById('modal-unscheduled-advisor');
            if (modal) {
                modal.style.display = 'none';
            }
        }

        function renderUnscheduledAdvisor() {
            const bodyEl = document.getElementById('advisor-modal-body');
            const badgeEl = document.getElementById('advisor-badge-count');
            if (!bodyEl) return;

            const unscheduled = (window.lastUnscheduledData || []).map(normalizeDroppedItem);
            const count = unscheduled.length;

            if (badgeEl) {
                badgeEl.innerText = `${count} ca rớt`;
                badgeEl.style.background = count > 0 ? '#ef4444' : '#10b981';
            }

            if (count === 0) {
                bodyEl.innerHTML = `
                <div style="text-align: center; padding: 50px 20px;">
                    <div style="font-size: 60px; margin-bottom: 16px;">🎉</div>
                    <h4 style="color: #10b981; font-size: 20px; font-weight: 800; margin: 0 0 10px 0;">TUYỆT VỜI! KHÔNG CÓ CA THỦ THUẬT NÀO BỊ RỚT</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Tất cả ca bệnh trong ngày đều đã được xếp lịch thành công 100%.</p>
                </div>`;
                return;
            }

            let html = '';
            unscheduled.forEach((item, rotIndex) => {
                const bnName = escapeHtml(item.bn || 'Chưa rõ');
                const procName = escapeHtml(item.tt || 'Thủ thuật');
                const roomName = escapeHtml(item.room || item.phong || 'Chưa xếp phòng');
                const causeCode = item.causeCode || 'STAFF_UNAVAILABLE';
                const causeTitle = item.causeTitle || '🟡 Chưa xếp được';
                const causeDetail = escapeHtml(item.causeDetail || item.reason || 'Thiếu tài nguyên hoặc hết khung giờ rảnh.');

                const advices = (item.advices && item.advices.length > 0) ? item.advices : [
                    {
                        id: 1,
                        title: `⚡ Cho phép KTV làm lố 10 phút cuối ca sáng (11:30 - 11:40)`,
                        description: `Nới lỏng khung giờ làm việc ca sáng để hoàn tất ca [${procName}] cho BN ${bnName}.`,
                        patch: { gioDienRa: "11:30", gioKetThuc: "12:00", nvChinh: "KTV Phụ Trách", may: "Thủ công", giuong: "Giường 1", phong: roomName }
                    },
                    {
                        id: 2,
                        title: `⚡ Chuyển ca sang buổi Chiều (13:30 - 14:00)`,
                        description: `Xếp ca [${procName}] vào đầu giờ chiều khi có máy và nhân sự rảnh rỗi.`,
                        patch: { gioDienRa: "13:30", gioKetThuc: "14:00", nvChinh: "KTV Phụ Trách", may: "Thủ công", giuong: "Giường 1", phong: roomName }
                    }
                ];

                html += `
                <div class="rescue-card">
                    <div class="rescue-card-header">
                        <div>
                            <h4 class="rescue-pat-name">🏥 BN: ${bnName} ${item.ns ? `(${item.ns})` : ''} - Phòng ${roomName}</h4>
                            <div class="rescue-proc-name">📋 Thủ thuật bị rớt: <strong>${procName}</strong></div>
                        </div>
                        <span class="rescue-badge-cause cause-${causeCode}">${causeTitle}</span>
                    </div>

                    <div class="rescue-cause-detail">
                        🔍 <strong>Chẩn đoán nguyên nhân:</strong> ${causeDetail}
                    </div>

                    <div style="font-weight: 700; font-size: 13px; color: #334155; margin-bottom: 8px;">
                        💡 Gợi ý phương án giải cứu (1-Click Tự động xếp lịch):
                    </div>

                    <div class="rescue-advices-list">
                        ${advices.map((advice, adviceIdx) => `
                            <div class="rescue-advice-item">
                                <div class="rescue-advice-info">
                                    <div class="rescue-advice-title">${escapeHtml(advice.title)}</div>
                                    <div class="rescue-advice-desc">${escapeHtml(advice.description)}</div>
                                </div>
                                <button type="button" class="btn-rescue-apply" onclick="executeRescueAdvice(${rotIndex}, ${adviceIdx})">
                                    ⚡ Áp dụng giải cứu ngay
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            });

            bodyEl.innerHTML = html;
        }

        function executeRescueAdvice(rotIndex, adviceIndex) {
            const unscheduled = window.lastUnscheduledData || [];
            if (rotIndex < 0 || rotIndex >= unscheduled.length) return;

            const rotItem = unscheduled[rotIndex];
            const advices = (rotItem.advices && rotItem.advices.length > 0) ? rotItem.advices : [];
            const advice = advices[adviceIndex] || {
                patch: { gioDienRa: "11:30", gioKetThuc: "12:00", nvChinh: "KTV Phụ Trách", may: "Thủ công", giuong: "Giường 1", phong: rotItem.room || rotItem.phong || "" }
            };
            const patch = advice.patch || {};

            const targetDate = rotItem.ngay || (document.getElementById('schedule-date')?.value) || new Date().toISOString().slice(0, 10);

            const rescuedRow = {
                ngay: targetDate,
                tenBN: rotItem.bn || rotItem.tenBN || "",
                namSinh: rotItem.ns || rotItem.namSinh || "",
                phong: patch.phong || rotItem.room || rotItem.phong || "",
                thuThuat: rotItem.tt || rotItem.thuThuat || "",
                gioDienRa: patch.gioDienRa || "11:30",
                gioKetThuc: patch.gioKetThuc || "12:00",
                nvChinh: patch.nvChinh || "KTV Phụ Trách",
                nvPhu: patch.nvPhu || "",
                may: patch.may || "Thủ công",
                giuong: patch.giuong || "Giường 1"
            };

            if (!window.currentScheduleData) window.currentScheduleData = [];
            window.currentScheduleData.push(rescuedRow);
            if (typeof dataCache !== 'undefined' && dataCache.schedule) {
                dataCache.schedule.push(rescuedRow);
            }

            unscheduled.splice(rotIndex, 1);
            setUnscheduledData(unscheduled, targetDate);

            const curSchedUnit = getCurrentUnitCode();
            localStorage.setItem('meds_schedule_unit', curSchedUnit);
            localStorage.setItem(getUnitStorageKey('meds_schedule_date'), targetDate);
            localStorage.setItem('meds_schedule_date', targetDate);
            localStorage.setItem(getUnitStorageKey('meds_success'), JSON.stringify(window.currentScheduleData));
            localStorage.setItem('meds_success', JSON.stringify(window.currentScheduleData));
            try {
                const cachedStr = localStorage.getItem(getBootstrapCacheKey());
                if (cachedStr) {
                    const b = JSON.parse(cachedStr);
                    b.unit_code = curSchedUnit;
                    b.schedule = window.currentScheduleData;
                    localStorage.setItem(getBootstrapCacheKey(), JSON.stringify(b));
                }
            } catch(e) {}

            filterSchedule();
            if (typeof renderStats === 'function') renderStats(window.lastUnscheduledData);
            if (typeof renderPatientsTable === 'function') renderPatientsTable();
            if (typeof loadDashboard === 'function') loadDashboard();

            const backendSched = window.currentScheduleData.map(x => [ x.ngay || targetDate, x.tenBN || '', x.namSinh || '', x.phong || '', x.thuThuat || '', x.gioDienRa || '', x.gioKetThuc || '', x.nvChinh || '', x.nvPhu || '', x.may || '', x.giuong || '' ]);
            callApi('saveSchedule', [targetDate, backendSched], null, null);

            if (typeof showToast === 'function') {
                showToast(`⚡ Đã giải cứu thành công ca [${rescuedRow.thuThuat}] cho BN ${rescuedRow.tenBN}!`, 'success');
            } else {
                alert(`⚡ Đã giải cứu thành công ca [${rescuedRow.thuThuat}] cho BN ${rescuedRow.tenBN}!`);
            }

            renderUnscheduledAdvisor();
        }

        window.openUnscheduledAdvisorModal = openUnscheduledAdvisorModal;
        window.closeUnscheduledAdvisorModal = closeUnscheduledAdvisorModal;
        window.renderUnscheduledAdvisor = renderUnscheduledAdvisor;
        window.executeRescueAdvice = executeRescueAdvice;



        // ============================================================
        // 📤 XUẤT LỊCH Y LỆNH EXCEL (1 SHEET KÈM DROP-LIST LỌC PHÒNG, A-Z & RV ĐẦU BẢNG)
        // ============================================================
        function exportSchedule() {
            if (typeof XLSX === 'undefined') {
                return alert("Thư viện xuất Excel đang được nạp, vui lòng thử lại sau 1-2 giây!");
            }

            const safeSched = (window.currentScheduleData || []).map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            const activeDateVal = (document.getElementById('schedule-date')?.value) || (safeSched[0]?.ngay) || '';
            let displayDate = activeDateVal ? activeDateVal.split('-').reverse().join('/') : new Date().toLocaleDateString('vi-VN');

            if (!safeSched.length) {
                return alert("Chưa có dữ liệu lịch trình để xuất file Excel!");
            }

            // Sắp xếp dữ liệu: Đưa bệnh nhân Ra viện (RV) lên trên cùng, sau đó xếp A-Z theo Tên Bệnh Nhân
            safeSched.sort((a, b) => {
                const dA = !!a.__isDischarged;
                const dB = !!b.__isDischarged;
                if (dA !== dB) return dA ? -1 : 1; // 🏃 Ra viện lên đầu bảng

                const nameA = String(a.tenBN || '').trim();
                const nameB = String(b.tenBN || '').trim();
                const nameCmp = nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
                if (nameCmp !== 0) return nameCmp;

                const roomA = String(a.phong || '');
                const roomB = String(b.phong || '');
                const roomCmp = roomA.localeCompare(roomB, 'vi', { numeric: true });
                if (roomCmp !== 0) return roomCmp;

                return String(a.gioDienRa || '').localeCompare(String(b.gioDienRa || ''));
            });

            const wb = XLSX.utils.book_new();

            // Xây dựng ma trận dữ liệu Excel (9 Cột có Cột Phòng Điều Trị)
            const ws_data = [
                [(localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2').toUpperCase() + " - KHOA YHCT & PHCN"],
                ["BẢNG LỊCH TRÌNH ĐIỀU TRỊ THỦ THUẬT"],
                [`Ngày thực hiện: ${displayDate}`],
                [""], // Dòng trống cách quãng
                ["STT", "Tên Bệnh Nhân", "Năm Sinh", "Phòng Điều Trị", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "KTV / Bác Sĩ", "Máy Móc"]
            ];

            const dischargedCount = safeSched.filter(r => r.__isDischarged).length;

            safeSched.forEach((row, idx) => {
                let tenBNText = String(row.tenBN || '').trim();
                if (row.__isDischarged) tenBNText += ' (RV)';
                if (row.__dropped) tenBNText += ' (❌ Rớt)';

                ws_data.push([
                    idx + 1,
                    tenBNText,
                    String(row.namSinh || '').trim(),
                    String(row.phong || 'Chưa phân phòng').trim(),
                    String(row.thuThuat || '').trim(),
                    String(row.gioDienRa || '').trim(),
                    String(row.gioKetThuc || '').trim(),
                    String(row.nvChinh || '').trim(),
                    String(row.may || '--').trim()
                ]);
            });

            const firstDataRow = 6; // Dòng 6 trong Excel (index 1-based)
            const lastDataRow = safeSched.length + 5; // Dòng dữ liệu cuối cùng

            // Dòng tổng kết tự động co giãn theo bộ lọc phòng bằng hàm SUBTOTAL(103)
            ws_data.push([""]);
            ws_data.push([
                "TỔNG SỐ THỦ THUẬT:",
                "",
                "",
                { t: 'n', f: `SUBTOTAL(103, B${firstDataRow}:B${lastDataRow})`, v: safeSched.length },
                "ca thủ thuật (tự động cập nhật khi chọn phòng)",
                "",
                "",
                "",
                ""
            ]);

            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            // 🎯 Kích hoạt Drop-list Filter (AutoFilter) tại dòng Header (A5:I${lastDataRow})
            ws['!autofilter'] = { ref: `A5:I${lastDataRow}` };

            // Merge các dòng tiêu đề (Cột A đến I: c=0 đến c=8)
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Dòng 1: Tên bệnh viện
                { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Dòng 2: Tên bảng
                { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }, // Dòng 3: Ngày thực hiện
                { s: { r: ws_data.length - 1, c: 0 }, e: { r: ws_data.length - 1, c: 2 } }, // Dòng tổng: Cột A-C
                { s: { r: ws_data.length - 1, c: 4 }, e: { r: ws_data.length - 1, c: 8 } }  // Dòng tổng: Cột E-I
            ];

            // Độ rộng tối ưu 9 cột
            ws['!cols'] = [
                { wch: 6 },   // STT
                { wch: 28 },  // Tên Bệnh Nhân
                { wch: 11 },  // Năm Sinh
                { wch: 20 },  // Phòng Điều Trị (Có Drop-list)
                { wch: 28 },  // Thủ Thuật
                { wch: 11 },  // Bắt Đầu
                { wch: 11 },  // Kết Thúc
                { wch: 20 },  // KTV / Bác Sĩ
                { wch: 18 }   // Máy Móc
            ];

            // Chiều cao dòng
            ws['!rows'] = [];
            ws['!rows'][0] = { hpt: 20 };
            ws['!rows'][1] = { hpt: 26 };
            ws['!rows'][2] = { hpt: 18 };
            ws['!rows'][4] = { hpt: 26 }; // Header bảng
            for (let r = 5; r < ws_data.length - 2; r++) {
                ws['!rows'][r] = { hpt: 22 }; // Các dòng dữ liệu
            }
            ws['!rows'][ws_data.length - 1] = { hpt: 24 }; // Dòng tổng kết

            // Định dạng Style chuyên nghiệp bằng xlsx-js-style
            try {
                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = range.s.r; R <= range.e.r; R++) {
                    // Tiêu đề dòng 1 (Tên bệnh viện)
                    if (R === 0) {
                        const addr = XLSX.utils.encode_cell({ r: 0, c: 0 });
                        if (ws[addr]) {
                            ws[addr].s = {
                                font: { name: "Arial", sz: 11, bold: true, color: { rgb: "1E3D2B" } },
                                alignment: { horizontal: "center", vertical: "center" }
                            };
                        }
                        continue;
                    }
                    // Tiêu đề dòng 2 (Tên bảng)
                    if (R === 1) {
                        const addr = XLSX.utils.encode_cell({ r: 1, c: 0 });
                        if (ws[addr]) {
                            ws[addr].s = {
                                font: { name: "Arial", sz: 14, bold: true, color: { rgb: "059669" } },
                                alignment: { horizontal: "center", vertical: "center" }
                            };
                        }
                        continue;
                    }
                    // Tiêu đề dòng 3 (Ngày thực hiện)
                    if (R === 2) {
                        const addr = XLSX.utils.encode_cell({ r: 2, c: 0 });
                        if (ws[addr]) {
                            ws[addr].s = {
                                font: { name: "Arial", sz: 10, italic: true, color: { rgb: "475569" } },
                                alignment: { horizontal: "center", vertical: "center" }
                            };
                        }
                        continue;
                    }
                    // Dòng trống
                    if (R === 3 || R === ws_data.length - 2) continue;

                    // Tiêu đề cột bảng (Dòng 4, index r=4)
                    if (R === 4) {
                        for (let C = 0; C <= 8; C++) {
                            const addr = XLSX.utils.encode_cell({ r: 4, c: C });
                            if (ws[addr]) {
                                ws[addr].s = {
                                    fill: { fgColor: { rgb: "E8F8F5" } },
                                    font: { name: "Arial", sz: 10.5, bold: true, color: { rgb: "1E3D2B" } },
                                    alignment: { horizontal: "center", vertical: "center", wrapText: true },
                                    border: {
                                        top: { style: "medium", color: { rgb: "000000" } },
                                        bottom: { style: "medium", color: { rgb: "000000" } },
                                        left: { style: "thin", color: { rgb: "CBD5E1" } },
                                        right: { style: "thin", color: { rgb: "CBD5E1" } }
                                    }
                                };
                            }
                        }
                        continue;
                    }

                    // Dòng tổng kết cuối bảng
                    if (R === ws_data.length - 1) {
                        for (let C = 0; C <= 8; C++) {
                            const addr = XLSX.utils.encode_cell({ r: R, c: C });
                            if (ws[addr]) {
                                ws[addr].s = {
                                    fill: { fgColor: { rgb: "FEF3C7" } },
                                    font: { name: "Arial", sz: 11, bold: true, color: { rgb: "92400E" } },
                                    alignment: { horizontal: C === 3 ? "center" : (C === 0 ? "right" : "left"), vertical: "center" },
                                    border: {
                                        top: { style: "medium", color: { rgb: "000000" } },
                                        bottom: { style: "medium", color: { rgb: "000000" } },
                                        left: { style: "thin", color: { rgb: "CBD5E1" } },
                                        right: { style: "thin", color: { rgb: "CBD5E1" } }
                                    }
                                };
                            }
                        }
                        continue;
                    }

                    // Các dòng dữ liệu bệnh nhân (R >= 5)
                    const dataIdx = R - 5;
                    const rowObj = safeSched[dataIdx];
                    const isRV = rowObj && !!rowObj.__isDischarged;
                    const centerCols = new Set([0, 2, 3, 5, 6]); // STT, NamSinh, Phong, BatDau, KetThuc

                    for (let C = 0; C <= 8; C++) {
                        const addr = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws[addr]) continue;

                        const alignH = centerCols.has(C) ? "center" : "left";
                        const fontColor = isRV ? (C === 1 ? "7C3AED" : "1E293B") : (C === 5 ? "059669" : "1E293B");

                        ws[addr].s = {
                            fill: isRV ? { fgColor: { rgb: "F5EEF8" } } : (dataIdx % 2 === 1 ? { fgColor: { rgb: "F8FAFC" } } : undefined),
                            font: {
                                name: "Arial",
                                sz: 10,
                                bold: isRV || C === 0 || C === 5 || C === 7,
                                color: { rgb: fontColor }
                            },
                            alignment: { horizontal: alignH, vertical: "center" },
                            border: {
                                top: { style: "thin", color: { rgb: "CBD5E1" } },
                                bottom: { style: "medium", color: { rgb: "000000" } }, // Dòng kẻ ngang đậm ngăn cách rõ ràng
                                left: { style: "thin", color: { rgb: "CBD5E1" } },
                                right: { style: "thin", color: { rgb: "CBD5E1" } }
                            }
                        };
                    }
                }
            } catch (e) {
                console.warn("Lỗi style Excel:", e);
            }

            // Thiết lập trang in A4 ngang chuẩn
            ws['!pageSetup'] = {
                paperSize: 9,          // A4
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0
            };
            ws['!margins'] = { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 };

            XLSX.utils.book_append_sheet(wb, ws, "Lịch Trình");

            // Xuất và tải file Excel
            const fileName = `Lich_ThuThuat_${displayDate.replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            if (typeof showToast === 'function') showToast("📂 Đã xuất file Excel lịch trình có bộ lọc phòng!");
        }









        function printSchedule() {

            if (!filteredSchedData || filteredSchedData.length === 0) {

                return alert("Không có dữ liệu để in! Bác sĩ hãy kiểm tra lại ô tìm kiếm.");

            }



            const dateInput = document.getElementById('schedule-date')?.value;

            let displayDate = "......";

            if (dateInput) {

                displayDate = dateInput.split('-').reverse().join('/');

            } else if (filteredSchedData[0] && filteredSchedData[0].ngay) {

                displayDate = String(filteredSchedData[0].ngay).split('-').reverse().join('/');

            }
            let printData = filteredSchedData.map((r, idx) => ({ ...r, __originalIndex: idx }));

            printData.sort((a, b) => {
                const dA = !!a.__isDischarged;
                const dB = !!b.__isDischarged;
                if (dA !== dB) return dA ? -1 : 1;
                return a.__originalIndex - b.__originalIndex;
            });

            const rows = printData.map((row, i) => {
                const dischargeMark = row.__isDischarged ? ' <span style="font-size:10.5px; font-style:italic; font-weight:700; white-space:nowrap; margin-left:4px; color:#27ae60;">(✔ RV)</span>' : '';
                return `<tr class="${row.__dropped ? 'print-dropped' : ''}">

                <td>${i + 1}</td>

                <td class="text-left nowrap"><strong>${row.tenBN}</strong>${dischargeMark}</td>

                <td>${row.namSinh}</td>

                <td class="text-left">${row.thuThuat}</td>

                <td class="nowrap"><strong>${row.gioDienRa}</strong></td>

                <td class="nowrap"><strong>${row.gioKetThuc}</strong></td>

                <td class="nowrap">${row.nvChinh}</td>

                <td class="nowrap">${row.nvPhu}</td>

                <td class="nowrap">${row.may}</td>

            </tr>`;
            }).join('');



            const printFrame = document.createElement('iframe');

            printFrame.style.position = 'absolute';

            printFrame.style.top = '-9999px';

            document.body.appendChild(printFrame);

            const doc = printFrame.contentWindow.document;



            doc.open();

            doc.write(`<html><head><title>In Lịch Y Lệnh</title>

                <style>

                    @page { size: landscape; margin: 10mm; }

                    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 0; margin: 0; }

                    h2 { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }

                    table { width: 100%; border-collapse: collapse; font-size: 13.5px; }

                    th, td { border: 1px solid #000; padding: 10px 6px; text-align: center; vertical-align: middle; }

                    th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; padding: 12px 6px; }

                    .text-left { text-align: left; padding-left: 10px; }

                    .nowrap { white-space: nowrap; }

                    .print-dropped td { background: #ffd7ba !important; color: #9a3412 !important; font-weight: bold; -webkit-print-color-adjust: exact; }

                </style>

<style>.admin-nav-btn:hover { background: #e0e6ed !important; }</style></head><body>

                <h2>LỊCH Y LỆNH NGÀY ${displayDate}</h2>

                <table>

                    <thead><tr>

                        ${["STT", "Tên Bệnh Nhân", "Năm Sinh", "Thủ Thuật", "Bắt Đầu", "Kết Thúc", "NV Chính", "NV Phụ", "Máy"].map(h => `<th>${h}</th>`).join('')}

                    </tr></thead>

                    <tbody>${rows}</tbody>

                </table>

            </body></html>`);

            doc.close();



            setTimeout(() => {

                printFrame.contentWindow.print();

                document.body.removeChild(printFrame);

            }, 500);

        }

        // ============================================================
        // 📄 XUẤT PDF THEO TỪNG PHÒNG BỆNH (PDFMAKE ENGINE - MULTI-PAGE)
        // ============================================================
        function exportSchedulePDF() {
            if (typeof pdfMake === 'undefined') {
                return alert("Thư viện pdfmake đang được nạp, vui lòng thử lại sau 1-2 giây!");
            }

            const safeSched = (window.currentScheduleData || []).map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            const activeDateVal = (document.getElementById('schedule-date')?.value) || (safeSched[0]?.ngay) || '';
            let displayDate = activeDateVal ? activeDateVal.split('-').reverse().join('/') : new Date().toLocaleDateString('vi-VN');

            if (!safeSched.length) {
                return alert("Chưa có dữ liệu lịch trình để xuất PDF!");
            }

            // 1. Phân nhóm ca thủ thuật theo từng Phòng bệnh
            const roomMap = {};
            safeSched.forEach(row => {
                const roomName = String(row.phong || 'Chưa phân phòng').trim();
                if (!roomMap[roomName]) roomMap[roomName] = [];
                roomMap[roomName].push(row);
            });

            // 2. Sắp xếp danh sách trong từng phòng: BỆNH NHÂN RA VIỆN LÊN ĐẦU TIÊN
            const roomNames = Object.keys(roomMap).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

            roomNames.forEach(rName => {
                roomMap[rName].sort((a, b) => {
                    const dA = !!a.__isDischarged;
                    const dB = !!b.__isDischarged;
                    if (dA !== dB) return dA ? -1 : 1; // 🏃 Ra viện luôn luôn lên đầu tiên
                    const tA = String(a.gioDienRa || '');
                    const tB = String(b.gioDienRa || '');
                    if (tA !== tB) return tA.localeCompare(tB);
                    return String(a.tenBN || '').localeCompare(String(b.tenBN || ''), 'vi');
                });
            });

            // 3. Xây dựng nội dung tài liệu PDF với mỗi phòng bắt đầu trên trang mới
            const content = [];

            roomNames.forEach((rName, rIdx) => {
                const roomRows = roomMap[rName];
                const dischargedCount = roomRows.filter(r => r.__isDischarged).length;

                // Bảng dữ liệu của riêng phòng này (không có cột Giường)
                const bodyTable = [
                    [
                        { text: 'STT', style: 'tableHeader', alignment: 'center' },
                        { text: 'Tên Bệnh Nhân', style: 'tableHeader' },
                        { text: 'Năm Sinh', style: 'tableHeader', alignment: 'center' },
                        { text: 'Thủ Thuật', style: 'tableHeader' },
                        { text: 'Bắt Đầu', style: 'tableHeader', alignment: 'center' },
                        { text: 'Kết Thúc', style: 'tableHeader', alignment: 'center' },
                        { text: 'KTV / Bác Sĩ', style: 'tableHeader' },
                        { text: 'Máy Móc', style: 'tableHeader' }
                    ]
                ];

                roomRows.forEach((row, idx) => {
                    let tenBN = String(row.tenBN || '').trim();
                    const isRV = !!row.__isDischarged;
                    if (isRV) {
                        tenBN += ' (RV)';
                    }

                    bodyTable.push([
                        { text: String(idx + 1), alignment: 'center', fontSize: 9 },
                        { text: tenBN, bold: isRV, color: isRV ? '#7c3aed' : '#1e293b', fontSize: 9.5 },
                        { text: String(row.namSinh || ''), alignment: 'center', fontSize: 9 },
                        { text: String(row.thuThuat || ''), fontSize: 9 },
                        { text: String(row.gioDienRa || ''), alignment: 'center', bold: true, color: '#059669', fontSize: 9 },
                        { text: String(row.gioKetThuc || ''), alignment: 'center', fontSize: 9 },
                        { text: String(row.nvChinh || ''), bold: true, fontSize: 9 },
                        { text: String(row.may || '--'), fontSize: 8.5 }
                    ]);
                });

                // Mỗi phòng từ phòng thứ 2 trở đi sẽ tự động sang trang mới
                const roomSection = [
                    {
                        columns: [
                            {
                                width: '*',
                                text: [
                                    { text: (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2').toUpperCase() + '\n', bold: true, fontSize: 9.5 },
                                    { text: 'KHOA YHCT - PHỤC HỒI CHỨC NĂNG', bold: true, fontSize: 10.5, color: '#1e3d2b' }
                                ]
                            },
                            {
                                width: 'auto',
                                text: `Ngày thực hiện: ${displayDate}`,
                                alignment: 'right',
                                italics: true,
                                fontSize: 9.5,
                                color: '#475569'
                            }
                        ]
                    },
                    {
                        text: `BẢNG LỊCH TRÌNH ĐIỀU TRỊ THỦ THUẬT - ${rName.toUpperCase()}`,
                        style: 'mainHeader',
                        alignment: 'center',
                        margin: [0, 4, 0, 8]
                    },
                    {
                        table: {
                            headerRows: 1,
                            widths: [24, 155, 48, 165, 48, 48, 120, '*'],
                            body: bodyTable
                        },
                        layout: {
                            fillColor: function (rowIndex) {
                                if (rowIndex === 0) return '#e8f8f5';
                                const isDischargedRow = roomRows[rowIndex - 1] && roomRows[rowIndex - 1].__isDischarged;
                                if (isDischargedRow) return '#f5eef8'; // Highlight tím nhạt cho BN ra viện
                                return rowIndex % 2 === 0 ? '#fcfcfc' : null;
                            },
                            hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 1.5 : 1,
                            vLineWidth: () => 0.5,
                            hLineColor: () => '#000000',
                            vLineColor: () => '#cbd5e1'
                        }
                    },
                    {
                        margin: [0, 6, 0, 0],
                        text: `Tổng số: ${roomRows.length} ca thủ thuật ${dischargedCount > 0 ? '(' + dischargedCount + ' ca RV)' : ''}`,
                        italic: true,
                        fontSize: 9,
                        color: '#64748b'
                    }
                ];

                if (rIdx > 0) {
                    roomSection[0].pageBreak = 'before';
                }

                content.push(...roomSection);
            });

            const docDefinition = {
                pageSize: 'A4',
                pageOrientation: 'landscape',
                pageMargins: [20, 15, 20, 15],
                content: content,
                styles: {
                    mainHeader: { fontSize: 13, bold: true, color: '#1e3d2b' },
                    tableHeader: { bold: true, fontSize: 9.5, color: '#1e3d2b' }
                },
                defaultStyle: {
                    font: 'Roboto'
                }
            };

            try {
                pdfMake.createPdf(docDefinition).download(`Lich_ThuThuat_TheoPhong_${displayDate.replace(/\//g, '-')}.pdf`);
                if (typeof showToast === 'function') showToast("📄 Đang tải file PDF lịch trình theo từng phòng...");
            } catch (e) {
                console.error("Lỗi xuất PDF:", e);
                alert("Lỗi xuất PDF: " + e.message);
            }
        }
        window.exportSchedulePDF = exportSchedulePDF;

        // ============================================================
        // ⏱️ CHẾ ĐỘ XEM TIMELINE Y TẾ (MEDICAL RESOURCE TIMELINE)
        // ============================================================
        let timelineGroupBy = 'room'; // 'room' | 'staff'
        let timelineShift = 'all';    // 'all' | 'morning' | 'afternoon'

        function setTimelineGroupBy(groupBy) {
            timelineGroupBy = groupBy;
            const btnRoom = document.getElementById('btn-tl-room');
            const btnStaff = document.getElementById('btn-tl-staff');
            if (btnRoom) btnRoom.className = `timeline-btn-pill ${groupBy === 'room' ? 'active' : ''}`;
            if (btnStaff) btnStaff.className = `timeline-btn-pill ${groupBy === 'staff' ? 'active' : ''}`;
            renderScheduleGanttTimeline();
        }
        window.setTimelineGroupBy = setTimelineGroupBy;

        function setTimelineShift(shift) {
            timelineShift = shift;
            const btnAll = document.getElementById('btn-tl-all');
            const btnMorn = document.getElementById('btn-tl-morning');
            const btnAft = document.getElementById('btn-tl-afternoon');
            if (btnAll) btnAll.className = `timeline-btn-pill ${shift === 'all' ? 'active' : ''}`;
            if (btnMorn) btnMorn.className = `timeline-btn-pill ${shift === 'morning' ? 'active' : ''}`;
            if (btnAft) btnAft.className = `timeline-btn-pill ${shift === 'afternoon' ? 'active' : ''}`;
            renderScheduleGanttTimeline();
        }
        window.setTimelineShift = setTimelineShift;

        function toggleScheduleViewMode(mode) {
            const tableWrap = document.querySelector('.schedule-table-wrap');
            const ganttWrap = document.getElementById('schedule-gantt-wrap');
            const btnTable = document.getElementById('btn-view-table');
            const btnGantt = document.getElementById('btn-view-gantt');

            if (mode === 'gantt') {
                if (tableWrap) tableWrap.style.display = 'none';
                if (ganttWrap) ganttWrap.style.display = 'flex';
                if (btnTable) { btnTable.className = 'btn-secondary'; }
                if (btnGantt) { btnGantt.className = 'btn-success'; }
                renderScheduleGanttTimeline();
            } else {
                if (tableWrap) tableWrap.style.display = 'block';
                if (ganttWrap) ganttWrap.style.display = 'none';
                if (btnTable) { btnTable.className = 'btn-success'; }
                if (btnGantt) { btnGantt.className = 'btn-secondary'; }
            }
        }
        window.toggleScheduleViewMode = toggleScheduleViewMode;

        function renderScheduleGanttTimeline() {
            const target = document.getElementById('schedule-gantt-target');
            if (!target) return;

            const safeSched = (window.currentScheduleData || []).map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            const totalBadge = document.getElementById('timeline-total-badge');
            if (totalBadge) totalBadge.innerText = `${safeSched.length} ca`;

            if (!safeSched.length) {
                target.innerHTML = `
                    <div style="padding: 50px 20px; text-align: center; color: #94a3b8;">
                        <div style="font-size: 40px; margin-bottom: 10px;">📅</div>
                        <h4 style="margin: 0; color: #475569; font-size: 16px;">Chưa có dữ liệu lịch trình hôm nay</h4>
                        <p style="margin: 6px 0 0 0; font-size: 13px;">Vui lòng bấm nút <b>"CHẠY XẾP LỊCH TỔNG"</b> để khởi tạo dòng thời gian.</p>
                    </div>
                `;
                return;
            }

            // Bộ lọc tìm kiếm mờ thông minh tiếng Việt (Fuse.js)
            const searchQuery = String(document.getElementById('schedule-search-input')?.value || '').trim();
            let schedData = safeSched;
            if (searchQuery) {
                schedData = fuzzySearchList(safeSched, searchQuery, ['tenBN', 'phong', 'nvChinh', 'nvPhu', 'thuThuat', 'may', 'giuong']);
            }

            // Cấu hình khung giờ và độ rộng mỗi slot (30 phút)
            let slotTicks = [];
            let slotWidth = 95; // px mỗi 30 phút
            let morningSlotCount = 8; // 07:30, 08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00 (kết thúc 11:30)
            let afternoonSlotCount = 7; // 13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00 (kết thúc 16:30)
            let totalCanvasWidth = 0;

            if (timelineShift === 'morning') {
                slotTicks = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];
                slotWidth = 130;
                totalCanvasWidth = slotTicks.length * slotWidth;
            } else if (timelineShift === 'afternoon') {
                slotTicks = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
                slotWidth = 140;
                totalCanvasWidth = slotTicks.length * slotWidth;
            } else {
                slotTicks = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
                slotWidth = 95;
                totalCanvasWidth = slotTicks.length * slotWidth;
            }

            // Hàm chuyển đổi giờ HH:MM sang phút
            function timeToMinutes(tStr) {
                if (!tStr || !tStr.includes(':')) return 0;
                const p = tStr.split(':');
                return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
            }

            // Hàm tính toán pixel Left và Width chính xác
            function calcCardPixel(startMin, endMin) {
                if (timelineShift === 'morning') {
                    if (startMin >= 690 || endMin <= 450) return null;
                    const s = Math.max(450, startMin);
                    const e = Math.min(690, endMin);
                    const left = ((s - 450) / 30) * slotWidth;
                    const width = Math.max(65, ((e - s) / 30) * slotWidth - 3);
                    return { left, width };
                } else if (timelineShift === 'afternoon') {
                    if (startMin >= 990 || endMin <= 780) return null;
                    const s = Math.max(780, startMin);
                    const e = Math.min(990, endMin);
                    const left = ((s - 780) / 30) * slotWidth;
                    const width = Math.max(65, ((e - s) / 30) * slotWidth - 3);
                    return { left, width };
                } else {
                    // Cả ngày
                    if (startMin < 690) {
                        const s = Math.max(450, startMin);
                        const e = Math.min(690, endMin);
                        const left = ((s - 450) / 30) * slotWidth;
                        const width = Math.max(55, ((e - s) / 30) * slotWidth - 3);
                        return { left, width };
                    } else if (startMin >= 750) {
                        const s = Math.max(780, startMin);
                        const e = Math.min(990, endMin);
                        const morningWidth = morningSlotCount * slotWidth;
                        const left = morningWidth + ((s - 780) / 30) * slotWidth;
                        const width = Math.max(55, ((e - s) / 30) * slotWidth - 3);
                        return { left, width };
                    }
                    return null;
                }
            }

            // Gom nhóm theo Phòng hoặc Nhân Viên
            const groups = {};
            schedData.forEach(row => {
                let key = '';
                if (timelineGroupBy === 'staff') {
                    key = String(row.nvChinh || 'Chưa gán KTV').trim();
                } else {
                    key = String(row.phong || 'Chưa phân phòng').trim();
                }
                if (!groups[key]) groups[key] = [];
                groups[key].push(row);
            });

            const groupKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

            // Xây dựng Header Bảng
            let html = `
                <div class="timeline-board">
                    <div class="timeline-board-header">
                        <div class="timeline-res-col-hdr">
                            ${timelineGroupBy === 'room' ? '🏥 PHÒNG / GIƯỜNG' : '👨‍⚕️ NHÂN SỰ / KTV'}
                        </div>
                        <div class="timeline-slots-hdr" style="width: ${totalCanvasWidth}px;">
            `;

            slotTicks.forEach(tick => {
                html += `<div class="timeline-slot-tick" style="width: ${slotWidth}px; min-width: ${slotWidth}px;">${tick}</div>`;
            });

            html += `</div></div>`; // Đóng timeline-slots-hdr và timeline-board-header

            // Xây dựng từng hàng dữ liệu với thuật toán xếp Lane
            groupKeys.forEach(gKey => {
                const rows = groups[gKey];
                const rvCount = rows.filter(r => r.__isDischarged).length;

                // Sắp xếp các ca theo giờ bắt đầu tăng dần
                rows.sort((a, b) => timeToMinutes(a.gioDienRa) - timeToMinutes(b.gioDienRa));

                // Thuật toán Lane Packing chống đè thẻ
                const lanes = [];
                const packedCards = [];

                rows.forEach(row => {
                    const sMin = timeToMinutes(row.gioDienRa);
                    const eMin = timeToMinutes(row.gioKetThuc);
                    if (!sMin || !eMin) return;

                    const pos = calcCardPixel(sMin, eMin);
                    if (!pos) return;

                    let assignedLane = -1;
                    for (let l = 0; l < lanes.length; l++) {
                        if (lanes[l] <= sMin) {
                            assignedLane = l;
                            lanes[l] = eMin;
                            break;
                        }
                    }
                    if (assignedLane === -1) {
                        assignedLane = lanes.length;
                        lanes.push(eMin);
                    }

                    packedCards.push({
                        row,
                        left: pos.left,
                        width: pos.width,
                        lane: assignedLane
                    });
                });

                const totalLanes = Math.max(1, lanes.length);
                const trackHeight = totalLanes * 40 + 8;
                const safeGKey = sanitizeInput(gKey);

                html += `
                    <div class="timeline-board-row">
                        <div class="timeline-res-side">
                            <div class="timeline-resource-name" title="${safeGKey}">${timelineGroupBy === 'room' ? '🏥 ' : '👨‍⚕️ '}${safeGKey}</div>
                            <div style="display:flex; gap:4px; flex-wrap:wrap;">
                                <span class="timeline-resource-badge">${packedCards.length} ca</span>
                                ${rvCount > 0 ? `<span class="timeline-resource-badge" style="background:#f5eef8; color:#7c3aed; font-weight:700;">${rvCount} RV</span>` : ''}
                            </div>
                        </div>
                        <div class="timeline-track-canvas" style="width: ${totalCanvasWidth}px; min-width: ${totalCanvasWidth}px; height: ${trackHeight}px;">
                            <div class="timeline-grid-lines">
                `;

                // Vạch kẻ dọc mỗi 30 phút
                slotTicks.forEach(() => {
                    html += `<div class="timeline-grid-tick-line" style="width: ${slotWidth}px; min-width: ${slotWidth}px;"></div>`;
                });

                html += `</div>`; // Đóng timeline-grid-lines

                // Đường phân cách giờ nghỉ trưa (nếu xem cả ngày)
                if (timelineShift === 'all') {
                    const morningBoundary = morningSlotCount * slotWidth;
                    html += `<div class="timeline-lunch-divider" style="left: ${morningBoundary}px;" title="Nghỉ trưa (11:30 - 13:00)"></div>`;
                }

                // Render từng Card với tọa độ Left, Width và Top (theo Lane)
                packedCards.forEach(item => {
                    const r = item.row;
                    const topPx = 4 + item.lane * 40;
                    const isRV = !!r.__isDischarged;
                    const isYHCT = String(r.thuThuat || '').toLowerCase().includes('châm') || String(r.thuThuat || '').toLowerCase().includes('xoa bóp') || String(r.thuThuat || '').toLowerCase().includes('cấy chỉ') || String(r.thuThuat || '').toLowerCase().includes('giác');
                    
                    let cardClass = isRV ? 'timeline-card-rv' : (isYHCT ? 'timeline-card-yhct' : 'timeline-card-phcn');

                    const safeTenBN = sanitizeInput(r.tenBN);
                    const safeThuThuat = sanitizeInput(r.thuThuat);
                    const safePhong = sanitizeInput(r.phong || '');
                    const safeGiuong = sanitizeInput(r.giuong || '');
                    const safeNV = sanitizeInput(r.nvChinh || '');
                    const safeNVPhu = sanitizeInput(r.nvPhu || '');
                    const safeMay = sanitizeInput(r.may || '');

                    const tooltipText = `Bệnh nhân: ${safeTenBN} (${r.namSinh || ''})&#10;Thủ thuật: ${safeThuThuat}&#10;Thời gian: ${r.gioDienRa} - ${r.gioKetThuc}&#10;Phòng: ${safePhong} | Giường: ${safeGiuong}&#10;KTV: ${safeNV} ${safeNVPhu ? '(Phụ: ' + safeNVPhu + ')' : ''}&#10;Máy: ${safeMay}`;

                    html += `
                        <div class="timeline-card ${cardClass}" 
                             style="left: ${item.left}px; width: ${item.width}px; top: ${topPx}px;"
                             title="${tooltipText}">
                            <div class="timeline-card-title">
                                <span style="overflow:hidden; text-overflow:ellipsis;">${safeTenBN}</span>
                                ${isRV ? '<span class="rv-badge">RV</span>' : ''}
                            </div>
                            <div class="timeline-card-sub">
                                <span>${safeThuThuat} • ${r.gioDienRa}-${r.gioKetThuc}${safeGiuong ? ' • G.' + safeGiuong : ''}</span>
                            </div>
                        </div>
                    `;
                });

                html += `</div></div>`; // Đóng timeline-track-canvas và timeline-board-row
            });

            html += `</div>`; // Đóng timeline-board
            target.innerHTML = html;
        }
        window.renderScheduleGanttTimeline = renderScheduleGanttTimeline;



        function importScheduleFile() {

            const input = document.createElement('input');

            input.type = 'file';

            input.accept = '.xlsx,.xls';

            input.onchange = ev => {

                const file = ev.target.files?.[0];

                if (!file) return;

                const reader = new FileReader();

                reader.onload = e => {

                    try {

                        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });

                        const sheet = workbook.Sheets[workbook.SheetNames[0]];

                        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                        const headerIndex = rows.findIndex(r => r.some(c => String(c).toLowerCase().includes('bệnh nhân') || String(c).toLowerCase().includes('benh nhan')));

                        if (headerIndex < 0) throw new Error('Không tìm thấy dòng tiêu đề trong file lịch.');



                        const headers = rows[headerIndex].map(h => xoaDau(String(h || '').toLowerCase()).replace(/\s+/g, ' ').trim());

                        const col = keys => {

                            const normalizedKeys = keys.map(k => xoaDau(k.toLowerCase()));

                            return headers.findIndex(h => normalizedKeys.some(k => h.includes(k)));

                        };

                        const idx = {

                            ngay: col(['ngay']),

                            ten: col(['ten benh nhan', 'ten bn', 'hoten']),

                            ns: col(['nam sinh', 'namsinh']),

                            phong: col(['phong']),

                            tt: col(['thu thuat', 'dich vu', 'dichvu']),

                            bd: col(['bat dau', 'gio dien ra', 'giodienra']),

                            kt: col(['ket thuc', 'gioketthuc']),

                            nvChinh: col(['nv chinh', 'nhan vien chinh']),

                            nvPhu: col(['nv phu']),

                            may: col(['may']),

                            giuong: col(['giuong']),

                            status: col(['trang thai', 'ghi chu'])

                        };

                        if (idx.ten < 0 || idx.tt < 0) throw new Error('File không đúng cấu trúc lịch đã xuất.');



                        const scheduled = [], dropped = [];

                        rows.slice(headerIndex + 1).forEach(r => {

                            if (!r || !r.some(c => String(c).trim())) return;

                            const row = {

                                ngay: idx.ngay >= 0 ? r[idx.ngay] : "",

                                tenBN: idx.ten >= 0 ? String(r[idx.ten] || "").replace(/\s*\((?:✔ RV|❌ Rớt|RV|Rớt)\)/gi, "").trim() : "",

                                namSinh: idx.ns >= 0 ? r[idx.ns] : "",

                                phong: idx.phong >= 0 ? r[idx.phong] : "",

                                thuThuat: idx.tt >= 0 ? r[idx.tt] : "",

                                gioDienRa: idx.bd >= 0 ? r[idx.bd] : "",

                                gioKetThuc: idx.kt >= 0 ? r[idx.kt] : "",

                                nvChinh: idx.nvChinh >= 0 ? r[idx.nvChinh] : "",

                                nvPhu: idx.nvPhu >= 0 ? r[idx.nvPhu] : "",

                                may: idx.may >= 0 ? r[idx.may] : "",

                                giuong: idx.giuong >= 0 ? r[idx.giuong] : ""

                            };

                            const statusText = idx.status >= 0 ? String(r[idx.status] || "") : "";

                            const statusLower = statusText.toLowerCase();

                            const isDropped = String(row.gioDienRa || "").includes("Rớt") || statusLower.includes("không xếp") || statusLower.includes("rớt");

                            if (isDropped) {

                                // Sử dụng chuỗi để tránh làm parser ngoặc nhầm lẫn

                                const regLydo = new RegExp("^.*Lý do:\\s*", "i");

                                const regEnd = new RegExp("[)]+$", "");

                                dropped.push(normalizeDroppedItem({

                                    ngay: row.ngay, bn: row.tenBN, ns: row.namSinh, room: row.phong,

                                    tt: row.thuThuat, staff: row.nvChinh, reason: statusText.replace(regLydo, "").replace(regEnd, "") || row.may || "Ca rớt trong file cũ"

                                }));

                            } else {

                                scheduled.push(row);

                            }

                        });



                        window.currentScheduleData = markDischargedInSchedule(scheduled);

                        window.lastUnscheduledData = dropped;

                        window.currentRotData = dropped;

                        window.viewingImportedScheduleFile = true;

                        filterSchedule();

                    } catch (err) {

                        alert('Lỗi: ' + err.message);

                    }

                };

                reader.readAsArrayBuffer(file);

            };

            input.click();

        }





        function callChotSo() {
            showCustomConfirm("Chốt sổ?", "Bạn có chắc chắn muốn chốt sổ ngày hôm nay?", function () {
                const btn = document.getElementById('btn-chot-so');
                btn.innerText = '⏳ Đang xử lý...'; btn.disabled = true;
                window._chotSoDone = false;

                if (window.showGlobalLoading) window.showGlobalLoading("Đang thực hiện chốt sổ ngày cũ và mở sổ ngày mới...");

                callApi('chuyenNgayMoi', [], res => {
                    // Xóa toàn bộ cache phía client để tải lại dữ liệu mới
                    window.currentScheduleData = [];
                    window.lastUnscheduledData = [];
                    window.currentRotData = [];
                    if (window.dataCache) window.dataCache = {};
                    if (window.dataCacheTime) window.dataCacheTime = {};
                    if (window._historyCache) window._historyCache = {};
                    localStorage.removeItem('meds_success');
                    localStorage.removeItem('meds_schedule_date');
                    localStorage.removeItem('meds_unscheduled');
                    sessionStorage.setItem('chot_so_success_toast', 'true');
                    if (window.hideGlobalLoading) window.hideGlobalLoading();
                    location.reload();
                }, err => {
                    if (window.hideGlobalLoading) window.hideGlobalLoading();
                    alert("Lỗi chốt sổ: " + (typeof err === 'string' ? err : (err && err.message) || JSON.stringify(err)));
                    btn.innerText = '📋 Chốt sổ';
                    btn.disabled = false;
                });
            });
        }


        window._historyCache = window._historyCache || {};
        // Backup/restore dataCache khi chuyển sang chế độ xem lịch cũ
        window._liveDataCacheBackup = null;

        function applyHistoryDataToTabs(fullData, dateStr) {
            // Backup cache hiện tại nếu chưa backup
            if (!window._liveDataCacheBackup) {
                window._liveDataCacheBackup = {
                    pat: JSON.parse(JSON.stringify(dataCache.pat || [])),
                    staff: JSON.parse(JSON.stringify(dataCache.staff || []))
                };
            }

            // Build dataCache.pat từ dữ liệu lịch sử (unique patients)
            const histPat = (fullData.patients || []).map(p => ({
                ten: p.tenBN, namSinh: p.namSinh, phong: p.phong,
                thuThuat: Array.isArray(p.dsThuThuat) ? p.dsThuThuat.join(', ') : String(p.dsThuThuat || p.thuThuat || ''),
                ngayVao: '', gioVao: '',
                gioBan: (fullData.patBusy || []).find(pb => pb.tenBN === p.tenBN && pb.namSinh === p.namSinh)
                    ?.slots.map(s => s.from + '-' + s.to).join(', ') || '',
                gioRa: '', index: 0, sheetIndex: 0
            }));
            dataCache.pat = histPat;

            // Build dataCache.staff từ dữ liệu lịch sử (giờ bận = giờ làm thủ thuật ngày đó, đã gộp)
            const histStaff = (fullData.staffBusy || []).map(s => ({
                ten: s.ten,
                gioBan: s.slots.map(sl => sl.from + '-' + sl.to).join(', '),
                vaiTro: '', trangThai: 'Đi làm', kyNang: '', index: 0, sheetIndex: 0
            }));
            // Gộp các slot trùng nhau cho cùng 1 nhân viên
            histStaff.forEach(s => {
                const unique = [...new Set(s.gioBan.split(',').map(x => x.trim()).filter(x => x))];
                s.gioBan = unique.join(', ');
            });
            dataCache.staff = histStaff;

            // Cập nhật header trạng thái lịch cũ
            const parts = dateStr.split('-');
            const ngayHT = parts.length === 3 ? parts[2] + '/' + parts[1] + '/' + parts[0] : dateStr;
            document.title = 'Lịch Cũ – ' + ngayHT;

            // Render lại các tab
            if (typeof renderPatientsTable === 'function') renderPatientsTable(true);
            if (typeof renderBusyPat === 'function') renderBusyPat();
            if (typeof renderBusyStaff === 'function') renderBusyStaff();
        }

        function restoreHistoryTabs() {
            if (!window._liveDataCacheBackup) return;
            dataCache.pat = window._liveDataCacheBackup.pat;
            dataCache.staff = window._liveDataCacheBackup.staff;
            window._liveDataCacheBackup = null;
            document.title = 'T.I.M.E.S System - Phần mềm xếp lịch thủ thuật thông minh';
            if (typeof renderPatientsTable === 'function') renderPatientsTable(true);
            if (typeof renderBusyPat === 'function') renderBusyPat();
            if (typeof renderBusyStaff === 'function') renderBusyStaff();
            // Xóa panel cũ nếu còn
            const old = document.getElementById('history-detail-panel');
            if (old) old.remove();
        }

        function xemLichSu() {
            const d = document.getElementById('history-date').value;
            if (!d) return window.showToast ? window.showToast("Vui lòng chọn ngày!", "error") : alert("Chọn ngày!");

            const dp = document.getElementById('dashboard-date-filter');
            if (dp && dp.value !== d) {
                dp.value = d;
                const displayEl = document.getElementById('display-date');
                if (displayEl) displayEl.textContent = d.split('-').reverse().join('/');
            }

            window._forceHistoryMode = true;

            if (typeof loadDashboard === 'function') {
                loadDashboard();
            }
        }

        // --- Tiện ích Tìm rảnh ---

        window.externalUtilsData = null;

        window._patientTypeFilter = 'all';
        window.setPatientTypeFilter = function(type) {
            window._patientTypeFilter = type;
            document.querySelectorAll('.btn-filter-pat-type').forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            });
            let activeBtnId = 'btn-filter-all';
            if (type === 'NoiTru') activeBtnId = 'btn-filter-noitru';
            else if (type === 'NgoaiTru') activeBtnId = 'btn-filter-ngoaitru';
            const activeBtn = document.getElementById(activeBtnId);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
            renderPatientsTable();
        };

        window.togglePatSessionSelect = function() {
            const sessionGroup = document.getElementById('pat-session-group');
            if (sessionGroup) {
                sessionGroup.style.display = 'none'; // Ẩn hoàn toàn theo yêu cầu của bác sĩ
                const buoiSelect = document.getElementById('pat-buoi-dieu-tri');
                if (buoiSelect) buoiSelect.value = 'TuDong'; // Luôn luôn là Tự động
            }
        };

        function handleUtilsFile(e) {

            const file = e.target.files[0];

            if (!file) return;

            const reader = new FileReader();

            reader.onload = function (ev) {

                try {

                    const workbook = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });

                    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

                    window.externalUtilsData = jsonData.slice(1).map(r => ({ thuThuat: r[0], gioDienRa: r[1], gioKetThuc: r[2], nvChinh: r[3], nvPhu: '', may: r[4] }));

                    alert("Đã nạp file thành công!");

                } catch (err) { alert("Lỗi đọc file: " + err.message); }

            };

            reader.readAsArrayBuffer(file);

        }



        window.loadTimRanhDataFromServer = function () {

            const statusEl = document.getElementById('utils-file-status');

            if (statusEl) {

                statusEl.innerText = "⏳ Đang kết nối máy chủ để lấy dữ liệu Tìm Rảnh chung...";

                statusEl.style.color = "#f39c12";

            }



            google.script.run.withSuccessHandler(function (data) {

                if (data && data.length > 0) {

                    window.externalUtilsData = data;

                    if (statusEl) {

                        statusEl.innerText = `✅ Đã tải ${data.length} ca dùng chung từ máy chủ (Sheet TimRanh)!`;

                        statusEl.style.color = "#27ae60";

                    }

                } else if (statusEl) {

                    statusEl.innerText = "(Chưa có dữ liệu chung. Đang dùng: Lịch phần mềm xếp)";

                    statusEl.style.color = "#e67e22";

                }

            }).getTimRanhData();

        };

        function taiLichTheoNgay() {
            var dateEl = document.getElementById('utils-search-date');
            var date = dateEl ? dateEl.value : '';
            if (!date) return alert('Vui lòng chọn ngày!');
            var statusEl = document.getElementById('utils-lich-status');
            var btn = document.getElementById('btn-tai-lich-utils');

            var handleSuccess = function (sched) {
                window.utilsScheduleData = sched;
                window.utilsScheduleDate = date;
                var dd = date.split('-').reverse().join('/');
                if (statusEl) {
                    if (sched.length > 0) {
                        statusEl.innerText = '✅ Ngày ' + dd + ': ' + sched.length + ' ca. Có thể Tìm rảnh!';
                        statusEl.style.color = '#27ae60';
                    } else {
                        statusEl.innerText = '⚠️ Ngày ' + dd + ' chưa có lịch.';
                        statusEl.style.color = '#e67e22';
                    }
                }
                if (btn) { btn.disabled = false; btn.innerText = '📊 Xem Lịch'; }
            };

            if (window._systemActiveYMD && date === window._systemActiveYMD) {
                if (statusEl) { statusEl.innerText = '⏳ Đang nạp lịch hiện tại...'; statusEl.style.color = '#3498db'; }
                setTimeout(() => handleSuccess(window.currentScheduleData || []), 100);
                return;
            }

            if (statusEl) { statusEl.innerText = '⏳ Đang tải...'; statusEl.style.color = '#f39c12'; }
            if (btn) { btn.disabled = true; btn.innerText = '⏳ Đang tải...'; }
            google.script.run
                .withSuccessHandler(function (data) {
                    var sched = (data && data.schedule) ? data.schedule : (Array.isArray(data) ? data : []);
                    handleSuccess(sched);
                })
                .withFailureHandler(function (err) {
                    if (statusEl) { statusEl.innerText = '❌ Lỗi tải dữ liệu!'; statusEl.style.color = '#c0392b'; }
                    if (btn) { btn.disabled = false; btn.innerText = '📊 Xem Lịch'; }
                    console.error('taiLichTheoNgay error:', err);
                })
                .getHistoryFullData(date);
        }





        // Chạy luôn hàm tải dữ liệu ngay khi mở web

        document.addEventListener('DOMContentLoaded', window.loadTimRanhDataFromServer);



        function filterDoctorTable() {
            var input = document.getElementById("filter-doc-name").value.toLowerCase();
            var tbody = document.getElementById("free-doc-list");
            var trs = tbody.getElementsByTagName("tr");
            for (var i = 0; i < trs.length; i++) {
                var td = trs[i].getElementsByTagName("td")[0];
                if (td) {
                    var txtValue = td.textContent || td.innerText;
                    if (txtValue.toLowerCase().indexOf(input) > -1) {
                        trs[i].style.display = "";
                    } else {
                        trs[i].style.display = "none";
                    }
                }
            }
        }

        function timBacSiRanh() {
            let previousSelection = "";
            if (document.getElementById('filter-doc-name')) {
                previousSelection = document.getElementById('filter-doc-name').value;
            }

            // Bắt buộc chọn ngày (Phương án B)
            const searchDate = document.getElementById('utils-search-date')?.value || '';
            if (!searchDate) return alert("Vui lòng chọn Ngày cần tìm ở trên trước!");

            if (!window.utilsScheduleData || !window.utilsScheduleData.length) return alert("Vui lòng bấm '📊 Xem Lịch' trước để tải lịch ngày " + searchDate.split('-').reverse().join('/') + " rồi mới tìm!");

            const vao_str = document.getElementById('search-doc-time').value;

            if (!vao_str) return alert("Vui lòng nhập 'Giờ cần tìm' (VD: 14:00)!");

            let sourceData = window.utilsScheduleData;

            const t_vao = t2m(vao_str);

            const tbody = document.getElementById('free-doc-list');

            tbody.innerHTML = '';

            let found = false;

            const docs = dataCache.staff.filter(s => {

                const vt = String(s.vaiTro).toLowerCase();

                return (vt.includes('bác sĩ') || vt.includes('kỹ thuật viên') || vt.includes('ktv')) && s.trangThai !==

                    'Nghỉ cả ngày';

            });

            docs.forEach(doc => {

                let busy = [];

                sourceData.forEach(row => {

                    const nvChinh = String(row.nvChinh || row[7] || '').trim().toLowerCase();

                    const nvPhu = String(row.nvPhu || row[8] || '').trim().toLowerCase();

                    const dName = String(doc.ten).trim().toLowerCase();

                    if (nvChinh !== dName && nvPhu !== dName) return;

                    const tStart = t2m(row.gioDienRa || row[5]), tEnd = t2m(row.gioKetThuc || row[6]);

                    const thuThuat = String(row.thuThuat || row[4] || '').trim().toLowerCase();

                    const procInfo = dataCache.proc?.find(p =>

                        p.ten.toLowerCase() === thuThuat ||

                        (p.vietTat && p.vietTat.toLowerCase() === thuThuat)

                    );



                    const tgNhanVien = procInfo && procInfo.thoiGianThucHien ? parseInt(procInfo.thoiGianThucHien) : Math.min(5,

                        tEnd - tStart);

                    const khoangCachRaw = procInfo && procInfo.khoangCach ? parseInt(procInfo.khoangCach) : tgNhanVien;

                    const khoangCach = Math.max(khoangCachRaw, tgNhanVien + 1);



                    busy.push([tStart, tStart + khoangCach]);

                    if (tEnd > tStart + tgNhanVien) {

                        busy.push([tEnd, tEnd + 1]);

                    }

                });

                if (doc.gioBan) doc.gioBan.split(',').forEach(b => {
                    const pts = b.split('-'); if (pts.length === 2)

                        busy.push([t2m(pts[0].trim()), t2m(pts[1].trim()) + 1]);
                });

                busy.sort((a, b) => a[0] - b[0]);

                let merged = [];

                busy.forEach(b => {

                    if (!merged.length) { merged.push(b); return; }

                    const last = merged[merged.length - 1];

                    b[0] <= last[1] ? merged[merged.length - 1] = [last[0], Math.max(last[1], b[1])] : merged.push(b);
                }); let

                    shifts = []; 
                if (doc.thoiGianLam) doc.thoiGianLam.split(',').forEach(sh => {
                    const pts = sh.split('-');
                    if (pts.length === 2) shifts.push([t2m(pts[0].trim()), t2m(pts[1].trim())]);
                });
                if (!shifts.length) shifts = [[420, 690], [780, 1014]];

                const yhctEndVal = parseInt(document.getElementById("admin-yhct-end")?.value) || 10;
                const yhctLunchVal = parseInt(document.getElementById("admin-yhct-lunch")?.value) || 10;

                shifts.forEach((sh, sIdx) => {
                    const extraMins = (sIdx === 0 && shifts.length > 1) ? yhctLunchVal : ((sIdx === shifts.length - 1) ? yhctEndVal : 0);
                    const shEndExtended = sh[1] + extraMins;
                    let curr = sh[0];

                    for (const b of merged) {
                        if (b[0] >= shEndExtended) break;

                        if (curr < b[0]) {
                            const valid_start = Math.max(curr, t_vao); 
                            if (valid_start < b[0]) {
                                const mins = b[0] - valid_start; 
                                if (mins >= 1) {
                                    tbody.innerHTML += `<tr>
                                        <td>👨‍⚕️ <b>${doc.ten}</b></td>
                                        <td>${m2t(valid_start)} - ${m2t(b[0] - 1)}</td>
                                        <td><strong style="color:#27ae60">${mins}</strong></td>
                                    </tr>`; 
                                    found = true;
                                }
                            }
                        }
                        curr = Math.max(curr, b[1]);
                    }

                    if (curr < shEndExtended) {
                        const valid_start = Math.max(curr, t_vao); 
                        if (valid_start < shEndExtended) {
                            const mins = shEndExtended - valid_start; 
                            if (mins >= 1) {
                                const noteOvertime = extraMins > 0 ? ` <span style="font-size:11px; color:#e67e22; font-weight:normal;">(+${extraMins}p lố)</span>` : '';
                                tbody.innerHTML += `<tr>
                                    <td>👨‍⚕️ <b>${doc.ten}</b></td>
                                    <td>${m2t(valid_start)} - ${m2t(shEndExtended - 1)}${noteOvertime}</td>
                                    <td><strong style="color:#27ae60">${mins}</strong></td>
                                </tr>`; 
                                found = true;
                            }
                        }
                    }
                });
            });

            if (!found) {
                tbody.innerHTML = `<tr> <td colspan="3" align="center" style="color:#c0392b; font-weight:bold;">Không có Nhân sự
                                rảnh lúc này</td>
                        </tr>`;
            }

            const filterSelect = document.getElementById('filter-doc-name');
            if (filterSelect) {
                if (previousSelection) {
                    filterSelect.value = previousSelection;
                }
                filterDoctorTable();
            }
        }

        function timMayRanh() {

            // Bắt buộc chọn ngày (Phương án B)
            const searchDate = document.getElementById('utils-search-date')?.value || '';
            if (!searchDate) return alert("Vui lòng chọn Ngày cần tìm ở trên trước!");

            if (!window.utilsScheduleData || !window.utilsScheduleData.length) return alert("Vui lòng bấm '📊 Xem Lịch' trước để tải lịch ngày " + searchDate.split('-').reverse().join('/') + " rồi mới tìm!");

            const loai = document.getElementById('search-machine-type').value;

            const gio_str = document.getElementById('search-machine-time').value;

            let sourceData = window.utilsScheduleData;

            if (!loai || loai.includes("Chọn loại") || !gio_str) return alert("Vui lòng chọn Loại máy và nhập Giờ!");

            const t_vao = t2m(gio_str);

            const tbody = document.getElementById('free-machine-list');

            tbody.innerHTML = '';

            const may_thuoc_loai = (dataCache.machine || []).filter(m => {
                if (!m) return false;
                const t = String(m.tenLoai || m.ten_loai || (Array.isArray(m) ? m[1] : '') || '').trim();
                const s = m.trangThai || m.trang_thai || (Array.isArray(m) ? m[3] : '') || 'Sẵn sàng';
                return t === loai.trim() && s === 'Sẵn sàng';
            }).map(m => String(m.maMay || m.ma_may || (Array.isArray(m) ? m[2] : '') || '').trim()).filter(Boolean);

            if (!may_thuoc_loai.length) {
                tbody.innerHTML = `<tr> <td colspan="2" align="center" style="color:#c0392b; font-weight:bold;">Máy đang hỏng/bảo

                                trì hết</td>

                        </tr>`; return;
            } const m_busy = {};

            may_thuoc_loai.forEach(m => m_busy[m] = []);

            sourceData.forEach(row => {

                const rowMay = String(row.may || row[9] || '').trim().toLowerCase();

                const gVao = row.gioDienRa || row[5];

                const gRa = row.gioKetThuc || row[6];

                const mMatch = may_thuoc_loai.find(x => x.toLowerCase() === rowMay);

                if (mMatch) m_busy[mMatch].push([t2m(gVao), t2m(gRa) + 1]);

            });

            let found = false;

            may_thuoc_loai.forEach(m => {

                const busy = m_busy[m].sort((a, b) => a[0] - b[0]);

                let merged = [];

                busy.forEach(b => {

                    if (!merged.length) { merged.push(b); return; }

                    const last = merged[merged.length - 1];

                    b[0] <= last[1] ? merged[merged.length - 1] = [last[0], Math.max(last[1], b[1])] : merged.push(b);

                }); let is_free = true, free_until = 1440; for (const b of merged) {
                    if (b[0] <= t_vao && t_vao <

                        b[1]) { is_free = false; break; } if (b[1] <= t_vao) continue; if (b[0] > t_vao) free_until =

                            Math.min(free_until, b[0]);

                }

                if (is_free) {

                    tbody.innerHTML += `<tr>

                                <td><strong>${m}</strong></td>

                                <td style="color:#27ae60; font-weight:bold;">${free_until === 1440 ? "Hết ngày" : `Đến

                                    ${m2t(free_until - 1)}`}</td>

                            </tr>`;

                    found = true;

                }

            });

            if (!found) tbody.innerHTML = `<tr> <td colspan="2" align="center" style="color:#c0392b; font-weight:bold;">Hết máy rảnh

                                </td>

                            </tr>`;
        }



        // ============================================================

        // 📅 TAB 7 - THỨ 7

        // ============================================================

        let satCache = {}, t8_ns_vars = {}, satStaffIndices = {};



        function taiDsSat() {

            google.script.run.withSuccessHandler(data => {

                const frNs = document.getElementById('sat-staff-list');

                frNs.innerHTML = '';

                t8_ns_vars = {}; satStaffIndices = {};

                const isSummerVal = (document.querySelector('input[name="sat-season"]:checked')?.value ===

                    'summer');

                const s1_val = isSummerVal ? "07:00" : "07:30", s2_val = isSummerVal ? "11:30" : "12:00";

                const c1_val = "13:00", c2_val = "16:30";



                data.staff.forEach((s, idx) => {

                    const ten = s.ten;

                    t8_ns_vars[ten] = false; satStaffIndices[ten] = idx;

                    const fItem = document.createElement('div');
                    fItem.className = 'sat-staff-item';
                    fItem.style.cssText = 'margin-bottom:10px; border-bottom:1px solid #ecf0f1; padding-bottom:8px;';

                    const cbLabel = document.createElement('label');
                    cbLabel.style.cssText = 'cursor:pointer; display:flex; align-items:center; gap:8px;';

                    const cbInput = document.createElement('input');
                    cbInput.type = 'checkbox'; cbInput.style.width = '18px'; cbInput.style.height = '18px';
                    cbInput.onchange = function () {
                        t8_ns_vars[ten] = this.checked;
                        const timeDiv = document.getElementById(`sat-time-${idx}`);
                        if (timeDiv) timeDiv.style.display = this.checked ? 'block' : 'none';
                    };

                    const spanName = document.createElement('span');
                    spanName.className = 'sat-staff-name';
                    spanName.style.cssText = 'font-size:14px; font-weight:bold;';
                    spanName.innerText = ten;

                    cbLabel.append(cbInput, spanName);
                    fItem.appendChild(cbLabel);



                    const timeDiv = document.createElement('div');

                    timeDiv.id = `sat-time-${idx}`;

                    timeDiv.style.cssText = 'display:none; padding-left:25px; margin-top:5px;';

                    timeDiv.innerHTML = `

                            <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px; font-size:12px;">

                                Sáng: <input type="text" id="sat-s1-${idx}" value="${s1_val}" class="time-input"

                                    style="width:50px; padding:2px; text-align:center"> - <input type="text"

                                    id="sat-s2-${idx}" value="${s2_val}" class="time-input"

                                    style="width:50px; padding:2px; text-align:center"></div>

                            <div style="display:flex; align-items:center; gap:5px; font-size:12px;">Chiều: <input

                                    type="text" id="sat-c1-${idx}" value="${c1_val}" class="time-input"

                                    style="width:50px; padding:2px; text-align:center"> - <input type="text"

                                    id="sat-c2-${idx}" value="${c2_val}" class="time-input"

                                    style="width:50px; padding:2px; text-align:center"></div>`;

                    fItem.appendChild(timeDiv);

                    frNs.appendChild(fItem);

                });



                const frDsLeft = document.getElementById('sat-patient-list-left');
                const frDsRight = document.getElementById('sat-patient-list-right');
                frDsLeft.innerHTML = '';
                frDsRight.innerHTML = '';
                satCache = {};
                const midPoint = Math.ceil(data.patients.length / 2);

                // Sắp xếp A-Z theo tên bệnh nhân

                data.patients.sort((a, b) => (a.ten || '').localeCompare(b.ten || '', 'vi'));

                data.patients.forEach((r, pIdx) => {

                    const bn_id = "BN_" + pIdx + "_" + (r.id || "0");

                    satCache[bn_id] = { info: r, items: [], frameId: `sat-bn-${bn_id}` };

                    const fBn = document.createElement('div');
                    fBn.id = `sat-bn-${bn_id}`;
                    fBn.className = 'sat-bn-card';
                    fBn.style.cssText = 'padding:6px 10px; margin-bottom:6px; border-radius:5px; display:flex; flex-direction:column; gap:4px;';

                    const tDiv = document.createElement('div');
                    tDiv.className = 'sat-bn-header';
                    tDiv.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #ecf0f1; padding-bottom:3px;';
                    tDiv.innerHTML = `<b class="sat-bn-name" style="font-size:12px;">${pIdx + 1}. ${r.ten.toUpperCase()} (${r.namSinh})</b> <span class="sat-bn-room" style="font-size:11px; padding:1px 6px; border-radius:3px; white-space:nowrap;">P. ${r.phong}</span>`;
                    fBn.appendChild(tDiv);

                    const flexContainer = document.createElement('div');
                    flexContainer.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-top:2px;';

                    const ttDiv = document.createElement('div');
                    ttDiv.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px;';

                    (r.thuThuat ? r.thuThuat.split(',').map(x => x.trim()).filter(x => x) : []).forEach((tt, tIdx) => {
                        satCache[bn_id].items.push({ name: tt, checked: false });

                        const cb = document.createElement('label');
                        cb.style.cssText = 'font-size:12px; cursor:pointer; display:flex; align-items:center; gap:4px;'; cb.title = tt;

                        const input = document.createElement('input');
                        input.type = 'checkbox'; input.id = `cb-sat-${bn_id}-${tIdx}`;
                        input.style.cssText = 'width:13px; height:13px; margin:0;';
                        input.onchange = function () {
                            satCache[bn_id].items[tIdx].checked = this.checked;
                            updateSummarySat();
                        };

                        const tt_info = dataCache.proc?.find(p => p.ten.toLowerCase() === tt.toLowerCase());
                        const span = document.createElement('span');
                        span.className = 'sat-proc-name';
                        span.innerText = (tt_info?.vietTat) || tt;
                        span.style.cssText = 'font-weight:bold;';

                        cb.append(input, span); ttDiv.appendChild(cb);
                    });

                    const readyTimeDiv = document.createElement('div');
                    readyTimeDiv.className = 'sat-ready-time-wrap';
                    readyTimeDiv.style.cssText = 'display:flex; align-items:center; gap:5px; padding:2px 5px; border-radius:4px;';

                    const readyLabel = document.createElement('label');
                    readyLabel.className = 'sat-ready-label';
                    readyLabel.innerText = '⏱ Giờ SS:';
                    readyLabel.style.cssText = 'font-size:11px; font-weight:bold; margin:0;';

                    const readyInput = document.createElement('input');
                    readyInput.type = 'time'; readyInput.value = '07:30';
                    readyInput.className = 'input-ready-time';
                    readyInput.style.cssText = 'padding:1px 3px; border-radius:3px; font-size:12px; outline:none; cursor:pointer;';

                    readyInput.onchange = function () {
                        this.style.color = '#c0392b';
                        this.style.fontWeight = 'bold';
                        this.style.borderColor = '#c0392b';
                    };

                    readyTimeDiv.append(readyLabel, readyInput);
                    flexContainer.append(ttDiv, readyTimeDiv);
                    fBn.appendChild(flexContainer);
                    if (pIdx < midPoint) {
                        frDsLeft.appendChild(fBn);
                    } else {
                        frDsRight.appendChild(fBn);
                    }

                });

                updateSummarySat();

            }).getSatData();

        }

        function toggleSatStaff() {
            const container = document.getElementById('sat-staff-container');
            const btn = document.getElementById('btn-toggle-sat-staff');
            if (!container || !btn) return;
            if (container.style.display === 'none') {
                container.style.display = 'flex';
                btn.style.background = '#e74c3c';
                btn.innerText = '📁 Ẩn nhân sự';
            } else {
                container.style.display = 'none';
                btn.style.background = '';
                btn.innerText = '👥 Chọn nhân sự';
            }
        }

        function updateSummarySat() {
            const counts = {};
            for (const bid in satCache) satCache[bid].items.forEach(item => {
                if (item.checked)
                    counts[item.name] = (counts[item.name] || 0) + 1;
            });
            const sumDiv = document.getElementById('sat-summary');
            const sumContainer = document.getElementById('sat-summary-container');
            const total = Object.values(counts).reduce((a, b) => a + b, 0);
            if (!total) {
                if (sumContainer) sumContainer.style.display = 'none';
                sumDiv.innerHTML = '<div style="color:gray; text-align:center; margin-top:20px;">Chưa chọn thủ thuật nào.</div>';
                return;
            }
            if (sumContainer) sumContainer.style.display = 'flex';

            let html = `<div

                                style="background:#2c3e50; color:white; padding:8px; border-radius:4px; margin-bottom:10px; display:flex; justify-content:space-between;">

                                <b>TỔNG CỘNG:</b> <b style="color:#f1c40f">${total} ca</b>

                            </div>`;

            Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([tt, qty]) => {

                html += `<div

                                style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #ecf0f1;">

                                <span>• ${tt}:</span> <b style="color:#e67e22">${qty} ca</b>

                            </div>`;

            });

            sumDiv.innerHTML = html;

        }

        function _satFilter(fn) {

            const kw = document.getElementById('sat-search-bn').value.toLowerCase();

            const normalizedKw = xoaDau(kw);

            for (const bid in satCache) {

                const bn = satCache[bid].info;

                const str = `${bn.ten} ${bn.phong} ${bn.thuThuat}`.toLowerCase();

                fn(bid, str, normalizedKw, kw);

            }

        }

        function locBnSat() {

            _satFilter((bid, str, normalizedKw, kw) => {

                const display = (str.includes(kw) || xoaDau(str).includes(normalizedKw)) ? 'block' : 'none';

                document.getElementById(satCache[bid].frameId).style.display = display;

            });

        }

        function chonHetSat() {

            _satFilter((bid, str, normalizedKw, kw) => {

                if (!(str.includes(kw) || xoaDau(str).includes(normalizedKw))) return;

                const f = document.getElementById(satCache[bid].frameId);

                if (f?.style.display !== 'none') f.querySelectorAll('input[type="checkbox"]').forEach(cb => { if (!cb.checked) { cb.checked = true; cb.onchange(); } });

            });

        }

        function boChonHetSat() {

            _satFilter((bid, str, normalizedKw, kw) => {

                if (!(str.includes(kw) || xoaDau(str).includes(normalizedKw))) return;

                const f = document.getElementById(satCache[bid].frameId);

                if (f?.style.display !== 'none') f.querySelectorAll('input[type="checkbox"]').forEach(cb => { if (cb.checked) { cb.checked = false; cb.onchange(); } });

            });

        }

        function locSotSat() {

            document.getElementById('sat-search-bn').value = '';

            let count = 0;

            for (const bid in satCache) {

                const hasChecked = satCache[bid].items.some(item => item.checked);

                document.getElementById(satCache[bid].frameId).style.display = hasChecked ? 'none' :

                    'block';

                if (!hasChecked) count++;

            }

            if (!count) locBnSat();

        }

        window.chonHetSat = chonHetSat;
        window.boChonHetSat = boChonHetSat;
        window.locSotSat = locSotSat;

        function luuDsSat() {

            const data = [];

            for (const bid in satCache) {

                const chosen = satCache[bid].items.filter(item => item.checked).map(item => item.name);

                if (chosen.length > 0) {

                    const r = satCache[bid].info;

                    // Lấy giờ sẵn sàng hiện tại trên giao diện

                    const readyInput = document.querySelector(`#${satCache[bid].frameId} .input-ready-time`);

                    const readyTime = readyInput ? readyInput.value : "07:30";



                    // Thêm readyTime làm cột thứ 4

                    data.push([bid, r.ten, chosen.join(", "), readyTime]);

                }

            }

            if (!data.length) return alert("Chưa có thủ thuật nào được tick để lưu!");



            const wb = XLSX.utils.book_new();

            // Khai báo tiêu đề cột thứ 4

            const ws = XLSX.utils.aoa_to_sheet([["Mã Truy Xuất", "Tên Bệnh Nhân", "Thủ Thuật Đã Chọn",

                "Giờ Sẵn Sàng"], ...data]);

            ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 50 }, { wch: 15 }];



            XLSX.utils.book_append_sheet(wb, ws, "ThuThuatT7");

            XLSX.writeFile(wb, `DS_ThuThuat_T7_${new Date().toISOString().slice(0, 10)}.xlsx`);

        }

        function nhapDsSat() {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.xlsx, .xls';
            input.onchange = e => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                    const roa = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

                    const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').trim();
                    let isHIS = false;
                    let colTen = 6, colNamSinh = 7, colDichVu = 13, startRow = 1, colLoaiDieuTri = -1;

                    // Kiểm tra file HIS hay file T7 nội bộ
                    for (let i = 0; i < Math.min(15, roa.length); i++) {
                        const rowStr = roa[i].map(c => norm(c)).join('|');
                        if (rowStr.includes('ma truy xuat') && rowStr.includes('gio san sang')) {
                            isHIS = false;
                            startRow = i + 1;
                            break;
                        } else if (rowStr.includes('ho ten') || rowStr.includes('ten benh') || rowStr.includes('ten bn') || rowStr.includes('benh nhan') || rowStr.includes('fullname')) {
                            isHIS = true;
                            startRow = i + 1;
                            roa[i].forEach((cell, idx) => {
                                const cn = norm(cell);
                                if (cn.includes('ho ten') || cn.includes('ten bn') || cn.includes('ten benh') || cn === 'ten_bn' || cn === 'hoten' || cn.includes('fullname')) colTen = idx;
                                else if (cn.includes('nam sinh') || cn.includes('sinh nam') || cn === 'ns' || cn === 'nam_sinh' || cn.includes('birth')) colNamSinh = idx;
                                else if (cn.includes('dich vu') || cn.includes('thu thuat') || cn.includes('ten dvkt') || cn === 'dichvu' || cn === 'dich_vu' || cn.includes('service') || cn.includes('procedure')) colDichVu = idx;
                                else if (cn.includes('doi tuong') || cn.includes('loai dt') || cn.includes('loai dieu tri') || cn.includes('hinh thuc') || cn.includes('noi/ngoai') || cn === 'loai_bn') colLoaiDieuTri = idx;
                            });
                            break;
                        }
                    }

                    boChonHetSat();
                    let count = 0;

                    if (isHIS) {
                        const hisMap = {};
                        const hisLoaiMap = {};
                        const dataRows = roa.slice(startRow);
                        dataRows.forEach(row => {
                            const ten = String(row[colTen] || '').trim();
                            const dichVu = String(row[colDichVu] || '').trim();

                            let loaiBn = 'NoiTru';
                            let buoiDieuTri = 'TuDong';
                            if (colLoaiDieuTri >= 0 && row[colLoaiDieuTri] !== undefined) {
                                const val = norm(row[colLoaiDieuTri]);
                                if (val.includes('ngoai tru') || val.includes('kham benh') || val.includes('ngoaitru') || val.includes('kham')) {
                                    loaiBn = 'NgoaiTru';
                                }
                            }
                            const tenNorm = norm(ten);
                            if (!ten || tenNorm === 'ten_bn' || tenNorm === 'ho ten' || tenNorm === 'ten benh nhan' || tenNorm === 'hoten') return;
                            if (!dichVu) return;

                            const properTen = ten.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
                            if (!hisMap[properTen]) hisMap[properTen] = new Set();
                            if (loaiBn) hisLoaiMap[properTen] = loaiBn;

                            const lines = dichVu.split(/\r?\n/).map(l => l.trim()).filter(l => l);
                            lines.forEach(line => {
                                const cleaned = line.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+\s*\(lần\)/i, '').trim();
                                const mapped = (typeof mapHISToProcedure === 'function' ? mapHISToProcedure(cleaned || line) || mapHISToProcedure(line) : null);
                                if (mapped) hisMap[properTen].add(mapped);
                            });
                        });

                        Object.keys(hisMap).forEach(ten => {
                            const searchTen = ten.toLowerCase();
                            let targetBid = Object.keys(satCache).find(k => {
                                const info = satCache[k]?.info;
                                if (!info) return false;
                                return norm(info.ten) === norm(searchTen) || info.ten.trim().toLowerCase() === searchTen;
                            });
                            if (!targetBid) return;

                            if (hisLoaiMap[ten] && satCache[targetBid].info) {
                                satCache[targetBid].info.loaiBn = hisLoaiMap[ten];
                            }

                            const available = satCache[targetBid].items.map((item, idx) => ({ ...item, idx })).filter(x => !x.checked);

                            [...hisMap[ten]].forEach(tt => {
                                const match = available.find(x => norm(x.name) === norm(tt) || x.name.toLowerCase() === tt.toLowerCase());
                                if (match) {
                                    satCache[targetBid].items[match.idx].checked = true;
                                    const cb = document.getElementById(`cb-sat-${targetBid}-${match.idx}`);
                                    if (cb) cb.checked = true;
                                    available.splice(available.indexOf(match), 1);
                                    count++;
                                }
                            });
                        });
                    } else {
                        roa.forEach((row, i) => {
                            if (i < startRow || !row[2]) return;
                            const bid = String(row[0] || '').trim(), ten = String(row[1] || '').trim().toLowerCase();
                            let targetBid = (bid && satCache[bid]) ? bid : Object.keys(satCache).find(k => satCache[k].info.ten.trim().toLowerCase() === ten);
                            if (!targetBid) return;

                            const available = satCache[targetBid].items.map((item, idx) => ({ ...item, idx })).filter(x => !x.checked);

                            row[2].split(',').map(x => x.trim()).forEach(tt => {
                                const match = available.find(x => x.name.toLowerCase() === tt.toLowerCase());
                                if (match) {
                                    satCache[targetBid].items[match.idx].checked = true;
                                    const cb = document.getElementById(`cb-sat-${targetBid}-${match.idx}`);
                                    if (cb) cb.checked = true;
                                    available.splice(available.indexOf(match), 1);
                                    count++;
                                }
                            });

                            const importedTime = row[3];
                            if (importedTime) {
                                const readyInput = document.querySelector(`#${satCache[targetBid].frameId} .input-ready-time`);
                                if (readyInput) {
                                    readyInput.value = String(importedTime).trim();
                                    readyInput.style.color = '#c0392b';
                                    readyInput.style.fontWeight = 'bold';
                                    readyInput.style.backgroundColor = '#fff';
                                    readyInput.style.borderColor = '#c0392b';
                                }
                            }
                        });
                    }

                    updateSummarySat();
                    alert(`Đã nạp thành công ${count} thủ thuật ${isHIS ? 'từ file HIS' : 'từ file Excel Thứ 7'}!`);
                };
                reader.readAsArrayBuffer(e.target.files[0]);
            };
            input.click();
        }

        function getSatPayload() {

            const allowed_staff = [], staff_shifts_dict = {};

            for (const ten in t8_ns_vars) {

                if (!t8_ns_vars[ten]) continue;

                allowed_staff.push(ten);

                const idx = satStaffIndices[ten];

                const shifts = [];

                const s1 = document.getElementById(`sat-s1-${idx}`)?.value, s2 =

                    document.getElementById(`sat-s2-${idx}`)?.value;

                const c1 = document.getElementById(`sat-c1-${idx}`)?.value, c2 =

                    document.getElementById(`sat-c2-${idx}`)?.value;

                if (s1 && s2) shifts.push([s1, s2]);

                if (c1 && c2) shifts.push([c1, c2]);

                staff_shifts_dict[ten] = shifts;

            }

            const final_pats = [];

            for (const bid in satCache) {

                const chosen = satCache[bid].items.filter(item => item.checked).map(item => item.name);

                if (!chosen.length) continue;

                const r = satCache[bid].info;

                const readyInput = document.querySelector(`#${satCache[bid].frameId} .input-ready-time`);



                // 🔥 Đã sửa: Gán giờ sẵn sàng vào biến gioVao để thuật toán Code.gs đọc được

                const timeToRun = readyInput ? readyInput.value : "07:30";



                final_pats.push({

                    id: r.id, ten: r.ten, ns: r.namSinh, tt: chosen.join(", "),

                    phong: r.phong, gioVao: timeToRun, loai: r.loaiBn

                });

            }

            return { allowed_staff, staff_shifts_dict, final_pats };

        }

        function xepLichSat() {
            const dateVal = document.getElementById('sat-schedule-date').value;
            if (!dateVal) return alert("Vui l\u00f2ng ch\u1ecdn Ng\u00e0y l\u00e0m vi\u1ec7c Th\u1ee9 7 tr\u01b0\u1edbc!");

            window.viewingImportedScheduleFile = false;

            const payload = getSatPayload();

            if (!payload.allowed_staff.length) return alert("Vui l\u00f2ng ch\u1ecdn Nh\u00e2n s\u1ef1 \u0111i l\u00e0m!");

            if (!payload.final_pats.length) return alert("Ch\u01b0a c\u00f3 th\u1ee7 thu\u1eadt n\u00e0o \u0111\u01b0\u1ee3c ch\u1ecdn!");

            const btn = document.getElementById('btn-xep-sat');

            btn.innerText = '⏳ ĐANG XẾP...'; btn.disabled = true;

            const startTime = performance.now();
            setTimeout(() => {
                try {
                    const res = window.SchedulerEngine.runSaturdayScheduling(payload, dateVal);
                    const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
                    btn.innerText = '▶ XẾP LỊCH THỨ 7'; btn.disabled = false;

                    const sched = res.sched || res.schedule || [];
                    const rot = res.dropped || res.unscheduled || res.rot || [];

                    window.currentScheduleData = markDischargedInSchedule(sched);
                    setUnscheduledData(rot, dateVal);
                    
                    if (typeof dataCache !== 'undefined') dataCache.schedule = sched;
                    if (window.dataCache) window.dataCache.schedule = sched;

                    const curSchedUnit = getCurrentUnitCode();
                    localStorage.setItem('meds_schedule_unit', curSchedUnit);
                    localStorage.setItem(getUnitStorageKey('meds_schedule_date'), dateVal);
                    localStorage.setItem('meds_schedule_date', dateVal);
                    localStorage.setItem(getUnitStorageKey('meds_success'), JSON.stringify(window.currentScheduleData));
                    localStorage.setItem('meds_success', JSON.stringify(window.currentScheduleData));
                    localStorage.setItem(getUnitStorageKey('meds_unscheduled'), JSON.stringify(window.lastUnscheduledData));
                    localStorage.setItem('meds_unscheduled', JSON.stringify(window.lastUnscheduledData));
                    
                    // Đồng bộ ngay vào offline cache để F5 không bị mất dữ liệu
                    try {
                        const cachedStr = localStorage.getItem(getBootstrapCacheKey());
                        if (cachedStr) {
                            const b = JSON.parse(cachedStr);
                            b.unit_code = curSchedUnit;
                            b.schedule = sched;
                            localStorage.setItem(getBootstrapCacheKey(), JSON.stringify(b));
                        }
                    } catch(e) {}

                    const normalDate = document.getElementById('schedule-date');
                    if (normalDate) normalDate.value = dateVal;
                    window._systemActiveYMD = dateVal;

                    const dashboardDate = document.getElementById('dashboard-date-filter');
                    if (dashboardDate) dashboardDate.value = dateVal;

                    document.querySelector('.nav-tab[data-tab="tab-schedule"]')?.click();
                    const searchInput = document.getElementById('schedule-search-input');
                    if (searchInput) searchInput.value = '';

                    const resEl = document.getElementById('schedule-result');
                    if (resEl) {
                        resEl.innerHTML = `<div class="alert alert-success" style="margin-top:10px">Xếp thành công: <b>${window.currentScheduleData.length}</b> ca. Rớt: <b>${window.lastUnscheduledData.length}</b> ca. <span style="color:#555; font-size:13px;">(⏱ <b>${timeTaken} giây</b>)</span></div>`;
                    }

                    filterSchedule(); 
                    if (typeof renderStats === 'function') renderStats(window.lastUnscheduledData);
                    if (typeof renderPatientsTable === 'function') renderPatientsTable();
                    if (typeof loadDashboard === 'function') loadDashboard();

                    // Đồng bộ lưu lịch trình thứ 7 vào D1 SQLite trong nền
                    if (sched.length > 0) {
                        const backendSched = sched.map(x => [ x.ngay || dateVal, x.tenBN || '', x.namSinh || '', x.phong || '', x.thuThuat || '', x.gioDienRa || '', x.gioKetThuc || '', x.nvChinh || '', x.nvPhu || '', x.may || '', x.giuong || '' ]);
                        callApi('saveSchedule', [dateVal, backendSched], null, null);
                    }
                } catch(err) {
                    btn.innerText = '▶ XẾP LỊCH THỨ 7'; btn.disabled = false;
                    alert("Lỗi: " + err.message);
                }
            }, 30);


        }

        function updateSatDefaultTime() {

            const isSummer = document.querySelector('input[name="sat-season"]:checked').value ===

                'summer';

            const vals = isSummer ? ["07:00", "11:30", "13:00", "16:30"] :

                ["07:30", "12:00", "13:00", "16:30"];

            for (const ten in satStaffIndices) {

                const idx = satStaffIndices[ten];

                ['sat-s1', 'sat-s2', 'sat-c1', 'sat-c2'].forEach((prefix, i) => {

                    const el = document.getElementById(`${prefix}-${idx}`); if (el) el.value = vals[i];

                });

            }

        }



        // ============================================================

        // 📤 XUẤT / NHẬP BỆNH NHÂN

        // ============================================================

        function exportPatients() {

            if (!dataCache.pat.length) return alert("Không có dữ liệu bệnh nhân để xuất!");

            const ws_data = [["STT", "Tên BN", "Năm Sinh", "Ngày Vào", "Giờ Vào", "Giờ Bận", "Giờ Ra", "Phòng", "Thủ Thuật"],

            ...dataCache.pat.map((p, i) => [i + 1, p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan,

            p.gioRa, p.phong, p.thuThuat])];

            const wb = XLSX.utils.book_new();

            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            XLSX.utils.book_append_sheet(wb, ws, "DanhSachBenhNhan");

            XLSX.writeFile(wb, `DS_BenhNhan_${new

                Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);

        }

        function savePatientsWithFallback(cleanList, replaceAll, onSuccess, onError, onProgress) {
            google.script.run
                .withSuccessHandler(res => {
                    if (onSuccess) onSuccess(res);
                })
                .withFailureHandler(err => {
                    console.warn("[bulkUpdatePatients API fallback to sequential]:", err);
                    const total = cleanList.length;
                    if (total === 0) {
                        if (onSuccess) onSuccess({ message: "Danh sách trống" });
                        return;
                    }

                    let current = 0;
                    function saveNext() {
                        if (current >= total) {
                            if (onSuccess) onSuccess({ message: `Đã lưu thành công ${total} bệnh nhân!` });
                            return;
                        }
                        const p = cleanList[current];
                        if (onProgress) onProgress(current + 1, total);
                        google.script.run
                            .withSuccessHandler(() => {
                                current++;
                                saveNext();
                            })
                            .withFailureHandler(subErr => {
                                console.warn(`[Lỗi lưu BN ${p.ten}]:`, subErr);
                                current++;
                                saveNext();
                            })
                            .addBenhNhan(p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan, p.gioRa, p.phong, p.thuThuat);
                    }
                    saveNext();
                })
                .bulkUpdatePatients(cleanList, replaceAll);
        }

        function importPatients() {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.xlsx, .xls';
            input.onchange = e => {
                const reader = new FileReader();
                reader.onload = function (ev) {
                    const workbook = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
                    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

                    function buildMatchKeyLocal(t, ns) {
                        const cleanTen = String(t || '')
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/đ/g, 'd')
                            .replace(/Đ/g, 'd')
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '');
                        const cleanNS = String(ns || '').trim();
                        return cleanTen + '|' + cleanNS;
                    }

                    const existingPats = (dataCache && dataCache.pat) ? dataCache.pat : [];
                    const existingMap = {};
                    existingPats.forEach(p => {
                        const k = buildMatchKeyLocal(p.ten, p.namSinh);
                        existingMap[k] = p;
                    });

                    const patientList = rows.slice(1).filter(r => r[1]).map(r => {
                        const ten = String(r[1] || '').trim();
                        const namSinh = String(r[2] || '').trim();
                        const key = buildMatchKeyLocal(ten, namSinh);
                        const existing = existingMap[key];
                        return {
                            ten: ten,
                            namSinh: namSinh,
                            ngayVao: String(r[3] || '').trim(),
                            gioVao: String(r[4] || '').trim(),
                            gioBan: String(r[5] || '').trim(),
                            gioRa: String(r[6] || '').trim(),
                            phong: String(r[7] || '').trim(),
                            thuThuat: String(r[8] || '').trim(),
                            loai_bn: r[9] ? String(r[9]).trim() : (existing ? (existing.loai_bn || existing.loaiBN || 'NoiTru') : 'NoiTru'),
                            buoi_dieu_tri: r[10] ? String(r[10]).trim() : (existing ? (existing.buoi_dieu_tri || existing.buoiDieuTri || 'TuDong') : 'TuDong'),
                            status: existing ? (existing.status || existing.trangThai || 'Chưa xếp') : 'Chưa xếp',
                            gender: existing ? (existing.gender || existing.gioiTinh || 'Nam') : 'Nam',
                            bed: existing ? (existing.bed || existing.giuong || '') : '',
                            order_idx: existing ? (existing.order_idx !== undefined ? Number(existing.order_idx) : 0) : 0
                        };
                    }).filter(p => p.ten);

                    const replaceAll = confirm("Bác sĩ có muốn THAY THẾ TOÀN BỘ danh sách hiện tại không?\n\n- OK: Xóa sạch, nạp mới.\n- Cancel: Bổ sung thêm.");

                    const btn = document.getElementById('btn-import-pat');
                    btn.innerText = "⏳ Đang xử lý..."; btn.disabled = true;

                    savePatientsWithFallback(
                        patientList,
                        replaceAll,
                        res => {
                            const msg = typeof res === 'object' && res.message ? res.message : (typeof res === 'string' ? res : "Nhập dữ liệu thành công!");
                            showToast(msg, 'success', 5000);
                            btn.innerText = "⬇️ Excel"; btn.disabled = false;
                            if (window.dataCacheTime) delete window.dataCacheTime['pat'];
                            loadEntity('getBenhNhan', 'pat', renderPatientsTable, [], true);
                        },
                        err => {
                            const msg = (err && typeof err === 'object') ? (err.message || err.error || JSON.stringify(err)) : String(err || 'Lỗi không xác định');
                            showToast('Lỗi nhập Excel: ' + msg, 'error', 6000);
                            btn.innerText = "⬇️ Excel"; btn.disabled = false;
                        },
                        (cur, tot) => {
                            btn.innerText = `⏳ ${cur}/${tot}...`;
                        }
                    );
                };

                reader.readAsArrayBuffer(e.target.files[0]);

            };

            input.click();

        }



        // ============================================================

        // 🏥 NHẬP TỪ HIS (Y LỆNH) - ĐỌC FILE EXCEL CỦA BỆNH VIỆN
        // Cột G (index 6) = Tên BN, Cột H (index 7) = Năm sinh, Cột N (index 13) = Dịch vụ
        // Bắt đầu từ dòng 11 (index 10)
        // ============================================================

        // Bảng ánh xạ: Từ khóa nhận diện trong file HIS -> Tên thủ thuật chuẩn trong phần mềm
        const HIS_MAPPING = [
            { keywords: ['điện châm', 'dc ', ' dc,', ',dc,', ',dc', 'dien cham'], target: 'điện châm' },
            { keywords: ['thủy châm', 'thuy cham', 'tc ', ' tc,', ',tc,', ',tc'], target: 'thủy châm' },
            { keywords: ['xoa bóp bấm huyệt', 'xoa bop bam huyet', 'xbbh', 'xbb', 'bấm huyệt'], target: 'XBBH' },
            { keywords: ['hào châm', 'hao cham', ' hc,', ',hc,', ',hc', ' hc '], target: 'hào châm' },
            { keywords: ['cấy chỉ', 'cay chi', ' cc,', ',cc,', ',cc', ' cc '], target: 'cấy chỉ' },
            { keywords: ['điện xung', 'dien xung', 'dòng điện xung', ' dx,', ',dx,', ',dx', ' dx '], target: 'điện xung' },
            { keywords: ['parafin', ' pa,', ',pa,', ',pa', ' pa '], target: 'parafin' },
            { keywords: ['siêu âm', 'sieu am', ' sa,', ',sa,', ',sa', ' sa '], excludes: ['ổ bụng', 'tuyến giáp', 'doppler', 'phần phụ', 'tổng quát', 'tuyến vú', 'thai', 'tim', 'mạch', 'màng phổi', 'khớp', 'phần mềm', '4d', '3d'], target: 'siêu âm' },
            { keywords: ['sóng ngắn', 'song ngan', ' sn,', ',sn,', ',sn', ' sn '], target: 'sóng ngắn' },
            { keywords: ['hồng ngoại', 'hong ngoai', 'tia hồng', ' hn,', ',hn,', ',hn', ' hn '], target: 'hồng ngoại' },
            { keywords: ['kỹ thuật xoa bóp vùng', 'xoa bóp vùng', 'xbv', 'xoa bop vung'], target: 'xoa bóp vùng' },
            { keywords: ['tập vận động có trợ giúp', 'trợ giúp', 'ttg', 'tap tro giup', ' ttg,', ',ttg'], target: 'tập trợ giúp' },
            { keywords: ['tập vận động có kháng trở', 'kháng trở', 'tap khang tro', ' tk,', ',tk,', 'khang tro'], target: 'tập kháng trở' },
            { keywords: ['tập các kiểu thở', 'kiểu thở', 'tap tho', ' tt,', ',tt,', 'kieu tho'], target: 'tập thở' },
            { keywords: ['kéo giãn cột sống', 'keo gian', ' kg,', ',kg,', ',kg', ' kg ', 'cot song'], target: 'kéo giãn' },
            { keywords: ['vận động trị liệu', 'vđtl', 'van dong tri lieu'], target: 'vận động trị liệu' },
            { keywords: ['châm cứu', 'cham cuu', 'cc '], target: 'châm cứu' },
            { keywords: ['từ trường', 'tu truong'], target: 'từ trường' },
            { keywords: ['tắm thuốc', 'tam thuoc'], target: 'tắm thuốc' },
            { keywords: ['chườm nóng', 'chuom nong'], target: 'chườm nóng' },
            { keywords: ['kéo cột sống cổ', 'keo co', 'cot song co'], target: 'kéo giãn' },
            { keywords: ['kéo cột sống lưng', 'keo lung', 'cot song lung'], target: 'kéo giãn' }
        ];

        // Chuẩn hóa chuỗi để so khớp (loại bỏ dấu, viết thường, KHÔNG trim)
        function normalizeStrNoTrim(str) {
            return String(str || '').toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd');
        }

        // Chuẩn hóa chuỗi để so khớp (loại bỏ dấu, viết thường và trim ở cuối)
        function normalizeStr(str) {
            return normalizeStrNoTrim(str).trim();
        }

        // Ánh xạ tên dịch vụ HIS → tên thủ thuật trong phần mềm
        function mapHISToProcedure(hisServiceName) {
            if (!hisServiceName) return null;
            const normalized = ' ' + normalizeStrNoTrim(hisServiceName) + ' ';
            for (const mapping of HIS_MAPPING) {
                let isExcluded = false;
                if (mapping.excludes) {
                    for (const ex of mapping.excludes) {
                        if (normalized.includes(normalizeStrNoTrim(ex))) {
                            isExcluded = true;
                            break;
                        }
                    }
                }
                if (isExcluded) continue;

                for (const kw of mapping.keywords) {
                    if (normalized.includes(normalizeStrNoTrim(kw))) {
                        return mapping.target;
                    }
                }
            }
            return null; // Không nhận diện được
        }

        function importFromHIS() {
            if (checkUnclosedDay()) return;

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx, .xls';
            input.onchange = e => {
                const reader = new FileReader();
                reader.onload = function (ev) {
                    try {
                        const workbook = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                        if (!rows.length) return showCustomAlert('File trống', 'File Excel không có dữ liệu!', '❌', '#e74c3c');

                        // --- Bước 1: Tự động dò hàng tiêu đề và cột ---
                        let colTen = 6, colNamSinh = 7, colDichVu = 13, startRow = 10, colLoaiDieuTri = -1;
                        const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').trim();

                        // Quét 15 hàng đầu - khớp tiếng Việt lẫn mã HIS (TEN_BN, NAM_SINH...)
                        for (let i = 0; i < Math.min(15, rows.length); i++) {
                            const rowStr = rows[i].map(c => norm(c)).join('|');
                            const isHeader = rowStr.includes('ho ten') || rowStr.includes('ten benh') ||
                                rowStr.includes('ten bn') || rowStr.includes('benh nhan') ||
                                rowStr.includes('ten_bn') || rowStr.includes('hoten') ||
                                rowStr.includes('fullname') || rowStr.includes('patient');
                            if (isHeader) {
                                startRow = i + 1;
                                rows[i].forEach((cell, idx) => {
                                    const cn = norm(cell);
                                    if (cn.includes('ho ten') || cn.includes('ten bn') || cn.includes('ten benh') ||
                                        cn === 'ten_bn' || cn === 'hoten' || cn.includes('fullname')) colTen = idx;
                                    else if (cn.includes('nam sinh') || cn.includes('sinh nam') || cn === 'ns' ||
                                        cn === 'nam_sinh' || cn === 'namsanh' || cn.includes('birth')) colNamSinh = idx;
                                    else if (cn.includes('dich vu') || cn.includes('thu thuat') || cn.includes('ten dvkt') ||
                                        cn === 'dichvu' || cn === 'dich_vu' || cn.includes('service') || cn.includes('procedure')) colDichVu = idx;
                                    else if (cn.includes('doi tuong') || cn.includes('loai dt') || cn.includes('loai dieu tri') ||
                                        cn.includes('hinh thuc') || cn.includes('noi/ngoai') || cn === 'loai_bn') colLoaiDieuTri = idx;
                                });
                                break;
                            }
                        }

                        // --- Bước 2: Đọc danh sách dịch vụ từ file HIS ---
                        const dataRows = rows.slice(startRow);
                        if (!dataRows.length) return showCustomAlert('Không có dữ liệu', 'File không có dữ liệu từ dòng ' + (startRow + 1) + ' trở đi!', '❌', '#e74c3c');

                        // Hàm sinh khóa chuẩn hóa để so khớp bệnh nhân (bỏ dấu, viết thường, bỏ tất cả khoảng trắng)
                        function buildMatchKey(ten, namSinh) {
                            const cleanTen = String(ten || '')
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .replace(/đ/g, 'd')
                                .replace(/Đ/g, 'd')
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, '');
                            const cleanNS = String(namSinh || '').trim();
                            return cleanTen + '|' + cleanNS;
                        }

                        function getTodayDMY() {
                            const today = new Date();
                            const dd = String(today.getDate()).padStart(2, '0');
                            const mm = String(today.getMonth() + 1).padStart(2, '0');
                            const yyyy = today.getFullYear();
                            return dd + '/' + mm + '/' + yyyy;
                        }

                        const hisMap = {};
                        const unrecognized = new Set();
                        let totalRead = 0;

                        dataRows.forEach(row => {
                            const ten = String(row[colTen] || '').trim();
                            const namSinh = String(row[colNamSinh] || '').trim();
                            const dichVu = String(row[colDichVu] || '').trim();

                            let loaiBn = 'NoiTru';
                            let buoiDieuTri = 'TuDong';
                            if (colLoaiDieuTri >= 0) {
                                const valLoai = norm(row[colLoaiDieuTri]);
                                if (valLoai.includes('ngoai tru') || valLoai.includes('kham benh') || valLoai.includes('ngoaitru') || valLoai.includes('kham')) {
                                    loaiBn = 'NgoaiTru';
                                }
                            }

                            // Bỏ qua hàng tiêu đề lọt vào (TEN_BN, HO_TEN...)
                            const tenNorm = norm(ten);
                            if (!ten || tenNorm === 'ten_bn' || tenNorm === 'ho ten' || tenNorm === 'ten benh nhan' || tenNorm === 'hoten') return;
                            if (!dichVu) return;
                            totalRead++;

                            const key = buildMatchKey(ten, namSinh);
                            const properTen = ten.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
                            if (!hisMap[key]) hisMap[key] = { ten: properTen, namSinh, loaiBn, buoiDieuTri, procs: new Set() };

                            // Tách nhiều thủ thuật trong 1 ô (mỗi dòng 1 thủ thuật)
                            const lines = dichVu.split(/\r?\n/).map(l => l.trim()).filter(l => l);
                            lines.forEach(line => {
                                const cleaned = line.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+\s*\(lần\)/i, '').trim();
                                const mapped = mapHISToProcedure(cleaned || line) || mapHISToProcedure(line);
                                if (mapped) hisMap[key].procs.add(mapped);
                                else unrecognized.add(cleaned || line);
                            });
                        });

                        // --- Bước 3: Merge với danh sách bệnh nhân hiện tại ---
                        // Bệnh nhân đã có → chỉ cập nhật thuThuat, giữ nguyên ngayVao/phong/giờ
                        // Bệnh nhân mới  → thêm mới với ngày hôm nay
                        const existingPats = (dataCache && dataCache.pat) ? dataCache.pat : [];
                        const existingMap = {};
                        existingPats.forEach(p => {
                            const k = buildMatchKey(p.ten, p.namSinh);
                            existingMap[k] = p;
                        });

                        let updatedCount = 0, newCount = 0;
                        const mergedList = existingPats.map(p => {
                            const k = buildMatchKey(p.ten, p.namSinh);
                            if (hisMap[k]) {
                                updatedCount++;
                                return { 
                                    ...p, 
                                    thuThuat: [...hisMap[k].procs].join(','),
                                    loai_bn: p.loai_bn || p.loaiBN || 'NoiTru',
                                    buoi_dieu_tri: p.buoi_dieu_tri || p.buoiDieuTri || 'TuDong'
                                };
                            }
                            return { 
                                ...p,
                                loai_bn: p.loai_bn || p.loaiBN || 'NoiTru',
                                buoi_dieu_tri: p.buoi_dieu_tri || p.buoiDieuTri || 'TuDong'
                            };
                        });
                        Object.values(hisMap).forEach(hisPat => {
                            const k = buildMatchKey(hisPat.ten, hisPat.namSinh);
                            if (!existingMap[k]) {
                                newCount++;
                                mergedList.push({
                                    ten: hisPat.ten,
                                    namSinh: hisPat.namSinh,
                                    ngayVao: getTodayDMY(),
                                    gioVao: '',
                                    gioBan: '',
                                    gioRa: '',
                                    phong: '',
                                    thuThuat: [...hisPat.procs].join(',')
                                });
                            }
                        });

                        // --- Bước 4: Popup xác nhận ---
                        const totalHIS = Object.keys(hisMap).length;
                        let previewHTML = `<div style="font-size:13px;line-height:1.7;color:#2c3e50">`;
                        previewHTML += `<div style="background:#eaf6ff;border-radius:8px;padding:10px 14px;margin-bottom:10px;border-left:4px solid #3498db">`;
                        previewHTML += `<b>📌 Thông tin đọc file:</b><br>Hàng: <b>${startRow + 1}</b> | Cột Tên: <b>${String.fromCharCode(65 + colTen)}</b> | Cột Năm: <b>${String.fromCharCode(65 + colNamSinh)}</b> | Cột DV: <b>${String.fromCharCode(65 + colDichVu)}</b></div>`;
                        previewHTML += `<div style="background:#eafaf1;border-radius:8px;padding:10px 14px;margin-bottom:10px;border-left:4px solid #27ae60">`;
                        previewHTML += `📋 HIS: <b>${totalHIS}</b> BN &nbsp;|&nbsp; 🔄 Cập nhật TT: <b>${updatedCount}</b> BN &nbsp;|&nbsp; ➕ Thêm mới: <b>${newCount}</b> BN</div>`;
                        if (updatedCount > 0) {
                            previewHTML += `<b>🔄 BN đã có (giữ ngày/phòng, cập nhật thủ thuật):</b><ul style="margin:4px 0 8px 16px;padding:0">`;
                            mergedList.filter(p => {
                                const k = buildMatchKey(p.ten, p.namSinh);
                                return !!hisMap[k];
                            }).slice(0, 4).forEach(p => {
                                previewHTML += `<li><b>${escapeHtml(p.ten)}</b> (${escapeHtml(p.namSinh)}): <span style="color:#8e44ad">${escapeHtml(p.thuThuat)}</span></li>`;
                            });
                            if (updatedCount > 4) previewHTML += `<li style="color:#7f8c8d">...và ${updatedCount - 4} BN khác</li>`;
                            previewHTML += `</ul>`;
                        }
                        if (newCount > 0) {
                            previewHTML += `<b>➕ BN mới thêm vào:</b><ul style="margin:4px 0 8px 16px;padding:0">`;
                            mergedList.slice(-newCount).slice(0, 4).forEach(p => {
                                previewHTML += `<li><b>${escapeHtml(p.ten)}</b> (${escapeHtml(p.namSinh)}): <span style="color:#27ae60">${escapeHtml(p.thuThuat)}</span></li>`;
                            });
                            if (newCount > 4) previewHTML += `<li style="color:#7f8c8d">...và ${newCount - 4} BN khác</li>`;
                            previewHTML += `</ul>`;
                        }
                        if (unrecognized.size > 0) {
                            previewHTML += `<div style="background:#fef9e7;border-radius:8px;padding:10px 14px;border-left:4px solid #f39c12">`;
                            previewHTML += `⚠️ <b>${unrecognized.size} dịch vụ chưa nhận diện:</b><ul style="margin:4px 0 0 16px;padding:0">`;
                            [...unrecognized].slice(0, 5).forEach(s => { previewHTML += `<li style="color:#c0392b">${escapeHtml(s)}</li>`; });
                            if (unrecognized.size > 5) previewHTML += `<li style="color:#7f8c8d">...và ${unrecognized.size - 5} dịch vụ khác</li>`;
                            previewHTML += `</ul></div>`;
                        }
                        previewHTML += `</div>`;

                        if (!totalHIS) return showCustomAlert('Không đọc được dữ liệu', previewHTML, '❌', '#e74c3c');

                        showCustomConfirm('🏥 Xác nhận nhập từ HIS', previewHTML, function () {
                            const btn = document.getElementById('btn-import-his');
                            btn.innerText = '⏳ Đang xử lý...'; btn.disabled = true;

                            const cleanMergedList = mergedList.map(p => ({
                                ten: String(p.ten || p.name || '').trim(),
                                namSinh: String(p.namSinh || p.age || '').trim(),
                                ngayVao: String(p.ngayVao || p.ngay_vao || '').trim(),
                                gioVao: String(p.gioVao || p.arrive_time || '').trim(),
                                gioBan: String(p.gioBan || p.gio_ban || '').trim(),
                                gioRa: String(p.gioRa || p.leave_time || '').trim(),
                                phong: String(p.phong || p.room || '').trim(),
                                thuThuat: String(p.thuThuat || '').trim(),
                                loai_bn: String(p.loai_bn || p.loaiBN || 'NoiTru').trim(),
                                buoi_dieu_tri: String(p.buoi_dieu_tri || p.buoiDieuTri || 'TuDong').trim(),
                                status: String(p.status || p.trangThai || 'Chưa xếp').trim(),
                                gender: String(p.gender || p.gioiTinh || 'Nam').trim(),
                                bed: String(p.bed || p.giuong || '').trim(),
                                order_idx: p.order_idx !== undefined ? Number(p.order_idx) : 0
                            })).filter(p => p.ten);

                            savePatientsWithFallback(
                                cleanMergedList,
                                true,
                                res => {
                                    btn.innerText = '🏥 HIS'; btn.disabled = false;
                                    showToast(`Nhập HIS thành công: cập nhật ${updatedCount} BN, thêm mới ${newCount} BN`, 'success', 5000);
                                    if (window.dataCacheTime) delete window.dataCacheTime['pat'];

                                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [], true);
                                },
                                err => {
                                    const msg = (err && typeof err === 'object') ? (err.message || err.error || JSON.stringify(err)) : String(err || 'Lỗi không xác định');
                                    showToast('Lỗi lưu dữ liệu: ' + msg, 'error', 6000);
                                    btn.innerText = '🏥 HIS'; btn.disabled = false;
                                },
                                (cur, tot) => {
                                    btn.innerText = `⏳ ${cur}/${tot}...`;
                                }
                            );
                        });

                    } catch (err) {
                        showCustomAlert('Lỗi đọc file', '❌ ' + err.message, '❌', '#e74c3c');
                    }
                };
                reader.readAsArrayBuffer(e.target.files[0]);
            };
            input.click();
        }

        // ============================================================


        // ============================================================

        // 🔐 ĐĂNG NHẬP / PHÂN QUYỀN

        function updateLogoutButton(username) {
            const container = document.getElementById('user-menu-container');
            const displayName = document.getElementById('user-display-name');
            if (container) container.style.display = 'flex';
            if (displayName) displayName.innerText = `👤 ${username}`;
        }

        function doLogout() {
            if (typeof window.stopAutoSync === 'function') {
                try { window.stopAutoSync(); } catch(e) {}
            }

            // 1. Quét sạch tất cả key của phiên & đơn vị trong localStorage, chỉ giữ lại cấu hình giao diện & backup URL
            const preserveKeys = ['pm_app_theme', 'doc_theme', 'times_backup_api_url'];
            try {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && !preserveKeys.includes(key)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
            } catch(e) {}

            // 2. Xóa sạch dữ liệu trong RAM
            window.currentScheduleData = null;
            window.chamCongData = {};
            window.thongKeData = {};
            window.adminChamCongEmployees = [];

            if (window._dashWorkdaysChart) {
                try { window._dashWorkdaysChart.destroy(); } catch(e){}
                window._dashWorkdaysChart = null;
            }
            if (window._dashProcsChart) {
                try { window._dashProcsChart.destroy(); } catch(e){}
                window._dashProcsChart = null;
            }

            if (window.dataCache) {
                window.dataCache.pat = [];
                window.dataCache.staff = [];
                window.dataCache.machine = [];
                window.dataCache.room = [];
                window.dataCache.proc = [];
                window.dataCache.schedule = [];
                window.dataCache.protocols = [];
            }
            if (window.dataCacheTime) window.dataCacheTime = {};

            // 3. Xóa sạch các bảng dữ liệu trên DOM ngay lập tức
            if (typeof clearAllDomTables === 'function') {
                clearAllDomTables(false);
            }

            // 4. Reload trang về URL gốc để đảm bảo 100% không còn biến / bộ nhớ / closure rò rỉ giữa 2 đơn vị
            try {
                window.location.href = window.location.origin + window.location.pathname;
            } catch(e) {
                window.location.reload();
            }
        }
        window.doLogout = doLogout;

        function applyPermissions(role, permsStr) {
            const allTabs = document.querySelectorAll('.nav-tab');
            const adminBtn = document.getElementById('nav-btn-admin');
            const dropdownAdminBtn = document.getElementById('user-menu-admin-btn');
            const dropdownDivider = document.getElementById('user-menu-divider');
            const superTab = document.getElementById('nav-tab-tenants');

            const btnSettings = document.getElementById('nav-btn-settings');
            const btnAccounts = document.getElementById('nav-btn-accounts');
            const btnEmployees = document.getElementById('nav-btn-employees');
            const btnAi = document.getElementById('nav-btn-ai');
            const btnBackup = document.getElementById('nav-btn-backup');
            const btnQuicklinks = document.getElementById('nav-btn-quicklinks');
            const userMenuSuperSection = document.getElementById('user-menu-super-section');
            const modalSuperAdminActions = document.getElementById('modal-server-super-admin-actions');

            const isSuper = (role === 'SUPER_ADMIN' || role === 'superadmin' || role === 'SUPERADMIN');

            if (userMenuSuperSection) {
                userMenuSuperSection.style.display = isSuper ? 'flex' : 'none';
            }
            if (modalSuperAdminActions) {
                modalSuperAdminActions.style.display = isSuper ? 'flex' : 'none';
            }

            if (isSuper) {
                // 👑 SUPER ADMIN:
                allTabs.forEach(t => {
                    const tabId = t.getAttribute('data-tab');
                    if (tabId === 'tab-tenants' || tabId === 'tab-admin') {
                        t.style.display = 'flex';
                    } else {
                        t.style.display = 'none';
                    }
                });
                if (superTab) superTab.style.display = 'flex';
                if (adminBtn) adminBtn.style.display = 'block';
                if (dropdownAdminBtn) dropdownAdminBtn.style.display = 'none'; // SuperAdmin uses direct sidebar
                if (dropdownDivider) dropdownDivider.style.display = 'none';
                document.body.classList.remove('read-only-user');

                if (btnBackup) btnBackup.style.display = 'block';
                if (btnQuicklinks) btnQuicklinks.style.display = 'block';
                if (btnSettings) btnSettings.style.display = 'none';
                if (btnAccounts) btnAccounts.style.display = 'none';
                if (btnEmployees) btnEmployees.style.display = 'none';
                if (btnAi) btnAi.style.display = 'none';

                if (typeof window.updateAppHeader === 'function') {
                    window.updateAppHeader('MASTER', 'SUPER_ADMIN');
                }
                return;
            }

            // 🏢 HOSPITAL ADMIN / REGULAR USERS:
            if (superTab) superTab.style.display = 'none';

            if (role === 'Admin' || role === 'admin') {
                allTabs.forEach(t => {
                    if (t.getAttribute('data-tab') !== 'tab-tenants') t.style.display = 'flex';
                    else t.style.display = 'none';
                });
                if (adminBtn) adminBtn.style.display = 'block';
                if (dropdownAdminBtn) dropdownAdminBtn.style.display = 'flex';
                if (dropdownDivider) dropdownDivider.style.display = 'block';
                document.body.classList.remove('read-only-user');

                if (btnSettings) btnSettings.style.display = 'block';
                if (btnAccounts) btnAccounts.style.display = 'block';
                if (btnEmployees) btnEmployees.style.display = 'block';
                if (btnAi) btnAi.style.display = 'block';
                if (btnBackup) btnBackup.style.display = 'none';
                if (btnQuicklinks) btnQuicklinks.style.display = 'none';
            } else {
                // Read-only user
                allTabs.forEach(t => {
                    const tabId = t.getAttribute('data-tab');
                    if (tabId === 'tab-admin' || tabId === 'tab-tenants') t.style.display = 'none';
                    else t.style.display = 'flex';
                });
                if (adminBtn) adminBtn.style.display = 'none';
                if (dropdownAdminBtn) dropdownAdminBtn.style.display = 'none';
                if (dropdownDivider) dropdownDivider.style.display = 'none';
                document.body.classList.add('read-only-user');
            }

            if (typeof window.updateAppHeader === 'function') {
                window.updateAppHeader(localStorage.getItem('pm_unit_code'), role);
            }
        }
        window.applyPermissions = applyPermissions;

        function togglePermissionsBox() {

            const box = document.getElementById('acc-perms-box');

            const isAdmin = document.getElementById('acc-role').value === 'Admin';

            box.style.opacity = isAdmin ? '0.5' : '1';

            box.style.pointerEvents = isAdmin ? 'none' : 'auto';

        }

        // ============================================================

        // QUẢN LÝ TÀI KHOẢN (TƯƠNG THÍCH MẬT KHẨU MÃ HÓA)

        // ============================================================

        function loadAccounts() {

            callApi('getAccounts', [], data => {
                const list = Array.isArray(data) ? data : [];
                adminAccCache = list;

                const tbody = document.getElementById('acc-list');
                if (!tbody) return;

                if (list.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" align="center" style="color:gray; padding:20px;">Chưa có tài khoản nào trong hệ thống</td></tr>';
                    return;
                }

                const PERM_MAP = { 'tab-patients': '🛌 Bệnh Nhân', 'tab-schedule': '⚡ Xếp Lịch', 'tab-sat': '📅 Thứ 7', 'tab-busy': '⏱ Giờ Bận', 'tab-stats': '📊 Thống Kê', 'tab-utils': '🛠 Tiện Ích', 'tab-kiemtra': '✅ Kiểm Tra Lỗi', 'tab-machines': '⚙️ Máy Móc', 'tab-procedures': '💉 Thủ Thuật', 'tab-rooms': '🏥 Phòng', 'tab-staff': '👨‍⚕️ Nhân Sự', 'tab-chamcong': '⏱️ Chấm Công', 'tab-thongke': '📈 Thống Kê' }; 
                
                tbody.innerHTML = list.map((acc, i) => {
                    const uName = acc.user || acc.username || '';
                    const rRole = (acc.role && String(acc.role).toLowerCase() === 'admin') ? 'Admin' : 'User';
                    const pPerms = acc.perms || acc.permissions || 'ALL';

                    let tenQuyen = "👑 Toàn quyền (Admin)";
                    if (rRole !== 'Admin' && pPerms !== 'ALL') {
                        tenQuyen = pPerms.split(',').map(p => PERM_MAP[p.trim()] || p.trim()).join(', ');
                    }

                    return `<tr class="editable-row" onclick="editAccount(${i})" title="Bấm để sửa tài khoản">
                                    <td align="center">${acc.id || (i + 1)}</td>
                                    <td style="font-size:14px; color:#2c3e50;"><strong>${escapeHtml(uName)}</strong></td>
                                    <td align="center">${acc.hasPassword !== false ? '<span style="color:#27ae60; font-weight:600; font-size:12px;">🔒 Đã bảo mật</span>' : '<span style="color:#e74c3c; font-weight:bold; font-size:12px;">⚠️ Chưa có MK</span>'}</td>
                                    <td align="center"><span style="color:${rRole === 'Admin' ? '#c0392b' : '#2980b9'}; font-weight:bold; background:${rRole === 'Admin' ? '#fadbd8' : '#d6eaf8'}; padding:4px 8px; border-radius:5px;">${rRole}</span></td>
                                    <td style="font-size:12px; line-height:1.6; color:#27ae60; font-weight:500;">${tenQuyen}</td>
                                    <td align="center"><button class="btn-danger" style="border-radius:5px; padding:4px 10px; font-weight:bold; cursor:pointer;" onclick="event.stopPropagation(); deleteAccount('${acc.id || ''}', '${escapeHtml(uName)}')">🗑️ Xóa</button></td>
                                </tr>`;
                }).join('');

            }, err => {
                console.error('[loadAccounts] Lỗi tải tài khoản:', err);
            });

        }



        function editAccount(i) {
            const acc = adminAccCache[i];
            if (!acc) return;

            document.getElementById('acc-id').value = acc.id || '';
            document.getElementById('acc-user').value = acc.user || acc.username || '';

            const passInput = document.getElementById('acc-pass');
            passInput.value = '';
            passInput.placeholder = "(Để trống nếu không đổi MK)";

            const rRole = (acc.role && String(acc.role).toLowerCase() === 'admin') ? 'Admin' : 'User';
            document.getElementById('acc-role').value = rRole;
            togglePermissionsBox();

            const pPerms = acc.perms || acc.permissions || '';
            document.querySelectorAll('.perm-cb').forEach(cb => {
                cb.checked = rRole === 'User' && pPerms ? pPerms.split(',').map(s => s.trim()).includes(cb.value) : false;
            });

            document.getElementById('btn-save-acc').innerText = "Cập nhật MK / Quyền";
        }



        function luuTaiKhoan() {

            const id = document.getElementById('acc-id').value;

            const user = document.getElementById('acc-user').value;

            const pass = document.getElementById('acc-pass').value;

            const role = document.getElementById('acc-role').value;



            if (!user) return showCustomAlert("Lưu ý", "Vui lòng nhập tên tài khoản!");

            // Chỉ bắt buộc nhập mật khẩu nếu là tài khoản tạo mới (không có ID)

            if (!id && !pass) return showCustomAlert("Lưu ý", "Vui lòng nhập mật khẩu cho tài khoản mới!");



            const perms = role === 'User' ?

                Array.from(document.querySelectorAll('.perm-cb:checked')).map(cb => cb.value).join(', ')

                : 'ALL';

            const btn = document.getElementById('btn-save-acc');

            btn.innerText = "Đang lưu..."; btn.disabled = true;

            callApi('saveAccount', [id, user, pass, role, perms], msg => {
                showCustomAlert("Thành công", typeof msg === 'string' ? msg : "Đã lưu tài khoản thành công!");
                huySuaTaiKhoan();
                loadAccounts();
                btn.innerText = "Lưu Tài Khoản";
                btn.disabled = false;
            }, err => {
                showCustomAlert("Lỗi", "Không thể lưu tài khoản: " + (typeof err === 'string' ? err : JSON.stringify(err)));
                btn.innerText = "Lưu Tài Khoản";
                btn.disabled = false;
            });

        }



        function huySuaTaiKhoan() {

            ['acc-id', 'acc-user', 'acc-pass'].forEach(id => {
                const el = document.getElementById(id);

                if (el) el.value = '';
            });

            document.getElementById('acc-pass').placeholder = "Nhập mật khẩu...";

            document.getElementById('acc-role').value = 'User';

            document.querySelectorAll('.perm-cb').forEach(cb => cb.checked = false);

            togglePermissionsBox();

            document.getElementById('btn-save-acc').innerText = "Lưu Tài Khoản";

        }

        function deleteAccount(id, user) {

            if (user.toLowerCase() === 'admin') return showCustomAlert("Cảnh báo bảo mật", "Không được phép xóa tài khoản Admin gốc!");

            showCustomConfirm("Xóa tài khoản", `Bác sĩ có chắc chắn muốn xóa vĩnh viễn tài khoản [ ${user} ] không?`, function () {
                callApi('deleteAccount', [id], () => {
                    loadAccounts();
                    showCustomAlert("Thành công", `Đã xóa tài khoản "${user}" thành công!`);
                }, err => {
                    showCustomAlert("Lỗi", "Không thể xóa tài khoản: " + (typeof err === 'string' ? err : JSON.stringify(err)));
                });
            });

        }



        // ============================================================

        // 🔄 AUTO SYNC

        // ============================================================

        function syncPatients() { loadEntity('getBenhNhan', 'pat', renderPatientsTable, [], true); }

        function syncStaff() {
            loadEntity('getNhanSu', 'staff', renderStaffTable, [
                () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); },
                () => { if (typeof locSotSat === 'function') locSotSat(); }
            ], true);
        }

        function isPatientFormActive() {
            const activeEl = document.activeElement;
            const tabPat = document.getElementById('tab-patients');
            if (!tabPat) return false;

            // 1. Kiểm tra nếu tiêu điểm (focus) nằm trong form của tab-patients
            if (activeEl && tabPat.contains(activeEl) &&
                (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
                return true;
            }

            // 2. Kiểm tra nếu các ô nhập liệu có chứa dữ liệu dở dang
            const patName = document.getElementById('pat-name')?.value || '';
            if (patName.trim() !== '') return true;

            const patYear = document.getElementById('pat-year')?.value || '';
            if (patYear.trim() !== '') return true;

            const patTime = document.getElementById('pat-time')?.value || '';
            if (patTime.trim() !== '') return true;

            const busyStart = document.getElementById('busy-start')?.value || '';
            if (busyStart.trim() !== '') return true;

            const busyEnd = document.getElementById('busy-end')?.value || '';
            if (busyEnd.trim() !== '') return true;

            const patLeave = document.getElementById('pat-leave')?.value || '';
            if (patLeave.trim() !== '') return true;

            // Kiểm tra xem có thủ thuật nào đang được chọn không
            const checkedProcs = document.querySelectorAll('.pat-proc-cb:checked');
            if (checkedProcs.length > 0) return true;

            return false;
        }

        function isBusyFormActive() {
            const activeEl = document.activeElement;
            const tabBusy = document.getElementById('tab-busy');
            if (!tabBusy) return false;

            // 1. Kiểm tra nếu tiêu điểm (focus) nằm trong form của tab-busy
            if (activeEl && tabBusy.contains(activeEl) &&
                (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
                return true;
            }

            // 2. Kiểm tra nếu các ô nhập liệu của tab-busy có chứa dữ liệu dở dang
            const staffFrom = document.getElementById('busy-staff-from')?.value || '';
            if (staffFrom.trim() !== '') return true;

            const staffTo = document.getElementById('busy-staff-to')?.value || '';
            if (staffTo.trim() !== '') return true;

            const patInput = document.getElementById('busy-pat-input')?.value || '';
            if (patInput.trim() !== '') return true;

            const patFrom = document.getElementById('busy-pat-from')?.value || '';
            if (patFrom.trim() !== '') return true;

            const patTo = document.getElementById('busy-pat-to')?.value || '';
            if (patTo.trim() !== '') return true;

            return false;
        }

        function startAutoSync() {
            setInterval(() => {
                if (window.viewingImportedScheduleFile) return;
                const activeTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');

                // Đồng bộ Xếp lịch
                if (activeTab === 'tab-schedule' || activeTab === 'tab-home') {
                    loadScheduleList();
                }

                // Đồng bộ Bệnh Nhân (Bệnh nhân và nhân sự tải tự động khi tab active)
                // Đồng bộ Giờ Bận/Ra Viện (Bệnh nhân và nhân sự tải tự động khi tab active)
            }, 15000); // Tự động cập nhật lịch mỗi 15 giây
        }



        window.onload = function () {

            const sessionStr = localStorage.getItem('meds_session');

            if (sessionStr) {

                const session = JSON.parse(sessionStr);

                document.getElementById('login-overlay').style.display = 'none';

                updateLogoutButton(session.username);

                applyPermissions(session.role, session.permissions);

                if (session.role === 'Admin' && typeof loadAccounts === 'function') {
                    loadAccounts();
                }
                
                startAutoSync();

            } else {

                const overlay = document.getElementById('login-overlay');
                if (overlay) overlay.style.display = 'flex';
                if (typeof clearAllDomTables === 'function') clearAllDomTables(false);
                document.getElementById('login-user')?.focus();

            }

        };

        window.addEventListener('load', function () {

            setTimeout(function () {

                const sessionStr = localStorage.getItem('meds_session');
                if (sessionStr) {
                    if (typeof loadAllData === 'function') loadAllData();
                    if (typeof loadDashboard === 'function') loadDashboard();
                }

            }, 800);

        });





        // ============================================================
        // UI - CHUYỂN TAB ADMIN
        // ============================================================
        window.switchAdminSection = function switchAdminSection(sectionId, btn) {
            document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
            const targetSec = document.getElementById(sectionId);
            if (targetSec) targetSec.style.display = 'flex';

            document.querySelectorAll('.admin-nav-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = '#f1f2f6';
                b.style.color = '#333';
                b.style.borderLeft = '4px solid transparent';
                b.style.borderBottom = '2px solid transparent';
            });

            if (btn) {
                btn.classList.add('active');
                btn.style.background = '#e8f8f5';
                btn.style.color = '#16a085';
                btn.style.borderLeft = '4px solid #16a085';
                btn.style.borderBottom = '2px solid #16a085';
            }

            if (sectionId === 'admin-sec-ai' && typeof window.renderAISettingsUI === 'function') {
                window.renderAISettingsUI();
            }
        }

        // ============================================================
        // ⚙️ CÀI ĐẶT HỆ THỐNG
        // ============================================================
        function luuCaiDatChotSo(btn) {
            const timeVal = document.getElementById("admin-chotso-time").value;
            const yhctLunchVal = document.getElementById("admin-yhct-lunch").value;
            const yhctEndVal = document.getElementById("admin-yhct-end").value;
            const dropW = document.getElementById("admin-weight-drop").value;
            const overtimeW = document.getElementById("admin-weight-overtime").value;
            const imbalanceW = document.getElementById("admin-weight-imbalance").value;
            if (!timeVal) {
                alert("Vui lòng chọn giờ chốt sổ!");
                return;
            }
            const oldText = btn.innerText;
            btn.innerText = "Đang lưu...";
            btn.disabled = true;
            google.script.run.withSuccessHandler(function (res) {
                btn.innerText = oldText;
                btn.disabled = false;
                showCustomAlert("Cài đặt", res, "✅", "#2ecc71");
            }).withFailureHandler(function (err) {
                btn.innerText = oldText;
                btn.disabled = false;
                alert("Lỗi: " + err);
            }).saveSystemSettings({ 
                chotSoTime: timeVal,
                yhctLunch: yhctLunchVal,
                yhctEnd: yhctEndVal,
                dropWeight: dropW,
                overtimeWeight: overtimeW,
                imbalanceWeight: imbalanceW
            });
        }

        function loadSystemSettings() {
            const cachedStr = localStorage.getItem(window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache");
            if (cachedStr) {
                try {
                    const b = JSON.parse(cachedStr);
                    if (b && b.settings) applySystemSettings(b.settings);
                    else applySystemSettings({});
                } catch(e) {
                    applySystemSettings({});
                }
            } else {
                applySystemSettings({});
            }
        }

        // ============================================================

        // 📢 MARQUEE

        // ============================================================

        function luuDongChuChay(btn) {

            const noiDungMoi = document.getElementById('admin-marquee-input').value;

            if (!noiDungMoi) return alert("⚠️ Vui lòng nhập nội dung thông báo trước khi lưu!");

            const textGoc = btn.innerText;

            btn.innerText = "⏳ Đang lưu..."; btn.disabled = true;

            const marqueeTag = document.getElementById('thong-bao-chay');

            if (marqueeTag) marqueeTag.innerText = noiDungMoi;

            google.script.run

                .withSuccessHandler(() => { btn.innerText = textGoc; btn.disabled = false; alert("✅ Đã lưu thông báo mới thành công!"); })

                .withFailureHandler(err => { btn.innerText = textGoc; btn.disabled = false; alert("❌ Lỗi khi lưu: " + err.message); })

                .luuThongBaoDongChuChay(noiDungMoi);

        }



        // ============================================================

        // 🤖 KHO HUẤN LUYỆN AI

        // ============================================================

        function logHL(msg) {
            const el = document.getElementById('hl-log'); if (el) {
                el.value +=

                msg + "\n"; el.scrollTop = el.scrollHeight;
            }
        }

        function parseTimeToMinutes(timeStr) {

            if (!timeStr) return 0;

            const parts = String(timeStr).trim().toLowerCase().replace('h', ':').split(':');

            return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);

        }

        function handleHLFile(event) {

            const file = event.target.files[0];

            if (!file) return;

            logHL("⏳ Đang phân tích file: " + file.name);

            const reader = new FileReader();

            reader.onload = function (e) {

                try {

                    let workbook;

                    try { workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' }); }

                    catch (err) { throw new Error("Cấu trúc file bị hỏng hoặc không đúng chuẩn."); }

                    if (!workbook?.SheetNames?.length) { logHL("❌ LỖI ĐỊNH DẠNG: File bị hỏng. Hãy mở bằng Excel và Save As lại nhé."); event.target.value = ""; return; }



                    function bocTachGioExcel(cellVal) {

                        if (cellVal === undefined || cellVal === null || cellVal === '') return null;

                        if (typeof cellVal === 'number' && cellVal >= 0 && cellVal < 1) {
                            const

                            totalMins = Math.round(cellVal * 24 * 60), h = Math.floor(totalMins / 60), m = totalMins % 60;

                            return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
                        } const

                            match = String(cellVal).trim().match(/(\d{1,2}:\d{2})/); return match ? match[1] :

                                null;
                    } let records = [], formatTypeUsed = ''; const today = new

                        Date().toLocaleDateString('vi-VN'); for (let s = 0; s < workbook.SheetNames.length;

                        s++) {
                            const sheet = workbook.Sheets[workbook.SheetNames[s]]; const

                                rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }); let headerRow = -1,

                                    formatType = '', colIdx = { nv: -1, tt: -1, bd: -1, kt: -1 }; for (let i = 0; i < Math.min(20,

                                        rawData.length); i++) {
                                            const rowArr = rawData[i]; if (!Array.isArray(rowArr))

                                                continue; const rowString = rowArr.join('|').toUpperCase(); if

                                (rowString.includes('HOTEN') && rowString.includes('HSBA') &&

                                !rowString.includes('GIODIENRA')) { headerRow = i; formatType = 'MATRIX'; break; } else

                                if ((rowString.includes('NHANVIEN') || rowString.includes('NHÂN VIÊN')) &&

                                    (rowString.includes('GIODIENRA') || rowString.includes('BẮT ĐẦU'))) {
                                        headerRow = i;

                                    formatType = 'FLAT'; rowArr.forEach((cell, j) => {

                                        const v = String(cell || '').trim().toUpperCase().replace(/\r?\n|\r/g, '');

                                        if (v.includes('NHANVIEN') || v === 'HOTEN' || v.includes('NHÂN VIÊN')) colIdx.nv = j;

                                        if (v.includes('DICHVU') || v.includes('THỦ THUẬT')) colIdx.tt = j;

                                        if (v.includes('GIODIENRA') || v.includes('BẮT ĐẦU')) colIdx.bd = j;

                                        if (v.includes('GIOKETTHUC') || v.includes('KẾT THÚC')) colIdx.kt = j;

                                    });

                                    break;

                                }

                        }

                        if (headerRow === -1) continue;



                        if (formatType === 'FLAT') {

                            for (let i = headerRow + 1; i < rawData.length; i++) {
                                const row = rawData[i]; if

                                    (!Array.isArray(row) || !row.length) continue; const

                                        nv = String(row[colIdx.nv] || '').trim(), tt = colIdx.tt !== -1 ?

                                            String(row[colIdx.tt] || '').trim() : ''; const

                                                timeBD = bocTachGioExcel(row[colIdx.bd]), timeKT = bocTachGioExcel(row[colIdx.kt]);

                                if (nv && timeBD && timeKT) {
                                    const bdMins = parseTimeToMinutes(timeBD),

                                    ktMins = parseTimeToMinutes(timeKT), tgThucTe = ktMins - bdMins; if (tgThucTe > 0 &&

                                        tgThucTe < 480) records.push([today, file.name, nv, tt, bdMins, ktMins,

                                            tgThucTe, bdMins - 420]);
                                }
                            }
                        } else if (formatType === 'MATRIX') {
                            const

                            headers = rawData[headerRow]; for (let i = headerRow + 1; i < rawData.length; i++) {
                                const row = rawData[i]; if (!Array.isArray(row) || !row.length) continue; for

                                    (let j = 2; j < row.length; j++) {
                                        const

                                        lines = String(row[j] || '').trim().split(/\r?\n/); if (lines.length >= 2 &&

                                            lines[0].includes('-')) {

                                        const timeParts = lines[0].split('-'), nv = lines[1]?.trim() || '', tt =

                                            headers[j] ? String(headers[j]).trim() : '';

                                        const timeBD = bocTachGioExcel(timeParts[0]), timeKT =

                                            bocTachGioExcel(timeParts[1]);

                                        if (timeBD && timeKT && nv) {

                                            const bdMins = parseTimeToMinutes(timeBD), ktMins =

                                                parseTimeToMinutes(timeKT), tgThucTe = ktMins - bdMins;

                                            if (tgThucTe > 0 && tgThucTe < 480) records.push([today, file.name, nv, tt,

                                                bdMins, ktMins, tgThucTe, bdMins - 420]);
                                        }
                                    }
                                }
                            }
                        } if (records.length > 0) { formatTypeUsed = formatType; break; }

                    }



                    if (records.length > 0) {

                        logHL(`🚀 Đã bóc tách thành công ${records.length} ca (Dạng

                                                ${formatTypeUsed}). Đang lưu...`);

                        google.script.run.withSuccessHandler(res => {
                            logHL("✅ " + res);

                            loadHLData();
                        }).withFailureHandler(err => logHL("❌ Lỗi lưu: " +

                            err.message)).saveAITrainingData(records);

                    } else logHL("❌ Không tìm thấy dữ liệu giờ giấc hợp lệ trong bất kỳ Sheet nào của file!");

                } catch (err) { logHL("❌ Lỗi kỹ thuật: " + err.message); }

                event.target.value = "";

            };

            reader.readAsArrayBuffer(file);

        }

        function loadHLData() {

            const tbody = document.querySelector('#hl-table tbody');

            if (!tbody) return;

            tbody.innerHTML = `<tr> <td colspan="5" style="text-align:center;">⏳ Đang tải dữ liệu...

                                                    </td>

                                                </tr>`; google.script.run.withSuccessHandler(data => {

                if (!data?.length) {
                    tbody.innerHTML = `<tr> <td colspan="5" style="text-align:center; color:gray">Kho dữ liệu

                                                        hiện đang trống.</td>

                                                </tr>`; return;
                } tbody.innerHTML = data.slice(0, 100).map(row => `<tr>

                                                    <td>${row[0]}</td>

                                                    <td style="font-weight:bold; color:#2c3e50;">${row[2]}</td>

                                                    <td>${row[3]}</td>

                                                    <td style="color:#27ae60; font-weight:bold; text-align:center;">

                                                        ${row[6]} ph</td>

                                                    <td style="text-align:center;">+${row[7]} ph</td>

                                                </tr>`).join('');

            }).getAITrainingData();

        }

        function clearHLData() {

            if (!confirm("⚠️ Bác sĩ có chắc chắn muốn xóa TOÀN BỘ dữ liệu huấn luyện AI? Hành động này không thể hoàn tác!")) return;

            logHL("🗑 Đang tiến hành xóa kho dữ liệu...");

            google.script.run.withSuccessHandler(res => {
                logHL("✅ " + res);

                loadHLData();
            }).clearAITrainingData();

        }

        function exportAIPrompt() {

            logHL("⏳ Đang tạo Siêu lệnh (Mega-Prompt)...");

            google.script.run.withSuccessHandler(data => {

                if (!data?.length) return alert("Chưa có dữ liệu huấn luyện nào!");

                let promptText = "Bạn là Chuyên gia Khoa học Dữ liệu và Quản lý Y tế.\n";

                promptText += "Nhiệm vụ của bạn là tối ưu hóa thuật toán xếp lịch thủ thuật cho Khoa Y học Cổ truyền - Phục hồi Chức năng.\n\n";

                promptText += "BƯỚC 1: Phân tích dữ liệu ca y lệnh dưới đây để tìm quy luật (Nhịp điệu, thời gian thực tế, transition time...).\n";

                promptText += "BƯỚC 2: Tôi sẽ cung cấp code Javascript ở tin nhắn tiếp theo.\n";

                promptText += "BƯỚC 3: Viết lại thuật toán xếp lịch để cân bằng tải.\n\n";

                promptText += "=== KHO DỮ LIỆU HUẤN LUYỆN ===\n";

                promptText += "Ngày | File Nguồn | Nhân Viên | Thủ Thuật | Phút Bắt Đầu | Phút Kết Thúc | Thực Tế (phút) | Khoảng Cách 7h (phút)\n";

                data.forEach(row => { promptText += `${row.join(' | ')}\n`; });

                const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });

                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');

                a.href = url; a.download = `Bo_Nao_AI_Xep_Lich_${new

                    Date().toLocaleDateString('vi-VN').replace(/\//g, '')}.txt`;

                document.body.appendChild(a); a.click(); document.body.removeChild(a);

                URL.revokeObjectURL(url);

                logHL("✅ Đã xuất file thành công!");

            }).getAITrainingData();

        }



        // ============================================================

        // 📅 DATE FORMAT

        // ============================================================

        function autoFormatDate(obj) {

            let val = obj.value.replace(/\D/g, '');

            if (val.length > 8) val = val.substring(0, 8);

            if (val.length >= 5) obj.value =

                `${val.substring(0, 2)}/${val.substring(2, 4)}/${val.substring(4, 8)}`;

            else if (val.length >= 3) obj.value =

                `${val.substring(0, 2)}/${val.substring(2, 4)}`;

            else obj.value = val;

        }



        // ============================================================

        // 🏠 DASHBOARD

        // ============================================================

        function loadDashboard() {
            const datePicker = document.getElementById('dashboard-date-filter');

            if (!datePicker.value) {
                const rawSched = dataCache.schedule || [];
                let activeDateStr = null;
                if (rawSched && rawSched.length > 0) {
                    const firstRow = rawSched[0];
                    activeDateStr = firstRow.ngay || firstRow[0];
                }

                let activeYMD = null;
                if (activeDateStr) {
                    if (activeDateStr.includes('/')) {
                        const parts = activeDateStr.split('/');
                        activeYMD = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    } else {
                        activeYMD = activeDateStr;
                    }
                }

                const d = new Date();
                const safeTodayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                // Tính ngày hôm qua
                const yesterday = new Date(d);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

                if (activeYMD && activeYMD !== safeTodayStr) {
                    // Chỉ cảnh báo nếu ngày cũ là ngày HÔM QUA (cần chốt sổ)
                    // Nếu cũ hơn 1 ngày → đó là cache offline lỗi thời, im lặng reset về hôm nay
                    if (activeYMD === yesterdayStr) {
                        alert(`⚠️ HỆ THỐNG PHÁT HIỆN:\nDữ liệu của ngày ${activeDateStr} chưa được chốt sổ!\nMặc định sẽ hiển thị dữ liệu của ngày này để bạn tiếp tục xử lý.`);
                        datePicker.value = activeYMD;
                    } else {
                        // Cache cũ (>1 ngày), bỏ qua và dùng ngày hôm nay
                        datePicker.value = safeTodayStr;
                        activeYMD = null;
                    }
                } else {
                    datePicker.value = safeTodayStr;
                }

                window._systemActiveYMD = activeYMD;
                // Wait for value change to trigger loadDashboard again, or proceed below
            }

            const selectedDate = datePicker.value;
            const displayEl = document.getElementById('display-date');
            if (displayEl) displayEl.textContent = selectedDate.split('-').reverse().join('/');

            const historyInput = document.getElementById('history-date');
            if (historyInput && historyInput.value !== selectedDate) {
                historyInput.value = selectedDate;
            }

            const d = new Date();
            const safeTodayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const isLiveMode = (window._forceHistoryMode === true) ? false : ((window._systemActiveYMD === selectedDate) || (!window._systemActiveYMD && selectedDate === safeTodayStr));
            window._forceHistoryMode = false;

            if (isLiveMode) {
                window.viewingImportedScheduleFile = false;
                if (typeof restoreHistoryTabs === 'function') restoreHistoryTabs();

                const patData = dataCache.pat || [];
                const elBN = document.getElementById('statBN');
                if (elBN) elBN.textContent = patData.length;

                let totalProcs = 0;
                patData.forEach(p => {
                    if (p.thuThuat) {
                        const count = String(p.thuThuat).split(',').map(x => x.trim()).filter(x => x).length;
                        totalProcs += count;
                    }
                });

                const staffData = dataCache.staff || [];
                const working = staffData.filter(s => {
                    const st = s.trangThai || '';
                    const r = s.vaiTro || '';
                    return st === 'Đi làm' && r !== 'Điều dưỡng';
                }).length;
                const elStaff = document.getElementById('statStaff');
                if (elStaff) elStaff.textContent = working;

                const statScheduledEl = document.getElementById('statScheduled');
                const statDroppedEl = document.getElementById('statDropped');
                
                let rawSched = (dataCache && dataCache.schedule && dataCache.schedule.length) ? dataCache.schedule : (window.currentScheduleData || []);
                if (!rawSched.length) {
                    try {
                        const curUnit = getCurrentUnitCode();
                        const savedUnit = (localStorage.getItem('meds_schedule_unit') || '').toLowerCase();
                        // Chỉ dùng cache local NẾU có savedUnit VÀ đúng đơn vị hiện hành!
                        if (savedUnit && savedUnit === curUnit) {
                            const localSched = JSON.parse(localStorage.getItem(getUnitStorageKey('meds_success')) || localStorage.getItem('meds_success') || '[]');
                            if (Array.isArray(localSched) && localSched.length) {
                                // ✅ Kiểm tra ngày của lịch cũ trước khi dùng
                                const savedDate = localStorage.getItem(getUnitStorageKey('meds_schedule_date')) || localStorage.getItem('meds_schedule_date') || '';
                                const nowVN2 = new Date(Date.now() + 7 * 60 * 60 * 1000);
                                const todayYMD2 = `${nowVN2.getUTCFullYear()}-${String(nowVN2.getUTCMonth() + 1).padStart(2, '0')}-${String(nowVN2.getUTCDate()).padStart(2, '0')}`;
                                const toYMD2 = (s) => {
                                    if (!s) return '';
                                    if (String(s).includes('/')) { const p = String(s).split('/'); return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`; }
                                    return String(s);
                                };
                                const schedDate = savedDate ? toYMD2(savedDate) : toYMD2(localSched[0]?.[0] || localSched[0]?.ngay || localSched[0]?.NGAY || '');
                                if (!schedDate || schedDate === todayYMD2) {
                                    // Lịch đúng ngày hôm nay → dùng bình thường
                                    rawSched = localSched;
                                    if (typeof dataCache !== 'undefined') dataCache.schedule = localSched;
                                    if (window.dataCache) window.dataCache.schedule = localSched;
                                    window.currentScheduleData = (typeof markDischargedInSchedule === 'function') ? markDischargedInSchedule(localSched) : localSched;
                                } else {
                                    localStorage.removeItem(getUnitStorageKey('meds_success'));
                                    localStorage.removeItem(getUnitStorageKey('meds_schedule_date'));
                                    localStorage.removeItem('meds_success');
                                    localStorage.removeItem('meds_schedule_date');
                                    localStorage.removeItem('meds_schedule_unit');
                                }
                            }
                        } else {
                            rawSched = [];
                        }
                    } catch(e) {
                        rawSched = [];
                    }
                }

                const toYMD = (dateStr) => {
                    if (!dateStr) return '';
                    const s = String(dateStr).trim();
                    if (s.includes('/')) {
                        const parts = s.split('/');
                        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                    return s;
                };

                const validData = (rawSched || []).filter(item => {
                    const itemDate = item.ngay || item.NGAY || item[0];
                    if (!itemDate) return true;
                    return toYMD(itemDate) === toYMD(selectedDate);
                });

                const dayData = validData.filter(item => {
                    const g = String(item.gioDienRa || item.GIODIENRA || item[5] || '');
                    return g && g !== '--' && !g.includes('Rớt');
                }).map(item => [
                    item.ngay || item.NGAY || item[0] || selectedDate,
                    item.tenBN || item.HOTEN || item[1] || '',
                    item.namSinh || item.NAMSINH || item[2] || '',
                    item.phong || item.PHONG || item[3] || '',
                    item.thuThuat || item.DICHVU || item[4] || '',
                    item.gioDienRa || item.GIODIENRA || item[5] || '',
                    item.gioKetThuc || item.GIOKETTHUC || item[6] || '',
                    item.nvChinh || item['NV CHÍNH'] || item[7] || '',
                    item.nvPhu || item['NV PHỤ'] || item[8] || '',
                    item.may || item.MAY || item[9] || '',
                    item.giuong || item.GIUONG || item[10] || ''
                ]);

                const rotDataSheets = validData.filter(item => {
                    const g = String(item.gioDienRa || item.GIODIENRA || item[5] || '');
                    return g === '--' || g.includes('Rớt');
                }).map(item => [
                    item.ngay || item.NGAY || item[0] || selectedDate,
                    item.tenBN || item.HOTEN || item[1] || '',
                    item.namSinh || item.NAMSINH || item[2] || '',
                    item.phong || item.PHONG || item[3] || '',
                    item.thuThuat || item.DICHVU || item[4] || '',
                    '❌ Rớt', '--', '--', '--', '--', '--', 'Thiếu nhân sự/Máy'
                ]);

                let rotDataLocal = [];
                try {
                    const curUnit = getCurrentUnitCode();
                    const savedUnit = (localStorage.getItem('meds_schedule_unit') || '').toLowerCase();
                    if (savedUnit && savedUnit === curUnit) {
                        const activeDate = localStorage.getItem(getUnitStorageKey('meds_schedule_date')) || localStorage.getItem('meds_schedule_date') || '';
                        if (toYMD(activeDate) === toYMD(selectedDate) || !activeDate) {
                            rotDataLocal = (JSON.parse(localStorage.getItem(getUnitStorageKey('meds_unscheduled')) || localStorage.getItem('meds_unscheduled') || '[]')).map(u => [
                                selectedDate, u.bn || u.tenBN || '', u.ns || u.namSinh || '',
                                u.room || u.phong || '', u.tt || u.thuThuat || '',
                                '❌ Rớt', '--', '--', '--', '--', '--', u.reason || 'Quá tải/Hết giờ'
                            ]);
                        }
                    }
                } catch (e) { rotDataLocal = []; }

                const rotData = rotDataSheets.length > 0 ? rotDataSheets : rotDataLocal;

                if (statScheduledEl) statScheduledEl.textContent = dayData.length;
                if (statDroppedEl) statDroppedEl.textContent = rotData.length;
                const totalProcsEl = document.getElementById('statTotalProcs');
                const schedTotal = dayData.length + rotData.length;
                if (totalProcsEl) totalProcsEl.textContent = (schedTotal > 0) ? schedTotal : totalProcs;

                if (typeof renderDashboardPreview === 'function') renderDashboardPreview([...dayData, ...rotData]);
                if (typeof renderCharts === 'function') renderCharts(dayData);
                if (typeof renderDashboardMonthlyCharts === 'function') renderDashboardMonthlyCharts(selectedDate);
            } else {
                // --- CHẾ ĐỘ LỊCH SỬ ---
                const statScheduledEl = document.getElementById('statScheduled');
                const statDroppedEl = document.getElementById('statDropped');
                const statBN = document.getElementById('statBN');
                const statStaff = document.getElementById('statStaff');
                if (statScheduledEl) statScheduledEl.textContent = "...";
                if (statDroppedEl) statDroppedEl.textContent = "...";
                if (statBN) statBN.textContent = "...";
                if (statStaff) statStaff.textContent = "...";
                const statTotalProcsEl = document.getElementById('statTotalProcs');
                if (statTotalProcsEl) statTotalProcsEl.textContent = "...";

                const processHistoryData = (data) => {
                    const fullData = Array.isArray(data) ? { schedule: data, patients: [], staffBusy: [], patBusy: [] } : data;

                    window._historyCache = window._historyCache || {};
                    window._historyCache[selectedDate] = fullData;
                    window.viewingImportedScheduleFile = true;
                    window._viewingHistoryDate = selectedDate;
                    window.currentScheduleData = markDischargedInSchedule(fullData.schedule || []);

                    if (typeof applyHistoryDataToTabs === 'function') applyHistoryDataToTabs(fullData, selectedDate);
                    if (typeof filterSchedule === 'function') filterSchedule();

                    if (statBN) statBN.textContent = (fullData.patients || []).length;
                    if (statStaff) statStaff.textContent = (fullData.staffBusy || []).length;

                    const sched = fullData.schedule || [];
                    const dayData = sched.filter(item => { const g = item.gioDienRa || ''; return g && g !== '--' && !g.includes('Rớt'); }).map(item => [item.ngay, item.tenBN, item.namSinh, item.phong, item.thuThuat, item.gioDienRa, item.gioKetThuc, item.nvChinh, item.nvPhu, item.may, item.giuong]);
                    const rotData = sched.filter(item => { const g = item.gioDienRa || ''; return g === '--' || g.includes('Rớt'); }).map(item => [item.ngay, item.tenBN, item.namSinh, item.phong, item.thuThuat, '❌ Rớt', '--', '--', '--', '--', '--', 'Thiếu nhân sự/Máy']);

                    if (statScheduledEl) statScheduledEl.textContent = dayData.length;
                    if (statDroppedEl) statDroppedEl.textContent = rotData.length;

                    if (typeof renderDashboardPreview === 'function') renderDashboardPreview([...dayData, ...rotData]);
                    if (typeof renderCharts === 'function') renderCharts(dayData);
                };

                if (window._historyCache && window._historyCache[selectedDate]) {
                    processHistoryData(window._historyCache[selectedDate]);
                    if (window.showToast) window.showToast("Đã tải dữ liệu lịch sử từ bộ nhớ", "info", 2000);
                } else {
                    if (window.showGlobalLoading) window.showGlobalLoading("Đang tải dữ liệu lịch sử...");
                    google.script.run.withSuccessHandler(data => {
                        processHistoryData(data);
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        if (window.showToast) window.showToast("Đã tải xong dữ liệu lịch sử!", "success");
                    }).withFailureHandler(err => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        console.error("Lỗi tải lịch sử Dashboard: " + err);
                        if (statScheduledEl) statScheduledEl.textContent = "0";
                        if (statDroppedEl) statDroppedEl.textContent = "0";
                        if (statBN) statBN.textContent = "0";
                        if (statStaff) statStaff.textContent = "0";
                        if (statTotalProcsEl) statTotalProcsEl.textContent = "0";
                        if (window.showToast) window.showToast("Lỗi tải dữ liệu lịch sử: " + err, "error");
                    }).getHistoryFullData(selectedDate);
                }
            }
        }

        function renderDashboardMonthlyCharts(dateStr) {
            let targetDate = new Date();
            if (dateStr) {
                const parts = String(dateStr).split('-');
                if (parts.length === 3) {
                    targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                }
            }
            const y = targetDate.getFullYear() || new Date().getFullYear();
            const m = String(targetDate.getMonth() + 1).padStart(2, '0');
            const monthYear = `${y}-${m}`;
            const subTitle = `(Tháng ${m}/${y})`;

            const elSub1 = document.getElementById('dash-chart-workdays-subtitle');
            if (elSub1) elSub1.innerText = subTitle;
            const elSub2 = document.getElementById('dash-chart-procs-subtitle');
            if (elSub2) elSub2.innerText = subTitle;

            if (typeof Chart === 'undefined') return;

            const drawValuePlugin = {
                id: 'dashDrawValuePlugin',
                afterDatasetsDraw(chart) {
                    const { ctx } = chart;
                    const isDarkChart = (document.documentElement.getAttribute('data-theme') === 'dark');
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const val = dataset.data[index];
                            if (val !== undefined && val !== null && val > 0) {
                                ctx.save();
                                ctx.fillStyle = isDarkChart ? '#f8fafc' : '#334155';
                                ctx.font = 'bold 11px Inter, sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(String(val).replace('.', ','), bar.x, bar.y - 3);
                                ctx.restore();
                            }
                        });
                    });
                }
            };

            const processCharts = (ccData, ttData) => {
                const cc = ccData || {};
                const tt = ttData || {};
                const daysInMonth = new Date(y, parseInt(m, 10), 0).getDate();

                let empList = [];
                if (typeof dataCache !== 'undefined' && dataCache.staff && dataCache.staff.length > 0) {
                    empList = dataCache.staff.map(s => s.ten || s.name || s[1]).filter(Boolean);
                } else if (typeof adminChamCongEmployees !== 'undefined' && Array.isArray(adminChamCongEmployees) && adminChamCongEmployees.length > 0) {
                    empList = [...adminChamCongEmployees];
                } else {
                    empList = Array.from(new Set([...Object.keys(cc), ...Object.keys(tt)])).filter(Boolean);
                }

                // 1. Dữ liệu ngày công
                const workdaysArr = empList.map(emp => {
                    let totalCong = 0;
                    if (cc[emp]) {
                        for (let d = 1; d <= daysInMonth; d++) {
                            const raw = cc[emp][d] || '';
                            if (typeof calcDayValue === 'function') totalCong += calcDayValue(raw);
                            else if (typeof window.calcDayValue === 'function') totalCong += window.calcDayValue(raw);
                            else if (raw === 'ca-ngay' || raw === 'X' || raw === 'x') totalCong += 1;
                            else if (raw === 'sang' || raw === 'chieu' || raw === 'S' || raw === 'C') totalCong += 0.5;
                        }
                        const heSo = cc[emp].heSo !== undefined ? parseFloat(cc[emp].heSo) : 1.0;
                        totalCong = Math.round((totalCong * heSo) * 100) / 100;
                    }
                    return { name: emp, val: totalCong };
                }).filter(x => x.val > 0).sort((a, b) => b.val - a.val);

                // 2. Dữ liệu thủ thuật
                const procsArr = empList.map(emp => {
                    let totalTT = 0;
                    if (tt[emp]) {
                        totalTT = (tt[emp].loai1 || 0) + (tt[emp].loai2 || 0) + (tt[emp].loai3 || 0) + (tt[emp].khac || 0);
                    }
                    return { name: emp, val: totalTT };
                }).filter(x => x.val > 0).sort((a, b) => b.val - a.val);

                const isDarkTheme = (document.documentElement.getAttribute('data-theme') === 'dark');
                const chartLabelColor = isDarkTheme ? '#cbd5e1' : '#334155';
                const chartSubColor = isDarkTheme ? '#94a3b8' : '#64748b';
                const chartGridColor = isDarkTheme ? '#334155' : '#f1f5f9';

                // Biểu đồ 1: Ngày công
                const canvas1 = document.getElementById('canvas-dash-workdays');
                if (canvas1) {
                    const ctx1 = canvas1.getContext('2d');
                    if (window._dashWorkdaysChart) window._dashWorkdaysChart.destroy();
                    const maxVal1 = workdaysArr.length ? Math.max(...workdaysArr.map(d => d.val)) : 10;
                    window._dashWorkdaysChart = new Chart(ctx1, {
                        type: 'bar',
                        data: {
                            labels: workdaysArr.map(d => d.name),
                            datasets: [{
                                label: 'Ngày công',
                                data: workdaysArr.map(d => d.val),
                                backgroundColor: '#38bdf8',
                                borderColor: '#0284c7',
                                borderWidth: 1,
                                borderRadius: 3,
                                barPercentage: 0.65,
                                categoryPercentage: 0.8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            layout: { padding: { top: 20, bottom: 5 } },
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                    labels: {
                                        boxWidth: 20,
                                        boxHeight: 10,
                                        font: { size: 12, weight: '600' },
                                        color: chartLabelColor
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => ` Ngày công: ${String(ctx.raw).replace('.', ',')}`
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    ticks: {
                                        font: { size: 10.5, weight: '600' },
                                        color: chartLabelColor,
                                        maxRotation: 45,
                                        minRotation: 35
                                    },
                                    grid: { display: false }
                                },
                                y: {
                                    beginAtZero: true,
                                    suggestedMax: Math.ceil(maxVal1 * 1.15),
                                    ticks: {
                                        font: { size: 11 },
                                        color: chartSubColor,
                                        stepSize: 2
                                    },
                                    grid: { color: chartGridColor }
                                }
                            }
                        },
                        plugins: [drawValuePlugin]
                    });
                }

                // Biểu đồ 2: Thủ thuật
                const canvas2 = document.getElementById('canvas-dash-procs');
                if (canvas2) {
                    const ctx2 = canvas2.getContext('2d');
                    if (window._dashProcsChart) window._dashProcsChart.destroy();
                    const maxVal2 = procsArr.length ? Math.max(...procsArr.map(d => d.val)) : 50;
                    window._dashProcsChart = new Chart(ctx2, {
                        type: 'bar',
                        data: {
                            labels: procsArr.map(d => d.name),
                            datasets: [{
                                label: 'Thủ thuật',
                                data: procsArr.map(d => d.val),
                                backgroundColor: '#e11d48',
                                borderColor: '#be123c',
                                borderWidth: 1,
                                borderRadius: 3,
                                barPercentage: 0.65,
                                categoryPercentage: 0.8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            layout: { padding: { top: 20, bottom: 5 } },
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                    labels: {
                                        boxWidth: 20,
                                        boxHeight: 10,
                                        font: { size: 12, weight: '600' },
                                        color: chartLabelColor
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => ` Thủ thuật: ${ctx.raw}`
                                    }
                                }
                            },
                            scales: {
                                x: {
                                    ticks: {
                                        font: { size: 10.5, weight: '600' },
                                        color: chartLabelColor,
                                        maxRotation: 45,
                                        minRotation: 35
                                    },
                                    grid: { display: false }
                                },
                                y: {
                                    beginAtZero: true,
                                    suggestedMax: Math.ceil(maxVal2 * 1.15),
                                    ticks: {
                                        font: { size: 11 },
                                        color: chartSubColor,
                                        stepSize: 10
                                    },
                                    grid: { color: chartGridColor }
                                }
                            }
                        },
                        plugins: [drawValuePlugin]
                    });
                }
            };

            if (typeof window.fetchSingleMonthData === 'function') {
                window.fetchSingleMonthData(monthYear).then(res => {
                    const mData = res?.data || {};
                    processCharts(mData.chamcong, mData.thuthuat);
                });
            } else if (typeof chamCongData !== 'undefined' && typeof thongKeData !== 'undefined') {
                processCharts(chamCongData, thongKeData);
            }
        }

        window.renderDashboardMonthlyCharts = renderDashboardMonthlyCharts;

        function renderCharts(data) {

            const valid = data.filter(r => r[4] && r[7]);

            // Build lookups from dataCache
            const staffRoleMap = {};   // ten(lower) -> vaiTro(lower)
            (dataCache.staff || []).forEach(s => { if (s.ten) staffRoleMap[s.ten.trim().toLowerCase()] = String(s.vaiTro || '').trim().toLowerCase(); });

            const procCategoryMap = {}; // ten(lower) -> he(upper)
            (dataCache.proc || []).forEach(p => { if (p.ten) procCategoryMap[p.ten.trim().toLowerCase()] = String(p.he || 'PHCN').trim().toUpperCase(); });

            const staffLoadBS = {}, staffLoadKTV = {};
            const procCountYHCT = {}, procCountPHCN = {};

            if (valid.length > 0) {
                valid.forEach(r => {
                    const nvChinh = (r[7] || '').trim();
                    const thuThuat = (r[4] || '').trim();
                    const role = staffRoleMap[nvChinh.toLowerCase()] || '';

                    let isDoctor = false;
                    if (role) {
                        isDoctor = role.includes('b\u00e1c s\u0129') || role.includes('bs');
                    } else {
                        const lowerName = nvChinh.toLowerCase();
                        isDoctor = lowerName.startsWith('bs') || lowerName.includes('b\u00e1c s\u0129');
                    }

                    if (isDoctor) staffLoadBS[nvChinh] = (staffLoadBS[nvChinh] || 0) + 1;
                    else staffLoadKTV[nvChinh] = (staffLoadKTV[nvChinh] || 0) + 1;

                    const cat = procCategoryMap[thuThuat.toLowerCase()] || 'PHCN';
                    if (cat === 'YHCT') procCountYHCT[thuThuat] = (procCountYHCT[thuThuat] || 0) + 1;
                    else procCountPHCN[thuThuat] = (procCountPHCN[thuThuat] || 0) + 1;
                });
            } else {
                // Fallback: Khi chưa xếp lịch, tính phân bổ thủ thuật từ danh sách bệnh nhân hiện tại (realtime)
                (dataCache.pat || []).forEach(p => {
                    if (p.thuThuat) {
                        const procs = String(p.thuThuat).split(',').map(x => x.trim()).filter(x => x);
                        procs.forEach(thuThuat => {
                            const cat = procCategoryMap[thuThuat.toLowerCase()] || 'PHCN';
                            if (cat === 'YHCT') procCountYHCT[thuThuat] = (procCountYHCT[thuThuat] || 0) + 1;
                            else procCountPHCN[thuThuat] = (procCountPHCN[thuThuat] || 0) + 1;
                        });
                    }
                });
            }

            const colorsBS   = ['#1a3a5c', '#1f4d7a', '#245f96', '#2a72b3', '#3080c0', '#4a94cf', '#63a5d9', '#7db5e0', '#97c5e8', '#b0d4f0'];
            const colorsKTV  = ['#1e3d2b', '#2d5a3d', '#3e6b4f', '#4a7c5f', '#5a8d70', '#6a9e80', '#7aaf91', '#8abfa2', '#9ad0b3', '#aae0c4'];
            const colorsYHCT = ['#5a2d0c', '#7a3d10', '#9a5015', '#b86320', '#d07830', '#d98f50', '#e2a670', '#eabd90', '#f0d1b0', '#f5e4cc'];
            const colorsPHCN = ['#1e3d2b', '#2d5a3d', '#3e6b4f', '#4a7c5f', '#5a8d70', '#6a9e80', '#7aaf91', '#8abfa2', '#9ad0b3', '#aae0c4'];

            const barRow = (label, val, max, color) => `
                <div class="dash-chart-row" style="display:flex;align-items:center;gap:6px;margin-bottom:7px;">
                    <div style="width:80px;min-width:80px;font-size:0.71rem;color:#2c3e50;font-weight:600;text-align:left;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" title="${label}">${label}</div>
                    <div style="flex:1;height:12px;background:#f1f3f5;border-radius:6px;overflow:hidden;">
                        <div style="width:${(val / max * 100)}%;height:100%;background:linear-gradient(90deg,${color}cc,${color});border-radius:6px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1);"></div>
                    </div>
                    <div style="width:22px;min-width:22px;font-size:0.71rem;color:#2c3e50;font-weight:bold;text-align:right;">${val}</div>
                </div>`;

            const renderGroup = (containerId, entries, colors) => {
                const el = document.getElementById(containerId);
                if (!el) return;
                if (!entries.length) {
                    el.innerHTML = '<div style="padding:20px;text-align:center;color:#bbb;font-size:0.78rem;">Không có dữ liệu</div>';
                    return;
                }
                const max = entries[0][1] || 1;
                el.innerHTML = entries.map((e, i) => barRow(e[0], e[1], max, colors[i % colors.length])).join('');
            };

            renderGroup('staffLoadChart-bs',   Object.entries(staffLoadBS).sort((a,b)=>b[1]-a[1]).slice(0,10),   colorsBS);
            renderGroup('staffLoadChart-ktv',  Object.entries(staffLoadKTV).sort((a,b)=>b[1]-a[1]).slice(0,10),  colorsKTV);
            renderGroup('procDistChart-yhct',  Object.entries(procCountYHCT).sort((a,b)=>b[1]-a[1]).slice(0,10), colorsYHCT);
            renderGroup('procDistChart-phcn',  Object.entries(procCountPHCN).sort((a,b)=>b[1]-a[1]).slice(0,10), colorsPHCN);

        }

        function refreshDashboard() {

            const picker = document.getElementById('dashboard-date-filter');

            if (picker) {
                const t = new Date(); picker.value =

                    `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;

            }

            if (typeof loadDashboard === 'function') loadDashboard();

        }



        // ============================================================

        // ⏰ ĐỒNG HỒ

        // ============================================================

        function updateClock() {

            const now = new Date();

            const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

            const pad = n => String(n).padStart(2, '0');

            document.getElementById('clock-time').textContent =

                `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            document.getElementById('clock-date').textContent =

                `${days[now.getDay()]},

                                                ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

        }

        updateClock(); setInterval(updateClock, 1000);



        // ============================================================

        // 💬 POPUP XÁCNHẬN / CẢNH BÁO

        // ============================================================

        let globalConfirmCallback = null;

        function showCustomConfirm(title, message, callback) {

            document.getElementById('confirm-title').innerText = title;

            document.getElementById('confirm-message').innerHTML = message;

            globalConfirmCallback = callback;

            document.getElementById('custom-confirm-modal').style.display = 'flex';

        }

        function showCustomAlert(title, message, icon = '💡', btnColor = '#3498db') {

            const iconEl = document.getElementById('gca-icon');
            const titleEl = document.getElementById('gca-title');
            const msgEl = document.getElementById('gca-message');
            const btn = document.querySelector("#global-custom-alert button");

            // Xóa badge phụ cũ nếu có
            const oldBadge = document.getElementById('gca-success-badge');
            if (oldBadge) oldBadge.remove();

            const isSucc = (btnColor === '#27ae60' || btnColor === '#2ecc71' || btnColor === '#00b894')
                || (typeof title === 'string' && title.toLowerCase().includes('thành công'))
                || (typeof message === 'string' && message.toLowerCase().includes('thành công') && !title.toLowerCase().includes('lỗi'));

            if (isSucc) {
                if (iconEl) iconEl.innerText = '✅';
                if (titleEl) {
                    titleEl.innerText = 'Thành công';
                    titleEl.style.fontSize = '24px';
                    titleEl.style.color = '#27ae60';
                    titleEl.style.fontWeight = 'bold';
                    titleEl.style.margin = '10px 0 20px 0';
                }
                if (msgEl) msgEl.style.display = 'none';
                if (btn) btn.style.backgroundColor = '#27ae60';
            } else {
                if (iconEl) iconEl.innerText = icon;
                if (titleEl) {
                    titleEl.innerText = title;
                    titleEl.style.fontSize = '20px';
                    titleEl.style.color = '#333';
                    titleEl.style.fontWeight = 'bold';
                    titleEl.style.margin = '0 0 10px 0';
                }
                if (msgEl) {
                    msgEl.style.display = 'block';
                    msgEl.innerHTML = message;
                }
                if (btn) btn.style.backgroundColor = btnColor;
            }

            document.getElementById('global-custom-alert').style.display = 'flex';

        }

        document.getElementById('confirm-ok-btn').onclick = function () {

            if (globalConfirmCallback) globalConfirmCallback();

            document.getElementById('custom-confirm-modal').style.display = 'none';

        };

        document.addEventListener('keydown', function (event) {

            const confirmModal = document.getElementById('custom-confirm-modal');

            const alertModal = document.getElementById('global-custom-alert');

            const successModal = document.getElementById('custom-success-popup');

            if (confirmModal?.style.display === 'flex') {

                if (event.key === 'Enter') {
                    event.preventDefault();

                    document.getElementById('confirm-ok-btn').click();
                }

                else if (event.key === 'Escape') {
                    event.preventDefault();

                    confirmModal.style.display = 'none';
                }

                return;

            }

            if (alertModal?.style.display === 'flex') {

                if (event.key === 'Enter' || event.key === 'Escape') {

                    event.preventDefault(); alertModal.style.display = 'none';
                }

                return;

            }

            if (successModal && (successModal.style.display === 'flex' ||

                successModal.style.display === 'block')) {

                if (event.key === 'Enter' || event.key === 'Escape') {

                    event.preventDefault(); successModal.style.display = 'none';
                }

                return; // Nếu popup thành công đang mở thì chỉ đóng popup, không lưu form

            }



            // ⚠️ ĐÃ XÓA: Xử lý Enter tự động click nút Lưu/Thêm được
            // xử lý tập trung tại listener ở trên (~dòng 7261)
            // để tránh savePatient() bị gọi 2 lần gây trùng dữ liệu.

        });




        function checkUnclosedDay() {
            const d = new Date();
            const safeTodayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (window._systemActiveYMD && window._systemActiveYMD < safeTodayStr) {
                const displayOldDate = window._systemActiveYMD.split('-').reverse().join('/');
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert("⚠️ CHƯA CHỐT SỔ NGÀY CŨ",
                        "Hệ thống phát hiện dữ liệu ngày cũ (<b>" + displayOldDate + "</b>) chưa được chốt sổ!<br><br>" +
                        "Để tránh mất mát và xung đột dữ liệu, toàn bộ thao tác chỉnh sửa bệnh nhân, giờ bận, và giờ ra viện đã bị khóa.<br><br>" +
                        "Vui lòng thực hiện <b>Chốt sổ</b> ngày cũ trước khi tiếp tục thao tác dữ liệu.",
                        "⚠️", "#e74c3c");
                } else {
                    alert("⚠️ CHƯA CHỐT SỔ NGÀY CŨ\n\nHệ thống phát hiện ngày cũ (" + displayOldDate + ") chưa được chốt sổ!\n\nVui lòng thực hiện Chốt sổ trước khi tiếp tục.");
                }
                return true;
            }
            return false;
        }


        // TỐI ƯU UX 2: Tự động định dạng Giờ và Ngày khi gõ tắt (0830 -> 08:30)

        document.addEventListener('focusout', function (e) {

            if (e.target && e.target.tagName === 'INPUT') {

                const val = e.target.value.trim();

                if (!val) return;



                // Tự động định dạng giờ (gõ 830 hoặc 0830 -> 08:30)

                if (e.target.id.includes('-time') || e.target.id.includes('-gio') || e.target.id.includes('gio-') || e.target.id.includes('-leave') || e.target.classList.contains('time-input')) {

                    if (/^\d{3,4}$/.test(val)) {

                        let formatted = val.length === 3 ? '0' + val : val;

                        e.target.value = formatted.substring(0, 2) + ':' + formatted.substring(2);

                    }

                }



                // Tự động định dạng ngày (gõ 120526 hoặc 12052026 -> 12/05/2026)

                if (e.target.id.includes('-date') || e.target.id.includes('-ngay') || e.target.id.includes('ngay-') || e.target.classList.contains('date-input')) {

                    if (/^\d{6}$/.test(val)) {

                        e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4) + '/20' + val.substring(4);

                    } else if (/^\d{8}$/.test(val)) {

                        e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);

                    }

                }

            }

        });



        // TỐI ƯU UX 3: Click đúp vào ô Thời gian (Giờ vào, Giờ ra, Giờ bận) để tự động điền GIỜ HIỆN TẠI

        document.addEventListener('dblclick', function (e) {

            if (e.target && e.target.tagName === 'INPUT') {

                if (e.target.id.includes('-time') || e.target.id.includes('-gio') || e.target.id.includes('gio-') || e.target.id.includes('-leave') || e.target.classList.contains('time-input')) {

                    const now = new Date();

                    const hh = String(now.getHours()).padStart(2, '0');

                    const mm = String(now.getMinutes()).padStart(2, '0');

                    e.target.value = `${hh}:${mm}`;

                    // Bôi đen để người dùng dễ nhìn thấy dữ liệu vừa được điền

                    e.target.select();

                }

            }

        });



        // --- Script Blocks Merged ---



        // -----------------------------------------------------------

        // 📌 HASH ROUTING LOGIC

        // -----------------------------------------------------------

        document.addEventListener('DOMContentLoaded', function () {

            // Override logic chuyển tab cũ

            const tabs = document.querySelectorAll('.nav-tab, .nav-item');



            // 1. Lắng nghe Hash Change

            window.addEventListener('hashchange', handleHashChange);



            // 2. Chạy lần đầu khi load trang

            if (window.location.hash) {

                handleHashChange();

            } else {

                // Mặc định mở tab-home

                window.location.hash = '#tab-home';

            }



            // 3. Sửa lại event click của các tab để chỉ đổi hash

            tabs.forEach(tab => {

                // Bỏ event click cũ bằng cách clone node nếu cần, nhưng tốt nhất là ngăn chặn hành vi mặc định

                tab.addEventListener('click', function (e) {

                    if (typeof window.flushPendingChamCongSave === 'function') {
                        try { window.flushPendingChamCongSave(); } catch(e) {}
                    }

                    e.preventDefault();

                    e.stopPropagation(); // Ngăn event cũ (đã gán trước đó) chạy

                    const targetTab = tab.getAttribute('data-tab');

                    window.location.hash = '#' + targetTab;

                }, true); // Use capture phase to intercept

            });



            function handleHashChange() {

                if (typeof window.flushPendingChamCongSave === 'function') {
                    try { window.flushPendingChamCongSave(); } catch(e) {}
                }

                let hash = window.location.hash;

                if (!hash) hash = '#tab-home';



                let targetTab = hash.substring(1); // Xóa dấu #



                // Cập nhật giao diện

                tabs.forEach(t => t.classList.remove('active'));

                let activeBtn = document.querySelector(`[data-tab="${targetTab}"]`);

                if (activeBtn) activeBtn.classList.add('active');



                document.querySelectorAll('.tab-content, .page').forEach(c => c.classList.remove('active'));

                let targetEl = document.getElementById(targetTab);

                if (targetEl) targetEl.classList.add('active');



                // Điều chỉnh class body như logic cũ

                document.body.classList.toggle('tab-sat-active', targetTab === 'tab-sat');

                document.body.classList.toggle('tab-schedule-active', targetTab === 'tab-schedule');



                // Kích hoạt load dữ liệu riêng

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

                if (targetTab === 'tab-chamcong') {

                    if (typeof loadChamCongData === 'function') loadChamCongData();

                }

                if (targetTab === 'tab-tenants') {
                    if (typeof loadTenantsList === 'function') loadTenantsList();
                }
                if (targetTab === 'tab-procedures') {
                    if (typeof renderProceduresTable === 'function') renderProceduresTable();
                    if (typeof renderProtoProcsFormCheckboxes === 'function') renderProtoProcsFormCheckboxes();
                    if (typeof renderProtocolsTable === 'function') renderProtocolsTable();
                }
                if (targetTab === 'tab-rooms' && typeof renderDynamicMachineInputs === 'function') {
                    renderDynamicMachineInputs();
                }
                if (targetTab === 'tab-admin') {
                    if (typeof loadSystemSettings === 'function') loadSystemSettings();
                    if (typeof switchAdminSection === 'function') {
                        const activeSubBtn = document.querySelector('.admin-nav-btn.active') || document.getElementById('nav-btn-settings');
                        switchAdminSection('admin-sec-settings', activeSubBtn);
                    }
                }
                if (targetTab === 'tab-thongke') {

                    if (typeof loadThongKeData === 'function') loadThongKeData();

                }

                if ((targetTab === 'tab-staff' || targetTab === 'tab-patients') && typeof renderProcedureCheckboxes === 'function') {

                    renderProcedureCheckboxes();

                }

            }

        });

        // --- USER MENU DROPDOWN LOGIC ---
        window.goToAdminTab = function() {
            const dropMenu = document.getElementById('user-dropdown-menu');
            if (dropMenu) dropMenu.style.display = 'none';
            const arrow = document.getElementById('user-dropdown-arrow');
            if (arrow) arrow.style.transform = 'rotate(0deg)';

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
                try { history.replaceState(null, '', '#tab-admin'); } catch(e) {}
            }
        };

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

        // Event Listeners for user dropdown outside click
        document.addEventListener('DOMContentLoaded', () => {
            if (typeof loadSystemSettings === 'function') loadSystemSettings();

            document.addEventListener('click', (e) => {
                const menu = document.getElementById('user-dropdown-menu');
                const arrow = document.getElementById('user-dropdown-arrow');
                const btnUser = document.getElementById('nav-btn-user');
                if (menu && menu.style.display === 'block') {
                    if (btnUser && btnUser.contains(e.target)) return;
                    if (!menu.contains(e.target)) {
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

// ============================================================
// 📜 QUẢN LÝ & TRA CỨU VĂN BẢN & BHXH (DOCUMENT LOOKUP SYSTEM)
// ============================================================
// 📖 HƯỚNG DẪN SỬ DỤNG (HDSD MODAL VIEWER)
// ============================================================
window.openHdsdModal = function() {
    const modal = document.getElementById('modal-hdsd-viewer');
    const iframe = document.getElementById('hdsd-modal-iframe');
    let userRole = 'tenant';
    try {
        const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
        if (sess && sess.role === 'SUPER_ADMIN') {
            userRole = 'super_admin';
        }
    } catch(e) {}
    const curTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('pm_app_theme') || 'light';
    const targetUrl = `hdsd.html?role=${userRole}&theme=${curTheme}&v=4.0.1-rev25`;

    if (iframe) {
        if (!iframe.src || iframe.src === 'about:blank' || !iframe.src.includes(`role=${userRole}`)) {
            iframe.src = targetUrl;
        }
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
    if (typeof window.flushPendingChamCongSave === 'function') {
        try { window.flushPendingChamCongSave(); } catch(e) {}
    }
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
                const isActive = t.is_active === 1 || t.is_active === '1' || t.is_active === true;
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
                                <button class="btn btn-sm btn-info" onclick="exportTenantDataPrompt('${t.unit_code}', '${encodeURIComponent(t.unit_name)}')" title="Xuất dữ liệu sao lưu (JSON) riêng cho đơn vị này">📥 Xuất</button>
                                <button class="btn btn-sm btn-warning" onclick="resetTenantPasswordPrompt('${t.unit_code}')" title="Đặt lại mật khẩu Admin">🔑 Pass</button>
                                <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleTenantStatus('${t.unit_code}', ${isActive ? 0 : 1})" title="${isActive ? 'Khóa đơn vị' : 'Mở khóa đơn vị'}">${isActive ? '🔒 Khóa' : '🔓 Mở'}</button>
                                ${t.unit_code !== 'bvtks-cs2' ? `<button class="btn btn-sm btn-danger" onclick="deleteTenantPrompt('${t.unit_code}', '${encodeURIComponent(t.unit_name)}')" title="Xóa vĩnh viễn">🗑️ Xóa</button>` : ''}
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
    if (document.getElementById('tenant-form-old-code')) document.getElementById('tenant-form-old-code').value = '';
    document.getElementById('tenant-form-code').value = '';
    document.getElementById('tenant-form-code').disabled = false;
    document.getElementById('tenant-form-name').value = '';
    document.getElementById('tenant-form-plan').value = 'PRO';
    document.getElementById('tenant-form-expires').value = '2099-12-31';
    document.getElementById('tenant-form-max-staff').value = '30';
    document.getElementById('tenant-form-max-patients').value = '150';
    document.getElementById('tenant-form-phone').value = '';
    document.getElementById('tenant-form-password').value = 'admin123';
    if (document.getElementById('tenant-form-seed-group')) {
        document.getElementById('tenant-form-seed-group').style.display = 'block';
    }
    if (document.getElementById('tenant-form-seed-sample')) {
        document.getElementById('tenant-form-seed-sample').checked = true;
    }
    document.getElementById('modal-tenant-form').style.display = 'flex';
};

window.openEditTenantModal = function (code, encName, plan, expires, maxStaff, maxPatients, phone) {
    document.getElementById('modal-tenant-title').innerText = '✏️ Chỉnh Sửa & Gia Hạn Đơn Vị: ' + code;
    if (document.getElementById('tenant-form-old-code')) document.getElementById('tenant-form-old-code').value = code;
    document.getElementById('tenant-form-code').value = code;
    document.getElementById('tenant-form-code').disabled = false;
    document.getElementById('tenant-form-name').value = decodeURIComponent(encName);
    document.getElementById('tenant-form-plan').value = plan || 'PRO';
    document.getElementById('tenant-form-expires').value = expires || '2099-12-31';
    document.getElementById('tenant-form-max-staff').value = maxStaff || 30;
    document.getElementById('tenant-form-max-patients').value = maxPatients || 150;
    document.getElementById('tenant-form-phone').value = phone || '';
    document.getElementById('tenant-form-password').value = '';
    if (document.getElementById('tenant-form-seed-group')) {
        document.getElementById('tenant-form-seed-group').style.display = 'none';
    }
    document.getElementById('modal-tenant-form').style.display = 'flex';
};

window.closeTenantModal = function () {
    document.getElementById('modal-tenant-form').style.display = 'none';
};

window.saveTenantData = function () {
    const oldCode = (document.getElementById('tenant-form-old-code')?.value || '').trim().toLowerCase();
    const isEdit = !!oldCode;
    const code = document.getElementById('tenant-form-code').value.trim().toLowerCase();
    const name = document.getElementById('tenant-form-name').value.trim();
    const plan = document.getElementById('tenant-form-plan').value;
    const expires = document.getElementById('tenant-form-expires').value;
    const maxStaff = parseInt(document.getElementById('tenant-form-max-staff').value || 30, 10);
    const maxPatients = parseInt(document.getElementById('tenant-form-max-patients').value || 150, 10);
    const phone = document.getElementById('tenant-form-phone').value.trim();
    const password = document.getElementById('tenant-form-password').value.trim();
    const seedSample = document.getElementById('tenant-form-seed-sample')?.checked !== false;

    if (!code || !name) {
        alert('Vui lòng nhập đầy đủ Mã đơn vị và Tên đơn vị!');
        return;
    }

    if (isEdit && oldCode && code !== oldCode) {
        const confirmMsg = `⚠️ BẠN ĐANG ĐỔI MÃ ĐƠN VỊ:\n\nTừ mã cũ: "${oldCode}" ➔ Sang mã mới: "${code}"\n\nToàn bộ dữ liệu (Bệnh nhân, Nhân sự, Lịch trình, Tài khoản, Cài đặt...) sẽ tự động được chuyển sang mã mới.\n\nBạn có chắc chắn muốn tiếp tục không?`;
        if (!confirm(confirmMsg)) return;
    }

    const payload = {
        old_unit_code: oldCode,
        unit_code: code,
        new_unit_code: code,
        unit_name: name,
        plan_tier: plan,
        expires_at: expires,
        max_staff: maxStaff,
        max_patients: maxPatients,
        phone: phone,
        admin_password: password || '',
        seed_sample_data: seedSample
    };

    const action = isEdit ? 'updateTenant' : 'addTenant';
    const btn = document.getElementById('btn-save-tenant');
    if (btn) { btn.innerText = '⏳ Đang lưu...'; btn.disabled = true; }

    callApi(action, [payload], res => {
        if (btn) { btn.innerText = '💾 Lưu Đơn Vị'; btn.disabled = false; }
        closeTenantModal();

        if (isEdit && oldCode && code !== oldCode) {
            if (localStorage.getItem('pm_unit_code') === oldCode) {
                localStorage.setItem('pm_unit_code', code);
                localStorage.setItem('pm_unit_name', name);
                if (typeof window.updateAppHeader === 'function') window.updateAppHeader(code, 'SUPER_ADMIN');
            }
        }

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

window.exportTenantDataPrompt = function (code, encName) {
    const name = decodeURIComponent(encName || code);
    const loadingToast = document.createElement('div');
    loadingToast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#1e293b; color:#fff; padding:12px 20px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:99999; font-size:13px; font-weight:600;';
    loadingToast.innerHTML = `⏳ Đang đóng gói dữ liệu đơn vị <b>${name}</b>...`;
    document.body.appendChild(loadingToast);

    callApi('exportTenantData', [code], res => {
        if (loadingToast) loadingToast.remove();
        if (!res || !res.tables) {
            alert('Không nhận được dữ liệu hợp lệ từ máy chủ!');
            return;
        }

        const jsonStr = JSON.stringify(res, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
        const fileName = `PMCG_Backup_${code}_${dateStr}.json`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`✅ Đã xuất dữ liệu sao lưu thành công!\n\n• Đơn vị: ${name} (${code})\n• Tên tệp: ${fileName}\n• Tổng số bảng: ${Object.keys(res.tables).length} bảng dữ liệu.`);
    }, err => {
        if (loadingToast) loadingToast.remove();
        alert('Lỗi xuất dữ liệu: ' + (err && err.message ? err.message : 'Không xác định'));
    });
};

window.importTenantDataPrompt = function (code) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            try {
                const backupJson = JSON.parse(evt.target.result);
                if (!backupJson.tables) {
                    alert('Tệp JSON này không phải là tệp sao lưu dữ liệu hợp lệ của hệ thống!');
                    return;
                }

                if (!confirm(`⚠️ BẠN CÓ CHẮC CHẮN MUỐN KHÔI PHỤC DỮ LIỆU CHO ĐƠN VỊ '${code}'?\n\nToàn bộ dữ liệu hiện tại của đơn vị này sẽ được thay thế bằng dữ liệu trong tệp sao lưu: "${file.name}".`)) return;

                callApi('importTenantData', [{ unit_code: code, data: backupJson }], res => {
                    alert(`✅ Khôi phục dữ liệu thành công cho đơn vị '${code}'!`);
                    loadTenantsList();
                }, err => {
                    alert('Lỗi khôi phục: ' + (err && err.message ? err.message : 'Không xác định'));
                });
            } catch(err) {
                alert('Tệp JSON bị lỗi định dạng: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    fileInput.click();
};


// ============================================================
// 🔑 ĐỔI MẬT KHẨU TÀI KHOẢN (SUPER ADMIN & ALL USERS)
// ============================================================




window.submitChangePassword = function() {
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

    const currentUnit = localStorage.getItem('pm_unit_code') || 'bvtks-cs2';
    callApi('changePassword', [{
        username: uName,
        old_password: oldPass,
        new_password: newPass,
        unit_code: currentUnit
    }], res => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>💾</span> Lưu Mật Khẩu';
        }
        if (res && (res.status === 'success' || res.message || res.success)) {
            alert('🎉 ' + (res.data?.message || res.message || 'Đã đổi mật khẩu thành công!'));
            closeChangePasswordModal();
        } else {
            alert('❌ ' + (res?.error || res?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại!'));
        }
    }, err => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>💾</span> Lưu Mật Khẩu';
        }
        console.error('Change password error:', err);
        alert('❌ Lỗi kết nối máy chủ: ' + (err.message || String(err)));
    });
};
