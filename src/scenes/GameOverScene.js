/**
 * GameOverScene.js — Scene kết thúc game
 * Hiển thị Distance Score, Coin Collected, Best Score và nút chơi lại.
 * Nhận dữ liệu từ PlayScene qua init(data).
 */

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  /**
   * Nhận dữ liệu từ PlayScene
   * @param {{ score: number, coins: number, bestScore: number, level: number }} data
   */
  init(data) {
    this._score = data?.score ?? 0;
    this._coins = data?.coins ?? 0;
    this._level = data?.level ?? 1;

    // Lấy bestScore từ PlayerProfile — nguồn dữ liệu duy nhất
    const profile = this.game.registry.get('playerProfile');
    this._bestScore = profile ? profile.bestScore : (data?.bestScore ?? 0);
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    // Đảm bảo bestScore trong profile đã được cập nhật (ScoreSystem.saveBestScore đã xử lý)
    // và lưu dữ liệu qua SaveManager
    const profile = this.game.registry.get('playerProfile');
    if (profile) {
      // Đồng bộ bestScore hiển thị với profile (phòng trường hợp saveBestScore chưa kịp chạy)
      if (this._score > profile.bestScore) {
        profile.bestScore = this._score;
        this._bestScore = this._score;
      } else {
        this._bestScore = profile.bestScore;
      }
      // Lưu ngay qua SaveManager
      const sm = this.game.registry.get('saveManager');
      if (sm) sm.save();
    }

    // Tắt UIScene nếu còn sót từ gameplay trước
    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }

    // ── Nền game over ──
    this.add.image(width / 2, height / 2, 'gameover-bg')
      .setDisplaySize(width, height)
      .setDepth(-2);

    // Overlay tối
    this.add.rectangle(centerX, height / 2, width, height, 0x000000, 0.6);

    // ── KẾT THÚC title ──
    this.add.text(centerX, height * 0.20, 'KẾT THÚC', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#e74c3c',
      stroke: '#ffffff',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // ── Khoảng cách (Distance Score) ──
    this.add.text(centerX, height * 0.36, `KHOẢNG CÁCH: ${this._score}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ecf0f1',
    }).setOrigin(0.5);

    // ── Xu thu thập (Coin Collected) ──
    this.add.text(centerX, height * 0.44, `XU THU THẬP: ${this._coins}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffd700',
    }).setOrigin(0.5);

    // ── Điểm cao nhất (Best Score) ──
    this.add.text(centerX, height * 0.52, `CAO NHẤT: ${this._bestScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      color: '#f1c40f',
    }).setOrigin(0.5);

    // ── Nút Chơi lại ──
    this._createRetryButton(centerX, height * 0.64);

    // ── Nút về Menu ──
    this._createMenuButton(centerX, height * 0.74);
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
      this.scene.start('LoadingScene', { level: this._level });
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
