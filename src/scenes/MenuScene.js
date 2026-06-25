/**
 * MenuScene.js — Scene menu chính
 * Hiển thị tiêu đề game và nút Start
 */

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    // ── Tiêu đề ──
    this.add.text(centerX, height * 0.3, 'TRƯỢT TUYẾT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#2c3e6b',
      stroke: '#ffffff',
      strokeThickness: 6,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#00000033',
        blur: 8,
        fill: true,
      },
    }).setOrigin(0.5);

    // ── Subtitle ──
    this.add.text(centerX, height * 0.38, '❄️ 2D Snowboarding ❄️', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#5a7db5',
    }).setOrigin(0.5);

    // ── Nút Start ──
    this._createStartButton(centerX, height * 0.55);
  }

  /**
   * Tạo nút Start với hover effect
   */
  _createStartButton(x, y) {
    const btnWidth = 280;
    const btnHeight = 70;

    // Container chứa button background + text
    const container = this.add.container(x, y);

    // Background nút
    const bg = this.add.graphics();
    bg.fillStyle(0x3498db, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 16);
    container.add(bg);

    // Border nút
    const border = this.add.graphics();
    border.lineStyle(3, 0x2980b9, 1);
    border.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 16);
    container.add(border);

    // Text nút
    const label = this.add.text(0, 0, '▶  BẮT ĐẦU', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(label);

    // Vùng tương tác
    const hitZone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });
    container.setDepth(1);

    // Hover effects
    hitZone.on('pointerover', () => {
      container.setScale(1.06);
      bg.clear();
      bg.fillStyle(0x2ecc71, 1);
      bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 16);
      border.clear();
      border.lineStyle(3, 0x27ae60, 1);
      border.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 16);
    });

    hitZone.on('pointerout', () => {
      container.setScale(1);
      bg.clear();
      bg.fillStyle(0x3498db, 1);
      bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 16);
      border.clear();
      border.lineStyle(3, 0x2980b9, 1);
      border.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 16);
    });

    // Click → chuyển PlayScene
    hitZone.on('pointerdown', () => {
      this.scene.start('PlayScene');
    });
  }
}
