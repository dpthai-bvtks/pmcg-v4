/* ==========================================
   T.I.M.E.S SYSTEM - REALTIME SYNC & UI HELPERS
   ========================================== */

(function () {
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.container');
    const hamburger = document.getElementById('mobile-hamburger-btn');

    if (sidebar && container) {
        sidebar.addEventListener('mouseleave', () => {
            if (window.matchMedia("(pointer: fine)").matches) {
                container.classList.add('collapsed-sidebar');
            }
        });
    }

    if (hamburger && container) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('collapsed-sidebar');
        });
    }

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1000) {
            if (sidebar && hamburger && container && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                container.classList.add('collapsed-sidebar');
            }
        }
    });

    const navLinks = document.querySelectorAll('.nav-tab, .nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1000 && container) {
                container.classList.add('collapsed-sidebar');
            }
        });
    });
})();

// Tooltip helper for sidebar icon buttons
(function () {
    let tooltip = null;
    let hideTimer = null;

    function getOrCreateTooltip() {
        if (!tooltip) {
            tooltip = document.getElementById('sidebar-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'sidebar-tooltip';
                document.body.appendChild(tooltip);
            }
        }
        return tooltip;
    }

    function showTooltip(btn) {
        if (!btn) return;
        const textEl = btn.querySelector('.text');
        if (!textEl) return;
        const label = textEl.textContent.trim();
        if (!label) return;

        const tip = getOrCreateTooltip();
        if (!tip) return;

        clearTimeout(hideTimer);
        const rect = btn.getBoundingClientRect();
        const top = rect.top + rect.height / 2;

        tip.textContent = label;
        tip.style.top = top + 'px';
        tip.style.transform = 'translateY(-50%)';
        tip.style.opacity = '1';
    }

    function hideTooltip() {
        hideTimer = setTimeout(() => {
            const tip = getOrCreateTooltip();
            if (tip) tip.style.opacity = '0';
        }, 80);
    }

    // Attach to all sidebar nav-tab buttons (current + future)
    function attachTooltips() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        getOrCreateTooltip();
        sidebar.querySelectorAll('button.nav-tab').forEach(btn => {
            if (btn.dataset.tooltipAttached) return;
            btn.dataset.tooltipAttached = '1';
            btn.addEventListener('mouseenter', () => showTooltip(btn));
            btn.addEventListener('mouseleave', hideTooltip);
        });

        const menu = sidebar.querySelector('.sidebar-menu');
        if (menu && !menu.dataset.scrollAttached) {
            menu.dataset.scrollAttached = '1';
            menu.addEventListener('scroll', () => {
                const tip = getOrCreateTooltip();
                if (tip) tip.style.opacity = '0';
            }, { passive: true });
        }
    }

    // Run after DOM ready and also on any dynamic changes
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachTooltips);
    } else {
        attachTooltips();
    }
    
    // Re-attach for any dynamically added buttons (e.g. after login)
    if (document.body) {
        const observer = new MutationObserver(attachTooltips);
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.body) {
                const observer = new MutationObserver(attachTooltips);
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });
    }
})();

(function initRealtimeSync() {
    const POLL_INTERVAL = 8000; // 8 giây: cực kỳ nhạy bén, kiểm tra ngầm siêu nhẹ
    let lastKnownVersion = null;
    let syncTimer = null;
    let isSyncing = false;
    
    window.stopAutoSync = function() {
        if (syncTimer) {
            clearInterval(syncTimer);
            syncTimer = null;
        }
    };

    window.setLastKnownDataVersion = function(v) {
        if (v) lastKnownVersion = String(v);
    };

    // Toast thông báo đồng bộ
    function showSyncToast(msg) {
        let toast = document.getElementById('__sync-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = '__sync-toast';
            toast.style.cssText = [
                'position:fixed', 'bottom:22px', 'right:22px', 'z-index:99999',
                'background:rgba(39,174,96,0.93)', 'color:#fff',
                'padding:9px 18px', 'border-radius:8px',
                'font-size:13px', 'font-family:inherit',
                'box-shadow:0 4px 18px rgba(0,0,0,0.18)',
                'transition:opacity 0.4s', 'opacity:0',
                'pointer-events:none'
            ].join(';');
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }

    // Reload dữ liệu bị thay đổi có bảo vệ toàn bộ form đang nhập dở
    function syncRefreshData() {
        try {
            // 🛡️ Kiểm tra người dùng có đang thực sự gõ phím trên form không
            const patFormActive = typeof window.isPatientFormActive === 'function' ? window.isPatientFormActive() : false;
            const isSaveLocked = !!window._savePatientLock;
            
            // Nếu người dùng đang bấm Lưu hoặc đang gõ dở dữ liệu thì tạm hoãn để bảo toàn
            if (isSaveLocked || patFormActive) {
                console.log('[RealtimeSync]: Người dùng đang thao tác trên form nhập liệu, tạm hoãn nạp lại để bảo toàn dữ liệu.');
                return false; // Trả về false để doPoll KHÔNG nuốt version và sẽ thử lại ở chu kỳ tiếp theo!
            }

            // Bảo lưu giá trị các ô input form bệnh nhân phòng trường hợp đang có dữ liệu tạm
            const savedFormData = {};
            ['pat-name', 'pat-year', 'pat-time', 'busy-start', 'busy-end', 'pat-leave', 'pat-room'].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.value) savedFormData[id] = el.value;
            });

            // Xóa cache time cho các danh mục cần làm mới
            if (window.dataCacheTime) {
                ['machine', 'room', 'staff', 'proc', 'pat', 'sched'].forEach(k => { window.dataCacheTime[k] = 0; });
            }

            // ⚡ Ưu tiên nạp trọn bộ cả danh mục và lịch trình mới nhất từ máy chủ
            if (typeof loadBootstrapData === 'function') {
                loadBootstrapData(true);
            } else {
                if (typeof loadMachines === 'function') loadMachines();
                if (typeof loadRooms === 'function') loadRooms();
                if (typeof loadEntity === 'function') {
                    loadEntity('getThuThuat', 'proc', () => {
                        if (typeof renderProceduresTable === 'function') renderProceduresTable();
                        if (typeof renderProcedureCheckboxes === 'function') renderProcedureCheckboxes();
                    }, [], true);
                    loadEntity('getNhanSu', 'staff', () => {
                        if (typeof renderStaffTable === 'function') renderStaffTable();
                    }, [], true);
                    loadEntity('getBenhNhan', 'pat', () => {
                        if (typeof renderPatientsTable === 'function') renderPatientsTable();
                    }, [], true);
                }
                if (typeof loadScheduleList === 'function') loadScheduleList();
                else if (typeof filterSchedule === 'function') filterSchedule();
            }

            // Khôi phục lại giá trị form nếu người dùng trước đó đã nhập mà chưa lưu
            setTimeout(() => {
                for (let id in savedFormData) {
                    const el = document.getElementById(id);
                    if (el && savedFormData[id] && !el.value) {
                        el.value = savedFormData[id];
                    }
                }
            }, 300);

            return true;
        } catch(e) {
            console.warn('[RealtimeSync error]:', e);
            return false;
        }
    }

    // ⚡ Lắng nghe BroadcastChannel từ OfflineSyncEngine để đồng bộ tức thì giữa các tab (0ms)
    if (typeof OfflineSyncEngine !== 'undefined' && OfflineSyncEngine.registerLiveListener) {
        OfflineSyncEngine.registerLiveListener(function(type, payload, timestamp) {
            if (type === 'PATIENTS_UPDATED' || type === 'CACHE_UPDATED' || type === 'SCHEDULE_GENERATED') {
                const patFormActive = typeof window.isPatientFormActive === 'function' ? window.isPatientFormActive() : false;
                if (!patFormActive) {
                    syncRefreshData();
                    showSyncToast('⚡ Đã đồng bộ tức thì từ cửa sổ làm việc khác!');
                }
            } else if (type === 'NETWORK_ONLINE') {
                showSyncToast('🟢 Đã kết nối mạng trở lại!');
            } else if (type === 'NETWORK_OFFLINE') {
                showSyncToast('🟡 Thiết bị đang ngoại tuyến. Dữ liệu được lưu trong Dexie.');
            }
        });
    }

    function doPoll() {
        if (isSyncing) return;
        if (typeof callApi !== 'function') return;
        isSyncing = true;
        callApi('getDataVersion', [], function(data) {
            isSyncing = false;
            if (!data) return;
            const v = String(data.version || '0');
            if (lastKnownVersion === null) {
                lastKnownVersion = v; // lần đầu: ghi nhớ version hiện tại
                return;
            }
            if (v !== lastKnownVersion) {
                // 🛡️ Khử báo động giả: nếu chính tab này vừa thực hiện lưu trong vòng 10s qua
                if (window._lastLocalMutationTime && (Date.now() - window._lastLocalMutationTime < 10000)) {
                    lastKnownVersion = v;
                    window._lastLocalMutationTime = 0;
                    return;
                }

                const refreshOk = syncRefreshData();
                if (refreshOk !== false) {
                    lastKnownVersion = v;
                    showSyncToast('🔄 Đã đồng bộ dữ liệu mới');
                } else {
                    console.log('[RealtimeSync]: Tạm hoãn cập nhật version, sẽ tự động thử lại sau ' + (POLL_INTERVAL/1000) + 's.');
                }
            }
        }, function() { isSyncing = false; });
    }
    window.triggerDataSync = doPoll;

    function startAutoPolling() {
        if (syncTimer) return;
        doPoll();
        syncTimer = setInterval(doPoll, POLL_INTERVAL);
    }

    // Bắt đầu an toàn tuyệt đối bất kể trạng thái nạp của DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(startAutoPolling, 2000);
        });
    } else {
        setTimeout(startAutoPolling, 1000);
    }

    // Dừng polling khi tab bị ẩn (tiết kiệm quota), bật lại khi tab hiện
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (syncTimer) {
                clearInterval(syncTimer);
                syncTimer = null;
            }
        } else {
            startAutoPolling();
        }
    });
})();

function requireAdminPassword(callback) {
    if (callback) callback();
    return true;
}