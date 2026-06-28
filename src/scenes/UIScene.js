/**
 * UIScene.js — Scene giao diện người dùng (HUD)
 * Layer overlay trên PlayScene, hiển thị toàn bộ thông tin game real-time.
 *
 * Lắng nghe event từ PlayScene qua this.game.events:
 *   - 'scoreUpdate'     (score)    → Distance Score
 *   - 'livesUpdate'     (lives)    → Lives (hearts)
 *   - 'coinUpdate'      (count)    → Coin Count
 *   - 'boostUpdate'     (timeLeft) → Boost Timer bar (ms, 0 = tắt)
 *   - 'bestScoreUpdate' (score)    → Best Score
 *   - 'pauseState'      (paused)   → Trạng thái Pause
 *   - 'soundUpdate'     (muted)    → Cập nhật nút âm thanh
 *
 * Điều khiển:
 *   - ESC / Nút Pause → Tạm dừng
 *   - Nút Sound → Bật/tắt âm thanh
 *   - Nút Missions → Mở MissionPanel
 */

import { MissionPanel } from '../ui/MissionPanel.js';
import { MissionLogDisplay } from '../ui/MissionLogDisplay.js';
import { AchievementPanel } from '../ui/AchievementPanel.js';
import { DailyRewardPanel } from '../ui/DailyRewardPanel.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  /**
   * Nhận level từ PlayScene
   * @param {{ level?: number }} data
   */
  init(data) {
    this._level = data?.level ?? 1;
  }

  /* ───────────────────────────────────────────
   *  CREATE
   * ─────────────────────────────────────────── */

  create() {
    const { width, height } = this.scale;
    const P = 14; // padding
    const T = 10; // top offset

    // ── Container chính (depth cao để luôn trên PlayScene) ──
    this._hud = this.add.container(0, 0).setDepth(200);

    /* ──────── PHẦN TRÊN ──────── */

    // Level
    this._levelText = this.add.text(P, T, `MÀN ${this._level}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#2c3e6b',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0, 0);
    this._hud.add(this._levelText);

    // Best Score (phải trên)
    this._bestText = this.add.text(width - P, T, 'CAO NHẤT: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);
    this._hud.add(this._bestText);

    // Score (Distance)
    this._scoreText = this.add.text(P, T + 28, 'ĐIỂM: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#2c3e6b',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0, 0);
    this._hud.add(this._scoreText);

    // Coin Count (phải trên, dưới CAO NHẤT)
    this._coinText = this.add.text(width - P, T + 24, 'XU: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0);
    this._hud.add(this._coinText);

    // Lives
    this._livesText = this.add.text(P, T + 62, '❤️ × 3', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#e74c3c',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0, 0);
    this._hud.add(this._livesText);

    /* ──────── BOOST TIMER BAR ──────── */

    const barY = 116;
    const barW = Math.min(180, width * 0.4);
    const barH = 10;
    const barX = (width - barW) / 2;

    // Label
    this._boostLabel = this.add.text(width / 2, barY - 3, '🚀 TĂNG TỐC', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setVisible(false);
    this._hud.add(this._boostLabel);

    // Bar background
    this._boostBg = this.add.graphics();
    this._boostBg.fillStyle(0x222222, 0.45);
    this._boostBg.fillRoundedRect(barX, barY, barW, barH, 5);
    this._boostBg.setVisible(false);
    this._hud.add(this._boostBg);

    // Bar fill
    this._boostFill = this.add.graphics();
    this._boostFill.setVisible(false);
    this._hud.add(this._boostFill);

    this._boostCfg = { x: barX, y: barY, w: barW, h: barH };

    /* ──────── NÚT ĐIỀU KHIỂN (dưới cùng) ──────── */

    const btnR = 22;
    const bottomY = height - P - btnR;

    // Sound Toggle (trái dưới)
    this._soundBtn = this._mkCircleBtn(P + btnR, bottomY, btnR, '🔊', () => this._toggleSound());

    // Missions (giữa dưới)
    this._missionBtn = this._mkCircleBtn(width / 2, bottomY, btnR, '📋', () => this._toggleMissions());

    // Achievement (giữa-phải dưới)
    this._achieveBtn = this._mkCircleBtn(width * 0.68, bottomY, btnR, '🏆', () => this._toggleAchievements());

    // Daily Reward (giữa-phải dưới, cạnh Achievement)
    this._dailyBtn = this._mkCircleBtn(width * 0.82, bottomY, btnR, '🎁', () => this._toggleDailyReward());

    // Pause (phải dưới)
    this._pauseBtn = this._mkCircleBtn(width - P - btnR, bottomY, btnR, '⏸', () => this._togglePause());

    /* ──────── PAUSE OVERLAY ──────── */

    this._pauseOverlay = this.add.container(0, 0).setDepth(300).setVisible(false);

    // Dark backdrop
    const ovBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);
    ovBg.setInteractive(); // chặn click thấu qua
    this._pauseOverlay.add(ovBg);

    // Title
    this._pauseOverlay.add(
      this.add.text(width / 2, height * 0.35, 'TẠM DỪNG', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5),
    );

    // Resume button
    const rx = width / 2;
    const ry1 = height * 0.50;
    const ry2 = height * 0.60;

    this._pauseOverlay.add(this._mkPauseBtn(rx, ry1, '▶ TIẾP TỤC', 0x27ae60, () => this._togglePause()));
    this._pauseOverlay.add(this._mkPauseBtn(rx, ry2, '🏠 MENU', 0x7f8c8d, () => this._goToMenu()));

    /* ──────── REGISTER EVENTS ──────── */

    this.game.events.on('scoreUpdate', this._onScore, this);
    this.game.events.on('livesUpdate', this._onLives, this);
    this.game.events.on('coinUpdate', this._onCoin, this);
    this.game.events.on('boostUpdate', this._onBoost, this);
    this.game.events.on('bestScoreUpdate', this._onBestScore, this);
    this.game.events.on('pauseState', this._onPause, this);
    this.game.events.on('soundUpdate', this._onSoundUpdate, this);

    // ESC key — đóng missions/achievements nếu đang mở, nếu không thì toggle pause
    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => {
      if (this._missionPanel && this._missionPanel.isVisible()) {
        this._missionPanel.hide();
      } else if (this._achievementPanel && this._achievementPanel.isVisible()) {
        this._achievementPanel.hide();
      } else if (this._dailyRewardPanel && this._dailyRewardPanel.isVisible()) {
        this._dailyRewardPanel.hide();
      } else {
        this._togglePause();
      }
    });

    // ── MissionPanel ──
    this._missionPanel = new MissionPanel(this, (visible) => this._onMissionsVisibility(visible));
    this._missionPanel.hide();

    // ── AchievementPanel ──
    this._achievementPanel = new AchievementPanel(this, (visible) => this._onAchievementVisibility(visible));
    this._achievementPanel.hide();

    // ── DailyRewardPanel ──
    this._dailyRewardPanel = new DailyRewardPanel(this, (visible) => this._onDailyRewardVisibility(visible));
    this._dailyRewardPanel.hide();

    // ── MissionLogDisplay (toast notifications) ──
    this._missionLog = new MissionLogDisplay(this);

    // Lắng nghe mission events từ PlayScene
    this.game.events.on('missionProgress', this._onMissionProgress, this);
    this.game.events.on('missionComplete', this._onMissionComplete, this);

    // Cập nhật icon âm thanh ban đầu
    this._refreshSoundIcon();
  }

  /* ───────────────────────────────────────────
   *  UI HELPERS
   * ─────────────────────────────────────────── */

  /** Tạo nút hình tròn */
  _mkCircleBtn(x, y, r, label, cb) {
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.35);
    bg.fillCircle(x, y, r);
    this._hud.add(bg);

    const txt = this.add.text(x, y, label, {
      fontSize: `${r + 2}px`,
    }).setOrigin(0.5);
    this._hud.add(txt);

    const zone = this.add.zone(x, y, r * 2, r * 2)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', cb);
    this._hud.add(zone);

    return { bg, txt, zone };
  }

  /** Tạo nút trong pause overlay */
  _mkPauseBtn(x, y, label, color, cb) {
    const w = 200;
    const h = 48;

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    this._pauseOverlay.add(bg);

    this._pauseOverlay.add(
      this.add.text(x, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5),
    );

    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', cb);
    this._pauseOverlay.add(zone);

    return zone;
  }

  /* ───────────────────────────────────────────
   *  EVENT HANDLERS
   * ─────────────────────────────────────────── */

  /** @param {number} score */
  _onScore(score) {
    if (this._scoreText?.active) {
      this._scoreText.setText(`ĐIỂM: ${score}`);
    }
  }

  /** @param {number} lives */
  _onLives(lives) {
    if (this._livesText?.active) {
      this._livesText.setText(`❤️ × ${Math.max(0, lives)}`);
    }
  }

  /** @param {number} count */
  _onCoin(count) {
    if (this._coinText?.active) {
      this._coinText.setText(`XU: ${count}`);
    }
  }

  /**
   * Cập nhật boost timer bar.
   * @param {number|null} remainingMs — thời gian còn lại (ms) hoặc null để ẩn
   */
  _onBoost(remainingMs) {
    const fill = this._boostFill;
    if (!fill) return;

    if (remainingMs === null || remainingMs <= 0) {
      this._boostLabel.setVisible(false);
      this._boostBg.setVisible(false);
      fill.setVisible(false);
      return;
    }

    this._boostLabel.setVisible(true);
    this._boostBg.setVisible(true);
    fill.setVisible(true);

    const ratio = Phaser.Math.Clamp(remainingMs / 5000, 0, 1);
    const w = this._boostCfg.w * ratio;

    fill.clear();
    let color = 0x00ff88;
    if (ratio < 0.3) color = 0xff4444;
    else if (ratio < 0.6) color = 0xffaa00;
    fill.fillStyle(color, 0.9);
    fill.fillRoundedRect(this._boostCfg.x, this._boostCfg.y, w, this._boostCfg.h, 5);
  }

  /** @param {number} score */
  _onBestScore(score) {
    if (this._bestText?.active) {
      this._bestText.setText(`CAO NHẤT: ${score}`);
    }
  }

  /** @param {boolean} paused */
  _onPause(paused) {
    this._pauseOverlay.setVisible(paused);
    if (this._pauseBtn?.txt) {
      this._pauseBtn.txt.setText(paused ? '▶' : '⏸');
    }
  }

  /** @param {boolean} muted */
  _onSoundUpdate(muted) {
    if (this._soundBtn?.txt) {
      this._soundBtn.txt.setText(muted ? '🔇' : '🔊');
    }
  }

  /* ───────────────────────────────────────────
   *  SOUND
   * ─────────────────────────────────────────── */

  _toggleSound() {
    const audio = this.game.registry.get('audioManager');
    if (!audio) return;
    const muted = audio.toggleMute();
    if (this._soundBtn?.txt) {
      this._soundBtn.txt.setText(muted ? '🔇' : '🔊');
    }
    this.game.events.emit('soundUpdate', muted);
  }

  _refreshSoundIcon() {
    const audio = this.game.registry.get('audioManager');
    const muted = audio ? audio.isMuted() : false;
    if (this._soundBtn?.txt) {
      this._soundBtn.txt.setText(muted ? '🔇' : '🔊');
    }
  }

  /* ───────────────────────────────────────────
   *  MISSION EVENTS (toast log)
   * ─────────────────────────────────────────── */

  /** @param {string} name @param {number} progress @param {number} target */
  _onMissionProgress(name, progress, target) {
    if (this._missionLog) {
      this._missionLog.showProgress(name, progress, target);
    }
  }

  /** @param {string} name @param {number} reward */
  _onMissionComplete(name, reward) {
    if (this._missionLog) {
      this._missionLog.showComplete(name, reward);
    }
  }

  /* ───────────────────────────────────────────
   *  MISSIONS PANEL
   * ─────────────────────────────────────────── */

  /**
   * Callback khi MissionPanel show/hide — pause/resume game.
   * @param {boolean} visible
   */
  _onMissionsVisibility(visible) {
    const ps = this.scene.get('PlayScene');
    if (!ps) return;

    if (visible) {
      // Mở missions → pause game (không hiện pause overlay)
      ps._paused = true;
    } else {
      // Đóng missions → resume game
      ps._paused = false;
    }
  }

  _toggleMissions() {
    if (this._missionPanel) {
      // Không cho mở mission khi đang pause
      if (!this._missionPanel.isVisible()) {
        const ps = this.scene.get('PlayScene');
        if (ps && ps._paused && !ps._isDead) return;
      }
      this._missionPanel.toggle();
    }
  }

  /* ───────────────────────────────────────────
   *  ACHIEVEMENT PANEL
   * ─────────────────────────────────────────── */

  /**
   * Callback khi AchievementPanel show/hide — pause/resume game.
   * @param {boolean} visible
   */
  _onAchievementVisibility(visible) {
    const ps = this.scene.get('PlayScene');
    if (!ps) return;

    if (visible) {
      ps._paused = true;
    } else {
      ps._paused = false;
    }
  }

  _toggleAchievements() {
    if (this._achievementPanel) {
      if (!this._achievementPanel.isVisible()) {
        const ps = this.scene.get('PlayScene');
        if (ps && ps._paused && !ps._isDead) return;
      }
      this._achievementPanel.toggle();
    }
  }

  /* ───────────────────────────────────────────
   *  DAILY REWARD
   * ─────────────────────────────────────────── */

  /**
   * Callback khi DailyRewardPanel show/hide — pause/resume game.
   * @param {boolean} visible
   */
  _onDailyRewardVisibility(visible) {
    const ps = this.scene.get('PlayScene');
    if (!ps) return;

    if (visible) {
      ps._paused = true;
    } else {
      ps._paused = false;
    }
  }

  _toggleDailyReward() {
    if (this._dailyRewardPanel) {
      this._dailyRewardPanel.toggle();
    }
  }

  /* ───────────────────────────────────────────
   *  PAUSE / RESUME
   * ─────────────────────────────────────────── */

  _togglePause() {
    const ps = this.scene.get('PlayScene');
    if (!ps) return;

    // Đang mở missions → đóng missions trước (và game sẽ resume qua callback)
    if (this._missionPanel && this._missionPanel.isVisible()) {
      this._missionPanel.hide();
      return;
    }

    // Không cho pause khi đã chết hoặc đang game over
    if (!ps._paused && ps._isDead) return;

    ps._paused = !ps._paused;
    this._pauseOverlay.setVisible(ps._paused);
    if (this._pauseBtn?.txt) {
      this._pauseBtn.txt.setText(ps._paused ? '▶' : '⏸');
    }
    this.game.events.emit('pauseState', ps._paused);
  }

  _goToMenu() {
    const ps = this.scene.get('PlayScene');
    if (ps) {
      ps._paused = false;
      if (typeof ps.shutdown === 'function') ps.shutdown();
      this.scene.stop('PlayScene');
    }
    this._cleanup();
    this.scene.start('MenuScene');
  }

  /* ───────────────────────────────────────────
   *  CLEANUP
   * ─────────────────────────────────────────── */

  _cleanup() {
    this.game.events.off('scoreUpdate', this._onScore, this);
    this.game.events.off('livesUpdate', this._onLives, this);
    this.game.events.off('coinUpdate', this._onCoin, this);
    this.game.events.off('boostUpdate', this._onBoost, this);
    this.game.events.off('bestScoreUpdate', this._onBestScore, this);
    this.game.events.off('pauseState', this._onPause, this);
    this.game.events.off('soundUpdate', this._onSoundUpdate, this);
    this.game.events.off('missionProgress', this._onMissionProgress, this);
    this.game.events.off('missionComplete', this._onMissionComplete, this);
  }

  shutdown() {
    this._cleanup();
    if (this._missionPanel) {
      this._missionPanel.destroy();
      this._missionPanel = null;
    }
    if (this._missionLog) {
      this._missionLog.destroy();
      this._missionLog = null;
    }
    if (this._achievementPanel) {
      this._achievementPanel.destroy();
      this._achievementPanel = null;
    }
    if (this._dailyRewardPanel) {
      this._dailyRewardPanel.destroy();
      this._dailyRewardPanel = null;
    }
  }
}
