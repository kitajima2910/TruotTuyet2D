/**
 * SaveManager.js — Quản lý toàn bộ Save/Load/Reset/Version
 *
 * Một JSON duy nhất trong localStorage cho toàn bộ dữ liệu game.
 *   • Chỉ lưu khi dữ liệu thực sự thay đổi (so sánh JSON hash)
 *   • Hỗ trợ migrate version — tự động chuyển đổi dữ liệu cũ
 *   • Reset về mặc định khi cần
 *
 * Singleton qua game.registry.
 *
 * Cách dùng:
 *   const sm = SaveManager.get(game.registry);
 *   sm.save();
 *   sm.reset();
 */

import { PlayerProfile } from '../profile/PlayerProfile.js';

const SAVE_KEY = 'truottuyet_save';
const CURRENT_VERSION = 2;

export class SaveManager {
  constructor() {
    /** @type {PlayerProfile|null} */
    this._profile = null;
    /** @type {string|null} */
    this._lastJson = null;
  }

  /**
   * Đăng ký SaveManager vào game.registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @param {SaveManager} sm
   */
  static register(registry, sm) {
    registry.set('saveManager', sm);
  }

  /**
   * Lấy SaveManager từ registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @returns {SaveManager|undefined}
   */
  static get(registry) {
    return registry.get('saveManager');
  }

  /** @returns {number} */
  static get CURRENT_VERSION() { return CURRENT_VERSION; }

  /** @returns {string} */
  static get SAVE_KEY() { return SAVE_KEY; }

  /**
   * Tải dữ liệu từ localStorage → tạo/kết hợp PlayerProfile.
   * Tự động migrate dữ liệu từ phiên bản cũ nếu cần.
   * @returns {PlayerProfile}
   */
  load() {
    const profile = new PlayerProfile();

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const version = typeof data.version === 'number' ? data.version : 0;
        const migrated = this._migrate(data, version);
        profile.fromJSON(migrated);
      }
    } catch (_) {
      // localStorage unavailable hoặc dữ liệu hỏng → dùng mặc định
    }

    this._profile = profile;
    this._lastJson = JSON.stringify(profile.toJSON());
    return profile;
  }

  /**
   * Lưu PlayerProfile vào localStorage.
   * Chỉ ghi thật sự nếu dữ liệu thay đổi so với lần lưu trước.
   */
  save() {
    if (!this._profile) return;

    try {
      const json = JSON.stringify(this._profile.toJSON());
      if (json === this._lastJson) return; // không thay đổi → bỏ qua
      const payload = JSON.stringify({
        version: CURRENT_VERSION,
        ...this._profile.toJSON(),
      });
      localStorage.setItem(SAVE_KEY, payload);
      this._lastJson = json;
    } catch (_) {
      // localStorage full hoặc unavailable
    }
  }

  /**
   * Reset toàn bộ dữ liệu về mặc định.
   * Gọi save() ngay để ghi đè localStorage.
   */
  reset() {
    if (!this._profile) {
      this._profile = new PlayerProfile();
    } else {
      // new PlayerProfile() tạo sẵn các giá trị mặc định (ownedSkins, settings, v.v.)
      const defaults = new PlayerProfile();
      this._profile.coins = defaults.coins;
      this._profile.bestScore = defaults.bestScore;
      this._profile.selectedSkin = defaults.selectedSkin;
      this._profile.ownedSkins = [...defaults.ownedSkins];
      this._profile.completedMissions = [...defaults.completedMissions];
      this._profile.completedAchievements = [...defaults.completedAchievements];
      this._profile.dailyLoginStreak = defaults.dailyLoginStreak;
      this._profile.lastDailyRewardTime = defaults.lastDailyRewardTime;
      this._profile.totalDistance = defaults.totalDistance;
      this._profile.totalCoinsCollected = defaults.totalCoinsCollected;
      this._profile.totalBoostUsed = defaults.totalBoostUsed;
      this._profile.totalGamesPlayed = defaults.totalGamesPlayed;
      this._profile.totalPlayTime = defaults.totalPlayTime;
      this._profile.highestSingleRun = defaults.highestSingleRun;
      this._profile.settings = { ...defaults.settings };
    }
    this._lastJson = null; // force save
    this.save();
  }

  /**
   * Migrate dữ liệu từ phiên bản cũ lên phiên bản hiện tại.
   * @param {object} data — dữ liệu gốc từ localStorage (chưa có version field)
   * @param {number} version — phiên bản hiện tại của dữ liệu
   * @returns {object} — dữ liệu đã migrate
   */
  _migrate(data, version) {
    let d = { ...data };

    // Version 0 → 1: lấy best score từ key cũ nếu chưa có
    if (version < 1) {
      if (!d.bestScore || d.bestScore === 0) {
        try {
          const oldBest = localStorage.getItem('truot tuyet best score');
          if (oldBest !== null) {
            d.bestScore = parseInt(oldBest, 10) || 0;
          }
        } catch (_) { /* ignore */ }
      }
      // Đảm bảo các field mới tồn tại
      if (!Array.isArray(d.ownedSkins)) d.ownedSkins = ['default'];
      if (typeof d.selectedSkin !== 'string') d.selectedSkin = 'default';
      if (!Array.isArray(d.completedMissions)) d.completedMissions = [];
      if (!Array.isArray(d.completedAchievements)) d.completedAchievements = [];
      if (!d.lastDailyRewardTime) d.lastDailyRewardTime = null;
      if (!d.settings || typeof d.settings !== 'object') {
        d.settings = { muted: false, bgmVolume: 0.35, sfxVolume: 0.55 };
      }
      // Dọn key cũ
      try {
        localStorage.removeItem('truot tuyet best score');
      } catch (_) { /* ignore */ }
      d.version = 1;
    }

    // Version 1 → 2: thêm dailyLoginStreak
    if (version < 2) {
      if (typeof d.dailyLoginStreak !== 'number') d.dailyLoginStreak = 0;
      d.version = 2;
    }

    return d;
  }

  /** Lấy profile hiện tại */
  getProfile() {
    return this._profile;
  }
}
