
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

    if (sessRole === 'SUPER_ADMIN') {
        if (appHosp) appHosp.innerText = 'T.I.M.E.S SYSTEM';
        if (appSub) appSub.innerText = 'HỆ THỐNG QUẢN LÝ ĐƠN VỊ & BẢN QUYỀN SAAS';
        if (appSlogan) appSlogan.innerText = 'TRUNG TÂM ĐIỀU HÀNH TOÀN CỤC';
        if (mobSub) mobSub.innerText = 'Super Admin Portal';
    } else if (uCode === 'bvtks-cs2') {
        if (appHosp) appHosp.innerText = 'BỆNH VIỆN THAN - KHOÁNG SẢN CS2';
        if (appSub) appSub.innerText = 'KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG';
        if (appSlogan) appSlogan.innerText = 'Y HỌC TỐT, PHỤC HỒI NHANH';
        if (mobSub) mobSub.innerText = 'Khoa YHCT - PHCN';
    } else {
        if (appHosp) appHosp.innerText = 'T.I.M.E.S SYSTEM';
        if (appSub) appSub.innerText = 'Hệ thống xếp lịch thủ thuật YHCT- PHCN thông minh';
        if (appSlogan) appSlogan.innerText = 'Nhanh gọn, tối ưu, chính xác';
        if (mobSub) mobSub.innerText = 'YHCT - PHCN';
    }
};

/* ==========================================
   T.I.M.E.S SYSTEM - INITIALIZATION & THEME
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 🏢 Khôi phục thông tin Mã Đơn Vị & Thương Hiệu đa bệnh viện
    const savedUnit = localStorage.getItem('pm_unit_code') || 'bvtks-cs2';
    const unitInput = document.getElementById('login-unit');
    if (unitInput) unitInput.value = savedUnit;

    if (typeof window.updateAppHeader === 'function') {
        window.updateAppHeader(savedUnit);
    }

    try {
        const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
        if (sess.role === 'SUPER_ADMIN') {
            const superTab = document.getElementById('nav-tab-tenants');
            if (superTab) superTab.style.display = 'flex';
            if (typeof applyPermissions === 'function') applyPermissions('SUPER_ADMIN', 'ALL');
        } else if (sess.role) {
            const superTab = document.getElementById('nav-tab-tenants');
            if (superTab) superTab.style.display = 'none';
            if (typeof applyPermissions === 'function') applyPermissions(sess.role, sess.permissions || 'all');
        }
    } catch(e) {}

    // loadSystemSettings() is automatically handled by loadBootstrapData with offline-first cache

    // Override .value setter to sync with flatpickr khi gán giá trị bằng JS
    const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(HTMLInputElement.prototype, 'value', {
        get: function () {
            return originalDescriptor.get.call(this);
        },
        set: function (val) {
            originalDescriptor.set.call(this, val);
            if (this._flatpickr && !this._isSyncingFlatpickr) {
                this._isSyncingFlatpickr = true;
                try {
                    this._flatpickr.setDate(val, false);
                } finally {
                    this._isSyncingFlatpickr = false;
                }
            }
        }
    });

    // Khởi tạo flatpickr trên tất cả các input type date
    document.querySelectorAll('input[type="date"]').forEach(el => {
        flatpickr(el, {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d/m/Y",
            locale: "vn",
            disableMobile: true,
            allowInput: true,
            onReady: function (_selectedDates, _dateStr, instance) {
                // Truyền class của input gốc sang altInput để CSS có thể target đúng
                if (instance.altInput && el.classList.length > 0) {
                    el.classList.forEach(c => instance.altInput.classList.add(c));
                }
            }
        });
    });

    if (typeof initServerConfigModal === 'function') {
    }

    if (typeof window.renderAISettingsUI === 'function') {
        window.renderAISettingsUI();
    }
});


window.dataCacheTime = window.dataCacheTime || {};

window.loadTimRanhDataFromServer = function () {
    const statusEl = document.getElementById('utils-file-status');
    if (statusEl) {
        statusEl.innerText = '⏳ Đang kết nối máy chủ để lấy dữ liệu Tìm Rảnh chung...';
        statusEl.style.color = '#f39c12';
    }

    if (typeof callApi === 'function') {
        callApi('getTimRanhData', [], data => {
            if (data && data.length > 0) {
                window.externalUtilsData = data;
                if (statusEl) {
                    statusEl.innerText = `✅ Đã tải ${data.length} ca dùng chung từ máy chủ (D1 Database)!`;
                    statusEl.style.color = '#27ae60';
                }
            } else if (statusEl) {
                statusEl.innerText = '(Chưa có dữ liệu chung. Đang dùng: Lịch phần mềm xếp)';
                statusEl.style.color = '#e67e22';
            }
        }, err => {
            if (statusEl) {
                statusEl.innerText = 'Không tải được dữ liệu Tìm Rảnh: ' + err;
                statusEl.style.color = '#c0392b';
            }
        });
    }
};

window.doLogin = function () {
    const unit = (document.getElementById('login-unit')?.value || '').trim().toLowerCase() || 'bvtks-cs2';
    const user = (document.getElementById('login-user')?.value || '').trim();
    const pass = (document.getElementById('login-pass')?.value || '').trim();
    const errDiv = document.getElementById('login-error');
    const btn = document.getElementById('btn-do-login');

    if (!user || !pass) {
        if (errDiv) {
            errDiv.innerText = 'Vui lòng nhập đầy đủ mã đơn vị, tên đăng nhập và mật khẩu!';
            errDiv.style.display = 'block';
        }
        return;
    }

    if (btn) {
        btn.innerText = '⏳ Đang kiểm tra...';
        btn.disabled = true;
    }
    if (errDiv) errDiv.style.display = 'none';

    // Lưu mã đơn vị vào localStorage
    localStorage.setItem('pm_unit_code', unit);

    if (typeof callApi === 'function') {
        callApi('verifyLogin', [user, pass, unit], res => {
            if (btn) { btn.innerText = 'Đăng Nhập ➔'; btn.disabled = false; }
            if (res && (res.username || res.role || res.success)) {
                const uName = res.username || user || 'admin';
                const uRole = res.role || 'Admin';
                const uPerms = res.permissions || 'all';
                const uUnit = res.unit_code || unit;
                const uUnitName = res.unit_name || (uRole === 'SUPER_ADMIN' ? 'Hệ Thống Quản Trị Trung Tâm SaaS' : 'Bệnh viện Than - Khoáng sản Cơ sở 2');

                localStorage.setItem('pm_unit_code', uUnit);
                localStorage.setItem('pm_unit_name', uUnitName);
                localStorage.setItem('meds_session', JSON.stringify({
                    username: uName,
                    role: uRole,
                    permissions: uPerms,
                    unit_code: uUnit,
                    unit_name: uUnitName,
                    plan_tier: res.plan_tier || 'PRO',
                    sessionId: res.sessionId || ('sess_' + Date.now())
                }));

                const overlay = document.getElementById('login-overlay');
                if (overlay) overlay.style.display = 'none';
                const userMenu = document.getElementById('user-menu-container');
                const displayName = document.getElementById('user-display-name');
                if (userMenu) userMenu.style.display = 'flex';
                if (displayName) displayName.innerText = '👤 ' + uName;

                document.querySelectorAll('.app-user-name').forEach(el => el.innerText = uName);
                document.querySelectorAll('.app-user-role').forEach(el => el.innerText = uRole);

                if (typeof window.applyPermissions === 'function') {
                    window.applyPermissions(uRole, uPerms);
                }
                if (typeof window.updateAppHeader === 'function') {
                    window.updateAppHeader(uUnit, uRole);
                }

                // Xóa sạch bộ đệm dữ liệu của đơn vị trước đó trong RAM
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

                // Tải dữ liệu Bootstrap mới nhất của đơn vị này ngay lập tức (forceRefresh = true)
                if (typeof window.loadBootstrapData === 'function') {
                    try { window.loadBootstrapData(true); } catch(e) { console.warn('Lỗi loadBootstrapData:', e); }
                } else if (typeof window.loadAllData === 'function') {
                    try { window.loadAllData(); } catch(e) {}
                }

                if (uRole === 'SUPER_ADMIN') {
                    const superTab = document.getElementById('nav-tab-tenants');
                    if (superTab) superTab.style.display = 'flex';
                    if (typeof window.loadTenantsList === 'function') {
                        try { window.loadTenantsList(); } catch(e) {}
                    }
                    const targetBtn = document.querySelector('.nav-tab[data-tab="tab-tenants"]') || superTab;
                    if (targetBtn) targetBtn.click();
                    try { history.replaceState(null, '', '#tab-tenants'); } catch(e) {}
                } else {
                    const superTab = document.getElementById('nav-tab-tenants');
                    if (superTab) superTab.style.display = 'none';
                    const homeTab = document.querySelector('.nav-tab[data-tab="tab-home"]');
                    if (homeTab) homeTab.click();
                    try { history.replaceState(null, '', '#tab-home'); } catch(e) {}
                }

                if ((uRole === 'Admin' || uRole === 'admin' || uRole === 'SUPER_ADMIN') && typeof loadAccounts === 'function') {
                    try { loadAccounts(); } catch(e) {}
                }
            } else {
                if (errDiv) {
                    errDiv.innerText = (res && (res.message || res.error)) ? (res.message || res.error) : 'Tài khoản hoặc mật khẩu không chính xác!';
                    errDiv.style.display = 'block';
                }
            }
        }, err => {
            if (btn) { btn.innerText = 'Đăng Nhập ➔'; btn.disabled = false; }
            if (errDiv) {
                errDiv.innerText = err && err.message ? err.message : 'Lỗi kết nối máy chủ!';
                errDiv.style.display = 'block';
            }
        });
    } else {
        if (btn) { btn.innerText = 'Đăng Nhập ➔'; btn.disabled = false; }
        if (errDiv) {
            errDiv.innerText = 'Đang tải mã nguồn hệ thống, vui lòng thử lại sau giây lát...';
            errDiv.style.display = 'block';
        }
    }
};
