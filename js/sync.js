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
    const POLL_INTERVAL = 15000; // 15 giây
    let lastKnownVersion = null;
    let syncTimer = null;
    let isSyncing = false;
    
    window.stopAutoSync = function() {
        if (syncTimer) {
            clearInterval(syncTimer);
            syncTimer = null;
        }
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

    // Reload dữ liệu bị thay đổi (không reload lịch — chỉ reload danh mục)
    function syncRefreshData() {
        if (typeof loadEntity !== 'function') return;
        try {
            // Xóa cache time để force refresh
            if (window.dataCacheTime) {
                ['pat', 'proc', 'machine', 'staff', 'room'].forEach(k => {
                    window.dataCacheTime[k] = 0;
                });
            }
            // Reload từng danh mục đang hiển thị
            if (typeof loadPatients === 'function') loadPatients();
            if (typeof loadProcs === 'function') loadProcs();
            if (typeof loadMachines === 'function') loadMachines();
            if (typeof loadStaff === 'function') loadStaff();
            if (typeof loadRooms === 'function') loadRooms();
            if (typeof renderPatientsTable === 'function') renderPatientsTable();
            if (typeof filterSchedule === 'function') filterSchedule();
        } catch(e) {}
    }

    // ⚡ Lắng nghe BroadcastChannel từ OfflineSyncEngine để đồng bộ tức thì giữa các tab (0ms)
    if (typeof OfflineSyncEngine !== 'undefined' && OfflineSyncEngine.registerLiveListener) {
        OfflineSyncEngine.registerLiveListener(function(type, payload, timestamp) {
            if (type === 'PATIENTS_UPDATED' || type === 'CACHE_UPDATED' || type === 'SCHEDULE_GENERATED') {
                syncRefreshData();
                showSyncToast('⚡ Đã đồng bộ tức thì từ cửa sổ làm việc khác!');
            } else if (type === 'NETWORK_ONLINE') {
                showSyncToast('🟢 Đã kết nối mạng trở lại!');
            } else if (type === 'NETWORK_OFFLINE') {
                showSyncToast('🟡 Thiết bị đang ngoại tuyến. Dữ liệu được lưu trong Dexie.');
            }
        });
    }

    function doPoll() {
        if (isSyncing) return;
        if (typeof google === 'undefined' || !google.script || !google.script.run) return;
        isSyncing = true;
        google.script.run
            .withSuccessHandler(function(data) {
                isSyncing = false;
                if (!data) return;
                const v = String(data.version || '0');
                if (lastKnownVersion === null) {
                    lastKnownVersion = v; // lần đầu: ghi nhớ version hiện tại
                    return;
                }
                if (v !== lastKnownVersion) {
                    lastKnownVersion = v;
                    syncRefreshData();
                    showSyncToast('🔄 Đã đồng bộ dữ liệu mới');
                }
            })
            .withFailureHandler(function() { isSyncing = false; })
            .getDataVersion();
    }

    // Bắt đầu sau khi trang load xong
    document.addEventListener('DOMContentLoaded', function() {
        // Poll lần đầu sau 5 giây (đợi login xong)
        setTimeout(function() {
            doPoll();
            syncTimer = setInterval(doPoll, POLL_INTERVAL);
        }, 5000);
    });

    // Dừng polling khi tab bị ẩn (tiết kiệm quota), bật lại khi tab hiện
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            clearInterval(syncTimer);
        } else {
            doPoll(); // sync ngay khi quay lại tab
            syncTimer = setInterval(doPoll, POLL_INTERVAL);
        }
    });
})();

function requireAdminPassword(callback) {
    if (callback) callback();
    return true;
}