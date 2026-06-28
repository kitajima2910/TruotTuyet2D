/**
 * MenuScene.js — Scene menu chính
 * Hiển thị tiêu đề game và nút Start
 */

import { DailyRewardPanel } from '../ui/DailyRewardPanel.js';
import { GAME_VERSION, COMMIT_HASH } from '../version.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    // Tắt UIScene nếu còn sót (vd: quay về menu từ game over)
    if (this.scene.isActive("UIScene")) {
      this.scene.stop("UIScene");
    }

    // ── Nền menu ──
    this.add
      .image(width / 2, height / 2, "menu-bg")
      .setDisplaySize(width, height)
      .setDepth(-1);

    // ── Tiêu đề ──
    this.add
      .text(centerX, height * 0.12, "TRƯỢT TUYẾT", {
        fontFamily: "Arial, sans-serif",
        fontSize: "56px",
        fontStyle: "bold",
        color: "#2c3e6b",
        stroke: "#ffffff",
        strokeThickness: 6,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#00000033",
          blur: 8,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // ── Subtitle ──
    this.add
      .text(centerX, height * 0.19, "❄️ Trượt tuyết 2D ❄️", {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        color: "#5a7db5",
      })
      .setOrigin(0.5);

    // ── 3 nút chọn màn chơi ──
    const levels = [
      {
        level: 1,
        label: "❄️ MÀN 1 — Tuyết Trắng",
        color: 0x3498db,
        hover: 0x5dade2,
        desc: "Dễ",
      },
      {
        level: 2,
        label: "🌿 MÀN 2 — Cỏ Tuyết",
        color: 0x27ae60,
        hover: 0x2ecc71,
        desc: "Trung bình",
      },
      {
        level: 3,
        label: "🏜️ MÀN 3 — Sa Mạc Tuyết",
        color: 0xe67e22,
        hover: 0xf39c12,
        desc: "Khó",
      },
    ];

    const startY = height * 0.33;
    const gap = height * 0.18;

    levels.forEach((lvl, i) => {
      this._createLevelButton(centerX, startY + gap * i, lvl);
    });

    // ── Phiên bản game (git commit count + hash) ──
    this.add
      .text(centerX, height * 0.985, `${GAME_VERSION} (${COMMIT_HASH})`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#8899bb",
      })
      .setOrigin(0.5)
      .setDepth(1);

    // ── Tên tác giả (nhấp nháy 7 màu) ──
    const authorText = this.add
      .text(centerX, height * 0.95, "Tác giả: Phạm Xuân Hoài", {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        color: "#ff0000",
      })
      .setOrigin(0.5)
      .setDepth(1);

    const colors = [
      "#ff0000",
      "#ff7700",
      "#ffff00",
      "#00ff00",
      "#0000ff",
      "#4b0082",
      "#8b00ff",
    ];
    let ci = 0;
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        ci = (ci + 1) % colors.length;
        authorText.setColor(colors[ci]);
      },
    });

    // ── DailyRewardPanel ──
    this._dailyRewardPanel = new DailyRewardPanel(this);
    this._dailyRewardPanel.hide();

    // ── Nút Daily Reward ──
    this._createDailyRewardButton(centerX, height * 0.91);

  }

  /**
   * Tạo nút Daily Reward phía dưới menu.
   */
  _createDailyRewardButton(x, y) {
    const btn = this.add.text(x, y, '🎁 Nhận thưởng hàng ngày', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#00000044',
        blur: 4,
        fill: true,
      },
    }).setOrigin(0.5).setDepth(1).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      btn.setColor('#ffffff');
      btn.setScale(1.05);
    });
    btn.on('pointerout', () => {
      btn.setColor('#ffd700');
      btn.setScale(1);
    });
    btn.on('pointerdown', () => {
      if (this._dailyRewardPanel) {
        this._dailyRewardPanel.show();
      }
    });
  }

  /**
   * Tạo nút chọn màn chơi
   */
  _createLevelButton(x, y, { level, label, color, hover, desc }) {
    const btnWidth = 340;
    const btnHeight = 72;

    const container = this.add.container(x, y);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 14);
    container.add(bg);

    // Border
    const border = this.add.graphics();
    border.lineStyle(2, 0xffffff, 0.5);
    border.strokeRoundedRect(
      -btnWidth / 2,
      -btnHeight / 2,
      btnWidth,
      btnHeight,
      14,
    );
    container.add(border);

    // Label
    const labelText = this.add
      .text(0, -8, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    container.add(labelText);

    // Mô tả độ khó
    const descText = this.add
      .text(0, 18, `🔥 ${desc}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#ffffffcc",
      })
      .setOrigin(0.5);
    container.add(descText);

    container.setDepth(1);

    // Vùng tương tác
    const hitZone = this.add
      .zone(x, y, btnWidth, btnHeight)
      .setInteractive({ useHandCursor: true });

    let currentColor = color;

    hitZone.on("pointerover", () => {
      container.setScale(1.06);
      bg.clear();
      bg.fillStyle(hover, 1);
      bg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        14,
      );
      border.clear();
      border.lineStyle(2, 0xffffff, 0.8);
      border.strokeRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        14,
      );
      currentColor = hover;
    });

    hitZone.on("pointerout", () => {
      container.setScale(1);
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        14,
      );
      border.clear();
      border.lineStyle(2, 0xffffff, 0.5);
      border.strokeRoundedRect(
        -btnWidth / 2,
        -btnHeight / 2,
        btnWidth,
        btnHeight,
        14,
      );
      currentColor = color;
    });

    // Click → chuyển LoadingScene để load game assets rồi vào PlayScene
    hitZone.on("pointerdown", () => {
      this.scene.start("LoadingScene", { level });
    });
  }
}
