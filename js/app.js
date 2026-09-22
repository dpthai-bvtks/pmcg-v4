
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
    // ÄÃ³ng dropdown
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

    // Láº¥y modal vÃ  hiá»ƒn thá»‹ trá»±c tiáº¿p báº±ng removeProperty Ä‘á»ƒ xÃ³a display:none cÅ©
    const modal = document.getElementById('modal-change-password');
    if (modal) {
        // GÃ¡n username
        const uInput = document.getElementById('cpw-username');
        if (uInput) uInput.value = currentUsername;
        const oldInput = document.getElementById('cpw-old-password');
        const newInput = document.getElementById('cpw-new-password');
        const confInput = document.getElementById('cpw-confirm-password');
        if (oldInput) oldInput.value = '';
        if (newInput) newInput.value = '';
        if (confInput) confInput.value = '';

        // Di chuyá»ƒn modal lÃªn body náº¿u chÆ°a lÃ  con trá»±c tiáº¿p cá»§a body
        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }
        // XÃ³a style cÅ© vÃ  gÃ¡n display má»›i
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
        showCustomAlert('PhÃ¡c Äá»“ Má»›i', 'TÃ­nh nÄƒng thÃªm phÃ¡c Ä‘á»“ nhanh qua cá»­a sá»• ná»•i Ä‘ang Ä‘á»“ng bá»™ vá»›i danh má»¥c phÃ¡c Ä‘á»“ tiÃªu chuáº©n.');
    } else if (typeof showThongBao === 'function') {
        showThongBao('ThÃ´ng bÃ¡o', 'Äang cáº­p nháº­t phÃ¡c Ä‘á»“.', 'info');
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
        if (appSub) appSub.innerText = 'Há»† THá»NG Xáº¾P Lá»ŠCH THá»¦ THUáº¬T YHCT- PHCN THÃ”NG MINH';
        if (appSlogan) appSlogan.innerText = 'NHANH Gá»ŒN, Tá»I Æ¯U, CHÃNH XÃC';
        if (mobSub) mobSub.innerText = 'YHCT - PHCN';
    } else if (uCode === 'bvtks-cs2') {
        if (appHosp) appHosp.innerText = 'Bá»†NH VIá»†N THAN - KHOÃNG Sáº¢N CS2';
        if (appSub) appSub.innerText = 'KHOA Y Há»ŒC Cá»” TRUYá»€N - PHá»¤C Há»’I CHá»¨C NÄ‚NG';
        if (appSlogan) appSlogan.innerText = 'Y Há»ŒC Tá»T, PHá»¤C Há»’I NHANH';
        if (mobSub) mobSub.innerText = 'Khoa YHCT - PHCN';
    } else {
        const uName = localStorage.getItem('pm_unit_name') || 'T.I.M.E.S SYSTEM';
        if (appHosp) appHosp.innerText = uName;
        if (appSub) appSub.innerText = 'Há»‡ thá»‘ng xáº¿p lá»‹ch thá»§ thuáº­t YHCT- PHCN thÃ´ng minh';
        if (appSlogan) appSlogan.innerText = 'Nhanh gá»n, tá»‘i Æ°u, chÃ­nh xÃ¡c';
        if (mobSub) mobSub.innerText = 'YHCT - PHCN';
    }
};

window.openServerStatusModal = function (e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    // ÄÃ³ng dropdown náº¿u Ä‘ang má»Ÿ
    const userMenu = document.getElementById('user-dropdown-menu');
    if (userMenu) userMenu.style.display = 'none';
    const arrow = document.getElementById('user-dropdown-arrow');
    if (arrow) arrow.style.transform = 'rotate(0deg)';

    // TÃ¬m modal tÄ©nh trong DOM (Ä‘Ã£ cÃ³ sáºµn á»Ÿ cuá»‘i body)
    const modal = document.getElementById('modal-server-status');
    if (!modal) { console.error('[ServerStatus] KhÃ´ng tÃ¬m tháº¥y modal-server-status trong DOM!'); return; }

    // Äáº£m báº£o modal lÃ  con trá»±c tiáº¿p cá»§a body Ä‘á»ƒ trÃ¡nh bá»‹ clip bá»Ÿi container cha
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    // Cáº­p nháº­t thÃ´ng tin Ä‘Æ¡n vá»‹
    const uName = localStorage.getItem('pm_unit_name') || 'Bá»‡nh viá»‡n Than - KhoÃ¡ng sáº£n CÆ¡ sá»Ÿ 2';
    const uCode = (localStorage.getItem('pm_unit_code') || 'bvtks-cs2').toLowerCase();
    const unitEl = document.getElementById('modal-server-unit-name');
    if (unitEl) unitEl.innerText = `${uName} (${uCode})`;

    // PhÃ¢n quyá»n: Chá»‰ Super Admin má»›i tháº¥y cÃ¡c nÃºt Sync Google Sheets, Xuáº¥t JSON, Cáº¥u hÃ¬nh GAS
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

    // Hiá»ƒn thá»‹ modal â€” dÃ¹ng cssText !important (pattern Ä‘Ã¡ng tin cáº­y nháº¥t)
    modal.style.cssText = 'display:flex !important; position:fixed !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; background:rgba(15,23,42,0.65) !important; backdrop-filter:blur(5px) !important; z-index:2147483647 !important; align-items:center !important; justify-content:center !important;';
};

window.closeServerStatusModal = function () {
    const modal = document.getElementById('modal-server-status');
    if (modal) modal.style.setProperty('display', 'none', 'important');
};

window.toggleEmergencyBackupMenu = function (e) {
    window.openServerStatusModal(e);
};

// Äáº£m báº£o gáº¯n sá»± kiá»‡n click cho badge
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

    // Hiá»ƒn thá»‹ tráº¡ng thÃ¡i Ä‘ang ping
    if (btn) { btn.disabled = true; btn.innerHTML = '<span>â³</span> Äang kiá»ƒm tra...'; }
    if (resultArea) { resultArea.style.display = 'none'; resultArea.innerHTML = ''; }

    const t0 = performance.now();
    callApi('ping', [], res => {
        const pingTime = Math.round(performance.now() - t0);
        const unitCode = res && res.unit_code ? res.unit_code : (localStorage.getItem('pm_unit_code') || 'bvtks-cs2');
        if (btn) { btn.disabled = false; btn.innerHTML = '<span>ðŸ”„</span> Kiá»ƒm Tra Tá»‘c Äá»™ Pháº£n Há»“i (Ping API)'; }
        if (resultArea) {
            resultArea.style.cssText = 'display:block; padding:10px 14px; border-radius:8px; font-size:12px; font-weight:600; line-height:1.8; background:#f0fdf4; border:1px solid #bbf7d0; color:#166534;';
            resultArea.innerHTML = `âš¡ <strong>Pháº£n há»“i: ${pingTime} ms</strong><br>ðŸŸ¢ Tráº¡ng thÃ¡i: Hoáº¡t Ä‘á»™ng hoÃ n háº£o<br>ðŸ—„ï¸ CSDL: Mini PC+Turso<br>ðŸ¥ MÃ£ Ä‘Æ¡n vá»‹: ${unitCode}`;
        }
    }, err => {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span>ðŸ”„</span> Kiá»ƒm Tra Tá»‘c Äá»™ Pháº£n Há»“i (Ping API)'; }
        if (resultArea) {
            resultArea.style.cssText = 'display:block; padding:10px 14px; border-radius:8px; font-size:12px; font-weight:600; line-height:1.8; background:#fef2f2; border:1px solid #fecaca; color:#991b1b;';
            resultArea.innerHTML = `âš ï¸ <strong>Lá»—i káº¿t ná»‘i</strong><br>${err && err.message ? err.message : 'KhÃ´ng thá»ƒ káº¿t ná»‘i tá»›i mÃ¡y chá»§'}`;
        }
    });
};


window.sanitizeGoogleScriptUrl = function (rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let url = rawUrl.trim();
    if (!url) return '';

    // Kháº¯c phá»¥c trÆ°á»ng há»£p dÃ­nh liá»n 2 URL /exechttps://...
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

    // ÄÃ³ng dropdown vÃ  modal tráº¡ng thÃ¡i náº¿u Ä‘ang má»Ÿ
    const userMenu = document.getElementById('user-dropdown-menu');
    if (userMenu) userMenu.style.display = 'none';

    const modal = document.getElementById('modal-config-gas');
    if (!modal) {
        console.error('[ConfigGAS] KhÃ´ng tÃ¬m tháº¥y modal-config-gas!');
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
            msg.innerHTML = 'âš ï¸ Vui lÃ²ng nháº­p Ä‘Æ°á»ng dáº«n URL WebApp há»£p lá»‡!';
        }
        return;
    }

    if (input) input.value = url;

    if (!url.startsWith('https://script.google.com/') || !url.endsWith('/exec')) {
        if (msg) {
            msg.style.cssText = 'display:block; background:#fffbeb; border:1px solid #fde68a; color:#92400e;';
            msg.innerHTML = 'âš ï¸ URL WebApp chuáº©n thÆ°á»ng cÃ³ dáº¡ng: <code>https://script.google.com/macros/s/.../exec</code>. Há»‡ thá»‘ng váº«n sáº½ lÆ°u URL nÃ y.';
        }
    }

    localStorage.setItem('times_backup_api_url', url);
    if (typeof callApi === 'function') {
        callApi('saveSystemSettings', ['gdrive_webhook_url', url]);
    }

    window.closeConfigGoogleScriptModal();
    if (typeof window.showToast === 'function') {
        window.showToast('âœ… ÄÃ£ lÆ°u URL Google Apps Script thÃ nh cÃ´ng!', 'success');
    } else {
        alert('âœ… ÄÃ£ lÆ°u URL Google Apps Script thÃ nh cÃ´ng!');
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
            msg.innerHTML = 'âš ï¸ Vui lÃ²ng nháº­p URL trÆ°á»›c khi kiá»ƒm tra!';
        }
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<span>â³</span> Äang test...'; }
    if (msg) { msg.style.cssText = 'display:block; background:#f8fafc; border:1px solid #e2e8f0; color:#475569;'; msg.innerHTML = 'ðŸ”„ Äang gá»­i tÃ­n hiá»‡u kiá»ƒm tra tá»›i Google Apps Script...'; }

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
            throw new Error("ChÆ°a cáº¥p quyá»n 'Anyone' táº¡i má»¥c 'Who has access' khi deploy WebApp.");
        }

        if (msg) {
            msg.style.cssText = 'display:block; background:#f0fdf4; border:1px solid #bbf7d0; color:#166534;';
            msg.innerHTML = `ðŸŸ¢ <strong>Káº¿t ná»‘i thÃ nh cÃ´ng!</strong> (Pháº£n há»“i: ${elapsed} ms)<br>WebApp Google Apps Script Ä‘Ã£ sáºµn sÃ ng nháº­n dá»¯ liá»‡u.`;
        }
    } catch (err) {
        if (msg) {
            msg.style.cssText = 'display:block; background:#fef2f2; border:1px solid #fecaca; color:#991b1b;';
            msg.innerHTML = `âŒ <strong>Lá»—i káº¿t ná»‘i:</strong> ${err.message || 'KhÃ´ng pháº£n há»“i'}<br><small>Kiá»ƒm tra láº¡i quyá»n truy cáº­p hoáº·c URL káº¿t thÃºc báº±ng /exec.</small>`;
        }
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<span>ðŸ§ª</span> Kiá»ƒm Tra Káº¿t Ná»‘i'; }
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
    { id: '1', name: 'PhÃ¡c Ä‘á»“ 1', procs: ['Äiá»‡n chÃ¢m', 'Thá»§y chÃ¢m', 'Äiá»‡n xung'] },
    { id: '2', name: 'PhÃ¡c Ä‘á»“ 2', procs: ['Äiá»‡n chÃ¢m', 'Thá»§y chÃ¢m', 'Äiá»‡n xung', 'Parafin'] },
    { id: '3', name: 'PhÃ¡c Ä‘á»“ 3', procs: ['Äiá»‡n chÃ¢m', 'Thá»§y chÃ¢m', 'Äiá»‡n xung', 'SÃ³ng ngáº¯n'] },
    { id: '4', name: 'PhÃ¡c Ä‘á»“ 4', procs: ['Äiá»‡n chÃ¢m', 'Thá»§y chÃ¢m', 'Chiáº¿u Ä‘Ã¨n há»“ng ngoáº¡i', 'Xoa bÃ³p vÃ¹ng'] },
    { id: '5', name: 'PhÃ¡c Ä‘á»“ 5', procs: ['Thá»§y chÃ¢m', 'Äiá»‡n xung', 'SÃ³ng ngáº¯n'] },
    { id: '6', name: 'PhÃ¡c Ä‘á»“ 6', procs: ['Äiá»‡n chÃ¢m', 'Thá»§y chÃ¢m', 'Chiáº¿u Ä‘Ã¨n há»“ng ngoáº¡i', 'Xoa bÃ³p báº¥m huyá»‡t'] },
    { id: '7', name: 'PhÃ¡c Ä‘á»“ 7', procs: ['Äiá»‡n chÃ¢m liá»‡t', 'Thá»§y chÃ¢m', 'Äiá»‡n xung', 'Táº­p váº­n Ä‘á»™ng trá»£ giÃºp'] },
    { id: '8', name: 'PhÃ¡c Ä‘á»“ 8', procs: ['Äiá»‡n chÃ¢m liá»‡t', 'Thá»§y chÃ¢m', 'Chiáº¿u Ä‘Ã¨n há»“ng ngoáº¡i', 'Táº­p váº­n Ä‘á»™ng trá»£ giÃºp'] },
    { id: '9', name: 'PhÃ¡c Ä‘á»“ 9', procs: ['Thá»§y chÃ¢m', 'Äiá»‡n xung', 'SiÃªu Ã¢m Ä‘iá»u trá»‹'] },
    { id: '10', name: 'PhÃ¡c Ä‘á»“ 10', procs: ['Chiáº¿u Ä‘Ã¨n há»“ng ngoáº¡i', 'Táº­p váº­n Ä‘á»™ng trá»£ giÃºp'] },
    { id: '11', name: 'PhÃ¡c Ä‘á»“ 11', procs: ['Chiáº¿u Ä‘Ã¨n há»“ng ngoáº¡i', 'Táº­p váº­n Ä‘á»™ng cÃ³ khÃ¡ng trá»Ÿ'] },
    { id: '12', name: 'PhÃ¡c Ä‘á»“ 12', procs: ['Chiáº¿u Ä‘Ã¨n há»“ng ngoáº¡i', 'Táº­p thá»Ÿ PHCN'] },
    { id: '13', name: 'PhÃ¡c Ä‘á»“ 13', procs: ['Äiá»‡n xung', 'Táº­p thá»Ÿ PHCN'] }
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
// ðŸ›¡ï¸ Báº¢O Máº¬T Dá»® LIá»†U (DOMPURIFY) & ðŸ” TÃŒM KIáº¾M Má»œ (FUSE.JS)
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
        .replace(/Ä‘/g, 'd')
        .replace(/Ä/g, 'd')
        .trim()
        .toLowerCase();
}
window.removeVietnameseTones = removeVietnameseTones;

/**
 * ðŸ›¡ï¸ HÃ€M PHá»¤C Há»’I Há»Œ TÃŠN Bá»†NH NHÃ‚N TOÃ€N DIá»†N (SELF-HEALING PATIENT NAMES)
 * Tá»± Ä‘á»™ng phÃ¡t hiá»‡n vÃ  sá»­a chá»¯a cÃ¡c chuá»—i bá»‹ lá»—i kÃ½ tá»± (\uFFFD, \u0000) hoáº·c nuá»‘t nguyÃªn Ã¢m
 * (Trn -> Tráº§n, CÆ°ng -> CÆ°á»ng, Lnh -> LÃ£nh, Nguyn -> Nguyá»…n, Phm -> Pháº¡m...)
 */
function healPatientName(rawName, candidates = [], forceUpperCase = false) {
    if (!rawName) return '';
    let name = String(rawName).normalize('NFC').trim();
    if (!name) return '';

    const isAllUpper = (name === name.toUpperCase() && /[A-ZÃ€-á»¸]/.test(name));
    const shouldUpper = forceUpperCase || isAllUpper;

    const hasCorruptChar = /[\ufffd\u0000]/.test(name) || /\b[A-Za-zÃ€-á»¹]+\?[A-Za-zÃ€-á»¹]+\b/.test(name);
    const hasSwallowedVowel = /\b(Trn|CÆ°ng|Lnh|Nguyn|Phm)\b/i.test(name) ||
        /\bTr[\ufffd\s\?]*n\b/i.test(name) ||
        /\bL[\ufffd\s\?]*nh\b/i.test(name) ||
        /\bC[\ufffd\s\?]*ng\b/i.test(name) ||
        /\bNguy[\ufffd\s\?]*n\b/i.test(name) ||
        /\bPh[\ufffd\s\?]*m\b/i.test(name);

    if (!hasCorruptChar && !hasSwallowedVowel) {
        return shouldUpper ? name.toUpperCase() : name;
    }

    const candList = Array.isArray(candidates) ? candidates : [];
    for (const cand of candList) {
        if (!cand) continue;
        const cleanCand = String(cand).normalize('NFC').trim();
        if (/[\ufffd\u0000]/.test(cleanCand) || /\b(Trn|CÆ°ng|Lnh)\b/i.test(cleanCand)) continue;

        const wildcardPattern = '^' + name
            .replace(/[\ufffd\u0000\?]+/g, '.*')
            .replace(/\bTrn\b/gi, 'Tr.*n')
            .replace(/\bCÆ°ng\b/gi, 'C.*ng')
            .replace(/\bLnh\b/gi, 'L.*nh')
            .replace(/\s+/g, '\\s+') + '$';
        try {
            if (new RegExp(wildcardPattern, 'i').test(cleanCand)) {
                return shouldUpper ? cleanCand.toUpperCase() : cleanCand;
            }
        } catch (e) {}

        const noToneName = removeVietnameseTones(name.replace(/[\ufffd\u0000\?]/g, ''));
        const noToneCand = removeVietnameseTones(cleanCand);
        if (noToneName && noToneCand) {
            if (noToneName === noToneCand) {
                return shouldUpper ? cleanCand.toUpperCase() : cleanCand;
            }
            const nameTokens = noToneName.split(/\s+/).filter(t => t.length >= 2);
            const candTokens = noToneCand.split(/\s+/).filter(t => t.length >= 2);
            const matchedTokens = nameTokens.filter(t => candTokens.includes(t));
            if (nameTokens.length >= 2 && matchedTokens.length >= nameTokens.length - 1) {
                return shouldUpper ? cleanCand.toUpperCase() : cleanCand;
            }
        }
    }

    let healed = name;
    healed = healed.replace(/\bTr[\ufffd\s\?]*n\b/gi, 'Tráº§n');
    healed = healed.replace(/\bTrn\b/gi, 'Tráº§n');
    healed = healed.replace(/\bL[\ufffd\s\?]*nh\b/gi, 'LÃ£nh');
    healed = healed.replace(/\bLnh\b/gi, 'LÃ£nh');
    healed = healed.replace(/\bC[\ufffd\s\?]*ng\b/gi, 'CÆ°á»ng');
    healed = healed.replace(/\bCÆ°ng\b/gi, 'CÆ°á»ng');
    healed = healed.replace(/\bNguy[\ufffd\s\?]*n\b/gi, 'Nguyá»…n');
    healed = healed.replace(/\bNguyn\b/gi, 'Nguyá»…n');
    healed = healed.replace(/\bPh[\ufffd\s\?]*m\b/gi, 'Pháº¡m');
    healed = healed.replace(/\bPhm\b/gi, 'Pháº¡m');
    healed = healed.replace(/\bHo[\ufffd\s\?]*ng\b/gi, 'HoÃ ng');
    healed = healed.replace(/(VÄƒn|Thá»‹)\s+H[\ufffd\s\?]*ng\b/gi, '$1 Há»“ng');
    healed = healed.replace(/[\ufffd\u0000]/g, '').replace(/\s+/g, ' ').trim();

    if (shouldUpper) {
        return healed.toUpperCase();
    }
    return healed.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
}
window.healPatientName = healPatientName;

function fuzzySearchList(list, query, keys = ['tenBN', 'phong', 'nvChinh', 'nvPhu', 'thuThuat', 'may', 'giuong', 'namSinh']) {
    if (!query || !list || !list.length) return list;
    const cleanQuery = String(query).trim();
    if (!cleanQuery) return list;

    const qNoTone = removeVietnameseTones(cleanQuery).toLowerCase();
    const tokens = qNoTone.split(/\s+/).filter(Boolean);
    if (!tokens.length) return list;

    return list.filter(row => {
        if (!row) return false;
        // Trich xuat tung cot rieng biet (khong dau, chu thuong) - khong ghep chung
        const colValues = keys.map(k => removeVietnameseTones(String(row[k] || '')).toLowerCase());

        // Cach 1: Toan bo cau query khop lien tuc trong it nhat 1 cot (uu tien cao nhat)
        if (colValues.some(col => col.includes(qNoTone))) return true;

        // Cach 2: Tat ca token phai xuat hien trong CUNG 1 cot (tranh cross-column matching)
        // Vi du: "bs hoa" -> ca "bs" va "hoa" phai nam trong cung cot nvChinh = "bs hoa"
        // Khong chap nhan: "bs" o nvChinh + "hoa" o tenBN (HOANG)
        return colValues.some(col => tokens.every(tok => col.includes(tok)));
    });
}
window.fuzzySearchList = fuzzySearchList;

// =========================================================
// ðŸ›¡ï¸ DATA VALIDATION SCHEMAS (ZOD ENGINE)
// =========================================================
(function initMedicalSchemas() {
    try {
        const _z = (typeof Zod !== 'undefined' && Zod.z) ? Zod.z : (typeof z !== 'undefined' ? z : null);
        if (_z) {
            window.MedicalSchemas = {
                patient: _z.object({
                    ten: _z.string().min(1, 'TÃªn bá»‡nh nhÃ¢n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
                    namSinh: _z.union([_z.string(), _z.number()]).optional(),
                    phong: _z.string().optional(),
                    giuong: _z.string().optional(),
                    thuThuat: _z.union([_z.string(), _z.array(_z.any())]).optional()
                }),
                scheduleRow: _z.object({
                    tenBN: _z.string().min(1, 'TÃªn bá»‡nh nhÃ¢n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
                    thuThuat: _z.string().min(1, 'Thá»§ thuáº­t khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'),
                    gioDienRa: _z.string().regex(/^\d{1,2}:\d{2}$/, 'Giá» báº¯t Ä‘áº§u khÃ´ng há»£p lá»‡ (HH:MM)'),
                    gioKetThuc: _z.string().regex(/^\d{1,2}:\d{2}$/, 'Giá» káº¿t thÃºc khÃ´ng há»£p lá»‡ (HH:MM)'),
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
        console.warn('Lá»—i khá»Ÿi táº¡o Zod schemas:', e);
    }
})();

// =========================================================
// GLOBAL HELPERS & DUAL-MODE TABLE REORDERING ENGINE
// =========================================================
function withLock(fn) {
    let locked = false;
    return function (...args) {
        if (locked) {
            console.warn('[withLock]: Thao tÃ¡c Ä‘ang Ä‘Æ°á»£c xá»­ lÃ½, vui lÃ²ng chá»...');
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
        <span class="drag-handle-btn" title="Báº¥m giá»¯ kÃ©o tháº£ â˜° Ä‘á»ƒ sáº¯p xáº¿p thá»© tá»±" style="cursor:grab; user-select:none; font-size:14px; color:#475569; padding:2px 4px; border-radius:4px; transition:background 0.2s;">â˜°</span>
        <span style="font-weight:700; min-width:18px; text-align:center;">${i + 1}</span>
    </div>`;
};

let _isDraggingRow = false;
window._isDraggingRow = false;

const reorderDebounceTimers = {};
function saveReorderedData(type, list) {
    try {
        localStorage.setItem('times_' + type + '_order', JSON.stringify(list.map(x => x.ten || x.name || x.maMay || x.tenPhong)));
    } catch (e) { }
    if (reorderDebounceTimers[type]) {
        clearTimeout(reorderDebounceTimers[type]);
    }
    reorderDebounceTimers[type] = setTimeout(() => {
        delete reorderDebounceTimers[type];
        callApi('saveReorderedData', [type, list], res => {
            console.log(`[Reorder]: ÄÃ£ Ä‘á»“ng bá»™ thá»© tá»± ${type} lÃªn CSDL!`);
        }, err => {
            console.warn('[Reorder] Lá»—i Ä‘á»“ng bá»™:', err);
        });
    }, 300);
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

            document.getElementById('global-loading-text').innerText = text || 'Äang xá»­ lÃ½...';

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
            let icon = 'ðŸ””';
            if (type === 'success') icon = 'âœ…';
            else if (type === 'error') icon = 'âŒ';
            else if (type === 'info') icon = 'â„¹ï¸';

            const iconSpan = document.createElement('span');
            iconSpan.className = 'toast-icon';
            iconSpan.textContent = icon;

            const msgSpan = document.createElement('span');
            msgSpan.className = 'toast-message';
            msgSpan.textContent = String(message != null ? message : '');

            toast.appendChild(iconSpan);
            toast.appendChild(msgSpan);
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
                    showCustomAlert('Äá»“ng bá»™ thÃ nh cÃ´ng', 'Há»‡ thá»‘ng Ä‘Ã£ náº¡p vÃ  lÃ m sáº¡ch toÃ n bá»™ dá»¯ liá»‡u tá»« Google Sheets thÃ nh cÃ´ng!', 'ðŸŽ‰', '#27ae60');
                } else {
                    alert('âœ… Äá»“ng bá»™ thÃ nh cÃ´ng!');
                }
            }, 600);
        }

        // Check for pending chot so success toast on reload
        if (sessionStorage.getItem('chot_so_success_toast') === 'true') {
            sessionStorage.removeItem('chot_so_success_toast');
            setTimeout(() => {
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('Chá»‘t sá»• thÃ nh cÃ´ng', 'Há»‡ thá»‘ng Ä‘Ã£ chá»‘t sá»• vÃ  lÆ°u trá»¯ dá»¯ liá»‡u vÃ o Lá»‹ch sá»­. Báº£ng lá»‹ch trÃ¬nh Ä‘Ã£ sáºµn sÃ ng cho ngÃ y má»›i!', 'ðŸŽ‰', '#27ae60');
                } else {
                    alert('âœ… Chá»‘t sá»• thÃ nh cÃ´ng!');
                }
                // Tá»± Ä‘á»™ng kÃ­ch hoáº¡t huáº¥n luyá»‡n mÃ´ hÃ¬nh AI sau khi chá»‘t sá»• náº¿u Ä‘ang báº­t
                if (localStorage.getItem('ai_auto_train_enable') !== '0') {
                    if (typeof window.calibrateAIFromHistory === 'function') {
                        window.calibrateAIFromHistory({ silent: true, reason: 'auto_after_chot_so' });
                    }
                }
            }, 600);
        }

        window.onerror = function (msg, url, lineNo, columnNo, error) {
            // Bá» qua lá»—i cross-origin (Script error. dÃ²ng 0) tá»« CDN/extension/JSONP
            if (msg === 'Script error.' || lineNo === 0 || !lineNo) {
                return true;
            }
            // Bá» qua lá»—i tá»« extension/Web Vitals/Cloudflare beacon/Chrome DevTools Live Metrics bÃªn ngoÃ i (reportAllChanges / startTime)
            const msgStr = String(msg || '');
            const urlStr = String(url || '');
            const stackStr = (error && error.stack) ? String(error.stack) : '';
            if (
                msgStr.includes('startTime') || 
                msgStr.includes('reportAllChanges') || 
                stackStr.includes('startTime') || 
                stackStr.includes('reportAllChanges') || 
                (urlStr.includes('VM') && (msgStr.includes('startTime') || stackStr.includes('startTime')))
            ) {
                return true; // Triá»‡t tiÃªu viá»‡c hiá»ƒn thá»‹ lá»—i Ä‘á» ra DevTools console
            }
            console.error('JS ERROR:', msg, 'at', url, 'line', lineNo, error);
            return false;
        };

        window.addEventListener('unhandledrejection', function (event) {
            const reasonStr = String(event.reason && (event.reason.stack || event.reason.message || event.reason) || '');
            if (
                reasonStr.includes('startTime') || 
                reasonStr.includes('reportAllChanges') || 
                reasonStr.includes('Receiving end does not exist') || 
                reasonStr.includes('Could not establish connection')
            ) {
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
        // ðŸ¢ MULTI-TENANT STORAGE KEY & DOM SANITIZATION HELPERS
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
                'chamcong-body',
                'tenants-table-body',
                'preview-thuthuat-body',
                'thongke-body',
                'stats-unscheduled-list',
                'stats-staff-list',
                'doc-lookup-table-body'
            ];

            const loadingHtml = '<tr><td colspan="12" align="center" style="padding:28px; color:#94a3b8;"><div class="spinner" style="margin:0 auto 10px auto;"></div><div style="font-size:12.5px;">Äang táº£i dá»¯ liá»‡u Ä‘Æ¡n vá»‹...</div></td></tr>';

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
                    : '<tr><td colspan="8" align="center" style="color:#94a3b8; padding:20px;">ChÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch trÃ¬nh</td></tr>';
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
                badge.innerHTML = 'âš¡ï¸ Mode Ngoáº¡i Tuyáº¿n';
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
                    <div style="font-size:36px; margin-bottom:10px;">ðŸ”„</div>
                    <h3 id="sync-modal-title" style="margin:0 0 10px 0; color:#1e293b; font-size:18px; font-weight:800;">Äá»“ng bá»™ Trá»n bá»™ CSDL Turso Cloud âž” Google Sheets</h3>
                    <p id="sync-step-text" style="color:#64748b; font-size:13px; margin:0 0 16px 0; line-height:1.5;">Äang khá»Ÿi táº¡o káº¿t ná»‘i...</p>
                    <div style="background:#f1f5f9; border-radius:10px; height:16px; overflow:hidden; margin-bottom:16px; position:relative; border:1px solid #e2e8f0;">
                        <div id="sync-progress-bar" style="background:linear-gradient(90deg, #10b981, #059669); width:5%; height:100%; transition:width 0.3s ease; border-radius:10px;"></div>
                    </div>
                    <div id="sync-percentage" style="font-size:14px; font-weight:800; color:#059669;">5%</div>
                    <button id="sync-close-btn" style="display:none; margin-top:16px; padding:10px 24px; background:#059669; color:#fff; border:none; border-radius:8px; font-weight:700; font-size:13px; cursor:pointer;" onclick="document.getElementById('sync-progress-modal').style.display='none'">HoÃ n táº¥t / ÄÃ³ng</button>
                </div>`;
                document.body.appendChild(modal);
            }
            if (modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }

            const titleEl = document.getElementById('sync-modal-title');
            if (titleEl) {
                titleEl.innerText = isSuperAdmin
                    ? 'Äá»“ng bá»™ CSDL ToÃ n Cá»¥c (Táº¥t Cáº£ CÃ¡c ÄÆ¡n Vá»‹) âž” Google Sheets'
                    : 'Äá»“ng bá»™ Trá»n bá»™ CSDL Turso Cloud âž” Google Sheets';
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
                    updateProgress(15, '[1/4] ðŸ“¡ Äang xuáº¥t trá»n bá»™ CSDL cá»§a Táº¤T Cáº¢ cÃ¡c Ä‘Æ¡n vá»‹ tá»« Turso libSQL Cloud...');
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
                        console.warn('[SyncSuperAdmin] KhÃ´ng thá»ƒ exportAllDatabase, fallback:', e);
                    }
                } else {
                    updateProgress(15, `[1/4] ðŸ“¡ Äang xuáº¥t CSDL Ä‘Æ¡n vá»‹ '${curUnitCode}' tá»« Turso libSQL Cloud...`);
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
                        console.warn('[SyncTenant] KhÃ´ng thá»ƒ fetch bootstrap data, fallback cache:', e);
                    }
                }

                const cache = window.dataCache || {};

                updateProgress(45, '[2/4] ðŸ“¦ ÄÃ³ng gÃ³i trá»n bá»™ cÃ¡c báº£ng dá»¯ liá»‡u...');
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

                updateProgress(75, '[3/4] ðŸ“¤ Truyá»n dá»¯ liá»‡u sang Google Apps Script...');

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
                        throw new Error("Google Apps Script WebApp chÆ°a cáº¥p quyá»n cÃ´ng khai. Vui lÃ²ng vÃ o Apps Script -> Deploy -> Manage deployments -> Chá»n 'Anyone' táº¡i 'Who has access', hoáº·c kiá»ƒm tra URL káº¿t thÃºc báº±ng /exec.");
                    } else {
                        throw new Error("Pháº£n há»“i khÃ´ng há»£p lá»‡ tá»« Apps Script: " + rawText.slice(0, 120));
                    }
                }

                if (res && res.status === 'success') {
                    const successMsg = isSuperAdmin
                        ? 'âœ… Äá»“ng bá»™ hoÃ n táº¥t 100%! ÄÃ£ lÆ°u trá»n bá»™ toÃ n bá»™ dá»¯ liá»‡u cá»§a Táº¤T Cáº¢ cÃ¡c Ä‘Æ¡n vá»‹ vÃ o Google Sheets!'
                        : 'âœ… Äá»“ng bá»™ hoÃ n táº¥t 100%! ÄÃ£ lÆ°u trá»n bá»™ táº¥t cáº£ cÃ¡c trang Bá»‡nh nhÃ¢n, NhÃ¢n sá»±, MÃ¡y mÃ³c, PhÃ²ng, Thá»§ thuáº­t, PhÃ¡c Ä‘á»“, Lá»‹ch trÃ¬nh, Lá»‹ch sá»­, TÃ i khoáº£n vÃ o Google Sheets!';
                    updateProgress(100, successMsg);
                    if (percentText) percentText.innerHTML = '<span style="color:#059669">ðŸŽ‰ Äá»’NG Bá»˜ TRá»ŒN Bá»˜ THÃ€NH CÃ”NG!</span>';
                } else {
                    updateProgress(100, 'âš ï¸ Káº¿t quáº£: ' + (res.error || res.data || res.message || 'ÄÃ£ gá»­i'));
                }
                closeBtn.style.display = 'inline-block';
            } catch (err) {
                updateProgress(100, 'âŒ Lá»—i káº¿t ná»‘i Google Apps Script dá»± phÃ²ng: ' + err.message);
                if (percentText) percentText.innerHTML = '<span style="color:#e11d48">âŒ Lá»–I Äá»’NG Bá»˜</span>';
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
            console.warn('[withLock]: Thao tÃ¡c Ä‘ang Ä‘Æ°á»£c xá»­ lÃ½, vui lÃ²ng chá»...');
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
        <span class="drag-handle-btn" title="Báº¥m giá»¯ kÃ©o tháº£ â˜° Ä‘á»ƒ sáº¯p xáº¿p thá»© tá»±" style="cursor:grab; user-select:none; font-size:14px; color:#475569; padding:2px 4px; border-radius:4px; transition:background 0.2s;">â˜°</span>
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
        const MAX_CONCURRENT_API_REQUESTS = 6;
        let activeApiRequests = 0;
        let apiQueue = [];
        let mutationCount = 0;
        const inFlightRequests = new Map();

        function checkMutationLoading() {
            if (mutationCount > 0) {
                if (window.showGlobalLoading) window.showGlobalLoading("Äang xá»­ lÃ½ dá»¯ liá»‡u...");
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
                setTimeout(scheduleNextApiRequest, 5);
            };

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    try {
                        controller.abort(new DOMException('Request timeout after 30s', 'TimeoutError'));
                    } catch(e) {
                        controller.abort();
                    }
                }, 30000);
                const currentUnit = localStorage.getItem('pm_unit_code') || 'bvtks-cs2';
                const token = localStorage.getItem('pm_jwt_token') || '';

                const headers = {
                    'Content-Type': 'application/json',
                    'x-unit-code': currentUnit
                };
                if (token) {
                    headers['Authorization'] = 'Bearer ' + token;
                }

                const response = await fetch(getApiUrl(), {
                    method: 'POST',
                    headers: headers,
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
                        const errMsg = "MÃ¡y chá»§ tráº£ vá» trang HTML thay vÃ¬ JSON. Náº¿u dÃ¹ng Google Apps Script dá»± phÃ²ng, vui lÃ²ng cáº¥p quyá»n 'Anyone' (Báº¥t ká»³ ai) khi Deploy Web App.";
                        if (onError) onError(errMsg);
                        else alert('Lá»—i: ' + errMsg);
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
                    // ðŸ›¡ï¸ Xá»­ lÃ½ phiÃªn Ä‘Äƒng nháº­p háº¿t háº¡n hoáº·c chÆ°a xÃ¡c thá»±c (401)
                    if (result && (result.code === 'UNAUTHORIZED' || result.code === 'TOKEN_EXPIRED' || response.status === 401)) {
                        const hadSession = !!(localStorage.getItem('pm_jwt_token') || localStorage.getItem('meds_session'));
                        localStorage.removeItem('pm_jwt_token');
                        localStorage.removeItem('meds_session');
                        const overlay = document.getElementById('login-overlay');
                        if (overlay) {
                            const isOverlayAlreadyOpen = overlay.style.display !== 'none';
                            overlay.style.display = 'flex';
                            const errDiv = document.getElementById('login-error');
                            if (errDiv) {
                                // Chá»‰ hiá»ƒn thá»‹ thÃ´ng bÃ¡o náº¿u ngÆ°á»i dÃ¹ng Ä‘ang Ä‘Äƒng nháº­p mÃ  bá»‹ rá»›t phiÃªn Ä‘á»™t ngá»™t
                                if (hadSession && !isOverlayAlreadyOpen) {
                                    console.warn('[Auth Guard] PhiÃªn lÃ m viá»‡c Ä‘Ã£ háº¿t háº¡n hoáº·c khÃ´ng há»£p lá»‡. Hiá»ƒn thá»‹ láº¡i mÃ n hÃ¬nh Ä‘Äƒng nháº­p.');
                                    errDiv.innerText = 'PhiÃªn Ä‘Äƒng nháº­p Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i!';
                                    errDiv.style.display = 'block';
                                } else {
                                    errDiv.innerText = '';
                                    errDiv.style.display = 'none';
                                }
                            }
                        }
                    }
                    const errMsg = (result && result.error) ? result.error : 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh tá»« mÃ¡y chá»§.';
                    if (onError) onError(errMsg);
                    else alert('Lá»—i: ' + errMsg);
                }
            } catch (err) {
                console.warn(`[Cloudflare API Error] ${functionName}:`, err);
                finish();

                // Tá»± Ä‘á»™ng thá»­ láº¡i 1 láº§n cho cÃ¡c query Ä‘á»c dá»¯ liá»‡u náº¿u bá»‹ timeout hoáº·c lá»—i máº¡ng
                if (!isMutation && retries < 1) {
                    console.log(`[API Retry] Thá»­ láº¡i ${functionName} sau 1 giÃ¢y...`);
                    setTimeout(() => {
                        apiQueue.push({ ...task, retries: retries + 1 });
                        scheduleNextApiRequest();
                    }, 1000);
                    return;
                }

                const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError' || (err.message && err.message.includes('abort'));
                const errMsg = isTimeout 
                    ? `QuÃ¡ thá»i gian káº¿t ná»‘i mÃ¡y chá»§ (${functionName} - Timeout 30s).`
                    : (err.message || 'Lá»—i káº¿t ná»‘i mÃ¡y chá»§ Cloudflare');

                if (onError) onError(errMsg);
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
                    const errMsg = `QuÃ¡ thá»i gian káº¿t ná»‘i mÃ¡y chá»§ (${functionName}).`;
                    if (onError) onError(errMsg);
                    else console.error(errMsg);
                }
            }, 30000);

            window[callbackName] = function (result) {
                clearTimeout(timeoutTimer);
                if (isFinished) return;
                cleanup();

                if (result && result.status === 'success') {
                    if (task && (task.isMutation || (functionName && (functionName.startsWith('add') || functionName.startsWith('edit') || functionName.startsWith('delete') || functionName.startsWith('save') || functionName.startsWith('chotSo'))))) {
                        window._lastLocalMutationTime = Date.now();
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
                    const errMsg = (result && result.error) ? result.error : 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh tá»« mÃ¡y chá»§.';
                    if (onError) onError(errMsg);
                    else alert('Lá»—i: ' + errMsg);
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
                    const errMsg = `KhÃ´ng thá»ƒ káº¿t ná»‘i Ä‘áº¿n mÃ¡y chá»§ (${functionName}).`;
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

        const PUBLIC_API_ACTIONS = new Set([
            'ping',
            'getPublicUnits',
            'getPublicTenantInfo',
            'verifyLogin',
            'checkLogin',
            'login',
            'getDataVersion',
            'getSubscriptionPlans',
            'registerTrialTenant',
            'createPaymentOrder',
            'checkPaymentStatus',
            'paymentWebhook'
        ]);

        function callApi(functionName, args, onSuccess, onError) {
            return new Promise((resolve, reject) => {
                // Kiá»ƒm tra tráº¡ng thÃ¡i xÃ¡c thá»±c: náº¿u chÆ°a Ä‘Äƒng nháº­p vÃ  khÃ´ng pháº£i API cÃ´ng khai -> bá» qua, khÃ´ng gá»­i request 401
                const token = localStorage.getItem('pm_jwt_token');
                let hasValidSession = false;
                try {
                    const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
                    if (sess && (sess.username || sess.role)) hasValidSession = true;
                } catch(e) {}

                if (!PUBLIC_API_ACTIONS.has(functionName) && (!token || !hasValidSession)) {
                    if (onError) {
                        try { onError('ChÆ°a Ä‘Äƒng nháº­p'); } catch(e) {}
                    }
                    return resolve(null);
                }

                const SILENT_MUTATION_ACTIONS = new Set([
                    'saveChamCong', 'saveChamCongSymbols', 'saveEmployees', 'saveErrorConfig',
                    'saveReorderedData', 'saveReorder', 'saveSchedule', 'saveLichTrinh',
                    'editBenhNhan', 'addBenhNhan', 'deleteBenhNhan',
                    'editNhanSu', 'addNhanSu', 'deleteNhanSu',
                    'editMayMoc', 'addMayMoc', 'deleteMayMoc',
                    'editThuThuat', 'addThuThuat', 'deleteThuThuat',
                    'editPhong', 'addPhong', 'deletePhong',
                    'saveProtocolsData', 'saveClinicalProtocols', 'savePhacDo', 'addPhacDo', 'deletePhacDo',
                    'saveThongKeThuThuat', 'saveGioBan', 'saveAccount', 'deleteAccount'
                ]);
                const isSilentMutation = SILENT_MUTATION_ACTIONS.has(functionName);
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
                    // Báº«y lá»—i máº·c Ä‘á»‹nh Ä‘á»ƒ trÃ¡nh Uncaught (in promise) náº¿u khÃ´ng cÃ³ subscriber thá»© hai
                    inFlightPromise.catch(() => {});
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
                        if (origOnError) {
                            try { origOnError(err); } catch(e) { console.error(e); }
                            // ÄÃ£ xá»­ lÃ½ qua callback onError -> resolve(null) Ä‘á»ƒ khÃ´ng gÃ¢y unhandled promise rejection cho caller
                            resolve(null);
                        } else {
                            reject(err);
                        }
                    };
                } else {
                    const origOnSuccess = onSuccess;
                    const origOnError = onError;

                    onSuccess = (data) => {
                        if (origOnSuccess) origOnSuccess(data);
                        resolve(data);
                    };

                    onError = (err) => {
                        if (origOnError) {
                            try { origOnError(err); } catch(e) { console.error(e); }
                            resolve(null);
                        } else {
                            reject(err);
                        }
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
        window.escapeHtml = escapeHtml;




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
                    errDiv.innerText = "Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ mÃ£ Ä‘Æ¡n vá»‹, tÃªn Ä‘Äƒng nháº­p vÃ  máº­t kháº©u!";
                    errDiv.style.display = "block";
                }
                return;
            }

            if (btn) { btn.innerText = "â³ Äang kiá»ƒm tra..."; btn.disabled = true; }
            if (errDiv) errDiv.style.display = "none";

            localStorage.setItem('pm_unit_code', unit);

            const resetBtn = () => {
                if (btn) { btn.innerText = "ÄÄƒng Nháº­p âž”"; btn.disabled = false; }
            };

            const handleSuccess = res => {
                resetBtn();
                if (res && (res.username || res.role || res.success)) {
                    const uName = res.username || user || 'admin';
                    const uRole = res.role || 'Admin';
                    const uPerms = res.permissions || 'all';
                    const uUnit = (res.unit_code || unit).toLowerCase();
                    const uUnitName = res.unit_name || (uRole === 'SUPER_ADMIN' ? 'T.I.M.E.S SYSTEM' : 'Bá»‡nh viá»‡n Than - KhoÃ¡ng sáº£n CÆ¡ sá»Ÿ 2');

                    if (res.token) {
                        localStorage.setItem('pm_jwt_token', res.token);
                    }
                    const isBvtks = (uUnit === 'bvtks-cs2' || uUnit === 'bvtks_cs2');
                    const pTier = isBvtks ? 'ENTERPRISE' : (res.plan_tier || 'PLAN_1Y');
                    const pExp = isBvtks ? '2099-12-31' : (res.expires_at || '2099-12-31');
                    const pName = isBvtks ? 'Báº£n Quyá»n VÄ©nh Viá»…n' : (res.subInfo ? res.subInfo.plan_name : (res.plan_name || 'Báº£n Quyá»n'));
                    const pDays = isBvtks ? 99999 : (res.subInfo ? res.subInfo.days_left : (res.days_left !== undefined ? res.days_left : 999));

                    localStorage.setItem('pm_plan_tier', pTier);
                    localStorage.setItem('pm_expires_at', pExp);
                    localStorage.setItem('pm_plan_name', pName);
                    localStorage.setItem('pm_days_left', String(pDays));

                    localStorage.setItem('meds_session', JSON.stringify({
                        username: uName,
                        role: uRole,
                        permissions: uPerms,
                        unit_code: uUnit,
                        unit_name: uUnitName,
                        plan_tier: pTier,
                        plan_name: pName,
                        expires_at: pExp,
                        days_left: pDays,
                        sessionId: 'sess_' + Date.now()
                    }));

                    // âœ… 1. XÃ³a sáº¡ch bá»™ Ä‘á»‡m lá»‹ch trÃ¬nh cá»¥c bá»™ cá»§a Ä‘Æ¡n vá»‹ trÆ°á»›c Ä‘Ã³
                    localStorage.removeItem('meds_success');
                    localStorage.removeItem('meds_unscheduled');
                    localStorage.removeItem('meds_schedule_date');
                    localStorage.removeItem('meds_schedule_unit');

                    // âœ… 2. XÃ³a sáº¡ch dá»¯ liá»‡u trong RAM cá»§a Ä‘Æ¡n vá»‹ cÅ©
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

                    // âœ… 3. Dá»n sáº¡ch toÃ n bá»™ cÃ¡c báº£ng DOM vÃ  hiá»ƒn thá»‹ tráº¡ng thÃ¡i Ä‘ang táº£i
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
                    document.title = 'T.I.M.E.S System - Pháº§n má»m xáº¿p lá»‹ch thá»§ thuáº­t thÃ´ng minh';

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
                    if (typeof window.updateSubscriptionHeaderBadge === 'function') {
                        window.updateSubscriptionHeaderBadge(pTier, pExp, pName, pDays);
                    }

                    // âœ… 4. Táº£i dá»¯ liá»‡u Bootstrap má»›i nháº¥t cá»§a Ä‘Æ¡n vá»‹ nÃ y ngay láº­p tá»©c (forceRefresh = true)
                    if (typeof window.loadBootstrapData === 'function') {
                        try { window.loadBootstrapData(true); } catch(e) { console.warn('Lá»—i loadBootstrapData:', e); }
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
                    const msg = (res && (res.message || res.error)) ? (res.message || res.error) : "TÃ i khoáº£n hoáº·c máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c!";
                    if (errDiv) { errDiv.innerText = msg; errDiv.style.display = "block"; }
                }
            };

            const handleError = err => {
                resetBtn();
                if (errDiv) {
                    const msg = (err && err.message) ? err.message : (typeof err === 'string' && err ? err : "Lá»—i káº¿t ná»‘i mÃ¡y chá»§!");
                    errDiv.innerText = msg;
                    errDiv.style.display = "block";
                }
            };

            callApi('verifyLogin', [user, pass, unit], handleSuccess, handleError);
        };

        // ============================================================

        // ðŸ”§ HELPER UTILITIES

        // ============================================================



        window.alert = function (message) {

            const m = String(message).toLowerCase();

            const [type, title] =

                (m.includes('lá»—i') || m.includes('tháº¥t báº¡i')) ? ['error', 'Lá»–I Há»† THá»NG'] :

                    (m.includes('thÃ nh cÃ´ng') || m.includes('xong')) ? ['success', 'THÃ€NH CÃ”NG'] :

                        (m.includes('vui lÃ²ng') || m.includes('chÆ°a')) ? ['warning', 'LÆ¯U Ã'] :

                            ['info', 'THÃ”NG BÃO'];

            if (typeof showCustomAlert === 'function') {
                let icon = 'ðŸ’¡', color = '#3498db';
                if (type === 'error') { icon = 'ðŸ›‘'; color = '#e74c3c'; }
                else if (type === 'success') { icon = 'âœ…'; color = '#27ae60'; }
                else if (type === 'warning') { icon = 'âš ï¸'; color = '#f39c12'; }
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



        // â”€â”€â”€ Chá»‘ng double-click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        function withLock(fn, delay = 500) {

            let locked = false;

            return function (...args) {

                if (locked) return;

                locked = true;

                setTimeout(() => { locked = false; }, delay);

                fn.apply(this, args);

            };

        }



        // â”€â”€â”€ Tiá»‡n Ã­ch chung â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        function xoaDau(str) {

            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ä‘/g, "d").replace(/Ä/g, "D");

        }

        function normalizeName(str) {

            if (!str) return "";

            return xoaDau(String(str)).toLowerCase().replace(/\s+/g, '');

        }

        // âš ï¸ Cáº¢NH BÃO: Äá»’NG Bá»˜ Vá»šI t2m() trong code.gs-v2.txt â€” sá»­a 1 bÃªn PHáº¢I sá»­a bÃªn kia!
        function t2m(t_str) {

            if (!t_str || !String(t_str).includes(":")) return 0;

            let parts = String(t_str).split(":");

            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);

        }



        function isDroppedScheduleRow(row) {

            const g = String(row?.gioDienRa || row?.[5] || '');

            return g === '--' || g.includes('Rá»›t');

        }



        function normalizeScheduleRow(row) {
            if (!row) return {};
            if (window.SchedulerEngine && typeof window.SchedulerEngine.normalizeScheduleItem === 'function') {
                return window.SchedulerEngine.normalizeScheduleItem(row) || {};
            }
            const cleanHealProcFn = (window.SchedulerEngine && typeof window.SchedulerEngine.cleanAndHealProcedureName === 'function')
                ? window.SchedulerEngine.cleanAndHealProcedureName
                : (typeof window.cleanAndHealProcedureName === 'function' ? window.cleanAndHealProcedureName : (s => String(s || '').trim()));
            if (Array.isArray(row)) {
                const gioDienRa = String(row[5] || '').trim();
                const isDrop = gioDienRa === 'âŒ Rá»›t' || gioDienRa === '--' || gioDienRa.includes('Rá»›t');
                return {
                    ngay: row[0] || '', tenBN: row[1] || '', namSinh: row[2] || '', phong: row[3] || '', thuThuat: cleanHealProcFn(row[4] || ''),
                    gioDienRa: gioDienRa, gioKetThuc: row[6] || '', nvChinh: row[7] || '', nvPhu: row[8] || '', may: row[9] || '', giuong: row[10] || '',
                    __isDischarged: false,
                    __dropped: isDrop
                };
            }
            const rawGio = String(row.gioDienRa || row.GIODIENRA || row.start_time || row.start || '').trim();
            const isDrop = !!row.__dropped || rawGio === 'âŒ Rá»›t' || rawGio === '--' || rawGio.includes('Rá»›t');
            return {
                ngay: row.ngay || row.NGAY || row.date || '',
                tenBN: row.tenBN || row.HOTEN || row.patient_name || row.ten || row.name || '',
                namSinh: row.namSinh || row.NAMSINH || row.dob || row.ns || row.age || '',
                phong: row.phong || row.PHONG || row.room || '',
                thuThuat: cleanHealProcFn(row.thuThuat || row.DICHVU || row.procedure_name || row.tt || ''),
                gioDienRa: rawGio,
                gioKetThuc: row.gioKetThuc || row.GIOKETTHUC || row.end_time || row.end || '',
                nvChinh: row.nvChinh || row['NV CHÃNH'] || row.staff_name || row.staff || row.nv1 || '',
                nvPhu: row.nvPhu || row['NV PHá»¤'] || row.sub_staff_name || row.sub_staff || row.nv2 || '',
                may: row.may || row.MAY || row.machine_name || row.machine || '',
                giuong: row.giuong || row.GIUONG || row.bed || '',
                __isDischarged: !!row.__isDischarged,
                __dropped: isDrop
            };
        }

        function scheduleRowToBackendArray(row, fallbackDate = '') {
            const r = normalizeScheduleRow(row);
            return [
                r.ngay || fallbackDate || '',
                r.tenBN || '',
                r.namSinh || '',
                r.phong || '',
                r.thuThuat || '',
                r.gioDienRa || '',
                r.gioKetThuc || '',
                r.nvChinh || '',
                r.nvPhu || '',
                r.may || '',
                r.giuong || ''
            ];
        }



        function normalizeDroppedItem(item, fallbackDate = '') {
            if (!item) return {};
            const cleanHealProcFn = (window.SchedulerEngine && typeof window.SchedulerEngine.cleanAndHealProcedureName === 'function')
                ? window.SchedulerEngine.cleanAndHealProcedureName
                : (typeof window.cleanAndHealProcedureName === 'function' ? window.cleanAndHealProcedureName : (s => String(s || '').trim()));

            if (Array.isArray(item)) {
                return {
                    ngay: item[0] || fallbackDate, bn: item[1] || '', ns: item[2] || '',
                    room: item[3] || '', phong: item[3] || '', tt: cleanHealProcFn(item[4] || ''),
                    staff: item[7] || '', reason: item[11] || item[8] || 'Thiáº¿u nhÃ¢n sá»±/MÃ¡y hoáº·c háº¿t giá»'
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
                tt: cleanHealProcFn(item.tt || item.thuThuat || ''),
                reason: item.reason || item.liDo || 'Thiáº¿u nhÃ¢n sá»±/MÃ¡y hoáº·c háº¿t giá»'
            };
        }



        function setUnscheduledData(items, dateVal = '') {
            let list = [];
            if (Array.isArray(items)) {
                list = items;
            } else if (items && typeof items === 'object') {
                if (Array.isArray(items.dropped)) list = items.dropped;
                else if (Array.isArray(items.unscheduled)) list = items.unscheduled;
                else if (Array.isArray(items.rot)) list = items.rot;
                else if (Array.isArray(items.items)) list = items.items;
                else if (items.bn || items.tenBN || items.HOTEN || items.tt || items.thuThuat || items.causeDetail || items.reason) list = [items];
            }
            const seen = new Set();
            const normalized = list.map(item => normalizeDroppedItem(item, dateVal)).filter(item => {

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

        function renderEmptyRow(colspan, msg = 'ChÆ°a cÃ³ dá»¯ liá»‡u') {

            return `<tr><td colspan="${colspan}" align="center" style="padding:20px;color:#999">${msg}</td></tr>`;

        }

        function sortTimeSlots(slotsStr) {

            if (!slotsStr) return "";

            let slots = [...new Set(slotsStr.split(',').map(s => s.trim()).filter(s => s))];

            slots.sort((a, b) => t2m(a.split('-')[0].trim()) - t2m(b.split('-')[0].trim()));

            return slots.join(', ');

        }

        function cleanMedicalProc(s) {
            return String(s || '')
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/Ä‘/g, 'd')
                .replace(/\b(van dong|co|dieu tri|va|cua|bang may|ky thuat|chieu den)\b/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }
        window.cleanMedicalProc = cleanMedicalProc;

        function extractPatientProcedures(item) {
            if (!item) return [];
            let raw = item.thuThuat;
            if (raw === undefined || raw === null || raw === '') {
                raw = item.thu_thuat || item.procs || item.dichVu || item.thuthuat || '';
            }
            if (!raw) return [];

            // 1. Dáº¡ng máº£ng
            if (Array.isArray(raw)) {
                return raw.map(p => {
                    if (!p) return '';
                    if (typeof p === 'string') return p.trim();
                    if (typeof p === 'object') return (p.name || p.ten || p.thuThuat || p.dichVu || '').trim();
                    return String(p).trim();
                }).filter(Boolean);
            }

            // 2. Dáº¡ng chuá»—i (bao gá»“m chuá»—i JSON hoáº·c chuá»—i phÃ¢n tÃ¡ch bá»Ÿi dáº¥u pháº©y/cháº¥m pháº©y/xuá»‘ng dÃ²ng)
            if (typeof raw === 'string') {
                const trimmed = raw.trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) {
                            return extractPatientProcedures({ thuThuat: parsed });
                        }
                    } catch (e) {}
                }
                return trimmed.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean);
            }

            return [];
        }
        window.extractPatientProcedures = extractPatientProcedures;

        function getShortSkills(skillStr, isStaff = false) {
            if (!skillStr) return '';
            const str = typeof skillStr === 'string' ? skillStr : (Array.isArray(skillStr) ? skillStr.join(', ') : String(skillStr || ''));
            const arr = str.split(',').map(sk => sk.trim()).filter(Boolean);
            if (!arr.length) return '';

            const procList = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.proc)) ? dataCache.proc : [];
            const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').trim();

            if (!isStaff) {
                return arr.map(sk => {
                    const skLower = sk.toLowerCase();
                    // 1. Khá»›p chÃ­nh xÃ¡c theo tÃªn hoáº·c viáº¿t táº¯t
                    let proc = procList.find(p => p && ((p.ten && p.ten.toLowerCase() === skLower) || (p.vietTat && p.vietTat.toLowerCase() === skLower)));
                    if (proc) {
                        if (cleanMedicalProc(proc.ten).includes('khang tro') && (!proc.vietTat || proc.vietTat.toUpperCase() === 'TTK')) {
                            return 'TKT';
                        }
                        return proc.vietTat || proc.ten;
                    }

                    const nSk = norm(sk);
                    const cSk = cleanMedicalProc(sk);

                    // 2. Khá»›p theo chuáº©n hÃ³a khÃ´ng dáº¥u vÃ  bá» hÆ° tá»« y khoa
                    proc = procList.find(p => {
                        if (!p || !p.ten) return false;
                        const np = norm(p.ten);
                        const cp = cleanMedicalProc(p.ten);
                        const vp = p.vietTat ? norm(p.vietTat) : '';
                        return np === nSk || cp === cSk || vp === nSk || (cSk && vp === cSk);
                    });

                    // 3. Khá»›p alias nhÃ³m thá»§ thuáº­t (Trá»£ giÃºp, KhÃ¡ng trá»Ÿ, Thá»¥ Ä‘á»™ng)
                    if (!proc) {
                        if (cSk.includes('tro giup') || nSk === 'ttg' || nSk === 'vd-tg' || nSk === 'vdtg') {
                            proc = procList.find(p => p && (cleanMedicalProc(p.ten).includes('tro giup') || (p.vietTat && norm(p.vietTat) === 'ttg')));
                            if (!proc) return 'TTG';
                        } else if (cSk.includes('khang tro') || nSk === 'tkt' || nSk === 'ttk' || nSk === 'vd-kt' || nSk === 'vdkt') {
                            proc = procList.find(p => p && (cleanMedicalProc(p.ten).includes('khang tro') || (p.vietTat && (norm(p.vietTat) === 'tkt' || norm(p.vietTat) === 'ttk'))));
                            if (!proc) return 'TKT';
                        } else if (cSk.includes('thu dong') || nSk === 'ttd' || nSk === 'vd-td' || nSk === 'vdtd') {
                            proc = procList.find(p => p && (cleanMedicalProc(p.ten).includes('thu dong') || (p.vietTat && (norm(p.vietTat) === 'ttd' || norm(p.vietTat) === 'vd-td'))));
                            if (!proc) return 'VÄ-TD';
                        }
                    }

                    // 4. Khá»›p chá»©a nhau an toÃ n
                    if (!proc) {
                        proc = procList.find(p => {
                            if (!p || !p.ten) return false;
                            const np = norm(p.ten);
                            const cp = cleanMedicalProc(p.ten);
                            return (np.length >= 3 && (np.includes(nSk) || nSk.includes(np))) ||
                                   (cp && cSk && cp.length >= 3 && (cp.includes(cSk) || cSk.includes(cp)));
                        });
                    }

                    if (proc) {
                        if (cleanMedicalProc(proc.ten).includes('khang tro') && (!proc.vietTat || proc.vietTat.toUpperCase() === 'TTK')) {
                            return 'TKT';
                        }
                        return proc.vietTat || proc.ten;
                    }
                    return sk;
                }).join(', ');
            }

            const allYHCT = procList.filter(p => p && p.he === 'YHCT');
            const allPHCN = procList.filter(p => p && p.he === 'PHCN');
            
            const checkMatch = (p) => {
                if (!p || !p.ten) return false;
                return arr.some(sk => matchProc(p.ten, sk) || (p.vietTat && matchProc(p.vietTat, sk)));
            };

            const staffYHCT = allYHCT.filter(p => checkMatch(p));
            const staffPHCN = allPHCN.filter(p => checkMatch(p));
            const missingYHCT = allYHCT.filter(p => !checkMatch(p));
            const missingPHCN = allPHCN.filter(p => !checkMatch(p));

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



        // â”€â”€â”€ Index lookup gom chung â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        
        function matchProc(a, b) {
            if (!a || !b) return false;
            const healProcFn = (window.SchedulerEngine && typeof window.SchedulerEngine.cleanAndHealProcedureName === 'function')
                ? window.SchedulerEngine.cleanAndHealProcedureName
                : (typeof window.cleanAndHealProcedureName === 'function' ? window.cleanAndHealProcedureName : (s => s));
            a = healProcFn(a);
            b = healProcFn(b);
            const strA = String(a).trim().toLowerCase();
            const strB = String(b).trim().toLowerCase();
            if (strA === strB) return true;
            
            const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').trim();
            const normA = norm(a);
            const normB = norm(b);
            const cleanA = cleanMedicalProc(a);
            const cleanB = cleanMedicalProc(b);
            
            if (normA === normB) return true;
            if (cleanA && cleanB && cleanA === cleanB) return true;

            // 1. NhÃ³m tá»« Ä‘á»“ng nghÄ©a chuáº©n xÃ¡c (Trá»£ giÃºp, KhÃ¡ng trá»Ÿ, Thá»¥ Ä‘á»™ng, Xoa bÃ³p báº¥m huyá»‡t)
            const isTroGiupA = cleanA.includes('tro giup') || normA === 'ttg' || normA === 'vd-tg' || normA === 'vdtg';
            const isTroGiupB = cleanB.includes('tro giup') || normB === 'ttg' || normB === 'vd-tg' || normB === 'vdtg';
            if (isTroGiupA && isTroGiupB) return true;

            const isKhangTroA = cleanA.includes('khang tro') || normA === 'tkt' || normA === 'ttk' || normA === 'vd-kt' || normA === 'vdkt';
            const isKhangTroB = cleanB.includes('khang tro') || normB === 'tkt' || normB === 'ttk' || normB === 'vd-kt' || normB === 'vdkt';
            if (isKhangTroA && isKhangTroB) return true;

            const isThuDongA = cleanA.includes('thu dong') || normA === 'ttd' || normA === 'vd-td' || normA === 'vdtd';
            const isThuDongB = cleanB.includes('thu dong') || normB === 'ttd' || normB === 'vd-td' || normB === 'vdtd';
            if (isThuDongA && isThuDongB) return true;

            // Äá»“ng nghÄ©a YHCT: Xoa bÃ³p / Báº¥m huyá»‡t / Xoa bÃ³p báº¥m huyá»‡t
            const isXoaBopA = cleanA.includes('xoa bop') || normA === 'xb' || normA === 'xbbh';
            const isXoaBopB = cleanB.includes('xoa bop') || normB === 'xb' || normB === 'xbbh';
            if (isXoaBopA && isXoaBopB) {
                const hasVungA = cleanA.includes('vung');
                const hasVungB = cleanB.includes('vung');
                if (hasVungA === hasVungB) return true;
            }

            // 2. Tra cá»©u database theo mÃ£ viáº¿t táº¯t hoáº·c tÃªn Ä‘áº§y Ä‘á»§ (chÃ­nh xÃ¡c 100%)
            const procs = (window.dataCache && window.dataCache.proc) ? window.dataCache.proc : [];
            const procA = procs.find(p => {
                if (!p) return false;
                const pn = norm(p.ten);
                const pvt = p.vietTat ? norm(p.vietTat) : '';
                const pc = cleanMedicalProc(p.ten);
                return pn === normA || pvt === normA || (pc && cleanA && pc === cleanA);
            });
            const procB = procs.find(p => {
                if (!p) return false;
                const pn = norm(p.ten);
                const pvt = p.vietTat ? norm(p.vietTat) : '';
                const pc = cleanMedicalProc(p.ten);
                return pn === normB || pvt === normB || (pc && cleanB && pc === cleanB);
            });
            
            if (procA && procB && procA.ten && procB.ten) {
                if (procA.id && procB.id && procA.id === procB.id) return true;
                const pnA = norm(procA.ten);
                const pnB = norm(procB.ten);
                const pcA = cleanMedicalProc(procA.ten);
                const pcB = cleanMedicalProc(procB.ten);
                if (pnA === pnB || (pcA && pcB && pcA === pcB)) return true;
            }
            if (procA) {
                const pn = norm(procA.ten);
                const pvt = procA.vietTat ? norm(procA.vietTat) : '';
                const pc = cleanMedicalProc(procA.ten);
                if (pn === normB || pvt === normB || (pc && cleanB && pc === cleanB)) return true;
            }
            if (procB) {
                const pn = norm(procB.ten);
                const pvt = procB.vietTat ? norm(procB.vietTat) : '';
                const pc = cleanMedicalProc(procB.ten);
                if (pn === normA || pvt === normA || (pc && cleanA && pc === cleanA)) return true;
            }

            // 3. Kiá»ƒm tra phÃ¢n biá»‡t tá»« khÃ³a Ä‘áº·c biá»‡t Ä‘á»ƒ trÃ¡nh báº¯t nháº§m (vd: 'liá»‡t', 'vÃ¹ng', 'báº¥m huyá»‡t', 'khÃ¡ng trá»Ÿ', 'trá»£ giÃºp', 'thá»Ÿ')
            const distinctKeywords = ['liá»‡t', 'vÃ¹ng', 'báº¥m huyá»‡t', 'khÃ¡ng trá»Ÿ', 'trá»£ giÃºp', 'thá»Ÿ'];
            for (const kw of distinctKeywords) {
                // Náº¿u lÃ  'báº¥m huyá»‡t' nhÆ°ng má»™t trong 2 bÃªn cÃ³ 'xoa bÃ³p', khÃ´ng cháº·n khá»›p
                if (kw === 'báº¥m huyá»‡t' && (cleanA.includes('xoa bop') || cleanB.includes('xoa bop'))) {
                    continue;
                }
                const hasA = strA.includes(kw) || (procA && procA.ten && procA.ten.toLowerCase().includes(kw));
                const hasB = strB.includes(kw) || (procB && procB.ten && procB.ten.toLowerCase().includes(kw));
                if (hasA !== hasB) return false;
            }

            // 4. Substring match an toÃ n (sau khi Ä‘Ã£ loáº¡i trá»« cÃ¡c keyword phÃ¢n biá»‡t)
            if (strA.includes(strB) || strB.includes(strA)) return true;
            if (cleanA && cleanB && (cleanA.includes(cleanB) || cleanB.includes(cleanA))) return true;

            // 5. Token-based matching: cÃ¡c token chÃ­nh cá»§a b Ä‘á»u náº±m trong a
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

                // Náº¿u sá»‘ ca Ä‘Ã£ cÃ³ trong lá»‹ch >= sá»‘ ca yÃªu cáº§u, ca rá»›t nÃ y Ä‘Ã£ Ä‘Æ°á»£c giáº£i quyáº¿t
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
                
                // 1. Match format "TÃªn (NÄƒmSinh)" or "TÃªn - NÄƒmSinh"
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

        // â° TIME MASKING

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

        // ðŸ”¤ TABLE SORTING

        // ============================================================

        function setupTableSorting(container = document) {

            container.querySelectorAll('th').forEach(th => {

                if (th.dataset.sortBound) return;

                th.dataset.sortBound = "true";

                th.title = 'Báº¥m Ä‘á»ƒ sáº¯p xáº¿p (A-Z / Z-A)';

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

                            el.innerText = el.innerText.replace(' â–²', '').replace(' â–¼', '');

                        });

                        this.dataset.dir = window.scheduleSortState.dir;

                        this.innerText = this.innerText.replace(' â–²', '').replace(' â–¼', '') + (isAsc ? ' â–²' : ' â–¼');

                        schedCurrentPage = 1;

                        renderSchedPage();

                        return;

                    }



                    const rows = Array.from(tbody.querySelectorAll('tr'));

                    if (rows.length === 0 || (rows.length === 1 && rows[0].cells.length <= 1)) return;



                    this.dataset.dir = isAsc ? 'asc' : 'desc';

                    this.parentElement.querySelectorAll('th').forEach(el => {

                        if (el !== this) el.dataset.dir = '';

                        el.innerText = el.innerText.replace(' â–²', '').replace(' â–¼', '');

                    });

                    this.innerText = this.innerText + (isAsc ? ' â–²' : ' â–¼');



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

                        } else if (!isNaN(numA) && !isNaN(numB) && !valA.match(/[a-zA-ZÃ€-á»¹]/) && !valB.match(/[a-zA-ZÃ€-á»¹]/)) {

                            primaryDiff = isAsc ? numA - numB : numB - numA;

                        } else {

                            primaryDiff = isAsc ? valA.localeCompare(valB, 'vi', { numeric: true }) : valB.localeCompare(valA, 'vi', { numeric: true });

                        }



                        if (primaryDiff !== 0) return primaryDiff;



                        const headerCells = Array.from(this.parentElement.children);

                        let timeColIdx = headerCells.findIndex(th => {

                            const text = th.innerText.toLowerCase();

                            return text.includes('báº¯t Ä‘áº§u') || text.includes('giá»') || text.includes('thá»i gian') || text.includes('b.Ä‘áº§u');

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

        // âŒ¨ï¸ GLOBAL KEYBOARD SHORTCUTS

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

                    // Tá»± Ä‘á»™ng Ä‘iá»n ngÃ y hÃ´m nay khi láº§n Ä‘áº§u má»Ÿ tab
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

        // ðŸš€ DOM READY

        // ============================================================

        document.addEventListener('DOMContentLoaded', function () {

            // Pháº§n 1: BÆ¡m Footer

            try {

                const khuonDuc = document.getElementById('khuon-duc-footer');

                if (khuonDuc) {

                    const noiDungFooter = khuonDuc.innerHTML;

                    document.querySelectorAll('.tab-content, .page').forEach(tab => tab.insertAdjacentHTML('beforeend', noiDungFooter));

                    if (typeof APP_VERSION !== 'undefined') {
                        const cleanVer = String(APP_VERSION).replace(/-rev\d+.*$/i, '').trim();
                        document.querySelectorAll('#app-footer-version, [id="app-footer-version"]').forEach(el => {
                            el.textContent = `PhiÃªn báº£n: ${cleanVer}`;
                        });
                    }
                }

            } catch (err) { console.warn("Lá»—i khi bÆ¡m Footer:", err); }



            // Pháº§n 2: Chuyá»ƒn Tab

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
                            console.warn("KhÃ´ng tÃ¬m tháº¥y tab:", targetTab);
                        }



                        // Toggle class lÃªn body Ä‘á»ƒ CSS Ä‘iá»u chá»‰nh layout riÃªng cho tá»«ng tab

                        document.body.classList.toggle('tab-sat-active', targetTab === 'tab-sat');

                        document.body.classList.toggle('tab-schedule-active', targetTab === 'tab-schedule');



                        // CÃ¡c lá»‡nh gá»i dá»¯ liá»‡u riÃªng cho tá»«ng Tab

                        if (targetTab === 'tab-sat' && typeof satCache !== 'undefined' && Object.keys(satCache).length === 0) {

                            if (typeof taiDsSat === 'function') taiDsSat();

                        }

                        if (targetTab === 'tab-home' || targetTab === 'page-dashboard') {

                            if (typeof loadDashboard === 'function') loadDashboard();

                        }



                        // ðŸ”¥ ÄOáº N FIX CHá»NG Lá»–I NHáº¢Y TRANG CHO TAB Xáº¾P Lá»ŠCH:

                        if (targetTab === 'tab-schedule') {

                            if (typeof schedCurrentPage !== 'undefined') schedCurrentPage = 1; // LuÃ´n quay vá» trang 1

                            if (typeof loadScheduleList === 'function') loadScheduleList(); // KÃ­ch hoáº¡t táº£i láº¡i dá»¯ liá»‡u tá»« Sheet & ngáº¯t trang

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

                        if (targetTab === 'tab-utils') {
                            const utilsDateEl = document.getElementById('utils-search-date');
                            if (utilsDateEl && !utilsDateEl.value) {
                                const todayStr = new Date().toISOString().slice(0, 10);
                                utilsDateEl.value = todayStr;
                                if (utilsDateEl._flatpickr) utilsDateEl._flatpickr.setDate(todayStr, false);
                            }
                            if (typeof taiLichTheoNgay === 'function' && !window.utilsScheduleData) {
                                taiLichTheoNgay();
                            }
                        }

                        if (targetTab === 'tab-busy') {
                            if (typeof window.loadBusyHistoryDates === 'function') {
                                window.loadBusyHistoryDates();
                            }
                        }

                        // Cáº­p nháº­t URL hash Ä‘á»ƒ há»— trá»£ chia sáº» / má»Ÿ trá»±c tiáº¿p tab
                        window.location.hash = '#' + targetTab;

                    } catch (error) { console.error("Lá»—i chuyá»ƒn tab:", error); }

                });

            });

            // Pháº§n 3: Khá»Ÿi táº¡o ngÃ y máº·c Ä‘á»‹nh vÃ  náº¡p Bootstrap
            const today = new Date();
            const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            ['schedule-date', 'busy-date-filter', 'history-date', 'dashboard-date-filter', 'utils-search-date'].forEach(id => {
                const el = document.getElementById(id);
                if (el && !el.value) el.value = todayYMD;
            });

            // Tá»± Ä‘á»™ng náº¡p trÆ°á»›c danh sÃ¡ch ngÃ y cÃ³ lá»‹ch sá»­ báº­n
            setTimeout(() => {
                if (typeof window.loadBusyHistoryDates === 'function') {
                    window.loadBusyHistoryDates();
                }
            }, 600);

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

            // Khá»Ÿi Ä‘á»™ng Context Menu vÃ  URL Hash Router
            if (typeof initTabContextMenu === 'function') initTabContextMenu();
            if (typeof handleInitialUrlTab === 'function') handleInitialUrlTab();

            // Khá»Ÿi Ä‘á»™ng náº¡p dá»¯ liá»‡u Bootstrap (All-in-One + Offline Cache)
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
        // ðŸŒ TAB CONTEXT MENU & DEEP-LINKING (Má»ž TRONG TAB Má»šI)
        // ============================================================
        let _currentContextTabId = null;
        let _currentContextTabName = '';

        function initTabContextMenu() {
            const menu = document.getElementById('tab-context-menu');
            if (!menu) return;

            document.querySelectorAll('.nav-tab, .nav-item').forEach(tab => {
                // Click chuá»™t pháº£i
                tab.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    _currentContextTabId = tab.getAttribute('data-tab') || 'tab-home';
                    const textEl = tab.querySelector('.text');
                    _currentContextTabName = textEl ? textEl.innerText.trim() : (tab.innerText || 'Tab').trim();

                    const titleEl = document.getElementById('tab-context-title');
                    if (titleEl) titleEl.innerText = `ðŸ“Œ ${_currentContextTabName}`;

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

                // Há»— trá»£ Middle Click (Click con lÄƒn chuá»™t) hoáº·c Ctrl+Click / Cmd+Click Ä‘á»ƒ má»Ÿ Tab má»›i
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

            // áº¨n context menu khi click ra ngoÃ i hoáº·c cuá»™n
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
                    if (typeof window.showToast === 'function') window.showToast(`ðŸ“‹ ÄÃ£ sao chÃ©p liÃªn káº¿t Tab: ${targetUrl}`);
                }).catch(() => {
                    prompt('Sao chÃ©p liÃªn káº¿t Tab táº¡i Ä‘Ã¢y:', targetUrl);
                });
            } else {
                prompt('Sao chÃ©p liÃªn káº¿t Tab táº¡i Ä‘Ã¢y:', targetUrl);
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
        // ðŸš€ ALL-IN-ONE BOOTSTRAP DATA & OFFLINE-FIRST CACHE
        // ============================================================

        function applySystemSettings(res) {
            if (!res) res = {};
            const chotSoEl = document.getElementById("admin-chotso-time");
            if (chotSoEl) {
                if (res.chotSoTime !== undefined && res.chotSoTime !== null && String(res.chotSoTime).trim() !== "") {
                    chotSoEl.value = (typeof normalizeTimeHHMM === 'function') ? normalizeTimeHHMM(res.chotSoTime) : String(res.chotSoTime).trim();
                } else if (!chotSoEl.value) {
                    chotSoEl.value = "16:20";
                }
            }

            const yhctLunchEl = document.getElementById("admin-yhct-lunch");
            if (yhctLunchEl) {
                if (res.yhctLunch !== undefined && res.yhctLunch !== null && String(res.yhctLunch).trim() !== "") {
                    yhctLunchEl.value = String(res.yhctLunch).trim();
                } else if (!yhctLunchEl.value) {
                    yhctLunchEl.value = "5";
                }
            }

            const yhctEndEl = document.getElementById("admin-yhct-end");
            if (yhctEndEl) {
                if (res.yhctEnd !== undefined && res.yhctEnd !== null && String(res.yhctEnd).trim() !== "") {
                    yhctEndEl.value = String(res.yhctEnd).trim();
                } else if (!yhctEndEl.value) {
                    yhctEndEl.value = "5";
                }
            }

            const dropWeightEl = document.getElementById("admin-weight-drop");
            if (dropWeightEl) {
                if (res.dropWeight !== undefined && res.dropWeight !== null && String(res.dropWeight).trim() !== "") {
                    dropWeightEl.value = String(res.dropWeight).trim();
                } else if (!dropWeightEl.value) {
                    dropWeightEl.value = "10000";
                }
            }

            const overtimeWeightEl = document.getElementById("admin-weight-overtime");
            if (overtimeWeightEl) {
                if (res.overtimeWeight !== undefined && res.overtimeWeight !== null && String(res.overtimeWeight).trim() !== "") {
                    overtimeWeightEl.value = String(res.overtimeWeight).trim();
                } else if (!overtimeWeightEl.value) {
                    overtimeWeightEl.value = "2";
                }
            }

            const imbalanceWeightEl = document.getElementById("admin-weight-imbalance");
            if (imbalanceWeightEl) {
                if (res.imbalanceWeight !== undefined && res.imbalanceWeight !== null && String(res.imbalanceWeight).trim() !== "") {
                    imbalanceWeightEl.value = String(res.imbalanceWeight).trim();
                } else if (!imbalanceWeightEl.value) {
                    imbalanceWeightEl.value = "0.1";
                }
            }
            
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
                    console.error("Lá»—i Ä‘á»“ng bá»™ cáº¥u hÃ¬nh nháº¯c sao lÆ°u:", e);
                }
            }

            // Äá»“ng bá»™ phÃ¡c Ä‘á»“ tá»« Server Settings
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
                    console.error("Lá»—i Ä‘á»“ng bá»™ phÃ¡c Ä‘á»“ tá»« server:", e);
                }
            }

            // ðŸ¤– Äá»“ng bá»™ mÃ´ hÃ¬nh AI tá»« CSDL Cloudflare D1 (náº¿u cÃ³)
            if (res.ai_learned_model) {
                try {
                    const m = typeof res.ai_learned_model === 'string' ? JSON.parse(res.ai_learned_model) : res.ai_learned_model;
                    if (m && window.AIScheduler && typeof window.AIScheduler.setModel === 'function') {
                        window.AIScheduler.setModel(m, true, false);
                    }
                } catch(e) {
                    console.warn('[AI] Lá»—i phá»¥c há»“i mÃ´ hÃ¬nh tá»« Cloud:', e);
                }
            }

            // â° Äá»“ng bá»™ cáº¥u hÃ¬nh tá»± Ä‘á»™ng há»c AI
            if (res.ai_auto_train_config) {
                try {
                    const cfg = typeof res.ai_auto_train_config === 'string' ? JSON.parse(res.ai_auto_train_config) : res.ai_auto_train_config;
                    if (cfg) {
                        localStorage.setItem('ai_auto_train_enable', cfg.enable ?? '1');
                        localStorage.setItem('ai_auto_train_time', cfg.time || '17:00');
                    }
                } catch(e) {}
            }

            if (typeof window.renderAISettingsUI === 'function') {
                window.renderAISettingsUI();
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
                        // PhÃ¢n láº­p: tuyá»‡t Ä‘á»‘i khÃ´ng náº¡p cache cá»§a Ä‘Æ¡n vá»‹ khÃ¡c
                        const bUnit = (b.unit_code || b.unit || '').toLowerCase();
                        if (bUnit && bUnit !== curUnit) {
                            return;
                        }

                        // âœ… TÃ­nh ngÃ y hÃ´m nay theo mÃºi giá» VN (UTC+7)
                        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
                        const todayYMD = `${nowVN.getUTCFullYear()}-${String(nowVN.getUTCMonth() + 1).padStart(2, '0')}-${String(nowVN.getUTCDate()).padStart(2, '0')}`;
                        const dd = String(nowVN.getUTCDate()).padStart(2, '0');
                        const mm = String(nowVN.getUTCMonth() + 1).padStart(2, '0');
                        const todaySlash = `${dd}/${mm}/${nowVN.getUTCFullYear()}`; // VD: 21/08/2026

                        // Kiá»ƒm tra lá»‹ch trong cache cÃ³ pháº£i cá»§a ngÃ y hÃ´m nay khÃ´ng
                        let scheduleIsStale = false;
                        if (b.schedule && Array.isArray(b.schedule) && b.schedule.length > 0) {
                            const firstSched = b.schedule[0];
                            const rawDate = Array.isArray(firstSched) ? firstSched[0] : (firstSched?.ngay || firstSched?.NGAY || firstSched?.date || firstSched?.Date || '');
                            const toYMD_check = (s) => {
                                if (!s) return '';
                                const str = String(s).trim();
                                if (str.includes('/')) {
                                    const p = str.split('/');
                                    return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
                                }
                                return str;
                            };
                            const schedDateYMD = toYMD_check(rawDate);
                            if (schedDateYMD && schedDateYMD !== todayYMD) {
                                scheduleIsStale = true;
                            }
                        }

                        if (scheduleIsStale) {
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
                            let cacheHasCorruptedName = false;
                            b.patients.forEach((pt, i) => {
                                if (pt) {
                                    pt.sheetIndex = i;
                                    if (pt.ten) {
                                        const healed = healPatientName(pt.ten);
                                        if (healed !== pt.ten) {
                                            pt.ten = healed;
                                            cacheHasCorruptedName = true;
                                        }
                                    }
                                    if (pt.name) {
                                        const healed = healPatientName(pt.name);
                                        if (healed !== pt.name) {
                                            pt.name = healed;
                                            cacheHasCorruptedName = true;
                                        }
                                    }
                                }
                            });
                            if (cacheHasCorruptedName) {
                                try { localStorage.setItem(cacheKey, JSON.stringify(b)); } catch(e) {}
                                cacheIsStale = true;
                            }
                            dataCache.pat = b.patients.filter(pt => pt && pt.ten);
                            if (typeof renderPatientsTable === 'function') renderPatientsTable();
                        } else {
                            dataCache.pat = [];
                        }
                        // Náº¡p phÃ¡c Ä‘á»“ tá»« cache hoáº·c cÃ i Ä‘áº·t mÃ¡y chá»§
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
                            if (typeof dataCache !== 'undefined') dataCache.settings = b.settings;
                            if (window.dataCache) window.dataCache.settings = b.settings;
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
                console.warn('[Offline Cache] Lá»—i Ä‘á»c dá»¯ liá»‡u cá»¥c bá»™:', e);
            }
        }

        function loadBootstrapData(forceRefresh = false) {
            const sessionStr = localStorage.getItem('meds_session');
            const curUnit = getCurrentUnitCode();
            if (!sessionStr || !curUnit) {
                console.log('[Bootstrap] ChÆ°a Ä‘Äƒng nháº­p hoáº·c chÆ°a chá»n Ä‘Æ¡n vá»‹, bá» qua náº¡p dá»¯ liá»‡u.');
                return;
            }

            if (!forceRefresh) {
                restoreOfflineCache();
            }

            google.script.run
                .withSuccessHandler(function (b) {
                    if (!b) return;

                    // ðŸ›¡ï¸ Tá»± Ä‘á»™ng chá»¯a lÃ nh há» tÃªn bá»‡nh nhÃ¢n vÃ  lá»‹ch trÃ¬nh trÆ°á»›c khi lÆ°u cache
                    if (b.patients && Array.isArray(b.patients)) {
                        b.patients.forEach((pt, i) => {
                            if (pt) {
                                pt.sheetIndex = i;
                                if (pt.ten) pt.ten = healPatientName(pt.ten);
                                if (pt.name) pt.name = healPatientName(pt.name);
                            }
                        });
                    }
                    if (b.schedule && Array.isArray(b.schedule)) {
                        b.schedule.forEach(sc => {
                            if (sc) {
                                if (sc.tenBN) sc.tenBN = healPatientName(sc.tenBN, [], true);
                                if (Array.isArray(sc) && sc[1]) sc[1] = healPatientName(sc[1], [], true);
                            }
                        });
                    }

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
                            if (b.schedule.length === 0) {
                                // Server xÃ¡c nháº­n hÃ´m nay chÆ°a cÃ³ lá»‹ch (ngÃ y má»›i hoáº·c Ä‘Ã£ chá»‘t sá»•), dá»n sáº¡ch cache local
                                const curUnit = getCurrentUnitCode();
                                const uKey = (base) => (typeof getUnitStorageKey === 'function') ? getUnitStorageKey(base) : (curUnit ? `${curUnit}_${base}` : base);
                                localStorage.removeItem(uKey('meds_success'));
                                localStorage.removeItem(uKey('meds_schedule_date'));
                                localStorage.removeItem(uKey('meds_unscheduled'));
                                localStorage.removeItem('meds_success');
                                localStorage.removeItem('meds_schedule_date');
                                localStorage.removeItem('meds_unscheduled');
                                localStorage.removeItem('meds_schedule_unit');
                            }
                            if (b.is_finalized_today) {
                                window._todayIsFinalized = true;
                                window._finalizedTodayCount = b.finalized_today_count || 0;
                                const countInfo = window._finalizedTodayCount ? ` (${window._finalizedTodayCount} ca)` : '';
                                const displayEl = document.getElementById('display-date');
                                if (displayEl) {
                                    displayEl.innerHTML = `<span style="color:#b45309; background:#fef3c7; padding:2px 8px; border-radius:6px; font-weight:700;">ðŸ“‹ HÃ´m nay (ÄÃ£ chá»‘t sá»•${countInfo})</span>`;
                                }
                                const statusEl = document.getElementById('utils-lich-status');
                                if (statusEl) {
                                    statusEl.innerText = `ðŸ“‹ HÃ´m nay (ÄÃ£ chá»‘t sá»•${countInfo})`;
                                    statusEl.style.color = '#b45309';
                                }
                            } else {
                                window._todayIsFinalized = false;
                                window._finalizedTodayCount = 0;
                            }
                        } else {
                            dataCache.schedule = [];
                            window.currentScheduleData = [];
                            window._todayIsFinalized = false;
                            window._finalizedTodayCount = 0;
                            const curUnit = getCurrentUnitCode();
                            const uKey = (base) => (typeof getUnitStorageKey === 'function') ? getUnitStorageKey(base) : (curUnit ? `${curUnit}_${base}` : base);
                            localStorage.removeItem(uKey('meds_success'));
                            localStorage.removeItem(uKey('meds_schedule_date'));
                            localStorage.removeItem(uKey('meds_unscheduled'));
                            localStorage.removeItem('meds_success');
                            localStorage.removeItem('meds_schedule_date');
                            localStorage.removeItem('meds_unscheduled');
                            localStorage.removeItem('meds_schedule_unit');
                        }
                        if (typeof loadScheduleList === 'function') loadScheduleList();

                        if (b && Array.isArray(b.patients)) {
                            dataCache.pat = b.patients.filter(pt => pt && pt.ten);
                        } else {
                            dataCache.pat = [];
                        }
                        if (typeof renderPatientsTable === 'function') renderPatientsTable();

                        // Äá»“ng bá»™ phÃ¡c Ä‘á»“ má»›i nháº¥t tá»« mÃ¡y chá»§ (Cloudflare D1)
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
                        if (typeof dataCache !== 'undefined') dataCache.settings = b.settings;
                        if (window.dataCache) window.dataCache.settings = b.settings;
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
                                : '<li><a href="#"><span class="f-icon">âš ï¸</span> ChÆ°a cÃ³ liÃªn káº¿t nÃ o</a></li>';
                            uls.forEach(ul => { ul.innerHTML = htmlContent; });
                        }
                    }

                    if (typeof updateStats === 'function') updateStats();
                    if (typeof renderScheduleCalendar === 'function') renderScheduleCalendar();
                    if (typeof loadDashboard === 'function') loadDashboard();

                    if (!window._systemReadyLogged) {
                        window._systemReadyLogged = true;
                        console.log('âœ… Há»‡ thá»‘ng T.I.M.E.S Ä‘Ã£ táº£i vÃ  Ä‘á»“ng bá»™ dá»¯ liá»‡u thÃ nh cÃ´ng! Sáºµn sÃ ng hoáº¡t Ä‘á»™ng.');
                    }
                })
                .withFailureHandler(function (err) {
                    if (!window._systemReadyLogged) {
                        window._systemReadyLogged = true;
                        console.log('âœ… Há»‡ thá»‘ng T.I.M.E.S Ä‘Ã£ sáºµn sÃ ng hoáº¡t Ä‘á»™ng (Cháº¿ Ä‘á»™ ngoáº¡i tuyáº¿n).');
                    }
                    console.warn('[Bootstrap API] MÃ¡y chá»§ báº­n, Ä‘ang sá»­ dá»¥ng dá»¯ liá»‡u Ä‘Ã£ lÆ°u trong mÃ¡y:', err);
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

        // ðŸš€ HÃ€M LÃ•I: Táº¢I Dá»® LIá»†U ÄA NÄ‚NG (Báº¢N FIX TRIá»†T Äá»‚ Lá»–I THAM Sá»)

        // =================================================================

        window.dataCacheTime = window.dataCacheTime || {};



        function loadEntity(apiMethod, cacheKey, callback, extraCallbacks = [], forceRefresh = false) {
            const CACHE_TTL = 5 * 60 * 1000; // LÆ°u Cache 5 phÃºt
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
                                const trangThai = String(item.trangThai || item.trang_thai || (Array.isArray(item) ? item[3] : '') || 'Sáºµn sÃ ng').trim();
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
                                if (!item.trangThai) item.trangThai = "Äi lÃ m";
                                if (!item.gioBan) item.gioBan = "";
                                if (!item.kyNang) item.kyNang = "";
                                if (!item.quyen) item.quyen = item.system || item.he || "PHCN";
                                if (!item.nguoiThayThe) item.nguoiThayThe = "KhÃ´ng";
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
                    console.error("âŒ Lá»—i táº£i [" + cacheKey + "]:", e);
                    callbacks.forEach(cb => cb());
                })
            [apiMethod]();
        }

        function triggerDataRefresh(btn) {
            const origText = btn.innerText;
            btn.disabled = true;
            btn.innerText = "â³ ÄANG Äá»’NG Bá»˜...";
            if (window.showGlobalLoading) window.showGlobalLoading("Äang táº£i dá»¯ liá»‡u tá»« Google Sheets...");

            window.dataCacheTime = {}; // XÃ³a cache time

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
                    window.showToast("âŒ Lá»—i táº£i dá»¯ liá»‡u: " + err, "error", 5000);
                } else {
                    alert("âŒ Lá»—i táº£i dá»¯ liá»‡u: " + err);
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

        // ðŸ“‹ CANCEL EDIT (Form reset)

        // ============================================================

        function cancelEdit(type) {

            editIndex[type] = -1;

            document.querySelectorAll(`.tab-content.active .sidebar-form input[type="text"]:not([readonly]), .tab-content.active .sidebar-form input[type="number"], .tab-content.active .sidebar-form textarea:not([readonly])`).forEach(i => i.value = '');

            document.querySelectorAll(`.tab-content.active .sidebar-form input[type="checkbox"]`).forEach(c => c.checked = false);



            const configs = {

                machine: () => { document.getElementById('group-qty').style.display = 'flex'; document.getElementById('btn-save-machine').innerText = "ThÃªm"; document.getElementById('btn-cancel-machine').style.display = "none"; },

                proc: () => { 
                    document.getElementById('btn-save-proc').innerText = "ThÃªm"; 
                    document.getElementById('btn-cancel-proc').style.display = "none"; 
                    document.getElementById('proc-system').value = 'YHCT'; 
                    document.getElementById('proc-category').value = 'ChÆ°a phÃ¢n loáº¡i'; 
                    document.getElementById('proc-machine').value = 'Thá»§ cÃ´ng'; 
                    if (document.getElementById('proc-continuous-cb')) document.getElementById('proc-continuous-cb').checked = false;
                },

                staff: () => { document.getElementById('btn-save-staff').innerText = "ThÃªm"; document.getElementById('btn-cancel-staff').style.display = "none"; document.getElementById('staff-quyen').value = 'Cáº£ hai'; document.getElementById('staff-role').value = 'BÃ¡c sÄ©'; document.getElementById('staff-status').value = 'Äi lÃ m'; },

                room: () => { document.getElementById('btn-save-room').innerText = "ThÃªm"; document.getElementById('btn-cancel-room').style.display = "none"; },

                proto: () => {
                    const btnSave = document.getElementById('btn-save-proto');
                    const btnCancel = document.getElementById('btn-cancel-proto');
                    const nameInput = document.getElementById('proto-name');
                    if (btnSave) btnSave.innerText = "âž• ThÃªm PhÃ¡c Äá»“";
                    if (btnCancel) btnCancel.style.display = "none";
                    if (nameInput) nameInput.value = '';
                    document.querySelectorAll('.proto-proc-cb').forEach(c => c.checked = false);
                    if (typeof updateProtoSelectedCount === 'function') updateProtoSelectedCount();
                },

                pat: () => {

                    document.getElementById('btn-save-pat').innerText = "ThÃªm";

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
                    document.querySelectorAll('.pat-proc-cb-extra-container, .extra-proc-item').forEach(el => el.remove());

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
                return 7 * 60 + 30; // 07:30 máº·c Ä‘á»‹nh
            }
            const parts = gStr.split(':');
            const h = parseInt(parts[0], 10) || 0;
            const m = parseInt(parts[1], 10) || 0;
            return h * 60 + m;
        }

        // ============================================================

        // âš™ï¸ 1. MÃY MÃ“C

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
                procMachineSelect.innerHTML = '<option>Thá»§ cÃ´ng</option>' + types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
                searchMachineSelect.innerHTML = '<option>Chá»n loáº¡i mÃ¡y</option>' + types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
            }

            if (!dataCache.machine.length) { tbody.innerHTML = renderEmptyRow(5, 'ChÆ°a cÃ³ thiáº¿t bá»‹'); return; }

            tbody.innerHTML = dataCache.machine.map((item, i) => {
                const idx = dataCache.machine.indexOf(item);
                const ten = String(item.tenLoai || item[1] || '').trim();
                const ma = String(item.maMay || item[2] || '').trim();
                const tt = item.trangThai || item[3] || '';
                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" data-machine-index="${idx}" onclick="if(!window._isDraggingRow) editRoomMachine(parseInt(this.dataset.machineIndex))" title="Báº¥m sá»­a (KÃ©o tháº£ nÃºt â˜° hoáº·c báº¥m â–²/â–¼ Ä‘á»ƒ Ä‘á»•i thá»© tá»±, PhÃ­m Delete Ä‘á»ƒ xÃ³a)">
            <td>${renderSttOrderControl("machines", i, dataCache.machine.length)}</td>
            <td><b>${ten}</b></td>
            <td><span class="badge badge-info">${ma}</span></td>
            <td><span class="status-badge ${tt === 'Sáºµn sÃ ng' ? 'status-ready' : 'status-busy'}">${tt}</span></td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteMachine(${idx})">XÃ³a</button></td>
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

            if (!t || !c) return alert("Äiá»n tÃªn vÃ  mÃ£ mÃ¡y!");

            if (editIndex.machine > -1) {
                const oldItem = dataCache.machine[editIndex.machine];
                const oldMaMay = oldItem ? String(oldItem.maMay || oldItem.ma_may || (Array.isArray(oldItem) ? oldItem[2] : '') || '').trim() : '';
                const oldId = oldItem ? oldItem.id : null;

                dataCache.machine[editIndex.machine] = { id: oldId, tenLoai: t, maMay: c, trangThai: s };

                google.script.run.editMayMoc({
                    index: editIndex.machine,
                    oldMaMay: oldMaMay,
                    id: oldId,
                    tenLoai: t,
                    maMay: c,
                    trangThai: s
                }, editIndex.machine, t, c, s, oldMaMay);

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
            const trangThai = item.trangThai || item.trang_thai || (Array.isArray(item) ? item[3] : '') || 'Sáºµn sÃ ng';

            document.getElementById('machine-type').value = tenLoai;

            document.getElementById('machine-code').value = maMay;

            document.getElementById('machine-status').value = trangThai;

            document.getElementById('group-qty').style.display = 'none';

            document.getElementById('btn-save-machine').innerText = "LÆ°u Sá»­a";

            document.getElementById('btn-cancel-machine').style.display = "inline-block";

        }

        function deleteMachine(i) {
            showCustomConfirm("XÃ¡c nháº­n xÃ³a mÃ¡y", "BÃ¡c sÄ© cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a mÃ¡y nÃ y?", function () {
                const targetMachine = dataCache.machine ? dataCache.machine[i] : null;
                const maMay = targetMachine ? String(targetMachine.maMay || targetMachine.ma_may || (Array.isArray(targetMachine) ? targetMachine[2] : '') || targetMachine.ma || '').trim() : '';
                const machineId = targetMachine ? (targetMachine.id || null) : null;

                dataCache.machine.splice(i, 1);
                renderMachinesTable();

                google.script.run
                    .withSuccessHandler(() => {
                        if (typeof window.showToast === 'function') window.showToast('ÄÃ£ xÃ³a mÃ¡y mÃ³c thÃ nh cÃ´ng!', 'success');
                    })
                    .withFailureHandler(e => {
                        alert('Lá»—i khi xÃ³a mÃ¡y: ' + e);
                        if (typeof loadMachines === 'function') loadMachines();
                    }).deleteMayMoc({ maMay, id: machineId, index: i }, maMay, machineId);
            });
        }

        function renderDynamicMachineInputs() {

            const container = document.getElementById('dynamic-machine-inputs');

            if (!container) return;

            if (!dataCache.machine || !Array.isArray(dataCache.machine) || dataCache.machine.length === 0) {
                container.innerHTML = '<div style="color:#7f8c8d; font-style:italic; grid-column:span 2;">ChÆ°a cÃ³ loáº¡i mÃ¡y trong kho</div>';
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
                container.innerHTML = '<div style="color:#7f8c8d; font-style:italic; grid-column:span 2;">ChÆ°a cÃ³ loáº¡i mÃ¡y trong kho</div>';
                return;
            }

            container.innerHTML = typeList.map(type => `

        <div style="display:flex; justify-content:space-between; align-items:center" title="${escapeHtml(type)}">

            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px; text-transform:capitalize;">${escapeHtml(type)}</span>:

            <input type="number" class="room-machine-input" data-type="${escapeHtml(type.toLowerCase().trim())}" min="0" style="width:40px; padding:2px">

        </div>`).join('');

        }



        // ============================================================
        // ðŸŽ¯ DYNAMIC CLINICAL PROTOCOLS ENGINE (Quáº£n lÃ½ PhÃ¡c Ä‘á»“ RiÃªng)
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

            // Láº¯ng nghe sá»± kiá»‡n Ä‘á»“ng bá»™ thá»i gian thá»±c tá»« cÃ¡c Tab khÃ¡c
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

        // Render danh sÃ¡ch checkbox thá»§ thuáº­t trá»±c tiáº¿p trong Form bÃªn trÃ¡i cá»§a PhÃ¡c Ä‘á»“
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
                const isYhct = heUpper === 'YHCT' || heUpper.includes('Cá»” TRUYá»€N') || heUpper.includes('ÄÃ”NG Y');
                
                const cbHtml = `<label class="checkbox-item proto-proc-item" data-name="${escapedTen.toLowerCase()}" style="font-size:11.5px; padding:3px 6px; margin-bottom:3px; display:flex; align-items:center; gap:6px; cursor:pointer; border-radius:4px; border:1px solid #cbd5e1;">
                    <input type="checkbox" class="proto-proc-cb" data-he="${isYhct ? 'YHCT' : 'PHCN'}" value="${escapedTen}" onchange="updateProtoSelectedCount()" style="width:15px; height:15px; margin:0; cursor:pointer; flex-shrink:0;">
                    <span class="proto-proc-name" style="font-size:11.5px; line-height:1.2; user-select:none;">${escapedTen}</span>
                </label>`;

                if (isYhct) yhctHtml += cbHtml;
                else phcnHtml += cbHtml;
            });

            yhctBox.innerHTML = yhctHtml || '<em style="color:#94a3b8; font-size:11px;">ChÆ°a cÃ³ thá»§ thuáº­t YHCT</em>';
            phcnBox.innerHTML = phcnHtml || '<em style="color:#94a3b8; font-size:11px;">ChÆ°a cÃ³ thá»§ thuáº­t PHCN</em>';
            updateProtoSelectedCount();
        }
        window.renderProtoProcsFormCheckboxes = renderProtoProcsFormCheckboxes;

        function updateProtoSelectedCount() {
            const badge = document.getElementById('proto-selected-count-badge');
            const count = document.querySelectorAll('.proto-proc-cb:checked').length;
            if (badge) {
                badge.innerText = `${count} Ä‘Ã£ chá»n`;
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
                        window.showToast(`â˜ï¸ ÄÃ£ Ä‘á»“ng bá»™ ${list.length} phÃ¡c Ä‘á»“ vÃ o Cloudflare D1 thÃ nh cÃ´ng!`);
                    }
                }, err => {
                    if (showToastMsg && typeof window.showToast === 'function') {
                        window.showToast('âš ï¸ Lá»—i Ä‘á»“ng bá»™ Ä‘Ã¡m mÃ¢y: ' + err, 'error');
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

            // 1. LÆ°u localStorage
            try {
                localStorage.setItem('meds_protocols', JSON.stringify(newList));
            } catch (e) {}

            // 2. Cáº­p nháº­t trá»±c tiáº¿p vÃ o times_bootstrap_cache
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

            // 3. LÆ°u vÃ o IndexedDB Dexie Cache
            if (typeof window.OfflineSyncEngine !== 'undefined') {
                if (typeof window.OfflineSyncEngine.saveCache === 'function') {
                    window.OfflineSyncEngine.saveCache('protocols', newList);
                }
                if (typeof window.OfflineSyncEngine.broadcastLiveEvent === 'function') {
                    window.OfflineSyncEngine.broadcastLiveEvent('PROTOCOLS_UPDATED', { protocols: newList, count: newList.length });
                }
            }

            // 4. Äá»“ng bá»™ lÃªn Cloudflare D1 Backend
            syncProtocolsToCloud(false);

            // 5. Cáº­p nháº­t giao diá»‡n báº£ng vÃ  dropdown chá»n phÃ¡c Ä‘á»“
            renderProtocolsTable();
            renderProtocolSelectOptions();
        }
        window.saveProtocolsData = saveProtocolsData;

        // LÆ°u / Cáº­p nháº­t phÃ¡c Ä‘á»“ tá»« Sidebar Form bÃªn trÃ¡i
        function saveProtocolFromForm() {
            const nameInput = document.getElementById('proto-name');
            const name = (nameInput ? nameInput.value : '').trim();

            if (!name) {
                if (typeof window.showToast === 'function') window.showToast('âš ï¸ Vui lÃ²ng nháº­p tÃªn phÃ¡c Ä‘á»“ Ä‘iá»u trá»‹!', 'warning');
                else alert('Vui lÃ²ng nháº­p tÃªn phÃ¡c Ä‘á»“ Ä‘iá»u trá»‹!');
                if (nameInput) nameInput.focus();
                return;
            }

            const checkedCbs = Array.from(document.querySelectorAll('.proto-proc-cb:checked'));
            const selectedProcs = checkedCbs.map(cb => (cb.value || '').trim()).filter(Boolean);

            if (!selectedProcs.length) {
                if (typeof window.showToast === 'function') window.showToast('âš ï¸ Vui lÃ²ng chá»n Ã­t nháº¥t 1 thá»§ thuáº­t cho phÃ¡c Ä‘á»“!', 'warning');
                else alert('Vui lÃ²ng chá»n Ã­t nháº¥t 1 thá»§ thuáº­t cho phÃ¡c Ä‘á»“!');
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
                window.showToast(`âœ… ÄÃ£ lÆ°u phÃ¡c Ä‘á»“: "${name}" (${selectedProcs.length} thá»§ thuáº­t)`);
            }
        }
        window.saveProtocolFromForm = saveProtocolFromForm;

        // Náº¡p phÃ¡c Ä‘á»“ vÃ o Sidebar Form bÃªn trÃ¡i Ä‘á»ƒ chá»‰nh sá»­a
        function editProtocol(index) {
            editIndex.proto = index;
            const currentList = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : ((typeof dataCache !== 'undefined' && dataCache.protocols) ? dataCache.protocols : []);
            if (index < 0 || index >= currentList.length) return;
            const target = currentList[index];

            // Äáº£m báº£o danh sÃ¡ch checkbox thá»§ thuáº­t Ä‘Ã£ Ä‘Æ°á»£c render
            if (!document.querySelectorAll('.proto-proc-cb').length) {
                renderProtoProcsFormCheckboxes();
            }

            const nameInput = document.getElementById('proto-name');
            if (nameInput) nameInput.value = target.name || target.ten_phac_do || `PhÃ¡c Ä‘á»“ ${index + 1}`;

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

            // ÄÃ¡nh dáº¥u cÃ¡c checkbox
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
            if (btnSave) btnSave.innerText = "ðŸ’¾ LÆ°u Sá»­a PhÃ¡c Äá»“";
            if (btnCancel) btnCancel.style.display = "inline-block";

            // Cuá»™n nháº¹ lÃªn form trÃªn mÃ n hÃ¬nh di Ä‘á»™ng/mÃ¡y tÃ­nh
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
            const targetName = target.name || target.ten_phac_do || `PhÃ¡c Ä‘á»“ ${index + 1}`;

            const doDelete = () => {
                list.splice(index, 1);
                saveProtocolsData(list);
                if (editIndex.proto === index) cancelEdit('proto');
                if (typeof window.showToast === 'function') {
                    window.showToast(`ðŸ—‘ï¸ ÄÃ£ xÃ³a phÃ¡c Ä‘á»“: "${targetName}"`);
                }
            };

            if (typeof showCustomConfirm === 'function') {
                showCustomConfirm("XÃ¡c nháº­n xÃ³a phÃ¡c Ä‘á»“", `BÃ¡c sÄ© cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a phÃ¡c Ä‘á»“ "${targetName}" khÃ´ng?`, doDelete);
            } else if (confirm(`Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a phÃ¡c Ä‘á»“ "${targetName}" khÃ´ng?`)) {
                doDelete();
            }
        }
        window.deleteProtocol = deleteProtocol;

        function renderProtocolsTable() {
            const tbody = document.getElementById('protocols-list');
            if (!tbody) return;
            const list = (window.dataCache && window.dataCache.protocols) ? window.dataCache.protocols : ((typeof dataCache !== 'undefined' && dataCache.protocols) ? dataCache.protocols : []);
            if (!list.length) {
                tbody.innerHTML = '<tr><td colspan="4" align="center" style="color:#64748b; padding:20px; font-size:13px;">ChÆ°a cÃ³ phÃ¡c Ä‘á»“ Ä‘iá»u trá»‹ nÃ o. HÃ£y nháº­p thÃ´ng tin á»Ÿ Form bÃªn trÃ¡i Ä‘á»ƒ táº¡o phÃ¡c Ä‘á»“ má»›i.</td></tr>';
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
                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" ondblclick="editProtocol(${i})" title="Nháº¥p Ä‘Ãºp chuá»™t Ä‘á»ƒ chá»‰nh sá»­a phÃ¡c Ä‘á»“ nÃ y">
                    <td align="center">${sttHtml}</td>
                    <td>
                        <strong style="color:#1e3a8a; font-size:13px;">${escapeHtml(item.name || `PhÃ¡c Ä‘á»“ ${i + 1}`)}</strong>
                        <div style="font-size:11px; color:#64748b; margin-top:2px;">${procsArr.length} thá»§ thuáº­t</div>
                    </td>
                    <td>${procsHtml || '<em style="color:#94a3b8;">ChÆ°a chá»n thá»§ thuáº­t</em>'}</td>
                    <td align="center">
                        <button type="button" class="btn btn-primary btn-sm" onclick="editProtocol(${i})" style="margin-right:4px; font-size:11px; padding:3px 8px; cursor:pointer;" title="Sá»­a phÃ¡c Ä‘á»“">âœï¸ Sá»­a</button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteProtocol(${i})" style="font-size:11px; padding:3px 8px; cursor:pointer;" title="XÃ³a phÃ¡c Ä‘á»“">ðŸ—‘ï¸ XÃ³a</button>
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
            
            let optionsHtml = '<option value="">-- Chá»n PhÃ¡c Ä‘á»“ --</option>';
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
                optionsHtml += `<option value="${i}">${escapeHtml(item.name || `PhÃ¡c Ä‘á»“ ${i + 1}`)}: ${escapeHtml(procsSummary)}</option>`;
            });
            sel.innerHTML = optionsHtml;
        }
        window.renderProtocolSelectOptions = renderProtocolSelectOptions;

        function clearSelectedProcs() {
            document.querySelectorAll('.pat-proc-cb').forEach(cb => { cb.checked = false; });
            document.querySelectorAll('.pat-proc-cb-extra-container, .extra-proc-item').forEach(el => el.remove());
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

            // Bá» chá»n trÆ°á»›c khi Ã¡p dá»¥ng
            document.querySelectorAll('.pat-proc-cb').forEach(cb => { cb.checked = false; });
            document.querySelectorAll('.pat-proc-cb-extra-container, .extra-proc-item').forEach(el => el.remove());

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
                window.showToast(`ðŸŽ¯ ÄÃ£ Ã¡p dá»¥ng: ${pObj.name} (${matchedCount} thá»§ thuáº­t)`);
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
                btn.innerHTML = 'âž– Thu Gá»n Form Nháº­p Liá»‡u';
                btn.style.background = 'linear-gradient(135deg, #475569, #334155)';
            } else {
                form.style.display = 'none';
                form.classList.add('mobile-form-collapsed');
                btn.innerHTML = 'âž• ThÃªm Má»›i / Nháº­p Liá»‡u';
                btn.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
            }
        }
        window.toggleMobileForm = toggleMobileForm;

        // ============================================================
        // ðŸ’‰ 2. THá»¦ THUáº¬T
        // ============================================================

        function toggleAllSkills(checkbox, system) {
            const container = document.getElementById(system === 'YHCT' ? 'staff-skills-yhct' : 'staff-skills-phcn');
            if (container) {
                container.querySelectorAll('.skill-checkbox').forEach(cb => cb.checked = checkbox.checked);
            }
        }

        function renderProcedureCheckboxes() {
            // ðŸ›¡ï¸ Báº¢O Vá»† CHá»NG Máº¤T THá»¦ THUáº¬T KHI Äá»’NG Bá»˜:
            // Thu tháº­p toÃ n bá»™ checkbox Ä‘ang Ä‘Æ°á»£c tÃ­ch trong DOM hiá»‡n táº¡i trÆ°á»›c khi váº½ láº¡i
            const domCheckedPatProcs = new Set();
            document.querySelectorAll('.pat-proc-cb:checked').forEach(cb => {
                if (cb.value) domCheckedPatProcs.add(cb.value.trim().toLowerCase());
            });
            const domCheckedStaffSkills = new Set();
            document.querySelectorAll('.skill-checkbox:checked').forEach(cb => {
                if (cb.value) domCheckedStaffSkills.add(cb.value.trim().toLowerCase());
            });

            let sYhct = `<h4 class="yhct">ðŸ’Š YHCT <input type="checkbox" onchange="toggleAllSkills(this, 'YHCT')" style="margin-left:8px; cursor:pointer; transform:scale(1.2);" title="Chá»n táº¥t cáº£ YHCT"></h4>`, 
                sPhcn = `<h4 class="phcn">âš™ï¸ PHCN <input type="checkbox" onchange="toggleAllSkills(this, 'PHCN')" style="margin-left:8px; cursor:pointer; transform:scale(1.2);" title="Chá»n táº¥t cáº£ PHCN"></h4>`;

            let pYhct = '<h4 class="yhct">ðŸ’Š YHCT</h4>', pPhcn = '<h4 class="phcn">âš™ï¸ PHCN</h4>';

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

            // ðŸ›¡ï¸ KhÃ´i phá»¥c ngay láº­p tá»©c cÃ¡c checkbox ngÆ°á»i dÃ¹ng Ä‘ang tÃ­ch chá»n
            if (domCheckedPatProcs.size > 0) {
                document.querySelectorAll('.pat-proc-cb').forEach(cb => {
                    if (domCheckedPatProcs.has(cb.value.trim().toLowerCase())) {
                        cb.checked = true;
                    }
                });
            }
            if (domCheckedStaffSkills.size > 0) {
                document.querySelectorAll('.skill-checkbox').forEach(cb => {
                    if (domCheckedStaffSkills.has(cb.value.trim().toLowerCase())) {
                        cb.checked = true;
                    }
                });
            }

            // ðŸ›¡ï¸ Báº¢O Vá»† CHá»NG Máº¤T THá»¦ THUáº¬T: Náº¿u Ä‘ang má»Ÿ form sá»­a bá»‡nh nhÃ¢n VÃ€ chÆ°a cÃ³ checkbox nÃ o trong DOM Ä‘Æ°á»£c tÃ­ch
            if (domCheckedPatProcs.size === 0 && typeof editIndex !== 'undefined' && editIndex.pat > -1 && window.dataCache && window.dataCache.pat && window.dataCache.pat[editIndex.pat]) {
                const curPat = window.dataCache.pat[editIndex.pat];
                const ttArr = typeof extractPatientProcedures === 'function' ? extractPatientProcedures(curPat) : (curPat.thuThuat ? curPat.thuThuat.split(',').map(t => t.trim()).filter(Boolean) : []);
                const matchedProcs = new Set();
                document.querySelectorAll('.pat-proc-cb').forEach(cb => {
                    const isM = ttArr.some(t => {
                        if (typeof matchProc === 'function' ? matchProc(t, cb.value) : (t.toLowerCase() === cb.value.toLowerCase())) {
                            matchedProcs.add(t);
                            return true;
                        }
                        return false;
                    });
                    cb.checked = isM;
                });
                const unmatched = ttArr.filter(t => !matchedProcs.has(t));
                if (unmatched.length > 0) {
                    let extraContainer = document.getElementById('pat-skills-extra');
                    if (!extraContainer) {
                        const grid = document.querySelector('.skills-grid');
                        if (grid) {
                            extraContainer = document.createElement('div');
                            extraContainer.id = 'pat-skills-extra';
                            extraContainer.className = 'skills-col pat-proc-cb-extra-container';
                            extraContainer.style.cssText = 'width: 100%; margin-top: 6px; padding: 6px 8px; background: #fff8e1; border: 1px dashed #f39c12; border-radius: 6px;';
                            grid.appendChild(extraContainer);
                        }
                    }
                    if (extraContainer) {
                        let extraHtml = '<h4 style="color:#d35400; font-size:12px; margin:0 0 4px 0; font-weight:700;">ðŸ“Œ Thá»§ thuáº­t bá»• sung / ngoÃ i danh má»¥c:</h4>';
                        unmatched.forEach(t => {
                            const escaped = escapeHtml(t);
                            extraHtml += `<label class="checkbox-item extra-proc-item" style="display:inline-flex; align-items:center; margin-right:12px; margin-bottom:4px; font-weight:600; color:#d35400;">
                                <input type="checkbox" class="pat-proc-cb pat-proc-cb-extra" value="${escaped}" checked style="accent-color:#d35400; margin-right:4px;">
                                ${escaped}
                            </label>`;
                        });
                        extraContainer.innerHTML = extraHtml;
                    }
                }
            }

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
                const isRutMay = (item.canRutMay === 'CÃ³' || item.canRutMay === 1 || item.canRutMay === '1' || item.canRutMay === true || item[9] === 'CÃ³' || item[9] === 1 || item[9] === '1');
                const isNguoiPhu = (item.canNguoiPhu === 'CÃ³' || item.canNguoiPhu === 1 || item.canNguoiPhu === '1' || item.canNguoiPhu === true || item[10] === 'CÃ³' || item[10] === 1 || item[10] === '1');
                const rutText = isRutMay ? 'CÃ³' : 'KhÃ´ng';
                const phuText = isNguoiPhu ? 'CÃ³' : 'KhÃ´ng';

                let tgThMin = parseInt(item.thoiGianThucHienMin || item.thoiGianThucHien || item[6]) || 0;
                let tgThMax = parseInt(item.thoiGianThucHienMax || item[13] || 0) || tgThMin;
                if (!tgThMax || tgThMax <= tgThMin) tgThMax = tgThMin;

                let tgMin = parseInt(item.thoiGianThuThuatMin || item.thoiGianThuThuat || item[7]) || 0;
                let tgMax = parseInt(item.thoiGianThuThuatMax || item[12] || 0) || 0;

                // Smart YHCT duration range fallback if not explicitly saved yet
                if (!tgMax || tgMax <= tgMin) {
                    const tenLower = String(item.ten || item.name || item[1] || '').toLowerCase();
                    if (tenLower.includes('Ä‘iá»‡n chÃ¢m') || tenLower === 'Ä‘c' || tenLower === 'dctb') {
                        if (tgMin === 25) tgMax = 30;
                        else if (tgMin === 30) tgMax = 35;
                    } else if (tenLower.includes('parafin') || tenLower === 'pa') {
                        if (tgMin === 20) tgMax = 25;
                    } else {
                        tgMax = tgMin;
                    }
                }

                const isLienTuc = (item.lienTuc === 'CÃ³' || item.lienTuc === 1 || item.lienTuc === '1' || item.lienTuc === true || item[14] === 'CÃ³' || item[14] === 1 || (tgThMin === tgMin && tgThMax === tgMax && tgThMin >= 10));
                const lienTucText = isLienTuc ? 'CÃ³' : 'KhÃ´ng';

                const thMinDisplay = `<span class="proc-time-single">${tgThMin} phÃºt</span>`;
                const thMaxDisplay = (tgThMax > tgThMin)
                    ? `<span class="proc-time-range-badge">${tgThMax} phÃºt</span>`
                    : `<span class="proc-time-single">${tgThMax} phÃºt</span>`;

                const minDisplay = `<span class="proc-time-single">${tgMin} phÃºt</span>`;
                const maxDisplay = (tgMax > tgMin)
                    ? `<span class="proc-time-range-badge">${tgMax} phÃºt</span>`
                    : `<span class="proc-time-single">${tgMax} phÃºt</span>`;

                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" onclick="if(!window._isDraggingRow) editProc(${idx})" title="Báº¥m sá»­a (KÃ©o tháº£ nÃºt â˜° hoáº·c báº¥m â–²/â–¼ Ä‘á»ƒ Ä‘á»•i thá»© tá»±, PhÃ­m Delete Ä‘á»ƒ xÃ³a)">
            <td>${renderSttOrderControl("procedures", i, dataCache.proc.length)}</td>
            <td>${escapeHtml(item.ten || item[1] || '')}</td>
            <td><strong>${escapeHtml(item.vietTat || item[2] || '')}</strong></td>
            <td align="center">${thMinDisplay}</td>
            <td align="center">${thMaxDisplay}</td>
            <td align="center">${minDisplay}</td>
            <td align="center">${maxDisplay}</td>
            <td>${item.khoangCach || item[8] || 0} phÃºt</td>
            <td align="center">${lienTucText}</td>
            <td align="center">${rutText}</td>
            <td align="center">${phuText}</td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteProcedure(${idx})">XÃ³a</button></td>
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
            const rut = document.getElementById('proc-unplug-cb').checked ? 'CÃ³' : 'KhÃ´ng';
            const phu = document.getElementById('proc-assist-cb').checked ? 'CÃ³' : 'KhÃ´ng';
            const lienTuc = document.getElementById('proc-continuous-cb').checked ? 'CÃ³' : 'KhÃ´ng';
            const dsPhu = (rut === 'CÃ³' || phu === 'CÃ³') ? 'Táº¥t cáº£ Äiá»u dÆ°á»¡ng' : '';

            if (!ten) return alert("Nháº­p tÃªn thá»§ thuáº­t");

            const isEdit = editIndex.proc > -1;
            const existingItem = isEdit ? dataCache.proc[editIndex.proc] : null;
            const existingHistory = existingItem ? (existingItem.lichSuDinhMuc || existingItem.history || []) : [];
            const procId = existingItem ? existingItem.id : undefined;
            const oldTen = existingItem ? (existingItem.ten || existingItem.name) : undefined;

            const obj = {
                id: procId,
                ten, vietTat: vt, he, phanLoai: loai, may,
                thoiGianThucHien: tgThucHienMin,
                thoiGianThucHienMin: tgThucHienMin,
                thoiGianThucHienMax: tgThucHienMax,
                thoiGianThuThuat: tgThuThuatMin,
                thoiGianThuThuatMin: tgThuThuatMin,
                thoiGianThuThuatMax: tgThuThuatMax,
                khoangCach: kc, canRutMay: rut, canNguoiPhu: phu, dsNguoiPhu: dsPhu,
                lienTuc: lienTuc,
                lichSuDinhMuc: existingHistory,
                history: existingHistory
            };

            if (isEdit) {
                dataCache.proc[editIndex.proc] = obj;
            } else {
                dataCache.proc.push(obj);
            }

            // Äá»“ng bá»™ ngay láº­p tá»©c vÃ o bootstrap cache trong localStorage Ä‘á»ƒ khi F5 / reload khÃ´ng bá»‹ giáº­t vá» cÅ©
            try {
                const bKey = typeof getBootstrapCacheKey === 'function' ? getBootstrapCacheKey() : 'times_bootstrap_cache';
                const bStr = localStorage.getItem(bKey);
                if (bStr) {
                    const b = JSON.parse(bStr);
                    b.procedures = dataCache.proc;
                    b.thu_thuat = dataCache.proc;
                    localStorage.setItem(bKey, JSON.stringify(b));
                }
            } catch (e) {}

            cancelEdit('proc');
            renderProceduresTable();
            renderProcedureCheckboxes();

            const actionName = isEdit ? 'editThuThuat' : 'addThuThuat';
            if (typeof callApi === 'function') {
                callApi(actionName, [
                    isEdit ? editIndex.proc : ten,
                    ten, vt, he, loai, may,
                    tgThucHienMin, tgThuThuatMin, kc, rut, phu, dsPhu,
                    tgThuThuatMax, tgThucHienMax, lienTuc,
                    JSON.stringify(existingHistory),
                    procId,
                    oldTen
                ], () => {
                    if (typeof showToastSuccess === 'function') showToastSuccess(`ÄÃ£ lÆ°u thá»§ thuáº­t "${ten}" thÃ nh cÃ´ng!`);
                    else if (typeof window.showToast === 'function') window.showToast(`ÄÃ£ lÆ°u thá»§ thuáº­t "${ten}" thÃ nh cÃ´ng!`, 'success');
                }, (err) => {
                    console.error("Lá»—i lÆ°u thá»§ thuáº­t:", err);
                    alert("Lá»—i lÆ°u thá»§ thuáº­t lÃªn mÃ¡y chá»§: " + err);
                });
            }
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

            const isRutMay = (item.canRutMay === 'CÃ³' || item.canRutMay === 1 || item.canRutMay === '1' || item.canRutMay === true || item[9] === 'CÃ³' || item[9] === 1 || item[9] === '1');
            const isNguoiPhu = (item.canNguoiPhu === 'CÃ³' || item.canNguoiPhu === 1 || item.canNguoiPhu === '1' || item.canNguoiPhu === true || item[10] === 'CÃ³' || item[10] === 1 || item[10] === '1');
            const isLienTuc = (item.lienTuc === 'CÃ³' || item.lienTuc === 1 || item.lienTuc === '1' || item.lienTuc === true || item[14] === 'CÃ³' || item[14] === 1 || (item.thoiGianThucHienMin === item.thoiGianThuThuatMin && (item.thoiGianThucHienMax || item.thoiGianThucHienMin) === (item.thoiGianThuThuatMax || item.thoiGianThuThuatMin) && item.thoiGianThucHienMin >= 10));

            document.getElementById('proc-unplug-cb').checked = isRutMay;
            document.getElementById('proc-assist-cb').checked = isNguoiPhu;
            if (document.getElementById('proc-continuous-cb')) document.getElementById('proc-continuous-cb').checked = isLienTuc;
            document.getElementById('btn-save-proc').innerText = "LÆ°u Sá»­a";
            document.getElementById('btn-cancel-proc').style.display = "inline-block";
        }

        function deleteProcedure(i) {
            const item = dataCache.proc[i];
            if (!item) return;
            const ten = String(item.ten || item.name || item[1] || '').trim();
            const procId = item.id || null;

            showCustomConfirm("XÃ¡c nháº­n xÃ³a thá»§ thuáº­t", `BÃ¡c sÄ© cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a thá»§ thuáº­t "${ten}" khÃ´ng?`, function () {
                dataCache.proc.splice(i, 1);
                renderProceduresTable();
                renderProcedureCheckboxes();

                // Äá»“ng bá»™ ngay vÃ o times_bootstrap_cache
                try {
                    const bKey = typeof getBootstrapCacheKey === 'function' ? getBootstrapCacheKey() : 'times_bootstrap_cache';
                    const bStr = localStorage.getItem(bKey);
                    if (bStr) {
                        const b = JSON.parse(bStr);
                        b.procedures = dataCache.proc;
                        b.thu_thuat = dataCache.proc;
                        localStorage.setItem(bKey, JSON.stringify(b));
                    }
                } catch(e) {}

                google.script.run
                    .withSuccessHandler(() => {
                        if (typeof showToastSuccess === 'function') showToastSuccess(`ÄÃ£ xÃ³a thá»§ thuáº­t "${ten}" thÃ nh cÃ´ng!`);
                        else if (typeof window.showToast === 'function') window.showToast(`ÄÃ£ xÃ³a thá»§ thuáº­t "${ten}" thÃ nh cÃ´ng!`, 'success');
                    })
                    .withFailureHandler(e => {
                        alert('Lá»—i xÃ³a thá»§ thuáº­t: ' + e);
                        if (typeof loadProcedures === 'function') loadProcedures();
                    }).deleteThuThuat({ ten, id: procId, index: i }, ten, procId);
            });
        }



        // ============================================================

        // ðŸ‘¨â€âš•ï¸ 3. NHÃ‚N Sá»°

        // ============================================================


        function renderStaffTable() {
            renderStaffTable_Original();
            
            // Populate the "TÃ¬m bÃ¡c sÄ© ráº£nh" filter dropdown
            const filterSelect = document.getElementById('filter-doc-name');
            if (filterSelect && dataCache.staff) {
                const currentVal = filterSelect.value;
                const docs = dataCache.staff.filter(s => {
                    const vt = String(s.vaiTro).toLowerCase();
                    return (vt.includes('bÃ¡c sÄ©') || vt.includes('ktv') || vt.includes('ká»¹ thuáº­t viÃªn')) && s.trangThai !== 'Nghá»‰ cáº£ ngÃ y';
                }).map(s => s.ten.trim());
                
                const uniqueDocs = [...new Set(docs)].sort();
                filterSelect.innerHTML = '<option value="">ðŸ” Lá»c tÃªn bÃ¡c sÄ©...</option>';
                uniqueDocs.forEach(docName => {
                    filterSelect.innerHTML += `<option value="${escapeHtml(docName)}">${escapeHtml(docName)}</option>`;
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
                return role.includes('bÃ¡c sÄ©') || role.includes('ká»¹ thuáº­t viÃªn') || role.includes('ktv') || role.includes('bs');
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
                    const isDoc = role.includes('bÃ¡c sÄ©') || role.startsWith('bs') || tenLower.startsWith('bs');
                    const isKtv = role.includes('ká»¹ thuáº­t viÃªn') || role.includes('ktv') || tenLower.startsWith('ktv');
                    
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
            if (!staffList.length) { tbody.innerHTML = renderEmptyRow(8, 'ChÆ°a cÃ³ dá»¯ liá»‡u nhÃ¢n sá»±'); return; }

            tbody.innerHTML = staffList.map((item, i) => {
                const idx = staffList.indexOf(item);
                const kyNangHienThi = getShortSkills(item.kyNang, true);
                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" data-staff-index="${idx}" onclick="if(!window._isDraggingRow) editStaff(parseInt(this.dataset.staffIndex))" style="${item.trangThai !== 'Äi lÃ m' ? 'opacity:0.5; background:#f9f9f9;' : ''}" title="Báº¥m sá»­a (KÃ©o tháº£ nÃºt â˜° hoáº·c báº¥m â–²/â–¼ Ä‘á»ƒ Ä‘á»•i thá»© tá»±, PhÃ­m Delete Ä‘á»ƒ xÃ³a)">
            <td>${renderSttOrderControl("staff", i, staffList.length)}</td>
            <td><strong>${escapeHtml(item.ten || '')}</strong></td>
            <td style="font-size:11px; max-width:100px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(item.tenHis || '')}">${escapeHtml(item.tenHis || '')}</td>
            <td><span style="color:${item.trangThai === 'Äi lÃ m' ? '#28a745' : '#dc3545'}; font-weight:600">${escapeHtml(item.trangThai || 'Äi lÃ m')}</span></td>
            <td>${escapeHtml(item.thoiGianLam || '07:30-11:30, 13:00-16:30')}</td>
            <td style="font-size:11px; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><strong>${escapeHtml(kyNangHienThi)}</strong></td>
            <td style="font-size:11px;"><strong>${item.quyen === 'Cáº£ hai' ? 'YHCT+PHCN' : escapeHtml(item.quyen || '')}</strong></td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteStaff(${idx})">XÃ³a</button></td>
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
            const quyen = document.getElementById('staff-quyen').value || 'Cáº£ hai';
            const tenHis = document.getElementById('staff-ten-his').value.trim();
            const busyEl = document.getElementById('staff-busy');
            const gioBan = busyEl ? busyEl.value.trim() : (editIndex.staff > -1 ? (dataCache.staff[editIndex.staff]?.gioBan || '') : '');
            const kyNang = Array.from(document.querySelectorAll('.skill-checkbox:checked')).map(cb => cb.value).join(', ');

            if (!ten) return alert("Nháº­p tÃªn!");

            try {
                const localHisMap = JSON.parse(localStorage.getItem('staff_his_map') || '{}');
                localHisMap[ten] = tenHis;
                localStorage.setItem('staff_his_map', JSON.stringify(localHisMap));
            } catch (e) { }

            const obj = { ten, vaiTro, trangThai, thoiGianLam: tgLam, kyNang, gioBan, nguoiThayThe: thayThe, quyen, tenHis };

            if (editIndex.staff > -1) {
                const oldItem = dataCache.staff[editIndex.staff];
                const sheetIdx = oldItem.sheetIndex !== undefined ? oldItem.sheetIndex : editIndex.staff;
                obj.sheetIndex = sheetIdx;
                obj.index = editIndex.staff;
                dataCache.staff[editIndex.staff] = obj;
                if (window.dataCacheTime) window.dataCacheTime['staff'] = Date.now();
                google.script.run
                    .withSuccessHandler(() => {
                        if (typeof window.showToast === 'function') window.showToast('ÄÃ£ lÆ°u nhÃ¢n sá»± thÃ nh cÃ´ng!', 'success');
                    })
                    .withFailureHandler((err) => {
                        alert("Lá»—i lÆ°u nhÃ¢n sá»±: " + (err.message || err));
                        if (typeof loadDashboard === 'function') loadDashboard();
                    })
                    .editNhanSu(sheetIdx, ten, vaiTro, trangThai, tgLam, kyNang, gioBan, thayThe, quyen, tenHis);
            } else {
                dataCache.staff.push(obj);
                if (window.dataCacheTime) window.dataCacheTime['staff'] = Date.now();
                google.script.run
                    .withSuccessHandler(() => {
                        if (typeof window.showToast === 'function') window.showToast('ÄÃ£ thÃªm nhÃ¢n sá»± thÃ nh cÃ´ng!', 'success');
                    })
                    .withFailureHandler((err) => {
                        alert("Lá»—i thÃªm nhÃ¢n sá»±: " + (err.message || err));
                        if (typeof loadDashboard === 'function') loadDashboard();
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

            document.getElementById('staff-quyen').value = item.quyen || 'Cáº£ hai';
            document.getElementById('staff-ten-his').value = item.tenHis || '';

            document.getElementById('staff-busy').value = item.gioBan;

            document.getElementById('staff-replace').value = item.nguoiThayThe || 'KhÃ´ng';

            if (item.thoiGianLam) {

                const caArr = item.thoiGianLam.split(',');

                if (caArr[0]) { const sang = caArr[0].split('-'); if (sang[0]) document.getElementById('staff-ms').value = sang[0].trim(); if (sang[1]) document.getElementById('staff-me').value = sang[1].trim(); }

                if (caArr[1]) { const chieu = caArr[1].split('-'); if (chieu[0]) document.getElementById('staff-as').value = chieu[0].trim(); if (chieu[1]) document.getElementById('staff-ae').value = chieu[1].trim(); }

            }

            const skillsArr = item.kyNang.split(',').map(s => s.trim().toLowerCase());

            document.querySelectorAll('.skill-checkbox').forEach(cb => { cb.checked = skillsArr.includes(cb.value.toLowerCase()); });

            document.getElementById('btn-save-staff').innerText = "LÆ°u Sá»­a";

            document.getElementById('btn-cancel-staff').style.display = "inline-block";

        }

        function deleteStaff(i) {
            const s = dataCache.staff[i];
            if (!s) return;

            showCustomConfirm("XÃ¡c nháº­n xÃ³a nhÃ¢n sá»±", `BÃ¡c sÄ© cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a nhÃ¢n sá»± [ ${s.ten} ] khÃ´ng?`, function () {
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
                    if (typeof window.showToast === 'function') window.showToast(`ÄÃ£ xÃ³a nhÃ¢n sá»± [ ${staffName} ]!`, 'success');
                })
                    .withFailureHandler(e => {
                        alert('Lá»—i khi xÃ³a: ' + e);
                        if (typeof loadDashboard === 'function') loadDashboard();
                    }).deleteNhanSu(deletedSheetIndex, staffName);
            });
        }



        // ============================================================

        // ðŸ¥ 4. PHÃ’NG

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
                roomSelect.innerHTML = `<option value="">-- Chá»n phÃ²ng --</option>` + options;
                if (currentVal) roomSelect.value = currentVal;
            }

            if (typeof renderDynamicMachineInputs === 'function') {
                renderDynamicMachineInputs();
            }

            if (!dataCache.room || !dataCache.room.length) { tbody.innerHTML = renderEmptyRow(7, 'ChÆ°a cÃ³ dá»¯ liá»‡u phÃ²ng'); return; }

            tbody.innerHTML = dataCache.room.map((item, i) => {
                const idx = dataCache.room.indexOf(item);
                return `<tr class="draggable-row editable-row" data-drag-idx="${i}" onclick="if(!window._isDraggingRow) editRoom(${idx})" title="Báº¥m sá»­a (KÃ©o tháº£ nÃºt â˜° hoáº·c báº¥m â–²/â–¼ Ä‘á»ƒ Ä‘á»•i thá»© tá»±, PhÃ­m Delete Ä‘á»ƒ xÃ³a)">
            <td>${renderSttOrderControl("rooms", i, dataCache.room.length)}</td>
            <td><strong>${escapeHtml(item.tenPhong || item[1] || '')}</strong></td>
            <td>${escapeHtml(item.bacSi || item[2] || '')}</td>
            <td style="font-size:11px">${item.ktv || item[3] || ''}</td>
            <td style="font-size:11px; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.danhSachMay || item[4] || ''}">${escapeHtml(item.danhSachMay || item[4] || '')}</td>
            <td style="text-align:center;">${item.soGiuong || item[5] || 0}</td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteRoom(${idx})">XÃ³a</button></td>
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

            if (!ten) return alert("Nháº­p tÃªn phÃ²ng");

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

                if (assigned.length < reqQty) alert(`âš ï¸ Kho thiáº¿u mÃ¡y [${typeName.toUpperCase()}]! CÃ²n ${machinesOfType.length - usedCount} mÃ¡y ráº£nh.`);

                finalMachineList = finalMachineList.concat(assigned);

            });

            const dsMay = finalMachineList.join(', ');

            if (editIndex.room > -1) {

                const oldItem = dataCache.room[editIndex.room];
                const oldName = oldItem ? String(oldItem.tenPhong || oldItem.ten_phong || (Array.isArray(oldItem) ? oldItem[1] : '') || '').trim() : '';
                const oldId = oldItem ? oldItem.id : null;

                dataCache.room[editIndex.room] = { id: oldId, tenPhong: ten, bacSi: bs, ktv, danhSachMay: dsMay, soGiuong: slGiuong, danhSachGiuong: dsGiuong };

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

                google.script.run.editPhong({
                    index: editIndex.room,
                    oldTenPhong: oldName,
                    id: oldId,
                    tenPhong: ten,
                    bacSi: bs,
                    ktv: ktv,
                    danhSachMay: dsMay,
                    soGiuong: slGiuong,
                    danhSachGiuong: dsGiuong
                }, editIndex.room, ten, bs, ktv, dsMay, slGiuong, dsGiuong, oldName);

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

            // LuÃ´n Ä‘áº£m báº£o dynamic machine inputs Ä‘Æ°á»£c render Ä‘áº§y Ä‘á»§ trÆ°á»›c khi gÃ¡n giÃ¡ trá»‹
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

            document.getElementById('btn-save-room').innerText = "LÆ°u Sá»­a";

            document.getElementById('btn-cancel-room').style.display = "inline-block";

        }

        function deleteRoom(i) {
            showCustomConfirm("XÃ¡c nháº­n xÃ³a phÃ²ng", "BÃ¡c sÄ© cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a phÃ²ng nÃ y khÃ´ng?", function () {
                const targetRoom = dataCache.room ? dataCache.room[i] : null;
                const tenPhong = targetRoom ? String(targetRoom.tenPhong || targetRoom.ten_phong || (Array.isArray(targetRoom) ? targetRoom[1] : '') || targetRoom.ten || '').trim() : '';
                const roomId = targetRoom ? (targetRoom.id || null) : null;

                dataCache.room.splice(i, 1);
                renderRoomsTable();

                google.script.run
                    .withSuccessHandler(() => {
                        if (typeof window.showToast === 'function') window.showToast('ÄÃ£ xÃ³a phÃ²ng thÃ nh cÃ´ng!', 'success');
                    })
                    .withFailureHandler(e => {
                        alert('Lá»—i khi xÃ³a phÃ²ng: ' + e);
                        if (typeof loadRooms === 'function') loadRooms();
                    }).deletePhong({ tenPhong, id: roomId, index: i }, tenPhong, roomId);
            });
        }



        // ============================================================

        // ðŸ›Œ 5. Bá»†NH NHÃ‚N

        // ============================================================


        let _patSortMode = 2; // 2 = NgÃ y vÃ o cÅ© -> má»›i (Máº·c Ä‘á»‹nh), 1 = NgÃ y vÃ o má»›i -> cÅ©, 2 = NgÃ y vÃ o cÅ© -> má»›i
        window.toggleSortPatientsByNgayVao = function() {
            if (!dataCache.pat || !dataCache.pat.length) return;
            _patSortMode = (_patSortMode + 1) % 3;
            const th = document.getElementById('th-pat-ngayvao');
            if (th) {
                if (_patSortMode === 1) th.innerText = "NgÃ y VÃ o â–¼";
                else if (_patSortMode === 2) th.innerText = "NgÃ y VÃ o â–²";
                else th.innerText = "NgÃ y VÃ o";
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
            // ðŸ›¡ï¸ Tá»± Ä‘á»™ng phá»¥c há»“i há» tÃªn bá»‡nh nhÃ¢n bá»‹ lá»—i hiá»ƒn thá»‹ trÆ°á»›c khi render
            (dataCache.pat || []).forEach(p => {
                if (p && p.ten) {
                    p.ten = healPatientName(p.ten);
                }
            });

            // ðŸ›¡ï¸ Lá»šP PHÃ’NG THá»¦ DEDUPLICATION: Loáº¡i trá»« triá»‡t Ä‘á»ƒ báº£n ghi trÃ¹ng láº·p trÃªn giao diá»‡n
            if (Array.isArray(dataCache.pat) && dataCache.pat.length > 1) {
                const dedupMap = new Map();
                dataCache.pat.forEach(p => {
                    if (!p) return;
                    const n = String(p.ten || p.name || '').trim().toUpperCase();
                    const ns = String(p.namSinh || p.age || '').trim();
                    const nv = String(p.ngayVao || p.ngay_vao || '').trim();
                    const k = `${n}|${ns}|${nv}`;
                    if (!dedupMap.has(k)) {
                        dedupMap.set(k, p);
                    } else {
                        const existing = dedupMap.get(k);
                        const currId = Number(p.id) || 0;
                        const existId = Number(existing.id) || 0;
                        if (currId >= existId) {
                            dedupMap.set(k, p);
                        }
                    }
                });
                if (dedupMap.size < dataCache.pat.length) {
                    dataCache.pat = Array.from(dedupMap.values());
                }
            }

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
            if (!dataCache.pat.length) { tbody.innerHTML = renderEmptyRow(10, 'ChÆ°a cÃ³ dá»¯ liá»‡u bá»‡nh nhÃ¢n'); return; }

            const schedData = (window.currentScheduleData && window.currentScheduleData.length) ? window.currentScheduleData : ((typeof dataCache !== 'undefined' && dataCache.schedule) ? dataCache.schedule : []);

            dataCache.pat.forEach((p, idx) => { if (p) p.index = idx; });
            let displayPatList = dataCache.pat.map((p, origIdx) => ({ ...p, _origIndex: origIdx }));
            
            const currentFilter = window._patientTypeFilter || 'all';
            if (currentFilter !== 'all') {
                displayPatList = displayPatList.filter(p => {
                    const loai = p.loai_bn || 'NoiTru';
                    return loai === currentFilter;
                });
            }
            if (_patSortMode === 1) {
                displayPatList.sort((a, b) => {
                    // 1. NgÃ y vÃ o (Má»›i -> CÅ©)
                    const dateA = parseNgayVao(a.ngayVao || '');
                    const dateB = parseNgayVao(b.ngayVao || '');
                    if (dateA !== dateB) return dateB - dateA;

                    // 2. Giá» vÃ o (Muá»™n -> Sá»›m)
                    const timeA = getGioVaoMinutes(a.gioVao || '');
                    const timeB = getGioVaoMinutes(b.gioVao || '');
                    if (timeA !== timeB) return timeB - timeA;

                    // 3. TÃªn tá»« Z-A
                    return (b.ten || '').localeCompare(a.ten || '', 'vi');
                });
            } else if (_patSortMode === 2) {
                displayPatList.sort((a, b) => {
                    // 1. NgÃ y vÃ o (CÅ© -> Má»›i)
                    const dateA = parseNgayVao(a.ngayVao || '');
                    const dateB = parseNgayVao(b.ngayVao || '');
                    if (dateA !== dateB) return dateA - dateB;

                    // 2. Giá» vÃ o (Sá»›m -> Muá»™n)
                    const timeA = getGioVaoMinutes(a.gioVao || '');
                    const timeB = getGioVaoMinutes(b.gioVao || '');
                    if (timeA !== timeB) return timeA - timeB;

                    // 3. TÃªn tá»« A-Z
                    return (a.ten || '').localeCompare(b.ten || '', 'vi');
                });
            } else {
                displayPatList.sort((a, b) => a._origIndex - b._origIndex);
            }

            tbody.innerHTML = displayPatList.map((item, i) => {
                const idx = item._origIndex;
                const patName = String(item.ten || '').toUpperCase().trim();
                const patNS = String(item.namSinh || '').trim();
                const reqProcs = extractPatientProcedures(item);
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
                    const isNotDropped = !r.__dropped && gio !== 'âŒ Rá»›t' && gio !== '--';
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
                        nhanTrangThai = `<span style="background:#f39c12;color:white;padding:2px 6px;border-radius:10px;font-size:10px;margin-left:5px;">ChÆ°a xáº¿p</span>`;
                    } else if (missingProcs.length === 0) {
                        nhanTrangThai = `<span style="background:#2ecc71;color:white;padding:2px 6px;border-radius:10px;font-size:10px;margin-left:5px;">ÄÃ£ Ä‘á»§</span>`;
                    } else {
                        const displayText = getShortSkills(missingProcs.join(', '));
                        nhanTrangThai = `<span style="background:#3498db;color:white;padding:2px 6px;border-radius:10px;font-size:10px;margin-left:5px;">Thiáº¿u: ${displayText}</span>`;
                    }
                }

                const displayGioYLenh = (item.gioVao && item.gioVao !== '07:30' && item.gioVao !== '7:30') ? item.gioVao : '';

                return `<tr class="editable-row" data-pat-index="${idx}" onclick="editPatient(parseInt(this.dataset.patIndex))" style="${item.gioRa ? 'background:#f8d7da;opacity:0.8;' : ''}" title="Báº¥m sá»­a (PhÃ­m Delete Ä‘á»ƒ xÃ³a)">
            <td>${i + 1}</td>
            <td><strong>${escapeHtml(item.ten)}</strong> ${nhanTrangThai}</td>
            <td>${escapeHtml(item.namSinh || '')}</td>
            <td style="text-align:center;">${item.loai_bn === 'NgoaiTru' ? '<span style="color:#d35400;font-weight:bold;font-size:11px;">Ngoáº¡i trÃº</span>' : '<span style="color:#27ae60;font-weight:bold;font-size:11px;">Ná»™i trÃº</span>'}</td>
            <td>${escapeHtml(item.ngayVao || '')}</td>
            <td style="text-align:center;">${displayGioYLenh ? `<strong style="color:#e67e22">${escapeHtml(displayGioYLenh)}</strong>` : ''}</td>
            <td><strong style="color:#c0392b">${escapeHtml(item.gioRa || '')}</strong></td>
            <td>${escapeHtml(item.phong || '')}</td>
            <td style="font-size:11px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(item.thuThuat)}"><strong>${escapeHtml(getShortSkills(item.thuThuat))}</strong></td>
            <td><button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deletePatient(parseInt(this.closest('tr').dataset.patIndex))">XÃ³a</button></td>
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


            // ðŸ›¡ï¸ Chá»‘ng gá»i kÃ©p: Bá» qua náº¿u Ä‘Ã£ Ä‘ang xá»­ lÃ½
            if (window._savePatientLock) { console.warn("savePatient: blocked double call"); return; }
            window._savePatientLock = true;

            const currentEditIdx = editIndex.pat;
            const currentItem = currentEditIdx > -1 ? dataCache.pat[currentEditIdx] : null;

            // ðŸ›¡ï¸ LÆ°u thÃ´ng tin nháº­n diá»‡n gá»‘c trÆ°á»›c khi Optimistic UI cáº­p nháº­t (trÃ¡nh gá»­i nháº§m tÃªn má»›i thay cho tÃªn cÅ©)
            const origTen = currentItem ? currentItem.ten : '';
            const origNam = currentItem ? currentItem.namSinh : '';
            const origId = currentItem ? currentItem.id : null;

            let ten = document.getElementById('pat-name').value;
            const nam = document.getElementById('pat-year').value;
            // const ngay = document.getElementById('pat-date').value;
            // const gio = document.getElementById('pat-time').value.trim() || '07:30';
            const phong = document.getElementById('pat-room').value;
            const ban = document.getElementById('pat-busy').value;
            const ra = document.getElementById('pat-leave').value;
            const loai_bn = document.getElementById('pat-loai-bn').value;
            // Tá»± Ä‘á»™ng xÃ¡c Ä‘á»‹nh buá»•i Ä‘iá»u trá»‹ cho bá»‡nh nhÃ¢n ngoáº¡i trÃº dá»±a trÃªn giá» Y lá»‡nh
            // Concat ngÃ y vÃ o tá»« 2 Ã´ nháº­p
            const dayVal = String(document.getElementById('pat-date-day')?.value || '').trim().padStart(2, '0');
            const myVal = document.getElementById('pat-date-month-year')?.value || '';
            const ngay = `${dayVal}/${myVal}`;

            // Tá»± Ä‘á»™ng xÃ¡c Ä‘á»‹nh giá» vÃ o vÃ  buá»•i Ä‘iá»u trá»‹
            const gioTyped = (document.getElementById('pat-time')?.value || '').trim();
            let gio = gioTyped || '07:30';
            // LuÃ´n máº·c Ä‘á»‹nh lÃ  Tá»± Ä‘á»™ng (TuDong) theo yÃªu cáº§u áº©n cá»™t cá»§a bÃ¡c sÄ©
            let buoi_dieu_tri = (currentEditIdx > -1 && currentItem) ? (currentItem.buoi_dieu_tri || 'TuDong') : 'TuDong';

            // Náº¿u cÃ³ giá» ra viá»‡n -> báº¯t buá»™c SÃ¡ng
            if (ra) {
                buoi_dieu_tri = 'Sang';
            }
            const tt = Array.from(document.querySelectorAll('.pat-proc-cb:checked')).map(cb => cb.value).join(', ');

            if (!ten) { window._savePatientLock = false; return alert("Nháº­p tÃªn bá»‡nh nhÃ¢n"); }
            if (!phong) { window._savePatientLock = false; return alert("Vui lÃ²ng chá»n PhÃ²ng"); }

            ten = (ten || '').normalize('NFC').trim();
            ten = healPatientName(ten, [origTen].filter(Boolean));
            if (ten.includes('\ufffd') && origTen && !origTen.includes('\ufffd')) {
                ten = healPatientName(origTen);
            }
            ten = ten.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

            // ðŸ›¡ï¸ Kiá»ƒm soÃ¡t tÃ­nh toÃ n váº¹n dá»¯ liá»‡u báº±ng Zod Schema Engine
            if (window.MedicalSchemas && typeof window.MedicalSchemas.validatePatient === 'function') {
                const zRes = window.MedicalSchemas.validatePatient({
                    ten: ten,
                    namSinh: nam,
                    phong: phong,
                    thuThuat: tt
                });
                if (!zRes.success) {
                    window._savePatientLock = false;
                    const errDetail = zRes.error?.issues?.[0]?.message || 'Dá»¯ liá»‡u khÃ´ng há»£p lá»‡';
                    return alert('âš ï¸ ' + errDetail);
                }
            }

            // KhÃ³a form vÃ  nÃºt lÆ°u
            const btnSave = document.getElementById('btn-save-pat');
            if (btnSave) { btnSave.disabled = true; btnSave.innerText = 'Äang lÆ°u...'; }

            // Chá»¥p index TRÆ¯á»šC khi cancelEdit reset vá» -1

            let createdPat = null;
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
                createdPat = newPat;
                if (!dataCache.pat) dataCache.pat = [];
                dataCache.pat.push(newPat);
                renderPatientsTable();
            }

            // Giáº£i phÃ³ng form ngay láº­p tá»©c cho ngÆ°á»i dÃ¹ng thao tÃ¡c tiáº¿p
            cancelEdit('pat');
            document.getElementById('pat-name').focus();

            const onDone = (res) => {
                window._savePatientLock = false;
                window._lastLocalMutationTime = Date.now();
                if (createdPat && res && res.id) {
                    createdPat.id = res.id;
                }
                if (window.dataCacheTime) window.dataCacheTime['pat'] = Date.now();
                if (typeof loadDashboard === 'function') loadDashboard();
                if (btnSave) { btnSave.disabled = false; btnSave.innerText = 'LÆ°u'; }
            };

            const onError = (e) => {
                window._savePatientLock = false;
                if (btnSave) { btnSave.disabled = false; btnSave.innerText = 'LÆ°u'; }
                alert('Lá»—i khi lÆ°u bá»‡nh nhÃ¢n: ' + e);
                // KhÃ´i phá»¥c láº¡i dá»¯ liá»‡u gá»‘c tá»« mÃ¡y chá»§ náº¿u xáº£y ra lá»—i
                if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                loadEntity('getBenhNhan', 'pat', renderPatientsTable, [], true);
            };

            if (currentEditIdx > -1 && currentItem) {
                const sheetIdx = currentItem.sheetIndex !== undefined ? currentItem.sheetIndex : currentEditIdx;
                google.script.run
                    .withSuccessHandler(onDone)
                    .withFailureHandler(onError)
                    .editBenhNhan(sheetIdx, ten, nam, ngay, gio, ban, ra, phong, tt, origTen, origNam, loai_bn, buoi_dieu_tri, origId);
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

            let targetIdx = index;
            let item = (dataCache.pat && dataCache.pat[targetIdx]) ? dataCache.pat[targetIdx] : null;
            if (!item && dataCache.pat && dataCache.pat.length) {
                const foundIdx = dataCache.pat.findIndex(p => p && (p.index === index || p.id === index || p.sheetIndex === index));
                if (foundIdx !== -1) {
                    targetIdx = foundIdx;
                    item = dataCache.pat[targetIdx];
                }
            }
            if (!item) {
                console.warn('[editPatient]: KhÃ´ng tÃ¬m tháº¥y bá»‡nh nhÃ¢n táº¡i vá»‹ trÃ­', index);
                return;
            }

            editIndex.pat = targetIdx;

            document.getElementById('pat-name').value = healPatientName(item.ten || '');
            document.getElementById('pat-year').value = item.namSinh || '';

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

            document.getElementById('pat-room').value = item.phong || '';
            document.getElementById('pat-leave').value = item.gioRa || '';

            const busyVal = item.gioBan || '';
            document.getElementById('pat-busy').value = busyVal;
            document.getElementById('pat-loai-bn').value = item.loai_bn || 'NoiTru';
            // Auto-detect buá»•i: náº¿u cÃ³ giá» ra viá»‡n â†’ sÃ¡ng, khÃ´ng thÃ¬ dÃ¹ng giÃ¡ trá»‹ Ä‘Ã£ lÆ°u (máº·c Ä‘á»‹nh TuDong)
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

            // Äáº£m báº£o checkbox thá»§ thuáº­t Ä‘Ã£ Ä‘Æ°á»£c render trÆ°á»›c khi chá»n
            if (document.querySelectorAll('.pat-proc-cb').length === 0) {
                if (typeof renderProcedureCheckboxes === 'function') {
                    renderProcedureCheckboxes();
                }
            }

            // Dá»n dáº¹p cÃ¡c checkbox ngoÃ i danh má»¥c trÆ°á»›c Ä‘Ã³
            document.querySelectorAll('.pat-proc-cb-extra-container, .extra-proc-item').forEach(el => el.remove());

            const ttArr = extractPatientProcedures(item);
            const matchedProcs = new Set();
            const existingCbs = Array.from(document.querySelectorAll('.pat-proc-cb'));

            existingCbs.forEach(cb => { 
                const isMatched = ttArr.some(t => {
                    if (matchProc(t, cb.value)) {
                        matchedProcs.add(t);
                        return true;
                    }
                    return false;
                });
                cb.checked = isMatched;
            });

            // ðŸ›¡ï¸ CHá»NG Máº¤T THá»¦ THUáº¬T: Náº¿u cÃ³ thá»§ thuáº­t cá»§a bá»‡nh nhÃ¢n khÃ´ng náº±m trong danh má»¥c chuáº©n,
            // tá»± Ä‘á»™ng táº¡o checkbox bá»• sung cÃ³ Ä‘Ã¡nh dáº¥u checked Ä‘á»ƒ báº£o toÃ n dá»¯ liá»‡u khi LÆ°u!
            const unmatched = ttArr.filter(t => !matchedProcs.has(t));
            if (unmatched.length > 0) {
                let extraContainer = document.getElementById('pat-skills-extra');
                if (!extraContainer) {
                    const grid = document.querySelector('.skills-grid');
                    if (grid) {
                        extraContainer = document.createElement('div');
                        extraContainer.id = 'pat-skills-extra';
                        extraContainer.className = 'skills-col pat-proc-cb-extra-container';
                        extraContainer.style.cssText = 'width: 100%; margin-top: 6px; padding: 6px 8px; background: #fff8e1; border: 1px dashed #f39c12; border-radius: 6px;';
                        grid.appendChild(extraContainer);
                    }
                }
                if (extraContainer) {
                    let extraHtml = '<h4 style="color:#d35400; font-size:12px; margin:0 0 4px 0; font-weight:700;">ðŸ“Œ Thá»§ thuáº­t bá»• sung / ngoÃ i danh má»¥c:</h4>';
                    unmatched.forEach(t => {
                        const escaped = escapeHtml(t);
                        extraHtml += `<label class="checkbox-item extra-proc-item" style="display:inline-flex; align-items:center; margin-right:12px; margin-bottom:4px; font-weight:600; color:#d35400;">
                            <input type="checkbox" class="pat-proc-cb pat-proc-cb-extra" value="${escaped}" checked style="accent-color:#d35400; margin-right:4px;">
                            ${escaped}
                        </label>`;
                    });
                    extraContainer.innerHTML = extraHtml;
                }
            }

            document.getElementById('btn-save-pat').innerText = "LÆ°u Sá»­a";
            document.getElementById('btn-cancel-pat').style.display = "inline-block";

        }

        // ============================================================

        // â™»ï¸ Há»† THá»NG XÃ“A Bá»†NH NHÃ‚N (TRá»°C TIáº¾P, AN TOÃ€N)

        // ============================================================

        function deletePatient(i) {
            if (checkUnclosedDay()) return;


            const p = dataCache.pat[i];

            showCustomConfirm("XÃ¡c nháº­n xÃ³a", `BÃ¡c sÄ© cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a bá»‡nh nhÃ¢n [ ${p.ten} ]?`, function () {
                // Náº¿u Ä‘ang má»Ÿ sá»­a chÃ­nh bá»‡nh nhÃ¢n nÃ y, reset form
                if (editIndex.pat === i) {
                    cancelEdit('pat');
                } else if (editIndex.pat > i) {
                    editIndex.pat--;
                }

                // XÃ³a táº¡m trÃªn giao diá»‡n
                const deletedSheetIndex = p.sheetIndex !== undefined ? p.sheetIndex : i;
                const patName = p.ten;
                dataCache.pat.splice(i, 1);
                dataCache.pat.forEach((item, idx) => {
                    item.index = idx;
                    if (item.sheetIndex !== undefined && item.sheetIndex > deletedSheetIndex) {
                        item.sheetIndex--;
                    }
                });
                renderPatientsTable();

                // Gá»i mÃ¡y chá»§ xÃ³a ngay láº­p tá»©c
                google.script.run
                    .withSuccessHandler(() => {
                        if (typeof showToastSuccess === 'function') showToastSuccess(`ÄÃ£ xÃ³a bá»‡nh nhÃ¢n [ ${patName} ] thÃ nh cÃ´ng!`);
                        else if (typeof window.showToast === 'function') window.showToast(`ÄÃ£ xÃ³a bá»‡nh nhÃ¢n [ ${patName} ] thÃ nh cÃ´ng!`, 'success');
                        if (typeof loadDashboard === 'function') loadDashboard();
                    })
                    .withFailureHandler(e => {
                        alert('Lá»—i khi xÃ³a: ' + e);
                        if (typeof loadPatients === 'function') loadPatients();
                    })
                    .deleteBenhNhan(deletedSheetIndex, p.ten, p.namSinh, p.id);
            });
        }



        // Tá»± Ä‘á»™ng Ä‘iá»n nÄƒm sinh khi gÃµ tÃªn bá»‡nh nhÃ¢n

        document.getElementById('pat-name').addEventListener('input', function () {

            const val = this.value.trim().toLowerCase();

            if (!val) return;

            const found = dataCache.pat.find(p => p.ten.toLowerCase() === val);

            if (found && !document.getElementById('pat-year').value) document.getElementById('pat-year').value = found.namSinh;

        });



        // TÃ¬m kiáº¿m báº£ng bá»‡nh nhÃ¢n (debounce chá»‘ng Unikey)

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

        // â± TAB GIá»œ Báº¬N Bá»†NH NHÃ‚N

        // ============================================================

        function renderBusyPat() {
            const tbody = document.getElementById('busy-pat-tbody');
            if (!tbody) return;

            const isHistory = !!window._forceHistoryMode;
            const targetDate = window._viewingHistoryDate || (document.getElementById('busy-date-filter') ? document.getElementById('busy-date-filter').value : '');
            const parts = (targetDate || '').split('-');
            const dmy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : targetDate;

            let html = '';
            let stt = 1;
            let count = 0;

            (dataCache.pat || []).forEach((p, idx) => {
                if (!p.gioBan) return;
                const escapedTen = escapeHtml(p.ten);
                const ns = p.namSinh || '';
                const phong = p.phong || '';
                const slots = p.gioBan.split(',').map(s => s.trim()).filter(Boolean);
                if (slots.length > 0) count++;

                slots.forEach(slot => {
                    if (isHistory) {
                        html += `<tr>
                            <td align="center" style="font-weight: 600; color: #475569; width: 32px;">${stt++}</td>
                            <td style="white-space: nowrap; font-weight: 600; text-align: left; color:#1e293b;">${escapedTen}</td>
                            <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 65px;">${ns}</td>
                            <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 75px;">${phong}</td>
                            <td align="center" style="white-space: nowrap; width: 110px; min-width: 100px;">
                                <span style="display:inline-block; padding:2px 7px; background:#f0fdfa; color:#0f766e; border:1px solid #ccfbf1; border-radius:12px; font-weight:700; font-size:11.5px; font-family:monospace;">â± ${formatSlotDisplay(slot)}</span>
                            </td>
                        </tr>`;
                    } else {
                        const safeTenAttr = String(p.ten || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                        const safeNsAttr = String(ns || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                        const safeSlotAttr = String(slot || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                        html += `<tr class="editable-row" onclick="editBusyPat('${safeTenAttr}', '${safeNsAttr}', '${safeSlotAttr}', ${idx})" title="Báº¥m Ä‘á»ƒ sá»­a/xÃ³a">
                            <td align="center" style="font-weight: 600; color: #475569; width: 32px;">${stt++}</td>
                            <td style="white-space: nowrap; font-weight: 600; text-align: left;">${escapedTen}</td>
                            <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 65px;">${ns}</td>
                            <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 75px;">${phong}</td>
                            <td align="center" style="color:#d35400; font-weight:bold; white-space: nowrap; width: 110px; min-width: 100px; font-family: monospace, sans-serif;">${formatSlotDisplay(slot)}</td>
                        </tr>`;
                    }
                });
            });

            const countBadge = document.getElementById('busy-pat-count-badge');
            if (countBadge) {
                countBadge.innerText = `${count} bá»‡nh nhÃ¢n báº­n`;
            }

            const emptyMsg = isHistory
                ? `ðŸ“­ NgÃ y ${dmy || 'nÃ y'} khÃ´ng cÃ³ bá»‡nh nhÃ¢n bÃ¡o báº­n`
                : 'ChÆ°a cÃ³ bá»‡nh nhÃ¢n báº­n';
            tbody.innerHTML = html || `<tr><td colspan="5" align="center" style="color:#64748b; padding:${isHistory ? '24px' : '10px'} 10px; font-style:italic;">${emptyMsg}</td></tr>`;
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
            if (idx === -1) return alert('Vui lÃ²ng chá»n Ä‘Ã­ch danh bá»‡nh nhÃ¢n tá»« danh sÃ¡ch xá»• xuá»‘ng!');
            const fromObj = document.getElementById('busy-pat-from');
            const toObj = document.getElementById('busy-pat-to');
            const from = fromObj.value, to = toObj.value;
            if (!from) return alert('Nháº­p thá»i gian!');
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
                    alert("Lá»—i lÆ°u giá» báº­n: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                        () => { if (typeof renderBusyPat === 'function') renderBusyPat(); }
                    ], true);
                })
                .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan, p.gioRa, p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri, p.id);
        });

        function deleteSinglePatBusy() {
            if (checkUnclosedDay()) return;

            const idx = getBusyPatIdx();
            if (idx === -1) return alert('Vui lÃ²ng chá»n Ä‘Ã­ch danh bá»‡nh nhÃ¢n!');
            const from = document.getElementById('busy-pat-from').value;
            const to = document.getElementById('busy-pat-to').value;
            if (!from) return alert('Vui lÃ²ng click vÃ o khoáº£ng giá» trÃªn báº£ng Ä‘á»ƒ xÃ³a!');
            const finalTo = to || from;
            const p = dataCache.pat[idx];
            if (!p.gioBan) return;
            const slotToDelete = from + '-' + finalTo;

            showCustomConfirm("XÃ³a giá» báº­n", "BÃ¡c sÄ© cÃ³ muá»‘n xÃ³a giá» báº­n [ " + slotToDelete + " ] cá»§a BN: " + p.ten + "?", function () {
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
                        alert("Lá»—i xÃ³a giá» báº­n: " + (err.message || err));
                        if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                        loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                            () => { if (typeof renderBusyPat === 'function') renderBusyPat(); }
                        ], true);
                    })
                    .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan, p.gioRa, p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri, p.id);
            });
        }

        function clearPatBusy() {
            if (checkUnclosedDay()) return;

            const idx = getBusyPatIdx();
            if (idx === -1) return alert('Vui lÃ²ng chá»n Ä‘Ã­ch danh bá»‡nh nhÃ¢n!');
            const p = dataCache.pat[idx];
            if (!confirm("XÃ³a toÃ n bá»™ giá» báº­n cá»§a BN: " + p.ten + "?")) return;

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
                    alert("Lá»—i xÃ³a giá» báº­n: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                        () => { if (typeof renderBusyPat === 'function') renderBusyPat(); }
                    ], true);
                })
                .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, '', p.gioRa, p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri, p.id);
        }



        // ============================================================

        // ðŸšª TAB RA VIá»†N

        // ============================================================

        function renderLeavePat() {
            const tbody = document.getElementById('leave-pat-tbody');
            if (!tbody) return;

            const isHistory = !!window._forceHistoryMode;
            const targetDate = window._viewingHistoryDate || (document.getElementById('busy-date-filter') ? document.getElementById('busy-date-filter').value : '');
            const parts = (targetDate || '').split('-');
            const dmy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : targetDate;

            let html = '', stt = 1, count = 0;
            (dataCache.pat || []).forEach((p, idx) => {
                if (!p.gioRa) return;
                count++;
                const escapedTen = escapeHtml(p.ten);
                const ns = p.namSinh || '';
                const phong = p.phong || '';
                if (isHistory) {
                    html += `<tr>
                        <td align="center" style="font-weight: 600; color: #475569; width: 32px;">${stt++}</td>
                        <td style="white-space: nowrap; font-weight: 600; text-align: left; color:#1e293b;">${escapedTen}</td>
                        <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 65px;">${ns}</td>
                        <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 75px;">${phong}</td>
                        <td align="center" style="white-space: nowrap; width: 80px; min-width: 75px;">
                            <span style="display:inline-block; padding:2px 7px; background:#faf5ff; color:#6b21a8; border:1px solid #f3e8ff; border-radius:12px; font-weight:700; font-size:11.5px; font-family:monospace;">ðŸšª ${p.gioRa}</span>
                        </td>
                    </tr>`;
                } else {
                    const safeTenAttr = String(p.ten || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                    const safeNsAttr = String(ns || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                    const safeGioRaAttr = String(p.gioRa || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                    html += `<tr class="editable-row" onclick="editLeavePat('${safeTenAttr}', '${safeNsAttr}', '${safeGioRaAttr}', ${idx})" title="Báº¥m Ä‘á»ƒ sá»­a/xÃ³a">
                        <td align="center" style="font-weight: 600; color: #475569; width: 32px;">${stt++}</td>
                        <td style="white-space: nowrap; font-weight: 600; text-align: left;">${escapedTen}</td>
                        <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 65px;">${ns}</td>
                        <td align="center" style="color: #64748b; white-space: nowrap; font-size: 11.5px; width: 75px;">${phong}</td>
                        <td align="center" style="color:#8e44ad; font-weight:bold; white-space: nowrap; width: 80px; min-width: 75px; font-family: monospace, sans-serif;">${p.gioRa}</td>
                    </tr>`;
                }
            });

            const countBadge = document.getElementById('busy-leave-count-badge');
            if (countBadge) {
                countBadge.innerText = `${count} bá»‡nh nhÃ¢n ra viá»‡n`;
            }

            const emptyMsg = isHistory
                ? `ðŸ“­ NgÃ y ${dmy || 'nÃ y'} khÃ´ng cÃ³ bá»‡nh nhÃ¢n ra viá»‡n`
                : 'ChÆ°a cÃ³ bá»‡nh nhÃ¢n ra viá»‡n';
            tbody.innerHTML = html || `<tr><td colspan="5" align="center" style="color:#64748b; padding:${isHistory ? '24px' : '10px'} 10px; font-style:italic;">${emptyMsg}</td></tr>`;
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
            if (idx === -1) return alert('Vui lÃ²ng chá»n Ä‘Ã­ch danh bá»‡nh nhÃ¢n tá»« danh sÃ¡ch xá»• xuá»‘ng!');
            const leaveObj = document.getElementById('leave-pat-time');
            const leaveTime = leaveObj.value;
            if (!leaveTime) return alert('Nháº­p giá» ra viá»‡n!');
            const p = dataCache.pat[idx];

            p.gioRa = leaveTime;
            // Cáº­p nháº­t ngay trÃªn currentScheduleData Ä‘á»ƒ In/Xuáº¥t Excel pháº£n Ã¡nh Ä‘Ãºng
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
            satCache = {}; // LÃ m má»›i bá»™ Ä‘á»‡m Thá»© 7 Ä‘á»ƒ pháº£n Ã¡nh danh sÃ¡ch má»›i nháº¥t
            leaveObj.value = ''; leaveObj.focus();
            const leaveInput = document.getElementById('leave-pat-input');
            if (leaveInput) leaveInput.value = '';

            const sheetIdx = p.sheetIndex !== undefined ? p.sheetIndex : idx;
            google.script.run
                .withSuccessHandler(() => {
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = Date.now();
                })
                .withFailureHandler(err => {
                    alert("Lá»—i cáº­p nháº­t giá» ra viá»‡n: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                        () => { if (typeof renderLeavePat === 'function') renderLeavePat(); }
                    ], true);
                })
                .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan, leaveTime, p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri, p.id);
        });

        function clearPatLeave() {
            if (checkUnclosedDay()) return;

            const idx = getLeavePatIdx();
            if (idx === -1) return alert('Vui lÃ²ng chá»n Ä‘Ã­ch danh bá»‡nh nhÃ¢n!');
            const p = dataCache.pat[idx];
            if (!confirm("Há»§y giá» ra viá»‡n cá»§a BN: " + p.ten + "?")) return;

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
            satCache = {}; // LÃ m má»›i bá»™ Ä‘á»‡m Thá»© 7 Ä‘á»ƒ pháº£n Ã¡nh danh sÃ¡ch má»›i nháº¥t
            document.getElementById('leave-pat-time').value = '';
            const leaveInput = document.getElementById('leave-pat-input');
            if (leaveInput) leaveInput.value = '';

            const sheetIdx = p.sheetIndex !== undefined ? p.sheetIndex : idx;
            google.script.run
                .withSuccessHandler(() => {
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = Date.now();
                })
                .withFailureHandler(err => {
                    alert("Lá»—i há»§y giá» ra viá»‡n: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['pat'] = 0;
                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [
                        () => { if (typeof renderLeavePat === 'function') renderLeavePat(); }
                    ], true);
                })
                .editBenhNhan(sheetIdx, p.ten, p.namSinh, p.ngayVao, p.gioVao, p.gioBan, '', p.phong, p.thuThuat, p.ten, p.namSinh, p.loai_bn, p.buoi_dieu_tri, p.id);
        }



        // ============================================================

        // ðŸ‘· TAB GIá»œ Báº¬N NHÃ‚N VIÃŠN

        // ============================================================

        function renderBusyStaff() {
            const select = document.getElementById('busy-staff-select');
            const thead = document.getElementById('busy-staff-thead');
            const tbody = document.getElementById('busy-staff-tbody');
            if (!thead || !tbody) return;

            if (typeof window.loadBusyHistoryDates === 'function') {
                const qs = document.getElementById('busy-quick-date-select');
                if (qs && !qs._loaded) window.loadBusyHistoryDates();
            }

            const isHistory = !!window._forceHistoryMode;
            const targetDate = window._viewingHistoryDate || (document.getElementById('busy-date-filter') ? document.getElementById('busy-date-filter').value : '');
            const parts = (targetDate || '').split('-');
            const dmy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : targetDate;

            // Lá»c danh sÃ¡ch nhÃ¢n sá»± báº­n
            const busyStaffList = (dataCache.staff || []).filter(s => s && s.gioBan && String(s.gioBan).trim());

            // Cáº­p nháº­t badge trÃªn header lá»‹ch sá»­
            const countBadge = document.getElementById('busy-staff-count-badge');
            if (countBadge) {
                countBadge.innerText = `${busyStaffList.length} nhÃ¢n sá»± báº­n`;
            }

            if (isHistory) {
                // --- CHáº¾ Äá»˜ Lá»ŠCH Sá»¬ (READ-ONLY LIST VIEW Vá»šI PILLS CHUYÃŠN NGHIá»†P) ---
                if (busyStaffList.length === 0) {
                    thead.innerHTML = `<tr>
                        <th style="width: 36px; text-align: center;">STT</th>
                        <th style="text-align: left;">TÃªn NhÃ¢n ViÃªn</th>
                        <th style="text-align: center; width: 105px;">Vai TrÃ²</th>
                        <th style="text-align: center; width: 140px;">Khung Giá» Báº­n Lá»‹ch Sá»­</th>
                    </tr>`;
                    tbody.innerHTML = `<tr><td colspan="4" align="center" style="color:#64748b; padding:24px 10px; font-style:italic;">ðŸ“­ NgÃ y ${dmy || 'nÃ y'} khÃ´ng cÃ³ nhÃ¢n viÃªn nÃ o bÃ¡o báº­n</td></tr>`;
                    return;
                }

                thead.innerHTML = `<tr>
                    <th style="width: 36px; text-align: center;">STT</th>
                    <th style="text-align: left;">TÃªn NhÃ¢n ViÃªn</th>
                    <th style="text-align: center; width: 105px;">Vai TrÃ²</th>
                    <th style="text-align: center; width: 150px;">Khung Giá» Báº­n</th>
                </tr>`;

                let tbHtml = '';
                let stt = 1;
                busyStaffList.forEach(s => {
                    const sName = escapeHtml(String(s.ten || '').toUpperCase());
                    const vaiTro = escapeHtml(s.vaiTro || (s.ten.toLowerCase().includes('ktv') ? 'Ká»¹ thuáº­t viÃªn' : 'BÃ¡c sÄ©'));
                    const slots = String(s.gioBan).split(',').map(x => x.trim()).filter(Boolean);
                    const slotBadges = slots.map(sl => `<span style="display:inline-block; margin:2px; padding:2px 7px; background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; border-radius:12px; font-weight:700; font-size:11.5px; font-family:monospace;">â± ${formatSlotDisplay(sl)}</span>`).join(' ');

                    tbHtml += `<tr>
                        <td align="center" style="font-weight: 700; color: #475569;">${stt++}</td>
                        <td style="text-align: left; font-weight: 700; color: #1e293b; white-space: nowrap;">ðŸ‘¨â€âš•ï¸ ${sName}</td>
                        <td align="center"><span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600;">${vaiTro}</span></td>
                        <td align="center" style="white-space: normal;">${slotBadges}</td>
                    </tr>`;
                });
                tbody.innerHTML = tbHtml;
                return;
            }

            // --- CHáº¾ Äá»˜ LIVE (NHáº¬P LIá»†U/Sá»¬A) ---
            if (select) {
                const prevVal = select.value;
                select.innerHTML = (dataCache.staff || []).map((s, i) => `<option value="${i}">${escapeHtml(String(s.ten || '').toUpperCase())}</option>`).join('');
                if (prevVal !== "" && prevVal !== null && select.querySelector(`option[value="${prevVal}"]`)) {
                    select.value = prevVal;
                }
            }

            const busyIndices = (dataCache.staff || []).map((s, i) => (s && s.gioBan && String(s.gioBan).trim()) ? i : -1).filter(i => i > -1);

            if (!busyIndices.length) {
                thead.innerHTML = '';
                tbody.innerHTML = '<tr><td align="center" style="color:gray; padding:20px; font-style:italic;">âœ… Hiá»‡n táº¡i chÆ°a cÃ³ nhÃ¢n viÃªn nÃ o bÃ¡o báº­n</td></tr>';
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
                        ? `<td align="center" style="font-size:11px; color:#c0392b; font-weight:bold;" class="editable-row" onclick="editBusyStaff(${origIdx}, '${slot}')" title="Báº¥m sá»­a (Delete Ä‘á»ƒ xÃ³a)">${formatSlotDisplay(slot)}</td>`
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
            if (idx === "" || idx === null || isNaN(parseInt(idx))) return alert('Vui lÃ²ng chá»n nhÃ¢n viÃªn!');
            const fromObj = document.getElementById('busy-staff-from');
            const toObj = document.getElementById('busy-staff-to');
            const from = fromObj.value.trim(), to = toObj.value.trim();
            if (!from) return alert('Vui lÃ²ng nháº­p thá»i gian!');
            const finalTo = to || from;
            const s = dataCache.staff[parseInt(idx)];
            if (!s) return alert('KhÃ´ng tÃ¬m tháº¥y nhÃ¢n viÃªn!');
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

            google.script.run
                .withSuccessHandler(() => {
                    if (typeof window.showToast === 'function') window.showToast('ÄÃ£ cáº­p nháº­t giá» báº­n nhÃ¢n sá»±!', 'success');
                })
                .withFailureHandler(err => {
                    alert("Lá»—i lÆ°u giá» báº­n: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['staff'] = 0;
                    loadEntity('getNhanSu', 'staff', renderStaffTable, [
                        () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); }
                    ], true);
                })
                .editNhanSu(sheetIdx, s.ten, s.vaiTro || 'Ká»¹ thuáº­t viÃªn', s.trangThai || 'Äi lÃ m', s.thoiGianLam || '07:30-11:30, 13:00-16:30', kyNangStr, gioBanStr, s.nguoiThayThe || 'KhÃ´ng', s.quyen || 'Cáº£ hai', s.tenHis || '');
        });

        function deleteSingleStaffBusy() {
            if (checkUnclosedDay()) return;

            const select = document.getElementById('busy-staff-select');
            if (!select) return;
            const idx = select.value;
            if (idx === "" || idx === null || isNaN(parseInt(idx))) return alert('Vui lÃ²ng chá»n nhÃ¢n viÃªn!');
            const from = document.getElementById('busy-staff-from').value.trim();
            const to = document.getElementById('busy-staff-to').value.trim();
            if (!from) return alert('Vui lÃ²ng click vÃ o má»™t khoáº£ng giá» trÃªn báº£ng Ä‘á»ƒ xÃ³a!');
            const finalTo = to || from;
            const s = dataCache.staff[parseInt(idx)];
            if (!s || !s.gioBan) return;
            const slotToDelete = from + '-' + finalTo;

            showCustomConfirm("XÃ³a giá» báº­n", "BÃ¡c sÄ© cÃ³ muá»‘n xÃ³a giá» báº­n [ " + slotToDelete + " ] cá»§a NV: " + s.ten + "?", function () {
                const curSlots = (typeof s.gioBan === 'string' ? s.gioBan.split(',') : s.gioBan).map(x => x.trim()).filter(x => x && x !== slotToDelete);
                s.gioBan = curSlots.join(', ');
                renderStaffTable();
                if (typeof renderBusyStaff === 'function') renderBusyStaff();
                document.getElementById('busy-staff-from').value = '';
                document.getElementById('busy-staff-to').value = '';

                const sheetIdx = s.sheetIndex !== undefined ? s.sheetIndex : parseInt(idx);
                const kyNangStr = typeof s.kyNang === 'string' ? s.kyNang : (Array.isArray(s.kyNang) ? s.kyNang.join(', ') : '');
                const gioBanStr = typeof s.gioBan === 'string' ? s.gioBan : (Array.isArray(s.gioBan) ? s.gioBan.join(', ') : '');

                google.script.run
                    .withSuccessHandler(() => {
                        if (typeof window.showToast === 'function') window.showToast('ÄÃ£ xÃ³a giá» báº­n!', 'success');
                    })
                    .withFailureHandler(err => {
                        alert("Lá»—i xÃ³a giá» báº­n: " + (err.message || err));
                        if (window.dataCacheTime) window.dataCacheTime['staff'] = 0;
                        loadEntity('getNhanSu', 'staff', renderStaffTable, [
                            () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); }
                        ], true);
                    })
                    .editNhanSu(sheetIdx, s.ten, s.vaiTro || 'Ká»¹ thuáº­t viÃªn', s.trangThai || 'Äi lÃ m', s.thoiGianLam || '07:30-11:30, 13:00-16:30', kyNangStr, gioBanStr, s.nguoiThayThe || 'KhÃ´ng', s.quyen || 'Cáº£ hai', s.tenHis || '');
            });
        }

        function clearStaffBusy() {
            if (checkUnclosedDay()) return;

            const select = document.getElementById('busy-staff-select');
            if (!select) return;
            const idx = select.value;
            if (idx === "" || idx === null || isNaN(parseInt(idx))) return alert('Vui lÃ²ng chá»n nhÃ¢n viÃªn!');
            const s = dataCache.staff[parseInt(idx)];
            if (!s) return;
            if (!confirm("XÃ³a toÃ n bá»™ giá» báº­n cá»§a NV: " + s.ten + "?")) return;

            s.gioBan = ''; 
            renderStaffTable();
            if (typeof renderBusyStaff === 'function') renderBusyStaff();

            const sheetIdx = s.sheetIndex !== undefined ? s.sheetIndex : parseInt(idx);
            const kyNangStr = typeof s.kyNang === 'string' ? s.kyNang : (Array.isArray(s.kyNang) ? s.kyNang.join(', ') : '');

            google.script.run
                .withSuccessHandler(() => {
                    if (typeof window.showToast === 'function') window.showToast('ÄÃ£ xÃ³a toÃ n bá»™ giá» báº­n!', 'success');
                })
                .withFailureHandler(err => {
                    alert("Lá»—i xÃ³a giá» báº­n: " + (err.message || err));
                    if (window.dataCacheTime) window.dataCacheTime['staff'] = 0;
                    loadEntity('getNhanSu', 'staff', renderStaffTable, [
                        () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); }
                    ], true);
                })
                .editNhanSu(sheetIdx, s.ten, s.vaiTro || 'Ká»¹ thuáº­t viÃªn', s.trangThai || 'Äi lÃ m', s.thoiGianLam || '07:30-11:30, 13:00-16:30', kyNangStr, '', s.nguoiThayThe || 'KhÃ´ng', s.quyen || 'Cáº£ hai', s.tenHis || '');
        }



        // ============================================================

        // ðŸ“… TAB Xáº¾P Lá»ŠCH

        // ============================================================

        // Helper: Ä‘Ã¡nh dáº¥u bá»‡nh nhÃ¢n Ä‘Ã£ ra viá»‡n vÃ o dá»¯ liá»‡u lá»‹ch & tá»± phá»¥c há»“i tÃªn bá»‹ lá»—i kÃ½ tá»± láº¡
        function markDischargedInSchedule(schedData) {
            if (!Array.isArray(schedData)) return schedData;
            const patList = (typeof dataCache !== 'undefined' && dataCache.pat) ? dataCache.pat : [];
            const procList = (typeof dataCache !== 'undefined' && (dataCache.proc || dataCache.procedures)) ? (dataCache.proc || dataCache.procedures) : [];
            const cleanHealFn = (window.SchedulerEngine && typeof window.SchedulerEngine.cleanAndHealPatientName === 'function')
                ? window.SchedulerEngine.cleanAndHealPatientName
                : (n) => String(n || '').normalize('NFC').replace(/[\ufffd\u0000]/g, '').trim();
            const cleanHealProcFn = (window.SchedulerEngine && typeof window.SchedulerEngine.cleanAndHealProcedureName === 'function')
                ? window.SchedulerEngine.cleanAndHealProcedureName
                : (typeof window.cleanAndHealProcedureName === 'function' ? window.cleanAndHealProcedureName : (s => String(s || '').trim()));

            let hasHealedStorage = false;
            schedData.forEach((row, idx) => {
                if (!row) return;
                if (Array.isArray(row)) {
                    row = normalizeScheduleRow(row);
                    schedData[idx] = row;
                }

                // ðŸ©¹ Tá»± phá»¥c há»“i tÃªn thá»§ thuáº­t náº¿u cÃ³ kÃ½ tá»± láº¡ (nhÆ° "Ä‘iá»‡n ch??m" -> "Äiá»‡n chÃ¢m")
                if (row.thuThuat) {
                    const rawTT = String(row.thuThuat || '');
                    const healedTT = cleanHealProcFn(rawTT, procList);
                    if (healedTT && healedTT !== rawTT) {
                        row.thuThuat = healedTT;
                        hasHealedStorage = true;
                    }
                }

                let rawTen = String(row.tenBN || '').normalize('NFC').trim();
                const namSinh = String(row.namSinh || '').trim();
                const phong = String(row.phong || '').trim().toLowerCase();
                if (!rawTen) { row.__isDischarged = false; return; }

                let matched = null;
                // Æ¯u tiÃªn khá»›p chÃ­nh xÃ¡c cáº£ TÃªn, NÄƒm sinh vÃ  PhÃ²ng
                if (namSinh && phong) {
                    matched = patList.find(p => 
                        String(p.ten || '').normalize('NFC').trim().toLowerCase() === rawTen.toLowerCase() && 
                        String(p.namSinh || '').trim() === namSinh && 
                        String(p.phong || '').trim().toLowerCase() === phong
                    );
                }
                // Khá»›p chÃ­nh xÃ¡c TÃªn vÃ  NÄƒm sinh
                if (!matched && namSinh) {
                    matched = patList.find(p => 
                        String(p.ten || '').normalize('NFC').trim().toLowerCase() === rawTen.toLowerCase() && 
                        String(p.namSinh || '').trim() === namSinh
                    );
                }
                // Tá»± phá»¥c há»“i: náº¿u tÃªn cÃ³ kÃ½ tá»± láº¡ \uFFFD hoáº·c chuá»—i nuá»‘t chá»¯ (nhÆ° LNH)
                if (!matched && (rawTen.includes('\ufffd') || /\bL\s*NH\b/i.test(rawTen))) {
                    matched = patList.find(p => {
                        const pNs = String(p.namSinh || '').trim();
                        const pRoom = String(p.phong || '').trim().toLowerCase();
                        if (namSinh && pNs && namSinh !== pNs) return false;
                        if (phong && pRoom && phong !== pRoom) return false;
                        const cand = String(p.ten || '').normalize('NFC').trim();
                        return cleanHealFn(rawTen, [cand]) === cand.toUpperCase();
                    });
                }
                // Fallback chá»‰ khá»›p TÃªn náº¿u khÃ´ng cÃ³ nÄƒm sinh
                if (!matched) {
                    matched = patList.find(p => String(p.ten || '').normalize('NFC').trim().toLowerCase() === rawTen.toLowerCase());
                }

                if (matched) {
                    const cleanName = String(matched.ten || '').normalize('NFC').trim();
                    if (cleanName && !cleanName.includes('\ufffd') && row.tenBN !== cleanName) {
                        row.tenBN = cleanName.toUpperCase();
                        hasHealedStorage = true;
                    }
                } else if (rawTen.includes('\ufffd') || rawTen.includes('?')) {
                    const selfHealed = cleanHealFn(rawTen, [], true);
                    if (selfHealed && selfHealed !== row.tenBN) {
                        row.tenBN = selfHealed;
                        hasHealedStorage = true;
                    }
                }
                row.__isDischarged = !!(matched && matched.gioRa && String(matched.gioRa).trim() !== '');
            });

            // Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ láº¡i cache localStorage náº¿u dá»¯ liá»‡u cÅ© vá»«a Ä‘Æ°á»£c chá»¯a lÃ nh
            if (hasHealedStorage) {
                try {
                    const curKey = typeof getUnitStorageKey === 'function' ? getUnitStorageKey('meds_success') : 'meds_success';
                    localStorage.setItem(curKey, JSON.stringify(schedData));
                    localStorage.setItem('meds_success', JSON.stringify(schedData));
                    if (typeof dataCache !== 'undefined') dataCache.schedule = schedData;
                    if (window.dataCache) window.dataCache.schedule = schedData;
                } catch (e) {}
            }

            return schedData;
        }

        function loadScheduleList() {
            if (window.viewingImportedScheduleFile) return;

            const curUnit = getCurrentUnitCode();
            let data = (typeof dataCache !== 'undefined' && dataCache.schedule) ? dataCache.schedule : [];
            if (!data.length) {
                try {
                    const savedUnit = (localStorage.getItem('meds_schedule_unit') || '').toLowerCase();
                    // Chá»‰ dÃ¹ng cache local Náº¾U cÃ³ savedUnit VÃ€ Ä‘Ãºng Ä‘Æ¡n vá»‹ hiá»‡n hÃ nh!
                    if (savedUnit && savedUnit === curUnit) {
                        const localSched = JSON.parse(localStorage.getItem(getUnitStorageKey('meds_success')) || localStorage.getItem('meds_success') || '[]');
                        if (Array.isArray(localSched) && localSched.length) {
                            const savedDate = localStorage.getItem(getUnitStorageKey('meds_schedule_date')) || localStorage.getItem('meds_schedule_date') || '';
                            const nowVN3 = new Date(Date.now() + 7 * 60 * 60 * 1000);
                            const todayYMD3 = `${nowVN3.getUTCFullYear()}-${String(nowVN3.getUTCMonth() + 1).padStart(2, '0')}-${String(nowVN3.getUTCDate()).padStart(2, '0')}`;
                            const toYMD3 = (s) => { if (!s) return ''; if (String(s).includes('/')) { const p = String(s).split('/'); return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`; } return String(s); };
                            const rawDate = savedDate || (Array.isArray(localSched[0]) ? localSched[0][0] : (localSched[0]?.ngay || localSched[0]?.NGAY || localSched[0]?.date || ''));
                            const schedDate3 = toYMD3(rawDate);
                            
                            // âš ï¸ CHá»ˆ dÃ¹ng cache local Náº¾U cÃ³ ngÃ y xÃ¡c Ä‘á»‹nh vÃ  ÄÃšNG ngÃ y hÃ´m nay!
                            if (schedDate3 && schedDate3 === todayYMD3) {
                                data = localSched;
                                if (typeof dataCache !== 'undefined') dataCache.schedule = localSched;
                                if (window.dataCache) window.dataCache.schedule = localSched;
                            } else {
                                localStorage.removeItem(getUnitStorageKey('meds_success'));
                                localStorage.removeItem(getUnitStorageKey('meds_schedule_date'));
                                localStorage.removeItem(getUnitStorageKey('meds_unscheduled'));
                                localStorage.removeItem('meds_success');
                                localStorage.removeItem('meds_schedule_date');
                                localStorage.removeItem('meds_unscheduled');
                                localStorage.removeItem('meds_schedule_unit');
                                data = [];
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

        // --- QUáº¢N LÃ PHÃ‚N TRANG RIÃŠNG BIá»†T ---

        const PAGE_SIZE = 500; // Sá»‘ ca hiá»ƒn thá»‹ má»—i trang (Äá»ƒ sá»‘ cá»±c lá»›n Ä‘á»ƒ táº¯t phÃ¢n trang)



        // Bá»™ nhá»› cho Tab Xáº¿p Lá»‹ch

        let schedCurrentPage = 1;

        let schedFilteredData = [];



        // Bá»™ nhá»› cho Tab Trang Chá»§

        let homeCurrentPage = 1;

        let homeFilteredData = [];



        // 1. HÃ m lá»c dá»¯ liá»‡u (ÄÃ£ tÃ­ch há»£p Fuse.js & TÃ¬m kiáº¿m tiáº¿ng Viá»‡t khÃ´ng dáº¥u chuáº©n xÃ¡c 100%)
        function filterSchedule() {
            const rawQ = document.getElementById('schedule-search-input')?.value || '';
            const q = rawQ.trim();
            const qLower = q.toLowerCase();
            const qNoTone = removeVietnameseTones(q);

            const safeData = (window.currentScheduleData || []).map(normalizeScheduleRow);
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
                    gioDienRa: 'âŒ Rá»›t',
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



        // 2. HÃ m váº½ báº£ng (Chá»‰ váº½ pháº§n dá»¯ liá»‡u cá»§a trang hiá»‡n táº¡i) - Báº¢N CHUáº¨N 12 Cá»˜T

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

                    if (!isNaN(numA) && !isNaN(numB) && !String(valA).match(/[a-zA-ZÃ€-á»¹]/) && !String(valB).match(/[a-zA-ZÃ€-á»¹]/)) {

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



                // ðŸ’¡ Sáº¯p xáº¿p máº·c Ä‘á»‹nh: TÃªn NV chÃ­nh (A-Z) -> Thá»i gian báº¯t Ä‘áº§u (Sá»›m - Muá»™n)

                // Æ¯u tiÃªn 1: TÃªn NhÃ¢n viÃªn chÃ­nh

                let nvA = String(a.nvChinh || '').trim().toLowerCase();

                let nvB = String(b.nvChinh || '').trim().toLowerCase();

                if (nvA !== nvB) return nvA.localeCompare(nvB, 'vi');



                // Æ¯u tiÃªn 2: Thá»i gian báº¯t Ä‘áº§u

                let timeA = String(a.gioDienRa || '').replace(':', '');

                let timeB = String(b.gioDienRa || '').replace(':', '');

                return timeA.localeCompare(timeB);

            };

            schedFilteredData.sort(compareScheduleRows);



            if (schedFilteredData.length === 0) {
                if (window._todayIsFinalized) {
                    const countTxt = window._finalizedTodayCount ? `${window._finalizedTodayCount.toLocaleString('vi-VN')} ca` : 'toÃ n bá»™ ca thá»§ thuáº­t';
                    tbody.innerHTML = `<tr>
                        <td colspan="12" style="text-align:center; padding: 45px 20px; background:#f8fafc;">
                            <div style="max-width:560px; margin:0 auto;">
                                <div style="font-size:36px; margin-bottom:10px;">ðŸ“‹</div>
                                <div style="font-size:16px; font-weight:700; color:#1e293b; margin-bottom:6px;">HÃ´m nay Ä‘Ã£ hoÃ n táº¥t chá»‘t sá»• ngÃ y</div>
                                <div style="font-size:13px; color:#64748b; margin-bottom:18px; line-height:1.6;">
                                    Lá»‹ch trÃ¬nh hÃ´m nay (${countTxt}) Ä‘Ã£ Ä‘Æ°á»£c lÆ°u trá»¯ an toÃ n vÃ o Lá»‹ch sá»­. Báº£ng lá»‹ch trÃ¬nh hiá»‡n táº¡i Ä‘Ã£ sáºµn sÃ ng cho ngÃ y má»›i hoáº·c láº§n xáº¿p lá»‹ch tiáº¿p theo.
                                </div>
                                <button type="button" class="btn-primary" onclick="if(typeof switchTab==='function')switchTab('tab-lich-su')" style="padding:9px 20px; font-size:13px; border-radius:6px; background:#16a085; color:#fff; border:none; cursor:pointer; font-weight:700; box-shadow:0 2px 8px rgba(22,160,133,0.3); display:inline-flex; align-items:center; gap:6px;">
                                    <span>ðŸ‘ï¸</span> Xem Dá»¯ Liá»‡u Trong Lá»‹ch Sá»­
                                </button>
                            </div>
                        </td>
                    </tr>`;
                } else {
                    tbody.innerHTML = `<tr>
                        <td colspan="12" style="text-align:center; padding: 35px 20px; color:#94a3b8; font-style:italic;">
                            ChÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch trÃ¬nh. BÃ¡c sÄ© hÃ£y báº¥m "Xáº¿p Lá»‹ch Tá»± Äá»™ng" Ä‘á»ƒ báº¯t Ä‘áº§u.
                        </td>
                    </tr>`;
                }
                renderPaginationUI('sched-pagination-container', 0, 1, 1, 'SCHED');
                return;
            }

            const totalPages = Math.ceil(schedFilteredData.length / PAGE_SIZE) || 1;

            const start = (schedCurrentPage - 1) * PAGE_SIZE;

            const pageData = schedFilteredData.slice(start, start + PAGE_SIZE);

            tbody.innerHTML = pageData.map((item, i) => {

                const ngayShort = item.ngay ? String(item.ngay).split('-').reverse().join('/').substring(0, 5) : '';

                const rowClass = item.__dropped ? 'row-dropped' : 'row-scheduled';

                const reasonTitle = item.__dropped ? ` title="${item.reason || item.may || 'KhÃ´ng xáº¿p Ä‘Æ°á»£c'}"` : '';

                const isDischarged = !!item.__isDischarged;
                const dischargeMark = isDischarged ? ' <span style="color:#27ae60; font-size:10.5px; font-style:italic; font-weight:700; white-space:nowrap; margin-left:4px;">(âœ” RV)</span>' : '';

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



            // Váº½ thanh Ä‘iá»u hÆ°á»›ng riÃªng cho Xáº¿p lá»‹ch

            renderPaginationUI('sched-pagination-container', schedFilteredData.length, schedCurrentPage, totalPages, 'SCHED');

        }



        // 3. HÃ m táº¡o Thanh Ä‘iá»u hÆ°á»›ng (ÄÃƒ TÃCH Há»¢P NÃšT XUáº¤T PDF)

        function renderPaginationUI(containerId, totalItems, currentPage, totalPages, context) {

            let container = document.getElementById(containerId);

            if (!container) return;



            // áº¨n hoÃ n toÃ n khi chá»‰ cÃ³ 1 trang

            if (totalPages <= 1) {

                container.style.display = 'none';

                return;

            }

            container.style.display = '';



            const startItem = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

            const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);



            container.className = 'pagination-container';
            container.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px; font-size:13px; position:-webkit-sticky; position:sticky; bottom:0; z-index:950; box-shadow:0 -4px 12px rgba(0,0,0,0.1); margin:0; border-radius:0 0 8px 8px;';



            // ÄÃ£ xÃ³a sáº¡ch biáº¿n pdfBtn gÃ¢y lá»—i sáº­p Web

            container.innerHTML = `

        <div style="display:flex; align-items:center; gap:20px;">

            <div style="color:#7f8c8d;">Hiá»ƒn thá»‹ <b style="color:#2c3e50">${startItem}</b> Ä‘áº¿n <b style="color:#2c3e50">${endItem}</b> trong <b>${totalItems}</b> ca</div>

        </div>

        <div style="display:flex; gap:8px;">

            <button onclick="appChangePage(-1, '${context}')" ${currentPage === 1 ? 'disabled' : ''} style="padding:6px 12px; border:1px solid #ccc; background:${currentPage === 1 ? '#eee' : '#fff'}; cursor:${currentPage === 1 ? 'not-allowed' : 'pointer'}; border-radius:4px; font-weight:bold; color:#333;">â¬…ï¸ TrÆ°á»›c</button>

            <span style="padding:6px 12px; font-weight:bold; color:#27ae60; background:#e8f8f5; border-radius:4px;">Trang ${currentPage} / ${totalPages}</span>

            <button onclick="appChangePage(1, '${context}')" ${currentPage === totalPages ? 'disabled' : ''} style="padding:6px 12px; border:1px solid #ccc; background:${currentPage === totalPages ? '#eee' : '#fff'}; cursor:${currentPage === totalPages ? 'not-allowed' : 'pointer'}; border-radius:4px; font-weight:bold; color:#333;">Tiáº¿p âž¡ï¸</button>

        </div>

    `;

        }



        // HÃ m Ä‘á»•i trang thÃ´ng minh

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



        // 4. Lá»‡nh láº­t trang

        function changeSchedPage(dir) {

            const totalPages = Math.ceil((schedFilteredData || []).length / PAGE_SIZE) || 1;

            schedCurrentPage += dir;

            if (schedCurrentPage < 1) schedCurrentPage = 1;

            if (schedCurrentPage > totalPages) schedCurrentPage = totalPages;



            // ðŸ”¥ Ã‰p há»‡ thá»‘ng váº½ láº¡i báº£ng cá»§a tab Xáº¿p Lá»‹ch

            renderSchedPage();

        }

        function runScheduling() {
            if (!document.getElementById('schedule-date').value) return alert("Vui lÃ²ng chá»n ngÃ y xáº¿p lá»‹ch trÆ°á»›c!");
            document.getElementById('strategyModal').style.display = 'flex';
            if (window._crowdedMode === null || window._crowdedMode === undefined) {
                setCrowdedMode(true);
            }
            updateMiniPCSolverStatusUI();
        }

        async function updateMiniPCSolverStatusUI() {
            const dot = document.getElementById('minipc-solver-dot');
            const label = document.getElementById('minipc-solver-label');
            const chk = document.getElementById('chk-use-minipc-solver');
            if (!dot || !label) return;

            // 1. Kiá»ƒm tra bá»™ Ä‘á»‡m tá»©c thÃ¬ náº¿u tráº¡m Ä‘Ã£ sáºµn sÃ ng tá»« trÆ°á»›c (0ms, khÃ´ng flicker)
            if (window.SchedulerEngine && typeof window.SchedulerEngine.getCachedSolverInfo === 'function') {
                const cached = window.SchedulerEngine.getCachedSolverInfo();
                if (cached && cached.online) {
                    dot.style.background = '#27ae60';
                    dot.style.boxShadow = '0 0 7px #2ecc71';
                    label.innerHTML = `ðŸŸ¢ Tráº¡m Mini PC: <b style="color:#27ae60;">Sáºµn sÃ ng</b> (Google OR-Tools CP-SAT 4 Luá»“ng)`;
                    if (chk) { chk.disabled = false; }
                    return;
                }
            }

            dot.style.background = '#f39c12';
            dot.style.boxShadow = '0 0 5px #f39c12';
            label.innerHTML = '<span style="color:#d35400;">Tráº¡m Mini PC: Äang kiá»ƒm tra...</span>';

            try {
                if (window.SchedulerEngine && typeof window.SchedulerEngine.getMiniPCSolverInfo === 'function') {
                    const info = await window.SchedulerEngine.getMiniPCSolverInfo(1000);
                    if (info && info.online) {
                        dot.style.background = '#27ae60';
                        dot.style.boxShadow = '0 0 7px #2ecc71';
                        label.innerHTML = `ðŸŸ¢ Tráº¡m Mini PC: <b style="color:#27ae60;">Sáºµn sÃ ng</b> (Google OR-Tools CP-SAT 4 Luá»“ng)`;
                        if (chk) { chk.disabled = false; }
                        return;
                    }
                }
            } catch (e) {}

            dot.style.background = '#95a5a6';
            dot.style.boxShadow = 'none';
            label.innerHTML = `âšª Tráº¡m Mini PC: <span style="color:#7f8c8d;">Ngoáº¡i tuyáº¿n</span> (DÃ¹ng Turbo-Engine JS)`;
            if (chk) { chk.disabled = true; chk.checked = false; }
        }
        window.updateMiniPCSolverStatusUI = updateMiniPCSolverStatusUI;

        function closeStrategyModal() { document.getElementById('strategyModal').style.display = 'none'; }

        // Tráº¡ng thÃ¡i chá»n ngÃ y Ä‘Ã´ng/váº¯ng, máº·c Ä‘á»‹nh = null (tá»± Ä‘á»™ng tÃ­nh)
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
            const preferLocal = document.getElementById('chk-use-minipc-solver')?.checked ?? true;
            closeStrategyModal();
            const dateVal = document.getElementById('schedule-date').value;
            const skipVal = document.getElementById('modal-skip-procs')?.value || "";
            // Truyá»n lá»±a chá»n ngÃ y Ä‘Ã´ng/váº¯ng: 1 = Ä‘Ã´ng, 0 = váº¯ng, -1 = tá»± Ä‘á»™ng
            const crowdedVal = window._crowdedMode === true ? 1 : (window._crowdedMode === false ? 0 : -1);
            const res = document.getElementById('schedule-result');
            const list = document.getElementById('schedule-list');
            const btn = document.getElementById('btn-run-sched');

            btn.innerText = 'â³ ÄANG Xáº¾P Lá»ŠCH (AI + CP-SAT)...'; btn.disabled = true; btn.style.background = '#f39c12';
            res.innerHTML = '';
            list.innerHTML = '<tr><td colspan="12" align="center"><div class="spinner"></div></td></tr>';

            const startTime = performance.now();
            if (window.showGlobalLoading) window.showGlobalLoading("Äang cháº¡y thuáº­t toÃ¡n tá»‘i Æ°u xáº¿p lá»‹ch (AI + CP-SAT)...");
            await new Promise(r => setTimeout(r, 16)); // Yield 1 frame for silky-smooth UI paint

            try {
                let out = null;
                const yhctLunchNum = (dataCache?.settings?.yhctLunch !== undefined && dataCache.settings.yhctLunch !== '') ? Math.max(0, parseInt(dataCache.settings.yhctLunch) || 0) : 0;
                const yhctEndNum = (dataCache?.settings?.yhctEnd !== undefined && dataCache.settings.yhctEnd !== '') ? Math.max(0, parseInt(dataCache.settings.yhctEnd) || 0) : 0;
                const schedulingOptions = {
                    preferLocalSolver: preferLocal,
                    weights: {
                        drop: parseInt(dataCache?.settings?.dropWeight) || 10000,
                        overtime: parseFloat(dataCache?.settings?.overtimeWeight) || 2,
                        imbalance: parseFloat(dataCache?.settings?.imbalanceWeight) || 0.1,
                        yhctLunch: yhctLunchNum,
                        yhctEnd: yhctEndNum
                    }
                };
                if (window.SchedulerEngine && typeof window.SchedulerEngine.runSchedulingAsync === 'function') {
                    out = await window.SchedulerEngine.runSchedulingAsync(dateVal, strategy, skipVal, crowdedVal, [], schedulingOptions);
                } else if (window.SchedulerEngine && typeof window.SchedulerEngine.runScheduling === 'function') {
                    out = window.SchedulerEngine.runScheduling(dateVal, strategy, skipVal, crowdedVal, [], schedulingOptions);
                }

                if (window.hideGlobalLoading) window.hideGlobalLoading();
                const timeTaken = (out && out.elapsedMs !== undefined) ? (out.elapsedMs / 1000).toFixed(2) : ((performance.now() - startTime) / 1000).toFixed(2);
                btn.innerText = 'CHáº Y Xáº¾P Lá»ŠCH Tá»”NG'; btn.disabled = false; btn.style.background = '#008b02';

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
                const schedJson = JSON.stringify(sched);
                const unschJson = JSON.stringify(unsch);
                localStorage.setItem(getUnitStorageKey('meds_success'), schedJson);
                localStorage.setItem('meds_success', schedJson);
                localStorage.setItem(getUnitStorageKey('meds_unscheduled'), unschJson);
                localStorage.setItem('meds_unscheduled', unschJson);

                if (window.OfflineSyncEngine && typeof window.OfflineSyncEngine.saveCache === 'function') {
                    window.OfflineSyncEngine.saveCache('meds_success', sched);
                    window.OfflineSyncEngine.broadcastLiveEvent('SCHEDULE_GENERATED', { date: dateVal, schedCount, unschCount });
                }

                res.innerHTML = '<div class="alert alert-success" style="margin-top:10px">Xáº¿p thÃ nh cÃ´ng: <b>' + schedCount + '</b> ca. Rá»›t: <b>' + unschCount + '</b> ca. <span style="margin-left:15px; color:#555; font-size:13px;">(ðŸš€ <b>' + engineInfo + '</b> | â± <b>' + timeTaken + 's</b>)</span></div>';
                
                // Hiá»ƒn thá»‹ Popup káº¿t quáº£ tá»©c thÃ¬
                const contentEl = document.getElementById('custom-popup-content');
                if (contentEl) contentEl.innerHTML = `
                <div>âœ… Xáº¿p thÃ nh cÃ´ng: <b style="color:#27ae60; font-size:18px;">${schedCount}</b> ca</div>
                <div>âŒ KhÃ´ng xáº¿p Ä‘Æ°á»£c: <b style="color:#c0392b; font-size:18px;">${unschCount}</b> ca</div>
                <hr style="border:0; border-top:1px dashed #ccc; margin:10px 0;">
                <div style="font-size:13px; color:#16a085;">ðŸš€ Äá»™ng cÆ¡: <b>${engineInfo}</b></div>
                <div style="font-size:13px; color:#7f8c8d; margin-top:3px;">â± Thá»i gian: <b>${timeTaken}</b> giÃ¢y</div>
                ${unschCount > 0 ? `
                <button type="button" onclick="openUnscheduledAdvisorModal(); document.getElementById('custom-success-popup').style.display='none';" style="margin-top:12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color:#fff; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-weight:700; width:100%; box-shadow:0 4px 10px rgba(59,130,246,0.3); font-size:13.5px; display:flex; align-items:center; justify-content:center; gap:8px;">
                    ðŸ’¡ Cá»‘ Váº¥n Giáº£i Cá»©u (${unschCount} ca rá»›t)
                </button>` : ''}`;
                const popup = document.getElementById('custom-success-popup');
                if (popup) popup.style.display = 'flex';

                // Cáº­p nháº­t láº¡i lá»‹ch hiá»ƒn thá»‹
                filterSchedule();

                // TrÃ¬ hoÃ£n cÃ¡c tÃ¡c vá»¥ váº½ láº¡i Dashboard & lÆ°u cache náº·ng sang luá»“ng phá»¥
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

                // Äá»“ng bá»™ lÆ°u lá»‹ch trÃ¬nh vÃ o D1 SQLite trong ná»n (15ms, khÃ´ng lÃ m Ä‘Æ¡ giao diá»‡n)
                if (sched.length > 0) {
                    const backendSched = sched.map(x => scheduleRowToBackendArray(x, dateVal));
                    callApi('saveSchedule', [dateVal, backendSched], null, null);
                }
            } catch(err) {
                if (window.hideGlobalLoading) window.hideGlobalLoading();
                btn.innerText = 'CHáº Y Xáº¾P Lá»ŠCH Tá»”NG'; btn.disabled = false; btn.style.background = '#008b02';
                res.innerHTML = '<div class="alert alert-danger">Lá»—i xáº¿p lá»‹ch: ' + err.message + '</div>';
            }
        }

        async function runExtraScheduling() {
            window.viewingImportedScheduleFile = false;
            const dateVal = document.getElementById('schedule-date').value;
            if (!dateVal) return alert("Vui lÃ²ng chá»n ngÃ y Ä‘á»ƒ xáº¿p bá»• sung!");
            const btn = document.getElementById('btn-run-extra');
            btn.innerText = 'â³ ÄANG TÃŒM CHá»– TRá»NG...'; btn.disabled = true;

            if (window.showGlobalLoading) window.showGlobalLoading("Äang xáº¿p lá»‹ch bá»• sung bá»‡nh nhÃ¢n má»›i (Äa Luá»“ng)...");

            try {
                const rawCurrent = window.currentScheduleData || (typeof dataCache !== 'undefined' && dataCache.schedule) || [];
                const currentSched = (Array.isArray(rawCurrent) ? rawCurrent : [])
                    .map(normalizeScheduleRow)
                    .filter(r => r && !isDroppedScheduleRow(r) && r.gioDienRa && r.gioDienRa !== '--' && !String(r.gioDienRa).includes('Rá»›t'));
                let out = null;
                const yhctLunchExtraNum = (dataCache?.settings?.yhctLunch !== undefined && dataCache.settings.yhctLunch !== '') ? Math.max(0, parseInt(dataCache.settings.yhctLunch) || 0) : 0;
                const yhctEndExtraNum = (dataCache?.settings?.yhctEnd !== undefined && dataCache.settings.yhctEnd !== '') ? Math.max(0, parseInt(dataCache.settings.yhctEnd) || 0) : 0;
                const extraSchedulingOptions = {
                    weights: {
                        drop: parseInt(dataCache?.settings?.dropWeight) || 10000,
                        overtime: parseFloat(dataCache?.settings?.overtimeWeight) || 2,
                        imbalance: parseFloat(dataCache?.settings?.imbalanceWeight) || 0.1,
                        yhctLunch: yhctLunchExtraNum,
                        yhctEnd: yhctEndExtraNum
                    }
                };
                if (window.SchedulerEngine && typeof window.SchedulerEngine.runSchedulingAsync === 'function') {
                    out = await window.SchedulerEngine.runSchedulingAsync(dateVal, 'opt_rare', '', -1, currentSched, extraSchedulingOptions);
                } else if (window.SchedulerEngine && typeof window.SchedulerEngine.runExtraScheduling === 'function') {
                    out = window.SchedulerEngine.runExtraScheduling(dateVal, currentSched, extraSchedulingOptions);
                } else if (window.SchedulerEngine && typeof window.SchedulerEngine.runScheduling === 'function') {
                    out = window.SchedulerEngine.runScheduling(dateVal, 'opt_rare', '', -1, currentSched, extraSchedulingOptions);
                }

                if (window.hideGlobalLoading) window.hideGlobalLoading();
                btn.innerText = 'âš¡ Xáº¾P Bá»” SUNG BN Má»šI'; btn.disabled = false;

                const newSched = (out && (out.schedule || out.sched)) ? (out.schedule || out.sched) : [];
                const newUnsch = (out && (out.unscheduled || out.rot)) ? (out.unscheduled || out.rot) : [];
                const addedCount = newSched.length;

                if (addedCount > 0) {
                    // ðŸ›¡ï¸ Tá»± Ä‘á»™ng Ä‘á»‘i chiáº¿u vÃ  phá»¥c há»“i há» tÃªn bá»‡nh nhÃ¢n sáº¡ch tá»« currentSched vÃ  dataCache.pat
                    const cleanHealFn = (window.SchedulerEngine && typeof window.SchedulerEngine.cleanAndHealPatientName === 'function')
                        ? window.SchedulerEngine.cleanAndHealPatientName
                        : (n) => String(n || '').normalize('NFC').replace(/[\ufffd\u0000]/g, '').trim();

                    const candNames = [];
                    currentSched.forEach(r => {
                        const n = String(r?.tenBN || r?.HOTEN || '').normalize('NFC').trim();
                        if (n && !n.includes('\ufffd') && !candNames.includes(n)) candNames.push(n);
                    });
                    const patList = (typeof dataCache !== 'undefined' && dataCache.pat) ? dataCache.pat : [];
                    patList.forEach(p => {
                        const n = String(p?.ten || p?.name || '').normalize('NFC').trim();
                        if (n && !n.includes('\ufffd') && !candNames.includes(n)) candNames.push(n);
                    });

                    newSched.forEach(row => {
                        if (!row) return;
                        const rName = String(row.tenBN || row.HOTEN || '').normalize('NFC').trim();
                        const rNs = String(row.namSinh || '').trim();

                        // Khá»›p Ä‘Ãºng há» tÃªn bá»‡nh nhÃ¢n, tuyá»‡t Ä‘á»‘i khÃ´ng gÃ¡n Ä‘Ã¨ sang bá»‡nh nhÃ¢n khÃ¡c
                        const matchedPat = patList.find(p => {
                            const pName = String(p?.ten || p?.name || '').normalize('NFC').trim();
                            const pNs = String(p?.namSinh || '').trim();
                            return pName.toLowerCase() === rName.toLowerCase() && (!rNs || !pNs || rNs === pNs);
                        }) || currentSched.find(r => {
                            const pName = String(r?.tenBN || r?.HOTEN || '').normalize('NFC').trim();
                            const pNs = String(r?.namSinh || '').trim();
                            return pName.toLowerCase() === rName.toLowerCase() && (!rNs || !pNs || rNs === pNs);
                        });

                        if (matchedPat) {
                            const mName = String(matchedPat.ten || matchedPat.tenBN || matchedPat.name || '').normalize('NFC').trim();
                            if (mName && !mName.includes('\ufffd')) {
                                row.tenBN = mName.toUpperCase();
                            }
                        } else {
                            row.tenBN = cleanHealFn(rName, [], true);
                        }
                    });

                    const mergedSched = [...currentSched];
                    newSched.forEach(item => {
                        const normItem = normalizeScheduleRow(item);
                        const isDup = mergedSched.some(ex => 
                            (ex.tenBN || '').trim().toLowerCase() === (normItem.tenBN || '').trim().toLowerCase() &&
                            (ex.thuThuat || '').trim().toLowerCase() === (normItem.thuThuat || '').trim().toLowerCase() &&
                            (ex.gioDienRa || '').trim() === (normItem.gioDienRa || '').trim()
                        );
                        if (!isDup) {
                            mergedSched.push(normItem);
                        }
                    });

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

                    const backendSched = mergedSched.map(x => scheduleRowToBackendArray(x, dateVal));
                    callApi('saveSchedule', [dateVal, backendSched], null, null);
                }

                // ðŸ›¡ï¸ Lá»c ra cÃ¡c ca THá»°C Sá»° khÃ´ng xáº¿p Ä‘Æ°á»£c:
                // Loáº¡i bá» cÃ¡c ca Ä‘Ã£ cÃ³ trong lá»‹ch hiá»‡n táº¡i khá»i danh sÃ¡ch rá»›t
                // (TrÃ¡nh hiá»ƒn thá»‹ sai "Rá»›t" cho cÃ¡c ca Ä‘Ã£ Ä‘Æ°á»£c xáº¿p tá»« lÆ°á»£t trÆ°á»›c do engine re-process do name matching tháº¥t báº¡i)
                const effectiveSchedule = (Array.isArray(window.currentScheduleData) ? window.currentScheduleData : currentSched);
                const trulyUnsch = newUnsch.filter(rot => {
                    const rotName = String(rot.bn || rot.tenBN || '').normalize('NFC').trim().toUpperCase();
                    const rotProc = String(rot.tt || rot.thuThuat || '').trim().toLowerCase();
                    const rotNs = String(rot.ns || rot.namSinh || '').trim();
                    return !effectiveSchedule.some(row => {
                        if (!row) return false;
                        const rowName = String(row.tenBN || '').normalize('NFC').trim().toUpperCase();
                        const rowProc = String(row.thuThuat || '').trim().toLowerCase();
                        const rowNs = String(row.namSinh || '').trim();
                        return rowName === rotName && rowProc === rotProc &&
                               (!rotNs || !rowNs || rotNs === rowNs ||
                                (rotNs.length >= 2 && rowNs.length >= 2 && rotNs.slice(-2) === rowNs.slice(-2)));
                    });
                });
                setUnscheduledData(trulyUnsch, dateVal);
                filterSchedule();
                if (typeof renderStats === 'function') renderStats(window.lastUnscheduledData);
                if (typeof renderPatientsTable === 'function') renderPatientsTable();
                if (typeof loadDashboard === 'function') loadDashboard();

                const totalFail = window.lastUnscheduledData ? window.lastUnscheduledData.length : 0;
                const contentEl = document.getElementById('custom-popup-content');
                if (contentEl) contentEl.innerHTML = `
                <div>âœ… Xáº¿p bá»• sung thÃ nh cÃ´ng: <b style="color:#27ae60; font-size:18px;">${addedCount}</b> ca</div>
                <div>âŒ KhÃ´ng xáº¿p Ä‘Æ°á»£c láº§n nÃ y: <b style="color:#c0392b; font-size:18px;">${trulyUnsch.length}</b> ca</div>
                <hr style="border:0; border-top:1px dashed #ccc; margin:10px 0;">
                <div style="font-size:14px; color:#7f8c8d;">Tá»•ng sá»‘ ca rá»›t hiá»‡n táº¡i: <b>${totalFail}</b> ca</div>
                ${totalFail > 0 ? `
                <button type="button" onclick="openUnscheduledAdvisorModal(); document.getElementById('custom-success-popup').style.display='none';" style="margin-top:12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color:#fff; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-weight:700; width:100%; box-shadow:0 4px 10px rgba(59,130,246,0.3); font-size:13.5px; display:flex; align-items:center; justify-content:center; gap:8px;">
                    ðŸ’¡ Cá»‘ Váº¥n Giáº£i Cá»©u (${totalFail} ca rá»›t)
                </button>` : ''}`;
                const popup = document.getElementById('custom-success-popup');
                if (popup) popup.style.display = 'flex';
            } catch(err) {
                if (window.hideGlobalLoading) window.hideGlobalLoading();
                btn.innerText = 'âš¡ Xáº¾P Bá»” SUNG BN Má»šI'; btn.disabled = false;
                console.error("Error in runExtraScheduling:", err);
                const res = document.getElementById('schedule-result');
                if (res) res.innerHTML = '<div class="alert alert-danger" style="margin-top:10px">âŒ Lá»—i há»‡ thá»‘ng: ' + err.message + '</div>';
                alert("Lá»—i xáº¿p bá»• sung: " + err.message);
            }
        }



        // ============================================================

        // ðŸ“Š THá»NG KÃŠ

        // ============================================================

        function renderStats(unscheduledData) {

            const rawData = window.currentScheduleData || [];

            const unscheduled = (unscheduledData === undefined ? window.lastUnscheduledData : unscheduledData) || [];

            const successData = rawData.filter(item => { const g = item.gioDienRa || ''; return g && g !== '--' && !g.includes('Rá»›t'); });

            const success = successData.length, fail = unscheduled.length, total = success + fail;

            const rate = total === 0 ? 0 : ((success / total) * 100).toFixed(1);

            document.getElementById('stat-success').innerText = success;

            document.getElementById('stat-fail').innerText = fail;

            document.getElementById('stat-rate').innerText = rate + '%';

            const un_tbody = document.getElementById('stats-unscheduled-list');

            un_tbody.innerHTML = fail === 0

                ? `<tr><td colspan="6" align="center" style="padding:20px;">KhÃ´ng cÃ³ ca rá»›t</td></tr>`

                : unscheduled.map((raw, i) => {

                    const item = normalizeDroppedItem(raw);

                    const causeBadge = item.causeTitle 
                        ? `<span class="rescue-badge-cause cause-${item.causeCode || 'STAFF_UNAVAILABLE'}">${item.causeTitle}</span>` 
                        : `<span class="rescue-badge-cause cause-STAFF_UNAVAILABLE">ðŸŸ¡ ChÆ°a xáº¿p Ä‘Æ°á»£c</span>`;

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
                                ðŸ’¡ Cá»‘ Váº¥n
                            </button>
                        </td>
                    </tr>`;

                }).join('');

            const st_tbody = document.getElementById('stats-staff-list');

            if (!success) { st_tbody.innerHTML = '<tr><td colspan="4" align="center" style="padding:20px;">ChÆ°a cÃ³ dá»¯ liá»‡u</td></tr>'; return; }

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
        // ðŸ’¡ Bá»˜ Cá» Váº¤N GIáº¢I Cá»¨U CA Rá»šT THÃ”NG MINH (SMART UNSCHEDULED ADVISOR)
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
                badgeEl.innerText = `${count} ca rá»›t`;
                badgeEl.style.background = count > 0 ? '#ef4444' : '#10b981';
            }

            if (count === 0) {
                bodyEl.innerHTML = `
                <div style="text-align: center; padding: 50px 20px;">
                    <div style="font-size: 60px; margin-bottom: 16px;">ðŸŽ‰</div>
                    <h4 style="color: #10b981; font-size: 20px; font-weight: 800; margin: 0 0 10px 0;">TUYá»†T Vá»œI! KHÃ”NG CÃ“ CA THá»¦ THUáº¬T NÃ€O Bá»Š Rá»šT</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Táº¥t cáº£ ca bá»‡nh trong ngÃ y Ä‘á»u Ä‘Ã£ Ä‘Æ°á»£c xáº¿p lá»‹ch thÃ nh cÃ´ng 100%.</p>
                </div>`;
                return;
            }

            let html = '';
            unscheduled.forEach((item, rotIndex) => {
                const bnName = escapeHtml(item.bn || 'ChÆ°a rÃµ');
                const procName = escapeHtml(item.tt || 'Thá»§ thuáº­t');
                const roomName = escapeHtml(item.room || item.phong || 'ChÆ°a xáº¿p phÃ²ng');
                const causeCode = item.causeCode || 'STAFF_UNAVAILABLE';
                const causeTitle = item.causeTitle || 'ðŸŸ¡ ChÆ°a xáº¿p Ä‘Æ°á»£c';
                const causeDetail = escapeHtml(item.causeDetail || item.reason || 'Thiáº¿u tÃ i nguyÃªn hoáº·c háº¿t khung giá» ráº£nh.');

                const advices = (item.advices && item.advices.length > 0) ? item.advices : [
                    {
                        id: 1,
                        title: `âš¡ Cho phÃ©p KTV lÃ m lá»‘ 10 phÃºt cuá»‘i ca sÃ¡ng (11:30 - 11:40)`,
                        description: `Ná»›i lá»ng khung giá» lÃ m viá»‡c ca sÃ¡ng Ä‘á»ƒ hoÃ n táº¥t ca [${procName}] cho BN ${bnName}.`,
                        patch: { gioDienRa: "11:30", gioKetThuc: "12:00", nvChinh: "KTV Phá»¥ TrÃ¡ch", nvPhu: "", may: "Thá»§ cÃ´ng", giuong: "", phong: roomName }
                    },
                    {
                        id: 2,
                        title: `âš¡ Chuyá»ƒn ca sang buá»•i Chiá»u (13:30 - 14:00)`,
                        description: `Xáº¿p ca [${procName}] vÃ o Ä‘áº§u giá» chiá»u khi cÃ³ mÃ¡y vÃ  nhÃ¢n sá»± ráº£nh rá»—i.`,
                        patch: { gioDienRa: "13:30", gioKetThuc: "14:00", nvChinh: "KTV Phá»¥ TrÃ¡ch", nvPhu: "", may: "Thá»§ cÃ´ng", giuong: "", phong: roomName }
                    }
                ];

                html += `
                <div class="rescue-card">
                    <div class="rescue-card-header">
                        <div>
                            <h4 class="rescue-pat-name">ðŸ¥ BN: ${bnName} ${item.ns ? `(${item.ns})` : ''} - PhÃ²ng ${roomName}</h4>
                            <div class="rescue-proc-name">ðŸ“‹ Thá»§ thuáº­t bá»‹ rá»›t: <strong>${procName}</strong></div>
                        </div>
                        <span class="rescue-badge-cause cause-${causeCode}">${causeTitle}</span>
                    </div>

                    <div class="rescue-cause-detail">
                        ðŸ” <strong>Cháº©n Ä‘oÃ¡n nguyÃªn nhÃ¢n:</strong> ${causeDetail}
                    </div>

                    <div style="font-weight: 700; font-size: 13px; color: #334155; margin-bottom: 8px;">
                        ðŸ’¡ Gá»£i Ã½ phÆ°Æ¡ng Ã¡n giáº£i cá»©u (1-Click Tá»± Ä‘á»™ng xáº¿p lá»‹ch):
                    </div>

                    <div class="rescue-advices-list">
                        ${advices.map((advice, adviceIdx) => `
                            <div class="rescue-advice-item">
                                <div class="rescue-advice-info">
                                    <div class="rescue-advice-title">${escapeHtml(advice.title)}</div>
                                    <div class="rescue-advice-desc">${escapeHtml(advice.description)}</div>
                                </div>
                                <button type="button" class="btn-rescue-apply" onclick="executeRescueAdvice(${rotIndex}, ${adviceIdx})">
                                    âš¡ Ãp dá»¥ng giáº£i cá»©u ngay
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
                patch: { gioDienRa: "11:30", gioKetThuc: "12:00", nvChinh: "KTV Phá»¥ TrÃ¡ch", nvPhu: "", may: "Thá»§ cÃ´ng", giuong: "", phong: rotItem.room || rotItem.phong || "" }
            };
            const patch = advice.patch || {};

            const targetDate = rotItem.ngay || (document.getElementById('schedule-date')?.value) || new Date().toISOString().slice(0, 10);
            const patName = rotItem.bn || rotItem.tenBN || "";
            const patNs = rotItem.ns || rotItem.namSinh || "";
            const targetRoom = patch.phong || rotItem.room || rotItem.phong || "";
            const procName = rotItem.tt || rotItem.thuThuat || "";
            const procNameLower = String(procName).trim().toLowerCase();

            if (!window.currentScheduleData) window.currentScheduleData = [];

            // ðŸ›ï¸ GIÆ¯á»œNG Cá»¨U CA: KhÃ´i phá»¥c giÆ°á»ng chuáº©n xÃ¡c
            let resolvedBed = patch.giuong || "";
            const bnClean = String(patName).trim().toUpperCase();
            const rmClean = String(targetRoom).trim().toLowerCase();

            // Æ¯u tiÃªn 1: Tra cá»©u xem BN nÃ y Ä‘Ã£ cÃ³ giÆ°á»ng trong cÃ¹ng phÃ²ng trong ngÃ y chÆ°a (vÃ­ dá»¥ G33)
            let existingBnBed = "";
            for (const item of window.currentScheduleData) {
                const iBn = String(item.tenBN || item.HOTEN || '').trim().toUpperCase();
                const iRoom = String(item.phong || item.PHONG || '').trim().toLowerCase();
                const iBed = String(item.giuong || item.GIUONG || '').trim();
                if (iBn === bnClean && iRoom === rmClean && iBed && iBed !== "GiÆ°á»ng 1") {
                    existingBnBed = iBed;
                    break;
                }
            }
            if (existingBnBed) {
                resolvedBed = existingBnBed;
            } else if (!resolvedBed || resolvedBed === "GiÆ°á»ng 1") {
                // Náº¿u khÃ´ng cÃ³ giÆ°á»ng cá»§a BN vÃ  patch bá»‹ rÆ¡i vÃ o fallback "GiÆ°á»ng 1" hoáº·c rá»—ng
                let roomBeds = [];
                if (typeof dataCache !== 'undefined' && dataCache.room) {
                    const rObj = dataCache.room.find(r => String(r.tenPhong || r.name || r[1] || '').trim().toLowerCase() === rmClean);
                    if (rObj) {
                        const bedStr = String(rObj.danhSachGiuong || rObj[6] || '').trim();
                        if (bedStr && bedStr !== 'None') {
                            roomBeds = bedStr.split(',').map(x => x.trim()).filter(Boolean);
                        }
                    }
                }
                if (roomBeds.length > 0) {
                    const gStart = patch.gioDienRa || "11:30";
                    const gEnd = patch.gioKetThuc || "12:00";
                    const tStart = (typeof t2m === 'function') ? t2m(gStart) : 690;
                    const tEnd = (typeof t2m === 'function') ? t2m(gEnd) : 720;
                    const freeBed = roomBeds.find(bName => {
                        return !window.currentScheduleData.some(item => {
                            const iRoom = String(item.phong || item.PHONG || '').trim().toLowerCase();
                            const iBed = String(item.giuong || item.GIUONG || '').trim();
                            if (iRoom !== rmClean || iBed !== bName) return false;
                            const is1 = (typeof t2m === 'function') ? t2m(item.gioDienRa || item.GIODIENRA) : 0;
                            const ie1 = (typeof t2m === 'function') ? t2m(item.gioKetThuc || item.GIOKETTHUC) : 0;
                            return Math.max(tStart, is1) < Math.min(tEnd, ie1);
                        });
                    });
                    resolvedBed = freeBed || roomBeds[0];
                } else {
                    resolvedBed = (resolvedBed === "GiÆ°á»ng 1" && !rmClean.includes("phá»¥c há»“i")) ? "G1" : (resolvedBed || "G1");
                }
            }

            // ðŸ‘¥ NV PHá»¤: Tra cá»©u vÃ  Ä‘iá»n NV Phá»¥ náº¿u thá»§ thuáº­t yÃªu cáº§u ngÆ°á»i phá»¥
            let resolvedNvPhu = patch.nvPhu || "";
            let needSub = false;
            let procDsPhu = [];
            if (typeof dataCache !== 'undefined' && dataCache.proc) {
                const pObj = dataCache.proc.find(p => {
                    const t = String(p.ten || p.name || p[1] || '').trim().toLowerCase();
                    const vt = String(p.vietTat || p[2] || '').trim().toLowerCase();
                    return t === procNameLower || (vt && vt === procNameLower);
                });
                if (pObj) {
                    needSub = (pObj.canNguoiPhu === 'CÃ³' || pObj.canNguoiPhu === 1 || pObj.canNguoiPhu === '1' || pObj.canNguoiPhu === true || pObj[10] === 'CÃ³' || pObj[10] === 1 || pObj[10] === '1');
                    const dsStr = pObj.dsNguoiPhu || pObj[11] || "";
                    procDsPhu = Array.isArray(dsStr) ? dsStr : String(dsStr).split(',').map(x => x.trim()).filter(Boolean);
                }
            }

            if (needSub && !resolvedNvPhu) {
                // Æ¯u tiÃªn 1: Láº¥y ngÆ°á»i phá»¥ mÃ  BN Ä‘Ã£ cÃ³ á»Ÿ ca khÃ¡c trong ngÃ y (vÃ­ dá»¥ Phá»¥ 5)
                let existingSub = "";
                for (const item of window.currentScheduleData) {
                    const iBn = String(item.tenBN || item.HOTEN || '').trim().toUpperCase();
                    const iSub = String(item.nvPhu || item["NV PHá»¤"] || '').trim();
                    if (iBn === bnClean && iSub) {
                        existingSub = iSub;
                        break;
                    }
                }
                if (existingSub) {
                    resolvedNvPhu = existingSub;
                } else if (procDsPhu.length > 0) {
                    resolvedNvPhu = procDsPhu[0];
                } else if (typeof dataCache !== 'undefined' && dataCache.staff) {
                    const subStaff = dataCache.staff.find(s => {
                        const sName = String(s.ten || s.name || s[1] || '').trim();
                        const sRole = String(s.vaiTro || s.role || s[2] || '').trim();
                        return /Ä‘iá»u dÆ°á»¡ng|dieu duong|^Ä‘d\b|^dd\b|y tÃ¡|y ta|há»™ lÃ½|ho ly|trá»£ lÃ½|tro ly/i.test(sRole) || /phá»¥/i.test(sName);
                    });
                    if (subStaff) {
                        resolvedNvPhu = String(subStaff.ten || subStaff.name || subStaff[1] || '').trim();
                    }
                }
            }

            const rescuedRow = {
                ngay: targetDate,
                tenBN: patName,
                namSinh: patNs,
                phong: targetRoom,
                thuThuat: procName,
                gioDienRa: patch.gioDienRa || "11:30",
                gioKetThuc: patch.gioKetThuc || "12:00",
                nvChinh: patch.nvChinh || "KTV Phá»¥ TrÃ¡ch",
                nvPhu: resolvedNvPhu,
                may: patch.may || "Thá»§ cÃ´ng",
                giuong: resolvedBed
            };

            if (!window.currentScheduleData) window.currentScheduleData = [];

            // ðŸ”’ DEDUP GUARD: Kiá»ƒm tra ca giáº£i cá»©u chÆ°a tá»“n táº¡i trong lá»‹ch (Ä‘á»ƒ trÃ¡nh trÃ¹ng láº·p)
            const _dupKey = [rescuedRow.tenBN, rescuedRow.thuThuat, rescuedRow.gioDienRa, rescuedRow.ngay]
                .map(x => String(x || '').trim().toLowerCase()).join('|');
            const _alreadyExists = window.currentScheduleData.some(x =>
                [x.tenBN, x.thuThuat, x.gioDienRa, x.ngay]
                    .map(v => String(v || '').trim().toLowerCase()).join('|') === _dupKey
            );
            if (_alreadyExists) {
                if (typeof showToast === 'function') {
                    showToast(`âš ï¸ Ca [${rescuedRow.thuThuat}] cho BN ${rescuedRow.tenBN} lÃºc ${rescuedRow.gioDienRa} Ä‘Ã£ cÃ³ trong lá»‹ch, khÃ´ng thÃªm láº¡i!`, 'warning', 3500);
                }
                return;
            }

            // âœ… CHá»ˆ push vÃ o currentScheduleData (nguá»“n sá»± tháº­t duy nháº¥t)
            window.currentScheduleData.push(rescuedRow);

            // ðŸ”„ Sync ngÆ°á»£c dataCache.schedule Ä‘á»ƒ filterSchedule() vÃ  loadDashboard() Ä‘á» cÃ¹ng source
            if (typeof dataCache !== 'undefined') {
                dataCache.schedule = window.currentScheduleData;
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

            const backendSched = window.currentScheduleData.map(x => scheduleRowToBackendArray(x, targetDate));
            callApi('saveSchedule', [targetDate, backendSched], null, null);

            if (typeof showToast === 'function') {
                showToast(`âš¡ ÄÃ£ giáº£i cá»©u ca [${rescuedRow.thuThuat}] cho BN ${rescuedRow.tenBN} (${rescuedRow.gioDienRa}â€“${rescuedRow.gioKetThuc}, ${rescuedRow.nvChinh})!`, 'success');
            } else {
                alert(`âš¡ ÄÃ£ giáº£i cá»©u thÃ nh cÃ´ng ca [${rescuedRow.thuThuat}] cho BN ${rescuedRow.tenBN}!`);
            }

            renderUnscheduledAdvisor();
        }

        window.openUnscheduledAdvisorModal = openUnscheduledAdvisorModal;
        window.closeUnscheduledAdvisorModal = closeUnscheduledAdvisorModal;
        window.renderUnscheduledAdvisor = renderUnscheduledAdvisor;
        window.executeRescueAdvice = executeRescueAdvice;



        // ============================================================
        // ðŸ“¤ XUáº¤T Lá»ŠCH Y Lá»†NH EXCEL (1 SHEET KÃˆM DROP-LIST Lá»ŒC PHÃ’NG, A-Z & RV Äáº¦U Báº¢NG)
        // ============================================================
        function exportSchedule() {
            if (typeof XLSX === 'undefined') {
                return alert("ThÆ° viá»‡n xuáº¥t Excel Ä‘ang Ä‘Æ°á»£c náº¡p, vui lÃ²ng thá»­ láº¡i sau 1-2 giÃ¢y!");
            }

            const safeSched = (window.currentScheduleData || []).map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            const activeDateVal = (document.getElementById('schedule-date')?.value) || (safeSched[0]?.ngay) || '';
            let displayDate = activeDateVal ? activeDateVal.split('-').reverse().join('/') : new Date().toLocaleDateString('vi-VN');

            if (!safeSched.length) {
                return alert("ChÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch trÃ¬nh Ä‘á»ƒ xuáº¥t file Excel!");
            }

            // Sáº¯p xáº¿p dá»¯ liá»‡u: ÄÆ°a bá»‡nh nhÃ¢n Ra viá»‡n (RV) lÃªn trÃªn cÃ¹ng, sau Ä‘Ã³ xáº¿p A-Z theo TÃªn Bá»‡nh NhÃ¢n
            safeSched.sort((a, b) => {
                const dA = !!a.__isDischarged;
                const dB = !!b.__isDischarged;
                if (dA !== dB) return dA ? -1 : 1; // ðŸƒ Ra viá»‡n lÃªn Ä‘áº§u báº£ng

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

            // XÃ¢y dá»±ng ma tráº­n dá»¯ liá»‡u Excel (9 Cá»™t cÃ³ Cá»™t PhÃ²ng Äiá»u Trá»‹)
            const ws_data = [
                [(localStorage.getItem('pm_unit_name') || 'Bá»‡nh viá»‡n Than - KhoÃ¡ng sáº£n CÆ¡ sá»Ÿ 2').toUpperCase() + " - KHOA YHCT & PHCN"],
                ["Báº¢NG Lá»ŠCH TRÃŒNH ÄIá»€U TRá»Š THá»¦ THUáº¬T"],
                [`NgÃ y thá»±c hiá»‡n: ${displayDate}`],
                [""], // DÃ²ng trá»‘ng cÃ¡ch quÃ£ng
                ["STT", "TÃªn Bá»‡nh NhÃ¢n", "NÄƒm Sinh", "PhÃ²ng Äiá»u Trá»‹", "Thá»§ Thuáº­t", "Báº¯t Äáº§u", "Káº¿t ThÃºc", "KTV / BÃ¡c SÄ©", "MÃ¡y MÃ³c"]
            ];

            const dischargedCount = safeSched.filter(r => r.__isDischarged).length;

            safeSched.forEach((row, idx) => {
                let tenBNText = String(row.tenBN || '').trim();
                if (row.__isDischarged) tenBNText += ' (RV)';
                if (row.__dropped) tenBNText += ' (âŒ Rá»›t)';

                ws_data.push([
                    idx + 1,
                    tenBNText,
                    String(row.namSinh || '').trim(),
                    String(row.phong || 'ChÆ°a phÃ¢n phÃ²ng').trim(),
                    String(row.thuThuat || '').trim(),
                    String(row.gioDienRa || '').trim(),
                    String(row.gioKetThuc || '').trim(),
                    String(row.nvChinh || '').trim(),
                    String(row.may || '--').trim()
                ]);
            });

            const firstDataRow = 6; // DÃ²ng 6 trong Excel (index 1-based)
            const lastDataRow = safeSched.length + 5; // DÃ²ng dá»¯ liá»‡u cuá»‘i cÃ¹ng

            // DÃ²ng tá»•ng káº¿t tá»± Ä‘á»™ng co giÃ£n theo bá»™ lá»c phÃ²ng báº±ng hÃ m SUBTOTAL(103)
            ws_data.push([""]);
            ws_data.push([
                "Tá»”NG Sá» THá»¦ THUáº¬T:",
                "",
                "",
                { t: 'n', f: `SUBTOTAL(103, B${firstDataRow}:B${lastDataRow})`, v: safeSched.length },
                "ca thá»§ thuáº­t (tá»± Ä‘á»™ng cáº­p nháº­t khi chá»n phÃ²ng)",
                "",
                "",
                "",
                ""
            ]);

            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            // ðŸŽ¯ KÃ­ch hoáº¡t Drop-list Filter (AutoFilter) táº¡i dÃ²ng Header (A5:I${lastDataRow})
            ws['!autofilter'] = { ref: `A5:I${lastDataRow}` };

            // Merge cÃ¡c dÃ²ng tiÃªu Ä‘á» (Cá»™t A Ä‘áº¿n I: c=0 Ä‘áº¿n c=8)
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // DÃ²ng 1: TÃªn bá»‡nh viá»‡n
                { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // DÃ²ng 2: TÃªn báº£ng
                { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }, // DÃ²ng 3: NgÃ y thá»±c hiá»‡n
                { s: { r: ws_data.length - 1, c: 0 }, e: { r: ws_data.length - 1, c: 2 } }, // DÃ²ng tá»•ng: Cá»™t A-C
                { s: { r: ws_data.length - 1, c: 4 }, e: { r: ws_data.length - 1, c: 8 } }  // DÃ²ng tá»•ng: Cá»™t E-I
            ];

            // Äá»™ rá»™ng tá»‘i Æ°u 9 cá»™t
            ws['!cols'] = [
                { wch: 6 },   // STT
                { wch: 28 },  // TÃªn Bá»‡nh NhÃ¢n
                { wch: 11 },  // NÄƒm Sinh
                { wch: 20 },  // PhÃ²ng Äiá»u Trá»‹ (CÃ³ Drop-list)
                { wch: 28 },  // Thá»§ Thuáº­t
                { wch: 11 },  // Báº¯t Äáº§u
                { wch: 11 },  // Káº¿t ThÃºc
                { wch: 20 },  // KTV / BÃ¡c SÄ©
                { wch: 18 }   // MÃ¡y MÃ³c
            ];

            // Chiá»u cao dÃ²ng
            ws['!rows'] = [];
            ws['!rows'][0] = { hpt: 20 };
            ws['!rows'][1] = { hpt: 26 };
            ws['!rows'][2] = { hpt: 18 };
            ws['!rows'][4] = { hpt: 26 }; // Header báº£ng
            for (let r = 5; r < ws_data.length - 2; r++) {
                ws['!rows'][r] = { hpt: 22 }; // CÃ¡c dÃ²ng dá»¯ liá»‡u
            }
            ws['!rows'][ws_data.length - 1] = { hpt: 24 }; // DÃ²ng tá»•ng káº¿t

            // Äá»‹nh dáº¡ng Style chuyÃªn nghiá»‡p báº±ng xlsx-js-style
            try {
                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = range.s.r; R <= range.e.r; R++) {
                    // TiÃªu Ä‘á» dÃ²ng 1 (TÃªn bá»‡nh viá»‡n)
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
                    // TiÃªu Ä‘á» dÃ²ng 2 (TÃªn báº£ng)
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
                    // TiÃªu Ä‘á» dÃ²ng 3 (NgÃ y thá»±c hiá»‡n)
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
                    // DÃ²ng trá»‘ng
                    if (R === 3 || R === ws_data.length - 2) continue;

                    // TiÃªu Ä‘á» cá»™t báº£ng (DÃ²ng 4, index r=4)
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

                    // DÃ²ng tá»•ng káº¿t cuá»‘i báº£ng
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

                    // CÃ¡c dÃ²ng dá»¯ liá»‡u bá»‡nh nhÃ¢n (R >= 5)
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
                                bottom: { style: "medium", color: { rgb: "000000" } }, // DÃ²ng káº» ngang Ä‘áº­m ngÄƒn cÃ¡ch rÃµ rÃ ng
                                left: { style: "thin", color: { rgb: "CBD5E1" } },
                                right: { style: "thin", color: { rgb: "CBD5E1" } }
                            }
                        };
                    }
                }
            } catch (e) {
                console.warn("Lá»—i style Excel:", e);
            }

            // Thiáº¿t láº­p trang in A4 ngang chuáº©n
            ws['!pageSetup'] = {
                paperSize: 9,          // A4
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0
            };
            ws['!margins'] = { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 };

            XLSX.utils.book_append_sheet(wb, ws, "Lá»‹ch TrÃ¬nh");

            // Xuáº¥t vÃ  táº£i file Excel
            const fileName = `Lich_ThuThuat_${displayDate.replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            if (typeof showToast === 'function') showToast("ðŸ“‚ ÄÃ£ xuáº¥t file Excel lá»‹ch trÃ¬nh cÃ³ bá»™ lá»c phÃ²ng!");
        }









        function printSchedule() {

            if (!filteredSchedData || filteredSchedData.length === 0) {

                return alert("KhÃ´ng cÃ³ dá»¯ liá»‡u Ä‘á»ƒ in! BÃ¡c sÄ© hÃ£y kiá»ƒm tra láº¡i Ã´ tÃ¬m kiáº¿m.");

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
                const dischargeMark = row.__isDischarged ? ' <span style="font-size:10.5px; font-style:italic; font-weight:700; white-space:nowrap; margin-left:4px; color:#27ae60;">(âœ” RV)</span>' : '';
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

            doc.write(`<html><head><title>In Lá»‹ch Y Lá»‡nh</title>

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

                <h2>Lá»ŠCH Y Lá»†NH NGÃ€Y ${displayDate}</h2>

                <table>

                    <thead><tr>

                        ${["STT", "TÃªn Bá»‡nh NhÃ¢n", "NÄƒm Sinh", "Thá»§ Thuáº­t", "Báº¯t Äáº§u", "Káº¿t ThÃºc", "NV ChÃ­nh", "NV Phá»¥", "MÃ¡y"].map(h => `<th>${h}</th>`).join('')}

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
        // ðŸ“„ XUáº¤T PDF THEO Tá»ªNG PHÃ’NG Bá»†NH (PDFMAKE ENGINE - MULTI-PAGE)
        // ============================================================
        function exportSchedulePDF() {
            if (typeof pdfMake === 'undefined') {
                return alert("ThÆ° viá»‡n pdfmake Ä‘ang Ä‘Æ°á»£c náº¡p, vui lÃ²ng thá»­ láº¡i sau 1-2 giÃ¢y!");
            }

            const safeSched = (window.currentScheduleData || []).map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            const activeDateVal = (document.getElementById('schedule-date')?.value) || (safeSched[0]?.ngay) || '';
            let displayDate = activeDateVal ? activeDateVal.split('-').reverse().join('/') : new Date().toLocaleDateString('vi-VN');

            if (!safeSched.length) {
                return alert("ChÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch trÃ¬nh Ä‘á»ƒ xuáº¥t PDF!");
            }

            // 1. PhÃ¢n nhÃ³m ca thá»§ thuáº­t theo tá»«ng PhÃ²ng bá»‡nh
            const roomMap = {};
            safeSched.forEach(row => {
                const roomName = String(row.phong || 'ChÆ°a phÃ¢n phÃ²ng').trim();
                if (!roomMap[roomName]) roomMap[roomName] = [];
                roomMap[roomName].push(row);
            });

            // 2. Sáº¯p xáº¿p danh sÃ¡ch trong tá»«ng phÃ²ng: Bá»†NH NHÃ‚N RA VIá»†N LÃŠN Äáº¦U TIÃŠN
            const roomNames = Object.keys(roomMap).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

            roomNames.forEach(rName => {
                roomMap[rName].sort((a, b) => {
                    const dA = !!a.__isDischarged;
                    const dB = !!b.__isDischarged;
                    if (dA !== dB) return dA ? -1 : 1; // ðŸƒ Ra viá»‡n luÃ´n luÃ´n lÃªn Ä‘áº§u tiÃªn
                    const tA = String(a.gioDienRa || '');
                    const tB = String(b.gioDienRa || '');
                    if (tA !== tB) return tA.localeCompare(tB);
                    return String(a.tenBN || '').localeCompare(String(b.tenBN || ''), 'vi');
                });
            });

            // 3. XÃ¢y dá»±ng ná»™i dung tÃ i liá»‡u PDF vá»›i má»—i phÃ²ng báº¯t Ä‘áº§u trÃªn trang má»›i
            const content = [];

            roomNames.forEach((rName, rIdx) => {
                const roomRows = roomMap[rName];
                const dischargedCount = roomRows.filter(r => r.__isDischarged).length;

                // Báº£ng dá»¯ liá»‡u cá»§a riÃªng phÃ²ng nÃ y (khÃ´ng cÃ³ cá»™t GiÆ°á»ng)
                const bodyTable = [
                    [
                        { text: 'STT', style: 'tableHeader', alignment: 'center' },
                        { text: 'TÃªn Bá»‡nh NhÃ¢n', style: 'tableHeader' },
                        { text: 'NÄƒm Sinh', style: 'tableHeader', alignment: 'center' },
                        { text: 'Thá»§ Thuáº­t', style: 'tableHeader' },
                        { text: 'Báº¯t Äáº§u', style: 'tableHeader', alignment: 'center' },
                        { text: 'Káº¿t ThÃºc', style: 'tableHeader', alignment: 'center' },
                        { text: 'KTV / BÃ¡c SÄ©', style: 'tableHeader' },
                        { text: 'MÃ¡y MÃ³c', style: 'tableHeader' }
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

                // Má»—i phÃ²ng tá»« phÃ²ng thá»© 2 trá»Ÿ Ä‘i sáº½ tá»± Ä‘á»™ng sang trang má»›i
                const roomSection = [
                    {
                        columns: [
                            {
                                width: '*',
                                text: [
                                    { text: (localStorage.getItem('pm_unit_name') || 'Bá»‡nh viá»‡n Than - KhoÃ¡ng sáº£n CÆ¡ sá»Ÿ 2').toUpperCase() + '\n', bold: true, fontSize: 9.5 },
                                    { text: 'KHOA YHCT - PHá»¤C Há»’I CHá»¨C NÄ‚NG', bold: true, fontSize: 10.5, color: '#1e3d2b' }
                                ]
                            },
                            {
                                width: 'auto',
                                text: `NgÃ y thá»±c hiá»‡n: ${displayDate}`,
                                alignment: 'right',
                                italics: true,
                                fontSize: 9.5,
                                color: '#475569'
                            }
                        ]
                    },
                    {
                        text: `Báº¢NG Lá»ŠCH TRÃŒNH ÄIá»€U TRá»Š THá»¦ THUáº¬T - ${rName.toUpperCase()}`,
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
                                if (isDischargedRow) return '#f5eef8'; // Highlight tÃ­m nháº¡t cho BN ra viá»‡n
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
                        text: `Tá»•ng sá»‘: ${roomRows.length} ca thá»§ thuáº­t ${dischargedCount > 0 ? '(' + dischargedCount + ' ca RV)' : ''}`,
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
                if (typeof showToast === 'function') showToast("ðŸ“„ Äang táº£i file PDF lá»‹ch trÃ¬nh theo tá»«ng phÃ²ng...");
            } catch (e) {
                console.error("Lá»—i xuáº¥t PDF:", e);
                alert("Lá»—i xuáº¥t PDF: " + e.message);
            }
        }
        window.exportSchedulePDF = exportSchedulePDF;

        // ============================================================
        // â±ï¸ CHáº¾ Äá»˜ XEM TIMELINE Y Táº¾ (MEDICAL RESOURCE TIMELINE)
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

        // ============================================================
        // âš¡ XUáº¤T Dá»® LIá»†U Äá»‚ Tá»° Äá»˜NG NHáº¬P HIS (AUTO-HIS IMPORTER)
        // ============================================================
        function exportDataForHisAuto() {
            const rawSched = (window.currentScheduleData && window.currentScheduleData.length) ? window.currentScheduleData : 
                             ((typeof dataCache !== 'undefined' && dataCache.schedule) ? dataCache.schedule : []);
            const safeSched = rawSched.map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            
            if (!safeSched.length) {
                if (typeof window.showToast === 'function') {
                    window.showToast('âš ï¸ ChÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch trÃ¬nh Ä‘á»ƒ xuáº¥t sang pháº§n má»m HIS!', 'warning');
                } else {
                    alert('ChÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch trÃ¬nh Ä‘á»ƒ xuáº¥t sang pháº§n má»m HIS!');
                }
                return;
            }

            const activeDateVal = (document.getElementById('history-date')?.value) || 
                                  (document.getElementById('schedule-date')?.value) || 
                                  (safeSched[0]?.ngay) || '';

            const exportObj = {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                date: activeDateVal,
                totalProcedures: safeSched.length,
                schedule: safeSched
            };

            const jsonStr = JSON.stringify(exportObj, null, 2);

            // 1. Tá»± Ä‘á»™ng Copy vÃ o Clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(jsonStr).then(() => {
                    console.log("ÄÃ£ copy dá»¯ liá»‡u lá»‹ch vÃ o Clipboard");
                }).catch(e => console.warn("Lá»—i copy clipboard:", e));
            }

            // 2. Táº£i file his_schedule.json
            try {
                const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `his_schedule_${activeDateVal || 'today'}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Lá»—i táº£i file JSON:", err);
            }

            const msg = `âœ… ÄÃƒ XUáº¤T ${safeSched.length} CA THá»¦ THUáº¬T!\n\n1. Dá»¯ liá»‡u Ä‘Ã£ Ä‘Æ°á»£c tá»± Ä‘á»™ng sao chÃ©p vÃ o Clipboard (Báº¡n chá»‰ cáº§n má»Ÿ tool Auto-HIS vÃ  báº¥m 'ðŸ“‹ DÃ¡n tá»« Clipboard').\n2. Äá»“ng thá»i Ä‘Ã£ táº£i file 'his_schedule_${activeDateVal || 'today'}.json' vá» mÃ¡y.`;
            if (typeof window.showToast === 'function') {
                window.showToast(`âœ… ÄÃ£ xuáº¥t ${safeSched.length} ca sang Auto-HIS (Ä‘Ã£ copy & táº£i file)!`, 'success');
            }
            alert(msg);
        }
        window.exportDataForHisAuto = exportDataForHisAuto;

        function renderScheduleGanttTimeline() {
            const target = document.getElementById('schedule-gantt-target');
            if (!target) return;

            const safeSched = (window.currentScheduleData || []).map(normalizeScheduleRow).filter(r => !isDroppedScheduleRow(r));
            const totalBadge = document.getElementById('timeline-total-badge');
            if (totalBadge) totalBadge.innerText = `${safeSched.length} ca`;

            if (!safeSched.length) {
                target.innerHTML = `
                    <div style="padding: 50px 20px; text-align: center; color: #94a3b8;">
                        <div style="font-size: 40px; margin-bottom: 10px;">ðŸ“…</div>
                        <h4 style="margin: 0; color: #475569; font-size: 16px;">ChÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch trÃ¬nh hÃ´m nay</h4>
                        <p style="margin: 6px 0 0 0; font-size: 13px;">Vui lÃ²ng báº¥m nÃºt <b>"CHáº Y Xáº¾P Lá»ŠCH Tá»”NG"</b> Ä‘á»ƒ khá»Ÿi táº¡o dÃ²ng thá»i gian.</p>
                    </div>
                `;
                return;
            }

            // Bá»™ lá»c tÃ¬m kiáº¿m má» thÃ´ng minh tiáº¿ng Viá»‡t (Fuse.js)
            const searchQuery = String(document.getElementById('schedule-search-input')?.value || '').trim();
            let schedData = safeSched;
            if (searchQuery) {
                schedData = fuzzySearchList(safeSched, searchQuery, ['tenBN', 'phong', 'nvChinh', 'nvPhu', 'thuThuat', 'may', 'giuong']);
            }

            // Cáº¥u hÃ¬nh khung giá» vÃ  Ä‘á»™ rá»™ng má»—i slot (30 phÃºt)
            let slotTicks = [];
            let slotWidth = 95; // px má»—i 30 phÃºt
            let morningSlotCount = 8; // 07:30, 08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00 (káº¿t thÃºc 11:30)
            let afternoonSlotCount = 7; // 13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00 (káº¿t thÃºc 16:30)
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

            // HÃ m chuyá»ƒn Ä‘á»•i giá» HH:MM sang phÃºt
            function timeToMinutes(tStr) {
                if (!tStr || !tStr.includes(':')) return 0;
                const p = tStr.split(':');
                return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
            }

            // HÃ m tÃ­nh toÃ¡n pixel Left vÃ  Width chÃ­nh xÃ¡c
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
                    // Cáº£ ngÃ y
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

            // Gom nhÃ³m theo PhÃ²ng hoáº·c NhÃ¢n ViÃªn
            const groups = {};
            schedData.forEach(row => {
                let key = '';
                if (timelineGroupBy === 'staff') {
                    key = String(row.nvChinh || 'ChÆ°a gÃ¡n KTV').trim();
                } else {
                    key = String(row.phong || 'ChÆ°a phÃ¢n phÃ²ng').trim();
                }
                if (!groups[key]) groups[key] = [];
                groups[key].push(row);
            });

            const groupKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));

            // XÃ¢y dá»±ng Header Báº£ng
            let html = `
                <div class="timeline-board">
                    <div class="timeline-board-header">
                        <div class="timeline-res-col-hdr">
                            ${timelineGroupBy === 'room' ? 'ðŸ¥ PHÃ’NG / GIÆ¯á»œNG' : 'ðŸ‘¨â€âš•ï¸ NHÃ‚N Sá»° / KTV'}
                        </div>
                        <div class="timeline-slots-hdr" style="width: ${totalCanvasWidth}px;">
            `;

            slotTicks.forEach(tick => {
                html += `<div class="timeline-slot-tick" style="width: ${slotWidth}px; min-width: ${slotWidth}px;">${tick}</div>`;
            });

            html += `</div></div>`; // ÄÃ³ng timeline-slots-hdr vÃ  timeline-board-header

            // XÃ¢y dá»±ng tá»«ng hÃ ng dá»¯ liá»‡u vá»›i thuáº­t toÃ¡n xáº¿p Lane
            groupKeys.forEach(gKey => {
                const rows = groups[gKey];
                const rvCount = rows.filter(r => r.__isDischarged).length;

                // Sáº¯p xáº¿p cÃ¡c ca theo giá» báº¯t Ä‘áº§u tÄƒng dáº§n
                rows.sort((a, b) => timeToMinutes(a.gioDienRa) - timeToMinutes(b.gioDienRa));

                // Thuáº­t toÃ¡n Lane Packing chá»‘ng Ä‘Ã¨ tháº»
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
                            <div class="timeline-resource-name" title="${safeGKey}">${timelineGroupBy === 'room' ? 'ðŸ¥ ' : 'ðŸ‘¨â€âš•ï¸ '}${safeGKey}</div>
                            <div style="display:flex; gap:4px; flex-wrap:wrap;">
                                <span class="timeline-resource-badge">${packedCards.length} ca</span>
                                ${rvCount > 0 ? `<span class="timeline-resource-badge" style="background:#f5eef8; color:#7c3aed; font-weight:700;">${rvCount} RV</span>` : ''}
                            </div>
                        </div>
                        <div class="timeline-track-canvas" style="width: ${totalCanvasWidth}px; min-width: ${totalCanvasWidth}px; height: ${trackHeight}px;">
                            <div class="timeline-grid-lines">
                `;

                // Váº¡ch káº» dá»c má»—i 30 phÃºt
                slotTicks.forEach(() => {
                    html += `<div class="timeline-grid-tick-line" style="width: ${slotWidth}px; min-width: ${slotWidth}px;"></div>`;
                });

                html += `</div>`; // ÄÃ³ng timeline-grid-lines

                // ÄÆ°á»ng phÃ¢n cÃ¡ch giá» nghá»‰ trÆ°a (náº¿u xem cáº£ ngÃ y)
                if (timelineShift === 'all') {
                    const morningBoundary = morningSlotCount * slotWidth;
                    html += `<div class="timeline-lunch-divider" style="left: ${morningBoundary}px;" title="Nghá»‰ trÆ°a (11:30 - 13:00)"></div>`;
                }

                // Render tá»«ng Card vá»›i tá»a Ä‘á»™ Left, Width vÃ  Top (theo Lane)
                packedCards.forEach(item => {
                    const r = item.row;
                    const topPx = 4 + item.lane * 40;
                    const isRV = !!r.__isDischarged;
                    const isYHCT = String(r.thuThuat || '').toLowerCase().includes('chÃ¢m') || String(r.thuThuat || '').toLowerCase().includes('xoa bÃ³p') || String(r.thuThuat || '').toLowerCase().includes('cáº¥y chá»‰') || String(r.thuThuat || '').toLowerCase().includes('giÃ¡c');
                    
                    let cardClass = isRV ? 'timeline-card-rv' : (isYHCT ? 'timeline-card-yhct' : 'timeline-card-phcn');

                    const safeTenBN = sanitizeInput(r.tenBN);
                    const safeThuThuat = sanitizeInput(r.thuThuat);
                    const safePhong = sanitizeInput(r.phong || '');
                    const safeGiuong = sanitizeInput(r.giuong || '');
                    const safeNV = sanitizeInput(r.nvChinh || '');
                    const safeNVPhu = sanitizeInput(r.nvPhu || '');
                    const safeMay = sanitizeInput(r.may || '');

                    const tooltipText = `Bá»‡nh nhÃ¢n: ${safeTenBN} (${r.namSinh || ''})&#10;Thá»§ thuáº­t: ${safeThuThuat}&#10;Thá»i gian: ${r.gioDienRa} - ${r.gioKetThuc}&#10;PhÃ²ng: ${safePhong} | GiÆ°á»ng: ${safeGiuong}&#10;KTV: ${safeNV} ${safeNVPhu ? '(Phá»¥: ' + safeNVPhu + ')' : ''}&#10;MÃ¡y: ${safeMay}`;

                    html += `
                        <div class="timeline-card ${cardClass}" 
                             style="left: ${item.left}px; width: ${item.width}px; top: ${topPx}px;"
                             title="${tooltipText}">
                            <div class="timeline-card-title">
                                <span style="overflow:hidden; text-overflow:ellipsis;">${safeTenBN}</span>
                                ${isRV ? '<span class="rv-badge">RV</span>' : ''}
                            </div>
                            <div class="timeline-card-sub">
                                <span>${safeThuThuat} â€¢ ${r.gioDienRa}-${r.gioKetThuc}${safeGiuong ? ' â€¢ G.' + safeGiuong : ''}</span>
                            </div>
                        </div>
                    `;
                });

                html += `</div></div>`; // ÄÃ³ng timeline-track-canvas vÃ  timeline-board-row
            });

            html += `</div>`; // ÄÃ³ng timeline-board
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

                        const headerIndex = rows.findIndex(r => r.some(c => String(c).toLowerCase().includes('bá»‡nh nhÃ¢n') || String(c).toLowerCase().includes('benh nhan')));

                        if (headerIndex < 0) throw new Error('KhÃ´ng tÃ¬m tháº¥y dÃ²ng tiÃªu Ä‘á» trong file lá»‹ch.');



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

                        if (idx.ten < 0 || idx.tt < 0) throw new Error('File khÃ´ng Ä‘Ãºng cáº¥u trÃºc lá»‹ch Ä‘Ã£ xuáº¥t.');



                        const scheduled = [], dropped = [];

                        rows.slice(headerIndex + 1).forEach(r => {

                            if (!r || !r.some(c => String(c).trim())) return;

                            const row = {

                                ngay: idx.ngay >= 0 ? r[idx.ngay] : "",

                                tenBN: idx.ten >= 0 ? String(r[idx.ten] || "").replace(/\s*\((?:âœ” RV|âŒ Rá»›t|RV|Rá»›t)\)/gi, "").trim() : "",

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

                            const isDropped = String(row.gioDienRa || "").includes("Rá»›t") || statusLower.includes("khÃ´ng xáº¿p") || statusLower.includes("rá»›t");

                            if (isDropped) {

                                // Sá»­ dá»¥ng chuá»—i Ä‘á»ƒ trÃ¡nh lÃ m parser ngoáº·c nháº§m láº«n

                                const regLydo = new RegExp("^.*LÃ½ do:\\s*", "i");

                                const regEnd = new RegExp("[)]+$", "");

                                dropped.push(normalizeDroppedItem({

                                    ngay: row.ngay, bn: row.tenBN, ns: row.namSinh, room: row.phong,

                                    tt: row.thuThuat, staff: row.nvChinh, reason: statusText.replace(regLydo, "").replace(regEnd, "") || row.may || "Ca rá»›t trong file cÅ©"

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

                        alert('Lá»—i: ' + err.message);

                    }

                };

                reader.readAsArrayBuffer(file);

            };

            input.click();

        }





        function callChotSo() {
            showCustomConfirm("Chá»‘t sá»•?", "Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n chá»‘t sá»• ngÃ y hÃ´m nay?", function () {
                const btn = document.getElementById('btn-chot-so');
                btn.innerText = 'â³ Äang xá»­ lÃ½...'; btn.disabled = true;
                window._chotSoDone = false;

                if (window.showGlobalLoading) window.showGlobalLoading("Äang thá»±c hiá»‡n chá»‘t sá»• ngÃ y cÅ© vÃ  má»Ÿ sá»• ngÃ y má»›i...");

                callApi('chuyenNgayMoi', [], res => {
                    // XÃ³a toÃ n bá»™ cache phÃ­a client Ä‘á»ƒ má»Ÿ ngÃ y má»›i sáº¡ch sáº½
                    window.currentScheduleData = [];
                    window.lastUnscheduledData = [];
                    window.currentRotData = [];
                    if (window.dataCache) {
                        window.dataCache.schedule = [];
                    }
                    if (window.dataCacheTime) window.dataCacheTime = {};
                    if (window._historyCache) window._historyCache = {};
                    
                    const curUnit = (typeof getCurrentUnitCode === 'function') ? getCurrentUnitCode() : (localStorage.getItem('pm_unit_code') || '');
                    const uKey = (base) => (typeof getUnitStorageKey === 'function') ? getUnitStorageKey(base) : (curUnit ? `${curUnit}_${base}` : base);

                    // XÃ³a toÃ n bá»™ key local chá»©a lá»‹ch cÅ©
                    localStorage.removeItem(uKey('meds_success'));
                    localStorage.removeItem(uKey('meds_schedule_date'));
                    localStorage.removeItem(uKey('meds_unscheduled'));
                    localStorage.removeItem('meds_success');
                    localStorage.removeItem('meds_schedule_date');
                    localStorage.removeItem('meds_unscheduled');
                    localStorage.removeItem('meds_schedule_unit');

                    // Cáº­p nháº­t hoáº·c dá»n sáº¡ch lá»‹ch trong bootstrap cache
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

                    // XÃ³a cache Dexie IndexedDB
                    if (window.OfflineSyncEngine && typeof window.OfflineSyncEngine.saveCache === 'function') {
                        window.OfflineSyncEngine.saveCache('meds_success', []);
                    }

                    sessionStorage.setItem('chot_so_success_toast', 'true');
                    if (window.hideGlobalLoading) window.hideGlobalLoading();
                    location.reload();
                }, err => {
                    if (window.hideGlobalLoading) window.hideGlobalLoading();
                    alert("Lá»—i chá»‘t sá»•: " + (typeof err === 'string' ? err : (err && err.message) || JSON.stringify(err)));
                    btn.innerText = 'ðŸ“‹ Chá»‘t sá»•';
                    btn.disabled = false;
                });
            });
        }


        window._historyCache = window._historyCache || {};
        // Backup/restore dataCache khi chuyá»ƒn sang cháº¿ Ä‘á»™ xem lá»‹ch cÅ©
        window._liveDataCacheBackup = null;

        function applyHistoryDataToTabs(fullData, dateStr) {
            // Backup cache hiá»‡n táº¡i náº¿u chÆ°a backup
            if (!window._liveDataCacheBackup) {
                window._liveDataCacheBackup = {
                    pat: JSON.parse(JSON.stringify(dataCache.pat || [])),
                    staff: JSON.parse(JSON.stringify(dataCache.staff || []))
                };
            }

            // Build dataCache.pat tá»« dá»¯ liá»‡u lá»‹ch sá»­ (unique patients)
            // gioBan chá»‰ láº¥y tá»« fullData.patBusy thá»±c táº¿ (bÃ¡o báº­n tháº­t sá»±, khÃ´ng láº¥y tá»« ca thá»§ thuáº­t)
            const histPat = (fullData.patients || []).map(p => {
                const foundBusy = (fullData.patBusy || []).find(pb => {
                    const pbName = String(pb.tenBN || '').trim().toLowerCase();
                    const pName = String(p.tenBN || '').trim().toLowerCase();
                    const pbNs = String(pb.namSinh || '').trim();
                    const pNs = String(p.namSinh || '').trim();
                    return pbName === pName && (!pNs || !pbNs || pbNs === pNs);
                });
                const gioBanStr = foundBusy?.slots?.length ? foundBusy.slots.map(s => s.from + '-' + s.to).join(', ') : '';

                return {
                    ten: p.tenBN, namSinh: p.namSinh, phong: p.phong,
                    thuThuat: Array.isArray(p.dsThuThuat) ? p.dsThuThuat.join(', ') : String(p.dsThuThuat || p.thuThuat || ''),
                    ngayVao: '', gioVao: '',
                    gioBan: gioBanStr,
                    gioRa: '', index: 0, sheetIndex: 0
                };
            });

            // Bá»• sung cÃ¡c bá»‡nh nhÃ¢n cÃ³ trong fullData.patBusy (tá»« báº£ng gio_ban_chung_cu / gio_ban_cu) nhÆ°ng chÆ°a cÃ³ trong danh sÃ¡ch ca
            (fullData.patBusy || []).forEach(pb => {
                const pbName = String(pb.tenBN || '').trim().toLowerCase();
                const pbNs = String(pb.namSinh || '').trim();
                const exists = histPat.some(p => {
                    const pName = String(p.ten || '').trim().toLowerCase();
                    const pNs = String(p.namSinh || '').trim();
                    return pName === pbName && (!pbNs || !pNs || pbNs === pNs);
                });
                if (!exists && pb.tenBN) {
                    const gioBanStr = pb.slots?.length ? pb.slots.map(s => s.from + '-' + s.to).join(', ') : '';
                    histPat.push({
                        ten: pb.tenBN,
                        namSinh: pb.namSinh || '',
                        phong: pb.phong || '',
                        thuThuat: '',
                        ngayVao: '', gioVao: '',
                        gioBan: gioBanStr,
                        gioRa: '', index: 0, sheetIndex: 0
                    });
                }
            });

            // Bá»• sung giá» ra viá»‡n (náº¿u cÃ³ trong fullData.leavePat)
            (fullData.leavePat || []).forEach(lp => {
                const lpName = String(lp.tenBN || '').trim().toLowerCase();
                const lpNs = String(lp.namSinh || '').trim();
                const found = histPat.find(p => {
                    const pName = String(p.ten || '').trim().toLowerCase();
                    const pNs = String(p.namSinh || '').trim();
                    return pName === lpName && (!lpNs || !pNs || lpNs === pNs);
                });
                if (found) {
                    found.gioRa = lp.gioRa || '';
                } else if (lp.tenBN) {
                    histPat.push({
                        ten: lp.tenBN,
                        namSinh: lp.namSinh || '',
                        phong: lp.phong || '',
                        thuThuat: '',
                        ngayVao: '', gioVao: '',
                        gioBan: '',
                        gioRa: lp.gioRa || '',
                        index: 0, sheetIndex: 0
                    });
                }
            });
            dataCache.pat = histPat;

            // Build dataCache.staff: Báº£o toÃ n vai trÃ² BÃ¡c sÄ©/KTV, thá»i gian lÃ m viá»‡c, ká»¹ nÄƒng tá»« base live staff
            const baseStaff = JSON.parse(JSON.stringify(window._liveDataCacheBackup.staff || []));
            baseStaff.forEach(s => {
                const sNameClean = String(s.ten || '').trim().toLowerCase().replace(/^(bs\.|bs|ktv\.|ktv|Ä‘d\.|Ä‘d)\s+/i, '');
                const foundBusy = (fullData.staffBusy || []).find(sb => {
                    const sbClean = String(sb.ten || '').trim().toLowerCase().replace(/^(bs\.|bs|ktv\.|ktv|Ä‘d\.|Ä‘d)\s+/i, '');
                    return sbClean === sNameClean;
                });
                if (foundBusy && foundBusy.slots && foundBusy.slots.length > 0) {
                    s.gioBan = [...new Set(foundBusy.slots.map(sl => sl.from + '-' + sl.to).filter(Boolean))].join(', ');
                } else {
                    s.gioBan = '';
                }
            });

            // Bá»• sung cÃ¡c nhÃ¢n sá»± cÃ³ trong fullData.staffBusy (tá»« gio_ban_chung_cu) nhÆ°ng chÆ°a cÃ³ trong baseStaff
            (fullData.staffBusy || []).forEach(sb => {
                const sbClean = String(sb.ten || '').trim().toLowerCase().replace(/^(bs\.|bs|ktv\.|ktv|Ä‘d\.|Ä‘d)\s+/i, '');
                const exists = baseStaff.some(s => {
                    const sNameClean = String(s.ten || '').trim().toLowerCase().replace(/^(bs\.|bs|ktv\.|ktv|Ä‘d\.|Ä‘d)\s+/i, '');
                    return sNameClean === sbClean;
                });
                if (!exists && sb.ten) {
                    const busyStr = sb.slots?.length ? [...new Set(sb.slots.map(sl => sl.from + '-' + sl.to).filter(Boolean))].join(', ') : '';
                    baseStaff.push({
                        ten: sb.ten,
                        vaiTro: sb.ten.toLowerCase().includes('ktv') ? 'Ká»¹ thuáº­t viÃªn' : 'BÃ¡c sÄ©',
                        gioBan: busyStr,
                        thoiGianLamViec: '07:30-16:30'
                    });
                }
            });
            dataCache.staff = baseStaff;

            // Cáº­p nháº­t header tráº¡ng thÃ¡i lá»‹ch cÅ©
            const parts = dateStr.split('-');
            const ngayHT = parts.length === 3 ? parts[2] + '/' + parts[1] + '/' + parts[0] : dateStr;
            document.title = 'Lá»‹ch CÅ© â€“ ' + ngayHT;

            // Render láº¡i cÃ¡c tab
            if (typeof renderPatientsTable === 'function') renderPatientsTable(true);
            if (typeof renderBusyPat === 'function') renderBusyPat();
            if (typeof renderBusyStaff === 'function') renderBusyStaff();
            if (typeof renderLeavePat === 'function') renderLeavePat();
        }

        function restoreHistoryTabs() {
            if (!window._liveDataCacheBackup) return;
            dataCache.pat = window._liveDataCacheBackup.pat;
            dataCache.staff = window._liveDataCacheBackup.staff;
            window._liveDataCacheBackup = null;
            document.title = 'T.I.M.E.S System - Pháº§n má»m xáº¿p lá»‹ch thá»§ thuáº­t thÃ´ng minh';
            if (typeof renderPatientsTable === 'function') renderPatientsTable(true);
            if (typeof renderBusyPat === 'function') renderBusyPat();
            if (typeof renderBusyStaff === 'function') renderBusyStaff();
            if (typeof renderLeavePat === 'function') renderLeavePat();
            // XÃ³a panel cÅ© náº¿u cÃ²n
            const old = document.getElementById('history-detail-panel');
            if (old) old.remove();
        }

        function xemLichSu() {
            const d = document.getElementById('history-date')?.value || '';
            if (!d) return window.showToast ? window.showToast("Vui lÃ²ng chá»n ngÃ y!", "error") : alert("Chá»n ngÃ y!");
            if (typeof window.onAppDateChange === 'function') {
                window.onAppDateChange(d, 'schedule');
            } else {
                const dp = document.getElementById('dashboard-date-filter');
                if (dp && dp.value !== d) {
                    dp.value = d;
                    const displayEl = document.getElementById('display-date');
                    if (displayEl) displayEl.textContent = d.split('-').reverse().join('/');
                }
                window._forceHistoryMode = true;
                if (typeof loadDashboard === 'function') loadDashboard();
            }
        }

        // --- Tiá»‡n Ã­ch TÃ¬m ráº£nh ---

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
                sessionGroup.style.display = 'none'; // áº¨n hoÃ n toÃ n theo yÃªu cáº§u cá»§a bÃ¡c sÄ©
                const buoiSelect = document.getElementById('pat-buoi-dieu-tri');
                if (buoiSelect) buoiSelect.value = 'TuDong'; // LuÃ´n luÃ´n lÃ  Tá»± Ä‘á»™ng
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

                    alert("ÄÃ£ náº¡p file thÃ nh cÃ´ng!");

                } catch (err) { alert("Lá»—i Ä‘á»c file: " + err.message); }

            };

            reader.readAsArrayBuffer(file);

        }



        window.loadTimRanhDataFromServer = function () {

            const statusEl = document.getElementById('utils-file-status');

            if (statusEl) {

                statusEl.innerText = "â³ Äang káº¿t ná»‘i mÃ¡y chá»§ Ä‘á»ƒ láº¥y dá»¯ liá»‡u TÃ¬m Ráº£nh chung...";

                statusEl.style.color = "#f39c12";

            }



            google.script.run.withSuccessHandler(function (data) {

                if (data && data.length > 0) {

                    window.externalUtilsData = data;

                    if (statusEl) {

                        statusEl.innerText = `âœ… ÄÃ£ táº£i ${data.length} ca dÃ¹ng chung tá»« mÃ¡y chá»§ (Sheet TimRanh)!`;

                        statusEl.style.color = "#27ae60";

                    }

                } else if (statusEl) {

                    statusEl.innerText = "(ChÆ°a cÃ³ dá»¯ liá»‡u chung. Äang dÃ¹ng: Lá»‹ch pháº§n má»m xáº¿p)";

                    statusEl.style.color = "#e67e22";

                }

            }).getTimRanhData();

        };

        function taiLichTheoNgay(callback) {
            var dateEl = document.getElementById('utils-search-date');
            var date = dateEl ? dateEl.value : '';
            if (!date) {
                if (typeof callback === 'function') callback([]);
                return alert('Vui lÃ²ng chá»n ngÃ y!');
            }
            var statusEl = document.getElementById('utils-lich-status');
            var btn = document.getElementById('btn-tai-lich-utils');

            var handleSuccess = function (sched, staffBusy) {
                window.utilsScheduleData = sched || [];
                window.utilsScheduleDate = date;
                window.utilsStaffBusy = staffBusy || [];
                var dd = date.split('-').reverse().join('/');
                if (statusEl) {
                    if (window.utilsScheduleData.length > 0) {
                        statusEl.innerText = 'âœ… NgÃ y ' + dd + ': ' + window.utilsScheduleData.length + ' ca. Sáºµn sÃ ng tÃ¬m ráº£nh!';
                        statusEl.style.color = '#27ae60';
                    } else {
                        statusEl.innerText = 'â„¹ï¸ NgÃ y ' + dd + ': 0 ca (NhÃ¢n sá»± ráº£nh cáº£ ngÃ y).';
                        statusEl.style.color = '#2980b9';
                    }
                }
                if (btn) { btn.disabled = false; btn.innerText = 'ðŸ“Š Xem Lá»‹ch'; }
                if (typeof callback === 'function') callback(window.utilsScheduleData);
            };

            const isToday = (window._systemActiveYMD && date === window._systemActiveYMD) || (date === new Date().toISOString().slice(0, 10));
            if (isToday && window.currentScheduleData && window.currentScheduleData.length > 0) {
                if (statusEl) { statusEl.innerText = 'â³ Äang náº¡p lá»‹ch hiá»‡n táº¡i...'; statusEl.style.color = '#3498db'; }
                setTimeout(() => handleSuccess(window.currentScheduleData || [], []), 50);
                return;
            }

            if (statusEl) { statusEl.innerText = 'â³ Äang táº£i...'; statusEl.style.color = '#f39c12'; }
            if (btn) { btn.disabled = true; btn.innerText = 'â³ Äang táº£i...'; }
            google.script.run
                .withSuccessHandler(function (data) {
                    var sched = (data && data.schedule) ? data.schedule : (Array.isArray(data) ? data : []);
                    var sb = (data && data.staffBusy) ? data.staffBusy : [];
                    handleSuccess(sched, sb);
                })
                .withFailureHandler(function (err) {
                    if (statusEl) { statusEl.innerText = 'âŒ Lá»—i táº£i dá»¯ liá»‡u!'; statusEl.style.color = '#c0392b'; }
                    if (btn) { btn.disabled = false; btn.innerText = 'ðŸ“Š Xem Lá»‹ch'; }
                    console.error('taiLichTheoNgay error:', err);
                    if (typeof callback === 'function') callback([]);
                })
                .getHistoryFullData(date);
        }





        // Cháº¡y luÃ´n hÃ m táº£i dá»¯ liá»‡u ngay khi má»Ÿ web

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

            const searchDate = document.getElementById('utils-search-date')?.value || '';
            if (!searchDate) return alert("Vui lÃ²ng chá»n NgÃ y cáº§n tÃ¬m á»Ÿ trÃªn trÆ°á»›c!");

            // Tá»± Ä‘á»™ng táº£i lá»‹ch náº¿u chÆ°a táº£i hoáº·c ngÃ y tÃ¬m khÃ¡c ngÃ y trong cache
            if (!window.utilsScheduleData || window.utilsScheduleDate !== searchDate) {
                taiLichTheoNgay(function () {
                    timBacSiRanh();
                });
                return;
            }

            let vao_str = (document.getElementById('search-doc-time')?.value || '').trim();
            if (!vao_str) {
                vao_str = "07:30";
                const timeInput = document.getElementById('search-doc-time');
                if (timeInput) timeInput.value = "07:30";
            }

            let sourceData = window.utilsScheduleData || [];
            const t_vao = t2m(vao_str);
            const tbody = document.getElementById('free-doc-list');
            tbody.innerHTML = '';
            let found = false;

            // Äáº£m báº£o láº¥y danh sÃ¡ch nhÃ¢n sá»± chuáº©n (báº£o toÃ n vai trÃ², ká»¹ nÄƒng)
            const staffList = (window._liveDataCacheBackup && window._liveDataCacheBackup.staff && window._liveDataCacheBackup.staff.length > 0)
                ? window._liveDataCacheBackup.staff
                : (dataCache.staff || []);

            const docs = staffList.filter(s => {
                if (!s || !s.ten) return false;
                const vt = String(s.vaiTro || s.role || '').toLowerCase();
                const isNurse = /Ä‘iá»u dÆ°á»¡ng|dieu duong|^Ä‘d\b|^dd\b|y tÃ¡|y ta|há»™ lÃ½|ho ly|trá»£ lÃ½|tro ly/i.test(vt);
                if (isNurse) return false;
                const isDocOrKtv = vt.includes('bÃ¡c sÄ©') || vt.includes('ká»¹ thuáº­t viÃªn') || vt.includes('ktv') || !vt;
                return isDocOrKtv && s.trangThai !== 'Nghá»‰ cáº£ ngÃ y';
            });

            const isToday = (!searchDate || searchDate === new Date().toISOString().slice(0, 10) || searchDate === window._systemActiveYMD);

            docs.forEach(doc => {
                let busy = [];
                const dNameClean = String(doc.ten).trim().toLowerCase().replace(/^(bs\.|bs|ktv\.|ktv|Ä‘d\.|Ä‘d)\s+/i, '');

                sourceData.forEach(row => {
                    const nvChinh = String(row.nvChinh || row[7] || '').trim().toLowerCase();
                    const nvPhu = String(row.nvPhu || row[8] || '').trim().toLowerCase();
                    const cleanNvChinh = nvChinh.replace(/^(bs\.|bs|ktv\.|ktv|Ä‘d\.|Ä‘d)\s+/i, '');
                    const cleanNvPhu = nvPhu.replace(/^(bs\.|bs|ktv\.|ktv|Ä‘d\.|Ä‘d)\s+/i, '');

                    if (cleanNvChinh !== dNameClean && cleanNvPhu !== dNameClean) return;

                    const tStart = t2m(row.gioDienRa || row[5]), tEnd = t2m(row.gioKetThuc || row[6]);
                    if (isNaN(tStart) || isNaN(tEnd) || tEnd <= tStart) return;

                    const thuThuat = String(row.thuThuat || row[4] || '').trim().toLowerCase();
                    const procInfo = (dataCache.proc || []).find(p =>
                        String(p.ten || '').toLowerCase() === thuThuat ||
                        (p.vietTat && String(p.vietTat || '').toLowerCase() === thuThuat)
                    );

                    const tgNhanVien = procInfo && procInfo.thoiGianThucHien ? parseInt(procInfo.thoiGianThucHien) : Math.min(5, tEnd - tStart);
                    const khoangCachRaw = procInfo && procInfo.khoangCach ? parseInt(procInfo.khoangCach) : tgNhanVien;
                    const khoangCach = Math.max(khoangCachRaw, tgNhanVien + 1);

                    busy.push([tStart, tStart + khoangCach]);
                    if (tEnd > tStart + tgNhanVien) {
                        busy.push([tEnd, tEnd + 1]);
                    }
                });

                // Chá»‰ Ã¡p dá»¥ng giá» báº­n táº¡m thá»i náº¿u Ä‘ang tÃ¬m lá»‹ch hÃ´m nay
                if (isToday && doc.gioBan) {
                    String(doc.gioBan).split(',').forEach(b => {
                        const pts = b.split('-');
                        if (pts.length === 2) {
                            busy.push([t2m(pts[0].trim()), t2m(pts[1].trim()) + 1]);
                        }
                    });
                } else if (!isToday && window.utilsStaffBusy && window.utilsStaffBusy.length > 0) {
                    // Náº¿u tÃ¬m ngÃ y cÅ©, láº¥y giá» báº­n thá»±c táº¿ lÆ°u trong utilsStaffBusy (tá»« gio_ban_cu)
                    const foundSb = window.utilsStaffBusy.find(sb => {
                        const sbClean = String(sb.ten || '').trim().toLowerCase().replace(/^(bs\.|bs|ktv\.|ktv|Ä‘d\.|Ä‘d)\s+/i, '');
                        return sbClean === dNameClean;
                    });
                    if (foundSb && Array.isArray(foundSb.slots)) {
                        foundSb.slots.forEach(sl => {
                            if (sl.from && sl.to) {
                                busy.push([t2m(sl.from), t2m(sl.to) + 1]);
                            }
                        });
                    }
                }

                busy.sort((a, b) => a[0] - b[0]);

                let merged = [];
                busy.forEach(b => {
                    if (!merged.length) { merged.push(b); return; }
                    const last = merged[merged.length - 1];
                    b[0] <= last[1] ? merged[merged.length - 1] = [last[0], Math.max(last[1], b[1])] : merged.push(b);
                });

                let shifts = []; 
                if (doc.thoiGianLam) String(doc.thoiGianLam).split(',').forEach(sh => {
                    const pts = sh.split('-');
                    if (pts.length === 2) shifts.push([t2m(pts[0].trim()), t2m(pts[1].trim())]);
                });
                if (!shifts.length) shifts = [[420, 690], [780, 1014]];

                const yhctEndRaw = document.getElementById("admin-yhct-end")?.value;
                const yhctLunchRaw = document.getElementById("admin-yhct-lunch")?.value;
                const yhctEndVal = (yhctEndRaw !== undefined && yhctEndRaw !== '') ? (parseInt(yhctEndRaw) || 0) : 0;
                const yhctLunchVal = (yhctLunchRaw !== undefined && yhctLunchRaw !== '') ? (parseInt(yhctLunchRaw) || 0) : 0;

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
                                        <td>ðŸ‘¨â€âš•ï¸ <b>${doc.ten}</b></td>
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
                                const noteOvertime = extraMins > 0 ? ` <span style="font-size:11px; color:#e67e22; font-weight:normal;">(+${extraMins}p lá»‘)</span>` : '';
                                tbody.innerHTML += `<tr>
                                    <td>ðŸ‘¨â€âš•ï¸ <b>${doc.ten}</b></td>
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
                tbody.innerHTML = `<tr> <td colspan="3" align="center" style="color:#c0392b; font-weight:bold;">KhÃ´ng cÃ³ NhÃ¢n sá»± ráº£nh lÃºc nÃ y</td></tr>`;
            }

            // Äá»“ng bá»™ dropdown lá»c tÃªn bÃ¡c sÄ©
            const filterSelect = document.getElementById('filter-doc-name');
            if (filterSelect) {
                const uniqueDocs = [...new Set(docs.map(d => d.ten))].sort();
                filterSelect.innerHTML = '<option value="">ðŸ” Lá»c tÃªn bÃ¡c sÄ©...</option>' + uniqueDocs.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
                if (previousSelection && uniqueDocs.includes(previousSelection)) {
                    filterSelect.value = previousSelection;
                }
                filterDoctorTable();
            }
        }

        function timMayRanh() {
            const searchDate = document.getElementById('utils-search-date')?.value || '';
            if (!searchDate) return alert("Vui lÃ²ng chá»n NgÃ y cáº§n tÃ¬m á»Ÿ trÃªn trÆ°á»›c!");

            // Tá»± Ä‘á»™ng táº£i lá»‹ch náº¿u chÆ°a táº£i hoáº·c ngÃ y tÃ¬m khÃ¡c ngÃ y trong cache
            if (!window.utilsScheduleData || window.utilsScheduleDate !== searchDate) {
                taiLichTheoNgay(function () {
                    timMayRanh();
                });
                return;
            }

            const loai = document.getElementById('search-machine-type').value;
            let gio_str = (document.getElementById('search-machine-time')?.value || '').trim();
            if (!gio_str) {
                gio_str = "07:30";
                const timeInput = document.getElementById('search-machine-time');
                if (timeInput) timeInput.value = "07:30";
            }

            let sourceData = window.utilsScheduleData || [];

            if (!loai || loai.includes("Chá»n loáº¡i")) return alert("Vui lÃ²ng chá»n Loáº¡i mÃ¡y cáº§n tÃ¬m!");

            const t_vao = t2m(gio_str);
            const tbody = document.getElementById('free-machine-list');
            tbody.innerHTML = '';

            const may_thuoc_loai = (dataCache.machine || []).filter(m => {
                if (!m) return false;
                const t = String(m.tenLoai || m.ten_loai || (Array.isArray(m) ? m[1] : '') || '').trim();
                const s = m.trangThai || m.trang_thai || (Array.isArray(m) ? m[3] : '') || 'Sáºµn sÃ ng';
                return t === loai.trim() && s === 'Sáºµn sÃ ng';
            }).map(m => String(m.maMay || m.ma_may || (Array.isArray(m) ? m[2] : '') || '').trim()).filter(Boolean);

            if (!may_thuoc_loai.length) {
                tbody.innerHTML = `<tr> <td colspan="2" align="center" style="color:#c0392b; font-weight:bold;">MÃ¡y Ä‘ang há»ng/báº£o trÃ¬ háº¿t</td></tr>`;
                return;
            }

            const m_busy = {};
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
                });

                let is_free = true, free_until = 1440;
                for (const b of merged) {
                    if (b[0] <= t_vao && t_vao < b[1]) {
                        is_free = false;
                        break;
                    }
                    if (b[1] <= t_vao) continue;
                    if (b[0] > t_vao) free_until = Math.min(free_until, b[0]);
                }

                if (is_free) {
                    tbody.innerHTML += `<tr>
                        <td><strong>${m}</strong></td>
                        <td style="color:#27ae60; font-weight:bold;">${free_until === 1440 ? "Háº¿t ngÃ y" : `Äáº¿n ${m2t(free_until - 1)}`}</td>
                    </tr>`;
                    found = true;
                }
            });

            if (!found) {
                tbody.innerHTML = `<tr> <td colspan="2" align="center" style="color:#c0392b; font-weight:bold;">Háº¿t mÃ¡y ráº£nh</td></tr>`;
            }
        }



        // ============================================================

        // ðŸ“… TAB 7 - THá»¨ 7

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



                // ðŸ›¡ï¸ Láº¥y toÃ n bá»™ nhÃ¢n sá»± tá»« backend getSatData káº¿t há»£p vá»›i dataCache.staff (tá»« tab-staff)
                let allStaff = (data && Array.isArray(data.staff) && data.staff.length > 0) ? [...data.staff] : [];
                if (window.dataCache && Array.isArray(window.dataCache.staff) && window.dataCache.staff.length > 0) {
                    window.dataCache.staff.forEach(s => {
                        const sTen = s.ten || s.name;
                        if (sTen && !allStaff.some(st => (st.ten || st.name) === sTen)) {
                            allStaff.push({
                                ...s,
                                ten: sTen,
                                name: sTen,
                                vaiTro: s.vaiTro || s.role || 'KTV',
                                role: s.vaiTro || s.role || 'KTV',
                                quyen: s.quyen || s.system || 'Cáº£ hai',
                                system: s.quyen || s.system || 'Cáº£ hai',
                                kyNang: s.kyNang || s.skills || '',
                                skills: s.kyNang || s.skills || ''
                            });
                        }
                    });
                }
                if (!window.dataCache) window.dataCache = {};
                if (!window.dataCache.staff || window.dataCache.staff.length === 0) {
                    window.dataCache.staff = [...allStaff];
                } else {
                    allStaff.forEach(s => {
                        const existing = window.dataCache.staff.find(st => (st.ten || st.name) === (s.ten || s.name));
                        if (!existing) {
                            window.dataCache.staff.push(s);
                        } else {
                            if (!existing.kyNang && s.kyNang) existing.kyNang = s.kyNang;
                            if (!existing.vaiTro && s.vaiTro) existing.vaiTro = s.vaiTro;
                            if (!existing.quyen && s.quyen) existing.quyen = s.quyen;
                        }
                    });
                }

                allStaff.forEach((s, idx) => {
                    const ten = s.ten || s.name;
                    const isDoc = /bÃ¡c sÄ©|bac si|^bs\b/i.test(s.vaiTro || s.role || '') || /^bs\b/i.test(ten);
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

                    const roleBadge = document.createElement('span');
                    if (isDoc) {
                        roleBadge.style.cssText = 'background:#eff6ff; color:#1d4ed8; font-size:11px; padding:1px 6px; border-radius:3px; font-weight:700; border:1px solid #bfdbfe; margin-left:2px;';
                        roleBadge.innerText = 'ðŸ©º BÃ¡c sÄ©';
                    } else if (/Ä‘iá»u dÆ°á»¡ng|dieu duong|^Ä‘d\b|^dd\b/i.test(s.vaiTro || s.role || '')) {
                        roleBadge.style.cssText = 'background:#fef3c7; color:#b45309; font-size:11px; padding:1px 6px; border-radius:3px; font-weight:600; border:1px solid #fde68a; margin-left:2px;';
                        roleBadge.innerText = 'ÄD';
                    } else {
                        roleBadge.style.cssText = 'background:#f0fdf4; color:#15803d; font-size:11px; padding:1px 6px; border-radius:3px; font-weight:600; border:1px solid #bbf7d0; margin-left:2px;';
                        roleBadge.innerText = 'KTV';
                    }

                    cbLabel.append(cbInput, spanName, roleBadge);
                    fItem.appendChild(cbLabel);



                    const timeDiv = document.createElement('div');

                    timeDiv.id = `sat-time-${idx}`;

                    timeDiv.style.cssText = 'display:none; padding-left:25px; margin-top:5px;';

                    timeDiv.innerHTML = `

                            <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px; font-size:12px;">

                                SÃ¡ng: <input type="text" id="sat-s1-${idx}" value="${s1_val}" class="time-input"

                                    style="width:50px; padding:2px; text-align:center"> - <input type="text"

                                    id="sat-s2-${idx}" value="${s2_val}" class="time-input"

                                    style="width:50px; padding:2px; text-align:center"></div>

                            <div style="display:flex; align-items:center; gap:5px; font-size:12px;">Chiá»u: <input

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

                // ðŸ›¡ï¸ Lá»ŒC Bá»Ž Bá»†NH NHÃ‚N ÄÃƒ CÃ“ GIá»œ RA VIá»†N (KHI CHÆ¯A CHá»T Sá»”)
                const dischargedSet = new Set();
                if (window.dataCache && Array.isArray(window.dataCache.pat)) {
                    window.dataCache.pat.forEach(p => {
                        if (p && p.gioRa && String(p.gioRa).trim() !== '' && String(p.gioRa).trim().toLowerCase() !== 'none') {
                            dischargedSet.add(String(p.ten || '').trim().toLowerCase() + '|' + String(p.namSinh || '').trim());
                            if (p.id) dischargedSet.add(String(p.id));
                        }
                    });
                }

                const filteredPatients = (data.patients || []).filter(r => {
                    if (!r || !r.ten) return false;
                    const rLeave = String(r.gioRa || r.leave_time || r.leaveTime || '').trim();
                    if (rLeave && rLeave.toLowerCase() !== 'none') return false;

                    const key = String(r.ten || '').trim().toLowerCase() + '|' + String(r.namSinh || '').trim();
                    if (dischargedSet.has(key)) return false;
                    if (r.id && dischargedSet.has(String(r.id))) return false;

                    return true;
                });

                const countBadge = document.getElementById('sat-patient-count-badge');
                if (countBadge) {
                    countBadge.innerText = `${filteredPatients.length} BN`;
                    countBadge.title = `Tá»•ng cá»™ng ${filteredPatients.length} bá»‡nh nhÃ¢n Ä‘iá»u trá»‹ Thá»© 7 (ÄÃ£ loáº¡i bá» bá»‡nh nhÃ¢n ra viá»‡n)`;
                }

                // Sáº¯p xáº¿p A-Z theo tÃªn bá»‡nh nhÃ¢n
                filteredPatients.sort((a, b) => (a.ten || '').localeCompare(b.ten || '', 'vi'));
                const midPoint = Math.ceil(filteredPatients.length / 2);

                filteredPatients.forEach((r, pIdx) => {

                    const bn_id = "BN_" + pIdx + "_" + (r.id || "0");

                    satCache[bn_id] = { info: r, items: [], frameId: `sat-bn-${bn_id}` };

                    const fBn = document.createElement('div');
                    fBn.id = `sat-bn-${bn_id}`;
                    fBn.className = 'sat-bn-card';
                    fBn.style.cssText = 'padding:6px 10px; margin-bottom:6px; border-radius:5px; display:flex; flex-direction:column; gap:4px;';

                    const tDiv = document.createElement('div');
                    tDiv.className = 'sat-bn-header';
                    tDiv.style.cssText = 'display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #ecf0f1; padding-bottom:3px;';
                    tDiv.innerHTML = `<b class="sat-bn-name" style="font-size:12px;">${pIdx + 1}. ${escapeHtml(String(r.ten || '').toUpperCase())} (${escapeHtml(r.namSinh || '')})</b> <span class="sat-bn-room" style="font-size:11px; padding:1px 6px; border-radius:3px; white-space:nowrap;">P. ${escapeHtml(r.phong || '')}</span>`;
                    fBn.appendChild(tDiv);

                    const flexContainer = document.createElement('div');
                    flexContainer.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-top:2px;';

                    const ttDiv = document.createElement('div');
                    ttDiv.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px;';

                    (r.thuThuat ? r.thuThuat.split(',').map(x => x.trim()).filter(x => x) : []).forEach((tt, tIdx) => {
                        satCache[bn_id].items.push({ name: tt, checked: false });

                        const cb = document.createElement('label');
                        cb.className = 'sat-proc-checkbox-label';
                        cb.style.cssText = 'font-size:12px; cursor:pointer; display:flex; align-items:center; gap:4px;'; cb.title = tt;

                        const input = document.createElement('input');
                        input.type = 'checkbox'; input.id = `cb-sat-${bn_id}-${tIdx}`;
                        input.className = 'sat-proc-cb';
                        input.style.cssText = 'width:13px; height:13px; margin:0; cursor:pointer;';
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
                    readyLabel.innerText = 'â± Giá» SS:';
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
                btn.innerText = 'ðŸ“ áº¨n nhÃ¢n sá»±';
            } else {
                container.style.display = 'none';
                btn.style.background = '';
                btn.innerText = 'ðŸ‘¥ Chá»n nhÃ¢n sá»±';
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
                sumDiv.innerHTML = '<div style="color:gray; text-align:center; margin-top:20px;">ChÆ°a chá»n thá»§ thuáº­t nÃ o.</div>';
                return;
            }
            if (sumContainer) sumContainer.style.display = 'flex';

            let html = `<div

                                style="background:#2c3e50; color:white; padding:8px; border-radius:4px; margin-bottom:10px; display:flex; justify-content:space-between;">

                                <b>Tá»”NG Cá»˜NG:</b> <b style="color:#f1c40f">${total} ca</b>

                            </div>`;

            Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([tt, qty]) => {

                html += `<div

                                style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #ecf0f1;">

                                <span>â€¢ ${tt}:</span> <b style="color:#e67e22">${qty} ca</b>

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

                    // Láº¥y giá» sáºµn sÃ ng hiá»‡n táº¡i trÃªn giao diá»‡n

                    const readyInput = document.querySelector(`#${satCache[bid].frameId} .input-ready-time`);

                    const readyTime = readyInput ? readyInput.value : "07:30";



                    // ThÃªm readyTime lÃ m cá»™t thá»© 4

                    data.push([bid, r.ten, chosen.join(", "), readyTime]);

                }

            }

            if (!data.length) return alert("ChÆ°a cÃ³ thá»§ thuáº­t nÃ o Ä‘Æ°á»£c tick Ä‘á»ƒ lÆ°u!");



            const wb = XLSX.utils.book_new();

            // Khai bÃ¡o tiÃªu Ä‘á» cá»™t thá»© 4

            const ws = XLSX.utils.aoa_to_sheet([["MÃ£ Truy Xuáº¥t", "TÃªn Bá»‡nh NhÃ¢n", "Thá»§ Thuáº­t ÄÃ£ Chá»n",

                "Giá» Sáºµn SÃ ng"], ...data]);

            ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 50 }, { wch: 15 }];



            XLSX.utils.book_append_sheet(wb, ws, "ThuThuatT7");

            XLSX.writeFile(wb, `DS_ThuThuat_T7_${new Date().toISOString().slice(0, 10)}.xlsx`);
        }

        // ============================================================
        // ðŸ¥ Bá»˜ Tá»ª ÄIá»‚N & THUáº¬T TOÃN ÃNH Xáº  CHá»ˆ Äá»ŠNH Tá»ª FILE HIS
        // Ãp dá»¥ng Ä‘á»“ng bá»™ cho cáº£ Tab Bá»‡nh NhÃ¢n & Tab Thá»© 7
        // ============================================================
        const HIS_MAPPING = [
            // 1. Äiá»‡n chÃ¢m
            { keywords: ['Ä‘iá»‡n chÃ¢m', 'dien cham', 'dc ', ' dc,', ',dc,', ',dc', 'Ä‘c ', ' Ä‘c,', ',Ä‘c,', ',Ä‘c', 'diencham', 'chÃ¢m Ä‘iá»‡n', 'cham dien'], excludes: ['chÃ¢m liá»‡t', 'liá»‡t'], target: 'Äiá»‡n chÃ¢m' },
            // 2. Äiá»‡n chÃ¢m liá»‡t
            { keywords: ['Ä‘iá»‡n chÃ¢m liá»‡t', 'dien cham liet', 'chÃ¢m liá»‡t', 'cham liet', 'Ä‘cl', 'dcl', 'dctb'], target: 'Äiá»‡n chÃ¢m liá»‡t' },
            // 3. Thá»§y chÃ¢m
            { keywords: ['thá»§y chÃ¢m', 'thuy cham', 'tc ', ' tc,', ',tc,', ',tc', 'thuycham'], target: 'Thá»§y chÃ¢m' },
            // 4. Xoa bÃ³p báº¥m huyá»‡t
            { keywords: ['xoa bÃ³p báº¥m huyá»‡t', 'xoa bop bam huyet', 'xbbh', 'xbb', 'báº¥m huyá»‡t', 'bam huyet', 'xoa bop bam'], target: 'Xoa bÃ³p báº¥m huyá»‡t' },
            // 5. Xoa bÃ³p vÃ¹ng
            { keywords: ['ká»¹ thuáº­t xoa bÃ³p vÃ¹ng', 'xoa bÃ³p vÃ¹ng', 'xbv', 'xoa bop vung', 'xoa bÃ³p cá»¥c bá»™', 'xoa bop'], target: 'Xoa bÃ³p vÃ¹ng' },
            // 6. HÃ o chÃ¢m / ChÃ¢m cá»©u
            // excludes 'kim' Ä‘á»ƒ trÃ¡nh nháº§m "Kim ChÃ¢m cá»©u cÃ¡c sá»‘" (váº­t tÆ° y táº¿) thÃ nh thá»§ thuáº­t HÃ o chÃ¢m
            { keywords: ['hÃ o chÃ¢m', 'hao cham', ' hc,', ',hc,', ',hc', ' hc ', 'chÃ¢m cá»©u', 'cham cuu', 'Ã´n chÃ¢m', 'on cham', 'nhÄ© chÃ¢m', 'nhi cham'], excludes: ['kim cháº­m', 'kim cham', 'kim chau'], target: 'HÃ o chÃ¢m' },
            // 7. Cáº¥y chá»‰
            { keywords: ['cáº¥y chá»‰', 'cay chi', ' cc,', ',cc,', ',cc', ' cc ', 'caychi'], target: 'Cáº¥y chá»‰' },
            // 8. Cá»©u ngáº£i / Cá»©u áº¥m
            { keywords: ['cá»©u ngáº£i', 'cuu ngai', 'ngáº£i cá»©u', 'ngai cuu', 'cá»©u áº¥m', 'cuu am', ' cn,', ',cn,', ',cn', ' cn '], target: 'Cá»©u ngáº£i' },
            // 9. Äiá»‡n xung
            { keywords: ['Ä‘iá»‡n xung', 'dien xung', 'dÃ²ng Ä‘iá»‡n xung', 'dong dien xung', ' dx,', ',dx,', ',dx', ' dx '], target: 'Äiá»‡n xung' },
            // 10. Äiá»‡n phÃ¢n / Dáº«n thuá»‘c
            { keywords: ['Ä‘iá»‡n phÃ¢n', 'dien phan', 'dáº«n thuá»‘c', 'dan thuoc', 'Ä‘iá»‡n di', 'dien di', ' dp,', ',dp,', ',dp', ' dp '], target: 'Äiá»‡n phÃ¢n dáº«n thuá»‘c' },
            // 11. Chiáº¿u Ä‘Ã¨n há»“ng ngoáº¡i
            { keywords: ['há»“ng ngoáº¡i', 'hong ngoai', 'tia há»“ng', 'tia hong', 'Ä‘Ã¨n há»“ng', 'den hong', ' hn,', ',hn,', ',hn', ' hn '], target: 'Chiáº¿u Ä‘Ã¨n há»“ng ngoáº¡i' },
            // 12. Laser / Laser Ä‘iá»u trá»‹
            { 
                keywords: ['laser chÃ¢m', 'laser noi mach', 'laser ná»™i máº¡ch', 'laser dieu tri', 'laser Ä‘iá»u trá»‹', 'chÃ¢m laser', 'la-de', 'lade', 'chiáº¿u laser', 'ls ', ' ls,', ',ls,', ',ls', 'laser'], 
                excludes: ['mÃ¡y Ä‘áº¿m', 'may dem', 'táº¿ bÃ o mÃ¡u', 'te bao mau', 'huyáº¿t há»c', 'huyet hoc', 'xÃ©t nghiá»‡m', 'xet nghiem', 'phÃ¢n tÃ­ch', 'phan tich', 'mÃ¡u', 'mau', 'nÆ°á»›c tiá»ƒu', 'nuoc tieu'], 
                target: 'Laser Ä‘iá»u trá»‹' 
            },
            // 13. SÃ³ng ngáº¯n
            { keywords: ['sÃ³ng ngáº¯n', 'song ngan', 'tháº¥u nhiá»‡t sÃ³ng ngáº¯n', ' sn,', ',sn,', ',sn', ' sn '], target: 'SÃ³ng ngáº¯n' },
            // 14. SiÃªu Ã¢m Ä‘iá»u trá»‹
            { keywords: ['siÃªu Ã¢m', 'sieu am', ' sa,', ',sa,', ',sa', ' sa '], excludes: ['á»• bá»¥ng', 'o bung', 'tuyáº¿n giÃ¡p', 'tuyen giap', 'doppler', 'pháº§n phá»¥', 'phan phu', 'tá»•ng quÃ¡t', 'tong quat', 'tuyáº¿n vÃº', 'tuyen vu', 'thai', 'tim', 'máº¡ch', 'mach', 'mÃ ng phá»•i', 'mang phoi', 'khá»›p', 'khop', 'pháº§n má»m', 'phan mem', '4d', '3d', 'ná»™i soi', 'noi soi'], target: 'SiÃªu Ã¢m' },
            // 15. KÃ©o giÃ£n cá»™t sá»‘ng
            { keywords: ['kÃ©o giÃ£n', 'keo gian', 'kÃ©o cá»™t sá»‘ng', 'keo cot song', 'cot song', 'kÃ©o cá»•', 'keo co', 'kÃ©o lÆ°ng', 'keo lung', ' kg,', ',kg,', ',kg', ' kg '], target: 'KÃ©o giÃ£n' },
            // 16. Táº­p váº­n Ä‘á»™ng cÃ³ trá»£ giÃºp
            { keywords: ['táº­p váº­n Ä‘á»™ng cÃ³ trá»£ giÃºp', 'tap van dong co tro giup', 'táº­p váº­n Ä‘á»™ng trá»£ giÃºp', 'tap van dong tro giup', 'váº­n Ä‘á»™ng cÃ³ trá»£ giÃºp', 'van dong co tro giup', 'váº­n Ä‘á»™ng trá»£ giÃºp', 'van dong tro giup', 'táº­p trá»£ giÃºp', 'tap tro giup', 'trá»£ giÃºp', 'tro giup', 'ttg', 'vÄ‘-tg', 'vdtg', ' ttg,', ',ttg,', ',ttg'], target: 'táº­p trá»£ giÃºp' },
            // 17. Táº­p váº­n Ä‘á»™ng thá»¥ Ä‘á»™ng
            { keywords: ['táº­p váº­n Ä‘á»™ng thá»¥ Ä‘á»™ng', 'van dong thu dong', 'táº­p thá»¥ Ä‘á»™ng', 'tap thu dong', 'thá»¥ Ä‘á»™ng', 'thu dong', 'vÄ‘-td', 'vdtd', 'ttd'], target: 'táº­p thá»¥ Ä‘á»™ng' },
            // 18. Táº­p váº­n Ä‘á»™ng cÃ³ khÃ¡ng trá»Ÿ
            { keywords: ['táº­p váº­n Ä‘á»™ng cÃ³ khÃ¡ng trá»Ÿ', 'van dong co khang tro', 'táº­p váº­n Ä‘á»™ng khÃ¡ng trá»Ÿ', 'tap van dong khang tro', 'váº­n Ä‘á»™ng cÃ³ khÃ¡ng trá»Ÿ', 'van dong co khang tro', 'váº­n Ä‘á»™ng khÃ¡ng trá»Ÿ', 'van dong khang tro', 'táº­p khÃ¡ng trá»Ÿ', 'tap khang tro', 'khÃ¡ng trá»Ÿ', 'khang tro', 'cÃ³ khÃ¡ng trá»Ÿ', 'tkt', 'ttk', 'vÄ‘-kt', 'vdkt', ' tkt,', ',tkt,', ',tkt', ' ttk,', ',ttk,', ',ttk', ' tk,', ',tk,', ',tk', ' tk '], target: 'táº­p khÃ¡ng trá»Ÿ' },
            // 19. Táº­p cÃ¡c kiá»ƒu thá»Ÿ
            { keywords: ['táº­p cÃ¡c kiá»ƒu thá»Ÿ', 'kiá»ƒu thá»Ÿ', 'kieu tho', 'táº­p thá»Ÿ', 'tap tho'], target: 'Táº­p thá»Ÿ' },
            // 20. Váº­n Ä‘á»™ng trá»‹ liá»‡u
            { keywords: ['váº­n Ä‘á»™ng trá»‹ liá»‡u', 'van dong tri lieu', 'vÄ‘tl', 'vdtl'], target: 'Váº­n Ä‘á»™ng trá»‹ liá»‡u' },
            // 21. Parafin
            { keywords: ['parafin', 'paraffine', 'paraffin', 'sÃ¡p parafin', 'Ä‘áº¯p parafin', ' pa,', ',pa,', ',pa', ' pa '], target: 'Parafin' },
            // 22. Tá»« trÆ°á»ng
            { keywords: ['tá»« trÆ°á»ng', 'tu truong', 'tá»« trÆ°á»ng Ä‘iá»u trá»‹'], target: 'Tá»« trÆ°á»ng' },
            // 23. Táº¯m thuá»‘c / NgÃ¢m thuá»‘c
            { keywords: ['táº¯m thuá»‘c', 'tam thuoc', 'ngÃ¢m thuá»‘c', 'ngam thuoc', 'ngÃ¢m chÃ¢n'], target: 'Táº¯m thuá»‘c' },
            // 24. ChÆ°á»m nÃ³ng / Äáº¯p nÃ³ng
            { keywords: ['chÆ°á»m nÃ³ng', 'chuom nong', 'Ä‘áº¯p nÃ³ng', 'dap nong', 'chÆ°á»m ngáº£i', 'chuom ngai'], target: 'ChÆ°á»m nÃ³ng' },
            // 25. GiÃ¡c hÆ¡i
            { keywords: ['giÃ¡c hÆ¡i', 'giac hoi', 'hÃºt giÃ¡c', 'hut giac', 'giÃ¡c'], target: 'GiÃ¡c hÆ¡i' },
            // 26. XÃ´ng hÆ¡i / XÃ´ng thuá»‘c
            { keywords: ['xÃ´ng hÆ¡i', 'xong hoi', 'xÃ´ng thuá»‘c', 'xong thuoc'], target: 'XÃ´ng thuá»‘c' },
            // 27. NÃ©n Ã©p Ã¡p lá»±c hÆ¡i
            { keywords: ['Ã¡p lá»±c hÆ¡i', 'ap luc hoi', 'nÃ©n Ã©p Ã¡p lá»±c hÆ¡i', 'bÆ¡m nÃ©n khÃ­', 'nÃ©n khÃ­'], target: 'NÃ©n Ã©p Ã¡p lá»±c hÆ¡i' },
            // 28. NgÃ´n ngá»¯ trá»‹ liá»‡u / Táº­p nuá»‘t / Táº­p nÃ³i
            { keywords: ['táº­p nuá»‘t', 'tap nuot', 'ngÃ´n ngá»¯ trá»‹ liá»‡u', 'ngon ngu tri lieu', 'táº­p nÃ³i', 'tap noi'], target: 'NgÃ´n ngá»¯ trá»‹ liá»‡u' },
            // 29. Hoáº¡t Ä‘á»™ng trá»‹ liá»‡u
            { keywords: ['hoáº¡t Ä‘á»™ng trá»‹ liá»‡u', 'hoat dong tri lieu', 'hÄ‘tl', 'hdtl'], target: 'Hoáº¡t Ä‘á»™ng trá»‹ liá»‡u' },
            // 30. Táº­p thÄƒng báº±ng / Táº­p Ä‘i
            { keywords: ['thÄƒng báº±ng', 'thang bang', 'táº­p Ä‘i', 'tap di', 'táº­p Ä‘á»©ng', 'thanh song song'], target: 'Táº­p thÄƒng báº±ng' }
        ];

        // Chuáº©n hÃ³a chuá»—i (bá» dáº¥u, viáº¿t thÆ°á»ng, KHÃ”NG trim)
        function normalizeStrNoTrim(str) {
            const decodeFn = (typeof window !== 'undefined' && typeof window.decodeVietnameseEncoding === 'function')
                ? window.decodeVietnameseEncoding
                : (s => String(s || '').normalize('NFC').trim());
            return decodeFn(str).toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/Ä‘/g, 'd').replace(/Ä/g, 'd');
        }

        // Chuáº©n hÃ³a chuá»—i (bá» dáº¥u, viáº¿t thÆ°á»ng, cÃ³ trim)
        function normalizeStr(str) {
            return normalizeStrNoTrim(str).trim();
        }

        // LÃ m sáº¡ch chuá»—i dá»‹ch vá»¥ thÃ´ tá»« dÃ²ng HIS
        function cleanHISLine(line) {
            if (!line) return '';
            const decodeFn = (typeof window !== 'undefined' && typeof window.decodeVietnameseEncoding === 'function')
                ? window.decodeVietnameseEncoding
                : (s => String(s || '').normalize('NFC').trim());
            return decodeFn(line)
                .replace(/^\s*(?:\d+[\.\/\-:\)]\s*|[+\-â€¢*]\s*)+/, '') // Bá» STT Ä‘áº§u dÃ²ng
                .replace(/\s*-\s*\d+\s*(?:láº§n|lan)?(?:\s*\/\s*(?:ngÃ y|ngay))?/gi, '') // Bá» - 1 láº§n/ngÃ y
                .replace(/\s*\(\s*\d+\s*(?:láº§n|lan)?\s*\)/gi, '') // Bá» (1 láº§n)
                .replace(/\s*x\s*\d+\s*(?:láº§n|lan)?/gi, '') // Bá» x 1 láº§n
                .replace(/\s*\([^)]*phÃ²ng[^)]*\)/gi, '') // Bá» (phÃ²ng ...)
                .replace(/\s*\([^)]*khoa[^)]*\)/gi, '') // Bá» (khoa ...)
                .replace(/\s*\([^)]*bÃ¡c sÄ©[^)]*\)/gi, '')
                .replace(/\s*\([^)]*bs[^)]*\)/gi, '')
                .replace(/\s*\(\s*(?:láº§n|lan|ngÃ y|ngay)\s*\)/gi, '') // Bá» Ä‘uÃ´i (Láº§n) hoáº·c (NgÃ y) cÃ²n sÃ³t
                // ðŸ”§ Fix: Bá» Ä‘uÃ´i Ä‘Æ¡n vá»‹ váº­t tÆ° y táº¿ nhÆ° (CÃ¡i), (Chiáº¿c), (á»ng), (GÃ³i), (Há»™p), (TuÃ½p)
                // Ä‘á»ƒ trÃ¡nh "Kim ChÃ¢m cá»©u cÃ¡c sá»‘ (CÃ¡i)" bá»‹ nháº­n diá»‡n nháº§m lÃ  thá»§ thuáº­t
                .replace(/\s*\(\s*(?:CÃ¡i|cÃ¡i|Chiáº¿c|chiáº¿c|á»ng|á»‘ng|GÃ³i|gÃ³i|Há»™p|há»™p|TuÃ½p|tuÃ½p|Lá»|lá»|ViÃªn|viÃªn|Chai|chai|Tá»|tá»|Cáº·p|cáº·p|ÄÃ´i|Ä‘Ã´i|Miáº¿ng|miáº¿ng)\s*\)/g, '') // Bá» Ä‘Æ¡n vá»‹ váº­t tÆ° y táº¿
                .trim();
        }

        // TÃ¡ch Ä‘a thá»§ thuáº­t trong 1 Ã´ y lá»‡nh HIS (há»— trá»£ \n, ;, 1. 2., +, -, pháº©y)
        function extractProceduresFromHISCell(dichVuStr) {
            if (!dichVuStr) return [];
            const text = String(dichVuStr).trim();
            if (!text) return [];

            // 1. TÃ¡ch theo ngáº¯t dÃ²ng (newline)
            let rawParts = text.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);

            // 2. TÃ¡ch tiáº¿p theo dáº¥u cháº¥m pháº©y ; hoáº·c Ä‘Ã¡nh sá»‘ 1. 2. 3. hoáº·c dáº¥u gáº¡ch Ä‘áº§u dÃ²ng
            let subParts = [];
            rawParts.forEach(part => {
                if (part.includes(';')) {
                    subParts.push(...part.split(';').map(s => s.trim()).filter(Boolean));
                } else if (/(?:^|\s+)\d+[\.\/\-:\)]\s+/.test(part)) {
                    const splitNum = part.split(/(?:^|\s+)\d+[\.\/\-:\)]\s+/).map(s => s.trim()).filter(Boolean);
                    if (splitNum.length > 1) {
                        subParts.push(...splitNum);
                    } else {
                        subParts.push(part);
                    }
                } else if (/(?:^|\s+)[+\-â€¢*]\s+/.test(part) && part.split(/(?:^|\s+)[+\-â€¢*]\s+/).filter(Boolean).length > 1) {
                    subParts.push(...part.split(/(?:^|\s+)[+\-â€¢*]\s+/).map(s => s.trim()).filter(Boolean));
                } else {
                    subParts.push(part);
                }
            });

            // 3. Náº¿u váº«n cÃ²n chuá»—i cÃ³ chá»©a dáº¥u pháº©y mÃ  tÃ¡ch dáº¥u pháº©y ra cÃ³ thá»§ thuáº­t há»£p lá»‡
            let result = [];
            subParts.forEach(item => {
                if (item.includes(',')) {
                    const commaParts = item.split(',').map(s => s.trim()).filter(Boolean);
                    const matchesCount = commaParts.filter(p => mapHISToProcedure(cleanHISLine(p))).length;
                    if (matchesCount >= 2 || (matchesCount >= 1 && commaParts.length <= 4)) {
                        result.push(...commaParts);
                        return;
                    }
                }
                result.push(item);
            });

            return result.map(s => cleanHISLine(s)).filter(Boolean);
        }

        // TÃ¬m tÃªn thá»§ thuáº­t chuáº©n (canonical name) tá»« danh má»¥c Ä‘ang cÃ³ trong há»‡ thá»‘ng dataCache.proc
        function getCanonicalProcedureName(targetOrName) {
            if (!targetOrName) return null;
            const procs = (window.dataCache && (window.dataCache.proc || window.dataCache.procedures)) || [];
            if (!procs.length) return targetOrName;

            const nTarget = normalizeStr(targetOrName);
            const cleanTarget = cleanMedicalProc(targetOrName);

            // 1. Khá»›p chÃ­nh xÃ¡c tÃªn hoáº·c viáº¿t táº¯t
            const exact = procs.find(p => {
                if (!p) return false;
                const pNorm = normalizeStr(p.ten);
                const vNorm = p.vietTat ? normalizeStr(p.vietTat) : '';
                const pClean = cleanMedicalProc(p.ten);
                return pNorm === nTarget || vNorm === nTarget || (pClean && cleanTarget && pClean === cleanTarget);
            });
            if (exact) return exact.ten;

            // 2. Khá»›p alias nhÃ³m thá»§ thuáº­t (Trá»£ giÃºp, KhÃ¡ng trá»Ÿ, Thá»¥ Ä‘á»™ng)
            if (cleanTarget.includes('tro giup') || nTarget === 'ttg' || nTarget === 'vd-tg' || nTarget === 'vdtg') {
                const pTG = procs.find(p => cleanMedicalProc(p.ten).includes('tro giup') || (p.vietTat && normalizeStr(p.vietTat) === 'ttg'));
                if (pTG) return pTG.ten;
            }
            if (cleanTarget.includes('khang tro') || nTarget === 'tkt' || nTarget === 'ttk' || nTarget === 'vd-kt' || nTarget === 'vdkt') {
                const pKT = procs.find(p => cleanMedicalProc(p.ten).includes('khang tro') || (p.vietTat && (normalizeStr(p.vietTat) === 'tkt' || normalizeStr(p.vietTat) === 'ttk')));
                if (pKT) return pKT.ten;
            }
            if (cleanTarget.includes('thu dong') || nTarget === 'ttd' || nTarget === 'vd-td' || nTarget === 'vdtd') {
                const pTD = procs.find(p => cleanMedicalProc(p.ten).includes('thu dong') || (p.vietTat && (normalizeStr(p.vietTat) === 'ttd' || normalizeStr(p.vietTat) === 'vd-td')));
                if (pTD) return pTD.ten;
            }

            // 3. Khá»›p chá»©a trá»n váº¹n
            const partial = procs.find(p => {
                if (!p) return false;
                const pNorm = normalizeStr(p.ten);
                const pClean = cleanMedicalProc(p.ten);
                return (pNorm.length >= 3 && nTarget.includes(pNorm)) || 
                       (nTarget.length >= 3 && pNorm.includes(nTarget)) ||
                       (pClean.length >= 3 && cleanTarget.includes(pClean)) ||
                       (cleanTarget.length >= 3 && pClean.includes(cleanTarget));
            });
            if (partial) return partial.ten;

            return targetOrName;
        }

        // Ãnh xáº¡ tÃªn dá»‹ch vá»¥ HIS â†’ tÃªn thá»§ thuáº­t chuáº©n trong pháº§n má»m
        function mapHISToProcedure(hisServiceName) {
            if (!hisServiceName) return null;
            const clean = cleanHISLine(hisServiceName);
            if (!clean) return null;

            const procs = (window.dataCache && (window.dataCache.proc || window.dataCache.procedures)) || [];
            const cleanNorm = normalizeStr(clean);

            // Æ¯u tiÃªn 1: Khá»›p trá»±c tiáº¿p vá»›i danh má»¥c thá»§ thuáº­t Ä‘ang cÃ³ trong pháº§n má»m (dataCache.proc)
            if (procs.length > 0) {
                const direct = procs.find(p => normalizeStr(p.ten) === cleanNorm || (p.vietTat && normalizeStr(p.vietTat) === cleanNorm));
                if (direct) return direct.ten;

                const canonical = getCanonicalProcedureName(clean);
                if (canonical && procs.some(p => p.ten === canonical)) return canonical;
            }

            // Æ¯u tiÃªn 2: Khá»›p qua báº£ng tá»« khÃ³a HIS_MAPPING
            const normalized = ' ' + normalizeStrNoTrim(clean) + ' ';
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
                        return getCanonicalProcedureName(mapping.target) || mapping.target;
                    }
                }
            }

            return null; // KhÃ´ng nháº­n diá»‡n Ä‘Æ°á»£c
        }

        // So khá»›p thá»§ thuáº­t thÃ´ng minh cho Tab Thá»© 7
        function matchProcedureInTab7(itemProcName, hisProcName) {
            if (!itemProcName || !hisProcName) return false;
            return matchProc(itemProcName, hisProcName);
        }

        window.mapHISToProcedure = mapHISToProcedure;
        window.cleanHISLine = cleanHISLine;
        window.extractProceduresFromHISCell = extractProceduresFromHISCell;
        window.getCanonicalProcedureName = getCanonicalProcedureName;
        window.matchProcedureInTab7 = matchProcedureInTab7;

        function nhapDsSat() {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.xlsx, .xls';
            input.onchange = e => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                    const roa = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

                    const decodeFn = (typeof window !== 'undefined' && typeof window.decodeVietnameseEncoding === 'function')
                        ? window.decodeVietnameseEncoding
                        : (s => String(s || '').normalize('NFC').trim());
                    const properFn = (typeof window !== 'undefined' && typeof window.toVietnameseProperCase === 'function')
                        ? window.toVietnameseProperCase
                        : (s => String(s || '').toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase()));
                    const norm = s => decodeFn(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u0111\u0110]/g, 'd').replace(/Ä‘/g, 'd').trim();
                    const healFn = (typeof window !== 'undefined' && typeof window.cleanAndHealPatientName === 'function')
                        ? window.cleanAndHealPatientName
                        : (typeof SchedulerEngine !== 'undefined' && typeof SchedulerEngine.cleanAndHealPatientName === 'function')
                            ? SchedulerEngine.cleanAndHealPatientName
                            : properFn;
                    const candNames = Object.values(satCache || {}).map(s => String(s?.info?.ten || '').trim()).filter(Boolean);
                    let isHIS = false;
                    let colTen = 6, colNamSinh = 7, colDichVu = 13, startRow = 1, colLoaiDieuTri = -1;

                    // Kiá»ƒm tra file HIS hay file T7 ná»™i bá»™
                    for (let i = 0; i < Math.min(15, roa.length); i++) {
                        const rowStr = roa[i].map(c => norm(c)).join('|');
                        if (rowStr.includes('ma truy xuat') && rowStr.includes('gio san sang')) {
                            isHIS = false;
                            startRow = i + 1;
                            break;
                        } else if (rowStr.includes('ho ten') || rowStr.includes('ten benh') || rowStr.includes('ten bn') || rowStr.includes('benh nhan') || rowStr.includes('fullname') || rowStr.includes('ho va ten')) {
                            isHIS = true;
                            startRow = i + 1;
                            roa[i].forEach((cell, idx) => {
                                const cn = norm(cell);
                                if (cn.includes('ho ten') || cn.includes('ten bn') || cn.includes('ten benh') || cn === 'ten_bn' || cn === 'hoten' || cn.includes('fullname') || cn.includes('ho va ten')) colTen = idx;
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
                            const rawTen = row[colTen];
                            const ten = healFn(rawTen, candNames, false);
                            const dichVu = decodeFn(row[colDichVu]);

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

                            const properTen = ten;
                            if (!hisMap[properTen]) hisMap[properTen] = new Set();
                            if (loaiBn) hisLoaiMap[properTen] = loaiBn;

                            // TÃ¡ch nhiá»u thá»§ thuáº­t trong 1 Ã´ y lá»‡nh HIS
                            const items = extractProceduresFromHISCell(dichVu);
                            items.forEach(line => {
                                const mapped = mapHISToProcedure(line);
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
                                const match = available.find(x => matchProcedureInTab7(x.name, tt));
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
                            let targetBid = (bid && satCache[bid]) ? bid : Object.keys(satCache).find(k => satCache[k].info.ten.trim().toLowerCase() === ten || norm(satCache[k].info.ten) === norm(ten));
                            if (!targetBid) return;

                            const available = satCache[targetBid].items.map((item, idx) => ({ ...item, idx })).filter(x => !x.checked);

                            row[2].split(',').map(x => x.trim()).forEach(tt => {
                                const match = available.find(x => matchProcedureInTab7(x.name, tt));
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
                    alert(`ÄÃ£ náº¡p thÃ nh cÃ´ng ${count} thá»§ thuáº­t ${isHIS ? 'tá»« file HIS' : 'tá»« file Excel Thá»© 7'}!`);
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
                if (shifts.length === 0) {
                    shifts.push(["07:30", "12:00"], ["13:00", "16:30"]);
                }

                staff_shifts_dict[ten] = shifts;

            }

            const final_pats = [];

            for (const bid in satCache) {

                const chosen = satCache[bid].items.filter(item => item.checked).map(item => item.name);

                if (!chosen.length) continue;

                const r = satCache[bid].info;

                const readyInput = document.querySelector(`#${satCache[bid].frameId} .input-ready-time`);



                // ðŸ”¥ ÄÃ£ sá»­a: GÃ¡n giá» sáºµn sÃ ng vÃ o biáº¿n gioVao Ä‘á»ƒ thuáº­t toÃ¡n Code.gs Ä‘á»c Ä‘Æ°á»£c

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

            btn.innerText = 'â³ ÄANG Xáº¾P...'; btn.disabled = true;

            const startTime = performance.now();
            setTimeout(() => {
                try {
                    const res = window.SchedulerEngine.runSaturdayScheduling(payload, dateVal);
                    const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
                    btn.innerText = 'â–¶ Xáº¾P Lá»ŠCH THá»¨ 7'; btn.disabled = false;

                    const sched = (res && (Array.isArray(res.sched) ? res.sched : (Array.isArray(res.schedule) ? res.schedule : []))) || [];
                    let rot = [];
                    if (res) {
                        if (Array.isArray(res.dropped)) rot = res.dropped;
                        else if (Array.isArray(res.unscheduled)) rot = res.unscheduled;
                        else if (Array.isArray(res.rot)) rot = res.rot;
                        else if (res.rot && typeof res.rot === 'object') {
                            rot = Array.isArray(res.rot.rot) ? res.rot.rot : (Array.isArray(res.rot.dropped) ? res.rot.dropped : [res.rot]);
                        }
                    }

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
                    
                    // Äá»“ng bá»™ ngay vÃ o offline cache Ä‘á»ƒ F5 khÃ´ng bá»‹ máº¥t dá»¯ liá»‡u
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
                        resEl.innerHTML = `<div class="alert alert-success" style="margin-top:10px">Xáº¿p thÃ nh cÃ´ng: <b>${window.currentScheduleData.length}</b> ca. Rá»›t: <b>${window.lastUnscheduledData.length}</b> ca. <span style="color:#555; font-size:13px;">(â± <b>${timeTaken} giÃ¢y</b>)</span></div>`;
                    }

                    filterSchedule(); 
                    if (typeof renderStats === 'function') renderStats(window.lastUnscheduledData);
                    if (typeof renderPatientsTable === 'function') renderPatientsTable();
                    if (typeof loadDashboard === 'function') loadDashboard();

                    // Äá»“ng bá»™ lÆ°u lá»‹ch trÃ¬nh thá»© 7 vÃ o D1 SQLite trong ná»n
                    if (sched.length > 0) {
                        const backendSched = sched.map(x => scheduleRowToBackendArray(x, dateVal));
                        callApi('saveSchedule', [dateVal, backendSched], null, null);
                    }
                } catch(err) {
                    btn.innerText = 'â–¶ Xáº¾P Lá»ŠCH THá»¨ 7'; btn.disabled = false;
                    alert("Lá»—i: " + err.message);
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

        // ðŸ“¤ XUáº¤T / NHáº¬P Bá»†NH NHÃ‚N

        // ============================================================

        function exportPatients() {

            if (!dataCache.pat.length) return alert("KhÃ´ng cÃ³ dá»¯ liá»‡u bá»‡nh nhÃ¢n Ä‘á»ƒ xuáº¥t!");

            const ws_data = [["STT", "TÃªn BN", "NÄƒm Sinh", "NgÃ y VÃ o", "Giá» VÃ o", "Giá» Báº­n", "Giá» Ra", "PhÃ²ng", "Thá»§ Thuáº­t"],

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
                        if (onSuccess) onSuccess({ message: "Danh sÃ¡ch trá»‘ng" });
                        return;
                    }

                    let current = 0;
                    function saveNext() {
                        if (current >= total) {
                            if (onSuccess) onSuccess({ message: `ÄÃ£ lÆ°u thÃ nh cÃ´ng ${total} bá»‡nh nhÃ¢n!` });
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
                                console.warn(`[Lá»—i lÆ°u BN ${p.ten}]:`, subErr);
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
                            .replace(/Ä‘/g, 'd')
                            .replace(/Ä/g, 'd')
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '');
                        const cleanNS = String(ns || '').trim();
                        return cleanTen + '|' + cleanNS;
                    }

                    const decodeFn = (typeof window !== 'undefined' && typeof window.decodeVietnameseEncoding === 'function')
                        ? window.decodeVietnameseEncoding
                        : (s => String(s || '').normalize('NFC').trim());
                    const properFn = (typeof window !== 'undefined' && typeof window.toVietnameseProperCase === 'function')
                        ? window.toVietnameseProperCase
                        : (s => String(s || '').toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase()));

                    const candNames = [];
                    const existingPats = (dataCache && dataCache.pat) ? dataCache.pat : [];
                    existingPats.forEach(p => {
                        const n = String(p?.ten || p?.name || '').normalize('NFC').trim();
                        if (n && !n.includes('\ufffd') && !candNames.includes(n)) candNames.push(n);
                    });
                    const rawCurrent = window.currentScheduleData || (typeof dataCache !== 'undefined' && dataCache.schedule) || [];
                    (Array.isArray(rawCurrent) ? rawCurrent : []).forEach(r => {
                        const n = String(r?.tenBN || r?.HOTEN || '').normalize('NFC').trim();
                        if (n && !n.includes('\ufffd') && !candNames.includes(n)) candNames.push(n);
                    });

                    const healFn = (typeof window !== 'undefined' && typeof window.cleanAndHealPatientName === 'function')
                        ? window.cleanAndHealPatientName
                        : (typeof SchedulerEngine !== 'undefined' && typeof SchedulerEngine.cleanAndHealPatientName === 'function')
                            ? SchedulerEngine.cleanAndHealPatientName
                            : properFn;

                    const activeRooms = (dataCache && Array.isArray(dataCache.room)) ? dataCache.room : [];
                    const validRoomNames = activeRooms.map(r => String(r.tenPhong || r.ten || (Array.isArray(r) ? r[1] : '') || '').trim()).filter(Boolean);
                    const defaultFallbackRoom = validRoomNames.length > 0 ? validRoomNames[0] : 'PhÃ²ng 1';

                    const existingMap = {};
                    existingPats.forEach(p => {
                        const k = buildMatchKeyLocal(p.ten, p.namSinh);
                        existingMap[k] = p;
                    });

                    const patientList = rows.slice(1).filter(r => r[1]).map(r => {
                        const rawT = decodeFn(r[1]);
                        const ten = (rawT.includes('\ufffd') || rawT.includes('?')) ? healFn(rawT, [], false) : properFn(rawT);
                        const namSinh = decodeFn(r[2]);
                        const key = buildMatchKeyLocal(ten, namSinh);
                        const existing = existingMap[key];
                        const phongVal = decodeFn(r[7]).trim();
                        return {
                            ten: ten,
                            namSinh: namSinh,
                            ngayVao: decodeFn(r[3]),
                            gioVao: decodeFn(r[4]),
                            gioBan: decodeFn(r[5]),
                            gioRa: decodeFn(r[6]),
                            phong: phongVal || (existing ? (existing.phong || existing.room || '') : defaultFallbackRoom),
                            thuThuat: decodeFn(r[8]),
                            loai_bn: r[9] ? decodeFn(r[9]) : (existing ? (existing.loai_bn || existing.loaiBN || 'NoiTru') : 'NoiTru'),
                            buoi_dieu_tri: r[10] ? decodeFn(r[10]) : (existing ? (existing.buoi_dieu_tri || existing.buoiDieuTri || 'TuDong') : 'TuDong'),
                            status: existing ? (existing.status || existing.trangThai || 'ChÆ°a xáº¿p') : 'ChÆ°a xáº¿p',
                            gender: existing ? (existing.gender || existing.gioiTinh || 'Nam') : 'Nam',
                            bed: existing ? (existing.bed || existing.giuong || '') : '',
                            order_idx: existing ? (existing.order_idx !== undefined ? Number(existing.order_idx) : 0) : 0
                        };
                    }).filter(p => p.ten);

                    const replaceAll = confirm("BÃ¡c sÄ© cÃ³ muá»‘n THAY THáº¾ TOÃ€N Bá»˜ danh sÃ¡ch hiá»‡n táº¡i khÃ´ng?\n\n- OK: XÃ³a sáº¡ch, náº¡p má»›i.\n- Cancel: Bá»• sung thÃªm.");

                    // ðŸ›¡ï¸ Há»£p nháº¥t thÃ´ng minh: Náº¿u bá»• sung thÃªm, cáº­p nháº­t bá»‡nh nhÃ¢n Ä‘Ã£ cÃ³ vÃ  thÃªm bá»‡nh nhÃ¢n má»›i
                    let finalImportList = patientList;
                    if (!replaceAll && existingPats.length > 0) {
                        const mergedMap = new Map();
                        existingPats.forEach(p => {
                            const k = buildMatchKeyLocal(p.ten, p.namSinh);
                            mergedMap.set(k, { ...p });
                        });
                        patientList.forEach(p => {
                            const k = buildMatchKeyLocal(p.ten, p.namSinh);
                            if (mergedMap.has(k)) {
                                const old = mergedMap.get(k);
                                mergedMap.set(k, { ...old, ...p, id: old.id });
                            } else {
                                mergedMap.set(k, p);
                            }
                        });
                        finalImportList = Array.from(mergedMap.values());
                    }

                    const btn = document.getElementById('btn-import-pat');
                    btn.innerText = "â³ Äang xá»­ lÃ½..."; btn.disabled = true;

                    savePatientsWithFallback(
                        finalImportList,
                        replaceAll,
                        res => {
                            const msg = typeof res === 'object' && res.message ? res.message : (typeof res === 'string' ? res : "Nháº­p dá»¯ liá»‡u thÃ nh cÃ´ng!");
                            showToast(msg, 'success', 5000);
                            btn.innerText = "â¬‡ï¸ Excel"; btn.disabled = false;
                            if (window.dataCacheTime) delete window.dataCacheTime['pat'];
                            loadEntity('getBenhNhan', 'pat', renderPatientsTable, [], true);
                        },
                        err => {
                            const msg = (err && typeof err === 'object') ? (err.message || err.error || JSON.stringify(err)) : String(err || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');
                            showToast('Lá»—i nháº­p Excel: ' + msg, 'error', 6000);
                            btn.innerText = "â¬‡ï¸ Excel"; btn.disabled = false;
                        },
                        (cur, tot) => {
                            btn.innerText = `â³ ${cur}/${tot}...`;
                        }
                    );
                };

                reader.readAsArrayBuffer(e.target.files[0]);

            };

            input.click();

        }



        // ============================================================
        // ðŸ¥ NHáº¬P Tá»ª HIS (Y Lá»†NH) - Äá»ŒC FILE EXCEL Cá»¦A Bá»†NH VIá»†N
        // Cá»™t G (index 6) = TÃªn BN, Cá»™t H (index 7) = NÄƒm sinh, Cá»™t N (index 13) = Dá»‹ch vá»¥
        // Báº¯t Ä‘áº§u tá»« dÃ²ng 11 (index 10)
        // (Bá»™ tá»« Ä‘iá»ƒn HIS_MAPPING & hÃ m mapHISToProcedure Ä‘Ã£ khai bÃ¡o á»Ÿ trÃªn)
        // ============================================================

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

                        if (!rows.length) return showCustomAlert('File trá»‘ng', 'File Excel khÃ´ng cÃ³ dá»¯ liá»‡u!', 'âŒ', '#e74c3c');

                        // --- BÆ°á»›c 1: Tá»± Ä‘á»™ng dÃ² hÃ ng tiÃªu Ä‘á» vÃ  cá»™t ---
                        let colTen = 6, colNamSinh = 7, colDichVu = 13, startRow = 10, colLoaiDieuTri = -1, colPhong = -1;
                        const decodeFn = (typeof window !== 'undefined' && typeof window.decodeVietnameseEncoding === 'function')
                            ? window.decodeVietnameseEncoding
                            : (s => String(s || '').normalize('NFC').trim());
                        const properFn = (typeof window !== 'undefined' && typeof window.toVietnameseProperCase === 'function')
                            ? window.toVietnameseProperCase
                            : (s => String(s || '').toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase()));
                        const norm = s => decodeFn(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u0111\u0110]/g, 'd').replace(/Ä‘/g, 'd').trim();

                        // ðŸ›¡ï¸ Thu tháº­p danh sÃ¡ch há» tÃªn bá»‡nh nhÃ¢n sáº¡ch hiá»‡n cÃ³ Ä‘á»ƒ lÃ m á»©ng viÃªn Ä‘á»‘i chiáº¿u chá»¯a lÃ nh
                        const candNames = [];
                        const existingPats = (dataCache && dataCache.pat) ? dataCache.pat : [];
                        existingPats.forEach(p => {
                            const n = String(p?.ten || p?.name || '').normalize('NFC').trim();
                            if (n && !n.includes('\ufffd') && !candNames.includes(n)) candNames.push(n);
                        });
                        const rawCurrent = window.currentScheduleData || (typeof dataCache !== 'undefined' && dataCache.schedule) || [];
                        (Array.isArray(rawCurrent) ? rawCurrent : []).forEach(r => {
                            const n = String(r?.tenBN || r?.HOTEN || '').normalize('NFC').trim();
                            if (n && !n.includes('\ufffd') && !candNames.includes(n)) candNames.push(n);
                        });

                        const healFn = (typeof window !== 'undefined' && typeof window.cleanAndHealPatientName === 'function')
                            ? window.cleanAndHealPatientName
                            : (typeof SchedulerEngine !== 'undefined' && typeof SchedulerEngine.cleanAndHealPatientName === 'function')
                                ? SchedulerEngine.cleanAndHealPatientName
                                : properFn;

                        // QuÃ©t 15 hÃ ng Ä‘áº§u - khá»›p tiáº¿ng Viá»‡t láº«n mÃ£ HIS (TEN_BN, NAM_SINH, PHONG...)
                        for (let i = 0; i < Math.min(15, rows.length); i++) {
                            const rowStr = rows[i].map(c => norm(c)).join('|');
                            const isHeader = rowStr.includes('ho ten') || rowStr.includes('ten benh') ||
                                rowStr.includes('ten bn') || rowStr.includes('benh nhan') ||
                                rowStr.includes('ten_bn') || rowStr.includes('hoten') ||
                                rowStr.includes('fullname') || rowStr.includes('patient') || rowStr.includes('ho va ten');
                            if (isHeader) {
                                startRow = i + 1;
                                rows[i].forEach((cell, idx) => {
                                    const cn = norm(cell);
                                    if (cn.includes('ho ten') || cn.includes('ten bn') || cn.includes('ten benh') ||
                                        cn === 'ten_bn' || cn === 'hoten' || cn.includes('fullname') || cn.includes('ho va ten')) colTen = idx;
                                    else if (cn.includes('nam sinh') || cn.includes('sinh nam') || cn === 'ns' ||
                                        cn === 'nam_sinh' || cn === 'namsanh' || cn.includes('birth')) colNamSinh = idx;
                                    else if (cn.includes('dich vu') || cn.includes('thu thuat') || cn.includes('ten dvkt') ||
                                        cn === 'dichvu' || cn === 'dich_vu' || cn.includes('service') || cn.includes('procedure')) colDichVu = idx;
                                    else if (cn.includes('doi tuong') || cn.includes('loai dt') || cn.includes('loai dieu tri') ||
                                        cn.includes('hinh thuc') || cn.includes('noi/ngoai') || cn === 'loai_bn') colLoaiDieuTri = idx;
                                    // Bá» qua tuyá»‡t Ä‘á»‘i cá»™t D (idx 3) vÃ  cÃ¡c cá»™t Buá»“ng bá»‡nh ná»™i trÃº HIS
                                    else if (idx !== 3 && !cn.includes('buong') && !cn.includes('khoa') &&
                                        (cn === 'phong' || cn === 'ten_phong' || cn === 'phong_ban' || cn.includes('phong dieu tri') || cn.includes('phong thu thuat'))) colPhong = idx;
                                });
                                break;
                            }
                        }

                        // --- BÆ°á»›c 2: Äá»c danh sÃ¡ch dá»‹ch vá»¥ tá»« file HIS ---
                        const dataRows = rows.slice(startRow);
                        if (!dataRows.length) return showCustomAlert('KhÃ´ng cÃ³ dá»¯ liá»‡u', 'File khÃ´ng cÃ³ dá»¯ liá»‡u tá»« dÃ²ng ' + (startRow + 1) + ' trá»Ÿ Ä‘i!', 'âŒ', '#e74c3c');

                        // HÃ m sinh khÃ³a chuáº©n hÃ³a Ä‘á»ƒ so khá»›p bá»‡nh nhÃ¢n (bá» dáº¥u, viáº¿t thÆ°á»ng, bá» táº¥t cáº£ khoáº£ng tráº¯ng)
                        function buildMatchKey(ten, namSinh) {
                            const cleanTen = String(ten || '')
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .replace(/Ä‘/g, 'd')
                                .replace(/Ä/g, 'd')
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
                            const rawTen = decodeFn(row[colTen]);
                            // Giá»¯ nguyÃªn há» tÃªn thá»±c táº¿ tá»« file Excel, khÃ´ng Ä‘oÃ¡n mÃ² gÃ¡n nháº§m sang BN khÃ¡c
                            const ten = (rawTen.includes('\ufffd') || rawTen.includes('?')) ? healFn(rawTen, [], false) : properFn(rawTen);
                            const namSinh = decodeFn(row[colNamSinh]);
                            const dichVu = decodeFn(row[colDichVu]);
                            // Bá» qua cá»™t D (idx 3 - Buá»“ng bá»‡nh ná»™i trÃº HIS), máº·c Ä‘á»‹nh Ä‘á»ƒ phÃ²ng trá»‘ng
                            const rawPhong = (colPhong >= 0 && colPhong !== 3 && row[colPhong] !== undefined) ? decodeFn(row[colPhong]).trim() : '';

                            let loaiBn = 'NoiTru';
                            let buoiDieuTri = 'TuDong';
                            if (colLoaiDieuTri >= 0) {
                                const valLoai = norm(row[colLoaiDieuTri]);
                                if (valLoai.includes('ngoai tru') || valLoai.includes('kham benh') || valLoai.includes('ngoaitru') || valLoai.includes('kham')) {
                                    loaiBn = 'NgoaiTru';
                                }
                            }

                            // Bá» qua hÃ ng tiÃªu Ä‘á» lá»t vÃ o (TEN_BN, HO_TEN...)
                            const tenNorm = norm(ten);
                            if (!ten || tenNorm === 'ten_bn' || tenNorm === 'ho ten' || tenNorm === 'ten benh nhan' || tenNorm === 'hoten') return;
                            if (!dichVu) return;
                            totalRead++;

                            const key = buildMatchKey(ten, namSinh);
                            const properTen = ten;
                            if (!hisMap[key]) hisMap[key] = { ten: properTen, namSinh, loaiBn, buoiDieuTri, phong: rawPhong, procs: new Set() };
                            else if (rawPhong && !hisMap[key].phong) hisMap[key].phong = rawPhong;

                            // TÃ¡ch nhiá»u thá»§ thuáº­t trong 1 Ã´ y lá»‡nh HIS (há»— trá»£ \n, ;, 1. 2., +, -, pháº©y)
                            const items = extractProceduresFromHISCell(dichVu);
                            items.forEach(line => {
                                const mapped = mapHISToProcedure(line);
                                if (mapped) {
                                    hisMap[key].procs.add(mapped);
                                } else if (line) {
                                    unrecognized.add(line);
                                }
                            });
                        });

                        // --- BÆ°á»›c 3: Merge vá»›i danh sÃ¡ch bá»‡nh nhÃ¢n hiá»‡n táº¡i ---
                        // Bá»‡nh nhÃ¢n Ä‘Ã£ cÃ³ â†’ chá»‰ cáº­p nháº­t thuThuat, giá»¯ nguyÃªn ngayVao/phong/giá»
                        // Bá»‡nh nhÃ¢n má»›i  â†’ thÃªm má»›i vá»›i ngÃ y hÃ´m nay, máº·c Ä‘á»‹nh phÃ²ng trá»‘ng
                        const existingMap = {};
                        existingPats.forEach(p => {
                            const k = buildMatchKey(p.ten, p.namSinh);
                            existingMap[k] = p;
                        });

                        // Danh sÃ¡ch phÃ²ng thá»±c táº¿ tá»« cáº¥u hÃ¬nh
                        const activeRooms = (dataCache && Array.isArray(dataCache.room)) ? dataCache.room : [];
                        const validRoomNames = activeRooms.map(r => String(r.tenPhong || r.ten || (Array.isArray(r) ? r[1] : '') || '').trim()).filter(Boolean);

                        let updatedCount = 0, newCount = 0;
                        const mergedList = existingPats.map(p => {
                            const k = buildMatchKey(p.ten, p.namSinh);
                            if (hisMap[k]) {
                                updatedCount++;
                                return { 
                                    ...p, 
                                    thuThuat: [...hisMap[k].procs].join(', '),
                                    phong: p.phong || '',
                                    loai_bn: p.loai_bn || p.loaiBN || hisMap[k].loaiBn || 'NoiTru',
                                    buoi_dieu_tri: p.buoi_dieu_tri || p.buoiDieuTri || hisMap[k].buoiDieuTri || 'TuDong'
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
                                    phong: hisPat.phong || '',
                                    thuThuat: [...hisPat.procs].join(', '),
                                    loai_bn: hisPat.loaiBn || 'NoiTru',
                                    buoi_dieu_tri: hisPat.buoiDieuTri || 'TuDong'
                                });
                            }
                        });

                        // --- BÆ°á»›c 4: Popup xÃ¡c nháº­n ---
                        const totalHIS = Object.keys(hisMap).length;
                        let previewHTML = `<div style="font-size:13px;line-height:1.7;color:#2c3e50">`;
                        previewHTML += `<div style="background:#eaf6ff;border-radius:8px;padding:10px 14px;margin-bottom:10px;border-left:4px solid #3498db">`;
                        previewHTML += `<b>ðŸ“Œ ThÃ´ng tin Ä‘á»c file:</b><br>HÃ ng: <b>${startRow + 1}</b> | Cá»™t TÃªn: <b>${String.fromCharCode(65 + colTen)}</b> | Cá»™t NÄƒm: <b>${String.fromCharCode(65 + colNamSinh)}</b> | Cá»™t DV: <b>${String.fromCharCode(65 + colDichVu)}</b> | Cá»™t PhÃ²ng: <b>Trá»‘ng (máº·c Ä‘á»‹nh)</b></div>`;
                        previewHTML += `<div style="background:#eafaf1;border-radius:8px;padding:10px 14px;margin-bottom:10px;border-left:4px solid #27ae60">`;
                        previewHTML += `ðŸ“‹ HIS: <b>${totalHIS}</b> BN &nbsp;|&nbsp; ðŸ”„ Cáº­p nháº­t TT: <b>${updatedCount}</b> BN &nbsp;|&nbsp; âž• ThÃªm má»›i: <b>${newCount}</b> BN</div>`;

                        if (updatedCount > 0) {
                            previewHTML += `<b>ðŸ”„ BN Ä‘Ã£ cÃ³ (giá»¯ ngÃ y/phÃ²ng, cáº­p nháº­t thá»§ thuáº­t):</b><ul style="margin:4px 0 8px 16px;padding:0">`;
                            mergedList.filter(p => {
                                const k = buildMatchKey(p.ten, p.namSinh);
                                return !!hisMap[k];
                            }).slice(0, 4).forEach(p => {
                                previewHTML += `<li><b>${escapeHtml(p.ten)}</b> (${escapeHtml(p.namSinh)}): <span style="color:#8e44ad">${escapeHtml(p.thuThuat)}</span></li>`;
                            });
                            if (updatedCount > 4) previewHTML += `<li style="color:#7f8c8d">...vÃ  ${updatedCount - 4} BN khÃ¡c</li>`;
                            previewHTML += `</ul>`;
                        }
                        if (newCount > 0) {
                            previewHTML += `<b>âž• BN má»›i thÃªm vÃ o (PhÃ²ng Ä‘á»ƒ trá»‘ng):</b><ul style="margin:4px 0 8px 16px;padding:0">`;
                            mergedList.slice(-newCount).slice(0, 4).forEach(p => {
                                previewHTML += `<li><b>${escapeHtml(p.ten)}</b> (${escapeHtml(p.namSinh)}): <span style="color:#27ae60">${escapeHtml(p.thuThuat)}</span></li>`;
                            });
                            if (newCount > 4) previewHTML += `<li style="color:#7f8c8d">...vÃ  ${newCount - 4} BN khÃ¡c</li>`;
                            previewHTML += `</ul>`;
                        }
                        if (unrecognized.size > 0) {
                            previewHTML += `<div style="background:#fef9e7;border-radius:8px;padding:10px 14px;border-left:4px solid #f39c12">`;
                            previewHTML += `âš ï¸ <b>${unrecognized.size} dá»‹ch vá»¥ chÆ°a nháº­n diá»‡n:</b><ul style="margin:4px 0 0 16px;padding:0">`;
                            [...unrecognized].slice(0, 5).forEach(s => { previewHTML += `<li style="color:#c0392b">${escapeHtml(s)}</li>`; });
                            if (unrecognized.size > 5) previewHTML += `<li style="color:#7f8c8d">...vÃ  ${unrecognized.size - 5} dá»‹ch vá»¥ khÃ¡c</li>`;
                            previewHTML += `</ul></div>`;
                        }
                        previewHTML += `</div>`;

                        if (!totalHIS) return showCustomAlert('KhÃ´ng Ä‘á»c Ä‘Æ°á»£c dá»¯ liá»‡u', previewHTML, 'âŒ', '#e74c3c');

                        showCustomConfirm('ðŸ¥ XÃ¡c nháº­n nháº­p tá»« HIS', previewHTML, function () {
                            const btn = document.getElementById('btn-import-his');
                            btn.innerText = 'â³ Äang xá»­ lÃ½...'; btn.disabled = true;

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
                                status: String(p.status || p.trangThai || 'ChÆ°a xáº¿p').trim(),
                                gender: String(p.gender || p.gioiTinh || 'Nam').trim(),
                                bed: String(p.bed || p.giuong || '').trim(),
                                order_idx: p.order_idx !== undefined ? Number(p.order_idx) : 0
                            })).filter(p => p.ten);

                            savePatientsWithFallback(
                                cleanMergedList,
                                true,
                                res => {
                                    btn.innerText = 'ðŸ¥ HIS'; btn.disabled = false;
                                    showToast(`Nháº­p HIS thÃ nh cÃ´ng: cáº­p nháº­t ${updatedCount} BN, thÃªm má»›i ${newCount} BN`, 'success', 5000);
                                    if (window.dataCacheTime) delete window.dataCacheTime['pat'];

                                    loadEntity('getBenhNhan', 'pat', renderPatientsTable, [], true);
                                },
                                err => {
                                    const msg = (err && typeof err === 'object') ? (err.message || err.error || JSON.stringify(err)) : String(err || 'Lá»—i khÃ´ng xÃ¡c Ä‘á»‹nh');
                                    showToast('Lá»—i lÆ°u dá»¯ liá»‡u: ' + msg, 'error', 6000);
                                    btn.innerText = 'ðŸ¥ HIS'; btn.disabled = false;
                                },
                                (cur, tot) => {
                                    btn.innerText = `â³ ${cur}/${tot}...`;
                                }
                            );
                        });

                    } catch (err) {
                        showCustomAlert('Lá»—i Ä‘á»c file', 'âŒ ' + err.message, 'âŒ', '#e74c3c');
                    }
                };
                reader.readAsArrayBuffer(e.target.files[0]);
            };
            input.click();
        }

        // ============================================================


        // ============================================================

        // ðŸ” ÄÄ‚NG NHáº¬P / PHÃ‚N QUYá»€N

        function updateLogoutButton(username) {
            const container = document.getElementById('user-menu-container');
            const displayName = document.getElementById('user-display-name');
            if (container) container.style.display = 'flex';
            if (displayName) displayName.innerText = `ðŸ‘¤ ${username}`;
        }

        function doLogout() {
            if (typeof window.stopAutoSync === 'function') {
                try { window.stopAutoSync(); } catch(e) {}
            }

            // 0. Há»§y hÃ ng Ä‘á»£i API dá»Ÿ dang & táº¯t loading Ä‘á»ƒ trÃ¡nh request 401 sau khi Ä‘Äƒng xuáº¥t
            apiQueue = [];
            inFlightRequests.clear();
            activeApiRequests = 0;
            mutationCount = 0;
            if (window.hideGlobalLoading) window.hideGlobalLoading();
            const loginErr = document.getElementById('login-error');
            if (loginErr) {
                loginErr.innerText = '';
                loginErr.style.display = 'none';
            }

            // 1. QuÃ©t sáº¡ch táº¥t cáº£ key cá»§a phiÃªn & Ä‘Æ¡n vá»‹ trong localStorage, chá»‰ giá»¯ láº¡i cáº¥u hÃ¬nh giao diá»‡n & backup URL
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

            // 2. XÃ³a sáº¡ch dá»¯ liá»‡u trong RAM
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

            // 3. XÃ³a sáº¡ch cÃ¡c báº£ng dá»¯ liá»‡u trÃªn DOM ngay láº­p tá»©c
            if (typeof clearAllDomTables === 'function') {
                clearAllDomTables(false);
            }

            // 4. Reload trang vá» URL gá»‘c Ä‘á»ƒ Ä‘áº£m báº£o 100% khÃ´ng cÃ²n biáº¿n / bá»™ nhá»› / closure rÃ² rá»‰ giá»¯a 2 Ä‘Æ¡n vá»‹
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
                // ðŸ‘‘ SUPER ADMIN:
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
                if (btnAi) btnAi.style.display = 'none';

                if (typeof window.updateAppHeader === 'function') {
                    window.updateAppHeader('MASTER', 'SUPER_ADMIN');
                }
                return;
            }

            // ðŸ¢ HOSPITAL ADMIN / REGULAR USERS:
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

        // QUáº¢N LÃ TÃ€I KHOáº¢N (TÆ¯Æ NG THÃCH Máº¬T KHáº¨U MÃƒ HÃ“A)

        // ============================================================

        function loadAccounts() {

            callApi('getAccounts', [], data => {
                const list = Array.isArray(data) ? data : [];
                adminAccCache = list;

                const tbody = document.getElementById('acc-list');
                if (!tbody) return;

                if (list.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" align="center" style="color:gray; padding:20px;">ChÆ°a cÃ³ tÃ i khoáº£n nÃ o trong há»‡ thá»‘ng</td></tr>';
                    return;
                }

                const PERM_MAP = { 'tab-patients': 'ðŸ›Œ Bá»‡nh NhÃ¢n', 'tab-schedule': 'âš¡ Xáº¿p Lá»‹ch', 'tab-sat': 'ðŸ“… Thá»© 7', 'tab-busy': 'â± Giá» Báº­n', 'tab-stats': 'ðŸ“Š Thá»‘ng KÃª', 'tab-utils': 'ðŸ›  Tiá»‡n Ãch', 'tab-kiemtra': 'âœ… Kiá»ƒm Tra Lá»—i', 'tab-machines': 'âš™ï¸ MÃ¡y MÃ³c', 'tab-procedures': 'ðŸ’‰ Thá»§ Thuáº­t', 'tab-rooms': 'ðŸ¥ PhÃ²ng', 'tab-staff': 'ðŸ‘¨â€âš•ï¸ NhÃ¢n Sá»±', 'tab-chamcong': 'â±ï¸ Cháº¥m CÃ´ng', 'tab-thongke': 'ðŸ“ˆ Thá»‘ng KÃª' }; 
                
                tbody.innerHTML = list.map((acc, i) => {
                    const uName = acc.user || acc.username || '';
                    const rRole = (acc.role && String(acc.role).toLowerCase() === 'admin') ? 'Admin' : 'User';
                    const pPerms = acc.perms || acc.permissions || 'ALL';

                    let tenQuyen = "ðŸ‘‘ ToÃ n quyá»n (Admin)";
                    if (rRole !== 'Admin' && pPerms !== 'ALL') {
                        tenQuyen = pPerms.split(',').map(p => PERM_MAP[p.trim()] || p.trim()).join(', ');
                    }

                    return `<tr class="editable-row" onclick="editAccount(${i})" title="Báº¥m Ä‘á»ƒ sá»­a tÃ i khoáº£n">
                                    <td align="center">${acc.id || (i + 1)}</td>
                                    <td style="font-size:14px; color:#2c3e50;"><strong>${escapeHtml(uName)}</strong></td>
                                    <td align="center">${acc.hasPassword !== false ? '<span style="color:#27ae60; font-weight:600; font-size:12px;">ðŸ”’ ÄÃ£ báº£o máº­t</span>' : '<span style="color:#e74c3c; font-weight:bold; font-size:12px;">âš ï¸ ChÆ°a cÃ³ MK</span>'}</td>
                                    <td align="center"><span style="color:${rRole === 'Admin' ? '#c0392b' : '#2980b9'}; font-weight:bold; background:${rRole === 'Admin' ? '#fadbd8' : '#d6eaf8'}; padding:4px 8px; border-radius:5px;">${rRole}</span></td>
                                    <td style="font-size:12px; line-height:1.6; color:#27ae60; font-weight:500;">${tenQuyen}</td>
                                    <td align="center"><button class="btn-danger" style="border-radius:5px; padding:4px 10px; font-weight:bold; cursor:pointer;" onclick="event.stopPropagation(); deleteAccount('${acc.id || ''}', '${escapeHtml(uName)}')">ðŸ—‘ï¸ XÃ³a</button></td>
                                </tr>`;
                }).join('');

            }, err => {
                console.error('[loadAccounts] Lá»—i táº£i tÃ i khoáº£n:', err);
            });

        }



        function editAccount(i) {
            const acc = adminAccCache[i];
            if (!acc) return;

            document.getElementById('acc-id').value = acc.id || '';
            document.getElementById('acc-user').value = acc.user || acc.username || '';

            const passInput = document.getElementById('acc-pass');
            passInput.value = '';
            passInput.placeholder = "(Äá»ƒ trá»‘ng náº¿u khÃ´ng Ä‘á»•i MK)";

            const rRole = (acc.role && String(acc.role).toLowerCase() === 'admin') ? 'Admin' : 'User';
            document.getElementById('acc-role').value = rRole;
            togglePermissionsBox();

            const pPerms = acc.perms || acc.permissions || '';
            document.querySelectorAll('.perm-cb').forEach(cb => {
                cb.checked = rRole === 'User' && pPerms ? pPerms.split(',').map(s => s.trim()).includes(cb.value) : false;
            });

            document.getElementById('btn-save-acc').innerText = "Cáº­p nháº­t MK / Quyá»n";
        }



        function luuTaiKhoan() {

            const id = document.getElementById('acc-id').value;

            const user = document.getElementById('acc-user').value;

            const pass = document.getElementById('acc-pass').value;

            const role = document.getElementById('acc-role').value;



            if (!user) return showCustomAlert("LÆ°u Ã½", "Vui lÃ²ng nháº­p tÃªn tÃ i khoáº£n!");

            // Chá»‰ báº¯t buá»™c nháº­p máº­t kháº©u náº¿u lÃ  tÃ i khoáº£n táº¡o má»›i (khÃ´ng cÃ³ ID)

            if (!id && !pass) return showCustomAlert("LÆ°u Ã½", "Vui lÃ²ng nháº­p máº­t kháº©u cho tÃ i khoáº£n má»›i!");



            const perms = role === 'User' ?

                Array.from(document.querySelectorAll('.perm-cb:checked')).map(cb => cb.value).join(', ')

                : 'ALL';

            const btn = document.getElementById('btn-save-acc');

            btn.innerText = "Äang lÆ°u..."; btn.disabled = true;

            callApi('saveAccount', [id, user, pass, role, perms], msg => {
                showCustomAlert("ThÃ nh cÃ´ng", typeof msg === 'string' ? msg : "ÄÃ£ lÆ°u tÃ i khoáº£n thÃ nh cÃ´ng!");
                huySuaTaiKhoan();
                loadAccounts();
                btn.innerText = "LÆ°u TÃ i Khoáº£n";
                btn.disabled = false;
            }, err => {
                showCustomAlert("Lá»—i", "KhÃ´ng thá»ƒ lÆ°u tÃ i khoáº£n: " + (typeof err === 'string' ? err : JSON.stringify(err)));
                btn.innerText = "LÆ°u TÃ i Khoáº£n";
                btn.disabled = false;
            });

        }



        function huySuaTaiKhoan() {

            ['acc-id', 'acc-user', 'acc-pass'].forEach(id => {
                const el = document.getElementById(id);

                if (el) el.value = '';
            });

            document.getElementById('acc-pass').placeholder = "Nháº­p máº­t kháº©u...";

            document.getElementById('acc-role').value = 'User';

            document.querySelectorAll('.perm-cb').forEach(cb => cb.checked = false);

            togglePermissionsBox();

            document.getElementById('btn-save-acc').innerText = "LÆ°u TÃ i Khoáº£n";

        }

        function deleteAccount(id, user) {

            if (user.toLowerCase() === 'admin') return showCustomAlert("Cáº£nh bÃ¡o báº£o máº­t", "KhÃ´ng Ä‘Æ°á»£c phÃ©p xÃ³a tÃ i khoáº£n Admin gá»‘c!");

            showCustomConfirm("XÃ³a tÃ i khoáº£n", `BÃ¡c sÄ© cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a vÄ©nh viá»…n tÃ i khoáº£n [ ${user} ] khÃ´ng?`, function () {
                callApi('deleteAccount', [id], () => {
                    loadAccounts();
                    showCustomAlert("ThÃ nh cÃ´ng", `ÄÃ£ xÃ³a tÃ i khoáº£n "${user}" thÃ nh cÃ´ng!`);
                }, err => {
                    showCustomAlert("Lá»—i", "KhÃ´ng thá»ƒ xÃ³a tÃ i khoáº£n: " + (typeof err === 'string' ? err : JSON.stringify(err)));
                });
            });

        }



        // ============================================================

        // ðŸ”„ AUTO SYNC

        // ============================================================

        function syncPatients() { loadEntity('getBenhNhan', 'pat', renderPatientsTable, [], true); }

        function syncStaff() {
            loadEntity('getNhanSu', 'staff', renderStaffTable, [
                () => { if (typeof renderBusyStaff === 'function') renderBusyStaff(); },
                () => { if (typeof locSotSat === 'function') locSotSat(); }
            ], true);
        }

        function isPatientFormActive() {
            if (typeof editIndex !== 'undefined' && editIndex.pat > -1) return true;
            if (window._savePatientLock) return true;

            const activeEl = document.activeElement;
            const tabPat = document.getElementById('tab-patients');
            if (!tabPat) return false;

            // 1. Kiá»ƒm tra náº¿u tiÃªu Ä‘iá»ƒm (focus) náº±m trong form cá»§a tab-patients
            if (activeEl && tabPat.contains(activeEl) &&
                (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
                return true;
            }

            // 2. Kiá»ƒm tra náº¿u cÃ¡c Ã´ nháº­p liá»‡u cÃ³ chá»©a dá»¯ liá»‡u dá»Ÿ dang
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

            // Kiá»ƒm tra xem cÃ³ thá»§ thuáº­t nÃ o Ä‘ang Ä‘Æ°á»£c chá»n khÃ´ng
            const checkedProcs = document.querySelectorAll('.pat-proc-cb:checked');
            if (checkedProcs.length > 0) return true;

            return false;
        }
        window.isPatientFormActive = isPatientFormActive;

        function isBusyFormActive() {
            const activeEl = document.activeElement;
            const tabBusy = document.getElementById('tab-busy');
            if (!tabBusy) return false;

            // 1. Kiá»ƒm tra náº¿u tiÃªu Ä‘iá»ƒm (focus) náº±m trong form cá»§a tab-busy
            if (activeEl && tabBusy.contains(activeEl) &&
                (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
                return true;
            }

            // 2. Kiá»ƒm tra náº¿u cÃ¡c Ã´ nháº­p liá»‡u cá»§a tab-busy cÃ³ chá»©a dá»¯ liá»‡u dá»Ÿ dang
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
        window.isBusyFormActive = isBusyFormActive;

        function isAnyFormActive() {
            if (isPatientFormActive()) return true;
            if (typeof isBusyFormActive === 'function' && isBusyFormActive()) return true;
            if (typeof editIndex !== 'undefined') {
                for (let k in editIndex) {
                    if (editIndex[k] > -1) return true;
                }
            }
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
                if (activeEl.id !== 'schedule-search-input' && activeEl.id !== 'pat-search-input') {
                    return true;
                }
            }
            return false;
        }
        window.isAnyFormActive = isAnyFormActive;

        function startAutoSync() {
            setInterval(() => {
                if (window.viewingImportedScheduleFile) return;
                const activeTab = document.querySelector('.nav-tab.active')?.getAttribute('data-tab');

                // Äá»“ng bá»™ Xáº¿p lá»‹ch
                if (activeTab === 'tab-schedule' || activeTab === 'tab-home') {
                    loadScheduleList();
                }

                // Äá»“ng bá»™ Bá»‡nh NhÃ¢n (Bá»‡nh nhÃ¢n vÃ  nhÃ¢n sá»± táº£i tá»± Ä‘á»™ng khi tab active)
                // Äá»“ng bá»™ Giá» Báº­n/Ra Viá»‡n (Bá»‡nh nhÃ¢n vÃ  nhÃ¢n sá»± táº£i tá»± Ä‘á»™ng khi tab active)
            }, 15000); // Tá»± Ä‘á»™ng cáº­p nháº­t lá»‹ch má»—i 15 giÃ¢y
        }



        window.onload = function () {
            const sessionStr = localStorage.getItem('meds_session');
            const token = localStorage.getItem('pm_jwt_token');

            if (sessionStr && token) {
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
        // UI - CHUYá»‚N TAB ADMIN
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
        // âš™ï¸ CÃ€I Äáº¶T Há»† THá»NG
        // ============================================================
        function normalizeTimeHHMM(str) {
            if (!str) return "16:20";
            let s = String(str).trim().toLowerCase().replace(/h/g, ':');
            s = s.replace(/[^0-9:]/g, '');
            const parts = s.split(':').filter(Boolean);
            if (parts.length === 0) return "16:20";
            let hh = parseInt(parts[0], 10) || 0;
            let mm = parts.length > 1 ? (parseInt(parts[1], 10) || 0) : 0;
            if (hh < 0) hh = 0; if (hh > 23) hh = 23;
            if (mm < 0) mm = 0; if (mm > 59) mm = 59;
            return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        }
        window.normalizeTimeHHMM = normalizeTimeHHMM;

        function luuCaiDatChotSo(btn, isAutoSave = false) {
            const timeEl = document.getElementById("admin-chotso-time");
            const yhctLunchEl = document.getElementById("admin-yhct-lunch");
            const yhctEndEl = document.getElementById("admin-yhct-end");
            const dropWEl = document.getElementById("admin-weight-drop");
            const overtimeWEl = document.getElementById("admin-weight-overtime");
            const imbalanceWEl = document.getElementById("admin-weight-imbalance");

            const rawTimeVal = (timeEl && timeEl.value ? timeEl.value.trim() : "16:20");
            const timeVal = normalizeTimeHHMM(rawTimeVal);
            if (timeEl) timeEl.value = timeVal;

            const yhctLunchVal = (yhctLunchEl && yhctLunchEl.value !== undefined && yhctLunchEl.value !== "") ? yhctLunchEl.value.trim() : "5";
            const yhctEndVal = (yhctEndEl && yhctEndEl.value !== undefined && yhctEndEl.value !== "") ? yhctEndEl.value.trim() : "5";
            const dropW = (dropWEl && dropWEl.value !== undefined && dropWEl.value !== "") ? dropWEl.value.trim() : "10000";
            const overtimeW = (overtimeWEl && overtimeWEl.value !== undefined && overtimeWEl.value !== "") ? overtimeWEl.value.trim() : "2";
            const imbalanceW = (imbalanceWEl && imbalanceWEl.value !== undefined && imbalanceWEl.value !== "") ? imbalanceWEl.value.trim() : "0.1";

            const newSettings = {
                chotSoTime: timeVal,
                yhctLunch: yhctLunchVal,
                yhctEnd: yhctEndVal,
                dropWeight: dropW,
                overtimeWeight: overtimeW,
                imbalanceWeight: imbalanceW
            };

            // 1. Cáº­p nháº­t ngay vÃ o RAM Cache Ä‘á»ƒ cÃ¡c giáº£i thuáº­t (CP Solver, Scheduler Engine) nháº­n giÃ¡ trá»‹ tá»©c thÃ¬
            if (typeof dataCache !== 'undefined') {
                dataCache.settings = Object.assign(dataCache.settings || {}, newSettings);
            }
            if (window.dataCache) {
                window.dataCache.settings = Object.assign(window.dataCache.settings || {}, newSettings);
            }

            // 2. Cáº­p nháº­t ngay vÃ o LocalStorage Offline Cache
            const cacheKey = window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache";
            try {
                const b = JSON.parse(localStorage.getItem(cacheKey) || '{}');
                b.settings = Object.assign(b.settings || {}, newSettings);
                localStorage.setItem(cacheKey, JSON.stringify(b));
            } catch(e) {}

            let oldText = "";
            if (btn && !isAutoSave) {
                oldText = btn.innerHTML;
                btn.innerHTML = "<span>â³</span> Äang lÆ°u...";
                btn.disabled = true;
            }

            // 3. LÆ°u trá»±c tiáº¿p vÃ o CSDL mÃ¡y chá»§ (MiniPC + Turso Cloud)
            google.script.run.withSuccessHandler(function (res) {
                if (btn && !isAutoSave) {
                    btn.innerHTML = oldText;
                    btn.disabled = false;
                    showCustomAlert("CÃ i Ä‘áº·t há»‡ thá»‘ng", "ÄÃ£ lÆ°u thÃ nh cÃ´ng cÃ i Ä‘áº·t thá»i gian váº­n hÃ nh vÃ  trá»ng sá»‘ thuáº­t toÃ¡n!", "âœ…", "#16a085");
                }
            }).withFailureHandler(function (err) {
                if (btn && !isAutoSave) {
                    btn.innerHTML = oldText;
                    btn.disabled = false;
                    alert("Lá»—i lÆ°u cÃ i Ä‘áº·t: " + err);
                }
            }).saveSystemSettings(newSettings);
        }
        window.luuCaiDatChotSo = luuCaiDatChotSo;

        function attachSystemSettingsAutoSave() {
            const inputIds = [
                "admin-chotso-time",
                "admin-yhct-lunch",
                "admin-yhct-end",
                "admin-weight-drop",
                "admin-weight-overtime",
                "admin-weight-imbalance"
            ];
            inputIds.forEach(id => {
                const el = document.getElementById(id);
                if (el && !el._hasAutoSaveBound) {
                    el._hasAutoSaveBound = true;
                    el.addEventListener('change', () => {
                        if (id === "admin-chotso-time") {
                            el.value = normalizeTimeHHMM(el.value);
                        }
                        luuCaiDatChotSo(null, true);
                    });
                    el.addEventListener('blur', () => {
                        if (id === "admin-chotso-time") {
                            el.value = normalizeTimeHHMM(el.value);
                        }
                        luuCaiDatChotSo(null, true);
                    });
                }
            });
        }
        window.attachSystemSettingsAutoSave = attachSystemSettingsAutoSave;

        function loadSystemSettings() {
            // 1. KhÃ´i phá»¥c tá»« Cache LocalStorage / RAM ngay láº­p tá»©c
            const cachedStr = localStorage.getItem(window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache");
            if (cachedStr) {
                try {
                    const b = JSON.parse(cachedStr);
                    if (b && b.settings) applySystemSettings(b.settings);
                } catch(e) {}
            } else if (window.dataCache && window.dataCache.settings) {
                applySystemSettings(window.dataCache.settings);
            }

            // 2. Äá»“ng thá»i gá»i API láº¥y báº£n má»›i nháº¥t tá»« Server CSDL (MiniPC + Turso)
            if (typeof callApi === 'function') {
                callApi('getSystemSettings', [], function(serverSettings) {
                    if (serverSettings && typeof serverSettings === 'object') {
                        if (typeof dataCache !== 'undefined') {
                            dataCache.settings = Object.assign(dataCache.settings || {}, serverSettings);
                        }
                        if (window.dataCache) {
                            window.dataCache.settings = Object.assign(window.dataCache.settings || {}, serverSettings);
                        }
                        const cKey = window.getBootstrapCacheKey ? window.getBootstrapCacheKey() : "times_bootstrap_cache";
                        try {
                            const b = JSON.parse(localStorage.getItem(cKey) || '{}');
                            b.settings = Object.assign(b.settings || {}, serverSettings);
                            localStorage.setItem(cKey, JSON.stringify(b));
                        } catch(e) {}
                        applySystemSettings(serverSettings);
                    }
                }, function(err) {
                    console.warn('[SystemSettings] KhÃ´ng thá»ƒ náº¡p cÃ i Ä‘áº·t tá»« mÃ¡y chá»§, dÃ¹ng báº£n cache cá»¥c bá»™:', err);
                });
            }

            // 3. Gáº¯n bá»™ tá»± Ä‘á»™ng lÆ°u onchange/onblur
            attachSystemSettingsAutoSave();
        }
        window.loadSystemSettings = loadSystemSettings;

        // ============================================================

        // ðŸ“¢ MARQUEE

        // ============================================================

        function luuDongChuChay(btn) {

            const noiDungMoi = document.getElementById('admin-marquee-input').value;

            if (!noiDungMoi) return alert("âš ï¸ Vui lÃ²ng nháº­p ná»™i dung thÃ´ng bÃ¡o trÆ°á»›c khi lÆ°u!");

            const textGoc = btn.innerText;

            btn.innerText = "â³ Äang lÆ°u..."; btn.disabled = true;

            const marqueeTag = document.getElementById('thong-bao-chay');

            if (marqueeTag) marqueeTag.innerText = noiDungMoi;

            google.script.run

                .withSuccessHandler(() => { btn.innerText = textGoc; btn.disabled = false; alert("âœ… ÄÃ£ lÆ°u thÃ´ng bÃ¡o má»›i thÃ nh cÃ´ng!"); })

                .withFailureHandler(err => { btn.innerText = textGoc; btn.disabled = false; alert("âŒ Lá»—i khi lÆ°u: " + err.message); })

                .luuThongBaoDongChuChay(noiDungMoi);

        }



        // ============================================================

        // ðŸ¤– KHO HUáº¤N LUYá»†N AI

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

            logHL("â³ Äang phÃ¢n tÃ­ch file: " + file.name);

            const reader = new FileReader();

            reader.onload = function (e) {

                try {

                    let workbook;

                    try { workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' }); }

                    catch (err) { throw new Error("Cáº¥u trÃºc file bá»‹ há»ng hoáº·c khÃ´ng Ä‘Ãºng chuáº©n."); }

                    if (!workbook?.SheetNames?.length) { logHL("âŒ Lá»–I Äá»ŠNH Dáº NG: File bá»‹ há»ng. HÃ£y má»Ÿ báº±ng Excel vÃ  Save As láº¡i nhÃ©."); event.target.value = ""; return; }



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

                                if ((rowString.includes('NHANVIEN') || rowString.includes('NHÃ‚N VIÃŠN')) &&

                                    (rowString.includes('GIODIENRA') || rowString.includes('Báº®T Äáº¦U'))) {
                                        headerRow = i;

                                    formatType = 'FLAT'; rowArr.forEach((cell, j) => {

                                        const v = String(cell || '').trim().toUpperCase().replace(/\r?\n|\r/g, '');

                                        if (v.includes('NHANVIEN') || v === 'HOTEN' || v.includes('NHÃ‚N VIÃŠN')) colIdx.nv = j;

                                        if (v.includes('DICHVU') || v.includes('THá»¦ THUáº¬T')) colIdx.tt = j;

                                        if (v.includes('GIODIENRA') || v.includes('Báº®T Äáº¦U')) colIdx.bd = j;

                                        if (v.includes('GIOKETTHUC') || v.includes('Káº¾T THÃšC')) colIdx.kt = j;

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

                        logHL(`ðŸš€ ÄÃ£ bÃ³c tÃ¡ch thÃ nh cÃ´ng ${records.length} ca (Dáº¡ng

                                                ${formatTypeUsed}). Äang lÆ°u...`);

                        google.script.run.withSuccessHandler(res => {
                            logHL("âœ… " + res);

                            loadHLData();
                        }).withFailureHandler(err => logHL("âŒ Lá»—i lÆ°u: " +

                            err.message)).saveAITrainingData(records);

                    } else logHL("âŒ KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u giá» giáº¥c há»£p lá»‡ trong báº¥t ká»³ Sheet nÃ o cá»§a file!");

                } catch (err) { logHL("âŒ Lá»—i ká»¹ thuáº­t: " + err.message); }

                event.target.value = "";

            };

            reader.readAsArrayBuffer(file);

        }

        function loadHLData() {

            const tbody = document.querySelector('#hl-table tbody');

            if (!tbody) return;

            tbody.innerHTML = `<tr> <td colspan="5" style="text-align:center;">â³ Äang táº£i dá»¯ liá»‡u...

                                                    </td>

                                                </tr>`; google.script.run.withSuccessHandler(data => {

                if (!data?.length) {
                    tbody.innerHTML = `<tr> <td colspan="5" style="text-align:center; color:gray">Kho dá»¯ liá»‡u

                                                        hiá»‡n Ä‘ang trá»‘ng.</td>

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

            if (!confirm("âš ï¸ BÃ¡c sÄ© cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a TOÃ€N Bá»˜ dá»¯ liá»‡u huáº¥n luyá»‡n AI? HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c!")) return;

            logHL("ðŸ—‘ Äang tiáº¿n hÃ nh xÃ³a kho dá»¯ liá»‡u...");

            google.script.run.withSuccessHandler(res => {
                logHL("âœ… " + res);

                loadHLData();
            }).clearAITrainingData();

        }

        function exportAIPrompt() {

            logHL("â³ Äang táº¡o SiÃªu lá»‡nh (Mega-Prompt)...");

            google.script.run.withSuccessHandler(data => {

                if (!data?.length) return alert("ChÆ°a cÃ³ dá»¯ liá»‡u huáº¥n luyá»‡n nÃ o!");

                let promptText = "Báº¡n lÃ  ChuyÃªn gia Khoa há»c Dá»¯ liá»‡u vÃ  Quáº£n lÃ½ Y táº¿.\n";

                promptText += "Nhiá»‡m vá»¥ cá»§a báº¡n lÃ  tá»‘i Æ°u hÃ³a thuáº­t toÃ¡n xáº¿p lá»‹ch thá»§ thuáº­t cho Khoa Y há»c Cá»• truyá»n - Phá»¥c há»“i Chá»©c nÄƒng.\n\n";

                promptText += "BÆ¯á»šC 1: PhÃ¢n tÃ­ch dá»¯ liá»‡u ca y lá»‡nh dÆ°á»›i Ä‘Ã¢y Ä‘á»ƒ tÃ¬m quy luáº­t (Nhá»‹p Ä‘iá»‡u, thá»i gian thá»±c táº¿, transition time...).\n";

                promptText += "BÆ¯á»šC 2: TÃ´i sáº½ cung cáº¥p code Javascript á»Ÿ tin nháº¯n tiáº¿p theo.\n";

                promptText += "BÆ¯á»šC 3: Viáº¿t láº¡i thuáº­t toÃ¡n xáº¿p lá»‹ch Ä‘á»ƒ cÃ¢n báº±ng táº£i.\n\n";

                promptText += "=== KHO Dá»® LIá»†U HUáº¤N LUYá»†N ===\n";

                promptText += "NgÃ y | File Nguá»“n | NhÃ¢n ViÃªn | Thá»§ Thuáº­t | PhÃºt Báº¯t Äáº§u | PhÃºt Káº¿t ThÃºc | Thá»±c Táº¿ (phÃºt) | Khoáº£ng CÃ¡ch 7h (phÃºt)\n";

                data.forEach(row => { promptText += `${row.join(' | ')}\n`; });

                const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });

                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');

                a.href = url; a.download = `Bo_Nao_AI_Xep_Lich_${new

                    Date().toLocaleDateString('vi-VN').replace(/\//g, '')}.txt`;

                document.body.appendChild(a); a.click(); document.body.removeChild(a);

                URL.revokeObjectURL(url);

                logHL("âœ… ÄÃ£ xuáº¥t file thÃ nh cÃ´ng!");

            }).getAITrainingData();

        }



        // ============================================================

        // ðŸ“… DATE FORMAT

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

        // ðŸ  DASHBOARD

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

                // TÃ­nh ngÃ y hÃ´m qua
                const yesterday = new Date(d);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

                if (activeYMD && activeYMD !== safeTodayStr) {
                    // Chá»‰ cáº£nh bÃ¡o náº¿u ngÃ y cÅ© lÃ  ngÃ y HÃ”M QUA (cáº§n chá»‘t sá»•)
                    // Náº¿u cÅ© hÆ¡n 1 ngÃ y â†’ Ä‘Ã³ lÃ  cache offline lá»—i thá»i, im láº·ng reset vá» hÃ´m nay
                    if (activeYMD === yesterdayStr) {
                        alert(`âš ï¸ Há»† THá»NG PHÃT HIá»†N:\nDá»¯ liá»‡u cá»§a ngÃ y ${activeDateStr} chÆ°a Ä‘Æ°á»£c chá»‘t sá»•!\nMáº·c Ä‘á»‹nh sáº½ hiá»ƒn thá»‹ dá»¯ liá»‡u cá»§a ngÃ y nÃ y Ä‘á»ƒ báº¡n tiáº¿p tá»¥c xá»­ lÃ½.`);
                        datePicker.value = activeYMD;
                    } else {
                        // Cache cÅ© (>1 ngÃ y), bá» qua vÃ  dÃ¹ng ngÃ y hÃ´m nay
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
                    return st === 'Äi lÃ m' && r !== 'Äiá»u dÆ°á»¡ng';
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
                        // Chá»‰ dÃ¹ng cache local Náº¾U cÃ³ savedUnit VÃ€ Ä‘Ãºng Ä‘Æ¡n vá»‹ hiá»‡n hÃ nh!
                        if (savedUnit && savedUnit === curUnit) {
                            const localSched = JSON.parse(localStorage.getItem(getUnitStorageKey('meds_success')) || localStorage.getItem('meds_success') || '[]');
                            if (Array.isArray(localSched) && localSched.length) {
                                // âœ… Kiá»ƒm tra ngÃ y cá»§a lá»‹ch cÅ© trÆ°á»›c khi dÃ¹ng
                                const savedDate = localStorage.getItem(getUnitStorageKey('meds_schedule_date')) || localStorage.getItem('meds_schedule_date') || '';
                                const nowVN2 = new Date(Date.now() + 7 * 60 * 60 * 1000);
                                const todayYMD2 = `${nowVN2.getUTCFullYear()}-${String(nowVN2.getUTCMonth() + 1).padStart(2, '0')}-${String(nowVN2.getUTCDate()).padStart(2, '0')}`;
                                const toYMD2 = (s) => {
                                    if (!s) return '';
                                    if (String(s).includes('/')) { const p = String(s).split('/'); return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`; }
                                    return String(s);
                                };
                                const rawDate2 = savedDate || (Array.isArray(localSched[0]) ? localSched[0][0] : (localSched[0]?.ngay || localSched[0]?.NGAY || localSched[0]?.date || ''));
                                const schedDate = toYMD2(rawDate2);
                                if (schedDate && schedDate === todayYMD2) {
                                    // Lá»‹ch Ä‘Ãºng ngÃ y hÃ´m nay â†’ dÃ¹ng bÃ¬nh thÆ°á»ng
                                    rawSched = localSched;
                                    if (typeof dataCache !== 'undefined') dataCache.schedule = localSched;
                                    if (window.dataCache) window.dataCache.schedule = localSched;
                                    window.currentScheduleData = (typeof markDischargedInSchedule === 'function') ? markDischargedInSchedule(localSched) : localSched;
                                } else {
                                    localStorage.removeItem(getUnitStorageKey('meds_success'));
                                    localStorage.removeItem(getUnitStorageKey('meds_schedule_date'));
                                    localStorage.removeItem(getUnitStorageKey('meds_unscheduled'));
                                    localStorage.removeItem('meds_success');
                                    localStorage.removeItem('meds_schedule_date');
                                    localStorage.removeItem('meds_unscheduled');
                                    localStorage.removeItem('meds_schedule_unit');
                                    rawSched = [];
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
                    return g && g !== '--' && !g.includes('Rá»›t');
                }).map(item => [
                    item.ngay || item.NGAY || item[0] || selectedDate,
                    item.tenBN || item.HOTEN || item[1] || '',
                    item.namSinh || item.NAMSINH || item[2] || '',
                    item.phong || item.PHONG || item[3] || '',
                    item.thuThuat || item.DICHVU || item[4] || '',
                    item.gioDienRa || item.GIODIENRA || item[5] || '',
                    item.gioKetThuc || item.GIOKETTHUC || item[6] || '',
                    item.nvChinh || item['NV CHÃNH'] || item[7] || '',
                    item.nvPhu || item['NV PHá»¤'] || item[8] || '',
                    item.may || item.MAY || item[9] || '',
                    item.giuong || item.GIUONG || item[10] || ''
                ]);

                const rotDataSheets = validData.filter(item => {
                    const g = String(item.gioDienRa || item.GIODIENRA || item[5] || '');
                    return g === '--' || g.includes('Rá»›t');
                }).map(item => [
                    item.ngay || item.NGAY || item[0] || selectedDate,
                    item.tenBN || item.HOTEN || item[1] || '',
                    item.namSinh || item.NAMSINH || item[2] || '',
                    item.phong || item.PHONG || item[3] || '',
                    item.thuThuat || item.DICHVU || item[4] || '',
                    'âŒ Rá»›t', '--', '--', '--', '--', '--', 'Thiáº¿u nhÃ¢n sá»±/MÃ¡y'
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
                                'âŒ Rá»›t', '--', '--', '--', '--', '--', u.reason || 'QuÃ¡ táº£i/Háº¿t giá»'
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
                // --- CHáº¾ Äá»˜ Lá»ŠCH Sá»¬ ---
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
                    const dayData = sched.filter(item => { const g = item.gioDienRa || ''; return g && g !== '--' && !g.includes('Rá»›t'); }).map(item => [item.ngay, item.tenBN, item.namSinh, item.phong, item.thuThuat, item.gioDienRa, item.gioKetThuc, item.nvChinh, item.nvPhu, item.may, item.giuong]);
                    const rotData = sched.filter(item => { const g = item.gioDienRa || ''; return g === '--' || g.includes('Rá»›t'); }).map(item => [item.ngay, item.tenBN, item.namSinh, item.phong, item.thuThuat, 'âŒ Rá»›t', '--', '--', '--', '--', '--', 'Thiáº¿u nhÃ¢n sá»±/MÃ¡y']);

                    if (statScheduledEl) statScheduledEl.textContent = dayData.length;
                    if (statDroppedEl) statDroppedEl.textContent = rotData.length;

                    if (typeof renderDashboardPreview === 'function') renderDashboardPreview([...dayData, ...rotData]);
                    if (typeof renderCharts === 'function') renderCharts(dayData);
                };

                if (window._historyCache && window._historyCache[selectedDate]) {
                    processHistoryData(window._historyCache[selectedDate]);
                    if (window.showToast) window.showToast("ÄÃ£ táº£i dá»¯ liá»‡u lá»‹ch sá»­ tá»« bá»™ nhá»›", "info", 2000);
                } else {
                    if (window.showGlobalLoading) window.showGlobalLoading("Äang táº£i dá»¯ liá»‡u lá»‹ch sá»­...");
                    google.script.run.withSuccessHandler(data => {
                        processHistoryData(data);
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        if (window.showToast) window.showToast("ÄÃ£ táº£i xong dá»¯ liá»‡u lá»‹ch sá»­!", "success");
                    }).withFailureHandler(err => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        console.error("Lá»—i táº£i lá»‹ch sá»­ Dashboard: " + err);
                        if (statScheduledEl) statScheduledEl.textContent = "0";
                        if (statDroppedEl) statDroppedEl.textContent = "0";
                        if (statBN) statBN.textContent = "0";
                        if (statStaff) statStaff.textContent = "0";
                        if (statTotalProcsEl) statTotalProcsEl.textContent = "0";
                        if (window.showToast) window.showToast("Lá»—i táº£i dá»¯ liá»‡u lá»‹ch sá»­: " + err, "error");
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
            const subTitle = `(ThÃ¡ng ${m}/${y})`;

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
                let rawEmps = null;
                if (typeof getOrLoadChamCongEmployees === 'function') {
                    try { rawEmps = getOrLoadChamCongEmployees(); } catch(e){}
                }
                if (Array.isArray(rawEmps) && rawEmps.length > 0) {
                    empList = rawEmps.map(e => typeof e === 'object' ? (e.ten || e.name) : e).filter(Boolean);
                } else if (typeof adminChamCongEmployees !== 'undefined' && Array.isArray(adminChamCongEmployees) && adminChamCongEmployees.length > 0) {
                    empList = adminChamCongEmployees.map(e => typeof e === 'object' ? (e.ten || e.name) : e).filter(Boolean);
                } else {
                    empList = Array.from(new Set([...Object.keys(cc), ...Object.keys(tt)])).filter(Boolean);
                }

                if (typeof cleanseAdminChamCongEmployees === 'function') {
                    empList = cleanseAdminChamCongEmployees(empList).map(e => typeof e === 'object' ? (e.ten || e.name) : e);
                } else {
                    empList = empList.filter(e => {
                        const s = String(e).trim();
                        return s && !/^(phá»¥|phu)\s*\d+/i.test(s);
                    });
                }

                // 1. Dá»¯ liá»‡u ngÃ y cÃ´ng
                const workdaysArr = empList.map(emp => {
                    let totalCong = 0;
                    const empRecord = cc[emp] || (typeof findStaffDataByKey === 'function' ? findStaffDataByKey(cc, emp) : null);
                    if (empRecord) {
                        for (let d = 1; d <= daysInMonth; d++) {
                            const raw = empRecord[d] || '';
                            if (typeof calcDayValue === 'function') totalCong += calcDayValue(raw);
                            else if (typeof window.calcDayValue === 'function') totalCong += window.calcDayValue(raw);
                            else if (raw === 'ca-ngay' || raw === 'X' || raw === 'x') totalCong += 1;
                            else if (raw === 'sang' || raw === 'chieu' || raw === 'S' || raw === 'C') totalCong += 0.5;
                        }
                        const heSo = empRecord.heSo !== undefined ? parseFloat(empRecord.heSo) : 1.0;
                        totalCong = Math.round((totalCong * heSo) * 100) / 100;
                    }
                    return { name: emp, val: totalCong };
                }).filter(x => x.val > 0).sort((a, b) => b.val - a.val);

                // 2. Dá»¯ liá»‡u thá»§ thuáº­t
                const procsArr = empList.map(emp => {
                    let totalTT = 0;
                    const empTT = tt[emp] || (typeof findStaffDataByKey === 'function' ? findStaffDataByKey(tt, emp) : null);
                    if (empTT) {
                        totalTT = (empTT.loai1 || 0) + (empTT.loai2 || 0) + (empTT.loai3 || 0) + (empTT.khac || 0);
                    }
                    return { name: emp, val: totalTT };
                }).filter(x => x.val > 0).sort((a, b) => b.val - a.val);

                const isDarkTheme = (document.documentElement.getAttribute('data-theme') === 'dark');
                const chartLabelColor = isDarkTheme ? '#cbd5e1' : '#334155';
                const chartSubColor = isDarkTheme ? '#94a3b8' : '#64748b';
                const chartGridColor = isDarkTheme ? '#334155' : '#f1f5f9';

                // Biá»ƒu Ä‘á»“ 1: NgÃ y cÃ´ng
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
                                label: 'NgÃ y cÃ´ng',
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
                                        label: (ctx) => ` NgÃ y cÃ´ng: ${String(ctx.raw).replace('.', ',')}`
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

                // Biá»ƒu Ä‘á»“ 2: Thá»§ thuáº­t
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
                                label: 'Thá»§ thuáº­t',
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
                                        label: (ctx) => ` Thá»§ thuáº­t: ${ctx.raw}`
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

                    // LuÃ´n Ä‘áº¿m thá»§ thuáº­t vÃ o YHCT/PHCN trÆ°á»›c (báº¥t ká»ƒ cÃ³ NV hay khÃ´ng)
                    // â†’ Ä‘áº£m báº£o tá»•ng "PhÃ¢n Bá»• Thá»§ Thuáº­t" = tá»•ng "Táº£i Trá»ng NhÃ¢n ViÃªn"
                    const cat = procCategoryMap[thuThuat.toLowerCase()] || 'PHCN';
                    if (cat === 'YHCT') procCountYHCT[thuThuat] = (procCountYHCT[thuThuat] || 0) + 1;
                    else procCountPHCN[thuThuat] = (procCountPHCN[thuThuat] || 0) + 1;

                    // Bá» qua cÃ¡c tÃªn slot áº£o cá»§a engine xáº¿p lá»‹ch (Phá»¥ 1, Phá»¥ 2, Phá»¥ 3, ChÃ­nh 1...)
                    // Ghi vÃ o nhÃ³m "(ChÆ°a phÃ¢n cÃ´ng)" Ä‘á»ƒ tá»•ng BS+KTV khá»›p vá»›i tá»•ng thá»§ thuáº­t
                    if (!nvChinh || /^(ph[uá»¥]|chinh|chÃ­nh)\s*\d*$/i.test(nvChinh)) {
                        staffLoadKTV['(ChÆ°a phÃ¢n cÃ´ng)'] = (staffLoadKTV['(ChÆ°a phÃ¢n cÃ´ng)'] || 0) + 1;
                        return;
                    }

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
                });
            } else {
                // Fallback: Khi chÆ°a xáº¿p lá»‹ch, tÃ­nh phÃ¢n bá»• thá»§ thuáº­t tá»« danh sÃ¡ch bá»‡nh nhÃ¢n hiá»‡n táº¡i (realtime)
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
                    el.innerHTML = '<div style="padding:20px;text-align:center;color:#bbb;font-size:0.78rem;">KhÃ´ng cÃ³ dá»¯ liá»‡u</div>';
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

        // â° Äá»’NG Há»’

        // ============================================================

        function updateClock() {

            const now = new Date();

            const days = ['Chá»§ Nháº­t', 'Thá»© Hai', 'Thá»© Ba', 'Thá»© TÆ°', 'Thá»© NÄƒm', 'Thá»© SÃ¡u', 'Thá»© Báº£y'];

            const pad = n => String(n).padStart(2, '0');

            document.getElementById('clock-time').textContent =

                `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            document.getElementById('clock-date').textContent =

                `${days[now.getDay()]},

                                                ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

        }

        updateClock(); setInterval(updateClock, 1000);



        // ============================================================

        // ðŸ’¬ POPUP XÃCNHáº¬N / Cáº¢NH BÃO

        // ============================================================

        let globalConfirmCallback = null;

        function showCustomConfirm(title, message, callback) {

            document.getElementById('confirm-title').innerText = title;

            document.getElementById('confirm-message').innerHTML = message;

            globalConfirmCallback = callback;

            document.getElementById('custom-confirm-modal').style.display = 'flex';

        }

        function showCustomAlert(title, message, icon = 'ðŸ’¡', btnColor = '#3498db') {

            const iconEl = document.getElementById('gca-icon');
            const titleEl = document.getElementById('gca-title');
            const msgEl = document.getElementById('gca-message');
            const btn = document.querySelector("#global-custom-alert button");

            // XÃ³a badge phá»¥ cÅ© náº¿u cÃ³
            const oldBadge = document.getElementById('gca-success-badge');
            if (oldBadge) oldBadge.remove();

            const isSucc = (btnColor === '#27ae60' || btnColor === '#2ecc71' || btnColor === '#00b894')
                || (typeof title === 'string' && title.toLowerCase().includes('thÃ nh cÃ´ng'))
                || (typeof message === 'string' && message.toLowerCase().includes('thÃ nh cÃ´ng') && !title.toLowerCase().includes('lá»—i'));

            if (isSucc) {
                if (iconEl) iconEl.innerText = 'âœ…';
                if (titleEl) {
                    titleEl.innerText = 'ThÃ nh cÃ´ng';
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
                    titleEl.style.color = '';
                    titleEl.style.fontWeight = 'bold';
                    titleEl.style.margin = '0 0 10px 0';
                }
                if (msgEl) {
                    msgEl.style.display = 'block';
                    msgEl.style.color = '';
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

                return; // Náº¿u popup thÃ nh cÃ´ng Ä‘ang má»Ÿ thÃ¬ chá»‰ Ä‘Ã³ng popup, khÃ´ng lÆ°u form

            }



            // âš ï¸ ÄÃƒ XÃ“A: Xá»­ lÃ½ Enter tá»± Ä‘á»™ng click nÃºt LÆ°u/ThÃªm Ä‘Æ°á»£c
            // xá»­ lÃ½ táº­p trung táº¡i listener á»Ÿ trÃªn (~dÃ²ng 7261)
            // Ä‘á»ƒ trÃ¡nh savePatient() bá»‹ gá»i 2 láº§n gÃ¢y trÃ¹ng dá»¯ liá»‡u.

        });




        function checkUnclosedDay() {
            if (window._forceHistoryMode || window.viewingImportedScheduleFile) {
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert("ðŸ“œ ÄANG á»ž CHáº¾ Äá»˜ XEM Lá»ŠCH Sá»¬",
                        "Báº¡n Ä‘ang xem dá»¯ liá»‡u lá»‹ch sá»­ cá»§a ngÃ y cÅ©.<br><br>CÃ¡c thao tÃ¡c chá»‰nh sá»­a, thÃªm má»›i hoáº·c xÃ³a bá»‹ khÃ³a Ä‘á»ƒ báº£o toÃ n dá»¯ liá»‡u gá»‘c.<br><br>Vui lÃ²ng báº¥m nÃºt <b>'Vá» HÃ´m Nay'</b> Ä‘á»ƒ quay vá» cháº¿ Ä‘á»™ lÃ m viá»‡c thá»i gian thá»±c.",
                        "â„¹ï¸", "#3b82f6");
                } else {
                    alert("ðŸ“œ Báº N ÄANG XEM Lá»ŠCH Sá»¬ NGÃ€Y CÅ¨\n\nKhÃ´ng thá»ƒ chá»‰nh sá»­a dá»¯ liá»‡u á»Ÿ cháº¿ Ä‘á»™ xem láº¡i. Vui lÃ²ng báº¥m 'Vá» HÃ´m Nay' Ä‘á»ƒ chá»‰nh sá»­a.");
                }
                return true;
            }

            const d = new Date();
            const safeTodayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (window._systemActiveYMD && window._systemActiveYMD < safeTodayStr) {
                const displayOldDate = window._systemActiveYMD.split('-').reverse().join('/');
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert("âš ï¸ CHÆ¯A CHá»T Sá»” NGÃ€Y CÅ¨",
                        "Há»‡ thá»‘ng phÃ¡t hiá»‡n dá»¯ liá»‡u ngÃ y cÅ© (<b>" + displayOldDate + "</b>) chÆ°a Ä‘Æ°á»£c chá»‘t sá»•!<br><br>" +
                        "Äá»ƒ trÃ¡nh máº¥t mÃ¡t vÃ  xung Ä‘á»™t dá»¯ liá»‡u, toÃ n bá»™ thao tÃ¡c chá»‰nh sá»­a bá»‡nh nhÃ¢n, giá» báº­n, vÃ  giá» ra viá»‡n Ä‘Ã£ bá»‹ khÃ³a.<br><br>" +
                        "Vui lÃ²ng thá»±c hiá»‡n <b>Chá»‘t sá»•</b> ngÃ y cÅ© trÆ°á»›c khi tiáº¿p tá»¥c thao tÃ¡c dá»¯ liá»‡u.",
                        "âš ï¸", "#e74c3c");
                } else {
                    alert("âš ï¸ CHÆ¯A CHá»T Sá»” NGÃ€Y CÅ¨\n\nHá»‡ thá»‘ng phÃ¡t hiá»‡n ngÃ y cÅ© (" + displayOldDate + ") chÆ°a Ä‘Æ°á»£c chá»‘t sá»•!\n\nVui lÃ²ng thá»±c hiá»‡n Chá»‘t sá»• trÆ°á»›c khi tiáº¿p tá»¥c.");
                }
                return true;
            }
            return false;
        }


        // Tá»I Æ¯U UX 2: Tá»± Ä‘á»™ng Ä‘á»‹nh dáº¡ng Giá» vÃ  NgÃ y khi gÃµ táº¯t (0830 -> 08:30)

        document.addEventListener('focusout', function (e) {

            if (e.target && e.target.tagName === 'INPUT') {

                const val = e.target.value.trim();

                if (!val) return;



                // Tá»± Ä‘á»™ng Ä‘á»‹nh dáº¡ng giá» (gÃµ 830 hoáº·c 0830 -> 08:30)

                if (e.target.id.includes('-time') || e.target.id.includes('-gio') || e.target.id.includes('gio-') || e.target.id.includes('-leave') || e.target.classList.contains('time-input')) {

                    if (/^\d{3,4}$/.test(val)) {

                        let formatted = val.length === 3 ? '0' + val : val;

                        e.target.value = formatted.substring(0, 2) + ':' + formatted.substring(2);

                    }

                }



                // Tá»± Ä‘á»™ng Ä‘á»‹nh dáº¡ng ngÃ y (gÃµ 120526 hoáº·c 12052026 -> 12/05/2026)

                if (e.target.id.includes('-date') || e.target.id.includes('-ngay') || e.target.id.includes('ngay-') || e.target.classList.contains('date-input')) {

                    if (/^\d{6}$/.test(val)) {

                        e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4) + '/20' + val.substring(4);

                    } else if (/^\d{8}$/.test(val)) {

                        e.target.value = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);

                    }

                }

            }

        });



        // Tá»I Æ¯U UX 3: Click Ä‘Ãºp vÃ o Ã´ Thá»i gian (Giá» vÃ o, Giá» ra, Giá» báº­n) Ä‘á»ƒ tá»± Ä‘á»™ng Ä‘iá»n GIá»œ HIá»†N Táº I

        document.addEventListener('dblclick', function (e) {

            if (e.target && e.target.tagName === 'INPUT') {

                if (e.target.id.includes('-time') || e.target.id.includes('-gio') || e.target.id.includes('gio-') || e.target.id.includes('-leave') || e.target.classList.contains('time-input')) {

                    const now = new Date();

                    const hh = String(now.getHours()).padStart(2, '0');

                    const mm = String(now.getMinutes()).padStart(2, '0');

                    e.target.value = `${hh}:${mm}`;

                    // BÃ´i Ä‘en Ä‘á»ƒ ngÆ°á»i dÃ¹ng dá»… nhÃ¬n tháº¥y dá»¯ liá»‡u vá»«a Ä‘Æ°á»£c Ä‘iá»n

                    e.target.select();

                }

            }

        });



        // --- Script Blocks Merged ---



        // -----------------------------------------------------------

        // ðŸ“Œ HASH ROUTING LOGIC

        // -----------------------------------------------------------

        document.addEventListener('DOMContentLoaded', function () {

            // Override logic chuyá»ƒn tab cÅ©

            const tabs = document.querySelectorAll('.nav-tab, .nav-item');



            // 1. Láº¯ng nghe Hash Change

            window.addEventListener('hashchange', handleHashChange);



            // 2. Cháº¡y láº§n Ä‘áº§u khi load trang

            if (window.location.hash) {

                handleHashChange();

            } else {

                // Máº·c Ä‘á»‹nh má»Ÿ tab-home

                window.location.hash = '#tab-home';

            }



            // 3. Sá»­a láº¡i event click cá»§a cÃ¡c tab Ä‘á»ƒ chá»‰ Ä‘á»•i hash

            tabs.forEach(tab => {

                // Bá» event click cÅ© báº±ng cÃ¡ch clone node náº¿u cáº§n, nhÆ°ng tá»‘t nháº¥t lÃ  ngÄƒn cháº·n hÃ nh vi máº·c Ä‘á»‹nh

                tab.addEventListener('click', function (e) {

                    if (typeof window.flushPendingChamCongSave === 'function') {
                        try { window.flushPendingChamCongSave(); } catch(e) {}
                    }

                    e.preventDefault();

                    e.stopPropagation(); // NgÄƒn event cÅ© (Ä‘Ã£ gÃ¡n trÆ°á»›c Ä‘Ã³) cháº¡y

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



                let targetTab = hash.substring(1); // XÃ³a dáº¥u #



                // Cáº­p nháº­t giao diá»‡n

                tabs.forEach(t => t.classList.remove('active'));

                let activeBtn = document.querySelector(`[data-tab="${targetTab}"]`);

                if (activeBtn) activeBtn.classList.add('active');



                document.querySelectorAll('.tab-content, .page').forEach(c => c.classList.remove('active'));

                let targetEl = document.getElementById(targetTab);

                if (targetEl) targetEl.classList.add('active');



                // Äiá»u chá»‰nh class body nhÆ° logic cÅ©

                document.body.classList.toggle('tab-sat-active', targetTab === 'tab-sat');

                document.body.classList.toggle('tab-schedule-active', targetTab === 'tab-schedule');



                // KÃ­ch hoáº¡t load dá»¯ liá»‡u riÃªng

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
                showCustomConfirm('ÄÄƒng xuáº¥t tÃ i khoáº£n', 'Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n Ä‘Äƒng xuáº¥t khá»i há»‡ thá»‘ng khÃ´ng?', doLogout);
            } else if (confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n Ä‘Äƒng xuáº¥t khá»i há»‡ thá»‘ng khÃ´ng?')) {
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
        // âœ… KIá»‚M TRA Lá»–I HIS
        // ============================================================

        function initErrorChecker() {
            const fileInput = document.getElementById('error-file-input');
            const btnCheckCurrent = document.getElementById('btn-check-current-schedule');

            if (btnCheckCurrent) {
                btnCheckCurrent.addEventListener('click', () => {
                    const currentSched = (window.currentScheduleData && window.currentScheduleData.length) ? window.currentScheduleData : ((typeof dataCache !== 'undefined' && dataCache.schedule) ? dataCache.schedule : []);
                    if (!currentSched || currentSched.length === 0) {
                        alert('Hiá»‡n chÆ°a cÃ³ dá»¯ liá»‡u trÃªn báº£ng xáº¿p lá»‹ch. Vui lÃ²ng báº¥m "Xáº¿p lá»‹ch" hoáº·c chá»n file Excel/HIS Ä‘á»ƒ kiá»ƒm tra.');
                        return;
                    }
                    const rows = currentSched.filter(r => r && r.gioDienRa && r.gioDienRa !== '--' && !String(r.gioDienRa).includes('Rá»›t') && !r.__dropped).map(r => {
                        const bd = r.gioDienRa || r['GIá»œ DIá»„N RA'] || r.batDau || '';
                        const kt = r.gioKetThuc || r['GIá»œ Káº¾T THÃšC'] || r.ketThuc || '';
                        const ngay = r.ngay || r.NGAY || r['NGÃ€Y'] || '';
                        const datePart = ngay.includes('-') ? ngay.split('-').reverse().join('/') : ngay;
                        const startFull = datePart ? `${bd} ${datePart}` : bd;
                        const endFull = datePart ? `${kt} ${datePart}` : kt;
                        const pName = (r.tenBN || r.hoTen || r['Há»Œ TÃŠN'] || '').replace(/\s*\((?:âœ” RV|âŒ Rá»›t|RV|Rá»›t)\)/gi, '').trim();
                        const proc = r.thuThuat || r.dichVu || r['Dá»ŠCH Vá»¤'] || '';
                        const procInfo = mapProcedureJS(proc);
                        return {
                            'AT': r.nvChinh || r['NV CHÃNH'] || '',
                            'AU': r.nvPhu || r['NV PHá»¤'] || '',
                            'C': pName,
                            'AE': proc,
                            'AG': proc,
                            'AF': 'Chá»§ Ä‘á»™ng',
                            'AS': 'KhÃ¡c',
                            'AN': procInfo ? (procInfo.phanLoai || procInfo.loai || '') : '',
                            'AH': startFull,
                            'L': endFull,
                            'phong': r.phong || r['PHÃ’NG'] || r['phong'] || '',
                            'giuong': r.giuong || r['GIÆ¯á»œNG'] || r['giuong'] || '',
                            'may': r.may || r['MÃY'] || r['may'] || ''
                        };
                    });
                    processErrorChecking(rows);
                });
            }

            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) {
                        return;
                    }

                    if (window.showGlobalLoading) window.showGlobalLoading('Äang phÃ¢n tÃ­ch file HIS...');

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

                            function stripVietnamese(str) {
                                if (!str) return '';
                                return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ä‘/g, "d").replace(/Ä/g, "D").toLowerCase().trim();
                            }

                            for (let i = 0; i < Math.min(rawData.length, 50); i++) {
                                const rowStr = (rawData[i] || []).map(stripVietnamese);
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
                                // TrÃ­ch xuáº¥t ngÃ y tá»« dÃ²ng tiÃªu Ä‘á» trÃªn cÃ¹ng (vÃ­ dá»¥: 'NgÃ y thá»±c hiá»‡n: 19/09/2026') náº¿u khÃ´ng cÃ³ cá»™t NgÃ y
                                let extractedFileDate = '';
                                for (let i = 0; i < headerRowIndex; i++) {
                                    const rowCells = rawData[i] || [];
                                    for (const cell of rowCells) {
                                        const cellStr = String(cell || '').trim();
                                        const dMatch = cellStr.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
                                        if (dMatch) {
                                            extractedFileDate = dMatch[1].replace(/-/g, '/');
                                            break;
                                        }
                                    }
                                    if (extractedFileDate) break;
                                }

                                const headerRow = (rawData[headerRowIndex] || []).map(stripVietnamese);
                                const colIdx = {
                                    ngay: headerRow.findIndex(h => h.includes('ngay')),
                                    ten: headerRow.findIndex(h => h.includes('ten benh nhan') || h.includes('ten bn') || h.includes('hoten')),
                                    tt: headerRow.findIndex(h => h.includes('thu thuat') || h.includes('dich vu') || h.includes('dichvu')),
                                    bd: headerRow.findIndex(h => h.includes('bat dau') || h.includes('gio dien ra') || h.includes('giodienra')),
                                    kt: headerRow.findIndex(h => h.includes('ket thuc') || h.includes('gioketthuc')),
                                    nv: headerRow.findIndex(h => h.includes('nv chinh') || h.includes('nhan vien chinh') || h.includes('ktv') || h.includes('bac si') || h.includes('bÃ¡c sÄ©')),
                                    nvPhu: headerRow.findIndex(h => h.includes('nv phu') || h.includes('nhan vien phu') || h.includes('phu ta') || h.includes('dieu duong phu')),
                                    phong: headerRow.findIndex(h => h.includes('phong dieu tri') || h.includes('phong')),
                                    giuong: headerRow.findIndex(h => h.includes('giuong benh') || h.includes('giuong')),
                                    may: headerRow.findIndex(h => h.includes('may moc') || h.includes('thiet bi') || h.includes('may'))
                                };

                                dataRows = rawData.slice(headerRowIndex + 1).filter(r => r && r.some(c => String(c).trim())).map(r => {
                                    const ngayStr = colIdx.ngay >= 0 ? String(r[colIdx.ngay] || '').trim() : extractedFileDate;
                                    const bdStr = colIdx.bd >= 0 ? String(r[colIdx.bd] || '').trim() : '';
                                    const ktStr = colIdx.kt >= 0 ? String(r[colIdx.kt] || '').trim() : '';

                                    if (bdStr.includes('Rá»›t') || bdStr === '--' || !bdStr) return null;

                                    const datePart = ngayStr.includes('-') ? ngayStr.split('-').reverse().join('/') : ngayStr;
                                    const startFull = datePart ? `${bdStr} ${datePart}` : bdStr;
                                    const endFull = datePart ? `${ktStr} ${datePart}` : ktStr;

                                    const cleanBN = (colIdx.ten >= 0 ? String(r[colIdx.ten] || '') : '').replace(/\s*\((?:âœ” RV|âŒ Rá»›t|RV|Rá»›t)\)/gi, '').trim();
                                    const procName = colIdx.tt >= 0 ? String(r[colIdx.tt] || '').trim() : '';
                                    const procInfo = mapProcedureJS(procName);
                                    const procLoai = procInfo ? (procInfo.phanLoai || procInfo.loai || procInfo.he || '') : '';

                                    return {
                                        'AT': colIdx.nv >= 0 ? r[colIdx.nv] : '',
                                        'AU': colIdx.nvPhu >= 0 ? r[colIdx.nvPhu] : '',
                                        'C': cleanBN,
                                        'AE': procName,
                                        'AG': procName,
                                        'AF': 'Chá»§ Ä‘á»™ng',
                                        'AS': 'KhÃ¡c',
                                        'AN': procLoai,
                                        'AH': startFull,
                                        'L': endFull,
                                        'phong': colIdx.phong >= 0 ? String(r[colIdx.phong] || '').trim() : '',
                                        'giuong': colIdx.giuong >= 0 ? String(r[colIdx.giuong] || '').trim() : '',
                                        'may': colIdx.may >= 0 ? String(r[colIdx.may] || '').trim() : ''
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
                            alert("Lá»—i khi Ä‘á»c file. Vui lÃ²ng kiá»ƒm tra láº¡i cáº¥u trÃºc form.");
                            timeTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">ChÆ°a táº£i dá»¯ liá»‡u</td></tr>';
                            otherTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">ChÆ°a táº£i dá»¯ liá»‡u</td></tr>';
                        }
                    };
                    reader.readAsArrayBuffer(file);
                });
            }
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

        function mapProcedureJS(procStr, targetDate) {
            if (!procStr) return null;
            const procStrLower = normalizeTextJS(procStr);
            const procList = (typeof dataCache !== 'undefined' && dataCache && dataCache.proc) ? dataCache.proc : [];
            let matched = null;
            for (const p of procList) {
                const ten = String(p.ten || p.name || '').toLowerCase();
                const vietTat = String(p.vietTat || '').toLowerCase();
                if ((ten && procStrLower.includes(ten)) || (vietTat && procStrLower === vietTat)) {
                    matched = p;
                    break;
                }
            }
            if (!matched) return null;

            if (!targetDate) return matched;

            let dObj = null;
            if (targetDate instanceof Date) {
                dObj = targetDate;
            } else if (typeof targetDate === 'number') {
                dObj = convertExcelDateToJSDate(targetDate);
            } else if (typeof targetDate === 'string') {
                const s = targetDate.trim();
                if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
                    const [d, m, y] = s.split('/');
                    dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                } else {
                    dObj = new Date(s);
                }
            }
            if (!dObj || isNaN(dObj.getTime())) return matched;

            const yyyy = dObj.getFullYear();
            const mm = String(dObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dObj.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            const historyList = (matched.history && Array.isArray(matched.history))
                ? matched.history
                : ((matched.lichSuDinhMuc && Array.isArray(matched.lichSuDinhMuc))
                    ? matched.lichSuDinhMuc
                    : (typeof matched.lichSuDinhMuc === 'string' ? JSON.parse(matched.lichSuDinhMuc || '[]') : []));

            if (historyList && historyList.length) {
                for (const h of historyList) {
                    const from = h.from || h.tuNgay || h.tu_ngay || '0000-00-00';
                    const to = h.to || h.denNgay || h.den_ngay || '9999-99-99';
                    if (dateStr >= from && dateStr <= to) {
                        return {
                            ...matched,
                            thoiGianThucHien: h.thoiGianThucHien || h.thoiGianThucHienMin || h.tg_thuc_hien || matched.thoiGianThucHien,
                            thoiGianThucHienMin: h.thoiGianThucHienMin || h.thoiGianThucHien || h.tg_thuc_hien || matched.thoiGianThucHienMin,
                            thoiGianThucHienMax: h.thoiGianThucHienMax || h.tg_thuc_hien_max || matched.thoiGianThucHienMax,
                            thoiGianThuThuat: h.thoiGianThuThuat || h.thoiGianThuThuatMin || h.tg_thu_thuat || matched.thoiGianThuThuat,
                            thoiGianThuThuatMin: h.thoiGianThuThuatMin || h.thoiGianThuThuat || h.tg_thu_thuat || matched.thoiGianThuThuatMin,
                            thoiGianThuThuatMax: h.thoiGianThuThuatMax || h.tg_thu_thuat_max || matched.thoiGianThuThuatMax,
                            khoangCach: h.khoangCach !== undefined ? h.khoangCach : matched.khoangCach,
                            canRutMay: h.canRutMay || matched.canRutMay,
                            canNguoiPhu: h.canNguoiPhu || matched.canNguoiPhu,
                            dsNguoiPhu: h.dsNguoiPhu || matched.dsNguoiPhu,
                            vietTat: h.vietTat || matched.vietTat,
                            he: h.he || matched.he,
                            phanLoai: h.phanLoai || matched.phanLoai,
                            may: h.may || matched.may,
                            lienTuc: h.lienTuc !== undefined ? h.lienTuc : matched.lienTuc
                        };
                    }
                }
            }

            return matched;
        }

        function checkPermissionJS(techName, procInfo) {
            const staff = dataCache.staff.find(s => s.ten === techName);
            if (!staff) return true;
            if (!procInfo) return true;
            
            const staffQuyen = staff.quyen || 'Cáº£ hai';
            if (staffQuyen === 'Cáº£ hai') return true;
            
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
            if (date.getFullYear() === 1900) {
                return `${h}:${m}`;
            }
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

        function isDate18Sep2026(dateObj, row) {
            if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                const y = dateObj.getFullYear();
                const m = dateObj.getMonth();
                const d = dateObj.getDate();
                if (y === 2026 && m === 8 && d === 18) return true;
                const uy = dateObj.getUTCFullYear();
                const um = dateObj.getUTCMonth();
                const ud = dateObj.getUTCDate();
                if (uy === 2026 && um === 8 && ud === 18) return true;
            }
            if (row && typeof row === 'object') {
                for (const k of Object.keys(row)) {
                    const v = String(row[k] || '');
                    if (v.includes('18/09/2026') || v.includes('18/9/2026') || v.includes('2026-09-18') || v.includes('18-09-2026') || v.includes('(18/09)') || v.includes('18/09')) {
                        return true;
                    }
                }
            }
            return false;
        }

        function isDieuDuong(staffName) {
            if (!staffName) return false;
            const sNorm = String(staffName).trim().toLowerCase();
            if (sNorm.startsWith('phá»¥') || sNorm.startsWith('phu') || sNorm.startsWith('Ä‘d') || sNorm.startsWith('dd') || sNorm.startsWith('Ä‘iá»u dÆ°á»¡ng') || sNorm.startsWith('dieu duong')) {
                return true;
            }
            const staffList = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.staff)) ? dataCache.staff : [];
            const found = staffList.find(s => (s.ten && s.ten.toLowerCase() === sNorm) || (s.name && s.name.toLowerCase() === sNorm));
            if (found) {
                const r = String(found.chucVu || found.role || '').toLowerCase();
                if (r.includes('Ä‘iá»u dÆ°á»¡ng') || r.includes('dieu duong') || r.includes('phá»¥')) {
                    return true;
                }
            }
            return false;
        }

        function processErrorChecking(dataRows) {
            const countBody = document.getElementById('count-body');
            const timeTbody = document.getElementById('error-time-body');
            const otherTbody = document.getElementById('error-other-body');
            if (countBody) countBody.innerHTML = '';
            timeTbody.innerHTML = '';
            otherTbody.innerHTML = '';

            const counts = {};
            const staffList = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.staff)) ? dataCache.staff : [];
            staffList.forEach(s => {
                counts[s.ten] = { l1: 0, l2: 0, l3: 0, other: 0 };
            });

            let sttTime = 1;
            let sttOther = 1;

            const validStaffNames = staffList.map(s => s.ten);
            const GAP_MS = 60 * 1000; // Khoáº£ng Ä‘á»‡m tá»‘i thiá»ƒu 1 phÃºt chuyá»ƒn ca giá»¯a cÃ¡c giÆ°á»ng

            // Cáº¥u trÃºc gom nhÃ³m theo NhÃ¢n viÃªn (ChÃ­nh), Bá»‡nh nhÃ¢n, GiÆ°á»ng bá»‡nh vÃ  MÃ¡y mÃ³c
            const groupedStaff = {};
            const groupedPatients = {};
            const groupedBeds = {};
            const groupedMachines = {};

            for (let row of dataRows) {
                let techMainRaw = String(row['AT'] || '').trim();
                let techMainNorm = getShortNameJS(techMainRaw);

                let techPhuRaw = String(row['AU'] || row['nvPhu'] || row['NV PHá»¤'] || '').trim();
                let techPhuNorm = getShortNameJS(techPhuRaw);

                const patientName = String(row['C'] || 'KhÃ´ng rÃµ').replace(/\s*\((?:âœ” RV|âŒ Rá»›t|RV|Rá»›t)\)/gi, '').trim();
                const procName = String(row['AE'] || '').trim();

                let start = row['AH'] ? convertExcelDateToJSDate(row['AH']) : null;
                let end = row['L'] ? convertExcelDateToJSDate(row['L']) : null;
                const procInfo = mapProcedureJS(procName, start);
                const phongRaw = String(row.phong || row['PHÃ’NG'] || row['phong'] || '').trim();
                const giuongRaw = String(row.giuong || row['GIÆ¯á»œNG'] || row['giuong'] || '').trim();
                const mayRaw = String(row.may || row['MÃY'] || row['may'] || '').trim();

                // 1. Thá»‘ng kÃª thá»§ thuáº­t cho KTV chÃ­nh (váº«n Ä‘áº¿m Ä‘á»ƒ ghi nháº­n sá»‘ liá»‡u ngÃ y 18/09/2026)
                if (techMainNorm && counts[techMainNorm]) {
                    const loaiVal = String(row['AN'] || (procInfo ? (procInfo.phanLoai || procInfo.loai || procInfo.phan_loai || '') : '')).normalize('NFC').toLowerCase().trim();

                    if (/\bloáº¡i\s*3\b|\bloai\s*3\b|\b3\b|\bloáº¡i\s*iii\b|\bloai\s*iii\b/.test(loaiVal)) {
                        counts[techMainNorm].l3++;
                    } else if (/\bloáº¡i\s*2\b|\bloai\s*2\b|\b2\b|\bloáº¡i\s*ii\b|\bloai\s*ii\b/.test(loaiVal)) {
                        counts[techMainNorm].l2++;
                    } else if (/\bloáº¡i\s*1\b|\bloai\s*1\b|\b1\b|\bloáº¡i\s*i\b|\bloai\s*i\b/.test(loaiVal)) {
                        counts[techMainNorm].l1++;
                    } else {
                        counts[techMainNorm].other++;
                    }
                }

                if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) continue;

                // TÃ­nh toÃ¡n cÃ¡c má»‘c thá»i gian cá»§a thá»§ thuáº­t
                const tgThMin = procInfo ? (parseInt(procInfo.thoiGianThucHienMin || procInfo.thoiGianThucHien || procInfo[6]) || 5) : 5;
                let tgThMax = procInfo ? (parseInt(procInfo.thoiGianThucHienMax || procInfo[13]) || tgThMin) : tgThMin;
                if (tgThMax < tgThMin) tgThMax = tgThMin;

                const tgTtMin = procInfo ? (parseInt(procInfo.thoiGianThuThuatMin || procInfo.thoiGianThuThuat || procInfo[7]) || 15) : 15;
                let tgTtMax = procInfo ? (parseInt(procInfo.thoiGianThuThuatMax || procInfo[12]) || tgTtMin) : tgTtMin;
                if (tgTtMax < tgTtMin) tgTtMax = tgTtMin;

                const isCont = procInfo ? (procInfo.lienTuc === 'CÃ³' || procInfo.lienTuc === 1 || procInfo.lienTuc === '1' || procInfo.lienTuc === true || procInfo[14] === 'CÃ³' || procInfo[14] === 1 || (tgThMin === tgTtMin && tgThMax === tgTtMax && tgThMin >= 10)) : false;
                const canRutMay = procInfo ? (procInfo.canRutMay === 'CÃ³' || procInfo.canRutMay === 1 || procInfo.canRutMay === '1' || procInfo.canRutMay === true || procInfo[9] === 'CÃ³' || procInfo[9] === 1) : false;
                const canNguoiPhu = procInfo ? (procInfo.canNguoiPhu === 'CÃ³' || procInfo.nguoiPhu === 'CÃ³' || procInfo[10] === 'CÃ³' || procInfo.canNguoiPhu === 1 || procInfo.canNguoiPhu === '1' || procInfo.canNguoiPhu === true) : false;

                const procTenLower = procInfo ? String(procInfo.ten || '').toLowerCase() : procName.toLowerCase();
                const isDienCham = procTenLower.includes('Ä‘iá»‡n chÃ¢m') || procTenLower === 'Ä‘c' || procTenLower === 'dctb';
                const isHaoCham = procTenLower.includes('hÃ o chÃ¢m') || procTenLower === 'hc';
                const isThuyCham = procTenLower.includes('thá»§y chÃ¢m') || procTenLower === 'tc';

                // KhÃ³a giá» káº¿t thÃºc Ä‘á»‘i vá»›i TTV chÃ­nh:
                // Äiá»‡n chÃ¢m, HÃ o chÃ¢m (ká»ƒ cáº£ cÃ³ Äiá»u dÆ°á»¡ng phá»¥) vÃ  thá»§ thuáº­t PHCN cÃ³ rÃºt mÃ¡y -> TTV chÃ­nh bá»‹ khÃ³a giá» káº¿t thÃºc ca.
                // RiÃªng Thá»§y chÃ¢m: TTV chÃ­nh chá»‰ tiÃªm/thao tÃ¡c Ä‘áº§u ca, khÃ´ng bá»‹ khÃ³a giá» káº¿t thÃºc.
                const mainHasTeardown = !isCont && !isThuyCham && (isDienCham || isHaoCham || canRutMay);

                const durMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

                // XÃ¢y dá»±ng cÃ¡c khoáº£ng thá»i gian báº­n thá»±c táº¿ (Busy Intervals) cá»§a nhÃ¢n viÃªn chÃ­nh cho ca nÃ y:
                const busyIntervals = [];
                if (isCont) {
                    busyIntervals.push({
                        name: `Thao tÃ¡c liÃªn tá»¥c (${durMinutes}p)`,
                        start: start.getTime(),
                        end: end.getTime(),
                        isTear: false
                    });
                } else {
                    const setupEndMs = Math.min(end.getTime(), start.getTime() + tgThMin * 60000);
                    busyIntervals.push({
                        name: `Thao tÃ¡c Ä‘áº§u ca (${tgThMin}p)`,
                        start: start.getTime(),
                        end: setupEndMs,
                        isTear: false
                    });
                    if (mainHasTeardown) {
                        busyIntervals.push({
                            name: (isDienCham || isHaoCham) ? `RÃºt kim káº¿t thÃºc ca` : `ThÃ¡o mÃ¡y/táº¯t mÃ¡y káº¿t thÃºc ca`,
                            start: end.getTime(),
                            end: end.getTime(),
                            isTear: true
                        });
                    }
                }

                const itemBase = {
                    raw: row,
                    patientName: patientName,
                    procName: procName,
                    procInfo: procInfo,
                    procMethod: String(row['AG'] || ''),
                    ptttStatus: String(row['AF'] || ''),
                    anesName: String(row['AS'] || ''),
                    start: start,
                    end: end,
                    isCont: isCont,
                    hasTeardown: mainHasTeardown,
                    tth_mins: tgThMin,
                    ttg_mins: tgTtMin,
                    durMinutes: durMinutes,
                    busyIntervals: busyIntervals,
                    phong: phongRaw,
                    giuong: giuongRaw,
                    may: mayRaw
                };

                // Kiá»ƒm tra lá»—i hÃ nh chÃ­nh / phÃ¢n quyá»n / thá»i gian cho ca nÃ y (Bá» qua riÃªng ngÃ y 18/09/2026 Ä‘Ã£ xáº¿p Ä‘Ãºng thá»±c táº¿)
                const isDate18 = isDate18Sep2026(start, row);
                if (!isDate18) {
                    const timeAStr = `${formatDate(start)} -> ${formatDate(end)}`;
                    if (techMainRaw && !validStaffNames.includes(techMainNorm)) {
                        addOtherRow(otherTbody, sttOther++, techMainRaw, `${patientName}<br/>${procName}`, timeAStr, "Sai tÃªn NV ChÃ­nh (KhÃ´ng cÃ³ trong CSDL)");
                    }
                    if (techPhuRaw && !validStaffNames.includes(techPhuNorm)) {
                        addOtherRow(otherTbody, sttOther++, techPhuRaw, `${patientName}<br/>${procName}`, timeAStr, "Sai tÃªn NV Phá»¥ (KhÃ´ng cÃ³ trong CSDL)");
                    }

                    const status = String(row['AF'] || '').trim().toLowerCase();
                    if (status && status !== "chá»§ Ä‘á»™ng" && status !== "nan") {
                        addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Sai TÃ¬nh hÃ¬nh PTTT: '${row['AF']}' (Pháº£i lÃ  Chá»§ Ä‘á»™ng)`);
                    }

                    const anes = String(row['AS'] || '').trim().toLowerCase();
                    if (anes && anes !== "khÃ¡c" && anes !== "nan") {
                        addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Sai VÃ´ cáº£m: '${row['AS']}' (Báº¯t buá»™c KhÃ¡c)`);
                    }

                    if (row['AG'] && normalizeTextJS(row['AE']) !== normalizeTextJS(row['AG'])) {
                        addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Sai PP tiáº¿n hÃ nh: '${row['AG']}' (Pháº£i giá»‘ng tÃªn thá»§ thuáº­t)`);
                    }

                    if (procInfo && techMainNorm && !checkPermissionJS(techMainNorm, procInfo)) {
                        addOtherRow(otherTbody, sttOther++, techMainNorm, `${patientName}<br/>${procInfo.ten}`, timeAStr, "LÃ m thá»§ thuáº­t ngoÃ i pháº¡m vi phÃ¢n quyá»n YHCT/PHCN");
                    }

                    // 1. Kiá»ƒm tra thá»i gian thá»§ thuáº­t cá»§a ca so vá»›i Ä‘á»‹nh má»©c TG TT (MIN) vÃ  TG TT (MAX)
                    if (procInfo) {
                        if (durMinutes < tgTtMin) {
                            addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thá»i gian thá»§ thuáº­t ngáº¯n hÆ¡n quy Ä‘á»‹nh (${durMinutes} phÃºt < ${tgTtMin} phÃºt)`);
                        } else if (durMinutes > tgTtMax) {
                            addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thá»i gian thá»§ thuáº­t vÆ°á»£t quÃ¡ quy Ä‘á»‹nh (${durMinutes} phÃºt > ${tgTtMax} phÃºt)`);
                        }

                        // 2. Náº¿u lÃ  thá»§ thuáº­t lÃ m liÃªn tá»¥c: thá»i gian thao tÃ¡c liÃªn tá»¥c cá»§a KTV pháº£i tuÃ¢n thá»§ TG TH
                        if (isCont) {
                            if (durMinutes < tgThMin) {
                                addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thá»i gian thao tÃ¡c liÃªn tá»¥c ngáº¯n hÆ¡n Ä‘á»‹nh má»©c (${durMinutes} phÃºt < ${tgThMin} phÃºt)`);
                            } else if (durMinutes > tgThMax) {
                                addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thá»i gian thao tÃ¡c liÃªn tá»¥c vÆ°á»£t quÃ¡ Ä‘á»‹nh má»©c (${durMinutes} phÃºt > ${tgThMax} phÃºt)`);
                            }
                        }

                        // 3. Kiá»ƒm tra NgÆ°á»i phá»¥
                        // âš ï¸ Táº M THá»œI VÃ” HIá»†U HÃ“A: File HIS hiá»‡n chÆ°a nháº­p dá»¯ liá»‡u ngÆ°á»i phá»¥.
                        // Chá»‰ file lá»‹ch trÃ¬nh do pháº§n má»m xáº¿p má»›i cÃ³ trÆ°á»ng ngÆ°á»i phá»¥.
                        // Báº­t láº¡i kiá»ƒm tra nÃ y khi cáº§n báº±ng cÃ¡ch bá» comment dÆ°á»›i Ä‘Ã¢y.
                        // if (canNguoiPhu && (!techPhuRaw || techPhuRaw === '--' || techPhuRaw === 'KhÃ´ng' || techPhuRaw === 'nan')) {
                        //     addOtherRow(otherTbody, sttOther++, techMainNorm || techMainRaw, `${patientName}<br/>${procName}`, timeAStr, `Thá»§ thuáº­t yÃªu cáº§u cÃ³ NgÆ°á»i phá»¥ nhÆ°ng chÆ°a phÃ¢n cÃ´ng`);
                        // }
                    }
                }

                // Gom nhÃ³m KTV ChÃ­nh
                if (techMainNorm) {
                    if (!groupedStaff[techMainNorm]) groupedStaff[techMainNorm] = [];
                    groupedStaff[techMainNorm].push({
                        ...itemBase,
                        role: 'ChÃ­nh',
                        techRaw: techMainRaw
                    });
                }

                // Gom nhÃ³m Äiá»u DÆ°á»¡ng Phá»¥: Táº M THá»œI CHÆ¯A KIá»‚M TRA Lá»–I TRÃ™NG ÄIá»€U DÆ¯á» NG (sau nÃ y bá»• sung sau)
                /*
                if (techPhuNorm) {
                    if (!groupedStaff[techPhuNorm]) groupedStaff[techPhuNorm] = [];
                    groupedStaff[techPhuNorm].push({
                        ...itemBase,
                        role: 'Phá»¥',
                        techRaw: techPhuRaw,
                        mainTech: techMainNorm
                    });
                }
                */

                // Gom nhÃ³m Bá»‡nh NhÃ¢n (Má»¤C 2)
                if (patientName && patientName !== 'KhÃ´ng rÃµ') {
                    if (!groupedPatients[patientName]) groupedPatients[patientName] = [];
                    groupedPatients[patientName].push({
                        ...itemBase,
                        techMainNorm: techMainNorm,
                        techPhuNorm: techPhuNorm
                    });
                }

                // Gom nhÃ³m GiÆ°á»ng bá»‡nh (Náº¿u cÃ³ dá»¯ liá»‡u giÆ°á»ng bá»‡nh)
                if (giuongRaw) {
                    const gLower = giuongRaw.toLowerCase();
                    const isExcludedBed = gLower.includes('thá»§ cÃ´ng') || gLower.includes('thu cong') || 
                                          gLower.includes('gháº¿') || gLower.includes('ghe') || 
                                          gLower.includes('phá»¥') || gLower.includes('phu') || 
                                          gLower.includes('kÃ©o giÃ£n') || gLower.includes('keo gian') || 
                                          giuongRaw === '--' || giuongRaw === '';
                    if (!isExcludedBed) {
                        const bedKey = (phongRaw ? `${phongRaw} - ` : '') + (giuongRaw.toLowerCase().startsWith('giÆ°á»ng') ? giuongRaw : `GiÆ°á»ng ${giuongRaw}`);
                        if (!groupedBeds[bedKey]) groupedBeds[bedKey] = [];
                        groupedBeds[bedKey].push({
                            ...itemBase,
                            techMainNorm: techMainNorm
                        });
                    }
                }

                // Gom nhÃ³m MÃ¡y mÃ³c (Náº¿u cÃ³ dá»¯ liá»‡u mÃ¡y mÃ³c)
                if (mayRaw) {
                    const mLower = mayRaw.toLowerCase();
                    const isExcludedMachine = mLower.includes('thá»§ cÃ´ng') || mLower.includes('thu cong') || mayRaw === '--' || mayRaw === '';
                    if (!isExcludedMachine) {
                        if (!groupedMachines[mayRaw]) groupedMachines[mayRaw] = [];
                        groupedMachines[mayRaw].push({
                            ...itemBase,
                            techMainNorm: techMainNorm
                        });
                    }
                }
            }

            // ============================================================
            // ðŸš¨ 1. QUÃ‰T Lá»–I TRÃ™NG GIá»œ NHÃ‚N Sá»°
            // ============================================================
            for (const [tech, groupRows] of Object.entries(groupedStaff)) {
                // Táº¡m thá»i chÆ°a kiá»ƒm tra lá»—i trÃ¹ng cá»§a Ä‘iá»u dÆ°á»¡ng
                if (isDieuDuong(tech)) continue;

                groupRows.sort((a, b) => a.start.getTime() - b.start.getTime());
                const n = groupRows.length;

                for (let i = 0; i < n; i++) {
                    const A = groupRows[i];
                    for (let j = i + 1; j < n; j++) {
                        const B = groupRows[j];
                        // Bá» qua lá»—i cá»§a riÃªng ngÃ y 18/09/2026 Ä‘Ã£ xáº¿p Ä‘Ãºng thá»±c táº¿
                        if (isDate18Sep2026(A.start, A.raw) || isDate18Sep2026(B.start, B.raw)) continue;

                        // Náº¿u ca B báº¯t Ä‘áº§u sau khi ca A káº¿t thÃºc hoÃ n toÃ n (kÃ¨m Ä‘á»‡m 1p), khÃ´ng thá»ƒ va cháº¡m tiáº¿p
                        if (B.start.getTime() >= A.end.getTime() + GAP_MS) break;

                        let conflictFound = null;
                        for (const intA of A.busyIntervals) {
                            for (const intB of B.busyIntervals) {
                                const first = intA.start <= intB.start ? intA : intB;
                                const second = intA.start <= intB.start ? intB : intA;

                                // 1. CÃ¹ng káº¿t thÃºc ca lÃºc cÃ¹ng má»™t phÃºt
                                if (first.start === second.start && intA.isTear && intB.isTear) {
                                    conflictFound = {
                                        type: 'OVERLAP',
                                        reason: `TrÃ¹ng giá» káº¿t thÃºc ca (cáº£ 2 ca cÃ¹ng káº¿t thÃºc lÃºc ${formatDate(new Date(first.start))})`
                                    };
                                    break;
                                }
                                // 2. TrÃ¹ng / Ä‘Ã¨ giá» trá»±c tiáº¿p
                                else if (second.start < first.end) {
                                    const ovStart = Math.max(intA.start, intB.start);
                                    const ovEnd = Math.min(intA.end, intB.end);
                                    conflictFound = {
                                        type: 'OVERLAP',
                                        reason: `${intA.name} (Ca 1) vÃ  ${intB.name} (Ca 2) Ä‘Ã¨ giá» nhau (${formatDate(new Date(ovStart))} -> ${formatDate(new Date(ovEnd))})`
                                    };
                                    break;
                                }
                                // 3. Thiáº¿u khoáº£ng Ä‘á»‡m 1 phÃºt chuyá»ƒn giÆ°á»ng giá»¯a 2 bá»‡nh nhÃ¢n khÃ¡c nhau (Má»¤C 1)
                                else if (A.patientName !== B.patientName && second.start < first.end + GAP_MS) {
                                    conflictFound = {
                                        type: 'GAP',
                                        reason: `Thiáº¿u khoáº£ng Ä‘á»‡m 1p chuyá»ƒn giÆ°á»ng giá»¯a ${first.name} (káº¿t thÃºc ${formatDate(new Date(first.end))}) vÃ  ${second.name} (báº¯t Ä‘áº§u ${formatDate(new Date(second.start))})`
                                    };
                                    break;
                                }
                            }
                            if (conflictFound) break;
                        }

                        if (conflictFound) {
                            let roleTag = "";
                            if (A.role === 'Phá»¥' && B.role === 'Phá»¥') {
                                roleTag = " [ÄD Phá»¥]";
                            } else if (A.role !== B.role) {
                                roleTag = " [Vá»«a lÃ m ChÃ­nh vá»«a lÃ m Phá»¥]";
                            }

                            const timeAStr = `${formatDate(A.start)} -> ${formatDate(A.end)}`;
                            const timeBStr = `${formatDate(B.start)} -> ${formatDate(B.end)}`;
                            const ca1Info = `<b>${A.patientName}</b><br/>${A.procName}<br/><span style="color:#2c3e50;">â± ${timeAStr}</span>`;
                            const ca2Info = `<b>${B.patientName}</b><br/>${B.procName}<br/><span style="color:#2c3e50;">â± ${timeBStr}</span>`;
                            const techDisplay = (A.role === 'Phá»¥' || B.role === 'Phá»¥') ? `${tech} <small style="color:#e67e22;">(${A.role === B.role ? 'Há»— trá»£ phá»¥' : 'ChÃ­nh & Phá»¥'})</small>` : tech;
                            
                            addTimeRow(timeTbody, sttTime++, techDisplay, ca1Info, ca2Info, conflictFound.reason + roleTag);
                        }
                    }
                }
            }

            // ============================================================
            // ðŸš¨ 2. QUÃ‰T Lá»–I TRÃ™NG Bá»†NH NHÃ‚N (1 BN LÃ€M 2 THá»¦ THUáº¬T CÃ™NG LÃšC)
            // ============================================================
            for (const [pName, pRows] of Object.entries(groupedPatients)) {
                pRows.sort((a, b) => a.start.getTime() - b.start.getTime());
                const m = pRows.length;

                for (let i = 0; i < m; i++) {
                    const P1 = pRows[i];
                    for (let j = i + 1; j < m; j++) {
                        const P2 = pRows[j];
                        // Bá» qua lá»—i cá»§a riÃªng ngÃ y 18/09/2026 Ä‘Ã£ xáº¿p Ä‘Ãºng thá»±c táº¿
                        if (isDate18Sep2026(P1.start, P1.raw) || isDate18Sep2026(P2.start, P2.raw)) continue;

                        // Náº¿u P2 báº¯t Ä‘áº§u khi hoáº·c sau khi P1 káº¿t thÃºc hoÃ n toÃ n, khÃ´ng va cháº¡m tiáº¿p
                        if (P2.start.getTime() >= P1.end.getTime()) break;

                        // TrÃ¹ng giá»: P2 báº¯t Ä‘áº§u trÆ°á»›c khi P1 káº¿t thÃºc!
                        const timeP1Str = `${formatDate(P1.start)} -> ${formatDate(P1.end)}`;
                        const timeP2Str = `${formatDate(P2.start)} -> ${formatDate(P2.end)}`;
                        const p1Info = `<b>${P1.procName}</b><br/><span style="color:#2c3e50;">â± ${timeP1Str}</span><br/><small>KTV: ${P1.techMainNorm || 'ChÆ°a rÃµ'}${P1.techPhuNorm ? ` | Phá»¥: ${P1.techPhuNorm}` : ''}</small>`;
                        const p2Info = `<b>${P2.procName}</b><br/><span style="color:#2c3e50;">â± ${timeP2Str}</span><br/><small>KTV: ${P2.techMainNorm || 'ChÆ°a rÃµ'}${P2.techPhuNorm ? ` | Phá»¥: ${P2.techPhuNorm}` : ''}</small>`;
                        const bnTag = `<span style="color:#2980b9; font-weight:bold;">ðŸ‘¤ ${pName}</span><br/><small style="color:#7f8c8d;">(TrÃ¹ng BN)</small>`;
                        
                        addTimeRow(timeTbody, sttTime++, bnTag, p1Info, p2Info, `Bá»‡nh nhÃ¢n bá»‹ xáº¿p 2 thá»§ thuáº­t cÃ¹ng lÃºc (${formatDate(P2.start)} Ä‘Ã¨ lÃªn ca trÆ°á»›c káº¿t thÃºc lÃºc ${formatDate(P1.end)})`);
                    }
                }
            }

            // ============================================================
            // ðŸš¨ 3. QUÃ‰T Lá»–I TRÃ™NG GIÆ¯á»œNG Bá»†NH (2 BN Náº°M CÃ™NG 1 GIÆ¯á»œNG CÃ™NG LÃšC)
            // ============================================================
            for (const [bedKey, bRows] of Object.entries(groupedBeds)) {
                bRows.sort((a, b) => a.start.getTime() - b.start.getTime());
                const len = bRows.length;

                for (let i = 0; i < len; i++) {
                    const G1 = bRows[i];
                    for (let j = i + 1; j < len; j++) {
                        const G2 = bRows[j];
                        // Bá» qua lá»—i cá»§a riÃªng ngÃ y 18/09/2026 Ä‘Ã£ xáº¿p Ä‘Ãºng thá»±c táº¿
                        if (isDate18Sep2026(G1.start, G1.raw) || isDate18Sep2026(G2.start, G2.raw)) continue;

                        // Náº¿u G2 báº¯t Ä‘áº§u táº¡i hoáº·c sau khi G1 káº¿t thÃºc hoÃ n toÃ n, khÃ´ng va cháº¡m tiáº¿p
                        if (G2.start.getTime() >= G1.end.getTime()) break;

                        // TrÃ¹ng giÆ°á»ng: G2 báº¯t Ä‘áº§u trÆ°á»›c khi G1 káº¿t thÃºc!
                        const timeG1Str = `${formatDate(G1.start)} -> ${formatDate(G1.end)}`;
                        const timeG2Str = `${formatDate(G2.start)} -> ${formatDate(G2.end)}`;
                        const g1Info = `<b>${G1.patientName}</b><br/>${G1.procName}<br/><span style="color:#2c3e50;">â± ${timeG1Str}</span><br/><small>KTV: ${G1.techMainNorm || 'ChÆ°a rÃµ'}</small>`;
                        const g2Info = `<b>${G2.patientName}</b><br/>${G2.procName}<br/><span style="color:#2c3e50;">â± ${timeG2Str}</span><br/><small>KTV: ${G2.techMainNorm || 'ChÆ°a rÃµ'}</small>`;
                        const bedTag = `<span style="color:#8e44ad; font-weight:bold;">ðŸ›ï¸ ${bedKey}</span><br/><small style="color:#7f8c8d;">(TrÃ¹ng GiÆ°á»ng)</small>`;

                        addTimeRow(timeTbody, sttTime++, bedTag, g1Info, g2Info, `2 ca náº±m trÃ¹ng giÆ°á»ng bá»‡nh (${formatDate(G2.start)} Ä‘Ã¨ lÃªn ca trÆ°á»›c káº¿t thÃºc lÃºc ${formatDate(G1.end)})`);
                    }
                }
            }

            // ============================================================
            // ðŸš¨ 4. QUÃ‰T Lá»–I TRÃ™NG MÃY MÃ“C (2 CA DÃ™NG CHUNG 1 MÃY CÃ™NG LÃšC)
            // ============================================================
            for (const [mName, mRows] of Object.entries(groupedMachines)) {
                mRows.sort((a, b) => a.start.getTime() - b.start.getTime());
                const mLen = mRows.length;

                for (let i = 0; i < mLen; i++) {
                    const M1 = mRows[i];
                    for (let j = i + 1; j < mLen; j++) {
                        const M2 = mRows[j];
                        // Bá» qua lá»—i cá»§a riÃªng ngÃ y 18/09/2026 Ä‘Ã£ xáº¿p Ä‘Ãºng thá»±c táº¿
                        if (isDate18Sep2026(M1.start, M1.raw) || isDate18Sep2026(M2.start, M2.raw)) continue;

                        // Náº¿u M2 báº¯t Ä‘áº§u táº¡i hoáº·c sau khi M1 káº¿t thÃºc hoÃ n toÃ n, khÃ´ng va cháº¡m tiáº¿p
                        if (M2.start.getTime() >= M1.end.getTime()) break;

                        // TrÃ¹ng mÃ¡y: M2 báº¯t Ä‘áº§u trÆ°á»›c khi M1 káº¿t thÃºc!
                        const timeM1Str = `${formatDate(M1.start)} -> ${formatDate(M1.end)}`;
                        const timeM2Str = `${formatDate(M2.start)} -> ${formatDate(M2.end)}`;
                        const m1Info = `<b>${M1.patientName}</b><br/>${M1.procName}<br/><span style="color:#2c3e50;">â± ${timeM1Str}</span><br/><small>KTV: ${M1.techMainNorm || 'ChÆ°a rÃµ'}</small>`;
                        const m2Info = `<b>${M2.patientName}</b><br/>${M2.procName}<br/><span style="color:#2c3e50;">â± ${timeM2Str}</span><br/><small>KTV: ${M2.techMainNorm || 'ChÆ°a rÃµ'}</small>`;
                        const machineTag = `<span style="color:#d35400; font-weight:bold;">âš¡ ${mName}</span><br/><small style="color:#7f8c8d;">(TrÃ¹ng MÃ¡y)</small>`;

                        addTimeRow(timeTbody, sttTime++, machineTag, m1Info, m2Info, `2 ca sá»­ dá»¥ng cÃ¹ng 1 mÃ¡y mÃ³c (${formatDate(M2.start)} Ä‘Ã¨ lÃªn ca trÆ°á»›c káº¿t thÃºc lÃºc ${formatDate(M1.end)})`);
                    }
                }
            }

            if (timeTbody.children.length === 0) timeTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">KhÃ´ng cÃ³ lá»—i trÃ¹ng giá»! ðŸŽ‰</td></tr>';
            if (otherTbody.children.length === 0) otherTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">KhÃ´ng cÃ³ lá»—i phÃ¢n quyá»n/quy trÃ¬nh! ðŸŽ‰</td></tr>';

            if (countBody) {
                let countHtml = '';
                let t1 = 0, t2 = 0, t3 = 0, to = 0;
                staffList.forEach(s => {
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
                    <td>Tá»”NG Cá»˜NG</td>
                    <td style="text-align:center">${t1}</td>
                    <td style="text-align:center">${t2}</td>
                    <td style="text-align:center">${t3}</td>
                    <td style="text-align:center">${to}</td>
                </tr>`;
                countBody.innerHTML = countHtml || '<tr><td colspan="5" style="text-align:center;">ChÆ°a cÃ³ dá»¯ liá»‡u thá»§ thuáº­t</td></tr>';
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            initErrorChecker();
            setTimeout(() => {
                const token = localStorage.getItem('pm_jwt_token');
                const sess = localStorage.getItem('meds_session');
                if (token && sess) {
                    if (typeof window.checkBackupReminder === 'function') window.checkBackupReminder();
                }
                if (typeof window.loadQuickLinks === 'function') window.loadQuickLinks();
            }, 1500);
        });

// ============================================================
// ðŸ“¦ SAO LÆ¯U & KHÃ”I PHá»¤C Dá»® LIá»†U CLOUDFLARE D1 (BACKUP & RESTORE)
// ============================================================

window.exportFullDatabaseBackup = function() {
    if (window.showGlobalLoading) window.showGlobalLoading("Äang xuáº¥t báº£n sao lÆ°u toÃ n bá»™ Cloudflare D1...");
    callApi('exportDatabase', [], async data => {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        if (!data || !data.tables) {
            return showCustomAlert("Lá»—i", "KhÃ´ng thá»ƒ láº¥y dá»¯ liá»‡u sao lÆ°u tá»« mÃ¡y chá»§!");
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

        // Tá»± Ä‘á»™ng ghi vÃ o thÆ° má»¥c mÃ¡y tÃ­nh Ä‘Ã£ káº¿t ná»‘i (náº¿u cÃ³)
        const savedToLocalFolder = await window.autoSaveToLocalDir(data);

        localStorage.setItem('last_backup_timestamp', Date.now().toString());
        const extraMsg = savedToLocalFolder ? " (ÄÃ£ tá»± Ä‘á»™ng lÆ°u 1 báº£n vÃ o thÆ° má»¥c mÃ¡y tÃ­nh cá»§a bÃ¡c sÄ©)" : "";
        showCustomAlert("ThÃ nh cÃ´ng", `ÄÃ£ táº£i vá» báº£n sao lÆ°u dá»¯ liá»‡u toÃ n diá»‡n (phiÃªn báº£n ${data.version || 'v3.6'})${extraMsg}!`);
    }, err => {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        showCustomAlert("Lá»—i sao lÆ°u", "Lá»—i: " + (typeof err === 'string' ? err : JSON.stringify(err)));
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
                return showCustomAlert("Lá»—i khÃ´i phá»¥c", "File chá»n khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng sao lÆ°u PM-XepLich!");
            }

            const tableNames = Object.keys(backupData.tables);
            let totalRows = 0;
            tableNames.forEach(t => { totalRows += (backupData.tables[t] || []).length; });

            const dateStr = backupData.exportDate ? new Date(backupData.exportDate).toLocaleString('vi-VN') : 'KhÃ´ng rÃµ';

            showCustomConfirm(
                "XÃ¡c Nháº­n KhÃ´i Phá»¥c Dá»¯ Liá»‡u",
                `âš ï¸ Báº N CÃ“ CHáº®C CHáº®N Má»N KHÃ”I PHá»¤C Dá»® LIá»†U D1?\n\n` +
                `ðŸ“… NgÃ y sao lÆ°u: ${dateStr}\n` +
                `ðŸ“Š Tá»•ng sá»‘ báº£ng: ${tableNames.length} báº£ng\n` +
                `ðŸ“‹ Tá»•ng sá»‘ báº£n ghi: ${totalRows} dÃ²ng\n\n` +
                `LÆ¯U Ã: Thao tÃ¡c nÃ y sáº½ ghi Ä‘Ã¨ toÃ n bá»™ dá»¯ liá»‡u hiá»‡n táº¡i báº±ng dá»¯ liá»‡u trong file sao lÆ°u!`,
                function() {
                    if (window.showGlobalLoading) window.showGlobalLoading("Äang khÃ´i phá»¥c cÆ¡ sá»Ÿ dá»¯ liá»‡u Cloudflare D1...");
                    callApi('importDatabase', [backupData], res => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        showCustomAlert("ThÃ nh cÃ´ng", res.message || "KhÃ´i phá»¥c dá»¯ liá»‡u thÃ nh cÃ´ng!");
                        setTimeout(() => { location.reload(); }, 1500);
                    }, err => {
                        if (window.hideGlobalLoading) window.hideGlobalLoading();
                        showCustomAlert("Lá»—i khÃ´i phá»¥c", "KhÃ´ng thá»ƒ khÃ´i phá»¥c dá»¯ liá»‡u: " + (typeof err === 'string' ? err : JSON.stringify(err)));
                    });
                }
            );
        } catch(err) {
            showCustomAlert("Lá»—i Ä‘á»c file", "File sao lÆ°u bá»‹ há»ng hoáº·c khÃ´ng Ä‘Ãºng chuáº©n JSON: " + err.message);
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

    showCustomAlert("ThÃ nh cÃ´ng", "ÄÃ£ lÆ°u cáº¥u hÃ¬nh lá»‹ch tá»± Ä‘á»™ng sao lÆ°u & nháº¯c nhá»Ÿ thÃ nh cÃ´ng!");
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
            if (trainedRowsEl) trainedRowsEl.innerText = `${rowsCount.toLocaleString('vi-VN')} dÃ²ng`;
            
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
                    lastTrainedEl.innerText = "ChÆ°a huáº¥n luyá»‡n";
                }
            }
            const countAffinity = model.staffAffinity ? Object.keys(model.staffAffinity).length : 0;
            if (affinityEl) affinityEl.innerText = `${countAffinity.toLocaleString('vi-VN')} cáº·p thÃ³i quen`;
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
        console.warn('[renderAISettingsUI] Lá»—i hiá»ƒn thá»‹ thÃ´ng sá»‘ AI:', e);
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

    const statusText = enable === '1' ? 'Báº¬T (Tá»± Ä‘á»™ng há»c ngay sau khi chá»‘t sá»• hÃ ng ngÃ y)' : 'Táº®T';
    showCustomAlert("ThÃ nh cÃ´ng", `ÄÃ£ lÆ°u cáº¥u hÃ¬nh tá»± Ä‘á»™ng huáº¥n luyá»‡n AI: ${statusText}!`);
};

window.calibrateAIFromHistory = async function(options = {}) {
    const isSilent = (typeof options === 'object' && options !== null && options.silent === true);
    const reason = (typeof options === 'object' && options !== null && options.reason) ? options.reason : 'manual';

    if (!isSilent && window.showGlobalLoading) {
        window.showGlobalLoading("Äang náº¡p dá»¯ liá»‡u lá»‹ch sá»­ vÃ  lá»‹ch trÃ¬nh thá»±c táº¿ Ä‘á»ƒ huáº¥n luyá»‡n AI...");
    }

    const executeTraining = (historyRows) => {
        try {
            // Gom táº¥t cáº£ nguá»“n dá»¯ liá»‡u kháº£ dá»¥ng:
            let combinedRows = Array.isArray(historyRows) ? [...historyRows] : [];
            
            // Bá»• sung lá»‹ch trÃ¬nh hiá»‡n táº¡i & bá»™ Ä‘á»‡m
            if (typeof dataCache !== 'undefined') {
                if (Array.isArray(dataCache.schedule)) combinedRows = combinedRows.concat(dataCache.schedule);
                if (Array.isArray(dataCache.lich_trinh)) combinedRows = combinedRows.concat(dataCache.lich_trinh);
                if (Array.isArray(dataCache.history)) combinedRows = combinedRows.concat(dataCache.history);
            }
            if (Array.isArray(window.currentScheduleData)) {
                combinedRows = combinedRows.concat(window.currentScheduleData);
            }

            // Äá»c thÃªm tá»« bootstrap cache náº¿u cÃ³
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
                if (!isSilent) showCustomAlert("ThÃ´ng bÃ¡o", "ChÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch trÃ¬nh hoáº·c lá»‹ch sá»­ Ä‘iá»u trá»‹ Ä‘á»ƒ huáº¥n luyá»‡n AI. BÃ¡c sÄ© hÃ£y xáº¿p lá»‹ch hoáº·c nháº­p dá»¯ liá»‡u trÆ°á»›c nhÃ©!");
                return;
            }

            let model = null;
            if (window.AIScheduler && typeof window.AIScheduler.trainFromHistory === 'function') {
                model = window.AIScheduler.trainFromHistory(combinedRows);
            }

            // â˜ï¸ LÆ°u trá»±c tiáº¿p mÃ´ hÃ¬nh AI lÃªn CSDL Ä‘Ã¡m mÃ¢y (cai_dat)
            if (model && typeof callApi === 'function') {
                callApi('saveSystemSettings', [{ ai_learned_model: JSON.stringify(model) }], null, null);
            }

            // Ghi nháº­n ngÃ y tá»± Ä‘á»™ng há»c gáº§n nháº¥t
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
                    "Huáº¥n luyá»‡n AI thÃ nh cÃ´ng",
                    `ÄÃ£ cáº­p nháº­t mÃ´ hÃ¬nh AI lÃºc ${timeStr}!\n\nðŸ“Š Dá»¯ liá»‡u thá»±c táº¿: ${trainedCount.toLocaleString('vi-VN')} dÃ²ng (ÄÃ£ Ä‘á»“ng bá»™ lÃªn CSDL mÃ¡y chá»§)\nðŸ‘¥ Cáº·p thÃ³i quen nhÃ¢n sá»±: ${affinityCount.toLocaleString('vi-VN')} máº«u thÃ³i quen\nðŸš¦ Táº¯c ngháº½n mÃ¡y mÃ³c & khung giá» vÃ ng Ä‘Ã£ Ä‘Æ°á»£c tá»‘i Æ°u.`
                );
            } else {
                console.log(`[AIScheduler] âœ… [Auto-Train ${reason}] ÄÃ£ tá»± Ä‘á»™ng cáº­p nháº­t mÃ´ hÃ¬nh AI (${trainedCount.toLocaleString('vi-VN')} dÃ²ng, ${affinityCount} thÃ³i quen) lÃºc ${timeStr}`);
                if (typeof window.showToast === 'function') {
                    window.showToast(`ðŸ¤– AI Ä‘Ã£ tá»± Ä‘á»™ng há»c tá»« ${trainedCount.toLocaleString('vi-VN')} dÃ²ng dá»¯ liá»‡u lÃ¢m sÃ ng!`, 'success', 3500);
                }
            }
        } catch(err) {
            if (!isSilent && window.hideGlobalLoading) window.hideGlobalLoading();
            if (!isSilent) showCustomAlert("ThÃ´ng bÃ¡o", "Lá»—i huáº¥n luyá»‡n AI: " + err.message);
            else console.warn('[AIScheduler] Lá»—i tá»± Ä‘á»™ng huáº¥n luyá»‡n AI ngáº§m:', err);
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
            console.error('[AI] Lá»—i fetch trá»±c tiáº¿p:', e);
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
        if (!window.indexedDB) return reject(new Error("IndexedDB khÃ´ng Ä‘Æ°á»£c há»— trá»£ trÃªn trÃ¬nh duyá»‡t nÃ y"));
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
        return showCustomAlert("TrÃ¬nh duyá»‡t khÃ´ng há»— trá»£", "TrÃ¬nh duyá»‡t cá»§a bÃ¡c sÄ© chÆ°a há»— trá»£ chá»n thÆ° má»¥c lÆ°u tá»± Ä‘á»™ng. Vui lÃ²ng dÃ¹ng Chrome, Edge hoáº·c Brave má»›i nháº¥t!");
    }
    try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        await setSavedDirHandle(handle);
        const displayEl = document.getElementById('local-dir-path-display');
        if (displayEl) displayEl.innerText = "ðŸ“ ÄÃ£ chá»n: " + handle.name;
        showCustomAlert("ThÃ nh cÃ´ng", `ÄÃ£ káº¿t ná»‘i thÆ° má»¥c [${handle.name}]! Tá»« giá» khi báº¥m sao lÆ°u, há»‡ thá»‘ng sáº½ tá»± ghi file tháº³ng vÃ o thÆ° má»¥c nÃ y mÃ  khÃ´ng cáº§n há»i 'Save As'.`);
    } catch(err) {
        if (err.name !== 'AbortError') showCustomAlert("Lá»—i", "KhÃ´ng thá»ƒ chá»n thÆ° má»¥c: " + err.message);
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
        console.warn("[AutoSaveLocal] Lá»—i lÆ°u file vÃ o thÆ° má»¥c:", e);
        return false;
    }
};

window.saveGoogleDriveSettingsUI = function() {
    const urlInput = document.getElementById('gdrive-webhook-url');
    const url = urlInput ? urlInput.value.trim() : "";
    if (url && !url.startsWith('http')) {
        return showCustomAlert("Lá»—i", "URL Google Drive Webhook pháº£i báº¯t Ä‘áº§u báº±ng http:// hoáº·c https://");
    }
    callApi('saveGoogleDriveSettings', [url], res => {
        showCustomAlert("ThÃ nh cÃ´ng", res.message || "ÄÃ£ lÆ°u cÃ i Ä‘áº·t Google Drive Webhook!");
    }, err => {
        showCustomAlert("Lá»—i", "KhÃ´ng thá»ƒ lÆ°u cÃ i Ä‘áº·t: " + err);
    });
};

window.testGoogleDriveUploadUI = function() {
    const urlInput = document.getElementById('gdrive-webhook-url');
    const url = urlInput ? urlInput.value.trim() : "";
    if (!url || !url.startsWith('http')) {
        return showCustomAlert("Lá»—i", "Vui lÃ²ng nháº­p URL Google Drive Webhook trÆ°á»›c khi thá»­ nghiá»‡m!");
    }
    if (window.showGlobalLoading) window.showGlobalLoading("Äang Ä‘áº©y file sao lÆ°u thá»­ nghiá»‡m lÃªn Google Drive...");
    callApi('testGoogleDriveUpload', [url], res => {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        showCustomAlert("ThÃ nh cÃ´ng", res.message || "ÄÃ£ táº£i file sao lÆ°u lÃªn Google Drive thÃ nh cÃ´ng!");
    }, err => {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        showCustomAlert("Lá»—i Google Drive", "KhÃ´ng thá»ƒ táº£i lÃªn Google Drive: " + err);
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
            if (displayEl) displayEl.innerText = "ðŸ“ ÄÃ£ chá»n: " + handle.name;
        }
    });
};

// ============================================================
// ðŸ”— QUáº¢N LÃ LIÃŠN Káº¾T NHANH (FOOTER QUICK LINKS)
// ============================================================

window.loadQuickLinks = function() {
    const uls = document.querySelectorAll('.khu-vuc-lien-ket');
    const defaultList = [
        { icon: "ðŸ“œ", ten: "Tra cá»©u VÄƒn báº£n & BHXH", url: "javascript:openDocLookupModal()" },
        { icon: "ðŸ“–", ten: "HÆ°á»›ng dáº«n sá»­ dá»¥ng pháº§n má»m", url: "javascript:openHdsdModal()" },
        { icon: "ðŸ“‹", ten: "Quy trÃ¬nh Ká»¹ thuáº­t PHCN", url: "https://kcb.vn/" }
    ];

    const renderLinks = (list) => {
        if (!uls.length) return;
        const htmlContent = list.map(item => {
            const itemTen = String(item.ten || item.name || '');
            const itemUrl = String(item.url || '');
            const isDocLookup = itemUrl.includes('tracuu') || itemUrl.includes('openDocLookupModal') || itemTen.includes('Tra cá»©u') || itemTen.includes('VÄƒn báº£n');
            const isHdsd = itemUrl.includes('hdsd') || itemUrl.includes('huong-dan') || itemUrl.includes('openHdsdModal') || itemTen.includes('HÆ°á»›ng dáº«n') || itemTen.includes('HDSD');

            if (isDocLookup) {
                return `<li><a href="javascript:void(0)" onclick="openDocLookupModal()"><span class="f-icon">${item.icon || 'ðŸ“œ'}</span> <span>${itemTen}</span></a></li>`;
            }
            if (isHdsd) {
                return `<li><a href="javascript:void(0)" onclick="openHdsdModal()"><span class="f-icon">${item.icon || 'ðŸ“–'}</span> <span>${itemTen}</span></a></li>`;
            }
            return `<li><a href="${itemUrl || '#'}" target="_blank" rel="noopener"><span class="f-icon">${item.icon || 'ðŸ”—'}</span> <span>${itemTen}</span></a></li>`;
        }).join('');
        uls.forEach(ul => { ul.innerHTML = htmlContent; });
    };

    const token = localStorage.getItem('pm_jwt_token');
    let hasValidSession = false;
    try {
        const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
        if (sess && (sess.username || sess.role)) hasValidSession = true;
    } catch(e) {}

    // ChÆ°a Ä‘Äƒng nháº­p: render liÃªn káº¿t máº·c Ä‘á»‹nh mÃ  khÃ´ng gá»i API
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
        { icon: "ðŸ“–", ten: "HÆ°á»›ng dáº«n sá»­ dá»¥ng pháº§n má»m", url: "#" },
        { icon: "ðŸ“‹", ten: "Quy trÃ¬nh Ká»¹ thuáº­t PHCN", url: "#" },
        { icon: "ðŸ’°", ten: "Báº£ng giÃ¡ Dá»‹ch vá»¥ KCB", url: "#" }
    ];

    list.forEach(item => {
        const div = document.createElement('div');
        div.className = 'quicklink-admin-item';
        div.style.cssText = 'display: flex; gap: 8px; align-items: center; padding: 6px; border-radius: 4px; border: 1px solid #cbd5e1;';
        div.innerHTML = `
            <input type="text" value="${item.icon || 'ðŸ”—'}" class="ql-icon" placeholder="Icon" style="width: 45px; text-align: center; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
            <input type="text" value="${item.ten || item.name || ''}" class="ql-ten" placeholder="TÃªn hiá»ƒn thá»‹" style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
            <input type="text" value="${item.url || '#'}" class="ql-url" placeholder="URL liÃªn káº¿t (http://...)" style="flex: 2; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
            <button type="button" onclick="this.parentElement.remove()" style="background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; font-weight: bold; cursor: pointer;">âœ•</button>
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
        <input type="text" value="ðŸ”—" class="ql-icon" placeholder="Icon" style="width: 45px; text-align: center; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
        <input type="text" value="" class="ql-ten" placeholder="TÃªn hiá»ƒn thá»‹" style="flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
        <input type="text" value="#" class="ql-url" placeholder="URL liÃªn káº¿t (http://...)" style="flex: 2; padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px;">
        <button type="button" onclick="this.parentElement.remove()" style="background: #ef4444; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; font-weight: bold; cursor: pointer;">âœ•</button>
    `;
    container.appendChild(div);
};

window.saveAdminQuickLinks = function(btn) {
    const items = document.querySelectorAll('.quicklink-admin-item');
    const links = [];
    items.forEach(el => {
        const icon = el.querySelector('.ql-icon').value.trim() || 'ðŸ”—';
        const ten = el.querySelector('.ql-ten').value.trim();
        const url = el.querySelector('.ql-url').value.trim() || '#';
        if (ten) {
            links.push({ icon, ten, url });
        }
    });

    callApi('saveQuickLinks', [links], res => {
        showCustomAlert("ThÃ nh cÃ´ng", res.message || "ÄÃ£ lÆ°u danh sÃ¡ch LiÃªn Káº¿t Nhanh!");
        loadQuickLinks();
    }, err => {
        showCustomAlert("Lá»—i", "KhÃ´ng thá»ƒ lÆ°u danh sÃ¡ch liÃªn káº¿t: " + err);
    });
};

// ============================================================
// ðŸ·ï¸ Xá»¬ LÃ Cáº¤U HÃŒNH THÆ¯Æ NG HIá»†U Báº¢N TRáº®NG (WHITE LABEL)
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
        showCustomAlert("ThÃ nh cÃ´ng", "ÄÃ£ cáº­p nháº­t cáº¥u hÃ¬nh thÆ°Æ¡ng hiá»‡u Ä‘Æ¡n vá»‹!");
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
        "âš ï¸ Xáº®C NHáº¬N XÃ“A TRáº®NG Dá»® LIá»†U Lá»ŠCH",
        "Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n XÃ“A TRáº®NG toÃ n bá»™ lá»‹ch trÃ¬nh vÃ  dá»¯ liá»‡u bá»‡nh nhÃ¢n thá»­ nghiá»‡m Ä‘á»ƒ bÃ n giao cho Khoa/Bá»‡nh viá»‡n má»›i khÃ´ng?\n\nLÆ¯U Ã: Thao tÃ¡c nÃ y sáº½ xÃ³a sáº¡ch dá»¯ liá»‡u bá»‡nh nhÃ¢n Ä‘ang lÆ°u táº¡m trong mÃ¡y!",
        function() {
            window.currentScheduleData = [];
            window.lastUnscheduledData = [];
            localStorage.removeItem('cached_schedule_data');
            localStorage.removeItem('cached_unscheduled_data');

            if (typeof renderScheduleTable === 'function') renderScheduleTable([]);
            if (typeof renderSchedPage === 'function') renderSchedPage();
            if (typeof updateUnscheduledStats === 'function') updateUnscheduledStats([]);
            if (typeof renderStats === 'function') renderStats([]);
            showCustomAlert("ÄÃ£ xÃ³a tráº¯ng", "ÄÃ£ dá»n dáº¹p sáº¡ch toÃ n bá»™ lá»‹ch trÃ¬nh. Há»‡ thá»‘ng Ä‘Ã£ sáºµn sÃ ng náº¡p dá»¯ liá»‡u Ä‘Æ¡n vá»‹ má»›i!");
        }
    );
};

window.loadDemoSetupData = function() {
    showCustomAlert("Náº¡p dá»¯ liá»‡u máº«u", "ÄÃ£ kÃ­ch hoáº¡t cháº¿ Ä‘á»™ náº¡p dá»¯ liá»‡u máº«u thÆ°Æ¡ng máº¡i. Báº¡n cÃ³ thá»ƒ sá»­ dá»¥ng nÃºt ðŸ“‚ Táº¢I FILE Lá»ŠCH CÅ¨ hoáº·c nháº­p Excel danh má»¥c!");
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
            option.textContent = `ThÃ¡ng ${mm}/${y}`;
            if (y === currentYear && m === currentMonth) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    }
}
window.populateMonthYearDropdown = populateMonthYearDropdown;

// ============================================================
// ðŸ“œ QUáº¢N LÃ & TRA Cá»¨U VÄ‚N Báº¢N & BHXH (DOCUMENT LOOKUP SYSTEM)
// ============================================================
// ðŸ“– HÆ¯á»šNG DáºªN Sá»¬ Dá»¤NG (HDSD MODAL VIEWER)
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
// ðŸ“œ TRA Cá»¨U VÄ‚N Báº¢N & QUY Äá»ŠNH BHXH / Y Táº¾ (D1 DATABASE)
// ============================================================
window.cachedDocuments = [];
window.isDocAdminEditing = false;
window.editingDocIndex = -1;

const STANDARD_DEFAULT_DOCS = [
    {
        doc_number: "QÄ 3981/QÄ-BYT",
        title: "HÆ°á»›ng dáº«n Quy trÃ¬nh Ká»¹ thuáº­t KhÃ¡m chá»¯a bá»‡nh ChuyÃªn ngÃ nh Phá»¥c há»“i chá»©c nÄƒng (Táº­p 1, 2, 3)",
        agency: "Bá»™ Y táº¿",
        signed_date: "01/10/2014",
        view_link: "https://kcb.vn/",
        download_link: "https://kcb.vn/"
    },
    {
        doc_number: "TT 46/2013/TT-BYT",
        title: "HÆ°á»›ng dáº«n Quy trÃ¬nh Ká»¹ thuáº­t KhÃ¡m chá»¯a bá»‡nh ChuyÃªn ngÃ nh Y há»c cá»• truyá»n (Má»›i nháº¥t)",
        agency: "Bá»™ Y táº¿",
        signed_date: "31/12/2013",
        view_link: "https://kcb.vn/",
        download_link: "https://kcb.vn/"
    },
    {
        doc_number: "CV 1085/BYT-BH",
        title: "HÆ°á»›ng dáº«n vÆ°á»›ng máº¯c thanh toÃ¡n chi phÃ­ KCB (NhÃ³m dá»‹ch vá»¥ YHCT - PHCN cÃ¹ng cÆ¡ cháº¿)",
        agency: "Bá»™ Y táº¿",
        signed_date: "08/03/2024",
        view_link: "https://baohiemxahoi.gov.vn/",
        download_link: "https://baohiemxahoi.gov.vn/"
    },
    {
        doc_number: "TT 32/2023/TT-BYT",
        title: "Phá»¥ lá»¥c danh má»¥c chuyÃªn mÃ´n & Ä‘á»‹nh má»©c ká»¹ thuáº­t BÃ¡c sÄ© Y há»c cá»• truyá»n",
        agency: "Bá»™ Y táº¿",
        signed_date: "31/12/2023",
        view_link: "https://kcb.vn/",
        download_link: "https://kcb.vn/"
    },
    {
        doc_number: "TT 22/2023/TT-BYT",
        title: "Quy Ä‘á»‹nh thá»‘ng nháº¥t giÃ¡ dá»‹ch vá»¥ khÃ¡m bá»‡nh, chá»¯a bá»‡nh BHYT giá»¯a cÃ¡c bá»‡nh viá»‡n",
        agency: "Bá»™ Y táº¿",
        signed_date: "17/11/2023",
        view_link: "https://kcb.vn/",
        download_link: "https://kcb.vn/"
    },
    {
        doc_number: "QÄ 130/QÄ-BYT",
        title: "Chuáº©n vÃ  Ä‘á»‹nh dáº¡ng dá»¯ liá»‡u Ä‘áº§u ra phá»¥c vá»¥ quáº£n lÃ½ vÃ  giÃ¡m Ä‘á»‹nh, thanh toÃ¡n BHYT",
        agency: "Bá»™ Y táº¿",
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
        tbody.innerHTML = '<tr><td colspan="6" align="center" style="padding: 30px; color: #64748b;">â³ Äang náº¡p danh sÃ¡ch vÄƒn báº£n tá»« Cloudflare D1...</td></tr>';
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
        console.warn("[DocLookup] Lá»—i káº¿t ná»‘i D1, dÃ¹ng danh má»¥c chuáº©n:", err);
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
        tbody.innerHTML = '<tr><td colspan="6" align="center" style="padding: 30px; color: #94a3b8;">KhÃ´ng tÃ¬m tháº¥y vÄƒn báº£n nÃ o thá»a Ä‘iá»u kiá»‡n.</td></tr>';
        return;
    }

    const htmlContent = docs.map((doc, idx) => {
        const docNum = doc.doc_number || doc.soHieu || '<i style="color:#94a3b8;">ChÆ°a cÃ³</i>';
        const title = doc.title || doc.tenVanBan || '';
        const agency = doc.agency || doc.coQuan || 'Bá»™ Y táº¿';
        const date = doc.signed_date || doc.ngayKy || '--/--/----';
        const viewLink = doc.view_link || doc.linkXem || 'https://kcb.vn/';
        const downLink = doc.download_link || doc.linkTai || 'https://baohiemxahoi.gov.vn/';

        const adminBtns = window.isDocAdminEditing ? 
            `<button type="button" onclick="editDocItemUI(${idx})" style="padding: 4px 8px; background: #0284c7; color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight:600; cursor: pointer; margin-left: 3px;" title="Chá»‰nh sá»­a">âœï¸ Sá»­a</button>
             <button type="button" onclick="removeDocItemUI(${idx})" style="padding: 4px 8px; background: #ef4444; color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight:600; cursor: pointer; margin-left: 3px;" title="XÃ³a">ðŸ—‘ï¸ XÃ³a</button>` : '';

        return `
            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <td style="padding: 10px; text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
                <td style="padding: 10px; font-weight: 700; color: #1e3a8a;">${docNum}</td>
                <td style="padding: 10px; color: #1e293b; line-height: 1.4; font-weight: 500;">${escapeHtml(title)}</td>
                <td style="padding: 10px; color: #475569;"><span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 12px; font-size: 11.5px; font-weight: 600; white-space: nowrap;">${escapeHtml(agency)}</span></td>
                <td style="padding: 10px; text-align: center; color: #64748b; font-size: 12px;">${date}</td>
                <td style="padding: 10px; text-align: center; white-space: nowrap;">
                    <a href="${viewLink}" target="_blank" style="padding: 4px 9px; background: #2563eb; color: #fff; border-radius: 4px; text-decoration: none; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;" title="Xem trá»±c tiáº¿p">
                        <span>ðŸ‘ï¸</span> Xem
                    </a>
                    <a href="${downLink}" target="_blank" style="padding: 4px 9px; background: #059669; color: #fff; border-radius: 4px; text-decoration: none; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 3px; margin-left: 3px;" title="Táº£i file PDF">
                        <span>ðŸ“¥</span> Táº£i
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

    if (titleEl) titleEl.innerText = 'âž• THÃŠM VÄ‚N Báº¢N QUY Äá»ŠNH Má»šI';
    if (btnSubmit) btnSubmit.innerText = 'ThÃªm VÃ o Danh SÃ¡ch';

    // Clear inputs
    ['new-doc-number', 'new-doc-title', 'new-doc-agency', 'new-doc-date', 'new-doc-viewlink', 'new-doc-downlink'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    const agencyInput = document.getElementById('new-doc-agency');
    if (agencyInput) agencyInput.value = 'Bá»™ Y táº¿';

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
        btnToggle.innerHTML = window.isDocAdminEditing ? '<span>âœ–</span> ThoÃ¡t Sá»­a' : '<span>âš™ï¸</span> Quáº£n LÃ½ / Sá»­a';
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

    if (titleEl) titleEl.innerText = 'âœï¸ CHá»ˆNH Sá»¬A VÄ‚N Báº¢N: ' + (doc.doc_number || doc.title);
    if (btnSubmit) btnSubmit.innerText = 'Cáº­p Nháº­t Thay Äá»•i';

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
    const agency = document.getElementById('new-doc-agency')?.value?.trim() || "Bá»™ Y táº¿";
    const date = document.getElementById('new-doc-date')?.value?.trim() || "--/--/----";
    const viewLink = document.getElementById('new-doc-viewlink')?.value?.trim() || "https://kcb.vn/";
    const downLink = document.getElementById('new-doc-downlink')?.value?.trim() || "https://baohiemxahoi.gov.vn/";

    if (!title) {
        alert("Vui lÃ²ng nháº­p TÃªn vÄƒn báº£n / TrÃ­ch yáº¿u ná»™i dung!");
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
    alert("ÄÃ£ cáº­p nháº­t danh sÃ¡ch! Vui lÃ²ng báº¥m 'ðŸ’¾ LÆ°u Thay Äá»•i VÃ o D1' á»Ÿ gÃ³c dÆ°á»›i Ä‘á»ƒ lÆ°u vÄ©nh viá»…n.");
};

window.removeDocItemUI = function(index) {
    if (index < 0 || index >= window.cachedDocuments.length) return;
    const doc = window.cachedDocuments[index];
    if (!confirm("BÃ¡c sÄ© cÃ³ cháº¯c muá»‘n xÃ³a vÄƒn báº£n: " + (doc.title || doc.doc_number) + "?")) return;

    window.cachedDocuments.splice(index, 1);
    window.renderDocLookupTableUI(window.cachedDocuments);
    const btnSave = document.getElementById('btn-save-doc-admin');
    if (btnSave) btnSave.style.display = 'inline-block';
};

window.restoreDefaultStandardDocs = function() {
    if (!confirm("KhÃ´i phá»¥c láº¡i danh sÃ¡ch 6 vÄƒn báº£n quy Ä‘á»‹nh YHCT - PHCN chuáº©n 2026?")) return;
    window.cachedDocuments = [...STANDARD_DEFAULT_DOCS];
    window.renderDocLookupTableUI(window.cachedDocuments);
    const btnSave = document.getElementById('btn-save-doc-admin');
    if (btnSave) btnSave.style.display = 'inline-block';
    alert("ÄÃ£ táº£i láº¡i máº«u chuáº©n! BÃ¡c sÄ© báº¥m 'ðŸ’¾ LÆ°u Thay Äá»•i VÃ o D1' Ä‘á»ƒ ghi nháº­n vÃ o há»‡ thá»‘ng.");
};

window.saveDocListToServer = function() {
    const btn = document.getElementById('btn-save-doc-admin');
    if (btn) { btn.innerText = "â³ Äang lÆ°u..."; btn.disabled = true; }

    const handleSuccess = () => {
        if (btn) { btn.innerText = "ðŸ’¾ LÆ°u Thay Äá»•i VÃ o D1"; btn.disabled = false; }
        alert("âœ… ÄÃ£ lÆ°u toÃ n bá»™ danh sÃ¡ch vÄƒn báº£n thÃ nh cÃ´ng vÃ o Cloudflare D1 Database!");
    };

    const handleFailure = (err) => {
        if (btn) { btn.innerText = "ðŸ’¾ LÆ°u Thay Äá»•i VÃ o D1"; btn.disabled = false; }
        alert("âŒ Lá»—i khi lÆ°u vÄƒn báº£n lÃªn mÃ¡y chá»§: " + (err.message || err));
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
// ðŸ“± MOBILE & TABLET NAVIGATION CONTROLLER (v3.2.0)
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
// ðŸ“± MOBILE FORM TOGGLE & EDIT EXPANSION HELPERS
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
        btn.innerHTML = 'âž• ThÃªm Má»›i / Nháº­p Liá»‡u';
        btn.classList.remove('active');
    } else {
        form.classList.add('show-mobile-form');
        btn.innerHTML = 'âœ– ÄÃ³ng Khung Nháº­p Liá»‡u';
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
                toggleBtn.innerHTML = 'âœ– ÄÃ³ng Khung Nháº­p Liá»‡u';
                toggleBtn.classList.add('active');
            }
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};



// ============================================================
// ðŸ¢ QUáº¢N TRá»Š ÄÆ N Vá»Š & Báº¢N QUYá»€N SAAS (SUPER ADMIN)
// ============================================================
window.loadTenantsList = function () {
    const tbody = document.getElementById('tenants-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748b;">â³ Äang táº£i danh sÃ¡ch Ä‘Æ¡n vá»‹ tá»« mÃ¡y chá»§ Cloudflare D1...</td></tr>';

    if (typeof callApi === 'function') {
        callApi('getTenantsList', [], res => {
            const list = Array.isArray(res) ? res : (res?.data || []);
            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">ChÆ°a cÃ³ Ä‘Æ¡n vá»‹ nÃ o Ä‘Æ°á»£c táº¡o.</td></tr>';
                return;
            }

            // Thá»‘ng kÃª
            let activeCount = 0, enterpriseCount = 0;
            list.forEach(t => {
                if (t.is_active) activeCount++;
                if (t.plan_tier === 'ENTERPRISE') enterpriseCount++;
            });
            document.getElementById('stat-total-tenants').innerText = list.length;
            document.getElementById('stat-active-tenants').innerText = activeCount;
            document.getElementById('stat-enterprise-tenants').innerText = enterpriseCount;

            // Render báº£ng
            tbody.innerHTML = list.map(t => {
                const isActive = t.is_active === 1 || t.is_active === '1' || t.is_active === true;
                const statusBadge = isActive
                    ? '<span style="background:#dcfce7; color:#15803d; padding:4px 8px; border-radius:6px; font-weight:700; font-size:11px;">ðŸŸ¢ Hoáº¡t Äá»™ng</span>'
                    : '<span style="background:#fee2e2; color:#b91c1c; padding:4px 8px; border-radius:6px; font-weight:700; font-size:11px;">ðŸ”´ Táº¡m KhÃ³a</span>';

                const isLifetime = t.unit_code === 'bvtks-cs2' || t.unit_code === 'bvtks_cs2' || t.plan_tier === 'ENTERPRISE';
                const planBadge = isLifetime
                    ? '<span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:6px; font-weight:700; font-size:11px;">ðŸ’Ž VÄ¨NH VIá»„N</span>'
                    : `<span style="background:#e0e7ff; color:#3730a3; padding:3px 8px; border-radius:6px; font-weight:700; font-size:11px;">${t.plan_tier || 'PRO'}</span>`;

                const expiresDisplay = isLifetime
                    ? '<span style="color:#059669; font-weight:700;">ðŸ’Ž VÄ©nh viá»…n</span>'
                    : (t.expires_at || 'VÄ©nh viá»…n');

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
                                <button class="btn btn-sm btn-secondary" onclick="openEditTenantModal('${t.unit_code}', '${encodeURIComponent(t.unit_name)}', '${t.plan_tier}', '${t.expires_at}', ${t.max_staff}, ${t.max_patients}, '${t.phone || ''}')" title="Chá»‰nh sá»­a / Gia háº¡n">âœï¸ Sá»­a</button>
                                <button class="btn btn-sm" style="background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; font-weight:700;" onclick="window.openContractPartyAModal('${t.plan_tier}', '${t.unit_code}', '${encodeURIComponent(t.unit_name)}', '${t.expires_at || ''}')" title="Äiá»n thÃ´ng tin & Táº£i Há»£p Äá»“ng (PDF) cho Ä‘Æ¡n vá»‹ nÃ y">ðŸ“œ HÄ</button>
                                <button class="btn btn-sm btn-info" onclick="exportTenantDataPrompt('${t.unit_code}', '${encodeURIComponent(t.unit_name)}')" title="Xuáº¥t dá»¯ liá»‡u sao lÆ°u (JSON) riÃªng cho Ä‘Æ¡n vá»‹ nÃ y">ðŸ“¥ Xuáº¥t</button>
                                <button class="btn btn-sm btn-warning" onclick="resetTenantPasswordPrompt('${t.unit_code}')" title="Äáº·t láº¡i máº­t kháº©u Admin">ðŸ”‘ Pass</button>
                                <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleTenantStatus('${t.unit_code}', ${isActive ? 0 : 1})" title="${isActive ? 'KhÃ³a Ä‘Æ¡n vá»‹' : 'Má»Ÿ khÃ³a Ä‘Æ¡n vá»‹'}">${isActive ? 'ðŸ”’ KhÃ³a' : 'ðŸ”“ Má»Ÿ'}</button>
                                ${t.unit_code !== 'bvtks-cs2' && t.unit_code !== 'bvtks_cs2' ? `<button class="btn btn-sm btn-danger" onclick="deleteTenantPrompt('${t.unit_code}', '${encodeURIComponent(t.unit_name)}')" title="XÃ³a vÄ©nh viá»…n">ðŸ—‘ï¸ XÃ³a</button>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Tá»± Ä‘á»™ng táº£i luÃ´n danh sÃ¡ch giao dá»‹ch thanh toÃ¡n VietQR
            if (typeof window.loadPaymentTransactionsList === 'function') {
                window.loadPaymentTransactionsList();
            }
        }, err => {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#e11d48;">Lá»—i khi táº£i danh sÃ¡ch: ${escapeHtml(err && err.message ? err.message : 'KhÃ´ng xÃ¡c Ä‘á»‹nh')}</td></tr>`;
        });
    }
};

window.openAddTenantModal = function () {
    document.getElementById('modal-tenant-title').innerText = 'âž• ThÃªm Bá»‡nh Viá»‡n / ÄÆ¡n Vá»‹ Má»›i';
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
    document.getElementById('modal-tenant-title').innerText = 'âœï¸ Chá»‰nh Sá»­a & Gia Háº¡n ÄÆ¡n Vá»‹: ' + code;
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
        alert('Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ MÃ£ Ä‘Æ¡n vá»‹ vÃ  TÃªn Ä‘Æ¡n vá»‹!');
        return;
    }

    if (isEdit && oldCode && code !== oldCode) {
        const confirmMsg = `âš ï¸ Báº N ÄANG Äá»”I MÃƒ ÄÆ N Vá»Š:\n\nTá»« mÃ£ cÅ©: "${oldCode}" âž” Sang mÃ£ má»›i: "${code}"\n\nToÃ n bá»™ dá»¯ liá»‡u (Bá»‡nh nhÃ¢n, NhÃ¢n sá»±, Lá»‹ch trÃ¬nh, TÃ i khoáº£n, CÃ i Ä‘áº·t...) sáº½ tá»± Ä‘á»™ng Ä‘Æ°á»£c chuyá»ƒn sang mÃ£ má»›i.\n\nBáº¡n cÃ³ cháº¯c cháº¯n muá»‘n tiáº¿p tá»¥c khÃ´ng?`;
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
    if (btn) { btn.innerText = 'â³ Äang lÆ°u...'; btn.disabled = true; }

    callApi(action, [payload], res => {
        if (btn) { btn.innerText = 'ðŸ’¾ LÆ°u ÄÆ¡n Vá»‹'; btn.disabled = false; }
        closeTenantModal();

        if (isEdit && oldCode && code !== oldCode) {
            if (localStorage.getItem('pm_unit_code') === oldCode) {
                localStorage.setItem('pm_unit_code', code);
                localStorage.setItem('pm_unit_name', name);
                if (typeof window.updateAppHeader === 'function') window.updateAppHeader(code, 'SUPER_ADMIN');
            }
        }

        alert(isEdit ? 'ÄÃ£ cáº­p nháº­t thÃ´ng tin Ä‘Æ¡n vá»‹ thÃ nh cÃ´ng!' : 'ÄÃ£ táº¡o má»›i Ä‘Æ¡n vá»‹ thÃ nh cÃ´ng!');
        loadTenantsList();
    }, err => {
        if (btn) { btn.innerText = 'ðŸ’¾ LÆ°u ÄÆ¡n Vá»‹'; btn.disabled = false; }
        alert('Lá»—i: ' + (err && err.message ? err.message : 'KhÃ´ng thá»ƒ lÆ°u Ä‘Æ¡n vá»‹'));
    });
};

window.toggleTenantStatus = function (code, newStatus) {
    const actionText = newStatus === 1 ? 'Má»ž KHÃ“A' : 'Táº M KHÃ“A';
    if (!confirm(`Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n ${actionText} Ä‘Æ¡n vá»‹ '${code}' khÃ´ng?`)) return;

    callApi('toggleTenantStatus', [code, newStatus], res => {
        loadTenantsList();
    }, err => {
        alert('Lá»—i: ' + (err && err.message ? err.message : 'KhÃ´ng thá»ƒ thay Ä‘á»•i tráº¡ng thÃ¡i'));
    });
};

window.resetTenantPasswordPrompt = function (code) {
    const newPass = prompt(`Nháº­p máº­t kháº©u Admin má»›i cho Ä‘Æ¡n vá»‹ '${code}':`, 'admin123');
    if (!newPass) return;

    callApi('resetTenantAdminPassword', [code, newPass], res => {
        alert(`ÄÃ£ Ä‘áº·t láº¡i máº­t kháº©u Admin cho Ä‘Æ¡n vá»‹ '${code}' thÃ nh cÃ´ng!`);
    }, err => {
        alert('Lá»—i: ' + (err && err.message ? err.message : 'KhÃ´ng thá»ƒ Ä‘áº·t láº¡i máº­t kháº©u'));
    });
};

window.deleteTenantPrompt = function (code, encName) {
    const name = decodeURIComponent(encName);
    if (!confirm(`âš ï¸ Cáº¢NH BÃO NGUY HIá»‚M: Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n XÃ“A VÄ¨NH VIá»„N Ä‘Æ¡n vá»‹ '${name}' (${code}) vÃ  toÃ n bá»™ dá»¯ liá»‡u xáº¿p lá»‹ch, bá»‡nh nhÃ¢n, nhÃ¢n sá»± cá»§a Ä‘Æ¡n vá»‹ nÃ y khÃ´ng?`)) return;

    callApi('deleteTenant', [code], res => {
        alert(`ÄÃ£ xÃ³a thÃ nh cÃ´ng Ä‘Æ¡n vá»‹ '${code}'!`);
        loadTenantsList();
    }, err => {
        alert('Lá»—i: ' + (err && err.message ? err.message : 'KhÃ´ng thá»ƒ xÃ³a Ä‘Æ¡n vá»‹'));
    });
};

window.exportTenantDataPrompt = function (code, encName) {
    const name = decodeURIComponent(encName || code);
    const loadingToast = document.createElement('div');
    loadingToast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#1e293b; color:#fff; padding:12px 20px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:99999; font-size:13px; font-weight:600;';
    const safeName = (window.escapeHtml || escapeHtml)(name);
    loadingToast.innerHTML = `â³ Äang Ä‘Ã³ng gÃ³i dá»¯ liá»‡u Ä‘Æ¡n vá»‹ <b>${safeName}</b>...`;
    document.body.appendChild(loadingToast);

    callApi('exportTenantData', [code], res => {
        if (loadingToast) loadingToast.remove();
        if (!res || !res.tables) {
            alert('KhÃ´ng nháº­n Ä‘Æ°á»£c dá»¯ liá»‡u há»£p lá»‡ tá»« mÃ¡y chá»§!');
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

        alert(`âœ… ÄÃ£ xuáº¥t dá»¯ liá»‡u sao lÆ°u thÃ nh cÃ´ng!\n\nâ€¢ ÄÆ¡n vá»‹: ${name} (${code})\nâ€¢ TÃªn tá»‡p: ${fileName}\nâ€¢ Tá»•ng sá»‘ báº£ng: ${Object.keys(res.tables).length} báº£ng dá»¯ liá»‡u.`);
    }, err => {
        if (loadingToast) loadingToast.remove();
        alert('Lá»—i xuáº¥t dá»¯ liá»‡u: ' + (err && err.message ? err.message : 'KhÃ´ng xÃ¡c Ä‘á»‹nh'));
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
                    alert('Tá»‡p JSON nÃ y khÃ´ng pháº£i lÃ  tá»‡p sao lÆ°u dá»¯ liá»‡u há»£p lá»‡ cá»§a há»‡ thá»‘ng!');
                    return;
                }

                if (!confirm(`âš ï¸ Báº N CÃ“ CHáº®C CHáº®N MUá»N KHÃ”I PHá»¤C Dá»® LIá»†U CHO ÄÆ N Vá»Š '${code}'?\n\nToÃ n bá»™ dá»¯ liá»‡u hiá»‡n táº¡i cá»§a Ä‘Æ¡n vá»‹ nÃ y sáº½ Ä‘Æ°á»£c thay tháº¿ báº±ng dá»¯ liá»‡u trong tá»‡p sao lÆ°u: "${file.name}".`)) return;

                callApi('importTenantData', [{ unit_code: code, data: backupJson }], res => {
                    alert(`âœ… KhÃ´i phá»¥c dá»¯ liá»‡u thÃ nh cÃ´ng cho Ä‘Æ¡n vá»‹ '${code}'!`);
                    loadTenantsList();
                }, err => {
                    alert('Lá»—i khÃ´i phá»¥c: ' + (err && err.message ? err.message : 'KhÃ´ng xÃ¡c Ä‘á»‹nh'));
                });
            } catch(err) {
                alert('Tá»‡p JSON bá»‹ lá»—i Ä‘á»‹nh dáº¡ng: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    fileInput.click();
};


// ============================================================
// ðŸ”‘ Äá»”I Máº¬T KHáº¨U TÃ€I KHOáº¢N (SUPER ADMIN & ALL USERS)
// ============================================================




window.submitChangePassword = function() {
    const uName = (document.getElementById('cpw-username')?.value || '').trim();
    const oldPass = (document.getElementById('cpw-old-password')?.value || '').trim();
    const newPass = (document.getElementById('cpw-new-password')?.value || '').trim();
    const confPass = (document.getElementById('cpw-confirm-password')?.value || '').trim();

    if (!oldPass) {
        alert('âš ï¸ Vui lÃ²ng nháº­p máº­t kháº©u hiá»‡n táº¡i!');
        return;
    }
    if (!newPass || newPass.length < 6) {
        alert('âš ï¸ Máº­t kháº©u má»›i pháº£i cÃ³ tá»‘i thiá»ƒu 6 kÃ½ tá»±!');
        return;
    }
    if (newPass !== confPass) {
        alert('âš ï¸ Máº­t kháº©u xÃ¡c nháº­n khÃ´ng khá»›p vá»›i máº­t kháº©u má»›i!');
        return;
    }

    const btn = document.getElementById('btn-save-change-password');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>â³</span> Äang lÆ°u...';
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
            btn.innerHTML = '<span>ðŸ’¾</span> LÆ°u Máº­t Kháº©u';
        }
        if (res && (res.status === 'success' || res.message || res.success)) {
            alert('ðŸŽ‰ ' + (res.data?.message || res.message || 'ÄÃ£ Ä‘á»•i máº­t kháº©u thÃ nh cÃ´ng!'));
            closeChangePasswordModal();
        } else {
            alert('âŒ ' + (res?.error || res?.message || 'KhÃ´ng thá»ƒ Ä‘á»•i máº­t kháº©u. Vui lÃ²ng kiá»ƒm tra láº¡i máº­t kháº©u hiá»‡n táº¡i!'));
        }
    }, err => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>ðŸ’¾</span> LÆ°u Máº­t Kháº©u';
        }
        console.error('Change password error:', err);
        alert('âŒ Lá»—i káº¿t ná»‘i mÃ¡y chá»§: ' + (err.message || String(err)));
    });
};

// ============================================================
// ðŸ“… Há»† THá»NG Äá»’NG Bá»˜ CHá»ŒN NGÃ€Y & XEM Lá»ŠCH Sá»¬ ÄA TAB
// (tab-home, tab-busy, tab-schedule, tab-utils)
// ============================================================
window.onAppDateChange = function(dateStr, sourceTab) {
    const rawDate = (dateStr || '').trim();
    const d = new Date();
    const todayYMD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const targetDate = rawDate || todayYMD;

    // 1. Äá»“ng bá»™ giÃ¡ trá»‹ Ã´ chá»n ngÃ y trÃªn táº¥t cáº£ cÃ¡c tab
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

    // 2. XÃ¡c Ä‘á»‹nh cháº¿ Ä‘á»™: HÃ´m nay (Live) hay Lá»‹ch sá»­ (History)
    const isToday = (targetDate === todayYMD) || (window._systemActiveYMD && targetDate === window._systemActiveYMD);
    const forceHistoryRequest = (sourceTab === 'history_input' || sourceTab === 'history' || sourceTab === 'history_date');

    // Cáº­p nháº­t huy hiá»‡u tráº¡ng thÃ¡i trÃªn Tab Giá» Báº­n (tab-busy)
    const busyBadge = document.getElementById('busy-date-badge');
    const busyNotice = document.getElementById('busy-history-notice');
    if (busyBadge) {
        if (isToday && !forceHistoryRequest) {
            busyBadge.innerHTML = 'ðŸŸ¢ Äang xem: HÃ´m nay (Thá»i gian thá»±c)';
            busyBadge.style.background = '#dcfce7';
            busyBadge.style.color = '#15803d';
            busyBadge.style.borderColor = '#bbf7d0';
        } else {
            busyBadge.innerHTML = `ðŸ“œ Äang xem lá»‹ch sá»­: ${dmy}` + (isToday ? ' (ÄÃ£ chá»‘t sá»•)' : '');
            busyBadge.style.background = '#fef3c7';
            busyBadge.style.color = '#b45309';
            busyBadge.style.borderColor = '#fde68a';
        }
    }
    if (busyNotice) {
        busyNotice.style.display = (isToday && !forceHistoryRequest) ? 'none' : 'inline-flex';
    }

    // Toggle khá»‘i nháº­p liá»‡u (Live) vs tiÃªu Ä‘á» thÃ´ng tin (History) trÃªn cáº£ 3 cá»™t cá»§a tab-busy
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

    // Äá»“ng bá»™ giÃ¡ trá»‹ dropdown chá»n nhanh ngÃ y cÃ³ lá»‹ch sá»­ báº­n
    const quickSelect = document.getElementById('busy-quick-date-select');
    if (quickSelect) {
        quickSelect.value = (isToday && !forceHistoryRequest) ? '' : targetDate;
    }

    if (isToday && !forceHistoryRequest) {
        // --- CHáº¾ Äá»˜ HÃ”M NAY (LIVE) ---
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
            statusEl.innerText = window._todayIsFinalized ? 'ðŸ“‹ HÃ´m nay (ÄÃ£ chá»‘t sá»•)' : 'ðŸŸ¢ HÃ´m nay (Live)';
            statusEl.style.color = window._todayIsFinalized ? '#b45309' : '#15803d';
        }
        if (window.showToast) window.showToast(`ÄÃ£ chuyá»ƒn vá» ngÃ y hÃ´m nay (${dmy})`, 'success', 1800);
        return;
    }

    // --- CHáº¾ Äá»˜ Lá»ŠCH Sá»¬ (HISTORY) ---
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

        // Ãp dá»¥ng dá»¯ liá»‡u lá»‹ch sá»­ vÃ o dataCache Ä‘á»ƒ cáº­p nháº­t tab-busy, tab-schedule, tab-patients
        if (typeof applyHistoryDataToTabs === 'function') {
            applyHistoryDataToTabs(fullData, targetDate);
        } else {
            if (typeof renderBusyStaff === 'function') renderBusyStaff();
            if (typeof renderBusyPat === 'function') renderBusyPat();
            if (typeof renderLeavePat === 'function') renderLeavePat();
        }

        // Cáº­p nháº­t tab-schedule
        if (typeof filterSchedule === 'function') {
            filterSchedule();
        }

        // Cáº­p nháº­t tab-home (Dashboard)
        if (typeof loadDashboard === 'function') {
            loadDashboard();
        }

        // Cáº­p nháº­t tab-utils (Tiá»‡n Ã­ch tÃ¬m ráº£nh)
        window.utilsScheduleData = fullData.schedule || [];
        window.utilsScheduleDate = targetDate;
        window.utilsStaffBusy = fullData.staffBusy || [];
        const statusEl = document.getElementById('utils-lich-status');
        if (statusEl) {
            const count = (fullData.schedule || []).length;
            statusEl.innerText = isToday ? `ðŸ“‹ Lá»‹ch HÃ´m Nay (ÄÃ£ chá»‘t): ${count} ca` : `âœ… NgÃ y ${dmy}: ${count} ca`;
            statusEl.style.color = isToday ? '#b45309' : '#27ae60';
        }

        if (displayEl) {
            displayEl.innerHTML = isToday ? `<span style="color:#b45309; background:#fef3c7; padding:2px 8px; border-radius:6px; font-weight:700;">ðŸ“‹ Lá»‹ch HÃ´m Nay (ÄÃ£ chá»‘t sá»•)</span>` : dmy;
        }

        if (window.showToast) {
            window.showToast(isToday ? `ÄÃ£ táº£i lá»‹ch sá»­ Ä‘Ã£ chá»‘t sá»• cá»§a ngÃ y hÃ´m nay (${dmy})!` : `ÄÃ£ táº£i dá»¯ liá»‡u lá»‹ch sá»­ ngÃ y ${dmy}!`, 'info', 2500);
        }
    };

    // Kiá»ƒm tra cache trÆ°á»›c
    if (window._historyCache && window._historyCache[targetDate]) {
        handleLoadedHistory(window._historyCache[targetDate]);
        return;
    }

    if (window.showGlobalLoading) window.showGlobalLoading(`Äang táº£i lá»‹ch sá»­ ngÃ y ${dmy}...`);

    const onSuccess = function(res) {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        const data = (res && res.data) ? res.data : res;
        handleLoadedHistory(data);
    };

    const onError = function(err) {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
        console.error(`Lá»—i táº£i lá»‹ch sá»­ ngÃ y ${targetDate}:`, err);
        const errMsg = (err && err.message) ? err.message : String(err);
        if (window.showToast) {
            window.showToast(`KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u ngÃ y ${dmy}: ${errMsg}`, 'error', 4000);
        } else {
            alert(`âŒ KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u lá»‹ch sá»­ ngÃ y ${dmy}: ${errMsg}`);
        }
    };

    if (typeof callApi === 'function') {
        callApi('getHistoryFullData', [targetDate], onSuccess, onError);
    } else if (window.google && window.google.script && window.google.script.run) {
        window.google.script.run
            .withSuccessHandler(onSuccess)
            .withFailureHandler(onError)
            .getHistoryFullData(targetDate);
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
// ðŸ“œ Táº¢I DANH SÃCH CÃC NGÃ€Y CÃ“ Lá»ŠCH Sá»¬ Báº¬N Tá»ª CSDL ÄÃM MÃ‚Y TURSO / MINIPC
// ============================================================
window.loadBusyHistoryDates = function(forceReload) {
    const quickSelect = document.getElementById('busy-quick-date-select');
    if (!quickSelect) return;
    if (quickSelect._loaded && !forceReload) return;

    const populateDates = function(dates) {
        if (!dates || !Array.isArray(dates) || dates.length === 0) return;
        window._cachedBusyHistoryDates = dates;
        quickSelect._loaded = true;
        let html = '<option value="">-- Chá»n ngÃ y cÃ³ lá»‹ch sá»­ báº­n --</option>';
        dates.forEach(d => {
            const parts = d.split('-');
            const dmy = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
            html += `<option value="${d}">ðŸ“… NgÃ y ${dmy}</option>`;
        });
        quickSelect.innerHTML = html;
        const currentTarget = window._viewingHistoryDate || (document.getElementById('busy-date-filter') ? document.getElementById('busy-date-filter').value : '');
        if (currentTarget && window._forceHistoryMode) {
            quickSelect.value = currentTarget;
        }
    };

    // Náº¿u Ä‘Ã£ cÃ³ cache trong bá»™ nhá»› vÃ  khÃ´ng báº¯t buá»™c táº£i láº¡i
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
            console.warn('[loadBusyHistoryDates] KhÃ´ng thá»ƒ táº£i danh má»¥c ngÃ y báº­n:', err);
        });
    } else if (window.google && window.google.script && window.google.script.run && window.google.script.run.getGioBanChungCu) {
        window.google.script.run
            .withSuccessHandler(res => {
                const dates = (res && res.dates) ? res.dates : [];
                if (dates.length > 0) populateDates(dates);
            })
            .getGioBanChungCu('all', 'all', '');
    }
};

// Tá»± Ä‘á»™ng gá»i náº¡p danh sÃ¡ch ngÃ y ngay khi khá»Ÿi Ä‘á»™ng
setTimeout(() => {
    if (typeof window.loadBusyHistoryDates === 'function') {
        window.loadBusyHistoryDates();
    }
}, 500);

// Khá»Ÿi táº¡o vÃ  tÆ°Æ¡ng thÃ­ch ngÆ°á»£c
window.switchBusySubTab = function(mode) {};
window.onBusyHistFilterChange = function() {};
window.onAdminBusyHistFilterChange = function() {};
window.loadGioBanChungCuUI = function() {};
window.renderGioBanChungCuTable = function() {};
window.filterGioBanChungCuClient = function() {};

// ============================================================
// â° Tá»° Äá»˜NG THEO DÃ•I & Äá»’NG Bá»˜ CHá»T Sá»” ÄÃM MÃ‚Y (CLIENT-SIDE LISTENER)
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

            // Khi Ä‘áº¿n hoáº·c qua giá» chá»‘t sá»•, kiá»ƒm tra vá»›i server
            if (currentMinutes >= targetMinutes && !window._chotSoDone) {
                if (typeof callApi === 'function') {
                    callApi('autoChotSo', [], res => {
                        if (res && res.closed) {
                            window._chotSoDone = true;
                            console.log(`[Client Auto-ChotSo]: MÃ¡y chá»§ Ä‘Ã£ tá»± Ä‘á»™ng chá»‘t sá»• ngÃ y ${res.closedDate || ''}.`);

                            // Dá»n dáº¹p bá»™ nhá»› client vÃ  lÃ m má»›i giao diá»‡n
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
                                displayEl.innerHTML = `<span style="color:#b45309; background:#fef3c7; padding:2px 8px; border-radius:6px; font-weight:700;">ðŸ“‹ HÃ´m nay (ÄÃ£ chá»‘t sá»•${countInfo})</span>`;
                            }
                            const statusEl = document.getElementById('utils-lich-status');
                            if (statusEl) {
                                statusEl.innerText = `ðŸ“‹ HÃ´m nay (ÄÃ£ chá»‘t sá»•${countInfo})`;
                                statusEl.style.color = '#b45309';
                            }

                            if (typeof filterSchedule === 'function') filterSchedule();
                            if (typeof renderScheduleCalendar === 'function') renderScheduleCalendar();
                            if (typeof updateStats === 'function') updateStats();
                            if (typeof loadDashboard === 'function') loadDashboard();

                            // Tá»± Ä‘á»™ng kÃ­ch hoáº¡t huáº¥n luyá»‡n mÃ´ hÃ¬nh AI trÃªn client náº¿u Ä‘ang báº­t
                            if (localStorage.getItem('ai_auto_train_enable') !== '0') {
                                if (typeof window.calibrateAIFromHistory === 'function') {
                                    window.calibrateAIFromHistory({ silent: true, reason: 'auto_after_chot_so' });
                                }
                            }

                            if (typeof showCustomAlert === 'function') {
                                showCustomAlert(
                                    "Chá»‘t sá»• tá»± Ä‘á»™ng",
                                    `ÄÃ£ Ä‘áº¿n giá» chá»‘t sá»• (${targetTime}). Há»‡ thá»‘ng Ä‘Ã£ tá»± Ä‘á»™ng chá»‘t sá»• vÃ  lÆ°u trá»¯ dá»¯ liá»‡u ngÃ y ${res.closedDate || ''} vÃ o Lá»‹ch sá»­. Báº£ng lá»‹ch trÃ¬nh Ä‘Ã£ sáºµn sÃ ng cho ngÃ y má»›i!`,
                                    "â°",
                                    "#10b981"
                                );
                            }
                        } else if (res && res.status === 'success') {
                            console.log("[Client Auto-ChotSo]: Äá»“ng bá»™ kiá»ƒm tra chá»‘t sá»• tá»± Ä‘á»™ng vá»›i mÃ¡y chá»§ thÃ nh cÃ´ng.");
                        }
                    }, () => {});
                }
            }
        } catch(e) {}
    }, 30000);
})();

/* ============================================================
   ðŸ’Ž Há»† THá»NG GÃ“I Báº¢N QUYá»€N, DÃ™NG THá»¬ & GIA Háº N (SAAS LICENSING)
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
    // Bá» dáº¥u tiáº¿ng Viá»‡t vÃ  kÃ½ tá»± Ä‘áº·c biá»‡t
    let slug = name.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[Ä‘Ä]/g, 'd')
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
            errDiv.innerText = 'Vui lÃ²ng nháº­p TÃªn bá»‡nh viá»‡n/phÃ²ng khÃ¡m vÃ  MÃ£ Ä‘Æ¡n vá»‹!';
            errDiv.style.display = 'block';
        }
        return;
    }

    if (!/^[a-z0-9_-]{3,30}$/.test(code)) {
        if (errDiv) {
            errDiv.innerText = 'MÃ£ Ä‘Æ¡n vá»‹ chá»‰ chá»©a chá»¯ thÆ°á»ng khÃ´ng dáº¥u, sá»‘, dáº¥u gáº¡ch ná»‘i (3-30 kÃ½ tá»±)!';
            errDiv.style.display = 'block';
        }
        return;
    }

    if (!password || password.length < 4) {
        if (errDiv) {
            errDiv.innerText = 'Máº­t kháº©u quáº£n trá»‹ pháº£i cÃ³ Ã­t nháº¥t 4 kÃ½ tá»±!';
            errDiv.style.display = 'block';
        }
        return;
    }

    if (errDiv) errDiv.style.display = 'none';
    if (btn) {
        btn.innerText = 'â³ Äang khá»Ÿi táº¡o Ä‘Æ¡n vá»‹...';
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
                btn.innerText = 'ðŸš€ KÃ­ch Hoáº¡t DÃ¹ng Thá»­ 15 NgÃ y';
                btn.disabled = false;
            }
            if (!res || !res.success) {
                if (errDiv) {
                    errDiv.innerText = res && res.error ? res.error : 'ÄÄƒng kÃ½ khÃ´ng thÃ nh cÃ´ng. Vui lÃ²ng thá»­ láº¡i!';
                    errDiv.style.display = 'block';
                }
                return;
            }

            // ÄÄƒng kÃ½ thÃ nh cÃ´ng -> Tá»± Ä‘á»™ng Ä‘Äƒng nháº­p
            window.closeTrialRegisterModal();
            const token = res.token;
            if (token) localStorage.setItem('pm_jwt_token', token);
            localStorage.setItem('pm_unit_code', code);
            localStorage.setItem('pm_unit_name', name);
            localStorage.setItem('pm_plan_tier', 'TRIAL_15D');
            localStorage.setItem('pm_plan_name', 'DÃ¹ng thá»­ 15 ngÃ y');
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

            // ÄÃ³ng login overlay
            const overlay = document.getElementById('login-overlay');
            if (overlay) overlay.style.display = 'none';
            const userMenu = document.getElementById('user-menu-container');
            const displayName = document.getElementById('user-display-name');
            if (userMenu) userMenu.style.display = 'flex';
            if (displayName) displayName.innerText = 'ðŸ‘¤ admin';

            if (typeof window.applyPermissions === 'function') window.applyPermissions('Admin', 'all');
            if (typeof window.updateAppHeader === 'function') window.updateAppHeader(code, 'Admin');
            if (typeof window.updateSubscriptionHeaderBadge === 'function') {
                window.updateSubscriptionHeaderBadge('TRIAL_15D', res.tenant?.expires_at, 'DÃ¹ng thá»­ 15 ngÃ y', 15);
            }

            // Táº£i dá»¯ liá»‡u máº«u
            if (typeof window.loadBootstrapData === 'function') {
                window.loadBootstrapData(true);
            }

            alert(`ðŸŽ‰ CHÃšC Má»ªNG!\n\nÄÆ¡n vá»‹ "${name}" Ä‘Ã£ Ä‘Æ°á»£c kÃ­ch hoáº¡t gÃ³i DÃ¹ng Thá»­ 15 NgÃ y Miá»…n PhÃ­ (Full 100% Chá»©c NÄƒng)!\n\nâ€¢ MÃ£ Ä‘Æ¡n vá»‹: ${code}\nâ€¢ TÃªn Ä‘Äƒng nháº­p: admin\nâ€¢ Máº­t kháº©u: ${password}\n\nHá»‡ thá»‘ng Ä‘Ã£ táº¡o sáºµn danh má»¥c thá»§ thuáº­t vÃ  phÃ²ng Ä‘iá»u trá»‹ chuáº©n Bá»™ Y Táº¿. Báº¡n cÃ³ thá»ƒ báº¯t Ä‘áº§u xáº¿p lá»‹ch ngay!`);
        }, err => {
            if (btn) {
                btn.innerText = 'ðŸš€ KÃ­ch Hoáº¡t DÃ¹ng Thá»­ 15 NgÃ y';
                btn.disabled = false;
            }
            if (errDiv) {
                errDiv.innerText = 'Lá»—i káº¿t ná»‘i mÃ¡y chá»§: ' + (err && err.message ? err.message : String(err));
                errDiv.style.display = 'block';
            }
        });
    } else {
        alert('Lá»—i: Há»‡ thá»‘ng chÆ°a sáºµn sÃ ng káº¿t ná»‘i API.');
        if (btn) { btn.innerText = 'ðŸš€ KÃ­ch Hoáº¡t DÃ¹ng Thá»­ 15 NgÃ y'; btn.disabled = false; }
    }
};

// ============================================================
// ðŸ’³ Há»† THá»NG THANH TOÃN VIETQR & Tá»° Äá»˜NG NÃ‚NG Cáº¤P GÃ“I SAAS
// ============================================================

window.copyPaymentText = function (text, label) {
    if (!text) return;
    const str = String(text).trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(() => {
            if (typeof showToast === 'function') {
                showToast(`ÄÃ£ sao chÃ©p ${label || 'thÃ´ng tin'}: ${str}`, 'success');
            } else {
                alert(`ÄÃ£ sao chÃ©p ${label || 'thÃ´ng tin'}: ${str}`);
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
                showToast(`ÄÃ£ sao chÃ©p ${lbl || 'thÃ´ng tin'}: ${val}`, 'success');
            } else {
                alert(`ÄÃ£ sao chÃ©p: ${val}`);
            }
        } catch (e) {
            prompt(`Vui lÃ²ng sao chÃ©p ${lbl || 'thÃ´ng tin'} thá»§ cÃ´ng:`, val);
        }
    }
};

// ============================================================
// ðŸ“„ MODAL ÄIá»€N THÃ”NG TIN BÃŠN A CHO Há»¢P Äá»’NG & GIáº¤Y CHá»¨NG NHáº¬N
// ============================================================
window.openContractPartyAModal = function (optPlanCode, optUnitCode, optUnitName, optExpiresAt) {
    const unitCode = String(optUnitCode || localStorage.getItem('pm_unit_code') || 'bvtks-cs2').trim().toLowerCase();
    let sess = {};
    try { sess = JSON.parse(localStorage.getItem('meds_session') || '{}'); } catch (e) {}

    const unitName = optUnitName ? decodeURIComponent(optUnitName) : (sess.unit_name || localStorage.getItem('pm_unit_name') || `Bá»‡nh viá»‡n / PhÃ²ng khÃ¡m ${unitCode.toUpperCase()}`);
    const planCode = String(optPlanCode || window._currentSelectedPlan || localStorage.getItem('pm_plan_tier') || sess.plan_tier || 'PLAN_1Y').toUpperCase();

    window._contractTargetPlan = planCode;
    window._contractTargetUnit = unitCode;
    window._contractTargetUnitName = unitName;
    window._contractTargetExpires = optExpiresAt || '';

    // Äá»c thÃ´ng tin BÃªn A Ä‘Ã£ lÆ°u trÆ°á»›c Ä‘Ã³ náº¿u cÃ³
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
    const fallbackName = window._contractTargetUnitName || `Bá»‡nh viá»‡n / PhÃ²ng khÃ¡m ${unitCode.toUpperCase()}`;
    const unitName = (document.getElementById('c-pa-unit-name')?.value || '').trim() || fallbackName;
    const representative = (document.getElementById('c-pa-rep')?.value || '').trim();
    const position = (document.getElementById('c-pa-pos')?.value || '').trim();
    const address = (document.getElementById('c-pa-addr')?.value || '').trim();
    const taxCode = (document.getElementById('c-pa-tax')?.value || '').trim();
    const phone = (document.getElementById('c-pa-phone')?.value || '').trim();

    const partyAInfo = {
        unitName,
        representative: representative || 'Ban GiÃ¡m Äá»‘c / TrÆ°á»Ÿng Ä‘Æ¡n vá»‹',
        position: position || 'Äáº¡i diá»‡n theo phÃ¡p luáº­t',
        address: address || 'Trá»¥ sá»Ÿ Ä‘Æ¡n vá»‹ y táº¿',
        taxCode,
        phone
    };

    // LÆ°u vÃ o localStorage
    try {
        localStorage.setItem('pm_contract_party_a_' + unitCode, JSON.stringify(partyAInfo));
        localStorage.setItem('pm_unit_name', unitName);
    } catch (e) {}

    window.closeContractPartyAModal();

    // Táº£i file PDF
    window.downloadLicenseContractPDF(
        unitCode,
        window._contractTargetPlan,
        encodeURIComponent(unitName),
        window._contractTargetExpires,
        partyAInfo
    );
};

// ============================================================
// ðŸ“„ XUáº¤T Há»¢P Äá»’NG & GIáº¤Y CHá»¨NG NHáº¬N Báº¢N QUYá»€N PDF (CHUáº¨N MáºªU MEDS DOCX)
// ============================================================
window.downloadLicenseContractPDF = function (optUnitCode, optPlanCode, optUnitName, optExpiresAt, optPartyAInfo) {
    if (typeof pdfMake === 'undefined') {
        return alert("ThÆ° viá»‡n pdfmake Ä‘ang Ä‘Æ°á»£c khá»Ÿi táº¡o, vui lÃ²ng báº¥m láº¡i sau 1-2 giÃ¢y!");
    }

    const unitCode = String(optUnitCode || localStorage.getItem('pm_unit_code') || 'bvtks-cs2').trim().toLowerCase();
    let sess = {};
    try { sess = JSON.parse(localStorage.getItem('meds_session') || '{}'); } catch (e) {}

    const rawUnitName = optUnitName ? decodeURIComponent(optUnitName) : (sess.unit_name || localStorage.getItem('pm_unit_name') || `Bá»‡nh viá»‡n / PhÃ²ng khÃ¡m ${unitCode.toUpperCase()}`);
    const planCode = String(optPlanCode || window._currentSelectedPlan || localStorage.getItem('pm_plan_tier') || sess.plan_tier || 'PLAN_1Y').toUpperCase();

    // Láº¥y thÃ´ng tin BÃªn A Ä‘Ã£ nháº­p hoáº·c láº¥y tá»« cache
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
            representative: 'Ban GiÃ¡m Äá»‘c / TrÆ°á»Ÿng Ä‘Æ¡n vá»‹',
            position: 'Äáº¡i diá»‡n theo phÃ¡p luáº­t',
            address: 'Trá»¥ sá»Ÿ Ä‘Æ¡n vá»‹ y táº¿',
            taxCode: '',
            phone: localStorage.getItem('pm_phone') || ''
        };
    }
    const unitName = partyA.unitName || rawUnitName;

    const planCatalog = {
        'TRIAL_15D': { name: 'GÃ³i DÃ¹ng Thá»­ 15 NgÃ y', duration: '15 ngÃ y', days: 15, price: '0 VNÄ', priceText: 'KhÃ´ng Ä‘á»“ng (Tráº£i nghiá»‡m miá»…n phÃ­)' },
        'PLAN_1M': { name: 'GÃ³i 1 ThÃ¡ng', duration: '01 thÃ¡ng (30 ngÃ y)', days: 30, price: '400.000 VNÄ', priceText: 'Bá»‘n trÄƒm nghÃ¬n Ä‘á»“ng' },
        'PLAN_3M': { name: 'GÃ³i 3 ThÃ¡ng', duration: '03 thÃ¡ng (90 ngÃ y)', days: 90, price: '1.125.000 VNÄ', priceText: 'Má»™t triá»‡u má»™t trÄƒm hai mÆ°Æ¡i lÄƒm nghÃ¬n Ä‘á»“ng' },
        'PLAN_6M': { name: 'GÃ³i 6 ThÃ¡ng', duration: '06 thÃ¡ng (180 ngÃ y)', days: 180, price: '2.100.000 VNÄ', priceText: 'Hai triá»‡u má»™t trÄƒm nghÃ¬n Ä‘á»“ng' },
        'PLAN_1Y': { name: 'GÃ³i 1 NÄƒm', duration: '01 nÄƒm (365 ngÃ y)', days: 365, price: '3.900.000 VNÄ', priceText: 'Ba triá»‡u chÃ­n trÄƒm nghÃ¬n Ä‘á»“ng' },
        'ENTERPRISE': { name: 'GÃ³i Doanh Nghiá»‡p Äáº·c Biá»‡t (VÄ©nh Viá»…n)', duration: 'VÄ©nh viá»…n trá»n Ä‘á»i', days: 99999, price: 'Sá»Ÿ Há»¯u Trá»n Äá»i', priceText: 'Sá»Ÿ há»¯u trá»n Ä‘á»i' }
    };

    const targetPlan = planCatalog[planCode] || planCatalog['PLAN_1Y'];
    const now = new Date();
    const curDay = String(now.getDate()).padStart(2, '0');
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const curYear = now.getFullYear();
    const startDateVN = `${curDay}/${curMonth}/${curYear}`;

    // TÃ­nh toÃ¡n thá»i háº¡n há»£p Ä‘á»“ng vÃ  chá»©ng nháº­n chÃ­nh xÃ¡c cho gÃ³i cÆ°á»›c Ä‘Æ°á»£c cáº¥p
    let endDateVN = '';
    let certDurationDisplay = '';
    let contractDurationDisplay = '';

    if (unitCode === 'bvtks-cs2' || planCode === 'ENTERPRISE') {
        endDateVN = '31/12/2099';
        certDurationDisplay = 'ðŸ’Ž VÄ©nh Viá»…n Trá»n Äá»i (Äáº¿n 31/12/2099)';
        contractDurationDisplay = `Hiá»‡u lá»±c vÄ©nh viá»…n trá»n Ä‘á»i ká»ƒ tá»« ngÃ y kÃ½/kÃ­ch hoáº¡t (ngÃ y ${startDateVN}).`;
    } else {
        const storedPlan = localStorage.getItem('pm_plan_tier') || sess.plan_tier || '';
        const storedExp = localStorage.getItem('pm_expires_at') || sess.expires_at || '';

        let targetEndObj = new Date(now.getTime());

        // Æ¯u tiÃªn ngÃ y chá»‰ Ä‘á»‹nh trá»±c tiáº¿p tá»« Super Admin náº¿u cÃ³
        if (optExpiresAt) {
            const optExpParsed = new Date(optExpiresAt);
            if (!isNaN(optExpParsed.getTime())) {
                targetEndObj = optExpParsed;
            }
        } else if (storedPlan === planCode && storedExp) {
            // ÄÆ¡n vá»‹ Ä‘Ã£ thanh toÃ¡n vÃ  Ä‘ang á»Ÿ Ä‘Ãºng gÃ³i cÆ°á»›c nÃ y
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
            // Äang láº­p há»£p Ä‘á»“ng Ä‘Äƒng kÃ½ má»›i hoáº·c nÃ¢ng cáº¥p tá»« DÃ¹ng thá»­ sang gÃ³i tráº£ phÃ­:
            // TÃ­nh chuáº©n xÃ¡c thá»i háº¡n báº¯t Ä‘áº§u tá»« hÃ´m nay (hoáº·c ná»‘i tiáº¿p gÃ³i tráº£ phÃ­ cÅ© náº¿u cÃ²n háº¡n)
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
        certDurationDisplay = `Äáº¿n ngÃ y: ${endDateVN}`;
        contractDurationDisplay = `Há»£p Ä‘á»“ng cÃ³ hiá»‡u lá»±c ká»ƒ tá»« ngÃ y kÃ­ch hoáº¡t/thanh toÃ¡n (ngÃ y ${startDateVN}) Ä‘áº¿n háº¿t ngÃ y ${endDateVN} (Tá»•ng thá»i gian: ${targetPlan.duration}).`;
    }

    const certNumber = `TIMS-LIC/${curYear}/${unitCode.toUpperCase()}`;
    const contractNumber = `${now.getMonth() + 1}${now.getDate()}/HÄDV/${curYear}`;

    // XÃ¢y dá»±ng tÃ i liá»‡u PDF gá»“m 4 trang chuyÃªn nghiá»‡p theo máº«u hop-dong-dich-vu-meds.docx
    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [35, 25, 35, 25],
        content: [
            // ==========================================
            // TRANG 1: GIáº¤Y CHá»¨NG NHáº¬N Cáº¤P QUYá»€N Sá»¬ Dá»¤NG Báº¢N QUYá»€N
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
                                                { text: 'Cá»˜NG HÃ’A XÃƒ Há»˜I CHá»¦ NGHÄ¨A VIá»†T NAM', fontSize: 10, bold: true, alignment: 'center' },
                                                { text: 'Äá»™c láº­p - Tá»± do - Háº¡nh phÃºc', fontSize: 10, italic: true, alignment: 'center', margin: [0, 2, 0, 2] },
                                                { canvas: [{ type: 'line', x1: 165, y1: 0, x2: 295, y2: 0, lineWidth: 0.8, lineColor: '#334155' }] }
                                            ]
                                        }
                                    ],
                                    margin: [0, 0, 0, 8]
                                },
                                { text: 'Há»† THá»NG PHáº¦N Má»€M Xáº¾P Lá»ŠCH ÄIá»€U TRá»Š YHCT - PHCN (T.I.M.E.S SYSTEM)', fontSize: 9.5, bold: true, color: '#1e40af', alignment: 'center', margin: [0, 0, 0, 2] },
                                { text: 'Ná»n Táº£ng Quáº£n LÃ½ & Tá»‘i Æ¯u HÃ³a Lá»‹ch KhÃ¡m Chá»¯a Bá»‡nh ThÃ´ng Minh (Multi-Tenant SaaS Cloud)', fontSize: 8.5, italic: true, color: '#64748b', alignment: 'center', margin: [0, 0, 0, 8] },

                                { text: 'GIáº¤Y XÃC NHáº¬N Cáº¤P QUYá»€N Sá»¬ Dá»¤NG Báº¢N QUYá»€N PHáº¦N Má»€M', fontSize: 13.5, bold: true, color: '#0f172a', alignment: 'center', margin: [0, 4, 0, 2] },
                                { text: 'CERTIFICATE OF SOFTWARE LICENSE & SAAS SERVICE', fontSize: 8.5, bold: true, color: '#2563eb', alignment: 'center', margin: [0, 0, 0, 4] },
                                { text: `Sá»‘ chá»©ng nháº­n: ${certNumber}`, fontSize: 9, italic: true, alignment: 'center', color: '#475569', margin: [0, 0, 0, 8] },

                                {
                                    text: [
                                        { text: 'CÄƒn cá»© phÃ¡p lÃ½: ', bold: true },
                                        'CÄƒn cá»© Bá»™ luáº­t DÃ¢n sá»± sá»‘ 91/2015/QH13; Luáº­t ThÆ°Æ¡ng máº¡i sá»‘ 36/2005/QH11; Luáº­t CÃ´ng nghá»‡ thÃ´ng tin sá»‘ 67/2006/QH11; Luáº­t Sá»Ÿ há»¯u trÃ­ tuá»‡ sá»‘ 50/2005/QH11 (sá»­a Ä‘á»•i, bá»• sung nÄƒm 2022); Nghá»‹ Ä‘á»‹nh sá»‘ 123/2020/NÄ-CP vÃ  ThÃ´ng tÆ° sá»‘ 219/2013/TT-BTC cá»§a Bá»™ TÃ i chÃ­nh quy Ä‘á»‹nh dá»‹ch vá»¥ pháº§n má»m khÃ´ng chá»‹u thuáº¿ GTGT.'
                                    ],
                                    fontSize: 8.5,
                                    color: '#475569',
                                    lineHeight: 1.3,
                                    margin: [0, 0, 0, 8]
                                },

                                // Báº£ng thÃ´ng tin báº£n quyá»n
                                {
                                    table: {
                                        widths: [130, '*'],
                                        body: [
                                            [
                                                { text: 'ÄÆ¡n Vá»‹ Thá»¥ HÆ°á»Ÿng:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: unitName, bold: true, fontSize: 10, color: '#1e3a8a' }
                                            ],
                                            [
                                                { text: 'MÃ£ Äá»‹nh Danh (Slug):', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: unitCode.toUpperCase(), fontSize: 9.5, bold: true, color: '#2563eb' }
                                            ],
                                            [
                                                { text: 'GÃ³i Báº£n Quyá»n Cáº¥p:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: `${targetPlan.name} (${targetPlan.duration})`, fontSize: 9.5, bold: true, color: '#15803d' }
                                            ],
                                            [
                                                { text: 'Thá»i Háº¡n Sá»­ Dá»¥ng:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: certDurationDisplay, fontSize: 9.5, bold: true, color: '#0f172a' }
                                            ],
                                            [
                                                { text: 'Pháº¡m Vi Cáº¥p Quyá»n:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: 'ToÃ n quyá»n sá»­ dá»¥ng Full 100% tÃ­nh nÄƒng trá»±c tuyáº¿n qua Web SaaS (khÃ´ng giá»›i háº¡n sá»‘ lÆ°á»£ng Bá»‡nh nhÃ¢n, Ká»¹ thuáº­t viÃªn, MÃ¡y mÃ³c, PhÃ²ng bá»‡nh). Bao gá»“m thuáº­t toÃ¡n AI & CP-SAT Solver tá»‘i Æ°u giá» thá»§ thuáº­t, sao lÆ°u tá»± Ä‘á»™ng vÃ  phÃ¢n tÃ­ch thá»‘ng kÃª.', fontSize: 8.5, color: '#334155' }
                                            ],
                                            [
                                                { text: 'ÄÆ¡n Vá»‹ Cáº¥p Báº£n Quyá»n:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: 'BS. Äáº·ng Phong ThÃ¡i (TÃ¡c giáº£ & Ká»¹ sÆ° trÆ°á»Ÿng phÃ¡t triá»ƒn há»‡ thá»‘ng pháº§n má»m T.I.M.E.S)', fontSize: 9.5, bold: true }
                                            ],
                                            [
                                                { text: 'ThÃ´ng Tin TÃ i Khoáº£n MB:', bold: true, fontSize: 9.5, fillColor: '#f1f5f9' },
                                                { text: 'NgÃ¢n hÃ ng TMCP QuÃ¢n Äá»™i (MB Bank) - STK: 0392283473 - Chá»§ TK: Äáº¶NG PHONG THÃI', fontSize: 9, bold: true, color: '#1d4ed8' }
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
                                    text: 'XÃC NHáº¬N: Pháº§n má»m T.I.M.E.S Ä‘Æ°á»£c cáº¥p phÃ©p sá»­ dá»¥ng trá»±c tuyáº¿n Ä‘á»™c láº­p theo tá»«ng Ä‘Æ¡n vá»‹ y táº¿, mÃ£ hÃ³a vÃ  báº£o máº­t dá»¯ liá»‡u tuyá»‡t Ä‘á»‘i. Giáº¥y xÃ¡c nháº­n nÃ y lÃ  chá»©ng tá»« cÄƒn cá»© phá»¥c vá»¥ Ä‘á»‘i soÃ¡t, kÃ­ch hoáº¡t báº£n quyá»n vÃ  káº¹p chá»©ng tá»« thanh toÃ¡n ngÃ¢n hÃ ng háº¡ch toÃ¡n chi phÃ­ ná»™i bá»™ há»£p lá»‡ cá»§a ÄÆ¡n vá»‹.',
                                    fontSize: 8,
                                    italic: true,
                                    color: '#475569',
                                    margin: [0, 0, 0, 10]
                                },

                                // KÃ½ tÃªn hai bÃªn
                                {
                                    columns: [
                                        {
                                            width: '*',
                                            alignment: 'center',
                                            stack: [
                                                { text: 'Äáº I DIá»†N ÄÆ N Vá»Š THá»¤ HÆ¯á»žNG', fontSize: 9.5, bold: true, color: '#0f172a' },
                                                { text: '(KÃ½, ghi rÃµ há» tÃªn & Ä‘Ã³ng dáº¥u)', fontSize: 8, italic: true, color: '#64748b' },
                                                { text: '\n\n\n' },
                                                { text: partyA.representative || unitName, fontSize: 9.5, bold: true }
                                            ]
                                        },
                                        {
                                            width: '*',
                                            alignment: 'center',
                                            stack: [
                                                { text: `NgÃ y ${curDay} thÃ¡ng ${curMonth} nÄƒm ${curYear}`, fontSize: 8.5, italic: true, color: '#475569', margin: [0, 0, 0, 2] },
                                                { text: 'TÃC GIáº¢ & Äáº I DIá»†N Há»† THá»NG T.I.M.E.S', fontSize: 9.5, bold: true, color: '#1e40af' },
                                                { text: '(ÄÃ£ xÃ¡c thá»±c chá»¯ kÃ½ sá»‘ Ä‘iá»‡n tá»­)', fontSize: 8, italic: true, color: '#16a34a' },
                                                { text: 'â˜… VALID CERTIFIED LICENSE â˜…', fontSize: 8.5, bold: true, color: '#15803d', margin: [0, 4, 0, 4] },
                                                { text: '\n' },
                                                { text: 'BS. Äáº¶NG PHONG THÃI', fontSize: 9.5, bold: true, color: '#0f172a' },
                                                { text: 'SÄT / Zalo: 0392.283.473', fontSize: 8, color: '#64748b' }
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
            // TRANG 2 & 3: Há»¢P Äá»’NG Dá»ŠCH Vá»¤ (THEO MáºªU MEDS)
            // ==========================================
            {
                pageBreak: 'before',
                stack: [
                    {
                        columns: [
                            {
                                width: '*',
                                stack: [
                                    { text: 'Cá»˜NG HÃ’A XÃƒ Há»˜I CHá»¦ NGHÄ¨A VIá»†T NAM', fontSize: 10.5, bold: true, alignment: 'center' },
                                    { text: 'Äá»™c láº­p - Tá»± do - Háº¡nh phÃºc', fontSize: 10, italic: true, alignment: 'center', margin: [0, 2, 0, 2] },
                                    { canvas: [{ type: 'line', x1: 170, y1: 0, x2: 290, y2: 0, lineWidth: 0.8, lineColor: '#334155' }] }
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 10]
                    },
                    { text: 'Há»¢P Äá»’NG Dá»ŠCH Vá»¤ PHáº¦N Má»€M', fontSize: 13, bold: true, color: '#0f172a', alignment: 'center', margin: [0, 4, 0, 2] },
                    { text: `Sá»‘: ${contractNumber}`, fontSize: 9.5, italic: true, alignment: 'center', color: '#475569', margin: [0, 0, 0, 6] },

                    {
                        text: [
                            { text: 'CÄƒn cá»© phÃ¡p lÃ½:\n', bold: true },
                            '- Bá»™ luáº­t DÃ¢n sá»± sá»‘ 91/2015/QH13 ngÃ y 24/11/2015;\n',
                            '- Luáº­t ThÆ°Æ¡ng máº¡i sá»‘ 36/2005/QH11 ngÃ y 14/06/2005;\n',
                            '- Luáº­t CÃ´ng nghá»‡ thÃ´ng tin sá»‘ 67/2006/QH11 ngÃ y 29/06/2006;\n',
                            '- Luáº­t Sá»Ÿ há»¯u trÃ­ tuá»‡ sá»‘ 50/2005/QH11 (sá»­a Ä‘á»•i, bá»• sung 2022);\n',
                            '- Nhu cáº§u sá»­ dá»¥ng dá»‹ch vá»¥ cá»§a BÃªn A vÃ  nÄƒng lá»±c cung cáº¥p cá»§a BÃªn B;'
                        ],
                        fontSize: 8.5,
                        color: '#475569',
                        lineHeight: 1.25,
                        margin: [0, 0, 0, 8]
                    },
                    { text: 'CÃ¡c bÃªn thá»‘ng nháº¥t kÃ½ káº¿t Há»£p Ä‘á»“ng vá»›i cÃ¡c Ä‘iá»u khoáº£n sau:', fontSize: 9, italic: true, margin: [0, 0, 0, 6] },

                    // Äiá»u 1. CÃ¡c bÃªn trong há»£p Ä‘á»“ng
                    { text: 'Äiá»u 1. CÃ¡c bÃªn trong há»£p Ä‘á»“ng', fontSize: 9.5, bold: true, color: '#1e3a8a', margin: [0, 0, 0, 4] },
                    {
                        table: {
                            widths: ['50%', '50%'],
                            body: [
                                [
                                    {
                                        fillColor: '#f8fafc',
                                        stack: [
                                            { text: '1. BÃŠN A (BÃªn sá»­ dá»¥ng dá»‹ch vá»¥):', bold: true, fontSize: 9, color: '#0f172a', margin: [0, 0, 0, 2] },
                                            { text: `â€¢ TÃªn Ä‘Æ¡n vá»‹: ${unitName}`, fontSize: 8.5, bold: true },
                                            { text: `â€¢ MÃ£ Ä‘Æ¡n vá»‹ (Slug): ${unitCode.toUpperCase()}`, fontSize: 8.5 },
                                            { text: `â€¢ Äáº¡i diá»‡n: ${partyA.representative || 'Ban GiÃ¡m Äá»‘c / TrÆ°á»Ÿng Ä‘Æ¡n vá»‹'}`, fontSize: 8.5 },
                                            { text: `â€¢ Chá»©c vá»¥: ${partyA.position || 'Äáº¡i diá»‡n theo phÃ¡p luáº­t'}`, fontSize: 8.5 },
                                            { text: `â€¢ Äá»‹a chá»‰: ${partyA.address || 'Trá»¥ sá»Ÿ Ä‘Æ¡n vá»‹ y táº¿'}`, fontSize: 8.5 },
                                            ...(partyA.taxCode ? [{ text: `â€¢ MÃ£ sá»‘ thuáº¿: ${partyA.taxCode}`, fontSize: 8.5 }] : []),
                                            ...(partyA.phone ? [{ text: `â€¢ Äiá»‡n thoáº¡i: ${partyA.phone}`, fontSize: 8.5 }] : [])
                                        ]
                                    },
                                    {
                                        fillColor: '#f8fafc',
                                        stack: [
                                            { text: '2. BÃŠN B (BÃªn cung cáº¥p dá»‹ch vá»¥):', bold: true, fontSize: 9, color: '#15803d', margin: [0, 0, 0, 2] },
                                            { text: 'â€¢ TÃªn Ä‘Æ¡n vá»‹: Há»† THá»NG Xáº¾P Lá»ŠCH T.I.M.E.S', fontSize: 8.5, bold: true },
                                            { text: 'â€¢ Äáº¡i diá»‡n: BS. Äáº¶NG PHONG THÃI', fontSize: 8.5, bold: true },
                                            { text: 'â€¢ Chá»©c vá»¥: TÃ¡c giáº£ & Ká»¹ sÆ° phÃ¡t triá»ƒn', fontSize: 8.5 },
                                            { text: 'â€¢ Äiá»‡n thoáº¡i / Zalo: 0392.283.473', fontSize: 8.5 },
                                            { text: 'â€¢ Email: dpthai.ttytmk@gmail.com', fontSize: 8.5 },
                                            { text: 'â€¢ STK MB Bank: 0392283473 (NgÃ¢n hÃ ng TMCP QuÃ¢n Äá»™i)', fontSize: 8.5, bold: true }
                                        ]
                                    }
                                ]
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, 0, 0, 8]
                    },

                    // Äiá»u 2 & 3
                    { text: 'Äiá»u 2. Äá»‘i tÆ°á»£ng há»£p Ä‘á»“ng', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: 'BÃªn B cung cáº¥p cho BÃªn A quyá»n sá»­ dá»¥ng Dá»‹ch vá»¥ pháº§n má»m quáº£n lÃ½ vÃ  xáº¿p lá»‹ch Ä‘iá»u trá»‹ YHCT - PHCN (T.I.M.E.S System v4 SaaS) theo mÃ´ hÃ¬nh Ä‘iá»‡n toÃ¡n Ä‘Ã¡m mÃ¢y SaaS (Software as a Service) qua Internet táº¡i Ä‘á»‹a chá»‰ https://xeplichthuthuat.io.vn. Pháº¡m vi bao gá»“m: Quyá»n truy cáº­p theo tÃ i khoáº£n do BÃªn B cáº¥p; Cáº­p nháº­t, nÃ¢ng cáº¥p, vÃ¡ lá»—i trong thá»i háº¡n há»£p Ä‘á»“ng; Há»— trá»£ ká»¹ thuáº­t trá»±c tuyáº¿n theo Äiá»u 3.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Äiá»u 3. Pháº¡m vi dá»‹ch vá»¥', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- BÃªn B Ä‘áº£m báº£o dá»‹ch vá»¥ váº­n hÃ nh Ä‘Ãºng chá»©c nÄƒng mÃ´ táº£ táº¡i Phá»¥ lá»¥c II;\n- BÃªn B cung cáº¥p tÃ i liá»‡u Ä‘Ã o táº¡o/hÆ°á»›ng dáº«n sá»­ dá»¥ng cho nhÃ¢n sá»± Ä‘Æ°á»£c chá»‰ Ä‘á»‹nh cá»§a BÃªn A;\n- Há»— trá»£ ká»¹ thuáº­t trá»±c tiáº¿p qua Äiá»‡n thoáº¡i/Zalo/Ultraview 24/7;\n- BÃªn A sá»­ dá»¥ng dá»‹ch vá»¥ cho má»¥c Ä‘Ã­ch chuyÃªn mÃ´n ná»™i bá»™, khÃ´ng chuyá»ƒn giao cho bÃªn thá»© ba khi chÆ°a cÃ³ cháº¥p thuáº­n báº±ng vÄƒn báº£n cá»§a BÃªn B.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Äiá»u 4. Thá»i háº¡n há»£p Ä‘á»“ng', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: `- ${contractDurationDisplay}\n- Há»£p Ä‘á»“ng Ä‘Æ°á»£c tá»± Ä‘á»™ng gia háº¡n hoáº·c kÃ½ phá»¥ lá»¥c/há»£p Ä‘á»“ng má»›i khi háº¿t háº¡n.`, fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Äiá»u 5. GiÃ¡ trá»‹ vÃ  phÆ°Æ¡ng thá»©c thanh toÃ¡n', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: `1. GiÃ¡ trá»‹ dá»‹ch vá»¥: ${targetPlan.price} (Báº±ng chá»¯: ${targetPlan.priceText}) theo Biá»ƒu giÃ¡ táº¡i Phá»¥ lá»¥c I.\n2. Thuáº¿ GTGT: Thuáº¿ suáº¥t 0% (Theo ThÃ´ng tÆ° sá»‘ 219/2013/TT-BTC, sáº£n pháº©m vÃ  dá»‹ch vá»¥ pháº§n má»m thuá»™c Ä‘á»‘i tÆ°á»£ng khÃ´ng chá»‹u thuáº¿ GTGT).\n3. HÃ¬nh thá»©c thanh toÃ¡n: Chuyá»ƒn khoáº£n ngÃ¢n hÃ ng vÃ o tÃ i khoáº£n cá»§a BÃªn B:\n   â€¢ TÃªn tÃ i khoáº£n: Äáº¶NG PHONG THÃI | Sá»‘ tÃ i khoáº£n: 0392283473 | NgÃ¢n hÃ ng: MB Bank (NgÃ¢n hÃ ng TMCP QuÃ¢n Äá»™i).\n4. Thá»i háº¡n thanh toÃ¡n: Thanh toÃ¡n khi Ä‘Äƒng kÃ½/kÃ­ch hoáº¡t hoáº·c theo thá»a thuáº­n cá»¥ thá»ƒ.`, fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Äiá»u 6. Quyá»n vÃ  nghÄ©a vá»¥ cá»§a BÃªn A', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Thanh toÃ¡n Ä‘áº§y Ä‘á»§ vÃ  Ä‘Ãºng háº¡n theo Äiá»u 5;\n- Cung cáº¥p danh má»¥c thá»§ thuáº­t, nhÃ¢n sá»±, mÃ¡y mÃ³c cáº§n thiáº¿t Ä‘á»ƒ triá»ƒn khai dá»‹ch vá»¥;\n- Quáº£n lÃ½ vÃ  báº£o máº­t tÃ i khoáº£n quáº£n trá»‹ Ä‘Æ°á»£c bÃ n giao;\n- KhÃ´ng sao chÃ©p, chá»‰nh sá»­a mÃ£ nguá»“n hoáº·c bÃ¡n láº¡i dá»‹ch vá»¥ khi chÆ°a cÃ³ sá»± cháº¥p thuáº­n cá»§a BÃªn B.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Äiá»u 7. Quyá»n vÃ  nghÄ©a vá»¥ cá»§a BÃªn B', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Cung cáº¥p dá»‹ch vá»¥ Ä‘Ãºng thá»a thuáº­n, há»— trá»£ ká»¹ thuáº­t liÃªn tá»¥c trong thá»i háº¡n há»£p Ä‘á»“ng;\n- Báº£o máº­t tuyá»‡t Ä‘á»‘i dá»¯ liá»‡u cá»§a BÃªn A, khÃ´ng tiáº¿t lá»™ cho bÃªn thá»© ba trá»« khi cÃ³ yÃªu cáº§u báº±ng vÄƒn báº£n cá»§a cÆ¡ quan phÃ¡p luáº­t cÃ³ tháº©m quyá»n;\n- Cung cáº¥p giáº¥y xÃ¡c nháº­n báº£n quyá»n vÃ  chá»©ng tá»« thanh toÃ¡n há»£p lá»‡;\n- ThÃ´ng bÃ¡o trÆ°á»›c cho BÃªn A khi cÃ³ nÃ¢ng cáº¥p lá»›n hoáº·c báº£o trÃ¬ há»‡ thá»‘ng.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Äiá»u 8. Báº£o máº­t thÃ´ng tin vÃ  dá»¯ liá»‡u', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- CÃ¡c BÃªn cam káº¿t báº£o máº­t thÃ´ng tin há»£p Ä‘á»“ng vÃ  dá»¯ liá»‡u bá»‡nh Ã¡n/Ä‘iá»u trá»‹ phÃ¡t sinh;\n- Dá»¯ liá»‡u thuá»™c quyá»n sá»Ÿ há»¯u riÃªng cá»§a BÃªn A. Khi cháº¥m dá»©t há»£p Ä‘á»“ng, BÃªn B sáº½ xuáº¥t báº£n sao dá»¯ liá»‡u (JSON/Excel) giao láº¡i cho BÃªn A náº¿u cÃ³ yÃªu cáº§u.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Äiá»u 9. Cháº¥m dá»©t há»£p Ä‘á»“ng & Äiá»u 10. Giáº£i quyáº¿t tranh cháº¥p', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Há»£p Ä‘á»“ng cháº¥m dá»©t khi háº¿t thá»i háº¡n mÃ  khÃ´ng gia háº¡n, hoáº·c hai bÃªn cÃ¹ng thá»a thuáº­n cháº¥m dá»©t trÆ°á»›c háº¡n.\n- Má»i tranh cháº¥p phÃ¡t sinh Ä‘Æ°á»£c Æ°u tiÃªn giáº£i quyáº¿t qua thÆ°Æ¡ng lÆ°á»£ng, hÃ²a giáº£i trÃªn tinh tháº§n há»£p tÃ¡c thiá»‡n chÃ­ y táº¿. Náº¿u khÃ´ng Ä‘áº¡t thá»a thuáº­n, tranh cháº¥p sáº½ Ä‘Æ°á»£c giáº£i quyáº¿t táº¡i TÃ²a Ã¡n nhÃ¢n dÃ¢n cÃ³ tháº©m quyá»n theo phÃ¡p luáº­t Viá»‡t Nam.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 5] },

                    { text: 'Äiá»u 11. Äiá»u khoáº£n chung', fontSize: 9.5, bold: true, color: '#0f172a' },
                    { text: '- Há»£p Ä‘á»“ng cÃ³ hiá»‡u lá»±c ká»ƒ tá»« ngÃ y kÃ½/kÃ­ch hoáº¡t thanh toÃ¡n.\n- Há»£p Ä‘á»“ng gá»“m Ä‘áº§y Ä‘á»§ cÃ¡c trang vÃ  cÃ¡c Phá»¥ lá»¥c I, Phá»¥ lá»¥c II lÃ  pháº§n khÃ´ng thá»ƒ tÃ¡ch rá»i cá»§a Há»£p Ä‘á»“ng nÃ y. Báº£n Ä‘iá»‡n tá»­ cÃ³ giÃ¡ trá»‹ phÃ¡p lÃ½ tÆ°Æ¡ng Ä‘Æ°Æ¡ng báº£n gá»‘c.', fontSize: 8.5, color: '#334155', margin: [0, 2, 0, 10] },

                    // KÃ½ tÃªn há»£p Ä‘á»“ng
                    {
                        columns: [
                            {
                                width: '*',
                                alignment: 'center',
                                stack: [
                                    { text: 'Äáº I DIá»†N BÃŠN A', fontSize: 9.5, bold: true },
                                    { text: '(KÃ½, Ä‘Ã³ng dáº¥u vÃ  ghi rÃµ há» tÃªn)', fontSize: 8, italic: true, color: '#64748b' },
                                    { text: '\n\n\n' },
                                    { text: (partyA.representative && partyA.representative !== 'Ban GiÃ¡m Äá»‘c / TrÆ°á»Ÿng Ä‘Æ¡n vá»‹') ? `${partyA.representative}\n(${unitName})` : unitName, fontSize: 9.5, bold: true }
                                ]
                            },
                            {
                                width: '*',
                                alignment: 'center',
                                stack: [
                                    { text: 'Äáº I DIá»†N BÃŠN B', fontSize: 9.5, bold: true, color: '#1e40af' },
                                    { text: '(KÃ½, ghi rÃµ há» tÃªn)', fontSize: 8, italic: true, color: '#64748b' },
                                    { text: '\n\n\n' },
                                    { text: 'BS. Äáº¶NG PHONG THÃI', fontSize: 10, bold: true }
                                ]
                            }
                        ]
                    }
                ]
            },

            // ==========================================
            // TRANG 4: PHá»¤ Lá»¤C I (Báº¢NG GIÃ) & PHá»¤ Lá»¤C II (MÃ” Táº¢ TÃNH NÄ‚NG)
            // ==========================================
            {
                pageBreak: 'before',
                stack: [
                    { text: 'PHá»¤ Lá»¤C I: Báº¢NG GIÃ Dá»ŠCH Vá»¤ PHáº¦N Má»€M T.I.M.E.S NÄ‚M 2026', fontSize: 11, bold: true, color: '#1e3a8a', alignment: 'center', margin: [0, 0, 0, 4] },
                    { text: `(KÃ¨m theo Há»£p Ä‘á»“ng dá»‹ch vá»¥ sá»‘ ${contractNumber} giá»¯a ${unitName} vÃ  Há»‡ thá»‘ng T.I.M.E.S)`, fontSize: 8.5, italic: true, alignment: 'center', color: '#64748b', margin: [0, 0, 0, 8] },

                    // Báº£ng biá»ƒu phÃ­ chuáº©n
                    {
                        table: {
                            widths: [30, 160, 100, 70, '*'],
                            body: [
                                [
                                    { text: 'STT', bold: true, fontSize: 8.5, alignment: 'center', fillColor: '#f1f5f9' },
                                    { text: 'TÃªn GÃ³i Dá»‹ch Vá»¥', bold: true, fontSize: 8.5, fillColor: '#f1f5f9' },
                                    { text: 'Thá»i Háº¡n', bold: true, fontSize: 8.5, alignment: 'center', fillColor: '#f1f5f9' },
                                    { text: 'ÄÆ¡n GiÃ¡ (VNÄ)', bold: true, fontSize: 8.5, alignment: 'right', fillColor: '#f1f5f9' },
                                    { text: 'Chá»n ÄÄƒng KÃ½', bold: true, fontSize: 8.5, alignment: 'center', fillColor: '#f1f5f9' }
                                ],
                                [
                                    { text: '1', fontSize: 8.5, alignment: 'center' },
                                    { text: 'GÃ³i DÃ¹ng Thá»­ 15 NgÃ y', fontSize: 8.5 },
                                    { text: '15 ngÃ y tráº£i nghiá»‡m', fontSize: 8.5, alignment: 'center' },
                                    { text: '0 VNÄ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'TRIAL_15D' ? 'â˜‘ ÄÃƒ CHá»ŒN' : 'â˜', fontSize: 8.5, alignment: 'center', bold: planCode === 'TRIAL_15D', color: planCode === 'TRIAL_15D' ? '#15803d' : '#94a3b8' }
                                ],
                                [
                                    { text: '2', fontSize: 8.5, alignment: 'center' },
                                    { text: 'GÃ³i 1 ThÃ¡ng', fontSize: 8.5 },
                                    { text: '01 thÃ¡ng (30 ngÃ y)', fontSize: 8.5, alignment: 'center' },
                                    { text: '400.000 VNÄ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'PLAN_1M' ? 'â˜‘ ÄÃƒ CHá»ŒN' : 'â˜', fontSize: 8.5, alignment: 'center', bold: planCode === 'PLAN_1M', color: planCode === 'PLAN_1M' ? '#15803d' : '#94a3b8' }
                                ],
                                [
                                    { text: '3', fontSize: 8.5, alignment: 'center' },
                                    { text: 'GÃ³i 3 ThÃ¡ng (~375k/thÃ¡ng)', fontSize: 8.5 },
                                    { text: '03 thÃ¡ng (90 ngÃ y)', fontSize: 8.5, alignment: 'center' },
                                    { text: '1.125.000 VNÄ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'PLAN_3M' ? 'â˜‘ ÄÃƒ CHá»ŒN' : 'â˜', fontSize: 8.5, alignment: 'center', bold: planCode === 'PLAN_3M', color: planCode === 'PLAN_3M' ? '#15803d' : '#94a3b8' }
                                ],
                                [
                                    { text: '4', fontSize: 8.5, alignment: 'center' },
                                    { text: 'GÃ³i 6 ThÃ¡ng (~350k/thÃ¡ng)', fontSize: 8.5 },
                                    { text: '06 thÃ¡ng (180 ngÃ y)', fontSize: 8.5, alignment: 'center' },
                                    { text: '2.100.000 VNÄ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'PLAN_6M' ? 'â˜‘ ÄÃƒ CHá»ŒN' : 'â˜', fontSize: 8.5, alignment: 'center', bold: planCode === 'PLAN_6M', color: planCode === 'PLAN_6M' ? '#15803d' : '#94a3b8' }
                                ],
                                [
                                    { text: '5', fontSize: 8.5, alignment: 'center' },
                                    { text: 'GÃ³i 1 NÄƒm (~325k/thÃ¡ng - Tiáº¿t kiá»‡m)', fontSize: 8.5, bold: true },
                                    { text: '01 nÄƒm (365 ngÃ y)', fontSize: 8.5, alignment: 'center' },
                                    { text: '3.900.000 VNÄ', fontSize: 8.5, alignment: 'right', bold: true },
                                    { text: planCode === 'PLAN_1Y' ? 'â˜‘ ÄÃƒ CHá»ŒN' : 'â˜', fontSize: 8.5, alignment: 'center', bold: planCode === 'PLAN_1Y', color: planCode === 'PLAN_1Y' ? '#15803d' : '#94a3b8' }
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
                    { text: 'LÆ°u Ã½: Báº£ng giÃ¡ trÃªn lÃ  dá»‹ch vá»¥ pháº§n má»m khÃ´ng chá»‹u thuáº¿ GTGT (VAT 0%) theo ThÃ´ng tÆ° 219/2013/TT-BTC. Táº¥t cáº£ cÃ¡c gÃ³i Ä‘á»u há»— trá»£ Full 100% chá»©c nÄƒng khÃ´ng giá»›i háº¡n.', fontSize: 7.5, italic: true, color: '#64748b', margin: [0, 0, 0, 10] },

                    // PHá»¤ Lá»¤C II
                    { text: 'PHá»¤ Lá»¤C II: MÃ” Táº¢ CHá»¨C NÄ‚NG Dá»ŠCH Vá»¤ PHáº¦N Má»€M T.I.M.E.S', fontSize: 11, bold: true, color: '#1e3a8a', alignment: 'center', margin: [0, 0, 0, 4] },
                    { text: 'CÃ¡c chá»©c nÄƒng nghiá»‡p vá»¥ chÃ­nh cá»§a Há»‡ thá»‘ng T.I.M.E.S bao gá»“m:', fontSize: 8.5, bold: true, color: '#0f172a', margin: [0, 0, 0, 4] },

                    {
                        columns: [
                            {
                                width: '50%',
                                stack: [
                                    { text: '1. Quáº£n lÃ½ danh má»¥c ká»¹ thuáº­t: Thiáº¿t láº­p thá»i lÆ°á»£ng, mÃ¡y mÃ³c gáº¯n kÃ¨m, khoáº£ng cÃ¡ch nghá»‰, nhÃ³m thá»§ thuáº­t YHCT - PHCN chuáº©n Bá»™ Y Táº¿.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '2. Quáº£n lÃ½ KTV & BÃ¡c sÄ©: PhÃ¢n cÃ´ng ca sÃ¡ng/chiá»u, phÃ²ng chá»‰ Ä‘á»‹nh, chuyÃªn mÃ´n ká»¹ thuáº­t thá»±c hiá»‡n.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '3. Quáº£n lÃ½ mÃ¡y mÃ³c: Äá»‹nh danh mÃ£ mÃ¡y, phÃ²ng Ä‘áº·t mÃ¡y, chá»‘ng trÃ¹ng láº·p thiáº¿t bá»‹ tuyá»‡t Ä‘á»‘i.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '4. Quáº£n lÃ½ bá»‡nh nhÃ¢n: Nháº­p há»“ sÆ¡, buá»“ng giÆ°á»ng, chá»‰ Ä‘á»‹nh y lá»‡nh Ä‘a dá»‹ch vá»¥ ná»™i trÃº & ngoáº¡i trÃº.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '5. Äá»™ng cÆ¡ AI & CP-SAT Solver: Tá»± Ä‘á»™ng chia giá» thá»§ thuáº­t thÃ´ng minh, khÃ´ng trÃ¹ng nhÃ¢n viÃªn, mÃ¡y mÃ³c, bá»‡nh nhÃ¢n.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '6. Xáº¿p lá»‹ch cuá»‘i tuáº§n / trá»±c: Tá»± Ä‘á»™ng chia ca trá»±c Thá»© 7, Chá»§ Nháº­t vÃ  ngÃ y nghá»‰ lá»… chuyÃªn biá»‡t.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] }
                                ]
                            },
                            {
                                width: '50%',
                                stack: [
                                    { text: '7. Quáº£n lÃ½ y lá»‡nh: Tá»•ng há»£p chá»‰ Ä‘á»‹nh, phÃ¢n luá»“ng theo khoa phÃ²ng, Ä‘á»“ng bá»™ tráº¡ng thÃ¡i bá»‡nh Ã¡n.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '8. Xuáº¥t báº£ng KETQUA: Báº£ng káº¿t quáº£ xáº¿p lá»‹ch trá»±c quan Ä‘áº§y Ä‘á»§ ngÃ y, giá», bá»‡nh nhÃ¢n, KTV, mÃ¡y mÃ³c.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '9. Xuáº¥t bÃ¡o cÃ¡o Ä‘a dáº¡ng: Xuáº¥t PDF lá»‹ch theo tá»«ng buá»“ng phÃ²ng bá»‡nh viá»‡n, xuáº¥t Excel phÃ¢n cÃ´ng KTV.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '10. ÄÃ¡m mÃ¢y & Báº£o máº­t: Ná»n táº£ng Cloudflare Worker + D1 Database, mÃ£ hÃ³a JWT, sao lÆ°u Google Drive tá»± Ä‘á»™ng.', fontSize: 8, color: '#334155', margin: [0, 0, 0, 3] },
                                    { text: '11. Äá»‹a chá»‰ truy cáº­p trá»±c tuyáº¿n: https://xeplichthuthuat.io.vn (Sá»­ dá»¥ng trá»±c tiáº¿p trÃªn Web/Mobile/Tablet).', fontSize: 8, color: '#1d4ed8', bold: true, margin: [0, 0, 0, 3] }
                                ]
                            }
                        ],
                        margin: [0, 0, 0, 10]
                    },

                    // KÃ½ xÃ¡c nháº­n phá»¥ lá»¥c
                    {
                        columns: [
                            {
                                width: '*',
                                alignment: 'center',
                                stack: [
                                    { text: 'XÃC NHáº¬N BÃŠN A', fontSize: 9, bold: true },
                                    { text: '(KÃ½, Ä‘Ã³ng dáº¥u)', fontSize: 7.5, italic: true, color: '#64748b' },
                                    { text: '\n\n' },
                                    { text: (partyA.representative && partyA.representative !== 'Ban GiÃ¡m Äá»‘c / TrÆ°á»Ÿng Ä‘Æ¡n vá»‹') ? `${partyA.representative}\n(${unitName})` : unitName, fontSize: 9, bold: true }
                                ]
                            },
                            {
                                width: '*',
                                alignment: 'center',
                                stack: [
                                    { text: 'XÃC NHáº¬N BÃŠN B', fontSize: 9, bold: true, color: '#1e40af' },
                                    { text: '(KÃ½, ghi rÃµ há» tÃªn)', fontSize: 7.5, italic: true, color: '#64748b' },
                                    { text: '\n\n' },
                                    { text: 'BS. Äáº¶NG PHONG THÃI', fontSize: 9, bold: true }
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
            showToast(`ðŸ“„ Äang táº£i file PDF: ${fileName}`, 'success');
        }
    } catch (e) {
        console.error('Lá»—i táº¡o PDF há»£p Ä‘á»“ng:', e);
        alert('Lá»—i táº¡o PDF: ' + (e?.message || e));
    }
};

window.openRenewModal = function (planCode) {
    if (typeof window.closePricingModal === 'function') window.closePricingModal();
    const m = document.getElementById('modal-renew-info');
    if (!m) return;

    // Reset láº¡i tráº¡ng thÃ¡i cÃ¡c mÃ n hÃ¬nh trong modal
    const payingView = document.getElementById('renew-paying-view');
    const succView = document.getElementById('renew-success-view');
    if (payingView) payingView.style.display = 'block';
    if (succView) succView.style.display = 'none';

    const currentUnit = (localStorage.getItem('pm_unit_code') || 'bvtks-cs2').toLowerCase();
    const selectedPlan = planCode || 'PLAN_1Y';
    window._currentSelectedPlan = selectedPlan;

    const planData = {
        'PLAN_1M': { name: 'GÃ³i 1 ThÃ¡ng', amount: 400000, price: '400.000 Ä‘', equiv: '400.000 Ä‘ / thÃ¡ng', code: '1T' },
        'PLAN_3M': { name: 'GÃ³i 3 ThÃ¡ng', amount: 1125000, price: '1.125.000 Ä‘', equiv: '~375.000 Ä‘ / thÃ¡ng (Tiáº¿t kiá»‡m 6%)', code: '3T' },
        'PLAN_6M': { name: 'GÃ³i 6 ThÃ¡ng', amount: 2100000, price: '2.100.000 Ä‘', equiv: '~350.000 Ä‘ / thÃ¡ng (Tiáº¿t kiá»‡m 12.5%)', code: '6T' },
        'PLAN_1Y': { name: 'GÃ³i 1 NÄƒm', amount: 3900000, price: '3.900.000 Ä‘', equiv: '~325.000 Ä‘ / thÃ¡ng (Tiáº¿t kiá»‡m 18.75%)', code: '1N' }
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
    if (unitEl) unitEl.innerText = 'ÄÆ¡n vá»‹: ' + currentUnit;

    window._currentOrderAmount = target.amount;
    const defaultMemo = `PMCG ${currentUnit.toUpperCase()} ${target.code}`;
    if (memoEl) memoEl.innerText = defaultMemo;

    // áº¢nh QR ban Ä‘áº§u
    const defaultQrUrl = `https://img.vietqr.io/image/MB-0392283473-compact2.png?amount=${target.amount}&addInfo=${encodeURIComponent(defaultMemo)}&accountName=DANG%20PHONG%20THAI`;
    if (qrImg) qrImg.src = defaultQrUrl;

    m.style.display = 'flex';

    // Táº¡o Ä‘Æ¡n hÃ ng trÃªn backend Worker
    if (typeof callApi === 'function') {
        callApi('createPaymentOrder', [{ unit_code: currentUnit, plan_tier: selectedPlan }], res => {
            const data = (res && res.order_code) ? res : (res?.data || {});
            if (data && data.order_code) {
                window._currentOrderCode = data.order_code;
                if (qrImg && data.qr_url) qrImg.src = data.qr_url;
                if (memoEl && data.content) memoEl.innerText = data.content;
                const bankAccEl = document.getElementById('renew-bank-acc');
                if (bankAccEl && data.bank_account) bankAccEl.innerText = data.bank_account;

                // Báº¯t Ä‘áº§u láº¯ng nghe tá»± Ä‘á»™ng chuyá»ƒn tráº¡ng thÃ¡i gÃ³i
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
    const maxPolls = 600; // ThÄƒm dÃ² tá»‘i Ä‘a 30 phÃºt (má»—i 3 giÃ¢y)

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
                    // Chá»§ tÃ i khoáº£n Ä‘Ã£ nháº­n Ä‘Æ°á»£c tiá»n! Tá»± Ä‘á»™ng nÃ¢ng cáº¥p gÃ³i cÆ°á»›c
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
    const planName = data.plan_name || 'Báº£n Quyá»n ÄÃ£ NÃ¢ng Cáº¥p';
    const expiresAt = data.expires_at || '';
    const daysLeft = data.days_left !== undefined ? data.days_left : 365;

    // 1. Cáº­p nháº­t localStorage
    localStorage.setItem('pm_plan_tier', planTier);
    localStorage.setItem('pm_plan_name', planName);
    localStorage.setItem('pm_expires_at', expiresAt);
    localStorage.setItem('pm_days_left', daysLeft);

    // 2. Cáº­p nháº­t meds_session
    try {
        const sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
        sess.plan_tier = planTier;
        sess.plan_name = planName;
        sess.expires_at = expiresAt;
        sess.days_left = daysLeft;
        localStorage.setItem('meds_session', JSON.stringify(sess));
    } catch (e) {}

    // 3. Cáº­p nháº­t Badge trÃªn Header
    if (typeof window.updateSubscriptionHeaderBadge === 'function') {
        window.updateSubscriptionHeaderBadge(planTier, expiresAt, planName, daysLeft);
    }

    // 4. Chuyá»ƒn sang mÃ n hÃ¬nh chÃºc má»«ng thÃ nh cÃ´ng
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
        if (succDays) succDays.innerText = `${daysLeft} ngÃ y`;
    }

    // 5. Báº¯n thÃ´ng bÃ¡o Toast
    if (typeof showToast === 'function') {
        showToast(`ðŸŽ‰ ChÃºc má»«ng! ÄÆ¡n vá»‹ cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c nÃ¢ng cáº¥p lÃªn ${planName}!`, 'success');
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
// ðŸ’³ QUáº¢N LÃ GIAO Dá»ŠCH THANH TOÃN VIETQR (SUPER ADMIN)
// ============================================================
window.loadPaymentTransactionsList = function () {
    const tbody = document.getElementById('payment-transactions-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#64748b;">â³ Äang táº£i lá»‹ch sá»­ giao dá»‹ch thanh toÃ¡n...</td></tr>';

    if (typeof callApi === 'function') {
        callApi('getPaymentTransactions', [{ limit: 50 }], res => {
            const list = Array.isArray(res) ? res : (res?.data || []);
            if (!list || list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">ChÆ°a cÃ³ giao dá»‹ch thanh toÃ¡n nÃ o Ä‘Æ°á»£c táº¡o.</td></tr>';
                return;
            }

            tbody.innerHTML = list.map(t => {
                const isSuccess = t.status === 'SUCCESS';
                const statusBadge = isSuccess
                    ? '<span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:6px; font-weight:700; font-size:11px;">âœ… ThÃ nh CÃ´ng</span>'
                    : '<span style="background:#fef3c7; color:#b45309; padding:3px 8px; border-radius:6px; font-weight:700; font-size:11px;">â³ Chá» Thanh ToÃ¡n</span>';

                const formattedAmount = (parseInt(t.amount || 0, 10)).toLocaleString('vi-VN') + ' Ä‘';
                const timeDisplay = t.created_at || '-';

                const actionBtn = isSuccess
                    ? '<span style="color:#15803d; font-size:12px; font-weight:600;">ÄÃ£ kÃ­ch hoáº¡t</span>'
                    : `<button class="btn btn-sm btn-success" onclick="window.manualApprovePaymentPrompt('${t.order_code}', '${t.unit_code}', '${t.plan_tier}')" style="padding:3px 8px; font-size:11px; font-weight:700;" title="Duyá»‡t nhanh vÃ  nÃ¢ng cáº¥p gÃ³i cho Ä‘Æ¡n vá»‹ ngay láº­p tá»©c">âš¡ Duyá»‡t 1-Click</button>`;

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
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">âŒ Lá»—i táº£i lá»‹ch sá»­ giao dá»‹ch: ' + (err?.message || err) + '</td></tr>';
        });
    }
};

window.manualApprovePaymentPrompt = function (orderCode, unitCode, planTier) {
    if (!confirm(`XÃ¡c nháº­n duyá»‡t thanh toÃ¡n cho mÃ£ Ä‘Æ¡n: ${orderCode}?\n\nÄÆ¡n vá»‹: ${unitCode}\nGÃ³i cÆ°á»›c: ${planTier}\n\nHá»‡ thá»‘ng sáº½ gia háº¡n tÃ i khoáº£n Ä‘Æ¡n vá»‹ ngay láº­p tá»©c!`)) {
        return;
    }

    if (typeof callApi === 'function') {
        callApi('manualApprovePayment', [{ order_code: orderCode, unit_code: unitCode, plan_tier: planTier }], res => {
            if (typeof showToast === 'function') {
                showToast(`ÄÃ£ duyá»‡t thÃ nh cÃ´ng giao dá»‹ch ${orderCode}!`, 'success');
            } else {
                alert(`ÄÃ£ duyá»‡t thÃ nh cÃ´ng giao dá»‹ch ${orderCode}!`);
            }
            window.loadPaymentTransactionsList();
            if (typeof window.loadTenantsList === 'function') {
                window.loadTenantsList();
            }
        }, err => {
            alert('Lá»—i duyá»‡t thanh toÃ¡n: ' + (err?.message || err));
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

    let sess = {};
    try {
        sess = JSON.parse(localStorage.getItem('meds_session') || '{}');
    } catch (e) {}

    const role = (sess.role || '').toUpperCase();
    const isSuper = role === 'SUPER_ADMIN' || role === 'SUPERADMIN';

    const pTier = planTier || localStorage.getItem('pm_plan_tier') || sess.plan_tier || 'PLAN_1Y';
    const pName = planName || localStorage.getItem('pm_plan_name') || 'Báº£n Quyá»n';
    const pDays = daysLeft !== undefined ? parseInt(daysLeft, 10) : parseInt(localStorage.getItem('pm_days_left') || '999', 10);

    const iconEl = document.getElementById('header-sub-icon');
    const textEl = document.getElementById('header-sub-text');

    badge.style.display = 'inline-flex';

    if (isSuper) {
        badge.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        badge.title = 'TÃ i khoáº£n Quáº£n trá»‹ Tá»‘i cao (Super Admin) - ToÃ n quyá»n quáº£n trá»‹ há»‡ thá»‘ng';
        if (iconEl) iconEl.innerText = 'ðŸ‘‘';
        if (textEl) textEl.innerText = 'Há»‡ Thá»‘ng T.I.M.E.S';
        return;
    }

    const currentUnit = (sess.unit_code || localStorage.getItem('pm_unit_code') || '').toLowerCase();
    // ÄÆ¡n vá»‹ bvtks-cs2 hoáº·c gÃ³i ENTERPRISE: LuÃ´n lÃ  Báº£n quyá»n VÄ©nh viá»…n
    if (currentUnit === 'bvtks-cs2' || currentUnit === 'bvtks_cs2' || pTier === 'ENTERPRISE' || pName.toLowerCase().includes('vÄ©nh viá»…n')) {
        badge.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        badge.title = 'Bá»‡nh viá»‡n Than - KhoÃ¡ng sáº£n CÆ¡ sá»Ÿ 2 - Báº£n quyá»n VÄ©nh viá»…n trá»n Ä‘á»i';
        if (iconEl) iconEl.innerText = 'ðŸ’Ž';
        if (textEl) textEl.innerText = 'Báº£n Quyá»n VÄ©nh Viá»…n';
        return;
    }

    if (pTier === 'TRIAL_15D') {
        if (pDays <= 0) {
            badge.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            badge.title = 'GÃ³i dÃ¹ng thá»­ Ä‘Ã£ háº¿t háº¡n. Báº¥m Ä‘á»ƒ gia háº¡n gÃ³i cÆ°á»›c!';
            if (iconEl) iconEl.innerText = 'âš ï¸';
            if (textEl) textEl.innerText = 'DÃ¹ng thá»­: Háº¿t háº¡n';
        } else {
            badge.style.background = 'linear-gradient(135deg, #f59e0b, #ea580c)';
            badge.title = `GÃ³i dÃ¹ng thá»­ 15 ngÃ y miá»…n phÃ­ - CÃ²n láº¡i ${pDays} ngÃ y. Báº¥m Ä‘á»ƒ nÃ¢ng cáº¥p!`;
            if (iconEl) iconEl.innerText = 'ðŸŽ';
            if (textEl) textEl.innerText = `DÃ¹ng thá»­: CÃ²n ${pDays} ngÃ y`;
        }
    } else {
        if (pDays <= 7 && pDays > 0) {
            badge.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
            badge.title = `${pName} - Sáº¯p háº¿t háº¡n (cÃ²n ${pDays} ngÃ y). Báº¥m Ä‘á»ƒ gia háº¡n!`;
            if (iconEl) iconEl.innerText = 'â³';
            if (textEl) textEl.innerText = `${pName} (CÃ²n ${pDays} ngÃ y)`;
        } else if (pDays <= 0) {
            badge.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            badge.title = `${pName} Ä‘Ã£ háº¿t háº¡n sá»­ dá»¥ng. Báº¥m Ä‘á»ƒ gia háº¡n!`;
            if (iconEl) iconEl.innerText = 'ðŸ”’';
            if (textEl) textEl.innerText = `${pName} (Háº¿t háº¡n)`;
        } else {
            badge.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
            badge.title = `${pName} - Háº¡n dÃ¹ng Ä‘áº¿n ${expiresAt || 'vÃ´ thá»i háº¡n'}. Báº¥m Ä‘á»ƒ xem thÃ´ng tin!`;
            if (iconEl) iconEl.innerText = 'ðŸ’Ž';
            if (textEl) textEl.innerText = `${pName} (CÃ²n ${pDays} ngÃ y)`;
        }
    }
};


