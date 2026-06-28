/**
 * DailyRewardSystem.js — Hệ thống phần thưởng hàng ngày
 *
 * Quản lý Login Streak, Last Claim Date và quy trình Claim.
 *   • Mỗi ngày chỉ được nhận thưởng một lần (theo ngày dương lịch, không theo 24h)
 *   • Bỏ quá một ngày → reset streak về Day 1
 *   • Sau Day 7 → quay lại Day 1
 *
 * API công khai:
 *   initialize()               — khởi tạo/reset dữ liệu
 *   canClaim()                 — kiểm tra có thể claim hôm nay không
 *   claimReward()              — nhận thưởng cho ngày hiện tại
 *   getCurrentDay()            — ngày hiện tại trong chu kỳ (1-7)
 *   getCurrentReward()         — phần thưởng của ngày hiện tại
 *   getRewardCalendar()        — toàn bộ lịch 7 ngày
 *   getRemainingTime()         — thời gian còn lại đến nửa đêm (ms)
 *
 * Dữ liệu lưu trong PlayerProfile (dailyLoginStreak, lastDailyRewardTime).
 * Lưu qua SaveManager ngay sau khi claim.
 *
 * Singleton qua game.registry.
 */

/**
 * Lịch thưởng 7 ngày.
 *   day    — ngày thứ mấy (1-7)
 *   type   — loại thưởng ('coins')
 *   amount — số lượng
 *   label  — nhãn hiển thị
 */
const REWARD_CALENDAR = Object.freeze([
  { day: 1, type: 'coins', amount: 10, label: '10 Xu' },
  { day: 2, type: 'coins', amount: 15, label: '15 Xu' },
  { day: 3, type: 'coins', amount: 20, label: '20 Xu' },
  { day: 4, type: 'coins', amount: 25, label: '25 Xu' },
  { day: 5, type: 'coins', amount: 30, label: '30 Xu' },
  { day: 6, type: 'coins', amount: 40, label: '40 Xu' },
  { day: 7, type: 'coins', amount: 50, label: '50 Xu ✨' },
]);

export class DailyRewardSystem {
  constructor() {
    this._registry = null;
  }

  /**
   * Đăng ký DailyRewardSystem vào game.registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @param {DailyRewardSystem} system
   */
  static register(registry, system) {
    registry.set('dailyRewardSystem', system);
  }

  /**
   * Lấy DailyRewardSystem từ registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @returns {DailyRewardSystem|undefined}
   */
  static get(registry) {
    return registry.get('dailyRewardSystem');
  }

  /** @returns {ReadonlyArray<{day: number, type: string, amount: number, label: string}>} */
  static get REWARD_CALENDAR() { return REWARD_CALENDAR; }

  /**
   * Gắn registry để DailyRewardSystem có thể truy cập PlayerProfile và SaveManager.
   * @param {Phaser.Game.GameRegistry} registry
   */
  setRegistry(registry) {
    this._registry = registry;
  }

  /**
   * Khởi tạo dữ liệu Daily Reward.
   * Gọi khi system được tạo (đảm bảo các field tồn tại).
   */
  initialize() {
    const profile = this._getProfile();
    if (!profile) return;

    if (typeof profile.dailyLoginStreak !== 'number') {
      profile.dailyLoginStreak = 0;
    }
  }

  /**
   * Kiểm tra người chơi có thể nhận thưởng hôm nay không.
   * @returns {boolean}
   */
  canClaim() {
    const profile = this._getProfile();
    if (!profile) return false;

    // Chưa từng claim → có thể claim
    if (profile.lastDailyRewardTime === null) return true;

    const lastDate = this._toDateString(profile.lastDailyRewardTime);
    const today = this._toDateString(Date.now());

    // Đã claim hôm nay → không thể claim
    return lastDate !== today;
  }

  /**
   * Nhận thưởng cho ngày hiện tại.
   * Tự động kiểm tra canClaim() bên trong.
   * @returns {{ success: boolean, day: number, reward: object|null, message: string }}
   */
  claimReward() {
    const profile = this._getProfile();
    if (!profile) {
      return { success: false, day: 0, reward: null, message: 'Không tìm thấy dữ liệu người chơi' };
    }

    if (!this.canClaim()) {
      return { success: false, day: 0, reward: null, message: 'Bạn đã nhận thưởng hôm nay rồi!' };
    }

    // Kiểm tra streak có bị reset không (bỏ qua một ngày)
    if (profile.lastDailyRewardTime !== null) {
      const lastDate = new Date(profile.lastDailyRewardTime);
      const today = new Date();

      // Tính ngày hôm qua
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastDayStr = this._toDateString(profile.lastDailyRewardTime);
      const yesterdayStr = this._toDateString(yesterday.getTime());
      const todayStr = this._toDateString(today.getTime());

      // Nếu lần claim cuối không phải hôm qua và không phải hôm nay → break streak
      if (lastDayStr !== yesterdayStr && lastDayStr !== todayStr) {
        profile.dailyLoginStreak = 0;
      }
    }

    const currentDay = this.getCurrentDay();
    const reward = this.getRewardForDay(currentDay);

    if (!reward) {
      return { success: false, day: currentDay, reward: null, message: 'Lỗi dữ liệu phần thưởng' };
    }

    // Trao thưởng
    if (reward.type === 'coins') {
      profile.coins += reward.amount;
    }

    // Cập nhật streak cho lần claim tiếp theo
    // Nếu đang ở Day 7 → quay lại Day 1, nếu không → tăng lên 1
    profile.dailyLoginStreak = currentDay >= 7 ? 1 : currentDay + 1;
    profile.lastDailyRewardTime = Date.now();

    // Lưu qua SaveManager
    const sm = this._getSaveManager();
    if (sm) sm.save();

    return {
      success: true,
      day: currentDay,
      reward: { ...reward },
      message: `Nhận thưởng ngày ${currentDay}: ${reward.label}`,
    };
  }

  /**
   * Lấy ngày hiện tại trong chu kỳ 7 ngày (1-7).
   * @returns {number}
   */
  getCurrentDay() {
    const profile = this._getProfile();
    if (!profile) return 1;
    const streak = profile.dailyLoginStreak || 0;
    // Nếu streak = 0 (chưa claim lần nào) → ngày 1
    // Nếu streak = 1-7 → ngày hiện tại = streak
    return streak === 0 ? 1 : streak;
  }

  /**
   * Lấy phần thưởng của ngày hiện tại.
   * @returns {{ day: number, type: string, amount: number, label: string }|null}
   */
  getCurrentReward() {
    return this.getRewardForDay(this.getCurrentDay());
  }

  /**
   * Lấy phần thưởng cho một ngày cụ thể.
   * @param {number} day — ngày (1-7)
   * @returns {{ day: number, type: string, amount: number, label: string }|null}
   */
  getRewardForDay(day) {
    return REWARD_CALENDAR.find(r => r.day === day) || null;
  }

  /**
   * Lấy toàn bộ lịch thưởng 7 ngày, kèm trạng thái claimed/unlocked/locked.
   * @returns {Array<{day: number, type: string, amount: number, label: string, claimed: boolean, isCurrentDay: boolean}>}
   */
  getRewardCalendar() {
    const profile = this._getProfile();
    const currentDay = this.getCurrentDay();
    const streak = profile ? (profile.dailyLoginStreak || 0) : 0;
    const canClaimNow = this.canClaim();

    return REWARD_CALENDAR.map(r => {
      let claimed = false;

      if (streak > 0) {
        if (canClaimNow) {
          // Chưa claim hôm nay
          // Ngày < currentDay đã claim trong chu kỳ này
          if (currentDay === 1) {
            // Đã hoàn thành chu kỳ trước (streak=1 + lastDailyRewardTime != null)
            // → day 7 đã claim
            claimed = r.day === 7;
          } else {
            claimed = r.day < currentDay;
          }
        } else {
          // Đã claim hôm nay
          // Ngày vừa claim: streak - 1 (hoặc 7 nếu streak = 1 do wrap)
          const lastClaimedDay = streak === 1 ? 7 : streak - 1;
          claimed = r.day <= lastClaimedDay;
        }
      }

      return {
        ...r,
        claimed,
        isCurrentDay: r.day === currentDay,
      };
    });
  }

  /**
   * Lấy thời gian còn lại đến nửa đêm (ms).
   * @returns {number}
   */
  getRemainingTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
  }

  /** @returns {import('../profile/PlayerProfile.js').PlayerProfile|null} */
  _getProfile() {
    return this._registry ? this._registry.get('playerProfile') : null;
  }

  /** @returns {import('../managers/SaveManager.js').SaveManager|null} */
  _getSaveManager() {
    return this._registry ? this._registry.get('saveManager') : null;
  }

  /**
   * Chuyển timestamp → chuỗi ngày (YYYY-MM-DD) để so sánh.
   * @param {number} ts — timestamp (ms)
   * @returns {string}
   */
  _toDateString(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
