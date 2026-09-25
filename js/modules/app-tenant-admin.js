/**
 * 🏢 T.I.M.E.S System v4 - Multi-Tenant & Subscription Admin Module
 */

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

                const isLifetime = t.unit_code === 'bvtks-cs2' || t.unit_code === 'bvtks_cs2' || t.plan_tier === 'ENTERPRISE';
                const planBadge = isLifetime
                    ? '<span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:6px; font-weight:700; font-size:11px;">💎 VĨNH VIỄN</span>'
                    : `<span style="background:#e0e7ff; color:#3730a3; padding:3px 8px; border-radius:6px; font-weight:700; font-size:11px;">${t.plan_tier || 'PRO'}</span>`;

                const expiresDisplay = isLifetime
                    ? '<span style="color:#059669; font-weight:700;">💎 Vĩnh viễn</span>'
                    : (t.expires_at || 'Vĩnh viễn');

                return `
                    <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <td style="padding:12px 14px; font-weight:700; color:#1e40af;">${t.unit_code}</td>
                        <td style="padding:12px 14px; font-weight:600; color:#1e293b;">${t.unit_name}</td>
                        <td style="padding:12px 14px;">${planBadge}</td>
                        <td style="padding:12px 14px;">${expiresDisplay}</td>
                        <td style="padding:12px 14px; font-size:12px; color:#64748b;">${t.max_staff || 30} KTV / ${t.max_patients || 150} BN</td>
                        <td style="padding:12px 14px; font-size:12px; color:#64748b;">${t.phone || '-'}</td>
                        <td style="padding:12px 14px; text-align:center;">${statusBadge}</td>
                        <td style="padding:12px 14px; text-align:center;">
                            <div style="display:flex; justify-content:center; gap:6px;">
                                <button class="btn btn-sm btn-secondary" onclick="openEditTenantModal('${t.unit_code}', '${encodeURIComponent(t.unit_name)}', '${t.plan_tier}', '${t.expires_at}', ${t.max_staff}, ${t.max_patients}, '${t.phone || ''}')" title="Chỉnh sửa / Gia hạn">✏️ Sửa</button>
                                <button class="btn btn-sm" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-weight:700;" onclick="window.openContractPartyAModal('${t.plan_tier}', '${t.unit_code}', '${encodeURIComponent(t.unit_name)}', '${t.expires_at || ''}')" title="Điền thông tin & Tải Hợp Đồng (PDF) cho đơn vị này">📜 HĐ</button>
                                <button class="btn btn-sm btn-info" onclick="exportTenantDataPrompt('${t.unit_code}', '${encodeURIComponent(t.unit_name)}')" title="Xuất dữ liệu sao lưu (JSON) riêng cho đơn vị này">📥 Xuất</button>
                                <button class="btn btn-sm btn-warning" onclick="resetTenantPasswordPrompt('${t.unit_code}')" title="Đặt lại mật khẩu Admin">🔑 Pass</button>
                                <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleTenantStatus('${t.unit_code}', ${isActive ? 0 : 1})" title="${isActive ? 'Khóa đơn vị' : 'Mở khóa đơn vị'}">${isActive ? '🔒 Khóa' : '🔓 Mở'}</button>
                                ${t.unit_code !== 'bvtks-cs2' && t.unit_code !== 'bvtks_cs2' ? `<button class="btn btn-sm btn-danger" onclick="deleteTenantPrompt('${t.unit_code}', '${encodeURIComponent(t.unit_name)}')" title="Xóa vĩnh viễn">🗑️ Xóa</button>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Tự động tải luôn danh sách giao dịch thanh toán VietQR
            if (typeof window.loadPaymentTransactionsList === 'function') {
                window.loadPaymentTransactionsList();
            }
        }, err => {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#e11d48;">Lỗi khi tải danh sách: ${escapeHtml(err && err.message ? err.message : 'Không xác định')}</td></tr>`;
        });
    }
};

window.openAddTenantModal = function () {
    document.getElementById('modal-tenant-title').innerText = '➕ Thêm Bệnh Viện / Đơn Vị Mới';
    if (document.getElementById('tenant-form-old-code')) document.getElementById('tenant-form-old-code').value = '';
    document.getElementById('tenant-form-code').value = '';
    document.getElementById('tenant-form-code').disabled = false;
    document.getElementById('tenant-form-name').value = '';
    document.getElementById('tenant-form-plan').value = 'PLAN_1Y';
    if (typeof window.onTenantPlanSelectChange === 'function') {
        window.onTenantPlanSelectChange('PLAN_1Y');
    } else {
        document.getElementById('tenant-form-expires').value = '2099-12-31';
        document.getElementById('tenant-form-max-staff').value = '999';
        document.getElementById('tenant-form-max-patients').value = '9999';
    }
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
    document.getElementById('tenant-form-plan').value = plan || 'PLAN_1Y';
    document.getElementById('tenant-form-expires').value = expires || '2099-12-31';
    document.getElementById('tenant-form-max-staff').value = maxStaff || 999;
    document.getElementById('tenant-form-max-patients').value = maxPatients || 9999;
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
    const safeName = (window.escapeHtml || escapeHtml)(name);
    loadingToast.innerHTML = `⏳ Đang đóng gói dữ liệu đơn vị <b>${safeName}</b>...`;
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

// ============================================================
// 📅 HỆ THỐNG ĐỒNG BỘ CHỌN NGÀY & XEM LỊCH SỬ ĐA TAB
// (tab-home, tab-busy, tab-schedule, tab-utils)
// ============================================================
window.onAppDateChange = function(dateStr, sourceTab) {
    const rawDate = (dateStr || '').trim();
    const d = new Date();
    const todayYMD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const targetDate = rawDate || todayYMD;

    // 1. Đồng bộ giá trị ô chọn ngày trên tất cả các tab
    const dateInputIds = [
        'dashboard-date-filter',
        'busy-date-filter',
        'history-date',
        'schedule-date',
        'utils-search-date'
    ];
    dateInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value !== targetDate) {
            el.value = targetDate;
        }
    });

    const parts = targetDate.split('-');
    const dmy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : targetDate;
    const displayEl = document.getElementById('display-date');
    if (displayEl) displayEl.textContent = dmy;

    // 2. Xác định chế độ: Hôm nay (Live) hay Lịch sử (History)
    const isToday = (targetDate === todayYMD) || (window._systemActiveYMD && targetDate === window._systemActiveYMD);
    const forceHistoryRequest = (sourceTab === 'history_input' || sourceTab === 'history' || sourceTab === 'history_date');

    // Cập nhật huy hiệu trạng thái trên Tab Giờ Bận (tab-busy)
    const busyBadge = document.getElementById('busy-date-badge');
    const busyNotice = document.getElementById('busy-history-notice');
    if (busyBadge) {
        if (isToday && !forceHistoryRequest) {
            busyBadge.innerHTML = '🟢 Đang xem: Hôm nay (Thời gian thực)';
            busyBadge.style.background = '#dcfce7';
            busyBadge.style.color = '#15803d';
            busyBadge.style.borderColor = '#bbf7d0';
        } else {
            busyBadge.innerHTML = `📜 Đang xem lịch sử: ${dmy}` + (isToday ? ' (Đã chốt sổ)' : '');
            busyBadge.style.background = '#fef3c7';
            busyBadge.style.color = '#b45309';
            busyBadge.style.borderColor = '#fde68a';
        }
    }
    if (busyNotice) {
        busyNotice.style.display = (isToday && !forceHistoryRequest) ? 'none' : 'inline-flex';
    }

    // Toggle khối nhập liệu (Live) vs tiêu đề thông tin (History) trên cả 3 cột của tab-busy
    const liveFormIds = ['busy-staff-live-form', 'busy-pat-live-form', 'busy-leave-live-form'];
    const histHeaderIds = ['busy-staff-hist-header', 'busy-pat-hist-header', 'busy-leave-hist-header'];

    if (isToday && !forceHistoryRequest) {
        liveFormIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = (id === 'busy-staff-live-form' ? 'flex' : 'block');
        });
        histHeaderIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    } else {
        liveFormIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        histHeaderIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'flex';
        });
    }

    // Đồng bộ giá trị dropdown chọn nhanh ngày có lịch sử bận
    const quickSelect = document.getElementById('busy-quick-date-select');
    if (quickSelect) {
        quickSelect.value = (isToday && !forceHistoryRequest) ? '' : targetDate;
    }

    if (isToday && !forceHistoryRequest) {
        // --- CHẾ ĐỘ HÔM NAY (LIVE) ---
        window._forceHistoryMode = false;
        window.viewingImportedScheduleFile = false;
        if (typeof restoreHistoryTabs === 'function') {
            restoreHistoryTabs();
        }
        if (typeof loadDashboard === 'function') {
            loadDashboard();
        }
        if (typeof filterSchedule === 'function') {
            filterSchedule();
        }
        if (typeof renderBusyStaff === 'function') renderBusyStaff();
        if (typeof renderBusyPat === 'function') renderBusyPat();
        if (typeof renderLeavePat === 'function') renderLeavePat();
        if (typeof renderPatientsTable === 'function') renderPatientsTable(true);

        const statusEl = document.getElementById('utils-lich-status');
        if (statusEl) {
            statusEl.innerText = window._todayIsFinalized ? '📋 Hôm nay (Đã chốt sổ)' : '🟢 Hôm nay (Live)';
            statusEl.style.color = window._todayIsFinalized ? '#b45309' : '#15803d';
        }
        if (window.showToast) window.showToast(`Đã chuyển về ngày hôm nay (${dmy})`, 'success', 1800);
        return;
    }

    // --- CHẾ ĐỘ LỊCH SỬ (HISTORY) ---
    window._forceHistoryMode = true;

    const handleLoadedHistory = function(data) {
        const fullData = Array.isArray(data) ? { schedule: data, patients: [], staffBusy: [], patBusy: [] } : (data || { schedule: [], patients: [], staffBusy: [], patBusy: [] });
        window._historyCache = window._historyCache || {};
        window._historyCache[targetDate] = fullData;

        window.viewingImportedScheduleFile = true;
        window._viewingHistoryDate = targetDate;
        if (typeof markDischargedInSchedule === 'function') {
            window.currentScheduleData = markDischargedInSchedule(fullData.schedule || []);
        } else {
            window.currentScheduleData = fullData.schedule || [];
        }

        // Áp dụng dữ liệu lịch sử vào dataCache để cập nhật tab-busy, tab-schedule, tab-patients
        if (typeof applyHistoryDataToTabs === 'function') {
            applyHistoryDataToTabs(fullData, targetDate);
        } else {
            if (typeof renderBusyStaff === 'function') renderBusyStaff();
            if (typeof renderBusyPat === 'function') renderBusyPat();
            if (typeof renderLeavePat === 'function') renderLeavePat();
        }

        // Cập nhật tab-schedule
        if (typeof filterSchedule === 'function') {
            filterSchedule();
        }

        // Cập nhật tab-home (Dashboard)
        if (typeof loadDashboard === 'function') {
            loadDashboard();
        }

        // Cập nhật tab-utils (Tiện ích tìm rảnh)
        window.utilsScheduleData = fullData.schedule || [];
        window.utilsScheduleDate = targetDate;
        window.utilsStaffBusy = fullData.staffBusy || [];
        if (window.utilsDataSource === 'HIS' && Array.isArray(window.utilsHisScheduleData)) {
            if (typeof updateUtilsSourceUI === 'function') updateUtilsSourceUI();
            if (typeof timBacSiRanh === 'function') timBacSiRanh();
        } else {
            const statusEl = document.getElementById('utils-lich-status');
            if (statusEl) {
                const count = (fullData.schedule || []).length;
                statusEl.innerText = isToday ? `📋 Lịch Hôm Nay (Đã chốt): ${count} ca` : `✅ Ngày ${dmy}: ${count} ca`;
                statusEl.style.color = isToday ? '#b45309' : '#27ae60';
            }
            if (typeof timBacSiRanh === 'function') timBacSiRanh();
        }

        if (displayEl) {
            displayEl.innerHTML = isToday ? `<span style="color:#b45309; background:#fef3c7; padding:2px 8px; border-radius:6px; font-weight:700;">📋 Lịch Hôm Nay (Đã chốt sổ)</span>` : dmy;
        }

        if (window.showToast) {
            window.showToast(isToday ? `Đã tải lịch sử đã chốt sổ của ngày hôm nay (${dmy})!` : `Đã tải dữ liệu lịch sử ngày ${dmy}!`, 'info', 2500);
        }
    };

    // Kiểm tra cache trước
    if (window._historyCache && window._historyCache[targetDate]) {
        handleLoadedHistory(window._historyCache[targetDate]);
        return;
    }

    if (window.showGlobalLoading) window.showGlobalLoading(`Đang tải lịch sử ngày ${dmy}...`);

    const onSuccess = function(res) {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        const data = (res && res.data) ? res.data : res;
        handleLoadedHistory(data);
    };

    const onError = function(err) {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        console.error(`Lỗi tải lịch sử ngày ${targetDate}:`, err);
        const errMsg = (err && err.message) ? err.message : String(err);
        if (window.showToast) {
            window.showToast(`Không thể tải dữ liệu ngày ${dmy}: ${errMsg}`, 'error', 4000);
        } else {
            alert(`❌ Không thể tải dữ liệu lịch sử ngày ${dmy}: ${errMsg}`);
        }
    };

    if (typeof callApi === 'function') {
        callApi('getHistoryFullData', [targetDate], onSuccess, onError);
    } else {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
    }
};

window.setAppDateToToday = function(sourceTab) {
    const d = new Date();
    const todayYMD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    window.onAppDateChange(todayYMD, sourceTab);
};

// ============================================================
// 📜 TẢI DANH SÁCH CÁC NGÀY CÓ LỊCH SỬ BẬN TỪ CSDL ĐÁM MÂY TURSO / MINIPC
// ============================================================
window.loadBusyHistoryDates = function(forceReload) {
    const quickSelect = document.getElementById('busy-quick-date-select');
    if (!quickSelect) return;
    if (quickSelect._loaded && !forceReload) return;

    const populateDates = function(dates) {
        if (!dates || !Array.isArray(dates) || dates.length === 0) return;
        window._cachedBusyHistoryDates = dates;
        quickSelect._loaded = true;
        let html = '<option value="">-- Chọn ngày có lịch sử bận --</option>';
        dates.forEach(d => {
            const parts = d.split('-');
            const dmy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
            html += `<option value="${d}">📅 Ngày ${dmy}</option>`;
        });
        quickSelect.innerHTML = html;
        const currentTarget = window._viewingHistoryDate || (document.getElementById('busy-date-filter') ? document.getElementById('busy-date-filter').value : '');
        if (currentTarget && window._forceHistoryMode) {
            quickSelect.value = currentTarget;
        }
    };

    // Nếu đã có cache trong bộ nhớ và không bắt buộc tải lại
    if (window._cachedBusyHistoryDates && Array.isArray(window._cachedBusyHistoryDates) && window._cachedBusyHistoryDates.length > 0 && !forceReload) {
        populateDates(window._cachedBusyHistoryDates);
        return;
    }

    if (typeof callApi === 'function') {
        callApi('getGioBanChungCu', ['all', 'all', ''], res => {
            let dates = [];
            if (Array.isArray(res)) dates = res;
            else if (res && Array.isArray(res.dates)) dates = res.dates;
            else if (res && res.data && Array.isArray(res.data.dates)) dates = res.data.dates;
            else if (res && res.data && Array.isArray(res.data)) dates = res.data;
            else if (res && Array.isArray(res.records)) {
                dates = Array.from(new Set(res.records.map(r => r.date).filter(Boolean)));
            }
            if (dates.length > 0) {
                populateDates(dates);
            }
        }, err => {
            console.warn('[loadBusyHistoryDates] Không thể tải danh mục ngày bận:', err);
        });
    }
};

// Tự động gọi nạp danh sách ngày ngay khi khởi động
setTimeout(() => {
    if (typeof window.loadBusyHistoryDates === 'function') {
        window.loadBusyHistoryDates();
    }
}, 500);

// Khởi tạo và tương thích ngược
window.switchBusySubTab = function(mode) {};
window.onBusyHistFilterChange = function() {};
window.onAdminBusyHistFilterChange = function() {};
window.loadGioBanChungCuUI = function() {};
window.renderGioBanChungCuTable = function() {};
window.filterGioBanChungCuClient = function() {};

// ============================================================
// ⏰ TỰ ĐỘNG THEO DÕI & ĐỒNG BỘ CHỐT SỔ ĐÁM MÂY (CLIENT-SIDE LISTENER)
// ============================================================
(function() {
    let lastCheckedMinute = -1;
    setInterval(() => {
        try {
            const now = new Date();
            const currentMin = now.getMinutes();
            if (currentMin === lastCheckedMinute) return;
            lastCheckedMinute = currentMin;

            const chotSoEl = document.getElementById("admin-chotso-time");
            const rawTarget = chotSoEl && chotSoEl.value ? chotSoEl.value.trim() : (dataCache?.settings?.chotSoTime || "16:20");
            const targetTime = (typeof normalizeTimeHHMM === 'function') ? normalizeTimeHHMM(rawTarget) : (rawTarget || "16:20");

            const timeParts = targetTime.split(':').map(Number);
            const targetMinutes = (timeParts[0] || 0) * 60 + (timeParts[1] || 0);
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // Khi đến hoặc qua giờ chốt sổ, kiểm tra với server (ủy quyền qua HistoryManager nếu có)
            const shouldTrigger = (window.HistoryManager && typeof window.HistoryManager.shouldTriggerAutoChotSo === 'function')
                ? window.HistoryManager.shouldTriggerAutoChotSo(targetTime, window._chotSoDone)
                : (currentMinutes >= targetMinutes && !window._chotSoDone);

            if (shouldTrigger) {
                if (typeof callApi === 'function') {
                    callApi('autoChotSo', [], res => {
                        if (res && res.closed) {
                            window._chotSoDone = true;
                            console.log(`[Client Auto-ChotSo]: Máy chủ đã tự động chốt sổ ngày ${res.closedDate || ''}.`);

                            // Dọn dẹp bộ nhớ client và làm mới giao diện
                            window.currentScheduleData = [];
                            window.lastUnscheduledData = [];
                            window.currentRotData = [];
                            if (window.dataCache) window.dataCache.schedule = [];
                            if (window.dataCacheTime) window.dataCacheTime = {};

                            const curUnit = (typeof getCurrentUnitCode === 'function') ? getCurrentUnitCode() : (localStorage.getItem('pm_unit_code') || '');
                            const uKey = (base) => (typeof getUnitStorageKey === 'function') ? getUnitStorageKey(base) : (curUnit ? `${curUnit}_${base}` : base);

                            localStorage.removeItem(uKey('meds_success'));
                            localStorage.removeItem(uKey('meds_schedule_date'));
                            localStorage.removeItem(uKey('meds_unscheduled'));
                            localStorage.removeItem('meds_success');
                            localStorage.removeItem('meds_schedule_date');
                            localStorage.removeItem('meds_unscheduled');
                            localStorage.removeItem('meds_schedule_unit');

                            const bKey = (typeof window.getBootstrapCacheKey === 'function') ? window.getBootstrapCacheKey() : `times_bootstrap_cache_${curUnit}`;
                            try {
                                const bStr = localStorage.getItem(bKey) || localStorage.getItem('times_bootstrap_cache');
                                if (bStr) {
                                    const b = JSON.parse(bStr);
                                    b.schedule = [];
                                    localStorage.setItem(bKey, JSON.stringify(b));
                                    localStorage.setItem('times_bootstrap_cache', JSON.stringify(b));
                                }
                            } catch(e) {}

                            if (window.OfflineSyncEngine && typeof window.OfflineSyncEngine.saveCache === 'function') {
                                window.OfflineSyncEngine.saveCache('meds_success', []);
                            }

                            window._todayIsFinalized = true;
                            window._finalizedTodayCount = res.count || 0;
                            const countInfo = window._finalizedTodayCount ? ` (${window._finalizedTodayCount} ca)` : '';
                            const displayEl = document.getElementById('display-date');
                            if (displayEl) {
                                displayEl.innerHTML = `<span style="color:#b45309; background:#fef3c7; padding:2px 8px; border-radius:6px; font-weight:700;">📋 Hôm nay (Đã chốt sổ${countInfo})</span>`;
                            }
                            const statusEl = document.getElementById('utils-lich-status');
                            if (statusEl) {
                                statusEl.innerText = `📋 Hôm nay (Đã chốt sổ${countInfo})`;
                                statusEl.style.color = '#b45309';
                            }

                            if (typeof filterSchedule === 'function') filterSchedule();
                            if (typeof renderScheduleCalendar === 'function') renderScheduleCalendar();
                            if (typeof updateStats === 'function') updateStats();
                            if (typeof loadDashboard === 'function') loadDashboard();

                            // Tự động kích hoạt huấn luyện mô hình AI trên client nếu đang bật
                            if (localStorage.getItem('ai_auto_train_enable') !== '0') {
                                if (typeof window.calibrateAIFromHistory === 'function') {
                                    window.calibrateAIFromHistory({ silent: true, reason: 'auto_after_chot_so' });
                                }
                            }

                            if (typeof showCustomAlert === 'function') {
                                showCustomAlert(
                                    "Chốt sổ tự động",
                                    `Đã đến giờ chốt sổ (${targetTime}). Hệ thống đã tự động chốt sổ và lưu trữ dữ liệu ngày ${res.closedDate || ''} vào Lịch sử. Bảng lịch trình đã sẵn sàng cho ngày mới!`,
                                    "⏰",
                                    "#10b981"
                                );
                            }
                        } else if (res && res.status === 'success') {
                            console.log("[Client Auto-ChotSo]: Đồng bộ kiểm tra chốt sổ tự động với máy chủ thành công.");
                        }
                    }, () => {});
                }
            }
        } catch(e) {}
    }, 30000);
})();

/* ============================================================
   💎 HỆ THỐNG GÓI BẢN QUYỀN, DÙNG THỬ & GIA HẠN (SAAS LICENSING)
   ============================================================ */

window.openPricingModal = function () {
    const m = document.getElementById('modal-pricing-plans');
    if (m) m.style.display = 'flex';
};

window.closePricingModal = function () {
    const m = document.getElementById('modal-pricing-plans');
    if (m) m.style.display = 'none';
};

window.openTrialRegisterModal = function (chosenPlan) {
    window.closePricingModal();
    const m = document.getElementById('modal-trial-register');
    if (m) {
        m.style.display = 'flex';
        const errDiv = document.getElementById('trial-reg-error');
        if (errDiv) errDiv.style.display = 'none';
        const nameInput = document.getElementById('trial-reg-name');
        if (nameInput) {
            nameInput.value = '';
            setTimeout(() => nameInput.focus(), 150);
        }
        if (document.getElementById('trial-reg-code')) document.getElementById('trial-reg-code').value = '';
        if (document.getElementById('trial-reg-phone')) document.getElementById('trial-reg-phone').value = '';
        if (document.getElementById('trial-reg-password')) document.getElementById('trial-reg-password').value = 'admin123';
    }
};

window.closeTrialRegisterModal = function () {
    const m = document.getElementById('modal-trial-register');
    if (m) m.style.display = 'none';
};

window.autoSuggestTrialCode = function (name) {
    if (!name) return;
    const codeInput = document.getElementById('trial-reg-code');
    if (!codeInput) return;
    // Bỏ dấu tiếng Việt và ký tự đặc biệt
    let slug = name.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
    if (slug.length > 20) slug = slug.substring(0, 20);
    codeInput.value = slug;
};

window.submitTrialRegistration = function () {
    const name = (document.getElementById('trial-reg-name')?.value || '').trim();
    const code = (document.getElementById('trial-reg-code')?.value || '').trim().toLowerCase();
    const phone = (document.getElementById('trial-reg-phone')?.value || '').trim();
    const password = (document.getElementById('trial-reg-password')?.value || '').trim();
    const errDiv = document.getElementById('trial-reg-error');
    const btn = document.getElementById('btn-submit-trial');

    if (!name || !code) {
        if (errDiv) {
            errDiv.innerText = 'Vui lòng nhập Tên bệnh viện/phòng khám và Mã đơn vị!';
            errDiv.style.display = 'block';
        }
        return;
    }

    if (!/^[a-z0-9_-]{3,30}$/.test(code)) {
        if (errDiv) {
            errDiv.innerText = 'Mã đơn vị chỉ chứa chữ thường không dấu, số, dấu gạch nối (3-30 ký tự)!';
            errDiv.style.display = 'block';
        }
        return;
    }

    if (!password || password.length < 4) {
        if (errDiv) {
            errDiv.innerText = 'Mật khẩu quản trị phải có ít nhất 4 ký tự!';
            errDiv.style.display = 'block';
        }
        return;
    }

    if (errDiv) errDiv.style.display = 'none';
    if (btn) {
        btn.innerText = '⏳ Đang khởi tạo đơn vị...';
        btn.disabled = true;
    }

    const payload = {
        unit_name: name,
        unit_code: code,
        phone: phone,
        admin_password: password
    };

    if (typeof callApi === 'function') {
        callApi('registerTrialTenant', [payload], res => {
            if (btn) {
                btn.innerText = '🚀 Kích Hoạt Dùng Thử 15 Ngày';
                btn.disabled = false;
            }
            if (!res || !res.success) {
                if (errDiv) {
                    errDiv.innerText = res && res.error ? res.error : 'Đăng ký không thành công. Vui lòng thử lại!';
                    errDiv.style.display = 'block';
                }
                return;
            }

            // Đăng ký thành công -> Tự động đăng nhập
            window.closeTrialRegisterModal();
            const token = res.token;
            if (token) localStorage.setItem('pm_jwt_token', token);
            localStorage.setItem('pm_unit_code', code);
            localStorage.setItem('pm_unit_name', name);
            localStorage.setItem('pm_plan_tier', 'TRIAL_15D');
            localStorage.setItem('pm_plan_name', 'Dùng thử 15 ngày');
            localStorage.setItem('pm_expires_at', res.tenant?.expires_at || '');
            localStorage.setItem('pm_days_left', '15');

            localStorage.setItem('meds_session', JSON.stringify({
                username: 'admin',
                role: 'Admin',
                permissions: 'all',
                unit_code: code,
                unit_name: name,
                plan_tier: 'TRIAL_15D',
                sessionId: 'sess_' + Date.now()
            }));

            // Reset RAM
            window.currentScheduleData = null;
            window.chamCongData = {};
            window.thongKeData = {};
            window.adminChamCongEmployees = [];

            // Đóng login overlay
            const overlay = document.getElementById('login-overlay');
            if (overlay) overlay.style.display = 'none';
            const userMenu = document.getElementById('user-menu-container');
            const displayName = document.getElementById('user-display-name');
            if (userMenu) userMenu.style.display = 'flex';
            if (displayName) displayName.innerText = '👤 admin';

            if (typeof window.applyPermissions === 'function') window.applyPermissions('Admin', 'all');
            if (typeof window.updateAppHeader === 'function') window.updateAppHeader(code, 'Admin');
            if (typeof window.updateSubscriptionHeaderBadge === 'function') {
                window.updateSubscriptionHeaderBadge('TRIAL_15D', res.tenant?.expires_at, 'Dùng thử 15 ngày', 15);
            }

            // Tải dữ liệu mẫu
            if (typeof window.loadBootstrapData === 'function') {
                window.loadBootstrapData(true);
            }

            alert(`🎉 CHÚC MỪNG!\n\nĐơn vị "${name}" đã được kích hoạt gói Dùng Thử 15 Ngày Miễn Phí (Full 100% Chức Năng)!\n\n• Mã đơn vị: ${code}\n• Tên đăng nhập: admin\n• Mật khẩu: ${password}\n\nHệ thống đã tạo sẵn danh mục thủ thuật và phòng điều trị chuẩn Bộ Y Tế. Bạn có thể bắt đầu xếp lịch ngay!`);
        }, err => {
            if (btn) {
                btn.innerText = '🚀 Kích Hoạt Dùng Thử 15 Ngày';
                btn.disabled = false;
            }
            if (errDiv) {
                errDiv.innerText = 'Lỗi kết nối máy chủ: ' + (err && err.message ? err.message : String(err));
                errDiv.style.display = 'block';
            }
        });
    } else {
        alert('Lỗi: Hệ thống chưa sẵn sàng kết nối API.');
        if (btn) { btn.innerText = '🚀 Kích Hoạt Dùng Thử 15 Ngày'; btn.disabled = false; }
    }
};

// ============================================================
// 💳 HỆ THỐNG THANH TOÁN VIETQR & TỰ ĐỘNG NÂNG CẤP GÓI SAAS
// ============================================================

window.copyPaymentText = function (text, label) {
    if (!text) return;
    const str = String(text).trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(() => {
            if (typeof showToast === 'function') {
                showToast(`Đã sao chép ${label || 'thông tin'}: ${str}`, 'success');
            } else {
                alert(`Đã sao chép ${label || 'thông tin'}: ${str}`);
            }
        }).catch(() => fallbackCopy(str, label));
    } else {
        fallbackCopy(str, label);
    }

    function fallbackCopy(val, lbl) {
        try {
            const ta = document.createElement('textarea');
            ta.value = val;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (typeof showToast === 'function') {
                showToast(`Đã sao chép ${lbl || 'thông tin'}: ${val}`, 'success');
            } else {
                alert(`Đã sao chép: ${val}`);
            }
        } catch (e) {
            prompt(`Vui lòng sao chép ${lbl || 'thông tin'} thủ công:`, val);
        }
    }
};

// ============================================================
// 📄 MODAL ĐIỀN THÔNG TIN BÊN A CHO HỢP ĐỒNG & GIẤY CHỨNG NHẬN
// ============================================================
window.openContractPartyAModal = function (optPlanCode, optUnitCode, optUnitName, optExpiresAt) {
    const unitCode = String(optUnitCode || localStorage.getItem('pm_unit_code') || 'bvtks-cs2').trim().toLowerCase();
    const sess = (typeof getSession === 'function' ? getSession() : (typeof window.getSession === 'function' ? window.getSession() : {}));

    const unitName = optUnitName ? decodeURIComponent(optUnitName) : (sess.unit_name || localStorage.getItem('pm_unit_name') || `Bệnh viện / Phòng khám ${unitCode.toUpperCase()}`);
    const planCode = String(optPlanCode || window._currentSelectedPlan || localStorage.getItem('pm_plan_tier') || sess.plan_tier || 'PLAN_1Y').toUpperCase();

    window._contractTargetPlan = planCode;
    window._contractTargetUnit = unitCode;
    window._contractTargetUnitName = unitName;
    window._contractTargetExpires = optExpiresAt || '';

    // Đọc thông tin Bên A đã lưu trước đó nếu có
    let saved = null;
    try {
        const raw = localStorage.getItem('pm_contract_party_a_' + unitCode);
        if (raw) saved = JSON.parse(raw);
    } catch (e) {}

    const nameInp = document.getElementById('c-pa-unit-name');
    const repInp = document.getElementById('c-pa-rep');
    const posInp = document.getElementById('c-pa-pos');
    const addrInp = document.getElementById('c-pa-addr');
    const taxInp = document.getElementById('c-pa-tax');
    const phoneInp = document.getElementById('c-pa-phone');

    if (nameInp) nameInp.value = (saved && saved.unitName) ? saved.unitName : unitName;
    if (repInp) repInp.value = (saved && saved.representative) ? saved.representative : '';
    if (posInp) posInp.value = (saved && saved.position) ? saved.position : '';
    if (addrInp) addrInp.value = (saved && saved.address) ? saved.address : '';
    if (taxInp) taxInp.value = (saved && saved.taxCode) ? saved.taxCode : '';
    if (phoneInp) phoneInp.value = (saved && saved.phone) ? saved.phone : (localStorage.getItem('pm_phone') || '');

    const modal = document.getElementById('modal-contract-party-a');
    if (modal) modal.style.display = 'flex';
};

window.closeContractPartyAModal = function () {
    const modal = document.getElementById('modal-contract-party-a');
    if (modal) modal.style.display = 'none';
};

window.submitAndDownloadContractPDF = function () {
    const unitCode = window._contractTargetUnit || (localStorage.getItem('pm_unit_code') || 'bvtks-cs2').toLowerCase();
    const fallbackName = window._contractTargetUnitName || `Bệnh viện / Phòng khám ${unitCode.toUpperCase()}`;
    const unitName = (document.getElementById('c-pa-unit-name')?.value || '').trim() || fallbackName;
    const representative = (document.getElementById('c-pa-rep')?.value || '').trim();
    const position = (document.getElementById('c-pa-pos')?.value || '').trim();
    const address = (document.getElementById('c-pa-addr')?.value || '').trim();
    const taxCode = (document.getElementById('c-pa-tax')?.value || '').trim();
    const phone = (document.getElementById('c-pa-phone')?.value || '').trim();

    const partyAInfo = {
        unitName,
        representative: representative || 'Ban Giám Đốc / Trưởng đơn vị',
        position: position || 'Đại diện theo pháp luật',
        address: address || 'Trụ sở đơn vị y tế',
        taxCode,
        phone
    };

    // Lưu vào localStorage
    try {
        localStorage.setItem('pm_contract_party_a_' + unitCode, JSON.stringify(partyAInfo));
        localStorage.setItem('pm_unit_name', unitName);
    } catch (e) {}

    window.closeContractPartyAModal();

    // Tải file PDF
    window.downloadLicenseContractPDF(
        unitCode,
        window._contractTargetPlan,
        encodeURIComponent(unitName),
        window._contractTargetExpires,
        partyAInfo
    );
};

// ============================================================
// 📄 XUẤT HỢP ĐỒNG & GIẤY CHỨNG NHẬN BẢN QUYỀN PDF (CHUẨN MẪU MEDS DOCX)
// ============================================================
window.downloadLicenseContractPDF = function (optUnitCode, optPlanCode, optUnitName, optExpiresAt, optPartyAInfo) {
    if (typeof pdfMake === 'undefined') {
        return alert("Thư viện pdfmake đang được khởi tạo, vui lòng bấm lại sau 1-2 giây!");
    }

    const unitCode = String(optUnitCode || localStorage.getItem('pm_unit_code') || 'bvtks-cs2').trim().toLowerCase();
    const sess = (typeof getSession === 'function' ? getSession() : (typeof window.getSession === 'function' ? window.getSession() : {}));

    const rawUnitName = optUnitName ? decodeURIComponent(optUnitName) : (sess.unit_name || localStorage.getItem('pm_unit_name') || `Bệnh viện / Phòng khám ${unitCode.toUpperCase()}`);
    const planCode = String(optPlanCode || window._currentSelectedPlan || localStorage.getItem('pm_plan_tier') || sess.plan_tier || 'PLAN_1Y').toUpperCase();

    // Lấy thông tin Bên A đã nhập hoặc lấy từ cache
    let partyA = optPartyAInfo;
    if (!partyA) {
        try {
            const raw = localStorage.getItem('pm_contract_party_a_' + unitCode);
            if (raw) partyA = JSON.parse(raw);
        } catch (e) {}
    }
    if (!partyA) {
        partyA = {
            unitName: rawUnitName,
            representative: 'Ban Giám Đốc / Trưởng đơn vị',
            position: 'Đại diện theo pháp luật',
            address: 'Trụ sở đơn vị y tế',
            taxCode: '',
            phone: localStorage.getItem('pm_phone') || ''
        };
    }
    const unitName = partyA.unitName || rawUnitName;

    const planCatalog = {
        'TRIAL_15D': { name: 'Gói Dùng Thử 15 Ngày', duration: '15 ngày', days: 15, price: '0 VNĐ', priceText: 'Không đồng (Trải nghiệm miễn phí)' },
        'PLAN_1M': { name: 'Gói 1 Tháng', duration: '01 tháng (30 ngày)', days: 30, price: '400.000 VNĐ', priceText: 'Bốn trăm nghìn đồng' },
        'PLAN_3M': { name: 'Gói 3 Tháng', duration: '03 tháng (90 ngày)', days: 90, price: '1.125.000 VNĐ', priceText: 'Một triệu một trăm hai mươi lăm nghìn đồng' },
        'PLAN_6M': { name: 'Gói 6 Tháng', duration: '06 tháng (180 ngày)', days: 180, price: '2.100.000 VNĐ', priceText: 'Hai triệu một trăm nghìn đồng' },
        'PLAN_1Y': { name: 'Gói 1 Năm', duration: '01 năm (365 ngày)', days: 365, price: '3.900.000 VNĐ', priceText: 'Ba triệu chín trăm nghìn đồng' },
        'ENTERPRISE': { name: 'Gói Doanh Nghiệp Đặc Biệt (Vĩnh Viễn)', duration: 'Vĩnh viễn trọn đời', days: 99999, price: 'Sở Hữu Trọn Đời', priceText: 'Sở hữu trọn đời' }
    };

    const targetPlan = planCatalog[planCode] || planCatalog['PLAN_1Y'];
    const now = new Date();
    const curDay = String(now.getDate()).padStart(2, '0');
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const curYear = now.getFullYear();
    const startDateVN = `${curDay}/${curMonth}/${curYear}`;

    // Tính toán thời hạn hợp đồng và chứng nhận chính xác cho gói cước được cấp
    let endDateVN = '';
    let certDurationDisplay = '';
    let contractDurationDisplay = '';

    if (unitCode === 'bvtks-cs2' || planCode === 'ENTERPRISE') {
        endDateVN = '31/12/2099';
        certDurationDisplay = '💎 Vĩnh Viễn Trọn Đời (Đến 31/12/2099)';
        contractDurationDisplay = `Hiệu lực vĩnh viễn trọn đời kể từ ngày ký/kích hoạt (ngày ${startDateVN}).`;
    } else {
        const storedPlan = localStorage.getItem('pm_plan_tier') || sess.plan_tier || '';
        const storedExp = localStorage.getItem('pm_expires_at') || sess.expires_at || '';

        let targetEndObj = new Date(now.getTime());

        // Ưu tiên ngày chỉ định trực tiếp từ Super Admin nếu có
        if (optExpiresAt) {
            const optExpParsed = new Date(optExpiresAt);
            if (!isNaN(optExpParsed.getTime())) {
                targetEndObj = optExpParsed;
            }
        } else if (storedPlan === planCode && storedExp) {
            // Đơn vị đã thanh toán và đang ở đúng gói cước này
            const expParsed = new Date(storedExp);
            if (!isNaN(expParsed.getTime()) && expParsed > now) {
                targetEndObj = expParsed;
            } else {
                if (planCode === 'TRIAL_15D') targetEndObj.setDate(targetEndObj.getDate() + 15);
                else if (planCode === 'PLAN_1M') targetEndObj.setMonth(targetEndObj.getMonth() + 1);
                else if (planCode === 'PLAN_3M') targetEndObj.setMonth(targetEndObj.getMonth() + 3);
                else if (planCode === 'PLAN_6M') targetEndObj.setMonth(targetEndObj.getMonth() + 6);
                else if (planCode === 'PLAN_1Y') targetEndObj.setFullYear(targetEndObj.getFullYear() + 1);
                else targetEndObj.setDate(targetEndObj.getDate() + (targetPlan.days || 30));
            }
        } else {
            // Đang lập hợp đồng đăng ký mới hoặc nâng cấp từ Dùng thử sang gói trả phí:
            // Tính chuẩn xác thời hạn bắt đầu từ hôm nay (hoặc nối tiếp gói trả phí cũ nếu còn hạn)
            let baseDate = new Date(now.getTime());
            if (storedPlan && storedPlan !== 'TRIAL_15D' && storedExp) {
                const prevExp = new Date(storedExp);
                if (!isNaN(prevExp.getTime()) && prevExp > now) {
                    baseDate = prevExp;
                }
            }
            targetEndObj = new Date(baseDate.getTime());
            if (planCode === 'TRIAL_15D') targetEndObj.setDate(targetEndObj.getDate() + 15);
            else if (planCode === 'PLAN_1M') targetEndObj.setMonth(targetEndObj.getMonth() + 1);
            else if (planCode === 'PLAN_3M') targetEndObj.setMonth(targetEndObj.getMonth() + 3);
            else if (planCode === 'PLAN_6M') targetEndObj.setMonth(targetEndObj.getMonth() + 6);
            else if (planCode === 'PLAN_1Y') targetEndObj.setFullYear(targetEndObj.getFullYear() + 1);
            else targetEndObj.setDate(targetEndObj.getDate() + (targetPlan.days || 30));
        }

        const eD = String(targetEndObj.getDate()).padStart(2, '0');
        const eM = String(targetEndObj.getMonth() + 1).padStart(2, '0');
        const eY = targetEndObj.getFullYear();
        endDateVN = `${eD}/${eM}/${eY}`;
        certDurationDisplay = `Đến ngày: ${endDateVN}`;
        contractDurationDisplay = `Hợp đồng có hiệu lực kể từ ngày kích hoạt/thanh toán (ngày ${startDateVN}) đến hết ngày ${endDateVN} (Tổng thời gian: ${targetPlan.duration}).`;
    }

    const certNumber = `TIMS-LIC/${curYear}/${unitCode.toUpperCase()}`;
    const contractNumber = `${now.getMonth() + 1}${now.getDate()}/HĐDV/${curYear}`;

    // Xây dựng tài liệu PDF gồm 4 trang chuyên nghiệp theo mẫu hop-dong-dich-vu-meds.docx
    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [35, 25, 35, 25],
        content: [
            // ==========================================
            // TRANG 1: GIẤY CHỨNG NHẬN CẤP QUYỀN SỬ DỤNG BẢN QUYỀN
            // ==========================================
            {
                table: {
                    widths: ['*'],
                    body: [[
                        {
                            fillColor: '#fafafa',
                            borderColor: ['#1d4ed8', '#1d4ed8', '#1d4ed8', '#1d4ed8'],
                            border: [true, true, true, true],
                            layout: { paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10 },
                            stack: [
                                {
                                    columns: [
                                        {
                                            width: '*',
                                            stack: [
                                                { text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', fontSize: 10, bold: true, alignment: 'center' },
                                                { text: 'Độc lập - Tự do - Hạnh phúc', fontSize: 10, italic: true, alignment: 'center', margin: [0, 2, 0, 2] },
                                                { canvas: [{ type: 'line', x1: 165, y1: 0, x2: 295, y2: 0, lineWidth: 0.8, lineColor: '#334155' }] }
                                            ]
                                        }
                                    ],
                                    margin: [0, 0, 0, 8]
                                },
                                { text: 'HỆ THỐNG PHẦN MỀM XẾP LỊCH ĐIỀU TRỊ YHCT - PHCN (T.I.M.E.S SYSTEM)', fontSize: 9.5, bold: true, color: '#1e40af', alignment: 'center', margin: [0, 0, 0, 2] },
                                { text: 'Nền Tảng Quản Lý & Tối Ưu Hóa Lịch Khám Chữa Bệnh Thông Minh (Multi-Tenant SaaS Cloud)', fontSize: 8.5, italic: true, color: '#64748b', alignment: 'center', margin: [0, 0, 0, 8] },

                                { text: 'GIẤY XÁC NHẬN CẤP QUYỀN SỬ DỤNG BẢN QUYỀN PHẦN MỀM', fontSize: 13.5, bold: true, color: '#0f172a', alignment: 'center', margin: [0, 4, 0, 2] },
                                { text: 'CERTIFICATE OF SOFTWARE LICENSE & SAAS SERVICE', fontSize: 8.5, bold: true, color: '#2563eb', alignment: 'center', margin: [0, 0, 0, 4] },
                                { text: `Số chứng nhận: ${certNumber}`, fontSize: 9, italic: true, alignment: 'center', color: '#475569', margin: [0, 0, 0, 8] },

                                {
                                    text: [
                                        { text: 'Căn cứ pháp lý: ', bold: true },
                                        'Căn cứ Bộ luật Dân sự số 91/2015/QH13; Luật Thương mại số 36/2005/QH11; Luật Công nghệ thông tin số 67/2006/QH11; Luật Sở hữu trí tuệ số 50/2005/QH11 (sửa đổi, bổ sung năm 2022); Nghị định số 123/2020/NĐ-CP và Thông tư số 219/2013/TT-BTC của Bộ Tài chính quy định dịch vụ phần mềm không chịu thuế GTGT.'
                                    ],
                                    fontSize: 8.5,
                                    color: '#475569',
                                    lineHeight: 1.3,
                                    margin: [0, 0, 0, 8]
                                },

                                // Bảng thông tin bản quyền
                                {
                                    table: {
                                        widths: [130, '*'],
                                        body: [
                                            [
                                                { text: 'Đơn Vị Thụ Hưởng:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: unitName, bold: true, fontSize: 10, color: '#1e3a8a' }
                                            ],
                                            [
                                                { text: 'Mã Định Danh (Slug):', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: unitCode.toUpperCase(), fontSize: 9.5, bold: true, color: '#2563eb' }
                                            ],
                                            [
                                                { text: 'Gói Bản Quyền Cấp:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: `${targetPlan.name} (${targetPlan.duration})`, fontSize: 9.5, bold: true, color: '#15803d' }
                                            ],
                                            [
                                                { text: 'Thời Hạn Sử Dụng:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: certDurationDisplay, fontSize: 9.5, bold: true, color: '#0f172a' }
                                            ],
                                            [
                                                { text: 'Phạm Vi Cấp Quyền:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: 'Toàn quyền sử dụng Full 100% tính năng trực tuyến qua Web SaaS (không giới hạn số lượng Bệnh nhân, Kỹ thuật viên, Máy móc, Phòng bệnh). Bao gồm thuật toán AI & CP-SAT Solver tối ưu giờ thủ thuật, sao lưu tự động và phân tích thống kê.', fontSize: 8.5, color: '#334155' }
                                            ],
                                            [
                                                { text: 'Đơn Vị Cấp Bản Quyền:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: 'BS. Đặng Phong Thái (Tác giả & Kỹ sư trưởng phát triển hệ thống phần mềm T.I.M.E.S)', fontSize: 9.5, bold: true }
                                            ],
                                            [
                                                { text: 'Thông Tin Tài Khoản MB:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: 'Ngân hàng TMCP Quân Đội (MB Bank) - STK: 0392283473 - Chủ TK: ĐẶNG PHONG THÁI', fontSize: 9, bold: true, color: '#1d4ed8' }
                                            ]
                                        ]
                                    },
                                    layout: {
                                        hLineWidth: () => 0.5,
                                        vLineWidth: () => 0.5,
                                        hLineColor: () => '#cbd5e1',
                                        vLineColor: () => '#cbd5e1',
                                        paddingTop: () => 4,
                                        paddingBottom: () => 4
                                    },
                                    margin: [0, 0, 0, 8]
                                },

                                {
                                    text: 'XÁC NHẬN: Phần mềm T.I.M.E.S được cấp phép sử dụng trực tuyến độc lập theo từng đơn vị y tế, mã hóa và bảo mật dữ liệu tuyệt đối. Giấy xác nhận này là chứng từ căn cứ phục vụ đối soát, kích hoạt bản quyền và kẹp chứng từ thanh toán ngân hàng hạch toán chi phí nội bộ hợp lệ của Đơn vị.',
                                    fontSize: 8,
                                    italic: true,
                                    color: '#475569',
                                    margin: [0, 0, 0, 10]
                                },

                                // Ký tên hai bên
                                {
                                    columns: [
                                        {
                                            width: '*',
                                            alignment: 'center',
                                            stack: [
                                                { text: 'ĐẠI DIỆN ĐƠN VỊ THỤ HƯỞNG', fontSize: 9.5, bold: true, color: '#0f172a' },
                                                { text: '(Ký, ghi rõ họ tên & đóng dấu)', fontSize: 8, italic: true, color: '#64748b' },
                                                { text: '\n\n\n' },
                                                { text: partyA.representative || unitName, fontSize: 9.5, bold: true }
                                            ]
                                        },
                                        {
                                            width: '*',
                                            alignment: 'center',
                                            stack: [
                                                { text: `Ngày ${curDay} tháng ${curMonth} năm ${curYear}`, fontSize: 8.5, italic: true, color: '#475569', margin: [0, 0, 0, 2] },
                                                { text: 'TÁC GIẢ & ĐẠI DIỆN HỆ THỐNG T.I.M.E.S', fontSize: 9.5, bold: true, color: '#1e40af' },
                                                { text: '(Đã xác thực chữ ký số điện tử)', fontSize: 8, italic: true, color: '#16a34a' },
                                                { text: '★ VALID CERTIFIED LICENSE ★', fontSize: 8.5, bold: true, color: '#15803d', margin: [0, 4, 0, 4] },
                                                { text: '\n' },
                                                { text: 'BS. ĐẶNG PHONG THÁI', fontSize: 9.5, bold: true, color: '#0f172a' },
                                                { text: 'SĐT / Zalo: 0392.283.473', fontSize: 8, color: '#64748b' }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]]
                }
            },

            // ==========================================
            // TRANG 2 & 3: HỢP ĐỒNG DỊCH VỤ (THEO MẪU MEDS)
            // ==========================================
            {
                pageBreak: 'before',
                stack: [
                    {
                        columns: [
                            {
                                width: '*',
                                stack: [
                                    { text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', fontSize: 10.5, bold: true, alignment: 'center' },
                                    { text: 'Độc lập - Tự do - Hạnh phúc', fontSize: 10, italic: true, alignment: 'center', margin: [0, 2, 0, 2] },
                                    { canvas: [{ type: 'line', x1: 170, y1: 0, x2: 290, y2: 0, lineWidth: 0.8, lineColor: '#334155' }] }
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 10]
                    },
                    { text: 'HỢP ĐỒNG DỊCH VỤ PHẦN MỀM', fontSize: 13, bold: true, color: '#0f172a', alignment: 'center', margin: [0, 4, 0, 2] },
                    { text: `Số: ${contractNumber}`, fontSize: 9.5, italic: true, alignment: 'center', color: '#475569', margin: [0, 0, 0, 6] },

                    {
                        text: [
                            { text: 'Căn cứ pháp lý:\n', bold: true },
                            '- Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;\n',
                            '- Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;\n',
                            '- Luật Công nghệ thông tin số 67/2006/QH11 ngày 29/06/2006;\n',
                            '- Luật Sở hữu trí tuệ số 50/2005/QH11 (sửa đổi, bổ sung 2022);\n',
                            '- Nhu cầu sử dụng dịch vụ của Bên A và năng lực cung cấp của Bên B;'
                        ],
                        fontSize: 8.5,
                        color: '#475569',
                        lineHeight: 1.25,
                        margin: [0, 0, 0, 8]
                    },
                    { text: 'Các bên thống nhất ký kết Hợp đồng với các điều khoản sau:', fontSize: 9, italic: true, margin: [0, 0, 0, 6] },

                    // Điều 1. Các bên trong hợp đồng
                    { text: 'Điều 1. Các bên trong hợp đồng', fontSize: 9.5, bold: true, color: '#1e3a8a', margin: [0, 0, 0, 4] },
                    {
                        table: {
                            widths: ['50%', '50%'],
                            body: [
                                [
                                    {
                                        fillColor: '#f8fafc',
                                        stack: [
                                            { text: '1. BÊN A (Bên sử dụng dịch vụ):', bold: true, fontSize: 9, color: '#0f172a', margin: [0, 0, 0, 2] },
                                            { text: `• Tên đơn vị: ${unitName}`, fontSize: 8.5, bold: true },
                                            { text: `• Mã đơn vị (Slug): ${unitCode.toUpperCase()}`, fontSize: 8.5 },
                                            { text: `• Đại diện: ${partyA.representative || 'Ban Giám Đốc / Trưởng đơn vị'}`, fontSize: 8.5 },
                                            { text: `• Chức vụ: ${partyA.position || 'Đại diện theo pháp luật'}`, fontSize: 8.5 },
                                            { text: `• Địa chỉ: ${partyA.address || 'Trụ sở đơn vị y tế'}`, fontSize: 8.5 },
                                            ...(partyA.taxCode ? [{ text: `• Mã số thuế: ${partyA.taxCode}`, fontSize: 8.5 }] : []),
                                            ...(partyA.phone ? [{ text: `• Điện thoại: ${partyA.phone}`, fontSize: 8.5 }] : [])
                                        ]
                                    },
                                    {
                                        fillColor: '#f8fafc',
                                        stack: [
                                            { text: '2. BÊN B (Bên cung cấp dịch vụ):', bold: true, fontSize: 9, color: '#15803d', margin: [0, 0, 0, 2] },
                                            { text: '• Tên đơn vị: HỆ THỐNG XẾP LỊCH T.I.M.E.S', fontSize: 8.5, bold: true },
                                            { text: '• Đại diện: BS. ĐẶNG PHONG THÁI', fontSize: 8.5, bold: true },
                                            { text: '• Chức vụ: Tác giả & Kỹ sư phát triển', fontSize: 8.5 },
                                            { text: '• Điện thoại / Zalo: 0392.283.473', fontSize: 8.5 },
                                            { text: '• Email: dpthai.ttytmk@gmail.com', fontSize: 8.5 },
                                            { text: '• STK MB Bank: 0392283473 (Ngân hàng TMCP Quân Đội)', fontSize: 8.5, bold: true }
                                        ]
                                    }
                                ]
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, 0, 0, 8]
                    },

                    // Điều 2 & 3
                    { text: 'Điều 2. Đối tượng hợp đồng', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: 'Bên B cung cấp cho Bên A quyền sử dụng Dịch vụ phần mềm quản lý và xếp lịch điều trị YHCT - PHCN (T.I.M.E.S System v4 SaaS) theo mô hình điện toán đám mây SaaS (Software as a Service) qua Internet tại địa chỉ https://xeplichthuthuat.io.vn. Phạm vi bao gồm: Quyền truy cập theo tài khoản do Bên B cấp; Cập nhật, nâng cấp, vá lỗi trong thời hạn hợp đồng; Hỗ trợ kỹ thuật trực tuyến theo Điều 3.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Điều 3. Phạm vi dịch vụ', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Bên B đảm bảo dịch vụ vận hành đúng chức năng mô tả tại Phụ lục II;\n- Bên B cung cấp tài liệu đào tạo/hướng dẫn sử dụng cho nhân sự được chỉ định của Bên A;\n- Hỗ trợ kỹ thuật trực tiếp qua Điện thoại/Zalo/Ultraview 24/7;\n- Bên A sử dụng dịch vụ cho mục đích chuyên môn nội bộ, không chuyển giao cho bên thứ ba khi chưa có chấp thuận bằng văn bản của Bên B.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Điều 4. Thời hạn hợp đồng', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: `- ${contractDurationDisplay}\n- Hợp đồng được tự động gia hạn hoặc ký phụ lục/hợp đồng mới khi hết hạn.`, fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Điều 5. Giá trị và phương thức thanh toán', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: `1. Giá trị dịch vụ: ${targetPlan.price} (Bằng chữ: ${targetPlan.priceText}) theo Biểu giá tại Phụ lục I.\n2. Thuế GTGT: Thuế suất 0% (Theo Thông tư số 219/2013/TT-BTC, sản phẩm và dịch vụ phần mềm thuộc đối tượng không chịu thuế GTGT).\n3. Hình thức thanh toán: Chuyển khoản ngân hàng vào tài khoản của Bên B:\n   • Tên tài khoản: ĐẶNG PHONG THÁI | Số tài khoản: 0392283473 | Ngân hàng: MB Bank (Ngân hàng TMCP Quân Đội).\n4. Thời hạn thanh toán: Thanh toán khi đăng ký/kích hoạt hoặc theo thỏa thuận cụ thể.`, fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Điều 6. Quyền và nghĩa vụ của Bên A', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Thanh toán đầy đủ và đúng hạn theo Điều 5;\n- Cung cấp danh mục thủ thuật, nhân sự, máy móc cần thiết để triển khai dịch vụ;\n- Quản lý và bảo mật tài khoản quản trị được bàn giao;\n- Không sao chép, chỉnh sửa mã nguồn hoặc bán lại dịch vụ khi chưa có sự chấp thuận của Bên B.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Điều 7. Quyền và nghĩa vụ của Bên B', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Cung cấp dịch vụ đúng thỏa thuận, hỗ trợ kỹ thuật liên tục trong thời hạn hợp đồng;\n- Bảo mật tuyệt đối dữ liệu của Bên A, không tiết lộ cho bên thứ ba trừ khi có yêu cầu bằng văn bản của cơ quan pháp luật có thẩm quyền;\n- Cung cấp giấy xác nhận bản quyền và chứng từ thanh toán hợp lệ;\n- Thông báo trước cho Bên A khi có nâng cấp lớn hoặc bảo trì hệ thống.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Điều 8. Bảo mật thông tin và dữ liệu', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Các Bên cam kết bảo mật thông tin hợp đồng và dữ liệu bệnh án/điều trị phát sinh;\n- Dữ liệu thuộc quyền sở hữu riêng của Bên A. Khi chấm dứt hợp đồng, Bên B sẽ xuất bản sao dữ liệu (JSON/Excel) giao lại cho Bên A nếu có yêu cầu.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Điều 9. Chấm dứt hợp đồng & Điều 10. Giải quyết tranh chấp', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Hợp đồng chấm dứt khi hết thời hạn mà không gia hạn, hoặc hai bên cùng thỏa thuận chấm dứt trước hạn.\n- Mọi tranh chấp phát sinh được ưu tiên giải quyết qua thương lượng, hòa giải trên tinh thần hợp tác thiện chí y tế. Nếu không đạt thỏa thuận, tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền theo pháp luật Việt Nam.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Điều 11. Điều khoản chung', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Hợp đồng có hiệu lực kể từ ngày ký/kích hoạt thanh toán.\n- Hợp đồng gồm đầy đủ các trang và các Phụ lục I, Phụ lục II là phần không thể tách rời của Hợp đồng này. Bản điện tử có giá trị pháp lý tương đương bản gốc.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 10] },

                    // Ký tên hợp đồng
                    {
                        columns: [
                            {
                                width: '*',
                                alignment: 'center',
                                stack: [
                                    { text: 'ĐẠI DIỆN BÊN A', fontSize: 9.5, bold: true },
                                    { text: '(Ký, đóng dấu và ghi rõ họ tên)', fontSize: 8, italic: true, color: '#64748b' },
                                    { text: '\n\n\n' },
                                    { text: (partyA.representative && partyA.representative !== 'Ban Giám Đốc / Trưởng đơn vị') ? `${partyA.representative}\n(${unitName})` : unitName, fontSize: 9.5, bold: true }
                                ]
                            },
                            {
                                width: '*',
                                alignment: 'center',
                                stack: [
                                    { text: 'ĐẠI DIỆN BÊN B', fontSize: 9.5, bold: true, color: '#1e40af' },
                                    { text: '(Ký, ghi rõ họ tên)', fontSize: 8, italic: true, color: '#64748b' },
                                    { text: '\n\n\n' },
                                    { text: 'BS. ĐẶNG PHONG THÁI', fontSize: 10, bold: true }
                                ]
                            }
                        ]
                    }
                ]
            },

            // ==========================================
            // TRANG 4: PHỤ LỤC I (BẢNG GIÁ) & PHỤ LỤC II (MÔ TẢ TÍNH NĂNG)
            // ==========================================
            {
                pageBreak: 'before',
                stack: [
                    { text: 'PHỤ LỤC I: BẢNG GIÁ DỊCH VỤ PHẦN MỀM T.I.M.E.S NĂM 2026', fontSize: 11, bold: true, color: '#1e3a8a', alignment: 'center', margin: [0, 0, 0, 4] },
                    { text: `(Kèm theo Hợp đồng dịch vụ số ${contractNumber} giữa ${unitName} và Hệ thống T.I.M.E.S)`, fontSize: 8.5, italic: true, alignment: 'center', color: '#64748b', margin: [0, 0, 0, 8] },

                    // Bảng biểu phí chuẩn
                    {
                        table: {
                            widths: [30, 160, 100, 70, '*'],
                            body: [
                                [
                                    { text: 'STT', bold: true, fontSize: 8.5, alignment: 'center', fillColor: '#f1f5f9' },
                                    { text: 'Tên Gói Dịch Vụ', bold: true, fontSize: 8.5, fillColor: '#f1f5f9' },
                                    { text: 'Thời Hạn', bold: true, fontSize: 8.5, alignment: 'center', fillColor: '#f1f5f9' },
                                    { text: 'Đơn Giá (VNĐ)', bold: true, fontSize: 8.5, alignment: 'right', fillColor: '#f1f5f9' },
                                    { text: 'Chọn Đăng Ký', bold: true, fontSize: 8.5, alignment: 'center', fillColor: '#f1f5f9' }
                                ],
                                [
                                    { text: '1', fontSize: 8.5, alignment: 'center' },
                                    { text: 'Gói Dùng Thử 15 Ngày', fontSize: 8.5 },
                                    { text: '15 ngày trải nghiệm', fontSize: 8.5, alignment: 'center' },
                                    { text: '0 VNĐ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'TRIAL_15D' ? '☑ ĐÃ CHỌN' : '☐', fontSize: 8.5, alignment: 'center', bold: planCode === 'TRIAL_15D', color: planCode === 'TRIAL_15D' ? '#15803d' : '#94a3b8' }
                                ],
                                [
                                    { text: '2', fontSize: 8.5, alignment: 'center' },
                                    { text: 'Gói 1 Tháng', fontSize: 8.5 },
                                    { text: '01 tháng (30 ngày)', fontSize: 8.5, alignment: 'center' },
                                    { text: '400.000 VNĐ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'PLAN_1M' ? '☑ ĐÃ CHỌN' : '☐', fontSize: 8.5, alignment: 'center', bold: planCode === 'PLAN_1M', color: planCode === 'PLAN_1M' ? '#15803d' : '#94a3b8' }
                                ],
                                [
                                    { text: '3', fontSize: 8.5, alignment: 'center' },
                                    { text: 'Gói 3 Tháng (~375k/tháng)', fontSize: 8.5 },
                                    { text: '03 tháng (90 ngày)', fontSize: 8.5, alignment: 'center' },
                                    { text: '1.125.000 VNĐ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'PLAN_3M' ? '☑ ĐÃ CHỌN' : '☐', fontSize: 8.5, alignment: 'center', bold: planCode === 'PLAN_3M', color: planCode === 'PLAN_3M' ? '#15803d' : '#94a3b8' }
                                ],
                                [
                                    { text: '4', fontSize: 8.5, alignment: 'center' },
                                    { text: 'Gói 6 Tháng (~350k/tháng)', fontSize: 8.5 },
                                    { text: '06 tháng (180 ngày)', fontSize: 8.5, alignment: 'center' },
                                    { text: '2.100.000 VNĐ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'PLAN_6M' ? '☑ ĐÃ CHỌN' : '☐', fontSize: 8.5, alignment: 'center', bold: planCode === 'PLAN_6M', color: planCode === 'PLAN_6M' ? '#15803d' : '#94a3b8' }
                                ],
                                [
                                    { text: '5', fontSize: 8.5, alignment: 'center' },
                                    { text: 'Gói 1 Năm (~325k/tháng - Tiết kiệm)', fontSize: 8.5, bold: true },
                                    { text: '01 năm (365 ngày)', fontSize: 8.5, alignment: 'center' },
                                    { text: '3.900.000 VNĐ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'PLAN_1Y' ? '☑ ĐÃ CHỌN' : '☐', fontSize: 8.5, alignment: 'center', bold: planCode === 'PLAN_1Y', color: planCode === 'PLAN_1Y' ? '#15803d' : '#94a3b8' }
                                ]
                            ]
                        },
                        layout: {
                            hLineWidth: () => 0.5,
                            vLineWidth: () => 0.5,
                            hLineColor: () => '#cbd5e1',
                            vLineColor: () => '#cbd5e1',
                            paddingTop: () => 3.5,
                            paddingBottom: () => 3.5
                        },
                        margin: [0, 0, 0, 6]
                    },
                    { text: 'Lưu ý: Bảng giá trên là dịch vụ phần mềm không chịu thuế GTGT (VAT 0%) theo Thông tư 219/2013/TT-BTC. Tất cả các gói đều hỗ trợ Full 100% chức năng không giới hạn.', fontSize: 7.5, italic: true, color: '#64748b', margin: [0, 0, 0, 10] },

                    // PHỤ LỤC II
                    { text: 'PHỤ LỤC II: MÔ TẢ CHỨC NĂNG DỊCH VỤ PHẦN MỀM T.I.M.E.S', fontSize: 11, bold: true, color: '#1e3a8a', alignment: 'center', margin: [0, 0, 0, 4] },
                    { text: 'Các chức năng nghiệp vụ chính của Hệ thống T.I.M.E.S bao gồm:', fontSize: 8.5, bold: true, color: '#0f172a', margin: [0, 0, 0, 4] },

                    {
                        columns: [
                            {
                                width: '50%',
                                stack: [
                                    { text: '1. Quản lý danh mục kỹ thuật: Thiết lập thời lượng, máy móc gắn kèm, khoảng cách nghỉ, nhóm thủ thuật YHCT - PHCN chuẩn Bộ Y Tế.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '2. Quản lý KTV & Bác sĩ: Phân công ca sáng/chiều, phòng chỉ định, chuyên môn kỹ thuật thực hiện.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '3. Quản lý máy móc: Định danh mã máy, phòng đặt máy, chống trùng lặp thiết bị tuyệt đối.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '4. Quản lý bệnh nhân: Nhập hồ sơ, buồng giường, chỉ định y lệnh đa dịch vụ nội trú & ngoại trú.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '5. Động cơ AI & CP-SAT Solver: Tự động chia giờ thủ thuật thông minh, không trùng nhân viên, máy móc, bệnh nhân.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '6. Xếp lịch cuối tuần / trực: Tự động chia ca trực Thứ 7, Chủ Nhật và ngày nghỉ lễ chuyên biệt.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] }
                                ]
                            },
                            {
                                width: '50%',
                                stack: [
                                    { text: '7. Quản lý y lệnh: Tổng hợp chỉ định, phân luồng theo khoa phòng, đồng bộ trạng thái bệnh án.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '8. Xuất bảng KETQUA: Bảng kết quả xếp lịch trực quan đầy đủ ngày, giờ, bệnh nhân, KTV, máy móc.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '9. Xuất báo cáo đa dạng: Xuất PDF lịch theo từng buồng phòng bệnh viện, xuất Excel phân công KTV.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '10. Đám mây & Bảo mật: Nền tảng Cloudflare Worker + D1 Database, mã hóa JWT, sao lưu Google Drive tự động.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '11. Địa chỉ truy cập trực tuyến: https://xeplichthuthuat.io.vn (Sử dụng trực tiếp trên Web/Mobile/Tablet).', fontSize: 8, color: '#1d4ed8', bold: true, margin: [0, 0, 0, 3] }
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 10]
                    },

                    // Ký xác nhận phụ lục
                    {
                        columns: [
                            {
                                width: '*',
                                alignment: 'center',
                                stack: [
                                    { text: 'XÁC NHẬN BÊN A', fontSize: 9, bold: true },
                                    { text: '(Ký, đóng dấu)', fontSize: 7.5, italic: true, color: '#64748b' },
                                    { text: '\n\n' },
                                    { text: (partyA.representative && partyA.representative !== 'Ban Giám Đốc / Trưởng đơn vị') ? `${partyA.representative}\n(${unitName})` : unitName, fontSize: 9, bold: true }
                                ]
                            },
                            {
                                width: '*',
                                alignment: 'center',
                                stack: [
                                    { text: 'XÁC NHẬN BÊN B', fontSize: 9, bold: true, color: '#1e40af' },
                                    { text: '(Ký, ghi rõ họ tên)', fontSize: 7.5, italic: true, color: '#64748b' },
                                    { text: '\n\n' },
                                    { text: 'BS. ĐẶNG PHONG THÁI', fontSize: 9, bold: true }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        styles: {},
        defaultStyle: {
            font: 'Roboto',
            fontSize: 9,
            color: '#1e293b'
        }
    };

    try {
        const safeUnitSlug = unitCode.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `HopDong_ChungNhan_BanQuyen_${safeUnitSlug}_${curYear}.pdf`;
        pdfMake.createPdf(docDefinition).download(fileName);
        if (typeof showToast === 'function') {
            showToast(`📄 Đang tải file PDF: ${fileName}`, 'success');
        }
    } catch (e) {
        console.error('Lỗi tạo PDF hợp đồng:', e);
        alert('Lỗi tạo PDF: ' + (e?.message || e));
    }
};

window.openRenewModal = function (planCode) {
    if (typeof window.closePricingModal === 'function') window.closePricingModal();
    const m = document.getElementById('modal-renew-info');
    if (!m) return;

    // Reset lại trạng thái các màn hình trong modal
    const payingView = document.getElementById('renew-paying-view');
    const succView = document.getElementById('renew-success-view');
    if (payingView) payingView.style.display = 'block';
    if (succView) succView.style.display = 'none';

    const currentUnit = (localStorage.getItem('pm_unit_code') || 'bvtks-cs2').toLowerCase();
    const selectedPlan = planCode || 'PLAN_1Y';
    window._currentSelectedPlan = selectedPlan;

    const planData = {
        'PLAN_1M': { name: 'Gói 1 Tháng', amount: 400000, price: '400.000 đ', equiv: '400.000 đ / tháng', code: '1T' },
        'PLAN_3M': { name: 'Gói 3 Tháng', amount: 1125000, price: '1.125.000 đ', equiv: '~375.000 đ / tháng (Tiết kiệm 6%)', code: '3T' },
        'PLAN_6M': { name: 'Gói 6 Tháng', amount: 2100000, price: '2.100.000 đ', equiv: '~350.000 đ / tháng (Tiết kiệm 12.5%)', code: '6T' },
        'PLAN_1Y': { name: 'Gói 1 Năm', amount: 3900000, price: '3.900.000 đ', equiv: '~325.000 đ / tháng (Tiết kiệm 18.75%)', code: '1N' }
    };

    const target = planData[selectedPlan] || planData['PLAN_1Y'];

    const nameEl = document.getElementById('renew-plan-name');
    const priceEl = document.getElementById('renew-plan-price');
    const amountEl = document.getElementById('renew-amount-number');
    const equivEl = document.getElementById('renew-plan-equiv');
    const unitEl = document.getElementById('renew-unit-display');
    const memoEl = document.getElementById('renew-transfer-memo');
    const qrImg = document.getElementById('renew-qr-img');

    if (nameEl) nameEl.innerText = target.name;
    if (priceEl) priceEl.innerText = target.price;
    if (amountEl) amountEl.innerText = target.price;
    if (equivEl) equivEl.innerText = target.equiv;
    if (unitEl) unitEl.innerText = 'Đơn vị: ' + currentUnit;

    window._currentOrderAmount = target.amount;
    const defaultMemo = `PMCG ${currentUnit.toUpperCase()} ${target.code}`;
    if (memoEl) memoEl.innerText = defaultMemo;

    // Ảnh QR ban đầu
    const defaultQrUrl = `https://img.vietqr.io/image/MB-0392283473-compact2.png?amount=${target.amount}&addInfo=${encodeURIComponent(defaultMemo)}&accountName=DANG%20PHONG%20THAI`;
    if (qrImg) qrImg.src = defaultQrUrl;

    m.style.display = 'flex';

    // Tạo đơn hàng trên backend Worker
    if (typeof callApi === 'function') {
        callApi('createPaymentOrder', [{ unit_code: currentUnit, plan_tier: selectedPlan }], res => {
            const data = (res && res.order_code) ? res : (res?.data || {});
            if (data && data.order_code) {
                window._currentOrderCode = data.order_code;
                if (qrImg && data.qr_url) qrImg.src = data.qr_url;
                if (memoEl && data.content) memoEl.innerText = data.content;
                const bankAccEl = document.getElementById('renew-bank-acc');
                if (bankAccEl && data.bank_account) bankAccEl.innerText = data.bank_account;

                // Bắt đầu lắng nghe tự động chuyển trạng thái gói
                window._startPaymentPolling(data.order_code, currentUnit, selectedPlan);
            }
        }, err => {
            console.warn('[Payment] createPaymentOrder failed, using default info:', err);
            window._startPaymentPolling('', currentUnit, selectedPlan);
        });
    }
};

window._startPaymentPolling = function (orderCode, unitCode, planTier) {
    if (window._paymentPollInterval) {
        clearInterval(window._paymentPollInterval);
        window._paymentPollInterval = null;
    }

    let pollCount = 0;
    const maxPolls = 600; // Thăm dò tối đa 30 phút (mỗi 3 giây)

    window._paymentPollInterval = setInterval(() => {
        pollCount++;
        if (pollCount > maxPolls) {
            clearInterval(window._paymentPollInterval);
            window._paymentPollInterval = null;
            return;
        }

        if (typeof callApi === 'function') {
            callApi('checkPaymentStatus', [{ order_code: orderCode || '', unit_code: unitCode }], res => {
                const data = (res && res.payment_status) ? res : (res?.data || {});
                if (data && data.payment_status === 'SUCCESS') {
                    // Chủ tài khoản đã nhận được tiền! Tự động nâng cấp gói cước
                    clearInterval(window._paymentPollInterval);
                    window._paymentPollInterval = null;
                    window._handlePaymentSuccess(data, planTier);
                }
            }, () => {});
        }
    }, 3000);
};

window._handlePaymentSuccess = function (data, fallbackPlan) {
    const planTier = data.plan_tier || fallbackPlan || 'PLAN_1Y';
    const planName = data.plan_name || 'Bản Quyền Đã Nâng Cấp';
    const expiresAt = data.expires_at || '';
    const daysLeft = data.days_left !== undefined ? data.days_left : 365;

    // 1. Cập nhật localStorage
    localStorage.setItem('pm_plan_tier', planTier);
    localStorage.setItem('pm_plan_name', planName);
    localStorage.setItem('pm_expires_at', expiresAt);
    localStorage.setItem('pm_days_left', daysLeft);

    // 2. Cập nhật meds_session
    const sess = (typeof getSession === 'function' ? getSession() : (typeof window.getSession === 'function' ? window.getSession() : {}));
    sess.plan_tier = planTier;
    sess.plan_name = planName;
    sess.expires_at = expiresAt;
    sess.days_left = daysLeft;
    try { localStorage.setItem('meds_session', JSON.stringify(sess)); } catch (e) {}

    // 3. Cập nhật Badge trên Header
    safeCall('updateSubscriptionHeaderBadge', planTier, expiresAt, planName, daysLeft);

    // 4. Chuyển sang màn hình chúc mừng thành công
    const payingView = document.getElementById('renew-paying-view');
    const succView = document.getElementById('renew-success-view');
    if (payingView) payingView.style.display = 'none';
    if (succView) {
        succView.style.display = 'block';
        const succPlan = document.getElementById('renew-succ-plan');
        const succExp = document.getElementById('renew-succ-exp');
        const succDays = document.getElementById('renew-succ-days');
        if (succPlan) succPlan.innerText = planName;
        if (succExp) succExp.innerText = expiresAt;
        if (succDays) succDays.innerText = `${daysLeft} ngày`;
    }

    // 5. Bắn thông báo Toast
    if (typeof showToast === 'function') {
        showToast(`🎉 Chúc mừng! Đơn vị của bạn đã được nâng cấp lên ${planName}!`, 'success');
    }
};

window.closeRenewModal = function () {
    if (window._paymentPollInterval) {
        clearInterval(window._paymentPollInterval);
        window._paymentPollInterval = null;
    }
    const m = document.getElementById('modal-renew-info');
    if (m) m.style.display = 'none';
};

// ============================================================
// 💳 QUẢN LÝ GIAO DỊCH THANH TOÁN VIETQR (SUPER ADMIN)
// ============================================================
window.loadPaymentTransactionsList = function () {
    const tbody = document.getElementById('payment-transactions-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#64748b;">⏳ Đang tải lịch sử giao dịch thanh toán...</td></tr>';

    if (typeof callApi === 'function') {
        callApi('getPaymentTransactions', [{ limit: 50 }], res => {
            const list = Array.isArray(res) ? res : (res?.data || []);
            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">Chưa có giao dịch thanh toán nào được tạo.</td></tr>';
                return;
            }

            tbody.innerHTML = list.map(t => {
                const isSuccess = t.status === 'SUCCESS';
                const statusBadge = isSuccess
                    ? '<span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:6px; font-weight:700; font-size:11px;">✅ Thành Công</span>'
                    : '<span style="background:#fef3c7; color:#b45309; padding:3px 8px; border-radius:6px; font-weight:700; font-size:11px;">⏳ Chờ Thanh Toán</span>';

                const formattedAmount = (parseInt(t.amount || 0, 10)).toLocaleString('vi-VN') + ' đ';
                const timeDisplay = t.created_at || '-';

                const actionBtn = isSuccess
                    ? '<span style="color:#15803d; font-size:12px; font-weight:600;">Đã kích hoạt</span>'
                    : `<button class="btn btn-sm btn-success" onclick="window.manualApprovePaymentPrompt('${t.order_code}', '${t.unit_code}', '${t.plan_tier}')" style="padding:3px 8px; font-size:11px; font-weight:700;" title="Duyệt nhanh và nâng cấp gói cho đơn vị ngay lập tức">⚡ Duyệt 1-Click</button>`;

                return `
                    <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                        <td style="padding:10px 12px; font-family:monospace; font-weight:700; color:#1e40af;">${t.order_code}</td>
                        <td style="padding:10px 12px; font-weight:700; color:#0f172a;">${t.unit_code}</td>
                        <td style="padding:10px 12px;"><span style="background:#e0e7ff; color:#3730a3; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">${t.plan_tier}</span></td>
                        <td style="padding:10px 12px; font-weight:800; color:#e11d48;">${formattedAmount}</td>
                        <td style="padding:10px 12px; font-family:monospace; font-size:12px; color:#475569;">${t.content || '-'}</td>
                        <td style="padding:10px 12px; font-size:12px; color:#64748b;">${timeDisplay}</td>
                        <td style="padding:10px 12px; text-align:center;">${statusBadge}</td>
                        <td style="padding:10px 12px; text-align:center;">${actionBtn}</td>
                    </tr>
                `;
            }).join('');
        }, err => {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">❌ Lỗi tải lịch sử giao dịch: ' + (err?.message || err) + '</td></tr>';
        });
    }
};

window.manualApprovePaymentPrompt = function (orderCode, unitCode, planTier) {
    if (!confirm(`Xác nhận duyệt thanh toán cho mã đơn: ${orderCode}?\n\nĐơn vị: ${unitCode}\nGói cước: ${planTier}\n\nHệ thống sẽ gia hạn tài khoản đơn vị ngay lập tức!`)) {
        return;
    }

    if (typeof callApi === 'function') {
        callApi('manualApprovePayment', [{ order_code: orderCode, unit_code: unitCode, plan_tier: planTier }], res => {
            if (typeof showToast === 'function') {
                showToast(`Đã duyệt thành công giao dịch ${orderCode}!`, 'success');
            } else {
                alert(`Đã duyệt thành công giao dịch ${orderCode}!`);
            }
            window.loadPaymentTransactionsList();
            if (typeof window.loadTenantsList === 'function') {
                window.loadTenantsList();
            }
        }, err => {
            alert('Lỗi duyệt thanh toán: ' + (err?.message || err));
        });
    }
};

window.onTenantPlanSelectChange = function (planCode) {
    const expInput = document.getElementById('tenant-form-expires');
    const staffInput = document.getElementById('tenant-form-max-staff');
    const patInput = document.getElementById('tenant-form-max-patients');

    if (staffInput) staffInput.value = '999';
    if (patInput) patInput.value = '9999';

    if (!expInput) return;
    const now = new Date();
    let daysToAdd = 365;

    switch (planCode) {
        case 'TRIAL_15D':
            daysToAdd = 15;
            break;
        case 'PLAN_1M':
            daysToAdd = 30;
            break;
        case 'PLAN_3M':
            daysToAdd = 90;
            break;
        case 'PLAN_6M':
            daysToAdd = 180;
            break;
        case 'PLAN_1Y':
            daysToAdd = 365;
            break;
        case 'ENTERPRISE':
            expInput.value = '2099-12-31';
            return;
        default:
            daysToAdd = 365;
    }

    const targetDate = new Date(now.getTime() + daysToAdd * 86400000);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    expInput.value = `${yyyy}-${mm}-${dd}`;
};

window.updateSubscriptionHeaderBadge = function (planTier, expiresAt, planName, daysLeft) {
    const badge = document.getElementById('header-subscription-badge');
    if (!badge) return;

    const sess = (typeof getSession === 'function' ? getSession() : (typeof window.getSession === 'function' ? window.getSession() : {}));

    const role = (sess.role || '').toUpperCase();
    const isSuper = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';

    const pTier = planTier || localStorage.getItem('pm_plan_tier') || sess.plan_tier || 'PLAN_1Y';
    const pName = planName || localStorage.getItem('pm_plan_name') || 'Bản Quyền';
    const pDays = daysLeft !== undefined ? parseInt(daysLeft, 10) : parseInt(localStorage.getItem('pm_days_left') || '999', 10);

    const iconEl = document.getElementById('header-sub-icon');
    const textEl = document.getElementById('header-sub-text');

    badge.style.display = 'inline-flex';

    if (isSuper) {
        badge.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        badge.title = 'Tài khoản Quản trị Tối cao (Super Admin) - Toàn quyền quản trị hệ thống';
        if (iconEl) iconEl.innerText = '👑';
        if (textEl) textEl.innerText = 'Hệ Thống T.I.M.E.S';
        return;
    }

    const currentUnit = (sess.unit_code || localStorage.getItem('pm_unit_code') || '').toLowerCase();
    // Đơn vị bvtks-cs2 hoặc gói ENTERPRISE: Luôn là Bản quyền Vĩnh viễn
    if (currentUnit === 'bvtks-cs2' || currentUnit === 'bvtks_cs2' || pTier === 'ENTERPRISE' || pName.toLowerCase().includes('vĩnh viễn')) {
        badge.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        badge.title = 'Bệnh viện Than - Khoáng sản Cơ sở 2 - Bản quyền Vĩnh viễn trọn đời';
        if (iconEl) iconEl.innerText = '💎';
        if (textEl) textEl.innerText = 'Bản Quyền Vĩnh Viễn';
        return;
    }

    if (pTier === 'TRIAL_15D') {
        if (pDays <= 0) {
            badge.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            badge.title = 'Gói dùng thử đã hết hạn. Bấm để gia hạn gói cước!';
            if (iconEl) iconEl.innerText = '⚠️';
            if (textEl) textEl.innerText = 'Dùng thử: Hết hạn';
        } else {
            badge.style.background = 'linear-gradient(135deg, #f59e0b, #ea580c)';
            badge.title = `Gói dùng thử 15 ngày miễn phí - Còn lại ${pDays} ngày. Bấm để nâng cấp!`;
            if (iconEl) iconEl.innerText = '🎁';
            if (textEl) textEl.innerText = `Dùng thử: Còn ${pDays} ngày`;
        }
    } else {
        if (pDays <= 7 && pDays > 0) {
            badge.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
            badge.title = `${pName} - Sắp hết hạn (còn ${pDays} ngày). Bấm để gia hạn!`;
            if (iconEl) iconEl.innerText = '⏳';
            if (textEl) textEl.innerText = `${pName} (Còn ${pDays} ngày)`;
        } else if (pDays <= 0) {
            badge.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            badge.title = `${pName} đã hết hạn sử dụng. Bấm để gia hạn!`;
            if (iconEl) iconEl.innerText = '🔒';
            if (textEl) textEl.innerText = `${pName} (Hết hạn)`;
        } else {
            badge.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
            badge.title = `${pName} - Hạn dùng đến ${expiresAt || 'vô thời hạn'}. Bấm để xem thông tin!`;
            if (iconEl) iconEl.innerText = '💎';
            if (textEl) textEl.innerText = `${pName} (Còn ${pDays} ngày)`;
        }
    }
};

