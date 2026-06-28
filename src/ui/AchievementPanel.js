/**
 * AchievementPanel.js — Giao diện hiển thị danh sách thành tựu
 *
 * Là một UI component do UIScene khởi tạo và quản lý.
 *   • Hiển thị danh sách achievement (tên, icon, progress, reward, trạng thái)
 *   • Nút Claim cho achievement đã hoàn thành
 *   • Gửi yêu cầu Claim qua AchievementSystem.claimReward()
 *   • KHÔNG tự cập nhật progress — chỉ đọc dữ liệu và hiển thị
 *
 * Cách dùng (trong UIScene.create()):
 *   this._achievementPanel = new AchievementPanel(this);
 *   this._achievementPanel.hide(); // ẩn mặc định
 *
 *   // Khi bấm nút Achievements:
 *   this._achievementPanel.toggle();
 */

export class AchievementPanel {
  /**
   * @param {Phaser.Scene} scene — UIScene
   * @param {function(boolean): void} [onVisibilityChange] — callback khi show/hide
   */
  constructor(scene, onVisibilityChange) {
    this.scene = scene;
    this._onVisibilityChange = onVisibilityChange;
    this._visible = false;
    this._achievementSystem = scene.game.registry.get('achievementSystem');
    this._items = [];

    // ── Container chính ──
    this._container = scene.add.container(0, 0).setDepth(290).setVisible(false);

    // ── Backdrop mờ (click để đóng) ──
    const { width, height } = scene.scale;
    this._bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55);
    this._bg.setInteractive();
    this._bg.on('pointerdown', () => this.hide());
    this._container.add(this._bg);

    // ── Nút đóng (✕) ──
    const closeBtn = scene.add.text(width - 20, 12, '✕', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ffffff'));
    this._container.add(closeBtn);

    // ── Title ──
    const title = scene.add.text(width / 2, height * 0.06, '🏆 THÀNH TỰU', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this._container.add(title);

    // ── Scrollable container cho danh sách achievement ──
    this._listContainer = scene.add.container(0, 0);
    this._container.add(this._listContainer);
  }

  /** Hiển thị panel + refresh dữ liệu */
  show() {
    if (this._visible) return;
    this._visible = true;
    this._container.setVisible(true);
    this._refresh();
    if (typeof this._onVisibilityChange === 'function') {
      this._onVisibilityChange(true);
    }
  }

  /** Ẩn panel */
  hide() {
    if (!this._visible) return;
    this._visible = false;
    this._container.setVisible(false);
    if (typeof this._onVisibilityChange === 'function') {
      this._onVisibilityChange(false);
    }
  }

  /** Bật/tắt */
  toggle() {
    if (this._visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /** @returns {boolean} */
  isVisible() {
    return this._visible;
  }

  /**
   * Xây dựng lại danh sách achievement từ AchievementSystem.
   * Gọi mỗi khi panel được mở hoặc sau khi claim.
   */
  _refresh() {
    // Dọn items cũ
    this._items.forEach(item => this._destroyItem(item));
    this._items = [];
    this._listContainer.removeAll(true);

    if (!this._achievementSystem) return;

    const { width, height } = this.scene.scale;
    const achievements = this._achievementSystem.getAchievements();
    const startY = height * 0.13;
    const gap = height * 0.13;

    achievements.forEach((achievement, i) => {
      const y = startY + gap * i;
      const item = this._createAchievementItem(achievement, width, y);
      this._items.push(item);
    });
  }

  /**
   * Tạo UI cho một achievement.
   * @param {object} achievement
   * @param {number} w — chiều rộng màn hình
   * @param {number} y — vị trí Y
   * @returns {object[]} — các phần tử cần destroy sau
   */
  _createAchievementItem(achievement, w, y) {
    const scene = this.scene;
    const cx = w / 2;
    const elements = [];

    // ── Icon + Tên ──
    const nameColor = achievement.claimed ? '#888888'
      : achievement.completed ? '#ffd700'
      : '#ffffff';
    const nameText = scene.add.text(cx, y, `${achievement.icon} ${achievement.name}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      fontStyle: 'bold',
      color: nameColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this._listContainer.add(nameText);
    elements.push(nameText);

    // ── Mô tả ──
    const descText = scene.add.text(cx, y + 22, achievement.desc, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#bbbbbb',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this._listContainer.add(descText);
    elements.push(descText);

    // ── Progress bar ──
    const barW = 280;
    const barH = 8;
    const barX = cx - barW / 2;
    const barY = y + 38;
    const ratio = achievement.target > 0 ? Math.min(achievement.progress / achievement.target, 1) : 0;

    // Background
    const barBg = scene.add.graphics();
    barBg.fillStyle(0x333333, 0.8);
    barBg.fillRoundedRect(barX, barY, barW, barH, 4);
    this._listContainer.add(barBg);
    elements.push(barBg);

    // Fill
    const barFill = scene.add.graphics();
    const fillColor = achievement.claimed ? 0x666666
      : ratio >= 1 ? 0xffd700
      : 0x9b59b6;
    barFill.fillStyle(fillColor, 1);
    barFill.fillRoundedRect(barX, barY, Math.max(4, barW * ratio), barH, 4);
    this._listContainer.add(barFill);
    elements.push(barFill);

    // ── Progress text ──
    const pctText = scene.add.text(cx, barY + 16, `${Math.floor(achievement.progress)} / ${achievement.target}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: achievement.claimed ? '#666666' : '#cccccc',
    }).setOrigin(0.5);
    this._listContainer.add(pctText);
    elements.push(pctText);

    // ── Reward info ──
    let rewardStr = `💰 ${achievement.rewardCoins} Xu`;
    if (achievement.rewardSkin) {
      const skinName = this._getSkinName(achievement.rewardSkin);
      rewardStr += ` + 🎨 Skin "${skinName}"`;
    }
    const rewardText = scene.add.text(cx, barY + 32, rewardStr, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this._listContainer.add(rewardText);
    elements.push(rewardText);

    // ── Trạng thái / Claim button ──
    if (achievement.claimed) {
      const doneText = scene.add.text(cx, barY + 50, '✓ ĐÃ NHẬN', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#666666',
      }).setOrigin(0.5);
      this._listContainer.add(doneText);
      elements.push(doneText);
    } else if (achievement.completed) {
      const btnW = 160;
      const btnH = 32;
      const btn = this._createClaimButton(cx, barY + 50, btnW, btnH, achievement.id);
      elements.push(btn);
    } else {
      const pendingText = scene.add.text(cx, barY + 50, 'Đang thực hiện...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#888888',
      }).setOrigin(0.5);
      this._listContainer.add(pendingText);
      elements.push(pendingText);
    }

    return elements;
  }

  /**
   * Lấy tên skin từ ID.
   * @param {string} skinId
   * @returns {string}
   */
  _getSkinName(skinId) {
    const skinSystem = this.scene.game.registry.get('skinSystem');
    if (!skinSystem) return skinId;
    const skins = skinSystem.getSkins();
    const skin = skins.find(s => s.id === skinId);
    return skin ? skin.name : skinId;
  }

  /**
   * Tạo nút Claim cho achievement đã hoàn thành.
   * @param {number} cx
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {string} achievementId
   * @returns {object[]} — các phần tử destroy sau
   */
  _createClaimButton(cx, y, w, h, achievementId) {
    const scene = this.scene;
    const elements = [];

    const bg = scene.add.graphics();
    bg.fillStyle(0x8e44ad, 1);
    bg.fillRoundedRect(cx - w / 2, y - h / 2, w, h, 8);
    this._listContainer.add(bg);
    elements.push(bg);

    const label = scene.add.text(cx, y, '🏆 NHẬN THƯỞNG', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    this._listContainer.add(label);
    elements.push(label);

    const zone = scene.add.zone(cx, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x9b59b6, 1);
      bg.fillRoundedRect(cx - w / 2, y - h / 2, w, h, 8);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x8e44ad, 1);
      bg.fillRoundedRect(cx - w / 2, y - h / 2, w, h, 8);
    });
    zone.on('pointerdown', () => {
      this._handleClaim(achievementId);
    });
    this._listContainer.add(zone);
    elements.push(zone);

    return elements;
  }

  /**
   * Xử lý claim — gọi AchievementSystem.claimReward().
   * Tiền thưởng được cộng vào PlayerProfile.coins (persistent),
   * skin được mở khóa qua SkinSystem.ownSkin().
   * @param {string} achievementId
   */
  _handleClaim(achievementId) {
    if (!this._achievementSystem) return;
    const success = this._achievementSystem.claimReward(achievementId);
    if (success) {
      // Refresh lại danh sách để cập nhật trạng thái
      this._refresh();
    }
  }

  /**
   * Destroy một item (khi refresh).
   * @param {object[]} elements
   */
  _destroyItem(elements) {
    elements.forEach(el => {
      if (el && typeof el.destroy === 'function') {
        el.destroy();
      }
    });
  }

  /** Dọn dẹp khi scene shutdown */
  destroy() {
    this._items.forEach(item => this._destroyItem(item));
    this._items = [];
    this._container.destroy(true);
  }
}
