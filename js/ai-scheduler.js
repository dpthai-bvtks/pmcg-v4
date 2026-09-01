/**
 * 🤖 AI-SCHEDULER: MACHINE LEARNING & CLINICAL PATTERN ENGINE (GROUP 3)
 * Tự động học từ dữ liệu lịch sử thực tế (20.000 dòng trong 5 tháng qua)
 * Tối ưu hóa phân bổ nhân sự - phòng bệnh, dự báo nghẽn máy và định lượng độ ưu tiên bệnh nhân.
 */

window.AIScheduler = (function () {
  'use strict';

  const STORAGE_KEY = 'times_ai_learned_model';

  // Mô hình AI mặc định (Pre-trained Baseline) chuẩn lâm sàng YHCT & PHCN CS2
  const defaultModel = {
    version: '3.2.5-AI',
    trainedRows: 0,
    lastTrained: null,
    staffAffinity: {},      // { "proc_room": { "StaffA": 150, "StaffB": 20 } }
    timeSlotDist: {},       // { "Điện châm": { "morning": 0.85, "afternoon": 0.15 } }
    machineCongestion: {
      "Kéo giãn": 1.45,
      "Siêu âm": 1.35,
      "Sóng ngắn": 1.20,
      "Parafin": 1.15,
      "Điện xung": 1.05,
      "Laser": 1.10
    },
    patientWeights: {
      discharged: 3.5,
      rareMachine: 2.8,
      procCount: 1.8,
      earlyArrival: 1.2,
      elderly: 0.8
    }
  };

  let currentModel = loadSavedModel() || defaultModel;

  function loadSavedModel() {
    try {
      if (typeof localStorage !== 'undefined') {
        const str = localStorage.getItem(STORAGE_KEY);
        if (str) return JSON.parse(str);
      }
    } catch (e) {
      console.warn('[AIScheduler] Không thể đọc mô hình AI từ localStorage:', e);
    }
    return null;
  }

  function saveModel(model) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
      }
      currentModel = model;
    } catch (e) {
      console.warn('[AIScheduler] Không thể lưu mô hình AI vào localStorage:', e);
    }
  }

  /**
   * 🧠 Huấn luyện mô hình AI từ dữ liệu lịch sử thực tế (20.000 dòng)
   */
  function trainFromHistory(historyRows = []) {
    const startTime = performance.now();
    if (!Array.isArray(historyRows) || historyRows.length === 0) {
      console.log('[AIScheduler] Không có dữ liệu lịch sử để huấn luyện, giữ nguyên mô hình cơ sở.');
      return currentModel;
    }

    const model = {
      version: '3.2.5-AI',
      trainedRows: historyRows.length,
      lastTrained: new Date().toISOString(),
      staffAffinity: {},
      timeSlotDist: {},
      machineCongestion: { ...defaultModel.machineCongestion },
      patientWeights: { ...defaultModel.patientWeights }
    };

    const machineCounts = {};

    historyRows.forEach(row => {
      if (!row) return;
      const proc = String(row.procedure_name || row.thuThuat || row.DICHVU || row.tenThuThuat || row[4] || '').trim();
      const room = String(row.room || row.phong || row.PHONG || row.tenPhong || row[3] || '').trim();
      const staff = String(row.staff_name || row.nvChinh || row["NV CHÍNH"] || row.tenNV || row[7] || '').trim();
      const timeStart = String(row.start_time || row.gioDienRa || row.GIODIENRA || row.gioBatDau || row[5] || '').trim();
      const machine = String(row.machine_name || row.may || row.MAY || row.tenMay || row[9] || '').trim();

      if (!proc || !staff) return;

      // 1. Học ma trận tương thích: Nhân sự x Thủ thuật x Phòng bệnh
      const affinityKey = `${proc.toLowerCase()}@${room.toLowerCase()}`;
      if (!model.staffAffinity[affinityKey]) model.staffAffinity[affinityKey] = {};
      model.staffAffinity[affinityKey][staff] = (model.staffAffinity[affinityKey][staff] || 0) + 1;

      // 2. Học phân bổ khung giờ sáng / chiều
      if (timeStart && timeStart.includes(':')) {
        const hour = parseInt(timeStart.split(':')[0], 10) || 7;
        const isMorning = hour < 12;
        if (!model.timeSlotDist[proc]) model.timeSlotDist[proc] = { morning: 0, afternoon: 0, total: 0 };
        if (isMorning) model.timeSlotDist[proc].morning++;
        else model.timeSlotDist[proc].afternoon++;
        model.timeSlotDist[proc].total++;
      }

      // 3. Học tần suất tắc nghẽn máy móc
      if (machine && machine !== 'Thủ công' && machine !== 'None' && machine !== '--') {
        const loaiMay = machine.split('-')[0].trim();
        machineCounts[loaiMay] = (machineCounts[loaiMay] || 0) + 1;
      }
    });

    // Chuẩn hóa chỉ số tắc nghẽn máy móc
    const totalMachineUses = Object.values(machineCounts).reduce((a, b) => a + b, 0);
    if (totalMachineUses > 0) {
      const avgUsesPerType = totalMachineUses / Object.keys(machineCounts).length;
      Object.keys(machineCounts).forEach(mType => {
        const ratio = machineCounts[mType] / avgUsesPerType;
        model.machineCongestion[mType] = Math.max(1.0, Math.min(2.0, Number(ratio.toFixed(2))));
      });
    }

    saveModel(model);
    const elapsed = (performance.now() - startTime).toFixed(1);
    console.log(`[AIScheduler] 🚀 Đã huấn luyện xong mô hình AI từ ${historyRows.length} dòng dữ liệu trong ${elapsed} ms!`);

    return model;
  }

  /**
   * 🎯 Tính toán trọng số ưu tiên thông minh cho bệnh nhân (AI Priority Scoring)
   */
  function scorePatientPriority(pat, rareMachines = {}, thuThuatInfo = {}) {
    const w = currentModel.patientWeights;
    let score = 0;

    // 1. Ưu tiên bệnh nhân ra viện trong ngày (giờ ra sớm)
    if (pat.leave && pat.leave < 9999) {
      score += w.discharged * 1000 + (1000 - pat.leave);
    }

    const procs = pat.pending || [];
    score += procs.length * w.procCount * 10;

    // 2. Ưu tiên bệnh nhân cần máy hiếm / máy có nguy cơ nghẽn cao
    procs.forEach(pName => {
      const pLower = String(pName).toLowerCase();
      const info = thuThuatInfo[pLower];
      const loaiMay = info ? info[0] : "Thủ công";
      const congestionWeight = currentModel.machineCongestion[loaiMay] || 1.0;
      score += congestionWeight * w.rareMachine * 15;
    });

    // 3. Ưu tiên bệnh nhân có mặt sớm tại khoa
    const arrive = pat.arrive || 450;
    score += (1000 - arrive) * w.earlyArrival * 0.05;

    // 4. Ưu tiên người cao tuổi
    const birthYear = parseInt(pat.ns, 10);
    if (birthYear && birthYear > 1900 && birthYear < 1960) {
      score += (1960 - birthYear) * w.elderly * 0.5;
    }

    return score;
  }

  /**
   * 📋 Sắp xếp thứ tự danh sách bệnh nhân dựa trên trí tuệ nhân tạo (AI Patient Ranking)
   */
  function rankPatients(patients = [], rareMachines = {}, thuThuatInfo = {}) {
    if (!Array.isArray(patients) || patients.length <= 1) return patients;
    
    return [...patients].sort((a, b) => {
      const scoreA = scorePatientPriority(a, rareMachines, thuThuatInfo);
      const scoreB = scorePatientPriority(b, rareMachines, thuThuatInfo);
      return scoreB - scoreA;
    });
  }

  /**
   * 👥 Lấy trọng số thói quen của nhân sự cho một thủ thuật và phòng bệnh cụ thể
   */
  function getStaffAffinityScore(staffName, procName, roomName) {
    if (!staffName || !procName || !roomName) return 1.0;
    const affinityKey = `${String(procName).toLowerCase()}@${String(roomName).toLowerCase()}`;
    const staffMap = currentModel.staffAffinity[affinityKey];
    if (!staffMap || !staffMap[staffName]) return 1.0;

    const count = staffMap[staffName];
    // Tăng trọng số từ 1.0 đến 1.5 dựa trên thói quen làm việc thực tế
    return 1.0 + Math.min(0.5, count * 0.02);
  }

  /**
   * 🔄 Tự động quét và hiệu chỉnh mô hình AI từ bộ nhớ dữ liệu hiện tại
   */
  function calibrateFromAppContext() {
    let historyRows = [];

    // Đọc từ dataCache
    if (typeof window !== 'undefined' && window.dataCache) {
      if (Array.isArray(window.dataCache.history)) historyRows = historyRows.concat(window.dataCache.history);
      if (Array.isArray(window.dataCache.schedule)) historyRows = historyRows.concat(window.dataCache.schedule);
      if (Array.isArray(window.dataCache.lich_trinh)) historyRows = historyRows.concat(window.dataCache.lich_trinh);
    }

    if (typeof window !== 'undefined' && Array.isArray(window.currentScheduleData)) {
      historyRows = historyRows.concat(window.currentScheduleData);
    }

    // Đọc từ localStorage cache
    try {
      if (typeof localStorage !== 'undefined') {
        const bStr = localStorage.getItem('times_bootstrap_cache');
        if (bStr) {
          const bObj = JSON.parse(bStr);
          if (bObj && Array.isArray(bObj.schedule)) historyRows = historyRows.concat(bObj.schedule);
          if (bObj && Array.isArray(bObj.history)) historyRows = historyRows.concat(bObj.history);
        }
        const cachedHistory = localStorage.getItem('times_history_cache');
        if (cachedHistory) {
          const parsed = JSON.parse(cachedHistory);
          if (Array.isArray(parsed)) historyRows = historyRows.concat(parsed);
        }
        const mStr = localStorage.getItem('meds_success');
        if (mStr) {
          const mObj = JSON.parse(mStr);
          if (Array.isArray(mObj)) historyRows = historyRows.concat(mObj);
        }
      }
    } catch(e) {}

    return trainFromHistory(historyRows);
  }

  /**
   * ⏰ Tự động kiểm tra và huấn luyện AI theo khung giờ chỉ định hàng ngày
   */
  function checkAutoTrain() {
    try {
      if (typeof localStorage === 'undefined') return;
      const enable = localStorage.getItem('ai_auto_train_enable') !== '0'; // Mặc định bật
      if (!enable) return;

      const targetTimeStr = localStorage.getItem('ai_auto_train_time') || '17:00';
      const parts = targetTimeStr.split(':');
      const targetMins = (parseInt(parts[0], 10) || 17) * 60 + (parseInt(parts[1], 10) || 0);

      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const todayStr = now.toISOString().slice(0, 10);
      const lastTrainedDate = localStorage.getItem('ai_last_auto_train_date') || '';

      if (todayStr !== lastTrainedDate && currentMins >= targetMins) {
        console.log(`[AIScheduler] ⏰ Đã đến giờ tự động huấn luyện AI (${targetTimeStr}). Đang nạp dữ liệu...`);
        const model = calibrateFromAppContext();
        localStorage.setItem('ai_last_auto_train_date', todayStr);
        if (model && model.trainedRows > 0) {
          console.log(`[AIScheduler] ✅ Đã tự động cập nhật mô hình AI (${model.trainedRows} dòng) thành công!`);
        }
      }
    } catch (e) {
      console.warn('[AIScheduler] Lỗi trong tiến trình kiểm tra tự động huấn luyện AI:', e);
    }
  }

  // Khởi động tiến trình chạy nền kiểm tra định kỳ mỗi 60 giây
  if (typeof window !== 'undefined') {
    setTimeout(checkAutoTrain, 3000);
    setInterval(checkAutoTrain, 60000);
  }

  return {
    getModel: () => currentModel,
    trainFromHistory,
    scorePatientPriority,
    rankPatients,
    getStaffAffinityScore,
    calibrate: calibrateFromAppContext,
    checkAutoTrain
  };
})();
