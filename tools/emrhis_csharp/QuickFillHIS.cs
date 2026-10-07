using System;
using System.Collections.Generic;
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
            GioKetThuc = "08:30";
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

        // Win32 API cho Global Hotkeys
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
            this.Text = "⚡ emrHIS C# Native QuickFill v1.0 [Phương Án B]";
            this.Size = new Size(720, 480);
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

            this.Controls.Add(toolbar);

            // 2. Status Bar ở dưới
            Panel bottomPanel = new Panel { Dock = DockStyle.Bottom, Height = 48, BackColor = Color.FromArgb(241, 245, 249), Padding = new Padding(8, 4, 8, 4) };

            _lblStatus = new Label
            {
                Text = "Sẵn sàng. Bấm 'Dán Clipboard' để nạp dữ liệu từ PM-XếpLịch.",
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                ForeColor = Color.FromArgb(30, 41, 59),
                Dock = DockStyle.Top,
                Height = 20
            };
            bottomPanel.Controls.Add(_lblStatus);

            _lblStats = new Label
            {
                Text = "Tổng: 0 ca | Chờ: 0 | Đã nhập: 0",
                Font = new Font("Segoe UI", 8.5F),
                ForeColor = Color.FromArgb(100, 116, 139),
                Dock = DockStyle.Bottom,
                Height = 18
            };
            bottomPanel.Controls.Add(_lblStats);

            this.Controls.Add(bottomPanel);

            // 3. ListView Bảng danh sách ca
            _lvTasks = new ListView
            {
                Dock = DockStyle.Fill,
                View = View.Details,
                FullRowSelect = true,
                GridLines = true,
                Font = new Font("Segoe UI", 9F),
                BackColor = Color.White
            };
            _lvTasks.Columns.Add("STT", 45);
            _lvTasks.Columns.Add("Bệnh Nhân", 170);
            _lvTasks.Columns.Add("Thủ Thuật", 170);
            _lvTasks.Columns.Add("Giờ BĐ", 65);
            _lvTasks.Columns.Add("Giờ KT", 65);
            _lvTasks.Columns.Add("KTV", 80);
            _lvTasks.Columns.Add("Trạng Thái", 100);

            this.Controls.Add(_lvTasks);
            _lvTasks.BringToFront();

            // Đăng ký Global Hotkeys khi khởi động
            this.Load += (s, e) =>
            {
                RegisterHotKey(this.Handle, HOTKEY_F8, 0, VK_F8);
                RegisterHotKey(this.Handle, HOTKEY_F9, 0, VK_F9);
                RegisterHotKey(this.Handle, HOTKEY_ESC, 0, VK_ESCAPE);
            };

            this.FormClosing += (s, e) =>
            {
                UnregisterHotKey(this.Handle, HOTKEY_F8);
                UnregisterHotKey(this.Handle, HOTKEY_F9);
                UnregisterHotKey(this.Handle, HOTKEY_ESC);
            };
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

        private void SetStatus(string msg, Color? color = null)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(() => SetStatus(msg, color)));
                return;
            }
            _lblStatus.Text = msg;
            _lblStatus.ForeColor = color ?? Color.FromArgb(30, 41, 59);
        }

        private void UpdateStats()
        {
            int total = _tasks.Count;
            int done = 0;
            int waiting = 0;
            foreach (var t in _tasks)
            {
                if (t.Status == "Hoàn thành") done++;
                else waiting++;
            }
            _lblStats.Text = string.Format("Tổng: {0} ca | Chờ: {1} | Đã hoàn thành: {2}", total, waiting, done);
        }

        private void RefreshListView()
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action(RefreshListView));
                return;
            }
            _lvTasks.BeginUpdate();
            _lvTasks.Items.Clear();
            for (int i = 0; i < _tasks.Count; i++)
            {
                var t = _tasks[i];
                var lvi = new ListViewItem((i + 1).ToString());
                lvi.SubItems.Add(t.TenBn);
                lvi.SubItems.Add(t.ThuThuat);
                lvi.SubItems.Add(t.GioBatDau);
                lvi.SubItems.Add(t.GioKetThuc);
                lvi.SubItems.Add(!string.IsNullOrEmpty(t.KtvMa) ? t.KtvMa : t.KtvTen);
                lvi.SubItems.Add(t.Status);

                if (t.Status == "Hoàn thành")
                {
                    lvi.BackColor = Color.FromArgb(240, 253, 244);
                    lvi.ForeColor = Color.FromArgb(22, 101, 52);
                }
                else if (t.Status.StartsWith("Lỗi"))
                {
                    lvi.BackColor = Color.FromArgb(254, 242, 242);
                    lvi.ForeColor = Color.FromArgb(153, 27, 27);
                }
                _lvTasks.Items.Add(lvi);
            }
            _lvTasks.EndUpdate();
            UpdateStats();
        }

        private void LoadTasksFromClipboard()
        {
            try
            {
                string text = Clipboard.GetText();
                if (string.IsNullOrEmpty(text))
                {
                    MessageBox.Show("Clipboard đang trống! Vui lòng bấm 'Xuất Bot Nhập HIS' từ PM-XếpLịch trước.", "Thông báo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                List<PatientTask> parsed = ParseJsonTasks(text);
                if (parsed.Count == 0)
                {
                    MessageBox.Show("Không tìm thấy dữ liệu ca hợp lệ trong Clipboard!\nVui lòng copy đúng dữ liệu JSON từ PM-XếpLịch.", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                _tasks = parsed;
                RefreshListView();
                SetStatus(string.Format("✅ Đã nạp thành công {0} ca thủ thuật từ Clipboard!", _tasks.Count), Color.FromArgb(22, 163, 74));
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi đọc dữ liệu: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private List<PatientTask> ParseJsonTasks(string json)
        {
            var list = new List<PatientTask>();
            // Tìm mảng JSON [ { ... }, { ... } ]
            Match matchArray = Regex.Match(json, @"\[\s*\{.*\}\s*\]", RegexOptions.Singleline);
            string content = matchArray.Success ? matchArray.Value : json;

            // Tách từng object { ... }
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
            SetStatus(string.Format("⚡ [F8] Đang điền cho ca #{0}: {1}...", selectedIndex + 1, task.TenBn), Color.FromArgb(217, 119, 6));

            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    bool ok = FillFormNativeUIA(task);
                    if (ok)
                    {
                        task.Status = "Hoàn thành";
                        MessageBeep(0x00000040); // Tiếng Beep nhẹ báo hiệu thành công
                        SetStatus(string.Format("✅ Đã điền & Lưu thành công ca #{0}: {1}!", selectedIndex + 1, task.TenBn), Color.FromArgb(22, 163, 74));
                        
                        this.Invoke(new Action(() =>
                        {
                            RefreshListView();
                            // Chọn ca tiếp theo
                            if (selectedIndex + 1 < _tasks.Count)
                            {
                                _lvTasks.Items[selectedIndex + 1].Selected = true;
                                _lvTasks.Items[selectedIndex + 1].EnsureVisible();
                            }
                        }));
                    }
                    else
                    {
                        SetStatus("❌ Không tìm thấy Form 'Cập Nhật Thông Tin Thủ Thuật' đang mở!", Color.FromArgb(220, 38, 38));
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

        private bool FillFormNativeUIA(PatientTask task)
        {
            // 1. Tìm cửa sổ popup 'FormThuThuat_Ekip' trên Desktop
            AutomationElement form = FindFormThuThuat();
            if (form == null)
            {
                return false;
            }

            // Kích hoạt cửa sổ lên trên cùng
            try
            {
                IntPtr hwnd = (IntPtr)form.Current.NativeWindowHandle;
                if (hwnd != IntPtr.Zero)
                {
                    ShowWindow(hwnd, 9); // SW_RESTORE
                    SetForegroundWindow(hwnd);
                }
            }
            catch { }

            Thread.Sleep(50);

            // 2. Điền Ngày Giờ Bắt Đầu (txtNgayPTTT)
            string dtStart = !string.IsNullOrEmpty(task.NgayGioBd) ? task.NgayGioBd : (task.GioBatDau + " " + task.Ngay).Trim();
            SetControlValue(form, "txtNgayPTTT", dtStart);

            // 3. Điền Ngày Giờ Kết Thúc (txtNgayPTTT_End)
            string dtEnd = !string.IsNullOrEmpty(task.NgayGioKt) ? task.NgayGioKt : (task.GioKetThuc + " " + task.Ngay).Trim();
            SetControlValue(form, "txtNgayPTTT_End", dtEnd);

            // 4. Điền Phương Pháp Vô Cảm (txtPPVoCam)
            SetControlValue(form, "txtPPVoCam", task.VoCam);

            // 5. Điền Máy Thực Hiện (txtMayThucHien)
            if (!string.IsNullOrEmpty(task.MayYTe))
            {
                SetControlValue(form, "txtMayThucHien", task.MayYTe);
            }

            // 6. Điền Mô Tả (txtMoTaPTTT)
            SetControlValue(form, "txtMoTaPTTT", !string.IsNullOrEmpty(task.MoTa) ? task.MoTa : ".");

            // 7. Điền KTV Chính vào bảng mListViewData nếu có
            FillKtvCell(form, task);

            Thread.Sleep(50);

            // 8. Bấm nút Lưu + Đóng (btnSaveClose)
            ClickSaveButton(form);

            return true;
        }

        private AutomationElement FindFormThuThuat()
        {
            // 1. Tìm theo AutomationId='FormThuThuat_Ekip'
            var condId = new PropertyCondition(AutomationElement.AutomationIdProperty, "FormThuThuat_Ekip");
            AutomationElement form = AutomationElement.RootElement.FindFirst(TreeScope.Children, condId);
            if (form != null) return form;

            // 2. Tìm theo SubName 'Cập Nhật Thông Tin'
            var forms = AutomationElement.RootElement.FindAll(TreeScope.Children, new PropertyCondition(AutomationElement.ControlTypeProperty, ControlType.Window));
            foreach (AutomationElement w in forms)
            {
                try
                {
                    string name = w.Current.Name;
                    if (!string.IsNullOrEmpty(name) && (name.Contains("Cập Nhật Thông Tin") || name.Contains("Thủ Thuật")))
                    {
                        return w;
                    }
                }
                catch { }
            }

            return null;
        }

        private void SetControlValue(AutomationElement parent, string automationId, string text)
        {
            if (string.IsNullOrEmpty(text)) return;
            try
            {
                var cond = new PropertyCondition(AutomationElement.AutomationIdProperty, automationId);
                var ctrl = parent.FindFirst(TreeScope.Descendants, cond);
                if (ctrl != null)
                {
                    object patternObj;
                    if (ctrl.TryGetCurrentPattern(ValuePattern.Pattern, out patternObj))
                    {
                        var vp = (ValuePattern)patternObj;
                        vp.SetValue(text);
                        return;
                    }
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
                var condList = new PropertyCondition(AutomationElement.AutomationIdProperty, "mListViewData");
                var lv = form.FindFirst(TreeScope.Descendants, condList);
                if (lv != null)
                {
                    // Lấy dòng 1
                    var condItem = new PropertyCondition(AutomationElement.NameProperty, "1");
                    var item1 = lv.FindFirst(TreeScope.Children, condItem);
                    if (item1 != null)
                    {
                        var rect = item1.Current.BoundingRectangle;
                        int cx = (int)(rect.Left + rect.Width * 0.65);
                        int cy = (int)(rect.Top + rect.Height / 2);

                        // Click vào ô KTV
                        Cursor.Position = new Point(cx, cy);
                        mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, (uint)cx, (uint)cy, 0, 0);
                        Thread.Sleep(50);
                        mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, (uint)cx, (uint)cy, 0, 0);
                        Thread.Sleep(50);

                        SendKeys.SendWait("{F2}");
                        Thread.Sleep(30);
                        SendKeys.SendWait(ktv + "{ENTER}");
                    }
                }
            }
            catch { }
        }

        private void ClickSaveButton(AutomationElement form)
        {
            try
            {
                var condBtn = new PropertyCondition(AutomationElement.AutomationIdProperty, "btnSaveClose");
                var btn = form.FindFirst(TreeScope.Descendants, condBtn);
                if (btn != null)
                {
                    object patternObj;
                    if (btn.TryGetCurrentPattern(InvokePattern.Pattern, out patternObj))
                    {
                        var inv = (InvokePattern)patternObj;
                        inv.Invoke();
                        return;
                    }
                }
            }
            catch { }

            // Fallback gửi phím Alt + L
            try
            {
                SendKeys.SendWait("%l");
            }
            catch { }
        }

        private void StartAutoRun()
        {
            if (_isRunning) return;
            _isRunning = true;
            _stopRequested = false;
            _btnFillF8.Enabled = false;
            _btnAutoF9.Enabled = false;
            _btnStop.Enabled = true;

            SetStatus("▶️ Đang ở chế độ Tự Động! Hãy mở từng form hoặc để bot tự quét...", Color.FromArgb(22, 163, 74));

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
                            form = FindFormThuThuat();
                            if (form != null) break;
                            Thread.Sleep(200);
                        }

                        if (form != null && !_stopRequested)
                        {
                            bool ok = FillFormNativeUIA(t);
                            if (ok)
                            {
                                t.Status = "Hoàn thành";
                                MessageBeep(0x00000040);
                                this.Invoke(new Action(RefreshListView));
                            }
                            Thread.Sleep(500);
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

        [DllImport("user32.dll")]
        private static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
        private const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP = 0x0004;

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
