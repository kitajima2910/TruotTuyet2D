/**
 * UIScene.js — Scene giao diện người dùng (HUD)
 * Layer overlay trên PlayScene, quản lý điểm, máu, v.v.
 */

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width } = this.scale;

    // Placeholder HUD elements
    this.add.text(20, 20, 'SCORE: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#2c3e6b',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0, 0);

    this.add.text(width - 20, 20, '❤️ × 3', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#e74c3c',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(1, 0);
  }
}
