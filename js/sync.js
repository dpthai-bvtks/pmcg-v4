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

    function initSidebarTooltips() {
        attachTooltips();
        const sidebarMenu = document.getElementById('nav-tabs') || document.querySelector('.sidebar-menu') || document.querySelector('.sidebar');
        if (sidebarMenu) {
            let tooltipDebounce = null;
            const observer = new MutationObserver(() => {
                if (tooltipDebounce) clearTimeout(tooltipDebounce);
                tooltipDebounce = setTimeout(attachTooltips, 150);
            });
            observer.observe(sidebarMenu, { childList: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebarTooltips);
    } else {
        initSidebarTooltips();
    }
    window.attachSidebarTooltips = attachTooltips;
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
            // 🛡️ Kiểm tra người dùng có đang thực sự thao tác trên bất kỳ form nào không (Phòng, Bệnh nhân, Nhân sự, v.v.)
            const isFormActive = (typeof window.isAnyFormActive === 'function')
                ? window.isAnyFormActive()
                : ((typeof window.isPatientFormActive === 'function') ? window.isPatientFormActive() : false);
            const isSaveLocked = !!window._savePatientLock || !!window._saveLock || !!window._isSavingEntity;
            
            // Nếu người dùng đang bấm Lưu hoặc đang gõ dở dữ liệu/tick chọn thì tạm hoãn để bảo toàn
            if (isSaveLocked || isFormActive) {
                console.log('[RealtimeSync]: Người dùng đang thao tác trên form nhập liệu / chọn checkbox, tạm hoãn nạp lại để bảo toàn dữ liệu.');
                return false; // Trả về false để doPoll KHÔNG nuốt version và sẽ thử lại ở chu kỳ tiếp theo!
            }

            // Bảo lưu giá trị các ô input form phòng trường hợp đang có dữ liệu tạm
            const savedFormData = {};
            [
                'pat-name', 'pat-year', 'pat-code', 'pat-time', 'busy-start', 'busy-end', 'pat-leave', 'pat-room',
                'room-name', 'room-beds',
                'staff-name', 'staff-phone',
                'proc-name',
                'machine-name', 'machine-code'
            ].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.value) savedFormData[id] = el.value;
            });

            // Bảo lưu các checkbox phòng & máy móc
            const savedRoomDocs = Array.from(document.querySelectorAll('.room-doc-cb:checked')).map(cb => cb.value);
            const savedRoomKtvs = Array.from(document.querySelectorAll('.room-ktv-cb:checked, .room-stf-cb:checked')).map(cb => cb.value);
            const savedRoomDds = Array.from(document.querySelectorAll('.room-dd-cb:checked')).map(cb => cb.value);
            const savedRoomMachines = {};
            document.querySelectorAll('.room-machine-input').forEach(inp => {
                const dt = inp.getAttribute('data-type');
                if (dt && inp.value) savedRoomMachines[dt] = inp.value;
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

            // 🔄 Tự động đồng bộ Realtime Bảng Chấm Công & Thống Kê
            const isChamCongActive = !!document.getElementById('tab-chamcong')?.classList.contains('active');
            const isThongKeActive = !!document.getElementById('tab-thongke')?.classList.contains('active');

            if (isChamCongActive && typeof loadChamCongData === 'function') {
                const activeEl = document.activeElement;
                const isEditingCell = activeEl && (activeEl.classList?.contains('cc-input-text') || activeEl.classList?.contains('heso-input'));
                const isRecentlyEdited = (typeof window.chamCongLastEditedTime === 'number') && (Date.now() - window.chamCongLastEditedTime < 15000);
                const isDirty = !!window.chamCongIsDirty;
                if (!isEditingCell && !isRecentlyEdited && !isDirty) {
                    if (typeof getOrLoadChamCongEmployees === 'function') {
                        getOrLoadChamCongEmployees(() => {
                            loadChamCongData(true);
                        }, true);
                    } else {
                        loadChamCongData(true);
                    }
                }
            } else if (typeof getOrLoadChamCongEmployees === 'function') {
                getOrLoadChamCongEmployees(null, true);
            }

            if (isThongKeActive && typeof loadThongKeData === 'function') {
                loadThongKeData(true);
            }

            // Khôi phục lại giá trị form nếu người dùng trước đó đã nhập mà chưa lưu
            setTimeout(() => {
                for (let id in savedFormData) {
                    const el = document.getElementById(id);
                    if (el && savedFormData[id] && !el.value) {
                        el.value = savedFormData[id];
                    }
                }
                // Khôi phục checkbox phòng
                if (savedRoomDocs.length > 0) {
                    savedRoomDocs.forEach(val => {
                        const cb = document.querySelector(`.room-doc-cb[value="${val}"]`);
                        if (cb) cb.checked = true;
                    });
                }
                if (savedRoomKtvs.length > 0) {
                    savedRoomKtvs.forEach(val => {
                        const cb = document.querySelector(`.room-ktv-cb[value="${val}"], .room-stf-cb[value="${val}"]`);
                        if (cb) cb.checked = true;
                    });
                }
                if (savedRoomDds.length > 0) {
                    savedRoomDds.forEach(val => {
                        const cb = document.querySelector(`.room-dd-cb[value="${val}"]`);
                        if (cb) cb.checked = true;
                    });
                }
                for (let dt in savedRoomMachines) {
                    const inp = document.querySelector(`.room-machine-input[data-type="${dt}"]`);
                    if (inp && !inp.value) inp.value = savedRoomMachines[dt];
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
            if (type === 'PATIENTS_UPDATED' || type === 'CACHE_UPDATED' || type === 'SCHEDULE_GENERATED' || type === 'CHAMCONG_UPDATED') {
                const isFormActive = (typeof window.isAnyFormActive === 'function')
                    ? window.isAnyFormActive()
                    : ((typeof window.isPatientFormActive === 'function') ? window.isPatientFormActive() : false);
                if (!isFormActive && !window._savePatientLock && !window._saveLock) {
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

        // 🛡️ BẢO VỆ: Nếu chưa đăng nhập hoặc đang ở màn hình đăng nhập, không chạy polling để tránh trigger failover nhầm
        const token = (typeof getAuthToken === 'function') ? getAuthToken() : (localStorage.getItem('pm_jwt_token') || '');
        const sess = (typeof getSession === 'function') ? getSession() : {};
        const overlay = document.getElementById('login-overlay');
        const isLoginOverlayOpen = overlay && overlay.style.display !== 'none';
        if (!token || !sess.username || isLoginOverlayOpen) {
            return;
        }

        // 🛡️ TỰ ĐỘNG PHỤC HỒI: Nếu đang ở chế độ dự phòng, kiểm tra xem máy chủ chính đã kết nối lại được chưa
        if (window._serverMode === 'backup' && typeof window.getPrimaryApiUrl === 'function') {
            const primaryUrl = window.getPrimaryApiUrl();
            const unitCode = localStorage.getItem('pm_unit_code') || 'bvtks-cs2';
            fetch(primaryUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-unit-code': unitCode },
                body: JSON.stringify({ action: 'ping', args: [], unit_code: unitCode })
            }).then(r => r.json()).then(res => {
                if (res && res.status === 'success') {
                    console.log('[RealtimeSync]: Máy chủ chính đã trực tuyến trở lại. Tự động phục hồi chế độ Primary!');
                    window._serverMode = 'primary';
                    if (typeof window.updateServerStatusBadge === 'function') {
                        window.updateServerStatusBadge('primary');
                    }
                    if (typeof window.showToast === 'function') {
                        window.showToast('✅ Đã kết nối lại máy chủ chính Cloudflare & Turso!', 'success', 3000);
                    }
                }
            }).catch(() => {});
        }

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
                    console.log('[RealtimeSync]: Tạm hoãn cập nhật version, sẽ tự động thử lại sau.');
                }
            }
        }, function() { isSyncing = false; });
    }
    window.triggerDataSync = doPoll;

    // ⚡ TIẾT KIỆM QUOTA TURSO & BĂNG THÔNG: Tự động phát hiện trạng thái nghỉ (Idle Detection)
    let lastUserActivityTime = Date.now();
    const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // Sau 3 phút không chạm chuột/bàn phím -> Idle
    const IDLE_POLL_INTERVAL = 30000;      // 30 giây khi Idle (giảm 75% số lần request)
    let isUserCurrentlyIdle = false;

    function recordUserActivity() {
        const wasIdle = isUserCurrentlyIdle;
        lastUserActivityTime = Date.now();
        isUserCurrentlyIdle = false;
        if (wasIdle) {
            // Người dùng vừa chạm chuột/gõ phím trở lại -> kiểm tra đồng bộ ngay và quay về nhịp bình thường
            console.log('[RealtimeSync]: Người dùng hoạt động trở lại. Đồng bộ ngay và khôi phục nhịp polling nhanh!');
            scheduleNextPoll(true);
        }
    }

    let activityThrottle = null;
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evtName => {
        window.addEventListener(evtName, () => {
            if (!activityThrottle) {
                activityThrottle = setTimeout(() => {
                    activityThrottle = null;
                    recordUserActivity();
                }, 1000);
            }
        }, { passive: true });
    });

    function scheduleNextPoll(immediate = false) {
        if (syncTimer) clearTimeout(syncTimer);
        if (immediate) {
            doPoll();
        }
        const timeSinceActivity = Date.now() - lastUserActivityTime;
        isUserCurrentlyIdle = timeSinceActivity > IDLE_TIMEOUT_MS;

        const isChamCongActive = !!document.getElementById('tab-chamcong')?.classList.contains('active');
        let interval;
        if (isUserCurrentlyIdle) {
            interval = IDLE_POLL_INTERVAL;
        } else {
            interval = isChamCongActive ? 4000 : 8000;
        }

        syncTimer = setTimeout(() => {
            doPoll();
            scheduleNextPoll();
        }, interval);
    }

    function startAutoPolling() {
        recordUserActivity();
        doPoll();
        scheduleNextPoll();
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
                clearTimeout(syncTimer);
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