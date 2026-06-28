/**
 * PlayerProfile.js — Nguồn dữ liệu duy nhất cho người chơi
 *
 * Lưu trữ tập trung:
 *   • coins, bestScore
 *   • selectedSkin, ownedSkins
 *   • completedMissions — ID các mission đã claim (MissionSystem ghi)
 *   • completedAchievements, lastDailyRewardTime (placeholder)
 *   • settings (muted, bgmVolume, sfxVolume)
 *
 * Được quản lý bởi SaveManager. Lưu vào localStorage dưới dạng JSON.
 * Singleton qua game.registry — mọi scene/module đều truy cập được.
 *
 * Cách dùng:
 *   const profile = PlayerProfile.get(game.registry);
 *   profile.bestScore = 150;
 *   profile.coins += 10;
 *   profile.completedMissions.push('dist_500'); // MissionSystem.claimReward() xử lý
 */

export class PlayerProfile {
  constructor() {
    this.coins = 0;
    this.bestScore = 0;
    this.selectedSkin = 'default';
    this.ownedSkins = ['default'];
    this.completedMissions = [];
    this.completedAchievements = [];
    this.lastDailyRewardTime = null;

    // Lifetime Statistics (tích luỹ qua các lần chơi)
    this.totalDistance = 0;
    this.totalCoinsCollected = 0;
    this.totalBoostUsed = 0;
    this.totalGamesPlayed = 0;
    this.totalPlayTime = 0;
    this.highestSingleRun = 0;

    this.settings = {
      muted: false,
      bgmVolume: 0.35,
      sfxVolume: 0.55,
    };
  }

  /**
   * Đăng ký PlayerProfile vào game.registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @param {PlayerProfile} profile
   */
  static register(registry, profile) {
    registry.set('playerProfile', profile);
  }

  /**
   * Lấy PlayerProfile từ registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @returns {PlayerProfile|undefined}
   */
  static get(registry) {
    return registry.get('playerProfile');
  }

  /**
   * Chuyển đổi profile → plain object để lưu JSON.
   * @returns {object}
   */
  toJSON() {
    return {
      savedAt: Date.now(),
      coins: this.coins,
      bestScore: this.bestScore,
      selectedSkin: this.selectedSkin,
      ownedSkins: [...this.ownedSkins],
      completedMissions: [...this.completedMissions],
      completedAchievements: [...this.completedAchievements],
      lastDailyRewardTime: this.lastDailyRewardTime,
      totalDistance: this.totalDistance,
      totalCoinsCollected: this.totalCoinsCollected,
      totalBoostUsed: this.totalBoostUsed,
      totalGamesPlayed: this.totalGamesPlayed,
      totalPlayTime: this.totalPlayTime,
      highestSingleRun: this.highestSingleRun,
      settings: { ...this.settings },
    };
  }

  /**
   * Khôi phục profile từ plain object (kết quả JSON.parse).
   * Giá trị thiếu sẽ giữ nguyên mặc định.
   * @param {object} data
   */
  fromJSON(data) {
    this.coins = typeof data.coins === 'number' ? data.coins : 0;
    this.bestScore = typeof data.bestScore === 'number' ? data.bestScore : 0;
    this.selectedSkin = typeof data.selectedSkin === 'string' ? data.selectedSkin : 'default';
    this.ownedSkins = Array.isArray(data.ownedSkins) ? [...data.ownedSkins] : ['default'];
    this.completedMissions = Array.isArray(data.completedMissions) ? [...data.completedMissions] : [];
    this.completedAchievements = Array.isArray(data.completedAchievements) ? [...data.completedAchievements] : [];
    this.lastDailyRewardTime = data.lastDailyRewardTime ?? null;

    // Lifetime Statistics
    this.totalDistance = typeof data.totalDistance === 'number' ? data.totalDistance : 0;
    this.totalCoinsCollected = typeof data.totalCoinsCollected === 'number' ? data.totalCoinsCollected : 0;
    this.totalBoostUsed = typeof data.totalBoostUsed === 'number' ? data.totalBoostUsed : 0;
    this.totalGamesPlayed = typeof data.totalGamesPlayed === 'number' ? data.totalGamesPlayed : 0;
    this.totalPlayTime = typeof data.totalPlayTime === 'number' ? data.totalPlayTime : 0;
    this.highestSingleRun = typeof data.highestSingleRun === 'number' ? data.highestSingleRun : 0;

    // Merge settings an toàn
    if (data.settings && typeof data.settings === 'object') {
      this.settings = {
        muted: !!data.settings.muted,
        bgmVolume: typeof data.settings.bgmVolume === 'number'
          ? Math.max(0, Math.min(1, data.settings.bgmVolume)) : 0.35,
        sfxVolume: typeof data.settings.sfxVolume === 'number'
          ? Math.max(0, Math.min(1, data.settings.sfxVolume)) : 0.55,
      };
    }
  }
}
