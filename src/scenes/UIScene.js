/**
 * UIScene.js — Scene giao diện người dùng (HUD)
 * Layer overlay trên PlayScene, quản lý điểm, máu, v.v.
 */

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

  create() {
    const { width } = this.scale;

    // ── Level indicator (góc trên trái) ──
    this.add.text(20, 20, `MÀN ${this._level}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#2c3e6b',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0, 0);

    // ── Điểm ──
    this.add.text(20, 52, 'ĐIỂM: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#2c3e6b',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0, 0);

    // ── Lives placeholder ──
    this.add.text(width - 20, 20, '❤️ × 3', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#e74c3c',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(1, 0);
  }
}
