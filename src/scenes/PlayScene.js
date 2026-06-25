/**
 * PlayScene.js — Scene gameplay chính
 *
 * Chỉ khởi tạo Terrain + InputSystem + Player + SpawnSystem + CollisionSystem + ScoreSystem.
 * Gọi update() mỗi frame — KHÔNG chứa logic spawn, random hay recycle.
 */

import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../entities/Player.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  create() {
    const { width, height } = this.scale;

    // ── Trạng thái game ──
    this._isDead = false;

    // ── Biến scrollSpeed dùng chung cho terrain + obstacles ──
    this.scrollSpeed = 300;

    // ── Terrain (nền tuyết cuộn vô hạn) ──
    this._createTerrain();

    // ── InputSystem ──
    this._input = new InputSystem(this);

    // ── Player (giữa màn hình, ¾ chiều cao) ──
    this._player = new Player(this, width / 2, height * 0.75);
    this._player.sprite.setDepth(10);

    // ── SpawnSystem (object pool Tree + Rock) ──
    this._spawnSystem = new SpawnSystem(this, {
      scrollSpeed: this.scrollSpeed,
      treePoolSize: 6,
      rockPoolSize: 6,
      spawnInterval: 1200,
      minGapX: 80,
      playerSafeZone: 70,
    });

    // ── CollisionSystem (AABB check) ──
    this._collisionSystem = new CollisionSystem();

    // ── ScoreSystem (điểm + best score) ──
    this._scoreSystem = new ScoreSystem();
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
    const tex = this.textures.get('map-snow');
    const src = tex.getSourceImage();
    const imgW = src.width;
    const imgH = src.height;

    // Tính base scale để ảnh fit đầy chiều rộng màn hình
    this._tileScaleX = width / imgW;
    this._tileScaleY = this._tileScaleX; // giữ nguyên tỉ lệ

    // Layer 1 — Nền xa: scale nhỏ → xa, tint lạnh, chậm nhất
    this._layerFar = this.add.tileSprite(
      width / 2, height / 2, width, height, 'map-snow',
    );
    this._layerFar.setDepth(-3);
    this._layerFar.setTint(0x8899bb);
    this._layerFar.tileScaleX = this._tileScaleX * 0.6;
    this._layerFar.tileScaleY = this._tileScaleY * 0.6;

    // Layer 2 — Trung cảnh: tỉ lệ chuẩn, tốc độ vừa
    this._layerMid = this.add.tileSprite(
      width / 2, height / 2, width, height, 'map-snow',
    );
    this._layerMid.setDepth(-2);
    this._layerMid.tileScaleX = this._tileScaleX * 0.8;
    this._layerMid.tileScaleY = this._tileScaleY * 0.8;

    // Layer 3 — Tiền cảnh: scale lớn → gần, sáng, nhanh nhất
    this._layerNear = this.add.tileSprite(
      width / 2, height / 2, width, height, 'map-snow',
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
