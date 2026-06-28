/**
 * DailyRewardPanel.js — Giao diện phần thưởng hàng ngày
 *
 * Là một UI component do MenuScene hoặc UIScene khởi tạo và quản lý.
 *   • Hiển thị lịch 7 ngày (ngày, phần thưởng, trạng thái claimed/unclaimed)
 *   • Nút Claim cho ngày hiện tại nếu chưa claim
 *   • Hiển thị thời gian còn lại đến lần claim tiếp theo
 *   • Gửi yêu cầu Claim qua DailyRewardSystem.claimReward()
 *   • KHÔNG chứa logic nghiệp vụ — chỉ đọc dữ liệu và hiển thị
 *
 * Cách dùng:
 *   const panel = new DailyRewardPanel(this);
 *   panel.show();
 *   panel.hide();
 *   panel.toggle();
 */

// Màu sắc
const C = {
  gold: '#ffd700',
  goldDarker: '#e6b800',
  green: '#66ff88',
  cyan: '#88ccff',
  white: '#ffffff',
  textDim: '#8899aa',
  textMuted: '#556677',
  bgDark: '#0f0f23',
  bgPanel: '#161635',
  bgCell: '#1e1e45',
  bgCellClaimed: '#143014',
  bgCellToday: '#2a2030',
  border: '#2a2a5a',
};

export class DailyRewardPanel {
  /**
   * @param {Phaser.Scene} scene — scene chứa panel (MenuScene hoặc UIScene)
   * @param {function(boolean): void} [onVisibilityChange] — callback khi show/hide
   */
  constructor(scene, onVisibilityChange) {
    this.scene = scene;
    this._onVisibilityChange = onVisibilityChange;
    this._visible = false;
    this._dailyRewardSystem = scene.game.registry.get('dailyRewardSystem');
    this._items = [];
    this._tweens = [];

    // ── Container chính ──
    this._container = scene.add.container(0, 0).setDepth(350).setVisible(false);

    const { width, height } = scene.scale;

    // ── Backdrop mờ ──
    this._bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);
    this._bg.setInteractive();
    this._bg.on('pointerdown', () => this.hide());
    this._container.add(this._bg);

    // ── Kích thước panel ──
    const pw = Math.min(440, width * 0.88);
    const ph = Math.min(560, height * 0.78);
    const px = width / 2;
    const py = height / 2;

    // ── Panel nền (gradient-like bằng 2 layer) ──
    const panelBg = scene.add.graphics();
    // Shadow
    panelBg.fillStyle(0x000000, 0.4);
    panelBg.fillRoundedRect(px - pw / 2 + 3, py - ph / 2 + 3, pw, ph, 18);
    // Main bg
    panelBg.fillStyle(0x12122a, 0.97);
    panelBg.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);
    // Border
    panelBg.lineStyle(1.5, 0x3a3a7a, 0.7);
    panelBg.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 18);
    // Inner glow top
    panelBg.fillStyle(0x2a2a6a, 0.15);
    panelBg.fillRoundedRect(px - pw / 2, py - ph / 2, pw, 60, { tl: 18, tr: 18, bl: 0, br: 0 });
    this._container.add(panelBg);

    // ── Nút đóng (✕) ──
    const closeBtn = scene.add.text(px + pw / 2 - 14, py - ph / 2 + 12, '✕', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#778899',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    closeBtn.on('pointerover', () => closeBtn.setColor(C.gold));
    closeBtn.on('pointerout', () => closeBtn.setColor('#778899'));
    this._container.add(closeBtn);

    // ── Title ──
    const title = scene.add.text(px, py - ph / 2 + 28, '🎁 PHẦN THƯỞNG HÀNG NGÀY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: C.gold,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this._container.add(title);

    // ── Streak indicator ──
    this._streakText = scene.add.text(px, py - ph / 2 + 56, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: C.cyan,
    }).setOrigin(0.5);
    this._container.add(this._streakText);

    // ── Separator line ──
    const sepY = py - ph / 2 + 76;
    const sep = scene.add.graphics();
    sep.lineStyle(1, 0x3a3a6a, 0.5);
    sep.lineBetween(px - pw / 2 + 30, sepY, px + pw / 2 - 30, sepY);
    this._container.add(sep);

    // ── Layout constants ──
    this._calStartY = py - ph / 2 + 90;
    this._calH = 118;
    this._btnAreaY = py - ph / 2 + 260;
    this._config = { px, py, pw, ph };
    this._listContainer = scene.add.container(0, 0);
    this._container.add(this._listContainer);

    // ── Remaining time ──
    this._timeText = scene.add.text(px, py + ph / 2 - 50, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: C.textDim,
    }).setOrigin(0.5);
    this._container.add(this._timeText);

    // ── Close hint ──
    const hint = scene.add.text(px, py + ph / 2 - 28, 'click nền tối hoặc ✕ để đóng', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: C.textMuted,
    }).setOrigin(0.5);
    this._container.add(hint);
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

  /** Ẩn panel + kill tweens */
  hide() {
    if (!this._visible) return;
    this._visible = false;
    this._killAllTweens();
    this._container.setVisible(false);
    if (typeof this._onVisibilityChange === 'function') {
      this._onVisibilityChange(false);
    }
  }

  /** Bật/tắt */
  toggle() {
    if (this._visible) this.hide();
    else this.show();
  }

  /** @returns {boolean} */
  isVisible() {
    return this._visible;
  }

  /** Huỷ toàn bộ tween đang chạy */
  _killAllTweens() {
    this._tweens.forEach(t => {
      if (t && typeof t.stop === 'function') t.stop();
    });
    this._tweens = [];
  }

  /**
   * Xây dựng lại giao diện từ DailyRewardSystem.
   */
  _refresh() {
    this._killAllTweens();
    this._items = [];
    this._listContainer.removeAll(true);

    if (!this._dailyRewardSystem) return;

    const canClaim = this._dailyRewardSystem.canClaim();
    const currentDay = this._dailyRewardSystem.getCurrentDay();
    const calendar = this._dailyRewardSystem.getRewardCalendar();
    const remainingMs = this._dailyRewardSystem.getRemainingTime();
    const streak = this._getProfile()?.dailyLoginStreak || 0;

    // Streak text
    this._streakText.setText(
      streak > 0
        ? `🔥 Chuỗi ${currentDay}/7  —  Đang ở ngày ${currentDay}`
        : '🌸 Bắt đầu chuỗi nhận thưởng!'
    );

    // Remaining time
    const hours = Math.floor(remainingMs / 3600000);
    const mins = Math.floor((remainingMs % 3600000) / 60000);
    this._timeText.setText(
      canClaim ? '✨ Có thể nhận thưởng ngay!' : `🕐 Làm mới sau: ${hours}h ${String(mins).padStart(2, '0')}p`
    );

    // ── Progress bar ──
    const { px, pw } = this._config;
    this._createProgressBar(px, this._calStartY - 8, pw - 60, 6, currentDay);

    // ── Calendar ──
    const startX = px - pw / 2 + 16;
    const cellW = (pw - 32) / 7;
    const calY = this._calStartY + 4;

    calendar.forEach((reward) => {
      const cx = startX + cellW * (reward.day - 1) + cellW / 2;
      this._createDayCell(reward, cx, calY, cellW - 3, canClaim);
    });

    // ── Claim button / claimed state ──
    if (canClaim) {
      this._createClaimButton(px, this._btnAreaY, 200, 46);
    } else {
      this._createClaimedState(px, this._btnAreaY);
    }
  }

  /** Progress bar 7 ngày */
  _createProgressBar(cx, y, w, h, currentDay) {
    const scene = this.scene;
    const el = [];

    const bg = scene.add.graphics();
    bg.fillStyle(0x1a1a3a, 0.8);
    bg.fillRoundedRect(cx - w / 2, y, w, h, 3);
    this._listContainer.add(bg);
    el.push(bg);

    const ratio = Math.min(currentDay / 7, 1);
    if (ratio > 0) {
      const fill = scene.add.graphics();
      fill.fillStyle(0xffd700, 0.85);
      fill.fillRoundedRect(cx - w / 2, y, Math.max(h, w * ratio), h, 3);
      this._listContainer.add(fill);
      el.push(fill);
    }

    // Label %
    const pct = scene.add.text(cx, y - 4, `${currentDay}/7`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: C.gold,
    }).setOrigin(0.5, 1);
    this._listContainer.add(pct);
    el.push(pct);

    this._items.push(el);
  }

  /**
   * Tạo một ô ngày trong lịch.
   */
  _createDayCell(reward, cx, cy, cellW, canClaim) {
    const scene = this.scene;
    const el = [];
    const cellH = this._calH;
    const isClaimed = reward.claimed;
    const isCurrent = reward.isCurrentDay;

    // Xác định màu nền
    let bgColor = 0x1e1e45;
    let borderColor = null;
    if (isClaimed) {
      bgColor = 0x143014;
    } else if (isCurrent && canClaim) {
      bgColor = 0x2a2030;
      borderColor = canClaim ? 0xffd700 : 0x88ccff;
    }

    // Cell background
    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, 0.92);
    bg.fillRoundedRect(cx - cellW / 2, cy, cellW, cellH, 8);

    if (borderColor) {
      bg.lineStyle(2, borderColor, 0.85);
      bg.strokeRoundedRect(cx - cellW / 2, cy, cellW, cellH, 8);
    } else if (!isClaimed) {
      bg.lineStyle(1, 0x2a2a5a, 0.6);
      bg.strokeRoundedRect(cx - cellW / 2, cy, cellW, cellH, 8);
    }
    this._listContainer.add(bg);
    el.push(bg);

    // Day number
    const dayColor = isCurrent ? C.gold : (isClaimed ? C.green : C.textDim);
    const dayNum = scene.add.text(cx, cy + 10, `${reward.day}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: dayColor,
    }).setOrigin(0.5);
    this._listContainer.add(dayNum);
    el.push(dayNum);

    // Reward amount
    const amtColor = isClaimed ? C.green : (isCurrent ? C.gold : C.white);
    const amt = scene.add.text(cx, cy + 34, `${reward.amount}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: amtColor,
    }).setOrigin(0.5);
    this._listContainer.add(amt);
    el.push(amt);

    // Coin icon nhỏ
    const coinIcon = scene.add.text(cx, cy + 52, '💰', {
      fontSize: '14px',
    }).setOrigin(0.5);
    this._listContainer.add(coinIcon);
    el.push(coinIcon);

    // Status indicator
    let statusTxt = '';
    let statusCol = C.textMuted;
    if (isClaimed) {
      statusTxt = '✓';
      statusCol = C.green;
    } else if (isCurrent && canClaim) {
      statusTxt = '★';
      statusCol = C.gold;
    } else if (isCurrent) {
      statusTxt = '◎';
      statusCol = C.cyan;
    } else {
      statusTxt = '·';
      statusCol = C.textMuted;
    }
    const status = scene.add.text(cx, cy + 72, statusTxt, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: statusCol,
    }).setOrigin(0.5);
    this._listContainer.add(status);
    el.push(status);

    // Glow pulse for current day (chỉ alpha, không scale)
    if (isCurrent && canClaim) {
      const t = scene.tweens.add({
        targets: [bg, dayNum, amt, coinIcon, status],
        alpha: { from: 1, to: 0.65 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this._tweens.push(t);
    }

    this._items.push(el);
  }

  /**
   * Tạo nút Claim chính — dùng container để scale đẹp, không scale Graphics.
   */
  _createClaimButton(cx, y, w, h) {
    const scene = this.scene;
    const el = [];

    // Container bọc toàn bộ nút để scale an toàn
    const btnContainer = scene.add.container(cx, y);
    this._listContainer.add(btnContainer);
    el.push(btnContainer);

    // Background
    const bg = scene.add.graphics();
    // Gradient effect: 2 lớp chồng (bottom tối, top sáng)
    bg.fillStyle(0xc87f00, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.fillStyle(0xf39c12, 1);
    bg.fillRoundedRect(-w / 2, -h / 2 + 2, w, h - 2, { tl: 14, tr: 14, bl: 8, br: 8 });
    btnContainer.add(bg);

    // Border glow
    const border = scene.add.graphics();
    border.lineStyle(2.5, 0xffd700, 0.7);
    border.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    btnContainer.add(border);

    // Shine highlight top
    const shine = scene.add.graphics();
    shine.fillStyle(0xffffff, 0.12);
    shine.fillRoundedRect(-w / 2 + 6, -h / 2 + 4, w - 12, h / 2 - 4, { tl: 10, tr: 10, bl: 0, br: 0 });
    btnContainer.add(shine);

    // Label
    const label = scene.add.text(0, 0, '🎁  NHẬN THƯỞNG', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    btnContainer.add(label);

    // Animation: glow pulse bằng alpha và scale container (an toàn)
    const t1 = scene.tweens.add({
      targets: btnContainer,
      scaleX: { from: 1, to: 1.03 },
      scaleY: { from: 1, to: 1.03 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this._tweens.push(t1);

    const t2 = scene.tweens.add({
      targets: border,
      alpha: { from: 1, to: 0.5 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this._tweens.push(t2);

    // Zone tương tác — phải đặt ở listContainer, không phải btnContainer
    const zone = scene.add.zone(cx, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xc87f00, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bg.fillStyle(0xf1c40f, 1);
      bg.fillRoundedRect(-w / 2, -h / 2 + 2, w, h - 2, { tl: 14, tr: 14, bl: 8, br: 8 });
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xc87f00, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bg.fillStyle(0xf39c12, 1);
      bg.fillRoundedRect(-w / 2, -h / 2 + 2, w, h - 2, { tl: 14, tr: 14, bl: 8, br: 8 });
    });
    zone.on('pointerdown', () => {
      // Click feedback nhanh
      btnContainer.setScale(0.95);
      scene.time.delayedCall(100, () => {
        if (btnContainer.scene) btnContainer.setScale(1);
      });
      this._handleClaim();
    });
    this._listContainer.add(zone);
    el.push(zone);

    this._items.push(el);
  }

  /**
   * Trạng thái đã claim hôm nay.
   */
  _createClaimedState(cx, y) {
    const scene = this.scene;
    const el = [];

    // Background xanh mờ
    const bg = scene.add.graphics();
    bg.fillStyle(0x144020, 0.5);
    bg.fillRoundedRect(cx - 100, y - 22, 200, 44, 12);
    bg.lineStyle(1.5, 0x66ff88, 0.4);
    bg.strokeRoundedRect(cx - 100, y - 22, 200, 44, 12);
    this._listContainer.add(bg);
    el.push(bg);

    const txt = scene.add.text(cx, y, '✅  ĐÃ NHẬN HÔM NAY', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: C.green,
    }).setOrigin(0.5);
    this._listContainer.add(txt);
    el.push(txt);

    this._items.push(el);
  }

  /**
   * Xử lý claim — gọi DailyRewardSystem.claimReward().
   */
  _handleClaim() {
    if (!this._dailyRewardSystem) return;
    const result = this._dailyRewardSystem.claimReward();

    // Toast notification
    const msg = result.success
      ? `🎉  +${result.reward?.amount ?? 0} Xu  ·  ${result.message}`
      : `❌  ${result.message}`;

    const toast = this.scene.add.text(
      this.scene.scale.width / 2,
      this.scene.scale.height * 0.82,
      msg,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: result.success ? '#66ff88' : '#ff6666',
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#00000088',
          blur: 8,
          fill: true,
        },
      }
    ).setOrigin(0.5).setDepth(400);

    this.scene.tweens.add({
      targets: toast,
      alpha: { from: 1, to: 0 },
      y: toast.y - 50,
      duration: 2000,
      ease: 'Cubic.easeOut',
      onComplete: () => toast.destroy(),
    });

    if (result.success) {
      this._refresh();
    }
  }

  /** @returns {import('../profile/PlayerProfile.js').PlayerProfile|null} */
  _getProfile() {
    return this.scene.game.registry.get('playerProfile');
  }

  /** Destroy một item (khi refresh) */
  _destroyItem(elements) {
    elements.forEach(el => {
      if (el && typeof el.destroy === 'function') {
        el.destroy();
      }
    });
  }

  /** Dọn dẹp khi scene shutdown */
  destroy() {
    this._killAllTweens();
    this._items.forEach(item => this._destroyItem(item));
    this._items = [];
    this._container.destroy(true);
  }
}
