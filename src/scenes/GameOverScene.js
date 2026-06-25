/**
 * GameOverScene.js — Scene kết thúc game
 * Hiển thị điểm cuối cùng, best score và nút chơi lại.
 * Nhận score + bestScore từ PlayScene qua init(data).
 */

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  /**
   * Nhận dữ liệu từ PlayScene
   * @param {{ score: number, bestScore: number, level: number }} data
   */
  init(data) {
    this._score = data?.score ?? 0;
    this._bestScore = data?.bestScore ?? 0;
    this._level = data?.level ?? 1;
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    // Overlay tối
    this.add.rectangle(centerX, height / 2, width, height, 0x000000, 0.6);

    // ── KẾT THÚC title ──
    this.add.text(centerX, height * 0.28, 'KẾT THÚC', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#e74c3c',
      stroke: '#ffffff',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // ── Điểm hiện tại ──
    this.add.text(centerX, height * 0.42, `ĐIỂM: ${this._score}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#ecf0f1',
    }).setOrigin(0.5);

    // ── Điểm cao nhất ──
    this.add.text(centerX, height * 0.50, `CAO NHẤT: ${this._bestScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      color: '#f1c40f',
    }).setOrigin(0.5);

    // ── Nút Chơi lại ──
    this._createRetryButton(centerX, height * 0.62);

    // ── Nút về Menu ──
    this._createMenuButton(centerX, height * 0.72);
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
      this.scene.start('PlayScene', { level: this._level });
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
