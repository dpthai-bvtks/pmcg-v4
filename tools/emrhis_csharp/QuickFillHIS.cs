using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using System.Windows.Automation;

namespace EmrHisQuickFill
{
    public class PatientTask
    {
        public string TenBn { get; set; }
        public string ThuThuat { get; set; }
        public string GioBatDau { get; set; }
        public string GioKetThuc { get; set; }
        public string Ngay { get; set; }
        public string NgayGioBd { get; set; }
        public string NgayGioKt { get; set; }
        public string KtvTen { get; set; }
        public string KtvMa { get; set; }
        public string VoCam { get; set; }
        public string TinhHinh { get; set; }
        public string MoTa { get; set; }
        public string MayYTe { get; set; }
        public string Status { get; set; }

        public PatientTask()
        {
            TenBn = "";
            ThuThuat = "";
            GioBatDau = "08:00";
            GioKetThuc = "08:25";
            Ngay = "";
            NgayGioBd = "";
            NgayGioKt = "";
            KtvTen = "";
            KtvMa = "";
            VoCam = "Khác";
            TinhHinh = "Chủ động";
            MoTa = ".";
            MayYTe = "";
            Status = "Chờ nhập";
        }
    }

    public class MainForm : Form
    {
        private List<PatientTask> _tasks = new List<PatientTask>();
        private ListView _lvTasks;
        private Label _lblStatus;
        private Label _lblStats;
        private Button _btnPaste;
        private Button _btnFillF8;
        private Button _btnAutoF9;
        private Button _btnStop;
        private bool _isRunning = false;
        private bool _stopRequested = false;

        // Win32 APIs
        [DllImport("user32.dll")]
        private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

        [DllImport("user32.dll")]
        private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

        [DllImport("user32.dll")]
        private static extern bool MessageBeep(uint uType);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        private static extern bool BringWindowToTop(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
        private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        private static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        private static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("user32.dll")]
        private static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
        private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP = 0x0004;

        private const int HOTKEY_F8 = 1008;
        private const int HOTKEY_F9 = 1009;
        private const int HOTKEY_ESC = 1027;

        private const uint VK_F8 = 0x77;
        private const uint VK_F9 = 0x78;
        private const uint VK_ESCAPE = 0x1B;

        public MainForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "⚡ emrHIS C# Native QuickFill v1.1 [Đã tối ưu nhận diện Form]";
            this.Size = new Size(760, 500);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.TopMost = true; // Luôn nổi để dễ quan sát khi thao tác trên emrHIS
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            this.BackColor = Color.FromArgb(248, 250, 252);

            // 1. Header Toolbar
            Panel toolbar = new Panel { Dock = DockStyle.Top, Height = 56, BackColor = Color.FromArgb(15, 23, 42), Padding = new Padding(8) };

            _btnPaste = new Button
            {
                Text = "📋 Dán Clipboard",
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                ForeColor = Color.White,
                BackColor = Color.FromArgb(2, 132, 199),
                FlatStyle = FlatStyle.Flat,
                Size = new Size(130, 40),
                Location = new Point(10, 8),
                Cursor = Cursors.Hand
            };
            _btnPaste.FlatAppearance.BorderSize = 0;
            _btnPaste.Click += (s, e) => LoadTasksFromClipboard();
            toolbar.Controls.Add(_btnPaste);

            _btnFillF8 = new Button
            {
                Text = "⚡ ĐIỀN FORM (F8)",
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                ForeColor = Color.White,
                BackColor = Color.FromArgb(217, 119, 6),
                FlatStyle = FlatStyle.Flat,
                Size = new Size(160, 40),
                Location = new Point(148, 8),
                Cursor = Cursors.Hand
            };
            _btnFillF8.FlatAppearance.BorderSize = 0;
            _btnFillF8.Click += (s, e) => ExecuteFillCurrentForm();
            toolbar.Controls.Add(_btnFillF8);

            _btnAutoF9 = new Button
            {
                Text = "▶️ TỰ ĐỘNG (F9)",
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                ForeColor = Color.White,
                BackColor = Color.FromArgb(22, 163, 74),
                FlatStyle = FlatStyle.Flat,
                Size = new Size(140, 40),
                Location = new Point(316, 8),
                Cursor = Cursors.Hand
            };
            _btnAutoF9.FlatAppearance.BorderSize = 0;
            _btnAutoF9.Click += (s, e) => StartAutoRun();
            toolbar.Controls.Add(_btnAutoF9);

            _btnStop = new Button
            {
                Text = "⏹ Dừng (ESC)",
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                ForeColor = Color.White,
                BackColor = Color.FromArgb(220, 38, 38),
                FlatStyle = FlatStyle.Flat,
                Size = new Size(100, 40),
                Location = new Point(464, 8),
                Enabled = false,
                Cursor = Cursors.Hand
            };
            _btnStop.FlatAppearance.BorderSize = 0;
            _btnStop.Click += (s, e) => RequestStop();
            toolbar.Controls.Add(_btnStop);

            Button btnClear = new Button
            {
                Text = "🗑 Xóa",
                Font = new Font("Segoe UI", 8.5F),
                ForeColor = Color.FromArgb(203, 213, 225),
                BackColor = Color.FromArgb(51, 65, 85),
                FlatStyle = FlatStyle.Flat,
                Size = new Size(70, 40),
                Location = new Point(572, 8),
                Cursor = Cursors.Hand
            };
            btnClear.FlatAppearance.BorderSize = 0;
            btnClear.Click += (s, e) => ClearTasks();
            toolbar.Controls.Add(btnClear);

            Button btnTestFind = new Button
            {
                Text = "🔍 Thử Tìm Form",
                Font = new Font("Segoe UI", 8.5F),
                ForeColor = Color.White,
                BackColor = Color.FromArgb(71, 85, 105),
                FlatStyle = FlatStyle.Flat,
                Size = new Size(110, 40),
                Location = new Point(650, 8),
                Cursor = Cursors.Hand
            };
            btnTestFind.FlatAppearance.BorderSize = 0;
            btnTestFind.Click += (s, e) =>
            {
                string info;
                var elem = FindFormThuThuat(out info);
                if (elem != null)
                {
                    MessageBox.Show("✅ ĐÃ TÌM THẤY FORM!\n\nChi tiết:\n" + info, "Kết quả tìm kiếm", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                else
                {
                    MessageBox.Show("❌ KHÔNG TÌM THẤY FORM!\n\nChi tiết quá trình quét:\n" + info, "Kết quả tìm kiếm", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            };
            toolbar.Controls.Add(btnTestFind);

            this.Controls.Add(toolbar);

            // 2. Body List View
            _lvTasks = new ListView
            {
                Dock = DockStyle.Fill,
                View = View.Details,
                FullRowSelect = true,
                GridLines = true,
                MultiSelect = false,
                Font = new Font("Segoe UI", 9F)
            };
            _lvTasks.Columns.Add("STT", 45);
            _lvTasks.Columns.Add("Bệnh Nhân", 140);
            _lvTasks.Columns.Add("Thủ Thuật", 120);
            _lvTasks.Columns.Add("Giờ BĐ", 60);
            _lvTasks.Columns.Add("Giờ KT", 60);
            _lvTasks.Columns.Add("KTV", 110);
            _lvTasks.Columns.Add("Trạng Thái", 130);
            _lvTasks.DoubleClick += (s, e) => ExecuteFillCurrentForm();
            this.Controls.Add(_lvTasks);

            // 3. Footer Status Bar
            Panel footer = new Panel { Dock = DockStyle.Bottom, Height = 58, BackColor = Color.White, Padding = new Padding(10, 6, 10, 6) };
            
            _lblStatus = new Label
            {
                Dock = DockStyle.Top,
                Height = 24,
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                Text = "Sẵn sàng. Hãy dán dữ liệu hoặc bấm F8 để điền ca đang chọn."
            };
            footer.Controls.Add(_lblStatus);

            _lblStats = new Label
            {
                Dock = DockStyle.Bottom,
                Height = 20,
                Font = new Font("Segoe UI", 8.5F),
                ForeColor = Color.FromArgb(100, 116, 139),
                Text = "Tổng: 0 ca | Chờ: 0 | Đã hoàn thành: 0"
            };
            footer.Controls.Add(_lblStats);

            this.Controls.Add(footer);

            // Tự nạp dữ liệu từ clipboard hoặc file json nếu có
            this.Load += (s, e) =>
            {
                RegisterGlobalHotkeys();
                AutoLoadDefaultTasks();
            };
            this.FormClosing += (s, e) => UnregisterGlobalHotkeys();
        }

        private void RegisterGlobalHotkeys()
        {
            try
            {
                RegisterHotKey(this.Handle, HOTKEY_F8, 0, VK_F8);
                RegisterHotKey(this.Handle, HOTKEY_F9, 0, VK_F9);
                RegisterHotKey(this.Handle, HOTKEY_ESC, 0, VK_ESCAPE);
            }
            catch { }
        }

        private void UnregisterGlobalHotkeys()
        {
            try
            {
                UnregisterHotKey(this.Handle, HOTKEY_F8);
                UnregisterHotKey(this.Handle, HOTKEY_F9);
                UnregisterHotKey(this.Handle, HOTKEY_ESC);
            }
            catch { }
        }

        protected override void WndProc(ref Message m)
        {
            const int WM_HOTKEY = 0x0312;
            if (m.Msg == WM_HOTKEY)
            {
                int id = m.WParam.ToInt32();
                if (id == HOTKEY_F8)
                {
                    ExecuteFillCurrentForm();
                }
                else if (id == HOTKEY_F9)
                {
                    StartAutoRun();
                }
                else if (id == HOTKEY_ESC)
                {
                    RequestStop();
                }
            }
            base.WndProc(ref m);
        }

        private void SetStatus(string text, Color? color = null)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => SetStatus(text, color)));
                return;
            }
            _lblStatus.Text = text;
            _lblStatus.ForeColor = color ?? Color.FromArgb(30, 41, 59);
        }

        private void UpdateStats()
        {
            int total = _tasks.Count;
            int done = 0;
            foreach (var t in _tasks)
            {
                if (t.Status == "Hoàn thành") done++;
            }
            int pending = total - done;
            _lblStats.Text = string.Format("Tổng: {0} ca | Chờ: {1} | Đã hoàn thành: {2}", total, pending, done);
        }

        private void RefreshListView()
        {
            _lvTasks.BeginUpdate();
            _lvTasks.Items.Clear();
            for (int i = 0; i < _tasks.Count; i++)
            {
                var t = _tasks[i];
                var item = new ListViewItem((i + 1).ToString());
                item.SubItems.Add(t.TenBn);
                item.SubItems.Add(t.ThuThuat);
                item.SubItems.Add(t.GioBatDau);
                item.SubItems.Add(t.GioKetThuc);
                item.SubItems.Add(!string.IsNullOrEmpty(t.KtvTen) ? t.KtvTen : t.KtvMa);
                item.SubItems.Add(t.Status);

                if (t.Status == "Hoàn thành")
                {
                    item.BackColor = Color.FromArgb(240, 253, 244);
                    item.ForeColor = Color.FromArgb(22, 101, 52);
                }
                else if (t.Status.StartsWith("Lỗi"))
                {
                    item.BackColor = Color.FromArgb(254, 242, 242);
                    item.ForeColor = Color.FromArgb(153, 27, 27);
                }
                _lvTasks.Items.Add(item);
            }
            _lvTasks.EndUpdate();
            UpdateStats();
        }

        private void AutoLoadDefaultTasks()
        {
            string jsonPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "danh_sach_thu_thuat_hom_nay.json");
            if (File.Exists(jsonPath))
            {
                try
                {
                    string json = File.ReadAllText(jsonPath, Encoding.UTF8);
                    var list = ParseJsonTasks(json);
                    if (list.Count > 0)
                    {
                        _tasks = list;
                        RefreshListView();
                        SetStatus(string.Format("Đã nạp {0} ca từ danh_sach_thu_thuat_hom_nay.json", list.Count), Color.FromArgb(2, 132, 199));
                        return;
                    }
                }
                catch { }
            }

            // Nếu trong clipboard có dữ liệu JSON thì tự nhận
            try
            {
                if (Clipboard.ContainsText())
                {
                    string clip = Clipboard.GetText();
                    if (clip.Contains("ten_bn") || clip.Contains("ho_ten") || clip.Contains("thu_thuat"))
                    {
                        var list = ParseJsonTasks(clip);
                        if (list.Count > 0)
                        {
                            _tasks = list;
                            RefreshListView();
                            SetStatus(string.Format("Đã nạp {0} ca từ Clipboard!", list.Count), Color.FromArgb(22, 163, 74));
                        }
                    }
                }
            }
            catch { }
        }

        private void LoadTasksFromClipboard()
        {
            try
            {
                if (!Clipboard.ContainsText())
                {
                    MessageBox.Show("Clipboard hiện không có văn bản!", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }
                string text = Clipboard.GetText();
                var list = ParseJsonTasks(text);
                if (list.Count == 0)
                {
                    MessageBox.Show("Không tìm thấy dữ liệu ca thủ thuật trong Clipboard!\nHãy sao chép danh sách JSON hoặc xuất từ tool xếp lịch.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }
                _tasks = list;
                RefreshListView();
                SetStatus(string.Format("Đã nạp thành công {0} ca từ Clipboard!", list.Count), Color.FromArgb(22, 163, 74));
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi đọc dữ liệu: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private List<PatientTask> ParseJsonTasks(string json)
        {
            var list = new List<PatientTask>();
            Match matchArray = Regex.Match(json, @"\[\s*\{.*\}\s*\]", RegexOptions.Singleline);
            string content = matchArray.Success ? matchArray.Value : json;

            MatchCollection objects = Regex.Matches(content, @"\{[^{}]*\}");
            foreach (Match m in objects)
            {
                string objStr = m.Value;
                var task = new PatientTask();
                task.TenBn = ExtractField(objStr, "ten_bn", "ho_ten", "ten");
                task.ThuThuat = ExtractField(objStr, "thu_thuat", "dich_vu", "ten_dich_vu");
                task.GioBatDau = ExtractField(objStr, "gio_bat_dau", "bat_dau", "gio_bd");
                task.GioKetThuc = ExtractField(objStr, "gio_ket_thuc", "ket_thuc", "gio_kt");
                task.Ngay = ExtractField(objStr, "ngay");
                task.NgayGioBd = ExtractField(objStr, "ngay_gio_bd");
                task.NgayGioKt = ExtractField(objStr, "ngay_gio_kt");
                task.KtvTen = ExtractField(objStr, "ktv_ten", "ktv");
                task.KtvMa = ExtractField(objStr, "ktv_ma");
                task.VoCam = ExtractField(objStr, "vo_cam");
                if (string.IsNullOrEmpty(task.VoCam)) task.VoCam = "Khác";
                task.TinhHinh = ExtractField(objStr, "tinh_hinh");
                if (string.IsNullOrEmpty(task.TinhHinh)) task.TinhHinh = "Chủ động";
                task.MoTa = ExtractField(objStr, "mo_ta");
                if (string.IsNullOrEmpty(task.MoTa)) task.MoTa = ".";
                task.MayYTe = ExtractField(objStr, "may_y_te");

                if (!string.IsNullOrEmpty(task.TenBn))
                {
                    list.Add(task);
                }
            }
            return list;
        }

        private string ExtractField(string json, params string[] fieldNames)
        {
            foreach (var fn in fieldNames)
            {
                Match m = Regex.Match(json, "\"" + fn + "\"\\s*:\\s*\"([^\"]*)\"");
                if (m.Success)
                {
                    return m.Groups[1].Value;
                }
            }
            return "";
        }

        private void ClearTasks()
        {
            _tasks.Clear();
            RefreshListView();
            SetStatus("Đã xóa danh sách ca.");
        }

        // =====================================================================
        // CORE: ĐIỀN FORM BẰNG .NET UI AUTOMATION NATIVE
        // =====================================================================
        public void ExecuteFillCurrentForm()
        {
            if (_tasks.Count == 0)
            {
                SetStatus("⚠️ Chưa có danh sách ca! Hãy bấm 'Dán Clipboard' trước.", Color.FromArgb(220, 38, 38));
                return;
            }

            int selectedIndex = 0;
            if (_lvTasks.SelectedIndices.Count > 0)
            {
                selectedIndex = _lvTasks.SelectedIndices[0];
            }
            else
            {
                for (int i = 0; i < _tasks.Count; i++)
                {
                    if (_tasks[i].Status != "Hoàn thành")
                    {
                        selectedIndex = i;
                        break;
                    }
                }
            }

            var task = _tasks[selectedIndex];
            SetStatus(string.Format("⚡ [F8] Đang tìm form và điền cho ca #{0}: {1}...", selectedIndex + 1, task.TenBn), Color.FromArgb(217, 119, 6));

            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    string diagInfo;
                    bool ok = FillFormNativeUIA(task, out diagInfo);
                    if (ok)
                    {
                        task.Status = "Hoàn thành";
                        MessageBeep(0x00000040); // Tiếng Beep nhẹ báo hiệu thành công
                        SetStatus(string.Format("✅ Đã điền & Lưu thành công ca #{0}: {1}!", selectedIndex + 1, task.TenBn), Color.FromArgb(22, 163, 74));

                        this.Invoke(new Action(() =>
                        {
                            RefreshListView();
                            // Tự động chuyển chọn ca tiếp theo
                            if (selectedIndex + 1 < _tasks.Count)
                            {
                                _lvTasks.Items[selectedIndex + 1].Selected = true;
                                _lvTasks.Items[selectedIndex + 1].EnsureVisible();
                            }
                        }));
                    }
                    else
                    {
                        SetStatus("❌ " + diagInfo, Color.FromArgb(220, 38, 38));
                    }
                }
                catch (Exception ex)
                {
                    task.Status = "Lỗi: " + ex.Message;
                    SetStatus("❌ Lỗi: " + ex.Message, Color.FromArgb(220, 38, 38));
                    this.Invoke(new Action(RefreshListView));
                }
            });
        }

        private bool FillFormNativeUIA(PatientTask task, out string diagInfo)
        {
            diagInfo = "";

            // 1. TÌM FORM PTTT TRÊN EMRHIS
            string findLog;
            AutomationElement form = FindFormThuThuat(out findLog);
            if (form == null)
            {
                diagInfo = "Không tìm thấy Form PTTT đang mở trên emrHIS!";
                return false;
            }

            // Kích hoạt cửa sổ lên trên cùng
            try
            {
                IntPtr hwnd = (IntPtr)form.Current.NativeWindowHandle;
                if (hwnd != IntPtr.Zero)
                {
                    ShowWindow(hwnd, 9); // SW_RESTORE
                    BringWindowToTop(hwnd);
                    SetForegroundWindow(hwnd);
                }
            }
            catch { }

            Thread.Sleep(80);

            // 2. Điền Ngày Giờ Bắt Đầu (txtNgayPTTT)
            string dtStart = !string.IsNullOrEmpty(task.NgayGioBd) ? task.NgayGioBd : (task.GioBatDau + " " + task.Ngay).Trim();
            if (string.IsNullOrEmpty(dtStart)) dtStart = task.GioBatDau;
            SmartSetControlValue(form, dtStart, "txtNgayPTTT", "txtNgayBD", "txtThoiGianBD");

            // 3. Điền Ngày Giờ Kết Thúc (txtNgayPTTT_End)
            string dtEnd = !string.IsNullOrEmpty(task.NgayGioKt) ? task.NgayGioKt : (task.GioKetThuc + " " + task.Ngay).Trim();
            if (string.IsNullOrEmpty(dtEnd)) dtEnd = task.GioKetThuc;
            SmartSetControlValue(form, dtEnd, "txtNgayPTTT_End", "txtNgayKT", "txtThoiGianKT");

            // 4. Điền Tình Hình PTTT (bắt buộc vì có dấu sao đỏ '*')
            string tinhHinh = !string.IsNullOrEmpty(task.TinhHinh) ? task.TinhHinh : "Chủ động";
            SmartSetControlValue(form, tinhHinh, "txtTinhHinhPTTT", "cboTinhHinhPTTT", "txtTinhHinh", "cboTinhHinh");

            // 5. Điền Phương Pháp Vô Cảm (txtPPVoCam)
            SmartSetControlValue(form, task.VoCam, "txtPPVoCam", "cboPPVoCam");

            // 6. Điền Máy Thực Hiện (txtMayThucHien) nếu có
            if (!string.IsNullOrEmpty(task.MayYTe))
            {
                SmartSetControlValue(form, task.MayYTe, "txtMayThucHien");
            }

            // 7. Điền Mô Tả (txtMoTaPTTT)
            SmartSetControlValue(form, !string.IsNullOrEmpty(task.MoTa) ? task.MoTa : ".", "txtMoTaPTTT", "txtMoTa");

            // 8. Điền KTV Chính vào bảng Ê-Kíp PTTT nếu có
            FillKtvCell(form, task);

            Thread.Sleep(80);

            // 9. Bấm nút Lưu + Đóng
            bool saved = ClickSaveButton(form);
            if (!saved)
            {
                diagInfo = "Đã điền thông tin nhưng chưa bấm được nút 'Lưu + Đóng'.";
            }

            return true;
        }

        // =====================================================================
        // THUẬT TOÁN TÌM FORM THỦ THUẬT SIÊU MẠNH MẼ (ROBUST)
        // =====================================================================
        private AutomationElement FindFormThuThuat(out string log)
        {
            StringBuilder sbLog = new StringBuilder();
            List<IntPtr> candidates = new List<IntPtr>();

            // 1. Quét tìm qua các Process emrHIS
            try
            {
                var procs = Process.GetProcesses();
                foreach (var p in procs)
                {
                    try
                    {
                        string pName = p.ProcessName.ToLower();
                        if (pName.Contains("his"))
                        {
                            if (p.MainWindowHandle != IntPtr.Zero && !candidates.Contains(p.MainWindowHandle))
                            {
                                candidates.Add(p.MainWindowHandle);
                            }
                        }
                    }
                    catch { }
                }
            }
            catch { }

            // 2. Quét qua EnumWindows để tìm tất cả cửa sổ có tiêu đề liên quan
            EnumWindows((hWnd, lParam) =>
            {
                if (!IsWindowVisible(hWnd)) return true;

                StringBuilder sbTitle = new StringBuilder(512);
                GetWindowText(hWnd, sbTitle, 512);
                string title = sbTitle.ToString();

                uint pid;
                GetWindowThreadProcessId(hWnd, out pid);

                if (title.Contains("Cập Nhật Thông Tin") || 
                    title.Contains("Thủ Thuật") || 
                    title.Contains("PMQL BỆNH VIỆN") || 
                    title.Contains("emrHIS") ||
                    title.Contains("DPT|"))
                {
                    if (!candidates.Contains(hWnd))
                    {
                        candidates.Add(hWnd);
                    }
                }
                return true;
            }, IntPtr.Zero);

            sbLog.AppendLine(string.Format("Tìm thấy {0} cửa sổ ứng viên.", candidates.Count));

            // 3. Với mỗi cửa sổ ứng viên, kiểm tra xem có chứa Form hoặc các Control PTTT không
            foreach (IntPtr hwnd in candidates)
            {
                try
                {
                    AutomationElement root = AutomationElement.FromHandle(hwnd);
                    if (root == null) continue;

                    string rootName = "";
                    string rootAid = "";
                    try
                    {
                        rootName = root.Current.Name;
                        rootAid = root.Current.AutomationId;
                    }
                    catch { }

                    // A. Nếu bản thân cửa sổ chính là FormThuThuat_Ekip
                    if (rootAid == "FormThuThuat_Ekip" || rootName.Contains("Cập Nhật Thông Tin"))
                    {
                        log = string.Format("Khớp trực tiếp Form: AID='{0}', Title='{1}'", rootAid, rootName);
                        return root;
                    }

                    // B. Tìm FormThuThuat_Ekip bên trong (Tab / MDI con)
                    var condForm = new PropertyCondition(AutomationElement.AutomationIdProperty, "FormThuThuat_Ekip");
                    var innerForm = root.FindFirst(TreeScope.Descendants, condForm);
                    if (innerForm != null)
                    {
                        log = string.Format("Khớp FormThuThuat_Ekip bên trong HWND {0} ({1})", hwnd, rootName);
                        return innerForm;
                    }

                    // C. Tìm qua các Button đặc trưng: "Lưu + Đóng" hoặc "btnSaveClose"
                    var condSaveClose = new OrCondition(
                        new PropertyCondition(AutomationElement.NameProperty, "Lưu + Đóng"),
                        new PropertyCondition(AutomationElement.AutomationIdProperty, "btnSaveClose")
                    );
                    var btnSave = root.FindFirst(TreeScope.Descendants, condSaveClose);
                    if (btnSave != null)
                    {
                        log = string.Format("Khớp qua nút 'Lưu + Đóng' bên trong HWND {0} ({1})", hwnd, rootName);
                        return root;
                    }

                    // D. Tìm qua các Edit đặc trưng: "txtNgayPTTT" hoặc "mListViewData"
                    var condControls = new OrCondition(
                        new PropertyCondition(AutomationElement.AutomationIdProperty, "txtNgayPTTT"),
                        new PropertyCondition(AutomationElement.AutomationIdProperty, "mListViewData"),
                        new PropertyCondition(AutomationElement.NameProperty, "Thông Tin PTTT")
                    );
                    var specialCtrl = root.FindFirst(TreeScope.Descendants, condControls);
                    if (specialCtrl != null)
                    {
                        log = string.Format("Khớp qua control PTTT đặc trưng bên trong HWND {0} ({1})", hwnd, rootName);
                        return root;
                    }
                }
                catch (Exception ex)
                {
                    sbLog.AppendLine(string.Format("Lỗi quét HWND {0}: {1}", hwnd, ex.Message));
                }
            }

            // 4. Fallback cuối cùng: Quét từ RootElement (Desktop)
            try
            {
                var condBtn = new PropertyCondition(AutomationElement.NameProperty, "Lưu + Đóng");
                var btnAny = AutomationElement.RootElement.FindFirst(TreeScope.Descendants, condBtn);
                if (btnAny != null)
                {
                    log = "Khớp qua tìm kiếm 'Lưu + Đóng' trên toàn Desktop!";
                    // Trả về TopLevelWindow chứa nút này
                    return btnAny;
                }
            }
            catch { }

            log = sbLog.ToString();
            return null;
        }

        // =====================================================================
        // ĐIỀN GIÁ TRỊ THÔNG MINH CHO CẢ WINFORMS & DEVEXPRESS
        // =====================================================================
        private void SmartSetControlValue(AutomationElement parent, string text, params string[] automationIds)
        {
            if (string.IsNullOrEmpty(text)) return;

            AutomationElement ctrl = null;
            foreach (var aid in automationIds)
            {
                try
                {
                    var cond = new PropertyCondition(AutomationElement.AutomationIdProperty, aid);
                    ctrl = parent.FindFirst(TreeScope.Descendants, cond);
                    if (ctrl != null) break;
                }
                catch { }
            }

            if (ctrl == null) return;

            try
            {
                // Cách 1: ValuePattern (Nhanh và chuẩn nhất nếu hỗ trợ)
                object patternObj;
                if (ctrl.TryGetCurrentPattern(ValuePattern.Pattern, out patternObj))
                {
                    var vp = (ValuePattern)patternObj;
                    vp.SetValue(text);
                    return;
                }
            }
            catch { }

            try
            {
                // Cách 2: Nếu ValuePattern không đổi được (DevExpress controls)
                // Click vào giữa BoundingRectangle -> SendKeys Ctrl+A -> Gõ nội dung -> Tab
                var rect = ctrl.Current.BoundingRectangle;
                if (rect.Width > 0 && rect.Height > 0)
                {
                    int cx = (int)(rect.Left + rect.Width / 2);
                    int cy = (int)(rect.Top + rect.Height / 2);

                    Cursor.Position = new Point(cx, cy);
                    mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, (uint)cx, (uint)cy, 0, 0);
                    Thread.Sleep(30);

                    SendKeys.SendWait("^a");
                    Thread.Sleep(20);
                    SendKeys.SendWait("{BACKSPACE}");
                    Thread.Sleep(20);
                    SendKeys.SendWait(text);
                    Thread.Sleep(20);
                    SendKeys.SendWait("{TAB}");
                }
            }
            catch { }
        }

        private void FillKtvCell(AutomationElement form, PatientTask task)
        {
            string ktv = !string.IsNullOrEmpty(task.KtvMa) ? task.KtvMa : task.KtvTen;
            if (string.IsNullOrEmpty(ktv)) return;

            try
            {
                var condList = new OrCondition(
                    new PropertyCondition(AutomationElement.AutomationIdProperty, "mListViewData"),
                    new PropertyCondition(AutomationElement.NameProperty, "Ê-Kíp PTTT")
                );
                var lv = form.FindFirst(TreeScope.Descendants, condList);
                if (lv != null)
                {
                    // Lấy dòng 1 (Kỹ thuật viên chính)
                    var condItem = new PropertyCondition(AutomationElement.NameProperty, "1");
                    var item1 = lv.FindFirst(TreeScope.Children, condItem);
                    if (item1 == null)
                    {
                        // Thử lấy con đầu tiên
                        var children = lv.FindAll(TreeScope.Children, Condition.TrueCondition);
                        if (children.Count > 0) item1 = children[0];
                    }

                    if (item1 != null)
                    {
                        var rect = item1.Current.BoundingRectangle;
                        // Click vào cột 'Nhân Viên' (khoảng 65% - 75% chiều ngang của dòng)
                        int cx = (int)(rect.Left + rect.Width * 0.70);
                        int cy = (int)(rect.Top + rect.Height / 2);

                        Cursor.Position = new Point(cx, cy);
                        mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, (uint)cx, (uint)cy, 0, 0);
                        Thread.Sleep(40);
                        mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, (uint)cx, (uint)cy, 0, 0);
                        Thread.Sleep(40);

                        SendKeys.SendWait("{F2}");
                        Thread.Sleep(30);
                        SendKeys.SendWait(ktv + "{ENTER}");
                    }
                }
            }
            catch { }
        }

        private bool ClickSaveButton(AutomationElement form)
        {
            // 1. Tìm qua InvokePattern
            try
            {
                var condBtn = new OrCondition(
                    new PropertyCondition(AutomationElement.NameProperty, "Lưu + Đóng"),
                    new PropertyCondition(AutomationElement.AutomationIdProperty, "btnSaveClose")
                );
                var btn = form.FindFirst(TreeScope.Descendants, condBtn);
                if (btn != null)
                {
                    object patternObj;
                    if (btn.TryGetCurrentPattern(InvokePattern.Pattern, out patternObj))
                    {
                        var inv = (InvokePattern)patternObj;
                        inv.Invoke();
                        return true;
                    }

                    // Click chuột trực tiếp vào tâm nút nếu Invoke không được
                    var rect = btn.Current.BoundingRectangle;
                    if (rect.Width > 0 && rect.Height > 0)
                    {
                        int cx = (int)(rect.Left + rect.Width / 2);
                        int cy = (int)(rect.Top + rect.Height / 2);
                        Cursor.Position = new Point(cx, cy);
                        mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, (uint)cx, (uint)cy, 0, 0);
                        return true;
                    }
                }
            }
            catch { }

            // 2. Fallback: gửi phím Alt + L
            try
            {
                SendKeys.SendWait("%l");
                return true;
            }
            catch { }

            return false;
        }

        private void StartAutoRun()
        {
            if (_isRunning) return;
            _isRunning = true;
            _stopRequested = false;
            _btnFillF8.Enabled = false;
            _btnAutoF9.Enabled = false;
            _btnStop.Enabled = true;

            SetStatus("▶️ Đang ở chế độ TỰ ĐỘNG (F9)! Hãy mở form ca đầu tiên trên emrHIS...", Color.FromArgb(22, 163, 74));

            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    for (int i = 0; i < _tasks.Count; i++)
                    {
                        if (_stopRequested) break;
                        var t = _tasks[i];
                        if (t.Status == "Hoàn thành") continue;

                        this.Invoke(new Action(() =>
                        {
                            if (i < _lvTasks.Items.Count)
                            {
                                _lvTasks.Items[i].Selected = true;
                                _lvTasks.Items[i].EnsureVisible();
                            }
                        }));

                        SetStatus(string.Format("⏳ Chờ mở form cho ca #{0}: {1}...", i + 1, t.TenBn));

                        // Chờ cho đến khi form PTTT xuất hiện
                        AutomationElement form = null;
                        for (int w = 0; w < 60; w++)
                        {
                            if (_stopRequested) break;
                            string tmpLog;
                            form = FindFormThuThuat(out tmpLog);
                            if (form != null) break;
                            Thread.Sleep(250);
                        }

                        if (form != null && !_stopRequested)
                        {
                            string diag;
                            bool ok = FillFormNativeUIA(t, out diag);
                            if (ok)
                            {
                                t.Status = "Hoàn thành";
                                MessageBeep(0x00000040);
                                this.Invoke(new Action(RefreshListView));
                            }
                            Thread.Sleep(600);
                        }
                    }
                }
                finally
                {
                    _isRunning = false;
                    _stopRequested = false;
                    this.Invoke(new Action(() =>
                    {
                        _btnFillF8.Enabled = true;
                        _btnAutoF9.Enabled = true;
                        _btnStop.Enabled = false;
                        SetStatus("Đã kết thúc chu trình tự động.");
                        RefreshListView();
                    }));
                }
            });
        }

        private void RequestStop()
        {
            _stopRequested = true;
            SetStatus("⏹ Đã gửi yêu cầu dừng!", Color.FromArgb(220, 38, 38));
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
