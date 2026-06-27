/**
 * PlayScene.js — Scene gameplay chính
 *
 * Hỗ trợ 3 màn chơi (level 1-3) với map và độ khó khác nhau.
 * Nhận level qua this.scene.start('PlayScene', { level: 2 }).
 *
 * Tích hợp:
 *   • DifficultySystem — tăng scrollSpeed, giảm spawnInterval, tăng density
 *   • Boost — trạng thái tăng tốc tạm thời, refresh khi nhặt thêm
 *   • Coin — thu thập xu, hiển thị trong HUD
 */

import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../entities/Player.js';
import { Tree } from '../entities/Tree.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { DifficultySystem } from '../systems/DifficultySystem.js';

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

// ── Cấu hình Boost ──
const BOOST_DURATION = 5000;   // ms — thời lượng tăng tốc
const BOOST_MULTIPLIER = 1.5;  // hệ số nhân tốc độ khi boost

// ── Cấu hình Stagger (va chạm ngã) ──
const STAGGER_DURATION = 1200;    // ms — thời gian ngã + đứng dậy
const STAGGER_SLOW_FACTOR = 0.08; // hệ số slow-motion khi ngã

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
    this._lives = 3;
    this._invincible = false;
    this._invincibleTimer = 0;

    // ── Stagger state (va chạm → ngã → đứng dậy) ──
    this._staggered = false;
    this._staggerTimer = 0;
    this._savedScrollSpeed = 0;

    // ── Boost state ──
    this._boosted = false;
    this._boostTimer = 0;

    // ── Biến scrollSpeed dùng chung ──
    this.scrollSpeed = cfg.scrollSpeed;

    // ── Terrain ──
    this._mapKey = cfg.mapKey;
    this._createTerrain();

    // ── InputSystem ──
    this._input = new InputSystem(this);

    // ── Player ──
    this._player = new Player(this, width / 2, height * 0.75);
    this._player.sprite.setDepth(10);

    // ── SpawnSystem (object pools: Tree + Rock + Coin + Boost) ──
    this._spawnSystem = new SpawnSystem(this, {
      scrollSpeed: this.scrollSpeed,
      treePoolSize: cfg.treePoolSize,
      rockPoolSize: cfg.rockPoolSize,
      spawnInterval: cfg.spawnInterval,
      minGapX: cfg.minGapX,
      playerSafeZone: cfg.playerSafeZone,
      coinPoolSize: 10,
      boostPoolSize: 5,
      coinSpawnInterval: 800,
      boostSpawnInterval: 4000,
      obstacleDensity: 1,
    });

    // ── CollisionSystem ──
    this._collisionSystem = new CollisionSystem();

    // ── ScoreSystem (điểm + best score + coin count) ──
    this._scoreSystem = new ScoreSystem();

    // ── DifficultySystem (tăng độ khó theo quãng đường) ──
    this._difficultySystem = new DifficultySystem({
      baseScrollSpeed: cfg.scrollSpeed,
      baseSpawnInterval: cfg.spawnInterval,
    });

    // ── Text hiển thị xu (HUD trong PlayScene) ──
    this._coinText = this.add.text(width - 20, 56, 'XU: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(100);

    // ── Text indicator Boost (ẩn, chỉ hiện khi đang tăng tốc) ──
    this._boostText = this.add.text(width / 2, 80, 'TĂNG TỐC', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    // ── Launch UI scene ──
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene', { level: this._level });
    }

    // ── Gửi trạng thái ban đầu cho UI ──
    this.time.delayedCall(0, () => {
      this.game.events.emit('livesUpdate', this._lives);
      this.game.events.emit('scoreUpdate', this._scoreSystem.getScore());
    });
  }

  update(_time, delta) {
    if (this._isDead) return;

    // ── Trạng thái STAGGER: xử lý riêng (ngã + slow-motion) ──
    if (this._staggered) {
      this._updateStagger(delta);
      return;
    }

    // 0. Cập nhật trạng thái bất tử
    this._updateInvincibility(delta);

    // 1. Tính độ khó dựa trên quãng đường hiện tại
    const diff = this._difficultySystem.update(this._scoreSystem.getScore());

    // 2. Cập nhật boost timer
    this._updateBoost(delta);

    // 3. Tính scrollSpeed hiệu dụng (có nhân boost nếu đang active)
    const effectiveSpeed = this._boosted
      ? diff.scrollSpeed * BOOST_MULTIPLIER
      : diff.scrollSpeed;
    this.scrollSpeed = effectiveSpeed;

    // 4. Đồng bộ tham số xuống SpawnSystem
    this._spawnSystem.scrollSpeed = effectiveSpeed;
    this._spawnSystem.spawnInterval = diff.spawnInterval;
    this._spawnSystem.obstacleDensity = diff.obstacleDensity;

    // 5. Đọc input
    this._input.update();

    // 6. Cập nhật player
    const inputState = this._input.getState();
    this._player.update(delta, inputState);

    // 7. Cuộn nền tuyết
    this._updateTerrain(delta);

    // 8. Cập nhật SpawnSystem (spawn / di chuyển / recycle)
    const { x: playerX } = this._player.getPosition();
    this._spawnSystem.update(delta, playerX);

    // 9. Kiểm tra va chạm obstacle (chỉ khi không staggered và không bất tử)
    if (!this._staggered && !this._invincible) {
      const { obstacle } = this._collisionSystem.check(
        this._player,
        this._spawnSystem._active,
      );
      if (obstacle) {
        const isFatal = this._lives <= 1;
        this._handleHit();
        if (obstacle instanceof Tree) {
          if (isFatal) {
            obstacle.forceBroken();
          } else {
            obstacle.onHit();
          }
        }
      }
    }

    // 10. Kiểm tra va chạm collectibles (luôn luôn, kể cả khi bất tử)
    const { coin, boost } = this._collisionSystem.checkCollectibles(
      this._player,
      this._spawnSystem._activeCoins,
      this._spawnSystem._activeBoosts,
    );

    if (coin) {
      coin.recycle();
      // Xoá khỏi activeCoins
      const idx = this._spawnSystem._activeCoins.indexOf(coin);
      if (idx !== -1) this._spawnSystem._activeCoins.splice(idx, 1);
      this._scoreSystem.addCoin();
    }

    if (boost) {
      boost.trigger();           // play glow animation — KHÔNG recycle
      this._activateBoost();     // kích hoạt hiệu ứng tăng tốc
    }

    // 11. Cập nhật điểm
    this._scoreSystem.update(effectiveSpeed, delta);

    // 12. Gửi điểm về UI
    this.game.events.emit('scoreUpdate', this._scoreSystem.getScore());

    // 13. Cập nhật text xu
    this._coinText.setText(`XU: ${this._scoreSystem.getCoinCount()}`);
  }

  // ══════════════════════════════════════════════
  //  BOOST
  // ══════════════════════════════════════════════

  /**
   * Kích hoạt trạng thái tăng tốc.
   * Nếu đang trong boost → refresh thời gian.
   */
  _activateBoost() {
    this._boosted = true;
    this._boostTimer = BOOST_DURATION;
    this._boostText.setVisible(true);

    // Đổi tint Player sang xanh nhẹ để nhận biết
    this._player.sprite.setTint(0xaaffaa);
  }

  /**
   * Cập nhật boost timer mỗi frame.
   * Hết thời gian → tắt boost.
   * @param {number} delta — ms
   */
  _updateBoost(delta) {
    if (!this._boosted) return;

    this._boostTimer -= delta;
    if (this._boostTimer <= 0) {
      this._boosted = false;
      this._boostTimer = 0;
      this._boostText.setVisible(false);
      this._player.sprite.clearTint();
    }
  }

  // ══════════════════════════════════════════════
  //  INVINCIBILITY
  // ══════════════════════════════════════════════

  _updateInvincibility(delta) {
    if (!this._invincible) return;

    this._invincibleTimer -= delta;
    if (this._invincibleTimer <= 0) {
      this._invincible = false;
      this._player.sprite.setAlpha(1);
      return;
    }

    const blink = Math.floor(this._invincibleTimer / 100) % 2 === 0;
    this._player.sprite.setAlpha(blink ? 0.3 : 1);
  }

  _handleHit() {
    this._lives--;
    this.game.events.emit('livesUpdate', this._lives);
    this.game.events.emit('scoreUpdate', this._scoreSystem.getScore());

    if (this._lives <= 0) {
      this._handleDeath();
    } else {
      // Vào stagger (ngã + slow-motion) thay vì invincible ngay
      this._enterStagger();
    }
  }

  _enterInvincible() {
    this._invincible = true;
    this._invincibleTimer = 2000;

    const { width, height } = this.scale;
    this._player.respawn(width / 2, height * 0.75);
  }

  // ══════════════════════════════════════════════
  //  STAGGER — va chạm → ngã → slow-motion → đứng dậy
  // ══════════════════════════════════════════════

  /**
   * Bắt đầu trạng thái ngã: game chậm lại, player play anim va chạm.
   */
  _enterStagger() {
    this._staggered = true;
    this._staggerTimer = STAGGER_DURATION;
    this._savedScrollSpeed = this.scrollSpeed;

    // ── Slow-motion: game chỉ còn 8% tốc độ ──
    this.scrollSpeed *= STAGGER_SLOW_FACTOR;
    this._spawnSystem.scrollSpeed = this.scrollSpeed;
    this._spawnSystem.pauseSpawning = true;

    // ── Freeze player tại chỗ, play animation va chạm ──
    this._player.velocityX = 0;
    this._player.sprite.play('player-collision');

    // ── Rung nhẹ camera để tăng cảm giác va chạm ──
    this.cameras.main.shake(180, 0.008);
  }

  /**
   * Cập nhật mỗi frame khi đang stagger.
   * Nền + vật cản vẫn di chuyển nhưng rất chậm.
   * @param {number} delta — ms
   */
  _updateStagger(delta) {
    this._staggerTimer -= delta;

    // Cuộn nền chậm
    this._updateTerrain(delta);

    // Di chuyển vật cản + collectibles chậm (spawning đã pause)
    const { x: playerX } = this._player.getPosition();
    this._spawnSystem.update(delta, playerX);

    // Hết thời gian ngã → đứng dậy
    if (this._staggerTimer <= 0) {
      this._exitStagger();
    }
  }

  /**
   * Kết thúc stagger: hồi phục tốc độ → respawn → invincible.
   * _enterInvincible() đã xử lý respawn player về giữa màn hình.
   */
  _exitStagger() {
    this._staggered = false;
    this._staggerTimer = 0;

    // ── Khôi phục tốc độ game ──
    this.scrollSpeed = this._savedScrollSpeed;
    this._spawnSystem.scrollSpeed = this._savedScrollSpeed;
    this._spawnSystem.pauseSpawning = false;

    // ── Vào trạng thái bất tử (respawn về giữa + nhấp nháy) ──
    this._enterInvincible();
  }

  _handleDeath() {
    this._isDead = true;
    this._invincible = false;
    this._player.sprite.setAlpha(1);
    this._player.velocityX = 0;

    // Tắt boost nếu đang có
    this._boosted = false;
    this._boostText.setVisible(false);
    this._player.sprite.clearTint();

    this._player.sprite.play('player-collision');

    this._player.sprite.once('animationcomplete', () => {
      this.time.delayedCall(1500, () => {
        this._scoreSystem.saveBestScore();
        this.scene.start('GameOverScene', {
          score: this._scoreSystem.getScore(),
          coins: this._scoreSystem.getCoinCount(),
          bestScore: this._scoreSystem.getBestScore(),
          level: this._level,
        });
      });
    });
  }

  // ══════════════════════════════════════════════
  //  TERRAIN
  // ══════════════════════════════════════════════

  _createTerrain() {
    const { width, height } = this.scale;

    const tex = this.textures.get(this._mapKey);
    const src = tex.getSourceImage();
    const imgW = src.width;
    const imgH = src.height;

    this._tileScaleX = width / imgW;
    this._tileScaleY = this._tileScaleX;

    this._layerFar = this.add.tileSprite(
      width / 2, height / 2, width, height, this._mapKey,
    );
    this._layerFar.setDepth(-3);
    this._layerFar.setTint(0x8899bb);
    this._layerFar.tileScaleX = this._tileScaleX * 0.6;
    this._layerFar.tileScaleY = this._tileScaleY * 0.6;

    this._layerMid = this.add.tileSprite(
      width / 2, height / 2, width, height, this._mapKey,
    );
    this._layerMid.setDepth(-2);
    this._layerMid.tileScaleX = this._tileScaleX * 0.8;
    this._layerMid.tileScaleY = this._tileScaleY * 0.8;

    this._layerNear = this.add.tileSprite(
      width / 2, height / 2, width, height, this._mapKey,
    );
    this._layerNear.setDepth(-1);
    this._layerNear.setTint(0xffffff);
    this._layerNear.tileScaleX = this._tileScaleX;
    this._layerNear.tileScaleY = this._tileScaleY;

    this._scrollY = 0;
  }

  _updateTerrain(delta) {
    const dt = delta / 1000;
    this._scrollY += this.scrollSpeed * dt;

    this._layerFar.tilePositionY = -(this._scrollY * 0.2) / this._layerFar.tileScaleY;
    this._layerMid.tilePositionY = -(this._scrollY * 0.5) / this._layerMid.tileScaleY;
    this._layerNear.tilePositionY = -(this._scrollY * 1.0) / this._layerNear.tileScaleY;
  }

  // ══════════════════════════════════════════════

  shutdown() {
    this._input.destroy();
    this._player.destroy();
    this._spawnSystem.destroy();

    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
  }
}
