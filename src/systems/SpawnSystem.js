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
import { Coin } from '../entities/Coin.js';
import { Boost } from '../entities/Boost.js';

export class SpawnSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {object}  config
   * @param {number}  config.scrollSpeed      — vận tốc cuộn (px/s), mặc định 300
   * @param {number}  config.treePoolSize     — số Tree trong pool
   * @param {number}  config.rockPoolSize     — số Rock trong pool
   * @param {number}  config.spawnInterval    — ms giữa 2 lần spawn
   * @param {number}  config.minGapX          — khoảng cách X tối thiểu giữa vật cản
   * @param {number}  config.playerSafeZone   — bán kính an toàn quanh Player (px)
   * @param {number}  config.coinPoolSize     — số Coin trong pool (mặc định 10)
   * @param {number}  config.boostPoolSize    — số Boost trong pool (mặc định 5)
   * @param {number}  config.coinSpawnInterval— ms giữa 2 lần spawn Coin (mặc định 800)
   * @param {number}  config.boostSpawnInterval— ms giữa 2 lần spawn Boost (mặc định 4000)
   * @param {number}  config.obstacleDensity  — số vật cản mỗi lần spawn (mặc định 1)
   */
  constructor(scene, config = {}) {
    this.scene = scene;

    // ── Scroll speed (biến có thể thay đổi từ PlayScene) ──
    this.scrollSpeed = config.scrollSpeed ?? 300;

    // ── Spawn timing ──
    this.spawnInterval = config.spawnInterval ?? 1200;
    this._spawnTimer = 0;

    // ── Mật độ vật cản (có thể thay đổi từ PlayScene) ──
    this.obstacleDensity = config.obstacleDensity ?? 1;

    // ── Pause spawning (dùng khi stagger để ngừng spawn) ──
    this.pauseSpawning = false;

    // ── Khoảng cách & vùng an toàn ──
    this.minGapX = config.minGapX ?? 80;
    this.playerSafeZone = config.playerSafeZone ?? 70;

    // ── Pool vật cản (Tree + Rock) — pre-allocated ──
    const treeCount = config.treePoolSize ?? 6;
    const rockCount = config.rockPoolSize ?? 6;

    this._treePool = [];
    this._rockPool = [];
    this._active = []; // references obstacles đang hiển thị

    for (let i = 0; i < treeCount; i++) {
      this._treePool.push(new Tree(scene));
    }
    for (let i = 0; i < rockCount; i++) {
      this._rockPool.push(new Rock(scene));
    }

    // ── Pool collectibles (Coin + Boost) — pre-allocated ──
    const coinCount = config.coinPoolSize ?? 10;
    const boostCount = config.boostPoolSize ?? 5;

    this._coinPool = [];
    this._boostPool = [];
    this._activeCoins = [];
    this._activeBoosts = [];

    for (let i = 0; i < coinCount; i++) {
      this._coinPool.push(new Coin(scene));
    }
    for (let i = 0; i < boostCount; i++) {
      this._boostPool.push(new Boost(scene));
    }

    // ── Spawn timer cho collectibles ──
    this._coinSpawnInterval = config.coinSpawnInterval ?? 800;
    this._boostSpawnInterval = config.boostSpawnInterval ?? 4000;
    this._coinSpawnTimer = 0;
    this._boostSpawnTimer = 0;
  }

  /**
   * Gọi mỗi frame từ PlayScene.update()
   *
   * @param {number} delta    — ms kể từ frame trước
   * @param {number} playerX  — vị trí X hiện tại của Player
   */
  update(delta, playerX) {
    const dt = delta / 1000;

    // ── 1. Di chuyển obstacles ──
    for (const obj of this._active) {
      obj.update(delta, this.scrollSpeed);
    }

    // ── 2. Di chuyển collectibles ──
    for (const coin of this._activeCoins) {
      coin.update(delta, this.scrollSpeed);
    }
    for (const boost of this._activeBoosts) {
      boost.update(delta, this.scrollSpeed);
    }

    // ── 3. Recycle obstacles ra khỏi màn hình ──
    const bottomLimit = this.scene.scale.height + 60;
    for (let i = this._active.length - 1; i >= 0; i--) {
      if (this._active[i].container.y > bottomLimit) {
        this._active[i].recycle();
        this._active.splice(i, 1);
      }
    }

    // ── 4. Recycle collectibles ra khỏi màn hình ──
    for (let i = this._activeCoins.length - 1; i >= 0; i--) {
      if (this._activeCoins[i].container.y > bottomLimit) {
        this._activeCoins[i].recycle();
        this._activeCoins.splice(i, 1);
      }
    }
    for (let i = this._activeBoosts.length - 1; i >= 0; i--) {
      if (this._activeBoosts[i].container.y > bottomLimit) {
        this._activeBoosts[i].recycle();
        this._activeBoosts.splice(i, 1);
      }
    }

    // ── 5. Spawn obstacles theo timer + density (pause khi stagger) ──
    if (!this.pauseSpawning) {
      this._spawnTimer += delta;
      if (this._spawnTimer >= this.spawnInterval) {
        this._spawnTimer -= this.spawnInterval;
        const spawnCount = this._getSpawnCount();
        for (let i = 0; i < spawnCount; i++) {
          this._spawnObstacle(playerX);
        }
      }
    }

    // ── 6. Spawn Coins theo timer (pause khi stagger) ──
    if (!this.pauseSpawning) {
      this._coinSpawnTimer += delta;
      if (this._coinSpawnTimer >= this._coinSpawnInterval) {
        this._coinSpawnTimer -= this._coinSpawnInterval;
        this._spawnCoin(playerX);
      }
    }

    // ── 7. Spawn Boosts theo timer (pause khi stagger) ──
    if (!this.pauseSpawning) {
      this._boostSpawnTimer += delta;
      if (this._boostSpawnTimer >= this._boostSpawnInterval) {
        this._boostSpawnTimer -= this._boostSpawnInterval;
        this._spawnBoost(playerX);
      }
    }
  }

  // ──────────────────────────────────────────────────
  //  PRIVATE — Obstacles
  // ──────────────────────────────────────────────────

  /**
   * Xác định số lượng vật cản sẽ spawn dựa trên obstacleDensity
   * @returns {number}
   */
  _getSpawnCount() {
    const base = Math.floor(this.obstacleDensity);
    const frac = this.obstacleDensity - base;
    return base + (Math.random() < frac ? 1 : 0);
  }

  /**
   * Spawn vật cản ngẫu nhiên từ pool (Tree / Rock)
   * @param {number} playerX
   */
  _spawnObstacle(playerX) {
    const { width } = this.scene.scale;
    const margin = 50;

    const useTree = Math.random() < 0.5;
    const pool = useTree ? this._treePool : this._rockPool;

    const obj = pool.find(o => !o.active);
    if (!obj) return;

    const x = this._findValidX(width, margin, playerX);
    if (x === null) return;

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

      if (Math.abs(x - playerX) < this.playerSafeZone) continue;

      let overlap = false;
      for (const active of this._active) {
        if (Math.abs(active.container.x - x) < this.minGapX) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;

      return x;
    }

    return null;
  }

  // ──────────────────────────────────────────────────
  //  PRIVATE — Collectibles (Coin / Boost)
  // ──────────────────────────────────────────────────

  /**
   * Spawn 1 Coin từ pool
   * @param {number} playerX
   */
  _spawnCoin(playerX) {
    const coin = this._coinPool.find(c => !c.active);
    if (!coin) return;

    const x = this._findCollectibleX(playerX);
    if (x === null) return;

    coin.spawn(x, -40);
    this._activeCoins.push(coin);
  }

  /**
   * Spawn 1 Boost-pad từ pool
   * Boost-pad là ground pad — spawn ở trung tâm màn hình,
   * dễ với tới, không spawn ở rìa.
   * @param {number} playerX
   */
  _spawnBoost(playerX) {
    const boost = this._boostPool.find(b => !b.active);
    if (!boost) return;

    const x = this._findBoostX(playerX);
    if (x === null) return;

    boost.spawn(x, -40);
    this._activeBoosts.push(boost);
  }

  /**
   * Tìm vị trí X đẹp cho boost-pad — trung tâm màn hình,
   * né obstacle nhưng gần player để dễ ăn.
   * @returns {number|null}
   */
  _findBoostX(playerX) {
    const { width } = this.scene.scale;
    const margin = 80;                    // né rìa
    const center = width / 2;
    const range = width * 0.25;           // chỉ spawn trong 50% màn hình (trung tâm)
    const minX = center - range;
    const maxX = center + range;
    const maxAttempts = 10;

    for (let i = 0; i < maxAttempts; i++) {
      const x = minX + Math.random() * (maxX - minX);

      // Né obstacle — boost-pad không chồng lên vật cản
      let overlap = false;
      for (const obs of this._active) {
        if (Math.abs(obs.container.x - x) < this.minGapX * 0.6) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;

      return x;
    }

    // fallback: ngay giữa màn hình
    return center;
  }

  /**
   * Tìm vị trí X hợp lệ cho collectible (gần Player hơn, ít cấm địa hơn obstacle)
   * @returns {number|null}
   */
  _findCollectibleX(playerX) {
    const { width } = this.scene.scale;
    const margin = 40;
    const minX = margin;
    const maxX = width - margin;
    const maxAttempts = 10;

    for (let i = 0; i < maxAttempts; i++) {
      const x = minX + Math.random() * (maxX - minX);

      // Vùng an toàn quanh Player (rộng hơn một chút để tránh spawn ngay trên đầu)
      if (Math.abs(x - playerX) < this.playerSafeZone * 0.5) continue;

      // Kiểm tra chồng lấn với obstacles (không check collectibles khác)
      let overlap = false;
      for (const obs of this._active) {
        if (Math.abs(obs.container.x - x) < this.minGapX * 0.6) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;

      return x;
    }

    return null;
  }

  /** Dọn dẹp khi scene stop */
  destroy() {
    for (const t of this._treePool) t.destroy();
    for (const r of this._rockPool) r.destroy();
    for (const c of this._coinPool) c.destroy();
    for (const b of this._boostPool) b.destroy();
    this._active.length = 0;
    this._activeCoins.length = 0;
    this._activeBoosts.length = 0;
  }
}
