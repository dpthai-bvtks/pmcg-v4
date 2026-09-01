-- ============================================================
-- CLOUDFLARE D1 DATABASE SCHEMA CHO PM-XEPLICH V4 THƯƠNG MẠI
-- Hỗ trợ kiến trúc Đa Đơn Vị (Multi-Tenant SaaS Architecture)
-- Mã đơn vị mặc định: bvtks_cs2
-- ============================================================

-- 1. BẢNG QUẢN LÝ ĐƠN VỊ & BẢN QUYỀN (TENANTS)
CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT UNIQUE NOT NULL,
    unit_name TEXT NOT NULL,
    logo_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    plan_tier TEXT DEFAULT 'PRO',
    max_staff INTEGER DEFAULT 30,
    max_patients INTEGER DEFAULT 150,
    expires_at TEXT NOT NULL DEFAULT '2099-12-31',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_code ON tenants(unit_code);

-- 2. CÀI ĐẶT THAM SỐ HỆ THỐNG
CREATE TABLE IF NOT EXISTS cai_dat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_code, key)
);
CREATE INDEX IF NOT EXISTS idx_cai_dat_unit ON cai_dat(unit_code, key);

-- 3. TÀI KHOẢN NGƯỜI DÙNG & PHÂN QUYỀN
CREATE TABLE IF NOT EXISTS tai_khoan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    permissions TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_code, username)
);
CREATE INDEX IF NOT EXISTS idx_tai_khoan_unit ON tai_khoan(unit_code, username);

-- 4. DANH MỤC NHÂN SỰ & KỸ THUẬT VIÊN
CREATE TABLE IF NOT EXISTS nhan_su (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'KTV',
    system TEXT NOT NULL DEFAULT 'PHCN',
    skills TEXT DEFAULT '',
    fixed_busy TEXT DEFAULT '',
    temp_busy TEXT DEFAULT '',
    his_name TEXT DEFAULT '',
    priority INTEGER DEFAULT 0,
    trang_thai TEXT DEFAULT 'Đi làm',
    thoi_gian_lam TEXT DEFAULT '07:30-11:30, 13:00-16:30',
    nguoi_thay_the TEXT DEFAULT 'Không',
    is_active INTEGER DEFAULT 1,
    order_idx INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_code, name)
);
CREATE INDEX IF NOT EXISTS idx_nhan_su_unit ON nhan_su(unit_code, is_active, priority);

-- 5. DANH MỤC MÁY MÓC THIẾT BỊ
CREATE TABLE IF NOT EXISTS may_moc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    ten_loai TEXT NOT NULL,
    ma_may TEXT NOT NULL,
    trang_thai TEXT DEFAULT 'Sẵn sàng',
    order_idx INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_code, ma_may)
);
CREATE INDEX IF NOT EXISTS idx_may_moc_unit ON may_moc(unit_code, is_active, order_idx);

-- 6. DANH MỤC PHÒNG THỦ THUẬT & GIƯỜNG BỆNH
CREATE TABLE IF NOT EXISTS phong (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    ten_phong TEXT NOT NULL,
    bac_si TEXT DEFAULT '',
    ktv TEXT DEFAULT '',
    danh_sach_may TEXT DEFAULT '',
    so_giuong INTEGER DEFAULT 0,
    danh_sach_giuong TEXT DEFAULT '',
    order_idx INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_code, ten_phong)
);
CREATE INDEX IF NOT EXISTS idx_phong_unit ON phong(unit_code, is_active, order_idx);

-- 7. DANH MỤC THỦ THUẬT YHCT / PHCN
CREATE TABLE IF NOT EXISTS thu_thuat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    ten_thu_thuat TEXT NOT NULL,
    viet_tat TEXT DEFAULT '',
    he TEXT DEFAULT 'PHCN',
    phan_loai TEXT DEFAULT '',
    may TEXT DEFAULT '',
    tg_thuc_hien INTEGER DEFAULT 30,
    tg_thuc_hien_max INTEGER DEFAULT 0,
    tg_thu_thuat INTEGER DEFAULT 30,
    tg_thu_thuat_max INTEGER DEFAULT 0,
    khoang_cach INTEGER DEFAULT 0,
    can_rut_may INTEGER DEFAULT 0,
    can_nguoi_phu INTEGER DEFAULT 0,
    ds_nguoi_phu TEXT DEFAULT '',
    lien_tuc INTEGER DEFAULT 0,
    order_idx INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_code, ten_thu_thuat)
);
CREATE INDEX IF NOT EXISTS idx_thu_thuat_unit ON thu_thuat(unit_code, is_active, order_idx);

-- 8. DANH SÁCH BỆNH NHÂN ĐIỀU TRỊ
CREATE TABLE IF NOT EXISTS benh_nhan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    name TEXT NOT NULL,
    age INTEGER DEFAULT 0,
    gender TEXT DEFAULT 'Nam',
    room TEXT DEFAULT '',
    bed TEXT DEFAULT '',
    arrive_time TEXT DEFAULT '07:30',
    leave_time TEXT DEFAULT '',
    thu_thuat TEXT NOT NULL DEFAULT '[]',
    status TEXT DEFAULT 'Chưa xếp',
    ngay_vao TEXT DEFAULT '',
    gio_ban TEXT DEFAULT '',
    is_saturday INTEGER DEFAULT 0,
    order_idx INTEGER DEFAULT 0,
    loai_bn TEXT DEFAULT 'NoiTru',
    buoi_dieu_tri TEXT DEFAULT 'Sang',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_benh_nhan_unit ON benh_nhan(unit_code, is_saturday, order_idx);

-- 9. LỊCH TRÌNH THỦ THUẬT HIỆN TẠI
CREATE TABLE IF NOT EXISTS lich_trinh (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    date TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    dob TEXT DEFAULT '',
    room TEXT DEFAULT '',
    procedure_name TEXT NOT NULL,
    staff_name TEXT DEFAULT '',
    sub_staff_name TEXT DEFAULT '',
    machine_name TEXT DEFAULT '',
    bed TEXT DEFAULT '',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_saturday INTEGER DEFAULT 0,
    order_idx INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lich_trinh_unit_date ON lich_trinh(unit_code, date);

-- 10. LỊCH SỬ XẾP LỊCH CÁC NGÀY
CREATE TABLE IF NOT EXISTS lich_su (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    date TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    dob TEXT DEFAULT '',
    room TEXT DEFAULT '',
    procedure_name TEXT NOT NULL,
    staff_name TEXT DEFAULT '',
    sub_staff_name TEXT DEFAULT '',
    machine_name TEXT DEFAULT '',
    bed TEXT DEFAULT '',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lich_su_unit_date ON lich_su(unit_code, date);

-- 11. LỊCH SỬ GIỜ BẬN & RA VIỆN
CREATE TABLE IF NOT EXISTS gio_ban_cu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    date TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    busy_ranges TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gio_ban_unit_date ON gio_ban_cu(unit_code, date);

-- 12. CHẤM CÔNG HÀNG THÁNG
CREATE TABLE IF NOT EXISTS cham_cong (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    month_year TEXT NOT NULL,
    data_json TEXT NOT NULL DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_code, month_year)
);
CREATE INDEX IF NOT EXISTS idx_cham_cong_unit ON cham_cong(unit_code, month_year);

-- 13. THỐNG KÊ HÀNG THÁNG
CREATE TABLE IF NOT EXISTS thong_ke (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    month_year TEXT NOT NULL,
    data_json TEXT NOT NULL DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_code, month_year)
);
CREATE INDEX IF NOT EXISTS idx_thong_ke_unit ON thong_ke(unit_code, month_year);

-- 14. KHUNG GIỜ RẢNH DÙNG CHUNG
CREATE TABLE IF NOT EXISTS tim_ranh (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    procedure_name TEXT DEFAULT '',
    start_time TEXT DEFAULT '',
    end_time TEXT DEFAULT '',
    staff_name TEXT DEFAULT '',
    machine_name TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tim_ranh_unit ON tim_ranh(unit_code);

-- 15. VĂN BẢN HƯỚNG DẪN & QUY TRÌNH
CREATE TABLE IF NOT EXISTS tai_lieu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    doc_number TEXT DEFAULT '',
    title TEXT DEFAULT '',
    agency TEXT DEFAULT '',
    signed_date TEXT DEFAULT '',
    view_link TEXT DEFAULT '',
    download_link TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tai_lieu_unit ON tai_lieu(unit_code);

-- 16. DANH MỤC PHÁC ĐỒ ĐIỀU TRỊ GÓI
CREATE TABLE IF NOT EXISTS phac_do (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    ten_phac_do TEXT NOT NULL,
    danh_sach_thu_thuat TEXT NOT NULL DEFAULT '[]',
    order_idx INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(unit_code, ten_phac_do)
);
CREATE INDEX IF NOT EXISTS idx_phac_do_unit ON phac_do(unit_code, is_active, order_idx);

-- 17. NHẬT KÝ KIỂM TOÁN (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_code TEXT NOT NULL DEFAULT 'bvtks_cs2',
    timestamp TEXT NOT NULL,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- KHỞI TẠO BẢN GHI MẶC ĐỊNH CHO ĐƠN VỊ GỐC (BVTKS_CS2)
-- ============================================================
INSERT OR IGNORE INTO tenants (unit_code, unit_name, plan_tier, expires_at, is_active)
VALUES ('bvtks_cs2', 'Bệnh viện Than - Khoáng sản Cơ sở 2', 'ENTERPRISE', '2099-12-31', 1);
