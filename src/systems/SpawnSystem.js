/**
 * SpawnSystem.js — Quản lý object pool Tree & Rock
 *
 * Chịu trách nhiệm:
 *   • Tạo pool cố định (pre-allocated) — KHÔNG tạo object mới khi chơi
 *   • Spawn vật cản phía trên màn hình
 *   • Cập nhật vị trí (cuộn xuống)
 *   • Recycle khi ra khỏi màn hình + tái sử dụng
 *   • Đảm bảo không chồng lấn, không spawn trên vị trí Player
 */

import { Tree } from '../entities/Tree.js';
import { Rock } from '../entities/Rock.js';

export class SpawnSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {object}  config
   * @param {number}  config.scrollSpeed   — vận tốc cuộn (px/s), mặc định 300
   * @param {number}  config.treePoolSize  — số Tree trong pool
   * @param {number}  config.rockPoolSize  — số Rock trong pool
   * @param {number}  config.spawnInterval — ms giữa 2 lần spawn
   * @param {number}  config.minGapX       — khoảng cách X tối thiểu giữa vật cản
   * @param {number}  config.playerSafeZone— bán kính an toàn quanh Player (px)
   */
  constructor(scene, config = {}) {
    this.scene = scene;

    // ── Scroll speed (biến có thể thay đổi từ PlayScene) ──
    this.scrollSpeed = config.scrollSpeed ?? 300;

    // ── Spawn timing ──
    this.spawnInterval = config.spawnInterval ?? 1200;
    this._spawnTimer = 0;

    // ── Khoảng cách & vùng an toàn ──
    this.minGapX = config.minGapX ?? 80;
    this.playerSafeZone = config.playerSafeZone ?? 70;

    // ── Pool cố định (pre-allocated) ──
    const treeCount = config.treePoolSize ?? 6;
    const rockCount = config.rockPoolSize ?? 6;

    this._treePool = [];
    this._rockPool = [];
    this._active = []; // references objects đang hiển thị

    for (let i = 0; i < treeCount; i++) {
      this._treePool.push(new Tree(scene));
    }
    for (let i = 0; i < rockCount; i++) {
      this._rockPool.push(new Rock(scene));
    }
  }

  /**
   * Gọi mỗi frame từ PlayScene.update()
   *
   * @param {number} delta    — ms kể từ frame trước
   * @param {number} playerX  — vị trí X hiện tại của Player
   */
  update(delta, playerX) {
    const dt = delta / 1000;

    // ── 1. Di chuyển tất cả active objects ──
    for (const obj of this._active) {
      obj.update(delta, this.scrollSpeed);
    }

    // ── 2. Recycle objects ra khỏi màn hình ──
    const bottomLimit = this.scene.scale.height + 60;
    for (let i = this._active.length - 1; i >= 0; i--) {
      if (this._active[i].container.y > bottomLimit) {
        this._active[i].recycle();
        this._active.splice(i, 1);
      }
    }

    // ── 3. Spawn mới theo timer ──
    this._spawnTimer += delta;
    if (this._spawnTimer >= this.spawnInterval) {
      this._spawnTimer -= this.spawnInterval;
      this._spawn(playerX);
    }
  }

  // ──────────────────────────────────────────────────
  //  PRIVATE
  // ──────────────────────────────────────────────────

  /**
   * Spawn 1 vật cản ngẫu nhiên từ pool
   * @param {number} playerX
   */
  _spawn(playerX) {
    const { width } = this.scene.scale;
    const margin = 50; // biên an toàn 2 bên

    // ── Random loại: Tree hoặc Rock ──
    const useTree = Math.random() < 0.5;
    const pool = useTree ? this._treePool : this._rockPool;

    // ── Tìm 1 object đang inactive trong pool ──
    const obj = pool.find(o => !o.active);
    if (!obj) return; // pool cạn → skip, KHÔNG tạo mới

    // ── Random X hợp lệ (không chồng lấn, không trên Player) ──
    const x = this._findValidX(width, margin, playerX);
    if (x === null) return; // không tìm được vị trí hợp lệ

    // ── Spawn phía trên màn hình ──
    obj.spawn(x, -40);
    this._active.push(obj);
  }

  /**
   * Tìm vị trí X hợp lệ, thử tối đa maxAttempts lần
   * @returns {number|null}
   */
  _findValidX(gameWidth, margin, playerX) {
    const maxAttempts = 15;
    const minX = margin;
    const maxX = gameWidth - margin;

    for (let i = 0; i < maxAttempts; i++) {
      const x = minX + Math.random() * (maxX - minX);

      // Kiểm tra khoảng cách với Player
      if (Math.abs(x - playerX) < this.playerSafeZone) continue;

      // Kiểm tra chồng lấn với active objects
      let overlap = false;
      for (const active of this._active) {
        if (Math.abs(active.container.x - x) < this.minGapX) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;

      return x; // hợp lệ
    }

    return null; // hết lượt thử
  }

  /** Dọn dẹp khi scene stop */
  destroy() {
    for (const t of this._treePool) t.destroy();
    for (const r of this._rockPool) r.destroy();
    this._active.length = 0;
  }
}
