/**
 * MissionPanel.js — Giao diện hiển thị danh sách nhiệm vụ
 *
 * Là một UI component do UIScene khởi tạo và quản lý.
 *   • Hiển thị danh sách mission (tên, progress, reward, trạng thái)
 *   • Nút Claim cho mission đã hoàn thành
 *   • Gửi yêu cầu Claim qua MissionSystem.claimReward()
 *   • KHÔNG tự cập nhật progress — chỉ đọc dữ liệu và hiển thị
 *
 * Cách dùng (trong UIScene.create()):
 *   this._missionPanel = new MissionPanel(this);
 *   this._missionPanel.hide(); // ẩn mặc định
 *
 *   // Khi bấm nút Missions:
 *   this._missionPanel.toggle();
 */

export class MissionPanel {
  /**
   * @param {Phaser.Scene} scene — UIScene
   * @param {function(boolean): void} [onVisibilityChange] — callback khi show/hide
   */
  constructor(scene, onVisibilityChange) {
    this.scene = scene;
    this._onVisibilityChange = onVisibilityChange;
    this._visible = false;
    this._missionSystem = scene.game.registry.get('missionSystem');
    this._items = [];

    // ── Container chính ──
    this._container = scene.add.container(0, 0).setDepth(280).setVisible(false);

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
    const title = scene.add.text(width / 2, height * 0.06, '📋 NHIỆM VỤ', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this._container.add(title);

    // ── Scrollable container cho danh sách mission ──
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
   * Xây dựng lại danh sách mission từ MissionSystem.
   * Gọi mỗi khi panel được mở hoặc sau khi claim.
   */
  _refresh() {
    // Dọn items cũ
    this._items.forEach(item => this._destroyItem(item));
    this._items = [];
    this._listContainer.removeAll(true);

    if (!this._missionSystem) return;

    const { width, height } = this.scene.scale;
    const missions = this._missionSystem.getActiveMissions();
    const startY = height * 0.13;
    const gap = height * 0.135;

    missions.forEach((mission, i) => {
      const y = startY + gap * i;
      const item = this._createMissionItem(mission, width, y);
      this._items.push(item);
    });
  }

  /**
   * Tạo UI cho một mission.
   * @param {object} mission
   * @param {number} w — chiều rộng màn hình
   * @param {number} y — vị trí Y
   * @returns {object} — các phần tử cần destroy sau
   */
  _createMissionItem(mission, w, y) {
    const scene = this.scene;
    const cx = w / 2;
    const elements = [];

    // ── Tên mission ──
    const nameColor = mission.claimed ? '#66ff88'
      : mission.completed ? '#66ff88'
      : '#ffffff';
    const nameText = scene.add.text(cx, y, mission.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: nameColor,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this._listContainer.add(nameText);
    elements.push(nameText);

    // ── Mô tả ──
    const descText = scene.add.text(cx, y + 22, mission.desc, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
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
    const ratio = mission.target > 0 ? Math.min(mission.progress / mission.target, 1) : 0;

    // Background
    const barBg = scene.add.graphics();
    barBg.fillStyle(0x333333, 0.8);
    barBg.fillRoundedRect(barX, barY, barW, barH, 4);
    this._listContainer.add(barBg);
    elements.push(barBg);

    // Fill
    const barFill = scene.add.graphics();
    const fillColor = mission.claimed ? 0x66ff88
      : ratio >= 1 ? 0x66ff88
      : 0x4a9eff;
    barFill.fillStyle(fillColor, 1);
    barFill.fillRoundedRect(barX, barY, Math.max(4, barW * ratio), barH, 4);
    this._listContainer.add(barFill);
    elements.push(barFill);

    // ── Progress text ──
    const pctText = scene.add.text(cx, barY + 16, `${mission.progress} / ${mission.target}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#cccccc',
    }).setOrigin(0.5);
    this._listContainer.add(pctText);
    elements.push(pctText);

    // ── Reward info ──
    const rewardText = scene.add.text(cx, barY + 34, `💰 ${mission.reward} Xu`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this._listContainer.add(rewardText);
    elements.push(rewardText);

    // ── Trạng thái / Claim button ──
    if (mission.claimed) {
      // Đã claim → hiển thị checkmark
      const doneText = scene.add.text(cx, barY + 54, '✓ HOÀN THÀNH', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#66ff88',
      }).setOrigin(0.5);
      this._listContainer.add(doneText);
      elements.push(doneText);
    } else if (mission.completed) {
      // Hoàn thành → nút Claim
      const btnW = 140;
      const btnH = 32;
      const btn = this._createClaimButton(cx, barY + 54, btnW, btnH, mission.id);
      elements.push(btn);
    } else {
      // Chưa hoàn thành → progress text
      const pendingText = scene.add.text(cx, barY + 54, `Đang thực hiện...`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#888888',
      }).setOrigin(0.5);
      this._listContainer.add(pendingText);
      elements.push(pendingText);
    }

    return elements;
  }

  /**
   * Tạo nút Claim cho mission đã hoàn thành.
   * @param {number} cx
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {string} missionId
   * @returns {object[]} — các phần tử destroy sau
   */
  _createClaimButton(cx, y, w, h, missionId) {
    const scene = this.scene;
    const elements = [];

    const bg = scene.add.graphics();
    bg.fillStyle(0x27ae60, 1);
    bg.fillRoundedRect(cx - w / 2, y - h / 2, w, h, 8);
    this._listContainer.add(bg);
    elements.push(bg);

    const label = scene.add.text(cx, y, '🏆 NHẬN THƯỞNG', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    this._listContainer.add(label);
    elements.push(label);

    const zone = scene.add.zone(cx, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2ecc71, 1);
      bg.fillRoundedRect(cx - w / 2, y - h / 2, w, h, 8);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x27ae60, 1);
      bg.fillRoundedRect(cx - w / 2, y - h / 2, w, h, 8);
    });
    zone.on('pointerdown', () => {
      this._handleClaim(missionId);
    });
    this._listContainer.add(zone);
    elements.push(zone);

    return elements;
  }

  /**
   * Xử lý claim — gọi MissionSystem.claimReward().
   * Tiền thưởng được cộng vào PlayerProfile.coins (persistent),
   * không ảnh hưởng đến session coin counter trên HUD.
   * @param {string} missionId
   */
  _handleClaim(missionId) {
    if (!this._missionSystem) return;
    const success = this._missionSystem.claimReward(missionId);
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
