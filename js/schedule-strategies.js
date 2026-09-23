/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧩 SCHEDULE STRATEGIES REGISTRY (PLUGGABLE STRATEGY PATTERN) - v4.1.4-rev3
 * Module chuẩn hóa các chiến lược xếp lịch:
 *  - 1. Heuristic Greedy Strategy (opt_rare / opt_math)
 *  - 2. CP-SAT Solver Optimization Strategy (cp_sat)
 *  - 3. AI-Guided Hybrid Strategy (ai_hybrid)
 *  - 4. Saturday Specialized Strategy (saturday)
 * Tương thích 100% môi trường Browser (window.ScheduleStrategyRegistry) và Node.js
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  const strategies = new Map();

  class BaseScheduleStrategy {
    constructor(key, name, description) {
      this.key = key;
      this.name = name;
      this.description = description;
    }

    async execute(context) {
      throw new Error(`Strategy '${this.key}' must implement execute(context)`);
    }
  }

  // 1. Heuristic Greedy Strategy
  class HeuristicStrategy extends BaseScheduleStrategy {
    constructor() {
      super(
        'opt_rare',
        'Heuristic Tối Ưu Thủ Thuật Hiếm',
        'Ưu tiên xếp sớm các thủ thuật đơn lẻ, giải phóng tài nguyên và tối đa hóa công suất'
      );
    }

    async execute(context) {
      const { engineRef, dateVal, strategyKey, skipProcsStr, crowdedOverride, existingSched, options } = context;
      if (engineRef && typeof engineRef._internalRunHeuristic === 'function') {
        return engineRef._internalRunHeuristic(dateVal, strategyKey, skipProcsStr, crowdedOverride, existingSched, options);
      }
      return null;
    }
  }

  // 2. CP-SAT Solver Strategy
  class CPSatStrategy extends BaseScheduleStrategy {
    constructor() {
      super(
        'cp_sat',
        'CP-SAT Solver (OR-Tools / MiniPC)',
        'Mô hình tối ưu hóa ràng buộc toàn vẹn, triệt tiêu xung đột giờ và cân bằng tải nhân sự'
      );
    }

    async execute(context) {
      const { engineRef, dateVal, strategyKey, skipProcsStr, crowdedOverride, existingSched, options } = context;
      // Kích hoạt cờ tối ưu hóa CP-SAT trong options cho Engine
      options.useCPSat = true;
      if (engineRef && typeof engineRef._internalRunHeuristic === 'function') {
        return engineRef._internalRunHeuristic(dateVal, 'cp_sat', skipProcsStr, crowdedOverride, existingSched, options);
      }
      return null;
    }
  }

  // 3. AI-Guided Hybrid Strategy
  class AIHybridStrategy extends BaseScheduleStrategy {
    constructor() {
      super(
        'ai_hybrid',
        'AI Hybrid T.I.M.E.S (Mô Hình Học Máy)',
        'Dự đoán thứ tự ưu tiên bệnh nhân dựa trên lịch sử điều trị kết hợp Heuristic & CP-SAT'
      );
    }

    async execute(context) {
      const { engineRef, dateVal, strategyKey, skipProcsStr, crowdedOverride, existingSched, options } = context;
      const aiScheduler = (typeof window !== 'undefined' && window.AIScheduler) ? window.AIScheduler : null;
      if (aiScheduler && typeof aiScheduler.rankPatients === 'function') {
        options.useAIRanking = true;
      }
      if (engineRef && typeof engineRef._internalRunHeuristic === 'function') {
        return engineRef._internalRunHeuristic(dateVal, 'ai_hybrid', skipProcsStr, crowdedOverride, existingSched, options);
      }
    }
  }

  // 4. Saturday Specialized Strategy
  class SaturdayStrategy extends BaseScheduleStrategy {
    constructor() {
      super(
        'saturday',
        'Xếp Lịch Chuyên Biệt Thứ Bảy',
        'Tối ưu hóa khung thời gian làm việc ca sáng thứ Bảy theo định mức ngắn hơn'
      );
    }

    async execute(context) {
      const { engineRef, payload, dateVal } = context;
      if (engineRef && typeof engineRef.runSaturdayScheduling === 'function') {
        return engineRef.runSaturdayScheduling(payload, dateVal);
      }
      return null;
    }
  }

  const Registry = {
    register(key, strategyInstance) {
      if (!key || !strategyInstance) return;
      strategies.set(String(key).toLowerCase(), strategyInstance);
    },

    get(key) {
      if (!key) return strategies.get('opt_rare');
      const normalized = String(key).toLowerCase();
      return strategies.get(normalized) || strategies.get('opt_rare') || null;
    },

    list() {
      return Array.from(strategies.values()).map(s => ({
        key: s.key,
        name: s.name,
        description: s.description
      }));
    },

    has(key) {
      return strategies.has(String(key).toLowerCase());
    },

    BaseScheduleStrategy
  };

  // Register default strategies
  const heuristic = new HeuristicStrategy();
  Registry.register('opt_rare', heuristic);
  Registry.register('opt_math', heuristic);
  Registry.register('heuristic', heuristic);

  const cpSat = new CPSatStrategy();
  Registry.register('cp_sat', cpSat);
  Registry.register('cpsat', cpSat);

  const aiHybrid = new AIHybridStrategy();
  Registry.register('ai_hybrid', aiHybrid);
  Registry.register('ai_scheduler', aiHybrid);

  const satStrategy = new SaturdayStrategy();
  Registry.register('saturday', satStrategy);

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Registry;
  } else {
    global.ScheduleStrategyRegistry = Registry;
  }

})(typeof window !== 'undefined' ? window : globalThis);
