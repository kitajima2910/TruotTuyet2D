/**
 * AssetManager.js — Quản lý tập trung tài nguyên game
 *
 * Cung cấp:
 *   - Tạo textures procedural cho particle effects (snow, trail, sparkle, glow)
 *   - Hằng số đường dẫn asset tập trung
 *
 * Cách dùng:
 *   import { AssetManager } from '../managers/AssetManager.js';
 *   AssetManager.createParticleTextures(this); // trong scene.create()
 */

export class AssetManager {
  /**
   * Tạo tất cả textures cho particle effects trong scene.
   * Gọi 1 lần duy nhất, thường từ PlayScene.create().
   * An toàn: kiểm tra texture tồn tại trước khi tạo (tránh duplicate).
   * @param {Phaser.Scene} scene
   */
  static createParticleTextures(scene) {
    // ── Snow particle: 8×8 white soft circle ──
    if (!scene.textures.exists('particle-snow')) {
      const gfx = scene.make.graphics({ add: false });
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(4, 4, 4);
      gfx.generateTexture('particle-snow', 8, 8);
      gfx.destroy();
    }

    // ── Trail particle: 6×6 soft white ──
    if (!scene.textures.exists('particle-trail')) {
      const gfx = scene.make.graphics({ add: false });
      gfx.fillStyle(0xccddff, 0.7);
      gfx.fillCircle(3, 3, 3);
      gfx.generateTexture('particle-trail', 6, 6);
      gfx.destroy();
    }

    // ── Sparkle particle: 10×10 golden glow ──
    if (!scene.textures.exists('particle-sparkle')) {
      const gfx = scene.make.graphics({ add: false });
      gfx.fillStyle(0xffdd44, 1);
      gfx.fillCircle(5, 5, 5);
      gfx.fillStyle(0xffffff, 0.5);
      gfx.fillCircle(5, 5, 2);
      gfx.generateTexture('particle-sparkle', 10, 10);
      gfx.destroy();
    }

    // ── Glow particle: 14×14 soft green glow ──
    if (!scene.textures.exists('particle-glow')) {
      const gfx = scene.make.graphics({ add: false });
      gfx.fillStyle(0x00ff88, 0.8);
      gfx.fillCircle(7, 7, 5);
      gfx.fillStyle(0x88ffcc, 0.3);
      gfx.fillCircle(7, 7, 7);
      gfx.generateTexture('particle-glow', 14, 14);
      gfx.destroy();
    }

    // ── Flame particle: 12×12 warm-white circle (tint-friendly) ──
    if (!scene.textures.exists('particle-flame')) {
      const gfx = scene.make.graphics({ add: false });
      gfx.fillStyle(0xffeedd, 1);
      gfx.fillCircle(6, 6, 6);
      gfx.fillStyle(0xffffff, 0.6);
      gfx.fillCircle(6, 6, 4);
      gfx.generateTexture('particle-flame', 12, 12);
      gfx.destroy();
    }

    // ── Flash particle: 20×20 white burst ──
    if (!scene.textures.exists('particle-flash')) {
      const gfx = scene.make.graphics({ add: false });
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(10, 10, 6);
      gfx.fillStyle(0xff6644, 0.4);
      gfx.fillCircle(10, 10, 10);
      gfx.generateTexture('particle-flash', 20, 20);
      gfx.destroy();
    }
  }

  /**
   * Định nghĩa tập trung đường dẫn asset.
   * Dùng để load trong BootScene.preload().
   */
  static get PATHS() {
    return {
      PLAYER_TREN: 'assets/player/tren/',
      PLAYER_TRAI: 'assets/player/trai/',
      PLAYER_PHAI: 'assets/player/phai/',
      PLAYER_VACHAM: 'assets/player/va-cham/',
      TREE_DUNGYEN: 'assets/cay-thong/dung-yen/',
      TREE_LUNGLAY: 'assets/cay-thong/lung-lay/',
      TREE_GAY: 'assets/cay-thong/gay/',
      ROCK: 'assets/da/',
      COIN: 'assets/coin/',
      BOOST_PAD: 'assets/boost-pad/',
      MAP: 'assets/map/',
    };
  }

  /**
   * Tạo tên key cho coin frame theo index.
   * @param {number} i — 0..15
   * @returns {string}
   */
  static coinFrameKey(i) {
    return `coin-${String(i).padStart(2, '0')}`;
  }

  /**
   * Tạo tên key cho rock frame theo index.
   * @param {number} i — 1..20
   * @returns {string}
   */
  static rockFrameKey(i) {
    return `rock-${i}`;
  }

  /**
   * Tạo tên key cho boost-pad frame theo index.
   * @param {number} i — 1..7
   * @returns {string}
   */
  static boostPadFrameKey(i) {
    return `boostpad-${i}`;
  }
}
