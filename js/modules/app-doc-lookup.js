/**
 * 📜 T.I.M.E.S System v4 - Document & HDSD Lookup Module
 */

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
    const targetUrl = `hdsd.html?role=${userRole}&theme=${curTheme}&v=4.0.3-rev6`;

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

    if (typeof callApi === 'function') {
        callApi('getDocuments', [], handleSuccess, handleFailure);
    } else if (window.google && window.google.script && window.google.script.run) {
        window.google.script.run
            .withSuccessHandler(handleSuccess)
            .withFailureHandler(handleFailure)
            .getDocuments();
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
    const cleanQuery = rawQuery.trim();
    const hasTone = hasVietnameseDiacritics(cleanQuery);
    const qTarget = hasTone ? cleanQuery.toLowerCase() : removeVietnameseTones(cleanQuery);
    const tokens = qTarget.split(/\s+/).filter(Boolean);
    const agency = document.getElementById('doc-filter-agency')?.value || '';

    const filtered = (window.cachedDocuments || []).filter(doc => {
        const docNum = (doc.doc_number || doc.soHieu || '').toLowerCase();
        const title = (doc.title || doc.tenVanBan || '').toLowerCase();
        const ag = (doc.agency || doc.coQuan || '').toLowerCase();

        const allText = `${docNum} ${title} ${ag}`;
        const targetText = hasTone ? allText : removeVietnameseTones(allText);

        const matchQuery = !tokens.length || tokens.every(tok => targetText.includes(tok));
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

    if (typeof callApi === 'function') {
        callApi('saveDocuments', [window.cachedDocuments], handleSuccess, handleFailure);
    } else if (window.google && window.google.script && window.google.script.run) {
        window.google.script.run
            .withSuccessHandler(handleSuccess)
            .withFailureHandler(handleFailure)
            .saveDocuments(window.cachedDocuments);
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
