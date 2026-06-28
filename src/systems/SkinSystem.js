/**
 * SkinSystem.js — Quản lý Skin (trang phục) cho Player
 *
 * Cung cấp API công khai:
 *   • getSkins()      — danh sách tất cả skin
 *   • isSkinOwned(id) — kiểm tra đã mở khóa
 *   • ownSkin(id)     — mở khóa skin
 *   • selectSkin(id)  — trang bị skin
 *   • getSelected()   — skin đang được trang bị
 *
 * Dữ liệu lưu trong PlayerProfile (ownedSkins, selectedSkin).
 * CHƯA thay đổi sprite Player — chỉ quản lý dữ liệu.
 *
 * Singleton qua game.registry.
 *
 * Cách dùng:
 *   const skinSys = SkinSystem.get(game.registry);
 *   const allSkins = skinSys.getSkins();
 *   skinSys.selectSkin('red');
 */

import { PlayerProfile } from '../profile/PlayerProfile.js';

/**
 * Định nghĩa các skin có sẵn.
 * Khi thêm skin mới, chỉ cần thêm object vào mảng này.
 *   id        — định danh duy nhất
 *   name      — tên hiển thị
 *   cost      — số xu cần để mở khóa (0 = mặc định)
 */
const SKIN_DEFS = Object.freeze([
  { id: 'default', name: 'Mặc định', cost: 0 },
  { id: 'red',     name: 'Đỏ rực',   cost: 100 },
  { id: 'blue',    name: 'Xanh dương', cost: 100 },
  { id: 'gold',    name: 'Vàng',      cost: 200 },
]);

export class SkinSystem {
  /**
   * @param {PlayerProfile} profile
   */
  constructor(profile) {
    this._profile = profile;
  }

  /**
   * Đăng ký SkinSystem vào game.registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @param {SkinSystem} system
   */
  static register(registry, system) {
    registry.set('skinSystem', system);
  }

  /**
   * Lấy SkinSystem từ registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @returns {SkinSystem|undefined}
   */
  static get(registry) {
    return registry.get('skinSystem');
  }

  /** @returns {ReadonlyArray<{id: string, name: string, cost: number}>} */
  static get SKINS() { return SKIN_DEFS; }

  /**
   * Lấy danh sách tất cả skin có sẵn.
   * Mỗi skin có thêm trường `owned` dynamically.
   * @returns {Array<{id: string, name: string, cost: number, owned: boolean}>}
   */
  getSkins() {
    return SKIN_DEFS.map(s => ({
      ...s,
      owned: this.isSkinOwned(s.id),
    }));
  }

  /**
   * Kiểm tra skin đã được mở khóa chưa.
   * @param {string} skinId
   * @returns {boolean}
   */
  isSkinOwned(skinId) {
    return this._profile.ownedSkins.includes(skinId);
  }

  /**
   * Mở khóa skin. Bỏ qua nếu đã sở hữu.
   * @param {string} skinId
   * @returns {boolean} — true nếu mở khóa thành công
   */
  ownSkin(skinId) {
    if (this.isSkinOwned(skinId)) return false;
    if (!SKIN_DEFS.find(s => s.id === skinId)) return false;
    this._profile.ownedSkins.push(skinId);
    return true;
  }

  /**
   * Trang bị skin. Bỏ qua nếu chưa sở hữu.
   * @param {string} skinId
   * @returns {boolean} — true nếu trang bị thành công
   */
  selectSkin(skinId) {
    if (!this.isSkinOwned(skinId)) return false;
    this._profile.selectedSkin = skinId;
    return true;
  }

  /**
   * Lấy skin đang được trang bị.
   * @returns {{ id: string, name: string, cost: number }|undefined}
   */
  getSelected() {
    return SKIN_DEFS.find(s => s.id === this._profile.selectedSkin);
  }

  /**
   * Lấy thông tin skin theo ID, kèm trạng thái owned.
   * @param {string} skinId
   * @returns {{ id: string, name: string, cost: number, owned: boolean }|null}
   */
  getSkinById(skinId) {
    const def = SKIN_DEFS.find(s => s.id === skinId);
    if (!def) return null;
    return {
      ...def,
      owned: this.isSkinOwned(skinId),
    };
  }
}
