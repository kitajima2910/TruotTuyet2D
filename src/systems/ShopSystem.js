/**
 * ShopSystem.js — Hệ thống cửa hàng mua bán Skin
 *
 * Quản lý catalog, giá cả, mua và trang bị skin.
 * Mọi giao dịch Coin đều đi qua ShopSystem.
 * Không cho phép Coin âm, không mua lại skin đã sở hữu.
 * Singleton qua game.registry.
 *
 * API công khai:
 *   loadCatalog()              — khởi tạo catalog
 *   getCatalog()               — lấy danh sách skin + trạng thái sở hữu
 *   purchaseSkin(skinId)       — mua skin (trừ Coin)
 *   equipSkin(skinId)          — trang bị skin
 *   canPurchase(skinId)        — kiểm tra có thể mua không
 *   getPrice(skinId)           — lấy giá skin
 */

/**
 * Định nghĩa catalog skin trong cửa hàng.
 *   id      — định danh duy nhất
 *   name    — tên hiển thị
 *   price   — giá xu (0 = miễn phí, -1 = không thể mua)
 *   special — true nếu chỉ mở khóa qua Achievement/DailyReward
 */
const CATALOG_DEFS = Object.freeze([
  { id: 'default', name: 'Cậu bé len xanh',  price: 0,    special: false },
  { id: 'red',     name: 'Đỏ rực',    price: 500,  special: false },
  { id: 'blue',    name: 'Xanh dương', price: 1000, special: false },
  { id: 'green',   name: 'Xanh lá',   price: 1500, special: false },
  { id: 'gold',    name: 'Vàng',      price: -1,   special: true },
]);

export class ShopSystem {
  /**
   * @param {Phaser.Game.GameRegistry} registry
   */
  constructor(registry) {
    this._registry = registry;
  }

  /**
   * Đăng ký ShopSystem vào game.registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @param {ShopSystem} system
   */
  static register(registry, system) {
    registry.set('shopSystem', system);
  }

  /**
   * Lấy ShopSystem từ registry.
   * @param {Phaser.Game.GameRegistry} registry
   * @returns {ShopSystem|undefined}
   */
  static get(registry) {
    return registry.get('shopSystem');
  }

  /** @returns {ReadonlyArray<{id:string, name:string, price:number, special:boolean}>} */
  static get CATALOG_DEFS() { return CATALOG_DEFS; }

  /**
   * Khởi tạo catalog (gọi khi ShopSystem được tạo lần đầu).
   */
  loadCatalog() {
    // Catalog là static — không cần khởi tạo thêm
  }

  /**
   * Lấy danh sách catalog kèm trạng thái owned của người chơi.
   * @returns {Array<{id:string, name:string, price:number, special:boolean, owned:boolean}>}
   */
  getCatalog() {
    return CATALOG_DEFS.map(item => ({
      ...item,
      owned: this._isOwned(item.id),
    }));
  }

  /**
   * Lấy giá skin theo ID.
   * @param {string} skinId
   * @returns {number} — giá xu (-1 nếu skin không tồn tại hoặc không thể mua)
   */
  getPrice(skinId) {
    const item = CATALOG_DEFS.find(c => c.id === skinId);
    return item ? item.price : -1;
  }

  /**
   * Kiểm tra có thể mua skin không.
   * @param {string} skinId
   * @returns {boolean}
   */
  canPurchase(skinId) {
    const item = CATALOG_DEFS.find(c => c.id === skinId);
    if (!item) return false;
    if (item.price < 0) return false;      // special — không bán
    if (this._isOwned(skinId)) return false; // đã sở hữu
    const profile = this._getProfile();
    if (!profile) return false;
    return profile.coins >= item.price;
  }

  /**
   * Mua skin. Trừ Coin, đánh dấu sở hữu, tự động trang bị.
   * @param {string} skinId
   * @returns {{ success: boolean, message: string }}
   */
  purchaseSkin(skinId) {
    const item = CATALOG_DEFS.find(c => c.id === skinId);
    if (!item) {
      return { success: false, message: 'Skin không tồn tại' };
    }
    if (item.price < 0) {
      return { success: false, message: 'Skin này không thể mua — chỉ mở khóa qua thành tựu' };
    }
    if (this._isOwned(skinId)) {
      return { success: false, message: 'Bạn đã sở hữu skin này' };
    }

    const profile = this._getProfile();
    if (!profile) {
      return { success: false, message: 'Không tìm thấy dữ liệu người chơi' };
    }
    if (profile.coins < item.price) {
      return { success: false, message: `Không đủ xu (cần ${item.price} xu)` };
    }

    // Trừ Coin
    profile.coins -= item.price;

    // Mở khóa skin qua SkinSystem
    const skinSystem = this._getSkinSystem();
    if (skinSystem) {
      skinSystem.ownSkin(skinId);
    } else {
      // Fallback: ghi trực tiếp vào profile
      if (!profile.ownedSkins.includes(skinId)) {
        profile.ownedSkins.push(skinId);
      }
    }

    // Tự động trang bị skin vừa mua
    if (skinSystem) {
      skinSystem.selectSkin(skinId);
    } else {
      profile.selectedSkin = skinId;
    }

    // Lưu qua SaveManager
    const sm = this._getSaveManager();
    if (sm) sm.save();

    return { success: true, message: `Đã mua "${item.name}"! ✅` };
  }

  /**
   * Trang bị skin đã sở hữu.
   * @param {string} skinId
   * @returns {{ success: boolean, message: string }}
   */
  equipSkin(skinId) {
    if (!this._isOwned(skinId)) {
      return { success: false, message: 'Bạn chưa sở hữu skin này' };
    }

    const skinSystem = this._getSkinSystem();
    if (skinSystem) {
      skinSystem.selectSkin(skinId);
    } else {
      const profile = this._getProfile();
      if (profile) profile.selectedSkin = skinId;
    }

    const sm = this._getSaveManager();
    if (sm) sm.save();

    return { success: true, message: 'Đã trang bị skin! ✅' };
  }

  /** @param {string} skinId */
  _isOwned(skinId) {
    const profile = this._getProfile();
    return profile ? profile.ownedSkins.includes(skinId) : false;
  }

  /** @returns {import('../profile/PlayerProfile.js').PlayerProfile|null} */
  _getProfile() {
    return this._registry ? this._registry.get('playerProfile') : null;
  }

  /** @returns {import('./SkinSystem.js').SkinSystem|null} */
  _getSkinSystem() {
    return this._registry ? this._registry.get('skinSystem') : null;
  }

  /** @returns {import('../managers/SaveManager.js').SaveManager|null} */
  _getSaveManager() {
    return this._registry ? this._registry.get('saveManager') : null;
  }
}
