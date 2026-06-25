/**
 * PlayScene.js — Scene gameplay chính
 * Hiện tại là placeholder, chưa triển khai gameplay
 */

export class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    // Placeholder text
    this.add.text(centerX, height * 0.4, '🎿 GAMEPLAY AREA', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#2c3e6b',
    }).setOrigin(0.5);

    this.add.text(centerX, height * 0.48, 'Sẵn sàng trượt tuyết!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#7f8c8d',
    }).setOrigin(0.5);

    // Nút quay lại Menu (để test flow)
    this._createBackButton(centerX, height * 0.65);
  }

  _createBackButton(x, y) {
    const btnWidth = 200;
    const btnHeight = 50;

    const bg = this.add.graphics();
    bg.fillStyle(0xe74c3c, 1);
    bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);

    const label = this.add.text(x, y, '← MENU', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hitZone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

    hitZone.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xc0392b, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
    });

    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xe74c3c, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 12);
    });
  }
}
