/**
 * PlayScene.js — Scene gameplay chính
 *
 * Hỗ trợ 3 màn chơi (level 1-3) với map và độ khó khác nhau.
 * Nhận level qua this.scene.start('PlayScene', { level: 2 }).
 *
 * Mỗi level tăng dần scrollSpeed, giảm spawnInterval,
 * tăng pool size → thử thách hơn.
 *
 * Chỉ khởi tạo Terrain + InputSystem + Player + SpawnSystem + CollisionSystem + ScoreSystem.
 * Gọi update() mỗi frame — KHÔNG chứa logic spawn, random hay recycle.
 */

import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../entities/Player.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

// ── Cấu hình độ khó theo level ──
const LEVEL_CONFIG = {
  1: {
    mapKey: 'map-snow-1',
    scrollSpeed: 280,
    spawnInterval: 1400,
    treePoolSize: 5,
    rockPoolSize: 5,
    minGapX: 100,
    playerSafeZone: 80,
  },
  2: {
    mapKey: 'map-snow-2',
    scrollSpeed: 350,
    spawnInterval: 1100,
    treePoolSize: 7,
    rockPoolSize: 7,
    minGapX: 80,
    playerSafeZone: 70,
  },
  3: {
    mapKey: 'map-snow-3',
    scrollSpeed: 420,
    spawnInterval: 850,
    treePoolSize: 9,
    rockPoolSize: 9,
    minGapX: 60,
    playerSafeZone: 60,
  },
};

export class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  /**
   * Nhận level từ MenuScene
   * @param {{ level?: number }} data
   */
  init(data) {
    this._level = Phaser.Math.Clamp(data?.level ?? 1, 1, 3);
  }

  create() {
    const { width, height } = this.scale;
    const cfg = LEVEL_CONFIG[this._level];

    // ── Trạng thái game ──
    this._isDead = false;

    // ── Biến scrollSpeed dùng chung cho terrain + obstacles ──
    this.scrollSpeed = cfg.scrollSpeed;

    // ── Terrain (nền tuyết cuộn vô hạn) ──
    this._mapKey = cfg.mapKey;
    this._createTerrain();

    // ── InputSystem ──
    this._input = new InputSystem(this);

    // ── Player (giữa màn hình, ¾ chiều cao) ──
    this._player = new Player(this, width / 2, height * 0.75);
    this._player.sprite.setDepth(10);

    // ── SpawnSystem (object pool Tree + Rock) ──
    this._spawnSystem = new SpawnSystem(this, {
      scrollSpeed: this.scrollSpeed,
      treePoolSize: cfg.treePoolSize,
      rockPoolSize: cfg.rockPoolSize,
      spawnInterval: cfg.spawnInterval,
      minGapX: cfg.minGapX,
      playerSafeZone: cfg.playerSafeZone,
    });

    // ── CollisionSystem (AABB check) ──
    this._collisionSystem = new CollisionSystem();

    // ── ScoreSystem (điểm + best score) ──
    this._scoreSystem = new ScoreSystem();

    // ── Launch UI scene (HUD overlay) ──
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene', { level: this._level });
    }
  }

  update(_time, delta) {
    // Nếu đã chết → dừng mọi logic
    if (this._isDead) return;

    // 1. Đọc input
    this._input.update();

    // 2. Cập nhật player
    const inputState = this._input.getState();
    this._player.update(delta, inputState);

    // 3. Cuộn nền tuyết
    this._updateTerrain(delta);

    // 4. Cập nhật SpawnSystem (spawn / di chuyển / recycle)
    const { x: playerX } = this._player.getPosition();
    this._spawnSystem.update(delta, playerX);

    // 5. Kiểm tra va chạm AABB (dùng hitbox custom từ Player)
    const { isPlayerDead } = this._collisionSystem.check(
      this._player,
      this._spawnSystem._active,
    );

    // 6. Cập nhật điểm
    this._scoreSystem.update(this.scrollSpeed, delta);

    // 7. Xử lý chết
    if (isPlayerDead) {
      this._handleDeath();
    }
  }

  /**
   * Xử lý khi Player va chạm vật cản
   * - Dừng di chuyển + spawning
   * - Chạy animation va chạm (player-collision)
   * - Sau khi animation xong → delay nhẹ → chuyển GameOverScene
   */
  _handleDeath() {
    this._isDead = true;
    // _isDead = true → update() return early → terrain, spawn, input đều dừng

    // Dừng velocity player để đứng yên
    this._player.velocityX = 0;

    // Chạy animation va chạm
    this._player.sprite.play('player-collision');

    // Khi animation kết thúc → delay 1.5s rồi chuyển scene
    this._player.sprite.once('animationcomplete', () => {
      this.time.delayedCall(1500, () => {
        this._scoreSystem.saveBestScore();
        this.scene.start('GameOverScene', {
          score: this._scoreSystem.getScore(),
          bestScore: this._scoreSystem.getBestScore(),
          level: this._level,
        });
      });
    });
  }

  // ══════════════════════════════════════════════
  //  TERRAIN — Parallax multi-layer infinite map
  // ══════════════════════════════════════════════

  /**
   * Tạo 3 lớp nền cuộn parallax:
   * L1 — Nền xa (distant mountains):  chậm nhất → hiệu ứng xa, tint lạnh
   * L2 — Trung cảnh (mid-ground):      tốc độ vừa
   * L3 — Tiền cảnh (foreground):       nhanh nhất → hiệu ứng gần, sáng rõ
   */
  _createTerrain() {
    const { width, height } = this.scale;

    // Lấy kích thước ảnh gốc
    const tex = this.textures.get(this._mapKey);
    const src = tex.getSourceImage();
    const imgW = src.width;
    const imgH = src.height;

    // Tính base scale để ảnh fit đầy chiều rộng màn hình
    this._tileScaleX = width / imgW;
    this._tileScaleY = this._tileScaleX; // giữ nguyên tỉ lệ

    // Layer 1 — Nền xa: scale nhỏ → xa, tint lạnh, chậm nhất
    this._layerFar = this.add.tileSprite(
      width / 2, height / 2, width, height, this._mapKey,
    );
    this._layerFar.setDepth(-3);
    this._layerFar.setTint(0x8899bb);
    this._layerFar.tileScaleX = this._tileScaleX * 0.6;
    this._layerFar.tileScaleY = this._tileScaleY * 0.6;

    // Layer 2 — Trung cảnh: tỉ lệ chuẩn, tốc độ vừa
    this._layerMid = this.add.tileSprite(
      width / 2, height / 2, width, height, this._mapKey,
    );
    this._layerMid.setDepth(-2);
    this._layerMid.tileScaleX = this._tileScaleX * 0.8;
    this._layerMid.tileScaleY = this._tileScaleY * 0.8;

    // Layer 3 — Tiền cảnh: scale lớn → gần, sáng, nhanh nhất
    this._layerNear = this.add.tileSprite(
      width / 2, height / 2, width, height, this._mapKey,
    );
    this._layerNear.setDepth(-1);
    this._layerNear.setTint(0xffffff);
    this._layerNear.tileScaleX = this._tileScaleX;
    this._layerNear.tileScaleY = this._tileScaleY;

    this._scrollY = 0;
  }

  /**
   * Cuộn 3 lớp nền với tốc độ khác nhau (parallax).
   * Nền xa (far) chậm nhất ↔ tiền cảnh (near) nhanh nhất.
   * @param {number} delta — ms kể từ frame trước
   */
  _updateTerrain(delta) {
    const dt = delta / 1000;
    this._scrollY += this.scrollSpeed * dt;

    // Layer 1 — far: chậm nhất (0.2×), chạy từ trên xuống dưới
    this._layerFar.tilePositionY = -(this._scrollY * 0.2) / this._layerFar.tileScaleY;
    // Layer 2 — mid: trung bình (0.5×)
    this._layerMid.tilePositionY = -(this._scrollY * 0.5) / this._layerMid.tileScaleY;
    // Layer 3 — near: nhanh nhất (1.0×) — khớp tốc độ vật cản
    this._layerNear.tilePositionY = -(this._scrollY * 1.0) / this._layerNear.tileScaleY;
  }

  // ══════════════════════════════════════════════

  shutdown() {
    this._input.destroy();
    this._player.destroy();
    this._spawnSystem.destroy();
    // CollisionSystem & ScoreSystem không giữ resource Phaser → không cần destroy
  }
}
