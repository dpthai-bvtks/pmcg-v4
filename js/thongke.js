/* ==========================================
   T.I.M.E.S SYSTEM - THỐNG KÊ HIS & EXCEL EXPORT
   ========================================== */

var callApi = (typeof window !== 'undefined' && window.callApi) ? window.callApi : (typeof callApi === 'function' ? callApi : function(name, args, cb, err) {
    if (typeof window !== 'undefined' && window.callApi) return window.callApi(name, args, cb, err);
    if (typeof window !== 'undefined' && window.google?.script?.run) {
        return new Promise((res, rej) => {
            window.google.script.run.withSuccessHandler(r => { if (cb) cb(r); res(r); }).withFailureHandler(e => { if (err) err(e); rej(e); })[name](...(args || []));
        });
    }
    return Promise.reject(new Error("API not available"));
});

        // ==========================================
        // QUẢN LÝ NHÂN SỰ CHẤM CÔNG (HỌ VÀ TÊN ĐẦY ĐỦ CHUẨN BVTKS CS2)
        // ==========================================
        const DEFAULT_CHAMCONG_STAFF = {
            'Hoàng Đức Đạt': { keys: ['hoàng đức đạt', 'bs đạt', 'bs dat', 'đạt'], skills: 'Cả hai', role: 'Bác sĩ', heSo: 1.0 },
            'Lê Thị Thu Hoa': { keys: ['lê thị thu hoa', 'bs hoa', 'thu hoa', 'hoa'], skills: 'Cả hai', role: 'Bác sĩ', heSo: 1.0 },
            'Nguyễn Thị Duyên Thảo': { keys: ['nguyễn thị duyên thảo', 'bs thảo', 'bs thảo 2', 'duyên thảo', 'thảo'], skills: 'Cả hai', role: 'Bác sĩ', heSo: 1.0 },
            'Nguyễn Thu Hằng': { keys: ['nguyễn thu hằng', 'bs hằng', 'thu hằng', 'hằng'], skills: 'Cả hai', role: 'Bác sĩ', heSo: 1.0 },
            'Đặng Phong Thái': { keys: ['đặng phong thái', 'bs thái', 'phong thái', 'thái'], skills: 'YHCT', role: 'Bác sĩ', heSo: 1.0 },
            'Phạm Thạch Khuyến': { keys: ['phạm thạch khuyến', 'bs khuyến', 'thạch khuyến', 'khuyến'], skills: 'YHCT', role: 'Bác sĩ', heSo: 1.0 },
            'Nguyễn Thị Xuân Lương': { keys: ['nguyễn thị xuân lương', 'ktv lương', 'xuân lương', 'lương'], skills: 'PHCN', role: 'KTV', heSo: 1.0 },
            'Nguyễn Thị Hà': { keys: ['nguyễn thị hà', 'ktv hà chip', 'ktv hà', 'hà chip', 'hà'], skills: 'PHCN', role: 'KTV', heSo: 1.0 },
            'Phan Thị Thu Hiền': { keys: ['phan thị thu hiền', 'ktv phan hiền', 'phan hiền'], skills: 'PHCN', role: 'KTV', heSo: 1.0 },
            'Lê Thị Thu Hiền': { keys: ['lê thị thu hiền', 'ktv lê hiền', 'ltv lê hiền', 'lê hiền'], skills: 'PHCN', role: 'KTV', heSo: 1.0 },
            'Nguyễn Văn Khính': { keys: ['nguyễn văn khính', 'ktv khính', 'khính'], skills: 'PHCN', role: 'KTV', heSo: 1.0 },
            'Phạm Thị Thuyến': { keys: ['phạm thị thuyến', 'đd thuyến', 'ktv thuyến', 'thuyến'], skills: 'PHCN', role: 'Điều dưỡng', heSo: 1.0 },
            'Trần Thị Duyên': { keys: ['trần thị duyên', 'đd duyên', 'ktv duyên', 'duyên'], skills: 'PHCN', role: 'Điều dưỡng', heSo: 1.0 }
        };

        function getEmployeeRole(empName) {
            if (!empName) return 'KTV';
            const name = String(empName).trim();
            if (adminChamCongStaffConfig && adminChamCongStaffConfig[name] && adminChamCongStaffConfig[name].role) {
                return adminChamCongStaffConfig[name].role;
            }
            if (DEFAULT_CHAMCONG_STAFF[name] && DEFAULT_CHAMCONG_STAFF[name].role) {
                return DEFAULT_CHAMCONG_STAFF[name].role;
            }
            const lower = name.toLowerCase();
            if (lower.includes('đạt') || lower.includes('hoa') || lower.includes('thảo') || lower.includes('hằng') || lower.includes('thái') || lower.includes('khuyến') || lower.startsWith('bs') || lower.includes('bác sĩ')) return 'Bác sĩ';
            if (lower.includes('thuyến') || lower.includes('duyên') || lower.startsWith('đd') || lower.startsWith('dd') || lower.includes('điều dưỡng')) return 'Điều dưỡng';
            return 'KTV';
        }

        function getChamCongStorageKey(key) {
            const u = localStorage.getItem('pm_unit_code') || 'bvtks-cs2';
            return key + '_' + u;
        }

        // Tự động dọn dẹp cache cũ bị ô nhiễm từ các phiên bản trước
        try {
            if (typeof localStorage !== 'undefined' && localStorage.getItem('pm_cleaned_cache_ver') !== '4.0.3-rev4') {
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith('pm_cache_cc_') || k.startsWith('pm_cache_tk_')) {
                        localStorage.removeItem(k);
                    }
                });
                localStorage.setItem('pm_cleaned_cache_ver', '4.0.3-rev4');
            }
        } catch(e) {}

        function getLocalCCKey(my) {
            const u = localStorage.getItem('pm_unit_code') || 'bvtks-cs2';
            return `pm_cache_cc_${u}_${my}`;
        }
        function getLocalTKKey(my) {
            const u = localStorage.getItem('pm_unit_code') || 'bvtks-cs2';
            return `pm_cache_tk_${u}_${my}`;
        }
        function getCachedChamCong(my) {
            try {
                const raw = localStorage.getItem(getLocalCCKey(my));
                if (raw) return JSON.parse(raw);
            } catch(e) {}
            return null;
        }
        function setCachedChamCong(my, data) {
            try {
                if (data && typeof data === 'object') {
                    localStorage.setItem(getLocalCCKey(my), JSON.stringify(data));
                }
            } catch(e) {}
        }
        function getCachedThongKe(my) {
            try {
                const raw = localStorage.getItem(getLocalTKKey(my));
                if (raw) return JSON.parse(raw);
            } catch(e) {}
            return null;
        }
        function setCachedThongKe(my, data) {
            try {
                if (data && typeof data === 'object') {
                    localStorage.setItem(getLocalTKKey(my), JSON.stringify(data));
                }
            } catch(e) {}
        }

    const DEFAULT_CHAMCONG_EMPLOYEES = Object.keys(DEFAULT_CHAMCONG_STAFF);
    if (typeof window !== 'undefined') {
        window.DEFAULT_CHAMCONG_EMPLOYEES = DEFAULT_CHAMCONG_EMPLOYEES;
        window.DEFAULT_CHAMCONG_STAFF = DEFAULT_CHAMCONG_STAFF;
    }

    const isBVTKS_CS2 = (localStorage.getItem('pm_unit_code') || 'bvtks-cs2') === 'bvtks-cs2';

    // ==========================================
    // CANONICAL NAME RESOLVER & STAFF DATA SANITIZER
    // ==========================================
    function getCanonicalStaffName(rawName) {
        if (!rawName) return null;
        if (typeof rawName === 'object') {
            rawName = rawName.tenHis || rawName.name || rawName.ten || rawName[1] || rawName[0] || '';
        }
        const str = String(rawName).trim();
        if (!str) return null;

        // 1. Triệt tiêu 100% các ô trợ lý ảo Phụ 1..8, Phụ trách
        if (/^(phụ|phu)\s*\d+/i.test(str) || /^(ktv\s*)?phụ\s*trách/i.test(str) || /^ktv\s*phu\s*trach/i.test(str)) {
            return null;
        }

        // 2. Khớp trực tiếp với Họ và tên đầy đủ chuẩn BVTKS CS2
        if (DEFAULT_CHAMCONG_STAFF[str]) return str;

        const lower = str.toLowerCase().trim();
        const cleanLower = lower.replace(/^(bs\.|bs|ktv\.|ktv|đd\.|đd|dd\.|dd)\s+/, '').trim();

        for (const [fullName, conf] of Object.entries(DEFAULT_CHAMCONG_STAFF)) {
            if (fullName.toLowerCase() === lower || fullName.toLowerCase() === cleanLower) return fullName;
            if (conf && conf.keys) {
                for (const k of conf.keys) {
                    const kl = String(k).toLowerCase().trim();
                    if (lower === kl || cleanLower === kl) return fullName;
                }
            }
        }

        // 3. Tra cứu qua cấu hình nhân sự Tab Admin hiện tại
        if (adminChamCongStaffConfig && typeof adminChamCongStaffConfig === 'object') {
            for (const [confName, conf] of Object.entries(adminChamCongStaffConfig)) {
                if (confName.toLowerCase() === lower || confName.toLowerCase() === cleanLower) return confName;
                if (conf && conf.keys) {
                    for (const k of conf.keys) {
                        const kl = String(k).toLowerCase().trim();
                        if (lower === kl || cleanLower === kl) return confName;
                    }
                }
            }
        }

        // 4. Tra cứu qua dataCache.staff (lấy trường tên đầy đủ tenHis)
        if (typeof dataCache !== 'undefined' && Array.isArray(dataCache.staff)) {
            const found = dataCache.staff.find(s => {
                if (!s) return false;
                const sTen = String(s.ten || s.name || '').toLowerCase().trim();
                const sClean = sTen.replace(/^(bs\.|bs|ktv\.|ktv|đd\.|đd|dd\.|dd)\s+/, '').trim();
                return sTen === lower || sClean === cleanLower || (s.tenHis && s.tenHis.toLowerCase().trim() === lower);
            });
            if (found && found.tenHis && String(found.tenHis).trim()) {
                const hisName = String(found.tenHis).trim();
                if (DEFAULT_CHAMCONG_STAFF[hisName]) return hisName;
                return hisName;
            }
        }

        return str;
    }
    window.getCanonicalStaffName = getCanonicalStaffName;

    function cleanseAdminChamCongEmployees(list) {
        const isDefault = (localStorage.getItem('pm_unit_code') || 'bvtks-cs2') === 'bvtks-cs2';
        let res = [];
        if (Array.isArray(list)) {
            list.forEach(item => {
                const canon = getCanonicalStaffName(item);
                if (canon && !res.includes(canon)) {
                    res.push(canon);
                }
            });
        }
        if (isDefault) {
            // Đảm bảo đủ nhân sự chuẩn BVTKS CS2 nếu danh sách bị thiếu (chỉ bổ sung vào cuối, tuyệt đối KHÔNG sort lại để bảo toàn thứ tự kéo thả của người dùng)
            DEFAULT_CHAMCONG_EMPLOYEES.forEach(stdEmp => {
                if (!res.includes(stdEmp)) {
                    res.push(stdEmp);
                }
            });
        }
        return res;
    }
    window.cleanseAdminChamCongEmployees = cleanseAdminChamCongEmployees;

    let adminChamCongEmployees = isBVTKS_CS2 ? [...DEFAULT_CHAMCONG_EMPLOYEES] : []; 
    let adminChamCongStaffConfig = isBVTKS_CS2 ? { ...DEFAULT_CHAMCONG_STAFF } : {};
    let editAdminEmployeeIndex = -1;

    // Tự động nạp và làm sạch danh sách nhân sự từ cache khi khởi động
    try {
        const cachedEmp = JSON.parse(localStorage.getItem(getChamCongStorageKey('med_chamcong_employees')) || '[]');
        if (Array.isArray(cachedEmp) && cachedEmp.length > 0) {
            adminChamCongEmployees = cleanseAdminChamCongEmployees(cachedEmp);
        }
        const cachedStaff = JSON.parse(localStorage.getItem(getChamCongStorageKey('med_chamcong_staff_config')) || '{}');
        if (cachedStaff && Object.keys(cachedStaff).length > 0) {
            adminChamCongStaffConfig = cachedStaff;
        }
    } catch(e) {}

    // Đảm bảo cấu hình nhân sự
    function ensureStaffConfigForEmployees() {
        if (!adminChamCongStaffConfig || typeof adminChamCongStaffConfig !== 'object') {
            adminChamCongStaffConfig = {};
        }
        adminChamCongEmployees.forEach(emp => {
            if (!emp) return;
            const empName = String(emp).trim();
            if (!empName) return;
            if (!adminChamCongStaffConfig[empName]) {
                const defConf = DEFAULT_CHAMCONG_STAFF[empName];
                if (defConf) {
                    adminChamCongStaffConfig[empName] = { ...defConf };
                    return;
                }
                const role = getEmployeeRole(empName);
                const lower = empName.toLowerCase().trim();
                const keys = [lower];
                const words = lower.split(/\s+/);
                if (words.length > 1) {
                    const shortName = words[words.length - 1];
                    keys.push(shortName);
                    if (role === 'Bác sĩ') {
                        keys.push('bs ' + shortName, 'bs. ' + shortName, 'bs ' + lower, 'bs. ' + lower);
                    } else if (role === 'Điều dưỡng') {
                        keys.push('đd ' + shortName, 'đd. ' + shortName, 'dd ' + shortName, 'dd. ' + shortName, 'đd ' + lower);
                    } else {
                        keys.push('ktv ' + shortName, 'ktv. ' + shortName, 'ktv ' + lower, 'ktv. ' + lower);
                    }
                }
                adminChamCongStaffConfig[empName] = {
                    keys: keys,
                    skills: 'Cả hai',
                    role: role,
                    heSo: 1.0
                };
            }
        });
    }

    function findStaffDataByKey(dataObj, empName) {
        if (!dataObj || typeof dataObj !== 'object') return null;
        if (dataObj[empName]) return dataObj[empName];

        const canonTarget = getCanonicalStaffName(empName);

        // 1. Kiểm tra nếu trong dataObj có key nào quy về cùng canonical full name
        for (const dKey of Object.keys(dataObj)) {
            if (dKey === empName) return dataObj[dKey];
            const canonDKey = getCanonicalStaffName(dKey);
            if (canonTarget && canonDKey && canonTarget === canonDKey) {
                return dataObj[dKey];
            }
        }

        // 2. So khớp từ khóa với aliases
        const staffConf = (adminChamCongStaffConfig && adminChamCongStaffConfig[empName]) || (canonTarget && DEFAULT_CHAMCONG_STAFF[canonTarget]) || DEFAULT_CHAMCONG_STAFF[empName];
        const keys = (staffConf && staffConf.keys) ? staffConf.keys : [empName.toLowerCase()];
        const empLower = empName.toLowerCase().trim();
        const cleanEmpLower = empLower.replace(/^(bs\.|bs|ktv\.|ktv|đd\.|đd|dd\.|dd)\s+/, '').trim();

        for (const dKey of Object.keys(dataObj)) {
            const lowerDKey = dKey.toLowerCase().trim();
            const cleanDKey = lowerDKey.replace(/^(bs\.|bs|ktv\.|ktv|đd\.|đd|dd\.|dd)\s+/, '').trim();
            if (lowerDKey === empLower || cleanDKey === cleanEmpLower) return dataObj[dKey];
            for (const k of keys) {
                const lowerK = String(k).toLowerCase().trim();
                if (lowerDKey === lowerK || cleanDKey === lowerK) {
                    return dataObj[dKey];
                }
            }
        }
        return null;
    }
    window.findStaffDataByKey = findStaffDataByKey;

    function normalizeChamCongData(raw) {
        const res = {};
        if (!raw || typeof raw !== 'object') return res;

        // 1. Gom nhóm theo Họ tên đầy đủ chuẩn hóa và loại bỏ Phụ 1..8
        Object.keys(raw).forEach(k => {
            const canon = getCanonicalStaffName(k);
            if (!canon) return; // Bỏ qua Phụ 1..8
            if (!res[canon]) {
                res[canon] = {};
            }
            const dayData = raw[k] || {};
            Object.keys(dayData).forEach(dKey => {
                if (dKey === 'heSo') {
                    if (res[canon].heSo === undefined) res[canon].heSo = dayData[dKey];
                } else {
                    if (!res[canon][dKey] && dayData[dKey]) {
                        res[canon][dKey] = dayData[dKey];
                    }
                }
            });
        });

        // 2. Đảm bảo mọi nhân sự trong adminChamCongEmployees đều có bản ghi
        adminChamCongEmployees.forEach(emp => {
            if (!res[emp]) {
                const found = findStaffDataByKey(raw, emp);
                if (found && typeof found === 'object' && Object.keys(found).length > 0) {
                    res[emp] = found;
                } else {
                    res[emp] = {};
                }
            }
        });
        return res;
    }

    function normalizeThongKeData(raw) {
        const res = {};
        if (!raw || typeof raw !== 'object') return res;

        // 1. Gom nhóm theo Họ tên đầy đủ chuẩn hóa và loại bỏ Phụ 1..8
        Object.keys(raw).forEach(k => {
            const canon = getCanonicalStaffName(k);
            if (!canon) return; // Bỏ qua Phụ 1..8
            if (!res[canon]) {
                res[canon] = { loai1: 0, loai2: 0, loai3: 0, khac: 0, tong: 0, details: [] };
            }
            const item = raw[k] || {};
            res[canon].loai1 = (res[canon].loai1 || 0) + (item.loai1 || 0);
            res[canon].loai2 = (res[canon].loai2 || 0) + (item.loai2 || 0);
            res[canon].loai3 = (res[canon].loai3 || 0) + (item.loai3 || 0);
            res[canon].khac = (res[canon].khac || 0) + (item.khac || 0);
            res[canon].tong = (res[canon].tong || 0) + (item.tong || 0);
            if (Array.isArray(item.details) && item.details.length > 0) {
                res[canon].details = (res[canon].details || []).concat(item.details);
            }
        });

        // 2. Đảm bảo mọi nhân sự trong adminChamCongEmployees đều có bản ghi
        adminChamCongEmployees.forEach(emp => {
            if (!res[emp]) {
                const found = findStaffDataByKey(raw, emp);
                if (found) {
                    res[emp] = found;
                } else {
                    res[emp] = { loai1: 0, loai2: 0, loai3: 0, khac: 0, tong: 0, details: [] };
                }
            }
        });
        return res;
    }

    function getOrLoadChamCongEmployees(callback, forceRefresh = false) {
        const isDefault = (localStorage.getItem('pm_unit_code') || 'bvtks-cs2') === 'bvtks-cs2';
        
        // 1. Kiểm tra RAM -> Cache LocalStorage (và luôn làm sạch ngay lập tức)
        if (!adminChamCongEmployees || adminChamCongEmployees.length === 0) {
            const cachedEmpStr = localStorage.getItem(getChamCongStorageKey('med_chamcong_employees'));
            if (cachedEmpStr) {
                try {
                    const parsed = JSON.parse(cachedEmpStr);
                    if (Array.isArray(parsed) && parsed.length > 0) adminChamCongEmployees = parsed;
                } catch(e){}
            }
        }

        adminChamCongEmployees = cleanseAdminChamCongEmployees(adminChamCongEmployees);
        if (adminChamCongEmployees.length === 0 && isDefault) {
            adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
        }

        ensureStaffConfigForEmployees();

        // Ghi đè lại cache sạch vào localStorage
        try {
            localStorage.setItem(getChamCongStorageKey('med_chamcong_employees'), JSON.stringify(adminChamCongEmployees));
        } catch(e){}

        if (callback) callback(adminChamCongEmployees);

        // Nếu đã có danh sách nhân sự chuẩn và không yêu cầu forceRefresh -> trả về ngay
        if (!forceRefresh && adminChamCongEmployees && adminChamCongEmployees.length > 0) {
            return adminChamCongEmployees;
        }

        // 2. Tải từ API Cloudflare khi chưa có dữ liệu hoặc khi forceRefresh
        callApi('getEmployees', []).then(empRes => {
            let list = [];
            if (empRes && empRes.status === 'success') {
                if (Array.isArray(empRes.data)) list = empRes.data;
                else if (empRes.data && empRes.data.employees) list = empRes.data.employees;
                else if (empRes.data && typeof empRes.data === 'object') list = Object.keys(empRes.data);
            } else if (Array.isArray(empRes)) {
                list = empRes;
            }

            if (list && list.length > 0) {
                adminChamCongEmployees = cleanseAdminChamCongEmployees(list);
                ensureStaffConfigForEmployees();
                try { localStorage.setItem(getChamCongStorageKey('med_chamcong_employees'), JSON.stringify(adminChamCongEmployees)); } catch(e){}
                if (typeof renderChamCongTable === 'function') renderChamCongTable();
                if (typeof renderThongKeTable === 'function') renderThongKeTable();
                if (typeof renderAdminChamCongTable === 'function') renderAdminChamCongTable();
            }
        }).catch(err => {
            console.warn('getEmployees fallback:', err);
        });

        return adminChamCongEmployees;
    }
        
        function loadAdminChamCongData() {
            window.showGlobalLoading("Đang tải danh sách nhân sự từ máy chủ...");
            callApi('getEmployees', []).then(res => {
                let list = [];
                if(res && res.status === 'success' && res.data) {
                    if (Array.isArray(res.data)) list = res.data;
                    else if (Array.isArray(res.data.employees)) list = res.data.employees;
                    else list = Object.keys(res.data);
                } else if (Array.isArray(res)) {
                    list = res;
                } else if (res && typeof res === 'object') {
                    list = Object.keys(res);
                }
                adminChamCongEmployees = cleanseAdminChamCongEmployees(list);
                if (adminChamCongEmployees.length === 0 && isBVTKS_CS2) {
                    adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
                }
                try { localStorage.setItem(getChamCongStorageKey('med_chamcong_employees'), JSON.stringify(adminChamCongEmployees)); } catch(e){}
                ensureStaffConfigForEmployees();
                return callApi('getErrorConfig', []);
            }).then(resConfig => {
                window.hideGlobalLoading();
                if(resConfig && resConfig.status === 'success' && resConfig.data) {
                    adminChamCongStaffConfig = resConfig.data.staff || {};
                } else if (resConfig && resConfig.staff) {
                    adminChamCongStaffConfig = resConfig.staff;
                }
                ensureStaffConfigForEmployees();
                renderAdminChamCongTable();
            }).catch(err => {
                window.hideGlobalLoading();
                console.error('Lỗi loadAdminChamCongData:', err);
                adminChamCongEmployees = cleanseAdminChamCongEmployees(adminChamCongEmployees);
                if (adminChamCongEmployees.length === 0 && isBVTKS_CS2) {
                    adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
                }
                ensureStaffConfigForEmployees();
                renderAdminChamCongTable();
            });
        }

        
        window.restoreDefaultChamCongStaffList = function() {
            if (!confirm("Bác sĩ có chắc muốn khôi phục lại danh sách 13 nhân sự Chấm công & Thống kê chuẩn BVTKS CS2?")) return;
            adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
            adminChamCongStaffConfig = { ...DEFAULT_CHAMCONG_STAFF };
            try {
                localStorage.setItem(getChamCongStorageKey('med_chamcong_employees'), JSON.stringify(adminChamCongEmployees));
                localStorage.setItem(getChamCongStorageKey('med_chamcong_staff_config'), JSON.stringify(adminChamCongStaffConfig));
            } catch(e){}
            renderAdminChamCongTable();

            // Save to server
            if (typeof callApi === 'function') {
                callApi('saveEmployees', [adminChamCongEmployees]);
                callApi('saveErrorConfig', [{ staff: adminChamCongStaffConfig }]);
            }
            alert("✅ Đã khôi phục thành công danh sách 13 nhân sự chấm công chuẩn!");
        };

function renderAdminChamCongTable() {
    const adminTbody = document.getElementById('admin-employees-body');
    const ccTbody = document.getElementById('chamcong-employees-body');
    const badgeCount = document.getElementById('chamcong-staff-badge-count');
    if (badgeCount) badgeCount.innerText = adminChamCongEmployees.length;

    if (!adminTbody && !ccTbody) return;

    // 1. Render Bảng trong Section Admin (nếu có)
    if (adminTbody) {
        adminTbody.innerHTML = '';
        adminChamCongEmployees.forEach((emp, index) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1.5px solid #cbd5e1';
            tr.style.transition = 'background-color 0.15s';
            tr.onmouseenter = () => tr.style.backgroundColor = (document.documentElement.getAttribute('data-theme') === 'dark' ? '#253347' : '#f1f5f9');
            tr.onmouseleave = () => tr.style.backgroundColor = '';

            const staff = adminChamCongStaffConfig[emp] || { keys: [emp.toLowerCase()], skills: 'PHCN' };
            const keysStr = staff.keys ? staff.keys.join(', ') : emp.toLowerCase();
            const skill = staff.skills || 'PHCN';
            const role = getEmployeeRole(emp);
            
            let roleBadge = `<span style="background: #f8fafc; color: #475569; padding: 1px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #e2e8f0; display: inline-block; line-height: 15px;">${role}</span>`;
            if (role === 'Bác sĩ') {
                roleBadge = `<span style="background: #eff6ff; color: #1d4ed8; padding: 1px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #bfdbfe; display: inline-block; line-height: 15px;">Bác sĩ</span>`;
            } else if (role === 'KTV') {
                roleBadge = `<span style="background: #f0fdf4; color: #15803d; padding: 1px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #bbf7d0; display: inline-block; line-height: 15px;">KTV</span>`;
            } else if (role === 'Điều dưỡng') {
                roleBadge = `<span style="background: #faf5ff; color: #7e22ce; padding: 1px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #e9d5ff; display: inline-block; line-height: 15px;">Điều dưỡng</span>`;
            }

            let skillBadge = `<span style="background: #eff6ff; color: #2563eb; padding: 1px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #bfdbfe; display: inline-block; line-height: 15px;">PHCN</span>`;
            if (skill === 'YHCT') {
                skillBadge = `<span style="background: #fef3c7; color: #d97706; padding: 1px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #fde68a; display: inline-block; line-height: 15px;">YHCT</span>`;
            } else if (skill === 'Cả hai') {
                skillBadge = `<span style="background: #ecfdf5; color: #059669; padding: 1px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #a7f3d0; display: inline-block; line-height: 15px;">Cả hai</span>`;
            }
            
            tr.innerHTML = `
                <td style="color: #64748b; text-align: center; font-weight: 600;">${index + 1}</td>
                <td style="font-weight: 700; color: #1e293b; font-size: 12px; text-align: left; padding: 1px 8px !important;">${emp}</td>
                <td style="text-align: center;">${roleBadge}</td>
                <td style="font-size: 11.5px; color: #64748b; text-align: left; padding: 1px 8px !important;">${keysStr}</td>
                <td style="text-align: center;">${skillBadge}</td>
                <td style="text-align: center;">
                    <div style="display: inline-flex; gap: 4px; justify-content: center; align-items: center;">
                        <button style="padding: 0 6px; font-size: 10.5px; font-weight: 600; height: 18px; line-height: 16px; border-radius: 3px; border: 1px solid #bfdbfe; background: #eff6ff; color: #2563eb; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;" onclick="openEditAdminEmployeeModal(${index})">
                            <i class='bx bx-edit' style="font-size: 11px;"></i> Sửa
                        </button>
                        <button style="padding: 0 6px; font-size: 10.5px; font-weight: 600; height: 18px; line-height: 16px; border-radius: 3px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;" onclick="deleteAdminChamCongEmployee(${index})">
                            <i class='bx bx-trash' style="font-size: 11px;"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
            adminTbody.appendChild(tr);
        });
    }

    // 2. Render Bảng trong Sub-Tab Chấm Công (Kèm Cột 3 Gạch ☰ Kéo Thả Sắp Xếp)
    if (ccTbody) {
        ccTbody.innerHTML = '';
        adminChamCongEmployees.forEach((emp, index) => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-emp', emp);
            tr.setAttribute('data-index', index);
            tr.style.borderBottom = '1.5px solid #cbd5e1';
            tr.style.transition = 'background-color 0.15s';
            tr.onmouseenter = () => tr.style.backgroundColor = (document.documentElement.getAttribute('data-theme') === 'dark' ? '#253347' : '#f1f5f9');
            tr.onmouseleave = () => tr.style.backgroundColor = '';

            const staff = adminChamCongStaffConfig[emp] || { keys: [emp.toLowerCase()], skills: 'PHCN' };
            const keysStr = staff.keys ? staff.keys.join(', ') : emp.toLowerCase();
            const skill = staff.skills || 'PHCN';
            const role = getEmployeeRole(emp);
            
            let roleBadge = `<span style="background: #f8fafc; color: #475569; padding: 1px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #e2e8f0; display: inline-block; line-height: 15px;">${role}</span>`;
            if (role === 'Bác sĩ') {
                roleBadge = `<span style="background: #eff6ff; color: #1d4ed8; padding: 1px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #bfdbfe; display: inline-block; line-height: 15px;">Bác sĩ</span>`;
            } else if (role === 'KTV') {
                roleBadge = `<span style="background: #f0fdf4; color: #15803d; padding: 1px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #bbf7d0; display: inline-block; line-height: 15px;">KTV</span>`;
            } else if (role === 'Điều dưỡng') {
                roleBadge = `<span style="background: #faf5ff; color: #7e22ce; padding: 1px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #e9d5ff; display: inline-block; line-height: 15px;">Điều dưỡng</span>`;
            }

            let skillBadge = `<span style="background: #eff6ff; color: #2563eb; padding: 1px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #bfdbfe; display: inline-block; line-height: 15px;">PHCN</span>`;
            if (skill === 'YHCT') {
                skillBadge = `<span style="background: #fef3c7; color: #d97706; padding: 1px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #fde68a; display: inline-block; line-height: 15px;">YHCT</span>`;
            } else if (skill === 'Cả hai') {
                skillBadge = `<span style="background: #ecfdf5; color: #059669; padding: 1px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; border: 1px solid #a7f3d0; display: inline-block; line-height: 15px;">Cả hai</span>`;
            }

            tr.innerHTML = `
                <td style="text-align: center; padding: 2px !important;">
                    <span class="drag-handle" title="Nắm giữ nút 3 gạch ☰ và kéo thả để di chuyển sắp xếp thứ tự">☰</span>
                </td>
                <td style="color: #64748b; text-align: center; font-weight: 600;">${index + 1}</td>
                <td style="font-weight: 700; color: #1e293b; font-size: 12.5px; text-align: left; padding: 4px 8px !important;">${emp}</td>
                <td style="text-align: center;">${roleBadge}</td>
                <td style="font-size: 11.5px; color: #64748b; text-align: left; padding: 4px 8px !important;">${keysStr}</td>
                <td style="text-align: center;">${skillBadge}</td>
                <td style="text-align: center;">
                    <div style="display: inline-flex; gap: 5px; justify-content: center; align-items: center;">
                        <button style="padding: 2px 8px; font-size: 11px; font-weight: 600; border-radius: 4px; border: 1px solid #bfdbfe; background: #eff6ff; color: #2563eb; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;" onclick="openEditAdminEmployeeModal(${index})">
                            <i class='bx bx-edit' style="font-size: 12px;"></i> Sửa
                        </button>
                        <button style="padding: 2px 8px; font-size: 11px; font-weight: 600; border-radius: 4px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;" onclick="deleteAdminChamCongEmployee(${index})">
                            <i class='bx bx-trash' style="font-size: 12px;"></i> Xóa
                        </button>
                    </div>
                </td>
            `;
            ccTbody.appendChild(tr);
        });

        // Khởi tạo thư viện kéo thả SortableJS cho bảng chấm công
        if (typeof Sortable !== 'undefined') {
            if (ccTbody._sortableInstance) {
                try { ccTbody._sortableInstance.destroy(); } catch(e){}
                ccTbody._sortableInstance = null;
            }
            ccTbody._sortableInstance = new Sortable(ccTbody, {
                handle: '.drag-handle',
                draggable: 'tr',
                animation: 150,
                ghostClass: 'dragging-row',
                chosenClass: 'drag-over-row',
                filter: 'button, input, select, a',
                preventOnFilter: false,
                onEnd: function(evt) {
                    if (evt.oldIndex !== evt.newIndex && evt.oldIndex != null && evt.newIndex != null) {
                        // Đọc thứ tự thực tế chính xác 100% từ các hàng DOM vừa được SortableJS kéo thả
                        const rows = Array.from(ccTbody.querySelectorAll('tr'));
                        const newOrder = rows.map(r => r.getAttribute('data-emp')).filter(Boolean);
                        if (newOrder.length > 0) {
                            adminChamCongEmployees = newOrder;
                        }

                        // Cập nhật STT, data-index và onclick handlers trên DOM ngay lập tức
                        rows.forEach((r, idx) => {
                            r.setAttribute('data-index', idx);
                            const sttCell = r.querySelector('td:nth-child(2)');
                            if (sttCell) sttCell.innerText = idx + 1;
                            const editBtn = r.querySelector('button[onclick^="openEditAdminEmployeeModal"]');
                            if (editBtn) editBtn.setAttribute('onclick', `openEditAdminEmployeeModal(${idx})`);
                            const delBtn = r.querySelector('button[onclick^="deleteAdminChamCongEmployee"]');
                            if (delBtn) delBtn.setAttribute('onclick', `deleteAdminChamCongEmployee(${idx})`);
                        });

                        // Lưu vào localStorage và đồng bộ lên server ngầm
                        saveAdminChamCongData(false);
                    }
                }
            });
        }
    }
}

window.moveAdminEmployee = function(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= adminChamCongEmployees.length) return;
    const item = adminChamCongEmployees.splice(index, 1)[0];
    adminChamCongEmployees.splice(newIndex, 0, item);
    saveAdminChamCongData(false);
};

window.switchChamCongSubTab = function(tabName) {
    const btnGrid = document.getElementById('subtab-btn-grid');
    const btnStaff = document.getElementById('subtab-btn-staff');
    const viewGrid = document.getElementById('subtab-chamcong-grid-view');
    const viewStaff = document.getElementById('subtab-chamcong-staff-view');
    const toolbar = document.getElementById('chamcong-grid-toolbar');

    if (tabName === 'staff') {
        if (btnGrid) btnGrid.classList.remove('active');
        if (btnStaff) btnStaff.classList.add('active');
        if (viewGrid) viewGrid.style.display = 'none';
        if (viewStaff) viewStaff.style.display = 'flex';
        if (toolbar) toolbar.style.visibility = 'hidden';
        renderAdminChamCongTable();
    } else {
        if (btnGrid) btnGrid.classList.add('active');
        if (btnStaff) btnStaff.classList.remove('active');
        if (viewGrid) viewGrid.style.display = 'flex';
        if (viewStaff) viewStaff.style.display = 'none';
        if (toolbar) toolbar.style.visibility = 'visible';
        renderChamCongTable();
    }
};

function closeAdminEmployeeModal() {
    const modal = document.getElementById('modal-admin-employee');
    if (modal) modal.style.display = 'none';
}

function openAddAdminEmployeeModal() {
    editAdminEmployeeIndex = -1;
    document.getElementById('modal-admin-emp-title').innerText = "Thêm Nhân Sự Mới";
    document.getElementById('admin-emp-name').value = "";
    document.getElementById('admin-emp-role').value = "KTV";
    document.getElementById('admin-emp-keys').value = "";
    document.getElementById('admin-emp-skills').value = "PHCN";
    document.getElementById('modal-admin-employee').style.display = 'flex';
    setTimeout(() => document.getElementById('admin-emp-name').focus(), 100);
}

function openEditAdminEmployeeModal(index) {
    editAdminEmployeeIndex = index;
    const empName = adminChamCongEmployees[index];
    const staff = adminChamCongStaffConfig[empName] || { keys: [empName.toLowerCase()], skills: 'PHCN' };
    
    document.getElementById('modal-admin-emp-title').innerText = "Sửa Thông Tin Nhân Sự";
    document.getElementById('admin-emp-name').value = empName;
    document.getElementById('admin-emp-role').value = getEmployeeRole(empName);
    document.getElementById('admin-emp-keys').value = staff.keys ? staff.keys.join(', ') : empName.toLowerCase();
    document.getElementById('admin-emp-skills').value = staff.skills || 'PHCN';
    
    document.getElementById('modal-admin-employee').style.display = 'flex';
}

function deleteAdminChamCongEmployee(index) {
    const empName = adminChamCongEmployees[index];
    if(confirm(`Bạn có chắc chắn muốn xóa nhân viên "${empName}" khỏi danh sách chấm công?`)) {
        adminChamCongEmployees.splice(index, 1);
        if (adminChamCongStaffConfig[empName]) {
            delete adminChamCongStaffConfig[empName];
        }
        saveAdminChamCongData();
    }
}

function saveAdminEmployee() {
    const newName = document.getElementById('admin-emp-name').value.trim();
    const roleVal = document.getElementById('admin-emp-role').value;
    const keysVal = document.getElementById('admin-emp-keys').value.trim();
    const skillsVal = document.getElementById('admin-emp-skills').value;
    
    if (!newName) return alert("Tên không được để trống!");
    
    let oldName = null;
    if (editAdminEmployeeIndex > -1) {
        oldName = adminChamCongEmployees[editAdminEmployeeIndex];
        if (newName !== oldName && adminChamCongEmployees.includes(newName)) {
            return alert("Tên nhân viên đã tồn tại!");
        }
    } else {
        if (adminChamCongEmployees.includes(newName)) {
            return alert("Tên nhân viên đã tồn tại!");
        }
    }
    
    const keysArr = keysVal.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
    if (keysArr.length === 0) keysArr.push(newName.toLowerCase());
    
    if (editAdminEmployeeIndex > -1) {
        adminChamCongEmployees[editAdminEmployeeIndex] = newName;
        if (oldName !== newName) {
            delete adminChamCongStaffConfig[oldName];
        }
    } else {
        adminChamCongEmployees.push(newName);
    }
    
    adminChamCongStaffConfig[newName] = { keys: keysArr, skills: skillsVal, role: roleVal, heSo: 1.0 };
    
    saveAdminChamCongData();
    closeAdminEmployeeModal();
}

function saveAdminChamCongData(showAlert = true) {
    if (showAlert) window.showGlobalLoading("Đang lưu danh sách nhân sự lên máy chủ...");

    // 1. Lưu ngay tức thì vào LocalStorage để tránh bị reset khi nạp lại
    try {
        localStorage.setItem(getChamCongStorageKey('med_chamcong_employees'), JSON.stringify(adminChamCongEmployees));
        localStorage.setItem(getChamCongStorageKey('med_chamcong_staff_config'), JSON.stringify(adminChamCongStaffConfig));
    } catch(e){}

    // 2. Gửi API lưu lên Cloudflare Worker CSDL D1
    callApi('saveEmployees', [adminChamCongEmployees]).then(() => {
        return callApi('saveErrorConfig', [{ staff: adminChamCongStaffConfig }]);
    }).then(() => {
        if (showAlert) {
            window.hideGlobalLoading();
            alert("Đã lưu danh sách nhân sự chấm công lên máy chủ!");
            try { renderAdminChamCongTable(); } catch(e) { console.error(e); }
        }
        // Luôn cập nhật Bảng Chấm Công (31 ngày) để đồng bộ theo thứ tự mới sắp xếp
        try { renderChamCongTable(); } catch(e) { console.error(e); }
    }).catch(err => {
        if (showAlert) {
            window.hideGlobalLoading();
            console.error(err);
            alert('Lỗi khi lưu nhân sự: ' + (err.message || err));
        } else {
            console.error('[ChamCong] saveAdminChamCongData error:', err);
        }
    });
}

// Auto load when opening Admin Tab
const originalSwitchAdminSection = window.switchAdminSection || function(s, b) {};
window.switchAdminSection = function(sectionId, btn) {
    originalSwitchAdminSection(sectionId, btn);
    if (sectionId === 'admin-sec-employees') {
        loadAdminChamCongData();
    }
};

        // ==========================================
        // TAB CHẤM CÔNG (TỪ PM CŨ)
        // ==========================================
        let chamCongData = {};
        window.chamCongData = chamCongData;
        let chamCongSaveTimeout = null;
        let chamCongIsDirty = false;
        let chamCongLastEditedTime = 0;
        let activeChamCongMonthYear = null;
        let isLoadingChamCong = false;

        function getChamCongMonthYear() {
            const ccM = document.getElementById('chamcong-month-picker');
            const ccY = document.getElementById('chamcong-year-picker');
            const tkM = document.getElementById('thongke-month-picker');
            const tkY = document.getElementById('thongke-year-picker');
            const now = new Date();
            const curM = now.getMonth() + 1;
            const curY = now.getFullYear();

            const isTkActive = document.getElementById('tab-thongke')?.classList.contains('active');
            let mVal, yVal;
            if (isTkActive) {
                mVal = (tkM && tkM.value) ? tkM.value : ((ccM && ccM.value) ? ccM.value : curM);
                yVal = (tkY && tkY.value) ? tkY.value : ((ccY && ccY.value) ? ccY.value : curY);
            } else {
                mVal = (ccM && ccM.value) ? ccM.value : ((tkM && tkM.value) ? tkM.value : curM);
                yVal = (ccY && ccY.value) ? ccY.value : ((tkY && tkY.value) ? tkY.value : curY);
            }

            const m = String(mVal).padStart(2, '0');
            const y = String(yVal);
            return `${y}-${m}`;
        }

        // ==========================================
        // QUẢN LÝ KÝ HIỆU CHẤM CÔNG ĐỘNG (SYMBOLS)
        // ==========================================
        // QUẢN LÝ KÝ HIỆU CHẤM CÔNG ĐỘNG (SYMBOLS)
        // ==========================================
        const DEFAULT_CHAMCONG_SYMBOLS = [
            { code: 'X', label: 'Cả ngày', value: 1.0, bg: '#ffffff', border: '#cbd5e1', color: '#1e293b', aliases: 'CA-NGAY, 1' },
            { code: 'X/2', label: 'Nửa ngày', value: 0.5, bg: '#ccfbf1', border: '#99f6e4', color: '#0f766e', aliases: '1/2, 0.5' },
            { code: 'S / C', label: 'Sáng / Chiều', value: 0.5, bg: '#d1fae5', border: '#a7f3d0', color: '#047857', aliases: 'S, C, SANG, CHIEU' },
            { code: 'Lễ', label: 'Nghỉ lễ', value: 0.0, bg: '#fee2e2', border: '#fca5a5', color: '#b91c1c', aliases: 'LE' },
            { code: 'Tết', label: 'Nghỉ Tết', value: 0.0, bg: '#fee2e2', border: '#fca5a5', color: '#b91c1c', aliases: 'TET' },
            { code: 'Nội', label: 'Trực / học nội trú', value: 0.0, bg: '#dbeafe', border: '#93c5fd', color: '#1d4ed8', aliases: 'NOI' },
            { code: 'Ô', label: 'Nghỉ ốm', value: 0.0, bg: '#ffedd5', border: '#fed7aa', color: '#c2410c', aliases: 'O' },
            { code: 'H', label: 'Học / Hội chẩn', value: 0.0, bg: '#fef3c7', border: '#fde68a', color: '#b45309', aliases: '' },
            { code: 'F', label: 'Nghỉ phép', value: 0.0, bg: '#fef3c7', border: '#fde68a', color: '#b45309', aliases: '' },
            { code: 'B', label: 'Nghỉ bù', value: 0.0, bg: '#fef3c7', border: '#fde68a', color: '#b45309', aliases: '' },
            { code: 'TS', label: 'Thai sản', value: 0.0, bg: '#f3e8ff', border: '#d8b4fe', color: '#6d28d9', aliases: '' },
            { code: 'ĐK / DK', label: 'Khám ngoại viện / Dã ngoại', value: 0.0, bg: '#f3e8ff', border: '#d8b4fe', color: '#6d28d9', aliases: 'DK, ĐK' },
            { code: 'K / V', label: 'Nghỉ việc riêng / Không lương', value: 0.0, bg: '#f1f5f9', border: '#cbd5e1', color: '#64748b', aliases: 'K, V, VANG' }
        ];
        let chamCongSymbols = [...DEFAULT_CHAMCONG_SYMBOLS];
        window.chamCongSymbols = chamCongSymbols;
        window.DEFAULT_CHAMCONG_SYMBOLS = DEFAULT_CHAMCONG_SYMBOLS;

        function findChamCongSymbol(str) {
            if (!str && str !== 0) return null;
            const s = String(str).trim().toUpperCase();
            if (!s) return null;
            if (!Array.isArray(chamCongSymbols) || chamCongSymbols.length === 0) return null;
            return chamCongSymbols.find(item => {
                if (!item || !item.code) return false;
                const codeUpper = String(item.code).trim().toUpperCase();
                if (codeUpper === s) return true;
                
                // Hỗ trợ mã gộp có dấu gạch chéo (VD: "S / C", "ĐK / DK", "K / V", v.v.)
                if (codeUpper.includes('/')) {
                    const slashParts = codeUpper.split('/').map(p => p.trim()).filter(Boolean);
                    if (slashParts.includes(s)) return true;
                }
                
                // Hỗ trợ aliases dạng chuỗi ("S, C") hoặc mảng (["S", "C"]) an toàn tuyệt đối
                if (item.aliases) {
                    let arr = [];
                    if (Array.isArray(item.aliases)) {
                        arr = item.aliases.map(a => String(a).trim().toUpperCase()).filter(Boolean);
                    } else if (typeof item.aliases === 'string') {
                        arr = item.aliases.split(/[,;\/]+/).map(a => a.trim().toUpperCase()).filter(Boolean);
                    }
                    if (arr.includes(s)) return true;
                }
                return false;
            }) || null;
        }
        window.findChamCongSymbol = findChamCongSymbol;

        function applySymbolStyleToInput(input, val) {
            if (!input) return;
            const sym = findChamCongSymbol(val);
            if (sym) {
                input.style.backgroundColor = sym.bg || '';
                input.style.borderColor = sym.border || sym.color || '#cbd5e1';
                input.style.color = sym.color || '';
                input.style.fontWeight = '700';
            } else {
                input.style.backgroundColor = '';
                input.style.borderColor = '';
                input.style.color = '';
                input.style.fontWeight = '';
            }
        }
        window.applySymbolStyleToInput = applySymbolStyleToInput;

        function loadChamCongSymbols(callback) {
            const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
            if (!apiFn) {
                renderChamCongLegend();
                if (callback) callback(chamCongSymbols);
                return;
            }
            apiFn('getChamCongSymbols', []).then(res => {
                let list = null;
                if (res && res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
                    list = res.data;
                } else if (Array.isArray(res) && res.length > 0) {
                    list = res;
                }
                if (list && list.length > 0) {
                    chamCongSymbols = list.map(sym => ({
                        ...sym,
                        aliases: Array.isArray(sym.aliases) ? sym.aliases.join(', ') : (sym.aliases || '')
                    }));
                    window.chamCongSymbols = chamCongSymbols;
                }
                renderChamCongLegend();
                if (callback) callback(chamCongSymbols);
            }).catch(err => {
                console.warn('[ChamCong] load symbols err:', err);
                renderChamCongLegend();
                if (callback) callback(chamCongSymbols);
            });
        }
        window.loadChamCongSymbols = loadChamCongSymbols;

        function renderChamCongLegend() {
            const container = document.getElementById('chamcong-legend-chips');
            if (!container) return;
            
            let html = '';
            chamCongSymbols.forEach(sym => {
                const valText = (sym.value !== undefined && sym.value !== null) ? `${sym.value} công` : '';
                const borderCol = sym.border || sym.color || '#cbd5e1';
                html += `
                    <div class="cc-symbol-chip" style="background: ${sym.bg}; border: 1px solid ${borderCol}; color: ${sym.color};" title="${sym.label || sym.code} (${valText})">
                        <span class="cc-symbol-code">${sym.code}</span>
                        <span>: ${sym.label || sym.code} (${valText})</span>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
        window.renderChamCongLegend = renderChamCongLegend;

        function updateSymbolPreviewBadge() {
            const code = document.getElementById('symbol-input-code')?.value.trim() || 'Xem';
            const bg = document.getElementById('symbol-input-bg')?.value || '#ffffff';
            const color = document.getElementById('symbol-input-color')?.value || '#1e293b';
            const badge = document.getElementById('symbol-preview-badge');
            if (badge) {
                badge.innerText = code;
                badge.style.backgroundColor = bg;
                badge.style.borderColor = color;
                badge.style.color = color;
            }
        }
        window.updateSymbolPreviewBadge = updateSymbolPreviewBadge;

        function openChamCongSymbolModal() {
            cancelEditChamCongSymbol();
            renderChamCongSymbolTable();
            const modal = document.getElementById('modal-chamcong-symbol');
            if (modal) modal.style.display = 'flex';
            
            const codeInput = document.getElementById('symbol-input-code');
            const bgInput = document.getElementById('symbol-input-bg');
            const colorInput = document.getElementById('symbol-input-color');
            if (codeInput) codeInput.oninput = updateSymbolPreviewBadge;
            if (bgInput) bgInput.oninput = updateSymbolPreviewBadge;
            if (colorInput) colorInput.oninput = updateSymbolPreviewBadge;
            updateSymbolPreviewBadge();
        }
        window.openChamCongSymbolModal = openChamCongSymbolModal;

        function closeChamCongSymbolModal() {
            const modal = document.getElementById('modal-chamcong-symbol');
            if (modal) modal.style.display = 'none';
        }
        window.closeChamCongSymbolModal = closeChamCongSymbolModal;

        function openAddChamCongSymbolModal() {
            openChamCongSymbolModal();
            const codeInput = document.getElementById('symbol-input-code');
            if (codeInput) codeInput.focus();
        }
        window.openAddChamCongSymbolModal = openAddChamCongSymbolModal;

        function renderChamCongSymbolTable() {
            const tbody = document.getElementById('chamcong-symbol-tbody');
            if (!tbody) return;
            
            let html = '';
            chamCongSymbols.forEach((sym, idx) => {
                const borderCol = sym.border || sym.color || '#cbd5e1';
                html += `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 6px 10px; text-align: center;">
                            <span style="display: inline-block; min-width: 28px; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 11px; background: ${sym.bg}; border: 1px solid ${borderCol}; color: ${sym.color};">
                                ${sym.code}
                            </span>
                        </td>
                        <td style="padding: 6px 10px;">
                            <div style="font-weight: 600; color: #1e293b;">${sym.label || sym.code}</div>
                            ${sym.aliases ? `<div style="font-size: 11px; color: #64748b;">Viết tắt: ${sym.aliases}</div>` : ''}
                        </td>
                        <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #2563eb;">
                            ${sym.value}
                        </td>
                        <td style="padding: 6px 10px; text-align: center;">
                            <button type="button" onclick="editChamCongSymbol(${idx})" style="padding: 3px 8px; font-size: 11px; border: 1px solid #93c5fd; background: #eff6ff; color: #1d4ed8; border-radius: 4px; cursor: pointer; margin-right: 4px;">Sửa</button>
                            <button type="button" onclick="deleteChamCongSymbol(${idx})" style="padding: 3px 8px; font-size: 11px; border: 1px solid #fca5a5; background: #fef2f2; color: #b91c1c; border-radius: 4px; cursor: pointer;">Xóa</button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }
        window.renderChamCongSymbolTable = renderChamCongSymbolTable;

        function editChamCongSymbol(index) {
            const sym = chamCongSymbols[index];
            if (!sym) return;
            
            document.getElementById('symbol-edit-index').value = index;
            document.getElementById('symbol-input-code').value = sym.code;
            document.getElementById('symbol-input-label').value = sym.label || '';
            document.getElementById('symbol-input-value').value = (sym.value !== undefined) ? sym.value : 1.0;
            document.getElementById('symbol-input-bg').value = sym.bg || '#ffffff';
            document.getElementById('symbol-input-color').value = sym.color || '#1e293b';
            
            document.getElementById('symbol-form-title').innerText = `✏️ Sửa Ký Hiệu "${sym.code}"`;
            document.getElementById('symbol-form-badge').style.display = 'inline-block';
            document.getElementById('btn-cancel-edit-symbol').style.display = 'inline-block';
            updateSymbolPreviewBadge();
            document.getElementById('symbol-input-code').focus();
        }
        window.editChamCongSymbol = editChamCongSymbol;

        function cancelEditChamCongSymbol() {
            document.getElementById('symbol-edit-index').value = '-1';
            document.getElementById('symbol-input-code').value = '';
            document.getElementById('symbol-input-label').value = '';
            document.getElementById('symbol-input-value').value = '1.0';
            document.getElementById('symbol-input-bg').value = '#ffffff';
            document.getElementById('symbol-input-color').value = '#1e293b';
            
            document.getElementById('symbol-form-title').innerText = '➕ Thêm Ký Hiệu Chấm Công Mới';
            document.getElementById('symbol-form-badge').style.display = 'none';
            document.getElementById('btn-cancel-edit-symbol').style.display = 'none';
            updateSymbolPreviewBadge();
        }
        window.cancelEditChamCongSymbol = cancelEditChamCongSymbol;

        function saveChamCongSymbolItem() {
            const editIndex = parseInt(document.getElementById('symbol-edit-index').value);
            const code = document.getElementById('symbol-input-code').value.trim();
            const label = document.getElementById('symbol-input-label').value.trim();
            const valRaw = document.getElementById('symbol-input-value').value;
            const bg = document.getElementById('symbol-input-bg').value;
            const color = document.getElementById('symbol-input-color').value;
            
            if (!code) {
                alert('Vui lòng nhập Mã ký hiệu!');
                return;
            }
            const val = parseFloat(valRaw);
            if (isNaN(val) || val < 0) {
                alert('Số công quy đổi phải là số >= 0!');
                return;
            }
            
            const dupIndex = chamCongSymbols.findIndex((s, idx) => s.code.toUpperCase() === code.toUpperCase() && idx !== editIndex);
            if (dupIndex !== -1) {
                alert(`Mã ký hiệu "${code}" đã tồn tại! Vui lòng chọn mã khác.`);
                return;
            }
            
            const newSym = {
                code: code,
                label: label || code,
                value: val,
                bg: bg,
                border: color,
                color: color,
                aliases: (editIndex >= 0 && chamCongSymbols[editIndex]?.aliases) ? chamCongSymbols[editIndex].aliases : ''
            };
            
            if (editIndex >= 0) {
                chamCongSymbols[editIndex] = newSym;
            } else {
                chamCongSymbols.push(newSym);
            }
            
            const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
            if (apiFn) {
                apiFn('saveChamCongSymbols', [chamCongSymbols]).catch(err => console.error('[ChamCong] save symbols error:', err));
            }
            
            cancelEditChamCongSymbol();
            renderChamCongSymbolTable();
            renderChamCongLegend();
            renderChamCongTable();
        }
        window.saveChamCongSymbolItem = saveChamCongSymbolItem;

        function deleteChamCongSymbol(index) {
            const sym = chamCongSymbols[index];
            if (!sym) return;
            if (!confirm(`Bạn có chắc chắn muốn xóa ký hiệu "${sym.code}" (${sym.label})?`)) return;
            
            chamCongSymbols.splice(index, 1);
            const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
            if (apiFn) {
                apiFn('saveChamCongSymbols', [chamCongSymbols]).catch(err => console.error('[ChamCong] delete symbol error:', err));
            }
            
            cancelEditChamCongSymbol();
            renderChamCongSymbolTable();
            renderChamCongLegend();
            renderChamCongTable();
        }
        window.deleteChamCongSymbol = deleteChamCongSymbol;

        function resetDefaultChamCongSymbols() {
            if (!confirm('Khôi phục danh sách ký hiệu về 13 ký hiệu chuẩn ban đầu?')) return;
            chamCongSymbols = JSON.parse(JSON.stringify(DEFAULT_CHAMCONG_SYMBOLS));
            window.chamCongSymbols = chamCongSymbols;
            
            const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
            if (apiFn) {
                apiFn('saveChamCongSymbols', [chamCongSymbols]).catch(err => console.error('[ChamCong] reset symbols error:', err));
            }
            
            cancelEditChamCongSymbol();
            renderChamCongSymbolTable();
            renderChamCongLegend();
            renderChamCongTable();
        }
        window.resetDefaultChamCongSymbols = resetDefaultChamCongSymbols;

        function commitChamCongCell(input, daysInMonth, triggerSave = true) {
            if (!input) return;
            const emp = input.getAttribute('data-emp');
            const day = input.getAttribute('data-day');
            if (!emp || !day) return;
            const rawVal = input.value;
            let val = rawVal ? rawVal.trim() : '';
            const upper = val.toUpperCase();

            // Chuẩn hóa ký hiệu trực quan & đồng bộ dữ liệu bản in
            const sym = findChamCongSymbol(upper);
            if (sym && sym.code && !sym.code.includes('/')) {
                val = sym.code;
            } else if (upper === 'CA-NGAY') val = 'X';
            else if (upper === 'SANG') val = 'S';
            else if (upper === 'CHIEU') val = 'C';
            else if (upper === 'LỄ' || upper === 'LE') val = 'Lễ';
            else if (upper === 'TẾT' || upper === 'TET') val = 'Tết';
            else if (upper === 'NỘI' || upper === 'NOI') val = 'Nội';
            else if (upper === 'X/2' || upper === '1/2') val = 'X/2';
            else if (upper === 'DK') val = 'ĐK';
            else if (val) val = upper;

            // Cập nhật thuộc tính value và màu sắc trực quan tức thì
            input.setAttribute('value', val);
            input.value = val;
            applySymbolStyleToInput(input, val);

            if (!chamCongData[emp]) chamCongData[emp] = {};
            const oldRaw = chamCongData[emp][day] || '';
            const oldVal = (typeof oldRaw === 'string' ? oldRaw.trim() : String(oldRaw));

            const norm = (v) => {
                if (!v) return '';
                const u = String(v).trim().toUpperCase();
                if (u === 'CA-NGAY') return 'X';
                if (u === 'SANG') return 'S';
                if (u === 'CHIEU') return 'C';
                if (u === 'LỄ' || u === 'LE') return 'LỄ';
                if (u === 'TẾT' || u === 'TET') return 'TẾT';
                if (u === 'NỘI' || u === 'NOI') return 'NỘI';
                if (u === 'DK') return 'ĐK';
                const matched = findChamCongSymbol(u);
                if (matched && matched.code && !matched.code.includes('/')) return matched.code.toUpperCase();
                return u;
            };

            // NẾU GIÁ TRỊ KHÔNG THAY ĐỔI -> THOÁT NGAY, KHÔNG DIRTY, KHÔNG LƯU!
            if (norm(val) === norm(oldVal)) {
                return;
            }

            if (val) {
                chamCongData[emp][day] = val;
            } else {
                delete chamCongData[emp][day];
            }
            window.chamCongData = chamCongData;
            chamCongIsDirty = true;
            chamCongLastEditedTime = Date.now();

            recalculateRowTotal(emp, daysInMonth);

            if (triggerSave && !isLoadingChamCong) {
                triggerAutoSaveChamCong();
            }
        }

        function commitHeSoCell(input, daysInMonth, triggerSave = true) {
            if (!input) return;
            const emp = input.getAttribute('data-emp');
            if (!emp) return;
            let val = parseFloat(input.value);
            if (isNaN(val) || val < 0) val = 1.0;
            if (val > 1) val = 1.0;
            input.value = val;

            if (!chamCongData[emp]) chamCongData[emp] = {};
            const oldHeSo = (chamCongData[emp].heSo !== undefined) ? parseFloat(chamCongData[emp].heSo) : 1.0;

            // NẾU HỆ SỐ KHÔNG THAY ĐỔI -> THOÁT NGAY!
            if (val === oldHeSo) {
                return;
            }

            chamCongData[emp].heSo = val;
            window.chamCongData = chamCongData;
            chamCongIsDirty = true;
            chamCongLastEditedTime = Date.now();

            recalculateRowTotal(emp, daysInMonth);
            if (triggerSave && !isLoadingChamCong) {
                triggerAutoSaveChamCong();
            }
        }

        function flushPendingChamCongSave() {
            // 1. Commit ngay ô input đang focus (nếu có)
            const activeEl = document.activeElement;
            if (activeEl && activeEl.classList) {
                const my = getChamCongMonthYear();
                const daysInMonth = new Date(my.split('-')[0], my.split('-')[1], 0).getDate();
                if (activeEl.classList.contains('cc-input-text')) {
                    commitChamCongCell(activeEl, daysInMonth, false);
                } else if (activeEl.classList.contains('heso-input')) {
                    commitHeSoCell(activeEl, daysInMonth, false);
                }
            }

            // 2. Lưu đồng bộ ngay vào LocalStorage
            const my = getChamCongMonthYear();
            if (chamCongData && Object.keys(chamCongData).length > 0) {
                setCachedChamCong(my, chamCongData);
            }

            // 3. Nếu có lệnh lưu đang chờ hoặc dữ liệu bị sửa đổi (dirty), gọi API lưu ngay lên server
            if (chamCongSaveTimeout || chamCongIsDirty) {
                if (chamCongSaveTimeout) {
                    clearTimeout(chamCongSaveTimeout);
                    chamCongSaveTimeout = null;
                }
                chamCongIsDirty = false;
                const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
                if (apiFn && chamCongData) {
                    apiFn('saveChamCong', [my, chamCongData]).then(() => {
                        const thead = document.getElementById('chamcong-thead');
                        if (thead) thead.style.opacity = '1';
                    }).catch(err => {
                        console.error('[ChamCong] flush save error:', err);
                        const thead = document.getElementById('chamcong-thead');
                        if (thead) thead.style.opacity = '1';
                    });
                }
            }
        }
        window.flushPendingChamCongSave = flushPendingChamCongSave;
        window.addEventListener('beforeunload', flushPendingChamCongSave);
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) flushPendingChamCongSave();
        });

        function loadChamCongData() {
            const my = getChamCongMonthYear();
            
            // Xử lý chuyển đổi tháng: Flush thay đổi dở dang của tháng cũ (nếu có) và reset bộ nhớ tạm
            if (activeChamCongMonthYear && activeChamCongMonthYear !== my) {
                if (chamCongIsDirty && chamCongData && Object.keys(chamCongData).length > 0) {
                    const prevMy = activeChamCongMonthYear;
                    const prevData = JSON.parse(JSON.stringify(chamCongData));
                    const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
                    if (apiFn) {
                        apiFn('saveChamCong', [prevMy, prevData]);
                    }
                    setCachedChamCong(prevMy, prevData);
                }
                chamCongData = {};
                window.chamCongData = chamCongData;
                chamCongIsDirty = false;
                chamCongLastEditedTime = 0;
            }
            activeChamCongMonthYear = my;
            isLoadingChamCong = true;

            // 1. Tải tức thì 0ms từ Local Cache nếu có
            const cached = getCachedChamCong(my);
            let hasCached = false;
            if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
                chamCongData = normalizeChamCongData(cached);
                window.chamCongData = chamCongData;
                renderChamCongTable();
                hasCached = true;
            }

            getOrLoadChamCongEmployees(() => {
                loadChamCongSymbols(() => {
                    renderChamCongLegend();
                    if (!hasCached) {
                        renderChamCongTable(); // Hiển thị khung bảng ngay lập tức không để trống
                    }
                    
                    const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
                    if (!apiFn) {
                        isLoadingChamCong = false;
                        return;
                    }

                    apiFn('getChamCong', [my]).then(res => {
                        isLoadingChamCong = false;
                        // Nếu tháng đã bị đổi sang tháng khác trong lúc request đang gửi thì bỏ qua
                        if (getChamCongMonthYear() !== my) return;

                        let raw = {};
                        if (res && res.status === 'success' && res.data) {
                            raw = res.data;
                        } else if (res && typeof res === 'object' && !res.status) {
                            raw = res;
                        }

                        // BẢO VỆ DỮ LIỆU CỤC BỘ (Safe Merge on Client):
                        const hasLocalData = chamCongData && Object.keys(chamCongData).some(k => Object.keys(chamCongData[k] || {}).length > 0);
                        const isRecentlyEdited = (Date.now() - chamCongLastEditedTime < 8000) && chamCongIsDirty && (activeChamCongMonthYear === my);
                        const serverIsEmpty = !raw || Object.keys(raw).length === 0;

                        if (!serverIsEmpty) {
                            const fresh = normalizeChamCongData(raw);
                            // HỢP NHẤT AN TOÀN: Giữ các ô vừa nhập/sửa trên máy, đắp lên dữ liệu đầy đủ từ server
                            if (hasLocalData && isRecentlyEdited) {
                                for (const emp in chamCongData) {
                                    if (!fresh[emp]) fresh[emp] = {};
                                    for (const d in chamCongData[emp]) {
                                        fresh[emp][d] = chamCongData[emp][d];
                                    }
                                }
                            }
                            chamCongData = fresh;
                            window.chamCongData = chamCongData;
                            setCachedChamCong(my, fresh);
                            renderChamCongTable();
                        } else if (hasLocalData && isRecentlyEdited) {
                            setCachedChamCong(my, chamCongData);
                            triggerAutoSaveChamCong();
                        }
                    }).catch(err => {
                        isLoadingChamCong = false;
                        console.warn('[ChamCong] background fetch err:', err);
                    });
                });
            });
        }

        function isHoliday(y, m, d) {
            const date = new Date(y, m - 1, d);
            return date.getDay() === 0; // Chỉ Chủ Nhật mới nghỉ cố định
        }

        function getWeekdayName(y, m, d) {
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            return days[new Date(y, m - 1, d).getDay()];
        }

        function formatDisplayValue(val) {
            if (!val && val !== 0) return '';
            if (typeof val === 'number') return String(val);
            if (typeof val !== 'string') return '';
            val = val.trim();
            const upper = val.toUpperCase();
            if (upper === 'CA-NGAY') return 'X';
            if (upper === 'SANG') return 'S';
            if (upper === 'CHIEU') return 'C';
            if (upper === 'LỄ' || upper === 'LE') return 'Lễ';
            if (upper === 'TẾT' || upper === 'TET') return 'Tết';
            if (upper === 'NỘI' || upper === 'NOI') return 'Nội';
            if (upper === 'X/2' || upper === '1/2') return 'X/2';
            if (upper === 'DK') return 'ĐK';

            const sym = findChamCongSymbol(upper);
            if (sym && sym.code) {
                if (sym.code.includes('/')) {
                    return upper;
                }
                return sym.code;
            }
            return val;
        }

        function calcDayValue(val) {
            if (!val && val !== 0) return 0;
            if (typeof val === 'number') return Math.min(2, Math.max(0, val));
            if (typeof val !== 'string') return 0;
            val = val.trim();
            if (!val) return 0;
            const upper = val.toUpperCase();

            // 1. Khớp theo ký hiệu cấu hình động (Dynamic Symbols)
            try {
                const sym = findChamCongSymbol(upper);
                if (sym && sym.value !== undefined) {
                    return parseFloat(sym.value) || 0;
                }
            } catch(e) {
                console.warn('[ChamCong] findChamCongSymbol error:', e);
            }

            // Fallback ký hiệu mặc định nếu chưa khớp
            if (['TS', 'ĐK', 'DK', 'O', 'Ô', 'NGHỈ', 'NGHI', 'V', 'K', 'LỄ', 'LE', 'TẾT', 'TET', 'NỘI', 'NOI', 'H', 'F', 'B', 'P'].includes(upper)) return 0;
            if (['X/2', '1/2', '0.5', 'S', 'C', 'SANG', 'CHIEU'].includes(upper)) return 0.5;
            if (['X', 'CA-NGAY', '1'].includes(upper)) return 1;

            const parsedNum = parseFloat(val);
            if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 2) return parsedNum;

            if (upper.includes('X/2') || upper.includes('1/2')) return 0.5;

            let total = 0;
            const parts = upper.split(/[\+\-\s,]+/);
            parts.forEach(p => {
                const subSym = findChamCongSymbol(p);
                if (subSym && subSym.value !== undefined) {
                    total += (parseFloat(subSym.value) || 0);
                } else if (p === 'S' || p === 'C' || p === 'SANG' || p === 'CHIEU') {
                    total += 0.5;
                } else if (p === 'X' || p === 'CA-NGAY' || p === '1') {
                    total += 1;
                }
            });
            return total > 2 ? 2 : total;
        }
        window.calcDayValue = calcDayValue;

        function enableHolidayCell(td, emp, day) {
            td.onclick = null;
            td.innerHTML = `
                <input type="text" class="cc-input-text" data-emp="${emp}" data-day="${day}" value="" style="border: 1px solid #fef08a;">
            `;
            const input = td.querySelector('input');
            input.focus();
            
            const daysInMonth = new Date(getChamCongMonthYear().split('-')[0], getChamCongMonthYear().split('-')[1], 0).getDate();
            ['input', 'change', 'blur'].forEach(evtType => {
                input.addEventListener(evtType, (e) => {
                    commitChamCongCell(e.target, daysInMonth, true);
                });
            });
        }

        function renderChamCongTable() {
            const my = getChamCongMonthYear();
            const [year, month] = my.split('-');
            const daysInMonth = new Date(year, month, 0).getDate();

            const thead = document.getElementById('chamcong-thead');
            const tbody = document.getElementById('chamcong-body');
            if (!thead || !tbody) return;

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const currentDay = now.getDate();
            const isCurrentMonthView = (parseInt(year) === currentYear && parseInt(month) === currentMonth);

            let theadHtml = `<tr>
                <th rowspan="2" style="vertical-align: middle;">TÊN NHÂN VIÊN</th>
                <th rowspan="2" style="vertical-align: middle;">HỆ SỐ</th>`;
            let weekHtml = `<tr>`;

            for (let d = 1; d <= daysInMonth; d++) {
                const isOff = isHoliday(year, month, d);
                const isToday = isCurrentMonthView && (d === currentDay);
                const bgClass = isOff ? 'bg-holiday' : '';
                const todayClass = isToday ? 'col-today' : '';
                
                theadHtml += `<th class="${bgClass} ${todayClass}" id="chamcong-day-${d}-th" ${isToday ? 'data-is-today="1"' : ''} style="min-width: ${isToday ? '32px' : '28px'}; width: ${isToday ? '32px' : '28px'};" title="${isToday ? 'Hôm nay (Ngày ' + d + ')' : 'Ngày ' + d}">${d}</th>`;
                weekHtml += `<th class="${bgClass} ${isToday ? 'th-today-sub' : ''}" style="min-width: ${isToday ? '32px' : '28px'}; width: ${isToday ? '32px' : '28px'};">${getWeekdayName(year, month, d)}</th>`;
            }
            
            theadHtml += `<th rowspan="2" style="vertical-align: middle;">TỔNG CÔNG</th></tr>`;
            weekHtml += `</tr>`;
            
            thead.innerHTML = theadHtml + weekHtml;

            // Tính chiều cao thực của hàng 1 và gán top động cho hàng 2 để sticky đúng vị trí khi cuộn
            requestAnimationFrame(() => {
                const firstRow = thead.querySelector('tr:first-child');
                const secondRowThs = thead.querySelectorAll('tr:nth-child(2) th');
                if (firstRow && secondRowThs.length > 0) {
                    const row1Height = firstRow.offsetHeight || 18;
                    secondRowThs.forEach(th => {
                        th.style.setProperty('top', row1Height + 'px', 'important');
                    });
                }
            });

            tbody.innerHTML = '';
            let grandTotalChamCong = 0;

            adminChamCongEmployees = cleanseAdminChamCongEmployees(adminChamCongEmployees);
            if ((!adminChamCongEmployees || adminChamCongEmployees.length === 0) && isBVTKS_CS2) {
                adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
            }
            ensureStaffConfigForEmployees();

            if (!adminChamCongEmployees || adminChamCongEmployees.length === 0) {
                const colSpan = daysInMonth + 3;
                tbody.innerHTML = '<tr><td colspan="' + colSpan + '" style="text-align:center; padding:30px; color:#64748b; font-size:13px; font-weight:500;">' +
                    '⚠️ Đơn vị này chưa có danh sách nhân sự chấm công. Vui lòng vào <b>Quản trị ➔ Nhân sự chấm công & thống kê</b> hoặc bấm chuyển sang tab <b>🧑‍⚕️ Danh Sách Nhân Sự</b> để thêm nhân viên.' +
                    '</td></tr>';
                return;
            }

            adminChamCongEmployees.forEach(emp => {
                if (!chamCongData[emp]) chamCongData[emp] = {};
                const tr = document.createElement('tr');
                const heSo = (chamCongData[emp] && chamCongData[emp].heSo !== undefined) ? parseFloat(chamCongData[emp].heSo) : 1.0;
                
                let rowHtml = `<td>${emp}</td>
                               <td>
                                 <input type="number" class="heso-input" data-emp="${emp}" value="${heSo}" min="0" max="1" step="0.1">
                               </td>`;

                let tongCong = 0;

                for (let d = 1; d <= daysInMonth; d++) {
                    const rawVal = chamCongData[emp][d] || '';
                    tongCong += calcDayValue(rawVal);
                    const isOff = isHoliday(year, month, d);
                    const isToday = isCurrentMonthView && (d === currentDay);
                    const bgClass = isOff ? 'bg-holiday' : '';
                    const todayClass = isToday ? 'col-today' : '';
                    const displayVal = formatDisplayValue(rawVal);

                    if (isOff && !displayVal) {
                        rowHtml += `
                            <td class="${bgClass} ${todayClass}" onclick="enableHolidayCell(this, '${emp}', ${d})">
                                <div style="color: #a16207; font-style: italic; font-size: 10px; font-weight: 600; cursor: pointer; line-height: 20px; user-select: none;">Nghỉ</div>
                            </td>
                        `;
                    } else {
                        rowHtml += `
                            <td class="${bgClass} ${todayClass}">
                                <input type="text" class="cc-input-text" data-emp="${emp}" data-day="${d}" 
                                       value="${displayVal}">
                            </td>
                        `;
                    }
                }
                const tongCongHeso = Math.round((tongCong * heSo) * 100) / 100;
                grandTotalChamCong += tongCongHeso;
                rowHtml += `<td class="tong-cong-cell" data-emp-total="${emp}">${tongCongHeso}</td>`;
                
                tr.innerHTML = rowHtml;
                tbody.appendChild(tr);
            });

            // HÀNG TỔNG CỘNG BẢNG CHẤM CÔNG
            grandTotalChamCong = Math.round(grandTotalChamCong * 100) / 100;
            let dayTotalCells = '';
            for (let d = 1; d <= daysInMonth; d++) {
                dayTotalCells += `<td></td>`;
            }
            const trGrandTotal = document.createElement('tr');
            trGrandTotal.className = 'chamcong-total-row';
            trGrandTotal.innerHTML = `
                <td style="font-weight: 800; text-align: left; padding: 0 8px !important; text-transform: uppercase;">TỔNG CỘNG</td>
                <td>-</td>
                ${dayTotalCells}
                <td class="tong-cong-cell grand-total-cell" id="chamcong-grand-total" style="font-weight: 900; color: #1d4ed8 !important; font-size: 12px;">${grandTotalChamCong}</td>
            `;
            tbody.appendChild(trGrandTotal);

            attachChamCongEvents(daysInMonth);

            // Tự động cuộn theo thứ tự: [Cột Hệ số] -> [Cột Ngày trước] -> [Cột Ngày hiện tại]
            setTimeout(() => {
                const container = document.getElementById('table-chamcong-container');
                if (container) {
                    if (isCurrentMonthView && currentDay >= 1 && currentDay <= daysInMonth) {
                        const targetDay = (currentDay > 1) ? (currentDay - 1) : currentDay;
                        const targetTh = document.getElementById(`chamcong-day-${targetDay}-th`);
                        if (targetTh) {
                            const stickyOffset = 226; // 190px Họ tên + 36px Hệ số
                            const targetLeft = Math.max(0, targetTh.offsetLeft - stickyOffset);
                            container.scrollTo({ left: targetLeft, behavior: 'smooth' });
                        }
                    } else {
                        container.scrollTo({ left: 0, behavior: 'smooth' });
                    }
                }
            }, 100);
        }

        function attachChamCongEvents(daysInMonth) {
            document.querySelectorAll('.cc-input-text').forEach(input => {
                applySymbolStyleToInput(input, input.value);
                ['input', 'change', 'blur'].forEach(evtType => {
                    input.addEventListener(evtType, (e) => {
                        commitChamCongCell(e.target, daysInMonth, true);
                    });
                });

                input.addEventListener('keydown', (e) => {
                    let nextInput = null;
                    const currentDay = parseInt(e.target.getAttribute('data-day'));
                    const currentEmp = e.target.getAttribute('data-emp');
                    const empIndex = adminChamCongEmployees.indexOf(currentEmp);

                    if (e.key === 'ArrowUp' && empIndex > 0) {
                        e.preventDefault();
                        const prevEmp = adminChamCongEmployees[empIndex - 1];
                        nextInput = document.querySelector(`.cc-input-text[data-emp="${prevEmp}"][data-day="${currentDay}"]`);
                    } else if ((e.key === 'ArrowDown' || e.key === 'Enter') && empIndex < adminChamCongEmployees.length - 1) {
                        e.preventDefault();
                        const nextEmp = adminChamCongEmployees[empIndex + 1];
                        nextInput = document.querySelector(`.cc-input-text[data-emp="${nextEmp}"][data-day="${currentDay}"]`);
                    } else if (e.key === 'ArrowLeft' && currentDay > 1) {
                        if (e.target.selectionStart === 0) {
                            e.preventDefault();
                            nextInput = document.querySelector(`.cc-input-text[data-emp="${currentEmp}"][data-day="${currentDay - 1}"]`);
                        }
                    } else if (e.key === 'ArrowRight' && currentDay < daysInMonth) {
                        if (e.target.selectionEnd === e.target.value.length) {
                            e.preventDefault();
                            nextInput = document.querySelector(`.cc-input-text[data-emp="${currentEmp}"][data-day="${currentDay + 1}"]`);
                        }
                    }
                    if (nextInput) {
                        nextInput.focus();
                        nextInput.select();
                    }
                });
            });

            document.querySelectorAll('.heso-input').forEach(input => {
                ['input', 'change', 'blur'].forEach(evtType => {
                    input.addEventListener(evtType, (e) => {
                        commitHeSoCell(e.target, daysInMonth, true);
                    });
                });
            });
        }

        function recalculateRowTotal(emp, daysInMonth) {
            let tongCong = 0;
            const data = chamCongData[emp] || {};
            for (let d = 1; d <= daysInMonth; d++) {
                tongCong += calcDayValue(data[d]);
            }
            const heSo = data.heSo !== undefined ? parseFloat(data.heSo) : 1.0;
            const totalHeso = Math.round((tongCong * heSo) * 100) / 100;
            
            const totalCell = document.querySelector(`.tong-cong-cell[data-emp-total="${emp}"]`);
            if (totalCell) totalCell.innerText = totalHeso;

            recalculateChamCongGrandTotal();
        }

        function recalculateChamCongGrandTotal() {
            let grandTotal = 0;
            document.querySelectorAll('.tong-cong-cell[data-emp-total]').forEach(cell => {
                const val = parseFloat(cell.innerText) || 0;
                grandTotal += val;
            });
            grandTotal = Math.round(grandTotal * 100) / 100;
            const grandTotalEl = document.getElementById('chamcong-grand-total');
            if (grandTotalEl) grandTotalEl.innerText = grandTotal;
        }

        function triggerAutoSaveChamCong() {
            if (isLoadingChamCong) return;
            const my = activeChamCongMonthYear || getChamCongMonthYear();
            // Lưu lạc quan ngay lập tức vào Local Cache để không bị mất khi chuyển tab/reload
            setCachedChamCong(my, chamCongData);
            chamCongIsDirty = true;
            chamCongLastEditedTime = Date.now();

            if (chamCongSaveTimeout) clearTimeout(chamCongSaveTimeout);
            const thead = document.getElementById('chamcong-thead');
            if (thead) thead.style.opacity = '0.7';

            chamCongSaveTimeout = setTimeout(() => {
                if (isLoadingChamCong) {
                    if (thead) thead.style.opacity = '1';
                    return;
                }
                const targetMy = my;
                const targetData = JSON.parse(JSON.stringify(chamCongData));
                const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
                if (!apiFn) {
                    if (thead) thead.style.opacity = '1';
                    return;
                }
                apiFn('saveChamCong', [targetMy, targetData]).then(() => {
                    chamCongIsDirty = false;
                    if (thead) thead.style.opacity = '1';
                }).catch(err => {
                    console.error('[ChamCong] auto-save error:', err);
                    if (thead) thead.style.opacity = '1';
                });
            }, 350);
        }

        // Tự động set tháng hiện tại & render sẵn bảng khi load
        document.addEventListener('DOMContentLoaded', () => {
            const today = new Date();
            const curM = today.getMonth() + 1;
            const curY = today.getFullYear();
            const monthEl = document.getElementById('chamcong-month-picker');
            const yearEl = document.getElementById('chamcong-year-picker');
            const tkM = document.getElementById('thongke-month-picker');
            const tkY = document.getElementById('thongke-year-picker');
            if (monthEl) monthEl.value = curM;
            if (yearEl) yearEl.value = curY;
            if (tkM) tkM.value = curM;
            if (tkY) tkY.value = curY;

            loadChamCongSymbols(() => {
                renderChamCongLegend();
                // Pre-render sẵn bảng Chấm Công và Thống Kê
                try { renderChamCongTable(); } catch(e) { console.error(e); }
                try { renderThongKeTable(); } catch(e) { console.error(e); }
            });
        });

        // ==========================================
        // TAB THỐNG KÊ TỔNG HỢP (TỪ PM CŨ)
        // ==========================================
        let thongKeMode = 'current';
        let thongKeData = {};
        let thongKeQuarterData = { chamcong: {}, thuthuat: {} };
        let tempThuThuatData = null;

        function loadThongKeData() {
            const modeSelect = document.getElementById('thongke-mode');
            const mode = modeSelect ? modeSelect.value : 'current';
            thongKeMode = mode;
            
            getOrLoadChamCongEmployees(() => {
                if (mode === 'current') {
                    const my = getChamCongMonthYear();
                    
                    // 1. Tải tức thì 0ms từ Local Cache nếu có
                    const cachedCC = getCachedChamCong(my);
                    const cachedTK = getCachedThongKe(my);
                    let hasCached = false;
                    if (cachedCC || cachedTK) {
                        if (cachedCC) chamCongData = normalizeChamCongData(cachedCC);
                        if (cachedTK) thongKeData = normalizeThongKeData(cachedTK);
                        renderThongKeTable();
                        hasCached = true;
                    }

                    if (!hasCached) {
                        renderThongKeTable(); // Hiển thị khung bảng ngay lập tức
                    }

                    const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
                    if (!apiFn) return;

                    // 2. Chạy đồng bộ ngầm song song cả Chấm Công & Thống Kê (Parallel Execution)
                    const pCC = new Promise(resolve => {
                        apiFn('getChamCong', [my], 
                            res => resolve((res && res.data) ? res.data : (res || {})),
                            () => resolve(cachedCC || {})
                        );
                    });
                    const pTT = new Promise(resolve => {
                        apiFn('getThongKeThuThuat', [my], 
                            res => resolve((res && res.data) ? res.data : (res || {})),
                            () => resolve(cachedTK || {})
                        );
                    });

                    Promise.all([pCC, pTT]).then(([rawCC, rawTT]) => {
                        if (getChamCongMonthYear() !== my) return;
                        const freshCC = normalizeChamCongData(rawCC);
                        const freshTT = normalizeThongKeData(rawTT);

                        chamCongData = freshCC;
                        window.chamCongData = chamCongData;
                        setCachedChamCong(my, freshCC);

                        thongKeData = freshTT;
                        setCachedThongKe(my, freshTT);
                        renderThongKeTable();
                    }).catch(err => {
                        console.warn('[ThongKe] Background load error:', err);
                        renderThongKeTable();
                    });
                } else if (mode === 'custom') {
                    const startVal = document.getElementById('custom-start-date').value;
                    const endVal = document.getElementById('custom-end-date').value;
                    if (!startVal || !endVal) {
                        alert("Vui lòng chọn đầy đủ thời gian Từ và Đến!");
                        return;
                    }
                    const [startY, startM] = startVal.split('-').map(Number);
                    const [endY, endM] = endVal.split('-').map(Number);
                    if (startY * 12 + startM > endY * 12 + endM) {
                        alert("Thời gian bắt đầu không được lớn hơn thời gian kết thúc!");
                        return;
                    }
                    let months = [];
                    let curr = new Date(startY, startM - 1, 1);
                    const end = new Date(endY, endM - 1, 1);
                    while (curr <= end) {
                        const y = curr.getFullYear();
                        const m = String(curr.getMonth() + 1).padStart(2, '0');
                        months.push(`${y}-${m}`);
                        curr.setMonth(curr.getMonth() + 1);
                    }
                    fetchMultiMonthsData(months, `khoảng thời gian từ ${startVal} đến ${endVal}`);
                } else {
                    // Quý (q1, q2, q3, q4)
                    const year = document.getElementById('chamcong-year-picker') ? document.getElementById('chamcong-year-picker').value : new Date().getFullYear().toString();
                    let months = [];
                    let qName = '';
                    if (mode === 'q1') { months = [`${year}-01`, `${year}-02`, `${year}-03`]; qName = 'Quý I (' + year + ')'; }
                    else if (mode === 'q2') { months = [`${year}-04`, `${year}-05`, `${year}-06`]; qName = 'Quý II (' + year + ')'; }
                    else if (mode === 'q3') { months = [`${year}-07`, `${year}-08`, `${year}-09`]; qName = 'Quý III (' + year + ')'; }
                    else if (mode === 'q4') { months = [`${year}-10`, `${year}-11`, `${year}-12`]; qName = 'Quý IV (' + year + ')'; }
                    fetchMultiMonthsData(months, qName);
                }
            });
        }

        function fetchSingleMonthData(my) {
            const cachedCC = getCachedChamCong(my);
            const cachedTK = getCachedThongKe(my);

            const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
            if (!apiFn) {
                return Promise.resolve({
                    month: my,
                    data: {
                        chamcong: normalizeChamCongData(cachedCC || {}),
                        thuthuat: normalizeThongKeData(cachedTK || {})
                    }
                });
            }

            const pCC = new Promise(resolve => {
                apiFn('getChamCong', [my], 
                    res => resolve((res && res.data) ? res.data : (res || {})),
                    () => resolve(cachedCC || {})
                );
            });
            const pTT = new Promise(resolve => {
                apiFn('getThongKeThuThuat', [my], 
                    res => resolve((res && res.data) ? res.data : (res || {})),
                    () => resolve(cachedTK || {})
                );
            });

            return Promise.all([pCC, pTT]).then(([rawCC, rawTT]) => {
                const normCC = normalizeChamCongData(rawCC);
                const normTT = normalizeThongKeData(rawTT);
                setCachedChamCong(my, normCC);
                setCachedThongKe(my, normTT);
                return {
                    month: my,
                    data: {
                        chamcong: normCC,
                        thuthuat: normTT
                    }
                };
            });
        }
        window.calcDayValue = calcDayValue;
        window.fetchSingleMonthData = fetchSingleMonthData;

        function fetchMultiMonthsData(months, label) {
            window.showGlobalLoading("Đang tổng hợp dữ liệu " + label + "...");
            
            Promise.all(months.map(my => fetchSingleMonthData(my))).then(results => {
                window.hideGlobalLoading();
                let mergedChamCong = {};
                let mergedThuThuat = {};

                results.forEach(item => {
                    const mData = item.data || {};
                    const cc = mData.chamcong || {};
                    const tt = mData.thuthuat || {};

                    // Gộp chấm công theo canonical full name
                    Object.keys(cc).forEach(emp => {
                        const canon = getCanonicalStaffName(emp);
                        if (!canon) return;
                        if (!mergedChamCong[canon]) mergedChamCong[canon] = 0;
                        let rawCong = 0;
                        Object.keys(cc[emp]).forEach(key => {
                            if (key !== 'heSo') {
                                rawCong += calcDayValue(cc[emp][key]);
                            }
                        });
                        const heSo = cc[emp].heSo !== undefined ? parseFloat(cc[emp].heSo) : 1.0;
                        mergedChamCong[canon] += Math.round((rawCong * heSo) * 100) / 100;
                    });

                    // Gộp thủ thuật theo canonical full name
                    Object.keys(tt).forEach(emp => {
                        const canon = getCanonicalStaffName(emp);
                        if (!canon) return;
                        if (!mergedThuThuat[canon]) mergedThuThuat[canon] = { loai1: 0, loai2: 0, loai3: 0, khac: 0 };
                        mergedThuThuat[canon].loai1 += (tt[emp].loai1 || 0);
                        mergedThuThuat[canon].loai2 += (tt[emp].loai2 || 0);
                        mergedThuThuat[canon].loai3 += (tt[emp].loai3 || 0);
                        mergedThuThuat[canon].khac += (tt[emp].khac || 0);
                    });
                });

                thongKeQuarterData.chamcong = mergedChamCong;
                thongKeQuarterData.thuthuat = mergedThuThuat;

                getOrLoadChamCongEmployees(() => {
                    renderThongKeTable();
                });
            }).catch(err => {
                window.hideGlobalLoading();
                console.error(err);
                alert("Lỗi khi tải dữ liệu tổng hợp: " + err);
            });
        }

        function renderThongKeTable() {
            const tbody = document.getElementById('thongke-body');
            if(!tbody) return;
            tbody.innerHTML = '';
            
            // Luôn đảm bảo adminChamCongEmployees sạch và lấy chuẩn từ Tab Admin
            adminChamCongEmployees = cleanseAdminChamCongEmployees(adminChamCongEmployees);
            if ((!adminChamCongEmployees || adminChamCongEmployees.length === 0) && isBVTKS_CS2) {
                adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
            }
            ensureStaffConfigForEmployees();

            if (!adminChamCongEmployees || adminChamCongEmployees.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:35px 20px; color:#64748b; font-size:13px; font-weight:500; background:#f8fafc;">
                    <div style="font-size:24px; margin-bottom:8px;">👥</div>
                    <div>Đơn vị chưa có danh sách nhân sự.</div>
                    <div style="font-size:11.5px; color:#94a3b8; margin-top:4px;">Vui lòng thêm nhân sự tại <b>Quản trị ➔ Cài đặt hệ thống ➔ Nhân sự chấm công & thống kê</b>.</div>
                </td></tr>`;
                return;
            }

            const isQ = (thongKeMode !== 'current');
            const sourceChamCong = isQ ? thongKeQuarterData.chamcong : null;
            const sourceThuThuat = isQ ? thongKeQuarterData.thuthuat : thongKeData;

            let sumTongCong = 0;
            let sumLoai1 = 0;
            let sumLoai2 = 0;
            let sumLoai3 = 0;
            let sumKhac = 0;
            let sumTotalThuThuat = 0;

            adminChamCongEmployees.forEach(emp => {
                const tr = document.createElement('tr');
                const t = (sourceThuThuat && sourceThuThuat[emp]) ? sourceThuThuat[emp] : (sourceThuThuat ? (findStaffDataByKey(sourceThuThuat, emp) || { loai1: 0, loai2: 0, loai3: 0, khac: 0 }) : { loai1: 0, loai2: 0, loai3: 0, khac: 0 });
                
                let tongCong = 0;
                if (isQ) {
                    tongCong = (sourceChamCong && sourceChamCong[emp] !== undefined) ? Math.round(sourceChamCong[emp] * 100) / 100 : (sourceChamCong ? Math.round((findStaffDataByKey(sourceChamCong, emp) || 0) * 100) / 100 : 0);
                } else {
                    const empCC = chamCongData[emp] || findStaffDataByKey(chamCongData, emp);
                    if (empCC) {
                        const myParts = getChamCongMonthYear().split('-');
                        const daysInMonth = new Date(parseInt(myParts[0]), parseInt(myParts[1]), 0).getDate();
                        for (let d = 1; d <= daysInMonth; d++) {
                            tongCong += calcDayValue(empCC[d] || '');
                        }
                        const heSo = empCC.heSo !== undefined ? parseFloat(empCC.heSo) : 1.0;
                        tongCong = Math.round((tongCong * heSo) * 100) / 100;
                    }
                }

                const totalThuThuat = (t.loai1 || 0) + (t.loai2 || 0) + (t.loai3 || 0) + (t.khac || 0);

                sumTongCong += tongCong;
                sumLoai1 += (t.loai1 || 0);
                sumLoai2 += (t.loai2 || 0);
                sumLoai3 += (t.loai3 || 0);
                sumKhac += (t.khac || 0);
                sumTotalThuThuat += totalThuThuat;

                tr.innerHTML = `
                    <td><strong>${emp}</strong></td>
                    <td style="color: #2563eb; font-weight: 700;">${tongCong}</td>
                    <td>${t.loai1 || 0}</td>
                    <td>${t.loai2 || 0}</td>
                    <td>${t.loai3 || 0}</td>
                    <td style="color: #64748b;">${t.khac || 0}</td>
                    <td style="font-weight: 800; color: #16a34a;">${totalThuThuat}</td>
                `;
                tbody.appendChild(tr);
            });

            // HÀNG TỔNG CỘNG CÁC CỘT
            sumTongCong = Math.round(sumTongCong * 100) / 100;
            const trTotal = document.createElement('tr');
            trTotal.style.cssText = 'background: #f1f5f9; font-weight: 800; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;';
            trTotal.innerHTML = `
                <td style="color: #0f172a; font-weight: 800; text-transform: uppercase;">TỔNG CỘNG</td>
                <td style="color: #1d4ed8; font-weight: 800;">${sumTongCong}</td>
                <td style="color: #0f172a; font-weight: 800;">${sumLoai1}</td>
                <td style="color: #0f172a; font-weight: 800;">${sumLoai2}</td>
                <td style="color: #0f172a; font-weight: 800;">${sumLoai3}</td>
                <td style="color: #475569; font-weight: 800;">${sumKhac}</td>
                <td style="font-weight: 900; color: #15803d; font-size: 14px;">${sumTotalThuThuat}</td>
            `;
            tbody.appendChild(trTotal);
        }

        // Init Excel Uploader for Thống Kê
        document.getElementById('excel-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            window.showGlobalLoading("Đang đọc file Excel...");
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const dataRows = XLSX.utils.sheet_to_json(worksheet, { header: "A", defval: "", blankrows: true });

                    processThuThuatExcelData(dataRows);
                } catch (err) {
                    console.error(err);
                    alert("Có lỗi khi đọc file Excel.");
                } finally {
                    window.hideGlobalLoading();
                }
            };
            reader.readAsArrayBuffer(file);
            e.target.value = '';
        });

        function processThuThuatExcelData(dataRows) {
            adminChamCongEmployees = cleanseAdminChamCongEmployees(adminChamCongEmployees);
            if ((!adminChamCongEmployees || adminChamCongEmployees.length === 0) && isBVTKS_CS2) {
                adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
            }
            ensureStaffConfigForEmployees();

            tempThuThuatData = {};
            adminChamCongEmployees.forEach(emp => {
                tempThuThuatData[emp] = { 
                    loai1: 0, loai2: 0, loai3: 0, khac: 0,
                    loai1_old: 0, loai1_new: 0,
                    loai2_old: 0, loai2_new: 0,
                    loai3_old: 0, loai3_new: 0
                };
            });

            const changeDate = new Date(2026, 6, 15); // 15/07/2026

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (!row) continue;

                const loaiTT = row['AN'];
                let rawEmpName = row['AT'];

                if (!rawEmpName) continue;
                rawEmpName = String(rawEmpName).trim();
                if (!rawEmpName) continue;
                
                const rawEmpNameNormalized = rawEmpName.normalize('NFC').toLowerCase();
                if (rawEmpNameNormalized.includes('thủ thuật viên') || rawEmpNameNormalized.includes('tên nhân viên')) continue;

                let matchedEmp = null;
                const cleanRaw = rawEmpNameNormalized.replace(/^(bs\.|bs|ktv\.|ktv|đd\.|đd|dd\.|dd)\s+/, '').trim();
                
                for (const emp of adminChamCongEmployees) {
                    const staff = adminChamCongStaffConfig[emp] || { keys: [emp.toLowerCase().trim()] };
                    const empLower = emp.toLowerCase().trim();
                    
                    if (rawEmpNameNormalized === empLower || cleanRaw === empLower) {
                        matchedEmp = emp;
                        break;
                    }
                    if (staff.keys && (staff.keys.includes(rawEmpNameNormalized) || staff.keys.includes(cleanRaw))) {
                        matchedEmp = emp;
                        break;
                    }
                    for (const k of (staff.keys || [])) {
                        const lk = k.toLowerCase().trim();
                        if (rawEmpNameNormalized === lk || cleanRaw === lk || rawEmpNameNormalized.includes(lk) || lk.includes(rawEmpNameNormalized)) {
                            matchedEmp = emp;
                            break;
                        }
                    }
                    if (matchedEmp) break;
                }
                
                if (!matchedEmp) continue;

                if (loaiTT) {
                    const strLoai = String(loaiTT).normalize('NFC').toLowerCase();
                    let isNewPrice = true;
                    let dateStr = row['AH'] || row['Ngày giờ làm PTTT'] || '';
                    if (dateStr !== '') {
                        if (typeof dateStr === 'number' || !isNaN(Number(dateStr))) {
                            const excelDays = Number(dateStr);
                            const jsDate = new Date(Math.round((excelDays - 25569) * 86400 * 1000));
                            isNewPrice = jsDate >= changeDate;
                        } else {
                            const str = String(dateStr).trim();
                            const match1 = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                            if (match1) {
                                const day = parseInt(match1[1]);
                                const month = parseInt(match1[2]);
                                const year = parseInt(match1[3]);
                                if (month > 12) {
                                    const d = new Date(year, day - 1, month);
                                    isNewPrice = d >= changeDate;
                                } else {
                                    const d = new Date(year, month - 1, day);
                                    isNewPrice = d >= changeDate;
                                }
                            } else {
                                const match2 = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                                if (match2) {
                                    const d = new Date(parseInt(match2[1]), parseInt(match2[2]) - 1, parseInt(match2[3]));
                                    isNewPrice = d >= changeDate;
                                } else {
                                    const parsed = Date.parse(str);
                                    if (!isNaN(parsed)) {
                                        isNewPrice = new Date(parsed) >= changeDate;
                                    }
                                }
                            }
                        }
                    }

                    if (strLoai.includes('loại 1')) {
                        tempThuThuatData[matchedEmp].loai1++;
                        if (isNewPrice) tempThuThuatData[matchedEmp].loai1_new++; else tempThuThuatData[matchedEmp].loai1_old++;
                    } else if (strLoai.includes('loại 2')) {
                        tempThuThuatData[matchedEmp].loai2++;
                        if (isNewPrice) tempThuThuatData[matchedEmp].loai2_new++; else tempThuThuatData[matchedEmp].loai2_old++;
                    } else if (strLoai.includes('loại 3')) {
                        tempThuThuatData[matchedEmp].loai3++;
                        if (isNewPrice) tempThuThuatData[matchedEmp].loai3_new++; else tempThuThuatData[matchedEmp].loai3_old++;
                    } else {
                        tempThuThuatData[matchedEmp].khac++;
                    }
                } else {
                    tempThuThuatData[matchedEmp].khac++;
                }
            }

            renderPreviewThuThuatTable();
        }

        function renderPreviewThuThuatTable() {
            const tbody = document.getElementById('preview-thuthuat-body');
            tbody.innerHTML = '';
            
            let sumLoai1 = 0, sumLoai2 = 0, sumLoai3 = 0, sumKhac = 0, sumTotal = 0;

            adminChamCongEmployees.forEach(emp => {
                const t = tempThuThuatData[emp];
                if (!t) return;
                const totalThuThuat = t.loai1 + t.loai2 + t.loai3 + t.khac;
                if (totalThuThuat === 0) return;

                sumLoai1 += t.loai1;
                sumLoai2 += t.loai2;
                sumLoai3 += t.loai3;
                sumKhac += t.khac;
                sumTotal += totalThuThuat;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${emp}</strong></td>
                    <td>${t.loai1}</td>
                    <td>${t.loai2}</td>
                    <td>${t.loai3}</td>
                    <td style="color: #64748b;">${t.khac}</td>
                    <td style="font-weight: 800; color: #16a34a;">${totalThuThuat}</td>
                `;
                tbody.appendChild(tr);
            });

            // HÀNG TỔNG CỘNG CHO BẢNG XEM TRƯỚC
            const trTotal = document.createElement('tr');
            trTotal.style.cssText = 'background: #f1f5f9; font-weight: 800; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;';
            trTotal.innerHTML = `
                <td style="color: #0f172a; font-weight: 800; text-transform: uppercase;">TỔNG CỘNG</td>
                <td style="color: #0f172a; font-weight: 800;">${sumLoai1}</td>
                <td style="color: #0f172a; font-weight: 800;">${sumLoai2}</td>
                <td style="color: #0f172a; font-weight: 800;">${sumLoai3}</td>
                <td style="color: #475569; font-weight: 800;">${sumKhac}</td>
                <td style="font-weight: 900; color: #15803d; font-size: 14px;">${sumTotal}</td>
            `;
            tbody.appendChild(trTotal);

            document.getElementById('main-thongke-container').style.display = 'none';
            document.getElementById('preview-section').style.display = 'block';
        }

        document.getElementById('btn-submit-thuthuat').addEventListener('click', () => {
            if (!tempThuThuatData) return;
            thongKeData = tempThuThuatData;
            tempThuThuatData = null;

            document.getElementById('preview-section').style.display = 'none';
            document.getElementById('main-thongke-container').style.display = 'flex';

            renderThongKeTable();
            saveThuThuatToServer();
        });

        function saveThuThuatToServer() {
            const my = getChamCongMonthYear();
            setCachedThongKe(my, thongKeData);
            window.showGlobalLoading("Đang lưu dữ liệu thủ thuật...");
            const apiFn = typeof callApi === 'function' ? callApi : window.callApi;
            if (!apiFn) {
                window.hideGlobalLoading();
                return;
            }
            apiFn('saveThongKeThuThuat', [my, thongKeData]).then(() => {
                window.hideGlobalLoading();
                alert("Đã lưu dữ liệu thủ thuật lên máy chủ!");
            }).catch(err => {
                window.hideGlobalLoading();
                console.error(err);
                alert("Lỗi khi lưu dữ liệu thủ thuật!");
            });
        }

        document.getElementById('thongke-mode').addEventListener('change', (e) => {
            const tkContainer = document.getElementById('thongke-month-year-container');
            const customContainer = document.getElementById('custom-range-picker-container');
            if (e.target.value === 'custom') {
                if (customContainer) customContainer.style.display = 'flex';
                if (tkContainer) tkContainer.style.display = 'none';
            } else if (e.target.value === 'current') {
                if (customContainer) customContainer.style.display = 'none';
                if (tkContainer) tkContainer.style.display = 'inline-flex';
                loadThongKeData();
            } else {
                if (customContainer) customContainer.style.display = 'none';
                if (tkContainer) tkContainer.style.display = 'none';
                loadThongKeData();
            }
        });

        document.getElementById('btn-custom-range-search').addEventListener('click', () => {
            loadThongKeData();
        });

        // ==========================================
        // CẤU HÌNH ĐƠN GIÁ THỦ THUẬT (VNĐ)
        // ==========================================
        function getProcedurePrices() {
            return {
                l1: parseInt(localStorage.getItem('med_price_l1')) || 75000,
                l2: parseInt(localStorage.getItem('med_price_l2')) || 39000,
                l3: parseInt(localStorage.getItem('med_price_l3')) || 30000,
                l1_old: parseInt(localStorage.getItem('med_price_old_l1')) || 37500,
                l2_old: parseInt(localStorage.getItem('med_price_old_l2')) || 19500,
                l3_old: parseInt(localStorage.getItem('med_price_old_l3')) || 15000
            };
        }

        function initPriceConfigUI() {
            const p = getProcedurePrices();
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val;
            };
            setVal('price-old-l1', p.l1_old);
            setVal('price-old-l2', p.l2_old);
            setVal('price-old-l3', p.l3_old);
            setVal('price-l1', p.l1);
            setVal('price-l2', p.l2);
            setVal('price-l3', p.l3);
        }

        function saveProcedurePrices() {
            const getVal = (id, defaultVal) => {
                const el = document.getElementById(id);
                return el ? parseInt(el.value) || defaultVal : defaultVal;
            };

            const l1_old = getVal('price-old-l1', 37500);
            const l2_old = getVal('price-old-l2', 19500);
            const l3_old = getVal('price-old-l3', 15000);
            const l1 = getVal('price-l1', 75000);
            const l2 = getVal('price-l2', 39000);
            const l3 = getVal('price-l3', 30000);

            localStorage.setItem('med_price_old_l1', l1_old);
            localStorage.setItem('med_price_old_l2', l2_old);
            localStorage.setItem('med_price_old_l3', l3_old);
            localStorage.setItem('med_price_l1', l1);
            localStorage.setItem('med_price_l2', l2);
            localStorage.setItem('med_price_l3', l3);

            initPriceConfigUI();
            alert('Đã lưu cấu hình đơn giá thủ thuật thành công!');
        }

        // ==========================================
        // ĐỌC TIỀN BẰNG CHỮ (CHUẨN VIỆT NAM)
        // ==========================================
        function readMoneyVietnamese(num) {
            if (!num || num === 0) return "Không đồng chẵn.";
            num = Math.round(num);
            const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
            const textNumbers = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

            function readBlock(n, isFull) {
                let text = "";
                const c = Math.floor(n / 100);
                const b = Math.floor((n % 100) / 10);
                const a = n % 10;

                if (isFull || c > 0) text += textNumbers[c] + " trăm ";
                
                if (b === 0) {
                    if (a > 0 && (isFull || c > 0)) text += "lẻ ";
                } else if (b === 1) {
                    text += "mười ";
                } else {
                    text += textNumbers[b] + " mươi ";
                }

                if (a > 0) {
                    if (b > 1 && a === 1) text += "mốt ";
                    else if (b > 0 && a === 5) text += "lăm ";
                    else text += textNumbers[a] + " ";
                }
                return text.trim();
            }

            let textStr = "";
            let i = 0;
            let pNum = num;
            while (pNum > 0) {
                let block = pNum % 1000;
                let hasMore = Math.floor(pNum / 1000) > 0;
                if (block > 0) {
                    let str = readBlock(block, hasMore);
                    textStr = str + " " + units[i] + " " + textStr;
                } else if (hasMore && i === 3) {
                    textStr = units[i] + " " + textStr;
                }
                pNum = Math.floor(pNum / 1000);
                i++;
            }

            textStr = textStr.trim();
            return textStr.charAt(0).toUpperCase() + textStr.slice(1) + " đồng chẵn.";
        }

        // ==========================================
        // XUẤT EXCEL: BẢNG CHẤM CÔNG, BÁO CÁO THỦ THUẬT, THỰC LĨNH
        // ==========================================
        function saveExcelBuffer(buffer, fileName) {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 300);
        }

        function getThongKeTimeLabel() {
            const mode = document.getElementById('thongke-mode')?.value || 'current';
            const now = new Date();
            const year = parseInt(document.getElementById('chamcong-year-picker')?.value || document.getElementById('thongke-year-picker')?.value || now.getFullYear());
            const month = parseInt(document.getElementById('chamcong-month-picker')?.value || document.getElementById('thongke-month-picker')?.value || (now.getMonth() + 1));
            
            let endYear = year;
            let endMonth = month;
            let titleStr = '';
            let label = '';
            let fileSuffix = '';

            if (mode === 'current') {
                endYear = year;
                endMonth = month;
                const mStr = String(month).padStart(2, '0');
                titleStr = `THÁNG ${mStr} NĂM ${year}`;
                label = `Tháng ${mStr} năm ${year}`;
                fileSuffix = `Thang_${mStr}_${year}`;
            } else if (mode === 'q1') {
                endYear = year;
                endMonth = 3;
                titleStr = `QUÝ I NĂM ${year}`;
                label = `Quý I năm ${year} (Tháng 1 - 3)`;
                fileSuffix = `Quy_I_${year}`;
            } else if (mode === 'q2') {
                endYear = year;
                endMonth = 6;
                titleStr = `QUÝ II NĂM ${year}`;
                label = `Quý II năm ${year} (Tháng 4 - 6)`;
                fileSuffix = `Quy_II_${year}`;
            } else if (mode === 'q3') {
                endYear = year;
                endMonth = 9;
                titleStr = `QUÝ III NĂM ${year}`;
                label = `Quý III năm ${year} (Tháng 7 - 9)`;
                fileSuffix = `Quy_III_${year}`;
            } else if (mode === 'q4') {
                endYear = year;
                endMonth = 12;
                titleStr = `QUÝ IV NĂM ${year}`;
                label = `Quý IV năm ${year} (Tháng 10 - 12)`;
                fileSuffix = `Quy_IV_${year}`;
            } else if (mode === 'custom') {
                const startVal = document.getElementById('custom-start-date')?.value || `${year}-01`;
                const endVal = document.getElementById('custom-end-date')?.value || `${year}-${String(month).padStart(2, '0')}`;
                const [startY, startM] = startVal.split('-').map(Number);
                const [endY, endM] = endVal.split('-').map(Number);
                endYear = endY;
                endMonth = endM;
                const sMStr = String(startM).padStart(2, '0');
                const eMStr = String(endM).padStart(2, '0');
                titleStr = `TỪ THÁNG ${sMStr}/${startY} ĐẾN THÁNG ${eMStr}/${endY}`;
                label = `Từ tháng ${sMStr}/${startY} đến tháng ${eMStr}/${endY}`;
                fileSuffix = `Tu_${sMStr}_${startY}_Den_${eMStr}_${endY}`;
            }

            const lastDay = new Date(endYear, endMonth, 0).getDate();
            const lastDayStr = String(lastDay).padStart(2, '0');
            const endMonthStr = String(endMonth).padStart(2, '0');
            const dateSignStr = `Mạo Khê, ngày ${lastDayStr} tháng ${endMonthStr} năm ${endYear}`;

            return {
                label,
                titleStr,
                fileSuffix,
                year: endYear,
                month: endMonth,
                lastDay,
                lastDayStr,
                endMonthStr,
                dateSignStr
            };
        }

        function getEmpTotalCong(emp, isQuarter) {
            if (isQuarter) {
                return (thongKeQuarterData.chamcong && thongKeQuarterData.chamcong[emp] !== undefined) 
                    ? Math.round(thongKeQuarterData.chamcong[emp] * 100) / 100 
                    : 0;
            } else {
                if (!chamCongData[emp]) return 0;
                const my = getChamCongMonthYear();
                const [year, month] = my.split('-');
                const daysInMonth = new Date(year, month, 0).getDate();
                let sum = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                    sum += calcDayValue(chamCongData[emp][d] || '');
                }
                const heSo = chamCongData[emp].heSo !== undefined ? parseFloat(chamCongData[emp].heSo) : 1.0;
                return Math.round((sum * heSo) * 100) / 100;
            }
        }

        function getEmpRawCong(emp, isQuarter) {
            if (isQuarter) {
                return (thongKeQuarterData.rawChamCong && thongKeQuarterData.rawChamCong[emp] !== undefined) 
                    ? Math.round(thongKeQuarterData.rawChamCong[emp] * 100) / 100 
                    : getEmpTotalCong(emp, isQuarter);
            } else {
                if (!chamCongData[emp]) return 0;
                const my = getChamCongMonthYear();
                const [year, month] = my.split('-');
                const daysInMonth = new Date(year, month, 0).getDate();
                let sum = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                    sum += calcDayValue(chamCongData[emp][d] || '');
                }
                return Math.round(sum * 100) / 100;
            }
        }

        // 1. Xuất file Bảng Chấm Công
        function exportChamCongExcel() {
            if (typeof ExcelJS === 'undefined') {
                alert("Thư viện ExcelJS đang nạp, vui lòng thử lại sau giây lát!");
                return;
            }
            adminChamCongEmployees = cleanseAdminChamCongEmployees(adminChamCongEmployees);
            if ((!adminChamCongEmployees || adminChamCongEmployees.length === 0) && isBVTKS_CS2) {
                adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
            }
            ensureStaffConfigForEmployees();
            if (adminChamCongEmployees.length === 0) {
                alert("Chưa có danh sách nhân sự chấm công để xuất!");
                return;
            }

            const my = getChamCongMonthYear();
            const [year, month] = my.split('-');
            const daysInMonth = new Date(year, month, 0).getDate();

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'T.I.M.E.S System - ' + (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2');
            workbook.created = new Date();
            const ws = workbook.addWorksheet(`Chấm Công T${month}.${year}`, {
                views: [{ showGridLines: true }]
            });

            // Tiêu đề bệnh viện
            ws.getCell('A1').value = (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2').toUpperCase();
            ws.getCell('A1').font = { name: 'Times New Roman', size: 11, bold: true };
            
            ws.getCell('A2').value = 'KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG';
            ws.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true, italic: true };

            // Tiêu đề bảng
            const totalCols = daysInMonth + 4; // STT, Họ tên, Hệ số, 1..N, Tổng công
            ws.mergeCells(4, 1, 4, totalCols);
            const titleCell = ws.getCell(4, 1);
            titleCell.value = `BẢNG CHẤM CÔNG THÁNG ${month} NĂM ${year}`;
            titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF1E40AF' } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getRow(4).height = 28;

            // Header 2 tầng (Row 6 & 7)
            ws.mergeCells(6, 1, 7, 1); // STT
            ws.getCell(6, 1).value = 'STT';

            ws.mergeCells(6, 2, 7, 2); // HỌ VÀ TÊN
            ws.getCell(6, 2).value = 'HỌ VÀ TÊN';

            ws.mergeCells(6, 3, 7, 3); // HỆ SỐ
            ws.getCell(6, 3).value = 'HỆ SỐ';

            for (let d = 1; d <= daysInMonth; d++) {
                const colIdx = 3 + d;
                const isOff = isHoliday(year, month, d);
                
                const dayCell = ws.getCell(6, colIdx);
                dayCell.value = `Ngày ${d}`;
                
                const weekCell = ws.getCell(7, colIdx);
                weekCell.value = getWeekdayName(year, month, d);
            }

            ws.mergeCells(6, totalCols, 7, totalCols); // TỔNG CÔNG
            ws.getCell(6, totalCols).value = 'TỔNG CÔNG';

            // Định dạng chung cho Header
            for (let r = 6; r <= 7; r++) {
                ws.getRow(r).height = 22;
                for (let c = 1; c <= totalCols; c++) {
                    const cell = ws.getCell(r, c);
                    cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                    };
                }
            }

            // Tô màu vàng cho các cột Chủ Nhật trong Header
            for (let d = 1; d <= daysInMonth; d++) {
                if (isHoliday(year, month, d)) {
                    const colIdx = 3 + d;
                    [6, 7].forEach(r => {
                        const cell = ws.getCell(r, colIdx);
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
                        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FF854D0E' } };
                    });
                }
            }

            // Ghi dữ liệu từng nhân sự (Row 8 trở đi)
            let startDataRow = 8;
            let sumTotalCong = 0;

            adminChamCongEmployees.forEach((emp, idx) => {
                const r = startDataRow + idx;
                ws.getRow(r).height = 20;

                const heSo = (chamCongData[emp] && chamCongData[emp].heSo !== undefined) ? parseFloat(chamCongData[emp].heSo) : 1.0;
                let tongCong = 0;

                // STT
                const cSTT = ws.getCell(r, 1);
                cSTT.value = idx + 1;
                cSTT.alignment = { vertical: 'middle', horizontal: 'center' };

                // Họ Tên
                const cName = ws.getCell(r, 2);
                cName.value = emp;
                cName.font = { name: 'Times New Roman', size: 11, bold: true };
                cName.alignment = { vertical: 'middle', horizontal: 'left' };

                // Hệ số
                const cHeSo = ws.getCell(r, 3);
                cHeSo.value = heSo;
                cHeSo.alignment = { vertical: 'middle', horizontal: 'center' };

                // Ngày 1..N
                for (let d = 1; d <= daysInMonth; d++) {
                    const colIdx = 3 + d;
                    const rawVal = chamCongData[emp] ? (chamCongData[emp][d] || '') : '';
                    tongCong += calcDayValue(rawVal);
                    const isOff = isHoliday(year, month, d);
                    const cell = ws.getCell(r, colIdx);
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };

                    const displayVal = formatDisplayValue(rawVal);
                    if (isOff && !displayVal) {
                        cell.value = 'Nghỉ';
                        cell.font = { name: 'Times New Roman', size: 9.5, italic: true, color: { argb: 'FFA16207' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
                    } else {
                        cell.value = displayVal;
                        cell.font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FF1E293B' } };
                        if (isOff) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
                        }
                    }
                }

                // Tổng công
                const tongCongHeso = Math.round((tongCong * heSo) * 100) / 100;
                sumTotalCong += tongCongHeso;

                const cTotal = ws.getCell(r, totalCols);
                cTotal.value = tongCongHeso;
                cTotal.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1E40AF' } };
                cTotal.alignment = { vertical: 'middle', horizontal: 'center' };

                // Viền cho cả dòng
                for (let c = 1; c <= totalCols; c++) {
                    ws.getCell(r, c).border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };
                }
            });

            // Hàng Tổng Cộng
            const totalRowIdx = startDataRow + adminChamCongEmployees.length;
            ws.mergeCells(totalRowIdx, 1, totalRowIdx, 3);
            const totLabel = ws.getCell(totalRowIdx, 1);
            totLabel.value = 'TỔNG CỘNG TOÀN KHOA';
            totLabel.font = { name: 'Times New Roman', size: 11, bold: true };
            totLabel.alignment = { vertical: 'middle', horizontal: 'center' };

            const totVal = ws.getCell(totalRowIdx, totalCols);
            totVal.value = Math.round(sumTotalCong * 100) / 100;
            totVal.font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF1E40AF' } };
            totVal.alignment = { vertical: 'middle', horizontal: 'center' };

            for (let c = 1; c <= totalCols; c++) {
                const cell = ws.getCell(totalRowIdx, c);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.border = {
                    top: { style: 'medium', color: { argb: 'FF94A3B8' } },
                    bottom: { style: 'double', color: { argb: 'FF94A3B8' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };
            }

            // Phần ký tên (Signatures)
            const lastDayCC = new Date(year, month, 0).getDate();
            const lastDayCCStr = String(lastDayCC).padStart(2, '0');
            const monthCCStr = String(month).padStart(2, '0');
            const sigRow = totalRowIdx + 2;
            ws.getCell(sigRow, Math.max(1, totalCols - 5)).value = `Mạo Khê, ngày ${lastDayCCStr} tháng ${monthCCStr} năm ${year}`;
            ws.getCell(sigRow, Math.max(1, totalCols - 5)).font = { name: 'Times New Roman', size: 11, italic: true };

            const sigTitleRow = sigRow + 1;
            ws.getCell(sigTitleRow, 2).value = 'NGƯỜI LẬP BIỂU';
            ws.getCell(sigTitleRow, 2).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(sigTitleRow, 2).alignment = { horizontal: 'center' };

            const midCol = Math.floor(totalCols / 2);
            ws.getCell(sigTitleRow, midCol).value = 'TRƯỞNG KHOA';
            ws.getCell(sigTitleRow, midCol).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(sigTitleRow, midCol).alignment = { horizontal: 'center' };

            ws.getCell(sigTitleRow, totalCols - 1).value = 'GIÁM ĐỐC';
            ws.getCell(sigTitleRow, totalCols - 1).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(sigTitleRow, totalCols - 1).alignment = { horizontal: 'center' };

            const sigSubRow = sigTitleRow + 1;
            [2, midCol, totalCols - 1].forEach(col => {
                const c = ws.getCell(sigSubRow, col);
                c.value = '(Ký, họ tên)';
                c.font = { name: 'Times New Roman', size: 9.5, italic: true };
                c.alignment = { horizontal: 'center' };
            });

            // Set column widths
            ws.getColumn(1).width = 6;
            ws.getColumn(2).width = 24;
            ws.getColumn(3).width = 9;
            for (let d = 1; d <= daysInMonth; d++) {
                ws.getColumn(3 + d).width = 6.2;
            }
            ws.getColumn(totalCols).width = 14;

            workbook.xlsx.writeBuffer().then(buffer => {
                saveExcelBuffer(buffer, `Bang_Cham_Cong_Thang_${month}_${year}.xlsx`);
            }).catch(err => {
                console.error("Lỗi xuất Excel:", err);
                alert("Lỗi xuất file Excel: " + err.message);
            });
        }

        // 2. Xuất file Báo Cáo Thống Kê Thủ Thuật (Chuẩn 3 Sheet Phần Mềm Cũ)
        function exportThongKeExcel() {
            if (typeof ExcelJS === 'undefined') {
                alert("Thư viện ExcelJS đang nạp, vui lòng thử lại sau giây lát!");
                return;
            }
            adminChamCongEmployees = cleanseAdminChamCongEmployees(adminChamCongEmployees);
            if ((!adminChamCongEmployees || adminChamCongEmployees.length === 0) && isBVTKS_CS2) {
                adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
            }
            ensureStaffConfigForEmployees();
            if (adminChamCongEmployees.length === 0) {
                alert("Chưa có danh sách nhân sự để xuất báo cáo!");
                return;
            }

            const timeInfo = getThongKeTimeLabel();
            const isQ = (thongKeMode !== 'current');
            const sourceThuThuat = isQ ? thongKeQuarterData.thuthuat : thongKeData;
            const prices = getProcedurePrices();

            const isOldPeriod = (timeInfo.year < 2026 || (timeInfo.year === 2026 && timeInfo.month < 7));

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'T.I.M.E.S System - ' + (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2');
            workbook.created = new Date();

            // ================= SHEET 1: BẢNG TỔNG HỢP CHI TIẾT =================
            const ws1 = workbook.addWorksheet('Bảng Tiền Chi Tiết', { views: [{ showGridLines: true }] });
            
            ws1.getCell('A1').value = (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2').toUpperCase();
            ws1.getCell('A1').font = { name: 'Times New Roman', size: 11, bold: true };
            
            ws1.getCell('A2').value = 'KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG';
            ws1.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true, italic: true };

            ws1.mergeCells('A4:I4');
            const titleCell1 = ws1.getCell('A4');
            titleCell1.value = 'BẢNG TỔNG HỢP TIỀN THỦ THUẬT';
            titleCell1.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF1E40AF' } };
            titleCell1.alignment = { vertical: 'middle', horizontal: 'center' };
            ws1.getRow(4).height = 28;

            ws1.mergeCells('A5:I5');
            const subTitleCell1 = ws1.getCell('A5');
            subTitleCell1.value = `(${timeInfo.label})`;
            subTitleCell1.font = { name: 'Times New Roman', size: 11, italic: true, color: { argb: 'FF475569' } };
            subTitleCell1.alignment = { vertical: 'middle', horizontal: 'center' };
            ws1.getRow(5).height = 20;

            const headers1 = ['STT', 'HỌ VÀ TÊN', 'TT LOẠI 1 (SL)', 'THÀNH TIỀN L1', 'TT LOẠI 2 (SL)', 'THÀNH TIỀN L2', 'TT LOẠI 3 (SL)', 'THÀNH TIỀN L3', 'TỔNG TIỀN (VNĐ)'];
            ws1.getRow(7).height = 28;
            headers1.forEach((h, i) => {
                const cell = ws1.getCell(7, i + 1);
                cell.value = h;
                cell.font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
                    bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };
            });

            let startRow1 = 8;
            let sumL1 = 0, sumL2 = 0, sumL3 = 0;
            let sumMoneyL1 = 0, sumMoneyL2 = 0, sumMoneyL3 = 0, sumTotalAll = 0;

            adminChamCongEmployees.forEach((emp, idx) => {
                const r = startRow1 + idx;
                ws1.getRow(r).height = 22;

                const t = (sourceThuThuat && sourceThuThuat[emp]) ? sourceThuThuat[emp] : {};
                let l1_old = t.loai1_old, l1_new = t.loai1_new;
                if (l1_old === undefined && l1_new === undefined) {
                    if (isOldPeriod) { l1_old = t.loai1 || 0; l1_new = 0; }
                    else { l1_old = 0; l1_new = t.loai1 || 0; }
                }
                const l1_total = (t.loai1 || (l1_old + l1_new)) || 0;
                const l1_money = (l1_old || 0) * prices.l1_old + (l1_new || 0) * prices.l1;

                let l2_old = t.loai2_old, l2_new = t.loai2_new;
                if (l2_old === undefined && l2_new === undefined) {
                    if (isOldPeriod) { l2_old = t.loai2 || 0; l2_new = 0; }
                    else { l2_old = 0; l2_new = t.loai2 || 0; }
                }
                const l2_total = (t.loai2 || (l2_old + l2_new)) || 0;
                const l2_money = (l2_old || 0) * prices.l2_old + (l2_new || 0) * prices.l2;

                let l3_old = t.loai3_old, l3_new = t.loai3_new;
                if (l3_old === undefined && l3_new === undefined) {
                    if (isOldPeriod) { l3_old = t.loai3 || 0; l3_new = 0; }
                    else { l3_old = 0; l3_new = t.loai3 || 0; }
                }
                const l3_total = (t.loai3 || (l3_old + l3_new)) || 0;
                const l3_money = (l3_old || 0) * prices.l3_old + (l3_new || 0) * prices.l3;

                const rowMoney = l1_money + l2_money + l3_money;

                sumL1 += l1_total; sumL2 += l2_total; sumL3 += l3_total;
                sumMoneyL1 += l1_money; sumMoneyL2 += l2_money; sumMoneyL3 += l3_money;
                sumTotalAll += rowMoney;

                ws1.getCell(r, 1).value = idx + 1;
                ws1.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'center' };

                ws1.getCell(r, 2).value = emp;
                ws1.getCell(r, 2).font = { name: 'Times New Roman', size: 11, bold: true };
                ws1.getCell(r, 2).alignment = { vertical: 'middle', horizontal: 'left' };

                ws1.getCell(r, 3).value = l1_total || '';
                ws1.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'center' };

                ws1.getCell(r, 4).value = l1_money || '';
                ws1.getCell(r, 4).numFmt = '#,##0';
                ws1.getCell(r, 4).alignment = { vertical: 'middle', horizontal: 'right' };

                ws1.getCell(r, 5).value = l2_total || '';
                ws1.getCell(r, 5).alignment = { vertical: 'middle', horizontal: 'center' };

                ws1.getCell(r, 6).value = l2_money || '';
                ws1.getCell(r, 6).numFmt = '#,##0';
                ws1.getCell(r, 6).alignment = { vertical: 'middle', horizontal: 'right' };

                ws1.getCell(r, 7).value = l3_total || '';
                ws1.getCell(r, 7).alignment = { vertical: 'middle', horizontal: 'center' };

                ws1.getCell(r, 8).value = l3_money || '';
                ws1.getCell(r, 8).numFmt = '#,##0';
                ws1.getCell(r, 8).alignment = { vertical: 'middle', horizontal: 'right' };

                ws1.getCell(r, 9).value = rowMoney || '';
                ws1.getCell(r, 9).numFmt = '#,##0';
                ws1.getCell(r, 9).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF15803D' } };
                ws1.getCell(r, 9).alignment = { vertical: 'middle', horizontal: 'right' };

                for (let c = 1; c <= 9; c++) {
                    ws1.getCell(r, c).border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };
                }
            });

            // Tổng cộng Sheet 1
            const totalRow1 = startRow1 + adminChamCongEmployees.length;
            ws1.getRow(totalRow1).height = 24;
            ws1.mergeCells(totalRow1, 1, totalRow1, 2);
            ws1.getCell(totalRow1, 1).value = 'TỔNG CỘNG';
            ws1.getCell(totalRow1, 1).font = { name: 'Times New Roman', size: 11, bold: true };
            ws1.getCell(totalRow1, 1).alignment = { vertical: 'middle', horizontal: 'center' };

            ws1.getCell(totalRow1, 3).value = sumL1;
            ws1.getCell(totalRow1, 3).font = { bold: true };
            ws1.getCell(totalRow1, 3).alignment = { vertical: 'middle', horizontal: 'center' };

            ws1.getCell(totalRow1, 4).value = sumMoneyL1;
            ws1.getCell(totalRow1, 4).numFmt = '#,##0';
            ws1.getCell(totalRow1, 4).font = { bold: true };
            ws1.getCell(totalRow1, 4).alignment = { vertical: 'middle', horizontal: 'right' };

            ws1.getCell(totalRow1, 5).value = sumL2;
            ws1.getCell(totalRow1, 5).font = { bold: true };
            ws1.getCell(totalRow1, 5).alignment = { vertical: 'middle', horizontal: 'center' };

            ws1.getCell(totalRow1, 6).value = sumMoneyL2;
            ws1.getCell(totalRow1, 6).numFmt = '#,##0';
            ws1.getCell(totalRow1, 6).font = { bold: true };
            ws1.getCell(totalRow1, 6).alignment = { vertical: 'middle', horizontal: 'right' };

            ws1.getCell(totalRow1, 7).value = sumL3;
            ws1.getCell(totalRow1, 7).font = { bold: true };
            ws1.getCell(totalRow1, 7).alignment = { vertical: 'middle', horizontal: 'center' };

            ws1.getCell(totalRow1, 8).value = sumMoneyL3;
            ws1.getCell(totalRow1, 8).numFmt = '#,##0';
            ws1.getCell(totalRow1, 8).font = { bold: true };
            ws1.getCell(totalRow1, 8).alignment = { vertical: 'middle', horizontal: 'right' };

            ws1.getCell(totalRow1, 9).value = sumTotalAll;
            ws1.getCell(totalRow1, 9).numFmt = '#,##0';
            ws1.getCell(totalRow1, 9).font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF15803D' } };
            ws1.getCell(totalRow1, 9).alignment = { vertical: 'middle', horizontal: 'right' };

            for (let c = 1; c <= 9; c++) {
                const cell = ws1.getCell(totalRow1, c);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.border = {
                    top: { style: 'medium', color: { argb: 'FF94A3B8' } },
                    bottom: { style: 'double', color: { argb: 'FF94A3B8' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };
            }

            // Dòng đọc tiền bằng chữ Sheet 1
            const readMoneyRow1 = totalRow1 + 1;
            ws1.mergeCells(`A${readMoneyRow1}:I${readMoneyRow1}`);
            const rmCell1 = ws1.getCell(`A${readMoneyRow1}`);
            rmCell1.value = `Số tiền bằng chữ: ${readMoneyVietnamese(sumTotalAll)}`;
            rmCell1.font = { name: 'Times New Roman', size: 11, italic: true, bold: true, color: { argb: 'FF1E293B' } };

            // Chữ ký Sheet 1 (Chuẩn 3 cột DUYỆT LÃNH ĐẠO - PT KHOA - NGƯỜI LẬP BIỂU)
            const sigDateRow1 = readMoneyRow1 + 2;
            ws1.mergeCells(sigDateRow1, 7, sigDateRow1, 9);
            const dateCell1 = ws1.getCell(sigDateRow1, 7);
            dateCell1.value = timeInfo.dateSignStr;
            dateCell1.font = { name: 'Times New Roman', size: 11, italic: true };
            dateCell1.alignment = { horizontal: 'center', vertical: 'middle' };

            const sigTitleRow1 = sigDateRow1 + 1;
            ws1.getRow(sigTitleRow1).height = 24;

            ws1.mergeCells(sigTitleRow1, 1, sigTitleRow1, 3);
            const cDuyet1 = ws1.getCell(sigTitleRow1, 1);
            cDuyet1.value = 'DUYỆT LÃNH ĐẠO';
            cDuyet1.font = { name: 'Times New Roman', size: 11, bold: true };
            cDuyet1.alignment = { horizontal: 'center', vertical: 'middle' };

            ws1.mergeCells(sigTitleRow1, 4, sigTitleRow1, 6);
            const cPtKhoa1 = ws1.getCell(sigTitleRow1, 4);
            cPtKhoa1.value = 'PT KHOA';
            cPtKhoa1.font = { name: 'Times New Roman', size: 11, bold: true };
            cPtKhoa1.alignment = { horizontal: 'center', vertical: 'middle' };

            ws1.mergeCells(sigTitleRow1, 7, sigTitleRow1, 9);
            const cLapBieu1 = ws1.getCell(sigTitleRow1, 7);
            cLapBieu1.value = 'NGƯỜI LẬP BIỂU';
            cLapBieu1.font = { name: 'Times New Roman', size: 11, bold: true };
            cLapBieu1.alignment = { horizontal: 'center', vertical: 'middle' };

            ws1.getColumn(1).width = 6;
            ws1.getColumn(2).width = 25;
            ws1.getColumn(3).width = 14;
            ws1.getColumn(4).width = 16;
            ws1.getColumn(5).width = 14;
            ws1.getColumn(6).width = 16;
            ws1.getColumn(7).width = 14;
            ws1.getColumn(8).width = 16;
            ws1.getColumn(9).width = 18;

            // ================= SHEET 2: TỔNG HỢP CÁC LOẠI THỦ THUẬT =================
            const ws2 = workbook.addWorksheet('Tổng Hợp Loại TT', { views: [{ showGridLines: true }] });
            ws2.getCell('A1').value = (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2').toUpperCase();
            ws2.getCell('A1').font = { name: 'Times New Roman', size: 11, bold: true };
            ws2.getCell('A2').value = 'KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG';
            ws2.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true, italic: true };

            ws2.mergeCells('A4:D4');
            const titleCell2 = ws2.getCell('A4');
            titleCell2.value = 'BẢNG TỔNG HỢP CÁC LOẠI THỦ THUẬT';
            titleCell2.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF1E40AF' } };
            titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
            ws2.getRow(4).height = 28;

            ws2.mergeCells('A5:D5');
            const subTitleCell2 = ws2.getCell('A5');
            subTitleCell2.value = `(${timeInfo.label})`;
            subTitleCell2.font = { name: 'Times New Roman', size: 11, italic: true, color: { argb: 'FF475569' } };
            subTitleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
            ws2.getRow(5).height = 20;

            const headers2 = ['STT', 'LOẠI THỦ THUẬT', 'SỐ LƯỢNG', 'THÀNH TIỀN (VNĐ)'];
            ws2.getRow(7).height = 28;
            headers2.forEach((h, i) => {
                const cell = ws2.getCell(7, i + 1);
                cell.value = h;
                cell.font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
            });

            const sheet2Data = [
                { stt: 1, name: 'Thủ thuật Loại 1', qty: sumL1, money: sumMoneyL1 },
                { stt: 2, name: 'Thủ thuật Loại 2', qty: sumL2, money: sumMoneyL2 },
                { stt: 3, name: 'Thủ thuật Loại 3', qty: sumL3, money: sumMoneyL3 }
            ];

            sheet2Data.forEach((row, i) => {
                const r = 8 + i;
                ws2.getRow(r).height = 22;
                ws2.getCell(r, 1).value = row.stt;
                ws2.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'center' };

                ws2.getCell(r, 2).value = row.name;
                ws2.getCell(r, 2).font = { bold: true };
                ws2.getCell(r, 2).alignment = { vertical: 'middle', horizontal: 'left' };

                ws2.getCell(r, 3).value = row.qty;
                ws2.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'center' };

                ws2.getCell(r, 4).value = row.money;
                ws2.getCell(r, 4).numFmt = '#,##0';
                ws2.getCell(r, 4).alignment = { vertical: 'middle', horizontal: 'right' };

                for (let c = 1; c <= 4; c++) {
                    ws2.getCell(r, c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
                }
            });

            // Tổng cộng Sheet 2
            ws2.getRow(11).height = 24;
            ws2.mergeCells('A11:B11');
            ws2.getCell('A11').value = 'TỔNG CỘNG';
            ws2.getCell('A11').font = { bold: true };
            ws2.getCell('A11').alignment = { vertical: 'middle', horizontal: 'center' };

            ws2.getCell('C11').value = sumL1 + sumL2 + sumL3;
            ws2.getCell('C11').font = { bold: true };
            ws2.getCell('C11').alignment = { vertical: 'middle', horizontal: 'center' };

            ws2.getCell('D11').value = sumTotalAll;
            ws2.getCell('D11').numFmt = '#,##0';
            ws2.getCell('D11').font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF15803D' } };
            ws2.getCell('D11').alignment = { vertical: 'middle', horizontal: 'right' };

            for (let c = 1; c <= 4; c++) {
                const cell = ws2.getCell(11, c);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.border = { top: { style: 'medium' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
            }

            ws2.mergeCells('A12:D12');
            ws2.getCell('A12').value = `Số tiền bằng chữ: ${readMoneyVietnamese(sumTotalAll)}`;
            ws2.getCell('A12').font = { name: 'Times New Roman', size: 11, italic: true, bold: true };

            // Chữ ký Sheet 2 (Chuẩn 3 cột DUYỆT LÃNH ĐẠO - PT KHOA - NGƯỜI LẬP BIỂU, KHÔNG BỊ KHUẤT)
            const sigDateRow2 = 14;
            ws2.mergeCells(`C${sigDateRow2}:D${sigDateRow2}`);
            const dateCell2 = ws2.getCell(`C${sigDateRow2}`);
            dateCell2.value = timeInfo.dateSignStr;
            dateCell2.font = { name: 'Times New Roman', size: 11, italic: true };
            dateCell2.alignment = { horizontal: 'center', vertical: 'middle' };

            const sigTitleRow2 = sigDateRow2 + 1;
            ws2.getRow(sigTitleRow2).height = 24;

            ws2.mergeCells(sigTitleRow2, 1, sigTitleRow2, 2);
            const cDuyet2 = ws2.getCell(sigTitleRow2, 1);
            cDuyet2.value = 'DUYỆT LÃNH ĐẠO';
            cDuyet2.font = { name: 'Times New Roman', size: 11, bold: true };
            cDuyet2.alignment = { horizontal: 'center', vertical: 'middle' };

            const cPtKhoa2 = ws2.getCell(sigTitleRow2, 3);
            cPtKhoa2.value = 'PT KHOA';
            cPtKhoa2.font = { name: 'Times New Roman', size: 11, bold: true };
            cPtKhoa2.alignment = { horizontal: 'center', vertical: 'middle' };

            const cLapBieu2 = ws2.getCell(sigTitleRow2, 4);
            cLapBieu2.value = 'NGƯỜI LẬP BIỂU';
            cLapBieu2.font = { name: 'Times New Roman', size: 11, bold: true };
            cLapBieu2.alignment = { horizontal: 'center', vertical: 'middle' };

            ws2.getColumn(1).width = 6;
            ws2.getColumn(2).width = 28;
            ws2.getColumn(3).width = 16;
            ws2.getColumn(4).width = 24;

            // ================= SHEET 3: BẢNG THANH TOÁN TIỀN THỦ THUẬT =================
            const ws3 = workbook.addWorksheet('Bảng Thanh Toán', { views: [{ showGridLines: true }] });
            ws3.getCell('A1').value = (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2').toUpperCase();
            ws3.getCell('A1').font = { name: 'Times New Roman', size: 11, bold: true };
            ws3.getCell('A2').value = 'KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG';
            ws3.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true, italic: true };

            ws3.mergeCells('A4:D4');
            const titleCell3 = ws3.getCell('A4');
            titleCell3.value = 'BẢNG THANH TOÁN TIỀN THỦ THUẬT';
            titleCell3.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FF1E40AF' } };
            titleCell3.alignment = { vertical: 'middle', horizontal: 'center' };
            ws3.getRow(4).height = 28;

            ws3.mergeCells('A5:D5');
            const subTitleCell3 = ws3.getCell('A5');
            subTitleCell3.value = `(${timeInfo.label})`;
            subTitleCell3.font = { name: 'Times New Roman', size: 11, italic: true, color: { argb: 'FF475569' } };
            subTitleCell3.alignment = { vertical: 'middle', horizontal: 'center' };
            ws3.getRow(5).height = 20;

            const headers3 = ['STT', 'HỌ VÀ TÊN', 'CHỨC DANH', 'SỐ TIỀN'];
            ws3.getRow(7).height = 28;
            headers3.forEach((h, i) => {
                const cell = ws3.getCell(7, i + 1);
                cell.value = h;
                cell.font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
            });

            adminChamCongEmployees.forEach((emp, idx) => {
                const r = 8 + idx;
                ws3.getRow(r).height = 22;

                const t = (sourceThuThuat && sourceThuThuat[emp]) ? sourceThuThuat[emp] : {};
                let l1_old = t.loai1_old, l1_new = t.loai1_new;
                if (l1_old === undefined && l1_new === undefined) {
                    if (isOldPeriod) { l1_old = t.loai1 || 0; l1_new = 0; }
                    else { l1_old = 0; l1_new = t.loai1 || 0; }
                }
                const l1_money = (l1_old || 0) * prices.l1_old + (l1_new || 0) * prices.l1;

                let l2_old = t.loai2_old, l2_new = t.loai2_new;
                if (l2_old === undefined && l2_new === undefined) {
                    if (isOldPeriod) { l2_old = t.loai2 || 0; l2_new = 0; }
                    else { l2_old = 0; l2_new = t.loai2 || 0; }
                }
                const l2_money = (l2_old || 0) * prices.l2_old + (l2_new || 0) * prices.l2;

                let l3_old = t.loai3_old, l3_new = t.loai3_new;
                if (l3_old === undefined && l3_new === undefined) {
                    if (isOldPeriod) { l3_old = t.loai3 || 0; l3_new = 0; }
                    else { l3_old = 0; l3_new = t.loai3 || 0; }
                }
                const l3_money = (l3_old || 0) * prices.l3_old + (l3_new || 0) * prices.l3;
                const rowMoney = l1_money + l2_money + l3_money;

                ws3.getCell(r, 1).value = idx + 1;
                ws3.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'center' };

                ws3.getCell(r, 2).value = emp;
                ws3.getCell(r, 2).font = { name: 'Times New Roman', size: 11, bold: true };
                ws3.getCell(r, 2).alignment = { vertical: 'middle', horizontal: 'left' };

                ws3.getCell(r, 3).value = getEmployeeRole(emp);
                ws3.getCell(r, 3).font = { name: 'Times New Roman', size: 11, bold: true };
                ws3.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'center' };

                ws3.getCell(r, 4).value = rowMoney;
                ws3.getCell(r, 4).numFmt = '#,##0';
                ws3.getCell(r, 4).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF15803D' } };
                ws3.getCell(r, 4).alignment = { vertical: 'middle', horizontal: 'right' };

                for (let c = 1; c <= 4; c++) {
                    ws3.getCell(r, c).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
                }
            });

            const totalRow3 = 8 + adminChamCongEmployees.length;
            ws3.getRow(totalRow3).height = 24;
            ws3.mergeCells(`A${totalRow3}:C${totalRow3}`);
            ws3.getCell(`A${totalRow3}`).value = 'TỔNG CỘNG';
            ws3.getCell(`A${totalRow3}`).font = { name: 'Times New Roman', size: 11, bold: true };
            ws3.getCell(`A${totalRow3}`).alignment = { vertical: 'middle', horizontal: 'center' };

            ws3.getCell(`D${totalRow3}`).value = sumTotalAll;
            ws3.getCell(`D${totalRow3}`).numFmt = '#,##0';
            ws3.getCell(`D${totalRow3}`).font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FF15803D' } };
            ws3.getCell(`D${totalRow3}`).alignment = { vertical: 'middle', horizontal: 'right' };

            for (let c = 1; c <= 4; c++) {
                const cell = ws3.getCell(totalRow3, c);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                cell.border = { top: { style: 'medium' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
            }

            ws3.mergeCells(`A${totalRow3 + 1}:D${totalRow3 + 1}`);
            ws3.getCell(`A${totalRow3 + 1}`).value = `Số tiền bằng chữ: ${readMoneyVietnamese(sumTotalAll)}`;
            ws3.getCell(`A${totalRow3 + 1}`).font = { name: 'Times New Roman', size: 11, italic: true, bold: true };

            // Chữ ký Sheet 3 (Chuẩn 3 cột DUYỆT LÃNH ĐẠO - PT KHOA - NGƯỜI LẬP BIỂU, KHÔNG BỊ KHUẤT)
            const sigDateRow3 = totalRow3 + 3;
            ws3.mergeCells(sigDateRow3, 3, sigDateRow3, 4);
            const dateCell3 = ws3.getCell(sigDateRow3, 3);
            dateCell3.value = timeInfo.dateSignStr;
            dateCell3.font = { name: 'Times New Roman', size: 11, italic: true };
            dateCell3.alignment = { horizontal: 'center', vertical: 'middle' };

            const sigTitleRow3 = sigDateRow3 + 1;
            ws3.getRow(sigTitleRow3).height = 24;

            ws3.mergeCells(sigTitleRow3, 1, sigTitleRow3, 2);
            const cDuyet3 = ws3.getCell(sigTitleRow3, 1);
            cDuyet3.value = 'DUYỆT LÃNH ĐẠO';
            cDuyet3.font = { name: 'Times New Roman', size: 11, bold: true };
            cDuyet3.alignment = { horizontal: 'center', vertical: 'middle' };

            const cPtKhoa3 = ws3.getCell(sigTitleRow3, 3);
            cPtKhoa3.value = 'PT KHOA';
            cPtKhoa3.font = { name: 'Times New Roman', size: 11, bold: true };
            cPtKhoa3.alignment = { horizontal: 'center', vertical: 'middle' };

            const cLapBieu3 = ws3.getCell(sigTitleRow3, 4);
            cLapBieu3.value = 'NGƯỜI LẬP BIỂU';
            cLapBieu3.font = { name: 'Times New Roman', size: 11, bold: true };
            cLapBieu3.alignment = { horizontal: 'center', vertical: 'middle' };

            ws3.getColumn(1).width = 6;
            ws3.getColumn(2).width = 26;
            ws3.getColumn(3).width = 18;
            ws3.getColumn(4).width = 24;

            workbook.xlsx.writeBuffer().then(buffer => {
                saveExcelBuffer(buffer, `Bang_Tien_${timeInfo.fileSuffix}.xlsx`);
            }).catch(err => {
                console.error("Lỗi xuất Excel:", err);
                alert("Lỗi xuất file Excel: " + err.message);
            });
        }

        // 3. Xuất file Thực Lĩnh (Chuẩn PM Cũ: 50% Tiền Thủ Thuật Phân Chia Theo Ngày Công Hệ Số)
        function exportThucLinhExcel() {
            if (typeof ExcelJS === 'undefined') {
                alert("Thư viện ExcelJS đang nạp, vui lòng thử lại sau giây lát!");
                return;
            }
            adminChamCongEmployees = cleanseAdminChamCongEmployees(adminChamCongEmployees);
            if ((!adminChamCongEmployees || adminChamCongEmployees.length === 0) && isBVTKS_CS2) {
                adminChamCongEmployees = [...DEFAULT_CHAMCONG_EMPLOYEES];
            }
            ensureStaffConfigForEmployees();
            if (adminChamCongEmployees.length === 0) {
                alert("Chưa có danh sách nhân sự để tính thực lĩnh!");
                return;
            }

            const timeInfo = getThongKeTimeLabel();
            const isQ = (thongKeMode !== 'current');
            const sourceThuThuat = isQ ? thongKeQuarterData.thuthuat : thongKeData;
            const prices = getProcedurePrices();
            const isOldPeriod = (timeInfo.year < 2026 || (timeInfo.year === 2026 && timeInfo.month < 7));

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'T.I.M.E.S System - ' + (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2');
            workbook.created = new Date();
            const ws = workbook.addWorksheet('Bảng Thực Lĩnh', {
                views: [{ showGridLines: true }]
            });

            // Tiêu đề bệnh viện
            ws.getCell('A1').value = (localStorage.getItem('pm_unit_name') || 'Bệnh viện Than - Khoáng sản Cơ sở 2').toUpperCase();
            ws.getCell('A1').font = { name: 'Times New Roman', size: 11, bold: true };
            
            ws.getCell('A2').value = 'KHOA Y HỌC CỔ TRUYỀN - PHỤC HỒI CHỨC NĂNG';
            ws.getCell('A2').font = { name: 'Times New Roman', size: 11, bold: true, italic: true };

            // Tiêu đề bảng
            ws.mergeCells('A4:G4');
            const titleCell = ws.getCell('A4');
            titleCell.value = `BẢNG TÍNH THỰC LĨNH TIỀN THỦ THUẬT ${timeInfo.titleStr}`;
            titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: 'FFB45309' } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getRow(4).height = 28;

            ws.mergeCells('A5:G5');
            const subTitleCell = ws.getCell('A5');
            subTitleCell.value = `(${timeInfo.label})`;
            subTitleCell.font = { name: 'Times New Roman', size: 11, italic: true, color: { argb: 'FF475569' } };
            subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

            // Header cột (Row 7)
            const headers = ['STT', 'HỌ VÀ TÊN', 'TIỀN THỦ THUẬT (50%)', 'NGÀY CÔNG (HỆ SỐ)', 'THỰC LĨNH (VNĐ)', 'CHÊNH LỆCH (TRẢ / NHẬN)', 'KÝ NHẬN'];
            ws.getRow(7).height = 28;
            headers.forEach((h, i) => {
                const cell = ws.getCell(7, i + 1);
                cell.value = h;
                cell.font = { name: 'Times New Roman', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFB45309' } },
                    bottom: { style: 'thin', color: { argb: 'FFB45309' } },
                    left: { style: 'thin', color: { argb: 'FFFDE68A' } },
                    right: { style: 'thin', color: { argb: 'FFFDE68A' } }
                };
            });

            // Tính toán trước tổng tiền 50% và tổng ngày công
            let sumMoney50 = 0;
            let sumDaysHeso = 0;
            const empCalculations = [];

            adminChamCongEmployees.forEach(emp => {
                const t = (sourceThuThuat && sourceThuThuat[emp]) ? sourceThuThuat[emp] : {};
                let l1_old = t.loai1_old, l1_new = t.loai1_new;
                if (l1_old === undefined && l1_new === undefined) {
                    if (isOldPeriod) { l1_old = t.loai1 || 0; l1_new = 0; }
                    else { l1_old = 0; l1_new = t.loai1 || 0; }
                }
                const l1_money = (l1_old || 0) * prices.l1_old + (l1_new || 0) * prices.l1;

                let l2_old = t.loai2_old, l2_new = t.loai2_new;
                if (l2_old === undefined && l2_new === undefined) {
                    if (isOldPeriod) { l2_old = t.loai2 || 0; l2_new = 0; }
                    else { l2_old = 0; l2_new = t.loai2 || 0; }
                }
                const l2_money = (l2_old || 0) * prices.l2_old + (l2_new || 0) * prices.l2;

                let l3_old = t.loai3_old, l3_new = t.loai3_new;
                if (l3_old === undefined && l3_new === undefined) {
                    if (isOldPeriod) { l3_old = t.loai3 || 0; l3_new = 0; }
                    else { l3_old = 0; l3_new = t.loai3 || 0; }
                }
                const l3_money = (l3_old || 0) * prices.l3_old + (l3_new || 0) * prices.l3;

                const fullMoney = l1_money + l2_money + l3_money;
                const money50 = Math.round(fullMoney * 0.5);
                const tongCongHeso = getEmpTotalCong(emp, isQ);

                sumMoney50 += money50;
                sumDaysHeso += tongCongHeso;

                empCalculations.push({
                    emp,
                    money50,
                    tongCongHeso
                });
            });

            const moneyPerDay = sumDaysHeso > 0 ? (sumMoney50 / sumDaysHeso) : 0;

            // Ghi dữ liệu từng nhân viên (Row 8 trở đi)
            let startRow = 8;
            let sumThucLinh = 0;
            let sumTraNhan = 0;

            empCalculations.forEach((item, idx) => {
                const r = startRow + idx;
                ws.getRow(r).height = 22;

                const thucLinh = Math.round(moneyPerDay * item.tongCongHeso);
                const traNhan = thucLinh - item.money50;

                sumThucLinh += thucLinh;
                sumTraNhan += traNhan;

                ws.getCell(r, 1).value = idx + 1;
                ws.getCell(r, 1).alignment = { vertical: 'middle', horizontal: 'center' };

                ws.getCell(r, 2).value = item.emp;
                ws.getCell(r, 2).font = { name: 'Times New Roman', size: 11, bold: true };
                ws.getCell(r, 2).alignment = { vertical: 'middle', horizontal: 'left' };

                ws.getCell(r, 3).value = item.money50;
                ws.getCell(r, 3).numFmt = '#,##0';
                ws.getCell(r, 3).alignment = { vertical: 'middle', horizontal: 'right' };

                ws.getCell(r, 4).value = item.tongCongHeso;
                ws.getCell(r, 4).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1D4ED8' } };
                ws.getCell(r, 4).alignment = { vertical: 'middle', horizontal: 'center' };

                ws.getCell(r, 5).value = thucLinh;
                ws.getCell(r, 5).numFmt = '#,##0';
                ws.getCell(r, 5).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFB45309' } };
                ws.getCell(r, 5).alignment = { vertical: 'middle', horizontal: 'right' };

                ws.getCell(r, 6).value = traNhan;
                ws.getCell(r, 6).numFmt = '#,##0';
                ws.getCell(r, 6).font = { 
                    name: 'Times New Roman', 
                    size: 11, 
                    bold: true, 
                    color: { argb: traNhan >= 0 ? 'FF15803D' : 'FFDC2626' } 
                };
                ws.getCell(r, 6).alignment = { vertical: 'middle', horizontal: 'right' };

                ws.getCell(r, 7).value = ''; // Ký nhận
                ws.getCell(r, 7).alignment = { vertical: 'middle', horizontal: 'center' };

                for (let c = 1; c <= 7; c++) {
                    ws.getCell(r, c).border = {
                        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                    };
                }
            });

            // Hàng Tổng Cộng
            const totalRow = startRow + empCalculations.length;
            ws.getRow(totalRow).height = 24;
            ws.mergeCells(totalRow, 1, totalRow, 2);
            ws.getCell(totalRow, 1).value = 'TỔNG CỘNG';
            ws.getCell(totalRow, 1).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(totalRow, 1).alignment = { vertical: 'middle', horizontal: 'center' };

            ws.getCell(totalRow, 3).value = sumMoney50;
            ws.getCell(totalRow, 3).numFmt = '#,##0';
            ws.getCell(totalRow, 3).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(totalRow, 3).alignment = { vertical: 'middle', horizontal: 'right' };

            ws.getCell(totalRow, 4).value = Math.round(sumDaysHeso * 100) / 100;
            ws.getCell(totalRow, 4).font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF1D4ED8' } };
            ws.getCell(totalRow, 4).alignment = { vertical: 'middle', horizontal: 'center' };

            ws.getCell(totalRow, 5).value = sumThucLinh;
            ws.getCell(totalRow, 5).numFmt = '#,##0';
            ws.getCell(totalRow, 5).font = { name: 'Times New Roman', size: 12, bold: true, color: { argb: 'FFB45309' } };
            ws.getCell(totalRow, 5).alignment = { vertical: 'middle', horizontal: 'right' };

            ws.getCell(totalRow, 6).value = sumTraNhan;
            ws.getCell(totalRow, 6).numFmt = '#,##0';
            ws.getCell(totalRow, 6).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(totalRow, 6).alignment = { vertical: 'middle', horizontal: 'right' };

            for (let c = 1; c <= 7; c++) {
                const cell = ws.getCell(totalRow, c);
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                cell.border = {
                    top: { style: 'medium', color: { argb: 'FFD97706' } },
                    bottom: { style: 'double', color: { argb: 'FFD97706' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };
            }

            // Hàng Đơn Giá 1 Ngày Công
            const priceRateRow = totalRow + 1;
            ws.mergeCells(`A${priceRateRow}:G${priceRateRow}`);
            const rateCell = ws.getCell(`A${priceRateRow}`);
            rateCell.value = `* Đơn giá phân chia: 1 ngày công = ${Math.round(moneyPerDay).toLocaleString('vi-VN')} VNĐ (Tổng quỹ 50%: ${sumMoney50.toLocaleString('vi-VN')} đ / Tổng công: ${Math.round(sumDaysHeso * 100) / 100})`;
            rateCell.font = { name: 'Times New Roman', size: 10.5, italic: true, color: { argb: 'FF1E293B' } };

            // Dòng đọc tiền bằng chữ
            const readMoneyRow = totalRow + 2;
            ws.mergeCells(`A${readMoneyRow}:G${readMoneyRow}`);
            const rmCell = ws.getCell(`A${readMoneyRow}`);
            rmCell.value = `Số tiền bằng chữ: ${readMoneyVietnamese(sumThucLinh)}`;
            rmCell.font = { name: 'Times New Roman', size: 11, italic: true, bold: true, color: { argb: 'FF1E293B' } };

            // Chữ ký (Signatures - 4 cột)
            const sigRow = totalRow + 4;
            ws.getCell(sigRow, 6).value = timeInfo.dateSignStr;
            ws.getCell(sigRow, 6).font = { name: 'Times New Roman', size: 11, italic: true };

            const sigTitleRow = sigRow + 1;
            ws.getCell(sigTitleRow, 2).value = 'NGƯỜI LẬP BIỂU';
            ws.getCell(sigTitleRow, 2).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(sigTitleRow, 2).alignment = { horizontal: 'center' };

            ws.getCell(sigTitleRow, 3).value = 'KẾ TOÁN';
            ws.getCell(sigTitleRow, 3).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(sigTitleRow, 3).alignment = { horizontal: 'center' };

            ws.getCell(sigTitleRow, 5).value = 'TRƯỞNG KHOA';
            ws.getCell(sigTitleRow, 5).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(sigTitleRow, 5).alignment = { horizontal: 'center' };

            ws.getCell(sigTitleRow, 7).value = 'GIÁM ĐỐC';
            ws.getCell(sigTitleRow, 7).font = { name: 'Times New Roman', size: 11, bold: true };
            ws.getCell(sigTitleRow, 7).alignment = { horizontal: 'center' };

            const sigSubRow = sigTitleRow + 1;
            [2, 3, 5, 7].forEach(col => {
                const c = ws.getCell(sigSubRow, col);
                c.value = '(Ký, họ tên)';
                c.font = { name: 'Times New Roman', size: 9.5, italic: true };
                c.alignment = { horizontal: 'center' };
            });

            // Set Column Widths
            ws.getColumn(1).width = 6;
            ws.getColumn(2).width = 25;
            ws.getColumn(3).width = 22;
            ws.getColumn(4).width = 18;
            ws.getColumn(5).width = 20;
            ws.getColumn(6).width = 22;
            ws.getColumn(7).width = 16;

            workbook.xlsx.writeBuffer().then(buffer => {
                saveExcelBuffer(buffer, `Bang_Thuc_Linh_${timeInfo.fileSuffix}.xlsx`);
            }).catch(err => {
                console.error("Lỗi xuất Excel:", err);
                alert("Lỗi xuất file Excel: " + err.message);
            });
        }

        // Gắn sự kiện cho các nút xuất
        document.getElementById('btn-export-excel').addEventListener('click', exportThongKeExcel);
        document.getElementById('btn-export-thuc-linh').addEventListener('click', exportThucLinhExcel);

        // Khởi tạo UI cấu hình đơn giá
        initPriceConfigUI();

        // Đồng bộ và gán sự kiện cho bộ chọn Tháng/Năm giữa Chấm công & Thống kê
        function initMonthYearSync() {
            const now = new Date();
            const curM = now.getMonth() + 1;
            const curY = now.getFullYear();

            const ccM = document.getElementById('chamcong-month-picker');
            const ccY = document.getElementById('chamcong-year-picker');
            const tkM = document.getElementById('thongke-month-picker');
            const tkY = document.getElementById('thongke-year-picker');

            if (ccM && !ccM.value) ccM.value = curM;
            if (ccY && !ccY.value) ccY.value = curY;
            if (tkM && !tkM.value) tkM.value = curM;
            if (tkY && !tkY.value) tkY.value = curY;

            let syncTimer = null;
            const debouncedSync = (fn) => {
                if (syncTimer) clearTimeout(syncTimer);
                syncTimer = setTimeout(fn, 60);
            };

            const onMonthChangeFromTK = () => {
                if (ccM) ccM.value = tkM.value;
                debouncedSync(() => {
                    const mode = document.getElementById('thongke-mode')?.value;
                    if (mode === 'current') loadThongKeData();
                    if (typeof loadChamCongData === 'function') loadChamCongData();
                });
            };
            const onYearChangeFromTK = () => {
                if (ccY) ccY.value = tkY.value;
                debouncedSync(() => {
                    const mode = document.getElementById('thongke-mode')?.value;
                    if (mode === 'current') loadThongKeData();
                    if (typeof loadChamCongData === 'function') loadChamCongData();
                });
            };

            const onMonthChangeFromCC = () => {
                if (tkM) tkM.value = ccM.value;
                debouncedSync(() => {
                    loadChamCongData();
                    const mode = document.getElementById('thongke-mode')?.value;
                    if (mode === 'current') loadThongKeData();
                });
            };
            const onYearChangeFromCC = () => {
                if (tkY) tkY.value = ccY.value;
                debouncedSync(() => {
                    loadChamCongData();
                    const mode = document.getElementById('thongke-mode')?.value;
                    if (mode === 'current') loadThongKeData();
                });
            };

            if (tkM) {
                tkM.addEventListener('change', onMonthChangeFromTK);
                tkM.addEventListener('input', onMonthChangeFromTK);
            }
            if (tkY) {
                tkY.addEventListener('change', onYearChangeFromTK);
                tkY.addEventListener('input', onYearChangeFromTK);
            }
            if (ccM) {
                ccM.addEventListener('change', onMonthChangeFromCC);
                ccM.addEventListener('input', onMonthChangeFromCC);
            }
            if (ccY) {
                ccY.addEventListener('change', onYearChangeFromCC);
                ccY.addEventListener('input', onYearChangeFromCC);
            }
        }
        initMonthYearSync();

        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = btn.getAttribute('data-tab');
                if (targetTab === 'tab-chamcong') {
                    const ccM = document.getElementById('chamcong-month-picker');
                    const tkM = document.getElementById('thongke-month-picker');
                    const ccY = document.getElementById('chamcong-year-picker');
                    const tkY = document.getElementById('thongke-year-picker');
                    if (tkM && ccM && tkM.value) ccM.value = tkM.value;
                    if (tkY && ccY && tkY.value) ccY.value = tkY.value;
                    loadChamCongData();
                } else if (targetTab === 'tab-thongke') {
                    const ccM = document.getElementById('chamcong-month-picker');
                    const tkM = document.getElementById('thongke-month-picker');
                    const ccY = document.getElementById('chamcong-year-picker');
                    const tkY = document.getElementById('thongke-year-picker');
                    if (ccM && tkM && ccM.value) tkM.value = ccM.value;
                    if (ccY && tkY && ccY.value) tkY.value = ccY.value;
                    loadThongKeData();
                }
            });
        });

window.resetChamCongForUnit = function(unitCode) {
    const isDefault = (unitCode || localStorage.getItem('pm_unit_code') || 'bvtks-cs2') === 'bvtks-cs2';
    const cachedEmp = localStorage.getItem(getChamCongStorageKey('med_chamcong_employees'));
    const cachedConf = localStorage.getItem(getChamCongStorageKey('med_chamcong_staff_config'));
    
    const my = getChamCongMonthYear();
    const cachedCC = getCachedChamCong(my);
    const cachedTK = getCachedThongKe(my);
    chamCongData = cachedCC ? normalizeChamCongData(cachedCC) : {};
    thongKeData = cachedTK ? normalizeThongKeData(cachedTK) : {};
    thongKeQuarterData = { chamcong: {}, thuthuat: {} };

    if (cachedEmp) {
        try { 
            const parsed = JSON.parse(cachedEmp);
            adminChamCongEmployees = cleanseAdminChamCongEmployees(parsed);
        } catch(e){ adminChamCongEmployees = isDefault ? [...DEFAULT_CHAMCONG_EMPLOYEES] : []; }
    } else {
        adminChamCongEmployees = isDefault ? [...DEFAULT_CHAMCONG_EMPLOYEES] : [];
    }

    if (cachedConf) {
        try { adminChamCongStaffConfig = JSON.parse(cachedConf); } catch(e){ adminChamCongStaffConfig = isDefault ? { ...DEFAULT_CHAMCONG_STAFF } : {}; }
    } else {
        adminChamCongStaffConfig = isDefault ? { ...DEFAULT_CHAMCONG_STAFF } : {};
    }

    ensureStaffConfigForEmployees();

    if (typeof renderAdminChamCongTable === 'function') {
        renderAdminChamCongTable();
    }
    if (typeof renderChamCongTable === 'function') {
        renderChamCongTable();
    }
    if (typeof renderThongKeTable === 'function') {
        renderThongKeTable();
    }
};

window.loadThongKeData = loadThongKeData;
window.renderThongKeTable = renderThongKeTable;
window.loadChamCongData = loadChamCongData;
window.renderChamCongTable = renderChamCongTable;
window.loadChamCongSymbols = loadChamCongSymbols;
window.renderChamCongLegend = renderChamCongLegend;
window.openChamCongSymbolModal = openChamCongSymbolModal;
window.closeChamCongSymbolModal = closeChamCongSymbolModal;
window.openAddChamCongSymbolModal = openAddChamCongSymbolModal;
window.renderChamCongSymbolTable = renderChamCongSymbolTable;
window.editChamCongSymbol = editChamCongSymbol;
window.cancelEditChamCongSymbol = cancelEditChamCongSymbol;
window.saveChamCongSymbolItem = saveChamCongSymbolItem;
window.deleteChamCongSymbol = deleteChamCongSymbol;
window.resetDefaultChamCongSymbols = resetDefaultChamCongSymbols;
window.updateSymbolPreviewBadge = updateSymbolPreviewBadge;
window.findChamCongSymbol = findChamCongSymbol;
window.applySymbolStyleToInput = applySymbolStyleToInput;

