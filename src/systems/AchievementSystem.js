/**
 * AchievementSystem.js — Hệ thống thành tựu (Achievements)
 *
 * Quản lý định nghĩa, tiến trình, trạng thái và phần thưởng của Achievement.
 * Chỉ nhận 5 loại sự kiện từ gameplay:
 *   LIFETIME_DISTANCE_CHANGED, LIFETIME_COIN_COLLECTED,
 *   GAME_FINISHED, BOOST_USED, HIGHEST_SCORE_UPDATED
 *
 * API công khai:
 *   getAchievements()      — danh sách achievement với progress + status
 *   updateProgress(evt, v) — cập nhật tiến độ (GameOverScene gọi)
 *   claimReward(id)        — nhận thưởng (AchievementPanel gọi)
 *   isCompleted(id)        — kiểm tra hoàn thành
 *   isClaimed(id)          — kiểm tra đã nhận thưởng
 *
 * Phần thưởng:
 *   • Cộng Coin vào PlayerProfile.coins
 *   • Mở khóa Skin (nếu có rewardSkin) qua SkinSystem.ownSkin()
 *   • Lưu qua SaveManager ngay sau khi claim
 *
 * Singleton qua game.registry.
 */

/**
 * Định nghĩa các achievement có sẵn.
 *   id          — định danh duy nhất
 *   name        — tên hiển thị
 *   desc        — mô tả
 *   icon        — biểu tượng
 *   eventType   — loại sự kiện kích hoạt
 *   target      — ngưỡng hoàn thành
 *   rewardCoins — số xu thưởng
 *   rewardSkin  — skin mở khóa (null nếu không có)
 */
const ACHIEVEMENT_DEFS = Object.freeze([
  // ── Khoảng cách ──
  {
    id: 'DIST_1000',
    name: 'Người mới bắt đầu',
    desc: 'Đi tổng cộng 1.000m qua các lần chơi',
    icon: '🏔️',
    eventType: 'LIFETIME_DISTANCE_CHANGED',
    target: 1000,
    rewardCoins: 50,
    rewardSkin: null,
  },
  {
    id: 'DIST_5000',
    name: 'Tay trượt cứng',
    desc: 'Đi tổng cộng 5.000m qua các lần chơi',
    icon: '⛷️',
    eventType: 'LIFETIME_DISTANCE_CHANGED',
    target: 5000,
    rewardCoins: 150,
    rewardSkin: null,
  },
  {
    id: 'DIST_10000',
    name: 'Huyền thoại trượt tuyết',
    desc: 'Đi tổng cộng 10.000m qua các lần chơi',
    icon: '🏆',
    eventType: 'LIFETIME_DISTANCE_CHANGED',
    target: 10000,
    rewardCoins: 300,
    rewardSkin: 'gold',
  },

  // ── Xu ──
  {
    id: 'COIN_100',
    name: 'Nhà sưu tập',
    desc: 'Thu tổng cộng 100 xu qua các lần chơi',
    icon: '💰',
    eventType: 'LIFETIME_COIN_COLLECTED',
    target: 100,
    rewardCoins: 50,
    rewardSkin: null,
  },
  {
    id: 'COIN_500',
    name: 'Trùm xu',
    desc: 'Thu tổng cộng 500 xu qua các lần chơi',
    icon: '💎',
    eventType: 'LIFETIME_COIN_COLLECTED',
    target: 500,
    rewardCoins: 200,
    rewardSkin: null,
  },

  // ── Số lần chơi ──
  {
    id: 'GAME_1',
    name: 'Lần đầu tiên',
    desc: 'Chơi 1 lần',
    icon: '🎮',
    eventType: 'GAME_FINISHED',
    target: 1,
    rewardCoins: 25,
    rewardSkin: null,
  },
  {
    id: 'GAME_10',
    name: 'Ghiền game',
    desc: 'Chơi 10 lần',
    icon: '🎯',
    eventType: 'GAME_FINISHED',
    target: 10,
    rewardCoins: 100,
    rewardSkin: null,
  },
  {
    id: 'GAME_50',
    name: 'Nghiện nặng',
    desc: 'Chơi 50 lần',
    icon: '🔥',
    eventType: 'GAME_FINISHED',
    target: 50,
    rewardCoins: 250,
    rewardSkin: null,
  },

  // ── Boost ──
  {
    id: 'BOOST_10',
    name: 'Tăng tốc',
    desc: 'Dùng Boost tổng cộng 10 lần',
    icon: '🚀',
    eventType: 'BOOST_USED',
    target: 10,
    rewardCoins: 50,
    rewardSkin: null,
  },
  {
    id: 'BOOST_50',
    name: 'Siêu tốc',
    desc: 'Dùng Boost tổng cộng 50 lần',
    icon: '⚡',
    eventType: 'BOOST_USED',
    target: 50,
    rewardCoins: 150,
    rewardSkin: null,
  },

  // ── Điểm cao nhất ──
  {
    id: 'SCORE_500',
    name: 'Phá kỷ lục',
    desc: 'Đạt 500 điểm trong một lần chơi',
    icon: '🌟',
    eventType: 'HIGHEST_SCORE_UPDATED',
    target: 500,
    rewardCoins: 75,
    rewardSkin: null,
  },
  {
    id: 'SCORE_2000',
    name: 'Cao thủ',
    desc: 'Đạt 2.000 điểm trong một lần chơi',
    icon: '👑',
    eventType: 'HIGHEST_SCORE_UPDATED',
    target: 2000,
    rewardCoins: 200,
    rewardSkin: 'blue',
  },
]);

export class AchievementSystem {
  constructor() {
    /** @type {Array<{id:string, name:string, desc:string, icon:string, eventType:string, target:number, rewardCoins:number, rewardSkin:string|null, progress:number}>} */
    this._achievements = [];
  }

  /**
   * Đăng ký AchievementSystem vào game.registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @param {AchievementSystem} system
   */
  static register(registry, system) {
    registry.set('achievementSystem', system);
  }

  /**
   * Lấy AchievementSystem từ registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @returns {AchievementSystem|undefined}
   */
  static get(registry) {
    return registry.get('achievementSystem');
  }

  /** @returns {ReadonlyArray<{id:string, name:string, desc:string, icon:string, eventType:string, target:number, rewardCoins:number, rewardSkin:string|null}>} */
  static get ACHIEVEMENT_DEFS() { return ACHIEVEMENT_DEFS; }

  /**
   * Khởi tạo danh sách achievement với progress từ PlayerProfile.
   * Gọi khi system được tạo (mỗi lần vào game không reset progress).
   */
  loadAchievements() {
    this._achievements = ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      progress: 0,
    }));
  }

  /**
   * Lấy danh sách achievement, kèm trạng thái completed/claimed.
   * @returns {Array<{id:string, name:string, desc:string, icon:string, eventType:string, target:number, rewardCoins:number, rewardSkin:string|null, progress:number, completed:boolean, claimed:boolean}>}
   */
  getAchievements() {
    const profile = this._getProfile();
    return this._achievements.map(a => ({
      ...a,
      completed: a.progress >= a.target,
      claimed: profile ? profile.completedAchievements.includes(a.id) : false,
    }));
  }

  /**
   * Cập nhật tiến độ khi có sự kiện gameplay.
   * Giá trị là tổng tích luỹ (SET progress = value).
   *
   * @param {string} eventType — LIFETIME_DISTANCE_CHANGED | LIFETIME_COIN_COLLECTED | GAME_FINISHED | BOOST_USED | HIGHEST_SCORE_UPDATED
   * @param {number} value — tổng tích luỹ hiện tại
   * @returns {Array<{id:string, name:string, progress:number, target:number, justCompleted:boolean}>}
   *   Danh sách achievement có thay đổi (để gửi toast nếu cần).
   */
  updateProgress(eventType, value) {
    const changed = [];

    for (const a of this._achievements) {
      if (a.eventType !== eventType) continue;

      const oldProgress = a.progress;
      a.progress = Math.min(Math.max(value, 0), a.target);

      if (a.progress !== oldProgress) {
        const oldCompleted = oldProgress >= a.target;
        const newCompleted = a.progress >= a.target;
        changed.push({
          id: a.id,
          name: a.name,
          progress: a.progress,
          target: a.target,
          justCompleted: !oldCompleted && newCompleted,
        });
      }
    }

    return changed;
  }

  /**
   * Nhận thưởng cho achievement đã hoàn thành.
   * Chỉ claim được 1 lần — ID được lưu vào PlayerProfile.completedAchievements.
   * Phần thưởng: cộng Coin + mở khóa Skin (nếu có).
   * @param {string} achievementId
   * @returns {boolean} — true nếu claim thành công
   */
  claimReward(achievementId) {
    const achievement = this._achievements.find(a => a.id === achievementId);
    if (!achievement) return false;
    if (achievement.progress < achievement.target) return false;

    const profile = this._getProfile();
    if (!profile) return false;
    if (profile.completedAchievements.includes(achievementId)) return false;

    // Đánh dấu đã claim
    profile.completedAchievements.push(achievementId);

    // Cộng thưởng Coin
    profile.coins += achievement.rewardCoins;

    // Mở khóa Skin nếu có
    if (achievement.rewardSkin) {
      const skinSystem = this._getSkinSystem();
      if (skinSystem) {
        skinSystem.ownSkin(achievement.rewardSkin);
      }
    }

    // Lưu qua SaveManager
    const sm = this._getSaveManager();
    if (sm) sm.save();

    return true;
  }

  /**
   * Kiểm tra achievement đã hoàn thành (đạt target) chưa.
   * @param {string} achievementId
   * @returns {boolean}
   */
  isCompleted(achievementId) {
    const achievement = this._achievements.find(a => a.id === achievementId);
    return achievement ? achievement.progress >= achievement.target : false;
  }

  /**
   * Kiểm tra achievement đã được claim (nhận thưởng) chưa.
   * @param {string} achievementId
   * @returns {boolean}
   */
  isClaimed(achievementId) {
    const profile = this._getProfile();
    return profile ? profile.completedAchievements.includes(achievementId) : false;
  }

  /**
   * Gắn registry để AchievementSystem có thể truy cập PlayerProfile, SaveManager và SkinSystem.
   * @param {Phaser.Game.GameRegistry} registry
   */
  setRegistry(registry) {
    this._registry = registry;
  }

  /** @returns {import('../profile/PlayerProfile.js').PlayerProfile|null} */
  _getProfile() {
    return this._registry ? this._registry.get('playerProfile') : null;
  }

  /** @returns {import('../managers/SaveManager.js').SaveManager|null} */
  _getSaveManager() {
    return this._registry ? this._registry.get('saveManager') : null;
  }

  /** @returns {import('./SkinSystem.js').SkinSystem|null} */
  _getSkinSystem() {
    return this._registry ? this._registry.get('skinSystem') : null;
  }
}
