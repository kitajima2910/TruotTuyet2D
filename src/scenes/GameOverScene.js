/**
 * GameOverScene.js — Scene kết thúc game
 * Hiển thị Distance Score, Coin Collected, Best Score và nút chơi lại.
 * Nhận dữ liệu từ PlayScene qua init(data).
 */

import { AchievementSystem } from '../systems/AchievementSystem.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  /**
   * Nhận dữ liệu từ PlayScene
   * @param {{ score: number, coins: number, bestScore: number, level: number, boostUsed?: number, playTime?: number }} data
   */
  init(data) {
    this._score = data?.score ?? 0;
    this._coins = data?.coins ?? 0;
    this._level = data?.level ?? 1;
    this._boostUsed = data?.boostUsed ?? 0;
    this._playTime = data?.playTime ?? 0;

    // Lấy bestScore từ PlayerProfile — nguồn dữ liệu duy nhất
    const profile = this.game.registry.get('playerProfile');
    this._bestScore = profile ? profile.bestScore : (data?.bestScore ?? 0);
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    // Đảm bảo bestScore trong profile đã được cập nhật (ScoreSystem.saveBestScore đã xử lý)
    // và lưu dữ liệu qua SaveManager
    const profile = this.game.registry.get('playerProfile');
    if (profile) {
      // Đồng bộ bestScore hiển thị với profile (phòng trường hợp saveBestScore chưa kịp chạy)
      if (this._score > profile.bestScore) {
        profile.bestScore = this._score;
        this._bestScore = this._score;
      } else {
        this._bestScore = profile.bestScore;
      }
      // Lưu ngay qua SaveManager
      const sm = this.game.registry.get('saveManager');
      if (sm) sm.save();
    }

    // Tắt UIScene nếu còn sót từ gameplay trước
    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }

    // ── Nền game over ──
    this.add.image(width / 2, height / 2, 'gameover-bg')
      .setDisplaySize(width, height)
      .setDepth(-2);

    // Overlay tối
    this.add.rectangle(centerX, height / 2, width, height, 0x000000, 0.6);

    // ── KẾT THÚC title ──
    this.add.text(centerX, height * 0.20, 'KẾT THÚC', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#e74c3c',
      stroke: '#ffffff',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // ── Khoảng cách (Distance Score) — đẩy xuống 3× gap so với panel ──
    this.add.text(centerX, height * 0.45, `KHOẢNG CÁCH: ${this._score}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ecf0f1',
    }).setOrigin(0.5);

    // ── Xu thu thập (Coin Collected) ──
    this.add.text(centerX, height * 0.53, `XU THU THẬP: ${this._coins}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5);

    // ── Cập nhật Lifetime Statistics và thông báo AchievementSystem ──
    this._updateLifetimeStats();

    // Lưu lại sau khi cập nhật lifetime stats
    const sm2 = this.game.registry.get('saveManager');
    if (sm2) sm2.save();

    // ── Điểm cao nhất (Best Score) ──
    this.add.text(centerX, height * 0.61, `CAO NHẤT: ${this._bestScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      color: '#f1c40f',
    }).setOrigin(0.5);

    // ── Nút Chơi lại ──
    this._createRetryButton(centerX, height * 0.73);

    // ── Nút về Menu ──
    this._createMenuButton(centerX, height * 0.83);
  }

  _createRetryButton(x, y) {
    const btnWidth = 260;
    const btnHeight = 60;

    const bg = this.add.graphics();
    bg.fillStyle(0x27ae60, 1);
    bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 14);

    this.add.text(x, y, 'CHƠI LẠI', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hitZone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2ecc71, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 14);
    });
    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x27ae60, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 14);
    });
    hitZone.on('pointerdown', () => {
      this.scene.start('LoadingScene', { level: this._level });
    });
  }

  /**
   * Cập nhật Lifetime Statistics trong PlayerProfile và thông báo AchievementSystem.
   * Gọi sau khi đồng bộ bestScore.
   */
  _updateLifetimeStats() {
    const profile = this.game.registry.get('playerProfile');
    if (!profile) return;

    // Cộng dồn lifetime stats
    profile.totalDistance += this._score;
    profile.totalCoinsCollected += this._coins;
    profile.totalBoostUsed += this._boostUsed;
    profile.totalGamesPlayed += 1;
    profile.totalPlayTime += this._playTime;

    // highestSingleRun — chỉ ghi nếu score lần này cao hơn
    if (this._score > profile.highestSingleRun) {
      profile.highestSingleRun = this._score;
    }

    // Thông báo AchievementSystem và thu thập các thành tựu vừa hoàn thành
    const achievementSystem = this.game.registry.get('achievementSystem');
    const newlyCompleted = [];

    if (achievementSystem) {
      const collectJustCompleted = (changes) => {
        for (const c of changes) {
          if (c.justCompleted) newlyCompleted.push(c);
        }
      };

      collectJustCompleted(achievementSystem.updateProgress('LIFETIME_DISTANCE_CHANGED', profile.totalDistance));
      collectJustCompleted(achievementSystem.updateProgress('LIFETIME_COIN_COLLECTED', profile.totalCoinsCollected));
      collectJustCompleted(achievementSystem.updateProgress('BOOST_USED', profile.totalBoostUsed));
      collectJustCompleted(achievementSystem.updateProgress('GAME_FINISHED', profile.totalGamesPlayed));
      collectJustCompleted(achievementSystem.updateProgress('HIGHEST_SCORE_UPDATED', profile.highestSingleRun));
    }

    // Hiển thị toast cho các thành tựu vừa hoàn thành
    if (newlyCompleted.length > 0) {
      this._showAchievementToasts(newlyCompleted);
    }
  }

  /**
   * Hiển thị panel thành tựu dạng scroll cố định giữa "KẾT THÚC" và "KHOẢNG CÁCH".
   * Panel có scroll nếu nội dung dài, hiển thị vĩnh viễn (không tự biến mất).
   * @param {Array<{id:string, name:string}>} achievements
   */
  _showAchievementToasts(achievements) {
    const { width, height } = this.scale;
    const centerX = width / 2;

    // ── Panel dimensions (cố định, nằm giữa 2 text) ──
    const panelW = Math.min(500, width * 0.78);
    const panelX = centerX - panelW / 2;
    const panelTopH = height * 0.235;        // top panel (dưới KẾT THÚC)
    const panelBotH = height * 0.345;        // bottom panel (trên KHOẢNG CÁCH)
    const panelH = panelBotH - panelTopH;    // fixed height
    const lineH = 30;

    // ── Container ngoài: chứa background + title + scroll content ──
    const root = this.add.container(0, 0).setDepth(90);

    // ── Background panel ──
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(panelX, panelTopH, panelW, panelH, 12);
    bg.lineStyle(2, 0xffd700, 0.6);
    bg.strokeRoundedRect(panelX, panelTopH, panelW, panelH, 12);
    root.add(bg);

    // ── Title (above the scroll area) ──
    const titleY = panelTopH + 10;
    const titleText = this.add.text(centerX, titleY, '🏆 THÀNH TỰU MỚI!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0);
    root.add(titleText);

    // Divider under title
    const dividerY = titleY + 22;
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xffd700, 0.3);
    divider.lineBetween(panelX + 16, dividerY, panelX + panelW - 16, dividerY);
    root.add(divider);

    // ── Scrollable content area ──
    const contentTop = dividerY + 6;
    const contentH = panelBotH - contentTop - 6; // available content height

    // Container con chứa các item (sẽ được scroll)
    const scrollContent = this.add.container(0, 0);
    root.add(scrollContent);

    // ── Create achievement items ──
    let totalContentH = 0;
    achievements.forEach((ach, i) => {
      const def = AchievementSystem.ACHIEVEMENT_DEFS.find(d => d.id === ach.id);
      if (!def) return;

      let rewardStr = `+${def.rewardCoins} Xu`;
      if (def.rewardSkin) {
        const skinSystem = this.game.registry.get('skinSystem');
        let skinName = def.rewardSkin;
        if (skinSystem) {
          const skin = skinSystem.getSkins().find(s => s.id === def.rewardSkin);
          if (skin) skinName = skin.name;
        }
        rewardStr += ` + Skin "${skinName}"`;
      }

      const y = contentTop + i * lineH;

      // Name + icon (bên trái)
      const nameText = this.add.text(panelX + 14, y,
        `${def.icon} ${ach.name}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0, 0);
      scrollContent.add(nameText);

      // Reward (bên phải)
      const rewardText = this.add.text(panelX + panelW - 14, y, rewardStr, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#66ff88',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(1, 0);
      scrollContent.add(rewardText);

      totalContentH = (y - contentTop) + lineH;
    });

    // ── GeometryMask: clip nội dung scroll trong content area ──
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(panelX, contentTop, panelW, contentH);
    maskShape.setVisible(false);
    const mask = maskShape.createGeometryMask();
    scrollContent.setMask(mask);

    // ── Scroll state ──
    const maxScroll = Math.max(0, totalContentH - contentH);
    let scrollY = 0;
    let dragStartY = 0;
    let dragStartScroll = 0;
    let isDragging = false;

    // ── Scroll indicator (nếu cần scroll) ──
    let drawIndicator;
    if (maxScroll > 0) {
      const indicatorH = Math.max(12, contentH * (contentH / totalContentH));
      const indicatorX = panelX + panelW - 6;
      const indicator = this.add.graphics().setDepth(92);
      root.add(indicator);

      drawIndicator = () => {
        if (!indicator?.active) return;
        indicator.clear();
        const ratio = -scrollY / maxScroll;
        const yOffset = ratio * (contentH - indicatorH);
        indicator.fillStyle(0xffd700, 0.4);
        indicator.fillRoundedRect(indicatorX, contentTop + yOffset, 4, indicatorH, 2);
      };
      drawIndicator();
    }

    // ── Scroll zone (interactive) ──
    const scrollZone = this.add.zone(centerX, (contentTop + panelBotH) / 2, panelW, contentH)
      .setInteractive({ useHandCursor: false })
      .setDepth(91);
    root.add(scrollZone);

    scrollZone.on('pointerdown', (pointer) => {
      dragStartY = pointer.y;
      dragStartScroll = scrollY;
      isDragging = true;
    });

    this.input.on('pointermove', (pointer) => {
      if (!isDragging) return;
      const dy = pointer.y - dragStartY;
      scrollY = Phaser.Math.Clamp(dragStartScroll - dy, -maxScroll, 0);
      scrollContent.y = scrollY;
      if (drawIndicator) drawIndicator();
    });

    this.input.on('pointerup', () => {
      isDragging = false;
    });

    // ── Animation: fade-in (không auto-destroy, giữ vĩnh viễn) ──
    root.setAlpha(0);
    this.tweens.add({
      targets: root,
      alpha: 1,
      duration: 400,
      ease: 'Power2',
    });
  }

  _createMenuButton(x, y) {
    const btnWidth = 260;
    const btnHeight = 60;

    const bg = this.add.graphics();
    bg.fillStyle(0x7f8c8d, 1);
    bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 14);

    this.add.text(x, y, 'MENU', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hitZone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x95a5a6, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 14);
    });
    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x7f8c8d, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 14);
    });
    hitZone.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}
