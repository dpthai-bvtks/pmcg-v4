/* ==========================================
   T.I.M.E.S SYSTEM - INITIALIZATION & THEME
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 🏢 Khôi phục thông tin Mã Đơn Vị & Thương Hiệu đa bệnh viện
    const savedUnit = localStorage.getItem('pm_unit_code') || 'bvtks_cs2';
    const unitInput = document.getElementById('login-unit');
    if (unitInput) unitInput.value = savedUnit;

    const savedUnitName = localStorage.getItem('pm_unit_name');
    if (savedUnitName) {
        const appHosp = document.getElementById('app-hospital-name');
        if (appHosp) appHosp.innerText = savedUnitName.toUpperCase();
        const mobTitle = document.getElementById('mobile-header-date');
        if (mobTitle) mobTitle.innerText = savedUnitName;
        document.title = savedUnitName + ' - T.I.M.E.S System';
    }

    try {
        const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
        if (sess.role === 'SUPER_ADMIN') {
            const superTab = document.getElementById('nav-tab-tenants');
            if (superTab) superTab.style.display = 'flex';
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
    const unit = (document.getElementById('login-unit')?.value || '').trim().toLowerCase() || 'bvtks_cs2';
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
                    sessionId: res.sessionId || ('sess_' + Date.now())
                }));

                const overlay = document.getElementById('login-overlay');
                if (overlay) overlay.style.display = 'none';
                const userMenu = document.getElementById('user-menu-container');
                const displayName = document.getElementById('user-display-name');
                if (userMenu) userMenu.style.display = 'flex';
                if (displayName) displayName.innerText = '👤 ' + uName;

                if (typeof initUI === 'function') initUI();
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
