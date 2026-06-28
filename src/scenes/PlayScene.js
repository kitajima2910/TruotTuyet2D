/**
 * PlayScene.js — Scene gameplay chính
 *
 * Hỗ trợ 3 màn chơi (level 1-3) với map và độ khó khác nhau.
 *
 * Tích hợp:
 *   • DifficultySystem — tăng scrollSpeed, giảm spawnInterval, tăng density
 *   • Boost — trạng thái tăng tốc tạm thời, refresh khi nhặt thêm
 *   • Coin — thu thập xu
 *   • Visual Effects — snow particles, player trail, coin sparkle, boost glow,
 *     camera shake, hit flash, game over flash
 *   • AudioManager — BGM + SFX procedural
 *   • Pause/Resume
 *   • UI events — cập nhật HUD real-time
 */

import { InputSystem } from '../systems/InputSystem.js';
import { Player } from '../entities/Player.js';
import { Tree } from '../entities/Tree.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { DifficultySystem } from '../systems/DifficultySystem.js';
import { AudioManager } from '../managers/AudioManager.js';
import { AssetManager } from '../managers/AssetManager.js';
import { MissionSystem } from '../systems/MissionSystem.js';

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
const BOOST_DURATION = 5000;   // ms
const BOOST_MULTIPLIER = 1.5;

// ── Cấu hình Stagger ──
const STAGGER_DURATION = 1200;
const STAGGER_SLOW_FACTOR = 0.08;

// ── Cấu hình Jump ──
const JUMP_SLOW_FACTOR = 0.65;

// ── Giới hạn particle ──
const MAX_SNOW_PARTICLES = 40;

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

  /* ══════════════════════════════════════════════
     CREATE
     ══════════════════════════════════════════════ */

  create() {
    const { width, height } = this.scale;
    const cfg = LEVEL_CONFIG[this._level];

    // ── Trạng thái game ──
    this._isDead = false;
    this._paused = false;
    this._lives = 3;
    this._invincible = false;
    this._invincibleTimer = 0;

    // ── Mission tracking ──
    this._survivalTime = 0;
    // Khởi tạo MissionSystem nếu chưa có (lần đầu vào game)
    let ms = MissionSystem.get(this.game.registry);
    if (!ms) {
      ms = new MissionSystem();
      ms.setRegistry(this.game.registry);
      MissionSystem.register(this.game.registry, ms);
    }
    ms.loadMissions(this._level);
    this._missionSystem = ms;

    // ── Stagger state ──
    this._staggered = false;
    this._staggerTimer = 0;
    this._savedScrollSpeed = 0;

    // ── Boost state ──
    this._boosted = false;
    this._boostTimer = 0;

    // ── Scroll speed ──
    this.scrollSpeed = cfg.scrollSpeed;

    // ── Terrain ──
    this._mapKey = cfg.mapKey;
    this._createTerrain();

    // ── Particle textures ──
    AssetManager.createParticleTextures(this);

    // ── Snow particles ──
    this._createSnowParticles();

    // ── Trail particles (khởi tạo, emit sau khi player di chuyển) ──
    this._trailEmitter = this.add.particles(0, 0, 'particle-trail', {
      follow: undefined,
      frequency: 40,
      lifespan: 300,
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.5, end: 0 },
      speed: { min: 5, max: 20 },
      angle: { min: 80, max: 100 },
      blendMode: 'ADD',
      emitting: false,
    });
    this._trailEmitter.setDepth(5);

    // ── Boost glow particles (khởi tạo tắt) ──
    this._boostGlow = this.add.particles(0, 0, 'particle-glow', {
      follow: undefined,
      frequency: 60,
      lifespan: 500,
      scale: { start: 0.8, end: 0.2 },
      alpha: { start: 0.6, end: 0 },
      speed: { min: 10, max: 40 },
      angle: { min: 0, max: 360 },
      blendMode: 'ADD',
      emitting: false,
    });
    this._boostGlow.setDepth(9);

    // ── InputSystem ──
    this._input = new InputSystem(this);

    // ── Player ──
    this._player = new Player(this, width / 2, height * 0.75);
    this._player.sprite.setDepth(10);

    // ── SpawnSystem ──
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

    // ── ScoreSystem ──
    this._scoreSystem = new ScoreSystem();

    // ── DifficultySystem ──
    this._difficultySystem = new DifficultySystem({
      baseScrollSpeed: cfg.scrollSpeed,
      baseSpawnInterval: cfg.spawnInterval,
    });

    // ── Audio (BGM theo level) ──
    AudioManager.init(this);
    const audio = AudioManager.get(this.game.registry);
    const bgmKey = ['bgm', 'bgm-level2', 'bgm-level3'][this._level - 1];
    audio.playBGM(bgmKey);
    audio.playSFX('sfx-click');

    // ── Flash overlays ──
    this._hitFlash = this.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0)
      .setDepth(150).setVisible(false);

    this._deathFlash = this.add.rectangle(width / 2, height / 2, width, height, 0x440000, 0)
      .setDepth(150).setVisible(false);

    // ── Game over overlay ──
    this._gameOverOverlay = this.add.container(0, 0).setDepth(160).setVisible(false);
    const goBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this._gameOverOverlay.add(goBg);
    this._gameOverBg = goBg;

    // ── Launch UIScene ──
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene', { level: this._level });
    }

    // ── Gửi trạng thái ban đầu cho UI ──
    this.time.delayedCall(0, () => {
      this.game.events.emit('scoreUpdate', this._scoreSystem.getScore());
      this.game.events.emit('livesUpdate', this._lives);
      this.game.events.emit('coinUpdate', this._scoreSystem.getCoinCount());
      this.game.events.emit('bestScoreUpdate', this._scoreSystem.getBestScore());
      this.game.events.emit('boostUpdate', null);
    });
  }

  /**
   * Gửi mission progress và completion events cho MissionLogDisplay.
   * @param {Array} changes — từ MissionSystem.updateProgress()
   */
  _emitMissionChanges(changes) {
    if (!changes || changes.length === 0) return;
    for (const c of changes) {
      if (c.justCompleted) {
        const def = MissionSystem.MISSION_DEFS.find(d => d.id === c.id);
        const reward = def ? def.reward : 0;
        this.game.events.emit('missionComplete', c.name, reward);
      } else {
        this.game.events.emit('missionProgress', c.name, c.progress, c.target);
      }
    }
  }

  /* ══════════════════════════════════════════════
     UPDATE
     ══════════════════════════════════════════════ */

  update(_time, delta) {
    // ── Pause: không update gì cả ──
    if (this._paused) return;

    if (this._isDead) return;

    // ── Stagger ──
    if (this._staggered) {
      this._updateStagger(delta);
      return;
    }

    // 0. Bất tử
    this._updateInvincibility(delta);

    // 1. Độ khó
    const diff = this._difficultySystem.update(this._scoreSystem.getScore());

    // 2. Boost
    this._updateBoost(delta);

    // 3. Scroll speed hiệu dụng
    let effectiveSpeed = this._boosted
      ? diff.scrollSpeed * BOOST_MULTIPLIER
      : diff.scrollSpeed;

    // Jump slow-down: chậm lại khi đang bay lên
    if (this._player.isJumping()) {
      effectiveSpeed *= JUMP_SLOW_FACTOR;
    }

    this.scrollSpeed = effectiveSpeed;

    // 4. Đồng bộ SpawnSystem
    this._spawnSystem.scrollSpeed = effectiveSpeed;
    this._spawnSystem.spawnInterval = diff.spawnInterval;
    this._spawnSystem.obstacleDensity = diff.obstacleDensity;

    // 5. Input
    this._input.update();

    // 6. Player
    const inputState = this._input.getState();

    // Jump: xử lý trước player.update() để jump áp dụng trong frame này
    if (inputState.jump && !this._staggered && !this._isDead) {
      const didJump = this._player.jump();
      if (didJump) {
        AudioManager.get(this.game.registry)?.playSFX('sfx-jump');
      }
    }

    this._player.update(delta, inputState);

    // ── Trail: emit khi player di chuyển ngang ──
    const isMoving = Math.abs(this._player.velocityX) > 10;
    if (isMoving && !this._trailEmitter.emitting) {
      this._trailEmitter.start();
      this._trailEmitter.setPosition(this._player.sprite.x, this._player.sprite.y + 20);
    } else if (!isMoving && this._trailEmitter.emitting) {
      this._trailEmitter.stop();
    }
    if (isMoving) {
      this._trailEmitter.setPosition(this._player.sprite.x, this._player.sprite.y + 20);
    }

    // 7. Terrain
    this._updateTerrain(delta);

    // 8. SpawnSystem
    const { x: playerX } = this._player.getPosition();
    this._spawnSystem.update(delta, playerX);

    // 9. Collision obstacles
    if (!this._invincible) {
      const { obstacle } = this._collisionSystem.check(
        this._player,
        this._spawnSystem._active,
      );
      if (obstacle) {
        const isFatal = this._lives <= 1;
        this._handleHit();
        if (obstacle instanceof Tree) {
          if (isFatal) obstacle.forceBroken();
          else obstacle.onHit();
        }
      }
    }

    // 10. Collectibles (bỏ qua khi đang nhảy — bay trên không không nhặt được)
    let coin = null, boost = null;
    if (!this._player.isJumping()) {
      const result = this._collisionSystem.checkCollectibles(
        this._player,
        this._spawnSystem._activeCoins,
        this._spawnSystem._activeBoosts,
      );
      coin = result.coin;
      boost = result.boost;
    }

    if (coin) {
      const cx = coin.container.x;
      const cy = coin.container.y;
      coin.recycle();
      const idx = this._spawnSystem._activeCoins.indexOf(coin);
      if (idx !== -1) this._spawnSystem._activeCoins.splice(idx, 1);
      this._scoreSystem.addCoin();
      // Mission: COIN_COLLECTED
      const coinChanges = this._missionSystem?.updateProgress('COIN_COLLECTED', 1);
      this._emitMissionChanges(coinChanges);
      this.game.events.emit('coinUpdate', this._scoreSystem.getCoinCount());

      // SFX + sparkle
      AudioManager.get(this.game.registry)?.playSFX('sfx-coin');
      this._coinSparkle(cx, cy);
    }

    if (boost) {
      boost.trigger();
      this._activateBoost();
      this._scoreSystem.addBoostUsed();
      // Lấy kết quả thay đổi từ BOOST_USED để gửi toast
      const changes = this._missionSystem?.updateProgress('BOOST_USED', 1);
      this._emitMissionChanges(changes);
      AudioManager.get(this.game.registry)?.playSFX('sfx-boost');
    }

    // 11. Score
    this._scoreSystem.update(effectiveSpeed, delta);

    // 11a. Mission: DISTANCE_CHANGED (khi floor score tăng)
    const dist = this._scoreSystem.checkDistanceChange();
    if (dist.changed) {
      const distChanges = this._missionSystem?.updateProgress('DISTANCE_CHANGED', dist.floor);
      this._emitMissionChanges(distChanges);
    }

    // 12. Mission: TIME_SURVIVED (cập nhật mỗi frame)
    this._survivalTime += delta / 1000;
    const timeChanges = this._missionSystem?.updateProgress('TIME_SURVIVED', Math.floor(this._survivalTime));
    this._emitMissionChanges(timeChanges);

    // 13. Emit UI events
    this.game.events.emit('scoreUpdate', this._scoreSystem.getScore());
    this.game.events.emit('bestScoreUpdate', this._scoreSystem.getBestScore());
    this.game.events.emit('boostUpdate', this._boosted ? this._boostTimer : null);
  }

  /* ══════════════════════════════════════════════
     VISUAL EFFECTS
     ══════════════════════════════════════════════ */

  /**
   * Tạo hiệu ứng tuyết rơi.
   * Particles rơi từ trên xuống, có gió nhẹ.
   */
  _createSnowParticles() {
    const { width } = this.scale;

    this._snowEmitter = this.add.particles(0, 0, 'particle-snow', {
      x: { min: 0, max: width },
      y: -10,
      speedY: { min: 40, max: 90 },
      speedX: { min: -12, max: 12 },
      lifespan: 8000,
      frequency: 200,
      quantity: 1,
      scale: { min: 0.3, max: 0.8 },
      alpha: { start: 0.7, end: 0.2 },
      blendMode: 'ADD',
      emitting: true,
    });
    this._snowEmitter.setDepth(-1);
  }

  /**
   * Hiệu ứng lấp lánh khi nhặt coin.
   * @param {number} x
   * @param {number} y
   */
  _coinSparkle(x, y) {
    const burst = this.add.particles(x, y, 'particle-sparkle', {
      speed: { min: 60, max: 160 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 300, max: 600 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 8,
      blendMode: 'ADD',
      emitting: false,
    });
    burst.setDepth(20);
    burst.explode(8);
    this.time.delayedCall(800, () => burst.destroy());
  }

  /**
   * Bật/tắt glow khi boost.
   * @param {boolean} on
   */
  _setBoostGlow(on) {
    if (on) {
      this._boostGlow.start();
      this._boostGlow.setPosition(this._player.sprite.x, this._player.sprite.y);
    } else {
      this._boostGlow.stop();
    }
  }

  /**
   * Hiệu ứng flash đỏ khi bị va chạm.
   */
  _showHitFlash() {
    this._hitFlash.setVisible(true).setAlpha(0.35);
    this.tweens.add({
      targets: this._hitFlash,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => this._hitFlash.setVisible(false),
    });
  }

  /**
   * Hiệu ứng game over: overlay đỏ thẫm dần + camera shake.
   */
  _showDeathFlash() {
    // Camera shake mạnh
    this.cameras.main.shake(400, 0.02);

    // Flash đỏ
    this._deathFlash.setVisible(true).setAlpha(0.5);
    this.tweens.add({
      targets: this._deathFlash,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
    });

    // Overlay tối dần
    this._gameOverOverlay.setVisible(true);
    this.tweens.add({
      targets: this._gameOverBg,
      alpha: 0.6,
      duration: 800,
      ease: 'Power2',
    });
  }

  /* ══════════════════════════════════════════════
     BOOST
     ══════════════════════════════════════════════ */

  _activateBoost() {
    this._boosted = true;
    this._boostTimer = BOOST_DURATION;
    this._player.sprite.setTint(0xaaffaa);
    this._setBoostGlow(true);
    this.game.events.emit('boostUpdate', this._boostTimer);
  }

  _updateBoost(delta) {
    if (!this._boosted) return;

    this._boostTimer -= delta;
    if (this._boostTimer <= 0) {
      this._boosted = false;
      this._boostTimer = 0;
      this._player.sprite.clearTint();
      this._setBoostGlow(false);
      this.game.events.emit('boostUpdate', null);
    } else {
      this.game.events.emit('boostUpdate', this._boostTimer);
    }
  }

  /* ══════════════════════════════════════════════
     INVINCIBILITY
     ══════════════════════════════════════════════ */

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
    // Force-land nếu đang nhảy
    this._player.land();

    this._lives--;
    this.game.events.emit('livesUpdate', this._lives);
    this.game.events.emit('scoreUpdate', this._scoreSystem.getScore());

    // SFX + visual
    AudioManager.get(this.game.registry)?.playSFX('sfx-hit');
    this._showHitFlash();

    if (this._lives <= 0) {
      this._handleDeath();
    } else {
      this._enterStagger();
    }
  }

  _enterInvincible() {
    this._invincible = true;
    this._invincibleTimer = 2000;
    const { width, height } = this.scale;
    this._player.respawn(width / 2, height * 0.75);
  }

  /* ══════════════════════════════════════════════
     STAGGER
     ══════════════════════════════════════════════ */

  _enterStagger() {
    this._staggered = true;
    this._staggerTimer = STAGGER_DURATION;
    this._savedScrollSpeed = this.scrollSpeed;
    this._player.land(); // đảm bảo đã hạ cánh trước khi stagger

    this.scrollSpeed *= STAGGER_SLOW_FACTOR;
    this._spawnSystem.scrollSpeed = this.scrollSpeed;
    this._spawnSystem.pauseSpawning = true;

    this._player.velocityX = 0;
    this._player.sprite.play('player-collision');

    this.cameras.main.shake(180, 0.008);
  }

  _updateStagger(delta) {
    this._staggerTimer -= delta;
    this._updateTerrain(delta);

    const { x: playerX } = this._player.getPosition();
    this._spawnSystem.update(delta, playerX);

    if (this._staggerTimer <= 0) {
      this._exitStagger();
    }
  }

  _exitStagger() {
    this._staggered = false;
    this._staggerTimer = 0;

    // Mất boost khi đứng dậy sau va chạm
    if (this._boosted) {
      this._boosted = false;
      this._boostTimer = 0;
      this._player.sprite.clearTint();
      this._setBoostGlow(false);
      this.game.events.emit('boostUpdate', null);
    }

    this.scrollSpeed = this._savedScrollSpeed;
    this._spawnSystem.scrollSpeed = this._savedScrollSpeed;
    this._spawnSystem.pauseSpawning = false;

    this._enterInvincible();
  }

  /* ══════════════════════════════════════════════
     DEATH
     ══════════════════════════════════════════════ */

  _handleDeath() {
    this._isDead = true;
    this._invincible = false;
    this._player.land();
    this._player.sprite.setAlpha(1);
    this._player.velocityX = 0;

    // Tắt boost
    this._boosted = false;
    this._boostTimer = 0;
    this._player.sprite.clearTint();
    this._setBoostGlow(false);
    this.game.events.emit('boostUpdate', null);

    // SFX + flash
    const audio = AudioManager.get(this.game.registry);
    audio?.playSFX('sfx-gameover');
    audio?.stopBGM();
    this._showDeathFlash();

    this._player.sprite.play('player-collision');

    // Mission: GAME_COMPLETED (thay đổi cuối cùng, không cần toast)
    this._missionSystem?.updateProgress('GAME_COMPLETED', 1);

    this._player.sprite.once('animationcomplete', () => {
      this.time.delayedCall(1200, () => {
        this._scoreSystem.saveBestScore();
        this.scene.start('GameOverScene', {
          score: this._scoreSystem.getScore(),
          coins: this._scoreSystem.getCoinCount(),
          bestScore: this._scoreSystem.getBestScore(),
          level: this._level,
          boostUsed: this._scoreSystem.getBoostUsed(),
          playTime: Math.floor(this._survivalTime),
        });
      });
    });
  }

  /* ══════════════════════════════════════════════
     TERRAIN
     ══════════════════════════════════════════════ */

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

  /* ══════════════════════════════════════════════
     SHUTDOWN
     ══════════════════════════════════════════════ */

  shutdown() {
    this._input.destroy();
    this._player.destroy();
    this._spawnSystem.destroy();

    // Dọn particle emitters
    if (this._snowEmitter) this._snowEmitter.destroy();
    if (this._trailEmitter) this._trailEmitter.destroy();
    if (this._boostGlow) this._boostGlow.destroy();

    // Dọn flash overlays
    if (this._hitFlash) this._hitFlash.destroy();
    if (this._deathFlash) this._deathFlash.destroy();
    if (this._gameOverOverlay) this._gameOverOverlay.destroy(true);

    // Dừng âm thanh
    const audio = AudioManager.get(this.game.registry);
    if (audio) audio.stopBGM();

    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
  }
}
