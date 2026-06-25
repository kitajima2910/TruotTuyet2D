/**
 * UIScene.js — Scene giao diện người dùng (HUD)
 * Layer overlay trên PlayScene, hiển thị điểm, mạng sống.
 *
 * Lắng nghe event từ PlayScene qua this.game.events:
 *   - 'scoreUpdate' (score)   → cập nhật điểm
 *   - 'livesUpdate' (lives)   → cập nhật tim
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

    // ── Màn hiện tại (góc trên trái) ──
    this.add.text(20, 20, `MÀN ${this._level}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#2c3e6b',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0, 0);

    // ── Điểm ──
    this._scoreText = this.add.text(20, 52, 'ĐIỂM: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#2c3e6b',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0, 0);

    // ── Mạng sống (tim) ──
    this._livesText = this.add.text(width - 20, 20, '❤️ × 3', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#e74c3c',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(1, 0);

    // ── Lắng nghe event từ PlayScene ──
    this.game.events.on('scoreUpdate', this._onScoreUpdate, this);
    this.game.events.on('livesUpdate', this._onLivesUpdate, this);
  }

  /** Cập nhật điểm */
  _onScoreUpdate(score) {
    if (this._scoreText) {
      this._scoreText.setText(`ĐIỂM: ${score}`);
    }
  }

  /** Cập nhật mạng sống */
  _onLivesUpdate(lives) {
    if (this._livesText) {
      this._livesText.setText(`❤️ × ${lives}`);
    }
  }

  /** Dọn event khi scene dừng */
  shutdown() {
    this.game.events.off('scoreUpdate', this._onScoreUpdate, this);
    this.game.events.off('livesUpdate', this._onLivesUpdate, this);
  }
}
